<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeAttendanceController;
use App\Http\Controllers\EmployeeDashboardController;
use App\Http\Controllers\EmployeeOvertimeController;
use App\Http\Controllers\EmployeeScheduleController;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\EmployeeTimesheetController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SiteController;
use App\Models\Employee;
use App\Models\Holiday;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index')
        ->middleware(['auth', 'verified']);

    Route::middleware(['auth', 'role:SuperAdmin|HR|super admin'])->group(function () {});

    Route::middleware(['auth', 'role:admin|Manager|Accounting'])->group(function () {});

    Route::middleware(['auth', 'role:Employee'])->group(function () {});

});

// Route::get('/', function () {
//     return Inertia::render('Welcome', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });

// Route::get('/dashboard', function () {
//     $user = Auth::user();
//     $employee = $user->employee;
//     return Inertia::render('Dashboard', [
//         'employee' => $employee ? $employee->toArray() : null,
//     ]);
// })->middleware(['auth', 'verified'])->name('dashboard');

// Route::get('/dashboard', [EmployeeDashboardController::class, 'index'])->name('employee.dashboard.index')
// ->middleware(['auth', 'verified']);

// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard'
//     );
// })->middleware(['auth', 'verified'])->name('dashboard');

// Route::get('/holiday/list', function () {
//     return Inertia::render('Holiday/HolidayList', [
//         // 'holidays' => DB::table('holidays')->get(),
//         'holidays' => Holiday::all(),
//     ]);
// })->middleware(['auth', 'verified'])->name('holiday.list');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Route::resource('overtimes', EmployeeOvertimeController::class)->only(['index', 'store']);
    // Route::post('overtimes/{overtime}/approve', [EmployeeOvertimeController::class, 'approve'])->name('overtimes.approve');
    // Route::post('overtimes/{overtime}/reject', [EmployeeOvertimeController::class, 'reject'])->name('overtimes.reject');

    // Route::resource('attendance/employee', EmployeeAttendanceController::class)->only(['index', 'store', 'destroy', 'update']);

    // Route::resource('attendances/admin', EmployeeAttendanceController::class)->only(['index', 'store', 'destroy', 'update'])->middleware('role:admin|SuperAdmin|HR|Manager');

    Route::get('/overtime/list', [EmployeeOvertimeController::class, 'index'])->name('overtime.list');
    Route::post('/overtimes', [EmployeeOvertimeController::class, 'store'])->name('overtimes.store');
    Route::put('/overtimes/{overtime}', [EmployeeOvertimeController::class, 'update'])->name('overtimes.update');
    Route::post('/overtimes/{overtime}/approve', [EmployeeOvertimeController::class, 'approve'])->name('overtimes.approve');
    Route::post('/overtimes/{overtime}/reject', [EmployeeOvertimeController::class, 'reject'])->name('overtimes.reject');
    Route::delete('/overtimes/{overtime}', [EmployeeOvertimeController::class, 'destroy'])->name('overtimes.destroy');
});

Route::middleware(['auth', 'role:admin|SuperAdmin|HR|Manager|super admin'])->group(function () {

    Route::get('/attendance/admin-employee', [EmployeeAttendanceController::class, 'adminIndex'])
        ->name('employee.adminIndex');

    // Route::resource('attendances/admin-employee', EmployeeAttendanceController::class)
    //     ->only(['adminIndex', 'store', 'destroy', 'update'])
    //     ->parameters(['employee' => 'attendance']);
});

