<?php

namespace App\Http\Controllers;

use App\Models\EmployeeLoan;
use App\Models\LoanPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;
use Validator;

class EmployeeLoanControllerOld extends Controller
{
    public function index()
    {
        Log::channel('loan_logs')->info('Fetching loan list', [
            'user_id' => auth()->id(),
            'role' => auth()->user()->roles[0]->name ?? 'N/A',
        ]);

        $user = auth()->user();
        $loans = [];
        $myLoans = [];

        if (in_array(auth()->user()->roles[0]->name, ['HR', 'SuperAdmin'])) {
            $loans = EmployeeLoan::with('employee:id,first_name,last_name,head_or_manager')
                ->select('id', 'employee_id', 'amount', 'loan_type', 'terms', 'notes', 'status', 'approved_by', 'image')
                ->get();
        } elseif (auth()->user()->roles[0]->name !== 'Employee' && isset($user->employee)) {
            $loans = EmployeeLoan::with('employee:id,first_name,last_name,head_or_manager')
                ->select('id', 'employee_id', 'amount', 'loan_type', 'terms', 'notes', 'status', 'approved_by', 'image')
                ->whereHas('employee', function ($q) use ($user) {
                    $q->where('head_or_manager', $user->employee->employee_id);
                })->get();
        } else {
            $loans = EmployeeLoan::with('employee:id,first_name,last_name,head_or_manager')
                ->select('id', 'employee_id', 'amount', 'loan_type', 'terms', 'notes', 'status', 'approved_by', 'image')
                ->where('employee_id', $user->employee->id ?? null)
                ->get();
        }

        $myLoans = $user->employee
            ? EmployeeLoan::where('employee_id', $user->employee->id)
                ->with('employee:id,first_name,last_name')
                ->get()
            : [];

        Log::channel('loan_logs')->info('Loan data fetched', [
            'loan_count' => $loans->count(),
            'my_loan_count' => $myLoans->count(),
        ]);

        return Inertia::render('Loan/EmployeeLoansComponent', [
            'loans' => $loans,
            'myLoans' => $myLoans,
            'auth' => [
                'user' => auth()->user(),
                'roles' => auth()->user()->roles,
            ],
        ]);
    }

