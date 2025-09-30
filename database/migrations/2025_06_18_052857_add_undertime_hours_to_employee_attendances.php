<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUndertimeHoursToEmployeeAttendances extends Migration
{
    public function up()
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->decimal('undertime_hours', 8, 2)->default(0.00)->after('overtime_hours');
        });
    }

    public function down()
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->dropColumn('undertime_hours');
        });
    }
}
