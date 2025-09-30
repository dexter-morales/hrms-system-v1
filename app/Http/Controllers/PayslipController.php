<?php

namespace App\Http\Controllers;

use App\Models\Payslip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Log;

class PayslipController extends Controller
{
    public function index(Request $request)
    {
        $employe_role = auth()->user()->roles[0]->name;

        if ($employe_role === 'HR' || $employe_role === 'SuperAdmin' || $employe_role === 'Admin') {
            $query = Payslip::with('employee', 'payroll', 'employee.site')->orderBy('created_at', 'desc');

            if (auth()->user()->roles[0]->name === 'Employee') {
                $query->where('employee_id', auth()->user()->employee_id);
            }

            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }
        } else {
            $query = Payslip::with('employee', 'payroll', 'employee.site')->where('employee_id', auth()->user()->employee->id)->orderBy('created_at', 'desc');
        }

        $payslips = $query->get();

        Log::channel('payroll_logs')->info('Payslip index loaded', [
            'role' => $employe_role,
            'employee_id_filter' => $request->employee_id,
            'payslip_count' => $payslips->count(),
        ]);

        return inertia('Payroll/PayslipViewer', [
            'payslips' => $payslips,
        ]);
    }

    public function download($id)
    {
        $payslip = Payslip::where('employee_id', Auth::user()->employee_id)->findOrFail($id);
        if (Storage::disk('public')->exists($payslip->file_path)) {
            return Storage::disk('public')->download($payslip->file_path);
        }
        abort(404, 'Payslip not found.');
    }
}
