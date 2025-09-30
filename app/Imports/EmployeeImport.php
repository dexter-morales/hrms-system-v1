<?php

namespace App\Imports;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmploymentStatus;
use App\Models\EmploymentType;
use App\Models\Position;
use App\Models\RoleAccess;
use App\Models\Site;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class EmployeeImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        $user = null;
        if (! empty($row['email']) || ! empty($row['username'])) {
            $user = User::create([
                'email' => $row['email'] ?? null,
                'username' => $row['username'] ?? Str::random(8), // Default if not provided
                'password' => Hash::make($row['password'] ?? Str::random(8)), // Default if not provided
                'status' => $row['status'] ?? 'Active',
            ]);
            $user->assignRole(RoleAccess::where('name', $row['role_access'] ?? 'Employee')->first()->name);
        }

        $avatarPath = null;
        if (! empty($row['avatar']) && file_exists(public_path('avatars/'.$row['avatar']))) {
            $avatarPath = 'avatars/'.$row['avatar'];
        }

        return new Employee([
            'user_id' => $user?->id,
            'employee_id' => $row['employee_id'] ?? Employee::generateNextEmployeeId(),
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'middle_name' => $row['middle_name'] ?? null,
            'birthday' => $this->parseDate($row['birthday']),
            'date_hired' => $this->parseDate($row['date_hired']),
            'end_of_contract' => $this->parseDate($row['end_of_contract']),
            'department_id' => $this->getIdFromName(Department::class, 'name', $row['department']),
            'position_id' => $this->getIdFromName(Position::class, 'name', $row['position']),
            'site_id' => $this->getIdFromName(Site::class, 'name', $row['site']),
            'employment_status_id' => $this->getIdFromName(EmploymentStatus::class, 'name', $row['employment_status']),
            'employment_type_id' => $this->getIdFromName(EmploymentType::class, 'name', $row['employment_type']),
            'payroll_status' => $row['payroll_status'] ?? 'Semi-monthly',
            'basic_salary' => $this->parseFloat($row['basic_salary']),
            'daily_rate' => $this->parseFloat($row['daily_rate']),
            'allowance' => $this->parseFloat($row['allowance']),
            'head_or_manager' => $row['head_or_manager'] ?? null,
            'sss' => $row['sss'] ?? null,
            'philhealth' => $row['philhealth'] ?? null,
            'pagibig' => $row['pagibig'] ?? null,
            'tin' => $row['tin'] ?? null,
            'avatar' => $avatarPath,
            'status' => $row['status'] ?? 'Active',
        ]);
    }

    public function headingRow(): int
    {
        return 1;
    }

    private function parseDate($date)
    {
        return $date ? \Carbon\Carbon::createFromFormat('m/d/Y', $date) : null;
    }

    private function parseFloat($value)
    {
        return $value !== null && $value !== '' ? floatval(preg_replace('/[^0-9.]/', '', $value)) : null;
    }

    private function getIdFromName($model, $column, $name)
    {
        if (! $name) {
            return;
        }
        $modelInstance = new $model();

        return $modelInstance->where($column, $name)->value('id') ?? null;
    }
}
