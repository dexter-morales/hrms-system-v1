<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeOvertime;
use App\Models\EmployeeSchedule;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\Payroll;
use App\Models\Payslip;
use App\Models\Site;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
// use Mpdf;
use Illuminate\Support\Facades\Storage; // Use DomPDF

class PayrollControllerOldOld extends Controller
{
    // public function __construct()
    // {
    //     $this->middleware('hr_admin');
    // }

    public function index(Request $request)
    {
        // Start with the Payroll query
        $query = Payroll::with('employee.site', 'employee.position');

        // Apply site filter if provided
        if ($request->site_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('site_id', $request->site_id);
            });
        }

        $payrolls = $query->get();

        // Get unique pay period start and end from the first payroll (or configure a default range)
        $payPeriodStart = $payrolls->isNotEmpty() ? $payrolls->first()->pay_period_start : now()->startOfMonth();
        $payPeriodEnd = $payrolls->isNotEmpty() ? $payrolls->first()->pay_period_end : now()->endOfMonth();

        // Fetch attendances for the pay period
        $attendances = EmployeeAttendance::whereBetween('date', [$payPeriodStart, $payPeriodEnd])->get();

        // Fetch holidays for the pay period
        $holidays = Holiday::whereBetween('date_holiday', [$payPeriodStart, $payPeriodEnd])->get();

        // Fetch schedules for the pay period
        $schedules = EmployeeSchedule::all();

        // Fetch sites for the filter dropdown
        $sites = Site::select('id', 'name')->get();

        return inertia('Payroll/PayrollComponent', [
            'payrolls' => $payrolls,
            'attendances' => $attendances,
            'holidays' => $holidays,
            'schedules' => $schedules,
            'sites' => $sites,
            'payPeriodStart' => $payPeriodStart,
            'payPeriodEnd' => $payPeriodEnd,

            'leaves' => Leave::with('employee')
                ->where('status', 'approved')
                ->where('isWithPay', 1)
                ->whereNotNull('approved_by_hr')
                ->get(),
        ]);
    }

    protected function calculateSssDeduction($monthlySalary)
    {
        $msc = min(max($monthlySalary, 4000), 30000);

        return round($msc * 0.045, 2);
    }

    protected function calculatePhilHealthDeduction($monthlySalary)
    {
        $contribution = $monthlySalary * 0.05;

        return round(min(max($contribution / 2, 500 / 2), 2500 / 2), 2);
    }

    protected function calculatePagIbigDeduction($monthlySalary)
    {
        $contribution = min($monthlySalary, 10000) * 0.02;

        return round(min($contribution, 200), 2);
    }

    protected function calculateWithholdingTax($taxableIncome, $payrollStatus = 'monthly')
    {
        switch (strtolower($payrollStatus)) {
            case 'semi-monthly':
                return $this->calculateSemiMonthlyTax($taxableIncome);
            case 'weekly':
                return $this->calculateWeeklyTax($taxableIncome);
            case 'daily':
                return $this->calculateDailyTax($taxableIncome);
            default: // monthly
                return $this->calculateMonthlyTax($taxableIncome);
        }
    }

    protected function calculateMonthlyTax($taxableIncome)
    {
        if ($taxableIncome <= 20833) {
            return 0;
        } elseif ($taxableIncome <= 33332) {
            return ($taxableIncome - 20833) * 0.20;
        } elseif ($taxableIncome <= 66666) {
            return 2500 + ($taxableIncome - 33332) * 0.25;
        } elseif ($taxableIncome <= 166666) {
            return 10833.33 + ($taxableIncome - 66667) * 0.30;
        } elseif ($taxableIncome <= 666666) {
            return 40833.33 + ($taxableIncome - 166667) * 0.32;
        } else {
            return 200833.33 + ($taxableIncome - 666667) * 0.35;
        }
    }

    protected function calculateSemiMonthlyTax($taxableIncome)
    {
        if ($taxableIncome <= 10417) {
            return 0;
        } elseif ($taxableIncome <= 16666) {
            return ($taxableIncome - 10417) * 0.20;
        } elseif ($taxableIncome <= 33332) {
            return 1250 + ($taxableIncome - 16666) * 0.25;
        } elseif ($taxableIncome <= 83332) {
            return 5416.67 + ($taxableIncome - 33332) * 0.30;
        } elseif ($taxableIncome <= 333332) {
            return 20416.67 + ($taxableIncome - 83332) * 0.32;
        } else {
            return 100416.67 + ($taxableIncome - 333332) * 0.35;
        }
    }

    protected function calculateWeeklyTax($taxableIncome)
    {
        if ($taxableIncome <= 4808) {
            return 0;
        } elseif ($taxableIncome <= 7692) {
            return ($taxableIncome - 4808) * 0.20;
        } elseif ($taxableIncome <= 15385) {
            return 576.92 + ($taxableIncome - 7692) * 0.25;
        } elseif ($taxableIncome <= 38462) {
            return 2500 + ($taxableIncome - 15385) * 0.30;
        } elseif ($taxableIncome <= 153846) {
            return 9423.08 + ($taxableIncome - 38462) * 0.32;
        } else {
            return 46346.15 + ($taxableIncome - 153846) * 0.35;
        }
    }

    protected function calculateDailyTax($taxableIncome)
    {
        if ($taxableIncome <= 961) {
            return 0;
        } elseif ($taxableIncome <= 1538) {
            return ($taxableIncome - 961) * 0.20;
        } elseif ($taxableIncome <= 3077) {
            return 115.38 + ($taxableIncome - 1538) * 0.25;
        } elseif ($taxableIncome <= 7692) {
            return 500 + ($taxableIncome - 3077) * 0.30;
        } elseif ($taxableIncome <= 30769) {
            return 1884.62 + ($taxableIncome - 7692) * 0.32;
        } else {
            return 9269.23 + ($taxableIncome - 30769) * 0.35;
        }
    }

    public function generate(Request $request)
    {
        $request->validate([
            'pay_schedule_type' => 'required|in:weekly,semi-monthly',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        $paySchedule = strtolower($request->pay_schedule_type);
        $daysInPeriod = $startDate->diffInDays($endDate) + 1;
        $daysInMonth = $startDate->daysInMonth;

        $employees = Employee::where('payroll_status', $paySchedule)->get();
        $holidays = Holiday::whereBetween('date_holiday', [$startDate, $endDate])->get();

        $GRACE_PERIOD_MINUTES = 15; // Configurable grace period

        foreach ($employees as $employee) {
            try {
                $monthlySalary = $employee->basic_salary;
                $hourlyRate = $monthlySalary / (26 * 8); // 208 hours/month
                $dailyRate = $monthlySalary / 26;

                // Calculate total_working_days
                $totalWorkingDays = 0;
                $currentDate = $startDate->copy();
                while ($currentDate->lte($endDate)) {
                    $dayKey = strtolower($currentDate->format('D')); // e.g., 'mon'
                    $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                        ->where('effective_from', '<=', $currentDate)
                        ->where('effective_until', '>=', $currentDate)
                        ->orderBy('effective_from', 'desc')
                        ->first();

                    $workingDays = $schedule ? json_decode($schedule->working_days, true) : ['mon', 'tue', 'wed', 'thu', 'fri'];
                    if ($schedule && $schedule->schedule_type === 'fixed') {
                        if (in_array($dayKey, $workingDays)) {
                            $totalWorkingDays++;
                        }
                    } elseif ($schedule && $schedule->schedule_type === 'flexible') {
                        if (isset($workingDays[$dayKey])) {
                            $totalWorkingDays++;
                        }
                    } else {
                        if (in_array($dayKey, $workingDays)) {
                            $totalWorkingDays++;
                        }
                    }
                    $currentDate->addDay();
                }

                // Fetch and compute hours_worked and late_hours
                $attendances = EmployeeAttendance::where('employee_id', $employee->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->whereNotNull('punch_in')
                    ->whereNotNull('punch_out')
                    ->get()
                    ->map(function ($attendance) use ($employee, $GRACE_PERIOD_MINUTES) {
                        $punchIn = Carbon::parse($attendance->punch_in);
                        $punchOut = Carbon::parse($attendance->punch_out);
                        $breakHours = $attendance->break_hours ?? 0;
                        $date = Carbon::parse($attendance->date);
                        $dayKey = strtolower($date->format('D')); // e.g., 'mon'

                        // Fetch schedule for this date
                        $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                            ->where('effective_from', '<=', $attendance->date)
                            ->where('effective_until', '>=', $attendance->date)
                            ->orderBy('effective_from', 'desc')
                            ->first();

                        $workingDays = $schedule ? json_decode($schedule->working_days, true) : ['mon', 'tue', 'wed', 'thu', 'fri'];
                        Log::info('Working days: '.json_encode($workingDays));
                        $startTime = '09:00:00';
                        $endTime = '17:00:00';
                        $expectedHours = 8.00;

                        // Skip non-working days
                        if ($schedule && $schedule->schedule_type === 'fixed') {
                            if (! in_array($dayKey, $workingDays)) {
                                $attendance->hours_worked = 0;
                                $attendance->late_hours = 0;

                                return $attendance;
                            }
                            $startTime = $schedule->start_time;
                            $endTime = $schedule->end_time;
                            $expectedHours = (Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime)) / 60) - $breakHours;
                            Log::info('Expected hours for fixed schedule: '.$expectedHours,
                                ['endTime' => $endTime, 'startTime' => $startTime,
                                ]);
                        } elseif ($schedule && $schedule->schedule_type === 'flexible') {
                            if (! isset($workingDays[$dayKey])) {
                                $attendance->hours_worked = 0;
                                $attendance->late_hours = 0;

                                return $attendance;
                            }
                            $startTime = $workingDays[$dayKey][0].':00';
                            $endTime = $workingDays[$dayKey][1].':00';
                            $expectedHours = (Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime)) / 60) - $breakHours;
                        }

                        if ($punchOut->lte($punchIn)) {
                            Log::warning('Invalid attendance record for employee_id: '.$employee->id, [
                                'punch_in' => $punchIn,
                                'punch_out' => $punchOut,
                                'break_hours' => $breakHours,
                            ]);
                            $attendance->hours_worked = 0;
                            $attendance->late_hours = round($expectedHours, 2);
                        } else {
                            $workedHours = ($punchIn->diffInMinutes($punchOut) / 60) - $breakHours;
                            $attendance->hours_worked = round(max($workedHours, 0), 2);
                            $attendance->late_hours = round(max(0, $expectedHours - $attendance->hours_worked), 2);

                            // Apply grace period for late punch_in
                            $expectedStart = Carbon::parse($attendance->date.' '.$startTime);
                            $graceEnd = $expectedStart->copy()->addMinutes($GRACE_PERIOD_MINUTES);
                            if ($punchIn->gt($graceEnd)) {
                                $lateMinutes = $expectedStart->diffInMinutes($punchIn);
                                $attendance->late_hours = round($lateMinutes / 60, 2);
                                Log::info('Late punch_in detected', [
                                    'employee_id' => $employee->id,
                                    'date' => $attendance->date,
                                    'punch_in' => $punchIn->toISOString(),
                                    'expected_start' => $expectedStart->toISOString(),
                                    'punch_in_1' => $punchIn,
                                    'startTime' => $startTime,
                                    'grace_end' => $graceEnd->toISOString(),
                                    'late_minutes' => $lateMinutes,
                                    'late_hours' => $attendance->late_hours,
                                ]);
                            }
                        }

                        return $attendance;
                    });

                $daysWorked = $attendances->filter(function ($a) {
                    return $a->hours_worked > 0;
                })->count();
                $allowance = Site::where('id', $employee->site_id)->value('allowance') ?? 0.00;
                $allowance = floatval($allowance) * floatval($daysWorked);
                $hoursWorked = $attendances->sum('hours_worked');
                $lateHours = $attendances->sum('late_hours');

                Log::info('Computed hours worked for employee_id: '.$employee->id, [
                    'hours_worked' => $hoursWorked,
                    'days_worked' => $daysWorked,
                    'late_hours' => $lateHours,
                    'grace_period_minutes' => $GRACE_PERIOD_MINUTES,
                    'attendances' => $attendances->map(function ($a) {
                        return [
                            'date' => $a->date,
                            'punch_in' => $a->punch_in,
                            'punch_out' => $a->punch_out,
                            'break_hours' => $a->break_hours,
                            'hours_worked' => $a->hours_worked,
                            'late_hours' => $a->late_hours,
                        ];
                    })->toArray(),
                ]);

                // Base pay
                $basePay = $dailyRate * $daysWorked;
                $basePay2 = $dailyRate * $totalWorkingDays;

                // Weekend pay
                $weekendPay = 0;
                if ($paySchedule === 'weekly') {
                    $weekendHours = $attendances->filter(function ($attendance) {
                        return in_array(Carbon::parse($attendance->date)->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]);
                    })->sum('hours_worked');
                    $weekendPay = $weekendHours * $hourlyRate * 0.30;
                }

                // Overtime pay
                $overtimeHours = EmployeeOvertime::where('employee_id', $employee->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->where('status', 'approved')
                    ->sum('approved_hours');
                $overtimePay = $overtimeHours * $hourlyRate * 1.25;

                // Leave pay
                $leaveDay = Leave::where('employee_id', $employee->id)
                    ->where('status', 'approved')
                    ->where('isWithPay', 1)
                    ->whereNotNull('approved_by_hr')
                    ->where(function ($query) use ($startDate, $endDate) {
                        $query->whereBetween('start_date', [$startDate, $endDate])
                            ->orWhereBetween('end_date', [$startDate, $endDate])
                            ->orWhere(function ($q) use ($startDate, $endDate) {
                                $q->where('start_date', '<', $startDate)
                                    ->where('end_date', '>', $endDate);
                            });
                    })
                    ->sum('day');

                $leavePay = $leaveDay * $dailyRate;

                // Holiday pay
                $holidayPay = 0;
                if ($paySchedule === 'semi-monthly') {
                    foreach ($holidays as $holiday) {
                        $attendance = $attendances->firstWhere('date', $holiday->date_holiday);
                        $hoursOnHoliday = $attendance ? $attendance->hours_worked : 0;
                        if ($holiday->holiday_type === 'Regular Holiday') {
                            $holidayPay += $hoursOnHoliday * $hourlyRate; // 100% extra
                        } else {
                            $holidayPay += $hoursOnHoliday * $hourlyRate * 0.3; // 30% extra
                        }
                    }
                }

                $grossPay = floatval($basePay2) + floatval($weekendPay) +
                floatval($overtimePay) + floatval($holidayPay) +
                floatval($allowance) + floatval($leavePay);

                // Deductions
                $sssDeduction = $this->calculateSssDeduction($monthlySalary);
                $philhealthDeduction = $this->calculatePhilHealthDeduction($monthlySalary);
                $pagibigDeduction = $this->calculatePagIbigDeduction($monthlySalary);
                $lateDeduction = $lateHours * $hourlyRate;

                $proratedSss = ($sssDeduction / $daysInMonth) * $daysInPeriod;
                $proratedPhilhealth = ($philhealthDeduction / $daysInMonth) * $daysInPeriod;
                $proratedPagibig = ($pagibigDeduction / $daysInMonth) * $daysInPeriod;
                $proratedLateDeduction = ($lateDeduction / $daysInMonth) * $daysInPeriod;

                $taxableIncome = $monthlySalary - ($sssDeduction + $philhealthDeduction + $pagibigDeduction);
                $withholdingTax = $this->calculateWithholdingTax($taxableIncome, $paySchedule);
                $proratedTax = ($withholdingTax / $daysInMonth) * $daysInPeriod;

                $total_absences = intval($totalWorkingDays) - intval($daysWorked) - intval($leaveDay);
                $absencesDeduction = $total_absences * $dailyRate;

                $totalDeductions = $proratedSss + $proratedPhilhealth + $proratedPagibig + $proratedTax + $proratedLateDeduction + $absencesDeduction;
                $netPay = $grossPay - $totalDeductions;

                // Save payroll
                Payroll::updateOrCreate([
                    'employee_id' => $employee->id,
                    'pay_period_start' => $startDate,
                    'pay_period_end' => $endDate,
                ], [
                    'base_pay' => $basePay,
                    'overtime_hours' => $overtimeHours,
                    'overtime_pay' => $overtimePay,
                    'days_worked' => $daysWorked,
                    'total_working_days' => $totalWorkingDays,
                    'total_absences' => $total_absences,
                    'hours_worked' => $hoursWorked,
                    'late_hours' => $lateHours,
                    'leave_days' => $leaveDay,
                    'leave_with_pay' => $leavePay,
                    'gross_pay' => $grossPay,
                    'sss_deduction' => $proratedSss,
                    'philhealth_deduction' => $proratedPhilhealth,
                    'pagibig_deduction' => $proratedPagibig,
                    'absences_deduction' => $absencesDeduction,
                    'withholding_tax' => $proratedTax,
                    'allowance' => floatval($allowance),
                    'late_deduction' => $proratedLateDeduction,
                    'deductions' => $totalDeductions,
                    'net_pay' => $netPay,
                    'pay_schedule' => $paySchedule,
                    'weekend_pay' => $weekendPay,
                    'holiday_pay' => $holidayPay,
                ]);

                Log::info('Payroll generated for employee_id: '.$employee->id, [
                    'gross_pay' => $grossPay,
                    'weekend_pay' => $weekendPay,
                    'holiday_pay' => $holidayPay,
                    'overtime_pay' => $overtimePay,
                    'overtime_hours' => $overtimeHours,
                    'base_pay' => $basePay,
                    'allowance' => $allowance,
                    'leave_days' => $leaveDay,
                    'leave_with_pay' => $leavePay,
                    'late_deduction' => $proratedLateDeduction,
                    'absences_deduction' => $absencesDeduction,
                    'deductions' => $totalDeductions,
                    'net_pay' => $netPay,
                    'total_working_days' => $totalWorkingDays,
                    'total_absences' => $totalWorkingDays - $daysWorked,
                ]);
            } catch (\Exception $e) {
                Log::error('Payroll generation error for employee_id: '.$employee->id, ['error' => $e->getMessage()]);
            }
        }

        return redirect()->back()->with('success', 'Payroll generated successfully.');
    }

    public function update(Request $request, $id)
    {
        try {

            $jsonData = json_decode($request->getContent(), true) ?? [];

            // 2. Log everything for debugging
            \Log::debug('Incoming request:', [
                'json_data' => $jsonData,
                'request_data' => $request->all(),
            ]);

            $validated = $request->validate([
                'total_working_days' => 'numeric|min:0|max:31',
                'allowance' => 'nullable|numeric|min:0',
                'holiday_pay' => 'nullable|numeric|min:0',
                'overtime_pay' => 'nullable|numeric|min:0',
                'withholding_tax' => 'required|numeric|min:0',
                'sss_deduction' => 'required|numeric|min:0',
                'philhealth_deduction' => 'required|numeric|min:0',
                'pagibig_deduction' => 'required|numeric|min:0',
                'absences_deduction' => 'required|numeric|min:0',
                'late_deduction' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:500',
            ]);

            $payroll = Payroll::with('employee')->findOrFail($id);

            $validated = array_map(function ($value) {
                return is_numeric($value) ? (float) $value : 0;
            }, $validated);

            $basicSalary = (float) $payroll->employee->basic_salary;
            $dailyPay = $basicSalary > 0 ? $basicSalary / 26 : 0;

            $grossPay = ($dailyPay * ($validated['total_working_days'] ?? 0))
                + ($validated['allowance'] ?? 0)
                + ($validated['holiday_pay'] ?? 0)
                + ($validated['overtime_pay'] ?? 0);

            $totalDeductions = ($validated['withholding_tax'] ?? 0)
                + ($validated['sss_deduction'] ?? 0)
                + ($validated['philhealth_deduction'] ?? 0)
                + ($validated['pagibig_deduction'] ?? 0)
                + ($validated['absences_deduction'] ?? 0)
                + ($validated['late_deduction'] ?? 0);

            $netPay = $grossPay - $totalDeductions;

            $updateData = array_merge($validated, [
                'gross_pay' => round($grossPay, 2),
                'net_pay' => round($netPay, 2),
                'total_working_days' => round($validated['total_working_days'], 2),
            ]);

            $updated = $payroll->update($updateData);

            if (! $updated) {
                throw new \Exception('Failed to update payroll record');
            }

            Log::info('Payroll updated successfully', [
                'payroll_id' => $id,
                'changes' => $updateData,
                'updated_by' => auth()->id(),
            ]);

            return redirect()->back()->with([
                'success' => 'Payroll updated successfully.',
                'updated_data' => [
                    'gross_pay' => $grossPay,
                    'net_pay' => $netPay,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Payroll update failed: '.$e->getMessage(), [
                'payroll_id' => $id,
                'input' => $request->all(),
                'error' => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->withErrors(['error' => 'Failed to update payroll. '.$e->getMessage()])
                ->withInput();
        }
    }

    public function approve(Request $request, $id)
    {
        \Log::info('Starting payroll approval process', ['payroll_id' => $id, 'user_id' => auth()->id()]);

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $payroll = Payroll::with(['employee'])->findOrFail($id);
            \Log::debug('Payroll retrieved', ['payroll' => $payroll->toArray(), 'current_status' => $payroll->status]);

            if ($payroll->status === 'approved') {
                \Log::warning('Payroll already approved', ['payroll_id' => $id]);

                return redirect()->back()->withErrors(['error' => 'Payroll already approved.']);
            }

            // Generate payslip PDF with DomPDF in landscape
            \Log::info('Generating payslip PDF in landscape');
            $pdf = Pdf::loadView('payslip.template', [
                'company_settings' => CompanySetting::first(),
                'payroll' => $payroll,
                'notes' => $request->notes,
            ])->setPaper('a4', 'landscape')// Set to landscape orientation
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            $fileName = 'payslip_'.$payroll->employee->employee_id.'_'.now()->format('Y-m').'.pdf';
            $filePath = 'payslips/'.$fileName;

            \Log::info('Saving PDF to storage', ['file_path' => $filePath]);
            Storage::disk('public')->put($filePath, $pdf->output());

            // Create payslip record
            \Log::info('Creating payslip record');
            $payslip = Payslip::create([
                'employee_id' => $payroll->employee_id,
                'payroll_id' => $payroll->id,
                'file_path' => $filePath,
                'status' => 'Approved',
                'notes' => $request->notes,
            ]);
            \Log::debug('Payslip created', ['payslip' => $payslip->toArray()]);

            // Update payroll status with approval info
            \Log::info('Updating payroll status to approved');
            $updateResult = $payroll->update([
                'status' => 'Approved',
                'notes' => $request->notes,
                'approved_at' => now(),
                'approved_by' => auth()->id(),
            ]);

            \Log::debug('Payroll update result', ['result' => $updateResult, 'updated_payroll' => $payroll->fresh()->toArray()]);

            if (! $updateResult) {
                \Log::error('Failed to update payroll status', ['payroll_id' => $id]);
                throw new \Exception('Failed to update payroll status');
            }

            // Optionally send notification to employee
            // $payroll->employee->notify(new PayslipGenerated($filePath));

            \Log::info('Payroll approved successfully', ['payroll_id' => $id]);

            return redirect()->back()->with([
                'success' => 'Payroll approved and payslip generated.',
                'payslip_url' => Storage::url($filePath),
            ]);

        } catch (\Exception $e) {
            \Log::error('Payroll approval failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payroll_id' => $id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->back()->withErrors(['error' => 'Failed to approve payroll. Please check logs.']);
        }
    }

    protected function generatePayslipHtml($payroll)
    {
        return view('payslip.template', compact('payroll'))->render();
    }

    public function indexPayslips(Request $request)
    {
        $employe_role = auth()->user()->roles[0]->name;

        if ($employe_role === 'HR' || $employe_role === 'SuperAdmin') {
            $query = Payslip::with('employee', 'payroll')->orderBy('created_at', 'desc');

            if (auth()->user()->roles[0]->name === 'Employee') {
                $query->where('employee_id', auth()->user()->employee_id);
            }

            // Apply filter by employee if provided (e.g., for HR to view specific employee payslips)
            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }
        } else {
            $query = Payslip::with('employee', 'payroll')->where('employee_id', auth()->user()->employee_id)->orderBy('created_at', 'desc');
        }

        $payslips = $query->get();

        return inertia('Payroll/PayslipViewer', [
            'payslips' => $payslips,
        ]);
    }
}
