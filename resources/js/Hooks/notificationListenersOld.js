import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Bell } from "lucide-react";

export const useNotificationListeners = () => {
    const [unreadCountLeave, setUnreadCountLeave] = useState(0);

    useEffect(() => {
        if (typeof window.Echo !== "undefined") {
            const channel = window.Echo.channel("leave-requests");

            channel.listen("NewLeaveRequest", (data) => {
                const message = `New leave request from ${data.employeeName}`;
                setUnreadCountLeave((prev) => prev + 1);
                toast.success(message, {
                    autoClose: 5000,
                    icon: <Bell color="blue" size={20} />,
                });
            });

            return () => {
                channel.stopListening("NewLeaveRequest");
            };
        } else {
            console.error(
                "Laravel Echo is not defined. Check your bootstrap.js and asset compilation."
            );
        }
    }, []);

    const handleNotificationClick = () => {
        setUnreadCountLeave(0); // Reset unread count when clicked
        console.log("Notifications clicked");
        // Optionally, add logic to display a dropdown or modal
    };

    return { unreadCountLeave, handleNotificationClick };
};
