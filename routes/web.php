<?php

use App\Events\NewLeaveRequestEvent;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BusinessTravelController;
use App\Http\Controllers\CertificateAttendanceController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeAttendanceController;
use App\Http\Controllers\EmployeeLoanController;
use App\Http\Controllers\EmployeeOvertimeController;
use App\Http\Controllers\EmployeeScheduleController;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\EmployeeTimesheetController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\ThirteenthMonthPayController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index')
        ->middleware(['auth', 'verified']);
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/overtime/list', [EmployeeOvertimeController::class, 'index'])->name('overtime.list');
    Route::post('/overtimes', [EmployeeOvertimeController::class, 'store'])->name('overtimes.store');
    Route::put('/overtimes/{overtime}', [EmployeeOvertimeController::class, 'update'])->name('overtimes.update');
    Route::get('/employee-timesheet', [EmployeeTimesheetController::class, 'index'])->name('employee-timesheet.list');

    Route::get('/attendance/employee', [AttendanceController::class, 'index'])->name('attendance.list');
    Route::post('/attendances/punch-in', [AttendanceController::class, 'punchIn'])->name('attendances.punch_in');
    Route::post('/attendances/punch-out', [AttendanceController::class, 'punchOut'])->name('attendances.punch_out');

    Route::get('/leaves/employee', [LeaveController::class, 'index'])->name('leavesEmployee.index');

    Route::post('/leave', [LeaveController::class, 'store'])->name('leave.store');
    Route::put('/leave/{id}', [LeaveController::class, 'update'])->name('leave.update');
    Route::get('/payroll/payslips', [PayslipController::class, 'index'])->name('payslips.index');

    // Route::get('/payslips', [PayslipController::class, 'index'])->name('payslips.index');
    Route::get('/payslips/{id}/download', [PayslipController::class, 'download'])->name('payslips.download');

    Route::get('/certificates', [CertificateAttendanceController::class, 'index'])->name('certificates.index');
    Route::post('/certificates', [CertificateAttendanceController::class, 'store'])->name('certificate.store');
    Route::put('/certificates/{id}', [CertificateAttendanceController::class, 'update'])->name('certificate.update');

    Route::get('/business-travels', [BusinessTravelController::class, 'index'])->name('business-travels.index');
    Route::post('/business-travels', [BusinessTravelController::class, 'store'])->name('business-travel.store');
    Route::put('/business-travels/{id}', [BusinessTravelController::class, 'update'])->name('business-travel.update');

    Route::get('/employee-loans', [EmployeeLoanController::class, 'index'])->name('loans.index');
    Route::post('/employee-loans', [EmployeeLoanController::class, 'store'])->name('loan.store');
    Route::put('/employee-loans/{id}', [EmployeeLoanController::class, 'update'])->name('loan.update');

    Route::get('/employee-loans/{loanId}/history', [EmployeeLoanController::class, 'history'])->name('loan.history');
    Route::post('/employee-loans/{loanId}/payment', [EmployeeLoanController::class, 'recordPayment'])->name('loan.recordPayment');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications', [NotificationController::class, 'store'])->name('notifications.store');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount'])->name('notifications.unreadCount');
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');

    Route::get('/notifications/all', [NotificationController::class, 'indexPage'])->name('notifications.indexPage');
    Route::get('/api/notifications', [NotificationController::class, 'notificationsAll'])->name('notifications.notificationsAll');

    // This is for admin and super admin only
    Route::middleware(['auth', 'role:SuperAdmin|HR|super admin|admin'])->group(function () {

        Route::post('/thirteenth-month/export-pdf', [ThirteenthMonthPayController::class, 'exportToPDF'])->name('thirteenth-month.export-pdf');
        Route::get('/payroll/thirteenth-month', [ThirteenthMonthPayController::class, 'index'])->name('thirteenth-month.index');
        Route::post('/payroll/thirteenth-month/generate', [ThirteenthMonthPayController::class, 'generate'])->name('thirteenth-month.generate');
        Route::put('thirteenth-month/{id}', [ThirteenthMonthPayController::class, 'update'])->name('thirteenth-month.update');
        Route::delete('thirteenth-month/{id}', [ThirteenthMonthPayController::class, 'destroy'])->name('thirteenth-month.destroy');

        Route::get('payroll/deduction-history', [PayrollController::class, 'deductionHistory'])->name('payroll.deduction-history');

        Route::middleware(['role:SuperAdmin|super admin|admin'])->get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity.logs');

        Route::get('/attendance/admin-employee', [EmployeeAttendanceController::class, 'adminIndex'])
            ->name('employee.adminIndex');

        Route::post('/attendance/admin-employee/import', [EmployeeAttendanceController::class, 'import'])
            ->name('employee.attendance.import');

        Route::prefix('schedules/employee')->group(function () {
            Route::get('/', [EmployeeScheduleController::class, 'index'])->name('schedules.employee.index');
            Route::post('/', [EmployeeScheduleController::class, 'store'])->name('schedules.employee.store');
            Route::put('/{schedule}', [EmployeeScheduleController::class, 'update'])->name('schedules.employee.update');
            Route::delete('/{schedule}', [EmployeeScheduleController::class, 'destroy'])->name('schedules.employee.destroy');
        });

        Route::get('/employee/list', [AdminController::class, 'index'])->name('employees.list');
        Route::post('/employees', [EmployeesController::class, 'store'])->name('employees.store');
        Route::put('/employees/{employee}', [EmployeesController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}', [EmployeesController::class, 'destroy'])->name('employees.destroy');

        Route::get('/holidays/list', [HolidayController::class, 'index'])->name('holidays.index');
        Route::resource('holidays', HolidayController::class)->only([
            'store',
            'update',
            'destroy',
        ]);

        Route::get('/payroll/generate', [PayrollController::class, 'index'])->name('payroll.index');
        Route::post('/payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
        Route::put('/payroll/{id}/update', [PayrollController::class, 'update'])->name('payroll.update');
        Route::post('/payroll/{id}/approve', [PayrollController::class, 'approve'])->name('payroll.approve');
        Route::delete('/payroll/{id}/delete', [PayrollController::class, 'destroy'])->name('payroll.destroy');
        Route::post('/payroll/{id}/regenerate-payslip', [PayrollController::class, 'regeneratePayslip'])->name('payroll.regeneratePayslip');

        Route::get('/leave-types', [LeaveTypeController::class, 'index'])->name('leave-types.index');
        Route::post('/leave-types', [LeaveTypeController::class, 'store'])->name('leave-types.store');
        Route::put('/leave-types/{id}', [LeaveTypeController::class, 'update'])->name('leave-types.update');
        Route::delete('/leave-types/{id}', [LeaveTypeController::class, 'destroy'])->name('leave-types.destroy');

        Route::get('/departments', [DepartmentController::class, 'index'])
            ->name('departments.index');
        Route::post('/departments', [DepartmentController::class, 'store'])
            ->name('departments.store');
        Route::put('/departments/{department}', [DepartmentController::class, 'update'])
            ->name('departments.update');
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])
            ->name('departments.destroy');

        Route::get('/positions', [PositionController::class, 'index'])
            ->name('positions.index');
        Route::post('/positions', [PositionController::class, 'store'])
            ->name('positions.store');
        Route::put('/positions/{position}', [PositionController::class, 'update'])
            ->name('positions.update');
        Route::delete('/positions/{position}', [PositionController::class, 'destroy'])
            ->name('positions.destroy');

        Route::get('/sites', [SiteController::class, 'index'])
            ->name('sites.index');
        Route::post('/sites', [SiteController::class, 'store'])
            ->name('sites.store');
        Route::put('/sites/{site}', [SiteController::class, 'update'])
            ->name('sites.update');
        Route::delete('/sites/{site}', [SiteController::class, 'destroy'])
            ->name('sites.destroy');

        Route::get('/company-settings', [CompanySettingController::class, 'index'])
            ->name('company-settings.index');
        Route::post('/company-settings', [CompanySettingController::class, 'update'])
            ->name('company-settings.update');

        Route::get('/leaves/admin', [LeaveController::class, 'Adminindex'])->name('leavesAdmin.index');

        Route::post('/employees/import', [EmployeesController::class, 'import'])->name('employees.import');
        Route::get('/download-sample-employee-excel', [EmployeesController::class, 'downloadSampleExcel'])->name('employees.download-sample');

    });

    Route::middleware(['auth', 'role:admin|Manager|Accounting'])->group(function () {});

    Route::middleware(['auth', 'role:Employee'])->group(function () {});

});

Route::middleware(['auth', 'role:SuperAdmin|HR|super admin|admin|Manager|Accounting'])->group(function () {
    Route::post('/overtimes/{overtime}/approve', [EmployeeOvertimeController::class, 'approve'])->name('overtimes.approve');
    Route::post('/overtimes/{overtime}/reject', [EmployeeOvertimeController::class, 'reject'])->name('overtimes.reject');
    Route::delete('/overtimes/{overtime}', [EmployeeOvertimeController::class, 'destroy'])->name('overtimes.destroy');
});

// use App\Events\TestEvent;

// Route::get('/test-event', function () {
//     event(new TestEvent('Hello from Reverb!'));
//     return 'Event dispatched';
// });

// routes/web.php

Route::get('/test-event', function () {
    event(new NewLeaveRequestEvent('John Doe', 2));

    return 'Event dispatched';
});

require __DIR__.'/auth.php';
