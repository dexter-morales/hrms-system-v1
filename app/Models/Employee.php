<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Models\Role;

class Employee extends Model
{
    use HasFactory;
    use LogsActivity;

    protected static $logAttributes = ['*'];

    protected static $logOnlyDirty = true;

    protected static $logName = 'employee';

    protected $fillable = [
        'user_id',
        'employee_id',
        'username',
        'password',
        'email',
        'department_id',
        'site_id',
        'position_id',
        'last_name',
        'first_name',
        'middle_name',
        'birthday',
        'date_hired',
        'end_of_contract',
        'tenure',
        'employment_status_id',
        'basic_salary',
        'daily_rate',
        'payroll_status',
        'employment_type_id',
        'allowance',
        'head_or_manager',
        'status',
        'role_access_id',
        'leave_credits',
        'sss',
        'philhealth',
        'pagibig',
        'tin',
        'avatar',
        'employee_remarks',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'birthday' => 'date',
        'date_hired' => 'date',
        'end_of_contract' => 'date',
        'allowance' => 'float',
        'daily_rate' => 'float',
        'basic_salary' => 'float',
        'leave_credits' => 'float',
    ];

    public static function generateNextEmployeeId()
    {
        // Get the employee ID prefix from settings (assuming only one record exists)
        $employeePrefix = CompanySetting::value('employee_id_prefix') ?? 'EMP';

        // Get the last employee with that prefix
        $lastEmployee = Employee::where('employee_id', 'LIKE', $employeePrefix.'%')
            ->orderBy('employee_id', 'desc')
            ->first();

        if (! $lastEmployee) {
            return $employeePrefix.'001'; // Start from PREFIX001
        }

        // Extract numeric part and increment
        $lastNumber = intval(substr($lastEmployee->employee_id, strlen($employeePrefix)));
        $nextNumber = $lastNumber + 1;

        return $employeePrefix.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    public static function generateNextSuperAdminId()
    {
        // Get the employee ID prefix from settings (assuming only one record exists)
        $employeePrefix = 'SA';

        // Get the last employee with that prefix
        $lastEmployee = Employee::where('employee_id', 'LIKE', $employeePrefix.'%')
            ->orderBy('employee_id', 'desc')
            ->first();

        if (! $lastEmployee) {
            return $employeePrefix.'001'; // Start from PREFIX001
        }

        // Extract numeric part and increment
        $lastNumber = intval(substr($lastEmployee->employee_id, strlen($employeePrefix)));
        $nextNumber = $lastNumber + 1;

        return $employeePrefix.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    // public function department()
    // {
    //     return $this->belongsTo(Department::class);
    // }

    // public function user()
    // {
    //     return $this->belongsTo(User::class);
    // }

    // public function position() {
    //     return $this->belongsTo(Position::class);
    // }

    // public function site() {
    //     return $this->belongsTo(Site::class);
    // }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    // public function site()
    // {
    //     return $this->belongsTo(Site::class);
    // }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function employmentType()
    {
        return $this->belongsTo(EmploymentType::class);
    }

    public function roleAccess()
    {
        return $this->belongsTo(RoleAccess::class);
    }

    public function employmentStatus()
    {
        return $this->belongsTo(EmploymentStatus::class);
    }

    public function overtime()
    {
        return $this->hasMany(EmployeeOvertime::class);
    }

    public function attendance()
    {
        return $this->hasMany(EmployeeAttendance::class);
    }

    public function schedule()
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'model_has_roles', 'model_id', 'role_id')
            ->where('model_type', self::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function leaveCredits()
    {
        return $this->hasMany(EmployeeLeaveCredits::class);
    }

    public function certificates()
    {
        return $this->hasMany(CertificateAttendance::class);
    }

    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }

    public function businessTravels()
    {
        return $this->hasMany(BusinessTravel::class);
    }

    public function employeeLoans()
    {
        return $this->hasMany(EmployeeLoan::class);
    }

    public function paymentMethods()
    {
        return $this->hasMany(EmployeePaymentMethod::class, 'employee_id', 'id');
    }

    public function loanDeductions()
    {
        return $this->hasMany(LoanPayrollDeduction::class, 'employee_id', 'id');
    }

    /**
     * Required by Spatie Activity Log v4+
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*'])
            ->logOnlyDirty()
            ->useLogName('employee');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
