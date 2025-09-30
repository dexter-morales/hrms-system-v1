import React, { useMemo, useState, useEffect } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import {
    Button,
    Select,
    TextInput,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Checkbox,
} from "flowbite-react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import PayrollTableComponent from "@/Components/payroll/PayrollTableComponent";
import PayrollApprovalModal from "@/Components/payroll/PayrollApprovalModal";
import { toast } from "react-toastify";
import { useAttendanceStatus } from "@/hooks/useAttendanceStatus.jsx";
import DataTable from "react-data-table-component";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { Badge } from "lucide-react";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

const PayrollComponent = () => {
    const {
        payrolls,
        sites,
        employees,
        auth,
        attendances,
        schedules,
        holidays,
        leaves,
        payPeriodStart,
        payPeriodEnd,
    } = usePage().props;

    console.log("payrolls: ", payrolls);
    console.log("employees: ", employees);
    console.log("attendances: ", attendances);
    console.log("leaves: ", leaves);

    const [formData, setFormData] = useState({
        pay_schedule_type: "weekly",
        start_date: dayjs().format("YYYY-MM-DD"),
        end_date: dayjs().add(6, "day").format("YYYY-MM-DD"),
        site: "",
    });
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateAll, setGenerateAll] = useState(false);
    const [searchEmployee, setSearchEmployee] = useState("");

    // Handle form submission for generating payroll
    const handleGeneratePayroll = (e) => {
        e.preventDefault();
        if (!generateAll && selectedEmployees.length === 0) {
            toast.error(
                "Please select at least one employee or choose 'Generate All'."
            );
            return;
        }
        const employeeIds = generateAll
            ? employees.map((emp) => emp.id)
            : selectedEmployees;
        router.post(
            route("payroll.generate"),
            {
                employee_ids: employeeIds,
                start_date: formData.start_date,
                end_date: formData.end_date,
                pay_schedule_type: formData.pay_schedule_type,
            },
            {
                onSuccess: () => {
                    toast.success("Payroll generated successfully!!");
                    setShowGenerateModal(false);
                    setSelectedEmployees([]);
                    setGenerateAll(false);
                },
                onError: (errors) => console.error("Error:", errors),
            }
        );
    };

    // Handle filter changes and update URL
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        if (name === "pay_schedule_type" && value === "weekly") {
            updatedFormData.end_date = dayjs(updatedFormData.start_date)
                .add(6, "day")
                .format("YYYY-MM-DD");
        } else if (name === "pay_schedule_type" && value === "semi-monthly") {
            updatedFormData.end_date = dayjs(updatedFormData.start_date)
                .add(14, "day")
                .format("YYYY-MM-DD");
        }
        setFormData(updatedFormData);
        router.get(route("payroll.generate"), updatedFormData, {
            preserveState: true,
        });
    };

    // Handle employee selection
    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    // Handle view details for approval modal
    const handleViewDetails = (payroll) => {
        setSelectedPayroll(payroll);
        setIsApprovalModalOpen(true);
    };

    // Handle attendance modal
    const handleViewAttendance = (payroll) => {
        setSelectedPayroll(payroll);
        setShowAttendanceModal(true);
    };

    // Format numbers
    const numberFormat = (number) => {
        return parseFloat(number).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Format time
    const formatTime = (timeStr) => {
        if (timeStr === "N/A" || !timeStr) return "N/A";
        const [datePart, timePart] = timeStr.split(" ");
        const [hours, minutes, seconds] = timePart.split(":");
        const period = parseInt(hours, 10) >= 12 ? "PM" : "AM";
        const adjustedHours = parseInt(hours, 10) % 12 || 12;
        return `${adjustedHours}:${minutes} ${period}`;
    };

    // Format date
    const formatDate = (dateStr) => {
        if (dateStr === "N/A" || !dateStr) return "N/A";
        const [year, month, day] = dateStr.split("-");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    };

    // Filter attendances based on payroll cut-off and remove overlapped absent with leaves
    const filteredAttendances = useMemo(() => {
        if (!selectedPayroll) return [];
        const startDate = dayjs(selectedPayroll.pay_period_start).format(
            "YYYY-MM-DD"
        );
        const endDate = dayjs(selectedPayroll.pay_period_end).format(
            "YYYY-MM-DD"
        );

        const employeeId = selectedPayroll.employee_id;

        // Get leave days for the employee within the payroll period
        const leaveDays = new Set(
            (leaves || [])
                .filter(
                    (l) =>
                        l.employee?.id === employeeId &&
                        l.status === "approved" &&
                        l.start_date <= endDate &&
                        l.end_date >= startDate
                )
                .flatMap((leave) => {
                    const startDay = parseInt(
                        leave.start_date.split("-")[2],
                        10
                    );
                    const endDay = parseInt(leave.end_date.split("-")[2], 10);
                    const startMonth = parseInt(
                        leave.start_date.split("-")[1],
                        10
                    );
                    const endMonth = parseInt(leave.end_date.split("-")[1], 10);
                    const startYear = parseInt(
                        leave.start_date.split("-")[0],
                        10
                    );
                    const days = [];
                    for (let day = startDay; day <= endDay; day++) {
                        const currentDate = `${startYear}-${startMonth
                            .toString()
                            .padStart(2, "0")}-${day
                            .toString()
                            .padStart(2, "0")}`;
                        if (
                            currentDate >= startDate &&
                            currentDate <= endDate
                        ) {
                            days.push(day);
                        }
                    }
                    return days;
                })
        );

        // Filter attendances, excluding days with leaves
        return attendances
            .filter((a) => {
                const attendanceDate = a.date;
                const day = parseInt(attendanceDate.split("-")[2], 10);
                return (
                    attendanceDate >= startDate &&
                    attendanceDate <= endDate &&
                    a.employee_id === employeeId &&
                    !leaveDays.has(day)
                );
            })
            .map((record) => ({
                ...record,
                day: parseInt(record.date.split("-")[2], 10),
            }));
    }, [selectedPayroll, attendances, leaves]);

    // Use attendance status hook with effect to update on payroll change
    const { getAttendanceStatus } = useAttendanceStatus({
        attendances,
        schedules,
        holidays,
        selectedYear: selectedPayroll?.pay_period_end
            ? parseInt(selectedPayroll.pay_period_end.split("-")[0], 10)
            : new Date().getFullYear(),
        selectedMonth: selectedPayroll?.pay_period_end
            ? parseInt(selectedPayroll.pay_period_end.split("-")[1], 10)
            : new Date().getMonth() + 1,
    });

    const handleDelete = (data, status) => {
        Swal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert this action!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "bg-white shadow-lg rounded-lg p-4",
                confirmButton:
                    "btn btn-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500",
                cancelButton:
                    "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
            },
            buttonsStyling: true,
            didOpen: () => {
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) {
                    swalContainer.style.zIndex = "9999";
                }
            },
        }).then((result) => {
            if (status !== "pending") {
                return toast.error("Payroll is not pending for deletion.");
            }
            if (result.isConfirmed) {
                router.delete(route("payroll.destroy", data.id), {
                    onSuccess: () => toast.success("Payroll deleted!"),
                    onError: () => toast.error("Failed to delete payroll."),
                });
            }
        });
    };

    const columns = [
        {
            header: "#",
            render: (row, index) => index + 1,
            sortable: false,
            width: "60px",
        },
        {
            header: "Employee",
            render: (row) =>
                `${row.employee?.first_name || "-"} ${
                    row.employee?.last_name || ""
                }`,
            selector: (row) =>
                `${row.employee?.last_name || ""}, ${
                    row.employee?.first_name || ""
                }`,
            sortable: true,
        },
        {
            header: "Department",
            render: (row) => row?.employee?.department?.name || "-",
            selector: (row) => row?.employee?.department?.name || "",
            sortable: true,
        },
        {
            header: "Location",
            render: (row) => row?.site?.name || "-",
            selector: (row) => row?.site?.name || "",
            sortable: true,
        },
        {
            header: "Pay Period",
            render: (row) =>
                `${dayjs(row.pay_period_start).format("YYYY-MM-DD")} - ${dayjs(
                    row.pay_period_end
                ).format("YYYY-MM-DD")}`,
            selector: (row) => row.pay_period_start,
            sortable: true,
        },
        {
            header: "Base",
            render: (row) => numberFormat(row?.employee?.basic_salary) || "-",
            selector: (row) => row?.employee?.basic_salary || "",
            sortable: true,
        },
        {
            header: "OT",
            render: (row) => `${numberFormat(row.overtime_pay)}`,
            selector: (row) => row.overtime_pay,
            sortable: true,
        },
        {
            header: "Sat/Sun",
            render: (row) => `${numberFormat(row.weekend_pay)}`,
            selector: (row) => row.weekend_pay,
            sortable: true,
        },
        {
            header: "ABS / Late",
            render: (row) =>
                `${numberFormat(
                    parseFloat(row.late_deduction || 0) +
                        parseFloat(row.absences_deduction || 0)
                )}`,
            selector: (row) =>
                (row.late_deduction || 0) + (row.absences_deduction || 0),
            sortable: true,
        },
        {
            header: "SSS",
            render: (row) => `${numberFormat(row.sss_deduction)}`,
            selector: (row) => row.sss_deduction,
            sortable: true,
        },
        {
            header: "PhilHealth",
            render: (row) => `${numberFormat(row.philhealth_deduction)}`,
            selector: (row) => row.philhealth_deduction,
            sortable: true,
        },
        {
            header: "Pag-IBIG",
            render: (row) => `${numberFormat(row.pagibig_deduction)}`,
            selector: (row) => row.pagibig_deduction,
            sortable: true,
        },
        {
            header: "Withholding Tax",
            render: (row) => `${numberFormat(row.withholding_tax)}`,
            selector: (row) => row.withholding_tax,
            sortable: true,
        },
        {
            header: "Gross Pay",
            render: (row) => `${numberFormat(row.gross_pay)}`,
            selector: (row) => row.gross_pay,
            sortable: true,
        },
        {
            header: "Net Pay",
            render: (row) => `${numberFormat(row.net_pay)}`,
            selector: (row) => row.net_pay,
            sortable: true,
        },
        {
            header: "Actions",
            render: (row) => (
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        color="red"
                        onClick={() => handleViewDetails(row)}
                        // className="mr-2"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        color="gray"
                        size="sm"
                        onClick={() => handleViewAttendance(row)}
                        // className="ml-2"
                    >
                        <FontAwesomeIcon icon={faCalendarAlt} />
                    </Button>
                    {row.status.toLowerCase() === "pending" && (
                        <Button
                            color="gray"
                            size="sm"
                            onClick={() =>
                                handleDelete(row, row.status.toLowerCase())
                            }
                            className="hover:!bg-red-700"
                        >
                            <FontAwesomeIcon icon={faTrashAlt} />
                        </Button>
                    )}
                </div>
            ),
            sortable: false,
            width: "180px",
        },
    ];

    const filterOptions = {
        pay_schedule: [
            { value: "weekly", label: "Weekly" },
            { value: "semi-monthly", label: "Semi-Monthly" },
        ],
        "employee.site.id": sites.map((site) => ({
            value: site.id.toString(),
            label: site.name,
        })),
        pay_period: Array.from(
            new Set(
                payrolls.map(
                    (payroll) =>
                        `${dayjs(payroll.pay_period_start).format(
                            "YYYY-MM-DD"
                        )} - ${dayjs(payroll.pay_period_end).format(
                            "YYYY-MM-DD"
                        )}`
                )
            )
        ).map((period) => {
            const [start_date, end_date] = period.split(" - ");
            return {
                value: start_date,
                label: period,
            };
        }),
    };

    // Filter employees based on selected pay schedule type
    const filteredEmployees = useMemo(() => {
        return employees.filter(
            (emp) =>
                emp.pay_schedule?.toLowerCase() ===
                formData.pay_schedule_type?.toLowerCase()
        );
    }, [employees, formData.pay_schedule_type]);

    return (
        <DashboardLayout>
            <Head title="Payroll" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Payroll Generation
                </h3>
                <BreadCrumbs />
            </div>
            <div className="">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setShowGenerateModal(true);
                    }}
                    className="mb-6 flex gap-4 flex-wrap"
                >
                    <div className="flex-1 min-w-[200px]">
                        <Select
                            name="pay_schedule_type"
                            value={formData.pay_schedule_type}
                            onChange={handleFilterChange}
                            required
                        >
                            <option value="weekly">Weekly</option>
                            <option value="semi-monthly">Semi-Monthly</option>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Select
                            name="site"
                            value={formData.site}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Locations</option>
                            {sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <TextInput
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleFilterChange}
                            required
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <TextInput
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleFilterChange}
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            type="submit"
                            color="primary"
                            className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                        >
                            Generate Payroll
                        </Button>
                    </div>
                </form>

                <PayrollTableComponent
                    columns={columns}
                    data={payrolls}
                    searchFields={[
                        "employee.first_name",
                        "employee.last_name",
                        "employee.employee_id",
                    ]}
                    filterField={[
                        "pay_schedule",
                        "employee.site.id",
                        "pay_period",
                    ]}
                    filterOptions={filterOptions}
                    attendances={attendances}
                    schedules={schedules}
                    holidays={holidays}
                    handleViewDetails={handleViewDetails}
                    handleViewAttendance={handleViewAttendance}
                />

                {selectedPayroll && (
                    <PayrollApprovalModal
                        selectedEmployee={selectedPayroll}
                        isOpen={isApprovalModalOpen}
                        onClose={() => setIsApprovalModalOpen(false)}
                    />
                )}

                <Modal
                    show={showAttendanceModal}
                    onClose={() => setShowAttendanceModal(false)}
                    popup
                    size="2xl"
                >
                    <ModalHeader />
                    <ModalBody>
                        <h1 className="font-semibold text-xl">
                            Employee Name:{" "}
                            {selectedPayroll?.employee?.first_name}{" "}
                            {selectedPayroll?.employee?.middle_name}{" "}
                            {selectedPayroll?.employee?.last_name}
                        </h1>
                        <h3 className="text-sm text-gray-900 dark:text-white mb-4">
                            Payroll Period:{" "}
                            {dayjs(selectedPayroll?.pay_period_start).format(
                                "YYYY-MM-DD"
                            )}{" "}
                            to{" "}
                            {dayjs(selectedPayroll?.pay_period_end).format(
                                "YYYY-MM-DD"
                            )}
                        </h3>
                        <DataTable
                            columns={[
                                {
                                    name: "Day",
                                    selector: (row) =>
                                        parseInt(row.date.split("-")[2], 10),
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
                                    selector: (row) =>
                                        formatTime(row.punch_in) || "N/A",
                                    sortable: true,
                                    width: "120px",
                                },
                                {
                                    name: "Punch Out",
                                    selector: (row) =>
                                        formatTime(row.punch_out) || "N/A",
                                    sortable: true,
                                    width: "120px",
                                },
                                {
                                    name: "Status",
                                    cell: (row) => (
                                        <div className="flex items-center gap-2">
                                            {row.type === "leave" ? (
                                                <FontAwesomeIcon
                                                    icon={
                                                        row.isPaid === 1
                                                            ? faCheck
                                                            : faTimes
                                                    }
                                                />
                                            ) : (
                                                getAttendanceStatus(
                                                    {
                                                        id: selectedPayroll.employee_id,
                                                    },
                                                    parseInt(
                                                        row.date.split("-")[2],
                                                        10
                                                    )
                                                ).icon
                                            )}
                                            <span>
                                                {row.type === "leave"
                                                    ? row.status
                                                    : getAttendanceStatus(
                                                          {
                                                              id: selectedPayroll.employee_id,
                                                          },
                                                          parseInt(
                                                              row.date.split(
                                                                  "-"
                                                              )[2],
                                                              10
                                                          )
                                                      ).status}
                                            </span>
                                            {row.type === "leave" && (
                                                <span className="ml-2 text-sm">
                                                    (
                                                    {row.isPaid === 1
                                                        ? "With Pay"
                                                        : "Without Pay"}
                                                    )
                                                </span>
                                            )}
                                        </div>
                                    ),
                                    sortable: true,
                                    width: "200px",
                                },
                            ]}
                            data={filteredAttendances}
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
                                                No Attendance or Leave Records
                                                Found for this Period
                                            </span>
                                        </p>
                                    </div>
                                </>
                            }
                            striped
                            responsive
                            highlightOnHover
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="gray"
                            onClick={() => setShowAttendanceModal(false)}
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>

                <Modal
                    show={showGenerateModal}
                    onClose={() => setShowGenerateModal(false)}
                    popup
                    size="lg"
                >
                    {/* Header */}
                    <ModalHeader className="border-b px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Generate Payroll
                        </h3>
                    </ModalHeader>

                    {/* Body */}
                    <ModalBody className="px-6 py-4">
                        {/* Generate All Option */}
                        <div className="mb-6">
                            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                <Checkbox
                                    checked={generateAll}
                                    onChange={(e) =>
                                        setGenerateAll(e.target.checked)
                                    }
                                />
                                <span>Generate for all employees</span>
                            </label>
                        </div>

                        {/* Individual Employee Selector */}
                        {!generateAll && (
                            <>
                                <h4 className="text-sm font-semibold text-gray-600 mb-2">
                                    Select Employees - (
                                    {formData.pay_schedule_type.toUpperCase()})
                                </h4>

                                {/* Search Input */}
                                <input
                                    type="text"
                                    value={searchEmployee}
                                    onChange={(e) =>
                                        setSearchEmployee(e.target.value)
                                    }
                                    placeholder="Search employee by name or ID..."
                                    className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />

                                <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 p-3 shadow-inner space-y-2">
                                    {filteredEmployees
                                        .filter((employee) => {
                                            const fullName =
                                                `${employee.first_name} ${employee.last_name}`.toLowerCase();
                                            const empId = employee.employee_id
                                                ?.toString()
                                                .toLowerCase();
                                            return (
                                                fullName.includes(
                                                    searchEmployee.toLowerCase()
                                                ) ||
                                                empId?.includes(
                                                    searchEmployee.toLowerCase()
                                                )
                                            );
                                        })
                                        .map((employee) => {
                                            const isSelected =
                                                selectedEmployees.includes(
                                                    employee.id
                                                );
                                            const fullName = `${employee.first_name} ${employee.last_name}`;

                                            return (
                                                <label
                                                    key={employee.id}
                                                    className="flex items-center gap-3 text-sm text-gray-800 hover:bg-gray-50 px-2 py-1 rounded-md transition cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            handleEmployeeSelect(
                                                                employee.id
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        {fullName}{" "}
                                                        <span className="text-xs font-light">
                                                            (
                                                            {
                                                                employee.employee_id
                                                            }
                                                            )
                                                        </span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    {filteredEmployees.length === 0 && (
                                        <p className="text-sm text-gray-500 italic">
                                            No employees found.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </ModalBody>

                    {/* Footer */}
                    <ModalFooter className="border-t px-6 py-4 flex justify-end space-x-2">
                        <Button
                            onClick={handleGeneratePayroll}
                            className="bg-red-700 hover:bg-red-800 text-white font-medium px-5 py-2 rounded-lg shadow-sm transition"
                        >
                            Generate Payroll
                        </Button>
                        <Button
                            color="gray"
                            onClick={() => {
                                setShowGenerateModal(false);
                                setGenerateAll(false);
                                setSelectedEmployees([]);
                            }}
                            className="px-5 py-2 font-medium rounded-lg shadow-sm transition"
                        >
                            Cancel
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default PayrollComponent;
