<?php

namespace App\Http\Controllers;

use App\Events\EmployeeNotificationEvent;
use App\Events\NewLeaveRequestEvent;
use App\Models\Employee;
use App\Models\EmployeeLeaveCredits;
use App\Models\Leave;
use App\Models\LeaveType;
use App\Models\User;
use DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Log;

class LeaveController extends Controller
{
    // public function index()
    // {
    //     $user = auth()->user();
    //     $component = 'Leave/EmployeeLeaveRequestComponent';

    //     $allLeaves = Leave::with('employee')->orderBy('created_at', 'desc')->get();

    //     $myLeaves = $allLeaves->where('employee_id', $user->employee->id)->values()->sortByDesc('created_at');

    //     Log::info('My Leaves: ', ['myLeaves' => $myLeaves->toArray()]);

    //     $leaveRequests = collect();
    //     if ($user->roles[0]->name !== 'employee') {
    //         // For managers and HR, include their own leaves plus subordinates' leaves
    //         $leaveRequests = Leave::whereHas('employee', function ($q) use ($user) {
    //             $q->where('head_or_manager', $user->employee->employee_id);
    //         })->orderBy('created_at', 'desc')->get()->sortByDesc('created_at');
    //     } else {
    //         // For employees, leaveRequests should be empty or their own (handled by myLeaves)
    //         $leaveRequests = collect();
    //     }

    //     return Inertia::render($component, [
    //         'auth' => ['user' => $user],
    //         'myLeaves' => $myLeaves->map(function ($leave) {
    //             return [
    //                 'id' => $leave->id,
    //                 'employee' => [
    //                     'id' => $leave->employee_id,
    //                     'name' => $leave->employee->first_name.' '.$leave->employee->last_name,
    //                     'manager_id' => $leave->employee->head_or_manager,
    //                 ],
    //                 'start_date' => $leave->start_date,
    //                 'end_date' => $leave->end_date,
    //                 'leave_type' => $leave->leave_type,
    //                 'day' => $leave->day,
    //                 'approved_by' => $leave->approved_by,
    //                 'approved_at' => $leave->approved_at,
    //                 'rejected_at' => $leave->rejected_at,
    //                 'rejected_by' => $leave->rejected_by,
    //                 'reason' => $leave->reason,
    //                 'status' => $leave->status,
    //                 'image' => $leave->image, // Ensure image is included
    //             ];
    //         })->values()->all(), // Ensure values are re-indexed after sorting
    //         'leave_types' => LeaveType::all(),
    //         'leave_credits' => EmployeeLeaveCredits::with('employee', 'leaveType')
    //             ->where('employee_id', $user->employee->id)->get(),
    //         'leaves' => $leaveRequests->map(function ($leave) {
    //             return [
    //                 'id' => $leave->id,
    //                 'employee' => [
    //                     'id' => $leave->employee_id,
    //                     'name' => $leave->employee->first_name.' '.$leave->employee->last_name,
    //                     'manager_id' => $leave->employee->head_or_manager,
    //                 ],
    //                 'start_date' => $leave->start_date,
    //                 'end_date' => $leave->end_date,
    //                 'leave_type' => $leave->leave_type,
    //                 'day' => $leave->day,
    //                 'approved_by' => $leave->approved_by,
    //                 'approved_at' => $leave->approved_at,
    //                 'rejected_at' => $leave->rejected_at,
    //                 'rejected_by' => $leave->rejected_by,
    //                 'reason' => $leave->reason,
    //                 'status' => $leave->status,
    //                 'image' => $leave->image, // Ensure image is included
    //             ];
    //         })->values()->all(), // Ensure values are re-indexed after sorting
    //     ]);
    // }

