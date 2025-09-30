import React, { useState, useEffect, useCallback } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import {
    Button,
    TextInput,
    Select,
    Label,
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
import { useDropzone } from "react-dropzone"; // Ensure this is imported
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2"; // Import SweetAlert2
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const BusinessTravelRequestComponent = () => {
    const { auth, businessTravels, myBusinessTravels } = usePage().props;
    console.log("Business Travels: ", usePage().props);
    console.log("auth.user.roles.name: ", auth.user.roles);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedBusinessTravel, setSelectedBusinessTravel] = useState(null);
    const [previewDocument, setPreviewDocument] = useState(null); // For request modal preview
    const [showAttachment, setShowAttachment] = useState(null); // For attachment viewer
    const [isProcessing, setIsProcessing] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        date_from: "",
        date_to: "",
        time_from: "",
        time_to: "",
        location: "",
        reason: "",
        attach_supporting_document: null,
        status: "Pending",
    });

    // Setup useDropzone for file upload
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setData("attach_supporting_document", file);
            const previewUrl = URL.createObjectURL(file);
            setPreviewDocument(previewUrl);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "application/msword": [".doc"],
            "application/pdf": [".pdf"],
        },
        maxFiles: 1,
        maxSize: 2 * 1024 * 1024, // 2MB limit
    });

    useEffect(() => {
        if (!isRequestModalOpen) {
            reset();
            setPreviewDocument(null);
        }
    }, [isRequestModalOpen, reset]);

    const handleRequestSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("date_from", data.date_from);
        formData.append("date_to", data.date_to);
        formData.append("time_from", data.time_from);
        formData.append("time_to", data.time_to);
        formData.append("location", data.location);
        formData.append("reason", data.reason);
        if (data.attach_supporting_document) {
            formData.append(
                "attach_supporting_document",
                data.attach_supporting_document
            );
        }
        formData.append("status", data.status);
        setIsProcessing(true);
        router.post(route("business-travel.store"), formData, {
            onSuccess: () => {
                toast.success(
                    "Business Travel request submitted successfully!"
                );
                setIsProcessing(false);
                reset();
                setIsRequestModalOpen(false);
                setPreviewDocument(null);
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
            html: `
            <div class="flex flex-col gap-1">
                <p class="mb-4">Business Travel for ${
                    row?.employee.first_name + " " + row?.employee.last_name
                }</p>
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
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) {
                    swalContainer.style.zIndex = "9999";
                }
            },
            preConfirm: () => {
                return {}; // No additional data needed for approval
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(
                    route("business-travel.update", id),
                    {
                        status,
                    },
                    {
                        onSuccess: () => {
                            toast.success(
                                `Business Travel ${status} successfully!`
                            );
                            setSelectedBusinessTravel(null); // Reset selected business travel
                        },
                        onError: (errors) => console.log(errors),
                    }
                );
            }
        });
    };

    const [filterText, setFilterText] = useState("");
    const [myFilterText, setMyFilterText] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [statusMyFilter, setStatusMyFilter] = useState("");

    const filteredMyBusinessTravels = myBusinessTravels
        .filter((businessTravel) =>
            auth.user.role === "manager"
                ? businessTravel.employee.manager_id === auth.user.id
                : auth.user.role === "employee"
                ? businessTravel.employee.id === auth.user.id
                : true
        )
        .filter(
            (businessTravel) =>
                (businessTravel.employee.first_name
                    .toLowerCase()
                    .includes(myFilterText.toLowerCase()) ||
                    businessTravel.employee.last_name
                        .toLowerCase()
                        .includes(myFilterText.toLowerCase()) ||
                    businessTravel.employee.id
                        .toString()
                        .includes(myFilterText.toLowerCase())) &&
                (statusMyFilter === "" ||
                    businessTravel.status === statusMyFilter)
        );

    const filteredBusinessTravels = businessTravels
        .filter((businessTravel) =>
            auth.user.role === "manager"
                ? businessTravel.employee.manager_id === auth.user.id
                : auth.user.role === "employee"
                ? businessTravel.employee.id === auth.user.id
                : true
        )
        .filter(
            (businessTravel) =>
                (businessTravel.employee.first_name
                    .toLowerCase()
                    .includes(filterText.toLowerCase()) ||
                    businessTravel.employee.last_name
                        .toLowerCase()
                        .includes(filterText.toLowerCase()) ||
                    businessTravel.employee.id
                        .toString()
                        .includes(filterText.toLowerCase())) &&
                (statusFilter === "" || businessTravel.status === statusFilter)
        );

    const columns = [
        {
            name: "Employee",
            selector: (row) =>
                `${row.employee?.first_name ?? ""} ${
                    row.employee?.last_name ?? ""
                }`.trim(),
            sortable: true,
        },
        {
            name: "Date From",
            selector: (row) => row.date_from || "-",
            sortable: true,
        },
        {
            name: "Date To",
            selector: (row) => row.date_to || "-",
            sortable: true,
        },
        {
            name: "Time From",
            selector: (row) => row.time_from || "-",
            sortable: true,
        },
        {
            name: "Time To",
            selector: (row) => row.time_to || "-",
            sortable: true,
        },
        {
            name: "Location",
            selector: (row) => row.location || "-",
            sortable: true,
        },
        {
            name: "Reason",
            selector: (row) => row.reason || "-",
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
                return <span className={statusClass}>{row.status || "-"}</span>;
            },
            sortable: true,
        },
        {
            name: "Supervisor Approval",
            selector: (row) => row.approved_by || "-", // For sorting/filtering
            cell: (row) => {
                let statusClass =
                    "px-2 py-1 rounded text-sm font-medium flex items-center";
                let content = null;

                if (!row.approved_by) {
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

                if (row.status === "Pending" && !row.approved_by) {
                    statusClass =
                        "px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center";
                } else if (row.status === "Rejected" && row.approved_by) {
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
                    onClick={() =>
                        setShowAttachment(
                            row.attach_supporting_document ? row : null
                        )
                    }
                >
                    {row.attach_supporting_document ? (
                        <a
                            href={`/storage/business_travel/${row.attach_supporting_document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View Document
                        </a>
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
                auth.user.roles[0].name !== "Employee" &&
                !row.approved_by ? (
                    <div className="flex gap-1">
                        <Button
                            color="red"
                            size="sm"
                            onClick={() => {
                                setSelectedBusinessTravel(row);
                                handleApprove(row.id, "Approved", row); // Trigger SweetAlert directly
                            }}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                            color="gray"
                            size="sm"
                            onClick={() => {
                                setSelectedBusinessTravel(row);
                                handleApprove(row.id, "Rejected", row); // Trigger SweetAlert directly
                            }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </div>
                ) : (
                    (auth.user.roles[0].name === "SuperAdmin" ||
                        (auth.user.roles[0].name === "HR" &&
                            row.status === "Pending")) &&
                    auth.user.employee.id !== row.employee.id && (
                        <div className="flex gap-1">
                            <Button
                                color="red"
                                size="sm"
                                onClick={() => {
                                    setSelectedBusinessTravel(row);
                                    handleApprove(row.id, "Approved", row); // Trigger SweetAlert directly
                                }}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                                color="gray"
                                size="sm"
                                onClick={() => {
                                    setSelectedBusinessTravel(row);
                                    handleApprove(row.id, "Rejected", row); // Trigger SweetAlert directly
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </div>
                    )
                ),
        },
    ];

    const ExpandedComponent = ({ data }) => {
        return (
            <div className="p-4">
                <h4 className="text-sm font-semibold mb-2">Details</h4>
                <div className="flex flex-col gap-2 text-xs">
                    <span>
                        <strong>Date From:</strong> {data.date_from || "-"}
                    </span>
                    <span>
                        <strong>Date To:</strong> {data.date_to || "-"}
                    </span>
                    <span>
                        <strong>Time From:</strong> {data.time_from || "-"}
                    </span>
                    <span>
                        <strong>Time To:</strong> {data.time_to || "-"}
                    </span>
                    <span>
                        <strong>Location:</strong> {data.location || "-"}
                    </span>
                    <span>
                        <strong>Reason:</strong> {data.reason || "-"}
                    </span>
                </div>
            </div>
        );
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
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
            },
        },
    };

    return (
        <DashboardLayout>
            <Head title="Business Travels" />

            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Official Business Travel
                </h3>
                <BreadCrumbs />
            </div>
            <div className="">
                <Modal
                    show={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                >
                    <ModalHeader>Request Official Business Travel</ModalHeader>
                    <ModalBody>
                        <form
                            onSubmit={handleRequestSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="date_from">Date From</Label>
                                <TextInput
                                    id="date_from"
                                    type="date"
                                    value={data.date_from}
                                    onChange={(e) =>
                                        setData("date_from", e.target.value)
                                    }
                                    required
                                />
                                {errors.date_from && (
                                    <p className="text-red-500 text-sm">
                                        {errors.date_from}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="date_to">Date To</Label>
                                <TextInput
                                    id="date_to"
                                    type="date"
                                    value={data.date_to}
                                    onChange={(e) =>
                                        setData("date_to", e.target.value)
                                    }
                                    required
                                />
                                {errors.date_to && (
                                    <p className="text-red-500 text-sm">
                                        {errors.date_to}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="time_from">Time From</Label>
                                <TextInput
                                    id="time_from"
                                    type="time"
                                    value={data.time_from}
                                    onChange={(e) =>
                                        setData("time_from", e.target.value)
                                    }
                                    required
                                />
                                {errors.time_from && (
                                    <p className="text-red-500 text-sm">
                                        {errors.time_from}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="time_to">Time To</Label>
                                <TextInput
                                    id="time_to"
                                    type="time"
                                    value={data.time_to}
                                    onChange={(e) =>
                                        setData("time_to", e.target.value)
                                    }
                                    required
                                />
                                {errors.time_to && (
                                    <p className="text-red-500 text-sm">
                                        {errors.time_to}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <TextInput
                                    id="location"
                                    type="text"
                                    value={data.location}
                                    onChange={(e) =>
                                        setData("location", e.target.value)
                                    }
                                    required
                                />
                                {errors.location && (
                                    <p className="text-red-500 text-sm">
                                        {errors.location}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="reason">Reason</Label>
                                <TextInput
                                    id="reason"
                                    type="text"
                                    value={data.reason}
                                    onChange={(e) =>
                                        setData("reason", e.target.value)
                                    }
                                    required
                                />
                                {errors.reason && (
                                    <p className="text-red-500 text-sm">
                                        {errors.reason}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>Supporting Document (Optional)</Label>
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed p-4 text-center rounded ${
                                        isDragActive
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    {previewDocument ? (
                                        <a
                                            href={previewDocument}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline"
                                        >
                                            View Uploaded Document
                                        </a>
                                    ) : isDragActive ? (
                                        <p>Drop the document here...</p>
                                    ) : (
                                        <p>
                                            Drag and drop a document here (JPG,
                                            PNG, DOC, PDF), or click to select
                                        </p>
                                    )}
                                </div>
                                {errors.attach_supporting_document && (
                                    <p className="text-red-500 text-sm">
                                        {errors.attach_supporting_document}
                                    </p>
                                )}
                            </div>
                            <div className="flex w-full justify-end">
                                <Button
                                    type="submit"
                                    disabled={isProcessing}
                                    color="red"
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
                            </div>
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
                            <object
                                data={`/storage/business_travel/${showAttachment.attach_supporting_document}`}
                                type="application/pdf" // Default to PDF; adjust dynamically if needed
                                title="Attachment"
                                className="w-full h-[80vh]"
                            >
                                {/* Fallback for browsers that don't support object */}
                                <iframe
                                    src={`/storage/business_travel/${showAttachment.attach_supporting_document}`}
                                    title="Attachment Fallback"
                                    className="w-full h-[80vh]"
                                >
                                    <p>
                                        Download the document:{" "}
                                        <a
                                            href={`/storage/business_travel/${showAttachment.attach_supporting_document}`}
                                            download
                                        >
                                            Click here
                                        </a>
                                    </p>
                                </iframe>
                            </object>
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

                <div className="flex flex-col gap-3">
                    <h2 className="text-xl font-semibold">My Requests</h2>
                    {/* Filter Section */}
                    <div className="mb-0 flex justify-between items-center">
                        <div className="flex gap-4 w-2/3">
                            <TextInput
                                placeholder="Search Name or Emp ID"
                                value={myFilterText}
                                onChange={(e) =>
                                    setMyFilterText(e.target.value)
                                }
                                className="w-1/3"
                            />
                            <Select
                                value={statusMyFilter}
                                onChange={(e) =>
                                    setStatusMyFilter(e.target.value)
                                }
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
                                    <FontAwesomeIcon icon={faPlus} /> Request
                                    Business Travel
                                </span>
                            </Button>
                        </div>
                    </div>
                    <section>
                        <DataTable
                            columns={columns}
                            data={filteredMyBusinessTravels}
                            pagination
                            highlightOnHover
                            customStyles={customStyles}
                            // expandableRows
                            // expandableRowsComponent={ExpandedComponent}
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
                                            No Business Travel Requests
                                        </span>
                                    </p>
                                </div>
                            }
                        />
                    </section>

                    {filteredBusinessTravels &&
                        filteredBusinessTravels.length > 0 && (
                            <>
                                <h2 className="text-xl font-semibold">
                                    Requests
                                </h2>
                                <section>
                                    {/* Filter Section */}
                                    <div className="mb-4 flex justify-between items-center">
                                        <div className="flex gap-4 w-2/3">
                                            <TextInput
                                                placeholder="Search Name or Emp ID"
                                                value={filterText}
                                                onChange={(e) =>
                                                    setFilterText(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-1/3"
                                            />
                                            <Select
                                                value={statusFilter}
                                                onChange={(e) =>
                                                    setStatusFilter(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-1/6"
                                            >
                                                <option value="">
                                                    All Statuses
                                                </option>
                                                <option value="Pending">
                                                    Pending
                                                </option>
                                                <option value="Approved">
                                                    Approved
                                                </option>
                                                <option value="Rejected">
                                                    Rejected
                                                </option>
                                            </Select>
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={columns}
                                        data={filteredBusinessTravels}
                                        pagination
                                        highlightOnHover
                                        customStyles={customStyles}
                                        // expandableRows
                                        // expandableRowsComponent={
                                        //     ExpandedComponent
                                        // }
                                        noDataComponent={
                                            <div>
                                                <img
                                                    src="/images/no-data.webp"
                                                    alt="Empty"
                                                    className="max-w-xs mt-2 mx-auto"
                                                    onError={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                    }}
                                                />
                                                <p className="text-center mb-5 badge badge-error ">
                                                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                                                        No Business Travel
                                                        Requests
                                                    </span>
                                                </p>
                                            </div>
                                        }
                                    />
                                </section>
                            </>
                        )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BusinessTravelRequestComponent;
