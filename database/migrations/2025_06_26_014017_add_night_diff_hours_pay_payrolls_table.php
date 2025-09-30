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
    //         $table->decimal('night_diff_hours', 8, 2)->default(0.00)->after('overtime_hours');
    //         $table->decimal('night_diff_pay', 8, 2)->default(0.00)->after('night_diff_hours');
    //     });
    // }

    // /**
    //  * Reverse the migrations.
    //  */
    // public function down(): void
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->dropColumn('night_diff_hours');
    //         $table->dropColumn('night_diff_pay');
    //     });
    // }
};
