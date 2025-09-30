import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, usePage, router } from "@inertiajs/react";
import TableComponent from "@/Components/TableComponent";
import { Button } from "flowbite-react";
import { toast } from "react-toastify";
import { useState } from "react";
import NewAttendanceModal from "@/Components/attendance/NewAttendanceModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const EmployeeAttendanceList = () => {
    const { attendances } = usePage().props;
    console.log("AttendanceList props:", usePage().props);

    const [editAttendance, setEditAttendance] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const columns = [
        {
            header: "Employee",
            accessor: "employee",
            render: (item) =>
                item.employee?.first_name + " " + item.employee?.last_name ??
                "—",
        },
        {
            header: "Date",
            accessor: "date",
            render: (item) =>
                item.date
                    ? new Date(item.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                      })
                    : "—",
        },
        {
            header: "Punch In",
            accessor: "punch_in",
            render: (item) =>
                item.punch_in
                    ? new Date(item.punch_in).toLocaleTimeString("en-US")
                    : "—",
        },
        {
            header: "Punch Out",
            accessor: "punch_out",
            render: (item) =>
                item.punch_out
                    ? new Date(item.punch_out).toLocaleTimeString("en-US")
                    : "—",
        },
    ];

    const searchFields = ["employee.name", "date"];

    const handleSuccess = () => {
        toast.success("Attendance operation successful!");
        router.reload({ only: ["attendances"] });
    };

    const handleEdit = (attendance) => {
        console.log("Editing attendance:", attendance);
        setEditAttendance(attendance);
        setModalOpen(true);
    };

    const handleDelete = (attendance) => {
        if (window.confirm(`Delete attendance for ${attendance.date}?`)) {
            router.delete(route("attendances.destroy", attendance.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Attendance deleted!");
                    router.reload({ only: ["attendances"] });
                },
                onError: () => toast.error("Failed to delete attendance."),
            });
        }
    };

    const renderActions = (item) => (
        <div className="flex space-x-2">
            {/* <Button
                size="xs"
                color="warning"
                onClick={() => handleEdit(item)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
                Edit
            </Button>
            <Button
                size="xs"
                color="failure"
                onClick={() => handleDelete(item)}
                className="bg-red-500 hover:bg-red-600 text-white"
            >
                Delete
            </Button> */}
            <Button size="xs" color="red" onClick={() => handleEdit(item)}>
                <FontAwesomeIcon icon={faEdit} />
            </Button>
            <Button size="xs" color="gray" onClick={() => handleDelete(item)}>
                <FontAwesomeIcon icon={faTrash} />
            </Button>
        </div>
    );

    return (
        <TableComponent
            columns={columns}
            data={attendances}
            modalComponent={NewAttendanceModal}
            modalProps={{
                onSuccess: handleSuccess,
                editAttendance,
                show: modalOpen,
                onClose: () => {
                    setModalOpen(false);
                    setEditAttendance(null);
                },
                setShow: setModalOpen,
                employees: usePage().props.employees,
            }}
            searchFields={searchFields}
            defaultItemsPerPage={10}
            addButtonText="Record Attendance"
            renderActions={renderActions}
        />
    );
};

export default EmployeeAttendanceList;
