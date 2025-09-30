import React, { useState } from "react";
import { usePage, router, Head } from "@inertiajs/react";
// import TableComponent from '../../Components/TableComponent';
import { Button, Select, TextInput } from "flowbite-react";
import TableComponent from "@/Components/TableComponent";
import { parse } from "postcss";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { toast } from "react-toastify";

const PayrollComponentOld = () => {
    const { payrolls } = usePage().props;
    console.log("Payroll data:", payrolls);

    const [formData, setFormData] = useState({
        pay_schedule_type: "weekly",
        start_date: "",
        end_date: "",
    });

    const handleGeneratePayroll = (e) => {
        e.preventDefault();
        router.post("/payroll/generate", formData, {
            onSuccess: () => toast.success("Payroll generated successfully!"),
            onError: (errors) => console.error("Error:", errors),
        });
    };

    const columns = [
        {
            name: "#",
            render: (row, index) => index + 1,
            sortable: false,
            width: "60px",
        },
        {
            name: "Employee",
            render: (row) =>
                `${row.employee?.first_name || "-"} ${
                    row.employee?.last_name || ""
                }`,
            selector: (row) =>
                `${row.employee?.last_name || ""}, ${
                    row.employee?.first_name || ""
                }`,
            sortable: true,
        },
        {
            name: "Pay Period",
            render: (row) =>
                `${new Date(row.pay_period_start).toLocaleDateString(
                    "en-US"
                )} - ${new Date(row.pay_period_end).toLocaleDateString(
                    "en-US"
                )}`,
            selector: (row) => row.pay_period_start,
            sortable: true,
        },
        {
            name: "Gross Pay",
            render: (row) => `₱${parseFloat(row.gross_pay).toFixed(2)}`,
            selector: (row) => row.gross_pay,
            sortable: true,
        },
        {
            name: "SSS",
            render: (row) => `₱${parseFloat(row.sss_deduction).toFixed(2)}`,
            selector: (row) => row.sss_deduction,
            sortable: true,
        },
        {
            name: "PhilHealth",
            render: (row) =>
                `₱${parseFloat(row.philhealth_deduction).toFixed(2)}`,
            selector: (row) => row.philhealth_deduction,
            sortable: true,
        },
        {
            name: "Pag-IBIG",
            render: (row) => `₱${parseFloat(row.pagibig_deduction).toFixed(2)}`,
            selector: (row) => row.pagibig_deduction,
            sortable: true,
        },
        {
            name: "Withholding Tax",
            render: (row) => `₱${parseFloat(row.withholding_tax).toFixed(2)}`,
            selector: (row) => row.withholding_tax,
            sortable: true,
        },
        {
            name: "Total Deductions",
            render: (row) => `₱${parseFloat(row.deductions).toFixed(2)}`,
            selector: (row) => row.deductions,
            sortable: true,
        },
        {
            name: "Net Pay",
            render: (row) => `₱${parseFloat(row.net_pay).toFixed(2)}`,
            selector: (row) => row.net_pay,
            sortable: true,
        },
        {
            name: "Pay Schedule",
            render: (row) => row.pay_schedule,
            selector: (row) => row.pay_schedule,
            sortable: true,
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Holiday" />

            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Payroll Generation
                </h3>
                <BreadCrumbs />
            </div>
            <div className="py-6">
                <form
                    onSubmit={handleGeneratePayroll}
                    className="mb-6 flex gap-4"
                >
                    <div>
                        <Select
                            value={formData.pay_schedule_type}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    pay_schedule_type: e.target.value,
                                })
                            }
                            required
                        >
                            <option value="weekly">Weekly</option>
                            <option value="semi-monthly">Semi-Monthly</option>
                        </Select>
                    </div>

                    <TextInput
                        type="date"
                        placeholder="Start Date"
                        value={formData.start_date}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                start_date: e.target.value,
                            })
                        }
                        required
                    />
                    <TextInput
                        type="date"
                        placeholder="End Date"
                        value={formData.end_date}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                end_date: e.target.value,
                            })
                        }
                        required
                    />
                    <Button
                        type="submit"
                        color="primary"
                        className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                    >
                        Generate Payroll
                    </Button>
                </form>
                <TableComponent
                    columns={columns}
                    data={payrolls}
                    searchFields={["employee.first_name", "employee.last_name"]}
                    filterField="pay_schedule"
                    filterOptions={[
                        { value: "weekly", label: "Weekly" },
                        { value: "semi-monthly", label: "Semi-Monthly" },
                    ]}
                    renderActions={() => null}
                    addButtonText={() => null}
                />
            </div>
        </DashboardLayout>
    );
};

export default PayrollComponentOld;
