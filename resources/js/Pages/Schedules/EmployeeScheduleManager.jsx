import { useState, useMemo } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { Button, Label, Select, TextInput } from "flowbite-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import Swal from "sweetalert2";
import EditEmployeeScheduleModal from "@/Components/schedule/EditEmployeeScheduleModal";
import NewEmployeeScheduleModal from "@/Components/schedule/NewEmployeeScheduleModal";
// import NewEmployeeScheduleModal from "./NewEmployeeScheduleModal";
// import EditEmployeeScheduleModal from "./EditEmployeeScheduleModal";

const EmployeeScheduleManager = () => {
    const { employees, schedules, employees_no_schedule } = usePage().props;
    console.log("EmployeeScheduleManager props:", {
        employees,
        schedules,
        employees_no_schedule,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    const parseWorkingDays = (workingDays, scheduleId) => {
        if (typeof workingDays === "string") {
            try {
                const parsed = JSON.parse(workingDays);
                console.log(
                    `Parsed working_days for schedule ${scheduleId}:`,
                    parsed
                );
                return parsed;
            } catch (e) {
                console.error(
                    `Failed to parse working_days for schedule ${scheduleId}:`,
                    { workingDays, error: e.message }
                );
                return [];
            }
        }
        console.log(
            `Unparsed working_days for schedule ${scheduleId}:`,
            workingDays
        );
        return workingDays;
    };

    const handleModalOpen = (schedule = null) => {
        setIsEdit(!!schedule);
        setSelectedSchedule(schedule);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedSchedule(null);
        setIsEdit(false);
    };

    const handleDelete = (schedule) => {
        Swal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert this action for this schedule!`,
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
            if (result.isConfirmed) {
                router.delete(
                    route("schedules.employee.destroy", schedule.id),
                    {
                        onSuccess: () => toast.success("Schedule deleted!"),
                        onError: () =>
                            toast.error("Failed to delete schedule."),
                    }
                );
            }
        });
    };

    const filteredSchedules = useMemo(() => {
        return schedules.filter((schedule) => {
            const employee = employees.find(
                (e) => e.id === schedule.employee_id
            );
            const matchesSearch =
                searchTerm === "" ||
                (employee &&
                    (employee.first_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                        employee.last_name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())));
            const matchesType =
                typeFilter === "" || schedule.schedule_type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [schedules, employees, searchTerm, typeFilter]);

    const columns = [
        {
            name: "Employee",
            selector: (row) => row.employee_id,
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <img
                        src={
                            row.employee.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                row.employee.first_name +
                                    " " +
                                    row.employee.last_name
                            )}&background=random&color=fff`
                        }
                        alt={
                            row.employee.first_name +
                            " " +
                            row.employee.last_name
                        }
                        className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-col">
                        {row.employee.first_name + " " + row.employee.last_name}
                        <span className="text-xs" style={{ fontSize: "10px" }}>
                            {row.employee.employee_id}
                        </span>
                    </div>
                </div>
            ),
            width: "200px",
        },
        {
            name: "Schedule Type",
            selector: (row) => row.schedule_type,
            sortable: true,
            cell: (row) =>
                row.schedule_type.charAt(0).toUpperCase() +
                row.schedule_type.slice(1),
            width: "150px",
        },
        {
            name: "Working Days",
            selector: (row) => row.working_days,
            cell: (row) => {
                if (!row.working_days) {
                    console.log(`No working_days for schedule ${row.id}`);
                    return "-";
                }
                try {
                    let workingDays = parseWorkingDays(
                        row.working_days,
                        row.id
                    );
                    if (
                        row.schedule_type === "fixed" &&
                        Array.isArray(workingDays)
                    ) {
                        return workingDays
                            .map((day) => day.toUpperCase())
                            .join(", ");
                    } else if (
                        row.schedule_type === "flexible" &&
                        typeof workingDays === "object" &&
                        !Array.isArray(workingDays)
                    ) {
                        return Object.entries(workingDays)
                            .map(
                                ([day, times]) =>
                                    `${day.toUpperCase()}: ${times[0].slice(
                                        0,
                                        5
                                    )}-${times[1].slice(0, 5)}`
                            )
                            .join(", ");
                    }
                    throw new Error("Invalid working_days format");
                } catch (error) {
                    console.error(
                        `Error rendering working_days for schedule ${row.id}:`,
                        {
                            schedule_type: row.schedule_type,
                            working_days: row.working_days,
                            error: error.message,
                        }
                    );
                    return "-";
                }
            },
            width: "300px",
        },
        {
            name: "Times",
            selector: (row) => row.start_time,
            cell: (row) =>
                row.schedule_type === "fixed" && row.start_time && row.end_time
                    ? `${row.start_time.slice(0, 5)} - ${row.end_time.slice(
                          0,
                          5
                      )}`
                    : "-",
            width: "",
        },
        {
            name: "Effective From",
            selector: (row) =>
                row.effective_from
                    ? new Date(row.effective_from).toLocaleDateString()
                    : "",
            sortable: true,
            width: "",
        },
        {
            name: "Effective Until",
            selector: (row) =>
                row.effective_until
                    ? new Date(row.effective_until).toLocaleDateString()
                    : "",
            sortable: true,
            width: "",
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex gap-1">
                    <Button
                        size="xs"
                        color="red"
                        onClick={() => handleModalOpen(row)}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button
                        size="xs"
                        color="gray"
                        onClick={() => handleDelete(row)}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </Button>
                </div>
            ),
            width: "100px",
        },
    ];

    const customStyles = {
        table: {
            style: {
                width: "1200px",
                minWidth: "100%",
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
            },
        },
    };

    return (
        <DashboardLayout>
            <Head title="Employee Schedules" />
            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Employee Schedules
                </h3>
                <BreadCrumbs />
            </div>

            <div className="mx-auto space-y-3">
                <div className="mb-4 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="search" value="Search Employees" />
                        <TextInput
                            id="search"
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="type" value="Schedule Type" />
                        <Select
                            id="type"
                            value={typeFilter}
                            onChange={(event) =>
                                setTypeFilter(event.target.value)
                            }
                        >
                            <option value="">All Types</option>
                            <option value="fixed">Fixed</option>
                            <option value="flexible">Flexible</option>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                            size="md"
                            onClick={() => handleModalOpen()}
                        >
                            <span>
                                <FontAwesomeIcon icon={faPlus} /> Schedule
                            </span>
                        </Button>
                    </div>
                </div>
                <div className="relative overflow-x-auto max-w-full shadow-md">
                    <DataTable
                        columns={columns}
                        data={filteredSchedules}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 25, 50]}
                        customStyles={customStyles}
                        striped
                        responsive
                        fixedHeader
                        fixedHeaderScrollHeight="500px"
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
                                            No Schedules Records Found
                                        </span>
                                    </p>
                                </div>
                            </>
                        }
                    />
                </div>
                {/* <ToastContainer position="top-right" autoClose={3000} /> */}
                {isEdit ? (
                    <EditEmployeeScheduleModal
                        show={modalOpen}
                        onClose={handleModalClose}
                        selectedSchedule={selectedSchedule}
                        employeesNoSchedule={employees_no_schedule}
                    />
                ) : (
                    <NewEmployeeScheduleModal
                        show={modalOpen}
                        onClose={handleModalClose}
                        employeesNoSchedule={employees_no_schedule}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default EmployeeScheduleManager;
