<?php

if (! function_exists('getAllowedSuperAdminRoles')) {
    function getAllowedSuperAdminRoles(): array
    {
        $envRoles = env('ALLOWED_ROLES_SuperAdmin_Hr', '');

        return array_filter(explode(',', $envRoles));
    }
}
