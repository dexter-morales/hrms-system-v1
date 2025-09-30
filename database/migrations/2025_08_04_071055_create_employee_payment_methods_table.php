<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEmployeePaymentMethodsTable extends Migration
{
    public function up()
    {
        Schema::create('employee_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('type')->index(); // 'bank' or 'ewallet'
            $table->string('bank_name')->nullable(); // For bank
            $table->string('bank_account_number')->nullable(); // For bank
            $table->string('account_name')->nullable(); // For bank
            $table->string('ewallet_name')->nullable(); // For e-wallet
            $table->string('ewallet_number')->nullable(); // For e-wallet
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_payment_methods');
    }
}
