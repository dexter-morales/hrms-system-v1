import { useState } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { Button } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrashAlt,
    faCheck,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import TableComponent from "@/Components/TableComponent";
import NewOvertimeModal from "@/Components/attendance/NewOvertimeModal";
import UpdateOvertimeModal from "@/Components/attendance/UpdateOvertimeModal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";

// Constants for table columns
const columns = [
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
        selector: (row) => row.status ?? "-",
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
        selector: (row) => row.approved_by ?? "-",
        cell: (row) => {
            let statusClass =
                "px-2 py-1 rounded text-sm font-medium flex items-center";
            let content = row.approved_by ? (
                <>
                    <FontAwesomeIcon
                        icon={faCheck}
                        className="text-green-500 mr-1"
                    />
                    {row.approved_by}
                </>
            ) : (
                <FontAwesomeIcon icon={faTimes} className="text-red-500" />
            );
            statusClass += row.approved_by
                ? " bg-green-100 text-green-800"
                : " bg-red-100 text-red-800";
            if (row.status === "Pending" && !row.approved_by) {
                statusClass =
                    "px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center";
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

// Constants for filter options
const filterOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
];

// SweetAlert styling configuration
const swalConfig = {
    popup: "bg-white shadow-lg rounded-lg p-4",
    confirmButton:
        "btn btn-lg bg-red-600 text-white hover:!bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500",
    cancelButton:
        "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
};

const EmployeeOvertime = () => {
    const { overtimes, employees, auth, flash, myOvertimes } = usePage().props;
    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState({
        show: false,
        overtime: null,
    });
    const [selectedOvertime, setSelectedOvertime] = useState(null);

    /**
     * Handle successful overtime actions (create/update).
     */
    const handleSuccess = () => {
        toast.success("Overtime action completed!");
    };

    /**
     * Open edit modal for an overtime record.
     * @param {Object} overtime - The overtime record to edit.
     */
    const handleEdit = (overtime) => {
        setOpenEditModal({ show: true, overtime });
    };

    /**
     * Delete an overtime record with confirmation.
     * @param {Object} overtime - The overtime record to delete.
     */
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
            customClass: swalConfig,
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
                    preserveScroll: true,
                    onSuccess: () => toast.success("Overtime deleted!"),
                    onError: () => toast.error("Failed to delete overtime."),
                });
            }
        });
    };

    /**
     * Handle approve or reject action for an overtime request.
     * @param {number} id - The overtime ID.
     * @param {string} status - The status ("Approved" or "Rejected").
     * @param {Object} row - The overtime record.
     */
    const handleAction = (id, status, row) => {
        const isApprove = status.toLowerCase() === "approved";
        const title = isApprove ? "Approve Overtime" : "Reject Overtime";
        const confirmText = isApprove ? "Yes, Approve it!" : "Reject it";

        Swal.fire({
            title,
            icon: "question",
            html: `
                <p>${title} for ${row?.employee?.first_name ?? "-"} ${
                row?.employee?.last_name ?? ""
            }</p>
                ${
                    isApprove
                        ? `
                        <div class="mt-4">
                            <label htmlFor="approved_hours" class="block text-sm font-medium text-gray-700">Approved Hours</label>
                            <input id="approved_hours" type="number" step="0.5" min="0.5" max="8" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value="${
                                row.requested_hours || ""
                            }" />
                        </div>
                        `
                        : ""
                }
                <div class="mt-4">
                    <label htmlFor="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea id="notes" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="4">${
                        row.notes || ""
                    }</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: "Cancel",
            customClass: swalConfig,
            buttonsStyling: true,
            didOpen: () => {
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) {
                    swalContainer.style.zIndex = "9999";
                }
                if (isApprove) {
                    const approvedHoursInput =
                        Swal.getHtmlContainer().querySelector(
                            "#approved_hours"
                        );
                    approvedHoursInput.addEventListener("input", (e) => {
                        let value = parseFloat(e.target.value) || 0;
                        if (value < 0.5) value = 0.5;
                        if (value > 8) value = 8;
                        e.target.value = value;
                    });
                }
            },
            preConfirm: () => {
                const notes = Swal.getHtmlContainer()
                    .querySelector("#notes")
                    .value.trim();
                if (!isApprove && !notes) {
                    Swal.showValidationMessage(
                        "Notes are required for rejection."
                    );
                    return false;
                }
                return {
                    approved_hours: isApprove
                        ? parseFloat(
                              Swal.getHtmlContainer().querySelector(
                                  "#approved_hours"
                              ).value
                          ) || row.requested_hours
                        : null,
                    notes: notes || null,
                };
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const { approved_hours, notes } = result.value;
                router.post(
                    route(
                        isApprove ? "overtimes.approve" : "overtimes.reject",
                        id
                    ),
                    {
                        status,
                        approved_hours: approved_hours || row.requested_hours,
                        requested_hours: row.requested_hours,
                        notes,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            if (flash.error) {
                                toast.error(flash.error);
                            } else {
                                toast.success(
                                    `Overtime ${status.toLowerCase()} successfully`
                                );
                            }
                        },
                        onError: () => {
                            toast.error(
                                `Failed to ${status.toLowerCase()} overtime.`
                            );
                        },
                    }
                );
            }
        });
    };

    /**
     * Render action buttons based on user role and overtime status.
     * @param {Object} row - The overtime record.
     * @returns {JSX.Element} Action buttons.
     */
    const renderActions = (row) => {
        const isOwnOvertime = auth.user.employee.id === row.employee.id;
        const isPending = row.status === "Pending" && row.approved_by === null;
        const isSuperAdmin = auth.user.roles[0].name === "SuperAdmin";
        const isHR = auth.user.roles[0].name === "HR";

        return (
            <>
                {isOwnOvertime && isPending && (
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
                {!isOwnOvertime && isPending && !isOwnOvertime && (
                    <>
                        <Button
                            color="red"
                            size="sm"
                            onClick={() => {
                                setSelectedOvertime(row);
                                handleAction(row.id, "Approved", row);
                            }}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                            color="gray"
                            size="sm"
                            onClick={() => {
                                setSelectedOvertime(row);
                                handleAction(row.id, "Rejected", row);
                            }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </>
                )}
                {/* {(isSuperAdmin || (isHR && isPending)) && !isOwnOvertime && (
                    <>
                        <Button
                            color="red"
                            size="sm"
                            onClick={() => {
                                setSelectedOvertime(row);
                                handleAction(row.id, "Approved", row);
                            }}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                            color="gray"
                            size="sm"
                            onClick={() => {
                                setSelectedOvertime(row);
                                handleAction(row.id, "Rejected", row);
                            }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </>
                )} */}
            </>
        );
    };

    return (
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
                    filterOptions={filterOptions}
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
                        filterOptions={filterOptions}
                        addButtonText=""
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
            )}
        </DashboardLayout>
    );
};

export default EmployeeOvertime;
