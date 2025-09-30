<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'allowance',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'allowance' => 'float',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
