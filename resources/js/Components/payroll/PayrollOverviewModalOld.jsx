import { useState, useEffect } from "react";
import {
    Modal,
    Button,
    TextInput,
    Label,
    ModalFooter,
    ModalBody,
    ModalHeader,
} from "flowbite-react";
import { useForm } from "@inertiajs/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

const PayrollOverviewModal = ({ isOpen, onClose, selectedEmployee }) => {
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, put, errors, reset } = useForm({
        total_working_days: selectedEmployee?.total_working_days || 0,
        allowance: selectedEmployee?.allowance || 0,
        holiday_pay: selectedEmployee?.holiday_pay || 0,
        overtime_pay: selectedEmployee?.overtime_pay || 0,
        withholding_tax: selectedEmployee?.withholding_tax || 0,
        sss_deduction: selectedEmployee?.sss_deduction || 0,
        philhealth_deduction: selectedEmployee?.philhealth_deduction || 0,
        pagibig_deduction: selectedEmployee?.pagibig_deduction || 0,
        absences_deduction: selectedEmployee?.absences_deduction || 0,
        late_deduction: selectedEmployee?.late_deduction || 0,
        gross_pay: selectedEmployee?.gross_pay || 0,
        net_pay: selectedEmployee?.net_pay || 0,
    });

    useEffect(() => {
        if (selectedEmployee) {
            reset({
                total_working_days: selectedEmployee.total_working_days || 0,
                allowance: selectedEmployee.allowance || 0,
                holiday_pay: selectedEmployee.holiday_pay || 0,
                overtime_pay: selectedEmployee.overtime_pay || 0,
                withholding_tax: selectedEmployee.withholding_tax || 0,
                sss_deduction: selectedEmployee.sss_deduction || 0,
                philhealth_deduction:
                    selectedEmployee.philhealth_deduction || 0,
                pagibig_deduction: selectedEmployee.pagibig_deduction || 0,
                absences_deduction: selectedEmployee.absences_deduction || 0,
                late_deduction: selectedEmployee.late_deduction || 0,
                gross_pay: selectedEmployee.gross_pay || 0,
                net_pay: selectedEmployee.net_pay || 0,
            });
            calculatePay();
        }
    }, [selectedEmployee]);

    const calculatePay = () => {
        const basicSalary = parseFloat(
            selectedEmployee?.employee?.basic_salary || 0
        );
        const dailyPay = basicSalary / 26;
        const workedPay = data.total_working_days * dailyPay;
        const grossPay =
            workedPay +
            parseFloat(data.allowance || 0) +
            parseFloat(data.holiday_pay || 0) +
            parseFloat(data.overtime_pay || 0);
        const totalDeductions =
            parseFloat(data.withholding_tax || 0) +
            parseFloat(data.sss_deduction || 0) +
            parseFloat(data.philhealth_deduction || 0) +
            parseFloat(data.pagibig_deduction || 0) +
            parseFloat(data.absences_deduction || 0) +
            parseFloat(data.late_deduction || 0);
        const netPay = grossPay - totalDeductions;

        setData({
            ...data,
            gross_pay: grossPay.toFixed(2),
            net_pay: netPay.toFixed(2),
        });
    };

    const handleInputChange = (field, value) => {
        const parsedValue = parseFloat(value) || 0;
        if (parsedValue < 0) return; // Prevent negative values
        setData(field, parsedValue.toFixed(2));
        calculatePay();
    };

    const handleUpdate = () => {
        put(`/payroll/${selectedEmployee.id}/update`, {
            onSuccess: () => {
                setIsEditing(false);
                toast.success("Payroll updated successfully!");
            },
            onError: () =>
                toast.error("Failed to update payroll. Check errors."),
        });
    };

    const handleApprove = () => {
        post(`/payroll/${selectedEmployee.id}/approve`, {
            onSuccess: () => {
                toast.success("Payroll approved and payslip generated!");
                setIsEditing(false);
                onClose();
            },
            onError: () =>
                toast.error("Failed to approve payroll. Check errors."),
        });
    };

    if (!selectedEmployee) return null;

    return (
        <Modal show={isOpen} onClose={onClose} size="4xl">
            <ModalHeader>
                Payroll Overview for {selectedEmployee.employee?.first_name}{" "}
                {selectedEmployee.employee?.last_name}
            </ModalHeader>
            <ModalBody className="space-y-6">
                <p>
                    <strong>Pay Period:</strong>{" "}
                    {new Date(
                        selectedEmployee.pay_period_start
                    ).toLocaleDateString("en-US")}{" "}
                    -{" "}
                    {new Date(
                        selectedEmployee.pay_period_end
                    ).toLocaleDateString("en-US")}
                </p>
                <div className="flex">
                    <div className="w-1/3">
                        <div className="flex flex-col w-full mx-auto items-center gap-2">
                            <img
                                src={
                                    selectedEmployee.employee?.image
                                        ? selectedEmployee.employee.image
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              selectedEmployee.employee
                                                  .first_name +
                                                  " " +
                                                  selectedEmployee.employee
                                                      .last_name
                                          )}&background=random&color=fff`
                                }
                                alt={selectedEmployee.employee?.first_name}
                                className="rounded-full h-32 w-32"
                            />
                            <div className="text-center">
                                <p className="font-semibold text-xl">
                                    {selectedEmployee.employee?.first_name}{" "}
                                    {selectedEmployee.employee?.last_name}
                                </p>
                                <p className="text-sm">
                                    {selectedEmployee.employee?.position?.name}
                                </p>
                            </div>
                            <div className="text-sm">
                                <p>
                                    <strong>Location:</strong>{" "}
                                    {selectedEmployee.employee?.site?.name ||
                                        "-"}
                                </p>
                                <p>
                                    <strong>Pay Schedule:</strong>{" "}
                                    {selectedEmployee.pay_schedule}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-2/3">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-xl">
                                    Employee Salary
                                </h4>
                                <p>
                                    <strong>Monthly Basic Salary:</strong>
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱
                                    {parseFloat(
                                        selectedEmployee.employee
                                            ?.basic_salary || 0
                                    ).toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                                <p>
                                    <strong>Daily Paygrade:</strong>
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱
                                    {parseFloat(
                                        (selectedEmployee.employee
                                            ?.basic_salary || 0) / 26
                                    ).toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold text-xl">
                                    Payroll Details
                                </h4>
                                <p>
                                    <strong>Gross Pay:</strong>
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱
                                    {parseFloat(data.gross_pay).toLocaleString(
                                        "en-PH",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}
                                </p>
                                <p>
                                    <strong>Net Pay:</strong>
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱
                                    {parseFloat(data.net_pay).toLocaleString(
                                        "en-PH",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div className="p-2 rounded-lg">
                        <p>EARNINGS</p>
                        <div className="grid grid-cols-1 gap-1.5">
                            <section>
                                <p>
                                    <strong>Worked Days</strong>
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {isEditing ? (
                                        <TextInput
                                            type="number"
                                            value={data.total_working_days}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "total_working_days",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            className="bg-slate-400/50 p-2 rounded-lg"
                                        />
                                    ) : (
                                        <p className="bg-slate-400/50 p-2 rounded-lg">
                                            {data.total_working_days}
                                        </p>
                                    )}
                                    <p className="bg-slate-400/50 p-2 rounded-lg">
                                        ₱
                                        {(
                                            (data.total_working_days *
                                                (selectedEmployee.employee
                                                    ?.basic_salary || 0)) /
                                            26
                                        ).toLocaleString("en-PH", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                                {errors.total_working_days && (
                                    <p className="text-red-500 text-sm">
                                        {errors.total_working_days}
                                    </p>
                                )}
                            </section>
                            <section>
                                <p>
                                    <strong>Allowance</strong>
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {isEditing ? (
                                        <TextInput
                                            type="number"
                                            value={data.allowance}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "allowance",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            className="bg-slate-400/50 p-2 rounded-lg"
                                        />
                                    ) : (
                                        <p className="bg-slate-400/50 p-2 rounded-lg">
                                            ₱
                                            {parseFloat(
                                                data.allowance
                                            ).toLocaleString("en-PH", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    )}
                                </div>
                                {errors.allowance && (
                                    <p className="text-red-500 text-sm">
                                        {errors.allowance}
                                    </p>
                                )}
                            </section>
                            <section>
                                <p>
                                    <strong>Holiday</strong>
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {isEditing ? (
                                        <TextInput
                                            type="number"
                                            value={data.holiday_pay}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "holiday_pay",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            className="bg-slate-400/50 p-2 rounded-lg"
                                        />
                                    ) : (
                                        <p className="bg-slate-400/50 p-2 rounded-lg">
                                            ₱
                                            {parseFloat(
                                                data.holiday_pay
                                            ).toLocaleString("en-PH", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    )}
                                </div>
                                {errors.holiday_pay && (
                                    <p className="text-red-500 text-sm">
                                        {errors.holiday_pay}
                                    </p>
                                )}
                            </section>
                            <section>
                                <p>
                                    <strong>Overtime</strong>
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {isEditing ? (
                                        <TextInput
                                            type="number"
                                            value={data.overtime_pay}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "overtime_pay",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            className="bg-slate-400/50 p-2 rounded-lg"
                                        />
                                    ) : (
                                        <p className="bg-slate-400/50 p-2 rounded-lg">
                                            ₱
                                            {parseFloat(
                                                data.overtime_pay
                                            ).toLocaleString("en-PH", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    )}
                                </div>
                                {errors.overtime_pay && (
                                    <p className="text-red-500 text-sm">
                                        {errors.overtime_pay}
                                    </p>
                                )}
                            </section>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg">
                        <p>DEDUCTIONS AND ADJUSTMENTS</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div>
                                <section>
                                    <p>
                                        <strong>Withholding Tax</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <TextInput
                                                type="number"
                                                value={data.withholding_tax}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "withholding_tax",
                                                        e.target.value
                                                    )
                                                }
                                                min="0"
                                                className="bg-slate-400/50 p-2 rounded-lg"
                                            />
                                        ) : (
                                            <p className="bg-slate-400/50 p-2 rounded-lg">
                                                ₱
                                                {parseFloat(
                                                    data.withholding_tax
                                                ).toLocaleString("en-PH", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    {errors.withholding_tax && (
                                        <p className="text-red-500 text-sm">
                                            {errors.withholding_tax}
                                        </p>
                                    )}
                                </section>
                                <section>
                                    <p>
                                        <strong>SSS</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <TextInput
                                                type="number"
                                                value={data.sss_deduction}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "sss_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                min="0"
                                                className="bg-slate-400/50 p-2 rounded-lg"
                                            />
                                        ) : (
                                            <p className="bg-slate-400/50 p-2 rounded-lg">
                                                ₱
                                                {parseFloat(
                                                    data.sss_deduction
                                                ).toLocaleString("en-PH", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    {errors.sss_deduction && (
                                        <p className="text-red-500 text-sm">
                                            {errors.sss_deduction}
                                        </p>
                                    )}
                                </section>
                                <section>
                                    <p>
                                        <strong>Philhealth</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <TextInput
                                                type="number"
                                                value={
                                                    data.philhealth_deduction
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "philhealth_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                min="0"
                                                className="bg-slate-400/50 p-2 rounded-lg"
                                            />
                                        ) : (
                                            <p className="bg-slate-400/50 p-2 rounded-lg">
                                                ₱
                                                {parseFloat(
                                                    data.philhealth_deduction
                                                ).toLocaleString("en-PH", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    {errors.philhealth_deduction && (
                                        <p className="text-red-500 text-sm">
                                            {errors.philhealth_deduction}
                                        </p>
                                    )}
                                </section>
                                <section>
                                    <p>
                                        <strong>Pag-ibig</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <TextInput
                                                type="number"
                                                value={data.pagibig_deduction}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "pagibig_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                min="0"
                                                className="bg-slate-400/50 p-2 rounded-lg"
                                            />
                                        ) : (
                                            <p className="bg-slate-400/50 p-2 rounded-lg">
                                                ₱
                                                {parseFloat(
                                                    data.pagibig_deduction
                                                ).toLocaleString("en-PH", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    {errors.pagibig_deduction && (
                                        <p className="text-red-500 text-sm">
                                            {errors.pagibig_deduction}
                                        </p>
                                    )}
                                </section>
                            </div>
                            <div>
                                <section>
                                    <p>
                                        <strong>Cash Advance</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <p className="bg-slate-400/50 p-2 rounded-lg">
                                            ₱0
                                        </p>
                                    </div>
                                </section>
                                <section>
                                    <p>
                                        <strong>Others</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <p className="bg-slate-400/50 p-2 rounded-lg">
                                            ₱0
                                        </p>
                                    </div>
                                </section>
                                <section>
                                    <p>
                                        <strong>Absences</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <TextInput
                                                type="number"
                                                value={data.absences_deduction}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "absences_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                min="0"
                                                className="bg-slate-400/50 p-2 rounded-lg"
                                            />
                                        ) : (
                                            <p className="bg-slate-400/50 p-2 rounded-lg">
                                                ₱
                                                {parseFloat(
                                                    data.absences_deduction
                                                ).toLocaleString("en-PH", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    {errors.absences_deduction && (
                                        <p className="text-red-500 text-sm">
                                            {errors.absences_deduction}
                                        </p>
                                    )}
                                </section>
                                <section>
                                    <p>
                                        <strong>Lates/Undertime</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <TextInput
                                                type="number"
                                                value={data.late_deduction}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "late_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                min="0"
                                                className="bg-slate-400/50 p-2 rounded-lg"
                                            />
                                        ) : (
                                            <p className="bg-slate-400/50 p-2 rounded-lg">
                                                ₱
                                                {parseFloat(
                                                    data.late_deduction
                                                ).toLocaleString("en-PH", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    {errors.late_deduction && (
                                        <p className="text-red-500 text-sm">
                                            {errors.late_deduction}
                                        </p>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                {isEditing ? (
                    <>
                        <Button color="blue" onClick={handleUpdate}>
                            Save Changes
                        </Button>
                        <Button
                            color="gray"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="blue" onClick={() => setIsEditing(true)}>
                            Edit Payroll
                        </Button>
                        <Button
                            color="green"
                            onClick={handleApprove}
                            disabled={selectedEmployee.status === "approved"}
                        >
                            Approve
                        </Button>
                        <Button color="gray" onClick={onClose}>
                            Close
                        </Button>
                    </>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default PayrollOverviewModal;
