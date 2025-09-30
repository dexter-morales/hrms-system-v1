<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAllowanceToPayrollsTable extends Migration
{
    // public function up()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->decimal('base_pay', 10, 2)->default(0.00)->after('withholding_tax');
    //         $table->decimal('allowance', 10, 2)->default(0.00)->after('base_pay');
    //         $table->decimal('days_worked', 10, 2)->default(0.00)->after('allowance');
    //         $table->decimal('hours_worked', 10, 2)->default(0.00)->after('days_worked');
    //         $table->decimal('late_hours', 10, 2)->default(0.00)->after('hours_worked');
    //         $table->decimal('overtime_pay', 10, 2)->default(0.00)->after('late_hours');

    //     });
    // }

    // public function down()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->dropColumn([
    //             'base_pay',
    //             'allowance',
    //             'days_worked',
    //             'hours_worked',
    //             'late_hours',
    //             'overtime_pay',
    //         ]);
    //     });
    // }
}
