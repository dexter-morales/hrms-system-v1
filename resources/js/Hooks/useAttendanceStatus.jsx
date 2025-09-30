import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faTimes,
    faCircle,
    faCircleDot,
    faUmbrellaBeach,
} from "@fortawesome/free-solid-svg-icons";

export const useAttendanceStatus = ({
    attendances,
    schedules,
    holidays,
    selectedYear,
    selectedMonth,
}) => {
    // Format date string for the selected month and year with leading zeros
    const formatDate = (day) => {
        const month = selectedMonth.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        return `${selectedYear}-${month}-${dayStr}`;
    };

    // Check if the given day is a holiday based on the holidays array
    const isHoliday = (day) => {
        const date = formatDate(day);
        return holidays.find((h) => h.date_holiday === date);
    };

    // Retrieve the schedule for an employee on a specific date
    const getSchedule = (employeeId, date) => {
        const dayOfWeek = new Date(date)
            .toLocaleString("en-US", { weekday: "short" })
            .toLowerCase();
        const schedule = schedules.find(
            (s) =>
                s.employee_id === employeeId &&
                (!s.effective_from || s.effective_from <= date) &&
                (!s.effective_until || s.effective_until >= date)
        );

        if (!schedule) {
            console.log(
                `No schedule found for employee ${employeeId} on ${date}`
            );
            return null;
        }

        const workingDays = schedule.working_days;

        let startTime, endTime;
        if (schedule.schedule_type === "fixed") {
            // Check if the day is a working day according to the schedule
            if (!workingDays.includes(dayOfWeek)) {
                console.log(
                    `Not a working day: ${dayOfWeek} for employee ${employeeId}`
                );
                return null;
            }
            startTime = schedule.start_time;
            endTime = schedule.end_time;
        } else {
            // Handle flexible schedule based on day of week
            if (!workingDays[dayOfWeek]) {
                console.log(
                    `No flexible schedule for ${dayOfWeek} for employee ${employeeId}`
                );
                return null;
            }
            [startTime, endTime] = workingDays[dayOfWeek];
        }

        const hours =
            (new Date(`${date}T${endTime}`) -
                new Date(`${date}T${startTime}`)) /
            (1000 * 60 * 60);
        console.log(
            `Schedule for ${employeeId} on ${date}: ${startTime}-${endTime} (${hours} hours)`
        );

        return {
            start_time: startTime,
            end_time: endTime,
            hours: hours > 0 ? hours : 0,
        };
    };

    // Determine attendance status for a given employee and day
    const getAttendanceStatus = useCallback(
        (employee, day) => {
            const employeeId = employee.id;
            const payrollStatus =
                employee.payroll_status?.toLowerCase() || "none";
            const date = formatDate(day);
            const record = attendances.find(
                (a) => a.employee_id === employeeId && a.date === date
            );
            const schedule = getSchedule(employeeId, date);
            const holiday = isHoliday(day);
            const dayOfWeek = new Date(date).getDay(); // 0 (Sunday) to 6 (Saturday)

            // Handle holiday scenarios
            if (holiday) {
                if (!record || !record.punch_in || !record.punch_out) {
                    return {
                        icon:
                            payrollStatus === "weekly" ? (
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    className="text-red-500 text-lg"
                                />
                            ) : (
                                <FontAwesomeIcon
                                    icon={faCircleDot}
                                    className="text-green-500 text-sm"
                                />
                            ),
                        status: "holiday-absent",
                    };
                }

                const punchIn = new Date(record.punch_in);
                const punchOut = new Date(record.punch_out);
                const workedHours = (punchOut - punchIn) / (1000 * 60 * 60);

                if (!schedule) {
                    return {
                        icon: (
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                        ),
                        status: "holiday-partial",
                    };
                }

                const scheduleStart = new Date(
                    `${date}T${schedule.start_time}`
                );
                const scheduleEnd = new Date(`${date}T${schedule.end_time}`);
                const scheduleHours = schedule.hours;
                const midpoint = new Date(
                    scheduleStart.getTime() + (scheduleEnd - scheduleStart) / 2
                );

                const isMorning =
                    punchIn <=
                    new Date(scheduleStart.getTime() + 30 * 60 * 1000);
                const isLate = punchIn > midpoint;

                if (workedHours >= scheduleHours) {
                    return {
                        icon: (
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                        ),
                        status: "holiday-full",
                    };
                } else if (isMorning && workedHours < scheduleHours / 2) {
                    return {
                        icon: (
                            <div className="flex gap-1 justify-center items-center">
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className="text-green-500 text-lg"
                                />
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    className="text-red-500 text-lg"
                                />
                            </div>
                        ),
                        status: "holiday-morning",
                    };
                } else if (isLate && workedHours < scheduleHours) {
                    return {
                        icon: (
                            <div className="flex gap-1 justify-center items-center">
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    className="text-red-500 text-lg"
                                />
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    className="text-green-500 text-lg"
                                />
                            </div>
                        ),
                        status: "holiday-afternoon",
                    };
                }

                return {
                    icon: (
                        <FontAwesomeIcon
                            icon={faCheck}
                            className="text-green-500 text-lg"
                        />
                    ),
                    status: "holiday-partial",
                };
            }

            // Handle weekend (Saturday/Sunday) with no punch-in/out
            if (
                (dayOfWeek === 0 || dayOfWeek === 6) && // Sunday or Saturday
                (!record || !record.punch_in || !record.punch_out)
            ) {
                return {
                    icon: (
                        <FontAwesomeIcon
                            icon={faUmbrellaBeach}
                            className="text-blue-500 text-lg"
                        />
                    ),
                    status: "weekend-off",
                };
            }

            // Handle regular days with no punch-in/out
            if (!record || !record.punch_in || !record.punch_out) {
                const status = schedule ? "absent" : "none";
                return {
                    icon: schedule ? (
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="text-red-500 text-lg"
                        />
                    ) : null,
                    status,
                };
            }

            const punchIn = new Date(record.punch_in);
            const punchOut = new Date(record.punch_out);
            const workedHours = (punchOut - punchIn) / (1000 * 60 * 60);

            if (!schedule) {
                return {
                    icon: (
                        <FontAwesomeIcon
                            icon={faCheck}
                            className="text-green-500 text-lg"
                        />
                    ),
                    status: "",
                };
            }

            const scheduleStart = new Date(`${date}T${schedule.start_time}`);
            const scheduleEnd = new Date(`${date}T${schedule.end_time}`);
            const scheduleHours = schedule.hours;
            const midpoint = new Date(
                scheduleStart.getTime() + (scheduleEnd - scheduleStart) / 2
            );

            const isMorning =
                punchIn <= new Date(scheduleStart.getTime() + 30 * 60 * 1000);
            const isLate = punchIn > midpoint;

            if (workedHours >= scheduleHours) {
                return {
                    icon: (
                        <FontAwesomeIcon
                            icon={faCheck}
                            className="text-green-500 text-lg"
                        />
                    ),
                    status: "full",
                };
            } else if (isMorning && workedHours < scheduleHours / 2) {
                return {
                    icon: (
                        <div className="flex gap-1 justify-center items-center">
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-red-500 text-lg"
                            />
                        </div>
                    ),
                    status: "morning",
                };
            } else if (isLate && workedHours < scheduleHours) {
                return {
                    icon: (
                        <div className="flex gap-1 justify-center items-center">
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-red-500 text-lg"
                            />
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-green-500 text-lg"
                            />
                        </div>
                    ),
                    status: "afternoon",
                };
            }

            return {
                icon: (
                    <FontAwesomeIcon
                        icon={faCheck}
                        className="text-green-500 text-lg"
                    />
                ),
                status: "partial",
            };
        },
        [attendances, schedules, holidays, selectedYear, selectedMonth]
    );

    return { getAttendanceStatus };
};
