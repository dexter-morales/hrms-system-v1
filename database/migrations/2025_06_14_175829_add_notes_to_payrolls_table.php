<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    // public function up()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->decimal('overtime_hours')->default(0)->after('overtime_pay');
    //         $table->text('notes')->nullable()->after('status');
    //         $table->timestamp('approved_at')->nullable()->after('notes');
    //         $table->foreignId('approved_by')->nullable()->constrained('users')->after('approved_at');
    //     });
    // }

    // /**
    //  * Reverse the migrations.
    //  */
    // public function down()
    // {
    //     Schema::table('payrolls', function (Blueprint $table) {
    //         $table->dropForeign(['approved_by']);
    //         $table->dropColumn(['notes', 'approved_at', 'approved_by']);
    //     });
    // }
};
