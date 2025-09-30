<?php

namespace Database\Seeders;

use DB;
use Illuminate\Database\Seeder;

class EmploymentStatus extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('employment_statuses')->insert([
            ['name' => 'Active'],
            ['name' => 'Resigned'],
            ['name' => 'Terminated'],
            ['name' => 'Retired'],
            ['name' => 'On Leave'],
            ['name' => 'Probationary'],
            ['name' => 'Suspended'],
            ['name' => 'AWOL'],
        ]);

    }
}
