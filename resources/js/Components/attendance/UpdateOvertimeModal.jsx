import {
    Modal,
    TextInput,
    Select,
    Label,
    Button,
    ModalHeader,
    ModalBody,
} from "flowbite-react";
import { useState, useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
import { toast } from "react-toastify";

const UpdateOvertimeModal = ({
    show,
    onClose,
    onSuccess,
    overtime,
    employees,
}) => {
    const { data, setData, errors, reset } = useForm({
        employee_id: "",
        date: "",
        requested_hours: "",
        approved_hours: "",
        status: "",
        manager_id: "",
        notes: "",
    });

    useEffect(() => {
        if (overtime) {
            setData({
                employee_id: overtime.employee_id?.toString() || "",
                date: overtime.date || "",
                requested_hours: overtime.requested_hours?.toString() || "",
                approved_hours: overtime.approved_hours?.toString() || "",
                status: overtime.status || "",
                manager_id: overtime.manager_id?.toString() || "",
                notes: overtime.notes || "",
            });
        }
    }, [overtime]);

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(route("overtimes.update", overtime?.id), data, {
            onSuccess: () => {
                toast.success("Overtime updated successfully!");
                onSuccess();
                onClose();
                reset();
            },
            onError: (error) => {
                console.error("Update errors:", error);
                toast.error("Failed to update overtime.");
            },
        });
    };

    return (
        <Modal
            show={show}
            onClose={() => {
                onClose();
                reset();
            }}
        >
            <ModalHeader>Edit Overtime</ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Employee */}
                        <div>
                            <Label htmlFor="employee_id">Employee</Label>
                            <Select
                                id="employee_id"
                                name="employee_id"
                                value={data.employee_id}
                                onChange={(e) =>
                                    setData("employee_id", e.target.value)
                                }
                                color={
                                    errors.employee_id ? "failure" : undefined
                                }
                            >
                                <option value="">Select Employee</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name}
                                    </option>
                                ))}
                            </Select>
                            {errors.employee_id && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.employee_id}
                                </p>
                            )}
                        </div>

                        {/* Date */}
                        <div>
                            <Label htmlFor="date">Date</Label>
                            <TextInput
                                id="date"
                                name="date"
                                type="date"
                                value={data.date}
                                onChange={(e) =>
                                    setData("date", e.target.value)
                                }
                                color={errors.date ? "failure" : undefined}
                            />
                            {errors.date && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.date}
                                </p>
                            )}
                        </div>

                        {/* Requested Hours */}
                        <div>
                            <Label htmlFor="requested_hours">
                                Requested Hours
                            </Label>
                            <TextInput
                                id="requested_hours"
                                name="requested_hours"
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="8"
                                value={data.requested_hours}
                                onChange={(e) =>
                                    setData("requested_hours", e.target.value)
                                }
                                color={
                                    errors.requested_hours
                                        ? "failure"
                                        : undefined
                                }
                            />
                            {errors.requested_hours && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.requested_hours}
                                </p>
                            )}
                        </div>

                        {/* Approved Hours */}
                        <div>
                            <Label htmlFor="approved_hours">
                                Approved Hours
                            </Label>
                            <TextInput
                                id="approved_hours"
                                name="approved_hours"
                                type="number"
                                step="0.5"
                                min="0"
                                max={data.requested_hours}
                                value={data.approved_hours}
                                onChange={(e) =>
                                    setData("approved_hours", e.target.value)
                                }
                                color={
                                    errors.approved_hours
                                        ? "failure"
                                        : undefined
                                }
                            />
                            {errors.approved_hours && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.approved_hours}
                                </p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                id="status"
                                name="status"
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                                color={errors.status ? "failure" : undefined}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </Select>
                            {errors.status && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        {/* Manager */}
                        <div>
                            <Label htmlFor="manager_id">Manager</Label>
                            <Select
                                id="manager_id"
                                name="manager_id"
                                value={data.manager_id}
                                onChange={(e) =>
                                    setData("manager_id", e.target.value)
                                }
                                color={
                                    errors.manager_id ? "failure" : undefined
                                }
                            >
                                <option value="">None</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name}
                                    </option>
                                ))}
                            </Select>
                            {errors.manager_id && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.manager_id}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                            <Label htmlFor="notes">Notes</Label>
                            <TextInput
                                id="notes"
                                name="notes"
                                value={data.notes}
                                onChange={(e) =>
                                    setData("notes", e.target.value)
                                }
                                color={errors.notes ? "failure" : undefined}
                            />
                            {errors.notes && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            color="gray"
                            type="button"
                            onClick={() => {
                                onClose();
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="blue" type="submit">
                            Update Overtime
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default UpdateOvertimeModal;
