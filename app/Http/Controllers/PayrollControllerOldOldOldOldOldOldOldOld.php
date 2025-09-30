<?php

namespace App\Http\Controllers;

use App\Events\EmployeeNotificationEvent;
use App\Models\CompanySetting;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeLoan;
use App\Models\EmployeeOvertime;
use App\Models\EmployeeSchedule;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\LoanPayrollDeduction;
use App\Models\Payroll;
use App\Models\Payslip;
use App\Models\Site;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PayrollControllerOldOldOldOldOldOldOldOld extends Controller
{
    public function index(Request $request)
    {
        $query = Payroll::with(['employee.site', 'employee.position', 'employee.department', 'site']);

        if ($request->site_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('site_id', $request->site_id);
            });
        }

        $payrolls = $query->get();

        $payPeriodStart = filled($request->start_date)
            ? Carbon::parse($request->start_date)
            : ($payrolls->first()->pay_period_start ?? now()->startOfMonth());

        $payPeriodEnd = filled($request->end_date)
            ? Carbon::parse($request->end_date)
            : ($payrolls->first()->pay_period_end ?? now()->endOfMonth());

        $attendances = EmployeeAttendance::whereBetween('date', [$payPeriodStart, $payPeriodEnd])->get();
        $holidays = Holiday::whereBetween('date_holiday', [$payPeriodStart, $payPeriodEnd])->get();
        $schedules = EmployeeSchedule::all();
        $sites = Site::select('id', 'name')->get();
        $departments = Department::select('id', 'name')->get();

        $employees = Employee::where('id', '!=', 1)
            ->with([
                'schedule' => function ($query) {
                    $query->latest('effective_from')->first();
                },
                'department' => function ($query) {
                    $query->select('id', 'name');
                },
            ])
            ->select('id', 'first_name', 'last_name', 'payroll_status as pay_schedule', 'employee_id', 'department_id', 'site_id')
            ->where('user_id', '!=', 1)
            ->whereIn('employment_status_id', [1, 5, 7, 6])
            ->get();

        Log::channel('payroll_logs')->info('Payroll index loaded', [
            'site_id' => $request->site_id,
            'payPeriodStart' => $payPeriodStart,
            'payPeriodEnd' => $payPeriodEnd,
            'payroll_count' => $payrolls->count(),
            'employee_count' => $employees->count(),
        ]);

        return Inertia::render('Payroll/PayrollComponent', [
            'payrolls' => $payrolls,
            'employees' => $employees,
            'attendances' => $attendances,
            'holidays' => $holidays,
            'schedules' => $schedules,
            'sites' => $sites,
            'departments' => $departments,
            'payPeriodStart' => $payPeriodStart,
            'payPeriodEnd' => $payPeriodEnd,
            'leaves' => Leave::with('employee')
                ->where('status', 'approved')
                ->where('isWithPay', 1)
                ->whereNotNull('approved_by_hr')
                ->get(),
            'errors' => $request->session()->get('errors') ? $request->session()->get('errors')->getBag('default')->getMessages() : (object) [],
        ]);
    }

    protected function calculateSssDeduction($monthlySalary)
    {
        $msc = min(max($monthlySalary, 4000), 30000);

        return round($msc * 0.045, 2);
    }

    public function getSss2025Contribution(float $monthlySalary): array
    {
        $mscBrackets = [];
        for ($msc = 5000; $msc <= 35000; $msc += 500) {
            $rangeMin = $msc - 250;
            $rangeMax = $msc + 249.99;

            $sssBase = min($msc, 20000);
            $sss_ee = round($sssBase * 0.05, 2);

            $mdf = ($msc >= 20250) ? round(($msc - 20000) * 0.05, 2) : 0.00;

            $total_ee = round($sss_ee + $mdf, 2);

            $mscBrackets[] = [
                'range_min' => $rangeMin,
                'range_max' => $rangeMax,
                'msc' => $msc,
                'sss_ee' => $sss_ee,
                'mdf' => $mdf,
                'total_ee' => $total_ee,
            ];
        }

        foreach ($mscBrackets as $bracket) {
            if ($monthlySalary >= $bracket['range_min'] && $monthlySalary <= $bracket['range_max']) {
                return [
                    'msc' => $bracket['msc'],
                    'sss_ee' => $bracket['sss_ee'],
                    'mdf' => $bracket['mdf'],
                    'total_ee' => $bracket['total_ee'],
                ];
            }
        }

        return [
            'msc' => 35000,
            'sss_ee' => 1000.00,
            'mdf' => 750.00,
            'total_ee' => 1750.00,
        ];
    }

    protected function calculatePhilHealthDeduction($monthlySalary)
    {
        $contribution = ($monthlySalary * 0.05) / 2;

        return round($contribution, 2);
    }

    protected function calculatePagIbigDeduction($monthlySalary)
    {
        if ($monthlySalary <= 1500) {
            return round($monthlySalary * 0.01, 2);
        }

        return 100.00;
    }

    protected function calculateWithholdingTax($taxableIncome, $payrollStatus = 'monthly')
    {
        switch (strtolower($payrollStatus)) {
            case 'semi-monthly':
                return $this->calculateSemiMonthlyTax($taxableIncome);
            case 'weekly':
                return $this->calculateWeeklyTax($taxableIncome);
            default:
                return $this->calculateSemiMonthlyTax($taxableIncome);
        }
    }

    protected function calculateSemiMonthlyTax($taxableIncome)
    {
        if ($taxableIncome <= 10417) {
            return 0;
        } elseif ($taxableIncome <= 16666) {
            return ($taxableIncome - 10417) * 0.15;
        } elseif ($taxableIncome <= 33332) {
            return 937.50 + ($taxableIncome - 16667) * 0.20;
        } elseif ($taxableIncome <= 83332) {
            return 4270.70 + ($taxableIncome - 33333) * 0.25;
        } elseif ($taxableIncome <= 333332) {
            return 16770.70 + ($taxableIncome - 83333) * 0.30;
        } else {
            return 91770.70 + ($taxableIncome - 333333) * 0.35;
        }
    }

    protected function calculateWeeklyTax($taxableIncome)
    {
        if ($taxableIncome <= 4808) {
            return 0;
        } elseif ($taxableIncome <= 7691) {
            return ($taxableIncome - 4808) * 0.15;
        } elseif ($taxableIncome <= 15384) {
            return 432.60 + ($taxableIncome - 7692) * 0.20;
        } elseif ($taxableIncome <= 38461) {
            return 1971.20 + ($taxableIncome - 15385) * 0.25;
        } elseif ($taxableIncome <= 153846) {
            return 7740.45 + ($taxableIncome - 38462) * 0.30;
        } else {
            return 42355.65 + ($taxableIncome - 153846) * 0.35;
        }
    }

    protected function calculateWeekendPay($paySchedule, $employee, $attendances, $hourlyRate)
    {
        $weekendPay = $attendances->filter(function ($attendance) {
            return in_array(Carbon::parse($attendance->date)->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]);
        })->sum(function ($attendance) use ($hourlyRate, $employee) {
            $dayOfWeek = Carbon::parse($attendance->date)->dayOfWeek;
            $multiplier = 1.0;
            if (! $employee->roleAccess || strtolower($employee->roleAccess->name) !== 'manager') {
                $multiplier = ($dayOfWeek === Carbon::SATURDAY ? 1.30 :
                            ($dayOfWeek === Carbon::SUNDAY ? 1.25 : 1.0));
            }

            return $attendance->hours_worked * $hourlyRate * $multiplier;
        });

        return $weekendPay;
    }

    protected function calculateNightDifferentialPay($attendances, $hourlyRate)
    {
        $nightDiffHours = 0;
        foreach ($attendances as $attendance) {
            $punchIn = Carbon::parse($attendance->punch_in);
            $punchOut = Carbon::parse($attendance->punch_out);
            $date = Carbon::parse($attendance->date);

            $startNight = $date->copy()->setTime(22, 0);
            $endNight = $date->copy()->setTime(6, 0)->addDay();

            if ($punchIn->greaterThanOrEqualTo($startNight) && $punchOut->lessThanOrEqualTo($endNight)) {
                $nightDiffHours += $attendance->hours_worked;
            } elseif ($punchIn->lessThan($startNight) && $punchOut->greaterThan($startNight)) {
                $nightStart = max($punchIn, $startNight);
                if ($punchOut->lessThanOrEqualTo($endNight)) {
                    $nightDiffHours += $nightStart->diffInMinutes($punchOut) / 60;
                } else {
                    $nightDiffHours += $nightStart->diffInMinutes($endNight) / 60;
                }
            } elseif ($punchIn->lessThan($endNight) && $punchOut->greaterThan($endNight)) {
                $nightDiffHours += $punchIn->diffInMinutes($endNight) / 60;
            } elseif ($punchIn->greaterThan($startNight) && $punchOut->greaterThan($endNight)) {
                $nightDiffHours += $startNight->diffInMinutes($endNight) / 60;
            }

            if ($punchIn->lessThan($startNight) && $punchOut->greaterThan($endNight)) {
                $nightDiffHours += $endNight->diffInMinutes($startNight) / 60;
            }
        }
        $nightDiffPay = round($nightDiffHours * $hourlyRate * 0.10, 2);

        return ['night_diff_hours' => $nightDiffHours, 'night_diff_pay' => $nightDiffPay];
    }

    public function getWeeklyCutoffType(Carbon $endDate): string
    {
        $firstDayOfMonth = $endDate->copy()->startOfMonth();
        $dayOfMonth = $endDate->day;
        $weekOfMonth = (int) ceil(($dayOfMonth + $firstDayOfMonth->copy()->dayOfWeek) / 7);
        switch ($weekOfMonth) {
            case 1: return '1st-week';
            case 2: return '2nd-week';
            case 3: return '3rd-week';
            case 4: return '4th-week';
            default: return 'extra-week';
        }
    }

    public function getCustomSemiMonthlyCutoffType(Carbon $startDate, Carbon $endDate): ?string
    {
        $fifteenth = Carbon::create($endDate->year, $endDate->month, 15);
        $endMonthDay = $endDate->copy()->endOfMonth();
        if ($endDate->lessThanOrEqualTo($fifteenth)) {
            return '1st-half';
        } elseif ($endDate->lessThanOrEqualTo($endMonthDay)) {
            return '2nd-half';
        }

        return null;
    }

    protected function calculateLoanDeductions($employee, $startDate, $endDate, $paySchedule)
    {
        $cutoffType = $paySchedule === 'semi-monthly' ? $this->getCustomSemiMonthlyCutoffType($startDate, $endDate) : null;
        $deductions = [];
        $totalLoanDeduction = 0;
        $fullyPaidLoans = [];

        // Define deduction dates for twice_a_month schedule
        $fifteenth = Carbon::create($endDate->year, $endDate->month, 15);
        $endMonthDay = $endDate->copy()->endOfMonth();

        $loans = EmployeeLoan::where('employee_id', $employee->id)
            ->where('status', 'Approved')
            ->where('is_fully_paid', false)
            ->get();

        foreach ($loans as $loan) {
            $remainingBalance = $loan->amount - $loan->loanDeductions()->sum('amount_deducted');
            if ($remainingBalance <= 0) {
                $fullyPaidLoans[] = $loan->id;
                Log::channel('payroll_logs')->info('Loan identified as fully paid during calculation', [
                    'employee_id' => $employee->id,
                    'loan_id' => $loan->id,
                    'loan_type' => $loan->loan_type,
                ]);

                continue;
            }

            $deductionFrequency = $loan->deduction_frequency;
            $deductionsPerMonth = $deductionFrequency === 'once_a_month' ? 1 : 2;
            $totalDeductions = $loan->terms * $deductionsPerMonth;
            $amountPerDeduction = round($loan->amount / $totalDeductions, 2);

            $shouldDeduct = false;
            $deductionDate = $endDate;

            if ($paySchedule === 'semi-monthly') {
                if ($deductionFrequency === 'once_a_month' && $cutoffType === '2nd-half') {
                    $shouldDeduct = true;
                } elseif ($deductionFrequency === 'twice_a_month') {
                    $shouldDeduct = true;
                    $deductionDate = $cutoffType === '1st-half' ? $fifteenth : $endMonthDay;
                }
            } elseif ($paySchedule === 'weekly') {
                $weeklyCutoff = $this->getWeeklyCutoffType($endDate);
                if ($deductionFrequency === 'once_a_month' && $weeklyCutoff === '4th-week') {
                    $shouldDeduct = true;
                } elseif ($deductionFrequency === 'twice_a_month' && in_array($weeklyCutoff, ['2nd-week', '4th-week'])) {
                    $shouldDeduct = true;
                    $deductionDate = $weeklyCutoff === '2nd-week' ? $fifteenth : $endMonthDay;
                }
            }

            if ($shouldDeduct && $remainingBalance >= $amountPerDeduction) {
                $deductionAmount = min($amountPerDeduction, $remainingBalance);
                $deductions[] = [
                    'employee_id' => $employee->id,
                    'employee_loan_id' => $loan->id,
                    'amount_deducted' => $deductionAmount,
                    'deduction_date' => $deductionDate,
                    'notes' => "Automatic loan deduction for {$loan->loan_type} ({$deductionFrequency})",
                ];
                $totalLoanDeduction += $deductionAmount;

                if ($remainingBalance - $deductionAmount <= 0) {
                    $fullyPaidLoans[] = $loan->id;
                }
            }
        }

        return [
            'deductions' => $deductions,
            'total_loan_deduction' => $totalLoanDeduction,
            'fully_paid_loans' => $fullyPaidLoans,
        ];
    }

    public function generate(Request $request)
    {
        $request->validate([
            'pay_schedule_type' => 'required|in:weekly,semi-monthly',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'employee_ids' => 'array|nullable',
            'employee_ids.*' => 'exists:employees,id',
        ]);

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        $paySchedule = strtolower($request->pay_schedule_type);
        $daysInPeriod = $startDate->diffInDays($endDate) + 1;
        $daysInMonth = $startDate->daysInMonth;

        $holidays = Holiday::whereBetween('date_holiday', [$startDate, $endDate])->get();
        $GRACE_PERIOD_MINUTES = 15;

        Log::channel('payroll_logs')->info('Payroll generation started', [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'pay_schedule' => $paySchedule,
            'employee_ids' => $request->employee_ids,
        ]);

        $employees = $request->has('employee_ids') && ! empty($request->employee_ids)
            ? Employee::where('id', '!=', 1)->with('site', 'employmentType')->whereIn('id', $request->employee_ids)->get()
            : Employee::where('id', '!=', 1)->with('site', 'employmentType')->where('payroll_status', $paySchedule)->get();

        Log::channel('payroll_logs')->info('Employees selected for payroll', [
            'employee_count' => $employees->count(),
            'selected_ids' => $request->employee_ids,
        ]);

        foreach ($employees as $employee) {
            try {
                Log::channel('payroll_logs')->debug('Processing payroll for employee', ['employee_id' => $employee->id]);

                $salaryDayDivider = $paySchedule === 'semi-monthly' ? 26 : 6;
                $monthlySalary = $employee->basic_salary ?? 0;
                $hourlyRate = $monthlySalary / ($salaryDayDivider * 8);
                $dailyRate = $monthlySalary / $salaryDayDivider;

                $totalWorkingDays = 0;
                $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('effective_from', '<=', $endDate)
                    ->where(function ($query) use ($startDate) {
                        $query->where('effective_until', '>=', $startDate)
                            ->orWhereNull('effective_until');
                    })
                    ->orderBy('effective_from', 'desc')
                    ->first();

                $workingDays = $schedule ? json_decode($schedule->working_days, true) : ['mon', 'tue', 'wed', 'thu', 'fri'];
                if (! $workingDays || json_last_error() !== JSON_ERROR_NONE) {
                    $workingDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
                }

                $period = CarbonPeriod::create($startDate, $endDate);
                foreach ($period as $date) {
                    $dayKey = strtolower($date->format('D'));
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
                }
                if ($paySchedule === 'weekly') {
                    $totalWorkingDays++;
                }

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
                        $dayKey = strtolower($date->format('D'));

                        $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                            ->where('effective_from', '<=', $attendance->date)
                            // ->where('effective_until', '>=', $attendance->date)
                            ->where(function ($query) use ($attendance) {
                                $query->where('effective_until', '>=', $attendance->date)
                                    ->orWhereNull('effective_until');
                            })
                            ->orderBy('effective_from', 'desc')
                            ->first();

                        $workingDays = $schedule ? json_decode($schedule->working_days, true) : ['mon', 'tue', 'wed', 'thu', 'fri'];
                        // $startTime = '09:00:00';
                        // $endTime = '17:00:00';
                        // $expectedHours = 8.00;

                        $scheduledStartTime = '09:00:00'; // Default start time
                        $scheduledEndTime = '17:00:00';   // Default end time
                        $expectedHours = 8.00;            // Default expected hours

                        // if ($schedule && $schedule->schedule_type === 'fixed') {
                        //     $startTime = $schedule->start_time;
                        //     $endTime = $schedule->end_time;
                        //     $expectedHours = (Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime)) / 60) - $breakHours;
                        // } elseif ($schedule && $schedule->schedule_type === 'flexible') {
                        //     $startTime = $workingDays[$dayKey][0].':00';
                        //     $endTime = $workingDays[$dayKey][1].':00';
                        //     $expectedHours = (Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime)) / 60) - $breakHours;
                        // }

                        // if ($punchOut->lte($punchIn)) {
                        //     $attendance->hours_worked = 0;
                        //     $attendance->late_hours = round($expectedHours, 2);
                        //     $attendance->undertime_hours = 0;
                        // } else {
                        //     $workedHours = ($punchIn->diffInMinutes($punchOut) / 60) - $breakHours;
                        //     $attendance->hours_worked = round(max($workedHours, 0), 2);
                        //     $undertimeHours = max(0, $expectedHours - $attendance->hours_worked);
                        //     $attendance->undertime_hours = round($undertimeHours, 2);

                        //     $expectedStart = Carbon::parse($attendance->date.' '.$startTime);
                        //     $graceEnd = $expectedStart->copy()->addMinutes($GRACE_PERIOD_MINUTES);
                        //     if ($punchIn->gt($graceEnd)) {
                        //         $lateMinutes = $expectedStart->diffInMinutes($punchIn);
                        //         $attendance->late_hours = round($lateMinutes / 60, 2);
                        //     } else {
                        //         $attendance->late_hours = 0;
                        //     }
                        // }
                        // Log::channel('payroll_logs')->info('Attendance processed', [
                        //     'date' => $attendance->date,
                        //     'hours_worked' => $attendance->hours_worked,
                        //     'expected_hours' => $expectedHours,
                        //     'late_hours' => $attendance->late_hours,
                        //     'undertime_hours' => $attendance->undertime_hours,
                        // ]);

                        if ($schedule && $schedule->schedule_type === 'fixed') {
                            $scheduledStartTime = $schedule->start_time;
                            $scheduledEndTime = $schedule->end_time;
                            $expectedHours = (Carbon::parse($scheduledStartTime)->diffInMinutes(Carbon::parse($scheduledEndTime)) / 60) - $breakHours;
                        } elseif ($schedule && $schedule->schedule_type === 'flexible') {
                            if (isset($workingDays[$dayKey]) && is_array($workingDays[$dayKey])) {
                                $scheduledStartTime = $workingDays[$dayKey][0].':00';
                                $scheduledEndTime = $workingDays[$dayKey][1].':00';
                                $expectedHours = (Carbon::parse($scheduledStartTime)->diffInMinutes(Carbon::parse($scheduledEndTime)) / 60) - $breakHours;
                            }
                        }

                        $effectiveStart = Carbon::parse($attendance->date.' '.$scheduledStartTime);
                        $effectiveEnd = Carbon::parse($attendance->date.' '.$scheduledEndTime);

                        // Adjust punch-in to scheduled start time if earlier
                        $adjustedPunchIn = $punchIn->max($effectiveStart);

                        if ($punchOut->lte($adjustedPunchIn)) {
                            $attendance->hours_worked = 0;
                            $attendance->late_hours = round(($effectiveStart->diffInMinutes($punchIn) / 60), 2);
                            $attendance->undertime_hours = round($expectedHours, 2);
                        } else {
                            $workedMinutes = $adjustedPunchIn->diffInMinutes($punchOut);
                            $workedHours = ($workedMinutes / 60) - $breakHours;
                            $attendance->hours_worked = round(max($workedHours, 0), 2);

                            // Calculate undertime based on scheduled end time
                            $undertimeMinutes = max(0, $effectiveEnd->diffInMinutes($punchOut));
                            $undertimeHours = $undertimeMinutes / 60;
                            $attendance->undertime_hours = round(min($undertimeHours, $expectedHours - $attendance->hours_worked), 2);

                            // Calculate late hours based on grace period
                            $graceEnd = $effectiveStart->copy()->addMinutes($GRACE_PERIOD_MINUTES);
                            if ($punchIn->gt($graceEnd)) {
                                $lateMinutes = $effectiveStart->diffInMinutes($punchIn);
                                $attendance->late_hours = round($lateMinutes / 60, 2);
                            } else {
                                $attendance->late_hours = 0;
                            }
                        }

                        Log::channel('payroll_logs')->info('Attendance processed', [
                            'date' => $attendance->date,
                            'punch_in' => $attendance->punch_in,
                            'punch_out' => $attendance->punch_out,
                            'adjusted_punch_in' => $adjustedPunchIn->format('H:i:s'),
                            'scheduled_start' => $scheduledStartTime,
                            'scheduled_end' => $scheduledEndTime,
                            'hours_worked' => $attendance->hours_worked,
                            'expected_hours' => $expectedHours,
                            'late_hours' => $attendance->late_hours,
                            'undertime_hours' => $attendance->undertime_hours,
                        ]);

                        return $attendance;
                    });

                $daysWorked = $attendances->filter(function ($a) {
                    return $a->hours_worked > 0;
                })->count();

                $leaveDays = Leave::where('employee_id', $employee->id)
                    ->where('status', 'approved')
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

                $leaveDaysWithoutPay = Leave::where('employee_id', $employee->id)
                    ->where('status', 'approved')
                    ->where('isWithPay', 0)
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
                $leavePay = ($leaveDays - $leaveDaysWithoutPay) * $dailyRate;

                $basePayPenalty = 0;
                if ($paySchedule === 'weekly') {
                    if ($daysWorked + $leaveDays < 5) {
                        $basePayPenalty = $hourlyRate * 9.6;
                    }
                    $daysWorked = $daysWorked + 1;
                }

                $allowance = Site::where('id', $employee->site_id)->value('allowance') ?? 0.00;
                $allowance = floatval($allowance) * floatval($daysWorked);
                $hoursWorked = $attendances->sum('hours_worked');
                $lateHours = $attendances->sum('late_hours');
                $undertimeHours = $attendances->sum('undertime_hours');

                $basePay = $paySchedule === 'semi-monthly' ? $dailyRate * $daysWorked : ($dailyRate * $daysWorked) - $basePayPenalty;
                $basePay2 = $paySchedule === 'semi-monthly' ? $monthlySalary / 2 : ($dailyRate * $totalWorkingDays) - $basePayPenalty;

                $weekendPay = $this->calculateWeekendPay($paySchedule, $employee, $attendances, $hourlyRate);
                $nightDiffData = $this->calculateNightDifferentialPay($attendances, $hourlyRate);
                $nightDiffHours = $nightDiffData['night_diff_hours'];
                $nightDiffPay = $nightDiffData['night_diff_pay'];

                $overtimePay = 0;
                $holidayPay = 0;
                $approvedOvertimeHours = 0;

                if (! $employee->roleAccess || strtolower($employee->roleAccess->name) !== 'manager') {
                    $dailyRate = round($employee->basic_salary / $salaryDayDivider, 2);
                    $baseHourlyRate = round($dailyRate / 8, 2);

                    $overtimeHours = EmployeeOvertime::where('employee_id', $employee->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->where('status', 'approved')
                        ->get();

                    $approvedOvertimeHours = $overtimeHours->sum('approved_hours');

                    foreach ($overtimeHours as $overtime) {
                        $date = $overtime->date;
                        $excessHours = round($overtime->approved_hours, 2);
                        $isRestDay = date('N', strtotime($date)) >= 6;
                        $holiday = $holidays->firstWhere('date_holiday', $date);

                        $otHourlyRate = $baseHourlyRate;

                        if ($holiday) {
                            switch ($holiday->holiday_type) {
                                case 'Regular Holiday':
                                    $otHourlyRate = round(($dailyRate * 2 / 8) * 1.3, 2);
                                    break;
                                case 'Special Working':
                                    $otHourlyRate = round(($dailyRate * 1 / 8) * 1.3, 2);
                                    break;
                                case 'Special Non Working':
                                    $otHourlyRate = round(($dailyRate * 1.3 / 8) * 1.3, 2);
                                    if ($isRestDay) {
                                        $otHourlyRate = round(($dailyRate * 1.5 / 8) * 1.3, 2);
                                    }
                                    break;
                            }
                            if ($holiday->holiday_type === 'Regular Holiday' && $isRestDay) {
                                $otHourlyRate = round(($dailyRate * 2.6 / 8) * 1.3, 2);
                            }
                        } else {
                            if ($isRestDay) {
                                if (date('N', strtotime($date)) === 6) {
                                    $otHourlyRate = round(($dailyRate * 1.3 / 8) * 1.3, 2);
                                } elseif (date('N', strtotime($date)) === 7) {
                                    $otHourlyRate = round(($dailyRate * 1.25 / 8) * 1.25, 2);
                                }
                            } else {
                                $otHourlyRate = round(($dailyRate * 1 / 8) * 1.25, 2);
                            }
                        }
                        $overtimePay = round($overtimePay + ($excessHours * $otHourlyRate), 2);
                    }

                    if ($paySchedule === 'semi-monthly') {
                        foreach ($holidays as $holiday) {
                            $attendance = $attendances->firstWhere('date', $holiday->date_holiday);
                            $previousDay = Carbon::parse($holiday->date_holiday)->subDay();
                            $prevAttendance = $attendances->firstWhere('date', $previousDay);
                            $prevLeave = Leave::where('employee_id', $employee->id)
                                ->where('status', 'approved')
                                ->where('isWithPay', 1)
                                ->whereNotNull('approved_by_hr')
                                ->where(function ($query) use ($previousDay) {
                                    $query->where('start_date', '<=', $previousDay)
                                        ->where('end_date', '>=', $previousDay);
                                })->exists();

                            $hoursOnHoliday = $attendance ? round($attendance->hours_worked, 2) : 0;
                            if (! $prevAttendance && ! $prevLeave) {
                                Log::channel('payroll_logs')->info('Holiday pay excluded due to absence before holiday', [
                                    'employee_id' => $employee->id,
                                    'holiday_date' => $holiday->date_holiday,
                                    'previous_day' => $previousDay,
                                ]);

                                continue;
                            }

                            if ($holiday->holiday_type === 'Regular Holiday') {
                                $holidayPay = round($holidayPay + ($hoursOnHoliday * $hourlyRate), 2);
                            } else {
                                $holidayPay = round($holidayPay + ($hoursOnHoliday * $hourlyRate * 0.30), 2);
                            }
                        }
                    }
                }

                $grossPay = floatval($basePay2) + floatval($weekendPay) +
                            floatval($overtimePay) + floatval($holidayPay) +
                            floatval($allowance) + floatval($leavePay) + floatval($nightDiffPay);

                $sssDeduction = $this->getSss2025Contribution($monthlySalary)['sss_ee'];
                $philhealthDeduction = $this->calculatePhilHealthDeduction($monthlySalary);
                $pagibigDeduction = $this->calculatePagIbigDeduction($monthlySalary);
                $lateDeduction = $lateHours * $hourlyRate;
                $undertimeDeduction = $undertimeHours * $hourlyRate;

                $proratedLateDeduction = $lateDeduction;
                $proratedUndertimeDeduction = $undertimeDeduction;

                $loanData = $this->calculateLoanDeductions($employee, $startDate, $endDate, $paySchedule);
                $totalLoanDeduction = $loanData['total_loan_deduction'];

                if (strtolower($paySchedule) === 'semi-monthly') {
                    $taxableSalary = $monthlySalary / 2;
                } else {
                    $taxableSalary = $monthlySalary;
                }

                $taxableIncome = $taxableSalary + $weekendPay + $overtimePay + $holidayPay + $nightDiffPay;
                if ($employee->tin) {
                    $withholdingTax = $this->calculateWithholdingTax($taxableIncome, $paySchedule);

                } else {
                    $withholdingTax = 0;
                }

                $cutoffType = $paySchedule === 'semi-monthly' ? $this->getCustomSemiMonthlyCutoffType($startDate, $endDate) : null;

                $proratedSss = 0;
                $proratedPhilhealth = 0;
                $proratedPagibig = 0;
                $proratedTax = 0;

                $employmentType = strtolower($employee->employmentType->name);

                if ($paySchedule === 'semi-monthly') {
                    if ($cutoffType === '1st-half') {
                        $proratedSss = $sssDeduction;
                        $proratedPhilhealth = 0;
                        $proratedPagibig = 0;
                        $proratedTax = $withholdingTax;
                    } elseif ($cutoffType === '2nd-half') {
                        $proratedSss = 0;
                        $proratedPhilhealth = $philhealthDeduction;
                        $proratedPagibig = $pagibigDeduction;
                        $proratedTax = $withholdingTax;
                    }
                } elseif ($paySchedule === 'weekly' && $employmentType === 'full-time') {
                    $weeklyCutoff = $this->getWeeklyCutoffType($endDate);
                    switch ($weeklyCutoff) {
                        case '1st-week':
                        case '3rd-week':
                        case 'extra-week':
                            $proratedSss = 0;
                            $proratedPhilhealth = 0;
                            $proratedPagibig = 0;
                            $proratedTax = $withholdingTax;
                            break;
                        case '2nd-week':
                            $proratedSss = $sssDeduction;
                            $proratedPhilhealth = 0;
                            $proratedPagibig = 0;
                            $proratedTax = $withholdingTax;
                            break;
                        case '4th-week':
                            $proratedSss = 0;
                            $proratedPhilhealth = $philhealthDeduction;
                            $proratedPagibig = $pagibigDeduction;
                            $proratedTax = $withholdingTax;
                            break;
                    }
                } elseif ($paySchedule === 'weekly' && $employmentType === 'project based') {
                    $proratedSss = 0;
                    $proratedPhilhealth = 0;
                    $proratedPagibig = 0;
                    $proratedTax = $withholdingTax;
                }

                $totalAbsences = max(0, $totalWorkingDays - ($daysWorked + $leaveDays));
                $absencesDeduction = $totalAbsences * $dailyRate;

                $totalDeductions = $proratedSss + $proratedPhilhealth + $proratedPagibig + $proratedTax +
                                   $proratedLateDeduction + $proratedUndertimeDeduction + $absencesDeduction + $totalLoanDeduction;

                // $thirteenMonthPay = $this->calculate13thMonthPay($employee, $startDate, $endDate, $totalAbsences);
                $netPay = $grossPay - $totalDeductions;

                Log::channel('payroll_logs')->debug('Payroll deductions and net pay', [
                    'employee_id' => $employee->id,
                    'proratedSss' => $proratedSss,
                    'proratedPhilhealth' => $proratedPhilhealth,
                    'proratedPagibig' => $proratedPagibig,
                    'proratedTax' => $proratedTax,
                    'proratedLateDeduction' => $proratedLateDeduction,
                    'proratedUndertimeDeduction' => $proratedUndertimeDeduction,
                    'absencesDeduction' => $absencesDeduction,
                    'totalLoanDeduction' => $totalLoanDeduction,
                    'totalDeductions' => $totalDeductions,
                    // 'thirteenMonthPay' => $thirteenMonthPay,
                    'netPay' => $netPay,
                ]);

                $payroll = Payroll::firstOrNew([
                    'employee_id' => $employee->id,
                    'pay_period_start' => $startDate,
                    'pay_period_end' => $endDate,
                    'site_id' => $employee->site_id,
                ]);

                if ($payroll->status !== 'Approved' || $payroll->site_id !== $employee->site_id) {
                    $payroll->base_pay = $basePay;
                    $payroll->base_pay2 = $basePay2;
                    $payroll->site_id = $employee->site_id;
                    $payroll->overtime_hours = $approvedOvertimeHours;
                    $payroll->overtime_pay = $overtimePay;
                    $payroll->night_diff_hours = $nightDiffHours;
                    $payroll->night_diff_pay = $nightDiffPay;
                    $payroll->days_worked = $daysWorked;
                    $payroll->total_working_days = $totalWorkingDays;
                    $payroll->total_absences = $totalAbsences;
                    $payroll->hours_worked = $hoursWorked;
                    $payroll->late_hours = $lateHours;
                    $payroll->undertime_hours = $undertimeHours;
                    $payroll->leave_days = $leaveDays;
                    $payroll->leave_days_without_pay = $leaveDaysWithoutPay;
                    $payroll->leave_with_pay = $leavePay;
                    $payroll->gross_pay = $grossPay;
                    $payroll->sss_deduction = $proratedSss;
                    $payroll->philhealth_deduction = $proratedPhilhealth;
                    $payroll->pagibig_deduction = $proratedPagibig;
                    $payroll->absences_deduction = $absencesDeduction;
                    $payroll->withholding_tax = $proratedTax;
                    $payroll->allowance = floatval($allowance);
                    $payroll->late_deduction = $proratedLateDeduction;
                    $payroll->undertime_deduction = $proratedUndertimeDeduction;
                    $payroll->loan_deduction = $totalLoanDeduction;
                    $payroll->deductions = $totalDeductions;
                    $payroll->net_pay = $netPay;
                    $payroll->pay_schedule = $paySchedule;
                    $payroll->weekend_pay = $weekendPay;
                    // $payroll->thirteenth_month_pay = $thirteenMonthPay;
                    $payroll->status = 'Pending';

                    $payroll->save();

                    Log::channel('payroll_logs')->info('Payroll record created/updated', [
                        'employee_id' => $employee->id,
                        'payroll_id' => $payroll->id,
                        'payroll_data' => [
                            'gross_pay' => $grossPay,
                            'net_pay' => $netPay,
                            'total_deductions' => $totalDeductions,
                            'night_diff_hours' => $nightDiffHours,
                            'night_diff_pay' => $nightDiffPay,
                            'thirteen_month_pay' => $thirteenMonthPay,
                            'loan_deduction' => $totalLoanDeduction,
                        ],
                    ]);
                }
            } catch (\Exception $e) {
                Log::channel('payroll_logs')->error('Payroll generation failed for employee', [
                    'employee_id' => $employee->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        Log::channel('payroll_logs')->info('Payroll generation completed', [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'pay_schedule' => $paySchedule,
        ]);

        return redirect()->back()->with('success', 'Payroll generated successfully.');
    }

    public function approve(Request $request, $id)
    {
        Log::channel('payroll_logs')->info('Starting payroll approval process', [
            'payroll_id' => $id,
            'user_id' => auth()->id(),
        ]);

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $payroll = Payroll::with(['employee'])->findOrFail($id);
            Log::channel('payroll_logs')->debug('Payroll retrieved', [
                'payroll_id' => $id,
                'employee_id' => $payroll->employee_id,
                'current_status' => $payroll->status,
            ]);

            if ($payroll->status === 'Approved') {
                Log::channel('payroll_logs')->warning('Payroll already approved', ['payroll_id' => $id]);

                return redirect()->back()->withErrors(['error' => 'Payroll already approved.']);
            }

            // Recalculate loan deductions to ensure accuracy
            $employee = $payroll->employee;
            $startDate = Carbon::parse($payroll->pay_period_start);
            $endDate = Carbon::parse($payroll->pay_period_end);
            $paySchedule = $payroll->pay_schedule;
            $loanData = $this->calculateLoanDeductions($employee, $startDate, $endDate, $paySchedule);
            $loanDeductions = $loanData['deductions'];
            $totalLoanDeduction = $loanData['total_loan_deduction'];
            $fullyPaidLoans = $loanData['fully_paid_loans'];

            // Save loan deductions to LoanPayrollDeduction
            foreach ($loanDeductions as $deduction) {
                $loanPayment = LoanPayrollDeduction::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $deduction['employee_id'],
                    'employee_loan_id' => $deduction['employee_loan_id'],
                    'amount_deducted' => $deduction['amount_deducted'],
                    'deduction_date' => $deduction['deduction_date'],
                    'notes' => $deduction['notes'],
                ]);

                $loan = EmployeeLoan::find($deduction['employee_loan_id']);
                $employeeName = $employee->first_name.' '.$employee->last_name;
                $statusMessage = "A loan deduction of {$deduction['amount_deducted']} was recorded for your {$loan->loan_type} loan on {$deduction['deduction_date']}.";
                createNotification($employee->id, $statusMessage, auth()->user()->employee->id, 'Loan');
                event(new EmployeeNotificationEvent($employee->id, $statusMessage));
                Log::channel('payroll_logs')->info('Loan deduction saved', [
                    'payroll_id' => $payroll->id,
                    'employee_id' => $deduction['employee_id'],
                    'loan_id' => $deduction['employee_loan_id'],
                    'amount_deducted' => $deduction['amount_deducted'],
                ]);
            }

            // Update fully paid loans
            foreach ($fullyPaidLoans as $loanId) {
                $loan = EmployeeLoan::find($loanId);
                if ($loan) {
                    $loan->update(['is_fully_paid' => true]);
                    $employeeName = $employee->first_name.' '.$employee->last_name;
                    $statusMessage = "Your {$loan->loan_type} loan has been fully paid on {$endDate->format('Y-m-d')}.";
                    createNotification($employee->id, $statusMessage, auth()->user()->employee->id, 'Loan');
                    event(new EmployeeNotificationEvent($employee->id, $statusMessage));
                    Log::channel('payroll_logs')->info('Loan marked as fully paid', [
                        'employee_id' => $employee->id,
                        'loan_id' => $loan->id,
                        'loan_type' => $loan->loan_type,
                    ]);
                }
            }

            // Update payroll with final loan deduction
            $totalDeductions = $payroll->sss_deduction + $payroll->philhealth_deduction + $payroll->pagibig_deduction +
                               $payroll->withholding_tax + $payroll->late_deduction + $payroll->undertime_deduction +
                               $payroll->absences_deduction + $totalLoanDeduction;

            $payroll->update([
                'loan_deduction' => $totalLoanDeduction,
                'deductions' => $totalDeductions,
                'net_pay' => $payroll->gross_pay - $totalDeductions,
                'status' => 'Approved',
                'notes' => $request->notes,
                'approved_at' => now(),
                'approved_by' => auth()->user()->employee->id,
            ]);

            Log::channel('payroll_logs')->info('Generating payslip PDF in landscape');
            $pdf = Pdf::loadView('payslip.template', [
                'company_settings' => CompanySetting::first(),
                'payroll' => $payroll,
                'notes' => $request->notes,
            ])->setPaper('a4', 'landscape')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            $fileName = 'payslip_'.$payroll->employee->employee_id.'_('.$payroll->pay_period_start->format('Y-m-d').'-'.$payroll->pay_period_end->format('Y-m-d').').pdf';
            $filePath = 'payslips/'.$fileName;

            Log::channel('payroll_logs')->info('Saving PDF to storage', ['file_path' => $filePath]);
            Storage::disk('public')->put($filePath, $pdf->output());

            Log::channel('payroll_logs')->info('Creating payslip record');
            $payslip = Payslip::create([
                'employee_id' => $payroll->employee_id,
                'payroll_id' => $payroll->id,
                'file_path' => $filePath,
                'status' => 'Approved',
                'notes' => $request->notes,
            ]);
            Log::channel('payroll_logs')->debug('Payslip created', ['payslip_id' => $payslip->id]);

            $employeeId = $payroll->employee_id;
            $employeeName = $payroll->employee->first_name.' '.$payroll->employee->last_name;
            $statusMessage = "Your payslip for the period {$payroll->pay_period_start->format('Y-m-d')} to {$payroll->pay_period_end->format('Y-m-d')} is now available.";
            createNotification($employeeId, $statusMessage, auth()->user()->employee->id, 'Payroll');
            Log::info('Payslip availability notification', [
                'employee_id' => $employeeId,
                'message' => $statusMessage,
            ]);

            event(new EmployeeNotificationEvent($employeeId, $statusMessage));

            Log::channel('payroll_logs')->info('Payroll approved successfully', ['payroll_id' => $id]);

            return redirect()->back()->with([
                'success' => 'Payroll approved and payslip generated.',
                'payslip_url' => Storage::url($filePath),
            ]);
        } catch (\Exception $e) {
            Log::channel('payroll_logs')->error('Payroll approval failed', [
                'payroll_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
            ]);

            return redirect()->back()->withErrors(['error' => 'Failed to approve payroll. Please check logs.']);
        }
    }

    public function regeneratePayslip(Request $request, $id)
    {
        Log::channel('payroll_logs')->info('Starting payslip regeneration process', [
            'payroll_id' => $id,
            'user_id' => auth()->id(),
        ]);

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $payroll = Payroll::with('employee')->findOrFail($id);

            Log::channel('payroll_logs')->debug('Payroll retrieved for regeneration', [
                'payroll_id' => $id,
                'employee_id' => $payroll->employee_id,
                'status' => $payroll->status,
            ]);

            $pdf = Pdf::loadView('payslip.template', [
                'company_settings' => CompanySetting::first(),
                'payroll' => $payroll,
                'notes' => $request->notes,
            ])->setPaper('a4', 'landscape')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            $fileName = 'payslip_'.$payroll->employee->employee_id.'_('.$payroll->pay_period_start->format('Y-m-d').'-'.$payroll->pay_period_end->format('Y-m-d').').pdf';
            $filePath = 'payslips/'.$fileName;

            Storage::disk('public')->put($filePath, $pdf->output());

            Log::channel('payroll_logs')->info('PDF regenerated and saved', ['file_path' => $filePath]);

            $payslip = Payslip::updateOrCreate(
                [
                    'payroll_id' => $payroll->id,
                ],
                [
                    'employee_id' => $payroll->employee_id,
                    'file_path' => $filePath,
                    'status' => $payroll->status ?? 'Approved',
                    'notes' => $request->notes,
                ]
            );

            Log::channel('payroll_logs')->info('Payslip record updated or created', [
                'payslip_id' => $payslip->id,
                'file_path' => $filePath,
            ]);

            return redirect()->back()->with([
                'success' => 'Payslip regenerated successfully.',
                'payslip_url' => Storage::url($filePath),
            ]);
        } catch (\Exception $e) {
            Log::channel('payroll_logs')->error('Payslip regeneration failed', [
                'payroll_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
            ]);

            return redirect()->back()->withErrors(['error' => 'Failed to regenerate payslip. Please check logs.']);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $jsonData = json_decode($request->getContent(), true) ?? [];
            Log::channel('payroll_logs')->debug('Incoming update request', [
                'payroll_id' => $id,
                'json_data' => $jsonData,
                'request_data' => $request->all(),
            ]);

            $validated = $request->validate([
                'total_working_days' => 'required|numeric|min:0|max:31',
                'allowance' => 'nullable|numeric|min:0',
                'holiday_pay' => 'nullable|numeric|min:0',
                'overtime_pay' => 'nullable|numeric|min:0',
                'night_diff_pay' => 'nullable|numeric|min:0',
                'withholding_tax' => 'required|numeric|min:0',
                'sss_deduction' => 'required|numeric|min:0',
                'philhealth_deduction' => 'required|numeric|min:0',
                'pagibig_deduction' => 'required|numeric|min:0',
                'absences_deduction' => 'required|numeric|min:0',
                'undertime_deduction' => 'nullable|numeric|min:0',
                'late_deduction' => 'nullable|numeric|min:0',
                'loan_deduction' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:500',
                'deductions_adjustments' => 'nullable|numeric|min:0',
                'gross_pay_adjustments' => 'nullable|numeric|min:0',
            ]);

            $payroll = Payroll::with('employee')->findOrFail($id);

            $validated = array_map(function ($value) {
                return is_numeric($value) ? (float) $value : $value;
            }, $validated);

            $salaryDayDivider = strtolower($payroll->pay_schedule) === 'weekly' ? 6 : 26;
            $basicSalary = (float) ($payroll->employee->basic_salary ?? 0);
            $dailyRate = $basicSalary > 0 ? $basicSalary / $salaryDayDivider : 0;

            $workedDays = $payroll->days_worked;
            if ($payroll->pay_schedule === 'weekly' && ($payroll->days_worked >= 5 || $payroll->hours_worked >= 45)) {
                $workedDays += 1;
            }

            $baseGross = $payroll->gross_pay ?? 0;
            $grossPay = $baseGross -
                        ($payroll->allowance ?? 0) -
                        ($payroll->holiday_pay ?? 0) -
                        ($payroll->overtime_pay ?? 0) -
                        ($payroll->gross_pay_adjustments ?? 0) -
                        ($payroll->night_diff_pay ?? 0) +
                        ($validated['allowance'] ?? 0) +
                        ($validated['holiday_pay'] ?? 0) +
                        ($validated['overtime_pay'] ?? 0) +
                        ($validated['night_diff_pay'] ?? 0) +
                        ($validated['gross_pay_adjustments'] ?? 0);

            $totalDeductions = ($validated['withholding_tax'] ?? 0) +
                              ($validated['sss_deduction'] ?? 0) +
                              ($validated['philhealth_deduction'] ?? 0) +
                              ($validated['pagibig_deduction'] ?? 0) +
                              ($validated['absences_deduction'] ?? 0) +
                              ($validated['late_deduction'] ?? 0) +
                              ($validated['undertime_deduction'] ?? 0) +
                              ($validated['loan_deduction'] ?? 0) +
                              ($validated['deductions_adjustments'] ?? 0);

            $netPay = $grossPay - $totalDeductions;

            $updateData = array_merge($validated, [
                'gross_pay' => round($grossPay, 2),
                'net_pay' => round($netPay, 2),
                'total_working_days' => round($validated['total_working_days'], 2),
                'deductions' => round($totalDeductions, 2),
            ]);

            $updated = $payroll->update($updateData);

            if (! $updated) {
                throw new \Exception('Failed to update payroll record');
            }

            Log::channel('payroll_logs')->info('Payroll updated successfully', [
                'payroll_id' => $id,
                'changes' => $updateData,
                'updated_by' => auth()->id(),
                'gross_pay' => $grossPay,
                'net_pay' => $netPay,
                'daily_rate' => $dailyRate,
                'worked_days' => $workedDays,
                'base_gross' => $baseGross,
            ]);

            return redirect()->back()->with([
                'success' => 'Payroll updated successfully.',
                'updated_data' => [
                    'gross_pay' => $grossPay,
                    'net_pay' => $netPay,
                ],
            ]);
        } catch (\Exception $e) {
            Log::channel('payroll_logs')->error('Payroll update failed', [
                'payroll_id' => $id,
                'input' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->withErrors(['error' => 'Failed to update payroll. '.$e->getMessage()])
                ->withInput();
        }
    }

    protected function calculate13thMonthPay($employee, $startDate, $endDate, $totalAbsences)
    {
        $monthlySalary = $employee->basic_salary ?? 0;
        $totalBasicEarnings = $monthlySalary;

        $salaryDayDivider = $employee->payroll_status === 'semi-monthly' ? 26 : 6;
        $dailyRate = $monthlySalary / $salaryDayDivider;
        $absenceDeduction = $totalAbsences * $dailyRate;

        $thirteenMonthPay = ($totalBasicEarnings - $absenceDeduction);

        return round($thirteenMonthPay, 2);
    }

    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();

        return redirect()->back();
    }

    protected function generatePayslipHtml($payroll)
    {
        return view('payslip.template', compact('payroll'))->render();
    }

    public function deductionHistory(Request $request)
    {
        $query = LoanPayrollDeduction::with('employee', 'employeeLoan', 'payroll')
            ->orderBy('deduction_date', 'desc');

        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('deduction_date', [
                Carbon::parse($request->start_date),
                Carbon::parse($request->end_date),
            ]);
        }

        // dd($query->get());
        $deductions = $query->get()->map(function ($deduction) {
            // dd($deduction);

            return [
                'id' => $deduction?->id,
                'employee' => [
                    'id' => $deduction?->employee?->id,
                    'first_name' => $deduction->employee->first_name,
                    'last_name' => $deduction->employee->last_name,
                    'employee_id' => $deduction->employee->employee_id,
                ],
                'employee_loan' => [
                    'id' => $deduction?->employeeLoan?->id,
                    'loan_type' => $deduction?->employeeLoan?->loan_type,
                    'is_fully_paid' => $deduction?->employeeLoan?->is_fully_paid,
                ],
                'payroll' => $deduction?->payroll,
                'amount_deducted' => $deduction?->amount_deducted,
                'deduction_date' => $deduction?->deduction_date,
                'notes' => $deduction?->notes,
            ];
        });

        $employees = Employee::select('id', 'first_name', 'last_name', 'employee_id')
            ->where('id', '!=', 1)
            ->whereIn('employment_status_id', [1, 5, 7, 6])
            ->get();

        Log::channel('payroll_logs')->info('Loan deduction history loaded', [
            'employee_id' => $request->employee_id,
            'deduction_count' => $deductions->count(),
        ]);

        return Inertia::render('Payroll/LoanDeductionHistory', [
            'deductions' => $deductions,
            'employees' => $employees,
            'auth' => [
                'user' => auth()->user(),
                'roles' => auth()->user()->roles,
            ],
            'errors' => $request->session()->get('errors') ? $request->session()->get('errors')->getBag('default')->getMessages() : (object) [],
        ]);
    }
}
