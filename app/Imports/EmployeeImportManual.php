<?php

namespace App\Imports;

use App\Models\Employee;
use App\Models\RoleAccess;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class EmployeeImportManual
{
    public function model(array $row)
    {
        try {
            // Validate and log non-existent related entities
            $errors = [];

            // Check department
            $departmentId = $this->getIdFromName(\App\Models\Department::class, 'name', $row['department']);
            if ($row['department'] && ! $departmentId) {
                $errors[] = "Department '{$row['department']}' does not exist in the database.";
            }

            // Check position
            $positionId = $this->getIdFromName(\App\Models\Position::class, 'name', $row['position']);
            if ($row['position'] && ! $positionId) {
                $errors[] = "Position '{$row['position']}' does not exist in the database.";
            }

            // Check site
            $siteId = $this->getIdFromName(\App\Models\Site::class, 'name', $row['site']);
            if ($row['site'] && ! $siteId) {
                $errors[] = "Site '{$row['site']}' does not exist in the database.";
            }

            // Check employment status
            $employmentStatusId = $this->getIdFromName(\App\Models\EmploymentStatus::class, 'name', $row['employment_status']);
            if ($row['employment_status'] && ! $employmentStatusId) {
                $errors[] = "Employment Status '{$row['employment_status']}' does not exist in the database.";
            }

            // Check employment type
            $employmentTypeId = $this->getIdFromName(\App\Models\EmploymentType::class, 'name', $row['employment_type']);
            if ($row['employment_type'] && ! $employmentTypeId) {
                $errors[] = "Employment Type '{$row['employment_type']}' does not exist in the database.";
            }

            // Check head_or_manager (if provided, should exist as employee_id)
            if ($row['head_or_manager'] && ! Employee::where('employee_id', $row['head_or_manager'])->exists()) {
                $errors[] = "Head/Manager '{$row['head_or_manager']}' does not exist as an employee.";
            }

            // Check role_access
            if ($row['role_access'] && ! RoleAccess::where('name', $row['role_access'])->exists()) {
                $errors[] = "Role Access '{$row['role_access']}' does not exist in the database.";
            }

            // If validation errors exist, log and return
            if (! empty($errors)) {
                Log::warning('Invalid data in Excel row', [
                    'row_data' => $row,
                    'errors' => $errors,
                ]);

                return ['result' => null, 'errors' => $errors];
            }

            // Attempt to create user if required
            $user = null;
            if (! empty($row['email']) || ! empty($row['username'])) {
                $user = User::create([
                    'email' => $row['email'],
                    'username' => $row['username'],
                    'password' => Hash::make($row['password']),
                    'status' => $row['status'],
                ]);

                $roleName = RoleAccess::where('name', $row['role_access'])->value('name');
                if ($roleName) {
                    $user->assignRole($roleName);
                }
            }
            $employee = new Employee([
                'user_id' => $user?->id ?? null,
                'employee_id' => $row['employee_id'],
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'middle_name' => $row['middle_name'],
                'birthday' => $row['birthday'],
                'date_hired' => $row['date_hired'],
                'end_of_contract' => $row['end_of_contract'],
                'department_id' => $departmentId,
                'position_id' => $positionId,
                'site_id' => $siteId,
                'employment_status_id' => $employmentStatusId,
                'employment_type_id' => $employmentTypeId,
                'payroll_status' => $row['payroll_status'],
                'basic_salary' => $row['basic_salary'],
                'daily_rate' => $row['daily_rate'],
                'allowance' => $row['allowance'],
                'head_or_manager' => $row['head_or_manager'],
                'sss' => $row['sss'],
                'philhealth' => $row['philhealth'],
                'pagibig' => $row['pagibig'],
                'tin' => $row['tin'],
            ]);

            $employee->save(); // <-- This is the missing line

            Log::info('Employee instance created', ['employee_data' => $employee->toArray()]);

            return $employee;

        } catch (\Throwable $e) {
            // Catch any unexpected exception and log it
            Log::error('Exception during import row processing', [
                'row_data' => $row,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ['result' => null, 'errors' => ['Unexpected error: '.$e->getMessage()]];
        }
    }

    private function getIdFromName($model, $column, $name)
    {
        if (! $name) {
            return;
        }

        return (new $model())->where($column, $name)->value('id') ?? null;
    }
}
