import { Button } from "flowbite-react";
import { Link } from "@inertiajs/react";

export default function PayslipIndex({ payslips }) {
    return (
        <div className="p-3">
            <h3 className="text-2xl font-bold dark:text-white mb-5">
                My Payslips
            </h3>
            <div className="relative overflow-x-auto shadow-md">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                Pay Period
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Net Pay
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {payslips.map((payslip) => (
                            <tr
                                key={payslip.id}
                                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                            >
                                <td className="px-6 py-4">
                                    {new Date(
                                        payslip.payroll.pay_period_start
                                    ).toLocaleDateString("en-US")}{" "}
                                    -{" "}
                                    {new Date(
                                        payslip.payroll.pay_period_end
                                    ).toLocaleDateString("en-US")}
                                </td>
                                <td className="px-6 py-4">
                                    ₱
                                    {parseFloat(
                                        payslip.payroll.net_pay
                                    ).toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/payslips/${payslip.id}/download`}
                                    >
                                        <Button size="xs" color="blue">
                                            Download
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
