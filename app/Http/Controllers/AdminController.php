<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\EmploymentType;
use App\Models\LeaveType;
use App\Models\Position;
use App\Models\RoleAccess;
use App\Models\Site;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        return Inertia::render('Employees/EmployeeList', [
            'departments' => Department::all(),
            // 'employees' => Employee::all(),

            'employees' => Employee::where('role_access_id', '!=', 1)->with([
                'user',
                'department',
                'site',
                'position',
                'employmentType',
                'employmentStatus',
                'leaveCredits',
                'roleAccess',
                'paymentMethods',
            ])->get(),

            'positions' => Position::all(),
            'sites' => Site::all(),
            'heads_managers' => Employee::where('head_or_manager', null)->get(),
            'employment_types' => EmploymentType::all(),
            'employment_status' => EmploymentStatus::all(),
            'role_access' => RoleAccess::all(),
            'leaveTypes' => LeaveType::all(),
            'generated_employee_id' => Employee::generateNextEmployeeId(),
            'generated_superAdmin_id' => Employee::generateNextSuperAdminId(),
            // 'leave_credits' => EmployeeLeaveCredits::where()

        ]);
    }
}
