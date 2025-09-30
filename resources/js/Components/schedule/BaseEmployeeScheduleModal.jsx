import { useState } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    Button,
    Label,
    Select,
    TextInput,
    Checkbox,
} from "flowbite-react";
import { toast } from "react-toastify";
import ReactSelectInput from "@/Components/ui/dropdown/ReactSelectInput";

const BaseEmployeeScheduleModal = ({
    show,
    onClose,
    title,
    initialData,
    employeesNoSchedule,
    onSubmit,
    isEdit = false,
    selectedEmployeeName = "",
}) => {
    const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleCheckboxChange = (event) => {
        const day = event.target.value;
        setFormData((previous) => ({
            ...previous,
            working_days: previous.working_days.includes(day)
                ? previous.working_days.filter((d) => d !== day)
                : [...previous.working_days, day],
        }));
        setErrors((prev) => ({ ...prev, working_days: "" }));
    };

    const handleFlexibleDayChange = (index, field, value) => {
        setFormData((previous) => {
            const newFlexibleDays = [...previous.flexible_days];
            newFlexibleDays[index][field] = value;
            return { ...previous, flexible_days: newFlexibleDays };
        });
        setErrors((prev) => ({ ...prev, flexible_days: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.employee_id)
            newErrors.employee_id = "Employee is required.";
        if (!formData.schedule_type)
            newErrors.schedule_type = "Schedule type is required.";
        if (!formData.effective_from)
            newErrors.effective_from = "Effective from is required.";

        if (formData.schedule_type === "fixed") {
            if (formData.working_days.length === 0)
                newErrors.working_days =
                    "At least one working day is required.";
            if (!formData.start_time)
                newErrors.start_time = "Start time is required.";
            if (!formData.end_time)
                newErrors.end_time = "End time is required.";
            if (formData.start_time && formData.end_time) {
                const start = new Date(
                    `1970-01-01T${formData.start_time}:00Z`
                ).getTime();
                const end = new Date(
                    `1970-01-01T${formData.end_time}:00Z`
                ).getTime();
                if (start >= end)
                    newErrors.end_time = "End time must be after start time.";
            }
        } else if (formData.schedule_type === "flexible") {
            const validFlexibleDays = formData.flexible_days.filter(
                (day) => day.start && day.end
            );
            if (validFlexibleDays.length === 0)
                newErrors.flexible_days =
                    "At least one flexible day with start and end time is required.";
            formData.flexible_days.forEach((day, index) => {
                if (day.start && day.end) {
                    const start = new Date(
                        `1970-01-01T${day.start}:00Z`
                    ).getTime();
                    const end = new Date(`1970-01-01T${day.end}:00Z`).getTime();
                    if (start >= end)
                        newErrors.flexible_days = `End time must be after start time for ${day.day.toUpperCase()}.`;
                }
            });
        }

        if (formData.effective_from) {
            const fromDate = new Date(formData.effective_from).getTime();
            if (isNaN(fromDate))
                newErrors.effective_from = "Invalid effective from date.";
            if (formData.effective_until) {
                const untilDate = new Date(formData.effective_until).getTime();
                if (isNaN(untilDate))
                    newErrors.effective_until = "Invalid effective until date.";
                if (fromDate > untilDate)
                    newErrors.effective_until =
                        "Effective until must be after effective from.";
            }
        }

        return newErrors;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            Object.values(validationErrors).forEach((error) =>
                toast.error(error)
            );
            return;
        }

        onSubmit(formData);
    };

    return (
        <Modal show={show} onClose={onClose}>
            <ModalHeader>{title}</ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col space-y-0.5">
                        <Label htmlFor="employee_id">
                            Employee <span className="text-red-500">*</span>
                        </Label>
                        {isEdit ? (
                            <TextInput
                                id="employee_id"
                                value={selectedEmployeeName}
                                readOnly
                                disabled
                                className="bg-gray-100"
                            />
                        ) : (
                            <ReactSelectInput
                                name="employee_id"
                                options={employeesNoSchedule.map((emp) => ({
                                    id: emp.id,
                                    name: `${emp.first_name} ${emp.last_name}`,
                                }))}
                                selected={
                                    formData.employee_id
                                        ? employeesNoSchedule.find(
                                              (emp) =>
                                                  emp.id.toString() ===
                                                  formData.employee_id.toString()
                                          )
                                        : null
                                }
                                onChange={(value) =>
                                    handleFormChange({
                                        target: { name: "employee_id", value },
                                    })
                                }
                                placeholder="Select Employee"
                                displayKey="name"
                                valueKey="id"
                                required
                                error={errors.employee_id}
                                className={
                                    errors.employee_id ? "border-red-500" : ""
                                }
                            />
                        )}
                        {errors.employee_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.employee_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="schedule_type">
                            Schedule Type{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            id="schedule_type"
                            name="schedule_type"
                            value={formData.schedule_type}
                            onChange={handleFormChange}
                            required
                            className={
                                errors.schedule_type ? "border-red-500" : ""
                            }
                        >
                            <option value="fixed">Fixed</option>
                            <option value="flexible">Flexible</option>
                        </Select>
                        {errors.schedule_type && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.schedule_type}
                            </p>
                        )}
                    </div>
                    {formData.schedule_type === "fixed" ? (
                        <>
                            <div>
                                <Label htmlFor="working_days">
                                    Working Days{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    {daysOfWeek.map((day) => (
                                        <div
                                            key={day}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={day}
                                                value={day}
                                                checked={formData.working_days.includes(
                                                    day
                                                )}
                                                onChange={handleCheckboxChange}
                                            />
                                            <Label htmlFor={day}>
                                                {day.toUpperCase()}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.working_days && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.working_days}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="start_time">
                                    Start Time{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <TextInput
                                    id="start_time"
                                    name="start_time"
                                    type="time"
                                    value={formData.start_time}
                                    onChange={handleFormChange}
                                    required
                                    className={
                                        errors.start_time
                                            ? "border-red-500"
                                            : ""
                                    }
                                />
                                {errors.start_time && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.start_time}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="end_time">
                                    End Time{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <TextInput
                                    id="end_time"
                                    name="end_time"
                                    type="time"
                                    value={formData.end_time}
                                    onChange={handleFormChange}
                                    required
                                    className={
                                        errors.end_time ? "border-red-500" : ""
                                    }
                                />
                                {errors.end_time && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.end_time}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div>
                            <Label htmlFor="flexible_days">
                                Flexible Days{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2 mt-2">
                                {formData.flexible_days.map((day, index) => (
                                    <div
                                        key={day.day}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`flex-${day.day}`}
                                            checked={!!(day.start && day.end)}
                                            onChange={(event) => {
                                                if (!event.target.checked) {
                                                    handleFlexibleDayChange(
                                                        index,
                                                        "start",
                                                        ""
                                                    );
                                                    handleFlexibleDayChange(
                                                        index,
                                                        "end",
                                                        ""
                                                    );
                                                } else {
                                                    handleFlexibleDayChange(
                                                        index,
                                                        "start",
                                                        "09:00"
                                                    );
                                                    handleFlexibleDayChange(
                                                        index,
                                                        "end",
                                                        "18:30"
                                                    );
                                                }
                                            }}
                                        />
                                        <Label
                                            htmlFor={`flex-${day.day}`}
                                            className="w-16"
                                        >
                                            {day.day.toUpperCase()}
                                        </Label>
                                        <TextInput
                                            type="time"
                                            value={day.start}
                                            onChange={(event) =>
                                                handleFlexibleDayChange(
                                                    index,
                                                    "start",
                                                    event.target.value
                                                )
                                            }
                                            className={
                                                errors.flexible_days
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        />
                                        <TextInput
                                            type="time"
                                            value={day.end}
                                            onChange={(event) =>
                                                handleFlexibleDayChange(
                                                    index,
                                                    "end",
                                                    event.target.value
                                                )
                                            }
                                            className={
                                                errors.flexible_days
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                            {errors.flexible_days && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.flexible_days}
                                </p>
                            )}
                        </div>
                    )}
                    <div>
                        <Label htmlFor="effective_from">
                            Effective From{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <TextInput
                            id="effective_from"
                            name="effective_from"
                            type="date"
                            required
                            value={formData.effective_from}
                            onChange={handleFormChange}
                            className={
                                errors.effective_from ? "border-red-500" : ""
                            }
                        />
                        {errors.effective_from && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.effective_from}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="effective_until">Effective Until</Label>
                        <TextInput
                            id="effective_until"
                            name="effective_until"
                            type="date"
                            value={
                                formData.effective_until
                                    ? formData.effective_until
                                    : ""
                            }
                            onChange={handleFormChange}
                            className={
                                errors.effective_until ? "border-red-500" : ""
                            }
                        />
                        {errors.effective_until && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.effective_until}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button color="gray" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" color="blue">
                            {title === "Add Schedule" ? "Create" : "Update"}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default BaseEmployeeScheduleModal;
