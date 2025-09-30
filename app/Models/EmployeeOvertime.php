<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeOvertime extends Model
{
    protected $fillable = [
        'employee_id',
        'manager_id',
        'date',
        'requested_hours',
        'approved_hours',
        'status',
        'notes',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }
}
