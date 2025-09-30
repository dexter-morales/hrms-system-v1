import React, { useCallback } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import { Button, Label, TextInput } from "flowbite-react";
import { useDropzone } from "react-dropzone";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const Index = () => {
    const { companySettings } = usePage().props;

    console.log("Company Settings:", companySettings);
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Company Settings
                    </h3>
                </div>

                <BreadCrumbs />

                <div className="space-y-4">
                    <CompanySettingForm setting={companySettings || {}} />
                </div>
            </div>
        </DashboardLayout>
    );
};

const CompanySettingForm = ({ setting }) => {
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const { data, setData, post, processing, errors } = useForm({
        company_name: setting.company_name || "",
        address: setting.address || "",
        email: setting.email || "",
        phone_number: setting.phone_number || "",
        mobile_number: setting.mobile_number || "",
        employee_id_prefix: setting.employee_id_prefix || "EMP",
        company_logo: null,
        thirteenth_month_pay_start: formatDateForInput(
            setting.thirteenth_month_pay_start
        ),
        thirteenth_month_pay_end: formatDateForInput(
            setting.thirteenth_month_pay_end
        ),
    });

    const onDrop = useCallback((acceptedFiles) => {
        setData("company_logo", acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        Swal.fire({
            title: "Update Company Settings?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, update it",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "bg-white shadow-lg rounded-lg p-4",
                confirmButton:
                    "btn btn-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500",
                cancelButton:
                    "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
            },
            buttonsStyling: true,
        }).then((result) => {
            if (result.isConfirmed) {
                post(route("company-settings.update"), {
                    forceFormData: true,
                    onSuccess: () =>
                        toast.success("Settings updated successfully"),
                    onError: (errors) =>
                        toast.error(
                            `Update failed: ${Object.values(errors).join(", ")}`
                        ),
                });
            }
        });
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-4">
            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                {[
                    {
                        name: "company_name",
                        label: "Company Name",
                        type: "text",
                    },
                    { name: "address", label: "Address", type: "text" },
                    { name: "email", label: "Email", type: "email" },
                    {
                        name: "phone_number",
                        label: "Phone Number",
                        type: "text",
                    },
                    {
                        name: "mobile_number",
                        label: "Mobile Number",
                        type: "text",
                    },
                    {
                        name: "employee_id_prefix",
                        label: "Employee ID Prefix",
                        type: "text",
                    },
                ].map(({ name, label, type }) => (
                    <div key={name}>
                        <Label htmlFor={name}>
                            {label} <span className="text-red-500">*</span>
                        </Label>
                        <TextInput
                            id={name}
                            type={type}
                            value={data[name]}
                            onChange={(e) => setData(name, e.target.value)}
                            aria-invalid={!!errors[name]}
                        />
                        {errors[name] && (
                            <p className="text-red-600 text-sm">
                                {errors[name]}
                            </p>
                        )}
                    </div>
                ))}

                <div className="col-span-2 w-40">
                    <Label>Company Logo</Label>
                    <div
                        {...getRootProps()}
                        className={`border-2 p-4 rounded-lg text-center cursor-pointer justify-center content-center flex ${
                            isDragActive
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300"
                        }`}
                    >
                        <input {...getInputProps()} />
                        {data.company_logo ? (
                            <p>{data.company_logo.name}</p>
                        ) : setting.company_logo ? (
                            <img
                                src={`/storage/${setting.company_logo}`}
                                alt="Current Logo"
                                className="mt-0 h-16 rounded-full border-2 border-gray-300"
                            />
                        ) : (
                            <p>
                                Drag 'n' drop an image here, or click to select
                                one
                            </p>
                        )}
                    </div>
                    {errors.company_logo && (
                        <p className="text-red-600 text-sm">
                            {errors.company_logo}
                        </p>
                    )}
                </div>

                {/* 13th Month Pay Settings Section */}
                <div className="col-span-2 border-t pt-4">
                    <h4 className="text-lg font-semibold mb-4">
                        13th Month Pay Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="thirteenth_month_pay_start">
                                Start Date{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <TextInput
                                id="thirteenth_month_pay_start"
                                type="date"
                                value={data.thirteenth_month_pay_start}
                                onChange={(e) =>
                                    setData(
                                        "thirteenth_month_pay_start",
                                        e.target.value
                                    )
                                }
                                aria-invalid={
                                    !!errors.thirteenth_month_pay_start
                                }
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Typically December 1st of previous year
                            </p>
                            {errors.thirteenth_month_pay_start && (
                                <p className="text-red-600 text-sm">
                                    {errors.thirteenth_month_pay_start}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="thirteenth_month_pay_end">
                                End Date <span className="text-red-500">*</span>
                            </Label>
                            <TextInput
                                id="thirteenth_month_pay_end"
                                type="date"
                                value={data.thirteenth_month_pay_end}
                                onChange={(e) =>
                                    setData(
                                        "thirteenth_month_pay_end",
                                        e.target.value
                                    )
                                }
                                aria-invalid={!!errors.thirteenth_month_pay_end}
                                min={data.thirteenth_month_pay_start}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Typically November 30th of current year
                            </p>
                            {errors.thirteenth_month_pay_end && (
                                <p className="text-red-600 text-sm">
                                    {errors.thirteenth_month_pay_end}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 flex justify-end space-x-2">
                    <Button
                        type="submit"
                        color="red"
                        size="md"
                        disabled={processing}
                    >
                        Update
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Index;
