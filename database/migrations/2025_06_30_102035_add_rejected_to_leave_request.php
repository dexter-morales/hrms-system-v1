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
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('rejected_by')->nullable()->after('approved_hr_at');
            $table->string('rejected_at')->nullable()->after('rejected_by');
            $table->string('rejected_by_hr')->nullable()->after('rejected_at');
            $table->string('rejected_hr_at')->nullable()->after('rejected_by_hr');

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['rejected_by', 'rejected_at', 'rejected_by_hr', 'rejected_at']);
        });
    }
};
