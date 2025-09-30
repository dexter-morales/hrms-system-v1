<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeSchedule extends Model
{
    protected $fillable = [
        'employee_id',
        'schedule_type',
        'working_days',
        'start_time',
        'end_time',
        'effective_from',
        'effective_until',
    ];

    protected $casts = [
        'working_days' => 'array',
        'effective_from' => 'date',
        'effective_until' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // public function getWorkingDaysAttribute($value)
    // {
    //     if (is_string($value)) {
    //         $decoded = json_decode($value, true);
    //         return is_array($decoded) ? $decoded : [];
    //     }
    //     return is_array($value) ? $value : [];
    // }
}
