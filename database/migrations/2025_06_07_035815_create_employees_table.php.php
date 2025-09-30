<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEmployeesTable extends Migration
{
    public function up(): void
    {
        // Schema::create('employees', function (Blueprint $table) {
        //     $table->id();
        //     $table->string('employee_id')->unique();
        //     $table->foreignId('user_id')->constrained('users')->onDelete('restrict');

        //     $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');

        //     $table->string('site');
        //     $table->string('position');

        //     $table->string('last_name');
        //     $table->string('first_name');
        //     $table->string('middle_name')->nullable();

        //     $table->date('birthday');
        //     $table->date('date_hired')->nullable();
        //     $table->date('end_of_contract')->nullable();

        //     $table->string('tenure')->nullable();

        //     $table->string('employment_status');

        //     $table->decimal('basic_salary', 10, 2)->default(0);
        //     $table->decimal('daily_rate', 10, 2)->default(0);

        //     $table->enum('payroll_status', ['Weekly', 'Semi-monthly']);
        //     $table->enum('employment_type', ['Consultant', 'Regular', 'Probationary', 'Project Based']);

        //     $table->decimal('allowance', 10, 2)->nullable();

        //     $table->string('head_or_manager')->nullable();

        //     $table->enum('role_access', ['SuperAdmin', 'Admin', 'Manager', 'HR', 'Accounting', 'Employee'])->default('Employee');
        //     $table->integer('leave_credits')->default(0);

        //     $table->timestamps();
        // });

        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id')->unique(); // EMP001, etc.
            $table->string('avatar')->nullable();

            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');

            $table->foreignId('site_id')->nullable()->constrained('sites')->onDelete('set null');

            // $table->unsignedBigInteger('site_id')->nullable();
            // $table->foreign('site_id')->references('id')->on('sites')->onDelete('set null');
            $table->foreignId('position_id')->nullable()->constrained('positions')->onDelete('set null');

            // $table->unsignedBigInteger('position_id')->nullable();
            // $table->foreign('position_id')->references('id')->on('positions')->onDelete('set null');

            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->date('birthday')->nullable();
            $table->date('date_hired');
            $table->date('end_of_contract')->nullable();

            $table->string('tenure')->nullable(); // or compute dynamically

            $table->foreignId('employment_status_id')->constrained('employment_statuses')->onDelete('restrict');

            $table->decimal('basic_salary', 10, 2)->default(0);
            $table->decimal('daily_rate', 10, 2)->default(0);
            $table->enum('payroll_status', ['Weekly', 'Semi-monthly']);

            $table->unsignedBigInteger('employment_type_id')->nullable();
            $table->foreign('employment_type_id')->references('id')->on('employment_types')->onDelete('set null');

            $table->decimal('allowance', 10, 2)->nullable()->default(0);
            $table->string('head_or_manager')->nullable()->default(null);

            $table->unsignedBigInteger('role_access_id')->nullable();
            $table->foreign('role_access_id')->references('id')->on('role_accesses')->onDelete('set null');

            $table->decimal('leave_credits', 5, 2)->default(0);

            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
}
