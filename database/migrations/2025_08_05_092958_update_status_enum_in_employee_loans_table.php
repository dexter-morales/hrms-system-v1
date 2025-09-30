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
        Schema::table('employee_loans', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Approved', 'Rejected', 'Fully Paid'])
                ->default('Pending')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_loans', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])
                ->default('Pending')
                ->change();
        });
    }
};
