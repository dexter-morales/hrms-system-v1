<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeLeaveCredits;
use App\Models\EmployeeOvertime;
use App\Models\EmployeeSchedule;
use App\Models\Leave;
use App\Models\Payslip;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;
use Redirect;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $employeeRole = auth()->user()->roles[0]->name;
        if ($employeeRole === 'Employee') {
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
                'payslips' => $payslip,
                'attendances' => $attendances,
                'statistics' => $statistics,
                'recentActivities' => $recentActivities,
                'employee' => $employee->only(['id', 'first_name', 'last_name']),
                'vacation_leave_credits' => EmployeeLeaveCredits::with('leaveType')->where('employee_id', $employee->id)->where('leave_type_id', 1)->get(),
                'sick_leave_credits' => EmployeeLeaveCredits::with('leaveType')->where('employee_id', $employee->id)->where('leave_type_id', 2)->get(),
                'leave_without_pay' => Leave::with('employee')->where('employee_id', $employee->id)->where('status', 'approved')->where('isWithPay', 0)->count(),
            ]);
        } else {

            // $leaveRequests = Leave::with('employee')
            //     ->where("status", 'Pending')
            //     ->where(function ($q) {
            //         $q->whereNull('approved_by')
            //         ->orWhereNotNull('approved_by_hr');
            //     })
            //     ->when($employeeRole !== 'HR', function ($query) {
            //         $query->whereHas('employee', function ($q) {
            //             $q->where('head_or_manager', auth()->user()->employee->employee_id);
            //         });
            //     })
            //     ->latest()
            //     ->take(5)
            //     ->get()
            //     ->map(function ($leave) {
            //         return [
            //             'name'       => optional($leave->employee)->first_name . ' ' . optional($leave->employee)->last_name ?? 'Unknown',
            //             'type'       => $leave->leave_type ?? 'N/A',
            //             'days'       => $leave->day,
            //             'start_date' => $leave->start_date,
            //             'end_date'   => $leave->end_date,
            //             'status'     => $leave->status,
            //         ];
            //     });

            // $overtimeRequests = EmployeeOvertime::with('employee')
            //     ->where("status", 'Pending')
            //     ->where(function ($q) {
            //         $q->whereNull('approved_by')
            //         ->orWhereNull('approved_by_hr');
            //     })
            //     ->when($employeeRole !== 'HR' && $employeeRole !== 'SuperAdmin', function ($query) {
            //         $query->whereHas('employee', function ($q) {
            //             $q->where('head_or_manager', auth()->user()->employee->employee_id);
            //         });
            //     })
            //     ->latest()
            //     ->take(5)
            //     ->get()
            //     ->map(function ($overtime) {
            //         return [
            //             'name'            => optional($overtime->employee)->first_name . ' ' . optional($overtime->employee)->last_name ?? 'Unknown',
            //             'date'            => $overtime->date,
            //             'requested_hours' => $overtime->requested_hours,
            //             'approved_hours'  => $overtime->approved_hours,
            //             'status'          => $overtime->status,
            //         ];
            //     });

            $leaveRequests = Leave::with('employee')
                ->where('status', 'Pending')
                ->where(function ($q) {
                    $q->whereNull('approved_by')
                        ->orWhereNull('approved_by_hr');
                })
                ->when($employeeRole !== 'HR' && $employeeRole !== 'SuperAdmin' && $employeeRole !== 'Admin', function ($query) {
                    $query->whereHas('employee', function ($q) {
                        $q->where('head_or_manager', auth()->user()->employee->employee_id);
                    });
                })
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($leave) {
                    return [
                        'request_type' => 'leave',
                        'name' => optional($leave->employee)->first_name.' '.optional($leave->employee)->last_name ?? 'Unknown',
                        'type' => $leave->leave_type ?? 'N/A',
                        'days' => $leave->day,
                        'date' => $leave->created_at,
                        'start_date' => $leave->start_date,
                        'end_date' => $leave->end_date,
                        'status' => $leave->status,
                    ];
                });

            $overtimeRequests = EmployeeOvertime::with('employee')
                ->where('status', 'Pending')
                ->where(function ($q) {
                    $q->whereNull('approved_by')
                        ->orWhereNull('approved_by_hr');
                })
                ->when($employeeRole !== 'HR' && $employeeRole !== 'SuperAdmin' && $employeeRole !== 'Admin', function ($query) {
                    $query->whereHas('employee', function ($q) {
                        $q->where('head_or_manager', auth()->user()->employee->employee_id);
                    });
                })
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($overtime) {
                    return [
                        'request_type' => 'overtime',
                        'name' => optional($overtime->employee)->first_name.' '.optional($overtime->employee)->last_name ?? 'Unknown',
                        'type' => 'Overtime',
                        'date' => $overtime->date,
                        'requested_hours' => $overtime->requested_hours,
                        'approved_hours' => $overtime->approved_hours,
                        'status' => $overtime->status,
                    ];
                });

            $combinedRequests = collect(); // initialize empty collection

            $combinedRequests = $combinedRequests->merge($leaveRequests);
            $combinedRequests = $combinedRequests->merge($overtimeRequests);
            $combinedRequests = $combinedRequests->sortByDesc('date')->values();

            return Inertia::render('Dashboard', [
                'user' => auth(),
                'total_employees' => Employee::count(),
                'total_leaves' => Leave::count(),
                'total_on_leave' => Leave::with('employee')->where('status', 'approved')
                    ->when($employeeRole !== 'HR', function ($query) {
                        $query->whereHas('employee', function ($q) {
                            $q->where('head_or_manager', auth()->user()->employee->employee_id);
                        });
                    })
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now())->count(),
                'leave_requests' => $leaveRequests,
                'overtime_requests' => $overtimeRequests,
                'pending_requests' => $combinedRequests,
            ]);

        }
    }

    public function punchIn(Request $request)
    {
        Log::debug('Starting punch in', ['employee_id' => auth()->user()->employee->id]);

        try {
            DB::beginTransaction();

            $employee = auth()->user()->employee;
            $today = Carbon::today()->toDateString();
            $dayOfWeek = strtolower(Carbon::today()->format('D'));

            // Get the active schedule
            $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                ->where('effective_from', '<=', $today)
                ->where(function ($query) use ($today) {
                    $query->where('effective_until', '>=', $today)
                        ->orWhereNull('effective_until');
                })
                ->orderBy('id', 'desc') // Latest schedule
                ->first();

            if (! $schedule) {
                throw new \Exception('No active schedule found.');
            }

            $punchIn = Carbon::now();
            $expectedStart = null;
            if ($schedule->schedule_type === 'fixed') {
                $expectedStart = Carbon::parse($today.' '.$schedule->start_time);
            } elseif ($schedule->schedule_type === 'flexible' && isset($schedule->working_days[$dayOfWeek])) {
                $startTimes = $schedule->working_days[$dayOfWeek];
                $expectedStart = Carbon::parse($today.' '.$startTimes[0]); // First start time
            }
            $status = $expectedStart && $punchIn->greaterThan($expectedStart->copy()->addMinutes(15)) ? 'Late' : 'Present';

            // Check the last log to prevent double punch-in
            $lastLog = AttendanceLog::where('employee_id', $employee->id)
                ->whereDate('timestamp', $today)
                ->orderBy('timestamp', 'desc')
                ->first();

            if ($lastLog && $lastLog->type === 'in' && $lastLog->timestamp->isToday()) {
                throw new \Exception('You are already punched in. Please punch out first.');
            }

            // Get or create attendance record
            $attendance = EmployeeAttendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->orderBy('id', 'desc')
                ->first();

            // Calculate break hours based on last punch-out
            // $lastOutLog = AttendanceLog::where('employee_id', $employee->id)
            //     ->where('attendance_id', $attendance->id)
            //     ->where('type', 'out')
            //     ->orderBy('timestamp', 'desc')
            //     ->first();
            $lastOutLog = null;
            if ($attendance) {
                $lastOutLog = AttendanceLog::where('employee_id', $employee->id)
                    ->where('attendance_id', $attendance->id)
                    ->where('type', 'out')
                    ->orderBy('timestamp', 'desc')
                    ->first();
            }

            $breakHours = $attendance->break_hours ?? 0.0;
            if ($lastOutLog && $lastOutLog->timestamp->lt($punchIn)) {
                $breakDuration = $lastOutLog->timestamp->diffInMinutes($punchIn);
                if ($breakDuration >= 30 && $breakDuration <= 120) { // Reasonable break window
                    $breakHours += $breakDuration / 60;
                    $attendance->update(['break_hours' => round($breakHours, 2)]);
                }
            }

            if (! $attendance) {
                $attendance = EmployeeAttendance::create([
                    'employee_id' => $employee->id,
                    'date' => $today,
                    'punch_in' => $punchIn,
                    'status' => $status,
                    'break_hours' => 0.0,
                ]);
            } else {
                if (is_null($attendance->punch_out)) {
                    $attendance->update(['punch_in' => $punchIn, 'status' => $status]);
                } else {
                    $attendance = EmployeeAttendance::create([
                        'employee_id' => $employee->id,
                        'date' => $today,
                        'punch_in' => $punchIn,
                        'status' => $status,
                        'break_hours' => 0.0,
                    ]);
                }
            }

            // Log the punch-in event
            AttendanceLog::create([
                'employee_id' => $employee->id,
                'attendance_id' => $attendance->id,
                'timestamp' => $punchIn,
                'type' => 'in',
            ]);

            Log::info('Punched in', ['attendance_id' => $attendance->id, 'punch_in' => $punchIn, 'break_hours' => $breakHours]);

            DB::commit();

            return Redirect::route('attendance.list')->with('success', 'Punched in successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error punching in', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Failed to punch in: '.$e->getMessage());
        }
    }

    public function punchOut(Request $request)
    {
        Log::debug('Starting punch out', ['employee_id' => auth()->user()->employee->id]);

        try {
            DB::beginTransaction();

            $employee = auth()->user()->employee;
            $today = Carbon::today()->toDateString();
            $dayOfWeek = strtolower(Carbon::today()->format('D'));

            // Get the active schedule
            $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                ->where('effective_from', '<=', $today)
                ->where(function ($query) use ($today) {
                    $query->where('effective_until', '>=', $today)
                        ->orWhereNull('effective_until');
                })
                ->orderBy('id', 'desc') // Latest schedule
                ->first();

            if (! $schedule) {
                throw new \Exception('No active schedule found.');
            }

            $punchOut = Carbon::now();
            $expectedEnd = null;
            if ($schedule->schedule_type === 'fixed') {
                $expectedEnd = Carbon::parse($today.' '.$schedule->end_time);
            } elseif ($schedule->schedule_type === 'flexible' && isset($schedule->working_days[$dayOfWeek])) {
                $endTimes = $schedule->working_days[$dayOfWeek];
                $expectedEnd = Carbon::parse($today.' '.end($endTimes)); // Last end time
            }

            // Find the latest attendance record without punch_out
            $attendance = EmployeeAttendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->whereNull('punch_out')
                ->orderBy('id', 'desc')
                ->first();

            if (! $attendance) {
                throw new \Exception('No active punch-in record found for today.');
            }

            // Check for double punch-out
            $lastLog = AttendanceLog::where('employee_id', $employee->id)
                ->where('attendance_id', $attendance->id)
                ->orderBy('timestamp', 'desc')
                ->first();
            if ($lastLog && $lastLog->type === 'out' && $lastLog->timestamp->isToday()) {
                throw new \Exception('You are already punched out. Please punch in to continue.');
            }

            $lastInLog = AttendanceLog::where('employee_id', $employee->id)
                ->where('attendance_id', $attendance->id)
                ->where('type', 'in')
                ->orderBy('timestamp', 'desc')
                ->first();
            $hoursWorked = $lastInLog ? ($punchOut->timestamp - Carbon::parse($lastInLog->timestamp)->timestamp) / 3600 : 0.0;
            $productionHours = $hoursWorked - $attendance->break_hours;

            // Calculate overtime
            $overtimeHours = 0;
            $scheduledHours = $expectedEnd ? $expectedEnd->diffInHours(Carbon::parse($today.' '.($schedule->schedule_type === 'flexible' ? $schedule->working_days[$dayOfWeek][0] : $schedule->start_time))) : 8;

            if ($expectedEnd) {
                if ($punchOut->greaterThan($expectedEnd->copy()->addMinutes(30))) {
                    $excessMinutes = $punchOut->diffInMinutes($expectedEnd);
                    $overtimeHours = $excessMinutes / 60;
                    $overtimeHours = max(0, $overtimeHours - max(0, $productionHours - $scheduledHours));

                    EmployeeOvertime::create([
                        'employee_id' => $employee->id,
                        'date' => $today,
                        'requested_hours' => round($overtimeHours, 2),
                        'notes' => 'Auto-generated from late punch-out',
                        'status' => 'Pending',
                    ]);

                    Log::info('Overtime request created', [
                        'employee_id' => $employee->id,
                        'hours' => $overtimeHours,
                    ]);
                }
            }

            // Update attendance
            $attendance->update([
                'punch_out' => $punchOut,
                'overtime_hours' => round($overtimeHours, 2),
                'status' => $productionHours < $scheduledHours && $attendance->status !== 'Late' ? 'Present' : $attendance->status,
            ]);

            // Log the punch-out event
            AttendanceLog::create([
                'employee_id' => $employee->id,
                'attendance_id' => $attendance->id,
                'timestamp' => $punchOut,
                'type' => 'out',
            ]);

            Log::info('Punched out', ['attendance_id' => $attendance->id, 'punch_out' => $punchOut]);

            DB::commit();

            return Redirect::route('attendance.list')->with('success', 'Punched out successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error punching out', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Failed to punch out: '.$e->getMessage());
        }
    }
}
