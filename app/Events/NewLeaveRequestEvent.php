<?php

// namespace App\Events;

// use Illuminate\Broadcasting\Channel;
// use Illuminate\Broadcasting\InteractsWithSockets;
// use Illuminate\Broadcasting\PresenceChannel;
// use Illuminate\Broadcasting\PrivateChannel;
// use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
// use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
// use Illuminate\Foundation\Events\Dispatchable;
// use Illuminate\Queue\SerializesModels;

// class NewLeaveRequest implements ShouldBroadcastNow
// {
//     use Dispatchable, InteractsWithSockets, SerializesModels;

//     public $employeeName;

//     public function __construct($employeeName)
//     {
//         $this->employeeName = $employeeName;
//     }

//     public function broadcastOn()
//     {
//         return new Channel('leave-requests');
//     }

//     public function broadcastWith()
//     {
//         return ['employeeName' => $this->employeeName];
//     }
// }

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NewLeaveRequestEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $employeeName;

    public $managerId;

    public $message;

    public function __construct($employeeName, $managerId, $message = '')
    {
        $this->employeeName = $employeeName;
        $this->managerId = $managerId;
        $this->message = $message;

        Log::info('🔔 NewLeaveRequestEvent created', [
            'employeeName' => $this->employeeName,
            'managerId' => $this->managerId,
            'message' => $this->message,
        ]);
    }

    public function broadcastOn()
    {
        $channels = [
            new PrivateChannel('leave-requests'),
        ];

        if ($this->managerId) {
            $channels[] = new PrivateChannel('manager.'.$this->managerId);
        }

        Log::info('📡 Broadcasting on channels', [
            'channels' => array_map(function ($channel) {
                return $channel->name;
            }, $channels),
        ]);

        return $channels;
    }

    public function broadcastWith()
    {
        return [
            'employeeName' => $this->employeeName,
            'message' => $this->message,
        ];
    }
}
