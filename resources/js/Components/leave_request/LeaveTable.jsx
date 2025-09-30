import DataTable from "react-data-table-component";
import { Button } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { router } from "@inertiajs/react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const LeaveTable = ({ leaves, isManager, auth, setShowAttachment }) => {
    const handleApprove = (id, status, row) => {
        Swal.fire({
            title: "Confirm Action",
            html: `
                <p>Leave for ${row?.employee.name} from ${row?.start_date} to ${
                row?.end_date
            }</p>
                ${
                    row?.image
                        ? '<p>Supporting Image:</p><img src="/storage/leaves/' +
                          row.image +
                          '" alt="Supporting Document" class="max-w-xs mt-2" />'
                        : ""
                }
            `,
            icon: "question",
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
            buttonsStyling: true,
            didOpen: () => {
                if (row?.image) {
                    const img = Swal.getHtmlContainer().querySelector("img");
                    img.onerror = () => (img.style.display = "none");
                }
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) {
                    swalContainer.style.zIndex = "9999";
                }
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(
                    route("leave.update", id),
                    { status },
                    {
                        onSuccess: () => {
                            toast.success(`Leave ${status} successfully!`);
                        },
                        onError: (errors) => console.log(errors),
                    }
                );
            }
        });
    };

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: "#f3f4f6",
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
                paddingLeft: "16px !important",
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
            },
        },
    };

    const columns = [
        {
            name: "Employee",
            selector: (row) => row.employee.name,
            sortable: true,
        },
        {
            name: "Start Date",
            selector: (row) => row.start_date,
            sortable: true,
        },
        {
            name: "End Date",
            selector: (row) => row.end_date,
            sortable: true,
        },
        {
            name: "Leave Type",
            selector: (row) => row.leave_type,
            sortable: true,
        },
        {
            name: "Reason",
            selector: (row) => row.reason,
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => row.status,
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
                return <span className={statusClass}>{row.status}</span>;
            },
            sortable: true,
        },
        {
            name: "Supervisor Approval",
            selector: (row) => row.approved_by,
            cell: (row) => {
                let statusClass =
                    "px-2 py-1 rounded text-sm font-medium flex items-center";
                let content = null;

                if (
                    row.approved_by === null ||
                    row.approved_by === "" ||
                    row.approved_by === undefined
                ) {
                    content = (
                        <span>
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-red-500"
                            />{" "}
                            {row.rejected_by || "Pending"}
                        </span>
                    );
                    statusClass += " bg-red-100 text-red-800";
                } else {
                    content = (
                        <span>
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 mr-1"
                            />{" "}
                            {row.approved_by}
                        </span>
                    );
                    statusClass += " bg-green-100 text-green-800";
                }

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
            name: "Attachment",
            cell: (row) => (
                <div
                    className="cursor-pointer"
                    onClick={() => setShowAttachment(row.image ? row : null)}
                >
                    {row.image ? (
                        <img
                            src={`/storage/leaves/${row.image}`}
                            alt="Attachment"
                            className="w-10 h-10 object-cover rounded"
                        />
                    ) : (
                        <span>No Attachment</span>
                    )}
                </div>
            ),
        },
        // {
        //     name: "Attachment",
        //     cell: (row) => (
        //         <div
        //             className="cursor-pointer"
        //             onClick={() =>
        //                 row.image &&
        //                 window.dispatchEvent(
        //                     new CustomEvent("showAttachment", { detail: row })
        //                 )
        //             }
        //         >
        //             {row.image ? (
        //                 <img
        //                     src={`/storage/leaves/${row.image}`}
        //                     alt="Attachment"
        //                     className="w-10 h-10 object-cover rounded"
        //                 />
        //             ) : (
        //                 <span>No Attachment</span>
        //             )}
        //         </div>
        //     ),
        // },
        ...(isManager
            ? [
                  {
                      name: "Actions",
                      cell: (row) =>
                          auth.user.employee.employee_id ===
                              row.employee.manager_id &&
                          row.status === "Pending" &&
                          row.approved_by === null ? (
                              <div className="flex gap-1">
                                  <Button
                                      color="red"
                                      size="sm"
                                      onClick={() =>
                                          handleApprove(row.id, "Approved", row)
                                      }
                                  >
                                      <FontAwesomeIcon icon={faCheck} />
                                  </Button>
                                  <Button
                                      color="gray"
                                      size="sm"
                                      onClick={() =>
                                          handleApprove(row.id, "Rejected", row)
                                      }
                                  >
                                      <FontAwesomeIcon icon={faTimes} />
                                  </Button>
                              </div>
                          ) : (
                              <span></span>
                          ),
                  },
              ]
            : []),
    ];

    return (
        <DataTable
            columns={columns}
            data={leaves}
            pagination
            highlightOnHover
            customStyles={customStyles}
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
                    <p className="text-center mb-5 badge badge-error">
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                            No Leave Requests
                        </span>
                    </p>
                </div>
            }
        />
    );
};

export default LeaveTable;
