<?php

namespace Database\Seeders;

use DB;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('departments')->insert([
            ['name' => 'Administration'],
            ['name' => 'Operation'],
            ['name' => 'Engineering'],
            ['name' => 'HRD'],
            ['name' => 'Accounting'],
        ]);
    }
}
