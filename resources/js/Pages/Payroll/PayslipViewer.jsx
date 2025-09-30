import React, { useState } from "react";
import { usePage, Head } from "@inertiajs/react";
import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    TextInput,
    Label,
    Select,
} from "flowbite-react";
import DataTable from "react-data-table-component";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const PayslipViewer = () => {
    const { payslips } = usePage().props;
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("");
    const [selectedRows, setSelectedRows] = useState([]);

    // Handle download of individual payslip PDF
    const handleDownload = (filePath) => {
        const link = document.createElement("a");
        link.href = `/storage/${filePath}`;
        link.download = filePath.split("/").pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle batch download of selected payslips
    const handleBatchDownload = async () => {
        const zip = new JSZip();
        for (const payslip of selectedRows) {
            const response = await fetch(`/storage/${payslip.file_path}`);
            const blob = await response.blob();
            zip.file(payslip.file_path.split("/").pop(), blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(
            zipBlob,
            `payslips_batch_${new Date().toISOString().split("T")[0]}.zip`
        );
        setSelectedRows([]); // Clear selection after download
    };

    const columns = [
        // {
        //     name: "Select",
        //     cell: (row) => (
        //         <input
        //             type="checkbox"
        //             checked={selectedRows.some((r) => r.id === row.id)}
        //             onChange={(e) => {
        //                 if (e.target.checked) {
        //                     setSelectedRows([...selectedRows, row]);
        //                 } else {
        //                     setSelectedRows(
        //                         selectedRows.filter((r) => r.id !== row.id)
        //                     );
        //                 }
        //             }}
        //         />
        //     ),
        //     sortable: false,
        //     width: "60px",
        // },
        {
            name: "#",
            selector: (row, index) => index + 1,
            sortable: true,
            width: "60px",
        },
        {
            name: "Employee",
            selector: (row) =>
                `${row.employee?.first_name || "-"} ${
                    row.employee?.last_name || "-"
                }`,
            sortable: true,
            cell: (row) =>
                `${row.employee?.first_name || "-"} ${
                    row.employee?.last_name || "-"
                }`,
        },
        {
            name: "Location",
            render: (row) => row?.employee?.site?.name || "-",
            selector: (row) => row?.employee?.site?.name || "",
            sortable: true,
        },
        {
            name: "Pay Period",
            selector: (row) =>
                `${new Date(row.payroll?.pay_period_start).toLocaleDateString(
                    "en-US"
                )} - ${new Date(row.payroll?.pay_period_end).toLocaleDateString(
                    "en-US"
                )}`,
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => row.status || "-",
            sortable: true,
        },
        {
            name: "Generated On",
            selector: (row) =>
                new Date(row.created_at).toLocaleDateString("en-US"),
            sortable: true,
        },
        {
            name: "Actions",
            cell: (row) => (
                <>
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => {
                            setSelectedPayslip(row);
                            setShowModal(true);
                        }}
                        className="mr-2"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        color="gray"
                        size="sm"
                        onClick={() => handleDownload(row.file_path)}
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </Button>
                </>
            ),
            sortable: false,
            width: "200px",
        },
    ];

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

    // Filter payslips based on search term and location
    const filteredPayslips = payslips.filter(
        (payslip) =>
            (`${payslip.employee?.first_name || ""} ${
                payslip.employee?.last_name || ""
            }`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
                `${new Date(
                    payslip.payroll?.pay_period_start
                ).toLocaleDateString("en-US")} - ${new Date(
                    payslip.payroll?.pay_period_end
                ).toLocaleDateString("en-US")}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (payslip.status || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                new Date(payslip.created_at)
                    .toLocaleDateString("en-US")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) &&
            (!selectedLocation ||
                payslip.employee?.site?.id === parseInt(selectedLocation))
    );

    const uniqueLocations = [
        ...new Set(payslips.map((p) => p.employee?.site?.id).filter(Boolean)),
    ].map((id) => ({
        id,
        name: payslips.find((p) => p.employee?.site?.id === id)?.employee?.site
            ?.name,
    }));

    return (
        <DashboardLayout>
            <Head title="Payslip Viewer" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Payslip Viewer
                </h3>
                <BreadCrumbs />
            </div>
            <div className="p-0">
                <div className="mb-4 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="search" value="Search" />
                        <TextInput
                            id="search"
                            placeholder="Search by name, pay period, status, or date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="location" value="Location" />
                        <Select
                            id="location"
                            value={selectedLocation}
                            onChange={(e) =>
                                setSelectedLocation(e.target.value)
                            }
                        >
                            <option value="">All Locations</option>
                            {uniqueLocations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    {selectedRows.length > 0 && (
                        <Button
                            color="blue"
                            onClick={handleBatchDownload}
                            className="mt-6"
                        >
                            Download Selected ({selectedRows.length})
                        </Button>
                    )}
                </div>
                <div className="relative overflow-x-auto shadow-md">
                    <DataTable
                        columns={columns}
                        data={filteredPayslips}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 25, 50]}
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
                                            No Payslip Found
                                        </span>
                                    </p>
                                </div>
                            </>
                        }
                        striped
                        customStyles={customStyles}
                        highlightOnHover
                        dense
                        responsive
                        selectableRows
                        onSelectedRowsChange={({ selectedRows }) =>
                            setSelectedRows(selectedRows)
                        }
                    />
                </div>

                <Modal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    size="3xl"
                >
                    <ModalHeader>Employee Payslip</ModalHeader>
                    <ModalBody>
                        {selectedPayslip && (
                            <iframe
                                src={
                                    selectedPayslip.file_path
                                        ? `/storage/${selectedPayslip.file_path}`
                                        : "#"
                                }
                                title="Payslip PDF"
                                width="100%"
                                height="600px"
                                style={{ border: "none" }}
                            />
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <div className="flex justify-end w-full">
                            <Button
                                color="red"
                                onClick={() =>
                                    handleDownload(selectedPayslip?.file_path)
                                }
                            >
                                Download
                            </Button>
                            <Button
                                color="gray"
                                onClick={() => setShowModal(false)}
                                className="ml-2"
                            >
                                Close
                            </Button>
                        </div>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default PayslipViewer;