    public function store(Request $request)
    {
        Log::channel('loan_logs')->info('Attempting to create loan request', [
            'employee_id' => $request->employee_id ?? auth()->user()->employee->id,
            'timestamp' => now()->toDateTimeString(),
        ]);

        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0.01',
                'loan_type' => 'required|in:Cash Advance,SSS Loan,Pag-ibig Loan,Others',
                'terms' => 'required|integer|min:1',
                'notes' => 'required_if:loan_type,Others|max:500',
                'image' => 'nullable|image|max:2048',
            ]);

            if ($validator->fails()) {
                Log::channel('loan_logs')->error('Validation failed for loan creation', [
                    'errors' => $validator->errors()->toArray(),
                    'timestamp' => now()->toDateTimeString(),
                ]);

                return redirect()->back()->withErrors($validator->errors())->with('error', 'Validation errors occurred.');
            }

            $employeeId = auth()->user()->employee->id; // Assuming employee_id is tied to authenticated user
            $loanType = $request->loan_type;
            $terms = $request->terms;
            $notes = $loanType === 'Others' ? $request->notes : null;

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('loans', 'public');
            }

            $loan = EmployeeLoan::create([
                'employee_id' => $employeeId,
                'amount' => round($request->amount, 2),
                'loan_type' => $loanType,
                'terms' => $terms,
                'notes' => $notes,
                'status' => 'Pending',
                'image' => $imagePath,
            ]);

            Log::channel('loan_logs')->info('Loan request created successfully', [
                'id' => $loan->id,
                'employee_id' => $loan->employee_id,
                'amount' => $loan->amount,
                'loan_type' => $loan->loan_type,
                'terms' => $loan->terms,
                'timestamp' => now()->toDateTimeString(),
            ]);

            return redirect()->back()->with('success', 'Loan request submitted successfully.');
        } catch (\Exception $e) {
            Log::channel('loan_logs')->error('Failed to create loan request', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return redirect()->back()->with('error', 'Failed to create loan request: '.$e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        Log::channel('loan_logs')->info('Attempting to update loan status', [
            'id' => $id,
            'timestamp' => now()->toDateTimeString(),
        ]);

        try {
            // Handle role-specific approval logic
            $user = auth()->user();
            $userFullName = $user->employee->first_name.' '.$user->employee->last_name;

            $loan = EmployeeLoan::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:Approved,Rejected',
                'amount' => 'sometimes|numeric|min:0', // Optional amount validation
            ]);

            if ($validator->fails()) {
                Log::channel('loan_logs')->error('Validation failed for loan update', [
                    'id' => $id,
                    'errors' => $validator->errors()->toArray(),
                    'timestamp' => now()->toDateTimeString(),
                ]);

                return redirect()->back()->withErrors($validator->errors())->with('error', 'Validation errors occurred.');
            }

            $updateData = [
                'status' => $request->status,
                'approved_by' => $request->status === 'Approved' ? $userFullName : $loan->approved_by,
            ];

            // Update amount if provided and status is Approved
            if ($request->has('amount') && $request->status === 'Approved') {
                $updateData['amount'] = $request->amount;
            }

            $loan->update($updateData);

            Log::channel('loan_logs')->info('Loan status updated successfully', [
                'id' => $id,
                'status' => $loan->status,
                'approved_by' => $loan->approved_by,
                'amount' => $loan->amount,
                'timestamp' => now()->toDateTimeString(),
            ]);

            return redirect()->back()->with('success', 'Loan '.$request->status.' successfully.');
        } catch (\Exception $e) {
            Log::channel('loan_logs')->error('Failed to update loan status', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return redirect()->back()->with('error', 'Failed to update loan status: '.$e->getMessage());
        }
    }

    protected function getTermsForLoanType($loanType)
    {
        return match ($loanType) {
            'Cash Advance', 'Others' => 12,
            'SSS Loan' => 24,
            'Pag-ibig Loan' => 36,
            default => 12,
        };
    }

    public function history($loanId)
    {
        $loan = EmployeeLoan::findOrFail($loanId);
        if ($loan->status !== 'Approved') {
            return response()->json(['history' => []], 200); // Fallback for non-approved loans
        }

        $history = $loan->payments()->get(['id', 'loan_id', 'amount_paid', 'payment_date', 'notes']);

        return Inertia::render('Loan/EmployeeLoansComponent', [
            'loans' => EmployeeLoan::with('employee:id,first_name,last_name,head_or_manager')
                ->select('id', 'employee_id', 'amount', 'loan_type', 'terms', 'notes', 'status', 'approved_by', 'image')
                ->get(),
            'myLoans' => auth()->user()->employee
                ? EmployeeLoan::where('employee_id', auth()->user()->employee->id)->with('employee:id,first_name,last_name')->get()
                : [],
            'auth' => ['user' => auth()->user(), 'roles' => auth()->user()->roles],
            'history' => $history, // Add history to props
            'selectedLoanId' => $loanId, // Optional: To identify the loan
        ]);
    }

    // Optional: Method to record a payment
    public function recordPayment(Request $request, $loanId)
    {
        $request->validate([
            'amount_paid' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $loan = EmployeeLoan::findOrFail($loanId);
        if ($loan->status !== 'Approved') {
            return response()->json(['error' => 'Loan must be approved to record payments'], 400);
        }

        LoanPayment::create([
            'loan_id' => $loanId,
            'amount_paid' => $request->amount_paid,
            'payment_date' => $request->payment_date,
            'notes' => $request->notes,
        ]);

        return response()->json(['success' => 'Payment recorded successfully']);
    }
}
