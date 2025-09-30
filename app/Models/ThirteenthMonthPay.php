<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThirteenthMonthPay extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'basic_earnings',
        'months_covered',
        'thirteenth_month_pay',
        'calculation_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'months_covered' => 'array', // Casts JSON to array for easier access
        'calculation_date' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the monthly earnings as an associative array (month => earnings).
     *
     * @return array
     */
    public function getMonthlyEarningsAttribute()
    {
        return collect($this->months_covered)->pluck('earnings', 'month')->toArray();
    }
}
