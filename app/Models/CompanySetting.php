<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_name',
        'address',
        'email',
        'phone_number',
        'mobile_number',
        'company_logo',
        'employee_id_prefix',
        'thirteenth_month_pay_start',
        'thirteenth_month_pay_end',
    ];

    protected $casts = [
       'company_logo' => 'string',
       'thirteenth_month_pay_start' => 'date',
       'thirteenth_month_pay_end' => 'date',
    ];
}