    public function index(Request $request): Response
    {
        $user = auth()->user();
        $component = 'Leave/EmployeeLeaveRequestComponent';

        // Detect if this is a partial reload (e.g., only requesting 'leaves')
        if ($request->has('_inertia') && $request->has('_only')) {
            if (in_array('leaves', $request->_only)) {

                $myLeaves = $this->getMyLeaves($user);
                $leaveRequests = $this->getLeaveRequests($user);

                return Inertia::render($component, [
                    'leave_credits' => EmployeeLeaveCredits::with('employee', 'leaveType')
                        ->where('employee_id', $user->employee->id)->get(),
                    'leaves' => $leaveRequests,
                    'myLeaves' => $myLeaves,

                ]);
            }
        }

        // Full page load
        $myLeaves = $this->getMyLeaves($user);
        $leaveRequests = $this->getLeaveRequests($user);

        return Inertia::render($component, [
            'auth' => ['user' => $user],
            'myLeaves' => $myLeaves,
            'leave_types' => LeaveType::all(),
            'leave_credits' => EmployeeLeaveCredits::with('employee', 'leaveType')
                ->where('employee_id', $user->employee->id)->get(),
            'leaves' => $leaveRequests,
        ]);
    }

    public function Adminindex()
    {
        $user = auth()->user();
        $leaves = Leave::with('employee')->orderBy('created_at', 'desc')->get();

        $component = 'Leave/LeaveRequestComponent';

        // Filter leaves based on user role
        if ($user->roles[0]->name === 'employee') {
            $leaves = $leaves->where('employee_id', $user->employee->id);
            $component = 'Leave/EmployeeLeaveRequestComponent';
        } elseif ($user->roles[0]->name === 'manager') {
            $leaves = $leaves->where(function ($query) use ($user) {
                $query->where('employee_id', $user->employee->id)
                    ->orWhereHas('employee', function ($q) use ($user) {
                        $q->where('head_or_manager', $user->employee->employee_id);
                    });
            });
        } // HR, Admin, SuperAdmin see all leaves by default (no filtering)

        return Inertia::render($component, [
            'auth' => [
                'user' => $user,
            ],
            'leave_types' => LeaveType::all(),
            'leave_credits' => EmployeeLeaveCredits::with('employee', 'leaveType')
                ->where('employee_id', $user->employee->id)->get(),
            'leaves' => $leaves->map(function ($leave) {
                return [
                    'id' => $leave->id,
                    'employee' => [
                        'id' => $leave->employee_id,
                        'name' => $leave->employee->first_name.' '.$leave->employee->last_name,
                        'manager_id' => $leave->employee->head_or_manager,
                    ],
                    'start_date' => $leave->start_date,
                    'end_date' => $leave->end_date,
                    'leave_type' => $leave->leave_type,
                    'day' => $leave->day,
                    'approved_by' => $leave->approved_by,
                    'approved_at' => $leave->approved_at,
                    'rejected_at' => $leave->rejected_at,
                    'rejected_by' => $leave->rejected_by,
                    'reason' => $leave->reason,
                    'status' => $leave->status,
                    'image' => $leave->image, // Ensure image is included
                ];
            })->values()->all(), // Re-index after mapping to maintain order
        ]);
    }

