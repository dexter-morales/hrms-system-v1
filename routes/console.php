<?php

use App\Console\Commands\KeepReverbAlive;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('attendance:mark-undertime')
    ->everyMinute();

Schedule::command(KeepReverbAlive::class)->everyMinute()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/reverb-monitor.log'));
