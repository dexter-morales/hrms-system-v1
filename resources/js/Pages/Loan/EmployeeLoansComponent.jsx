import React, { useState, useEffect, useCallback } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import {
    Button,
    TextInput,
    Select,
    Label,
    ModalHeader,
    ModalBody,
    Modal,
} from "flowbite-react";
import { router } from "@inertiajs/react";
import DataTable from "react-data-table-component";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import {
    faSpinner,
    faTimes,
    faCheck,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import TermsCombobox from "@/Components/ui/dropdown/TermsCombobox";

const EmployeeLoansComponent = () => {
    const { auth, loans, myLoans, loan_types } = usePage().props;
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [showAttachment, setShowAttachment] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showHistory, setShowHistory] = useState(null);
    const [loanHistory, setLoanHistory] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [loanTypeFilter, setLoanTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [frequencyFilter, setFrequencyFilter] = useState("");

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: "",
        loan_type: "",
        terms: "",
        notes: "",
        status: "Pending",
        image: null,
        deduction_frequency: "once_a_month",
    });

    useEffect(() => {
        if (!isRequestModalOpen) reset();
    }, [isRequestModalOpen, reset]);

    const handleRequestSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("amount", data.amount);
        formData.append("loan_type", data.loan_type);
        formData.append("terms", data.terms);
        formData.append("notes", data.notes || "");
        formData.append("status", data.status);
        formData.append("deduction_frequency", data.deduction_frequency);
        if (data.image) formData.append("image", data.image);
        setIsProcessing(true);
        router.post(route("loan.store"), formData, {
            onSuccess: () => {
                toast.success("Loan request submitted successfully!");
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
            html: `
                <p>Loan for ${row?.employee.first_name} ${
                row?.employee.last_name
            } - ${row?.loan_type} (Current: ₱${row?.amount})</p>
                ${
                    row?.image
                        ? '<p>Supporting Image:</p><img src="/storage/loans/${row.image}" alt="Supporting Document" class="mt-2" />'
                        : ""
                }
                <label class="block mt-2 text-sm font-medium text-gray-700">Update Amount (₱)</label>
                <input type="number" id="swal-input-amount" class="swal2-input mt-1 border-gray-300 rounded-md shadow-sm" value="${
                    row?.amount
                }" step="0.01" />
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
            preConfirm: () => {
                const amount =
                    document.getElementById("swal-input-amount").value;
                if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                    Swal.showValidationMessage("Please enter a valid amount");
                    return false;
                }
                return { amount: parseFloat(amount) };
            },
            didOpen: () => {
                if (row?.image) {
                    const img = Swal.getHtmlContainer().querySelector("img");
                    img.onerror = () => (img.style.display = "none");
                }
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) swalContainer.style.zIndex = "9999";
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedAmount = result.value.amount;
                router.put(
                    route("loan.update", id),
                    { status, amount: updatedAmount },
                    {
                        onSuccess: () => {
                            toast.success(`Loan ${status} successfully!`);
                            setSelectedLoan(null);
                        },
                        onError: (errors) => console.log(errors),
                    }
                );
            }
        });
    };

    const fetchLoanHistory = useCallback(async (loanId) => {
        try {
            const response = await router.get(route("loan.history", loanId));
            setLoanHistory(response.props.history || []);
            setShowHistory(loanId);
        } catch (error) {
            console.error("Error fetching loan history:", error);
            toast.error("Failed to load loan history");
        }
    }, []);

    const safeMyLoans = Array.isArray(myLoans) ? myLoans : [];
    const filteredLoans = loans
        .filter((loan) =>
            auth.user.roles[0].name === "manager"
                ? loan.employee.head_or_manager ===
                  auth.user.employee?.employee_id
                : auth.user.roles[0].name === "employee"
                ? loan.employee.id === auth.user.employee?.id
                : true
        )
        .filter(
            (loan) =>
                (loan.employee.first_name
                    .toLowerCase()
                    .includes(filterText.toLowerCase()) ||
                    loan.employee.id
                        .toString()
                        .includes(filterText.toLowerCase())) &&
                (loanTypeFilter === "" || loan.loan_type === loanTypeFilter) &&
                (statusFilter === "" || loan.status === statusFilter) &&
                (frequencyFilter === "" ||
                    loan.deduction_frequency === frequencyFilter)
        );

    const filteredMyLoans = safeMyLoans.filter(
        (loan) =>
            (loan.employee.first_name
                .toLowerCase()
                .includes(filterText.toLowerCase()) ||
                loan.employee.id
                    .toString()
                    .includes(filterText.toLowerCase())) &&
            (loanTypeFilter === "" || loan.loan_type === loanTypeFilter) &&
            (statusFilter === "" || loan.status === statusFilter) &&
            (frequencyFilter === "" ||
                loan.deduction_frequency === frequencyFilter)
    );

    const formatFrequency = (frequency) => {
        return frequency === "once_a_month" ? "Once a Month" : "Twice a Month";
    };

    const columns = [
        {
            name: "Employee",
            selector: (row) =>
                `${row.employee.first_name} ${row.employee.last_name}`,
            sortable: true,
        },
        {
            name: "Loan Type",
            selector: (row) => row.loan_type,
            sortable: true,
        },
        {
            name: "Amount",
            selector: (row) => `₱${row.amount}`,
            sortable: true,
        },
        {
            name: "Terms",
            selector: (row) => `${row.terms} months`,
            sortable: true,
        },
        {
            name: "Deduction Frequency",
            selector: (row) => formatFrequency(row.deduction_frequency),
            sortable: true,
        },
        {
            name: "Notes",
            selector: (row) => row.notes || "N/A",
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => row.status,
            cell: (row) => {
                let statusClass = "px-2 py-1 rounded text-sm font-medium";
                if (row.status === "Pending")
                    statusClass += " bg-yellow-100 text-yellow-800";
                else if (row.status === "Approved")
                    statusClass += " bg-green-100 text-green-800";
                else if (row.status === "Rejected")
                    statusClass += " bg-red-100 text-red-800";
                else statusClass += " text-gray-600";
                return <span className={statusClass}>{row.status}</span>;
            },
            sortable: true,
        },
        {
            name: "HR Approval",
            selector: (row) => row.approved_by,
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
                if (row.status === "Pending" && !row.approved_by)
                    statusClass += " bg-yellow-100 text-yellow-800";
                else if (row.status === "Rejected" && row.approved_by)
                    statusClass += " bg-red-100 text-red-800";
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
                            src={`/storage/loans/${row.image}`}
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
                auth.user.employee?.id !== row.employee.id &&
                row.status === "Pending" &&
                !row.approved_by ? (
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
    ];

    const myColumns = [
        {
            name: "Employee",
            selector: (row) =>
                `${row.employee.first_name} ${row.employee.last_name}`,
            sortable: true,
        },
        {
            name: "Loan Type",
            selector: (row) => row.loan_type,
            sortable: true,
        },
        {
            name: "Amount",
            selector: (row) => `₱${row.amount}`,
            sortable: true,
        },
        {
            name: "Terms",
            selector: (row) => `${row.terms} months`,
            sortable: true,
        },
        {
            name: "Deduction Frequency",
            selector: (row) => formatFrequency(row.deduction_frequency),
            sortable: true,
        },
        {
            name: "Notes",
            selector: (row) => row.notes || "N/A",
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => row.status,
            cell: (row) => {
                let statusClass = "px-2 py-1 rounded text-sm font-medium";
                if (row.status === "Pending")
                    statusClass += " bg-yellow-100 text-yellow-800";
                else if (row.status === "Approved")
                    statusClass += " bg-green-100 text-green-800";
                else if (row.status === "Rejected")
                    statusClass += " bg-red-100 text-red-800";
                else statusClass += " text-gray-600";
                return <span className={statusClass}>{row.status}</span>;
            },
            sortable: true,
        },
        {
            name: "HR Approval",
            selector: (row) => row.approved_by,
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
                if (row.status === "Pending" && !row.approved_by)
                    statusClass += " bg-yellow-100 text-yellow-800";
                else if (row.status === "Rejected" && row.approved_by)
                    statusClass += " bg-red-100 text-red-800";
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
                            src={`/storage/loans/${row.image}`}
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
            name: "Payment History",
            cell: (row) =>
                row.status === "Approved" && (
                    <Button
                        color="blue"
                        size="sm"
                        onClick={() => fetchLoanHistory(row.id)}
                    >
                        View History
                    </Button>
                ),
        },
    ];

    const customStyles = {
        headRow: { style: { backgroundColor: "#f3f4f6" } },
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
        accept: { "image/jpeg": [], "image/png": [] },
        maxFiles: 1,
    });

    const termsOptions = data.loan_type
        ? [...Array(parseInt(getTermsForLoanType(data.loan_type))).keys()].map(
              (i) => ({
                  value: (i + 1).toString(),
                  label: (i + 1).toString(),
              })
          )
        : [];

    return (
        <DashboardLayout>
            <Head title="Employee Loans" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Employee Loans
                </h3>
                <BreadCrumbs />
            </div>
            <div className="p-0">
                <div className="mb-4 flex justify-between items-center">
                    <div className="flex gap-4 w-2/3">
                        <TextInput
                            placeholder="Search Name or Emp ID"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-1/3"
                        />
                        <Select
                            value={loanTypeFilter}
                            onChange={(e) => setLoanTypeFilter(e.target.value)}
                            className="w-1/6"
                        >
                            <option value="">All Loan Types</option>
                            <option value="Cash Advance">Cash Advance</option>
                            <option value="SSS Loan">SSS Loan</option>
                            <option value="Pag-ibig Loan">Pag-ibig Loan</option>
                            <option value="Others">Others</option>
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
                        <Select
                            value={frequencyFilter}
                            onChange={(e) => setFrequencyFilter(e.target.value)}
                            className="w-1/6"
                        >
                            <option value="">All Frequencies</option>
                            <option value="once_a_month">Once a Month</option>
                            <option value="twice_a_month">Twice a Month</option>
                        </Select>
                    </div>
                    <div>
                        <Button
                            color="blue"
                            onClick={() => setIsRequestModalOpen(true)}
                            className="bg-red-700 hover:bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                        >
                            <span>
                                <FontAwesomeIcon icon={faPlus} /> Request Loan
                            </span>
                        </Button>
                    </div>
                </div>

                <Modal
                    show={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                >
                    <ModalHeader>Request Loan</ModalHeader>
                    <ModalBody>
                        <form
                            onSubmit={handleRequestSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="amount">Amount (₱)</Label>
                                <TextInput
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData("amount", e.target.value)
                                    }
                                    required
                                />
                                {errors.amount && (
                                    <p className="text-red-500 text-sm">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="loan_type">Loan Type</Label>
                                <Select
                                    id="loan_type"
                                    value={data.loan_type}
                                    onChange={(e) => {
                                        setData("loan_type", e.target.value);
                                        setData(
                                            "terms",
                                            getTermsForLoanType(e.target.value)
                                        );
                                    }}
                                    required
                                >
                                    <option value="">Select...</option>
                                    <option value="Cash Advance">
                                        Cash Advance (12 months)
                                    </option>
                                    <option value="SSS Loan">
                                        SSS Loan (24 months)
                                    </option>
                                    <option value="Pag-ibig Loan">
                                        Pag-ibig Loan (36 months)
                                    </option>
                                    <option value="Others">
                                        Others (12 months)
                                    </option>
                                </Select>
                                {errors.loan_type && (
                                    <p className="text-red-500 text-sm">
                                        {errors.loan_type}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="terms">Terms (months)</Label>
                                <TermsCombobox
                                    termsOptions={termsOptions}
                                    data={data}
                                    setData={setData}
                                />
                                {errors.terms && (
                                    <p className="text-red-500 text-sm">
                                        {errors.terms}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="deduction_frequency">
                                    Deduction Frequency
                                </Label>
                                <Select
                                    id="deduction_frequency"
                                    value={data.deduction_frequency}
                                    onChange={(e) =>
                                        setData(
                                            "deduction_frequency",
                                            e.target.value
                                        )
                                    }
                                    required
                                >
                                    <option value="once_a_month">
                                        Once a Month
                                    </option>
                                    <option value="twice_a_month">
                                        Twice a Month
                                    </option>
                                </Select>
                                {errors.deduction_frequency && (
                                    <p className="text-red-500 text-sm">
                                        {errors.deduction_frequency}
                                    </p>
                                )}
                            </div>
                            {data.loan_type === "Others" && (
                                <div>
                                    <Label htmlFor="notes">
                                        Notes (Required for Others)
                                    </Label>
                                    <TextInput
                                        id="notes"
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData("notes", e.target.value)
                                        }
                                        required={data.loan_type === "Others"}
                                    />
                                    {errors.notes && (
                                        <p className="text-red-500 text-sm">
                                            {errors.notes}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div>
                                <Label>Supporting Image (Optional)</Label>
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
                        </form>
                    </ModalBody>
                </Modal>

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
                                src={`/storage/loans/${showAttachment.image}`}
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

                {showHistory && (
                    <Modal show={true} onClose={() => setShowHistory(null)}>
                        <ModalHeader>Loan Payment History</ModalHeader>
                        <ModalBody>
                            <DataTable
                                columns={[
                                    {
                                        name: "Date",
                                        selector: (row) => row.payment_date,
                                    },
                                    {
                                        name: "Amount Paid",
                                        selector: (row) =>
                                            `₱${row.amount_paid}`,
                                    },
                                    {
                                        name: "Notes",
                                        selector: (row) => row.notes || "N/A",
                                    },
                                ]}
                                data={loanHistory}
                                pagination
                                highlightOnHover
                                customStyles={customStyles}
                                noDataComponent={
                                    <div>
                                        <p className="text-center mb-5 badge badge-error">
                                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                                                No Payment History
                                            </span>
                                        </p>
                                    </div>
                                }
                            />
                            <Button
                                color="gray"
                                className="mt-4"
                                onClick={() => setShowHistory(null)}
                            >
                                Close
                            </Button>
                        </ModalBody>
                    </Modal>
                )}

                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">
                            My Loan Requests
                        </h2>
                        <DataTable
                            columns={myColumns}
                            data={filteredMyLoans}
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
                                            No Loan Requests
                                        </span>
                                    </p>
                                </div>
                            }
                        />
                    </div>

                    {(auth.user.roles[0].name === "HR" ||
                        auth.user.roles[0].name === "SuperAdmin") && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">
                                Loan Requests
                            </h2>
                            <DataTable
                                columns={columns}
                                data={filteredLoans}
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
                                                No Loan Requests
                                            </span>
                                        </p>
                                    </div>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

const getTermsForLoanType = (loanType) => {
    switch (loanType) {
        case "Cash Advance":
        case "Others":
            return "12";
        case "SSS Loan":
            return "24";
        case "Pag-ibig Loan":
            return "36";
        default:
            return "";
    }
};

export default EmployeeLoansComponent;
