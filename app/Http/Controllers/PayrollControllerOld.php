<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeOvertime;
use App\Models\Payroll;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayrollControllerOld extends Controller
{
    public function index()
    {
        $payrolls = Payroll::with('employee')->get();

        return inertia('Payroll/PayrollComponent', [
            'payrolls' => $payrolls,
        ]);
    }

    // Helper: Calculate SSS deduction (employee share)
    protected function calculateSssDeduction($monthlySalary)
    {
        $msc = min(max($monthlySalary, 4000), 30000); // MSC: ₱4,000 to ₱30,000
        $employeeShare = $msc * 0.045; // 4.5% employee share

        return round($employeeShare, 2);
    }

    // Helper: Calculate PhilHealth deduction (employee share)
    protected function calculatePhilHealthDeduction($monthlySalary)
    {
        $contribution = $monthlySalary * 0.05; // 5% of monthly salary
        $employeeShare = min(max($contribution / 2, 500 / 2), 2500 / 2); // Shared equally, min ₱250, max ₱1250

        return round($employeeShare, 2);
    }

    // Helper: Calculate Pag-IBIG deduction (employee share)
    protected function calculatePagIbigDeduction($monthlySalary)
    {
        $contribution = min($monthlySalary, 10000) * 0.02; // 2% of salary, capped at ₱10,000
        $employeeShare = min($contribution, 200); // Max ₱200

        return round($employeeShare, 2);
    }

    // Helper: Calculate Withholding Tax (simplified BIR table)
    protected function calculateWithholdingTax($taxableIncome)
    {
        if ($taxableIncome <= 20833) {
            return 0; // Tax-exempt
        } elseif ($taxableIncome <= 33333) {
            return ($taxableIncome - 20833) * 0.15;
        } elseif ($taxableIncome <= 66667) {
            return 1875 + ($taxableIncome - 33333) * 0.20;
        } elseif ($taxableIncome <= 166667) {
            return 8541.80 + ($taxableIncome - 66667) * 0.25;
        } elseif ($taxableIncome <= 666667) {
            return 33541.80 + ($taxableIncome - 166667) * 0.30;
        } else {
            return 183541.80 + ($taxableIncome - 666667) * 0.35;
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
        $paySchedule = $request->pay_schedule_type;
        $daysInPeriod = $startDate->diffInDays($endDate) + 1;
        $daysInMonth = $startDate->daysInMonth;

        $employees = Employee::where('payroll_status', $paySchedule)->get();

        foreach ($employees as $employee) {
            try {
                // Prorate salary for the period
                $monthlySalary = $employee->basic_salary;
                $basePay = ($monthlySalary / $daysInMonth) * $daysInPeriod;

                // Calculate overtime pay
                $overtimeHours = EmployeeOvertime::where('employee_id', $employee->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->where('status', 'approved')
                    ->sum('approved_hours');
                $hourlyRate = $monthlySalary / (21.75 * 8); // 21.75 working days, 8 hours/day
                $overtimePay = $overtimeHours * $hourlyRate * 1.5;

                $grossPay = $basePay + $overtimePay;

                // Calculate deductions based on full monthly salary
                $sssDeduction = $this->calculateSssDeduction($monthlySalary);
                $philhealthDeduction = $this->calculatePhilHealthDeduction($monthlySalary);
                $pagibigDeduction = $this->calculatePagIbigDeduction($monthlySalary);

                // Prorate deductions for the period
                $proratedSss = ($sssDeduction / $daysInMonth) * $daysInPeriod;
                $proratedPhilhealth = ($philhealthDeduction / $daysInMonth) * $daysInPeriod;
                $proratedPagibig = ($pagibigDeduction / $daysInMonth) * $daysInPeriod;

                // Calculate withholding tax
                $taxableIncome = $monthlySalary - ($sssDeduction + $philhealthDeduction + $pagibigDeduction);
                $withholdingTax = $this->calculateWithholdingTax($taxableIncome);
                $proratedTax = ($withholdingTax / $daysInMonth) * $daysInPeriod;

                $totalDeductions = $proratedSss + $proratedPhilhealth + $proratedPagibig + $proratedTax;
                $netPay = $grossPay - $totalDeductions;

                // Store payroll record
                Payroll::updateOrCreate([
                    'employee_id' => $employee->id,
                    'pay_period_start' => $startDate,
                    'pay_period_end' => $endDate,
                ], [
                    'gross_pay' => $grossPay,
                    'sss_deduction' => $proratedSss,
                    'philhealth_deduction' => $proratedPhilhealth,
                    'pagibig_deduction' => $proratedPagibig,
                    'withholding_tax' => $proratedTax,
                    'deductions' => $totalDeductions,
                    'net_pay' => $netPay,
                    'payroll_schedule' => $paySchedule,
                ]);

                Log::info('Payroll generated for employee_id: '.$employee->id, [
                    'gross_pay' => $grossPay,
                    'deductions' => $totalDeductions,
                    'net_pay' => $netPay,
                    'sss' => $proratedSss,
                    'philhealth' => $proratedPhilhealth,
                    'pagibig' => $proratedPagibig,
                    'tax' => $proratedTax,
                ]);
            } catch (\Exception $e) {
                Log::error('Payroll generation error for employee_id: '.$employee->id, ['error' => $e->getMessage()]);
            }
        }

        return redirect()->back()->with('success', 'Payroll generated successfully.');
    }
}
