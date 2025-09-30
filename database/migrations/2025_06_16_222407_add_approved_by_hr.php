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
            $table->boolean('isWithPay')->default(false)->after('reason');
            $table->date('approved_at')->nullable()->after('approved_by');
            $table->string('approved_by_hr')->nullable()->after('approved_at');
            $table->date('approved_hr_at')->nullable()->after('approved_by_hr');

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['approved_at', 'approved_by_hr', 'approved_hr_at']);
        });
    }
};
