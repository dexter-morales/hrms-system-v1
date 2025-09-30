<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessTravel extends Model
{
    protected $table = 'business_travels';

    protected $fillable = [
        'employee_id',
        'date_from',
        'date_to',
        'time_from',
        'time_to',
        'location',
        'reason',
        'attach_supporting_document',
        'status',
        'approved_by',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
