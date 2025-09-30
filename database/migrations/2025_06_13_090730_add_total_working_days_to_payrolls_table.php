<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTotalWorkingDaysToPayrollsTable extends Migration
{
    // public function up()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->decimal('total_working_days')->default(0)->after('days_worked');
    //         $table->decimal('total_absences')->default(0)->after('total_working_days');
    //         $table->decimal('absences_deduction')->default(0)->after('total_absences');

    //     });
    // }

    // public function down()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->dropColumn(['total_working_days', 'total_absences', 'absences_deduction']);
    //     });
    // }
}
