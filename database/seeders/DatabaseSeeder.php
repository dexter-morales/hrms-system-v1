<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        $this->call(DepartmentSeeder::class);
        $this->call(RoleSeeder::class);
        $this->call([
            EmploymentStatus::class,
        ]);
        $this->call([
            EmploymentType::class,
        ]);
        $this->call([
            RoleAccess::class,
        ]);
        $this->call([
            SiteSeeder::class,
        ]);
        $this->call([
            PositionSeeder::class,
        ]);
        $this->call([
            SuperAdminSeeder::class,
        ]);
        // $this->call([
        //     EmployeeSeeder::class,
        // ]);

        $this->call([
            EmployeeScheduleSeeder::class,
        ]);

        $this->call([
            LeaveTypeSeeder::class,
        ]);

    }
}
