import { useState } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { Button, Card, Select, Label } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import TableComponent from "@/Components/TableComponent";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import Swal from "sweetalert2";

const EmployeeDashboard = () => {
    const {
        attendances,
        statistics,
        recentActivities,
        employee,
        flash,
        vacation_leave_credits,
        sick_leave_credits,
        leave_without_pay,
        payslips,
    } = usePage().props;
    console.log("usePage().props: ", usePage().props);

    const [filterDate, setFilterDate] = useState(null);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");

    const today = new Date().toISOString().split("T")[0]; // e.g., "2025-06-18"
    const isPunchedIn =
        recentActivities.length > 0 &&
        new Date(recentActivities[0].timestamp).toISOString().split("T")[0] ===
            today &&
        recentActivities[0].type === "in";

    // const handlePunch = () => {
    //     const routeName = isPunchedIn
    //         ? "attendances.punch_out"
    //         : "attendances.punch_in";
    //     router.post(
    //         route(routeName),
    //         {},
    //         {
    //             onSuccess: () => {
    //                 if (flash.success) {
    //                     toast.success(
    //                         `Successfully punched ${
    //                             isPunchedIn ? "out" : "in"
    //                         }!`
    //                     );
    //                 } else {
    //                     toast.error(flash.error);
    //                 }
    //             },
    //             onError: (errors) =>
    //                 toast.error(
    //                     `Failed to punch ${
    //                         isPunchedIn ? "out" : "in"
    //                     }: ${Object.values(errors).join(", ")}`
    //                 ),
    //         }
    //     );
    // };

    const handlePunch = () => {
        const action = isPunchedIn ? "out" : "in";
        Swal.fire({
            title: `Confirm Clock ${action === "out" ? "Out" : "In"}`,
            text: `Are you sure you want to clock ${action}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: `Yes, Clock ${action === "out" ? "Out" : "In"}`,
            cancelButtonText: "Cancel",
            customClass: {
                popup: "bg-white shadow-lg rounded-lg p-4",
                confirmButton:
                    "bg-red-600 text-white hover:!bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500",
                cancelButton:
                    "bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500",
            },
            buttonsStyling: true,
            didOpen: () => {
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) {
                    swalContainer.style.zIndex = "9999";
                }
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const routeName = isPunchedIn
                    ? "attendances.punch_out"
                    : "attendances.punch_in";
                router.post(
                    route(routeName),
                    {},
                    {
                        onSuccess: () => {
                            if (flash.success) {
                                toast.success(
                                    `Successfully punched ${action}!`
                                );
                            } else {
                                toast.error(flash.error);
                            }
                        },
                        onError: (errors) =>
                            toast.error(
                                `Failed to punch ${action}: ${Object.values(
                                    errors
                                ).join(", ")}`
                            ),
                    }
                );
            }
        });
    };

    const handleSearch = () => {
        router.get(
            route("attendance.list"),
            {
                date: filterDate ? filterDate.toISOString().split("T")[0] : "",
                month: filterMonth,
                year: filterYear,
            },
            { preserveState: true }
        );
    };

    const columns = [
        { name: "#", render: (row, index) => index + 1 },
        {
            name: "Date",
            render: (row) =>
                new Date(row.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
        },
        {
            name: "Clock In",
            render: (row) =>
                row.punch_in
                    ? new Date(row.punch_in).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "-",
        },
        {
            name: "Clock Out",
            render: (row) =>
                row.punch_out
                    ? new Date(row.punch_out).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "",
        },
        {
            name: "Break",
            render: (row) => (row.break_hours ? `${row.break_hours} hrs` : "-"),
        },
        {
            name: "Overtime",
            render: (row) =>
                row.overtime_hours ? `${row.overtime_hours} hrs` : "-",
        },
        {
            name: "Total Hours",
            render: (row) => {
                if (!row.punch_in || !row.punch_out) return "-";
                const hours =
                    (new Date(row.punch_out) - new Date(row.punch_in)) /
                        (1000 * 60 * 60) -
                    (row.break_hours || 0);
                return `${hours.toFixed(2)} hrs`;
            },
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Employee Dashboard" />
            <div className="">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Employee Dashboard
                </h3>
                <BreadCrumbs />
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg">
                        <h3 className="text-lg font-semibold">
                            Timesheet
                            <small className="text-gray-500 ml-2">
                                {new Date().toLocaleDateString("en-US", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </small>
                        </h3>
                        <div className="space-y-4">
                            <div className="punch-det">
                                <h6 className="font-medium">Clock-In at</h6>
                                <p>
                                    {recentActivities.find(
                                        (a) => a.type === "in"
                                    )
                                        ? new Date(
                                              recentActivities.find(
                                                  (a) => a.type === "in"
                                              ).timestamp
                                          ).toLocaleString("en-US", {
                                              weekday: "short",
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                          })
                                        : "-"}
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="inline-block bg-gray-100 rounded-full px-4 py-2 punch-hours">
                                    <span className="text-xl font-bold ">
                                        {new Intl.NumberFormat("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }).format(
                                            statistics.today?.hours || 0
                                        )}{" "}
                                        hrs
                                    </span>
                                </div>
                            </div>
                            <Button
                                color="red"
                                onClick={handlePunch}
                                className="w-full"
                            >
                                {isPunchedIn ? "Clock Out" : "Clock In"}
                            </Button>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="stats-box">
                                    <p className="text-sm text-gray-600">
                                        Break
                                    </p>
                                    <h6 className="font-semibold">
                                        {statistics.today?.break || "0.00"} hrs
                                    </h6>
                                </div>
                                <div className="stats-box">
                                    <p className="text-sm text-gray-600">
                                        Overtime
                                    </p>
                                    <h6 className="font-semibold">
                                        {statistics.today?.overtime || "0"} hrs
                                    </h6>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="shadow-lg recent-activity">
                        <h3 className="text-lg font-semibold">
                            Today Activity
                        </h3>
                        <ul className="space-y-2 res-activity-list">
                            {recentActivities
                                .slice(0, 6)
                                .map((activity, index) => (
                                    <li key={index} className="flex flex-col">
                                        <p className="mb-0">
                                            Clock{" "}
                                            {activity.type === "in"
                                                ? "In"
                                                : "Out"}{" "}
                                            at
                                        </p>
                                        <p className=" text-gray-600 res-activity-time">
                                            <FontAwesomeIcon
                                                icon={faClock}
                                                className="mr-1"
                                            />
                                            {activity.timestamp
                                                ? new Date(
                                                      activity.timestamp
                                                  ).toLocaleTimeString(
                                                      "en-US",
                                                      {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      }
                                                  )
                                                : "-"}
                                        </p>
                                    </li>
                                ))}
                        </ul>
                    </Card>

                    <Card className="shadow-lg recent-activity flex flex-col !space-y-2">
                        <h3 className="text-lg font-semibold">Leave Credits</h3>
                        <div className="stats-box flex justify-between !p-4 !mb-0">
                            <p className="text-sm text-gray-600 font-semibold">
                                Leave without Pay
                            </p>
                            <h6 className="font-semibold">
                                {leave_without_pay ? leave_without_pay : 0}
                            </h6>
                        </div>
                        <div className="stats-box flex justify-between !p-4 !mb-0">
                            <p className="text-sm text-gray-600 font-semibold">
                                2025 Vacation Leave
                            </p>
                            <h6 className="font-semibold">
                                {vacation_leave_credits[0]?.credits || 0}
                            </h6>
                        </div>
                        <div className="stats-box flex justify-between !p-4 !mb-0">
                            <p className="text-sm text-gray-600 font-semibold">
                                2025 Sick Leave
                            </p>
                            <h6 className="font-semibold">
                                {sick_leave_credits[0]?.credits || 0}
                            </h6>
                        </div>

                        <h3 className="text-lg font-semibold">Payroll</h3>
                    </Card>
                </div>

                <div className="flex flex-wrap gap-4 my-6">
                    <div className="min-w-[200px]">
                        <Label htmlFor="filter_date" value="Date" />
                        <DatePicker
                            id="filter_date"
                            selected={filterDate}
                            onChange={(date) => setFilterDate(date)}
                            className="w-full border-gray-300 rounded-md shadow-sm"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select date"
                        />
                    </div>
                    <div className="min-w-[200px]">
                        <Label htmlFor="filter_month" value="Month" />
                        <Select
                            id="filter_month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">Select Month</option>
                            {[
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                            ].map((month, index) => (
                                <option key={index} value={index + 1}>
                                    {month}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="min-w-[200px]">
                        <Label htmlFor="filter_year" value="Year" />
                        <Select
                            id="filter_year"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <option value="">Select Year</option>
                            {[2025, 2024, 2023, 2022, 2021].map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button color="red" onClick={handleSearch}>
                            Search
                        </Button>
                    </div>
                </div>

                <TableComponent
                    columns={columns}
                    data={attendances}
                    modalComponent={null}
                    modalProps={{}}
                    deleteModalComponent={null}
                    deleteModalProps={{}}
                    searchFields={["date"]}
                    filterField="month"
                    filterOptions={[
                        { value: "1", label: "January" },
                        { value: "2", label: "February" },
                        { value: "3", label: "March" },
                        { value: "4", label: "April" },
                        { value: "5", label: "May" },
                        { value: "6", label: "June" },
                        { value: "7", label: "July" },
                        { value: "8", label: "August" },
                        { value: "9", label: "September" },
                        { value: "10", label: "October" },
                        { value: "11", label: "November" },
                        { value: "12", label: "December" },
                    ]}
                    addButtonText={null}
                    renderActions={() => null}
                />
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDashboard;
