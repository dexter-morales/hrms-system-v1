<?php

namespace Database\Seeders;

use App\Models\Site;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SiteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $sites = [
            [
                'id' => 1,
                'name' => 'Main Office',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 2,
                'name' => 'Branch Office',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($sites as $siteData) {
            Site::firstOrCreate(
                ['id' => $siteData['id']],
                $siteData
            );
        }
    }
}
