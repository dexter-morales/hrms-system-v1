<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'department_id',
        'level',
        'salary_grade',
        'is_active',
    ];

    // Each position can have many employees
    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    // Each position belongs to a department
    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
