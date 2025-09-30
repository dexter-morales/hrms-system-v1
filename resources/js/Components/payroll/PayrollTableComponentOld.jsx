import DataTable from "react-data-table-component";
import { useState, useMemo } from "react";
import { TextInput, Button, Select, Label } from "flowbite-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";

// Utility to get nested object value by dot-notation
const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
};

const PayrollTableComponent = ({
    columns,
    data = [],
    searchFields = [],
    filterField = [],
    filterOptions = {},
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterValue, setFilterValue] = useState(
        filterField.reduce((acc, field) => ({ ...acc, [field]: "" }), {})
    );
    const [perPage, setPerPage] = useState(10);

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
                padding: "8px",
            },
        },
        cells: {
            style: {
                fontSize: "12px",
                padding: "15px",
            },
        },
        rows: {
            style: {
                "&:not(:last-of-type)": {
                    borderBottomStyle: "solid",
                    borderBottomWidth: "1px",
                    borderBottomColor: "#e5e7eb",
                },
            },
        },
    };

    // Generate dynamic table name and file prefix
    const getTableName = () => {
        const siteValue = filterValue["employee.site.id"] || "";
        const payScheduleValue = filterValue["pay_schedule"] || "";

        const siteLabel =
            filterOptions["employee.site.id"]?.find(
                (opt) => opt.value === siteValue
            )?.label || "All Locations";

        const payScheduleLabel =
            filterOptions["pay_schedule"]?.find(
                (opt) => opt.value === payScheduleValue
            )?.label || "All";

        return {
            display: `Payroll Summary (${siteLabel}) - ${payScheduleLabel}`,
            filePrefix: `Payroll_Summary_${siteLabel.replace(
                /\s/g,
                "_"
            )}_${payScheduleLabel.replace(/\s/g, "_")}_${new Date()
                .toISOString()
                .slice(0, 10)}`,
        };
    };

    const filteredData = useMemo(() => {
        console.log("PayrollTable FilterOptions:", filterOptions);
        console.log("PayrollTable FilterValue:", filterValue);
        return data.filter((item) => {
            // Search filter
            const matchesSearch =
                !searchTerm ||
                searchFields.some((field) => {
                    const value = getNestedValue(item, field);
                    return (
                        value &&
                        value
                            .toString()
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    );
                });

            // Dropdown filters
            const matchesFilters = Object.entries(filterValue).every(
                ([field, value]) => {
                    if (!value || !field) return true;
                    const itemValue = getNestedValue(item, field);
                    return (
                        itemValue &&
                        itemValue.toString().toLowerCase() ===
                            value.toLowerCase()
                    );
                }
            );

            return matchesSearch && matchesFilters;
        });
    }, [data, searchTerm, searchFields, filterValue]);

    // Custom row styles based on status
    const conditionalRowStyles = [
        {
            when: (row) => row.status === "pending",
            style: {
                backgroundColor: "rgba(254, 202, 202, 0.7)", // light red
                "&:hover": {
                    backgroundColor: "rgba(252, 165, 165, 0.7)", // slightly darker red on hover
                },
            },
        },
        {
            when: (row) => row.status === "approved",
            style: {
                backgroundColor: "rgba(187, 247, 208, 0.7)", // light green
                "&:hover": {
                    backgroundColor: "rgba(134, 239, 172, 0.7)", // slightly darker green on hover
                },
            },
        },
    ];

    const combinedColumns = useMemo(() => {
        return columns.map((col) => ({
            name: col.header || col.name || "",
            cell: col.render
                ? (row, index) => col.render(row, index)
                : (row) =>
                      col.accessor
                          ? getNestedValue(row, col.accessor) ?? "-"
                          : "-",
            selector: col.selector
                ? (row) => col.selector(row)
                : col.accessor
                ? (row) => getNestedValue(row, col.accessor) ?? ""
                : (row) => "",
            sortable: col.sortable !== false,
            wrap: col.wrap ?? true,
            width: col.width,
        }));
    }, [columns]);

    const handleFilterChange = (field, value) => {
        setFilterValue((prev) => ({ ...prev, [field]: value }));
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            console.log("XLSX:", XLSX); // Debug
            const exportData = filteredData.map((row, index) => {
                const rowData = {};
                columns.forEach((col, colIndex) => {
                    if (col.header !== "Actions") {
                        rowData[col.header] = col.render
                            ? col.render(row, index)
                            : getNestedValue(row, col.accessor) ?? "-";
                    }
                });
                return rowData;
            });

            console.log("Excel Export Data:", exportData); // Debug
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

            // Generate Excel file and save with file-saver
            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(blob, `${getTableName().filePrefix}.xlsx`);
        } catch (error) {
            console.error("Excel export error:", error);
            toast.error(
                "Failed to export to Excel. Check console for details."
            );
        }
    };

    // Export to PDF
    const exportToPDF = () => {
        try {
            const doc = new jsPDF({ orientation: "landscape" });
            doc.text(getTableName().display, 14, 10);

            const tableData = filteredData.map((row, index) => {
                return columns
                    .filter((col) => col.header !== "Actions")
                    .map((col) =>
                        col.render
                            ? col.render(row, index)
                            : getNestedValue(row, col.accessor) ?? "-"
                    );
            });

            const tableHeaders = columns
                .filter((col) => col.header !== "Actions")
                .map((col) => col.header);

            autoTable(doc, {
                head: [tableHeaders],
                body: tableData,
                startY: 20,
                styles: { fontSize: 8 },
                // headStyles: { fillColor: [243, 244, 246] },
                didParseCell: (data) => {
                    // Add background color to cells based on status
                    if (data.row.raw.status === "pending") {
                        data.cell.styles.fillColor = [254, 202, 202];
                    } else if (data.row.raw.status === "approved") {
                        data.cell.styles.fillColor = [187, 247, 208];
                    }
                },
            });

            doc.save(`${getTableName().filePrefix}.pdf`);
        } catch (error) {
            console.error("PDF export error:", error);
            toast.error("Failed to export to PDF. Check console for details.");
        }
    };

    // Export to CSV
    const exportToCSV = () => {
        try {
            const headers = columns
                .filter((col) => col.header !== "Actions")
                .map((col) => col.header)
                .join(",");

            const rows = filteredData.map((row, index) =>
                columns
                    .filter((col) => col.header !== "Actions")
                    .map((col) => {
                        const value = col.render
                            ? col.render(row, index)
                            : getNestedValue(row, col.accessor) ?? "-";
                        return `"${value.toString().replace(/"/g, '""')}"`;
                    })
                    .join(",")
            );

            const csvContent = [headers, ...rows].join("\n");
            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${getTableName().filePrefix}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("CSV export error:", error);
            toast.error("Failed to export to CSV. Check console for details.");
        }
    };

    return (
        <div className="p-0 space-y-3">
            {/* Table Name */}
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {getTableName().display}
            </h3>

            {/* Controls */}
            <div className="mb-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search" value="Search" />
                    <TextInput
                        id="search"
                        placeholder="Search by name or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {filterField.includes("pay_schedule") &&
                    filterOptions["pay_schedule"]?.length > 0 && (
                        <div className="flex-1 min-w-[200px]">
                            <Label
                                htmlFor="filter-pay_schedule"
                                value="Filter by Pay Schedule"
                            />
                            <Select
                                id="filter-pay_schedule"
                                value={filterValue["pay_schedule"] || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "pay_schedule",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">All</option>
                                {filterOptions["pay_schedule"].map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    )}
                {filterField.includes("employee.site.id") &&
                    filterOptions["employee.site.id"]?.length > 0 && (
                        <div className="flex-1 min-w-[200px]">
                            <Label
                                htmlFor="filter-employee_site_id"
                                value="Filter by Site"
                            />
                            <Select
                                id="filter-employee_site_id"
                                value={filterValue["employee.site.id"] || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "employee.site.id",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">All Locations</option>
                                {filterOptions["employee.site.id"].map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    )
                                )}
                            </Select>
                        </div>
                    )}
                <div className="flex items-end gap-2">
                    <Button
                        className="bg-green-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToExcel}
                    >
                        <FontAwesomeIcon icon={faFileExcel} />
                    </Button>
                    <Button
                        className="bg-red-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToPDF}
                    >
                        <FontAwesomeIcon icon={faFilePdf} />
                    </Button>
                    {/* <Button
                        className="bg-red-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToCSV}
                    >
                        Export to CSV
                    </Button> */}
                </div>
            </div>

            {/* Data Table */}
            <div className="relative overflow-x-auto max-w-full shadow-md">
                <DataTable
                    columns={combinedColumns}
                    data={filteredData}
                    pagination
                    paginationPerPage={perPage}
                    paginationRowsPerPageOptions={[10, 25, 50]}
                    onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
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
                                        No Payroll Records Found
                                    </span>
                                </p>
                            </div>
                        </>
                    }
                    striped
                    customStyles={customStyles}
                    conditionalRowStyles={conditionalRowStyles}
                    highlightOnHover
                    dense
                    fixedHeader
                    responsive
                    fixedHeaderScrollHeight="500px"
                />
            </div>
        </div>
    );
};

export default PayrollTableComponent;
