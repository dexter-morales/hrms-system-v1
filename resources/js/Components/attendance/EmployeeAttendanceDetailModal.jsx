import { useState, useEffect } from "react";
import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from "flowbite-react";
import DataTable from "react-data-table-component";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faTimes,
    faCircle,
    faCircleDot,
} from "@fortawesome/free-solid-svg-icons";
import { usePage } from "@inertiajs/react";

const EmployeeAttendanceDetailModal = ({
    show,
    onClose,
    employeeId,
    employee_Id,
    selectedMonth,
    selectedYear,
    attendances,
    getAttendanceStatus,
    leaves = [], // Default to empty array if not passed
}) => {
    const [employeeAttendances, setEmployeeAttendances] = useState([]);
    const [employeeLeaves, setEmployeeLeaves] = useState([]);
    const [filterText, setFilterText] = useState("");

    useEffect(() => {
        if (employeeId && selectedMonth && selectedYear) {
            // Prepare attendance data
            const attendanceData = attendances
                .filter((a) => a.employee_id === employeeId)
                .map((record) => {
                    const day = parseInt(record.date.split("-")[2], 10); // Extract day from "YYYY-MM-DD"
                    const status = getAttendanceStatus({ id: employeeId }, day);
                    return {
                        day,
                        date: record.date,
                        punchIn: record.punch_in || "N/A",
                        punchOut: record.punch_out || "N/A",
                        status: status.status,
                        icon: <FontAwesomeIcon icon={status.icon} />, // Render icon as JSX
                        type: "attendance",
                    };
                })
                .sort((a, b) => a.day - b.day);

            // Prepare leave data
            const leaveData = (leaves || [])
                .filter(
                    (l) =>
                        l.employee?.id === employeeId &&
                        l.status === "approved" &&
                        l.start_date.slice(0, 4) === selectedYear.toString() &&
                        l.start_date.slice(5, 7) ===
                            selectedMonth.toString().padStart(2, "0")
                )
                .map((leave) => {
                    const startDateParts = leave.start_date.split("-");
                    const endDateParts = leave.end_date.split("-");
                    const startDay = parseInt(startDateParts[2], 10);
                    const endDay = parseInt(endDateParts[2], 10);
                    const days = [];
                    for (let day = startDay; day <= endDay; day++) {
                        if (
                            selectedYear.toString() === startDateParts[0] &&
                            selectedMonth.toString().padStart(2, "0") ===
                                startDateParts[1]
                        ) {
                            days.push(day);
                        }
                    }
                    return days.map((day) => ({
                        day,
                        date: `${selectedYear}-${selectedMonth
                            .toString()
                            .padStart(2, "0")}-${day
                            .toString()
                            .padStart(2, "0")}`,
                        punchIn: "N/A",
                        punchOut: "N/A",
                        status: leave.leave_type,
                        icon: (
                            <FontAwesomeIcon
                                icon={leave.isWithPay === 1 ? faCheck : faTimes}
                            />
                        ), // Render icon as JSX
                        type: "leave",
                        isPaid: leave.isWithPay,
                    }));
                })
                .flat();

            // Combine and deduplicate data, prioritizing leave over attendance
            const leaveDays = new Set(leaveData.map((l) => l.day));
            const combinedData = [
                ...leaveData,
                ...attendanceData.filter((a) => !leaveDays.has(a.day)),
            ].sort((a, b) => a.day - b.day);

            setEmployeeAttendances(combinedData);
            setEmployeeLeaves(leaveData);
        }
    }, [
        employeeId,
        selectedMonth,
        selectedYear,
        attendances,
        getAttendanceStatus,
        leaves,
    ]);

    // Format time from date string
    const formatTime = (timeStr) => {
        if (timeStr === "N/A") return "N/A";
        const [datePart, timePart] = timeStr.split(" ");
        const [hours, minutes, seconds] = timePart.split(":");
        const period = hours >= 12 ? "PM" : "AM";
        const adjustedHours = hours % 12 || 12;
        return `${adjustedHours}:${minutes} ${period}`;
    };

    // DataTable columns
    const columns = [
        {
            name: "Day",
            selector: (row) => row.day,
            sortable: true,
            width: "80px",
        },
        {
            name: "Date",
            selector: (row) => row.date,
            sortable: true,
            width: "120px",
        },
        {
            name: "Punch In",
            cell: (row) => formatTime(row.punchIn),
            sortable: true,
            width: "120px",
        },
        {
            name: "Punch Out",
            cell: (row) => formatTime(row.punchOut),
            sortable: true,
            width: "120px",
        },
        {
            name: "Status",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.icon} {/* Render the JSX icon */}
                    <span>{row.status}</span>
                    {row.type === "leave" && (
                        <span className="ml-2 text-sm">
                            ({row.isPaid === 1 ? "With Pay" : "Without Pay"})
                        </span>
                    )}
                </div>
            ),
            sortable: true,
            width: "200px",
        },
    ];

    // Custom styles for DataTable
    const customStyles = {
        headCells: {
            style: {
                fontSize: "12px",
                fontWeight: "bold",
                textAlign: "center",
            },
        },
        cells: { style: { fontSize: "12px", textAlign: "center" } },
    };

    // Filter data based on search text
    const filteredData = employeeAttendances.filter(
        (item) =>
            item.day.toString().includes(filterText) ||
            item.date.includes(filterText) ||
            item.punchIn.includes(filterText) ||
            item.punchOut.includes(filterText) ||
            item.status.toLowerCase().includes(filterText.toLowerCase()) ||
            (item.type === "leave" &&
                (item.isPaid === 1
                    ? "with pay".includes(filterText.toLowerCase())
                    : "without pay".includes(filterText.toLowerCase())))
    );

    // Clear filter and handle input change
    const handleFilter = (e) => setFilterText(e.target.value);
    const clearFilter = () => setFilterText("");

    return (
        <Modal show={show} onClose={onClose} popup size="2xl">
            <ModalHeader />
            <ModalBody>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Attendance Details for Employee ID: {employee_Id}
                </h3>
                <div className="mb-4 flex bg-red-200 items-center gap-5">
                    <input
                        type="text"
                        placeholder="Search by day, date, punch in/out, status, or pay status"
                        value={filterText}
                        onChange={handleFilter}
                        className="w-full p-2 border rounded"
                    />
                    {filterText && (
                        <Button color="gray" onClick={clearFilter} className="">
                            Clear
                        </Button>
                    )}
                </div>
                <DataTable
                    columns={columns}
                    data={filteredData}
                    noDataComponent={
                        <>
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
                                        No attendance or leave records found
                                    </span>
                                </p>
                            </div>
                        </>
                    }
                    customStyles={customStyles}
                    striped
                    responsive
                    highlightOnHover
                />
            </ModalBody>
            <ModalFooter>
                <Button color="gray" onClick={onClose}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default EmployeeAttendanceDetailModal;
