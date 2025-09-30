import { useState, useMemo, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import {
    Modal,
    TextInput,
    Label,
    Select,
    Button,
    Checkbox,
    ModalHeader,
    ModalBody,
} from "flowbite-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrash,
    faPlus,
    faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import Swal from "sweetalert2";
import ReactSelectInput from "@/Components/ui/dropdown/ReactSelectInput";
// import ReactSelectInput from "../ui/dropdown/ReactSelectInput"; // Adjust path as needed

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
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split("T")[0]; // returns 'YYYY-MM-DD'
    };

    const [formData, setFormData] = useState({
        employee_id: "",
        schedule_type: "fixed",
        working_days: [],
        flexible_days: [
            { day: "mon", start: "", end: "" },
            { day: "tue", start: "", end: "" },
            { day: "wed", start: "", end: "" },
            { day: "thu", start: "", end: "" },
            { day: "fri", start: "", end: "" },
            { day: "sat", start: "", end: "" },
            { day: "sun", start: "", end: "" },
        ],
        start_time: "09:30",
        end_time: "18:30",
        effective_from: getTodayDate(), // ← Set to today's date
        effective_until: "",
    });
    const [errors, setErrors] = useState({});

    const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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
        if (schedule) {
            setIsEdit(true);
            setSelectedSchedule(schedule);
            const workingDays = parseWorkingDays(
                schedule.working_days,
                schedule.id
            );
            setFormData({
                employee_id: schedule.employee_id,
                schedule_type: schedule.schedule_type,
                working_days:
                    schedule.schedule_type === "fixed"
                        ? Array.isArray(workingDays)
                            ? workingDays
                            : []
                        : [],
                flexible_days:
                    schedule.schedule_type === "flexible"
                        ? daysOfWeek.map((day) => ({
                              day,
                              start: workingDays[day]?.[0] || "",
                              end: workingDays[day]?.[1] || "",
                          }))
                        : daysOfWeek.map((day) => ({
                              day,
                              start: "",
                              end: "",
                          })),
                start_time: (schedule.start_time || "09:00").slice(0, 5),
                end_time: (schedule.end_time || "17:00").slice(0, 5),
                effective_from:
                    new Date(schedule.effective_from)
                        .toISOString()
                        .split("T")[0] || "",
                effective_until: schedule.effective_until
                    ? new Date(schedule.effective_until)
                          .toISOString()
                          .split("T")[0]
                    : "",
            });
        } else {
            setIsEdit(false);
            setSelectedSchedule(null);
            setFormData({
                employee_id: "",
                schedule_type: "fixed",
                working_days: [],
                flexible_days: daysOfWeek.map((day) => ({
                    day,
                    start: "",
                    end: "",
                })),
                start_time: "09:00",
                end_time: "17:00",
                effective_from: "",
                effective_until: "",
            });
        }
        setErrors({});
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedSchedule(null);
        setIsEdit(false);
        setErrors({});
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleCheckboxChange = (event) => {
        const day = event.target.value;
        setFormData((previous) => ({
            ...previous,
            working_days: previous.working_days.includes(day)
                ? previous.working_days.filter((d) => d !== day)
                : [...previous.working_days, day],
        }));
        setErrors((prev) => ({ ...prev, working_days: "" }));
    };

    const handleFlexibleDayChange = (index, field, value) => {
        setFormData((previous) => {
            const newFlexibleDays = [...previous.flexible_days];
            newFlexibleDays[index][field] = value;
            return { ...previous, flexible_days: newFlexibleDays };
        });
        setErrors((prev) => ({ ...prev, flexible_days: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.employee_id)
            newErrors.employee_id = "Employee is required.";
        if (!formData.schedule_type)
            newErrors.schedule_type = "Schedule type is required.";
        if (!formData.effective_from)
            newErrors.effective_from = "Effective from is required.";

        if (formData.schedule_type === "fixed") {
            if (formData.working_days.length === 0)
                newErrors.working_days =
                    "At least one working day is required.";
            if (!formData.start_time)
                newErrors.start_time = "Start time is required.";
            if (!formData.end_time)
                newErrors.end_time = "End time is required.";
            if (formData.start_time && formData.end_time) {
                const start = new Date(
                    `1970-01-01T${formData.start_time}:00Z`
                ).getTime();
                const end = new Date(
                    `1970-01-01T${formData.end_time}:00Z`
                ).getTime();
                if (start >= end)
                    newErrors.end_time = "End time must be after start time.";
            }
        } else if (formData.schedule_type === "flexible") {
            const validFlexibleDays = formData.flexible_days.filter(
                (day) => day.start && day.end
            );
            if (validFlexibleDays.length === 0)
                newErrors.flexible_days =
                    "At least one flexible day with start and end time is required.";
            formData.flexible_days.forEach((day, index) => {
                if (day.start && day.end) {
                    const start = new Date(
                        `1970-01-01T${day.start}:00Z`
                    ).getTime();
                    const end = new Date(`1970-01-01T${day.end}:00Z`).getTime();
                    if (start >= end)
                        newErrors.flexible_days = `End time must be after start time for ${day.day.toUpperCase()}.`;
                }
            });
        }

        if (formData.effective_from) {
            const fromDate = new Date(formData.effective_from).getTime();
            if (isNaN(fromDate))
                newErrors.effective_from = "Invalid effective from date.";
            if (formData.effective_until) {
                const untilDate = new Date(formData.effective_until).getTime();
                if (isNaN(untilDate))
                    newErrors.effective_until = "Invalid effective until date.";
                if (fromDate > untilDate)
                    newErrors.effective_until =
                        "Effective until must be after effective from.";
            }
        }

        return newErrors;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            Object.values(validationErrors).forEach((error) =>
                toast.error(error)
            );
            return;
        }

        console.log("Submitting form:", formData);

        const data = {
            employee_id: formData.employee_id,
            schedule_type: formData.schedule_type,
            working_days:
                formData.schedule_type === "fixed"
                    ? formData.working_days
                    : null,
            flexible_days:
                formData.schedule_type === "flexible"
                    ? formData.flexible_days.filter((d) => d.start && d.end)
                    : null,
            start_time:
                formData.schedule_type === "fixed" ? formData.start_time : null,
            end_time:
                formData.schedule_type === "fixed" ? formData.end_time : null,
            effective_from: formData.effective_from,
            effective_until: formData.effective_until || null,
        };

        if (isEdit) {
            router.put(
                route("schedules.employee.update", selectedSchedule.id),
                data,
                {
                    onSuccess: (result) => {
                        toast.success("Schedule updated!");
                        console.log("Update result:", result);
                        handleModalClose();
                    },
                    onError: (errors) => {
                        console.error("Update errors:", errors);
                        toast.error("Failed to update schedule.");
                    },
                }
            );
        } else {
            router.post(route("schedules.employee.store"), data, {
                onSuccess: () => {
                    toast.success("Schedule created!");
                    handleModalClose();
                },
                onError: (errors) => {
                    console.error("Create errors:", errors);
                    toast.error("Failed to create schedule.");
                },
            });
        }
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
                <ToastContainer position="top-right" autoClose={3000} />

                <Modal show={modalOpen} onClose={handleModalClose}>
                    <ModalHeader>
                        {isEdit ? "Edit Schedule" : "Add Schedule"}
                    </ModalHeader>
                    <ModalBody>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="employee_id">
                                    Employee{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <ReactSelectInput
                                    name="employee_id"
                                    options={employees_no_schedule.map(
                                        (emp) => ({
                                            id: emp.id,
                                            name: `${emp.first_name} ${emp.last_name}`,
                                        })
                                    )}
                                    selected={
                                        formData.employee_id
                                            ? employees_no_schedule.find(
                                                  (emp) =>
                                                      emp.id.toString() ===
                                                      formData.employee_id.toString()
                                              )
                                            : null
                                    }
                                    onChange={(value) =>
                                        handleFormChange({
                                            target: {
                                                name: "employee_id",
                                                value: value,
                                            },
                                        })
                                    }
                                    placeholder="Select Employee"
                                    displayKey="name"
                                    valueKey="id"
                                    required
                                    error={errors.employee_id}
                                    className={
                                        errors.employee_id
                                            ? "border-red-500"
                                            : ""
                                    }
                                />
                                {errors.employee_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.employee_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="schedule_type">
                                    Schedule Type{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    id="schedule_type"
                                    name="schedule_type"
                                    value={formData.schedule_type}
                                    onChange={handleFormChange}
                                    required
                                    className={
                                        errors.schedule_type
                                            ? "border-red-500"
                                            : ""
                                    }
                                >
                                    <option value="fixed">Fixed</option>
                                    <option value="flexible">Flexible</option>
                                </Select>
                                {errors.schedule_type && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.schedule_type}
                                    </p>
                                )}
                            </div>
                            {formData.schedule_type === "fixed" ? (
                                <>
                                    <div>
                                        <Label htmlFor="working_days">
                                            Working Days{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            {daysOfWeek.map((day) => (
                                                <div
                                                    key={day}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Checkbox
                                                        id={day}
                                                        value={day}
                                                        checked={formData.working_days.includes(
                                                            day
                                                        )}
                                                        onChange={
                                                            handleCheckboxChange
                                                        }
                                                    />
                                                    <Label htmlFor={day}>
                                                        {day.toUpperCase()}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.working_days && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.working_days}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="start_time">
                                            Start Time{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <TextInput
                                            id="start_time"
                                            name="start_time"
                                            type="time"
                                            value={formData.start_time}
                                            onChange={handleFormChange}
                                            required
                                            // step="3600" // Removed to enable minutes
                                            className={
                                                errors.start_time
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        />
                                        {errors.start_time && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.start_time}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="end_time">
                                            End Time{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <TextInput
                                            id="end_time"
                                            name="end_time"
                                            type="time"
                                            value={formData.end_time}
                                            onChange={handleFormChange}
                                            required
                                            // step="3600" // Removed to enable minutes
                                            className={
                                                errors.end_time
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        />
                                        {errors.end_time && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.end_time}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <Label htmlFor="flexible_days">
                                        Flexible Days{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="space-y-2 mt-2">
                                        {formData.flexible_days.map(
                                            (day, index) => (
                                                <div
                                                    key={day.day}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Checkbox
                                                        id={`flex-${day.day}`}
                                                        checked={
                                                            !!(
                                                                day.start &&
                                                                day.end
                                                            )
                                                        }
                                                        onChange={(event) => {
                                                            if (
                                                                !event.target
                                                                    .checked
                                                            ) {
                                                                handleFlexibleDayChange(
                                                                    index,
                                                                    "start",
                                                                    ""
                                                                );
                                                                handleFlexibleDayChange(
                                                                    index,
                                                                    "end",
                                                                    ""
                                                                );
                                                            } else {
                                                                handleFlexibleDayChange(
                                                                    index,
                                                                    "start",
                                                                    "09:00"
                                                                );
                                                                handleFlexibleDayChange(
                                                                    index,
                                                                    "end",
                                                                    "18:30"
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Label
                                                        htmlFor={`flex-${day.day}`}
                                                        className="w-16"
                                                    >
                                                        {day.day.toUpperCase()}
                                                    </Label>
                                                    <TextInput
                                                        type="time"
                                                        value={day.start}
                                                        onChange={(event) =>
                                                            handleFlexibleDayChange(
                                                                index,
                                                                "start",
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        // step="3600" // Removed to enable minutes
                                                        className={
                                                            errors.flexible_days
                                                                ? "border-red-500"
                                                                : ""
                                                        }
                                                    />
                                                    <TextInput
                                                        type="time"
                                                        value={day.end}
                                                        onChange={(event) =>
                                                            handleFlexibleDayChange(
                                                                index,
                                                                "end",
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        // step="3600" // Removed to enable minutes
                                                        className={
                                                            errors.flexible_days
                                                                ? "border-red-500"
                                                                : ""
                                                        }
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                    {errors.flexible_days && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.flexible_days}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div>
                                <Label htmlFor="effective_from">
                                    Effective From{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <TextInput
                                    id="effective_from"
                                    name="effective_from"
                                    type="date"
                                    required
                                    value={formData.effective_from}
                                    onChange={handleFormChange}
                                    className={
                                        errors.effective_from
                                            ? "border-red-500"
                                            : ""
                                    }
                                />
                                {errors.effective_from && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.effective_from}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="effective_until">
                                    Effective Until
                                </Label>
                                <TextInput
                                    id="effective_until"
                                    name="effective_until"
                                    type="date"
                                    value={
                                        formData.effective_until
                                            ? formData.effective_until
                                            : ""
                                    }
                                    onChange={handleFormChange}
                                    className={
                                        errors.effective_until
                                            ? "border-red-500"
                                            : ""
                                    }
                                />
                                {errors.effective_until && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.effective_until}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button color="gray" onClick={handleModalClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" color="blue">
                                    {isEdit ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </ModalBody>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeScheduleManager;
