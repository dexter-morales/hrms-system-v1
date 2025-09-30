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
        Schema::create('employee_schedules', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('employee_id');

            // 'fixed' or 'flexible'
            $table->enum('schedule_type', ['fixed', 'flexible'])->default('fixed');

            // JSON structure for days like ["mon", "tue", "wed"] or ["mon" => ["09:00", "17:00"], "fri" => ["10:00", "16:00"]]
            $table->json('working_days')->nullable();

            // Used only if schedule_type == 'fixed'
            $table->time('start_time')->nullable(); // e.g. 09:00
            $table->time('end_time')->nullable();   // e.g. 18:00

            // Optional: control schedule validity
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();

            $table->timestamps();

            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_schedules');
    }
};
