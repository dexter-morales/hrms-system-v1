<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeePaymentMethod extends Model
{
    protected $table = 'employee_payment_methods';

    protected $fillable = [
        'employee_id', 'type', 'bank_name', 'bank_account_number', 'account_name',
        'ewallet_name', 'ewallet_number',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
}
