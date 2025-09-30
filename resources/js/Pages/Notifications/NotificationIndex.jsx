import { useEffect, useState, useRef } from "react";
import axios from "axios";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";

export default function NotificationsPage() {
    const [allNotifications, setAllNotifications] = useState([]);
    const [grouped, setGrouped] = useState({ today: [], earlier: [] });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPrevious, setShowPrevious] = useState(false);
    const bottomRef = useRef(null);

    const groupByDate = (notifications) => {
        const todayStr = new Date().toDateString();
        const today = [];
        const earlier = [];

        for (const notif of notifications) {
            const notifDate = new Date(notif.created_at).toDateString();
            (notifDate === todayStr ? today : earlier).push(notif);
        }

        return { today, earlier };
    };

    const fetchNotifications = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        console.log("Fetching page:", page);

        try {
            const res = await axios.get("/api/notifications", {
                params: { page, per_page: 5 },
            });

            const newData = res.data.data;
            const current = res.data.current_page;
            const last = res.data.last_page;

            const combined = [...allNotifications, ...newData];
            const groupedData = groupByDate(combined);

            setAllNotifications(combined);
            setGrouped(groupedData);
            setHasMore(current < last);
            setPage((prev) => prev + 1);
        } catch (err) {
            console.error("Error fetching:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(); // Initial fetch for "Today" group
    }, []);

    useEffect(() => {
        if (!showPrevious) return;
        console.log(
            "Observer setup, showPrevious is true, earlier length:",
            grouped.earlier.length
        );

        const scrollableContainer = document.querySelector(
            ".scrollable-container"
        );
        const observer = new IntersectionObserver(
            (entries) => {
                console.log(
                    "Intersection observed:",
                    entries[0].isIntersecting,
                    "isVisible:",
                    entries[0].isIntersecting &&
                        entries[0].intersectionRatio > 0.1
                );
                if (
                    entries[0].isIntersecting &&
                    hasMore &&
                    !loading &&
                    entries[0].intersectionRatio > 0.1
                ) {
                    console.log("Fetching more notifications for page:", page);
                    fetchNotifications();
                }
            },
            { threshold: 0.1, root: scrollableContainer } // Use the valid class
        );

        if (bottomRef.current) {
            console.log("Observing element:", bottomRef.current);
            observer.observe(bottomRef.current);
        }

        return () => {
            if (bottomRef.current) {
                console.log("Unobserving element");
                observer.unobserve(bottomRef.current);
            }
        };
    }, [showPrevious, hasMore, loading, grouped.earlier]); // Re-run when "Earlier" group changes

    const Skeleton = () => (
        <div className="flex gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="w-10 h-10 bg-gray-300 rounded-full dark:bg-gray-600" />
            <div className="flex flex-col flex-1 gap-2">
                <div className="w-2/3 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
                <div className="w-1/3 h-3 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
        </div>
    );

    const NotificationItem = ({ n }) => (
        <div className="flex gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5">
            {/* <img
                className="w-10 h-10 rounded-full object-cover"
                src={`/storage/${
                    n.employee?.profile_photo_url || "images/user/default.jpg"
                }`}
                alt="User"
            /> */}
            <img
                src={
                    n.employee?.avatar
                        ? `/storage/${n.employee?.avatar}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              n.employee?.first_name +
                                  " " +
                                  n.employee?.last_name
                          )}&background=random&color=fff`
                }
                alt={n.employee?.first_name + " " + n.employee?.last_name}
                className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
                <div className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>{n.employee?.first_name || "Unknown"}</strong>{" "}
                    {n.message}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                </div>
            </div>
        </div>
    );

    const handleSeePrevious = () => {
        console.log("Button clicked, setting showPrevious to true");
        setShowPrevious(true);
        fetchNotifications(); // Load initial "Earlier" data on button click
    };

    return (
        <DashboardLayout>
            <Head title="Notifications" />
            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Notifications
                </h3>
                <BreadCrumbs />
            </div>
            <div className="max-w-xl mx-auto mt-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                <h1 className="px-4 py-4 text-xl font-semibold border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    Notifications
                </h1>

                <div
                    className="scrollable-container h-[60vh] overflow-y-auto"
                    style={{ minHeight: "400px" }}
                >
                    {/* Today Group */}
                    {grouped.today.length > 0 && (
                        <>
                            <div className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400">
                                Today
                            </div>
                            {grouped.today.map((n) => (
                                <NotificationItem key={n.id} n={n} />
                            ))}
                        </>
                    )}

                    {/* Earlier Group */}
                    {grouped.earlier.length > 0 && (
                        <>
                            <div className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400">
                                Earlier
                            </div>
                            {grouped.earlier.map((n, index) =>
                                index === grouped.earlier.length - 1 ? (
                                    <div key={n.id} ref={bottomRef}>
                                        <NotificationItem n={n} />
                                    </div>
                                ) : (
                                    <NotificationItem key={n.id} n={n} />
                                )
                            )}
                        </>
                    )}

                    {/* Loading State */}
                    {showPrevious && loading && (
                        <>
                            <Skeleton />
                            <Skeleton />
                            <Skeleton />
                        </>
                    )}

                    {/* "See Previous Notifications" Button */}
                    {!showPrevious && hasMore && (
                        <div className="text-center my-4">
                            <button
                                onClick={handleSeePrevious}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                            >
                                See Previous Notifications
                            </button>
                        </div>
                    )}

                    {/* End Message */}
                    {showPrevious && !hasMore && !loading && (
                        <div className="p-4 text-center text-sm text-gray-400">
                            You’ve reached the end
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
