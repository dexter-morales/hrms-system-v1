<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeLoan extends Model
{
    protected $table = 'employee_loans';

    protected $fillable = [
        'employee_id',
        'amount',
        'loan_type',
        'terms',
        'notes',
        'status',
        'approved_by',
        'image',
        'deduction_frequency', // Add the new field
        'is_fully_paid',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'terms' => 'integer',
        'deduction_frequency' => 'string', // Cast as string for enum
        'is_fully_paid' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function payments()
    {
        return $this->hasMany(LoanPayment::class, 'loan_id');
    }

    public function loanDeductions()
    {
        return $this->hasMany(LoanPayrollDeduction::class, 'employee_loan_id', 'id');
    }
}
