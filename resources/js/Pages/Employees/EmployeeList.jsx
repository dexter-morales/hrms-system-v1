import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import EmployeeComponent from "@/Components/dashboard/EmployeeComponent";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import React from "react";

const EmployeeList = () => {
    return (
        <DashboardLayout>
            <Head title="Employees" />
            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Employee List
                </h3>
                <BreadCrumbs />
            </div>
            <EmployeeComponent />
        </DashboardLayout>
    );
};

export default EmployeeList;
