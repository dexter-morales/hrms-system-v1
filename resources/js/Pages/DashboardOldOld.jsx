import {
    Sidebar,
    Navbar,
    Avatar,
    Dropdown,
    DarkThemeToggle,
} from "flowbite-react";
import { HiChartPie, HiUserGroup, HiOutlineLogout } from "react-icons/hi";
import { FaUsersCog, FaUserClock, FaMoneyCheckAlt } from "react-icons/fa";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import SidebarTemplate from "@/Components/SidebarTemplate";
import DashboardLayout from "@/Layouts/DashboardLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function Dashboard() {
    return (
        <DashboardLayout>
            <div>
                {/* Sidebar */}
                {/* <Sidebar aria-label="HRMS Sidebar" className="w-64">
                <Sidebar.Logo
                    href="#"
                    img="https://flowbite-react.com/favicon.svg"
                    imgAlt="Flowbite logo"
                >
                    <span
                        class="self-center whitespace-nowrap text-xl font-semibold text-slate-900"
                        id="flowbite-sidebar-logo-:ra4:"
                    >
                        Flowbite
                    </span>
                </Sidebar.Logo>

                <Sidebar.Items>
                    <Sidebar.ItemGroup>
                        <Sidebar.Item href="#" icon={HiChartPie}>
                            Dashboard
                        </Sidebar.Item>
                        <Sidebar.Item href="#" icon={FaUsersCog}>
                            Employees
                        </Sidebar.Item>
                        <Sidebar.Item href="#" icon={FaUserClock}>
                            Attendance
                        </Sidebar.Item>
                        <Sidebar.Item href="#" icon={FaMoneyCheckAlt}>
                            Payroll
                        </Sidebar.Item>
                        <Sidebar.Item href="#" icon={HiUserGroup}>
                            Leave Requests
                        </Sidebar.Item>
                        <Sidebar.Item href="#" icon={HiOutlineLogout}>
                            Logout
                        </Sidebar.Item>
                    </Sidebar.ItemGroup>
                </Sidebar.Items>
            </Sidebar> */}
                {/* <SidebarTemplate /> */}

                {/* Main Content */}
                <div className="flex-1 p-4">
                    {/* <Navbar fluid rounded>
                    <Navbar.Brand href="https://flowbite-react.com">
                        <img
                            src="/favicon.svg"
                            className="mr-3 h-6 sm:h-9"
                            alt="Flowbite React Logo"
                        />
                        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                            Flowbite React
                        </span>
                    </Navbar.Brand>
                    <div className="flex md:order-2">
                        <Dropdown
                            arrowIcon={false}
                            inline
                            label={
                                <Avatar
                                    alt="User settings"
                                    img="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                                    rounded
                                />
                            }
                        >
                            <Dropdown.Header>
                                <span className="block text-sm">
                                    Bonnie Green
                                </span>
                                <span className="block truncate text-sm font-medium">
                                    name@flowbite.com
                                </span>
                            </Dropdown.Header>
                            <Dropdown.Item>Dashboard</Dropdown.Item>
                            <Dropdown.Item>Settings</Dropdown.Item>
                            <Dropdown.Item>Earnings</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item>Sign out</Dropdown.Item>
                        </Dropdown>
                        <Navbar.Toggle />
                    </div>
                    <Navbar.Collapse>
                        <Navbar.Link href="#" active>
                            Home
                        </Navbar.Link>
                        <Navbar.Link href="#">About</Navbar.Link>
                        <Navbar.Link href="#">Services</Navbar.Link>
                        <Navbar.Link href="#">Pricing</Navbar.Link>
                        <Navbar.Link href="#">Contact</Navbar.Link>
                    </Navbar.Collapse>
                </Navbar> */}

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <Card title="Total Employees" value="156" />
                        <Card title="New Hires" value="12" />
                        <Card title="On Leave" value="5" />
                        <Card title="Avg Attendance" value="92%" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                                Attendance Trend
                            </h4>
                            {/* Line chart */}
                            <Line
                                data={{
                                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                                    datasets: [
                                        {
                                            label: "Present",
                                            data: [90, 85, 88, 92, 95],
                                            borderColor: "blue",
                                            backgroundColor:
                                                "rgba(59, 130, 246, 0.3)",
                                        },
                                    ],
                                }}
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                                Department Stats
                            </h4>
                            {/* Pie chart */}
                            <Pie
                                data={{
                                    labels: [
                                        "Engineering",
                                        "HR",
                                        "Finance",
                                        "Marketing",
                                    ],
                                    datasets: [
                                        {
                                            label: "Headcount",
                                            data: [40, 20, 25, 30],
                                            backgroundColor: [
                                                "#1D4ED8",
                                                "#10B981",
                                                "#F59E0B",
                                                "#EF4444",
                                            ],
                                        },
                                    ],
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Card({ title, value }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}
