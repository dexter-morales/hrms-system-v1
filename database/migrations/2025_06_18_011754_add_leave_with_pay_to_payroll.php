<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    // public function up(): void
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //          $table->decimal('leave_with_pay')->default(0)->after('days_worked');
    //          $table->integer('leave_days')->default(0)->after('leave_with_pay');
    //     });
    // }

    // /**
    //  * Reverse the migrations.
    //  */
    // public function down(): void
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->dropColumn(['leave_with_pay', 'leave_days']);
    //     });
    // }
};
