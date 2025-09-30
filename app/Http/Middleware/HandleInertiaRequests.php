<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {

        $user = $request->user();
        $company_settings = CompanySetting::first();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'employee' => $user ? $user->employee::with('roleAccess') : null,
                'role' => $user ? $user->roles->pluck('name')->first() : null,
            ],
            'company_settings' => $company_settings ? $company_settings : null,
            'flash' => [
                'import_errors' => fn () => $request->session()->get('import_errors'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'newUser' => fn () => $request->session()->get('newUser'),
                'newEmployee' => fn () => $request->session()->get('newEmployee'),
            ],
        ];
    }
}
