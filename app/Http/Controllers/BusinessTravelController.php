<?php

namespace App\Http\Controllers;

use App\Events\EmployeeNotificationEvent;
use App\Events\NewLeaveRequestEvent;
use App\Models\BusinessTravel;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;

class BusinessTravelController extends Controller
{
    public function index()
    {
        $employeeID = auth()->user()->employee->employee_id;
        $employeeUUID = auth()->user()->employee->id;
        $employeeRole = auth()->user()->roles[0]->name;

        $businessTravels = [];
        $myBusinessTravels = [];

        if ($employeeRole !== 'employee') {
            $businessTravels = BusinessTravel::with('employee')
                ->when($employeeRole !== 'employee' && $employeeRole !== 'HR' && $employeeRole !== 'SuperAdmin', function ($query) use ($employeeID) {
                    return $query->whereHas('employee', function ($q) use ($employeeID) {
                        $q->where('head_or_manager', $employeeID);
                    });
                })
                ->orderBy('created_at', 'desc') // Add descending order
                ->get();
        }

        $myBusinessTravels = BusinessTravel::with('employee')
            ->where('employee_id', $employeeUUID)
            ->orderBy('created_at', 'desc') // Add descending order
            ->get();

        return Inertia::render('BusinessTravels/BusinessTravelsIndex', [
            'businessTravels' => $businessTravels,
            'myBusinessTravels' => $myBusinessTravels,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'time_from' => 'required',
            'time_to' => 'required',
            'location' => 'required|string',
            'reason' => 'required|string',
            'attach_supporting_document' => 'nullable|file|mimes:jpg,jpeg,png,doc,pdf|max:2048',
        ]);

        $businessTravelData = [];
        $businessTravelData['date_from'] = $request->date_from;
        $businessTravelData['date_to'] = $request->date_to;
        $businessTravelData['time_from'] = $request->time_from;
        $businessTravelData['time_to'] = $request->time_to;
        $businessTravelData['location'] = $request->location;
        $businessTravelData['reason'] = $request->reason;
        $businessTravelData['status'] = 'Pending';

        if ($request->hasFile('attach_supporting_document')) {
            $empId = auth()->user()->employee->employee_id; // Get the employee ID
            $timestamp = time(); // Unix timestamp (e.g., 1718865080)
            $originalName = $request->file('attach_supporting_document')->getClientOriginalName();
            $extension = $request->file('attach_supporting_document')->getClientOriginalExtension();
            $filename = "emp_{$empId}_business_travel_{$timestamp}_{$originalName}"; // e.g., emp_123_business_travel_1718865080_document.pdf
            $request->file('attach_supporting_document')->move(public_path('storage/business_travel'), $filename);
            $businessTravelData['attach_supporting_document'] = $filename;
        }

        $businessTravel = auth()->user()->employee->businessTravels()->create($businessTravelData);

        $employeeId = auth()->user()->employee->id;
        $employeeName = auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name;
        $managerId = Employee::where('employee_id', auth()->user()->employee->head_or_manager)->value('id');

        // 🔔 Notify Admins, HR, SuperAdmins
        $notifiableRoles = getAllowedSuperAdminRoles();
        $admins = User::with('employee')->role($notifiableRoles)->get();

        foreach ($admins as $admin) {
            createNotification($admin->employee->id, "{$employeeName} submitted a business travel request for {$request->location}.", $employeeId, 'OB');
            Log::info('Business travel request submitted notification', [
                'employee_id' => $admin->employee->id,
                'employee_name' => $employeeName,
            ]);
        }

        // 🔔 Notify Employee's Manager (if available)
        if ($managerId) {
            createNotification($managerId, "{$employeeName} submitted a business travel request for {$request->location}.", $employeeId, 'OB');
            Log::info('Business travel request submitted to manager', [
                'manager_id' => $managerId,
                'employee_name' => $employeeName,
            ]);
        }

        // 📡 Broadcast real-time to Echo listeners
        event(new NewLeaveRequestEvent($employeeId, $managerId, "{$employeeName} submitted a business travel request for {$request->location}."));

        return redirect()->back()->with('success', 'Business Travel request submitted successfully!');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Approved,Rejected',
        ]);

        if (auth()->user()->roles[0]->name === 'HR' ||
            auth()->user()->roles[0]->name === 'Admin' ||
            auth()->user()->roles[0]->name === 'SuperAdmin') {
            $data = [
                'status' => $validated['status'],
                'approved_by_hr' => auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name,
                'approved_hr_at' => now(),
            ];
        } else {
            $data = [
                'approved_by' => auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name,
                'approved_at' => now(),
            ];
        }

        $businessTravel = BusinessTravel::findOrFail($id);
        $businessTravel->update($data);

        // 🔔 Notify the employee about the status update
        $employeeId = $businessTravel->employee_id;
        $employeeName = $businessTravel->employee->first_name.' '.$businessTravel->employee->last_name;
        $statusMessage = "Your business travel request for {$businessTravel->location} has been {$validated['status']}.";
        createNotification($employeeId, $statusMessage, auth()->user()->employee->id, 'OB');
        Log::info('Business travel status updated notification', [
            'employee_id' => $employeeId,
            'status' => $validated['status'],
            'message' => $statusMessage,
        ]);

        // 📡 Broadcast real-time update to the employee's private channel
        event(new EmployeeNotificationEvent($employeeId, $statusMessage));

        return redirect()->back()->with('success', 'Business Travel '.$request->status.' successfully!');
    }
}
