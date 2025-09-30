<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateAttendance extends Model
{
    protected $table = 'certificate_attendances';

    protected $fillable = [
        'employee_id',
        'type',
        'reason',
        'other_reason',
        'entries',
        'image',
        'status',
        'approved_by',
    ];

    protected $casts = [
        'entries' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
