import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Bell } from "lucide-react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";

export const useNotificationListeners = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadCountLeave, setUnreadCountLeave] = useState(0);

    const { auth } = usePage().props;

    const notificator = (message) => {
        toast.success(message, {
            autoClose: 5000,
            icon: <Bell color="blue" size={20} />,
        });
    };

    // ✅ Reusable fetch unread count
    const fetchUnreadCount = () => {
        axios
            .get("/notifications/unread-count")
            .then((response) => {
                setUnreadCount(response.data.unreadCount || 0);
                setUnreadCountLeave(response.data.unreadLeaveCount || 0);
            })
            .catch((error) =>
                console.error("Failed to fetch unread count:", error)
            );
    };

    // ✅ Handler for click on notification bell
    const handleNotificationClick = () => {
        setUnreadCount(0);
        setUnreadCountLeave(0);

        axios
            .patch("/notifications/mark-all-read") // Optional backend support
            .catch((error) =>
                console.error("Failed to mark all as read:", error)
            );
    };

    useEffect(() => {
        if (!window?.Echo || !auth?.user) return;

        const user = auth.user;

        const leaveChannel = window.Echo.private("leave-requests")
            .subscribed(() => console.log("✅ Subscribed to leave-requests"))
            .error((e) =>
                console.error("❌ leave-requests subscription error:", e)
            );

        leaveChannel.listen("NewLeaveRequestEvent", (data) => {
            try {
                fetchUnreadCount();
                notificator(data.message);
                console.log("📨 Leave Request Received:", data);
                // your handler
            } catch (err) {
                console.error("❌ Listener failed:", err);
            }
        });

        const managerChannel = window.Echo.private(
            `manager.${user.employee.id}`
        )
            .subscribed(() =>
                console.log(`✅ Subscribed to manager.${user.employee.id}`)
            )
            .error((e) => console.error("❌ manager channel error:", e));

        managerChannel.listen("NewLeaveRequestEvent", (data) => {
            try {
                fetchUnreadCount();
                notificator(data.message);
                console.log("📨 Manager Notification Received:", data);
                // your handler
            } catch (err) {
                console.error("❌ Manager listener failed:", err);
            }
        });

        return () => {
            leaveChannel.stopListening("NewLeaveRequestEvent");
            managerChannel.stopListening("NewLeaveRequestEvent");
        };
    }, [auth]);

    useEffect(() => {
        if (!window?.Echo || !auth?.user) return;

        const user = auth.user;

        const employeeChannel = window.Echo.private(
            `employee.${auth.user.employee.id}`
        )
            .subscribed(() =>
                console.log(`✅ Subscribed to employee.${user.employee.id}`)
            )
            .error((e) => console.error("❌ employee channel error:", e));

        employeeChannel.listen("EmployeeNotificationEvent", (data) => {
            // toast(data.message, {
            //     icon: <Bell size={20} />,
            //     duration: 5000,
            // });
            try {
                fetchUnreadCount();
                router.reload({ only: ["leaves"] });
                notificator(data.message);
                console.log("📨 Employee Notification Received:", data);
                // your handler
            } catch (err) {
                console.error("❌ Employee listener failed:", err);
            }

            // axios
            //     .post("/notifications", {
            //         employee_id: auth.user.employee?.id,
            //         message: data.message,
            //     })
            //     .then(() => setUnreadCount((prev) => prev + 1))
            //     .catch((err) =>
            //         console.error("Failed to save employee notification:", err)
            //     );
        });

        return () => {
            employeeChannel.stopListening("EmployeeNotificationEvent");
        };
    }, [auth]);

    return {
        unreadCount,
        unreadCountLeave,
        handleNotificationClick,
        fetchUnreadCount,
    };
};
