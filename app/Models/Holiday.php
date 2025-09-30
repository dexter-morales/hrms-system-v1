<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $table = 'holidays';

    protected $fillable = [
        'name_holiday',
        'date_holiday',
        'description',
        'holiday_type',
    ];
}
