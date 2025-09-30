<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Hash;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure the SuperAdmin role exists
        $superAdminRole = Role::firstOrCreate(['name' => 'SuperAdmin']);

        // Create SuperAdmin user
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'username' => 'superadmin',
                'email' => 'superadmin@gmail.com',
                'password' => Hash::make('superadmin123'),
                'status' => 'Active',
            ]
        );

        // Assign the SuperAdmin role to the user
        $superAdmin->assignRole($superAdminRole);

        // Create corresponding Employee record
        $departmentId = 1; // Assuming a default department with ID 1 exists; adjust as needed
        Employee::firstOrCreate(
            ['user_id' => $superAdmin->id],
            [
                'user_id' => $superAdmin->id,
                'employee_id' => 'SA001',
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'middle_name' => null,
                'birthday' => '1990-01-01',
                'date_hired' => now(),
                'end_of_contract' => null,
                'department_id' => $departmentId,
                'position_id' => 1,
                'site_id' => 1,
                'employment_status_id' => 1,
                'employment_type_id' => 1,
                'payroll_status' => 'Semi-monthly',
                'basic_salary' => 100000.00,
                'daily_rate' => 4000.00,
                'allowance' => 5000.00,
                'head_or_manager' => null,
                'leave_credits' => 15.0,

            ]
        );
    }
}
