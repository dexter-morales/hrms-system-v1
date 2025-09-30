<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index()
    {
        return Inertia::render('Holidays/HolidayList', [
            'holidays' => Holiday::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_holiday' => ['required', 'string', 'max:255'],
            'date_holiday' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'holiday_type' => ['required', 'in:Regular Holiday,Special Non-Working Day'],
        ]);

        Holiday::create($validated);

        return redirect()->back()->with('success', 'Holiday added!');
    }

    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'name_holiday' => ['required', 'string', 'max:255'],
            'date_holiday' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'holiday_type' => ['required', 'in:Regular Holiday,Special Non-Working Day'],
        ]);

        $holiday->update($validated);

        return redirect()->back()->with('success', 'Holiday updated!');
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();

        return redirect()->back()->with('success', 'Holiday deleted!');
    }
}
