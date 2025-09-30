<?php

namespace App\Http\Controllers;

use App\Events\EmployeeNotificationEvent;
use App\Events\NewLeaveRequestEvent;
use App\Models\CertificateAttendance;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;

class CertificateAttendanceController extends Controller
{
    public function index()
    {
        $employeeID = auth()->user()->employee->employee_id;
        $employeeUUID = auth()->user()->employee->id;
        $employeeRole = auth()->user()->roles[0]->name;

        $certificates = [];
        $myCertificates = [];

        if ($employeeRole !== 'employee') {
            $certificates = CertificateAttendance::with('employee')
                ->when($employeeRole !== 'employee' && $employeeRole !== 'HR' && $employeeRole !== 'SuperAdmin', function ($query) use ($employeeID) {
                    return $query->whereHas('employee', function ($q) use ($employeeID) {
                        $q->where('head_or_manager', $employeeID);
                    });
                })
                ->orderBy('created_at', 'desc') // Add descending order
                ->get();
        }

        $myCertificates = CertificateAttendance::with('employee')
            ->where('employee_id', $employeeUUID)
            ->orderBy('created_at', 'desc') // Add descending order
            ->get();

        return Inertia::render('Attendances/CertificateOfAttendance', [
            'certificates' => $certificates,
            'myCertificates' => $myCertificates,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:biometric device malfunction,power outage,other',
            'reason' => 'required|string',
            'other_reason' => 'required_if:type,other|string',
            'entries' => 'required|array',
            'entries.*.type' => 'required|in:clock in,clock out',
            'entries.*.date' => 'required|date',
            'entries.*.time' => 'required',
            'image' => 'nullable|image|max:2048',
        ]);

        $data = $request->all();
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('certificates', 'public');
            $data['image'] = $imagePath;
        }

        $certificate = auth()->user()->employee->certificates()->create([
            'type' => $data['type'],
            'reason' => $data['reason'],
            'other_reason' => $data['type'] === 'other' ? $data['other_reason'] : null,
            'entries' => json_encode($data['entries']),
            'image' => $data['image'] ?? null,
            'status' => 'Pending',
        ]);

        $employeeId = auth()->user()->employee->id;
        $employeeName = auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name;
        $managerId = Employee::where('employee_id', auth()->user()->employee->head_or_manager)->value('id');

        // 🔔 Notify Admins, HR, SuperAdmins
        $notifiableRoles = getAllowedSuperAdminRoles();
        $admins = User::with('employee')->role($notifiableRoles)->get();

        foreach ($admins as $admin) {
            createNotification($admin->employee->id, "{$employeeName} submitted a certificate attendance request for {$data['type']} reason.", $employeeId, 'COA');
            Log::info('Certificate request submitted notification', [
                'employee_id' => $admin->employee->id,
                'employee_name' => $employeeName,
            ]);
        }

        // 🔔 Notify Employee's Manager (if available)
        if ($managerId) {
            createNotification($managerId, "{$employeeName} submitted a certificate attendance request for {$data['type']} reason.", $employeeId, 'COA');
            Log::info('Certificate request submitted to manager', [
                'manager_id' => $managerId,
                'employee_name' => $employeeName,
            ]);
        }

        // 📡 Broadcast real-time to Echo listeners
        event(new NewLeaveRequestEvent($employeeId, $managerId, "{$employeeName} submitted a certificate attendance request for {$data['type']} reason."));

        return redirect()->back()->with('success', 'Certificate request submitted successfully!');
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

        $certificate = CertificateAttendance::findOrFail($id);
        $certificate->update($data);

        // 🔔 Notify the employee about the status update
        $employeeId = $certificate->employee_id;
        $employeeName = $certificate->employee->first_name.' '.$certificate->employee->last_name;
        $statusMessage = "Your certificate attendance request for {$certificate->type} has been {$validated['status']}.";
        createNotification($employeeId, $statusMessage, auth()->user()->employee->id, 'COA');
        Log::info('Certificate status updated notification', [
            'employee_id' => $employeeId,
            'status' => $validated['status'],
            'message' => $statusMessage,
        ]);

        // 📡 Broadcast real-time update to the employee's private channel
        event(new EmployeeNotificationEvent($employeeId, $statusMessage));

        return redirect()->back()->with('success', 'Certificate '.$request->status.' successfully!');
    }
}
