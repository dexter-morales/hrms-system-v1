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
use Illuminate\Support\Facades\Storage;

class PayrollControllerOldOldOld extends Controller
{
    public function index(Request $request)
    {
        $query = Payroll::with('employee.site', 'employee.position');

        if ($request->site_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('site_id', $request->site_id);
            });
        }

        $payrolls = $query->get();

        $payPeriodStart = $payrolls->isNotEmpty() ? $payrolls->first()->pay_period_start : now()->startOfMonth();
        $payPeriodEnd = $payrolls->isNotEmpty() ? $payrolls->first()->pay_period_end : now()->endOfMonth();

        $attendances = EmployeeAttendance::whereBetween('date', [$payPeriodStart, $payPeriodEnd])->get();
        $holidays = Holiday::whereBetween('date_holiday', [$payPeriodStart, $payPeriodEnd])->get();
        $schedules = EmployeeSchedule::all();
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

    /**
     * Get SSS Employee Share based on January 2025 table
     * Assumes standard employee with no WISP/MPF voluntary adjustments
     *
     * @return array ['msc' => float, 'sss_ee' => float, 'mdf' => float, 'total_ee' => float]
     */
    public function getSss2025Contribution(float $monthlySalary): array
    {
        // MSCs range from 5,000 to 35,000 in ₱500 steps
        $mscBrackets = [];
        for ($msc = 5000; $msc <= 35000; $msc += 500) {
            $rangeMin = $msc - 250;
            $rangeMax = $msc + 249.99;

            // Regular SSS EE is 5% of MSC up to ₱20,000 only
            $sssBase = min($msc, 20000);
            $sss_ee = round($sssBase * 0.05, 2);

            // MDF (5%) applies only on portion exceeding ₱20,000, if MSC >= 20,250
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

        // Match salary to MSC bracket
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

        // If salary exceeds ₱34,750, cap at ₱35,000
        return [
            'msc' => 35000,
            'sss_ee' => 1000.00, // 5% of 20k
            'mdf' => 750.00,     // 5% of excess 15k
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
        // $contribution = min($monthlySalary, 10000) * 0.02;
        // return round(min($contribution, 200), 2);

        if ($monthlySalary <= 1500) {
            // 1% for minimum wage earners
            return round($monthlySalary * 0.01, 2);
        }

        // 2% of capped ₱5,000 fund salary (max ₱100)
        return 100.00;
    }

    protected function calculateWithholdingTax($taxableIncome, $payrollStatus = 'monthly')
    {

        switch (strtolower($payrollStatus)) {
            case 'semi-monthly':
                return $this->calculateSemiMonthlyTax($taxableIncome);
            case 'weekly':
                return $this->calculateWeeklyTax($taxableIncome);
                // case 'daily':
                //     return $this->calculateDailyTax($taxableIncome);
            default: // monthly
                return $this->calculateSemiMonthlyTax($taxableIncome);
        }

    }

    // protected function calculateMonthlyTax($taxableIncome)
    // {
    //     if ($taxableIncome <= 20833) return 0;
    //     elseif ($taxableIncome <= 33332) return ($taxableIncome - 20833) * 0.20;
    //     elseif ($taxableIncome <= 66666) return 2500 + ($taxableIncome - 33332) * 0.25;
    //     elseif ($taxableIncome <= 166666) return 10833.33 + ($taxableIncome - 66667) * 0.30;
    //     elseif ($taxableIncome <= 666666) return 40833.33 + ($taxableIncome - 166667) * 0.32;
    //     else return 200833.33 + ($taxableIncome - 666667) * 0.35;
    // }

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

    // protected function calculateDailyTax($taxableIncome)
    // {
    //     if ($taxableIncome <= 961) return 0;
    //     elseif ($taxableIncome <= 1538) return ($taxableIncome - 961) * 0.20;
    //     elseif ($taxableIncome <= 3077) return 115.38 + ($taxableIncome - 1538) * 0.25;
    //     elseif ($taxableIncome <= 7692) return 500 + ($taxableIncome - 3077) * 0.30;
    //     elseif ($taxableIncome <= 30769) return 1884.62 + ($taxableIncome - 7692) * 0.32;
    //     else return 9269.23 + ($taxableIncome - 30769) * 0.35;
    // }

    // protected function calculateWeekendPay($paySchedule, $employee, $attendances, $hourlyRate) {
    //     if ($paySchedule === 'weekly' && $employee->employment_type === 'full-time') {
    //         $weekendPay = $attendances->filter(function ($attendance) {
    //             return in_array(Carbon::parse($attendance->date)->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]);
    //         })->sum(function ($attendance) use ($hourlyRate, $employee) {
    //             $dayOfWeek = Carbon::parse($attendance->date)->dayOfWeek;

    //             $multiplier = 1.0;
    //             if (!$employee->roleAccess || $employee->roleAccess->name !== 'Manager') {
    //                 $multiplier = ($dayOfWeek === Carbon::SATURDAY ? 1.30 :
    //                             ($dayOfWeek === Carbon::SUNDAY ? 1.25 : 1.0));
    //             }
    //             return $attendance->hours_worked * $hourlyRate * $multiplier;
    //         });
    //     }
    //     return $weekendPay;
    // }

    protected function calculateWeekendPay($paySchedule, $employee, $attendances, $hourlyRate)
    {
        // dump($attendances);
        // dump("Employee", $employee->employee_id);
        $weekendPay = 0; // Initialize to avoid undefined variable on return

        $weekendPay = $attendances->filter(function ($attendance) {
            return in_array(Carbon::parse($attendance->date)->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]);
        })->sum(function ($attendance) use ($hourlyRate, $employee) {
            $dayOfWeek = Carbon::parse($attendance->date)->dayOfWeek;
            // dump("dayOfWeek: ", $dayOfWeek);
            $multiplier = 1.0;
            if (! $employee->roleAccess || strtolower($employee->roleAccess->name) !== 'manager') {
                $multiplier = ($dayOfWeek === Carbon::SATURDAY ? 1.30 :
                            ($dayOfWeek === Carbon::SUNDAY ? 1.25 : 1.0));
            }

            // dump("multiplier", $multiplier);
            // dump("Data", $attendance->hours_worked);
            // dump("hourlyRate", $hourlyRate);
            // dump("total", $attendance->hours_worked * $hourlyRate * $multiplier);
            return $attendance->hours_worked * $hourlyRate * $multiplier;
        });

        return $weekendPay;
    }

    public function getWeeklyCutoffType(Carbon $endDate): string
    {
        // Get week of the month (1 to 5)
        $firstDayOfMonth = $endDate->copy()->startOfMonth();
        $dayOfMonth = $endDate->day;
        $weekOfMonth = (int) ceil(($dayOfMonth + $firstDayOfMonth->copy()->dayOfWeek) / 7);

        switch ($weekOfMonth) {
            case 1: return '1st-week';   // tax only
            case 2: return '2nd-week';   // tax + SSS
            case 3: return '3rd-week';   // tax only
            case 4: return '4th-week';   // tax + PHIC + Pag-IBIG
            default: return 'extra-week'; // 5th week if applicable
        }
    }

    public function getCustomSemiMonthlyCutoffType(Carbon $startDate, Carbon $endDate): ?string
    {
        // Get the 10th and 25th of the endDate's month
        $tenth = Carbon::create($endDate->year, $endDate->month, 10);
        $twentyFifth = Carbon::create($endDate->year, $endDate->month, 25);

        if ($endDate->lessThanOrEqualTo($tenth)) {
            return '1st-half'; // May 26 – June 10
        } elseif ($endDate->lessThanOrEqualTo($twentyFifth)) {
            return '2nd-half'; // June 11 – June 25
        } else {
            return null; // Outside defined range (maybe June 26 – July 10)
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

        // $employees = Employee::where('payroll_status', $paySchedule)->where('id', 1)->get();
        $employees = Employee::where('payroll_status', $paySchedule)->get();
        $holidays = Holiday::whereBetween('date_holiday', [$startDate, $endDate])->get();

        $GRACE_PERIOD_MINUTES = 15;

        foreach ($employees as $employee) {
            try {
                $monthlySalary = $employee->basic_salary;
                $hourlyRate = $monthlySalary / (26 * 8); // 208 hours/month
                $dailyRate = $monthlySalary / 26;

                // Calculate total_working_days
                $totalWorkingDays = 0;
                $currentDate = $startDate->copy();
                while ($currentDate->lte($endDate)) {
                    $dayKey = strtolower($currentDate->format('D'));
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
                        $dayKey = strtolower($date->format('D'));

                        $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                            ->where('effective_from', '<=', $attendance->date)
                            ->where('effective_until', '>=', $attendance->date)
                            ->orderBy('effective_from', 'desc')
                            ->first();

                        $workingDays = $schedule ? json_decode($schedule->working_days, true) : ['mon', 'tue', 'wed', 'thu', 'fri'];
                        $startTime = '09:00:00';
                        $endTime = '17:00:00';
                        $expectedHours = 8.00;

                        if ($schedule && $schedule->schedule_type === 'fixed') {
                            // if (!in_array($dayKey, $workingDays)) {
                            //     $attendance->hours_worked = 0;
                            //     $attendance->late_hours = 0;
                            //     return $attendance;
                            // }
                            $startTime = $schedule->start_time;
                            $endTime = $schedule->end_time;
                            $expectedHours = (Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime)) / 60) - $breakHours;
                        } elseif ($schedule && $schedule->schedule_type === 'flexible') {
                            // if (!isset($workingDays[$dayKey])) {
                            //     $attendance->hours_worked = 0;
                            //     $attendance->late_hours = 0;
                            //     return $attendance;
                            // }
                            $startTime = $workingDays[$dayKey][0].':00';
                            $endTime = $workingDays[$dayKey][1].':00';
                            $expectedHours = (Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime)) / 60) - $breakHours;
                        }

                        if ($punchOut->lte($punchIn)) {
                            $attendance->hours_worked = 0;
                            $attendance->late_hours = round($expectedHours, 2);
                        } else {
                            $workedHours = ($punchIn->diffInMinutes($punchOut) / 60) - $breakHours;
                            $attendance->hours_worked = round(max($workedHours, 0), 2);
                            $attendance->late_hours = round(max(0, $expectedHours - $attendance->hours_worked), 2);

                            $expectedStart = Carbon::parse($attendance->date.' '.$startTime);
                            $graceEnd = $expectedStart->copy()->addMinutes($GRACE_PERIOD_MINUTES);
                            if ($punchIn->gt($graceEnd)) {
                                $lateMinutes = $expectedStart->diffInMinutes($punchIn);
                                $attendance->late_hours = round($lateMinutes / 60, 2);
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

                // Base pay
                $basePay = $dailyRate * $daysWorked;
                $basePay2 = $dailyRate * $totalWorkingDays;

                // Weekend pay
                $weekendPay = $this->calculateWeekendPay($paySchedule, $employee, $attendances, $hourlyRate);

                // dump("Weekend Pay: " . $weekendPay);

                // Leave pay
                $leaveDays = Leave::where('employee_id', $employee->id)
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
                $leavePay = $leaveDays * $dailyRate;

                $overtimePay = 0;
                $holidayPay = 0;

                // if (!$employee->roleAccess || strtolower($employee->roleAccess->name) !== 'manager') {

                //     // Overtime pay
                //     $overtimeHours = EmployeeOvertime::where('employee_id', $employee->id)
                //         ->whereBetween('date', [$startDate, $endDate])
                //         ->where('status', 'approved')
                //         ->sum('approved_hours');

                //         $overtimePay = $overtimeHours * $hourlyRate * 1.25; // 25% OT rate

                //     // Holiday pay
                //     if ($paySchedule === 'semi-monthly' && strtolower($employee->roleAccess->name) !== 'manager') {
                //         foreach ($holidays as $holiday) {
                //             $attendance = $attendances->firstWhere('date', $holiday->date_holiday);
                //             $hoursOnHoliday = $attendance ? $attendance->hours_worked : 0;
                //             if ($holiday->holiday_type === 'Regular Holiday') {
                //                 $holidayPay += $hoursOnHoliday * $hourlyRate; // 100% extra
                //             } else {
                //                 $holidayPay += $hoursOnHoliday * $hourlyRate * 0.30; // 30% extra
                //             }
                //         }
                //     }
                // }

                if (! $employee->roleAccess || strtolower($employee->roleAccess->name) !== 'manager') {
                    // Calculate base daily rate and hourly rate
                    $dailyRate = $employee->basic_salary / 26; // Assuming 26 working days per month
                    $baseHourlyRate = $dailyRate / 8; // Base hourly rate (8 hours per day)

                    // Overtime pay with holiday and rest day considerations
                    $overtimeHours = EmployeeOvertime::where('employee_id', $employee->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->where('status', 'approved')
                        ->get(); // Fetch all approved overtime records to process individually

                    $overtimePay = 0;

                    foreach ($overtimeHours as $overtime) {
                        $date = $overtime->date;
                        $excessHours = $overtime->approved_hours;
                        $isRestDay = date('N', strtotime($date)) >= 6; // 6 = Saturday, 7 = Sunday
                        $holiday = $holidays->firstWhere('date_holiday', $date);

                        // Determine the overtime hourly rate based on date and holiday type
                        $otHourlyRate = $baseHourlyRate;

                        if ($holiday) {
                            switch ($holiday->holiday_type) {
                                case 'Regular Holiday':
                                    $otHourlyRate = ($dailyRate * 2 / 8) * 1.3; // Double daily rate / 8 * 1.3
                                    break;
                                case 'Special Working':
                                    $otHourlyRate = ($dailyRate * 1 / 8) * 1.3; // Normal daily rate / 8 * 1.3
                                    break;
                                case 'Special Non Working':
                                    $otHourlyRate = ($dailyRate * 1.3 / 8) * 1.3; // 1.3x daily rate / 8 * 1.3
                                    if ($isRestDay) {
                                        $otHourlyRate = ($dailyRate * 1.5 / 8) * 1.3; // 1.5x daily rate / 8 * 1.3
                                    }
                                    break;
                            }
                            if ($holiday->holiday_type === 'Regular Holiday' && $isRestDay) {
                                $otHourlyRate = ($dailyRate * 2.6 / 8) * 1.3; // 2.6x daily rate / 8 * 1.3
                            }
                        } else {
                            if ($isRestDay) {
                                if (date('N', strtotime($date)) === 6) { // Saturday
                                    $otHourlyRate = ($dailyRate * 1.3 / 8) * 1.3; // 1.3x daily rate / 8 * 1.3
                                } elseif (date('N', strtotime($date)) === 7) { // Sunday
                                    $otHourlyRate = ($dailyRate * 1.25 / 8) * 1.25; // 1.25x daily rate / 8 * 1.25
                                }
                            } else {
                                $otHourlyRate = ($dailyRate * 1 / 8) * 1.25; // Normal day OT rate
                            }
                        }

                        // Add overtime pay for this entry
                        $overtimePay += $excessHours * $otHourlyRate;
                    }

                    // Holiday pay (unchanged logic for non-managers, semi-monthly)
                    $holidayPay = 0;
                    if ($paySchedule === 'semi-monthly' && strtolower($employee->roleAccess->name) !== 'manager') {
                        foreach ($holidays as $holiday) {
                            $attendance = $attendances->firstWhere('date', $holiday->date_holiday);
                            $hoursOnHoliday = $attendance ? $attendance->hours_worked : 0;
                            if ($holiday->holiday_type === 'Regular Holiday') {
                                $holidayPay += $hoursOnHoliday * $hourlyRate; // 100% extra
                            } else {
                                $holidayPay += $hoursOnHoliday * $hourlyRate * 0.30; // 30% extra
                            }
                        }
                    }
                }

                // $grossPay = $basePay2 + $weekendPay + $overtimePay + $holidayPay + $allowance + $leavePay;

                $grossPay = floatval($basePay2) + floatval($weekendPay) +
                floatval($overtimePay) + floatval($holidayPay) +
                floatval($allowance) + floatval($leavePay);

                // Deductions based on pay schedule
                // $sssDeduction = $this->calculateSssDeduction($monthlySalary);

                $sssDeduction = $this->getSss2025Contribution($monthlySalary)['sss_ee'];
                $philhealthDeduction = $this->calculatePhilHealthDeduction($monthlySalary);
                $pagibigDeduction = $this->calculatePagIbigDeduction($monthlySalary);
                $lateDeduction = $lateHours * $hourlyRate;

                // $proratedSss = $sssDeduction;
                // $proratedPhilhealth = $philhealthDeduction;
                // $proratedPagibig = $pagibigDeduction;
                $proratedLateDeduction = $lateDeduction;

                if (strtolower($paySchedule) === 'semi-monthly') {
                    $taxableSalary = $monthlySalary / 2;
                } else {
                    $taxableSalary = $monthlySalary;
                }

                // dump("Taxable Salary: ", $taxableSalary);

                // dump("Base Pay 2: ", $basePay2);
                // dump("Weekend Pay: ", $weekendPay);
                // dump("Overtime Pay: ", $overtimePay);
                // dump("Holiday Pay: ", $holidayPay);

                $taxableIncome = $taxableSalary + $weekendPay + $overtimePay + $holidayPay;
                // dump("Taxable Income: ", $taxableIncome);

                $withholdingTax = $this->calculateWithholdingTax($taxableIncome, $paySchedule);

                // dd("withholdingTax: ", $withholdingTax);
                // dump("PaySchedul: ", $paySchedule);
                // dd("withholdingTax: ", $withholdingTax);

                // if ($paySchedule === 'semi-monthly') {
                //     $proratedSss = $sssDeduction * ($daysInPeriod / 30); // Every 15th and 30th
                //     $proratedPhilhealth = ($philhealthDeduction / 2) * ($daysInPeriod / 30); // Every 30th
                //     $proratedPagibig = ($pagibigDeduction / 2) * ($daysInPeriod / 30); // Every 30th
                // } elseif ($paySchedule === 'weekly' && $employee->employment_type === 'full-time') {
                //     $proratedSss = ($sssDeduction / 4) * ($daysInPeriod / 7); // Every 2nd week
                //     $proratedPhilhealth = ($philhealthDeduction / 4) * ($daysInPeriod / 7); // Every 4th week
                //     $proratedPagibig = ($pagibigDeduction / 4) * ($daysInPeriod / 7); // Every 4th week
                // } elseif ($paySchedule === 'weekly' && $employee->employment_type === 'project-based') {
                //     $proratedSss = 0; // No SSS for project-based
                //     $proratedPhilhealth = 0; // No Philhealth for project-based
                //     $proratedPagibig = 0; // No Pag-ibig for project-based
                // }

                $cutoffType = null;
                if ($paySchedule === 'semi-monthly') {
                    $cutoffType = $this->getCustomSemiMonthlyCutoffType($startDate, $endDate);
                }

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
                } elseif ($paySchedule === 'weekly' && $employee->employment_type === 'full-time') {
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
                } elseif ($paySchedule === 'weekly' && strtolower($employee->employment_type) === 'project based') {
                    $proratedSss = 0;
                    $proratedPhilhealth = 0;
                    $proratedPagibig = 0;
                    $proratedTax = $withholdingTax;

                }

                // $proratedTax = ($withholdingTax / $daysInMonth) * $daysInPeriod;

                // if ($paySchedule === 'semi-monthly') {
                //     $proratedTax = $withholdingTax * ($daysInPeriod / 30); // Every 15th
                // } elseif ($paySchedule === 'weekly' && $employee->employment_type === 'full-time') {
                //     $proratedTax = ($withholdingTax / 4) * ($daysInPeriod / 7); // Every week
                // } elseif ($paySchedule === 'weekly' && $employee->employment_type === 'project-based') {
                //     $proratedTax = ($withholdingTax / 4) * ($daysInPeriod / 7); // Every week
                // }

                $totalAbsences = $totalWorkingDays - $daysWorked - $leaveDays;
                $absencesDeduction = $totalAbsences * $dailyRate;

                $totalDeductions = $proratedSss + $proratedPhilhealth + $proratedPagibig + $proratedTax + $proratedLateDeduction + $absencesDeduction;
                $netPay = $grossPay - $totalDeductions;

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
                    'total_absences' => $totalAbsences,
                    'hours_worked' => $hoursWorked,
                    'late_hours' => $lateHours,
                    'leave_days' => $leaveDays,
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
            } catch (\Exception $e) {
                Log::error('Payroll generation error for employee_id: '.$employee->id, ['error' => $e->getMessage()]);
            }
        }

        // dd('Payroll generated successfully.');
        return redirect()->back()->with('success', 'Payroll generated successfully.');
    }

    public function update(Request $request, $id)
    {
        try {
            $jsonData = json_decode($request->getContent(), true) ?? [];
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

            \Log::info('Generating payslip PDF in landscape');
            $pdf = Pdf::loadView('payslip.template', [
                'company_settings' => CompanySetting::first(),
                'payroll' => $payroll,
                'notes' => $request->notes,
            ])->setPaper('a4', 'landscape')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            $fileName = 'payslip_'.$payroll->employee->employee_id.'_'.now()->format('Y-m').'.pdf';
            $filePath = 'payslips/'.$fileName;

            \Log::info('Saving PDF to storage', ['file_path' => $filePath]);
            Storage::disk('public')->put($filePath, $pdf->output());

            \Log::info('Creating payslip record');
            $payslip = Payslip::create([
                'employee_id' => $payroll->employee_id,
                'payroll_id' => $payroll->id,
                'file_path' => $filePath,
                'status' => 'Approved',
                'notes' => $request->notes,
            ]);
            \Log::debug('Payslip created', ['payslip' => $payslip->toArray()]);

            \Log::info('Updating payroll status to approved');
            $updateResult = $payroll->update([
                'status' => 'Approved',
                'notes' => $request->notes,
                'approved_at' => now(),
                'approved_by' => auth()->id(),
            ]);

            \Log::debug('Payroll update result', ['result' => $updateResult, 'updated_payroll' => $payroll->fresh()->toArray()]);

            if (! $updateResult) {
                throw new \Exception('Failed to update payroll status');
            }

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
