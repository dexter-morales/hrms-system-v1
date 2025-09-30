<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Inertia\Inertia;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
            'role' => RoleMiddleware::class,
        ]);

        $middleware->group('admin', [
            'auth',
            'role:admin|SuperAdmin|HR|Manager|super admin',
        ]);

        // $middleware->protect('attendances.employee.*', ['admin']);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Spatie\Permission\Exceptions\UnauthorizedException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            return Inertia::render('Error', [
                'status' => 403,
                'message' => 'You do not have permission to access this resource.',
            ])->toResponse($request)->setStatusCode(403);
        });
    })
    // ->withMiddleware(function (Middleware $middleware) {
    //     $middleware->alias([
    //         'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
    //         'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
    //         'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
    //     ]);
    // })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
