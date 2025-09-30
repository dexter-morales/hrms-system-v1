<?php

use App\Models\Notification;

if (! function_exists('createNotification')) {
    function createNotification($employeeId, $message, $employeeTblId = null, $notificationType = null)
    {
        try {
            return Notification::create([
                'employee_id' => $employeeId,
                'requester_employee_id' => $employeeTblId,
                'message' => $message,
                'notification_type' => $notificationType,
                'read_status' => false,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'employee_id' => $employeeId,
                'requester_employee_id' => $employeeTblId,
                'message' => $message,
                'notification_type' => $notificationType,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
