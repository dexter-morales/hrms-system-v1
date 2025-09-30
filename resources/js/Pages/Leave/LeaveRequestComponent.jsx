import React, { useState, useEffect, useCallback } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import {
    Button,
    TextInput,
    Select,
    Label,
    Badge,
    Modal,
    ModalHeader,
    ModalBody,
} from "flowbite-react";
import { router } from "@inertiajs/react";
import DataTable from "react-data-table-component";
import styled from "styled-components";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { toast } from "react-toastify";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDropzone } from "react-dropzone";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2"; // Import SweetAlert2

const LeaveRequestComponent = () => {
    const { auth, leaves, leave_types, leave_credits } = usePage().props;
    console.log("Leaves: ", usePage().props);
    console.log("auth.user.roles.name: ", auth.user.roles);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false); // Kept for reference, but replaced by SweetAlert
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // For request modal preview
    const [showAttachment, setShowAttachment] = useState(null); // For attachment viewer
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedIsPaid, setSelectedIsPaid] = useState(1); // State for is_paid value

    const { data, setData, post, processing, errors, reset } = useForm({
        start_date: "",
        end_date: "",
        leave_type: "",
        reason: "",
        status: "Pending",
        image: null,
        is_paid: true, // Default to "with pay"
    });

    useEffect(() => {
        if (!isRequestModalOpen) reset();
    }, [isRequestModalOpen, reset]);

    // const handleRequestSubmit = (e) => {
    //     e.preventDefault();
    //     const formData = new FormData();
    //     formData.append("start_date", data.start_date);
    //     formData.append("end_date", data.end_date);
    //     formData.append("leave_type", data.leave_type);
    //     formData.append("reason", data.reason);
    //     formData.append("status", data.status);
    //     formData.append("is_paid", data.is_paid); // Add is_paid to form data
    //     if (data.image) {
    //         formData.append("image", data.image);
    //     }
    //     setIsProcessing(true);
    //     router.post(route("leave.store"), formData, {
    //         onSuccess: () => {
    //             toast.success("Leave request submitted successfully!");
    //             setIsProcessing(false);
    //             reset();
    //             setIsRequestModalOpen(false);
    //             setPreviewImage(null);
    //         },
    //         onError: (errors) => {
    //             console.log(errors);
    //             setIsProcessing(false);
    //         },
    //         forceFormData: true,
    //     });
    // };

    const handleRequestSubmit = (e) => {
        e.preventDefault();

        // Simple validation
        const missingFields = [];
        if (!data.start_date) missingFields.push("Start Date");
        if (!data.end_date) missingFields.push("End Date");
        if (!data.leave_type) missingFields.push("Leave Type");
        if (!data.reason) missingFields.push("Reason");
        if (!data.image) missingFields.push("Attachment");

        if (missingFields.length > 0) {
            toast.error(
                `Please fill in the following: ${missingFields.join(", ")}`
            );
            return;
        }

        const formData = new FormData();
        formData.append("start_date", data.start_date);
        formData.append("end_date", data.end_date);
        formData.append("leave_type", data.leave_type);
        formData.append("reason", data.reason);
        formData.append("status", data.status);
        formData.append("is_paid", data.is_paid);
        formData.append("image", data.image);

        setIsProcessing(true);
        router.post(route("leave.store"), formData, {
            onSuccess: () => {
                toast.success("Leave request submitted successfully!");
                setIsProcessing(false);
                reset();
                setIsRequestModalOpen(false);
                setPreviewImage(null);
            },
            onError: (errors) => {
                console.log(errors);
                setIsProcessing(false);
            },
            forceFormData: true,
        });
    };

    const handleApprove = (id, status, row) => {
        Swal.fire({
            title: "Confirm Action",
            html:
                status?.toLowerCase() === "approved"
                    ? `
            <div class="flex flex-col gap-1">
                <p class="mb-4">Leave for ${row?.employee.name} from ${row?.start_date} to ${row?.end_date}</p>
                <div class="mt-0">
                    <label for="is_paid" class="block text-sm font-medium text-gray-700">Pay Status</label>
                    <select id="is_paid" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        <option value="1">With Pay</option>
                        <option value="0">Without Pay</option>
                    </select>
                </div>
            </div>
        `
                    : `
            <div class="flex flex-col gap-1">
                <p class="mb-4">Leave for ${row?.employee.name} from ${row?.start_date} to ${row?.end_date}</p>
            </div>
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
                    "bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500",
            },
            buttonsStyling: true,
            didOpen: () => {
                if (status?.toLowerCase() === "approved") {
                    const select =
                        Swal.getHtmlContainer().querySelector("#is_paid");
                    if (select) {
                        // Default value to "1" (with pay); change this if needed
                        select.value = "1";
                        select.addEventListener("change", (e) => {
                            console.log("Selected value:", e.target.value);
                        });
                    }
                }
            },
            preConfirm: () => {
                if (status?.toLowerCase() === "approved") {
                    const select =
                        Swal.getHtmlContainer().querySelector("#is_paid");
                    return {
                        is_paid: select?.value ?? "0",
                    };
                }
                return { is_paid: "0" }; // Default to 0 for rejections
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const isPaid = result.value?.is_paid ?? "0";
                router.put(
                    route("leave.update", id),
                    {
                        status,
                        is_paid: isPaid,
                    },
                    {
                        onSuccess: () => {
                            toast.success(`Leave ${status} successfully!`);
                            setSelectedLeave(null);
                        },
                        onError: (errors) => console.log(errors),
                    }
                );
            }
        });
    };

    const [filterText, setFilterText] = useState("");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const filteredLeaves = leaves
        .filter((leave) =>
            auth.user.role === "manager"
                ? leave.employee.manager_id === auth.user.id
                : auth.user.role === "employee"
                ? leave.employee.id === auth.user.id
                : true
        )
        .filter(
            (leave) =>
                (leave.employee.name
                    .toLowerCase()
                    .includes(filterText.toLowerCase()) ||
                    leave.employee.id
                        .toString()
                        .includes(filterText.toLowerCase())) &&
                (leaveTypeFilter === "" ||
                    leave.leave_type === leaveTypeFilter) &&
                (statusFilter === "" || leave.status === statusFilter)
        );

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
            selector: (row) => row.status, // For sorting/filtering
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
            selector: (row) => row.approved_by, // For sorting/filtering
            cell: (row) => {
                let statusClass =
                    "px-2 py-1 rounded text-sm font-medium flex items-center";
                let content = null;

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
        {
            name: "Actions",
            cell: (row) =>
                auth.user.employee.id !== row.employee.id &&
                row.status === "Pending" &&
                row.approved_by === null ? (
                    <div className="flex gap-1">
                        <Button
                            color="red"
                            size="sm"
                            onClick={() => {
                                setSelectedLeave(row);
                                handleApprove(row.id, "Approved", row); // Trigger SweetAlert directly
                            }}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                            color="gray"
                            size="sm"
                            onClick={() => {
                                setSelectedLeave(row);
                                handleApprove(row.id, "Rejected", row); // Trigger SweetAlert directly
                            }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </div>
                ) : (
                    auth.user.roles[0].name === "SuperAdmin" ||
                    (auth.user.roles[0].name === "HR" &&
                        row.status === "Pending" && (
                            <div className="flex gap-1">
                                <Button
                                    color="red"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedLeave(row);
                                        handleApprove(row.id, "Approved", row); // Trigger SweetAlert directly
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                </Button>
                                <Button
                                    color="gray"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedLeave(row);
                                        handleApprove(row.id, "Rejected", row); // Trigger SweetAlert directly
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </Button>
                            </div>
                        ))
                ),
        },
    ];

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
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
            },
        },
    };

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setData("image", file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewImage(e.target.result);
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [],
            "image/png": [],
        },
        maxFiles: 1,
    });

    return (
        <DashboardLayout>
            <Head title="Payroll" />

            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Employee Leave
                </h3>
                <BreadCrumbs />
            </div>
            <div className="">
                {/* Filter Section */}
                <div className="mb-4 flex justify-between items-center">
                    <div className="flex gap-4 w-2/3">
                        <TextInput
                            placeholder="Search Name or Emp ID"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-1/3"
                        />
                        <Select
                            value={leaveTypeFilter}
                            onChange={(e) => setLeaveTypeFilter(e.target.value)}
                            className="w-1/6"
                        >
                            <option value="">All Leave Types</option>
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick</option>
                            <option value="personal">Personal</option>
                        </Select>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-1/6"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </Select>
                    </div>
                    <div>
                        <Button
                            color="blue"
                            onClick={() => setIsRequestModalOpen(true)}
                            className="bg-red-700 hover:bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                        >
                            <span>
                                <FontAwesomeIcon icon={faPlus} /> Request Leave
                            </span>
                        </Button>
                    </div>
                </div>

                <Modal
                    show={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                >
                    <ModalHeader>Request Leave</ModalHeader>
                    <ModalBody>
                        <form
                            onSubmit={handleRequestSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="start_date">
                                    Start Date{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <TextInput
                                    id="start_date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData("start_date", e.target.value)
                                    }
                                    required
                                />
                                {errors.start_date && (
                                    <p className="text-red-500 text-sm">
                                        {errors.start_date}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="end_date">
                                    End Date{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <TextInput
                                    id="end_date"
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) =>
                                        setData("end_date", e.target.value)
                                    }
                                    required
                                />
                                {errors.end_date && (
                                    <p className="text-red-500 text-sm">
                                        {errors.end_date}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="leave_type">
                                    Leave Type{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    id="leave_type"
                                    value={data.leave_type}
                                    onChange={(e) => {
                                        setData("leave_type", e.target.value);
                                    }}
                                    required
                                >
                                    <option value="">Select...</option>
                                    {leave_credits.map(
                                        (leave_credit, index) => (
                                            <option
                                                key={index}
                                                value={
                                                    leave_credit.leave_type.name
                                                }
                                            >
                                                {leave_credit.leave_type.name}{" "}
                                                Leave{" "}
                                                <span>
                                                    ({leave_credit.credits})
                                                </span>
                                            </option>
                                        )
                                    )}
                                </Select>
                                {errors.leave_type && (
                                    <p className="text-red-500 text-sm">
                                        {errors.leave_type}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="reason">
                                    Reason{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <TextInput
                                    id="reason"
                                    type="text"
                                    value={data.reason}
                                    onChange={(e) =>
                                        setData("reason", e.target.value)
                                    }
                                />
                                {errors.reason && (
                                    <p className="text-red-500 text-sm">
                                        {errors.reason}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>
                                    Supporting Image{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed p-4 text-center rounded ${
                                        isDragActive
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="max-w-xs mt-2 mx-auto"
                                        />
                                    ) : isDragActive ? (
                                        <p>Drop the image here...</p>
                                    ) : (
                                        <p>
                                            Drag and drop an image here, or
                                            click to select
                                        </p>
                                    )}
                                </div>
                                {errors.image && (
                                    <p className="text-red-500 text-sm">
                                        {errors.image}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                color="blue"
                            >
                                {isProcessing && (
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        spin
                                        className="mr-2"
                                    />
                                )}
                                Submit Request
                            </Button>
                        </form>
                    </ModalBody>
                </Modal>

                {/* Attachment Viewer */}
                {showAttachment && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        onClick={() => setShowAttachment(null)}
                    >
                        <div
                            className="bg-white p-4 rounded-lg max-w-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={`/storage/leaves/${showAttachment.image}`}
                                alt="Attachment"
                                className="max-w-full max-h-[80vh] object-contain"
                            />
                            <Button
                                color="gray"
                                className="mt-4"
                                onClick={() => setShowAttachment(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={filteredLeaves}
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
                            <p className="text-center mb-5 badge badge-error ">
                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                                    No Leave Requests
                                </span>
                            </p>
                        </div>
                    }
                />
            </div>
        </DashboardLayout>
    );
};

export default LeaveRequestComponent;
