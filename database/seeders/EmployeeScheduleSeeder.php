<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Illuminate\Database\Seeder;

class EmployeeScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = Employee::all();
        foreach ($employees as $employee) {
            // Fixed schedule: Mon-Fri, 9 AM - 5 PM, valid all 2025
            EmployeeSchedule::create([
                'employee_id' => $employee->id,
                'schedule_type' => 'fixed',
                'working_days' => json_encode(['mon', 'tue', 'wed', 'thu', 'fri']),
                'start_time' => '09:00:00',
                'end_time' => '17:00:00',
                'effective_from' => '2025-01-01',
                'effective_until' => '2025-12-31',
            ]);

            // Flexible schedule: Custom hours for June 2025
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
    }
}
