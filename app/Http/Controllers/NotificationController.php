<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public $employee_id;

    public function __construct()
    {
        $this->employee_id = auth()->user()->employee->id;
    }

    public function index()
    {
        $perPage = request()->input('per_page', 5); // Default to 5 per page
        $page = request()->input('page', 1);

        $notifications = Notification::with('employee', 'requesterEmployee')
            ->where('employee_id', $this->employee_id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json($notifications); // Returns { data: [...], current_page, last_page, ... }
    }

    public function notificationsAll(Request $request)
    {
        $perPage = $request->input('per_page', 5);

        $notifications = Notification::with('employee')
            ->where('employee_id', $this->employee_id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($notifications); // includes pagination meta
    }

    public function indexPage(Request $request)
    {
        $perPage = $request->input('per_page', 5);

        $notifications = Notification::with('employee')
            ->where('employee_id', auth()->user()->employee_id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return Inertia::render('Notifications/NotificationIndex', [
            'notifications' => $notifications,
        ]);

        // return response()->json($notifications); // includes pagination meta
    }

    // public function index()
    // {
    //     $notifications = Notification::with('employee')
    //         ->where('employee_id', $this->employee_id)
    //         ->orderBy('created_at', 'desc')
    //         ->get();

    //     return response()->json(['notifications' => $notifications]);
    //     // return Inertia::render('Notifications/Index', [
    //     //     'notifications' => $notifications,
    //     // ]);
    // }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:users,id',
            'message' => 'required|string|max:1000',
        ]);

        $notification = Notification::create([
            'employee_id' => $request->employee_id,
            'message' => $request->message,
            'read_status' => false,
        ]);

        return response()->json(['message' => 'Notification created', 'notification' => $notification], 201);
    }

    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['read_status' => true]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function getUnreadCount()
    {
        $unreadCount = Notification::where('employee_id', $this->employee_id)
            ->where('read_status', false)
            ->count();

        return response()->json(['unreadCount' => $unreadCount]);
    }

    public function markAllAsRead()
    {
        Notification::where('employee_id', $this->employee_id)
            ->where('read_status', false)
            ->update(['read_status' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }
}
