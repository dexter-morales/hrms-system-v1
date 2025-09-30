import { useState, useMemo, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    TextInput,
    Label,
    Select,
    Button,
} from "flowbite-react";
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
import EmployeeAttendanceDetailModal from "@/Components/attendance/EmployeeAttendanceDetailModal";
import Datepicker from "flowbite-datepicker/Datepicker";
import { useAttendanceStatus } from "@/Hooks/useAttendanceStatus";
import * as XLSX from "xlsx";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { saveAs } from "file-saver";

const EmployeeAttendanceView = () => {
    const {
        employees,
        attendances,
        schedules,
        holidays,
        currentMonth,
        daysInMonth,
        role_access,
        leaves,
        sites,
    } = usePage().props;
    console.log("EmployeeAttendanceView props:", {
        employees,
        attendances,
        schedules,
        holidays,
        leaves,
        sites,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedEmployee_Id, setSelectedEmployee_Id] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [importFile, setImportFile] = useState(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importData, setImportData] = useState([]); // Store parsed Excel data
    const [biometricImportModalOpen, setBiometricImportModalOpen] =
        useState(false);
    const [biometricImportFile, setBiometricImportFile] = useState(null);
    const [biometricImportMonth, setBiometricImportMonth] =
        useState(currentMonth);
    const [biometricImportYear, setBiometricImportYear] = useState(2025);
    const [biometricImportData, setBiometricImportData] = useState([]);
    const [biometricSiteFilter, setBiometricSiteFilter] = useState(
        sites.find((s) => s.name === "Main Office")?.name ||
            (sites.length > 0 ? sites[0].name : "")
    );
    const [rawExcelData, setRawExcelData] = useState(null); // Store raw Excel data

    const { getAttendanceStatus } = useAttendanceStatus({
        attendances,
        schedules,
        holidays,
        selectedYear,
        selectedMonth,
    });

    useEffect(() => {
        console.log("Selected Month/Year updated:", {
            selectedMonth,
            selectedYear,
        });
        router.reload({
            data: { month: selectedMonth, year: selectedYear },
            only: ["attendances", "daysInMonth"],
            preserveScroll: true,
            onSuccess: () => {
                console.log(
                    "Reload successful, attendances:",
                    attendances.length
                );
            },
            onError: (error) => {
                console.error("Reload failed:", error);
            },
        });
    }, [selectedMonth, selectedYear]);

    const daysInSelectedMonth = new Date(
        selectedYear,
        selectedMonth,
        0
    ).getDate();
    const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

    const formatDate = (day) => {
        const month = selectedMonth.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        return `${selectedYear}-${month}-${dayStr}`;
    };

    const isHoliday = (day) => {
        const date = formatDate(day);
        return holidays.find((h) => h.date_holiday === date);
    };

    const getLeaveStatus = (employeeId, date) => {
        const leave = leaves.find(
            (l) =>
                l.employee.id === employeeId &&
                l.start_date <= date &&
                l.end_date >= date &&
                l.status === "approved"
        );
        return leave ? (leave.isWithPay === 1 ? faCheck : faTimes) : null;
    };

    const handleCellClick = (record, employeeId, date) => {
        console.log("Cell clicked:", { record, employeeId, date });
        setSelectedAttendance(record || null);
        setSelectedEmployeeId(employeeId);
        setSelectedDate(date);
        setModalOpen(true);
    };

    const handleNameClick = (employeeId, employee_Id) => {
        console.log("Name clicked for employeeId:", employeeId);
        setSelectedEmployeeId(employeeId);
        setSelectedEmployee_Id(employee_Id);
        setDetailModalOpen(true);
    };

    const handleEditClick = (record, employeeId, date) => {
        console.log("Edit clicked:", { record, employeeId, date });
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

    const handleDetailModalClose = () => {
        setDetailModalOpen(false);
        setSelectedEmployeeId(null);
    };

    const filteredEmployees = useMemo(() => {
        console.log("Filtering employees with:", {
            employees: employees.length,
            attendances: attendances.length,
            searchTerm,
            statusFilter,
            roleFilter,
            selectedMonth,
            selectedYear,
        });
        return employees.filter((employee) => {
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
        getAttendanceStatus,
    ]);

    const roles = [...new Set(employees.flatMap((employee) => employee.roles))];

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setRoleFilter("");
        setSelectedMonth(currentMonth);
        setSelectedYear(2025);
    };

    const columns = [
        {
            name: "Employee",
            selector: (row) => row.id,
            sortable: true,
            cell: (row) => (
                <div className="flex gap-2 w-full " key={row.id}>
                    {" "}
                    {/* Unique key for cell */}
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
                        href="#"
                        onClick={() => handleNameClick(row.id, row.employee_id)}
                        className="text-indigo-600 hover:underline cursor-pointer w-full "
                    >
                        <div className="flex flex-col">
                            {row.first_name + " " + row.last_name}
                            <span
                                className="text-xs"
                                style={{
                                    fontSize: "10px",
                                }}
                            >
                                {row.employee_id}
                            </span>
                        </div>
                    </a>
                </div>
            ),
            width: "200px",
            fixed: true,
        },
        ...days.map((day) => ({
            name: (
                <div
                    className="flex items-center justify-center gap-1"
                    key={`day-${day}`}
                >
                    {" "}
                    {/* Unique key for column name */}
                    {day}
                    {isHoliday(day) && (
                        <span title={isHoliday(day)?.name}>🎉</span>
                    )}
                </div>
            ),
            selector: (row) => day,
            cell: (row) => (
                <div
                    className="text-center min-h-[24px] flex items-center justify-center"
                    key={`cell-${row.id}-${day}`}
                >
                    {" "}
                    {/* Unique key for cell */}
                    {getAttendanceStatus(row, day).icon}
                    {getLeaveStatus(row.id, formatDate(day)) && (
                        <FontAwesomeIcon
                            icon={getLeaveStatus(row.id, formatDate(day))}
                            className="ml-1 text-sm"
                            title={
                                getLeaveStatus(row.id, formatDate(day)) ===
                                faCheck
                                    ? "Paid Leave"
                                    : "Unpaid Leave"
                            }
                        />
                    )}
                </div>
            ),
            width: "60px",
            key: `column-${day}`, // Unique key for each column
        })),
    ];

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
                // textAlign: "center",
                minHeight: "24px",
            },
        },
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImportFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                });

                const parsedData = jsonData.map((row) => ({
                    Employee_ID: row.Employee_ID,
                    Date: formatExcelDate(row.Date),
                    time_in: row.time_in,
                    time_out: row.time_out,
                    break_hours: formatExcelTime(row.break_hours),
                    location: row.location,
                }));
                setImportData(parsedData);
                setImportModalOpen(true);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleBiometricFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setBiometricImportFile(file);
            console.log("File selected for biometric import:", file.name); // Debug log
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) {
                        throw new Error("No valid sheet found in the file.");
                    }
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        raw: false,
                        header: 1,
                        range: 1,
                    });
                    console.log("Raw Excel data parsed:", jsonData); // Debug log
                    setRawExcelData(jsonData); // Store raw data for re-parsing
                    parseBiometricData(jsonData); // Initial parse
                    setBiometricImportModalOpen(true); // Ensure modal opens
                } catch (error) {
                    console.error("Error parsing biometric file:", error);
                    toast.error(
                        "Failed to parse the biometric file. Please check the format."
                    );
                }
            };
            reader.onerror = () => {
                console.error("FileReader error");
                toast.error("Error reading the biometric file.");
            };
            reader.readAsArrayBuffer(file);
        } else {
            console.log("No file selected for biometric import"); // Debug log
        }
    };

    const parseBiometricData = (jsonData) => {
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);

        const parsedData = dataRows
            .map((row) => {
                const employeeId = row[headers.indexOf("Employee ID")];
                const firstName = row[headers.indexOf("First Name")];
                const department = row[headers.indexOf("Department")];
                const siteName = biometricSiteFilter || department || "";

                const attendanceData = {};
                for (let i = 3; i < headers.length; i++) {
                    const day = parseInt(headers[i], 10);
                    if (!isNaN(day)) {
                        const timeStr = row[i];
                        if (timeStr && typeof timeStr === "string") {
                            const [timeIn, timeOut] = timeStr.split("-");
                            const date = `${biometricImportYear}-${biometricImportMonth
                                .toString()
                                .padStart(2, "0")}-${day
                                .toString()
                                .padStart(2, "0")}`;
                            const paddedTimeIn = timeIn
                                ? `${date} ${timeIn.padEnd(5, ":00")}`
                                : null;
                            const paddedTimeOut = timeOut
                                ? `${date} ${timeOut.padEnd(5, ":00")}`
                                : null;

                            attendanceData[date] = {
                                employee_id: employeeId,
                                date: date,
                                time_in: paddedTimeIn,
                                time_out: paddedTimeOut,
                                break_hours: 0,
                                location: siteName, // Use site name
                            };
                        }
                    }
                }
                return attendanceData;
            })
            .flatMap(Object.values);

        // Ensure uniqueness by combining employee_id and date
        const uniqueData = [];
        const seen = new Set();
        parsedData.forEach((item) => {
            const key = `${item.employee_id}-${item.date}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueData.push(item);
            }
        });

        setBiometricImportData(uniqueData);
    };

    // Re-parse when site, month, or year changes
    useEffect(() => {
        if (rawExcelData && biometricImportFile) {
            parseBiometricData(rawExcelData);
        }
    }, [
        biometricSiteFilter,
        biometricImportMonth,
        biometricImportYear,
        rawExcelData,
        biometricImportFile,
    ]);

    const handleExportSampleTemplate = () => {
        try {
            const worksheet = XLSX.utils.json_to_sheet([]);
            const workbook = XLSX.utils.book_new();

            const headers = [
                "Employee_ID",
                "Date",
                "time_in",
                "time_out",
                "break_hours",
                "location",
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

            const sampleData = [
                {
                    Employee_ID: "EMP001",
                    Date: "6/16/2025",
                    time_in: "9:00",
                    time_out: "18:30",
                    break_hours: "1:00",
                    location: "Main Office",
                },
            ];
            XLSX.utils.sheet_add_json(worksheet, sampleData, {
                origin: "A2",
                skipHeader: true,
            });

            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            range.s.r = 0;
            range.e.r = 2;
            worksheet["!ref"] = XLSX.utils.encode_range(range);

            XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(
                blob,
                `Sample_Timesheet_Template_${
                    new Date().toISOString().split("T")[0]
                }.xlsx`
            );
            toast.success("Sample template exported to Excel successfully!");
        } catch (error) {
            console.error("Sample template export error:", error);
            toast.error(
                "Failed to export sample template. Check console for details."
            );
        }
    };

    const formatExcelDate = (value) => {
        if (!value) return "";

        const date = new Date(value);
        if (isNaN(date)) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatExcelTime = (value) => {
        if (!value) return "";

        if (typeof value === "string") {
            const date = new Date(`${value}`);
            if (!isNaN(date.getTime())) {
                const hours = date.getHours();
                const minutes = date.getMinutes();
                return `${String(hours).padStart(2, "0")}:${String(
                    minutes
                ).padStart(2, "0")}`;
            }
            return value;
        }

        if (typeof value === "number") {
            const totalMinutes = Math.round(value * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${String(hours).padStart(2, "0")}:${String(
                minutes
            ).padStart(2, "0")}`;
        }

        return "";
    };

    const handleImportSubmit = () => {
        if (!importFile) {
            toast.error("Please select a file to import!");
            return;
        }

        const padTime = (t) => {
            if (!t || typeof t !== "string" || !t.includes(":"))
                return "00:00:00";

            const parts = t.split(":");

            const h = parts[0] ? String(parts[0]).padStart(2, "0") : "00";
            const m = parts[1] ? String(parts[1]).padStart(2, "0") : "00";
            const s = parts[2] ? String(parts[2]).padStart(2, "0") : "00";

            if (isNaN(h) || isNaN(m) || isNaN(s)) return "00:00:00";

            return `${h}:${m}:${s}`;
        };

        const attendanceData = importData
            .map((row) => {
                const employee = employees.find(
                    (emp) => emp.employee_id === row.Employee_ID
                );
                if (!employee) {
                    toast.error(`Employee ID ${row.Employee_ID} not found!`);
                    return null;
                }

                const location = sites.find(
                    (site) => site.name === row.location
                );
                if (!location) {
                    toast.error(`Location ${row.location} not found!`);
                    return null;
                }

                const date = row.Date;
                const timeIn = `${date} ${padTime(row.time_in)}`;
                const timeOut = `${date} ${padTime(row.time_out)}`;

                return {
                    employee_id: employee.id,
                    date: date,
                    time_in: timeIn,
                    time_out: timeOut,
                    break_hours: parseFloat(row.break_hours) || 0,
                    location: location.id || null,
                };
            })
            .filter((item) => item !== null);

        router.post(
            route("employee.attendance.import"),
            { attendances: attendanceData },
            {
                onSuccess: () => {
                    toast.success("Attendance data imported successfully!");
                    router.reload({ only: ["attendances"] });
                    setImportModalOpen(false);
                    setImportFile(null);
                    setImportData([]);
                },
                onError: (errors) => {
                    toast.error(
                        "Failed to import attendance data: " +
                            Object.values(errors).join(", ")
                    );
                },
            }
        );
    };

    const handleBiometricImportSubmit = () => {
        if (!biometricImportFile) {
            toast.error("Please select a file to import!");
            return;
        }

        const padTime = (t) => {
            if (!t || typeof t !== "string" || !t.includes(":"))
                return "00:00:00";

            const parts = t.split(":");

            const h = parts[0] ? String(parts[0]).padStart(2, "0") : "00";
            const m = parts[1] ? String(parts[1]).padStart(2, "0") : "00";
            const s = parts[2] ? String(parts[2]).padStart(2, "0") : "00";

            if (isNaN(h) || isNaN(m) || isNaN(s)) return "00:00:00";

            return `${h}:${m}:${s}`;
        };

        const attendanceData = biometricImportData
            .map((row) => {
                const employee = employees.find(
                    (emp) => emp.employee_id === row.employee_id
                );
                if (!employee) {
                    toast.error(`Employee ID ${row.employee_id} not found!`);
                    return null;
                }

                const location = sites.find(
                    (site) => site.name === row.location
                );
                if (!location && biometricSiteFilter) {
                    toast.error(`Location ${row.location} not found!`);
                    return null;
                }

                return {
                    employee_id: employee.id,
                    date: row.date,
                    time_in: row.time_in,
                    time_out: row.time_out,
                    break_hours: row.break_hours || 0,
                    location: location ? location.id : null,
                };
            })
            .filter((item) => item !== null);

        router.post(
            route("employee.attendance.import"),
            { attendances: attendanceData },
            {
                onSuccess: () => {
                    toast.success(
                        "Biometric attendance data imported successfully!"
                    );
                    router.reload({ only: ["attendances"] });
                    setBiometricImportModalOpen(false);
                    setBiometricImportFile(null);
                    setBiometricImportData([]);
                    setRawExcelData(null);
                },
                onError: (errors) => {
                    toast.error(
                        "Failed to import biometric attendance data: " +
                            Object.values(errors).join(", ")
                    );
                },
            }
        );
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
            <div className="flex flex-row gap-2">
                <Button
                    className=" transition-all duration-300 ease-in-out font-semibold"
                    color="red"
                    size="md"
                    onClick={() =>
                        document.getElementById("importFile").click()
                    }
                >
                    Import Attendance
                </Button>
                <input
                    id="importFile"
                    type="file"
                    accept=".xls, .xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <Button
                    className=" transition-all duration-300 ease-in-out font-semibold"
                    size="md"
                    color="gray"
                    onClick={() =>
                        document.getElementById("biometricImportFile").click()
                    }
                >
                    Import from Biometrics
                </Button>
                <input
                    id="biometricImportFile"
                    type="file"
                    accept=".xls, .xlsx"
                    onChange={handleBiometricFileUpload}
                    className="hidden"
                />
                <Button
                    className=" transition-all duration-300 ease-in-out font-semibold"
                    size="md"
                    color="gray"
                    onClick={handleExportSampleTemplate}
                >
                    <span>Sample Template</span>
                </Button>
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
                        <div className="flex items-end gap-2">
                            <Button
                                className=" transition-all duration-300 ease-in-out font-semibold"
                                size="md"
                                color="red"
                                onClick={() => {
                                    setSelectedMonth(selectedMonth);
                                    setSelectedYear(selectedYear);
                                }}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                className="transition-all duration-300 ease-in-out font-semibold"
                                size="md"
                                color="gray"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                    <div className="relative overflow-x-auto max-w-full shadow-md">
                        <DataTable
                            columns={columns}
                            {...console.log(
                                "filteredEmployees",
                                filteredEmployees
                            )}
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

                <NewAttendanceModal
                    show={modalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    editAttendance={selectedAttendance}
                    employees={employees}
                    initialDate={selectedDate}
                    initialEmployeeId={selectedEmployeeId}
                />
                <EmployeeAttendanceDetailModal
                    show={detailModalOpen}
                    onClose={handleDetailModalClose}
                    employeeId={selectedEmployeeId}
                    employee_Id={selectedEmployee_Id}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    attendances={attendances}
                    getAttendanceStatus={getAttendanceStatus}
                    leaves={leaves}
                />
                <Modal
                    show={importModalOpen}
                    onClose={() => setImportModalOpen(false)}
                >
                    <ModalHeader>Import Attendance</ModalHeader>
                    <ModalBody>
                        <p>
                            Review the data below before confirming the import:
                        </p>
                        <DataTable
                            columns={[
                                {
                                    name: "Employee ID",
                                    selector: (row) => row.Employee_ID,
                                    sortable: true,
                                },
                                {
                                    name: "Date",
                                    selector: (row) => row.Date,
                                    sortable: true,
                                },
                                {
                                    name: "Time In",
                                    selector: (row) => row.time_in,
                                    sortable: true,
                                },
                                {
                                    name: "Time Out",
                                    selector: (row) => row.time_out,
                                    sortable: true,
                                },
                                {
                                    name: "Break Hours",
                                    selector: (row) => row.break_hours,
                                    sortable: true,
                                },
                                {
                                    name: "Location",
                                    selector: (row) => row.location,
                                    sortable: true,
                                },
                            ]}
                            data={importData}
                            pagination
                            paginationPerPage={5}
                            customStyles={customStyles}
                            striped
                            responsive
                            noDataComponent={<p>No data to display</p>}
                        />
                        <Button
                            className="bg-green-700 hover:!bg-green-900 text-white mt-4"
                            onClick={handleImportSubmit}
                        >
                            Confirm Import
                        </Button>
                    </ModalBody>
                </Modal>
                <Modal
                    show={biometricImportModalOpen}
                    onClose={() => setBiometricImportModalOpen(false)}
                >
                    <ModalHeader>Import Biometric Attendance</ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="mb-4">
                                <label
                                    htmlFor="biometricMonth"
                                    value="Select Month"
                                >
                                    Select Month
                                </label>
                                <Select
                                    id="biometricMonth"
                                    value={biometricImportMonth}
                                    onChange={(e) =>
                                        setBiometricImportMonth(
                                            parseInt(e.target.value)
                                        )
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
                            <div className="mb-4">
                                <label htmlFor="biometricYear" value="">
                                    Select Year
                                </label>
                                <Select
                                    id="biometricYear"
                                    value={biometricImportYear}
                                    onChange={(e) =>
                                        setBiometricImportYear(
                                            parseInt(e.target.value)
                                        )
                                    }
                                >
                                    {[2025, 2024, 2023].map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="mb-4 col-span-2">
                                <label
                                    htmlFor="biometricSite"
                                    value="Select Site"
                                >
                                    Select Site
                                </label>
                                <Select
                                    id="biometricSite"
                                    value={biometricSiteFilter || ""}
                                    onChange={(e) =>
                                        setBiometricSiteFilter(e.target.value)
                                    }
                                >
                                    <option value="">All Sites</option>
                                    {sites.map((site) => (
                                        <option key={site.id} value={site.name}>
                                            {site.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                        <p>
                            Review the data below before confirming the import:
                        </p>
                        <DataTable
                            columns={[
                                {
                                    name: "Employee ID",
                                    selector: (row) => row.employee_id,
                                    sortable: true,
                                },
                                {
                                    name: "Date",
                                    selector: (row) => row.date,
                                    sortable: true,
                                },
                                {
                                    name: "Time In",
                                    selector: (row) => row.time_in,
                                    sortable: true,
                                },
                                {
                                    name: "Time Out",
                                    selector: (row) => row.time_out,
                                    sortable: true,
                                },
                                {
                                    name: "Break Hours",
                                    selector: (row) => row.break_hours,
                                    sortable: true,
                                },
                                {
                                    name: "Location",
                                    selector: (row) => row.location,
                                    sortable: true,
                                },
                            ]}
                            data={biometricImportData}
                            pagination
                            paginationPerPage={5}
                            customStyles={customStyles}
                            striped
                            responsive
                            noDataComponent={<p>No data to display</p>}
                        />
                        <Button
                            className="bg-green-700 hover:!bg-green-900 text-white mt-4"
                            onClick={handleBiometricImportSubmit}
                        >
                            Confirm Import
                        </Button>
                    </ModalBody>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeAttendanceView;
