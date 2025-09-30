<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['employee_id', 'message', 'read_status', 'requester_employee_id', 'notification_type'];

    // protected $casts = [
    //     'notification_type'=> 'enum:Overtime,Leave,Loan,Payroll,COA,OB',

    // ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function requesterEmployee()
    {
        return $this->belongsTo(Employee::class, 'requester_employee_id');
    }
}
