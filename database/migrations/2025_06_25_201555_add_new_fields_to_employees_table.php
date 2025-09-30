<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNewFieldsToEmployeesTable extends Migration
{
    public function up()
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('sss')->after('head_or_manager')->nullable();
            $table->string('philhealth')->after('sss')->nullable();
            $table->string('pagibig')->after('philhealth')->nullable();
            $table->string('tin')->after('pagibig')->nullable();
        });
    }

    public function down()
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['sss', 'philhealth', 'pagibig', 'tin']);
        });
    }
}
