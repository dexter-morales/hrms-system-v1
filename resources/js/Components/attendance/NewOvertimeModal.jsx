import {
    Modal,
    TextInput,
    Label,
    Button,
    ModalHeader,
    ModalBody,
} from "flowbite-react";
import { useState, useEffect } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import { toast } from "react-toastify";
import ReactSelectInputEmployee from "../ui/dropdown/ReactSelectInputEmployee"; // Adjust the import path

const NewOvertimeModal = ({ show, onClose, onSuccess, employees, auth }) => {
    const { data, setData, errors, reset } = useForm({
        employee_id:
            auth?.user?.roles[0]?.name === "Employee" && auth.user.employee?.id
                ? auth.user.employee.id
                : "",
        date: "",
        requested_hours: "",
        notes: "",
    });

    const [localErrors, setLocalErrors] = useState({});

    useEffect(() => {
        if (
            auth?.user?.roles[0]?.name === "Employee" &&
            auth.user.employee?.id
        ) {
            setData("employee_id", auth.user.employee.id);
        }
    }, [auth, setData]);

    const validateForm = () => {
        const newErrors = {};
        if (!data.employee_id) newErrors.employee_id = "Employee is required.";
        if (!data.date) newErrors.date = "Date is required.";
        if (!data.requested_hours) {
            newErrors.requested_hours = "Requested hours are required.";
        } else if (
            isNaN(data.requested_hours) ||
            parseFloat(data.requested_hours) < 0.5 ||
            parseFloat(data.requested_hours) > 8
        ) {
            newErrors.requested_hours = "Hours must be between 0.5 and 8.";
        }
        if (!data.notes.trim()) newErrors.notes = "Notes are required.";

        setLocalErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        router.post(route("overtimes.store"), data, {
            onSuccess: () => {
                toast.success("Overtime request created!");
                onSuccess();
                onClose();
                reset();
                setLocalErrors({});
            },
            onError: () => {
                toast.error("Failed to create overtime request.");
            },
        });
    };

    return (
        <Modal
            show={show}
            onClose={() => {
                onClose();
                reset();
                setLocalErrors({});
            }}
        >
            <ModalHeader>Add New Overtime</ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Employee Select */}
                        {auth?.user?.roles[0]?.name !== "Employee" ? (
                            <div>
                                <ReactSelectInputEmployee
                                    label="Employee"
                                    name="employee_id"
                                    employees={employees}
                                    selected={employees.find(
                                        (emp) =>
                                            emp.id.toString() ===
                                            data.employee_id.toString()
                                    )}
                                    onChange={(value) => {
                                        console.log("employees:", employees);
                                        setData("employee_id", value || "");
                                    }}
                                    required={true}
                                    error={localErrors.employee_id}
                                    className={
                                        localErrors.employee_id
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {localErrors.employee_id && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {localErrors.employee_id}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="employee_id">Employee *</Label>
                                <TextInput
                                    id="employee_id"
                                    value={`${auth.user.employee.first_name} ${auth.user.employee.last_name} (ID: ${auth.user.employee.employee_id})`}
                                    readOnly
                                    disabled
                                />
                            </div>
                        )}

                        {/* Date */}
                        <div>
                            <Label htmlFor="date">Date *</Label>
                            <TextInput
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(e) =>
                                    setData("date", e.target.value)
                                }
                                color={localErrors.date ? "failure" : undefined}
                            />
                            {localErrors.date && (
                                <p className="text-xs text-red-500 mt-1">
                                    {localErrors.date}
                                </p>
                            )}
                        </div>

                        {/* Requested Hours */}
                        <div>
                            <Label htmlFor="requested_hours">
                                Requested Hours *
                            </Label>
                            <TextInput
                                id="requested_hours"
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="8"
                                value={data.requested_hours}
                                onChange={(e) =>
                                    setData("requested_hours", e.target.value)
                                }
                                color={
                                    localErrors.requested_hours
                                        ? "failure"
                                        : undefined
                                }
                            />
                            {localErrors.requested_hours && (
                                <p className="text-xs text-red-500 mt-1">
                                    {localErrors.requested_hours}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <Label htmlFor="notes">Notes *</Label>
                            <TextInput
                                id="notes"
                                value={data.notes}
                                onChange={(e) =>
                                    setData("notes", e.target.value)
                                }
                                color={
                                    localErrors.notes ? "failure" : undefined
                                }
                            />
                            {localErrors.notes && (
                                <p className="text-xs text-red-500 mt-1">
                                    {localErrors.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button color="red" type="submit">
                            Create Overtime
                        </Button>
                        <Button
                            color="gray"
                            type="button"
                            onClick={() => {
                                onClose();
                                reset();
                                setLocalErrors({});
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default NewOvertimeModal;
