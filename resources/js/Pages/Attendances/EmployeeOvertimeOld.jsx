import { useState } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { Button } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrash,
    faCheck,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import TableComponent from "@/Components/TableComponent";
import NewOvertimeModal from "@/Components/attendance/NewOvertimeModal";
import UpdateOvertimeModal from "@/Components/attendance/UpdateOvertimeModal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const EmployeeOvertime = () => {
    const { overtimes, employees, auth, flash, myOvertimes } = usePage().props;
    console.log("usePage().props: ", usePage().props);

    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState({
        show: false,
        overtime: null,
    });
    const [selectedOvertime, setSelectedOvertime] = useState(null);

    const handleSuccess = () => {
        console.log("Overtime action completed!");
    };

    const handleEdit = (overtime) => {
        setOpenEditModal({ show: true, overtime });
    };

    const handleDelete = (overtime) => {
        Swal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert this action for this overtime record!`,
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
                router.delete(route("overtimes.destroy", overtime.id), {
                    onSuccess: () => console.log("Overtime deleted!"),
                    onError: () => console.error("Failed to delete overtime."),
                });
            }
        });
    };

    // const handleApprove = (overtime) => {
    //     router.post(
    //         route("overtimes.approve", overtime.id),
    //         {
    //             approved_hours: overtime.requested_hours,
    //             notes: overtime.notes,
    //         },
    //         {
    //             onSuccess: () => console.log("Overtime approved!"),
    //             onError: () => console.error("Failed to approve overtime."),
    //         }
    //     );
    // };

    const handleApprove = (id, status, row) => {
        Swal.fire({
            title: "Approve Overtime",
            icon: "question",
            html: `
            <p>Overtime for ${row?.employee.first_name} ${
                row?.employee.last_name
            }</p>
            <div class="mt-4">
                <label htmlFor="approved_hours" class="block text-sm font-medium text-gray-700">Approved Hours</label>
                <input id="approved_hours" type="number" step="0.5" min="0.5" max="8" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value="${
                    row.requested_hours || ""
                }" />
            </div>
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <p class="mt-1 text-sm text-gray-600">${row.notes || "-"}</p>
            </div>
        `,
            showCancelButton: true,
            confirmButtonText: "Yes, Approve it!",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "bg-white shadow-lg rounded-lg p-4",
                confirmButton:
                    "btn btn-lg bg-red-600 text-white hover:!bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500",
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
                const approvedHoursInput =
                    Swal.getHtmlContainer().querySelector("#approved_hours");
                approvedHoursInput.addEventListener("input", (e) => {
                    // Ensure value stays within bounds
                    let value = parseFloat(e.target.value) || 0;
                    if (value < 0.5) value = 0.5;
                    if (value > 8) value = 8;
                    e.target.value = value;
                });
            },
            preConfirm: () => {
                const approvedHoursInput =
                    Swal.getHtmlContainer().querySelector("#approved_hours");
                const approvedHours =
                    parseFloat(approvedHoursInput.value) || row.requested_hours;
                return { approved_hours: approvedHours, notes: row.notes };
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const { approved_hours, notes } = result.value;
                router.post(
                    route("overtimes.approve", row.id),
                    {
                        status: status,
                        approved_hours: approved_hours || row.requested_hours,
                        requested_hours: row.requested_hours,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            if (flash.error) {
                                toast.error(flash.error);
                            } else {
                                toast.success(
                                    `Overtime ${status} successfully`
                                );
                            }
                        },
                        onError: () => {
                            toast.error(`Failed to ${status} overtime.`);
                        },
                    }
                );
            }
        });
    };

    const handleApproveRejectManager = (id, status, row) => {
        Swal.fire({
            title: "Confirm Action",
            icon: "question",
            html: `
            <p>Approve Overtime for ${
                row?.employee.first_name + " " + row?.employee.last_name
            }?</p>
        `,
            showCancelButton: true,
            confirmButtonText:
                status?.toLowerCase() === "approved"
                    ? "Yes, Approve it!"
                    : "Reject it",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "bg-white shadow-lg rounded-lg p-4",
                confirmButton:
                    "btn btn-lg bg-red-600 text-white hover:!bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500",
                cancelButton:
                    "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
            },
            buttonsStyling: true, // set to false to rely entirely on customClass for button styling
            didOpen: () => {
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) {
                    swalContainer.style.zIndex = "9999";
                }
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route(
                        status?.toLowerCase() === "approved"
                            ? "overtimes.approve"
                            : "overtimes.reject",
                        row.id
                    ),
                    {
                        status: status,
                        requested_hours: row.requested_hours,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            if (flash.error) {
                                toast.error(flash.error);
                            } else {
                                toast.success(
                                    `Overtime ${status} successfully`
                                );
                            }
                        },
                        onError: () => {
                            toast.error(`Failed to ${status} overtime.`);
                        },
                    }
                );
            }
        });
    };

    const handleReject = (overtime) => {
        router.post(
            route("overtimes.reject", overtime.id),
            {
                notes: overtime.notes,
            },
            {
                onSuccess: () => console.log("Overtime rejected!"),
                onError: () => console.error("Failed to reject overtime."),
            }
        );
    };

    const columns = [
        // {
        //     name: "#",
        //     selector: (row, index) => index + 1,
        //     sortable: false,
        //     width: "60px",
        // },
        {
            name: "#",
            render: (row, index) => index + 1,
        },
        {
            name: "Employee",
            selector: (row) =>
                `${row.employee?.first_name ?? "-"} ${
                    row.employee?.last_name ?? ""
                }`.trim(),
            sortable: true,
        },
        {
            name: "Date",
            selector: (row) => {
                try {
                    return row.date
                        ? new Date(row.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                          })
                        : "-";
                } catch (e) {
                    return "-";
                }
            },
            sortable: true,
        },
        {
            name: "Requested Hours",
            selector: (row) => row.requested_hours ?? "-",
            sortable: true,
        },
        {
            name: "Approved Hours",
            selector: (row) => row.approved_hours ?? "-",
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => row.status ?? "-", // For sorting/filtering
            cell: (row) => {
                let statusClass = "px-2 py-1 rounded text-sm font-medium";
                if (row.status === "Pending") {
                    statusClass += " bg-yellow-100 text-yellow-800";
                } else if (row.status === "Approved") {
                    statusClass += " bg-green-100 text-green-800";
                } else if (row.status === "Rejected") {
                    statusClass += " bg-red-100 text-red-800";
                } else {
                    statusClass += " text-gray-600";
                }
                return <span className={statusClass}>{row.status || "-"}</span>;
            },
            sortable: true,
        },
        {
            name: "Supervisor Approval",
            selector: (row) => row.approved_by, // For sorting/filtering
            cell: (row) => {
                let statusClass =
                    "px-2 py-1 rounded text-sm font-medium flex items-center";
                let content = null;
                console.log("row.approved_byrow.approved_by: ", row);

                // Check approved_by and status
                if (
                    row.approved_by === null ||
                    row.approved_by === "" ||
                    row.approved_by === undefined
                ) {
                    content = (
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="text-red-500"
                        />
                    );
                    statusClass += " bg-red-100 text-red-800";
                } else {
                    content = (
                        <>
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 mr-1"
                            />
                            {row.approved_by}
                        </>
                    );
                    statusClass += " bg-green-100 text-green-800";
                }

                // Override status-based styling if approved_by is set
                if (row.status === "Pending" && row.approved_by === null) {
                    statusClass =
                        "px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center";
                } else if (
                    row.status === "rejected" &&
                    row.approved_by !== null
                ) {
                    statusClass =
                        "px-2 py-1 rounded text-sm font-medium bg-red-100 text-red-800 flex items-center";
                }

                return <span className={statusClass}>{content}</span>;
            },
            sortable: true,
        },
        {
            name: "Notes",
            selector: (row) => row.notes ?? "-",
            sortable: true,
        },
    ];

    const renderActions = (row) => (
        <>
            {auth.user.employee.id === row.employee.id &&
                row.approved_by === null && (
                    <>
                        <Button
                            size="xs"
                            color="red"
                            onClick={() => handleEdit(row)}
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
                    </>
                )}
            {auth.user.employee.id !== row.employee.id &&
            row.status === "Pending" &&
            row.approved_by === null ? (
                <>
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => {
                            setSelectedOvertime(row);
                            handleApproveRejectManager(row.id, "Approved", row); // Trigger SweetAlert directly
                        }}
                    >
                        <FontAwesomeIcon icon={faCheck} />
                    </Button>
                    <Button
                        color="blue"
                        size="sm"
                        onClick={() => {
                            setSelectedOvertime(row);
                            handleApproveRejectManager(row.id, "Rejected", row); // Trigger SweetAlert directly
                        }}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </Button>
                </>
            ) : (
                auth.user.roles[0].name === "SuperAdmin" ||
                (auth.user.roles[0].name === "HR" &&
                    row.status === "Pending" &&
                    auth.user.employee.id !== row.employee.id && (
                        <>
                            <Button
                                color="red"
                                size="sm"
                                onClick={() => {
                                    setSelectedOvertime(row);
                                    handleApprove(row.id, "Approved", row); // Trigger SweetAlert directly
                                }}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                                color="gray"
                                size="sm"
                                onClick={() => {
                                    setSelectedOvertime(row);
                                    handleApprove(row.id, "Rejected", row); // Trigger SweetAlert directly
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </>
                    ))
            )}

            {/* {row.status === "Pending" &&
                auth.user.roles[0].name !== "Employee" && (
                    <>
                        <Button
                            size="xs"
                            color="green"
                            onClick={() => handleApprove(row)}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                            size="xs"
                            color="red"
                            onClick={() => handleReject(row)}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </>
                )} */}
        </>
    );

    return (
        <>
            <DashboardLayout>
                <Head title="Overtime" />
                <div className="">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Employee Overtime
                    </h3>
                    <BreadCrumbs />
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-xl font-semibold">My Requests</h2>
                    <TableComponent
                        columns={columns}
                        data={myOvertimes}
                        modalComponent={NewOvertimeModal}
                        modalProps={{
                            onOpen: () => setOpenModal(true),
                            show: openModal,
                            onClose: () => setOpenModal(false),
                            onSuccess: handleSuccess,
                            employees,
                            auth,
                        }}
                        deleteModalComponent={null}
                        deleteModalProps={{}}
                        searchFields={[
                            "employee.first_name",
                            "employee.last_name",
                            "notes",
                        ]}
                        filterField="status"
                        filterOptions={[
                            { value: "Pending", label: "Pending" },
                            { value: "Approved", label: "Approved" },
                            { value: "Rejected", label: "Rejected" },
                        ]}
                        addButtonText="New Overtime"
                        renderActions={renderActions}
                    />

                    <UpdateOvertimeModal
                        show={openEditModal.show}
                        onClose={() =>
                            setOpenEditModal({ show: false, overtime: null })
                        }
                        onSuccess={handleSuccess}
                        overtime={openEditModal.overtime}
                        employees={employees}
                    />
                </div>
                {overtimes.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-xl font-semibold">Requests</h2>
                        <TableComponent
                            columns={columns}
                            data={overtimes}
                            modalComponent={NewOvertimeModal}
                            modalProps={{
                                onOpen: () => setOpenModal(true),
                                show: openModal,
                                onClose: () => setOpenModal(false),
                                onSuccess: handleSuccess,
                                employees,
                                auth,
                            }}
                            deleteModalComponent={null}
                            deleteModalProps={{}}
                            searchFields={[
                                "employee.first_name",
                                "employee.last_name",
                                "notes",
                            ]}
                            filterField="status"
                            filterOptions={[
                                { value: "Pending", label: "Pending" },
                                { value: "Approved", label: "Approved" },
                                { value: "Rejected", label: "Rejected" },
                            ]}
                            addButtonText=""
                            renderActions={renderActions}
                        />

                        <UpdateOvertimeModal
                            show={openEditModal.show}
                            onClose={() =>
                                setOpenEditModal({
                                    show: false,
                                    overtime: null,
                                })
                            }
                            onSuccess={handleSuccess}
                            overtime={openEditModal.overtime}
                            employees={employees}
                        />
                    </div>
                )}
            </DashboardLayout>
        </>
    );
};

export default EmployeeOvertime;
