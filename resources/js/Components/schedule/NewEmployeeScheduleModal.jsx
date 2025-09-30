import { router } from "@inertiajs/react";
import { toast } from "react-toastify";
import BaseEmployeeScheduleModal from "./BaseEmployeeScheduleModal";

const NewEmployeeScheduleModal = ({ show, onClose, employeesNoSchedule }) => {
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    const initialData = {
        employee_id: "",
        schedule_type: "fixed",
        working_days: [],
        flexible_days: daysOfWeek.map((day) => ({
            day,
            start: "",
            end: "",
        })),
        start_time: "09:00",
        end_time: "18:30",
        effective_from: getTodayDate(),
        effective_until: "",
    };

    const handleSubmit = (formData) => {
        const data = {
            employee_id: formData.employee_id,
            schedule_type: formData.schedule_type,
            working_days:
                formData.schedule_type === "fixed"
                    ? formData.working_days
                    : null,
            flexible_days:
                formData.schedule_type === "flexible"
                    ? formData.flexible_days.filter((d) => d.start && d.end)
                    : null,
            start_time:
                formData.schedule_type === "fixed" ? formData.start_time : null,
            end_time:
                formData.schedule_type === "fixed" ? formData.end_time : null,
            effective_from: formData.effective_from,
            effective_until: formData.effective_until || null,
        };

        router.post(route("schedules.employee.store"), data, {
            onSuccess: () => {
                toast.success("Schedule created!");
                onClose();
            },
            onError: (errors) => {
                console.error("Create errors:", errors);
                toast.error("Failed to create schedule.");
            },
        });
    };

    return (
        <BaseEmployeeScheduleModal
            show={show}
            onClose={onClose}
            title="Add Schedule"
            initialData={initialData}
            employeesNoSchedule={employeesNoSchedule}
            onSubmit={handleSubmit}
        />
    );
};

export default NewEmployeeScheduleModal;
