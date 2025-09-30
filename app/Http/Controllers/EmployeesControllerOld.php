<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Redirect;

class EmployeesControllerOld extends Controller
{
    public function store(Request $request)
    {
        Log::debug('Starting employee creation process', ['request_data' => $request->all()]);

        try {
            $validated = $request->validate([
                'employee_id' => 'required|unique:employees,employee_id',
                'username' => 'required|unique:users,username',
                'password' => 'required|min:8',
                'email' => 'required|email|unique:users,email',
                'department_id' => 'required|exists:departments,id',
                'site_id' => 'required|exists:sites,id',
                'position_id' => 'required|exists:positions,id',
                'last_name' => 'required|string',
                'first_name' => 'required|string',
                'middle_name' => 'nullable|string',
                'birthday' => 'required|date',
                'date_hired' => 'nullable|date',
                'end_of_contract' => 'nullable|date',
                'employment_status' => 'required|exists:employment_statuses,id',
                'basic_salary' => 'nullable|numeric|min:0',
                'daily_rate' => 'nullable|numeric|min:0',
                'payroll_status' => 'required|in:Weekly,Semi-monthly',
                'employment_type' => 'required|exists:employment_types,id',
                'allowance' => 'nullable|numeric|min:0',
                'head_or_manager' => 'nullable|exists:employees,employee_id',
                'status' => 'required|in:Active,Inactive',
                'role_access' => 'required|exists:role_accesses,id',
                'leave_credits' => 'nullable|numeric|min:0',
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $user = User::create([
                'email' => $validated['email'],
                'username' => $validated['username'],
                'password' => bcrypt($validated['password']),
                'status' => $validated['status'],
            ]);

            Log::info('User created successfully', ['user_id' => $user->id]);

            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_id' => $validated['employee_id'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'birthday' => $validated['birthday'],
                'date_hired' => $validated['date_hired'],
                'end_of_contract' => $validated['end_of_contract'],
                'department_id' => intval($validated['department_id']),
                'position_id' => intval($validated['position_id']),
                'site_id' => intval($validated['site_id']),
                'employment_status_id' => intval($validated['employment_status']),
                'employment_type_id' => intval($validated['employment_type']),
                'payroll_status' => $validated['payroll_status'],
                'basic_salary' => $validated['basic_salary'],
                'daily_rate' => $validated['daily_rate'],
                'allowance' => $validated['allowance'],
                'head_or_manager' => $validated['head_or_manager'],
                'leave_credits' => $validated['leave_credits'],
            ]);

            $user->assignRole($validated['role_access']);

            Log::info('Employee created successfully', ['employee_id' => $employee->employee_id]);

            DB::commit();

            return Redirect::route('employees.list')->with([
                'success' => 'Employee and user account successfully added.',
                'newUser' => $user->only(['id', 'email', 'username']),
                'newEmployee' => $employee->only(['id', 'employee_id', 'first_name', 'last_name']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating employee', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }
}
