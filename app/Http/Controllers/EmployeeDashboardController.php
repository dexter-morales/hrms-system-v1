<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeLeaveCredits;
use App\Models\Leave;
use App\Models\Payslip;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;

class EmployeeDashboardController extends Controller
{
    public function index(Request $request)
    {
        Log::debug('Fetching attendance list', ['employee_id' => auth()->user()->employee->id]);

        $employee = auth()->user()->employee;

        // Build query with filters
        $query = EmployeeAttendance::where('employee_id', $employee->id)
            ->select(['id', 'employee_id', 'date', 'punch_in', 'punch_out', 'break_hours', 'overtime_hours', 'status', 'notes']);

        // Apply filters with validation
        $filters = [
            'date' => fn ($q, $v) => $q->where('date', $v),
            'month' => fn ($q, $v) => $q->whereRaw('MONTH(date) = ?', [$v]),
            'year' => fn ($q, $v) => $q->whereRaw('YEAR(date) = ?', [$v]),
        ];

        foreach ($filters as $key => $callback) {
            if ($request->has($key) && $request->input($key) !== null) {
                $callback($query, $request->input($key));
            }
        }

        $attendances = $query->orderBy('date', 'desc')->get();

        // Calculate statistics
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();

        $statistics = [
            'today' => [
                'hours' => $attendances->where('date', $today->toDateString())
                    ->sum(function ($att) {
                        if (! $att->punch_out) {
                            return 0;
                        }

                        return (strtotime($att->punch_out) - strtotime($att->punch_in)) / 3600 - ($att->break_hours ?? 0);
                    }),
                'break' => $attendances->where('date', $today->toDateString())->sum('break_hours'),
                'overtime' => $attendances->where('date', $today->toDateString())->sum('overtime_hours'),
            ],
            'week' => [
                'hours' => $attendances->where('date', '>=', $startOfWeek->toDateString())
                    ->sum(function ($att) {
                        if (! $att->punch_out) {
                            return 0;
                        }

                        return (strtotime($att->punch_out) - strtotime($att->punch_in)) / 3600 - ($att->break_hours ?? 0);
                    }),
            ],
            'month' => [
                'hours' => $attendances->where('date', '>=', $startOfMonth->toDateString())
                    ->sum(function ($att) {
                        if (! $att->punch_out) {
                            return 0;
                        }

                        return (strtotime($att->punch_out) - strtotime($att->punch_in)) / 3600 - ($att->break_hours ?? 0);
                    }),
                'remaining' => 120 - $attendances->where('date', '>=', $startOfMonth->toDateString())
                    ->sum(function ($att) {
                        if (! $att->punch_out) {
                            return 0;
                        }

                        return (strtotime($att->punch_out) - strtotime($att->punch_in)) / 3600 - ($att->break_hours ?? 0);
                    }),
                'overtime' => $attendances->where('date', '>=', $startOfMonth->toDateString())->sum('overtime_hours'),
            ],
        ];

        // Recent activities from attendance_logs
        $recentActivities = AttendanceLog::where('employee_id', $employee->id)
            ->orderBy('timestamp', 'desc')
            ->take(6)
            ->get()
            ->map(function ($log) {
                return [
                    'type' => $log->type,
                    'timestamp' => $log->timestamp->toDateTimeString(),
                    'attendance_id' => $log->attendance_id,
                ];
            });

        Log::debug('Attendance data fetched', [
            'attendance_count' => $attendances->count(),
            'recent_activities_count' => $recentActivities->count(),
        ]);

        $payslip = Payslip::with('employee', 'payroll', 'employee.site')->where('employee_id', auth()->user()->employee->id)->orderBy('created_at', 'desc')->limit(5)->get();

        return Inertia::render('EmployeeDashboard', [
            'payslip' => $payslip,
            'attendances' => $attendances,
            'statistics' => $statistics,
            'recentActivities' => $recentActivities,
            'employee' => $employee->only(['id', 'first_name', 'last_name']),
            'vacation_leave_credits' => EmployeeLeaveCredits::with('leaveType')->where('employee_id', $employee->id)->where('leave_type_id', 1)->get(),
            'sick_leave_credits' => EmployeeLeaveCredits::with('leaveType')->where('employee_id', $employee->id)->where('leave_type_id', 2)->get(),
            'leave_without_pay' => Leave::with('employee')->where('employee_id', $employee->id)->where('status', 'approved')->where('isWithPay', 0)->count(),
        ]);
    }
}
