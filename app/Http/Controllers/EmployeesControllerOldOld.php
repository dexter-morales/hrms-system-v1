<?php

namespace App\Http\Controllers;

use App\Imports\EmployeeImportManual;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\EmploymentType;
use App\Models\LeaveType;
use App\Models\Position;
use App\Models\RoleAccess;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Storage;

class EmployeesControllerOldOld extends Controller
{
    // Validation rules for store method
    private $storeValidationRules = [
        'employee_id' => ['required', 'unique:employees,employee_id'],
        'username' => ['nullable', 'unique:users,username'],
        'password' => ['nullable', 'min:8'],
        'email' => ['nullable', 'email', 'unique:users,email'],
        'department_id' => ['required', 'exists:departments,id'],
        'site_id' => ['required', 'exists:sites,id'],
        'position_id' => ['required', 'exists:positions,id'],
        'last_name' => ['required', 'string'],
        'first_name' => ['required', 'string'],
        'middle_name' => ['nullable', 'string'],
        'birthday' => ['required', 'date'],
        'date_hired' => ['nullable', 'date'],
        'end_of_contract' => ['nullable', 'date'],
        'employment_status' => ['required', 'exists:employment_statuses,id'],
        'basic_salary' => ['nullable', 'numeric', 'min:0'],
        'daily_rate' => ['nullable', 'numeric', 'min:0'],
        'payroll_status' => ['required'],
        'employment_type' => ['required', 'exists:employment_types,id'],
        'allowance' => ['nullable', 'numeric', 'min:0'],
        'head_or_manager' => ['nullable', 'exists:employees,employee_id'],
        'status' => ['required'],
        'role_access' => ['required', 'exists:role_accesses,id'],
        'employee_remarks' => ['nullable', 'string', 'max:500'],
        'leave_credits' => ['nullable', 'array'],
        'leave_credits.*' => ['integer', 'min:0'],
        'sss' => ['nullable', 'string'],
        'philhealth' => ['nullable', 'string'],
        'pagibig' => ['nullable', 'string'],
        'tin' => ['nullable', 'string'],
        'employee_picture' => ['nullable', 'image', 'max:2048'],
    ];

    // Validation rules for update method (excluding employee_id, username, email)
    private $updateValidationRules = [
        'department_id' => ['required', 'exists:departments,id'],
        'site_id' => ['required', 'exists:sites,id'],
        'position_id' => ['required', 'exists:positions,id'],
        'last_name' => ['required', 'string'],
        'first_name' => ['required', 'string'],
        'middle_name' => ['nullable', 'string'],
        'birthday' => ['required', 'date'],
        'date_hired' => ['nullable', 'date'],
        'end_of_contract' => ['nullable', 'date'],
        'employment_status' => ['required', 'exists:employment_statuses,id'],
        'basic_salary' => ['nullable', 'numeric', 'min:0'],
        'daily_rate' => ['nullable', 'numeric', 'min:0'],
        'payroll_status' => ['required'],
        'employment_type' => ['required', 'exists:employment_types,id'],
        'allowance' => ['nullable', 'numeric', 'min:0'],
        'head_or_manager' => ['nullable', 'exists:employees,employee_id'],
        'status' => ['required'],
        'role_access' => ['required', 'exists:role_accesses,id'],
        'employee_remarks' => ['nullable', 'string', 'max:500'],
        'leave_credits' => ['nullable', 'array'],
        'leave_credits.*' => ['integer', 'min:0'],
        'sss' => ['nullable', 'string'],
        'philhealth' => ['nullable', 'string'],
        'pagibig' => ['nullable', 'string'],
        'tin' => ['nullable', 'string'],
        'employee_picture' => ['nullable', 'image', 'max:2048'],
        'password' => ['nullable', 'min:8'],
    ];

    /**
     * Display the employee list with related data.
     */
    public function index()
    {
        Log::debug('Fetching employee list');

        $employees = Employee::with([
            'user:id,email,username,status',
            'department:id,name',
            'site:id,name',
            'position:id,name',
            'employmentType:id,name',
            'employmentStatus:id,name',
        ])->select([
            'id', 'employee_id', 'user_id', 'first_name', 'last_name', 'middle_name',
            'birthday', 'date_hired', 'end_of_contract', 'department_id', 'position_id',
            'site_id', 'employment_status_id', 'employment_type_id', 'payroll_status',
            'basic_salary', 'daily_rate', 'allowance', 'head_or_manager', 'employee_remarks',
            'leave_credits',
        ])->get();

        Log::debug('Employee data fetched', [
            'employee_count' => $employees->count(),
            'employee_ids' => $employees->pluck('id')->toArray(),
        ]);

        return Inertia::render('Employees/EmployeeComponent', [
            'employees' => $employees,
            'departments' => Department::select('id', 'name')->get(),
            'positions' => Position::select('id', 'name')->get(),
            'sites' => Site::select('id', 'name')->get(),
            'heads_managers' => Employee::whereNull('head_or_manager')
                ->select('employee_id', 'first_name', 'last_name')
                ->get(),
            'employment_types' => EmploymentType::select('id', 'name')->get(),
            'employment_status' => EmploymentStatus::select('id', 'name')->get(),
            'role_access' => RoleAccess::select('id', 'name')->get(),
            'leaveTypes' => LeaveType::all(),
            'generate_employee_id' => Employee::generateNextEmployeeId(),
        ]);
    }

