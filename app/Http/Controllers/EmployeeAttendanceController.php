<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeOvertime;
use App\Models\EmployeeSchedule;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\RoleAccess;
use App\Models\Site;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmployeeAttendanceController extends Controller
{
    public function index()
    {
        try {
            Log::channel('employee_attendance')->info('Fetching employee attendance list');

            $currentMonth = Carbon::now()->month; // e.g., 6 for June
            $daysInMonth = Carbon::now()->daysInMonth; // e.g., 30 for June 2025

            $attendances = EmployeeAttendance::with('employee')->get();
            $employees = Employee::with([
                'user',
                'department',
                'site',
                'position',
                'employmentType',
                'employmentStatus',
            ])->get();

            Log::channel('employee_attendance')->info('Successfully fetched attendance data', [
                'attendance_count' => $attendances->count(),
                'employee_count' => $employees->count(),
            ]);

            return Inertia::render('Attendances/EmployeeAttendanceList', [
                'attendances' => $attendances,
                'employees' => $employees,
                'currentMonth' => $currentMonth,
                'daysInMonth' => $daysInMonth,
            ]);
        } catch (\Exception $e) {
            Log::channel('employee_attendance')->error('Error fetching employee attendance list: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'An error occurred while fetching attendance data. Please check the logs.');
        }
    }

    public function AdminIndex()
    {
        try {
            Log::channel('employee_attendance')->info('Fetching admin employee attendance view');

            $currentMonth = Carbon::now()->month; // 6 for June
            $daysInMonth = Carbon::now()->daysInMonth; // 30 for June 2025

            $employees = Employee::with('roles')
                ->where('id', '!=', 1)
                ->get()->map(function ($employee) {
                    return [
                        'id' => $employee->id,
                        'first_name' => $employee->first_name,
                        'last_name' => $employee->last_name,
                        'employee_id' => $employee->employee_id,
                        'payroll_status' => $employee->payroll_status,
                        'avatar' => $employee->avatar,
                        'roles' => RoleAccess::where('id', $employee->role_access_id)->first(),
                    ];
                });

            $attendances = EmployeeAttendance::where('id', '!=', 1)
                ->get();

            $schedules = EmployeeSchedule::select('employee_id', 'schedule_type', 'working_days', 'start_time', 'end_time', 'effective_from', 'effective_until')
                ->where(function ($query) use ($currentMonth) {
                    $query->where(function ($q) use ($currentMonth) {
                        $q->whereYear('effective_from', 2025)
                            ->whereMonth('effective_from', '<=', $currentMonth)
                            ->orWhereNull('effective_from');
                    })
                        ->where(function ($q) use ($currentMonth) {
                            $q->whereYear('effective_until', 2025)
                                ->whereMonth('effective_until', '>=', $currentMonth)
                                ->orWhereNull('effective_until');
                        });
                })
                ->get();

            $holidays = Holiday::select('id', 'date_holiday', 'name_holiday', 'description', 'holiday_type')
                ->whereMonth('date_holiday', $currentMonth)
                ->whereYear('date_holiday', 2025)
                ->get();

            $sites = Site::select('id', 'name')->get();
            $role_access = RoleAccess::all();
            $leaves = Leave::with('employee')->get();

            Log::channel('employee_attendance')->info('Successfully fetched admin attendance view data', [
                'employee_count' => $employees->count(),
                'attendance_count' => $attendances->count(),
                'schedule_count' => $schedules->count(),
                'holiday_count' => $holidays->count(),
            ]);

            return Inertia::render('Attendances/EmployeeAttendanceView', [
                'employees' => $employees,
                'attendances' => $attendances,
                'schedules' => $schedules,
                'holidays' => $holidays,
                'currentMonth' => $currentMonth,
                'sites' => $sites,
                'daysInMonth' => $daysInMonth,
                'role_access' => $role_access,
                'leaves' => $leaves,
            ]);
        } catch (\Exception $e) {
            Log::channel('employee_attendance')->error('Error fetching admin attendance view: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'An error occurred while fetching admin attendance data. Please check the logs.');
        }
    }

    // public function import(Request $request)
    // {
    //     try {
    //         Log::channel('employee_attendance')->info('Starting attendance import', ['request' => $request->all()]);

    //         $attendances = $request->input('attendances', []);

    //         foreach ($attendances as $attendance) {
    //             $employee = Employee::where('id', $attendance['employee_id'])->first();
    //             if (! $employee) {
    //                 Log::channel('employee_attendance')->warning('Employee not found during import', [
    //                     'employee_id' => $attendance['employee_id'],
    //                 ]);

    //                 return back()->with([
    //                     'error' => "Employee with ID {$attendance['employee_id']} not found.",
    //                 ]);
    //             }

    //             $punchOut = Carbon::parse($attendance['time_out']);
    //             $punchInDate = Carbon::parse($attendance['date']);
    //             $dayOfWeek = strtolower($punchOut->format('D'));

    //             $schedule = EmployeeSchedule::where('employee_id', $employee->id)
    //                 ->where('effective_from', '<=', $punchInDate)
    //                 ->where(function ($query) use ($punchInDate) {
    //                     $query->where('effective_until', '>=', $punchInDate)
    //                         ->orWhereNull('effective_until');
    //                 })
    //                 ->orderBy('effective_from', 'desc')
    //                 ->first();

    //             if (! $schedule) {
    //                 Log::channel('employee_attendance')->warning('No active schedule found for employee during import', [
    //                     'employee_id' => $employee->id,
    //                     'date' => $punchInDate,
    //                 ]);
    //             }

    //             $expectedEnd = null;
    //             if ($schedule) {
    //                 if ($schedule->schedule_type === 'fixed') {
    //                     $expectedEnd = Carbon::parse($punchInDate.' '.$schedule->end_time);
    //                     if ($schedule->end_time === '04:00:00' && $punchOut->hour < 8) {
    //                         $expectedEnd->addDay();
    //                     }
    //                 } elseif ($schedule->schedule_type === 'flexible' && isset($schedule->working_days[$dayOfWeek])) {
    //                     $endTimes = $schedule->working_days[$dayOfWeek];
    //                     $expectedEnd = Carbon::parse($punchInDate.' '.end($endTimes));
    //                     if (end($endTimes) === '04:00:00' && $punchOut->hour < 8) {
    //                         $expectedEnd->addDay();
    //                     }
    //                 }
    //             }

    //             $scheduledHours = $expectedEnd
    //                 ? $expectedEnd->diffInHours(Carbon::parse($punchInDate.' '.($schedule->schedule_type === 'flexible' ? $schedule->working_days[$dayOfWeek][0] : $schedule->start_time)))
    //                 : 8;

    //             $punchIn = $punchOut->copy()->subHours(min($scheduledHours, 8));
    //             $hoursWorked = ($punchOut->timestamp - $punchIn->timestamp) / 3600 - ($attendance['break_hours'] ?? 0);
    //             $productionHours = $hoursWorked;

    //             $overtimeHours = 0;

    //             dd(['employee_id' => $employee->id,
    //                 'expectedEnd' => $expectedEnd,
    //                 'punchOut' => $punchOut,
    //                 // 'expectedEnd30' => $expectedEnd->copy()->addMinutes(30)
    //                 ]
    //             );
    //             if ($expectedEnd && $punchOut->greaterThan($expectedEnd->copy()->addMinutes(30))) {
    //                 $excessMinutes = $punchOut->diffInMinutes($expectedEnd);
    //                 $overtimeHours = $excessMinutes / 60;
    //                 $overtimeHours = max(0, $overtimeHours - max(0, $productionHours - $scheduledHours));

    //                 EmployeeOvertime::create([
    //                     'employee_id' => $employee->id,
    //                     'date' => $punchInDate,
    //                     'requested_hours' => round($overtimeHours, 2),
    //                     'notes' => 'Auto-generated from attendance import due to late punch-out',
    //                     'status' => 'Pending',
    //                 ]);

    //                 Log::channel('employee_attendance')->info('Overtime request created from attendance import', [
    //                     'employee_id' => $employee->id,
    //                     'date' => $punchInDate,
    //                     'hours' => $overtimeHours,
    //                 ]);
    //             }

    //             EmployeeAttendance::updateOrCreate(
    //                 [
    //                     'employee_id' => $employee->id,
    //                     'date' => $attendance['date'],
    //                 ],
    //                 [
    //                     'punch_in' => $attendance['time_in'],
    //                     'punch_out' => $attendance['time_out'],
    //                     'break_hours' => $attendance['break_hours'],
    //                     'site_id' => $attendance['location'],
    //                     'overtime_hours' => round($overtimeHours, 2),
    //                     'status' => $productionHours < $scheduledHours && ! $overtimeHours ? 'Present' : ($overtimeHours ? 'Overtime' : 'Present'),
    //                 ]
    //             );
    //         }

    //         Log::channel('employee_attendance')->info('Attendance imported successfully', [
    //             'attendance_count' => count($attendances),
    //         ]);

    //         return redirect()->route('employee.adminIndex')->with('success', 'Attendance imported successfully.');
    //     } catch (\Exception $e) {
    //         Log::channel('employee_attendance')->error('Error importing attendance: '.$e->getMessage(), [
    //             'trace' => $e->getTraceAsString(),
    //         ]);

    //         return back()->with('error', 'An error occurred while importing attendance. Please check the logs.');
    //     }
    // }

    // public function import(Request $request)
    // {
    //     try {
    //         Log::channel('employee_attendance')->info('Starting attendance import', ['request' => $request->all()]);

    //         $attendances = $request->input('attendances', []);

    //         foreach ($attendances as $attendance) {
    //             $employee = Employee::where('id', $attendance['employee_id'])->first();
    //             if (! $employee) {
    //                 Log::channel('employee_attendance')->warning('Employee not found during import', [
    //                     'employee_id' => $attendance['employee_id'],
    //                 ]);

    //                 return back()->with([
    //                     'error' => "Employee with ID {$attendance['employee_id']} not found.",
    //                 ]);
    //             }

    //             $punchOut = Carbon::parse($attendance['time_out']);
    //             $punchInDate = Carbon::parse($attendance['date']);
    //             $dayOfWeek = strtolower($punchOut->format('D'));

    //             $schedule = EmployeeSchedule::where('employee_id', $employee->id)
    //                 ->where('effective_from', '<=', $punchInDate)
    //                 ->where(function ($query) use ($punchInDate) {
    //                     $query->where('effective_until', '>=', $punchInDate)
    //                         ->orWhereNull('effective_until');
    //                 })
    //                 ->orderBy('effective_from', 'desc')
    //                 ->first();

    //             if (! $schedule) {
    //                 Log::channel('employee_attendance')->warning('No active schedule found for employee during import', [
    //                     'employee_id' => $employee->id,
    //                     'date' => $punchInDate,
    //                 ]);
    //             }

    //             $expectedEnd = null;
    //             if ($schedule) {
    //                 Log::channel('employee_attendance')->info('Schedule found', [
    //                     'schedule_id' => $schedule->id,
    //                     'schedule_type' => $schedule->schedule_type,
    //                     'working_days' => $schedule->working_days,
    //                     'effective_from' => $schedule->effective_from,
    //                     'effective_until' => $schedule->effective_until,
    //                 ]);

    //                 if ($schedule->schedule_type === 'fixed') {
    //                     $expectedEnd = Carbon::parse($punchInDate->toDateString().' '.$schedule->end_time);
    //                     Log::channel('employee_attendance')->info('Fixed schedule end time', ['end_time' => $schedule->end_time, 'expectedEnd' => $expectedEnd]);
    //                     if ($schedule->end_time === '04:00:00' && $punchOut->hour < 8) {
    //                         $expectedEnd->addDay();
    //                         Log::channel('employee_attendance')->info('Added day to expectedEnd', ['expectedEnd' => $expectedEnd]);
    //                     }
    //                 } elseif ($schedule->schedule_type === 'flexible') {
    //                     // Parse the JSON string from working_days
    //                     $workingDays = json_decode($schedule->working_days, true);
    //                     Log::channel('employee_attendance')->info('Decoded working days', ['workingDays' => $workingDays, 'dayOfWeek' => $dayOfWeek]);

    //                     if (isset($workingDays[$dayOfWeek]) && is_array($workingDays[$dayOfWeek])) {
    //                         $endTimes = $workingDays[$dayOfWeek];
    //                         $endTime = end($endTimes);
    //                     } else {
    //                         $endTime = '17:00:00'; // Default end time if day is missing
    //                         Log::channel('employee_attendance')->warning('Missing day in working_days, using default', ['dayOfWeek' => $dayOfWeek]);
    //                     }
    //                     // Ensure the end time is in HH:MM format and append :00 for seconds
    //                     $endTime = sprintf('%s:00', preg_replace('/^(\d{2}:\d{2}).*$/', '$1', $endTime));
    //                     $expectedEnd = Carbon::createFromFormat('Y-m-d H:i:s', $punchInDate->toDateString().' '.$endTime);
    //                     Log::channel('employee_attendance')->info('Parsed end time', ['endTime' => $endTime, 'expectedEnd' => $expectedEnd]);

    //                     if ($endTime === '04:00:00' && $punchOut->hour < 8) {
    //                         $expectedEnd->addDay();
    //                         Log::channel('employee_attendance')->info('Added day to expectedEnd for flexible', ['expectedEnd' => $expectedEnd]);
    //                     }
    //                 }
    //             } else {
    //                 Log::channel('employee_attendance')->warning('No schedule found for employee', [
    //                     'employee_id' => $employee->id,
    //                     'date' => $punchInDate,
    //                 ]);
    //             }

    //             $scheduledHours = $expectedEnd
    //                 ? $expectedEnd->diffInHours(Carbon::parse($punchInDate->toDateString().' '.($schedule->schedule_type === 'flexible' && $workingDays[$dayOfWeek] ? $workingDays[$dayOfWeek][0] : $schedule->start_time)))
    //                 : 8;

    //             $punchIn = $punchOut->copy()->subHours(min($scheduledHours, 8));
    //             $hoursWorked = ($punchOut->timestamp - $punchIn->timestamp) / 3600 - ($attendance['break_hours'] ?? 0);
    //             $productionHours = $hoursWorked;

    //             $overtimeHours = 0;

    //             if ($expectedEnd && $punchOut->greaterThan($expectedEnd->copy()->addMinutes(30))) {
    //                 $excessMinutes = $punchOut->diffInMinutes($expectedEnd);
    //                 $overtimeHours = $excessMinutes / 60;
    //                 // Adjust overtime to exclude hours worked within scheduled hours
    //                 $overtimeHours = max(0, $overtimeHours - max(0, $productionHours - $scheduledHours));

    //                 EmployeeOvertime::create([
    //                     'employee_id' => $employee->id,
    //                     'date' => $punchInDate,
    //                     'requested_hours' => round($overtimeHours, 2),
    //                     'notes' => 'Auto-generated from attendance import due to late punch-out',
    //                     'status' => 'Pending',
    //                 ]);

    //                 Log::channel('employee_attendance')->info('Overtime request created from attendance import', [
    //                     'employee_id' => $employee->id,
    //                     'date' => $punchInDate,
    //                     'hours' => $overtimeHours,
    //                 ]);
    //             }

    //             EmployeeAttendance::updateOrCreate(
    //                 [
    //                     'employee_id' => $employee->id,
    //                     'date' => $attendance['date'],
    //                 ],
    //                 [
    //                     'punch_in' => $attendance['time_in'],
    //                     'punch_out' => $attendance['time_out'],
    //                     'break_hours' => $attendance['break_hours'],
    //                     'site_id' => $attendance['location'],
    //                     'overtime_hours' => round($overtimeHours, 2),
    //                     'status' => $productionHours < $scheduledHours && ! $overtimeHours ? 'Present' : ($overtimeHours ? 'Overtime' : 'Present'),
    //                 ]
    //             );
    //         }

    //         Log::channel('employee_attendance')->info('Attendance imported successfully', [
    //             'attendance_count' => count($attendances),
    //         ]);

    //         return redirect()->route('employee.adminIndex')->with('success', 'Attendance imported successfully.');
    //     } catch (\Exception $e) {
    //         Log::channel('employee_attendance')->error('Error importing attendance: '.$e->getMessage(), [
    //             'trace' => $e->getTraceAsString(),
    //         ]);

    //         return back()->with('error', 'An error occurred while importing attendance. Please check the logs.');
    //     }
    // }

    public function import(Request $request)
    {
        try {
            Log::channel('employee_attendance')->info('Starting attendance import', ['request' => $request->all()]);

            $attendances = $request->input('attendances', []);

            foreach ($attendances as $attendance) {
                $employee = Employee::where('id', $attendance['employee_id'])->first();
                if (! $employee) {
                    Log::channel('employee_attendance')->warning('Employee not found during import', [
                        'employee_id' => $attendance['employee_id'],
                    ]);

                    return back()->with([
                        'error' => "Employee with ID {$attendance['employee_id']} not found.",
                    ]);
                }

                // Handle missing or invalid time_in/time_out
                $punchIn = isset($attendance['time_in']) && $attendance['time_in'] ? Carbon::parse($attendance['time_in']) : null;
                $punchOut = isset($attendance['time_out']) && $attendance['time_out'] ? Carbon::parse($attendance['time_out']) : null;
                $punchInDate = $punchIn ? $punchIn->copy() : (isset($attendance['date']) ? Carbon::parse($attendance['date']) : null);

                if (! $punchInDate) {
                    Log::channel('employee_attendance')->warning('Invalid or missing date for attendance', [
                        'employee_id' => $attendance['employee_id'],
                        'attendance' => $attendance,
                    ]);

                    continue; // Skip this record if date is invalid
                }

                $dayOfWeek = $punchInDate ? strtolower($punchInDate->format('D')) : null;

                $schedule = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('effective_from', '<=', $punchInDate)
                    ->where(function ($query) use ($punchInDate) {
                        $query->where('effective_until', '>=', $punchInDate)
                            ->orWhereNull('effective_until');
                    })
                    ->orderBy('effective_from', 'desc')
                    ->first();

                if (! $schedule) {
                    Log::channel('employee_attendance')->warning('No active schedule found for employee during import', [
                        'employee_id' => $employee->id,
                        'date' => $punchInDate,
                    ]);
                }

                $expectedEnd = null;
                $workingDays = null;
                $endTime = '18:30:00'; // Default to 18:30 based on schedule
                if ($schedule) {
                    Log::channel('employee_attendance')->info('Schedule found', [
                        'schedule_id' => $schedule->id,
                        'schedule_type' => $schedule->schedule_type,
                        'working_days' => $schedule->working_days,
                        'effective_from' => $schedule->effective_from,
                        'effective_until' => $schedule->effective_until,
                    ]);

                    if ($schedule->schedule_type === 'fixed') {
                        $expectedEnd = Carbon::parse($punchInDate->toDateString().' '.$schedule->end_time);
                        Log::channel('employee_attendance')->info('Fixed schedule end time', ['end_time' => $schedule->end_time, 'expectedEnd' => $expectedEnd]);
                        if ($schedule->end_time === '04:00:00' && $punchOut && $punchOut->hour < 8) {
                            $expectedEnd->addDay();
                            Log::channel('employee_attendance')->info('Added day to expectedEnd', ['expectedEnd' => $expectedEnd]);
                        }
                    } elseif ($schedule->schedule_type === 'flexible') {
                        $workingDays = json_decode($schedule->working_days, true);
                        Log::channel('employee_attendance')->info('Decoded working days', ['workingDays' => $workingDays, 'dayOfWeek' => $dayOfWeek]);

                        if (isset($workingDays[$dayOfWeek]) && is_array($workingDays[$dayOfWeek])) {
                            $endTimes = $workingDays[$dayOfWeek];
                            $endTime = end($endTimes);
                        } else {
                            Log::channel('employee_attendance')->warning('Missing day in working_days, using schedule default', ['dayOfWeek' => $dayOfWeek]);
                        }
                        $endTime = sprintf('%s:00', preg_replace('/^(\d{2}:\d{2}).*$/', '$1', $endTime));
                        $expectedEnd = Carbon::createFromFormat('Y-m-d H:i:s', $punchInDate->toDateString().' '.$endTime);
                        Log::channel('employee_attendance')->info('Parsed end time', ['endTime' => $endTime, 'expectedEnd' => $expectedEnd]);

                        if ($endTime === '04:00:00' && $punchOut && $punchOut->hour < 8) {
                            $expectedEnd->addDay();
                            Log::channel('employee_attendance')->info('Added day to expectedEnd for flexible', ['expectedEnd' => $expectedEnd]);
                        }
                    }
                } else {
                    Log::channel('employee_attendance')->warning('No schedule found for employee', [
                        'employee_id' => $employee->id,
                        'date' => $punchInDate,
                    ]);
                }

                $scheduledHours = $expectedEnd && $punchIn
                    ? $expectedEnd->diffInHours(Carbon::parse($punchInDate->toDateString().' '.($schedule && $schedule->schedule_type === 'flexible' && isset($workingDays[$dayOfWeek]) ? $workingDays[$dayOfWeek][0] : '09:00')))
                    : 8;

                $hoursWorked = 0;
                $overtimeHours = 0;

                if ($punchIn && $punchOut) {
                    $hoursWorked = ($punchOut->timestamp - $punchIn->timestamp) / 3600 - ($attendance['break_hours'] ?? 0);
                    if ($expectedEnd && $punchOut->greaterThan($expectedEnd)) {
                        $excessMinutes = $expectedEnd->diffInMinutes($punchOut);
                        $overtimeHours = $excessMinutes / 60;
                        // Cap overtime to a reasonable limit (e.g., 2 hours max unless specified otherwise)
                        $maxOvertime = 8; // Adjust based on policy
                        $overtimeHours = min(max(0, $overtimeHours), $maxOvertime);

                        if ($overtimeHours > 0) {
                            EmployeeOvertime::create([
                                'employee_id' => $employee->id,
                                'date' => $punchInDate,
                                'requested_hours' => round($overtimeHours, 2),
                                'notes' => 'Auto-generated from attendance import due to late clock-out',
                                'status' => 'Pending',
                            ]);

                            Log::channel('employee_attendance')->info('Overtime request created from attendance import', [
                                'employee_id' => $employee->id,
                                'date' => $punchInDate,
                                'hours' => $overtimeHours,
                            ]);
                        }
                    }
                } else {
                    Log::channel('employee_attendance')->warning('Incomplete attendance record (missing punch-in or punch-out)', [
                        'employee_id' => $employee->id,
                        'date' => $punchInDate,
                        'time_in' => $attendance['time_in'],
                        'time_out' => $attendance['time_out'],
                    ]);
                }

                $productionHours = $hoursWorked;

                EmployeeAttendance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'date' => $attendance['date'],
                    ],
                    [
                        'punch_in' => $attendance['time_in'],
                        'punch_out' => $attendance['time_out'],
                        'break_hours' => $attendance['break_hours'],
                        'site_id' => $attendance['location'],
                        'overtime_hours' => round($overtimeHours, 2),
                        // 'status' => $productionHours < $scheduledHours && ! $overtimeHours ? 'Present' : ($overtimeHours ? 'Overtime' : 'Present'),
                    ]
                );
            }

            Log::channel('employee_attendance')->info('Attendance imported successfully', [
                'attendance_count' => count($attendances),
            ]);

            return redirect()->route('employee.adminIndex')->with('success', 'Attendance imported successfully.');
        } catch (\Exception $e) {
            Log::channel('employee_attendance')->error('Error importing attendance: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'An error occurred while importing attendance. Please check the logs.');
        }
    }

    public function store(Request $request)
    {
        try {
            Log::channel('employee_attendance')->info('Attendance store request', ['request' => $request->all()]);

            $validated = $request->validate([
                'employee_id' => ['required', 'exists:employees,id'],
                'date' => ['required', 'date'],
                'punch_in' => ['required', 'date_format:Y-m-d\TH:i'],
                'punch_out' => ['nullable', 'date_format:Y-m-d\TH:i', 'after:punch_in'],
            ]);

            $data = $validated;

            if (Holiday::where('date_holiday', $data['date'])->exists()) {
                Log::channel('employee_attendance')->warning('Attempted to record attendance on a holiday', [
                    'employee_id' => $data['employee_id'],
                    'date' => $data['date'],
                ]);

                return to_route('attendances.employee.index')->with('error', 'Cannot record attendance on a holiday.');
            }

            $attendance = EmployeeAttendance::create($data);

            if ($data['punch_out']) {
                $punchIn = new \DateTime($data['punch_in']);
                $punchOut = new \DateTime($data['punch_out']);
                $hours = $punchOut->diff($punchIn)->h + ($punchOut->diff($punchIn)->i / 60);

                $schedule = $this->getScheduleForDate($data['employee_id'], $data['date']);

                if ($schedule && $schedule['hours'] > 0) {
                    if ($hours > $schedule['hours']) {
                        EmployeeOvertime::create([
                            'employee_id' => $data['employee_id'],
                            'date' => $data['date'],
                            'requested_hours' => $hours - $schedule['hours'],
                            'status' => 'Pending',
                        ]);
                        Log::channel('employee_attendance')->info('Overtime created during attendance store', [
                            'employee_id' => $data['employee_id'],
                            'date' => $data['date'],
                            'overtime_hours' => $hours - $schedule['hours'],
                        ]);
                    }
                }
            }

            Log::channel('employee_attendance')->info('Attendance recorded successfully', [
                'attendance_id' => $attendance->id,
                'employee_id' => $data['employee_id'],
                'date' => $data['date'],
            ]);

            return to_route('attendances.employee.index')->with('success', 'Attendance recorded!');
        } catch (\Exception $e) {
            Log::channel('employee_attendance')->error('Error storing attendance: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            return to_route('attendances.employee.index')->with('error', 'An error occurred while recording attendance. Please check the logs.');
        }
    }

    public function update(Request $request, EmployeeAttendance $attendance)
    {
        try {
            Log::channel('employee_attendance')->info('Attendance update request', [
                'attendance_id' => $attendance->id,
                'request' => $request->all(),
            ]);

            $validated = $request->validate([
                'employee_id' => ['required', 'exists:employees,id'],
                'date' => ['required', 'date'],
                'punch_in' => ['required', 'date_format:Y-m-d\TH:i'],
                'punch_out' => ['nullable', 'date_format:Y-m-d\TH:i', 'after:punch_in'],
            ]);

            $data = $validated;

            if (Holiday::where('date_holiday', $data['date'])->exists()) {
                Log::channel('employee_attendance')->warning('Attempted to update attendance to a holiday', [
                    'attendance_id' => $attendance->id,
                    'employee_id' => $data['employee_id'],
                    'date' => $data['date'],
                ]);

                return to_route('attendances.employee.index')->with('error', 'Cannot update attendance to a holiday.');
            }

            $attendance->update($data);

            if ($data['punch_out']) {
                $punchIn = new \DateTime($data['punch_in']);
                $punchOut = new \DateTime($data['punch_out']);
                $hours = $punchOut->diff($punchIn)->h + ($punchOut->diff($punchIn)->i / 60);

                $schedule = $this->getScheduleForDate($data['employee_id'], $data['date']);

                if ($schedule && $schedule['hours'] > 0) {
                    if ($hours > $schedule['hours']) {
                        EmployeeOvertime::updateOrCreate(
                            ['employee_id' => $data['employee_id'], 'date' => $data['date']],
                            ['requested_hours' => $hours - $schedule['hours'], 'status' => 'Pending']
                        );
                        Log::channel('employee_attendance')->info('Overtime updated during attendance update', [
                            'attendance_id' => $attendance->id,
                            'employee_id' => $data['employee_id'],
                            'date' => $data['date'],
                            'overtime_hours' => $hours - $schedule['hours'],
                        ]);
                    }
                }
            }

            Log::channel('employee_attendance')->info('Attendance updated successfully', [
                'attendance_id' => $attendance->id,
                'employee_id' => $data['employee_id'],
                'date' => $data['date'],
            ]);

            return to_route('attendances.employee.index')->with('success', 'Attendance updated!');
        } catch (\Exception $e) {
            Log::channel('employee_attendance')->error('Error updating attendance: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'attendance_id' => $attendance->id,
                'request' => $request->all(),
            ]);

            return to_route('attendances.employee.index')->with('error', 'An error occurred while updating attendance. Please check the logs.');
        }
    }

    public function destroy(EmployeeAttendance $attendance)
    {
        try {
            Log::channel('employee_attendance')->info('Deleting attendance', [
                'attendance_id' => $attendance->id,
            ]);

            $attendance->delete();

            Log::channel('employee_attendance')->info('Attendance deleted successfully', [
                'attendance_id' => $attendance->id,
            ]);

            return to_route('attendances.employee.index')->with('success', 'Attendance deleted!');
        } catch (\Exception $e) {
            Log::channel('employee_attendance')->error('Error deleting attendance: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'attendance_id' => $attendance->id,
            ]);

            return to_route('attendances.employee.index')->with('error', 'An error occurred while deleting attendance. Please check the logs.');
        }
    }

    protected function getScheduleForDate($employeeId, $date)
    {
        Log::channel('employee_attendance')->info('Fetching schedule for employee', [
            'employee_id' => $employeeId,
            'date' => $date,
        ]);

        $carbonDate = Carbon::parse($date);
        $dayAbbr = strtolower($carbonDate->format('D')); // e.g., 'mon'

        $schedule = EmployeeSchedule::where('employee_id', $employeeId)
            ->where(function ($query) use ($date) {
                $query->whereNull('effective_from')
                    ->orWhere('effective_from', '<=', $date);
            })
            ->where(function ($query) use ($date) {
                $query->whereNull('effective_until')
                    ->orWhere('effective_until', '>=', $date);
            })
            ->first();

        if (! $schedule) {
            Log::channel('employee_attendance')->warning('No schedule found for employee', [
                'employee_id' => $employeeId,
                'date' => $date,
            ]);

            return;
        }

        $workingDays = $schedule->working_days;

        if ($schedule->schedule_type === 'fixed') {
            if (! in_array($dayAbbr, $workingDays)) {
                Log::channel('employee_attendance')->info('No working day for schedule', [
                    'employee_id' => $employeeId,
                    'date' => $date,
                    'day' => $dayAbbr,
                ]);

                return;
            }
            $startTime = $schedule->start_time;
            $endTime = $schedule->end_time;
        } else {
            if (! isset($workingDays[$dayAbbr])) {
                Log::channel('employee_attendance')->info('No working day for flexible schedule', [
                    'employee_id' => $employeeId,
                    'date' => $date,
                    'day' => $dayAbbr,
                ]);

                return;
            }
            [$startTime, $endTime] = $workingDays[$dayAbbr];
        }

        $hours = (strtotime($endTime) - strtotime($startTime)) / 3600;

        Log::channel('employee_attendance')->info('Schedule retrieved successfully', [
            'employee_id' => $employeeId,
            'date' => $date,
            'hours' => $hours,
        ]);

        return [
            'start_time' => $startTime,
            'end_time' => $endTime,
            'hours' => $hours > 0 ? $hours : 0,
        ];
    }
}
