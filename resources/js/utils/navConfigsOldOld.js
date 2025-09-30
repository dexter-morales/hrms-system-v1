// navConfig.js
import {
    ChartBarIcon,
    UserIcon,
    FolderOpenIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    CogIcon,
} from "@heroicons/react/outline";

const dashboardNav = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: ChartBarIcon,
    },
];

const employeeNav = [
    {
        header: "Requests",
        label: "My Overtimes",
        href: "/overtime/list",
        icon: FolderOpenIcon,
    },
    {
        label: "My Leaves",
        href: "/leaves/employee",
        icon: FolderOpenIcon,
    },
    {
        label: "My Loans",
        href: "/employee-loans",
        icon: FolderOpenIcon,
    },
    {
        label: "Certificate of Attendance",
        href: "/certificates",
        icon: FolderOpenIcon,
    },
    {
        label: "Official Business",
        href: "/business-travels",
        icon: FolderOpenIcon,
    },
    {
        header: "Attendance",
        label: "Attendance",
        icon: CalendarIcon,
        children: [
            { label: "Attendance (Employee)", href: "/attendance/employee" },
        ],
    },
    {
        header: "Payroll",
        label: "My Payslips",
        href: "/payroll/payslips",
        icon: CurrencyDollarIcon,
    },
];

const adminNav = [
    {
        header: "Employees",
        label: "Employee",
        href: "/employee/list",
        icon: UserIcon,
    },
    {
        header: "Requests",
        label: "Requests",
        icon: FolderOpenIcon,
        children: [
            { label: "Overtime", href: "/overtime/list" },
            { label: "Leaves (Admin)", href: "/leaves/admin" },
            { label: "Leaves (Employee)", href: "/leaves/employee" },
            { label: "Employee Loans", href: "/employee-loans" },
            { label: "Certificate of Attendance", href: "/certificates" },
            { label: "Official Business", href: "/business-travels" },
        ],
    },
    {
        header: "Attendance",
        label: "Attendance",
        icon: CalendarIcon,
        children: [
            { label: "Attendance (Admin)", href: "/attendance/admin-employee" },
            { label: "Attendance (Employee)", href: "/attendance/employee" },
            { label: "Timesheet", href: "/employee-timesheet" },
            { label: "Shift & Schedule", href: "/schedules/employee" },
        ],
    },
    {
        header: "HR",
        label: "Payroll",
        icon: CurrencyDollarIcon,
        children: [
            { label: "Generate Payroll", href: "/payroll/generate" },
            { label: "Payslips", href: "/payroll/payslips" },
        ],
    },
    {
        header: "Settings",
        label: "Settings",
        icon: CogIcon,
        children: [
            { label: "Holidays", href: "/holidays/list" },
            { label: "Leave Types", href: "/leave-types" },
            { label: "Departments", href: "/departments" },
            { label: "Positions", href: "/positions" },
            { label: "Designations", href: "/sites" },
            { label: "Company Settings", href: "/company-settings" },
        ],
    },
];

export const navItemsByRole = {
    SuperAdmin: [...dashboardNav, ...adminNav],
    HR: [...dashboardNav, ...adminNav],
    Admin: [...dashboardNav, ...adminNav],
    Employee: [...dashboardNav, ...employeeNav],
};
