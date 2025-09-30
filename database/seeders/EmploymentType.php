<?php

namespace Database\Seeders;

use DB;
use Illuminate\Database\Seeder;

class EmploymentType extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('employment_types')->insert([
            ['name' => 'Full-time'],
            ['name' => 'Part-time'],
            ['name' => 'Freelance'],
            ['name' => 'Internship'],
            ['name' => 'Casual'],
            ['name' => 'Temporary'],
            ['name' => 'Consultant'],
            ['name' => 'Project Based'],
        ]);
    }
}
