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
        Schema::create('thirteenth_month_pays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->decimal('basic_earnings', 10, 2); // Sum of basePay + allowance
            $table->text('months_covered'); // JSON or text to store covered months
            $table->decimal('thirteenth_month_pay', 10, 2); // Pro-rated 13th-month pay
            $table->date('calculation_date');
            $table->string('status')->default('Pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('thirteenth_month_pays');
    }
};
