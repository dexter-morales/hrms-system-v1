import { useState, useEffect } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    Button,
} from "flowbite-react";
import { useForm, usePage } from "@inertiajs/react";
import { Input } from "@headlessui/react";
import { toast } from "react-toastify";
import { router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const PayrollApprovalModal = ({ selectedEmployee, isOpen, onClose }) => {
    const { flash } = usePage().props;
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({});

    const [notes, setNotes] = useState(null);

    const { put, post, processing, errors } = useForm();

    // useEffect(() => {
    //     if (flash.success) {
    //         toast.success(flash.success );
    //     }
    // }, [flash]);

    console.log("selectedEmployee: ", selectedEmployee);
    useEffect(() => {
        if (selectedEmployee) {
            setEditedData({
                total_working_days: selectedEmployee.total_working_days,
                total_worked_days: selectedEmployee.days_worked,
                allowance: selectedEmployee.allowance,
                overtime_pay: selectedEmployee.overtime_pay,
                holiday_pay: selectedEmployee.holiday_pay,
                withholding_tax: selectedEmployee.withholding_tax,
                sss_deduction: selectedEmployee.sss_deduction,
                philhealth_deduction: selectedEmployee.philhealth_deduction,
                pagibig_deduction: selectedEmployee.pagibig_deduction,
                absences_deduction: selectedEmployee.absences_deduction,
                late_deduction: selectedEmployee.late_deduction,
                undertime_deduction: selectedEmployee.undertime_deduction,
                gross_pay_adjustments: selectedEmployee.gross_pay_adjustments,
                deductions_adjustments: selectedEmployee.deductions_adjustments,
                loan_deduction: selectedEmployee.loan_deduction,
            });
            setNotes(selectedEmployee.notes || "");
        }
    }, [selectedEmployee]);

    const handleInputChange = (field, value) => {
        setEditedData((prev) => ({
            ...prev,
            [field]: parseFloat(value) || 0,
        }));
    };

    const getPerDayDivider = () => {
        if (selectedEmployee.pay_schedule.toLowerCase() === "weekly") {
            return 6;
        } else {
            return 26;
        }
    };

    // Use jsonData (a string) for APIs, localStorage, etc.

    const handleUpdate = () => {
        console.log("editedData: ", editedData);

        router.put(
            route("payroll.update", selectedEmployee.id),
            {
                ...editedData,
                notes,
            },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    toast.success("Payroll updated successfully!", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });
                },
                onError: (errors) => {
                    toast.error(
                        "Failed to update payroll. Please check the form.",
                        {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        }
                    );

                    if (errors.allowance) {
                        toast.error(`Allowance: ${errors.allowance}`, {
                            position: "top-right",
                            autoClose: 5000,
                        });
                    }
                },
            }
        );
    };

    const handleApprove = () => {
        router.post(
            route("payroll.approve", selectedEmployee.id),
            {
                ...editedData,
                notes,
                status: "approved",
            },
            {
                // preserveScroll: true,
                onSuccess: (response) => {
                    onClose();
                    toast.success(
                        response.props.success ||
                            "Payroll approved and payslip generated!",
                        {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        }
                    );

                    // If you want to show the payslip URL
                    if (response.props.payslip_url) {
                        toast.info(
                            <div>
                                Payslip generated:
                                <a
                                    href={response.props.payslip_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline ml-1"
                                >
                                    View Payslip
                                </a>
                            </div>,
                            {
                                position: "top-right",
                                autoClose: 5000,
                            }
                        );
                    }
                },
                onError: (errors) => {
                    const errorMessage =
                        errors.error ||
                        "Failed to approve payroll. Please try again.";
                    toast.error(errorMessage, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });
                },
            }
        );
    };

    const handleRegeneratePayslip = () => {
        router.post(
            route("payroll.regeneratePayslip", selectedEmployee.id),
            {
                notes, // optional notes field
            },
            {
                onSuccess: (response) => {
                    onClose(); // close modal or reset state if needed

                    toast.success(
                        response.props.success ||
                            "Payslip regenerated successfully!",
                        {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        }
                    );

                    if (response.props.payslip_url) {
                        toast.info(
                            <div>
                                Payslip regenerated:
                                <a
                                    href={response.props.payslip_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline ml-1"
                                >
                                    View Payslip
                                </a>
                            </div>,
                            {
                                position: "top-right",
                                autoClose: 5000,
                            }
                        );
                    }
                },
                onError: (errors) => {
                    toast.error(
                        errors.error ||
                            "Failed to regenerate payslip. Please try again.",
                        {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        }
                    );
                },
            }
        );
    };

    const formatCurrency = (value) => {
        return parseFloat(value || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const calculateGrossPay = () => {
        let grossPay = 0;

        const basicSalary = parseFloat(
            selectedEmployee?.employee?.basic_salary || 0
        );
        const dailyPay = basicSalary / getPerDayDivider();
        let workedDays = parseFloat(selectedEmployee?.days_worked || 0);

        // if (
        //     selectedEmployee?.pay_schedule === "weekly" &&
        //     (selectedEmployee?.days_worked >= 5 ||
        //         selectedEmployee?.hours_worked >= 45)
        // ) {
        //     workedDays += 1;
        // }

        grossPay = dailyPay * workedDays;
        // if (selectedEmployee?.pay_schedule.toLowerCase() === "weekly") {
        //     grossPay = dailyPay * workedDays;
        // } else {
        //     grossPay = basicSalary / 2;
        // }

        const allowance = parseFloat(editedData.allowance || 0);
        const overtime = parseFloat(editedData.overtime_pay || 0);
        const holiday = parseFloat(editedData.holiday_pay || 0);
        const adjustments = parseFloat(editedData.gross_pay_adjustments || 0);

        return grossPay + allowance + overtime + holiday + adjustments;
    };

    const calculateTotalDeductions = () => {
        return (
            parseFloat(editedData.withholding_tax || 0) +
            parseFloat(editedData.sss_deduction || 0) +
            parseFloat(editedData.philhealth_deduction || 0) +
            parseFloat(editedData.pagibig_deduction || 0) +
            parseFloat(editedData.absences_deduction || 0) +
            parseFloat(editedData.late_deduction || 0) +
            parseFloat(editedData.undertime_deduction || 0) +
            parseFloat(editedData.deductions_adjustments || 0) +
            parseFloat(editedData.loan_deduction || 0)
        );
    };

    const calculateNetPay = () => {
        return calculateGrossPay() - calculateTotalDeductions();
    };

    if (!selectedEmployee) return null;

    return (
        <Modal show={isOpen} onClose={onClose} size="4xl">
            <ModalHeader>
                Payroll Overview for {selectedEmployee.employee?.first_name}{" "}
                {selectedEmployee.employee?.last_name}
                <span className="ml-2 text-sm font-normal">
                    (
                    {selectedEmployee.status.toLowerCase() === "approved"
                        ? "Approved"
                        : "Pending Approval"}
                    )
                </span>
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
                        <div className="flex flex-col items-center gap-2">
                            <img
                                src={
                                    selectedEmployee.employee?.image ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        `${selectedEmployee.employee?.first_name} ${selectedEmployee.employee?.last_name}`
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
                                    <strong>
                                        {selectedEmployee.pay_schedule ===
                                        "semi-monthly"
                                            ? "Monthly"
                                            : "Weekly"}{" "}
                                        Basic Salary:
                                    </strong>{" "}
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱
                                    {formatCurrency(
                                        selectedEmployee.employee?.basic_salary
                                    )}
                                </p>

                                <p>
                                    <strong>Daily Paygrade:</strong>{" "}
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱
                                    {formatCurrency(
                                        (selectedEmployee.employee
                                            ?.basic_salary || 0) /
                                            getPerDayDivider()
                                    )}
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
                                    ₱{formatCurrency(calculateGrossPay())}
                                </p>
                                <p>
                                    <strong>Total Deductions:</strong>
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱
                                    {formatCurrency(calculateTotalDeductions())}
                                </p>
                                <p>
                                    <strong>Net Pay:</strong>
                                </p>
                                <p className="bg-slate-400/50 p-2 rounded-lg">
                                    ₱{formatCurrency(calculateNetPay())}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="p-2 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-lg">EARNINGS</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <section>
                                    <p className="font-medium">
                                        <strong>
                                            Working Days (
                                            {selectedEmployee.pay_schedule.toLowerCase() ===
                                            "weekly"
                                                ? "6"
                                                : selectedEmployee.days_worked}
                                            d)
                                        </strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* <p className="bg-slate-100 p-2 rounded-lg">
                                        {selectedEmployee.pay_schedule.toLowerCase() ===
                                        "weekly"
                                            ? "6"
                                            : selectedEmployee.total_working_days}{" "}
                                        days
                                    </p> */}
                                        <p className="bg-slate-100 p-2 rounded-lg">
                                            ₱
                                            {formatCurrency(
                                                (selectedEmployee.days_worked *
                                                    (selectedEmployee.employee
                                                        ?.basic_salary || 0)) /
                                                    getPerDayDivider()
                                            )}
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <p className="font-medium">
                                        <strong>Allowance</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={editedData.allowance}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "allowance",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={!!errors.allowance}
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.allowance
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            </div>
                            <div className="space-y-3">
                                <section>
                                    <p className="font-medium">
                                        <strong>Holiday Pay</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={editedData.holiday_pay}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "holiday_pay",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={!!errors.holiday_pay}
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.holiday_pay
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <p className="font-medium">
                                        <strong>Overtime Pay</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={editedData.overtime_pay}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "overtime_pay",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={!!errors.overtime_pay}
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.overtime_pay
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            </div>
                            <div className="space-y-3">
                                <section>
                                    <p className="font-medium">
                                        <strong>Adjustments</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.gross_pay_adjustments
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "gross_pay_adjustments",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={
                                                    !!errors.gross_pay_adjustments
                                                }
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.gross_pay_adjustments
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-lg mb-3">
                            DEDUCTIONS
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <section>
                                    <p className="font-medium">
                                        <strong>Withholding Tax</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.withholding_tax
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "withholding_tax",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={!!errors.withholding_tax}
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.withholding_tax
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <p className="font-medium">
                                        <strong>SSS Contribution</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={editedData.sss_deduction}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "sss_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={!!errors.sss_deduction}
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.sss_deduction
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <p className="font-medium">
                                        <strong>PhilHealth</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.philhealth_deduction
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "philhealth_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={
                                                    !!errors.philhealth_deduction
                                                }
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.philhealth_deduction
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                                <section>
                                    <p className="font-medium">
                                        <strong>Employee Loan</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.loan_deduction
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "loan_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={!!errors.loan_deduction}
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.loan_deduction
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                                <section>
                                    <p className="font-medium">
                                        <strong>Others</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.deductions_adjustments
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "deductions_adjustments",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={
                                                    !!errors.deductions_adjustments
                                                }
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.deductions_adjustments
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-3">
                                <section>
                                    <p className="font-medium">
                                        <strong>Pag-IBIG</strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.pagibig_deduction
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "pagibig_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={
                                                    !!errors.pagibig_deduction
                                                }
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.pagibig_deduction
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <p className="font-medium">
                                        <strong>
                                            Absences (
                                            {parseInt(
                                                selectedEmployee.total_absences
                                            ) + "d"}
                                            )
                                        </strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.absences_deduction
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "absences_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={
                                                    !!errors.absences_deduction
                                                }
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.absences_deduction
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <p className="font-medium">
                                        <strong>
                                            Late (
                                            {(selectedEmployee.late_hours ||
                                                0) + "h"}
                                            )
                                        </strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.late_deduction
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "late_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={!!errors.late_deduction}
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.late_deduction
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                                <section>
                                    <p className="font-medium">
                                        <strong>
                                            Undertime{" "}
                                            {(selectedEmployee?.undertime_hours ||
                                                0) + "h"}
                                        </strong>
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isEditing && false ? (
                                            <Input
                                                type="number"
                                                value={
                                                    editedData.undertime_deduction
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "undertime_deduction",
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-white"
                                                error={
                                                    !!errors.undertime_deduction
                                                }
                                            />
                                        ) : (
                                            <p className="bg-slate-100 p-2 rounded-lg">
                                                ₱
                                                {formatCurrency(
                                                    editedData.undertime_deduction
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="font-medium">
                        <strong>Notes</strong>
                    </p>
                    <Textarea
                        label="Approval Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={
                            selectedEmployee.status.toLowerCase() ===
                                "approved" || processing
                        }
                        error={!!errors.notes}
                    />
                    {errors.notes && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.notes}
                        </p>
                    )}
                </div>
            </ModalBody>

            <ModalFooter>
                {selectedEmployee.status.toLowerCase() !== "approved" ? (
                    <>
                        <Button
                            color={isEditing ? "gray" : "blue"}
                            onClick={() => setIsEditing(!isEditing)}
                            disabled={processing}
                        >
                            {isEditing ? "Cancel Editing" : "Edit Fields"}
                        </Button>

                        {!isEditing && (
                            <Button
                                color="green"
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faSpinner}
                                            spin
                                        />{" "}
                                        Approving...
                                    </>
                                ) : (
                                    "Approve & Generate Payslip"
                                )}
                            </Button>
                        )}

                        {isEditing && (
                            <Button
                                onClick={handleUpdate}
                                color={"green"}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faSpinner}
                                            spin
                                        />{" "}
                                        Updating...
                                    </>
                                ) : (
                                    "Update"
                                )}
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        {!isEditing && (
                            <Button
                                color="green"
                                onClick={handleRegeneratePayslip}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faSpinner}
                                            spin
                                        />{" "}
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Payslip"
                                )}
                            </Button>
                        )}
                    </>
                )}
                {/* <Button
                    color="gray"
                    onClick={() => setDetailModalOpen(true)}
                    disabled={processing}
                >
                    View Attendance
                </Button> */}

                <Button color="gray" onClick={onClose} disabled={processing}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default PayrollApprovalModal;
