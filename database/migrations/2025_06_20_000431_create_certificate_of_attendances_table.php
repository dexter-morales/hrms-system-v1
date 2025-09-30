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
        Schema::create('certificate_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('type')->nullable();
            $table->string('reason')->nullable();
            $table->string('other_reason')->nullable();
            $table->json('entries')->nullable(); // Stores array of {type, date, time}
            $table->string('image')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->string('approved_by')->nullable();
            $table->date('approved_at')->nullable();
            $table->string('approved_by_hr')->nullable();
            $table->date('approved_hr_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_attendances');
    }
};
