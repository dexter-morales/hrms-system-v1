import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Bell } from "lucide-react";
import axios from "axios";
import { usePage } from "@inertiajs/react";

export const useNotificationListeners = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadCountLeave, setUnreadCountLeave] = useState(0);

    const { auth } = usePage().props;

    useEffect(() => {
        if (typeof window.Echo !== "undefined") {
            // Subscribe to the private channel with authentication
            const channel = window.Echo.private(`leave-requests.private`);

            channel.listen("NewLeaveRequest", (data) => {
                const message = `New leave request from ${data.employeeName}`;
                // Use the authenticated user's employee ID or the event's employeeId if provided
                const employeeId = data.employeeId || auth.user.employee?.id;
                if (!employeeId) {
                    console.error("Employee ID not found for notification");
                    return;
                }

                axios
                    .post("/notifications", {
                        employee_id: employeeId,
                        message,
                    })
                    .then(() => {
                        setUnreadCountLeave((prev) => prev + 1);
                        toast.success(message, {
                            autoClose: 5000,
                            icon: <Bell color="blue" size={20} />,
                        });
                    })
                    .catch((error) => {
                        console.error("Failed to save notification:", error);
                    });

                // Refresh unread count
                fetchUnreadCount();
            });

            // Cleanup listener on unmount
            return () => {
                channel.stopListening("NewLeaveRequest");
            };
        } else {
            console.error(
                "Laravel Echo is not defined. Check your bootstrap.js and asset compilation."
            );
        }
    }, [auth]); // Dependency on auth to re-subscribe if user changes

    const fetchUnreadCount = () => {
        axios
            .get("/notifications/unread-count")
            .then((response) => {
                setUnreadCount(response.data.unreadCount);
            })
            .catch((error) =>
                console.error("Failed to fetch unread count:", error)
            );
    };

    const handleNotificationClick = () => {
        setUnreadCount(0); // Reset locally, backend update can be handled separately
        // Optionally, mark all as read via API
        axios
            .patch("/notifications/mark-all-read") // Add this route if needed
            .catch((error) =>
                console.error("Failed to mark all as read:", error)
            );
    };
    return {
        unreadCount,
        unreadCountLeave,
        handleNotificationClick,
        fetchUnreadCount,
    };
};
