import React, { useState, useEffect } from "react";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import {
    Modal,
    Button,
    TextInput,
    Label,
    ModalHeader,
    ModalBody,
    Select,
} from "flowbite-react";
import DataTable from "react-data-table-component";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faEdit,
    faBan,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";

const SitesIndex = () => {
    const { auth, sites } = usePage().props;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const { data, setData, post, put, reset, errors } = useForm({
        name: "",
        allowance: "",
        is_active: true,
    });

    useEffect(() => {
        if (!isAddModalOpen && !isEditModalOpen) reset();
    }, [isAddModalOpen, isEditModalOpen, reset]);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        router.post(
            route("sites.store"),
            {
                name: data.name,
                allowance: data.allowance,
                is_active: data.is_active,
            },
            {
                onSuccess: () => {
                    toast.success("Site added successfully!");
                    setIsProcessing(false);
                    setIsAddModalOpen(false);
                },
                onError: (errors) => {
                    console.log(errors);
                    setIsProcessing(false);
                },
            }
        );
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        router.put(
            route("sites.update", selectedSite.id),
            {
                name: data.name,
                allowance: data.allowance,
                is_active: data.is_active,
            },
            {
                onSuccess: () => {
                    toast.success("Site updated successfully!");
                    setIsProcessing(false);
                    setIsEditModalOpen(false);
                },
                onError: (errors) => {
                    console.log(errors);
                    setIsProcessing(false);
                },
            }
        );
    };

    const handleDisable = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this action!",
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
                setIsProcessing(true);
                router.delete(route("sites.destroy", id), {
                    onSuccess: () => {
                        toast.success("Site disabled successfully!");
                        setIsProcessing(false);
                    },
                    onError: (errors) => {
                        console.log(errors);
                        setIsProcessing(false);
                    },
                });
            }
        });
    };

    const [filterText, setFilterText] = useState("");
    const filteredSites = sites.filter(
        (site) =>
            site.name.toLowerCase().includes(filterText.toLowerCase()) ||
            (site.allowance && site.allowance.toString().includes(filterText))
    );

    const columns = [
        { name: "ID", selector: (row) => row.id, sortable: true },
        { name: "Name", selector: (row) => row.name, sortable: true },
        {
            name: "Allowance",
            selector: (row) => row.allowance || "N/A",
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => (row.is_active ? "active" : "inactive"),
            cell: (row) => (
                <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                        row.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {row.is_active ? "active" : "inactive"}
                </span>
            ),
            sortable: true,
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="space-x-2 flex">
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => {
                            setSelectedSite(row);
                            setData({
                                name: row.name,
                                allowance: row.allowance,
                                is_active: row.is_active,
                            });
                            setIsEditModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button
                        color="gray"
                        size="sm"
                        onClick={() => handleDisable(row.id)}
                        disabled={!row.is_active}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </Button>
                </div>
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
                padding: "20px",
                paddingTop: "10px",
                paddingBottom: "10px",
                borderBottom: "1px solid #e5e7eb",
            },
        },
    };

    return (
        <DashboardLayout>
            <Head title="Sites" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Sites
                </h3>
                <BreadCrumbs />
            </div>
            <div className="p-0">
                <div className="mb-4 flex justify-between items-center">
                    <TextInput
                        placeholder="Search Site"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-1/3"
                    />
                    <Button
                        className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Site
                    </Button>
                </div>

                <Modal
                    show={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                >
                    <ModalHeader>Add Site</ModalHeader>
                    <ModalBody>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    required
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="allowance">Allowance</Label>
                                <TextInput
                                    id="allowance"
                                    type="number"
                                    step="0.01"
                                    value={data.allowance}
                                    onChange={(e) =>
                                        setData("allowance", e.target.value)
                                    }
                                />
                                {errors.allowance && (
                                    <p className="text-red-500 text-sm">
                                        {errors.allowance}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="is_active">Status</Label>
                                <Select
                                    id="is_active"
                                    value={data.is_active}
                                    onChange={(e) =>
                                        setData(
                                            "is_active",
                                            e.target.value === "true"
                                        )
                                    }
                                    required
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </Select>
                                {errors.is_active && (
                                    <p className="text-red-500 text-sm">
                                        {errors.is_active}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                color="green"
                            >
                                {isProcessing && (
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        spin
                                        className="mr-2"
                                    />
                                )}
                                Add
                            </Button>
                        </form>
                    </ModalBody>
                </Modal>

                <Modal
                    show={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                >
                    <ModalHeader>Edit Site</ModalHeader>
                    <ModalBody>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    required
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="allowance">Allowance</Label>
                                <TextInput
                                    id="allowance"
                                    type="number"
                                    step="0.01"
                                    value={data.allowance}
                                    onChange={(e) =>
                                        setData("allowance", e.target.value)
                                    }
                                />
                                {errors.allowance && (
                                    <p className="text-red-500 text-sm">
                                        {errors.allowance}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="is_active">Status</Label>
                                <Select
                                    id="is_active"
                                    value={data.is_active}
                                    onChange={(e) =>
                                        setData(
                                            "is_active",
                                            e.target.value === "true"
                                        )
                                    }
                                    required
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </Select>
                                {errors.is_active && (
                                    <p className="text-red-500 text-sm">
                                        {errors.is_active}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                color="yellow"
                            >
                                {isProcessing && (
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        spin
                                        className="mr-2"
                                    />
                                )}
                                Update
                            </Button>
                        </form>
                    </ModalBody>
                </Modal>

                <DataTable
                    columns={columns}
                    data={filteredSites}
                    pagination
                    highlightOnHover
                    customStyles={customStyles}
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
                                        No Site Found
                                    </span>
                                </p>
                            </div>
                        </>
                    }
                />
            </div>
        </DashboardLayout>
    );
};

export default SitesIndex;
