<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index()
    {
        $logs = Activity::with(['causer.employee'])->latest()->get();

        return Inertia::render('ActivityLogs/ActivityLogsIndex', [
            'activityLogs' => $logs,
        ]);
    }
}
