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
            //         $table->decimal('night_diff_hours', 8, 2)->default(0.00)->after('overtime_hours');
            $table->foreignId('site_id')->nullable()->after('notes')->constrained('sites')->onDelete('set null');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_attendances', function (Blueprint $table) {
            $table->dropForeign(['site_id']);
            $table->dropColumn(['site_id']);
        });
    }
};
