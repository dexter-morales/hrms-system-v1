import React, { useState, useEffect } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Button, TextInput } from "flowbite-react";
import DataTable from "react-data-table-component";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

const LoanDeductionHistory = () => {
    const { deductions, employees, auth, errors } = usePage().props;
    const [filteredDeductions, setFilteredDeductions] = useState(deductions);
    const [myFilterText, setMyFilterText] = useState("");
    const { get, data, setData, reset } = useForm({
        search: "",
        start_date: "",
        end_date: "",
    });

    // Sync form data and myFilterText with URL parameters on initial load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get("search") || "";
        setData({
            search,
            start_date: urlParams.get("start_date") || "",
            end_date: urlParams.get("end_date") || "",
        });
        setMyFilterText(search);
    }, []);

    // Update filtered deductions when deductions or form data change
    useEffect(() => {
        let filtered = [...deductions];

        if (myFilterText) {
            const searchLower = myFilterText.toLowerCase();
            filtered = filtered.filter((deduction) => {
                const fullName =
                    `${deduction.employee.first_name} ${deduction.employee.last_name}`.toLowerCase();
                const employeeId = deduction.employee.employee_id
                    .toString()
                    .toLowerCase();
                return (
                    fullName.includes(searchLower) ||
                    employeeId.includes(searchLower)
                );
            });
        }

        if (data.start_date) {
            filtered = filtered.filter(
                (deduction) =>
                    new Date(deduction.deduction_date) >=
                    new Date(data.start_date)
            );
        }

        if (data.end_date) {
            filtered = filtered.filter(
                (deduction) =>
                    new Date(deduction.deduction_date) <=
                    new Date(data.end_date)
            );
        }

        setFilteredDeductions(filtered);
    }, [deductions, myFilterText, data.start_date, data.end_date]);

    const applyFilters = () => {
        setData("search", myFilterText);
        get("/payroll/deduction-history", {
            preserveState: true,
            preserveScroll: true,
            only: ["deductions", "employees", "auth", "errors"],
        });
    };

    const clearFilters = () => {
        setMyFilterText("");
        reset();
        get("/payroll/deduction-history", {
            preserveState: true,
            preserveScroll: true,
            only: ["deductions", "employees", "auth", "errors"],
        });
    };

    const columns = [
        {
            name: "Employee",
            selector: (row) =>
                `${row.employee.first_name} ${row.employee.last_name}`,
            sortable: true,
        },
        {
            name: "Employee ID",
            selector: (row) => row.employee.employee_id,
            sortable: true,
        },
        {
            name: "Loan Type",
            selector: (row) => row.employee_loan.loan_type,
            sortable: true,
        },
        {
            name: "Amount Deducted",
            selector: (row) => `₱${row.amount_deducted}`,
            sortable: true,
        },
        {
            name: "Deduction Date",
            selector: (row) =>
                new Date(row.deduction_date).toLocaleDateString(),
            sortable: true,
        },
        {
            name: "Pay Period",
            selector: (row) =>
                `${new Date(
                    row.payroll.pay_period_start
                ).toLocaleDateString()} - ${new Date(
                    row.payroll.pay_period_end
                ).toLocaleDateString()}`,
            sortable: true,
        },
        {
            name: "Loan Status",
            selector: (row) =>
                row.employee_loan.is_fully_paid ? "Fully Paid" : "Active",
            sortable: true,
        },
        {
            name: "Notes",
            selector: (row) => row.notes || "N/A",
            sortable: true,
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

    return (
        <DashboardLayout>
            <Head title="Loan Deduction History" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Loan Deduction History
                </h3>
                <BreadCrumbs />
            </div>
            <div className="p-0">
                <div className="mb-4 flex justify-between items-center">
                    <div className="flex gap-2 w-2/3">
                        <TextInput
                            placeholder="Search Name or Emp ID"
                            value={myFilterText}
                            onChange={(e) => setMyFilterText(e.target.value)}
                            className="w-1/3"
                        />
                        <TextInput
                            type="date"
                            value={data.start_date}
                            onChange={(e) =>
                                setData("start_date", e.target.value)
                            }
                            placeholder="Start Date"
                            className="w-1/6"
                        />
                        <TextInput
                            type="date"
                            value={data.end_date}
                            onChange={(e) =>
                                setData("end_date", e.target.value)
                            }
                            placeholder="End Date"
                            className="w-1/6"
                        />
                        <Button color="blue" onClick={applyFilters}>
                            <FontAwesomeIcon icon={faFilter} className="mr-2" />
                            Apply Filters
                        </Button>
                        <Button color="gray" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={filteredDeductions}
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
                                    No Loan Deductions
                                </span>
                            </p>
                        </div>
                    }
                />
            </div>
        </DashboardLayout>
    );
};

export default LoanDeductionHistory;
