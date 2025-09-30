<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeOvertime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class EmployeeOvertimeControllerOld extends Controller
{
    public function index()
    {
        Log::debug('Fetching overtime list');
        $user = auth()->user();

        $overtimes = [];
        if (auth()->user()->roles[0]->name === 'HR' || auth()->user()->roles[0]->name === 'SuperAdmin') {
            $overtimes = EmployeeOvertime::with([
                'employee:id,first_name,last_name',
                'manager:id,first_name,last_name',
            ])->get();
            $employee_list = Employee::select('id', 'first_name', 'last_name', 'employee_id')->get();
        } elseif (auth()->user()->roles[0]->name !== 'Employee') {
            $overtimes = EmployeeOvertime::with([
                'employee:id,first_name,last_name',
                'manager:id,first_name,last_name',
            ])->whereHas('employee', function ($q) use ($user) {
                $q->where('head_or_manager', $user->employee->employee_id);
            })->get();
            $employee_list = Employee::select('id', 'first_name', 'last_name', 'employee_id')
                ->where('head_or_manager', auth()->user()->employee->employee_id)
                ->orWhere('employee_id', auth()->user()->employee->employee_id)
                ->get();
        } else {
            $employee_list = Employee::select('id', 'first_name', 'last_name', 'employee_id')->where('id', auth()->user()->employee->id)->get();
        }

        $myOvertimes = EmployeeOvertime::with([
            'employee:id,first_name,last_name',
            'manager:id,first_name,last_name',
        ])->where('employee_id', auth()->user()->employee->id)->get();

        Log::debug('Overtime data fetched', ['overtime' => $overtimes]);

        return Inertia::render('Attendances/EmployeeOvertime', [
            'myOvertimes' => $myOvertimes,
            'overtimes' => $overtimes,
            'employees' => $employee_list,
        ]);
    }

    public function store(Request $request)
    {
        Log::debug('Starting overtime creation', ['request_data' => $request->all()]);
        try {
            $validated = $request->validate([
                'employee_id' => ['required', 'exists:employees,id'],
                'date' => ['required', 'date'],
                'requested_hours' => ['required', 'numeric', 'min:0.5', 'max:8'],
                'notes' => ['nullable', 'string', 'max:255'],
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            EmployeeOvertime::create([
                'employee_id' => $validated['employee_id'],
                'date' => $validated['date'],
                'requested_hours' => $validated['requested_hours'],
                'notes' => $validated['notes'],
                'status' => 'Pending',
            ]);

            Log::info('Overtime created', ['employee_id' => $validated['employee_id']]);

            DB::commit();

            return Redirect::route('overtime.list')->with('success', 'Overtime request submitted!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating overtime', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to create overtime: '.$e->getMessage())->withInput();
        }
    }

    public function update(Request $request, EmployeeOvertime $overtime)
    {
        Log::debug('Starting overtime update', [
            'overtime_id' => $overtime->id,
            'request_data' => $request->all(),
        ]);

        try {
            $validated = $request->validate([
                'employee_id' => ['required', 'exists:employees,id'],
                'date' => ['required', 'date'],
                'requested_hours' => ['required', 'numeric', 'min:0.5', 'max:8'],
                'approved_hours' => ['nullable', 'numeric', 'min:0', 'max:'.$request->input('requested_hours')],
                'status' => ['required', 'in:Pending,Approved,Rejected'],
                'manager_id' => ['nullable', 'exists:employees,id'],
                'notes' => ['nullable', 'string', 'max:255'],
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $overtime->update($validated);

            Log::info('Overtime updated', ['overtime_id' => $overtime->id]);

            DB::commit();

            return Redirect::route('overtime.list')->with('success', 'Overtime updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating overtime', [
                'overtime_id' => $overtime->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to update overtime: '.$e->getMessage())->withInput();
        }
    }

    public function approve(Request $request, EmployeeOvertime $overtime)
    {
        Log::debug('Starting overtime approval', [
            'overtime_id' => $overtime->id,
            'request_data' => $request->all(),
        ]);

        try {
            // Base validation
            $validated = $request->validate([
                'requested_hours' => ['required', 'numeric', 'min:0.5', 'max:8'],
                'status' => ['required', 'in:Pending,Approved,Rejected'],
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $data = [];

            // Handle role-specific approval logic
            $user = auth()->user();
            $userFullName = $user->employee->first_name.' '.$user->employee->last_name;

            if (
                $user->getRoleNames()->contains('HR') ||
                $user->getRoleNames()->contains('Admin') ||
                $user->getRoleNames()->contains('SuperAdmin')
            ) {
                $extraValidation = $request->validate([
                    'approved_hours' => ['required', 'numeric', 'min:0', 'max:'.$validated['requested_hours']],
                ]);

                $data = array_merge($data, [
                    'status' => $validated['status'],
                    'approved_hours' => $extraValidation['approved_hours'],
                    'approved_by_hr' => $userFullName,
                    'approved_hr_at' => now(),
                ]);
            } else {
                $data = array_merge($data, [
                    'approved_by' => $userFullName,
                    'approved_at' => now(),
                    'manager_id' => $user->employee->id,
                ]);
            }

            $overtime->where('id', $overtime->id)->update($data);

            DB::commit();
            Log::info('Overtime Approved', ['overtime_id' => $overtime->id]);

            return Redirect::route('overtime.list')->with('success', 'Overtime approved!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error approving overtime', [
                'overtime_id' => $overtime->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to approve overtime: '.$e->getMessage())->withInput();
        }
    }

    public function reject(Request $request, EmployeeOvertime $overtime)
    {
        Log::debug('Starting overtime rejection', [
            'overtime_id' => $overtime->id,
            'request_data' => $request->all(),
        ]);

        try {
            $validated = $request->validate([
                'notes' => ['nullable', 'string', 'max:255'],
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $overtime->update([
                'manager_id' => auth()->user()->employee->id,
                'status' => 'Rejected',
                'notes' => $validated['notes'] ?? $overtime->notes,
            ]);

            Log::info('Overtime rejected', ['overtime_id' => $overtime->id]);

            DB::commit();

            return Redirect::route('overtime.list')->with('success', 'Overtime rejected!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error rejecting overtime', [
                'overtime_id' => $overtime->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to reject overtime: '.$e->getMessage())->withInput();
        }
    }

    public function destroy(EmployeeOvertime $overtime)
    {
        Log::debug('Starting overtime deletion', ['overtime_id' => $overtime->id]);

        try {
            DB::beginTransaction();

            $overtime->delete();

            Log::info('Overtime deleted', ['overtime_id' => $overtime->id]);

            DB::commit();

            return Redirect::route('overtime.list')->with('success', 'Overtime deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting overtime', [
                'overtime_id' => $overtime->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Failed to delete overtime: '.$e->getMessage());
        }
    }
}
