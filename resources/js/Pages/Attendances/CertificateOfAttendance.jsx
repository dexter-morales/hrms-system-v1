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
import { faMinus } from "@fortawesome/free-solid-svg-icons";

const CertificateOfAttendance = () => {
    const { auth, certificates, myCertificates } = usePage().props;
    console.log("Certificates: ", usePage().props);
    console.log("auth.user.roles.name: ", auth.user.roles);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false); // Kept for reference, but replaced by SweetAlert
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // For request modal preview
    const [showAttachment, setShowAttachment] = useState(null); // For attachment viewer
    const [isProcessing, setIsProcessing] = useState(false);
    const [entries, setEntries] = useState([
        { id: 1, type: "", date: "", time: "" },
    ]);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: "",
        reason: "",
        other_reason: "",
        entries: [], // Array to store multiple clock in/out entries
        status: "Pending",
    });

    useEffect(() => {
        if (!isRequestModalOpen) {
            reset();
            setEntries([{ id: 1, type: "", date: "", time: "" }]);
        }
    }, [isRequestModalOpen, reset]);

    const handleRequestSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("type", data.type);
        formData.append("reason", data.reason);
        if (data.type === "other" && data.other_reason) {
            formData.append("other_reason", data.other_reason);
        }
        entries.forEach((entry, index) => {
            formData.append(`entries[${index}][type]`, entry.type);
            formData.append(`entries[${index}][date]`, entry.date);
            formData.append(`entries[${index}][time]`, entry.time);
        });
        if (data.image) {
            formData.append("image", data.image);
        }
        formData.append("status", data.status);
        setIsProcessing(true);
        router.post(route("certificate.store"), formData, {
            onSuccess: () => {
                toast.success(
                    "Certificate of Attendance request submitted successfully!"
                );
                setIsProcessing(false);
                reset();
                setEntries([{ id: 1, type: "", date: "", time: "" }]);
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

    const handleAddEntry = () => {
        setEntries([
            ...entries,
            { id: entries.length + 1, type: "", date: "", time: "" },
        ]);
    };

    const handleEntryChange = (id, field, value) => {
        setEntries(
            entries.map((entry) =>
                entry.id === id ? { ...entry, [field]: value } : entry
            )
        );
    };

    const handleRemoveEntry = (id) => {
        setEntries(entries.filter((entry) => entry.id !== id));
    };

    const handleApprove = (id, status, row) => {
        Swal.fire({
            title: "Confirm Action",
            html: `
            <div class="flex flex-col gap-1">
                <p class="mb-4">Certificate for ${
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
                    route("certificate.update", id),
                    {
                        status,
                    },
                    {
                        onSuccess: () => {
                            toast.success(
                                `Certificate ${status} successfully!`
                            );
                            setSelectedCertificate(null); // Reset selected certificate
                        },
                        onError: (errors) => console.log(errors),
                    }
                );
            }
        });
    };

    const [filterText, setFilterText] = useState("");
    const [myFilterText, setMyFilterText] = useState("");

    const [certificateTypeFilter, setCertificateTypeFilter] = useState("");
    const [certificateTypeMyFilter, setCertificateTypeMyFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [statusMyFilter, setStatusMyFilter] = useState("");

    const filteredMyCertificates = myCertificates
        .filter((certificate) =>
            auth.user.role === "manager"
                ? certificate.employee.manager_id === auth.user.id
                : auth.user.role === "employee"
                ? certificate.employee.id === auth.user.id
                : true
        )
        .filter(
            (certificate) =>
                (certificate.employee.first_name
                    .toLowerCase()
                    .includes(myFilterText.toLowerCase()) ||
                    certificate.employee.last_name
                        .toLowerCase()
                        .includes(myFilterText.toLowerCase()) ||
                    certificate.employee.id
                        .toString()
                        .includes(myFilterText.toLowerCase())) &&
                (certificateTypeMyFilter === "" ||
                    certificate.type === certificateTypeMyFilter) &&
                (statusMyFilter === "" || certificate.status === statusMyFilter)
        );

    const filteredCertificates = certificates
        .filter((certificate) =>
            auth.user.role === "manager"
                ? certificate.employee.manager_id === auth.user.id
                : auth.user.role === "employee"
                ? certificate.employee.id === auth.user.id
                : true
        )
        .filter(
            (certificate) =>
                (certificate.employee.first_name
                    .toLowerCase()
                    .includes(filterText.toLowerCase()) ||
                    certificate.employee.last_name
                        .toLowerCase()
                        .includes(filterText.toLowerCase()) ||
                    certificate.employee.id
                        .toString()
                        .includes(filterText.toLowerCase())) &&
                (certificateTypeFilter === "" ||
                    certificate.type === certificateTypeFilter) &&
                (statusFilter === "" || certificate.status === statusFilter)
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
            name: "Type",
            selector: (row) => row.type || "-",
            sortable: true,
        },
        {
            name: "Reason",
            selector: (row) => row.reason || "-",
            sortable: true,
        },
        {
            name: "Other Reason",
            selector: (row) => row.other_reason || "-",
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

                // Check approved_by and status
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

                // Override status-based styling if approved_by is set
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
        // {
        //     name: "Attachment",
        //     cell: (row) => (
        //         <div
        //             className="cursor-pointer"
        //             onClick={() => setShowAttachment(row.image ? row : null)}
        //         >
        //             {row.image ? (
        //                 <img
        //                     src={`/storage/certificates/${row.image}`}
        //                     alt="Attachment"
        //                     className="w-10 h-10 object-cover rounded"
        //                 />
        //             ) : (
        //                 <span>No Attachment</span>
        //             )}
        //         </div>
        //     ),
        // },
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
                                setSelectedCertificate(row);
                                handleApprove(row.id, "Approved", row); // Trigger SweetAlert directly
                            }}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                            color="gray"
                            size="sm"
                            onClick={() => {
                                setSelectedCertificate(row);
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
                                    setSelectedCertificate(row);
                                    handleApprove(row.id, "Approved", row); // Trigger SweetAlert directly
                                }}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                                color="gray"
                                size="sm"
                                onClick={() => {
                                    setSelectedCertificate(row);
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

    // Expandable row component
    const ExpandedComponent = ({ data }) => {
        const [entries2, setEntries] = useState(data.entries || []);

        const handleEntryApprove = (index, status) => {
            const updatedEntries = [...entries2];
            updatedEntries[index] = {
                ...updatedEntries[index],
                status: status,
            };
            setEntries(updatedEntries);

            // Send update to backend
            router.put(
                route("certificate.update.entry", { id: data.id, index }),
                {
                    status: status,
                },
                {
                    onSuccess: () => {
                        toast.success(
                            `Entry ${index + 1} ${status} successfully!`
                        );
                    },
                    onError: () => {
                        toast.error(`Failed to ${status} entry ${index + 1}.`);
                    },
                }
            );
        };
        return (
            <div className="p-4">
                <h4 className="text-sm font-semibold mb-2">Entries</h4>
                {entries2 &&
                    JSON.parse(entries2)?.map((entry, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 mb-2 p-2 border rounded text-xs"
                        >
                            <span>{`${entry.type || "-"} - ${
                                entry.date || "-"
                            } ${entry.time || "-"}`}</span>
                        </div>
                    ))}
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
            <Head title="Certificates" />

            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Certificate of Attendance
                </h3>
                <BreadCrumbs />
            </div>
            <div className="">
                <Modal
                    show={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                >
                    <ModalHeader>Request Certificate of Attendance</ModalHeader>
                    <ModalBody>
                        <form
                            onSubmit={handleRequestSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    id="type"
                                    value={data.type}
                                    onChange={(e) => {
                                        setData("type", e.target.value);
                                        if (e.target.value !== "other")
                                            setData("other_reason", "");
                                    }}
                                    required
                                >
                                    <option value="">Select Type...</option>
                                    <option value="biometric device malfunction">
                                        Biometric Device Malfunction
                                    </option>
                                    <option value="power outage">
                                        Power Outage
                                    </option>
                                    <option value="other">Other</option>
                                </Select>
                                {errors.type && (
                                    <p className="text-red-500 text-sm">
                                        {errors.type}
                                    </p>
                                )}
                            </div>
                            {data.type === "other" && (
                                <div>
                                    <Label htmlFor="other_reason">
                                        Other Reason
                                    </Label>
                                    <TextInput
                                        id="other_reason"
                                        type="text"
                                        value={data.other_reason}
                                        onChange={(e) =>
                                            setData(
                                                "other_reason",
                                                e.target.value
                                            )
                                        }
                                        required
                                    />
                                    {errors.other_reason && (
                                        <p className="text-red-500 text-sm">
                                            {errors.other_reason}
                                        </p>
                                    )}
                                </div>
                            )}
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
                            <Button
                                type="button"
                                color="red"
                                onClick={handleAddEntry}
                                className="mt-2"
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add Entry
                            </Button>
                            {entries.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="grid grid-cols-3 gap-4"
                                >
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor={`type-${entry.id}`}>
                                            Type
                                        </Label>
                                        <Select
                                            id={`type-${entry.id}`}
                                            value={entry.type}
                                            onChange={(e) =>
                                                handleEntryChange(
                                                    entry.id,
                                                    "type",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">Select...</option>
                                            <option value="clock in">
                                                Clock In
                                            </option>
                                            <option value="clock out">
                                                Clock Out
                                            </option>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor={`date-${entry.id}`}>
                                            Date
                                        </Label>
                                        <TextInput
                                            id={`date-${entry.id}`}
                                            type="date"
                                            value={entry.date}
                                            onChange={(e) =>
                                                handleEntryChange(
                                                    entry.id,
                                                    "date",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor={`time-${entry.id}`}>
                                            Time
                                        </Label>
                                        <div className="flex justify-between items-center gap-3">
                                            <TextInput
                                                id={`time-${entry.id}`}
                                                type="time"
                                                className="w-full"
                                                value={entry.time}
                                                onChange={(e) =>
                                                    handleEntryChange(
                                                        entry.id,
                                                        "time",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            {index > 0 && (
                                                <Button
                                                    color="gray"
                                                    size="sm"
                                                    // className="mt-6"
                                                    onClick={() =>
                                                        handleRemoveEntry(
                                                            entry.id
                                                        )
                                                    }
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faMinus}
                                                    />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

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
                            <img
                                src={`/storage/certificates/${showAttachment.image}`}
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
                                value={certificateTypeMyFilter}
                                onChange={(e) =>
                                    setCertificateTypeMyFilter(e.target.value)
                                }
                                className="w-1/6"
                            >
                                <option value="">All Certificate Types</option>
                                <option value="biometric device malfunction">
                                    Biometric Device Malfunction
                                </option>
                                <option value="power outage">
                                    Power Outage
                                </option>
                                <option value="other">Other</option>
                            </Select>
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
                                    Certificate
                                </span>
                            </Button>
                        </div>
                    </div>
                    <section>
                        <DataTable
                            columns={columns}
                            data={filteredMyCertificates}
                            pagination
                            highlightOnHover
                            customStyles={customStyles}
                            expandableRows
                            expandableRowsComponent={ExpandedComponent}
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
                                            No Certificate Requests
                                        </span>
                                    </p>
                                </div>
                            }
                        />
                    </section>

                    {filteredCertificates &&
                        filteredCertificates.length > 0 && (
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
                                                value={certificateTypeFilter}
                                                onChange={(e) =>
                                                    setCertificateTypeFilter(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-1/6"
                                            >
                                                <option value="">
                                                    All Certificate Types
                                                </option>
                                                <option value="biometric device malfunction">
                                                    Biometric Device Malfunction
                                                </option>
                                                <option value="power outage">
                                                    Power Outage
                                                </option>
                                                <option value="other">
                                                    Other
                                                </option>
                                            </Select>
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
                                        data={filteredCertificates}
                                        pagination
                                        highlightOnHover
                                        customStyles={customStyles}
                                        expandableRows
                                        expandableRowsComponent={
                                            ExpandedComponent
                                        }
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
                                                        No Certificate Requests
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

export default CertificateOfAttendance;
