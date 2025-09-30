<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->date('thirteenth_month_pay_start')->nullable()->after('employee_id_prefix');
            $table->date('thirteenth_month_pay_end')->nullable()->after('thirteenth_month_pay_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn(['thirteenth_month_pay_start', 'thirteenth_month_pay_end']);
        });
    }
};
