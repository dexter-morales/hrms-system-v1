<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanySettingController extends Controller
{
    public function index()
    {
        $companySettings = CompanySetting::first();

        return Inertia::render('CompanySettings/CompanyIndex', [
            'companySettings' => $companySettings,
        ]);
    }

    public function create()
    {
        return Inertia::render('CompanySettings/Create');
    }

    // public function update(Request $request)
    // {
    //     $validated = $request->validate([
    //         'company_name' => 'required|string|max:255',
    //         'address' => 'required|string|max:255',
    //         'email' => 'required|email|max:255',
    //         'phone_number' => 'required|string|max:20',
    //         'mobile_number' => 'required|string|max:20',
    //         'employee_id_prefix' => 'required|string|max:10',
    //         'company_logo' => 'nullable|image|max:2048',
    //     ]);

    //     $companySetting = CompanySetting::first();

    //     if ($request->hasFile('company_logo')) {
    //         $file = $request->file('company_logo')->store('company_logos', 'public');
    //         $validated['company_logo'] = $file;
    //     }

    //     CompanySetting::updateOrCreate(
    //         ['id' => $companySetting->id ?? null],
    //         $validated
    //     );

    //     return redirect()->route('company-settings.index')->with('success', 'Company settings saved successfully.');
    // }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone_number' => 'required|string|max:20',
            'mobile_number' => 'required|string|max:20',
            'employee_id_prefix' => 'required|string|max:10',
            'company_logo' => 'nullable|image|max:2048',
            'thirteenth_month_pay_start' => 'required|date',
            'thirteenth_month_pay_end' => 'required|date|after_or_equal:thirteenth_month_pay_start',
        ]);

        $companySetting = CompanySetting::first();

        if ($request->hasFile('company_logo')) {
            $file = $request->file('company_logo')->store('company_logos', 'public');
            $validated['company_logo'] = $file;
        }

        CompanySetting::updateOrCreate(
            ['id' => $companySetting->id ?? null],
            $validated
        );

        return redirect()->route('company-settings.index')->with('success', 'Company settings saved successfully.');
    }

    public function destroy(CompanySetting $companySetting)
    {
        $companySetting->delete();

        return redirect()->route('company-settings.index')->with('success', 'Company setting deleted successfully.');
    }
}
