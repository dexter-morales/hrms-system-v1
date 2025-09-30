import { useState, useMemo, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { Modal, TextInput, Label, Select, Button } from "flowbite-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faTimes,
    faCircle,
    faCircleDot,
} from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import NewAttendanceModal from "@/Components/attendance/NewAttendanceModal";
import Datepicker from "flowbite-datepicker/Datepicker";

const EmployeeAttendanceView = () => {
    const {
        employees,
        attendances,
        schedules,
        holidays,
        currentMonth,
        daysInMonth,
        role_access,
    } = usePage().props;
    console.log("EmployeeAttendanceView props:", {
        employees,
        attendances,
        schedules,
        holidays,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(currentMonth); // Default to currentMonth
    const [selectedYear, setSelectedYear] = useState(2025); // Default to 2025

    // Log month/year changes for debugging
    useEffect(() => {
        console.log("Selected Month/Year updated:", {
            selectedMonth,
            selectedYear,
        });
    }, [selectedMonth, selectedYear]);

    // Generate days array based on selected month and year
    const daysInSelectedMonth = new Date(
        selectedYear,
        selectedMonth,
        0
    ).getDate();
    const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

    // Format date for the selected month and year
    const formatDate = (day) => {
        const month = selectedMonth.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        return `${selectedYear}-${month}-${dayStr}`;
    };

    // Check if holiday
    const isHoliday = (day) => {
        const date = formatDate(day);
        return holidays.find((h) => h.date_holiday === date);
    };

    // Get schedule for date
    const getSchedule = (employeeId, date) => {
        const dayOfWeek = new Date(date)
            .toLocaleString("en-US", { weekday: "short" })
            .toLowerCase();
        const schedule = schedules.find(
            (s) =>
                s.employee_id === employeeId &&
                (!s.effective_from || s.effective_from <= date) &&
                (!s.effective_until || s.effective_until >= date)
        );

        if (!schedule) {
            console.log(`No schedule for employee ${employeeId} on ${date}`);
            return null;
        }

        const workingDays = schedule.working_days;

        let startTime, endTime;
        if (schedule.schedule_type === "fixed") {
            if (!workingDays.includes(dayOfWeek)) {
                console.log(
                    `Not a working day: ${dayOfWeek} for employee ${employeeId}`
                );
                return null;
            }
            startTime = schedule.start_time;
            endTime = schedule.end_time;
        } else {
            if (!workingDays[dayOfWeek]) {
                console.log(
                    `No flexible schedule for ${dayOfWeek} for employee ${employeeId}`
                );
                return null;
            }
            [startTime, endTime] = workingDays[dayOfWeek];
        }

        const hours =
            (new Date(`${date}T${endTime}`) -
                new Date(`${date}T${startTime}`)) /
            (1000 * 60 * 60);
        console.log(
            `Schedule for ${employeeId} on ${date}: ${startTime}-${endTime} (${hours} hours)`
        );

        return {
            start_time: startTime,
            end_time: endTime,
            hours: hours > 0 ? hours : 0,
        };
    };

    // Determine attendance status
    const getAttendanceStatus = (employee, day) => {
        const employeeId = employee.id;
        const payrollStatus = employee.payroll_status.toLowerCase();
        const date = formatDate(day);
        const record = attendances.find(
            (a) => a.employee_id === employeeId && a.date === date
        );
        const schedule = getSchedule(employeeId, date);
        const holiday = isHoliday(day);

        if (holiday) {
            if (!record || !record.punch_in || !record.punch_out) {
                return {
                    icon:
                        payrollStatus === "weekly" ? (
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-red-500 text-lg"
                            />
                        ) : (
                            <FontAwesomeIcon
                                icon={faCircleDot}
                                className="text-green-500 text-sm"
                            />
                        ),
                    status: "holiday-absent",
                };
            }

            const punchIn = new Date(record.punch_in);
            const punchOut = new Date(record.punch_out);
            const workedHours = (punchOut - punchIn) / (1000 * 60 * 60);

            if (!schedule) {
                return {
                    icon: (
                        <a
                            href="#"
                            onClick={() =>
                                handleCellClick(record, employeeId, date)
                            }
                            className="text-success"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                        </a>
                    ),
                    status: "holiday-partial",
                };
            }

            const scheduleStart = new Date(`${date}T${schedule.start_time}`);
            const scheduleEnd = new Date(`${date}T${schedule.end_time}`);
            const scheduleHours = schedule.hours;
            const midpoint = new Date(
                scheduleStart.getTime() + (scheduleEnd - scheduleStart) / 2
            );

            const isMorning =
                punchIn <= new Date(scheduleStart.getTime() + 30 * 60 * 1000);
            const isLate = punchIn > midpoint;

            if (workedHours >= scheduleHours) {
                return {
                    icon: (
                        <a
                            href="#"
                            onClick={() =>
                                handleCellClick(record, employeeId, date)
                            }
                            className="text-success"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                        </a>
                    ),
                    status: "holiday-full",
                };
            } else if (isMorning && workedHours < scheduleHours / 2) {
                return {
                    icon: (
                        <div className="flex gap-1 justify-center items-center">
                            <a
                                href="#"
                                onClick={() =>
                                    handleCellClick(record, employeeId, date)
                                }
                                className="text-success"
                            >
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className="text-green-500 text-lg"
                                />
                            </a>
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-red-500 text-lg"
                            />
                        </div>
                    ),
                    status: "holiday-morning",
                };
            } else if (isLate && workedHours < scheduleHours) {
                return {
                    icon: (
                        <div className="flex gap-1 justify-center items-center">
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-red-500 text-lg"
                            />
                            <a
                                href="#"
                                onClick={() =>
                                    handleCellClick(record, employeeId, date)
                                }
                                className="text-success"
                            >
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className="text-green-500 text-lg"
                                />
                            </a>
                        </div>
                    ),
                    status: "holiday-afternoon",
                };
            }

            return {
                icon: (
                    <a
                        href="#"
                        onClick={() =>
                            handleCellClick(record, employeeId, date)
                        }
                        className="text-success"
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            className="text-green-500 text-lg"
                        />
                    </a>
                ),
                status: "holiday-partial",
            };
        }

        if (!record || !record.punch_in || !record.punch_out) {
            const status = schedule ? "absent" : "none";
            return {
                icon: schedule ? (
                    <FontAwesomeIcon
                        icon={faTimes}
                        className="text-red-500 text-lg"
                    />
                ) : null,
                status,
            };
        }

        const punchIn = new Date(record.punch_in);
        const punchOut = new Date(record.punch_out);
        const workedHours = (punchOut - punchIn) / (1000 * 60 * 60);

        if (!schedule) {
            return {
                icon: (
                    <a
                        href="#"
                        onClick={() =>
                            handleCellClick(record, employeeId, date)
                        }
                        className="text-success"
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            className="text-green-500 text-lg"
                        />
                    </a>
                ),
                status: "partial",
            };
        }

        const scheduleStart = new Date(`${date}T${schedule.start_time}`);
        const scheduleEnd = new Date(`${date}T${schedule.end_time}`);
        const scheduleHours = schedule.hours;
        const midpoint = new Date(
            scheduleStart.getTime() + (scheduleEnd - scheduleStart) / 2
        );

        const isMorning =
            punchIn <= new Date(scheduleStart.getTime() + 30 * 60 * 1000);
        const isLate = punchIn > midpoint;

        if (workedHours >= scheduleHours) {
            return {
                icon: (
                    <a
                        href="#"
                        onClick={() =>
                            handleCellClick(record, employeeId, date)
                        }
                        className="text-success"
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            className="text-green-500 text-lg"
                        />
                    </a>
                ),
                status: "full",
            };
        } else if (isMorning && workedHours < scheduleHours / 2) {
            return {
                icon: (
                    <div className="flex gap-1 justify-center items-center">
                        <a
                            href="#"
                            onClick={() =>
                                handleCellClick(record, employeeId, date)
                            }
                            className="text-success"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                        </a>
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="text-red-500 text-lg"
                        />
                    </div>
                ),
                status: "morning",
            };
        } else if (isLate && workedHours < scheduleHours) {
            return {
                icon: (
                    <div className="flex gap-1 justify-center items-center">
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="text-red-500 text-lg"
                        />
                        <a
                            href="#"
                            onClick={() =>
                                handleCellClick(record, employeeId, date)
                            }
                            className="text-success"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                        </a>
                    </div>
                ),
                status: "afternoon",
            };
        }

        return {
            icon: (
                <a
                    href="#"
                    onClick={() => handleCellClick(record, employeeId, date)}
                    className="text-success"
                >
                    <FontAwesomeIcon
                        icon={faCheck}
                        className="text-green-500 text-lg"
                    />
                </a>
            ),
            status: "partial",
        };
    };

    const handleCellClick = (record, employeeId, date) => {
        console.log("Cell clicked:", { record, employeeId, date });
        setSelectedAttendance(record || null);
        setSelectedEmployeeId(employeeId);
        setSelectedDate(date);
        setModalOpen(true);
    };

    const handleModalSuccess = () => {
        toast.success("Attendance updated successfully!");
        router.reload({ only: ["attendances"] });
        setModalOpen(false);
        setSelectedAttendance(null);
        setSelectedEmployeeId(null);
        setSelectedDate(null);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedAttendance(null);
        setSelectedEmployeeId(null);
        setSelectedDate(null);
    };

    // Filter employees
    const filteredEmployees = useMemo(() => {
        return employees.filter((employee) => {
            console.log("Filtering employee:", employee);

            const matchesSearch =
                searchTerm === "" ||
                employee.first_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                employee.last_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const employeeRole = employee.roles ? employee.roles.name : null;
            const matchesRole =
                roleFilter === "" || employeeRole === roleFilter;

            let matchesStatus = true;
            if (statusFilter !== "") {
                matchesStatus = days.some((day) => {
                    const { status } = getAttendanceStatus(employee, day);
                    return status === statusFilter;
                });
            }

            let matchesMonthYear = true;
            if (selectedMonth && selectedYear) {
                const employeeAttendances = attendances.filter(
                    (a) => a.employee_id === employee.id
                );
                matchesMonthYear = employeeAttendances.some((a) => {
                    const attendanceDate = new Date(a.date);
                    return (
                        attendanceDate.getMonth() + 1 === selectedMonth &&
                        attendanceDate.getFullYear() === selectedYear
                    );
                });
            }

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus &&
                matchesMonthYear
            );
        });
    }, [
        employees,
        searchTerm,
        statusFilter,
        roleFilter,
        selectedMonth,
        selectedYear,
        attendances,
        days,
    ]);

    // Unique roles
    const roles = [...new Set(employees.flatMap((employee) => employee.roles))];

    // Clear filters
    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setRoleFilter("");
        setSelectedMonth(currentMonth);
        setSelectedYear(2025);
    };

    // DataTable columns
    const columns = [
        {
            name: "Employee",
            selector: (row) => row.id,
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <img
                        src={
                            row.avatar
                                ? row.avatar
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      row.first_name + " " + row.last_name
                                  )}&background=random&color=fff`
                        }
                        alt={row.first_name + " " + row.last_name}
                        className="w-8 h-8 rounded-full"
                    />
                    <a
                        href={`/employees/${row.id}`}
                        className="text-indigo-600 hover:underline"
                    >
                        {row.first_name + " " + row.last_name}
                    </a>
                </div>
            ),
            width: "200px",
            fixed: true,
        },
        ...days.map((day) => ({
            name: (
                <div className="flex items-center justify-center gap-1">
                    {day}
                    {isHoliday(day) && (
                        <span title={isHoliday(day)?.name}>🎉</span>
                    )}
                </div>
            ),
            selector: (row) => day,
            cell: (row) => (
                <div className="text-center min-h-[24px]">
                    {getAttendanceStatus(row, day).icon}
                </div>
            ),
            width: "60px",
        })),
    ];

    // DataTable styles
    const customStyles = {
        table: {
            style: {
                width: "1200px",
                minWidth: "124%",
            },
        },
        headCells: {
            style: {
                fontSize: "12px",
                fontWeight: "bold",
                textAlign: "center",
                backgroundColor: "#f3f4f6",
                padding: "20px",
            },
        },
        cells: {
            style: {
                fontSize: "12px",
                padding: "20px",
                textAlign: "center",
                minHeight: "24px",
            },
        },
    };

    return (
        <DashboardLayout>
            <Head title="Employee Attendance" />
            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Employee Attendance - {selectedMonth}/{selectedYear}
                </h3>
                <BreadCrumbs />
            </div>
            <div>
                <div className="mx-auto space-y-3">
                    <div className="mb-4 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="search" value="Search Employees" />
                            <TextInput
                                id="search"
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="status" value="Attendance Status" />
                            <Select
                                id="status"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                            >
                                <option value="">All Status</option>
                                <option value="full">Full Day</option>
                                <option value="absent">Absent</option>
                                <option value="morning">Morning Only</option>
                                <option value="afternoon">
                                    Afternoon Only
                                </option>
                                <option value="partial">
                                    Partial Presence
                                </option>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="role" value="Role" />
                            <Select
                                id="role"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">All Roles</option>
                                {role_access.map((role) => (
                                    <option key={role} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="month" value="Select Month" />
                            <Select
                                id="month"
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(parseInt(e.target.value))
                                }
                            >
                                {Array.from(
                                    { length: 12 },
                                    (_, i) => i + 1
                                ).map((month) => (
                                    <option key={month} value={month}>
                                        {new Date(
                                            2025,
                                            month - 1
                                        ).toLocaleString("default", {
                                            month: "long",
                                        })}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="year" value="Select Year" />
                            <Select
                                id="year"
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(parseInt(e.target.value))
                                }
                            >
                                {[2025, 2024, 2023].map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                className="bg-blue-700 hover:!bg-blue-900 text-white transition-all duration-300 ease-in-out font-semibold mr-2"
                                size="md"
                                onClick={() => {
                                    setSelectedMonth(selectedMonth); // Force re-render
                                    setSelectedYear(selectedYear);
                                }}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                                size="md"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                    <div className="relative overflow-x-auto max-w-full shadow-md">
                        <DataTable
                            columns={columns}
                            data={filteredEmployees}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 25, 50]}
                            customStyles={customStyles}
                            striped
                            responsive
                            fixedHeader
                            fixedHeaderScrollHeight="500px"
                            noDataComponent={
                                <div>
                                    <img
                                        src="/images/no-data.webp"
                                        alt="Empty"
                                        className="max-w-xs mt-2 mx-auto"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                    <p className="text-center mb-5 badge badge-error ">
                                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                                            No Attendances
                                        </span>
                                    </p>
                                </div>
                            }
                        />
                    </div>
                </div>

                {/* <ToastContainer position="bottom-right" autoClose={3000} /> */}
                <NewAttendanceModal
                    show={modalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    editAttendance={selectedAttendance}
                    employees={employees}
                    initialDate={selectedDate}
                    initialEmployeeId={selectedEmployeeId}
                />
            </div>
        </DashboardLayout>
    );
};

export default EmployeeAttendanceView;