    /**
     * Store a new employee record.
     */
    public function store(Request $request)
    {
        Log::debug('Starting employee creation', ['request_data' => $request->all()]);

        try {
            // Merge static rules with dynamic Rule::in
            $validationRules = array_merge($this->storeValidationRules, [
                'payroll_status' => ['required', Rule::in(['Weekly', 'Semi-monthly'])],
                'status' => ['required', Rule::in(['Active', 'Inactive'])],
            ]);

            $validated = $request->validate($validationRules);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $userID = null;
            if (! empty($validated['email']) || (! empty($validated['username']) && ! empty($validated['password']))) {
                $user = User::create([
                    'email' => $validated['email'],
                    'username' => $validated['username'],
                    'password' => bcrypt($validated['password']),
                    'status' => $validated['status'],
                ]);
                $userID = $user->id;
                $user->assignRole(RoleAccess::find($validated['role_access'])->name);
                Log::info('User created', ['user_id' => $user->id]);
            }

            $avatarPath = null;
            if ($request->hasFile('employee_picture')) {
                $file = $request->file('employee_picture');
                $filename = $validated['employee_id'].'-'.time().'.'.$file->getClientOriginalExtension();
                $avatarPath = $file->storeAs('avatars', $filename, 'public');
                Log::info('Employee avatar uploaded', ['path' => $avatarPath]);
            }

            $employee = Employee::create([
                'user_id' => $userID,
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
                'employee_remarks' => $validated['employee_remarks'],
                'sss' => $validated['sss'],
                'philhealth' => $validated['philhealth'],
                'pagibig' => $validated['pagibig'],
                'tin' => $validated['tin'],
                'avatar' => $avatarPath,
            ]);

            Log::info('Employee created', ['employee_id' => $employee->employee_id, 'id' => $employee->id]);

            // Save leave credits
            if (! empty($validated['leave_credits'])) {
                foreach ($validated['leave_credits'] as $leaveTypeId => $credits) {
                    $employee->leaveCredits()->updateOrCreate(
                        [
                            'leave_type_id' => $leaveTypeId,
                            'employee_id' => $employee->id,
                        ],
                        ['credits' => $credits]
                    );
                }
            }

            DB::commit();

            return Redirect::route('employees.list')->with('success', 'Employee and user account successfully added.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating employee', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to create employee: '.$e->getMessage())->withInput();
        }
    }

    /**
     * Update an existing employee record.
     */
    public function update(Request $request, Employee $employee)
    {
        dd($request->all());
        Log::debug('Update request received', [
            'url' => $request->url(),
            'method' => $request->method(),
            'input' => $request->all(),
            'employee_id' => $employee->id,
            'employee_employee_id' => $employee->employee_id,
        ]);

        try {
            // Merge update rules with dynamic Rule::in
            $validationRules = array_merge($this->updateValidationRules, [
                'payroll_status' => ['required', Rule::in(['Weekly', 'Semi-monthly'])],
                'status' => ['required', Rule::in(['Active', 'Inactive'])],
            ]);

            $validated = $request->validate($validationRules);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            // Update user if email, username, or password is provided
            if ($employee->user && (! empty($validated['email']) || ! empty($validated['username']) || ! empty($validated['password']))) {
                $employee->user->update([
                    'email' => $validated['email'] ?? $employee->user->email,
                    'username' => $validated['username'] ?? $employee->user->username,
                    'password' => $validated['password'] ? bcrypt($validated['password']) : $employee->user->password,
                    'status' => $validated['status'],
                ]);
                $employee->user->syncRoles([RoleAccess::find($validated['role_access'])->name]);
            } elseif (! $employee->user && (! empty($validated['email']) || ! empty($validated['username']) || ! empty($validated['password']))) {
                $user = User::create([
                    'email' => $validated['email'],
                    'username' => $validated['username'],
                    'password' => bcrypt($validated['password'] ?? 'default_password'),
                    'status' => $validated['status'],
                ]);
                $employee->update(['user_id' => $user->id]);
                $user->assignRole(RoleAccess::find($validated['role_access'])->name);
                Log::info('User created for employee', ['user_id' => $user->id, 'employee_id' => $employee->employee_id]);
            }

            $avatarPath = $employee->avatar;
            if ($request->hasFile('employee_picture')) {
                if ($employee->avatar && Storage::disk('public')->exists($employee->avatar)) {
                    Storage::disk('public')->delete($employee->avatar);
                }
                $file = $request->file('employee_picture');
                $filename = $employee->employee_id.'-'.time().'.'.$file->getClientOriginalExtension();
                $avatarPath = $file->storeAs('avatars', $filename, 'public');
                Log::info('Employee avatar updated', ['path' => $avatarPath]);
            }

            $employee->update([
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
                'employee_remarks' => $validated['employee_remarks'],
                'role_access_id' => $validated['role_access'],
                'sss' => $validated['sss'],
                'philhealth' => $validated['philhealth'],
                'pagibig' => $validated['pagibig'],
                'tin' => $validated['tin'],
                'avatar' => $avatarPath,
            ]);

            // Sync leave credits
            if (! empty($validated['leave_credits'])) {
                foreach ($validated['leave_credits'] as $leaveTypeId => $credits) {
                    Log::debug('Processing leave credit', [
                        'employee_id' => $employee->id,
                        'leave_type_id' => $leaveTypeId,
                        'credits' => $credits,
                    ]);
                    $employee->leaveCredits()->updateOrCreate(
                        [
                            'leave_type_id' => $leaveTypeId,
                            'employee_id' => $employee->id,
                        ],
                        ['credits' => $credits]
                    );
                }
            }

            Log::info('Employee updated', ['employee_id' => $employee->employee_id, 'id' => $employee->id]);

            DB::commit();

            return Redirect::route('employees.list')->with('success', 'Employee updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating employee', [
                'employee_id' => $employee->employee_id ?? 'unknown',
                'id' => $employee->id ?? 'unknown',
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to update employee: '.$e->getMessage())->withInput();
        }
    }

    /**
     * Delete an employee record.
     */
    public function destroy($id)
    {
        Log::debug('Starting employee deletion', ['employee_id' => $id]);

        try {
            DB::beginTransaction();

            $employee = Employee::findOrFail($id);
            $employee->delete();

            Log::info('Employee deleted', ['employee_id' => $employee->employee_id, 'id' => $employee->id]);

            DB::commit();

            return Redirect::route('employees.list')->with('success', 'Employee deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting employee', [
                'employee_id' => $employee->employee_id ?? 'unknown',
                'id' => $employee->id ?? 'unknown',
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Failed to delete employee: '.$e->getMessage());
        }
    }

    /**
     * Import employees from an Excel file.
     */
    public function import(Request $request)
    {
        Log::info('Starting employee import', ['request' => $request->all()]);

        try {
            $request->validate([
                'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:2048'],
            ]);

            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            // Skip header row
            array_shift($rows);

            $importErrors = [];

            foreach ($rows as $index => $row) {
                $employeeData = [
                    'employee_id' => $row[0] ?? Employee::generateNextEmployeeId(),
                    'first_name' => $row[1],
                    'last_name' => $row[2],
                    'middle_name' => $row[3] ?? null,
                    'birthday' => $this->parseDate($row[4]),
                    'date_hired' => $this->parseDate($row[5]),
                    'end_of_contract' => $this->parseDate($row[6]),
                    'department' => $row[7],
                    'position' => $row[8],
                    'site' => $row[9],
                    'employment_status' => $row[10],
                    'employment_type' => $row[11],
                    'payroll_status' => $row[12] ?? 'Semi-monthly',
                    'basic_salary' => $this->parseFloat($row[13]),
                    'daily_rate' => $this->parseFloat($row[14]),
                    'allowance' => $this->parseFloat($row[15]),
                    'head_or_manager' => $row[16] ?? null,
                    'status' => $row[17] ?? 'Active',
                    'role_access' => $row[18] ?? 'Employee',
                    'employee_remarks' => $row[19] ?? null,
                    'sss' => $row[20] ?? null,
                    'philhealth' => $row[21] ?? null,
                    'pagibig' => $row[22] ?? null,
                    'tin' => $row[23] ?? null,
                    'email' => $row[24] ?? null,
                    'username' => $row[25] ?? null,
                    'password' => $row[26] ?? null,
                ];

                $result = (new EmployeeImportManual())->model($employeeData);
                if ($result['errors']) {
                    $importErrors[] = [
                        'row' => $index + 2,
                        'data' => $employeeData,
                        'errors' => $result['errors'],
                    ];
                }
            }

            Log::info('Employee import completed successfully');

            if (! empty($importErrors)) {
                Log::error('Employee import completed with errors', ['import_errors' => $importErrors]);

                return redirect()->back()->with('import_errors', $importErrors)->with('success', 'Some employees were imported, but errors occurred. Check below.');
            }

            return redirect()->route('employees.list')->with('success', 'Employees imported successfully.');
        } catch (\Exception $e) {
            Log::error('Error importing employees', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return redirect()->back()->with('error', 'Failed to import employees: '.$e->getMessage());
        }
    }

    /**
     * Parse date from Excel format.
     */
    private function parseDate($date)
    {
        return $date ? \Carbon\Carbon::createFromFormat('m/d/Y', $date) : null;
    }

    /**
     * Parse float value from Excel.
     */
    private function parseFloat($value)
    {
        return $value !== null && $value !== '' ? floatval(preg_replace('/[^0-9.]/', '', $value)) : null;
    }

    /**
     * Download sample Excel file for employee import.
     */
    public function downloadSampleExcel()
    {
        $path = storage_path('app/public/samples/sample-employee-import.xlsx');

        if (! file_exists($path)) {
            abort(404, 'Sample file not found.');
        }

        return response()->download($path, 'sample-employee-import.xlsx');
    }
}
