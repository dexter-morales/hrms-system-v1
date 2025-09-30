<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PositionController extends Controller
{
    public function index()
    {
        $positions = Position::with('department')->get();

        // return view('positions.index', compact('positions'));
        return Inertia::render('Positions/PositionIndex', [
            'positions' => $positions,
            'departments' => Department::all(),
        ]);
    }

    public function store(Request $request)
    {
        Log::debug('Starting position store', ['request_data' => $request->all()]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:positions,name',
                'description' => 'nullable|string',
                'department_id' => 'required|exists:departments,id',
                'level' => 'nullable|string',
                'salary_grade' => 'nullable|numeric|min:0',
                'is_active' => 'boolean',
                'created_by' => 'nullable|exists:users,id',
                'updated_by' => 'nullable|exists:users,id',
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            $position = Position::create($validated);

            Log::info('Position created', ['id' => $position->id, 'name' => $position->name]);

            return redirect()->route('positions.index')->with('success', 'Position created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating position', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to create position: '.$e->getMessage())->withInput();
        }
    }

    public function update(Request $request, Position $position)
    {
        Log::debug('Starting position update', [
            'position_id' => $position->id,
            'request_data' => $request->all(),
        ]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:positions,name,'.$position->id,
                'description' => 'nullable|string',
                'department_id' => 'required|exists:departments,id',
                'level' => 'nullable|string',
                'salary_grade' => 'nullable|numeric|min:0',
                'is_active' => 'boolean',
                'created_by' => 'nullable|exists:users,id',
                'updated_by' => 'nullable|exists:users,id',
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            $position->update($validated);

            Log::info('Position updated', ['id' => $position->id, 'name' => $position->name]);

            return redirect()->route('positions.index')->with('success', 'Position updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating position', [
                'position_id' => $position->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to update position: '.$e->getMessage())->withInput();
        }
    }

    public function destroy(Position $position)
    {
        Log::debug('Starting position delete', ['position_id' => $position->id]);

        try {
            $position->delete();

            Log::info('Position deleted', ['id' => $position->id]);

            return redirect()->route('positions.index')->with('success', 'Position deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting position', [
                'position_id' => $position->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Failed to delete position: '.$e->getMessage());
        }
    }
}
