import React, { useEffect, useState } from "react";
import NavbarSidebarLayout from "./NavbarSidebarLayout";
import {
    Sidebar,
    Avatar,
    Dropdown,
    Button,
    Drawer,
    DropdownHeader,
    DropdownItem,
    SidebarItems,
    SidebarItemGroup,
    SidebarCollapse,
    SidebarItem,
    DrawerHeader,
    DrawerItems,
    DropdownDivider,
} from "flowbite-react";
import {
    CalendarIcon,
    CogIcon,
    CurrencyDollarIcon,
    FolderOpenIcon,
    MenuIcon,
} from "@heroicons/react/outline";

import {
    ChartBarIcon,
    UserCircleIcon,
    LogoutIcon,
    UserIcon,
    DocumentReportIcon,
    XIcon,
} from "@heroicons/react/outline";
import { Head, Link, usePage } from "@inertiajs/react";
import { useDataStore } from "@/Context/DataStoreContext";
import Header from "@/Components/header/Header";
// import { navItemsByRole } from "@/utils/navConfigs";
import { getNavForRole } from "@/utils/navConfigs";
import { ToastContainer } from "react-toastify";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { Bell } from "lucide-react";
import { useNotificationListeners } from "@/Hooks/notificationListeners";

const DashboardLayout = ({ children }) => {
    const { url } = usePage();

    // console.log("Data Employee", usePage().props);

    const { auth, company_settings, flash } = usePage().props;

    useEffect(() => {
        // console.log("Flash: ", flash);
        // if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const {
        unreadCountLeave,
        handleNotificationClick,
        unreadCount,
        fetchUnreadCount,
    } = useNotificationListeners();

    useEffect(() => {
        fetchUnreadCount();
    }, [auth]);

    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const { isSidebarMobileOpen, setIsSideisSidebarMobileOpen } =
        useDataStore();

    // const [isOpen, setIsOpen] = useState(false);
    const handleClose = () => setIsSideisSidebarMobileOpen(false);

    // const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [openCollapseIndex, setOpenCollapseIndex] = useState(null);
    const [userToggledIndexes, setUserToggledIndexes] = useState(new Set()); // keeps track of what user has toggled

    const handleCollapseToggle = (index) => {
        const newSet = new Set(userToggledIndexes);
        if (newSet.has(index)) {
            newSet.delete(index);
            if (openCollapseIndex === index) setOpenCollapseIndex(null);
        } else {
            newSet.add(index);
            setOpenCollapseIndex(index);
        }
        setUserToggledIndexes(newSet);
    };

    const renderSidebarItems = () => (
        <SidebarItems>
            <SidebarItemGroup className="sidebarItemGroup border-t-0 ">
                {navItems.map((item, index) => {
                    const isUserToggled = userToggledIndexes.has(index);
                    const shouldBeOpen = isUserToggled
                        ? openCollapseIndex === index
                        : item.active || openCollapseIndex === index;

                    return (
                        <div key={index} className="sidebarItemWrapper ">
                            {item.header && (
                                <div className="p-2">
                                    <span className="px-4 text-xs font-semibold text-white uppercase hover:bg-transparent">
                                        {item.header}
                                    </span>
                                </div>
                            )}

                            {item.children ? (
                                <div
                                    className={`w-full ${
                                        item.active && "bg-slate-800/50"
                                    }`}
                                >
                                    <SidebarCollapse
                                        icon={item.icon}
                                        label={item.label}
                                        open={shouldBeOpen}
                                        onClick={() =>
                                            handleCollapseToggle(index)
                                        }
                                        // className={`sidebarCollapse  ${
                                        //     item.active
                                        //         ? "text-slate-800 bg-white font-semibold sidebarCollapseActive"
                                        //         : "!text-slate-300 hover:!text-slate-700 hover:!font-semibold"
                                        // }`}
                                        className={`sidebarCollapse px-4  ${
                                            item.active
                                                ? "!text-white font-semibold sidebarCollapseActives "
                                                : "!text-slate-300 hover:!text-slate-700 hover:!font-semibold"
                                        }`}
                                    >
                                        {/* <span className="absolute inline-flex w-full h-full bg-red-700 rounded-full opacity-75 animate-ping"></span> */}
                                        {item.children.map(
                                            (child, childIndex) => (
                                                <Link
                                                    href={child.href}
                                                    key={childIndex}
                                                >
                                                    <SidebarItem
                                                        // active={child.active}
                                                        className={`my-0.5 ${
                                                            child.active
                                                                ? "font-semibold !text-red-500 underline"
                                                                : "!text-slate-300 hover:!text-slate-700 hover:!font-semibold"
                                                        }`}
                                                    >
                                                        {child.label}
                                                    </SidebarItem>
                                                </Link>
                                            )
                                        )}
                                    </SidebarCollapse>
                                </div>
                            ) : (
                                <Link href={item.href}>
                                    <SidebarItem
                                        icon={item.icon}
                                        active={item.active}
                                        className={`sidebarItem px-4  ${
                                            item.active
                                                ? "font-semibold sidebarItemActive sidebarItemHeaderActive !text-white hover:!text-slate-800"
                                                : "!text-slate-300 hover:!text-slate-700 hover:!font-semibold"
                                        }`}
                                    >
                                        <div className="relative">
                                            {item.label}
                                            <span
                                                className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-red-700 ${
                                                    !item.active
                                                        ? "hidden"
                                                        : "flex"
                                                }`}
                                            >
                                                <span className="absolute inline-flex w-full h-full bg-red-700 rounded-full opacity-75 animate-ping"></span>
                                            </span>
                                        </div>
                                    </SidebarItem>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </SidebarItemGroup>
        </SidebarItems>
    );

    const [setupNavItems, setSetupNavItems] = useState([]);

    useEffect(() => {
        const role = auth?.user?.roles?.[0]?.name;
        const firstSegment = url.split("/")[1];

        // Ensure role is passed properly to the function
        const roleNav = getNavForRole(role) || [];

        // Add `active` keys dynamically
        const markActive = (items) =>
            items.map((item) => {
                const active =
                    (item.href && url.includes(item.href)) ||
                    item.children?.some((child) => url.includes(child.href));
                return {
                    ...item,
                    active,
                    children: item.children
                        ? markActive(item.children)
                        : undefined,
                };
            });

        setSetupNavItems(markActive(roleNav));
    }, [auth, url]);

    const navItems = setupNavItems; // no need for wrapping again in [setupNavItems]

    // useEffect(() => {
    //     if (typeof window.Echo !== "undefined") {
    //         const channel = window.Echo.channel("test-channel");
    //         channel.listen(".TestEvent", (data) => {
    //             console.log("Test event received:", data.message);
    //         });
    //     }
    // }, []);
    // console.log("Broadcaster:", window); // should show "reverb"

    // useEffect(() => {
    //     if (typeof window.Echo !== "undefined") {
    //         const channel = window.Echo.channel("leave-requests");

    //         channel.listen("NewLeaveRequest", (data) => {
    //             const message = `New leave request from ${data.employeeName}`;
    //             // setNotifications((prev) => [
    //             //     ...prev,
    //             //     { id: Date.now(), message, read: false },
    //             // ]);
    //             setUnreadCount((prev) => prev + 1);
    //             toast.success(message, {
    //                 autoClose: 5000,
    //                 icon: <Bell color="blue" size={20} />,
    //             });
    //         });

    //         return () => {
    //             channel.stopListening("NewLeaveRequest");
    //         };
    //     }
    // }, []);
    // useEffect(() => {
    //     const channel = echo.channel("leave-requests");

    //     channel.listen(".NewLeaveRequest", (data) => {
    //         const message = `New leave request from ${data.employeeName}`;

    //         // 🔔 Optional: Update UI state
    //         // setNotifications((prev) => [...prev, { id: Date.now(), message, read: false }]);
    //         // setUnreadCount((prev) => prev + 1);

    //         toast.success(message, {
    //             duration: 5000,
    //             icon: <Bell color="blue" size={20} />,
    //         });
    //     });

    //     return () => {
    //         echo.leave("leave-requests");
    //     };
    // }, []);

    return (
        <div className="bg-white dark:bg-gray-900">
            <Toaster position="top-right" />
            {/* Sidebar */}
            <div className="hidden md:block w-64 bg-white dark:bg-gray-800 fixed top-0 left-0 h-screen z-10 shadow-md">
                <Sidebar className="h-full  sideBarAdmin">
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center p-4 ">
                            <div className="flex items-center w-full justify-center space-x-1">
                                <img
                                    src={
                                        company_settings?.company_logo
                                            ? `/storage/${company_settings?.company_logo}`
                                            : "https://img.freepik.com/free-vector/abstract-logo-flame-shape_1043-44.jpg"
                                    }
                                    alt="Current Logo"
                                    className="rounded-full w-20 h-20"
                                />
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="md:hidden"
                            >
                                <XIcon className="h-6 w-6 text-gray-700 dark:text-white" />
                            </button>
                        </div>
                        {renderSidebarItems()}
                    </div>
                </Sidebar>
            </div>

            <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 md:ml-64">
                <Drawer
                    open={isSidebarMobileOpen}
                    onClose={handleClose}
                    className="p-0 w-auto lg:hidden flex"
                    style={{ zIndex: 60 }}
                >
                    <Sidebar
                        aria-label="Sidebar with multi-level dropdown example"
                        className="[&>div]:bg-transparent [&>div]:p-0 mobileSidebarAdmin"
                    >
                        <div className="flex justify-between items-center p-4">
                            <div className="flex items-center space-x-2">
                                <img
                                    src={
                                        company_settings?.company_logo
                                            ? `/storage/${company_settings?.company_logo}`
                                            : "https://img.freepik.com/free-vector/abstract-logo-flame-shape_1043-44.jpg"
                                    }
                                    alt="Current Logo"
                                    className="rounded-full w-12 h-12"
                                />
                            </div>
                            <button
                                onClick={() =>
                                    setIsSideisSidebarMobileOpen(false)
                                }
                            >
                                <XIcon className="h-6 w-6 text-gray-700 dark:text-white" />
                            </button>
                        </div>
                        <div className="flex h-full flex-col justify-between py-2 ">
                            <div>{renderSidebarItems()}</div>
                        </div>
                    </Sidebar>
                </Drawer>

                {/* Header */}
                <Header
                    auth={auth}
                    company_settings={company_settings}
                    setIsSideisSidebarMobileOpen={setIsSideisSidebarMobileOpen}
                    unreadCountLeave={unreadCount}
                    handleNotificationClick={handleNotificationClick}
                />

                {/* Content */}
                <div className="flex-1 p-6 space-y-5 bg-slate-300/30">
                    {/* <p className="2xl">{unreadCount}</p> */}
                    <ToastContainer position="top-right" autoClose={3000} />
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
