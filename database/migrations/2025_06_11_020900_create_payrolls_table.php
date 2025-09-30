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
        // Schema::create('payrolls', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('employee_id')->constrained()->onDelete('cascade');
        //     $table->date('pay_period_start');
        //     $table->date('pay_period_end');
        //     $table->decimal('gross_pay', 10, 2);
        //     $table->decimal('deductions', 10, 2);
        //     $table->decimal('net_pay', 10, 2);
        //     $table->enum('pay_schedule', ['weekly', 'semi-monthly']);
        //     $table->decimal('sss_deduction', 10, 2)->default(0.00);
        //     $table->decimal('philhealth_deduction', 10, 2)->default(0.00);
        //     $table->decimal('pagibig_deduction', 10, 2)->default(0.00);
        //     $table->decimal('withholding_tax', 10, 2)->default(0.00);
        //     $table->timestamps();
        // });
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');

            // Pay period
            $table->date('pay_period_start');
            $table->date('pay_period_end');

            // Work tracking
            $table->foreignId('site_id')->nullable()->constrained('sites')->onDelete('set null');
            $table->decimal('base_pay', 10, 2)->default(0.00);
            $table->decimal('allowance', 10, 2)->default(0.00);
            $table->decimal('days_worked', 10, 2)->default(0.00);
            $table->decimal('hours_worked', 10, 2)->default(0.00);
            $table->decimal('late_hours', 10, 2)->default(0.00);
            $table->decimal('overtime_hours', 10, 2)->default(0.00);
            $table->decimal('overtime_pay', 10, 2)->default(0.00);
            $table->decimal('night_diff_hours', 8, 2)->default(0.00);
            $table->decimal('night_diff_pay', 8, 2)->default(0.00);
            $table->decimal('weekend_pay', 10, 2)->default(0.00);
            $table->decimal('holiday_pay', 10, 2)->default(0.00);
            $table->decimal('thirteenth_month_pay', 12, 2)->default(0.00);

            // Leave tracking
            $table->decimal('leave_with_pay', 10, 2)->default(0.00);
            $table->integer('leave_days')->default(0);

            // Attendance deductions
            $table->decimal('total_working_days', 10, 2)->default(0.00);
            $table->decimal('total_absences', 10, 2)->default(0.00);
            $table->decimal('absences_deduction', 10, 2)->default(0.00);
            $table->decimal('late_deduction', 10, 2)->default(0.00);

            // Government deductions
            $table->decimal('sss_deduction', 10, 2)->default(0.00);
            $table->decimal('philhealth_deduction', 10, 2)->default(0.00);
            $table->decimal('pagibig_deduction', 10, 2)->default(0.00);
            $table->decimal('withholding_tax', 10, 2)->default(0.00);

            // Payroll status
            $table->enum('pay_schedule', ['weekly', 'semi-monthly']);
            $table->decimal('gross_pay', 10, 2)->default(0.00);
            $table->decimal('deductions', 10, 2)->default(0.00);
            $table->decimal('net_pay', 10, 2)->default(0.00);

            // Adjustments
            $table->decimal('gross_pay_adjustments', 10, 2)->default(0.00);
            $table->decimal('deductions_adjustments', 10, 2)->default(0.00);

            // Approval tracking
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');

            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
