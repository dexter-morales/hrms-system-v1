<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAttendance extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'punch_in',
        'punch_out',
        'status',
        'notes',
        'break_hours',
        'overtime_hours',
        'undertime_hours',
        'site_id',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
