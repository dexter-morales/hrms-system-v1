<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanPayrollDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'employee_loan_id',
        'employee_id',
        'amount_deducted',
        'deduction_date',
        'notes',
    ];

    protected $casts = [
        'deduction_date' => 'date',
        'amount_deducted' => 'decimal:2',
    ];

    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employeeLoan()
    {
        return $this->belongsTo(EmployeeLoan::class, 'employee_loan_id', 'id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
}
