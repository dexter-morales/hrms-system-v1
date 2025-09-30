<?php

namespace Tests\Feature;

use App\Http\Controllers\AttendanceController;
use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeSchedule;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class AttendancePunchInTest extends TestCase
{
    use RefreshDatabase;

    protected $employee;

    protected $schedule;

    protected $controller;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test employee
        $this->employee = Employee::factory()->create();
        $this->actingAs($this->employee->user);

        // Create a schedule for 8 PM to 4 AM shift
        $this->schedule = EmployeeSchedule::create([
            'employee_id' => $this->employee->id,
            'schedule_type' => 'fixed',
            'start_time' => '20:00:00',
            'end_time' => '04:00:00',
            'effective_from' => '2025-06-25',
            'effective_until' => '2025-06-26',
        ]);

        $this->controller = new AttendanceController();
    }

    /**
     * Test punch-in on time (8:00 PM)
     */
    public function test_punch_in_on_time()
    {
        $request = new Request();
        $punchIn = Carbon::create(2025, 6, 25, 20, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($punchIn);

        $response = $this->controller->punchIn($request);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertSessionHas('success', 'Punched in successfully!');
        $attendance = EmployeeAttendance::where('employee_id', $this->employee->id)
            ->where('date', '2025-06-25')
            ->first();
        $this->assertNotNull($attendance);
        $this->assertEquals('Present', $attendance->status);
        $this->assertEquals($punchIn, $attendance->punch_in);
        $this->assertNull($attendance->punch_out);
    }

    /**
     * Test punch-in late (8:16 PM)
     */
    public function test_punch_in_late()
    {
        $request = new Request();
        $punchIn = Carbon::create(2025, 6, 25, 20, 16, 0, 'America/Los_Angeles');
        Carbon::setTestNow($punchIn);

        $response = $this->controller->punchIn($request);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertSessionHas('success', 'Punched in successfully!');
        $attendance = EmployeeAttendance::where('employee_id', $this->employee->id)
            ->where('date', '2025-06-25')
            ->first();
        $this->assertNotNull($attendance);
        $this->assertEquals('Late', $attendance->status);
        $this->assertEquals($punchIn, $attendance->punch_in);
        $this->assertNull($attendance->punch_out);
    }

    /**
     * Test punch-in early (7:59 PM)
     */
    public function test_punch_in_early()
    {
        $request = new Request();
        $punchIn = Carbon::create(2025, 6, 25, 19, 59, 0, 'America/Los_Angeles');
        Carbon::setTestNow($punchIn);

        $response = $this->controller->punchIn($request);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertSessionHas('success', 'Punched in successfully!');
        $attendance = EmployeeAttendance::where('employee_id', $this->employee->id)
            ->where('date', '2025-06-25')
            ->first();
        $this->assertNotNull($attendance);
        $this->assertEquals('Present', $attendance->status);
        $this->assertEquals($punchIn, $attendance->punch_in);
        $this->assertNull($attendance->punch_out);
    }

    /**
     * Test double punch-in (same day)
     */
    public function test_double_punch_in()
    {
        $request = new Request();
        $punchIn = Carbon::create(2025, 6, 25, 20, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($punchIn);

        // First punch-in
        $this->controller->punchIn($request);

        // Second punch-in
        $response = $this->controller->punchIn($request);

        $this->assertEquals(302, $response->getStatusCode()); // Redirect with error
        $this->assertSessionHas('error', 'Failed to punch in: You are already punched in. Please punch out first.');
    }

    /**
     * Test punch-in with existing punch-out (new attendance record)
     */
    public function test_punch_in_with_existing_punch_out()
    {
        $request = new Request();
        $initialPunchIn = Carbon::create(2025, 6, 25, 20, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($initialPunchIn);
        $this->controller->punchIn($request);

        $punchOut = Carbon::create(2025, 6, 26, 4, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($punchOut);
        $attendance = EmployeeAttendance::where('employee_id', $this->employee->id)->first();
        $attendance->update(['punch_out' => $punchOut]);

        $newPunchIn = Carbon::create(2025, 6, 26, 20, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($newPunchIn);
        $response = $this->controller->punchIn($request);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertSessionHas('success', 'Punched in successfully!');
        $newAttendance = EmployeeAttendance::where('employee_id', $this->employee->id)
            ->where('date', '2025-06-26')
            ->first();
        $this->assertNotNull($newAttendance);
        $this->assertEquals('Present', $newAttendance->status);
        $this->assertEquals($newPunchIn, $newAttendance->punch_in);
        $this->assertNull($newAttendance->punch_out);
    }

    /**
     * Test punch-in with break (after punch-out)
     */
    public function test_punch_in_with_break()
    {
        $request = new Request();
        $initialPunchIn = Carbon::create(2025, 6, 25, 20, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($initialPunchIn);
        $this->controller->punchIn($request);

        $punchOut = Carbon::create(2025, 6, 25, 22, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($punchOut);
        $attendance = EmployeeAttendance::where('employee_id', $this->employee->id)->first();
        AttendanceLog::create([
            'employee_id' => $this->employee->id,
            'attendance_id' => $attendance->id,
            'timestamp' => $punchOut,
            'type' => 'out',
        ]);
        $attendance->update(['punch_out' => $punchOut]);

        $newPunchIn = Carbon::create(2025, 6, 25, 22, 31, 0, 'America/Los_Angeles'); // 31-minute break
        Carbon::setTestNow($newPunchIn);
        $response = $this->controller->punchIn($request);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertSessionHas('success', 'Punched in successfully!');
        $attendance = EmployeeAttendance::where('employee_id', $this->employee->id)->first();
        $this->assertEquals(0.52, $attendance->break_hours); // ~31 minutes
        $this->assertEquals($newPunchIn, $attendance->punch_in);
    }

    /**
     * Test punch-in with no schedule
     */
    public function test_punch_in_no_schedule()
    {
        $request = new Request();
        $punchIn = Carbon::create(2025, 6, 25, 20, 0, 0, 'America/Los_Angeles');
        Carbon::setTestNow($punchIn);
        EmployeeSchedule::where('employee_id', $this->employee->id)->delete(); // Remove schedule

        $response = $this->controller->punchIn($request);

        $this->assertEquals(302, $response->getStatusCode()); // Redirect with error
        $this->assertSessionHas('error', 'Failed to punch in: No active schedule found.');
    }
}
