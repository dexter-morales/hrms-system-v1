<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return Inertia::render('Leave/EmployeeLeaveType', [
            'leaveTypes' => LeaveType::all(),
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|unique:leave_types,name|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);
        LeaveType::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $leaveType = LeaveType::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|unique:leave_types,name,'.$id.'|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);
        $leaveType->update($validated);

        return redirect()->back();
    }

    // public function destroy($id)
    // {
    //     $leaveType = LeaveType::findOrFail($id);
    //     $leaveType->update(['status' => 'inactive']); // Soft disable via status
    //     return redirect()->back();
    // }

    public function destroy($id)
    {
        $leaveType = LeaveType::findOrFail($id);
        $leaveType->delete();

        return redirect()->back();
    }
}
