<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        LeaveType::create(['name' => 'Vacation', 'status' => 'active']);
        LeaveType::create(['name' => 'Sick', 'status' => 'active']);
        LeaveType::create(['name' => 'Paternity', 'status' => 'active']);
        LeaveType::create(['name' => 'Maternity', 'status' => 'active']);
        LeaveType::create(['name' => 'Bereavement', 'status' => 'active']);
    }
}
