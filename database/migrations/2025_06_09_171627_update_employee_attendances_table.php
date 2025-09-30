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
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->decimal('break_hours', 4, 2)->nullable()->after('punch_out');
            $table->decimal('overtime_hours', 4, 2)->nullable()->after('break_hours');
        });
    }

    public function down(): void
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->dropColumn(['break_hours', 'overtime_hours']);
        });
    }
};
