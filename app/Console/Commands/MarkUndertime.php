<?php

namespace App\Console\Commands;

use App\Models\AttendanceLog;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeSchedule;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MarkUndertime extends Command
{
    protected $signature = 'attendance:mark-undertime';

    protected $description = 'Mark undertime for employees based on attendance data';

    public function handle()
    {
        $yesterday = Carbon::yesterday()->toDateString();
        Log::info("Starting undertime marking for $yesterday");

        $attendances = EmployeeAttendance::where('date', $yesterday)->get();

        foreach ($attendances as $attendance) {
            $employee = $attendance->employee;
            $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                ->where('effective_from', '<=', $yesterday)
                ->where(function ($query) use ($yesterday) {
                    $query->where('effective_until', '>=', $yesterday)
                        ->orWhereNull('effective_until');
                })
                ->orderBy('id', 'desc')
                ->first();

            if (! $schedule) {
                Log::warning("No schedule found for employee {$employee->id} on $yesterday");

                continue;
            }

            $dayOfWeek = strtolower(Carbon::parse($yesterday)->format('D'));
            $expectedEnd = null;
            if ($schedule->schedule_type === 'fixed') {
                $expectedEnd = Carbon::parse($yesterday.' '.$schedule->end_time);
            } elseif ($schedule->schedule_type === 'flexible' && isset($schedule->working_days[$dayOfWeek])) {
                $endTimes = $schedule->working_days[$dayOfWeek];
                $expectedEnd = Carbon::parse($yesterday.' '.end($endTimes));
            }

            if (! $expectedEnd || ! $attendance->punch_out) {
                Log::warning("Incomplete data for attendance {$attendance->id} on $yesterday");

                continue;
            }

            // Calculate total worked minutes
            $logs = AttendanceLog::where('employee_id', $employee->id)
                ->where('attendance_id', $attendance->id)
                ->orderBy('timestamp', 'asc')
                ->get();

            $totalWorkedMinutes = 0;
            $lastIn = null;
            foreach ($logs as $log) {
                if ($log->type === 'in') {
                    $lastIn = Carbon::parse($log->timestamp);
                } elseif ($log->type === 'out' && $lastIn) {
                    $totalWorkedMinutes += $lastIn->diffInMinutes(Carbon::parse($log->timestamp));
                    $lastIn = null;
                }
            }
            if ($lastIn && $attendance->punch_out->greaterThan($lastIn)) {
                $totalWorkedMinutes += $lastIn->diffInMinutes($attendance->punch_out);
            }

            // Calculate expected minutes
            $expectedStart = Carbon::parse($yesterday.' '.($schedule->schedule_type === 'flexible' ? $schedule->working_days[$dayOfWeek][0] : $schedule->start_time));
            $expectedMinutes = $expectedEnd->diffInMinutes($expectedStart);

            // Calculate undertime
            $breakHoursInMinutes = ($attendance->break_hours ?? 0) * 60;
            $undertimeHours = max(0, ($expectedMinutes - $totalWorkedMinutes) / 60 - $attendance->break_hours);

            // Update attendance
            $attendance->update([
                'undertime_hours' => round($undertimeHours, 2),
            ]);

            Log::info("Undertime marked for attendance {$attendance->id}: {$undertimeHours} hours");
        }

        Log::info("Undertime marking completed for $yesterday");

        return 0;
    }
}
