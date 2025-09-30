<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeLeaveCredits extends Model
{
    protected $table = 'employee_leave_credits';

    protected $guarded = ['id'];

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'credits',
    ];

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
