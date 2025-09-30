<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('employee_loans', function (Blueprint $table) {
            $table->enum('deduction_frequency', ['once_a_month', 'twice_a_month'])->default('once_a_month')->after('terms');
        });
    }

    public function down()
    {
        Schema::table('employee_loans', function (Blueprint $table) {
            $table->dropColumn('deduction_frequency');
        });
    }
};
