import React, { useState } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { Button, Card, Select, Label } from "flowbite-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import TableComponent from "@/Components/TableComponent";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AllEmployeeTimesheetComponent = () => {
    const { allAttendances, flash } = usePage().props;
    console.log("usePage().props: ", usePage().props);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");

    const handleSearch = () => {
        router.get(
            route("employee-timesheet.list"),
            {
                start_date: startDate ? startDate : "",
                end_date: endDate ? endDate : "",
                month: filterMonth,
                year: filterYear,
            },
            { preserveState: true }
        );
    };

    const handleClearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setFilterMonth("");
        setFilterYear("");
        router.get(
            route("employee-timesheet.list"),
            {},
            { preserveState: true }
        );
    };

    const handleExportExcel = () => {
        try {
            console.log("Filtered Data for Export:", allAttendances);
            const exportData = allAttendances.map((row, index) => {
                return {
                    "#": index + 1,
                    "Employee Name": row.employee_name || "-",
                    Date: new Date(row.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
                    Break: row.break_hours ? `${row.break_hours} hrs` : "-",
                    Overtime: row.overtime_hours
                        ? `${row.overtime_hours} hrs`
                        : "-",
                    "Total Hours": row.total_hours
                        ? `${row.total_hours.toFixed(2)} hrs`
                        : "-",
                    Location: row.site_name || "-",
                };
            });

            console.log("Export Data:", exportData);
            if (exportData.length === 0) {
                toast.error("No data to export.");
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet([]);
            const workbook = XLSX.utils.book_new();

            // Add title row
            XLSX.utils.sheet_add_aoa(
                worksheet,
                [[`All Employee Timesheet - ${getFilterHeader()}`]],
                {
                    origin: "A2",
                }
            );

            // Add column headers
            const headers = [
                "#",
                "Employee Name",
                "Date",
                "Break",
                "Overtime",
                "Total Hours",
                "Location",
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A3" });

            // Add data
            XLSX.utils.sheet_add_json(worksheet, exportData, {
                origin: "A4",
                skipHeader: true,
            });

            // Adjust range to include title, headers, and data
            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            range.s.r = 1; // Start from title row
            range.e.r = exportData.length + 2; // End at data rows + headers
            worksheet["!ref"] = XLSX.utils.encode_range(range);

            XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet");
            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(
                blob,
                `All_Employee_Timesheet_${
                    new Date().toISOString().split("T")[0]
                }.xlsx`
            );
        } catch (error) {
            console.error("Excel export error:", error);
            toast.error(
                "Failed to export to Excel. Check console for details."
            );
        }
    };

    const handleExportPDF = () => {
        try {
            const header = `All Employee Timesheet - ${getFilterHeader()}`;
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(header, 14, 15);

            const tableData = allAttendances.map((row, index) => [
                index + 1,
                row.employee_name || "-",
                new Date(row.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                row.break_hours ? `${row.break_hours} hrs` : "-",
                row.overtime_hours ? `${row.overtime_hours} hrs` : "-",
                row.total_hours ? `${row.total_hours.toFixed(2)} hrs` : "-",
                row.site_name || "-",
            ]);

            const tableHeaders = [
                "#",
                "Employee Name",
                "Date",
                "Break",
                "Overtime",
                "Total Hours",
                "Location",
            ];

            autoTable(doc, {
                head: [tableHeaders],
                body: tableData,
                startY: 25,
                styles: { fontSize: 8 },
                // headStyles: { fillColor: [243, 244, 246] },
            });

            doc.save(
                `All_Employee_Timesheet_${
                    new Date().toISOString().split("T")[0]
                }.pdf`
            );
            toast.success("Timesheet exported to PDF successfully!");
        } catch (error) {
            console.error("PDF export error:", error);
            toast.error("Failed to export to PDF. Check console for details.");
        }
    };

    const getFilterHeader = () => {
        const dateRange =
            startDate && endDate
                ? `${new Date(startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                  })} - ${new Date(endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                  })}`
                : "";
        const month = filterMonth
            ? [
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
              ][parseInt(filterMonth) - 1]
            : "";
        const year = filterYear ? `, ${filterYear}` : "";

        return dateRange || `${month}${year}` || "All Dates";
    };

    const columns = [
        { name: "#", render: (row, index) => index + 1 },
        { name: "Employee Name", render: (row) => row.employee_name || "-" },
        {
            name: "Date",
            render: (row) =>
                new Date(row.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
        },
        {
            name: "Break",
            render: (row) => (row.break_hours ? `${row.break_hours} hrs` : "-"),
        },
        {
            name: "Overtime",
            render: (row) =>
                row.overtime_hours ? `${row.overtime_hours} hrs` : "-",
        },
        {
            name: "Total Hours",
            render: (row) =>
                row.total_hours ? `${row.total_hours.toFixed(2)} hrs` : "-",
        },
        {
            name: "Location",
            render: (row) => row.site_name || "-",
        },
    ];

    return (
        <DashboardLayout>
            <Head title="All Employee Timesheet" />
            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    All Employee Timesheet
                </h3>
                <BreadCrumbs />
            </div>
            <div className="space-y-6">
                <div className="flex flex-wrap gap-4 my-6 z-50">
                    <div className="min-w-[200px]">
                        <Label htmlFor="start_date" value="Start Date" />
                        <DatePicker
                            id="start_date"
                            selected={startDate}
                            onChange={(date) =>
                                setStartDate(date.toISOString().split("T")[0])
                            }
                            className="w-full border-gray-300 rounded-md shadow-sm"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select start date"
                        />
                    </div>
                    <div className="min-w-[200px]">
                        <Label htmlFor="end_date" value="End Date" />
                        <DatePicker
                            id="end_date"
                            selected={endDate}
                            onChange={(date) =>
                                setEndDate(date.toISOString().split("T")[0])
                            }
                            className="w-full border-gray-300 rounded-md shadow-sm"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select end date"
                        />
                    </div>
                    <div className="min-w-[200px]">
                        <Label htmlFor="filter_month" value="Month" />
                        <Select
                            id="filter_month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">Select Month</option>
                            {[
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                            ].map((month, index) => (
                                <option key={index} value={index + 1}>
                                    {month}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="min-w-[200px]">
                        <Label htmlFor="filter_year" value="Year" />
                        <Select
                            id="filter_year"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <option value="">Select Year</option>
                            {[2025, 2024, 2023, 2022, 2021].map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button color="red" onClick={handleSearch}>
                            Search
                        </Button>
                        <Button color="gray" onClick={handleClearFilters}>
                            Clear Filters
                        </Button>
                        <Button
                            className="bg-green-700 hover:bg-green-800 text-white"
                            onClick={handleExportExcel}
                        >
                            <FontAwesomeIcon icon={faFileExcel} />
                        </Button>
                        <Button
                            className="bg-red-700 hover:bg-red-800 text-white"
                            onClick={handleExportPDF}
                        >
                            <FontAwesomeIcon icon={faFilePdf} />
                        </Button>
                    </div>
                </div>

                <TableComponent
                    columns={columns}
                    data={allAttendances}
                    modalComponent={null}
                    modalProps={{}}
                    deleteModalComponent={null}
                    deleteModalProps={{}}
                    searchFields={["date", "employee_name"]}
                    filterField="month"
                    placeholder="Search by date, employee name..."
                    filterOptions={[
                        { value: "1", label: "January" },
                        { value: "2", label: "February" },
                        { value: "3", label: "March" },
                        { value: "4", label: "April" },
                        { value: "5", label: "May" },
                        { value: "6", label: "June" },
                        { value: "7", label: "July" },
                        { value: "8", label: "August" },
                        { value: "9", label: "September" },
                        { value: "10", label: "October" },
                        { value: "11", label: "November" },
                        { value: "12", label: "December" },
                    ]}
                    addButtonText={null}
                    renderActions={() => null}
                />
            </div>
        </DashboardLayout>
    );
};

export default AllEmployeeTimesheetComponent;
