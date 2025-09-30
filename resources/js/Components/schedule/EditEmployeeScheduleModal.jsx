import { useEffect } from "react";
import { router } from "@inertiajs/react";
import { toast } from "react-toastify";
import BaseEmployeeScheduleModal from "./BaseEmployeeScheduleModal";

const EditEmployeeScheduleModal = ({
    show,
    onClose,
    selectedSchedule,
    employeesNoSchedule,
}) => {
    const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    const parseWorkingDays = (workingDays) => {
        if (typeof workingDays === "string") {
            try {
                return JSON.parse(workingDays);
            } catch (e) {
                console.error(
                    `Failed to parse working_days for schedule ${selectedSchedule?.id}:`,
                    { workingDays, error: e.message }
                );
                return [];
            }
        }
        return workingDays;
    };

    const initialData = selectedSchedule
        ? {
              employee_id: selectedSchedule.employee_id,
              schedule_type: selectedSchedule.schedule_type,
              working_days:
                  selectedSchedule.schedule_type === "fixed"
                      ? Array.isArray(
                            parseWorkingDays(selectedSchedule.working_days)
                        )
                          ? parseWorkingDays(selectedSchedule.working_days)
                          : []
                      : [],
              flexible_days:
                  selectedSchedule.schedule_type === "flexible"
                      ? daysOfWeek.map((day) => ({
                            day,
                            start:
                                parseWorkingDays(selectedSchedule.working_days)[
                                    day
                                ]?.[0] || "",
                            end:
                                parseWorkingDays(selectedSchedule.working_days)[
                                    day
                                ]?.[1] || "",
                        }))
                      : daysOfWeek.map((day) => ({
                            day,
                            start: "",
                            end: "",
                        })),
              start_time: (selectedSchedule.start_time || "09:00").slice(0, 5),
              end_time: (selectedSchedule.end_time || "17:00").slice(0, 5),
              effective_from:
                  new Date(selectedSchedule.effective_from)
                      .toISOString()
                      .split("T")[0] || "",
              effective_until: selectedSchedule.effective_until
                  ? new Date(selectedSchedule.effective_until)
                        .toISOString()
                        .split("T")[0]
                  : "",
          }
        : {
              employee_id: "",
              schedule_type: "fixed",
              working_days: [],
              flexible_days: daysOfWeek.map((day) => ({
                  day,
                  start: "",
                  end: "",
              })),
              start_time: "09:00",
              end_time: "17:00",
              effective_from: new Date().toISOString().split("T")[0],
              effective_until: "",
          };

    const selectedEmployeeName = selectedSchedule
        ? `${selectedSchedule.employee.first_name} ${selectedSchedule.employee.last_name}`
        : "";

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

        router.put(
            route("schedules.employee.update", selectedSchedule.id),
            data,
            {
                onSuccess: () => {
                    toast.success("Schedule updated!");
                    onClose();
                },
                onError: (errors) => {
                    console.error("Update errors:", errors);
                    toast.error("Failed to update schedule.");
                },
            }
        );
    };

    return (
        <BaseEmployeeScheduleModal
            show={show}
            onClose={onClose}
            title="Edit Schedule"
            initialData={initialData}
            employeesNoSchedule={employeesNoSchedule}
            onSubmit={handleSubmit}
            isEdit={true}
            selectedEmployeeName={selectedEmployeeName}
        />
    );
};

export default EditEmployeeScheduleModal;
