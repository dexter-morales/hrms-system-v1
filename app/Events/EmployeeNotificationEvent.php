<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EmployeeNotificationEvent implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public $employeeId;

    public $message;

    public function __construct($employeeId, $message)
    {
        $this->employeeId = $employeeId;
        $this->message = $message;

        Log::info('📨 EmployeeNotificationEvent instantiated', [
            'employee_id' => $employeeId,
            'message' => $message,
        ]);
    }

    public function broadcastOn()
    {
        $channel = new PrivateChannel("employee.{$this->employeeId}");

        Log::info('📡 Broadcasting on channel:', [
            'channel' => "employee.{$this->employeeId}",
        ]);

        return $channel;
    }

    public function broadcastWith()
    {
        Log::info('📦 Payload being broadcasted', [
            'message' => $this->message,
        ]);

        return [
            'message' => $this->message,
        ];
    }
}
