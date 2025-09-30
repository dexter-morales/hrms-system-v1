import {
    ChartBarIcon,
    UserIcon,
    FolderOpenIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    CogIcon,
} from "@heroicons/react/outline";

// Dashboard
const dashboardNav = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: ChartBarIcon,
        header: "Dashboard",
    },
];

// Employees
const employeeNav = [
    {
        header: "Employees",
        label: "Employee",
        icon: UserIcon,
        children: [
            {
                label: "All Employee",
                href: "/employee/list",
            },
        ],
    },
];

// Requests
const requestNav = [
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
];

// Attendance
const attendanceNav = [
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
];

// Payroll
const payrollNav = [
    {
        header: "HR",
        label: "Payroll",
        icon: CurrencyDollarIcon,
        children: [
            { label: "Generate Payroll", href: "/payroll/generate" },
            { label: "Payslips", href: "/payroll/payslips" },
            { label: "Loan History", href: "/payroll/deduction-history" },
            { label: "13th Month", href: "/payroll/thirteenth-month" },
        ],
    },
];

// Settings
const settingsNav = [
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
            { label: "Activity Logs", href: "/activity-logs" },
            { label: "Company Settings", href: "/company-settings" }, // Only for SuperAdmin
        ],
    },
];

// SuperAdmin: full access
const adminNav = [
    ...dashboardNav,
    ...employeeNav,
    ...requestNav,
    ...attendanceNav,
    ...payrollNav,
    {
        ...payrollNav[0],
        children: settingsNav[0].children.filter(
            (item) => item.label !== "Generate Payroll"
        ),
    },
    ...settingsNav,
];

// SuperAdmin: full access
const superAdminNav = [
    ...dashboardNav,
    ...employeeNav,
    ...requestNav,
    ...attendanceNav,
    ...payrollNav,
    ...settingsNav,
];

// Manager: exclude Payroll
const managerNav = [
    ...dashboardNav,
    {
        header: "My Requests",
        label: "Requests",
        icon: FolderOpenIcon,
        children: [
            { label: "Overtime", href: "/overtime/list" },
            { label: "Leaves", href: "/leaves/employee" },
            { label: "Loans", href: "/employee-loans" },
            { label: "Certificates", href: "/certificates" },
            { label: "Official Business", href: "/business-travels" },
        ],
    },
    {
        ...attendanceNav[0],
        children: attendanceNav[0].children.filter(
            (item) =>
                item.label !== "Attendance (Admin)" &&
                item.label !== "Shift & Schedule"
        ),
    },
    {
        header: "Payroll",
        label: "Payslips",
        icon: CurrencyDollarIcon,
        href: "/payroll/payslips",
    },
];

// HR: exclude Company Settings
const hrNav = [
    ...dashboardNav,
    ...employeeNav,
    ...requestNav,
    ...attendanceNav,
    ...payrollNav,
    {
        ...settingsNav[0],
        children: settingsNav[0].children.filter(
            (item) =>
                item.label !== "Company Settings" &&
                item.label !== "Activity Logs"
        ),
    },
];

// Employee: simplified access
const employeeNavItems = [
    ...dashboardNav,
    {
        header: "My Requests",
        label: "Requests",
        icon: FolderOpenIcon,
        children: [
            { label: "Overtime", href: "/overtime/list" },
            { label: "Leaves", href: "/leaves/employee" },
            { label: "Loans", href: "/employee-loans" },
            { label: "Certificates", href: "/certificates" },
            { label: "Official Business", href: "/business-travels" },
        ],
    },
    {
        header: "Attendance",
        label: "Attendance",
        icon: CalendarIcon,
        children: [{ label: "My Attendance", href: "/attendance/employee" }],
    },
    {
        header: "Payroll",
        label: "Payslips",
        icon: CurrencyDollarIcon,
        href: "/payroll/payslips",
    },
];

// === Exported function ===
export const getNavForRole = (role = "") => {
    const normalizedRole = role.toLowerCase();

    switch (normalizedRole) {
        case "superadmin":
            return superAdminNav;
        case "hr":
            return hrNav;
        case "admin":
            return adminNav;
        case "manager":
            return managerNav;
        case "employee":
            return [
                ...dashboardNav,
                {
                    header: "My Requests",
                    label: "Requests",
                    icon: FolderOpenIcon,
                    children: [
                        { label: "Overtime", href: "/overtime/list" },
                        { label: "Leaves", href: "/leaves/employee" },
                        { label: "Loans", href: "/employee-loans" },
                        { label: "Certificates", href: "/certificates" },
                        {
                            label: "Official Business",
                            href: "/business-travels",
                        },
                    ],
                },
                // {
                //     header: "Attendance",
                //     label: "Attendance",
                //     icon: CalendarIcon,
                //     children: [
                //         {
                //             label: "My Attendance",
                //             href: "/attendance/employee",
                //         },
                //     ],
                // },
                {
                    header: "Payroll",
                    label: "Payslips",
                    icon: CurrencyDollarIcon,
                    href: "/payroll/payslips",
                },
            ];
        default:
            return [];
    }
};
