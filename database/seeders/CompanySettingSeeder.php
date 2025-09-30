<?php

namespace Database\Seeders;

use App\Models\CompanySetting;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CompanySettingSeeder extends Seeder
{
    public function run()
    {
        $currentYear = Carbon::now()->year;
        $lastYear = $currentYear - 1;

        $defaultDates = [
            'thirteenth_month_pay_start' => Carbon::create($lastYear, 12, 1)->format('Y-m-d'),
            'thirteenth_month_pay_end' => Carbon::create($currentYear, 11, 30)->format('Y-m-d'),
        ];

        $companySetting = CompanySetting::first();

        if ($companySetting) {
            $companySetting->update($defaultDates);
        } else {
            CompanySetting::create(array_merge([
                'company_name' => 'Your Company Name',
                'address' => 'Company Address',
                'email' => 'company@example.com',
                'phone_number' => '1234567890',
                'mobile_number' => '0987654321',
                'employee_id_prefix' => 'EMP',
            ], $defaultDates));
        }
    }
}
