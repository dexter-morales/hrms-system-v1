import {
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableRow,
    TableCell,
    TextInput,
    Pagination,
    Select,
    Button,
} from "flowbite-react";
import { useState, useEffect } from "react";
import { HiSearch } from "react-icons/hi";
import NewEmployeeModal from "../employee/NewEmployeeModal";
import { usePage } from "@inertiajs/react";

const EmployeeComponent = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [openModal, setOpenModal] = useState(false);
    const { employees } = usePage().props;
    console.log("usePage().props: ", usePage().props);

    const handleSuccess = () => {
        console.log("Employee added!");
    };

    const filtered = employees.filter((e) =>
        [
            e.employee_id,
            e.first_name,
            e.middle_name,
            e.last_name,
            e.department_id,
            e.position_id,
            e.employment_status,
        ].some((val) =>
            val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    return (
        <div className="mx-auto p-4 space-y-3">
            <NewEmployeeModal
                show={openModal}
                onClose={() => setOpenModal(false)}
                onSuccess={handleSuccess}
            />
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                <div className="flex items-center gap-2">
                    <span>Show</span>
                    <Select
                        value={itemsPerPage}
                        onChange={(e) =>
                            setItemsPerPage(parseInt(e.target.value))
                        }
                        className="w-20"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                    </Select>
                    <span>entries</span>
                </div>
                <div className="w-full flex justify-end gap-2">
                    <Button
                        className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                        onClick={() => setOpenModal(true)}
                    >
                        New Employee +
                    </Button>

                    <TextInput
                        icon={HiSearch}
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-60"
                    />
                </div>
            </div>
            <Table hoverable striped>
                <TableHead>
                    <TableHeadCell>#</TableHeadCell>
                    <TableHeadCell>Employee ID</TableHeadCell>
                    <TableHeadCell>Full Name</TableHeadCell>
                    <TableHeadCell>Department</TableHeadCell>
                    <TableHeadCell>Position</TableHeadCell>
                    <TableHeadCell>Date Hired</TableHeadCell>
                    <TableHeadCell>Type</TableHeadCell>
                    <TableHeadCell>Basic Salary</TableHeadCell>
                </TableHead>
                <TableBody>
                    {paginated.map((emp, index) => (
                        <TableRow key={emp.id}>
                            <TableCell>
                                {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell>{emp.employee_id}</TableCell>
                            <TableCell>{`${emp.first_name} ${
                                emp.middle_name ? emp.middle_name + " " : ""
                            } ${emp.last_name}`}</TableCell>
                            <TableCell>{emp.department.name}</TableCell>
                            <TableCell>{emp.position?.name}</TableCell>
                            <TableCell>
                                {emp.date_hired
                                    ? new Date(
                                          emp.date_hired
                                      ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      })
                                    : "—"}
                            </TableCell>

                            <TableCell>{emp.employment_type?.name}</TableCell>
                            <TableCell>
                                ₱{emp.basic_salary.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                    {paginated.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center text-gray-500"
                            >
                                No employees found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="mt-4 flex justify-center">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                    showIcons
                />
            </div>
        </div>
    );
};

export default EmployeeComponent;
