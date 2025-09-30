<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    protected $table = 'leave_requests';

    protected $fillable = [
        'employee_id',
        'start_date',
        'end_date',
        'leave_type',
        'reason',
        'status',
        'image',
        'approved_by',
        'approved_at',
        'day',
        'approved_by_hr',
        'approved_hr_at',
        'rejected_by',
        'rejected_at',
        'rejected_by_hr',
        'rejected_hr_at',
        'isWithPay',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
