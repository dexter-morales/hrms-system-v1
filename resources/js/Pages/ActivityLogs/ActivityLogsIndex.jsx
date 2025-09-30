import React, { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import DataTable from "react-data-table-component";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { formatDistanceToNow } from "date-fns";
import { TextInput, Label, Button, Select } from "flowbite-react";
import { handleExport } from "@/utils/exportHelper"; // Adjust path as needed
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";

export default function ActivityLogsIndex() {
    const { activityLogs } = usePage().props;
    const [searchTerm, setSearchTerm] = useState("");
    const [logNameFilter, setLogNameFilter] = useState("");
    const [descriptionFilter, setDescriptionFilter] = useState("");

    console.log("Activity Logs:", activityLogs);

    // Handle page change with Inertia
    const handlePageChange = (page) => {
        window.location.href = `?page=${page}`;
    };

    // Get unique log names and descriptions
    const uniqueLogNames = [
        ...new Set(activityLogs.map((log) => log.log_name).filter(Boolean)),
    ];
    const uniqueDescriptions = [
        ...new Set(activityLogs.map((log) => log.description).filter(Boolean)),
    ];

    // Columns for DataTable
    const columns = [
        {
            name: "Log Name",
            selector: (row) => row.log_name,
            sortable: true,
            cell: (row) => row.log_name || "-",
        },
        {
            name: "Description",
            selector: (row) => row.description,
            sortable: true,
            cell: (row) => row.description || "-",
        },
        {
            name: "Causer",
            selector: (row) =>
                row.causer?.employee?.first_name +
                    " " +
                    row.causer?.employee?.last_name || "System",
            sortable: true,
            cell: (row) =>
                row.causer?.employee?.first_name +
                    " " +
                    row.causer?.employee?.last_name || "System",
        },
        {
            name: "Changes",
            cell: (row) => (
                <div className="text-xs text-gray-700 space-y-1">
                    {row.properties?.attributes || row.properties?.old ? (
                        <>
                            {row.properties?.attributes &&
                                Object.entries(row.properties.attributes).map(
                                    ([key, value]) => {
                                        const oldValue =
                                            row.properties.old?.[key];
                                        if (
                                            oldValue !== undefined &&
                                            oldValue !== value
                                        ) {
                                            return (
                                                <div key={key}>
                                                    <strong className="capitalize">
                                                        {key.replace(/_/g, " ")}
                                                        :
                                                    </strong>{" "}
                                                    <span className="text-red-500 line-through">
                                                        {oldValue}
                                                    </span>{" "}
                                                    →{" "}
                                                    <span className="text-green-600">
                                                        {value}
                                                    </span>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={key}>
                                                    <strong className="capitalize">
                                                        {key.replace(/_/g, " ")}
                                                        :
                                                    </strong>{" "}
                                                    {value}
                                                </div>
                                            );
                                        }
                                    }
                                )}

                            {!row.properties?.attributes &&
                                row.properties?.old &&
                                Object.entries(row.properties.old).map(
                                    ([key, value]) => (
                                        <div key={key}>
                                            <strong className="capitalize">
                                                {key.replace(/_/g, " ")}:
                                            </strong>{" "}
                                            <span className="text-red-500">
                                                {value?.toString() ?? "—"}
                                            </span>
                                        </div>
                                    )
                                )}
                        </>
                    ) : (
                        <span>No changes recorded</span>
                    )}
                </div>
            ),
            sortable: false,
        },
        {
            name: "Date",
            selector: (row) =>
                formatDistanceToNow(new Date(row.created_at), {
                    addSuffix: true,
                }),
            sortable: true,
            cell: (row) =>
                formatDistanceToNow(new Date(row.created_at), {
                    addSuffix: true,
                }),
        },
    ];

    // Custom styles for DataTable
    const customStyles = {
        table: { style: { width: "100%", minWidth: "100%" } },
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

    // Filter logs based on search term, log name, and description filter
    const filteredLogs = activityLogs.filter(
        (log) =>
            (log.log_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (log.causer?.name || "System")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (log.properties?.attributes
                    ? Object.values(log.properties.attributes)
                          .join(" ")
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    : log.properties?.old
                    ? Object.values(log.properties.old)
                          .join(" ")
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    : ""
                ).includes(searchTerm.toLowerCase())) &&
            (!logNameFilter || log.log_name === logNameFilter) &&
            (!descriptionFilter || log.description === descriptionFilter)
    );

    return (
        <DashboardLayout>
            <Head title="Activity Logs" />
            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Activity Logs
                </h3>
                <BreadCrumbs />
            </div>
            <div className="space-y-6">
                <div className="mb-4 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="search" value="Search" />
                        <TextInput
                            id="search"
                            placeholder="Search by log name, description, causer, or changes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Label
                            htmlFor="logNameFilter"
                            value="Filter by Log Name"
                        />
                        <Select
                            id="logNameFilter"
                            value={logNameFilter}
                            onChange={(e) => setLogNameFilter(e.target.value)}
                        >
                            <option value="">All Log Names</option>
                            {uniqueLogNames.map((logName) => (
                                <option key={logName} value={logName}>
                                    {logName}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Label
                            htmlFor="descriptionFilter"
                            value="Filter by Description"
                        />
                        <Select
                            id="descriptionFilter"
                            value={descriptionFilter}
                            onChange={(e) =>
                                setDescriptionFilter(e.target.value)
                            }
                        >
                            <option value="">All Descriptions</option>
                            {uniqueDescriptions.map((description) => (
                                <option key={description} value={description}>
                                    {description}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex flex-row gap-2">
                        <Button
                            color="green"
                            onClick={() =>
                                handleExport(
                                    filteredLogs,
                                    "excel",
                                    [
                                        "Log Name",
                                        "Description",
                                        "Causer",
                                        "Date",
                                        "Changes",
                                    ],
                                    "activity_logs"
                                )
                            }
                        >
                            <FontAwesomeIcon icon={faFileExcel} />
                        </Button>
                        <Button
                            color="red"
                            onClick={() =>
                                handleExport(
                                    filteredLogs,
                                    "pdf",
                                    [
                                        "Log Name",
                                        "Description",
                                        "Causer",
                                        "Date",
                                        "Changes",
                                    ],
                                    "activity_logs"
                                )
                            }
                        >
                            <FontAwesomeIcon icon={faFilePdf} />
                        </Button>
                    </div>
                </div>
                <div className="overflow-hidden shadow-sm [&>div]:!p-0">
                    <DataTable
                        columns={columns}
                        data={filteredLogs}
                        pagination
                        paginationTotalRows={activityLogs.total}
                        paginationPerPage={activityLogs.per_page}
                        paginationServer
                        onChangePage={handlePageChange}
                        paginationDefaultPage={activityLogs.current_page}
                        noDataComponent={
                            <div className="text-center">No logs found.</div>
                        }
                        striped
                        customStyles={customStyles}
                        highlightOnHover
                        dense
                        responsive
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