    public function store(Request $request)
    {
        $employee = auth()->user()->employee;
        $employeeId = $employee->employee_id;
        $employeeTblId = $employee->id;
        $employeeName = $employee->first_name.' '.$employee->last_name;

        $employeeManagerID = Employee::where('employee_id', $employee->head_or_manager)->value('id');

        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'leave_type' => 'required|exists:leave_types,name', // Ensure leave_type matches leave_types.name
            'reason' => 'required|string|max:500',
            'status' => 'in:Pending,Approved,Rejected',
            'image' => 'required|image|max:2048',
        ]);

        $startDate = new \DateTime($validated['start_date']);
        $endDate = new \DateTime($validated['end_date']);
        $daysDifference = $startDate->diff($endDate)->days + 1; // Inclusive of start and end dates

        // Get the leave_type_id based on the requested leave_type name
        $leaveType = LeaveType::where('name', $validated['leave_type'])->firstOrFail();
        $leaveTypeId = $leaveType->id;

        // Check leave credits for the specific leave type
        $leaveCredit = $employee->leaveCredits()->where('leave_type_id', $leaveTypeId)->first();
        if (! $leaveCredit || $daysDifference > $leaveCredit->credits) {
            $remainingCredits = $leaveCredit ? $leaveCredit->credits : 0;

            return back()->with('error', 'Insufficient leave credits for '.$validated['leave_type'].'. You have '.$remainingCredits.' days remaining, but requested '.$daysDifference.' days.')->withInput();

        }

        $leaveData = $validated;

        if ($request->hasFile('image')) {
            $imageName = "{$employeeId}_{$validated['leave_type']}_leave_".time().'.'.$request->image->extension();
            $request->image->move(public_path('storage/leaves'), $imageName);
            $leaveData['image'] = $imageName;
        }

        $leave = Leave::create([
            'employee_id' => $employeeTblId,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'day' => $daysDifference,
            'leave_type' => $validated['leave_type'],
            // 'leave_type_id' => $leaveTypeId, // Store leave_type_id instead of name for consistency
            'reason' => $validated['reason'],
            'status' => $validated['status'],
            'image' => $request->hasFile('image') ? $leaveData['image'] : null,
        ]);

        // Deduct leave credits for the specific leave type
        $leaveCredit->credits = $leaveCredit->credits - $daysDifference;
        $leaveCredit->save();

        // 🔔 Notify Admins, HR, SuperAdmins
        $notifiableRoles = getAllowedSuperAdminRoles();
        $admins = User::with('employee')->role($notifiableRoles)->get();

        foreach ($admins as $admin) {
            createNotification($admin->employee->id, "{$employeeName} submitted a leave request.", $employeeTblId, 'Leave');
            Log::info('Leave request submitted', [
                'employee_id' => $admin->employee->id,
                'employee_name' => $employeeName,
            ]);
        }

        // 🔔 Notify Employee's Manager (if available)
        if ($employeeManagerID) {
            createNotification($employeeManagerID, "{$employeeName} submitted a leave request.", $employeeTblId, 'Leave');
            Log::info('Leave request submitted to manager', [
                'employee_id' => $employeeManagerID,
                'employee_name' => $employeeName,
                'employee' => $employee, ]);
        }

        // 📡 Broadcast real-time to Echo listeners (optional)
        event(new NewLeaveRequestEvent($employeeName, $employeeManagerID, "{$employeeName} submitted a leave request."));

        return redirect()->back()->with('success', 'Leave requested! '.$daysDifference.' days deducted from your '.$validated['leave_type'].' credits.');
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $leave = Leave::findOrFail($id);
            if (auth()->user()->roles[0]->name === 'employee') {
                return redirect()->back()->withErrors(['error' => 'Unauthorized']);
            }

            $validated = $request->validate([
                'status' => 'required|in:Approved,Rejected',
                'is_paid' => 'in:1,0',
            ]);

            if (auth()->user()->roles[0]->name === 'HR' ||
                auth()->user()->roles[0]->name === 'Admin' ||
                auth()->user()->roles[0]->name === 'SuperAdmin') {
                $leaveTypeId = LeaveType::where('name', $leave->leave_type)->value('id');

                $leaveCredits = EmployeeLeaveCredits::where('employee_id', $leave->employee_id)
                    ->where('leave_type_id', $leaveTypeId)
                    ->first();

                if ($leaveCredits) {
                    if ($validated['status'] === 'Approved') {
                        // Check and deduct credits for approval
                        if ($leaveCredits->credits < $leave->day) {
                            return redirect()->back()->with('error', 'Insufficient leave credits for this leave type.');
                        }
                        $data = [
                            'status' => $validated['status'],
                            'approved_by_hr' => auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name,
                            'approved_hr_at' => now(),
                            'isWithPay' => $validated['is_paid'],
                        ];
                        // $leaveCredits->decrement('credits', $leave->day); // Deduct credits on approval
                    } elseif ($validated['status'] === 'Rejected') {
                        // Return credits if previously deducted and now rejected
                        $data = [
                            'status' => $validated['status'],
                            'rejected_by_hr' => auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name,
                            'rejected_hr_at' => now(),
                        ];
                        $leaveCredits->increment('credits', $leave->day); // Return credits on rejection
                    }
                }
            } else {
                $leaveTypeId = LeaveType::where('name', $leave->leave_type)->value('id');

                $leaveCredits = EmployeeLeaveCredits::where('employee_id', $leave->employee_id)
                    ->where('leave_type_id', $leaveTypeId)
                    ->first();

                if ($leaveCredits) {
                    if ($validated['status'] === 'Approved') {
                        // Check and deduct credits for approval
                        if ($leaveCredits->credits < $leave->day) {
                            return redirect()->back()->with('error', 'Insufficient leave credits for this leave type.');
                        }
                        $data = [
                            'approved_by' => auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name,
                            'approved_at' => now(),
                        ];
                        // $leaveCredits->decrement('credits', $leave->day); // Deduct credits on approval
                    } elseif ($validated['status'] === 'Rejected') {
                        // Return credits if previously deducted and now rejected
                        $data = [
                            'status' => $validated['status'],
                            'rejected_by' => auth()->user()->employee->first_name.' '.auth()->user()->employee->last_name,
                            'rejected_at' => now(),
                        ];
                        $leaveCredits->increment('credits', $leave->day); // Return credits on rejection
                    }
                }
            }

            $leave->update($data);

            // 🔔 Notify the employee about the status update
            $employeeId = $leave->employee_id;
            $statusMessage = $validated['status'] === 'Approved'
                ? "{$leave->leave_type} leave request approved for {$leave->day} days."
                : "{$leave->leave_type} leave request rejected.";
            createNotification($employeeId, $statusMessage, auth()->user()->employee->id, 'Leave');
            Log::info('Leave status updated for employee', [
                'employee_id' => $employeeId,
                'status' => $validated['status'],
                'message' => $statusMessage,
            ]);

            // 📡 Broadcast real-time update to the employee's private channel
            event(new EmployeeNotificationEvent($employeeId, $statusMessage));

            DB::commit();

            return redirect()->back()->with('success', 'Leave updated! '.($validated['status'] === 'Rejected' ? 'Credits returned.' : ''));
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating leave', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->with('error', 'Failed to Update Leave: '.$e->getMessage())->withInput();
        }
    }

    private function getMyLeaves($user)
    {
        return Leave::with('employee')
            ->where('employee_id', $user->employee->id)
            ->latest()
            ->get()
            ->map(fn ($leave) => $this->transformLeave($leave))
            ->values()
            ->all();
    }

    private function getLeaveRequests($user)
    {
        if ($user->roles[0]->name === 'employee') {
            return collect();
        }

        return Leave::with('employee')
            ->whereHas('employee', fn ($q) => $q->where('head_or_manager', $user->employee->employee_id))
            ->latest()
            ->get()
            ->map(fn ($leave) => $this->transformLeave($leave))
            ->values()
            ->all();
    }

    private function transformLeave($leave)
    {
        return [
            'id' => $leave->id,
            'employee' => [
                'id' => $leave->employee_id,
                'name' => $leave->employee->first_name.' '.$leave->employee->last_name,
                'manager_id' => $leave->employee->head_or_manager,
            ],
            'start_date' => $leave->start_date,
            'end_date' => $leave->end_date,
            'leave_type' => $leave->leave_type,
            'day' => $leave->day,
            'approved_by' => $leave->approved_by,
            'approved_at' => $leave->approved_at,
            'rejected_at' => $leave->rejected_at,
            'rejected_by' => $leave->rejected_by,
            'reason' => $leave->reason,
            'status' => $leave->status,
            'image' => $leave->image,
        ];
    }
}
