<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanPayment extends Model
{
    protected $fillable = ['loan_id', 'amount_paid', 'payment_date', 'notes'];

    public function loan()
    {
        return $this->belongsTo(EmployeeLoan::class, 'loan_id');
    }
}
