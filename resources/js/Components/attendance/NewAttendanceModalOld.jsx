import {
    Button,
    Modal,
    ModalBody,
    ModalHeader,
    Label,
    TextInput,
    Select,
} from "flowbite-react";
import { useForm, router } from "@inertiajs/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";

const NewAttendanceModal = ({
    show,
    onClose,
    onSuccess,
    editAttendance = null,
    employees,
}) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        employee_id: editAttendance?.employee_id || "",
        date: editAttendance?.date || "",
        punch_in: editAttendance?.punch_in
            ? new Date(editAttendance.punch_in).toISOString().slice(0, 16)
            : "",
        punch_out: editAttendance?.punch_out
            ? new Date(editAttendance.punch_out).toISOString().slice(0, 16)
            : "",
    });

    console.log("employees ", employees);
    const requiredFields = ["employee_id", "date", "punch_in"];

    useEffect(() => {
        if (show) {
            if (editAttendance) {
                setData({
                    employee_id: editAttendance.employee_id,
                    date: editAttendance.date,
                    punch_in: editAttendance.punch_in
                        ? new Date(editAttendance.punch_in)
                              .toISOString()
                              .slice(0, 16)
                        : "",
                    punch_out: editAttendance.punch_out
                        ? new Date(editAttendance.punch_out)
                              .toISOString()
                              .slice(0, 16)
                        : "",
                });
            } else {
                reset();
            }
        }
    }, [show, editAttendance, setData, reset]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const validateForm = () => {
        let isValid = true;
        for (let field of requiredFields) {
            if (!data[field]) {
                toast.warning(
                    `Please fill in the ${field.replace("_", " ")} field.`
                );
                isValid = false;
            }
        }
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        console.log("Submitting attendance data:", data);

        const formattedData = {
            employee_id: data.employee_id,
            date: data.date,
            punch_in: data.punch_in
                ? new Date(data.punch_in).toISOString()
                : null,
            punch_out: data.punch_out
                ? new Date(data.punch_out).toISOString()
                : null,
        };

        if (editAttendance) {
            put(route("attendances.update", editAttendance.id), {
                data: formattedData,
                preserveScroll: true,
                onSuccess: () => {
                    console.log("Update successful");
                    toast.success("Attendance updated successfully!");
                    router.reload({ only: ["attendances"] });
                    reset();
                    onSuccess?.();
                    onClose();
                },
                onError: (errors) => {
                    console.error("Update errors:", errors);
                    toast.error("Failed to update attendance.");
                },
            });
        } else {
            post(route("attendances.store"), {
                data: formattedData,
                preserveScroll: true,
                onSuccess: () => {
                    console.log("Create successful");
                    toast.success("Attendance added successfully!");
                    router.reload({ only: ["attendances"] });
                    reset();
                    onSuccess?.();
                    onClose();
                },
                onError: (errors) => {
                    console.error("Create errors:", errors);
                    toast.error("Failed to add attendance.");
                },
            });
        }
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Modal show={show} onClose={onClose} size="md">
                <ModalHeader>
                    {editAttendance ? "Edit Attendance" : "Record Attendance"}
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="employee_id">
                                Employee <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                id="employee_id"
                                name="employee_id"
                                value={data.employee_id}
                                onChange={handleChange}
                                color={errors.employee_id ? "failure" : "gray"}
                            >
                                <option value="">Select Employee</option>
                                {employees.map((employee) => (
                                    <option
                                        key={employee.id}
                                        value={employee.id}
                                    >
                                        {employee.first_name}{" "}
                                        {employee.last_name}
                                    </option>
                                ))}
                            </Select>
                            {errors.employee_id && (
                                <span className="text-red-500 text-sm">
                                    {errors.employee_id}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="date">
                                Date <span className="text-red-500">*</span>
                            </Label>
                            <TextInput
                                id="date"
                                name="date"
                                type="date"
                                value={data.date}
                                onChange={handleChange}
                                color={errors.date ? "failure" : "gray"}
                            />
                            {errors.date && (
                                <span className="text-red-500 text-sm">
                                    {errors.date}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="punch_in">
                                Punch In <span className="text-red-500">*</span>
                            </Label>
                            <TextInput
                                id="punch_in"
                                name="punch_in"
                                type="datetime-local"
                                value={data.punch_in}
                                onChange={handleChange}
                                color={errors.punch_in ? "failure" : "gray"}
                            />
                            {errors.punch_in && (
                                <span className="text-red-500 text-sm">
                                    {errors.punch_in}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="punch_out">Punch Out</Label>
                            <TextInput
                                id="punch_out"
                                name="punch_out"
                                type="datetime-local"
                                value={data.punch_out}
                                onChange={handleChange}
                                color={errors.punch_out ? "failure" : "gray"}
                            />
                            {errors.punch_out && (
                                <span className="text-red-500 text-sm">
                                    {errors.punch_out}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button
                                type="submit"
                                isProcessing={processing}
                                disabled={processing}
                                className="bg-indigo-500 hover:bg-indigo-600"
                            >
                                {processing
                                    ? "Saving..."
                                    : editAttendance
                                    ? "Update Attendance"
                                    : "Add Attendance"}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        </>
    );
};

export default NewAttendanceModal;
