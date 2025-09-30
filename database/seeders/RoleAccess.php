<?php

namespace Database\Seeders;

use DB;
use Illuminate\Database\Seeder;

class RoleAccess extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('role_accesses')->insert([
            ['name' => 'SuperAdmin'],
            ['name' => 'Admin'],
            ['name' => 'Manager'],
            ['name' => 'HR'],
            ['name' => 'Accounting'],
            ['name' => 'Employee'],
        ]);
    }
}
