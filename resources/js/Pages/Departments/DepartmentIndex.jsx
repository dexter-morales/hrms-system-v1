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
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";

const DepartmentIndex = () => {
    const { auth, departments } = usePage().props;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const { data, setData, post, put, reset, errors } = useForm({
        name: "",
        description: "",
    });

    useEffect(() => {
        if (!isAddModalOpen && !isEditModalOpen) reset();
    }, [isAddModalOpen, isEditModalOpen, reset]);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        router.post(
            route("departments.store"),
            {
                name: data.name,
                description: data.description,
            },
            {
                onSuccess: () => {
                    toast.success("Department added successfully!");
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
            route("departments.update", selectedDepartment.id),
            {
                name: data.name,
                description: data.description,
            },
            {
                onSuccess: () => {
                    toast.success("Department updated successfully!");
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
                router.delete(route("departments.destroy", id), {
                    onSuccess: () => {
                        toast.success("Department disabled successfully!");
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
    const filteredDepartments = departments.filter(
        (dept) =>
            dept.name.toLowerCase().includes(filterText.toLowerCase()) ||
            (dept.description &&
                dept.description
                    .toLowerCase()
                    .includes(filterText.toLowerCase()))
    );

    const columns = [
        { name: "ID", selector: (row) => row.id, sortable: true },
        { name: "Name", selector: (row) => row.name, sortable: true },
        {
            name: "Description",
            selector: (row) => row.description || "-",
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
                            setSelectedDepartment(row);
                            setData({
                                name: row.name,
                                description: row.description,
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
            <Head title="Departments" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Departments
                </h3>
                <BreadCrumbs />
            </div>
            <div className="p-0">
                <div className="mb-4 flex justify-between items-center">
                    <TextInput
                        placeholder="Search Department"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-1/3"
                    />
                    <Button
                        className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Department
                    </Button>
                </div>

                <Modal
                    show={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                >
                    <ModalHeader>Add Department</ModalHeader>
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
                                <Label htmlFor="description">Description</Label>
                                <TextInput
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm">
                                        {errors.description}
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
                    <ModalHeader>Edit Department</ModalHeader>
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
                                <Label htmlFor="description">Description</Label>
                                <TextInput
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm">
                                        {errors.description}
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
                    data={filteredDepartments}
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
                                        No Department Found
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

export default DepartmentIndex;
