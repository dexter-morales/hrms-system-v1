<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class KeepReverbAlive extends Command
{
    protected $signature = 'reverb:keep-alive';

    protected $description = 'Keeps the Reverb server running';

    public function handle()
    {
        if (! $this->isProcessRunning()) {
            $this->startReverb();
        }
    }

    protected function isProcessRunning(): bool
    {
        $process = new Process(['pgrep', '-f', 'artisan reverb:start']);
        $process->run();

        return $process->isSuccessful();
    }

    protected function startReverb()
    {
        $process = new Process([
            'php',
            base_path('artisan'),
            'reverb:start',
            '--host='.config('reverb.servers.reverb.host'),
            '--port='.config('reverb.servers.reverb.port'),
        ]);

        $process->setTimeout(null);
        $process->disableOutput();
        $process->start();
    }
}