Route::prefix('schedules/employee')->middleware(['auth', 'role:admin|SuperAdmin|HR|Manager|super admin'])->group(function () {
    Route::get('/', [EmployeeScheduleController::class, 'index'])->name('schedules.employee.index');
    Route::post('/', [EmployeeScheduleController::class, 'store'])->name('schedules.employee.store');
    Route::put('/{schedule}', [EmployeeScheduleController::class, 'update'])->name('schedules.employee.update');
    Route::delete('/{schedule}', [EmployeeScheduleController::class, 'destroy'])->name('schedules.employee.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin|SuperAdmin|HR|Manager|super admin'])->group(function () {

    Route::get('/employee/list', [AdminController::class, 'index'])->name('employees.list');
    Route::post('/employees', [EmployeesController::class, 'store'])->name('employees.store');
    Route::put('/employees/{id}', [EmployeesController::class, 'update'])->name('employees.update');
    Route::get('/holidays/list', [HolidayController::class, 'index'])->name('holidays.index');
    // Route::post('/holidays', [HolidayController::class, 'store'])->name('holidays.store');

    Route::resource('holidays', HolidayController::class)->only([
        'store',
        'update',
        'destroy',
    ]);

});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/attendance/employee', [AttendanceController::class, 'index'])->name('attendance.list');
    Route::post('/attendances/punch-in', [AttendanceController::class, 'punchIn'])->name('attendances.punch_in');
    Route::post('/attendances/punch-out', [AttendanceController::class, 'punchOut'])->name('attendances.punch_out');

    Route::get('/leaves/admin', [LeaveController::class, 'Adminindex'])->name('leavesAdmin.index');
    Route::get('/leaves/employee', [LeaveController::class, 'index'])->name('leavesEmployee.index');

    Route::post('/leave', [LeaveController::class, 'store'])->name('leave.store');
    Route::put('/leave/{id}', [LeaveController::class, 'update'])->name('leave.update');
    Route::get('/payroll/payslips', [PayrollController::class, 'indexPayslips'])->name('payslips.index');

    // Route::get('/payslips', [PayslipController::class, 'index'])->name('payslips.index');
    Route::get('/payslips/{id}/download', [PayslipController::class, 'download'])->name('payslips.download');

    Route::get('/employee-timesheet', [EmployeeTimesheetController::class, 'index'])->name('employee-timesheet.list');

    Route::middleware(['role:admin|SuperAdmin|HR|Manager|super admin'])->group(function () {
        // Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
        Route::get('/payroll/generate', [PayrollController::class, 'index'])->name('payroll.index');
        Route::post('/payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');

        // Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
        // Route::post('/payroll/{id}/update', [PayrollController::class, 'update'])->name('payroll.update');

        Route::put('/payroll/{id}/update', [PayrollController::class, 'update'])->name('payroll.update');
        Route::post('/payroll/{id}/approve', [PayrollController::class, 'approve'])->name('payroll.approve');

        Route::get('/leave-types', [LeaveTypeController::class, 'index'])->name('leave-types.index');
        Route::post('/leave-types', [LeaveTypeController::class, 'store'])->name('leave-types.store');
        Route::put('/leave-types/{id}', [LeaveTypeController::class, 'update'])->name('leave-types.update');
        Route::delete('/leave-types/{id}', [LeaveTypeController::class, 'destroy'])->name('leave-types.destroy');

        Route::get('/departments', [DepartmentController::class, 'index'])
            ->name('departments.index');
        Route::get('/departments/create', [DepartmentController::class, 'create'])
            ->name('departments.create');
        Route::post('/departments', [DepartmentController::class, 'store'])
            ->name('departments.store');
        Route::get('/departments/{department}/edit', [DepartmentController::class, 'edit'])
            ->name('departments.edit');
        Route::put('/departments/{department}', [DepartmentController::class, 'update'])
            ->name('departments.update');
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])
            ->name('departments.destroy');

        Route::get('/positions', [PositionController::class, 'index'])
            ->name('positions.index');
        Route::get('/positions/create', [PositionController::class, 'create'])
            ->name('positions.create');
        Route::post('/positions', [PositionController::class, 'store'])
            ->name('positions.store');
        Route::get('/positions/{position}/edit', [PositionController::class, 'edit'])
            ->name('positions.edit');
        Route::put('/positions/{position}', [PositionController::class, 'update'])
            ->name('positions.update');
        Route::delete('/positions/{position}', [PositionController::class, 'destroy'])
            ->name('positions.destroy');

        Route::get('/sites', [SiteController::class, 'index'])
            ->name('sites.index');

        Route::get('/sites/create', [SiteController::class, 'create'])
            ->name('sites.create');

        Route::post('/sites', [SiteController::class, 'store'])
            ->name('sites.store');

        Route::get('/sites/{site}/edit', [SiteController::class, 'edit'])
            ->name('sites.edit');

        Route::put('/sites/{site}', [SiteController::class, 'update'])
            ->name('sites.update');

        Route::delete('/sites/{site}', [SiteController::class, 'destroy'])
            ->name('sites.destroy');
    });

});

// Route::resource('company-settings', CompanySettingController::class)->middleware(['auth']);

Route::get('/company-settings', [CompanySettingController::class, 'index'])
    ->name('company-settings.index');
//  Route::put('/company-settings', [CompanySettingController::class, 'update'])
//             ->name('company-settings.update');
Route::post('/company-settings', [CompanySettingController::class, 'update'])
    ->name('company-settings.update');

require __DIR__.'/auth.php';
