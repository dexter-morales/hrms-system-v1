<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLateDeductionToPayrollsTable extends Migration
{
    // public function up()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->decimal('late_deduction', 10, 2)->default(0.00)->after('withholding_tax');
    //     });
    // }

    // public function down()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->dropColumn('late_deduction');
    //     });
    // }
}
