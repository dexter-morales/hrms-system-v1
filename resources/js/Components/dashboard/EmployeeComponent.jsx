import { useState } from "react";
import { usePage, router } from "@inertiajs/react";
import { Button } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import TableComponent from "../TableComponent";
import UpdateEmployeeModal from "../employee/UpdateEmployeeModal";
import NewEmployeeModal from "../employee/NewEmployeeModal";
import Swal from "sweetalert2"; // Import SweetAlert2
import { toast } from "react-toastify";

const EmployeeComponent = () => {
    const {
        employees,
        departments,
        positions,
        sites,
        employment_types,
        employment_status,
        role_access,
        heads_managers,
        generated_employee_id,
    } = usePage().props;
    console.log("Employee List: ", usePage().props);

    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState({
        show: false,
        employee: null,
    });

    const handleSuccess = () => {
        console.log("Employee action completed!");
    };

    const handleEdit = (employee) => {
        setOpenEditModal({ show: true, employee });
    };

    const handleDelete = (employee) => {
        Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete the employee with ID ${employee.employee_id}. This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "bg-white shadow-lg rounded-lg p-4",
                confirmButton:
                    "bg-red-600 text-white hover:!bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500",
                cancelButton:
                    "bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500",
            },
            buttonsStyling: true,
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("employees.destroy", employee.id), {
                    onSuccess: () => toast.success("Employee deleted!"),
                    onError: () => toast.error("Failed to delete employee."),
                });
            }
        });
    };

    const columns = [
        {
            name: "#",
            render: (row, index) => index + 1,
        },
        // {
        //     name: "Employee ID",
        //     accessor: "employee_id",
        // },
        {
            name: "Full Name",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <img
                        src={
                            row.avatar
                                ? `/storage/${row.avatar}`
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      row.first_name + " " + row.last_name
                                  )}&background=random&color=fff`
                        }
                        alt={row.first_name + " " + row.last_name}
                        className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-col">
                        {row.first_name + " " + row.last_name}
                        <span
                            className="text-xs"
                            style={{
                                fontSize: "10px",
                            }}
                        >
                            {row.employee_id}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            name: "Department",
            render: (row) => row.department?.name || "-",
        },
        {
            name: "Position",
            render: (row) => row.position?.name || "-",
        },
        {
            name: "Date Hired",
            render: (row) =>
                row.date_hired
                    ? new Date(row.date_hired).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                      })
                    : "-",
        },
        {
            name: "Type",
            render: (row) => row.employment_type?.name || "-",
        },
        {
            name: "Basic Salary",
            render: (row) => `₱${row.basic_salary?.toLocaleString() || "-"}`,
        },
    ];

    const renderActions = (row) => (
        <div className="flex gap-2">
            <Button size="xs" color="red" onClick={() => handleEdit(row)}>
                <FontAwesomeIcon icon={faEdit} />
            </Button>
            <Button size="xs" color="gray" onClick={() => handleDelete(row)}>
                <FontAwesomeIcon icon={faTrash} /> {/* Updated to faTrash */}
            </Button>
        </div>
    );

    return (
        <>
            <TableComponent
                columns={columns}
                className="font-circular"
                data={employees}
                modalComponent={NewEmployeeModal}
                modalProps={{
                    onOpen: () => setOpenModal(true),
                    show: openModal,
                    onClose: () => setOpenModal(false),
                    onSuccess: handleSuccess,
                    departments,
                    positions,
                    sites,
                    employment_types,
                    employment_status,
                    role_access,
                    heads_managers,
                    generated_employee_id,
                }}
                importEmployeeButton={true}
                generated_employee_id={generated_employee_id}
                deleteModalComponent={null}
                deleteModalProps={{}}
                searchFields={[
                    "employee_id",
                    "first_name",
                    "middle_name",
                    "last_name",
                    "department_id",
                    "position_id",
                    "employment_status",
                ]}
                filterField="employment_status"
                filterOptions={[
                    { value: "regular", label: "Regular" },
                    { value: "contractual", label: "Contractual" },
                    { value: "probationary", label: "Probationary" },
                ]}
                addButtonText="New Employee"
                renderActions={renderActions}
            />
            <UpdateEmployeeModal
                show={openEditModal.show}
                onClose={() =>
                    setOpenEditModal({ show: false, employee: null })
                }
                onSuccess={handleSuccess}
                employee={openEditModal.employee}
                departments={departments}
                positions={positions}
                sites={sites}
                employment_types={employment_types}
                employment_status={employment_status}
                role_access={role_access}
                heads_managers={heads_managers}
                leaveTypes={usePage().props.leaveTypes}
            />
        </>
    );
};

export default EmployeeComponent;
