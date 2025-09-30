<?php

namespace Database\Seeders;

use Carbon\Carbon;
use DB;
use Illuminate\Database\Seeder;

class PositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $positions = [
            'Super Administrator',
            'Human Resources',
            'Engineering',
            'Operations',
            'Finance',
            'Sales',
            'Marketing',
            'Customer Support',
            'IT Support',
            'Admin',
            'Legal',
        ];

        foreach ($positions as $name) {
            DB::table('positions')->insert([
                'name' => $name,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
