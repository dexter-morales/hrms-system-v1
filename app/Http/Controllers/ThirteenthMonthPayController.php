<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Site;
use App\Models\ThirteenthMonthPay;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // Correct namespace
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ThirteenthMonthPayController extends Controller
{
    public function index(Request $request)
    {
        $employees = Employee::where('id', '!=', 1)
            ->select('id', 'first_name', 'last_name', 'employee_id', 'site_id', 'basic_salary', 'date_hired')
            ->whereIn('employment_status_id', [1, 5, 7, 6])
            ->get();

        $sites = Site::select('id', 'name', 'allowance')->get();

        $thirteenthMonthPays = ThirteenthMonthPay::with('employee')
            ->get()
            ->map(function ($pay) {
                return [
                    'id' => $pay->id,
                    'employee' => [
                        'id' => $pay->employee->id,
                        'first_name' => $pay->employee->first_name,
                        'last_name' => $pay->employee->last_name,
                        'employee_id' => $pay->employee->employee_id,
                    ],
                    'basic_earnings' => $pay->basic_earnings,
                    'months_covered' => is_string($pay->months_covered) ? json_decode($pay->months_covered, true) : $pay->months_covered,
                    'thirteenth_month_pay' => $pay->thirteenth_month_pay,
                    'calculation_date' => $pay->calculation_date,
                    'status' => $pay->status,
                    'notes' => $pay->notes,
                ];
            });

        Log::channel('thirteenthMP_logs')->info('13th Month Pay index loaded', [
            'employee_count' => $employees->count(),
            'thirteenth_month_pays_count' => $thirteenthMonthPays->count(),
        ]);

        return Inertia::render('ThirteenthMonthPay/ThirteenthMonthPay', [
            'employees' => $employees,
            'sites' => $sites,
            'thirteenth_month_pays' => $thirteenthMonthPays,
            'errors' => $request->session()->get('errors') ? $request->session()->get('errors')->getBag('default')->getMessages() : (object) [],
        ]);
    }

    public function generate(Request $request)
    {
        try {

            $companySettings = CompanySetting::first();

            if (! $companySettings || ! $companySettings->thirteenth_month_pay_start || ! $companySettings->thirteenth_month_pay_end) {
                return back()->with('error', '13th month pay date range is not configured in company settings');
            }

            $request->validate([
                'employee_ids' => 'array|nullable',
                'employee_ids.*' => 'exists:employees,id',
                'year' => 'required|integer|min:2000|max:'.date('Y'),
            ]);

            $year = $request->year;
            $today = Carbon::today();
            $employees = $request->has('employee_ids') && ! empty($request->employee_ids)
                ? Employee::whereIn('id', $request->employee_ids)
                    ->whereIn('employment_status_id', [1, 5, 7, 6])
                    ->get()
                : Employee::whereIn('employment_status_id', [1, 5, 7, 6])
                    ->get();

            $thirteenthMonthPays = [];

            $startOfYear = $companySettings->thirteenth_month_pay_start;
            $endOfYear = $companySettings->thirteenth_month_pay_end;

            // $startOfYear = Carbon::create($year, 1, 1);
            // $endOfYear = Carbon::create($year, 12, 31);

            foreach ($employees as $employee) {
                try {
                    $hiredDate = Carbon::parse($employee->date_hired);
                    $monthsWorked = $hiredDate->diffInMonths($today);

                    if ($monthsWorked < 1) {
                        Log::channel('thirteenthMP_logs')->info('Employee skipped for 13th month pay due to insufficient tenure', [
                            'employee_id' => $employee->id,
                            'date_hired' => $employee->date_hired,
                            'months_worked' => $monthsWorked,
                        ]);

                        continue;
                    }

                    $paySchedule = $employee->pay_schedule;
                    $monthlySalary = $employee->basic_salary ?? 0;
                    $salaryDayDivider = $paySchedule === 'semi-monthly' ? 26 : 6;
                    $dailyRate = $monthlySalary / $salaryDayDivider;

                    $payrolls = Payroll::where('employee_id', $employee->id)
                        ->whereBetween('pay_period_start', [$startOfYear, $endOfYear])
                        ->whereBetween('pay_period_end', [$startOfYear, $endOfYear])
                        ->get();

                    $monthlyEarnings = [];
                    $basicEarningsSum = 0;

                    foreach ($payrolls as $payroll) {
                        $basePay = $payroll->base_pay2;
                        $leaveWithoutPayDeduction = $payroll->leave_days_without_pay * $dailyRate;
                        $basicEarnings = $basePay + ($payroll->allowance ?? 0);

                        $deductions = $payroll->late_deduction + $payroll->absences_deduction + $leaveWithoutPayDeduction;
                        $netEarnings = $basicEarnings - $deductions;

                        $payPeriodStart = Carbon::parse($payroll->pay_period_start);
                        $monthKey = $payPeriodStart->format('M Y');

                        if (! isset($monthlyEarnings[$monthKey])) {
                            $monthlyEarnings[$monthKey] = 0;
                        }
                        $monthlyEarnings[$monthKey] += $netEarnings;
                        $basicEarningsSum += $netEarnings;
                    }

                    $monthsCovered = array_map(function ($month, $earnings) {
                        return [
                            'month' => $month,
                            'earnings' => round($earnings, 2),
                        ];
                    }, array_keys($monthlyEarnings), array_values($monthlyEarnings));

                    $thirteenthMonthPay = round($basicEarningsSum / 12, 2);

                    if ($basicEarningsSum > 0) {
                        $existingRecord = ThirteenthMonthPay::where('employee_id', $employee->id)
                            ->where('calculation_date', '>=', $startOfYear)
                            ->where('calculation_date', '<=', $endOfYear)
                            ->where('status', 'Pending')
                            ->first();

                        $recordData = [
                            'basic_earnings' => $basicEarningsSum,
                            'months_covered' => json_encode($monthsCovered),
                            'thirteenth_month_pay' => $thirteenthMonthPay,
                            'calculation_date' => $today,
                            'notes' => "13th month pay for year {$year}",
                        ];

                        if ($existingRecord) {
                            $existingRecord->update($recordData);
                            $record = $existingRecord;
                            Log::channel('thirteenthMP_logs')->info('13th Month Pay updated', [
                                'employee_id' => $employee->id,
                                'basic_earnings' => $basicEarningsSum,
                                'months_covered' => $monthsCovered,
                                'thirteenth_month_pay' => $thirteenthMonthPay,
                            ]);
                        } else {
                            $record = ThirteenthMonthPay::create(array_merge($recordData, [
                                'employee_id' => $employee->id,
                                'status' => 'Pending',
                            ]));
                            Log::channel('thirteenthMP_logs')->info('13th Month Pay generated', [
                                'employee_id' => $employee->id,
                                'basic_earnings' => $basicEarningsSum,
                                'months_covered' => $monthsCovered,
                                'thirteenth_month_pay' => $thirteenthMonthPay,
                            ]);
                        }

                        $thirteenthMonthPays[] = [
                            'id' => $record->id,
                            'employee' => [
                                'id' => $employee->id,
                                'first_name' => $employee->first_name,
                                'last_name' => $employee->last_name,
                                'employee_id' => $employee->employee_id,
                            ],
                            'basic_earnings' => $basicEarningsSum,
                            'months_covered' => $monthsCovered,
                            'thirteenth_month_pay' => $thirteenthMonthPay,
                            'calculation_date' => $record->calculation_date,
                            'status' => $record->status,
                            'notes' => $record->notes,
                        ];
                    } else {
                        Log::channel('thirteenthMP_logs')->warning('No valid payroll records found for employee', [
                            'employee_id' => $employee->id,
                            'year' => $year,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::channel('thirteenthMP_logs')->error('13th Month Pay generation failed for employee', [
                        'employee_id' => $employee->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }

            return redirect()->back()->with([
                'success' => '13th Month Pay generated successfully.',
                'thirteenth_month_pays' => $thirteenthMonthPays,
            ]);
        } catch (ValidationException $e) {
            Log::channel('thirteenthMP_logs')->error('Validation failed during 13th Month Pay generation', [
                'errors' => $e->errors(),
            ]);

            return response()->json(['error' => 'Validation failed: '.implode(', ', $e->errors())], 422);
        } catch (\Exception $e) {
            Log::channel('thirteenthMP_logs')->error('13th Month Pay generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Failed to generate 13th Month Pay: '.$e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'basic_earnings' => 'nullable|numeric|min:0',
                'thirteenth_month_pay' => 'nullable|numeric|min:0',
                'status' => 'nullable|in:Pending,Approved,Paid',
                'notes' => 'nullable|string|max:1000',
            ]);

            $record = ThirteenthMonthPay::findOrFail($id);
            $updateData = [];

            if ($request->has('basic_earnings')) {
                $updateData['basic_earnings'] = $request->basic_earnings;
                $updateData['thirteenth_month_pay'] = round($request->basic_earnings / 12, 2);

                $currentMonthsCovered = is_string($record->months_covered)
                    ? json_decode($record->months_covered, true)
                    : $record->months_covered;
                if (! empty($currentMonthsCovered)) {
                    $currentTotal = array_sum(array_column($currentMonthsCovered, 'earnings'));
                    if ($currentTotal > 0) {
                        $ratio = $request->basic_earnings / $currentTotal;
                        $updatedMonthsCovered = array_map(function ($entry) use ($ratio) {
                            return [
                                'month' => $entry['month'],
                                'earnings' => round($entry['earnings'] * $ratio, 2),
                            ];
                        }, $currentMonthsCovered);
                        $updateData['months_covered'] = json_encode($updatedMonthsCovered);
                    }
                }
            }

            if ($request->has('thirteenth_month_pay')) {
                $updateData['thirteenth_month_pay'] = $request->thirteenth_month_pay;
            }
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }
            if ($request->has('notes')) {
                $updateData['notes'] = $request->notes;
            }

            $record->update($updateData);

            Log::channel('thirteenthMP_logs')->info('13th Month Pay updated', [
                'record_id' => $record->id,
                'employee_id' => $record->employee_id,
                'updates' => $updateData,
            ]);

            return redirect()->back()->with('success', '13th Month Pay updated successfully.');
        } catch (ValidationException $e) {
            Log::channel('thirteenthMP_logs')->error('Validation failed during 13th Month Pay update', [
                'record_id' => $id,
                'errors' => $e->errors(),
            ]);

            return response()->json(['error' => 'Validation failed: '.implode(', ', $e->errors())], 422);
        } catch (\Exception $e) {
            Log::channel('thirteenthMP_logs')->error('13th Month Pay update failed', [
                'record_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Failed to update 13th Month Pay: '.$e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $record = ThirteenthMonthPay::findOrFail($id);

            if ($record->status !== 'Pending') {
                Log::channel('thirteenthMP_logs')->warning('Cannot delete non Pending 13th Month Pay record', [
                    'record_id' => $id,
                    'employee_id' => $record->employee_id,
                ]);

                return response()->json(['error' => 'Cannot delete non Pending 13th Month Pay record.'], 403);
            }

            $record->delete();

            Log::channel('thirteenthMP_logs')->info('13th Month Pay deleted', [
                'record_id' => $id,
                'employee_id' => $record->employee_id,
            ]);

            return redirect()->back()->with('success', '13th Month Pay deleted successfully.');
        } catch (\Exception $e) {
            Log::channel('thirteenthMP_logs')->error('13th Month Pay deletion failed', [
                'record_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Failed to delete 13th Month Pay: '.$e->getMessage()], 500);
        }
    }

    public function exportToPDF(Request $request)
    {
        try {
            $request->validate([
                'employee_ids' => 'array|nullable',
                'employee_ids.*' => 'exists:employees,id',
                'year' => 'required|integer|min:2000|max:'.date('Y'),
            ]);

            $year = $request->year;
            $startOfYear = Carbon::create($year, 1, 1);
            $endOfYear = Carbon::create($year, 12, 31);

            $employees = $request->has('employee_ids') && ! empty($request->employee_ids)
                ? Employee::whereIn('id', $request->employee_ids)
                    ->whereIn('employment_status_id', [1, 5, 7, 6])
                    ->get()
                : Employee::whereIn('employment_status_id', [1, 5, 7, 6])
                    ->get();

            if ($employees->isEmpty()) {
                Log::channel('thirteenthMP_logs')->warning('No employees found for PDF export', [
                    'year' => $year,
                ]);

                return response()->json(['error' => 'No employees found for the selected criteria.'], 400);
            }

            $reportData = [];
            foreach ($employees as $employee) {
                $thirteenthMonthPay = ThirteenthMonthPay::where('employee_id', $employee->id)
                    ->where('calculation_date', '>=', $startOfYear)
                    ->where('calculation_date', '<=', $endOfYear)
                    ->first();

                if ($thirteenthMonthPay && ! empty($thirteenthMonthPay->months_covered)) {
                    $monthsCovered = is_string($thirteenthMonthPay->months_covered)
                        ? json_decode($thirteenthMonthPay->months_covered, true)
                        : $thirteenthMonthPay->months_covered;

                    if (! is_array($monthsCovered)) {
                        Log::channel('thirteenthMP_logs')->error('Invalid months_covered format', [
                            'employee_id' => $employee->id,
                            'months_covered' => $thirteenthMonthPay->months_covered,
                        ]);

                        continue;
                    }

                    $reportData[] = [
                        'employee' => [
                            'name' => $employee->first_name.' '.$employee->last_name,
                            'employee_id' => $employee->employee_id,
                        ],
                        'monthly_earnings' => array_map(function ($entry) {
                            return [
                                'month' => str_replace(' ', '-', $entry['month']),
                                'earnings' => number_format($entry['earnings'], 2, '.', ''),
                            ];
                        }, $monthsCovered),
                        'total_basic_earnings' => number_format($thirteenthMonthPay->basic_earnings, 2, '.', ''),
                        'thirteenth_month_pay' => number_format($thirteenthMonthPay->thirteenth_month_pay, 2, '.', ''),
                    ];
                } else {
                    $paySchedule = $employee->pay_schedule;
                    $monthlySalary = $employee->basic_salary ?? 0;
                    $salaryDayDivider = $paySchedule === 'semi-monthly' ? 26 : 6;
                    $dailyRate = $monthlySalary / $salaryDayDivider;

                    $payrolls = Payroll::where('employee_id', $employee->id)
                        ->whereBetween('pay_period_start', [$startOfYear, $endOfYear])
                        ->whereBetween('pay_period_end', [$startOfYear, $endOfYear])
                        ->get();

                    $monthlyEarnings = [];
                    $basicEarningsSum = 0;

                    foreach ($payrolls as $payroll) {
                        $basePay = $payroll->base_pay2;
                        $leaveWithoutPayDeduction = $payroll->leave_days_without_pay * $dailyRate;
                        $basicEarnings = $basePay + ($payroll->allowance ?? 0);
                        $deductions = $payroll->late_deduction + $payroll->absences_deduction + $leaveWithoutPayDeduction;
                        $netEarnings = $basicEarnings - $deductions;

                        $payPeriodStart = Carbon::parse($payroll->pay_period_start);
                        $monthKey = $payPeriodStart->format('M Y');

                        if (! isset($monthlyEarnings[$monthKey])) {
                            $monthlyEarnings[$monthKey] = 0;
                        }
                        $monthlyEarnings[$monthKey] += $netEarnings;
                        $basicEarningsSum += $netEarnings;
                    }

                    $thirteenthMonthPayValue = round($basicEarningsSum / 12, 2);

                    if ($basicEarningsSum > 0) {
                        $reportData[] = [
                            'employee' => [
                                'name' => $employee->first_name.' '.$employee->last_name,
                                'employee_id' => $employee->employee_id,
                            ],
                            'monthly_earnings' => array_map(function ($month, $earnings) {
                                return [
                                    'month' => str_replace(' ', '-', $month),
                                    'earnings' => number_format($earnings, 2, '.', ''),
                                ];
                            }, array_keys($monthlyEarnings), array_values($monthlyEarnings)),
                            'total_basic_earnings' => number_format($basicEarningsSum, 2, '.', ''),
                            'thirteenth_month_pay' => number_format($thirteenthMonthPayValue, 2, '.', ''),
                        ];
                    }
                }
            }

            if (empty($reportData)) {
                Log::channel('thirteenthMP_logs')->warning('No valid payroll data found for PDF export', [
                    'year' => $year,
                ]);

                return response()->json(['error' => 'No valid payroll data found for the selected year.'], 400);
            }

            Log::channel('thirteenthMP_logs')->debug('PDF report data', [
                'year' => $year,
                'report_data' => $reportData,
            ]);

            // Ensure no output before PDF
            if (ob_get_level() > 0) {
                ob_end_clean();
            }

            try {
                $pdf = Pdf::loadView('thirteenth_month_pay_report', [
                    'year' => $year,
                    'reportData' => $reportData,
                ])
                    ->setPaper('a4', 'portrait')
                    ->setOption('isHtml5ParserEnabled', true)
                    ->setOption('isRemoteEnabled', true);

                $fileName = "13th_Month_Pay_Report_{$year}_".Carbon::now()->format('Ymd_His').'.pdf';

                return response($pdf->output(), 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => "attachment; filename=\"$fileName\"",
                    'Content-Length' => strlen($pdf->output()),
                ]);
            } catch (\Exception $e) {
                Log::channel('thirteenthMP_logs')->error('PDF generation failed', [
                    'year' => $year,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return response()->json(['error' => 'Failed to generate PDF: '.$e->getMessage()], 500);
            }
        } catch (ValidationException $e) {
            Log::channel('thirteenthMP_logs')->error('Validation failed during PDF export', [
                'year' => $year,
                'errors' => $e->errors(),
            ]);

            return response()->json(['error' => 'Validation failed: '.implode(', ', $e->errors())], 422);
        } catch (AuthorizationException $e) {
            Log::channel('thirteenthMP_logs')->error('CSRF token mismatch or unauthorized access', [
                'year' => $year,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'CSRF token mismatch or unauthorized access.'], 419);
        } catch (\Exception $e) {
            Log::channel('thirteenthMP_logs')->error('13th Month Pay PDF export failed', [
                'year' => $year,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Failed to export 13th Month Pay report to PDF: '.$e->getMessage()], 500);
        }
    }
}
