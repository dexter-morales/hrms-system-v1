<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeSchedule;
use App\Models\Holiday;
use App\Models\User;
use Carbon\Carbon;
use Hash;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // Ensure roles exist
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $employeeRole = Role::firstOrCreate(['name' => 'employee']);

        $employees = [
            [
                'employee_id' => 'EMP001',
                'user_id' => 2,
                'department_id' => 1,
                'site_id' => 1,
                'position_id' => 1,
                'last_name' => 'Cruz',
                'first_name' => 'Juan',
                'middle_name' => 'Dela',
                'birthday' => '1990-01-01',
                'date_hired' => '2022-06-01',
                'end_of_contract' => null,
                'tenure' => '2 years',
                'employment_status_id' => 1,
                'basic_salary' => 35000,
                'daily_rate' => 1346.15,
                'payroll_status' => 'semi-monthly',
                'employment_type_id' => 1,
                'allowance' => 2000,
                'head_or_manager' => null,
                'role_access_id' => 3,
                'leave_credits' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'employee_id' => 'EMP002',
                'user_id' => 3,
                'department_id' => 2,
                'site_id' => 2,
                'position_id' => 2,
                'last_name' => 'Reyes',
                'first_name' => 'Maria',
                'middle_name' => 'Luna',
                'birthday' => '1993-05-10',
                'date_hired' => '2023-01-15',
                'end_of_contract' => '2025-01-14',
                'tenure' => '1.5 years',
                'employment_status_id' => 2,
                'basic_salary' => 28000,
                'daily_rate' => 1076.92,
                'payroll_status' => 'Weekly',
                'employment_type_id' => 2,
                'allowance' => 1500,
                'head_or_manager' => 'EMP001',
                'role_access_id' => 4,
                'leave_credits' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'employee_id' => 'EMP003',
                'user_id' => 4,
                'department_id' => 3,
                'site_id' => 1,
                'position_id' => 3,
                'last_name' => 'Santos',
                'first_name' => 'Pedro',
                'middle_name' => 'Garcia',
                'birthday' => '1988-03-15',
                'date_hired' => '2021-09-01',
                'end_of_contract' => null,
                'tenure' => '3 years',
                'employment_status_id' => 1,
                'basic_salary' => 40000,
                'daily_rate' => 1538.46,
                'payroll_status' => 'semi-monthly',
                'employment_type_id' => 1,
                'allowance' => 2500,
                'head_or_manager' => null,
                'role_access_id' => 5,
                'leave_credits' => 12,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'employee_id' => 'EMP004',
                'user_id' => 5,
                'department_id' => 1,
                'site_id' => 2,
                'position_id' => 4,
                'last_name' => 'Lopez',
                'first_name' => 'Anna',
                'middle_name' => 'Mendez',
                'birthday' => '1995-07-22',
                'date_hired' => '2023-03-10',
                'end_of_contract' => '2025-03-09',
                'tenure' => '1 year',
                'employment_status_id' => 2,
                'basic_salary' => 26000,
                'daily_rate' => 1000.00,
                'payroll_status' => 'Weekly',
                'employment_type_id' => 2,
                'allowance' => 1200,
                'head_or_manager' => 'EMP001',
                'role_access_id' => 6,
                'leave_credits' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($employees as $index => $employeeData) {
            // Create or get User record
            $user = User::firstOrCreate(
                ['email' => strtolower($employeeData['first_name'].'.'.$employeeData['last_name'].'@example.com')],
                [
                    'username' => strtolower($employeeData['first_name'].$employeeData['last_name']),
                    'email' => strtolower($employeeData['first_name'].'.'.$employeeData['last_name'].'@example.com'),
                    'password' => Hash::make('password123'),
                    'status' => 'Active',
                ]
            );

            // Update employee data with the correct user_id
            $employeeData['user_id'] = $user->id;

            // Create or get Employee record
            Employee::firstOrCreate(
                ['employee_id' => $employeeData['employee_id']],
                $employeeData
            );

            // Assign appropriate role based on head_or_manager status
            $role = $employeeData['head_or_manager'] === null ? $managerRole : $employeeRole;
            $user->assignRole($role);
        }

        foreach ($employees as $employeeData) {
            $employee = Employee::where('employee_id', $employeeData['employee_id'])->first();

            // Fixed schedule: Mon-Fri, 9 AM - 5 PM, 2025
            EmployeeSchedule::create([
                'employee_id' => $employee->id,
                'schedule_type' => 'fixed',
                'working_days' => json_encode(['mon', 'tue', 'wed', 'thu', 'fri']),
                'start_time' => '09:00:00',
                'end_time' => '17:00:00',
                'effective_from' => '2025-01-01',
                'effective_until' => '2025-12-31',
            ]);

            // Flexible schedule: June 2025
            EmployeeSchedule::create([
                'employee_id' => $employee->id,
                'schedule_type' => 'flexible',
                'working_days' => json_encode([
                    'mon' => ['09:00', '17:00'],
                    'tue' => ['10:00', '18:00'],
                    'wed' => ['08:00', '16:00'],
                    'thu' => ['09:00', '15:00'],
                    'fri' => ['12:00', '20:00'],
                ]),
                'start_time' => null,
                'end_time' => null,
                'effective_from' => '2025-06-01',
                'effective_until' => '2025-06-30',
            ]);
        }

        // Create holidays
        Holiday::create([
            'date_holiday' => '2025-06-10',
            'name_holiday' => 'Company Anniversary',
        ]);

        // Attendance records (June 1-6, 2025)
        $attendanceRecords = [
            // John Doe
            ['employee_id' => 1, 'date' => '2025-06-02', 'punch_in' => '2025-06-02T09:00', 'punch_out' => '2025-06-02T17:00'], // Full (Mon, 9-5)
            ['employee_id' => 1, 'date' => '2025-06-03', 'punch_in' => '2025-06-03T10:00', 'punch_out' => '2025-06-03T14:00'], // Morning (Tue, 10-6)
            ['employee_id' => 1, 'date' => '2025-06-04', 'punch_in' => '2025-06-04T12:00', 'punch_out' => '2025-06-04T16:00'], // Afternoon (Wed, 8-4)
            ['employee_id' => 1, 'date' => '2025-06-05', 'punch_in' => null, 'punch_out' => null], // Absent (Thu)
            ['employee_id' => 1, 'date' => '2025-06-06', 'punch_in' => '2025-06-06T12:00', 'punch_out' => '2025-06-06T20:00'], // Full (Fri, 12-8)
            // Jane Smith
            ['employee_id' => 2, 'date' => '2025-06-02', 'punch_in' => '2025-06-02T09:00', 'punch_out' => '2025-06-02T17:00'], // Full
            ['employee_id' => 2, 'date' => '2025-06-03', 'punch_in' => '2025-06-03T10:00', 'punch_out' => '2025-06-03T13:00'], // Morning
            ['employee_id' => 2, 'date' => '2025-06-04', 'punch_in' => null, 'punch_out' => null], // Absent
            // Alice Johnson
            ['employee_id' => 3, 'date' => '2025-06-03', 'punch_in' => '2025-06-03T08:00', 'punch_out' => '2025-06-03T16:00'], // Full
            ['employee_id' => 3, 'date' => '2025-06-05', 'punch_in' => '2025-06-05T12:00', 'punch_out' => '2025-06-05T15:00'], // Afternoon
            // Bob Williams
            ['employee_id' => 4, 'date' => '2025-06-04', 'punch_in' => '2025-06-04T08:00', 'punch_out' => '2025-06-04T11:00'], // Morning
            ['employee_id' => 4, 'date' => '2025-06-06', 'punch_in' => null, 'punch_out' => null], // Absent
        ];

        foreach ($attendanceRecords as $record) {
            EmployeeAttendance::create($record);
        }
    }
}
