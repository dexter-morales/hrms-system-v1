import DataTable from "react-data-table-component";
import { useState, useMemo } from "react";
import {
    TextInput,
    Button,
    Select,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from "flowbite-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFilePdf,
    faFileExcel,
    faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useAttendanceStatus } from "@/hooks/useAttendanceStatus.jsx";
import dayjs from "dayjs";

// Utility to get nested object value by dot-notation
const getNestedValue = (obj, path) => {
    return path
        ? path
              .split(".")
              .reduce(
                  (current, key) =>
                      current && current[key] !== undefined
                          ? current[key]
                          : null,
                  obj
              )
        : null;
};

const PayrollTableComponent = ({
    columns,
    data = [],
    searchFields = [],
    filterField = [],
    filterOptions = {},
    attendances = [],
    schedules = [],
    holidays = [],
    handleViewDetails,
    handleViewAttendance,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterValue, setFilterValue] = useState(
        filterField.reduce((acc, field) => ({ ...acc, [field]: "" }), {})
    );
    const [perPage, setPerPage] = useState(10);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    // Format time
    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === "N/A") return "N/A";
        const date = new Date(timeStr);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === "N/A") return "N/A";
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
        )}-${String(date.getDate()).padStart(2, "0")}`;
    };

    const customStyles = {
        headCells: {
            style: {
                fontSize: "12px",
                fontWeight: "bold",
                textAlign: "center",
                backgroundColor: "#f3f4f6",
                padding: "8px",
            },
        },
        cells: { style: { fontSize: "12px", padding: "15px" } },
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
    const getTableName = (reportType = "Payroll") => {
        const siteValue = filterValue["employee.site.id"] || "";
        const payScheduleValue = filterValue["pay_schedule"] || "";
        const payPeriodValue = filterValue["pay_period"] || "";

        const siteLabel =
            filterOptions["employee.site.id"]?.find(
                (opt) => opt.value === siteValue
            )?.label || "All Locations";
        const payScheduleLabel =
            filterOptions["pay_schedule"]?.find(
                (opt) => opt.value === payScheduleValue
            )?.label || "All";
        const payPeriodLabel =
            filterOptions["pay_period"]?.find(
                (opt) => opt.value === payPeriodValue
            )?.label || (payPeriodValue ? payPeriodValue : "All");

        return {
            display: `${reportType} Summary (${siteLabel}) - ${payScheduleLabel}`,
            filePrefix: `${reportType}_Summary_${siteLabel.replace(
                /\s/g,
                "_"
            )}_${payScheduleLabel.replace(/\s/g, "_")}_${payPeriodLabel.replace(
                /\s/g,
                "_"
            )}_${new Date().toISOString().slice(0, 10)}`,
        };
    };

    const filteredData = useMemo(() => {
        return data.filter((item) => {
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

            const matchesFilters = Object.entries(filterValue).every(
                ([field, value]) => {
                    if (!value || !field) return true;
                    const itemValue = getNestedValue(item, field);
                    if (field === "pay_period") {
                        const startDate = dayjs(item.pay_period_start);
                        const filterDate = dayjs(value);
                        return (
                            filterDate.isValid() &&
                            startDate.isSame(filterDate, "day")
                        );
                    }
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

    const conditionalRowStyles = [
        {
            when: (row) => row.status.toLowerCase() === "pending",
            style: {
                width: "100%",
                display: "flex",
                backgroundColor: "rgba(254, 202, 202, 0.7)",
                "&:hover": { backgroundColor: "rgba(252, 165, 165, 0.7)" },
            },
        },
        {
            when: (row) => row.status.toLowerCase() === "approved",
            style: {
                backgroundColor: "rgba(187, 247, 208, 0.7)",
                "&:hover": { backgroundColor: "rgba(134, 239, 172, 0.7)" },
            },
        },
    ];

    const combinedColumns = useMemo(() => {
        return [
            ...columns.map((col) => ({
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
            })),
        ];
    }, [columns]);

    const handleFilterChange = (field, value) => {
        setFilterValue((prev) => ({ ...prev, [field]: value }));
    };

    // Filter attendances based on payroll cut-off
    const filteredAttendances = useMemo(() => {
        if (!selectedPayroll) return [];
        const startDate = new Date(selectedPayroll.pay_period_start);
        const endDate = new Date(selectedPayroll.pay_period_end);
        return attendances.filter((a) => {
            const attendanceDate = new Date(a.date);
            return (
                attendanceDate >= startDate &&
                attendanceDate <= endDate &&
                a.employee_id === selectedPayroll.employee_id
            );
        });
    }, [selectedPayroll, attendances]);

    // Use attendance status hook
    const { getAttendanceStatus } = useAttendanceStatus({
        attendances,
        schedules,
        holidays,
        selectedYear: selectedPayroll?.pay_period_end
            ? new Date(selectedPayroll.pay_period_end).getFullYear()
            : new Date().getFullYear(),
        selectedMonth: selectedPayroll?.pay_period_end
            ? new Date(selectedPayroll.pay_period_end).getMonth() + 1
            : new Date().getMonth() + 1,
    });

    const exportToExcel = () => {
        try {
            const exportData = filteredData.map((row, index) => ({
                "#": index + 1,
                Employee: row.employee
                    ? `${row.employee.first_name || ""} ${
                          row.employee.last_name || ""
                      }`.trim()
                    : "-",
                Location: row.employee?.site?.name || "-",
                "Pay Period": `${formatDate(
                    row.pay_period_start
                )} - ${formatDate(row.pay_period_end)}`,
                Base: parseFloat(row.base_pay || 0),
                OT: parseFloat(row.overtime_pay || 0),
                "Sat/Sun": parseFloat(row.weekend_pay || 0),
                "ABS / Late":
                    parseFloat(row.absences_deduction || 0) +
                    parseFloat(row.late_deduction || 0),
                SSS: parseFloat(row.sss_deduction || 0),
                PhilHealth: parseFloat(row.philhealth_deduction || 0),
                "Pag-IBIG": parseFloat(row.pagibig_deduction || 0),
                "Withholding Tax": parseFloat(row.withholding_tax || 0),
                "Gross Pay": parseFloat(row.gross_pay || 0),
                "Net Pay": parseFloat(row.net_pay || 0),
            }));

            if (exportData.length === 0) {
                toast.error("No data to export.");
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet([]);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.sheet_add_aoa(worksheet, [[getTableName().display]], {
                origin: "A2",
            });

            const headers = [
                "#",
                "Employee",
                "Location",
                "Pay Period",
                "Base",
                "OT",
                "Sat/Sun",
                "ABS / Late",
                "SSS",
                "PhilHealth",
                "Pag-IBIG",
                "Withholding Tax",
                "Gross Pay",
                "Net Pay",
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A3" });

            XLSX.utils.sheet_add_json(worksheet, exportData, {
                origin: "A4",
                skipHeader: true,
            });

            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            range.s.r = 1;
            range.e.r = exportData.length + 2;
            worksheet["!ref"] = XLSX.utils.encode_range(range);

            XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
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

    const exportToExcelPerDepartment = () => {
        try {
            console.log("Filtered Data:", filteredData); // Debug log
            const groupedData = filteredData.reduce((acc, row) => {
                const department =
                    row.employee?.department?.name || "Unassigned";
                const location = row.employee?.site?.name || "Unknown";
                const key = `${department}|${location}`;
                if (!acc[key]) {
                    acc[key] = {
                        department,
                        location,
                        pay_period: filterValue["pay_period"]
                            ? `${formatDate(
                                  filterValue["pay_period"]
                              )} - ${formatDate(
                                  new Date(
                                      new Date(
                                          filterValue["pay_period"]
                                      ).setDate(
                                          new Date(
                                              filterValue["pay_period"]
                                          ).getDate() + 14
                                      )
                                  )
                              )}`
                            : `${formatDate(
                                  row.pay_period_start
                              )} - ${formatDate(row.pay_period_end)}`,
                        base_pay: 0,
                        overtime_pay: 0,
                        weekend_pay: 0,
                        absences_deduction: 0,
                        late_deduction: 0,
                        sss_deduction: 0,
                        philhealth_deduction: 0,
                        pagibig_deduction: 0,
                        withholding_tax: 0,
                        gross_pay: 0,
                        net_pay: 0,
                    };
                }
                acc[key].base_pay += parseFloat(row.base_pay || 0);
                acc[key].overtime_pay += parseFloat(row.overtime_pay || 0);
                acc[key].weekend_pay += parseFloat(row.weekend_pay || 0);
                acc[key].absences_deduction += parseFloat(
                    row.absences_deduction || 0
                );
                acc[key].late_deduction += parseFloat(row.late_deduction || 0);
                acc[key].sss_deduction += parseFloat(row.sss_deduction || 0);
                acc[key].philhealth_deduction += parseFloat(
                    row.philhealth_deduction || 0
                );
                acc[key].pagibig_deduction += parseFloat(
                    row.pagibig_deduction || 0
                );
                acc[key].withholding_tax += parseFloat(
                    row.withholding_tax || 0
                );
                acc[key].gross_pay += parseFloat(row.gross_pay || 0);
                acc[key].net_pay += parseFloat(row.net_pay || 0);
                return acc;
            }, {});

            console.log("Grouped Data:", groupedData); // Debug log
            const exportData = Object.values(groupedData).map((totals) => ({
                Department: totals.department,
                Location: totals.location,
                "Pay Period": totals.pay_period,
                OT: totals.overtime_pay,
                "Sat/Sun": totals.weekend_pay,
                "ABS / Late": totals.absences_deduction + totals.late_deduction,
                SSS: totals.sss_deduction,
                PhilHealth: totals.philhealth_deduction,
                "Pag-IBIG": totals.pagibig_deduction,
                "Withholding Tax": totals.withholding_tax,
                "Gross Pay": totals.gross_pay,
                "Net Pay": totals.net_pay,
            }));

            if (exportData.length === 0) {
                toast.error("No data to export for Per Department report.");
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet([]);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.sheet_add_aoa(
                worksheet,
                [[getTableName("Per Department").display]],
                { origin: "A2" }
            );

            const headers = [
                "Department",
                "Location",
                "Pay Period",
                "OT",
                "Sat/Sun",
                "ABS / Late",
                "SSS",
                "PhilHealth",
                "Pag-IBIG",
                "Withholding Tax",
                "Gross Pay",
                "Net Pay",
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A3" });

            XLSX.utils.sheet_add_json(worksheet, exportData, {
                origin: "A4",
                skipHeader: true,
            });

            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            range.s.r = 1;
            range.e.r = exportData.length + 2;
            worksheet["!ref"] = XLSX.utils.encode_range(range);

            XLSX.utils.book_append_sheet(workbook, worksheet, "Per Department");
            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(blob, `${getTableName("Per Department").filePrefix}.xlsx`);
        } catch (error) {
            console.error("Per Department Excel export error:", error);
            toast.error(
                "Failed to export Per Department to Excel. Check console for details."
            );
        }
    };

    const exportToExcelPerLocationTotal = () => {
        try {
            console.log("Filtered Data:", filteredData); // Debug log
            const groupedData = filteredData.reduce((acc, row) => {
                const location = row.employee?.site?.name || "Unknown";
                if (!acc[location]) {
                    acc[location] = {
                        base_pay: 0,
                        overtime_pay: 0,
                        weekend_pay: 0,
                        absences_deduction: 0,
                        late_deduction: 0,
                        sss_deduction: 0,
                        philhealth_deduction: 0,
                        pagibig_deduction: 0,
                        withholding_tax: 0,
                        gross_pay: 0,
                        net_pay: 0,
                        pay_period: filterValue["pay_period"]
                            ? `${formatDate(
                                  filterValue["pay_period"]
                              )} - ${formatDate(
                                  new Date(
                                      new Date(
                                          filterValue["pay_period"]
                                      ).setDate(
                                          new Date(
                                              filterValue["pay_period"]
                                          ).getDate() + 14
                                      )
                                  )
                              )}`
                            : `${formatDate(
                                  row.pay_period_start
                              )} - ${formatDate(row.pay_period_end)}`,
                    };
                }
                acc[location].base_pay += parseFloat(row.base_pay || 0);
                acc[location].overtime_pay += parseFloat(row.overtime_pay || 0);
                acc[location].weekend_pay += parseFloat(row.weekend_pay || 0);
                acc[location].absences_deduction += parseFloat(
                    row.absences_deduction || 0
                );
                acc[location].late_deduction += parseFloat(
                    row.late_deduction || 0
                );
                acc[location].sss_deduction += parseFloat(
                    row.sss_deduction || 0
                );
                acc[location].philhealth_deduction += parseFloat(
                    row.philhealth_deduction || 0
                );
                acc[location].pagibig_deduction += parseFloat(
                    row.pagibig_deduction || 0
                );
                acc[location].withholding_tax += parseFloat(
                    row.withholding_tax || 0
                );
                acc[location].gross_pay += parseFloat(row.gross_pay || 0);
                acc[location].net_pay += parseFloat(row.net_pay || 0);
                return acc;
            }, {});

            console.log("Grouped Data:", groupedData); // Debug log
            const exportData = Object.entries(groupedData).map(
                ([location, totals], index) => ({
                    "#": index + 1,
                    Location: location,
                    "Pay Period": totals.pay_period,
                    OT: totals.overtime_pay,
                    "Sat/Sun": totals.weekend_pay,
                    "ABS / Late":
                        totals.absences_deduction + totals.late_deduction,
                    SSS: totals.sss_deduction,
                    PhilHealth: totals.philhealth_deduction,
                    "Pag-IBIG": totals.pagibig_deduction,
                    "Withholding Tax": totals.withholding_tax,
                    "Gross Pay": totals.gross_pay,
                    "Net Pay": totals.net_pay,
                })
            );

            if (exportData.length === 0) {
                toast.error("No data to export for Per Location Total report.");
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet([]);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.sheet_add_aoa(
                worksheet,
                [[getTableName("Per Location Total").display]],
                { origin: "A2" }
            );

            const headers = [
                "#",
                "Location",
                "Pay Period",
                "OT",
                "Sat/Sun",
                "ABS / Late",
                "SSS",
                "PhilHealth",
                "Pag-IBIG",
                "Withholding Tax",
                "Gross Pay",
                "Net Pay",
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A3" });

            XLSX.utils.sheet_add_json(worksheet, exportData, {
                origin: "A4",
                skipHeader: true,
            });

            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            range.s.r = 1;
            range.e.r = exportData.length + 2;
            worksheet["!ref"] = XLSX.utils.encode_range(range);

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Per Location Total"
            );
            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(
                blob,
                `${getTableName("Per Location Total").filePrefix}.xlsx`
            );
        } catch (error) {
            console.error("Per Location Total Excel export error:", error);
            toast.error(
                "Failed to export Per Location Total to Excel. Check console for details."
            );
        }
    };

    const exportToExcelPerLocation = () => {
        try {
            console.log("Filtered Data:", filteredData); // Debug log
            const groupedData = filteredData.reduce((acc, row) => {
                const location = row.employee?.site?.name || "Unknown";
                if (!acc[location]) {
                    acc[location] = [];
                }
                acc[location].push(row);
                return acc;
            }, {});

            const workbook = XLSX.utils.book_new();
            let hasData = false;

            Object.entries(groupedData).forEach(([location, rows]) => {
                const exportData = rows.map((row, index) => ({
                    "#": index + 1,
                    Location: location,
                    "Pay Period": `${formatDate(
                        row.pay_period_start
                    )} - ${formatDate(row.pay_period_end)}`,
                    Base: parseFloat(row.base_pay || 0),
                    OT: parseFloat(row.overtime_pay || 0),
                    "Sat/Sun": parseFloat(row.weekend_pay || 0),
                    "ABS / Late":
                        parseFloat(row.absences_deduction || 0) +
                        parseFloat(row.late_deduction || 0),
                    SSS: parseFloat(row.sss_deduction || 0),
                    PhilHealth: parseFloat(row.philhealth_deduction || 0),
                    "Pag-IBIG": parseFloat(row.pagibig_deduction || 0),
                    "Withholding Tax": parseFloat(row.withholding_tax || 0),
                    "Gross Pay": parseFloat(row.gross_pay || 0),
                    "Net Pay": parseFloat(row.net_pay || 0),
                }));

                if (exportData.length > 0) {
                    hasData = true;
                    const worksheet = XLSX.utils.json_to_sheet([]);
                    XLSX.utils.sheet_add_aoa(
                        worksheet,
                        [[getTableName("Per Location").display]],
                        { origin: "A2" }
                    );

                    const headers = [
                        "#",
                        "Location",
                        "Pay Period",
                        "Base",
                        "OT",
                        "Sat/Sun",
                        "ABS / Late",
                        "SSS",
                        "PhilHealth",
                        "Pag-IBIG",
                        "Withholding Tax",
                        "Gross Pay",
                        "Net Pay",
                    ];
                    XLSX.utils.sheet_add_aoa(worksheet, [headers], {
                        origin: "A3",
                    });

                    XLSX.utils.sheet_add_json(worksheet, exportData, {
                        origin: "A4",
                        skipHeader: true,
                    });

                    const range = XLSX.utils.decode_range(worksheet["!ref"]);
                    range.s.r = 1;
                    range.e.r = exportData.length + 2;
                    worksheet["!ref"] = XLSX.utils.encode_range(range);

                    XLSX.utils.book_append_sheet(
                        workbook,
                        worksheet,
                        location.slice(0, 31)
                    );
                }
            });

            if (!hasData) {
                toast.error("No data to export for Per Location report.");
                return;
            }

            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(blob, `${getTableName("Per Location").filePrefix}.xlsx`);
        } catch (error) {
            console.error("Per Location Excel export error:", error);
            toast.error(
                "Failed to export Per Location to Excel. Check console for details."
            );
        }
    };

    const exportToExcelPerLocationTotalMultiSheet = () => {
        try {
            console.log("Filtered Data:", filteredData); // Debug log
            const groupedData = filteredData.reduce((acc, row) => {
                const location = row.employee?.site?.name || "Unknown";
                if (!acc[location]) {
                    acc[location] = {
                        base_pay: 0,
                        overtime_pay: 0,
                        weekend_pay: 0,
                        absences_deduction: 0,
                        late_deduction: 0,
                        sss_deduction: 0,
                        philhealth_deduction: 0,
                        pagibig_deduction: 0,
                        withholding_tax: 0,
                        gross_pay: 0,
                        net_pay: 0,
                        pay_period: filterValue["pay_period"]
                            ? `${formatDate(
                                  filterValue["pay_period"]
                              )} - ${formatDate(
                                  new Date(
                                      new Date(
                                          filterValue["pay_period"]
                                      ).setDate(
                                          new Date(
                                              filterValue["pay_period"]
                                          ).getDate() + 14
                                      )
                                  )
                              )}`
                            : `${formatDate(
                                  row.pay_period_start
                              )} - ${formatDate(row.pay_period_end)}`,
                    };
                }
                acc[location].base_pay += parseFloat(row.base_pay || 0);
                acc[location].overtime_pay += parseFloat(row.overtime_pay || 0);
                acc[location].weekend_pay += parseFloat(row.weekend_pay || 0);
                acc[location].absences_deduction += parseFloat(
                    row.absences_deduction || 0
                );
                acc[location].late_deduction += parseFloat(
                    row.late_deduction || 0
                );
                acc[location].sss_deduction += parseFloat(
                    row.sss_deduction || 0
                );
                acc[location].philhealth_deduction += parseFloat(
                    row.philhealth_deduction || 0
                );
                acc[location].pagibig_deduction += parseFloat(
                    row.pagibig_deduction || 0
                );
                acc[location].withholding_tax += parseFloat(
                    row.withholding_tax || 0
                );
                acc[location].gross_pay += parseFloat(row.gross_pay || 0);
                acc[location].net_pay += parseFloat(row.net_pay || 0);
                return acc;
            }, {});

            console.log("Grouped Data:", groupedData); // Debug log
            const workbook = XLSX.utils.book_new();
            let hasData = false;

            Object.entries(groupedData).forEach(([location, totals]) => {
                const exportData = [
                    {
                        "#": 1,
                        Location: location,
                        "Pay Period": totals.pay_period,
                        OT: totals.overtime_pay,
                        "Sat/Sun": totals.weekend_pay,
                        "ABS / Late":
                            totals.absences_deduction + totals.late_deduction,
                        SSS: totals.sss_deduction,
                        PhilHealth: totals.philhealth_deduction,
                        "Pag-IBIG": totals.pagibig_deduction,
                        "Withholding Tax": totals.withholding_tax,
                        "Gross Pay": totals.gross_pay,
                        "Net Pay": totals.net_pay,
                    },
                ];

                if (exportData.length > 0) {
                    hasData = true;
                    const worksheet = XLSX.utils.json_to_sheet([]);
                    XLSX.utils.sheet_add_aoa(
                        worksheet,
                        [[getTableName("Per Location Total").display]],
                        { origin: "A2" }
                    );

                    const headers = [
                        "#",
                        "Location",
                        "Pay Period",
                        "OT",
                        "Sat/Sun",
                        "ABS / Late",
                        "SSS",
                        "PhilHealth",
                        "Pag-IBIG",
                        "Withholding Tax",
                        "Gross Pay",
                        "Net Pay",
                    ];
                    XLSX.utils.sheet_add_aoa(worksheet, [headers], {
                        origin: "A3",
                    });

                    XLSX.utils.sheet_add_json(worksheet, exportData, {
                        origin: "A4",
                        skipHeader: true,
                    });

                    const range = XLSX.utils.decode_range(worksheet["!ref"]);
                    range.s.r = 1;
                    range.e.r = exportData.length + 2;
                    worksheet["!ref"] = XLSX.utils.encode_range(range);

                    XLSX.utils.book_append_sheet(
                        workbook,
                        worksheet,
                        location.slice(0, 31)
                    );
                }
            });

            if (!hasData) {
                toast.error(
                    "No data to export for Per Location Total Multi-Sheet report."
                );
                return;
            }

            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(
                blob,
                `${
                    getTableName("Per Location Total").filePrefix
                }_MultiSheet.xlsx`
            );
        } catch (error) {
            console.error(
                "Per Location Total Multi-Sheet Excel export error:",
                error
            );
            toast.error(
                "Failed to export Per Location Total Multi-Sheet to Excel. Check console for details."
            );
        }
    };

    const exportToExcelPerDepartmentMultiSheet = () => {
        try {
            console.log("Filtered Data:", filteredData); // Debug log
            const groupedData = filteredData.reduce((acc, row) => {
                const department =
                    row.employee?.department?.name || "Unassigned";
                if (!acc[department]) {
                    acc[department] = {
                        department,
                        location: row.employee?.site?.name || "Unknown",
                        pay_period: filterValue["pay_period"]
                            ? `${formatDate(
                                  filterValue["pay_period"]
                              )} - ${formatDate(
                                  new Date(
                                      new Date(
                                          filterValue["pay_period"]
                                      ).setDate(
                                          new Date(
                                              filterValue["pay_period"]
                                          ).getDate() + 14
                                      )
                                  )
                              )}`
                            : `${formatDate(
                                  row.pay_period_start
                              )} - ${formatDate(row.pay_period_end)}`,
                        base_pay: 0,
                        overtime_pay: 0,
                        weekend_pay: 0,
                        absences_deduction: 0,
                        late_deduction: 0,
                        sss_deduction: 0,
                        philhealth_deduction: 0,
                        pagibig_deduction: 0,
                        withholding_tax: 0,
                        gross_pay: 0,
                        net_pay: 0,
                    };
                }
                acc[department].base_pay += parseFloat(row.base_pay || 0);
                acc[department].overtime_pay += parseFloat(
                    row.overtime_pay || 0
                );
                acc[department].weekend_pay += parseFloat(row.weekend_pay || 0);
                acc[department].absences_deduction += parseFloat(
                    row.absences_deduction || 0
                );
                acc[department].late_deduction += parseFloat(
                    row.late_deduction || 0
                );
                acc[department].sss_deduction += parseFloat(
                    row.sss_deduction || 0
                );
                acc[department].philhealth_deduction += parseFloat(
                    row.philhealth_deduction || 0
                );
                acc[department].pagibig_deduction += parseFloat(
                    row.pagibig_deduction || 0
                );
                acc[department].withholding_tax += parseFloat(
                    row.withholding_tax || 0
                );
                acc[department].gross_pay += parseFloat(row.gross_pay || 0);
                acc[department].net_pay += parseFloat(row.net_pay || 0);
                return acc;
            }, {});

            console.log("Grouped Data:", groupedData); // Debug log
            const workbook = XLSX.utils.book_new();
            let hasData = false;

            Object.entries(groupedData).forEach(([department, totals]) => {
                const exportData = [
                    {
                        "#": 1,
                        Department: department,
                        Location: totals.location,
                        "Pay Period": totals.pay_period,
                        OT: totals.overtime_pay,
                        "Sat/Sun": totals.weekend_pay,
                        "ABS / Late":
                            totals.absences_deduction + totals.late_deduction,
                        SSS: totals.sss_deduction,
                        PhilHealth: totals.philhealth_deduction,
                        "Pag-IBIG": totals.pagibig_deduction,
                        "Withholding Tax": totals.withholding_tax,
                        "Gross Pay": totals.gross_pay,
                        "Net Pay": totals.net_pay,
                    },
                ];

                if (exportData.length > 0) {
                    hasData = true;
                    const worksheet = XLSX.utils.json_to_sheet([]);
                    XLSX.utils.sheet_add_aoa(
                        worksheet,
                        [[getTableName("Per Department").display]],
                        { origin: "A2" }
                    );

                    const headers = [
                        "#",
                        "Department",
                        "Location",
                        "Pay Period",
                        "OT",
                        "Sat/Sun",
                        "ABS / Late",
                        "SSS",
                        "PhilHealth",
                        "Pag-IBIG",
                        "Withholding Tax",
                        "Gross Pay",
                        "Net Pay",
                    ];
                    XLSX.utils.sheet_add_aoa(worksheet, [headers], {
                        origin: "A3",
                    });

                    XLSX.utils.sheet_add_json(worksheet, exportData, {
                        origin: "A4",
                        skipHeader: true,
                    });

                    const range = XLSX.utils.decode_range(worksheet["!ref"]);
                    range.s.r = 1;
                    range.e.r = exportData.length + 2;
                    worksheet["!ref"] = XLSX.utils.encode_range(range);

                    XLSX.utils.book_append_sheet(
                        workbook,
                        worksheet,
                        department.slice(0, 31)
                    );
                }
            });

            if (!hasData) {
                toast.error(
                    "No data to export for Per Department Multi-Sheet report."
                );
                return;
            }

            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(
                blob,
                `${getTableName("Per Department").filePrefix}_MultiSheet.xlsx`
            );
        } catch (error) {
            console.error(
                "Per Department Multi-Sheet Excel export error:",
                error
            );
            toast.error(
                "Failed to export Per Department Multi-Sheet to Excel. Check console for details."
            );
        }
    };

    const exportToExcel_2 = () => {
        try {
            const exportData = filteredData.map((row, index) => ({
                "#": index + 1,
                Employee: row.employee
                    ? `${row.employee.first_name || ""} ${
                          row.employee.last_name || ""
                      }`.trim()
                    : "-",
                Location: row.employee?.site?.name || "-",
                "Pay Period": `${formatDate(
                    row.pay_period_start
                )} - ${formatDate(row.pay_period_end)}`,
                Base: parseFloat(row.base_pay || 0),
                OT: parseFloat(row.overtime_pay || 0),
                "Sat/Sun": parseFloat(row.weekend_pay || 0),
                "ABS / Late":
                    parseFloat(row.absences_deduction || 0) +
                    parseFloat(row.late_deduction || 0),
                SSS: parseFloat(row.sss_deduction || 0),
                PhilHealth: parseFloat(row.philhealth_deduction || 0),
                "Pag-IBIG": parseFloat(row.pagibig_deduction || 0),
                "Withholding Tax": parseFloat(row.withholding_tax || 0),
            }));

            if (exportData.length === 0) {
                toast.error("No data to export.");
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet([]);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.sheet_add_aoa(worksheet, [[getTableName().display]], {
                origin: "A2",
            });

            const headers = [
                "#",
                "Employee",
                "Location",
                "Pay Period",
                "Base",
                "OT",
                "Sat/Sun",
                "ABS / Late",
                "SSS",
                "PhilHealth",
                "Pag-IBIG",
                "Withholding Tax",
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A3" });

            XLSX.utils.sheet_add_json(worksheet, exportData, {
                origin: "A4",
                skipHeader: true,
            });

            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            range.s.r = 1;
            range.e.r = exportData.length + 2;
            worksheet["!ref"] = XLSX.utils.encode_range(range);

            XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            saveAs(blob, `${getTableName().filePrefix}_no_amount.xlsx`);
        } catch (error) {
            console.error("Excel export error:", error);
            toast.error(
                "Failed to export to Excel. Check console for details."
            );
        }
    };

    const exportToPDF = () => {
        try {
            const tableData = filteredData.map((row, index) => [
                index + 1,
                row.employee
                    ? `${row.employee.first_name || ""} ${
                          row.employee.last_name || ""
                      }`.trim()
                    : "-",
                row.employee?.site?.name || "-",
                `${formatDate(row.pay_period_start)} - ${formatDate(
                    row.pay_period_end
                )}`,
                parseFloat(row.base_pay || 0),
                parseFloat(row.overtime_pay || 0),
                parseFloat(row.weekend_pay || 0),
                parseFloat(row.absences_deduction || 0) +
                    parseFloat(row.late_deduction || 0),
                parseFloat(row.sss_deduction || 0),
                parseFloat(row.philhealth_deduction || 0),
                parseFloat(row.pagibig_deduction || 0),
                parseFloat(row.withholding_tax || 0),
                parseFloat(row.gross_pay || 0),
                parseFloat(row.net_pay || 0),
            ]);

            if (tableData.length === 0) {
                toast.error("No data to export.");
                return;
            }

            const doc = new jsPDF({ orientation: "landscape" });
            const headerText = getTableName().display;
            doc.setFontSize(16);
            doc.text(headerText, 14, 15, { align: "left" });
            doc.setFontSize(12);
            doc.setTextColor(100);

            const tableHeaders = [
                "#",
                "Employee",
                "Location",
                "Pay Period",
                "Base",
                "OT",
                "Sat/Sun",
                "ABS / Late",
                "SSS",
                "PhilHealth",
                "Pag-IBIG",
                "Withholding Tax",
                "Gross Pay",
                "Net Pay",
            ];

            autoTable(doc, {
                head: [tableHeaders],
                body: tableData,
                startY: 25,
                styles: { fontSize: 8 },
            });

            doc.save(`${getTableName().filePrefix}.pdf`);
        } catch (error) {
            console.error("PDF export error:", error);
            toast.error("Failed to export to PDF. Check console for details.");
        }
    };

    const exportToCSV = () => {
        try {
            const headers = [
                "#",
                "Employee",
                "Location",
                "Pay Period",
                "Base",
                "OT",
                "Sat/Sun",
                "ABS / Late",
                "SSS",
                "PhilHealth",
                "Pag-IBIG",
                "Withholding Tax",
                "Gross Pay",
                "Net Pay",
            ].join(",");
            const rows = filteredData.map((row, index) =>
                [
                    index + 1,
                    row.employee
                        ? `${row.employee.first_name || ""} ${
                              row.employee.last_name || ""
                          }`.trim()
                        : "-",
                    row.employee?.site?.name || "-",
                    `${formatDate(row.pay_period_start)} - ${formatDate(
                        row.pay_period_end
                    )}`,
                    parseFloat(row.base_pay || 0),
                    parseFloat(row.overtime_pay || 0),
                    parseFloat(row.weekend_pay || 0),
                    parseFloat(row.absences_deduction || 0) +
                        parseFloat(row.late_deduction || 0),
                    parseFloat(row.sss_deduction || 0),
                    parseFloat(row.philhealth_deduction || 0),
                    parseFloat(row.pagibig_deduction || 0),
                    parseFloat(row.withholding_tax || 0),
                    parseFloat(row.gross_pay || 0),
                    parseFloat(row.net_pay || 0),
                ]
                    .map((value) => `"${value.toString().replace(/"/g, '""')}"`)
                    .join(",")
            );

            if (rows.length === 0) {
                toast.error("No data to export.");
                return;
            }

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
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {getTableName().display}
            </h3>
            <div className="mb-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search" value="Search" />
                    <TextInput
                        id="search"
                        placeholder="Search by name or employee IDs..."
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
                                <option value="">All Payroll Type</option>
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
                {filterField.includes("pay_period") &&
                    filterOptions["pay_period"]?.length > 0 && (
                        <div className="flex-1 min-w-[200px]">
                            <Label
                                htmlFor="filter-pay_period"
                                value="Filter by Pay Period"
                            />
                            <Select
                                id="filter-pay_period"
                                value={filterValue["pay_period"] || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "pay_period",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">All Pay Period</option>
                                {filterOptions["pay_period"].map((option) => (
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
                        className="bg-green-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToExcel_2}
                    >
                        <span>
                            <FontAwesomeIcon icon={faFileExcel} /> w/o amount
                        </span>
                    </Button>
                    <Button
                        className="bg-green-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToExcelPerDepartment}
                    >
                        <span>
                            <FontAwesomeIcon icon={faFileExcel} /> Per
                            Department
                        </span>
                    </Button>
                    <Button
                        className="bg-green-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToExcelPerLocationTotal}
                    >
                        <span>
                            <FontAwesomeIcon icon={faFileExcel} /> Per Location
                            Total
                        </span>
                    </Button>
                    <Button
                        className="bg-green-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToExcelPerLocationTotalMultiSheet}
                    >
                        <span>
                            <FontAwesomeIcon icon={faFileExcel} /> Per Location
                            Total (Sheets)
                        </span>
                    </Button>
                    <Button
                        className="bg-green-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToExcelPerDepartmentMultiSheet}
                    >
                        <span>
                            <FontAwesomeIcon icon={faFileExcel} /> Per
                            Department (Sheets)
                        </span>
                    </Button>
                    <Button
                        className="bg-red-700 hover:!bg-red-900 text-white font-semibold"
                        size="sm"
                        onClick={exportToPDF}
                    >
                        <FontAwesomeIcon icon={faFilePdf} />
                    </Button>
                </div>
            </div>
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

            <Modal
                show={showAttendanceModal}
                onClose={() => setShowAttendanceModal(false)}
                popup
                size="2xl"
            >
                <ModalHeader />
                <ModalBody>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Attendance Details for Payroll Period:{" "}
                        {formatDate(selectedPayroll?.pay_period_start)} to{" "}
                        {formatDate(selectedPayroll?.pay_period_end)}
                    </h3>
                    <DataTable
                        columns={[
                            {
                                name: "Day",
                                selector: (row) => new Date(row.date).getDate(),
                                sortable: true,
                                width: "80px",
                            },
                            {
                                name: "Date",
                                selector: (row) => row.date,
                                sortable: true,
                                width: "120px",
                            },
                            {
                                name: "Punch In",
                                selector: (row) =>
                                    formatTime(row.punch_in) || "N/A",
                                sortable: true,
                                width: "120px",
                            },
                            {
                                name: "Punch Out",
                                selector: (row) =>
                                    formatTime(row.punch_out) || "N/A",
                                sortable: true,
                                width: "120px",
                            },
                            {
                                name: "Status",
                                cell: (row) => (
                                    <div className="flex items-center gap-2">
                                        {
                                            getAttendanceStatus(
                                                {
                                                    id: selectedPayroll.employee_id,
                                                },
                                                new Date(row.date).getDate()
                                            ).icon
                                        }
                                        <span>
                                            {
                                                getAttendanceStatus(
                                                    {
                                                        id: selectedPayroll.employee_id,
                                                    },
                                                    new Date(row.date).getDate()
                                                ).status
                                            }
                                        </span>
                                    </div>
                                ),
                                sortable: true,
                                width: "150px",
                            },
                        ]}
                        data={filteredAttendances}
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
                                            No attendance records found for this
                                            period
                                        </span>
                                    </p>
                                </div>
                            </>
                        }
                        striped
                        responsive
                        highlightOnHover
                    />
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="gray"
                        onClick={() => setShowAttendanceModal(false)}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default PayrollTableComponent;
