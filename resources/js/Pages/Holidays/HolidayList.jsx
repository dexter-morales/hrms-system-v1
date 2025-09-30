import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, usePage } from "@inertiajs/react";
import React, { useState } from "react";
import TableComponent from "@/Components/TableComponent";
import NewHolidayModal from "@/Components/holiday/NewHolidayModal";
import { Button } from "flowbite-react";
import { router } from "@inertiajs/react";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

const HolidayList = () => {
    const { holidays } = usePage().props;
    const [editHoliday, setEditHoliday] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Define searchFields before using it
    const searchFields = [
        "name_holiday",
        "holiday_type",
        "date_holiday",
        "description",
        "created_at",
    ];

    // Define columns for the holidays table
    const columns = [
        {
            name: "Holiday Name",
            accessor: "name_holiday",
        },
        {
            name: "Date",
            accessor: "date_holiday",
            render: (item) =>
                item.date_holiday
                    ? new Date(item.date_holiday).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                      })
                    : "—",
        },
        {
            name: "Type",
            accessor: "holiday_type",
            render: (item) => item.holiday_type ?? "—",
        },
        {
            name: "Description",
            accessor: "description",
            render: (item) => item.description ?? "—",
        },
        {
            name: "Created At",
            accessor: "created_at",
            render: (item) =>
                item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-US")
                    : "—",
        },
    ];

    // Handle modal success
    const handleSuccess = () => {
        console.log("Holiday added!");
    };

    const handleEdit = (holiday) => {
        setEditHoliday(holiday);
        setModalOpen(true);
    };

    // Update handleDelete to use Swal.fire
    const handleDelete = (holiday) => {
        Swal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert this action for "${holiday.name_holiday}"!`,
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
                router.delete(route("holidays.destroy", holiday.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success("Holiday deleted successfully!");
                    },
                    onError: () => {
                        toast.error("Failed to delete holiday.");
                    },
                });
            }
        });
    };

    const renderActions = (item) => (
        <div className="flex space-x-2">
            <Button
                size="xs"
                color="red"
                // className="relative flex items-center justify-center rounded-lg text-center font-medium focus:outline-none focus:ring-4 h-8 px-3 text-xs bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={() => handleEdit(item)}
            >
                <FontAwesomeIcon icon={faEdit} />
            </Button>
            <Button size="xs" color="gray" onClick={() => handleDelete(item)}>
                <FontAwesomeIcon icon={faTrashAlt} />
            </Button>
        </div>
    );

    return (
        <DashboardLayout>
            <Head title="Holiday" />

            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Holiday
                </h3>
                <BreadCrumbs />
            </div>

            <TableComponent
                columns={columns}
                data={holidays}
                modalComponent={NewHolidayModal}
                modalProps={{
                    onSuccess: handleSuccess,
                    editHoliday,
                    show: modalOpen,
                    setShow: setModalOpen,
                    onClose: () => {
                        setModalOpen(false);
                        setEditHoliday(null);
                    },
                    onOpen: () => setModalOpen(true),
                }}
                searchFields={searchFields}
                defaultItemsPerPage={10}
                addButtonText="New Holiday"
                renderActions={renderActions}
            />
        </DashboardLayout>
    );
};

export default HolidayList;
