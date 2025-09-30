<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Leave Requests
Broadcast::channel('leave-requests', function ($user) {
    // $allowedRoles = ['admin', 'HR', 'SuperAdmin', 'super admin'];
    $allowedRoles = getAllowedSuperAdminRoles();
    Log::info('Authenticating broadcast: leave-requests', [
        'user_id' => $user->id,
        'roles' => $user->getRoleNames(), // For Spatie roles
        'HasAnyRole' => $user->hasAnyRole($allowedRoles),
        'allowedRoles' => $allowedRoles,
    ]);

    return $user->hasAnyRole($allowedRoles);
});

// Leave Requests
Broadcast::channel('manager.{managerId}', function ($user, $managerId) {
    return (int) $user->id === (int) $managerId;
});

// Leave Requests
Broadcast::channel('employee.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
