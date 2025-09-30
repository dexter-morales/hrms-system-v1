<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmployeeScheduleController extends Controller
{
    public function index()
    {
        $schedules = EmployeeSchedule::with('employee:id,first_name,last_name,employee_id')
            ->select('id', 'employee_id', 'schedule_type', 'working_days', 'start_time', 'end_time', 'effective_from', 'effective_until')
            ->where('employee_id', '!=', 1) // Exclude super admin (employee.id = 1)
            ->get()
            ->map(function ($schedule) {
                Log::channel('employee_schedules')->info("Raw working_days for schedule {$schedule->id}:", [
                    'value' => $schedule->working_days,
                    'type' => gettype($schedule->working_days),
                    'data' => $schedule->toArray(),
                ]);

                if (is_string($schedule->working_days)) {
                    $decoded = json_decode($schedule->working_days, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        Log::error("JSON decode error for schedule {$schedule->id}:", [
                            'error' => json_last_error_msg(),
                            'working_days' => $schedule->working_days,
                            'schedule' => $schedule->toArray(),
                        ]);
                        $schedule->working_days = [];
                    } else {
                        $schedule->working_days = is_array($decoded) ? $decoded : [];
                    }
                } elseif (! is_array($schedule->working_days)) {
                    Log::warning("Unexpected working_days type for schedule {$schedule->id}:", [
                        'type' => gettype($schedule->working_days),
                        'value' => $schedule->working_days,
                        'schedule' => $schedule->toArray(),
                    ]);
                    $schedule->working_days = [];
                }

                Log::channel('employee_schedules')->info("Decoded working_days for schedule {$schedule->id}:", [
                    'value' => $schedule->working_days,
                    'schedule_id' => $schedule->id,
                    'employee_id' => $schedule->employee_id,
                    'schedule_type' => $schedule->schedule_type,
                    'effective_from' => $schedule->effective_from,
                    'effective_until' => $schedule->effective_until,
                ]);

                return $schedule;
            });

        Log::channel('employee_schedules')->info('Fetched all schedules:', [
            'count' => $schedules->count(),
            'schedules' => $schedules->map->only(['id', 'employee_id', 'schedule_type'])->toArray(),
        ]);

        // Get all employees excluding id = 1
        $allEmployees = Employee::select('id', 'first_name', 'last_name', 'avatar', 'employee_id')
            ->where('id', '!=', 1)
            ->get();

        // Get employees with schedules (their employee_ids)
        $employeesWithSchedules = $schedules->pluck('employee_id')->unique();

        // Filter employees to get those without schedules
        $employeesNoSchedule = $allEmployees->whereNotIn('id', $employeesWithSchedules)->values();

        return Inertia::render('Schedules/EmployeeScheduleManager', [
            'employees' => $allEmployees, // All employees except id = 1
            'employees_no_schedule' => $employeesNoSchedule, // Only employees without schedules
            'schedules' => $schedules,
        ]);
    }

    /**
     * Store a newly created employee schedule in storage.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        Log::info('Schedule store request:', $request->all());

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id', 'not_in:1'], // Exclude super admin
            'schedule_type' => ['required', 'in:fixed,flexible'],
            'working_days' => ['required_if:schedule_type,fixed', 'nullable', 'array'],
            'working_days.*' => ['in:mon,tue,wed,thu,fri,sat,sun'],
            'flexible_days' => ['required_if:schedule_type,flexible', 'nullable', 'array'],
            'flexible_days.*.day' => ['in:mon,tue,wed,thu,fri,sat,sun'],
            'flexible_days.*.start' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'flexible_days.*.end' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/', 'after:flexible_days.*.start'],
            'start_time' => ['required_if:schedule_type,fixed', 'nullable', 'date_format:H:i'],
            'end_time' => ['required_if:schedule_type,fixed', 'nullable', 'date_format:H:i', 'after:start_time'],
            'effective_from' => ['required', 'date'],
            'effective_until' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        // Check if a schedule already exists for the employee
        $existingSchedule = EmployeeSchedule::where('employee_id', $validated['employee_id'])->first();
        if ($existingSchedule) {
            return redirect()->route('schedules.employee.index')->with('error', 'This employee already has a schedule.');
        }

        $workingDays = $validated['schedule_type'] === 'fixed'
            ? $validated['working_days']
            : collect($validated['flexible_days'])->keyBy('day')->map(function ($item) {
                return [$item['start'], $item['end']];
            })->toArray();

        $scheduleData = [
            'employee_id' => $validated['employee_id'],
            'schedule_type' => $validated['schedule_type'],
            'working_days' => json_encode($workingDays),
            'start_time' => $validated['schedule_type'] === 'fixed' ? $validated['start_time'] : null,
            'end_time' => $validated['schedule_type'] === 'fixed' ? $validated['end_time'] : null,
            'effective_from' => $validated['effective_from'],
            'effective_until' => $validated['effective_until'],
        ];

        $schedule = EmployeeSchedule::create($scheduleData);

        Log::channel('employee_schedules')->info("Schedule created for employee {$schedule->employee_id}:", [
            'schedule_id' => $schedule->id,
            'data' => $scheduleData,
        ]);

        return redirect()->route('schedules.employee.index')->with('success', 'Schedule created!');
    }

    public function update(Request $request, EmployeeSchedule $schedule)
    {
        Log::info('Schedule update request:', $request->all());

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id', 'not_in:1'], // Exclude super admin
            'schedule_type' => ['required', 'in:fixed,flexible'],
            'working_days' => ['required_if:schedule_type,fixed', 'nullable', 'array'],
            'working_days.*' => ['in:mon,tue,wed,thu,fri,sat,sun'],
            'flexible_days' => ['required_if:schedule_type,flexible', 'nullable', 'array'],
            'flexible_days.*.day' => ['in:mon,tue,wed,thu,fri,sat,sun'],
            'flexible_days.*.start' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'flexible_days.*.end' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/', 'after:flexible_days.*.start'],
            'start_time' => ['required_if:schedule_type,fixed', 'nullable', 'date_format:H:i'],
            'end_time' => ['required_if:schedule_type,fixed', 'nullable', 'date_format:H:i', 'after:start_time'],
            'effective_from' => ['required', 'date'],
            'effective_until' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        // Ensure the update is for the same employee
        if ($schedule->employee_id != $validated['employee_id']) {
            $existingSchedule = EmployeeSchedule::where('employee_id', $validated['employee_id'])->first();
            if ($existingSchedule && $existingSchedule->id != $schedule->id) {
                return redirect()->route('schedules.employee.index')->with('error', 'This employee already has a schedule.');
            }
        }

        $workingDays = $validated['schedule_type'] === 'fixed'
            ? $validated['working_days']
            : collect($validated['flexible_days'])->keyBy('day')->map(function ($item) {
                return [$item['start'], $item['end']];
            })->toArray();

        $oldData = $schedule->toArray();
        $newData = [
            'employee_id' => $validated['employee_id'],
            'schedule_type' => $validated['schedule_type'],
            'working_days' => json_encode($workingDays),
            'start_time' => $validated['schedule_type'] === 'fixed' ? $validated['start_time'] : null,
            'end_time' => $validated['schedule_type'] === 'fixed' ? $validated['end_time'] : null,
            'effective_from' => $validated['effective_from'],
            'effective_until' => $validated['effective_until'],
        ];

        $schedule->update($newData);

        Log::channel('employee_schedules')->info("Schedule updated for employee {$schedule->employee_id}:", [
            'schedule_id' => $schedule->id,
            'old_data' => array_intersect_key($oldData, $newData),
            'new_data' => $newData,
        ]);

        return redirect()->route('schedules.employee.index')->with('success', 'Schedule updated!');
    }

    public function destroy(EmployeeSchedule $schedule)
    {
        Log::info('Deleting schedule:', ['id' => $schedule->id]);

        $oldData = $schedule->toArray();

        $schedule->delete();

        Log::channel('employee_schedules')->info("Schedule deleted for employee {$schedule->employee_id}:", [
            'schedule_id' => $schedule->id,
            'old_data' => $oldData,
        ]);

        return redirect()->route('schedules.employee.index')->with('success', 'Schedule deleted!');
    }
}
