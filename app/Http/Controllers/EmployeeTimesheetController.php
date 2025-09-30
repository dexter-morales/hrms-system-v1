<?php

namespace App\Http\Controllers;

use App\Models\EmployeeAttendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;

class EmployeeTimesheetController extends Controller
{
    public function index(Request $request)
    {
        Log::debug('Fetching all employee timesheet list');

        // Build query with filters for all employees
        $query = EmployeeAttendance::with('employee', 'site')
            ->select(['id', 'employee_id', 'date', 'break_hours', 'overtime_hours', 'status', 'notes', 'punch_in', 'punch_out', 'site_id']);

        // Apply filters with validation
        $filters = [
            'start_date' => fn ($q, $v) => $q->where('date', '>=', $v),
            'end_date' => fn ($q, $v) => $q->where('date', '<=', $v),
            'month' => fn ($q, $v) => $q->whereRaw('MONTH(date) = ?', [$v]),
            'year' => fn ($q, $v) => $q->whereRaw('YEAR(date) = ?', [$v]),
        ];

        foreach ($filters as $key => $callback) {
            if ($request->has($key) && $request->input($key) !== null && $request->input($key) !== '') {
                $callback($query, $request->input($key));
            }
        }

        // Fetch all attendances
        $allAttendances = $query->orderBy('date', 'desc')->get()->map(function ($attendance) {
            return [
                'id' => $attendance->id,
                'employee_name' => $attendance->employee->first_name.' '.$attendance->employee->last_name ?? 'Unknown',
                'date' => $attendance->date,
                'break_hours' => $attendance->break_hours,
                'overtime_hours' => $attendance->overtime_hours,
                'total_hours' => $attendance->punch_out && $attendance->punch_in
                    ? (strtotime($attendance->punch_out) - strtotime($attendance->punch_in)) / 3600 - ($attendance->break_hours ?? 0)
                    : 0,
                'site_name' => $attendance->site->name ?? '-',
            ];
        });

        Log::debug('All employee timesheet data fetched', [
            'attendance_count' => $allAttendances->count(),
        ]);

        return Inertia::render('Timesheet/TimesheetIndex', [
            'allAttendances' => $allAttendances,
            'flash' => session('flash'),
        ]);
    }
}
