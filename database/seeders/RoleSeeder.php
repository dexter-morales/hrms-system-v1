<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::create(['name' => 'Admin']);
        Role::create(['name' => 'SuperAdmin']);
        Role::create(['name' => 'NormalUser']);
        Role::create(['name' => 'Client']);
        Role::create(['name' => 'HR']);
        Role::create(['name' => 'Employee']);
        Role::create(['name' => 'Accounting']);
        Role::create(['name' => 'Manager']);
        // $admin = User::first();
        // $admin->assignRole('admin');
    }
}
