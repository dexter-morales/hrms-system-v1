<?php

namespace App\Http\Controllers;

use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SiteController extends Controller
{
    public function index()
    {
        $sites = Site::all();

        return Inertia::render('Sites/SitesIndex', [
            'sites' => $sites,
        ]);
    }

    public function create()
    {
        return Inertia::render('Sites/Create');
    }

    public function store(Request $request)
    {
        Log::debug('Starting site store', ['request_data' => $request->all()]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:sites,name',
                'allowance' => 'nullable|numeric|min:0',
                'is_active' => 'boolean',
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            $site = Site::create($validated);

            Log::info('Site created', ['id' => $site->id, 'name' => $site->name]);

            return redirect()->route('sites.index')->with('success', 'Site created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating site', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->withErrors(['error' => 'Failed to create site: '.$e->getMessage()])->withInput();
        }
    }

    public function edit(Site $site)
    {
        return Inertia::render('Sites/Edit', [
            'site' => $site,
        ]);
    }

    public function update(Request $request, Site $site)
    {
        Log::debug('Starting site update', [
            'site_id' => $site->id,
            'request_data' => $request->all(),
        ]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:sites,name,'.$site->id,
                'allowance' => 'nullable|numeric|min:0',
                'is_active' => 'boolean',
            ]);

            Log::debug('Validation passed', ['validated_data' => $validated]);

            $site->update($validated);

            Log::info('Site updated', ['id' => $site->id, 'name' => $site->name]);

            return redirect()->route('sites.index')->with('success', 'Site updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating site', [
                'site_id' => $site->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()->withErrors(['error' => 'Failed to update site: '.$e->getMessage()])->withInput();
        }
    }

    public function destroy(Site $site)
    {
        Log::debug('Starting site delete', ['site_id' => $site->id]);

        try {
            $site->delete();

            Log::info('Site deleted', ['id' => $site->id]);

            return redirect()->route('sites.index')->with('success', 'Site deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting site', [
                'site_id' => $site->id,
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete site: '.$e->getMessage()]);
        }
    }
}
