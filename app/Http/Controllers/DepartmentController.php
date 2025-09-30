<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::all();

        // return view('departments.index', compact('departments'));
        return Inertia::render('Departments/DepartmentIndex', [
            'departments' => $departments,
        ]);
    }

    public function store(Request $request)
    {
        Log::debug('Starting department store', ['request_data' => $request->all()]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:departments,name',
                'description' => 'nullable|string',
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            $department = Department::create($validated);

            Log::info('Department created', ['id' => $department->id, 'name' => $department->name]);

            return redirect()->route('departments.index')->with('success', 'Department created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating department', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to create department: '.$e->getMessage())->withInput();
        }
    }

    public function update(Request $request, Department $department)
    {
        Log::debug('Starting department update', [
            'department_id' => $department->id,
            'request_data' => $request->all(),
        ]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:departments,name,'.$department->id,
                'description' => 'nullable|string',
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            $department->update($validated);

            Log::info('Department updated', ['id' => $department->id, 'name' => $department->name]);

            return redirect()->route('departments.index')->with('success', 'Department updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating department', [
                'department_id' => $department->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to update department: '.$e->getMessage())->withInput();
        }
    }

    public function destroy(Department $department)
    {
        Log::debug('Starting department delete', ['department_id' => $department->id]);

        try {
            $department->delete();

            Log::info('Department deleted', ['id' => $department->id]);

            return redirect()->route('departments.index')->with('success', 'Department deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting department', [
                'department_id' => $department->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Failed to delete department: '.$e->getMessage());
        }
    }
}
