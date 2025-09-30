import React, { useState } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import {
    Button,
    TextInput,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Checkbox,
    Select,
    Label,
} from "flowbite-react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrashAlt,
    faEdit,
    faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

const ThirteenthMonthPay = () => {
    const { employees, sites, thirteenth_month_pays = [] } = usePage().props;

    const [formData, setFormData] = useState({
        year: new Date().getFullYear().toString(),
    });
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [generateAll, setGenerateAll] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [searchEmployee, setSearchEmployee] = useState("");
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [updateFormData, setUpdateFormData] = useState({
        basic_earnings: "",
        thirteenth_month_pay: "",
        status: "",
        notes: "",
    });

    const handleGeneratePay = (e) => {
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
            route("thirteenth-month.generate"),
            {
                employee_ids: employeeIds,
                year: formData.year,
            },
            {
                onSuccess: () => {
                    toast.success("13th Month Pay generated successfully!");
                    setShowGenerateModal(false);
                    setSelectedEmployees([]);
                    setGenerateAll(false);
                },
                onError: (errors) => {
                    toast.error("Failed to generate 13th Month Pay.");
                    console.error("Error:", errors);
                },
            }
        );
    };

    // Only showing the handleExportPDF function for brevity
    const handleExportPDF = (e) => {
        e.preventDefault();
        if (!generateAll && selectedEmployees.length === 0) {
            toast.error(
                "Please select at least one employee or choose 'Generate All' for PDF export."
            );
            return;
        }
        const employeeIds = generateAll
            ? employees.map((emp) => emp.id)
            : selectedEmployees;

        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        const csrfToken = csrfMeta ? csrfMeta.content : null;

        if (!csrfToken) {
            toast.error(
                "CSRF token not found. Please refresh the page and try again."
            );
            console.error("CSRF token meta tag missing in DOM");
            setShowExportModal(false);
            return;
        }

        fetch(route("thirteenth-month.export-pdf"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
                Accept: "application/pdf",
            },
            body: JSON.stringify({
                employee_ids: employeeIds,
                year: formData.year,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((err) => {
                        throw new Error(
                            err.error ||
                                `HTTP ${response.status}: ${response.statusText}`
                        );
                    });
                }
                return response
                    .blob()
                    .then((blob) => ({ blob, headers: response.headers }));
            })
            .then(({ blob, headers }) => {
                const contentType = headers.get("Content-Type");
                if (!contentType.includes("application/pdf")) {
                    throw new Error(`Invalid response type: ${contentType}`);
                }
                const fileName =
                    headers
                        .get("Content-Disposition")
                        ?.match(/filename="(.+)"/)?.[1] ||
                    `13th_Month_Pay_Report_${formData.year}_${dayjs().format(
                        "YYYYMMDD_HHmmss"
                    )}.pdf`;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success("13th Month Pay report exported successfully!");
                setShowExportModal(false);
            })
            .catch((error) => {
                toast.error(
                    error.message ||
                        "Failed to export 13th Month Pay report to PDF. Please ensure the server is configured correctly or contact support."
                );
                console.error("Export PDF Error:", error);
                setShowExportModal(false);
            });
    };

    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const handleUpdateClick = (record) => {
        setSelectedRecord(record);
        setUpdateFormData({
            basic_earnings: record.basic_earnings || "",
            thirteenth_month_pay: record.thirteenth_month_pay || "",
            status: record.status || "",
            notes: record.notes || "",
        });
        setShowUpdateModal(true);
    };

    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        router.put(
            route("thirteenth-month.update", selectedRecord.id),
            updateFormData,
            {
                onSuccess: () => {
                    toast.success("13th Month Pay updated successfully!");
                    setShowUpdateModal(false);
                    setSelectedRecord(null);
                    setUpdateFormData({
                        basic_earnings: "",
                        thirteenth_month_pay: "",
                        status: "",
                        notes: "",
                    });
                },
                onError: (errors) => {
                    toast.error("Failed to update 13th Month Pay.");
                    console.error("Error:", errors);
                },
            }
        );
    };

    const handleDelete = (record) => {
        if (record.status !== "Pending") {
            toast.error("Cannot delete non Pending 13th Month Pay record.");
            return;
        }
        Swal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert the deletion of the 13th Month Pay for ${record.employee?.first_name} ${record.employee?.last_name}!`,
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
                router.delete(route("thirteenth-month.destroy", record.id), {
                    onSuccess: () => toast.success("13th Month Pay deleted!"),
                    onError: () =>
                        toast.error("Failed to delete 13th Month Pay."),
                });
            }
        });
    };

    const numberFormat = (number) => {
        return parseFloat(number).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const filteredEmployees = employees.filter(
        (emp) =>
            `${emp.first_name} ${emp.last_name}`
                .toLowerCase()
                .includes(searchEmployee.toLowerCase()) ||
            emp.employee_id.toLowerCase().includes(searchEmployee.toLowerCase())
    );

    const employeeColumns = [
        {
            name: "Select",
            cell: (row) => (
                <Checkbox
                    checked={selectedEmployees.includes(row.id)}
                    onChange={() => handleEmployeeSelect(row.id)}
                />
            ),
            width: "60px",
        },
        {
            name: "Employee ID",
            selector: (row) => row.employee_id,
            sortable: true,
        },
        {
            name: "Name",
            selector: (row) => `${row.first_name} ${row.last_name}`,
            sortable: true,
        },
        {
            name: "Site",
            selector: (row) =>
                sites.find((site) => site.id === row.site_id)?.name || "-",
            sortable: true,
        },
        {
            name: "Monthly Salary",
            selector: (row) => numberFormat(row.basic_salary),
            sortable: true,
        },
        {
            name: "Hired Date",
            selector: (row) => dayjs(row.date_hired).format("YYYY-MM-DD"),
            sortable: true,
        },
    ];

    const payColumns = [
        {
            name: "#",
            cell: (row, index) => index + 1,
            width: "60px",
        },
        {
            name: "Employee",
            selector: (row) =>
                `${row.employee?.first_name || "-"} ${
                    row.employee?.last_name || ""
                }`,
            sortable: true,
        },
        {
            name: "Basic Earnings",
            selector: (row) => numberFormat(row.basic_earnings),
            sortable: true,
        },
        {
            name: "Months Covered",
            selector: (row) => {
                const monthsCovered =
                    typeof row.months_covered === "string"
                        ? JSON.parse(row.months_covered)
                        : row.months_covered;
                return monthsCovered
                    .map(
                        (entry) =>
                            `${entry.month}: ${numberFormat(entry.earnings)}`
                    )
                    .join(", ");
            },
            sortable: false,
        },
        {
            name: "13th Month Pay",
            selector: (row) => numberFormat(row.thirteenth_month_pay),
            sortable: true,
        },
        {
            name: "Calculation Date",
            selector: (row) => dayjs(row.calculation_date).format("YYYY-MM-DD"),
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => row.status,
            sortable: true,
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => handleUpdateClick(row)}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button
                        color="gray"
                        size="sm"
                        onClick={() => handleDelete(row)}
                        className=" hover:!bg-red-700"
                    >
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </Button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
    ];

    return (
        <DashboardLayout>
            <Head title="13th Month Pay" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    13th Month Pay Generation
                </h3>
                <BreadCrumbs />
            </div>
            <div className="mb-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setShowGenerateModal(true);
                    }}
                    className="mb-6 flex gap-4 flex-wrap"
                >
                    <div className="flex-1 min-w-[200px]">
                        <TextInput
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    year: e.target.value,
                                })
                            }
                            placeholder="Enter year (e.g., 2025)"
                            required
                        />
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="generateAll"
                            checked={generateAll}
                            onChange={() => setGenerateAll(!generateAll)}
                        />
                        <label htmlFor="generateAll" className="ml-2">
                            Generate for All Employees
                        </label>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button
                            type="submit"
                            color="primary"
                            className="bg-red-700 hover:!bg-red-900 text-white"
                        >
                            Generate 13th Month Pay
                        </Button>
                        <Button
                            color="primary"
                            className="bg-red-700 hover:!bg-red-900 text-white"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowExportModal(true);
                            }}
                        >
                            <FontAwesomeIcon icon={faFilePdf} /> Export to PDF
                        </Button>
                    </div>
                </form>
                <div className="mb-4">
                    <TextInput
                        type="text"
                        placeholder="Search employees..."
                        value={searchEmployee}
                        onChange={(e) => setSearchEmployee(e.target.value)}
                    />
                </div>
                <DataTable
                    columns={employeeColumns}
                    data={filteredEmployees}
                    pagination
                    highlightOnHover
                    striped
                    responsive
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
                                    No record found
                                </span>
                            </p>
                        </div>
                    }
                />
            </div>
            <div>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Generated 13th Month Pays
                </h4>
                <DataTable
                    columns={payColumns}
                    data={thirteenth_month_pays}
                    pagination
                    highlightOnHover
                    striped
                    responsive
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
                                    No record found
                                </span>
                            </p>
                        </div>
                    }
                />
            </div>

            <Modal
                show={showGenerateModal}
                onClose={() => setShowGenerateModal(false)}
            >
                <ModalHeader>Confirm 13th Month Pay Generation</ModalHeader>
                <ModalBody>
                    <p>
                        Are you sure you want to generate 13th Month Pay for{" "}
                        {generateAll
                            ? "all employees"
                            : `${selectedEmployees.length} selected employee(s)`}{" "}
                        for the year {formData.year}?
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="primary"
                        className="bg-red-700 hover:!bg-red-900 text-white"
                        onClick={handleGeneratePay}
                    >
                        Confirm
                    </Button>
                    <Button
                        color="gray"
                        onClick={() => setShowGenerateModal(false)}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
            >
                <ModalHeader>Confirm 13th Month Pay PDF Export</ModalHeader>
                <ModalBody>
                    <p>
                        Are you sure you want to export the 13th Month Pay
                        report for{" "}
                        {generateAll
                            ? "all employees"
                            : `${selectedEmployees.length} selected employee(s)`}{" "}
                        for the year {formData.year}?
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="primary"
                        className="bg-red-700 hover:!bg-red-900 text-white"
                        onClick={handleExportPDF}
                    >
                        Confirm
                    </Button>
                    <Button
                        color="gray"
                        onClick={() => setShowExportModal(false)}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal
                show={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
            >
                <ModalHeader>Update 13th Month Pay</ModalHeader>
                <ModalBody>
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="mb-4">
                            <Label htmlFor="basic_earnings">
                                Basic Earnings
                            </Label>
                            <TextInput
                                id="basic_earnings"
                                type="number"
                                value={updateFormData.basic_earnings}
                                onChange={(e) =>
                                    setUpdateFormData({
                                        ...updateFormData,
                                        basic_earnings: e.target.value,
                                        thirteenth_month_pay: e.target.value
                                            ? (
                                                  parseFloat(e.target.value) /
                                                  12
                                              ).toFixed(2)
                                            : "",
                                    })
                                }
                                placeholder="Enter basic earnings"
                            />
                        </div>
                        <div className="mb-4">
                            <Label htmlFor="thirteenth_month_pay">
                                13th Month Pay
                            </Label>
                            <TextInput
                                id="thirteenth_month_pay"
                                type="number"
                                value={updateFormData.thirteenth_month_pay}
                                onChange={(e) =>
                                    setUpdateFormData({
                                        ...updateFormData,
                                        thirteenth_month_pay: e.target.value,
                                    })
                                }
                                placeholder="Enter 13th month pay"
                            />
                        </div>
                        <div className="mb-4">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                id="status"
                                value={updateFormData.status}
                                onChange={(e) =>
                                    setUpdateFormData({
                                        ...updateFormData,
                                        status: e.target.value,
                                    })
                                }
                            >
                                <option value="">Select Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Paid">Paid</option>
                            </Select>
                        </div>
                        <div className="mb-4">
                            <Label htmlFor="notes">Notes</Label>
                            <TextInput
                                id="notes"
                                type="text"
                                value={updateFormData.notes}
                                onChange={(e) =>
                                    setUpdateFormData({
                                        ...updateFormData,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder="Enter notes"
                            />
                        </div>
                        <ModalFooter>
                            <Button
                                type="submit"
                                color="primary"
                                className="bg-red-700 hover:!bg-red-900 text-white"
                            >
                                Save
                            </Button>
                            <Button
                                color="gray"
                                onClick={() => setShowUpdateModal(false)}
                            >
                                Cancel
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalBody>
            </Modal>
        </DashboardLayout>
    );
};

export default ThirteenthMonthPay;
