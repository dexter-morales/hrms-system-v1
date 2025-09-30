<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $table = 'attendance_logs';

    protected $fillable = [
        'employee_id',
        'attendance_id',
        'timestamp',
        'type',
        'location',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendance()
    {
        return $this->belongsTo(EmployeeAttendance::class);
    }
}
