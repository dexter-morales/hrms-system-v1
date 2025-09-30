<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('attendance:mark-undertime')
            ->daily() // Runs at 6:00 PM PST
            ->timezone('Asia/Manila')
            ->onSuccess(function () {
                \Illuminate\Support\Facades\Log::info('Undertime marking job completed successfully');
            })
            ->onFailure(function () {
                \Illuminate\Support\Facades\Log::error('Undertime marking job failed');
            });
        $schedule->command('reverb:keep-alive')->everyMinute();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
    }

    /**
     * Register the Closure based commands for the application.
     */
    protected function commandRegistrations()
    {
        // Optional: For Closure-based commands
    }
}
