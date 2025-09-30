<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Payroll extends Model
{
    use LogsActivity;

    protected $fillable = [
        'employee_id',
        'pay_period_start',
        'pay_period_end',
        'gross_pay',
        'deductions',
        'net_pay',
        'pay_schedule',
        'sss_deduction',
        'philhealth_deduction',
        'pagibig_deduction',
        'withholding_tax',
        'weekend_pay',
        'holiday_pay',
        'allowance',
        'late_deduction',
        'base_pay',
        'base_pay2',
        'days_worked',
        'hours_worked',
        'late_hours',
        'overtime_pay',
        'total_working_days',
        'total_absences',
        'absences_deduction',
        'status',
        'notes',
        'approved_at',
        'approved_by',
        'overtime_hours',
        'leave_with_pay',
        'leave_days',
        'undertime_deduction',
        'undertime_hours',
        'night_diff_hours',
        'night_diff_pay',
        'gross_pay_adjustments',
        'deductions_adjustments',
        'site_id',
        'loan_deduction',
    ];

    protected $casts = [
        'pay_period_start' => 'date',
        'pay_period_end' => 'date',
        'gross_pay' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'sss_deduction' => 'decimal:2',
        'philhealth_deduction' => 'decimal:2',
        'pagibig_deduction' => 'decimal:2',
        'withholding_tax' => 'decimal:2',
        'weekend_pay' => 'decimal:2',
        'holiday_pay' => 'decimal:2',
        'allowance' => 'decimal:2',
        'late_deduction' => 'decimal:2',
        'base_pay' => 'decimal:2',
        'base_pay2' => 'decimal:2',
        'days_worked' => 'decimal:2',
        'hours_worked' => 'decimal:2',
        'late_hours' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'total_working_days' => 'decimal:2',
        'total_absences' => 'decimal:2',
        'absences_deduction' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'leave_with_pay' => 'decimal:2',
        'leave_days' => 'decimal:2',
        'undertime_deduction' => 'decimal:2',
        'undertime_hours' => 'decimal:2',
        'night_diff_hours' => 'decimal:2',
        'night_diff_pay' => 'decimal:2',
        'gross_pay_adjustments' => 'decimal:2',
        'deductions_adjustments' => 'decimal:2',
        'loan_deduction' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function loanDeductions()
    {
        return $this->hasMany(LoanPayrollDeduction::class);
    }

    /**
     * Required for Spatie Activitylog v4+
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                '*',
            ])
            ->logOnlyDirty()
            ->useLogName('payroll');
    }
}
