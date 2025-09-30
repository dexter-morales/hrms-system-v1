import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import EmployeeList from "@/Components/dashboard/EmployeeComponent";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useDataStore } from "@/Context/DataStoreContext";

import { LiaUsersSolid } from "react-icons/lia";
import { LuFolderOutput } from "react-icons/lu";
import PendingLeaveRequest from "@/Components/dashboard/PendingLeaveRequest";
import PendingOvertimeRequest from "@/Components/dashboard/PendingOvertimeRequest";
import PendingRequests from "@/Components/dashboard/PendingRequests";
const leaveData = [
    { name: "Sick Leave", value: 12 },
    { name: "Vacation", value: 19 },
    { name: "Unpaid Leave", value: 5 },
];

const COLORS = ["#34d399", "#60a5fa", "#f87171"];

export default function Dashboard() {
    const cardsData = [
        { title: "Projects", count: 112, icon: "📊" },
        { title: "Clients", count: 44, icon: "💰" },
        { title: "Tasks", count: 37, icon: "🔹" },
        { title: "Employees", count: 218, icon: "👤" },
    ];

    const getGreeting = () => {
        const now = new Date();
        const hour = now.getHours();

        if (hour >= 0 && hour <= 9) {
            return "Good Morning,";
        } else if (hour >= 10 && hour <= 11) {
            return "Good Day,";
        } else if (hour >= 12 && hour <= 15) {
            return "Good Afternoon,";
        } else if (hour >= 16 && hour <= 23) {
            return "Good Evening,";
        } else {
            return "Welcome,";
        }
    };

    const greeting = getGreeting();
    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const { isSidebarMobileOpen, setIsSideisSidebarMobileOpen } =
        useDataStore();
    const auth = usePage().props.auth;
    console.log("Dashboard props: ", usePage().props);

    const {
        total_employees,
        total_leaves,
        total_on_leave,
        leave_requests,
        pending_requests,
        overtime_requests,
    } = usePage().props;

    console.log("Total employees: ", total_employees);
    console.log("Total leaves: ", total_leaves);
    console.log("Total on leave: ", total_on_leave);

    return (
        <DashboardLayout>
            <Head title="Dashboard" />

            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white font-circular">
                    {/* {greeting} Welcome,{" "} */}
                    Hello,{" "}
                    {auth?.user?.employee?.first_name +
                        " " +
                        auth?.user?.employee?.last_name}
                    !
                </h3>
                <BreadCrumbs />
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {cardsData.map((card, index) => (
                    <div
                        key={index}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center justify-between"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                {card.title}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {card.count}
                            </p>
                        </div>
                        <div className="text-3xl text-red-500">{card.icon}</div>
                    </div>
                ))}
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-amber-600 shadow-md flex flex-col space-y-2 hover:shadow-amber-600">
                    <div className=" p-2 flex w-full text-gray-700 dark:text-gray-200 gap-2 border-b-2">
                        <LiaUsersSolid className="text-sm text-white dark:text-gray-400 bg-red-700 hover:bg-red-800 flex items-center justify-center rounded-full p-1 w-8 h-8" />
                        <h2 className="text-lg font-semibold ">Employees</h2>
                    </div>

                    <div className="text-4xl font-semibold text-gray-700 dark:text-gray-200  text-center h-full flex items-center justify-center">
                        {total_employees.toLocaleString()}
                    </div>
                    <div className="h-20 flex w-full">
                        <Link
                            href="employee/list"
                            className="text-sm dark:text-gray-400  bg-red-700 hover:bg-red-800 text-white w-full flex items-center justify-center rounded-md"
                        >
                            <p>[ Go to Employees ]</p>
                        </Link>
                    </div>
                </div>

                {/* <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-amber-600 flex flex-col space-y-2 hover:shadow-amber-600">
                    <div className=" p-2 flex w-full text-gray-700 dark:text-gray-200 gap-2 border-b-2">
                        <LuFolderOutput className="flex items-center justify-center text-3xl bg-slate-700 text-white rounded-full p-1 w-8 h-8" />
                        <h2 className="text-lg font-semibold ">
                            Present Today
                        </h2>
                    </div>

                    <div className="text-4xl font-semibold text-gray-700 dark:text-gray-200  text-center h-full flex items-center justify-center">
                        {(456456).toLocaleString()}
                    </div>
                    <div className="h-20 flex w-full">
                        <p className="text-sm text-white dark:text-gray-400 bg-slate-400 w-full flex items-center justify-center rounded-md">
                            [ Go to Present Today ]
                        </p>
                    </div>
                </div> */}

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-amber-600 shadow-md flex flex-col space-y-2 hover:shadow-amber-600">
                    <div className=" p-2 flex w-full text-gray-700 dark:text-gray-200 gap-2 border-b-2">
                        <LuFolderOutput className="flex items-center justify-center text-3xl bg-slate-700 text-white rounded-full p-1 w-8 h-8" />
                        <h2 className="text-lg font-semibold ">
                            Leave Requests
                        </h2>
                    </div>

                    <div className="text-4xl font-semibold text-gray-700 dark:text-gray-200  text-center h-full flex items-center justify-center">
                        {total_leaves.toLocaleString()}
                    </div>
                    <div className="h-20 flex w-full">
                        <Link
                            href="leaves/admin"
                            className="text-sm bg-red-700 hover:bg-red-800 text-white dark:text-gray-400  w-full flex items-center justify-center rounded-md"
                        >
                            <p>[ Go to Leave Requests ]</p>
                        </Link>
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-amber-600 shadow-md flex flex-col space-y-2 hover:shadow-amber-600">
                    <div className=" p-2 flex w-full text-gray-700 dark:text-gray-200 gap-2 border-b-2">
                        <LuFolderOutput className="flex items-center justify-center text-3xl bg-slate-700 text-white rounded-full p-1 w-8 h-8" />
                        <h2 className="text-lg font-semibold ">On Leave</h2>
                    </div>

                    <div className="text-4xl font-semibold text-gray-700 dark:text-gray-200  text-center h-full flex items-center justify-center">
                        {total_on_leave.toLocaleString()}
                    </div>
                    <div className="h-20 flex w-full">
                        <Link
                            href="/leaves/admin"
                            className="text-sm text-white dark:text-gray-400  bg-red-700 hover:bg-red-800 w-full flex items-center justify-center rounded-md"
                        >
                            <p>[ Go to Leave Requests ]</p>
                        </Link>
                    </div>
                </div>

                {/* <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                        Leave Requests
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Approve or reject leave applications
                    </p>
                    <Link
                        href="/admin/leaves"
                        className="inline-block mt-4 text-sm text-blue-600 hover:underline"
                    >
                        Go to Leave Requests
                    </Link>
                </div> */}

                {/* <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                        Payroll
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Process salary and view reports
                    </p>
                    <Link
                        href="/admin/payroll"
                        className="inline-block mt-4 text-sm text-blue-600 hover:underline"
                    >
                        Go to Payroll
                    </Link>
                </div> */}
            </div>
            <div className="grid grid-cols-1 gap-4">
                {/* <PendingLeaveRequest leave_requests={leave_requests} />
                <PendingOvertimeRequest overtime_requests={overtime_requests} /> */}
                <PendingRequests
                    pending_requests={pending_requests}
                    auth={auth}
                />
            </div>
            {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                    Leave Breakdown
                </h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={leaveData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                                dataKey="value"
                            >
                                {leaveData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div> */}
        </DashboardLayout>
    );
}
