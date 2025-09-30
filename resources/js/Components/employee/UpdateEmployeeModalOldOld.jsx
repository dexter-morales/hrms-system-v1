import {
    Button,
    FooterDivider,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
} from "flowbite-react";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextInput from "../TextInput";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDropzone } from "react-dropzone";
import ReactSelectInput from "../ui/dropdown/ReactSelectInput";
import PaymentMethodForm from "./PaymentMethodForm";

// Initial form state
const initialForm = {
    employee_id: "",
    username: "",
    password: "",
    email: "",
    department_id: "",
    site_id: "",
    position_id: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    birthday: "",
    date_hired: "",
    end_of_contract: "",
    employment_status: "",
    basic_salary: "",
    daily_rate: "",
    payroll_status: "Weekly",
    employment_type: "",
    allowance: "",
    head_or_manager: "",
    status: "Active",
    role_access: "",
    employee_remarks: "",
    leave_credits: {},
    sss: "",
    philhealth: "",
    pagibig: "",
    tin: "",
    employee_picture: null,
    payment_methods: [],
};

// Required fields for validation
const requiredFields = [
    "employee_id",
    "first_name",
    "last_name",
    "birthday",
    "department_id",
    "site_id",
    "position_id",
    "employment_status",
];

// Form field configurations by tab
const formFields = {
    Personal: [
        {
            name: "first_name",
            label: "First Name",
            type: "text",
            placeholder: "First Name",
        },
        {
            name: "last_name",
            label: "Last Name",
            type: "text",
            placeholder: "Last Name",
        },
        {
            name: "middle_name",
            label: "Middle Name",
            type: "text",
            placeholder: "Middle Name",
        },
        { name: "birthday", label: "Birthday", type: "date" },
        { name: "sss", label: "SSS", type: "text", placeholder: "SSS Number" },
        {
            name: "philhealth",
            label: "Philhealth",
            type: "text",
            placeholder: "Philhealth Number",
        },
        {
            name: "pagibig",
            label: "Pag-ibig",
            type: "text",
            placeholder: "Pag-ibig Number",
        },
        { name: "tin", label: "TIN", type: "text", placeholder: "TIN Number" },
    ],
    Work: [
        {
            name: "employee_id",
            label: "Employee ID",
            type: "text",
            placeholder: "Employee ID",
            disabled: true,
        },
        {
            name: "department_id",
            label: "Department",
            type: "select",
            placeholder: "Select Department",
            optionsKey: "departments",
        },
        {
            name: "site_id",
            label: "Site/Location",
            type: "select",
            placeholder: "Select Site/Location",
            optionsKey: "sites",
        },
        {
            name: "position_id",
            label: "Position",
            type: "select",
            placeholder: "Select Position",
            optionsKey: "positions",
        },
        { name: "date_hired", label: "Date Hired", type: "date" },
        { name: "end_of_contract", label: "End of Contract", type: "date" },
        {
            name: "employment_status",
            label: "Employment Status",
            type: "select",
            placeholder: "Select Employment Status",
            optionsKey: "employment_status",
        },
        {
            name: "employment_type",
            label: "Employment Type",
            type: "select",
            placeholder: "Select Employment Type",
            optionsKey: "employment_types",
        },
        {
            name: "payroll_status",
            label: "Payroll Status",
            type: "select",
            placeholder: "Select Payroll Status",
            optionsKey: "payrollStatusOptions",
        },
        {
            name: "basic_salary",
            label: "Basic Salary",
            type: "text",
            placeholder: "Basic Salary",
            format: "number",
        },
        {
            name: "daily_rate",
            label: "Daily Rate",
            type: "text",
            placeholder: "Daily Rate",
            disabled: true,
            format: "number",
        },
        {
            name: "head_or_manager",
            label: "Head or Manager",
            type: "select",
            placeholder: "Select Head or Manager",
            optionsKey: "heads_managers",
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "Select Status",
            optionsKey: "statusOptions",
        },
        {
            name: "role_access",
            label: "Role Access",
            type: "select",
            placeholder: "Select Role Access",
            optionsKey: "role_access",
        },
        {
            name: "employee_remarks",
            label: "Remarks",
            type: "text",
            placeholder: "Employee Remarks",
        },
    ],
    Account: [
        {
            name: "username",
            label: "Username",
            type: "text",
            placeholder: "Username",
            autocomplete: "off",
        },
        {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "Email Address",
            autocomplete: "off",
        },
        {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "Password",
            autocomplete: "new-password",
        },
    ],
    Leave: [],
    Bank: [
        {
            name: "payment_methods",
            label: "Payment Methods",
            type: "custom",
        },
    ],
};

const UpdateEmployeeModal = ({
    show,
    onClose,
    onSuccess,
    employee,
    departments,
    positions,
    sites,
    heads_managers,
    employment_types,
    employment_status,
    role_access,
    leaveTypes,
}) => {
    const { data, setData, put, processing, errors, reset } =
        useForm(initialForm);
    const [activeTab, setActiveTab] = useState("Personal");
    const [touchedFields, setTouchedFields] = useState({});
    const [previewImage, setPreviewImage] = useState("");
    const [searchValues, setSearchValues] = useState({});

    const payrollStatusOptions = [
        { id: "Weekly", name: "Weekly" },
        { id: "Semi-monthly", name: "Semi-monthly" },
    ];

    const statusOptions = [
        { id: "Active", name: "Active" },
        { id: "Inactive", name: "Inactive" },
    ];

    // Format numbers
    const numberFormat = (number) => {
        const parsed = parseFloat(number);
        return isNaN(parsed)
            ? "0.00"
            : new Intl.NumberFormat("en-US", {
                  maximumFractionDigits: 2,
              }).format(parsed);
    };

    // Load initial data
    useEffect(() => {
        if (show && employee) {
            setData({
                employee_id: employee.employee_id || "",
                username: employee.user?.username || "",
                password: "",
                email: employee.user?.email || "",
                department_id: employee.department_id?.toString() || "",
                site_id: employee.site_id?.toString() || "",
                position_id: employee.position_id?.toString() || "",
                last_name: employee.last_name || "",
                first_name: employee.first_name || "",
                middle_name: employee.middle_name || "",
                birthday: employee.birthday
                    ? employee.birthday.split("T")[0]
                    : "",
                date_hired: employee.date_hired
                    ? employee.date_hired.split("T")[0]
                    : "",
                end_of_contract: employee.end_of_contract
                    ? employee.end_of_contract.split("T")[0]
                    : "",
                employment_status:
                    employee.employment_status_id?.toString() || "",
                basic_salary: employee.basic_salary?.toString() || "",
                daily_rate: employee.daily_rate?.toString() || "",
                payroll_status: employee.payroll_status || "Weekly",
                employment_type: employee.employment_type_id?.toString() || "",
                allowance: employee.allowance?.toString() || "",
                head_or_manager: employee.head_or_manager || "",
                status: employee.user?.status || "Active",
                role_access: employee.role_access_id?.toString() || "",
                employee_remarks: employee.employee_remarks || "",
                leave_credits:
                    employee.leave_credits?.reduce(
                        (acc, credit) => ({
                            ...acc,
                            [credit.leave_type_id]: credit.credits || 0,
                        }),
                        {}
                    ) || {},
                sss: employee.sss || "",
                philhealth: employee.philhealth || "",
                pagibig: employee.pagibig || "",
                tin: employee.tin || "",
                employee_picture: null,
                payment_methods: employee.payment_methods || [],
            });
            setTouchedFields(
                Object.keys(employee).reduce(
                    (acc, key) => ({ ...acc, [key]: true }),
                    {}
                )
            );
            setPreviewImage(
                employee?.avatar ? `/storage/${employee.avatar}` : ""
            );
        }
    }, [show, employee, setData]);

    // Reset form on close
    useEffect(() => {
        if (!show) {
            reset();
            setTouchedFields({});
            setActiveTab("Personal");
            setPreviewImage(null);
            setSearchValues({});
        }
    }, [show, reset]);

    // Auto-calculate daily rate
    useEffect(() => {
        if (data.basic_salary) {
            const salary = parseFloat(data.basic_salary) || 0;
            const dailyRate =
                data.payroll_status === "Weekly" ? salary / 6 : salary / 26;
            setData("daily_rate", dailyRate.toFixed(2));
        } else {
            setData("daily_rate", "");
        }
    }, [data.basic_salary, data.payroll_status, setData]);

    // Handle form input changes
    const handleChange = (name, value) => {
        const newValue =
            value && typeof value === "object" && "target" in value
                ? value.target.value
                : value?.id?.toString() || value || "";
        setData((prevData) => ({ ...prevData, [name]: newValue }));
        setTouchedFields((prev) => ({ ...prev, [name]: true }));
    };

    // Handle leave credits
    const handleLeaveCreditsChange = (leaveTypeId, value) => {
        setData((prevData) => ({
            ...prevData,
            leave_credits: {
                ...prevData.leave_credits,
                [leaveTypeId]: value ? parseInt(value, 10) || 0 : 0,
            },
        }));
    };

    // Handle file drop
    const onDrop = useCallback(
        (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                setData("employee_picture", file);
                const reader = new FileReader();
                reader.onload = (e) => setPreviewImage(e.target.result);
                reader.readAsDataURL(file);
            }
        },
        [setData]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/jpeg": [], "image/png": [] },
        maxFiles: 1,
    });

    // Validate form
    const validateForm = () => {
        const newTouchedFields = {};
        let isValid = true;

        for (let field of requiredFields) {
            newTouchedFields[field] = true;
            if (!data[field] && field !== "employee_picture") {
                toast.warning(
                    `Please fill in the ${field.replace(/_/g, " ")} field.`
                );
                isValid = false;
            }
        }

        setTouchedFields(newTouchedFields);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const formData = new FormData();
        for (const key in data) {
            if (data[key] instanceof File) {
                formData.append(key, data[key]);
            } else if (key === "leave_credits" || key === "payment_methods") {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key] || "");
            }
        }
        formData.append("_method", "PUT");

        put(route("employees.update", employee?.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const { flash } = page.props;
                if (flash?.success) toast.success(flash.success);
                if (flash?.error) toast.error(flash.error);
                reset();
                setTouchedFields({});
                setPreviewImage(null);
                onSuccess?.();
                onClose();
            },
            onError: (errors) => {
                toast.error("Failed to update employee. Please try again.");
                console.error("Validation errors:", errors);
            },
        });
    };

    // Utility functions for rendering
    const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);
    const showRequiredAsterisk = (fieldName) =>
        isFieldRequired(fieldName) && !data[fieldName];
    const showErrorBorder = (fieldName) => !!errors[fieldName];

    // Render text input field
    const renderTextInput = ({
        name,
        label,
        type = "text",
        placeholder,
        disabled = false,
        format,
        autocomplete,
    }) => (
        <div className="flex flex-col space-y-0.5">
            <Label htmlFor={name}>
                {label}{" "}
                {showRequiredAsterisk(name) && (
                    <span className="text-red-500">*</span>
                )}
            </Label>
            <TextInput
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={
                    format === "number"
                        ? numberFormat(data[name]) || ""
                        : data[name] || ""
                }
                onChange={(e) =>
                    handleChange(
                        name,
                        format === "number"
                            ? e.target.value.replace(/[^0-9.]/g, "")
                            : e
                    )
                }
                disabled={disabled}
                autocomplete={autocomplete}
                className={showErrorBorder(name) ? "!border-red-500" : ""}
            />
            {errors[name] && (
                <span className="text-red-500 text-sm">{errors[name]}</span>
            )}
        </div>
    );

    // Render select input field
    const renderSelectInput = ({
        name,
        label,
        placeholder,
        optionsKey,
        required = false,
    }) => {
        const options =
            optionsKey === "heads_managers"
                ? [
                      { employee_id: "0", name: "No Manager" },
                      ...heads_managers.map((manager) => ({
                          employee_id: manager.employee_id,
                          name: `${manager.first_name} ${manager.last_name} (${manager.employee_id})`,
                      })),
                  ]
                : optionsKey === "employment_types"
                ? [...employment_types, { id: "", name: "No Employment" }]
                : eval(optionsKey);

        const selected = data[name]
            ? options.find(
                  (opt) =>
                      opt.id?.toString() === data[name].toString() ||
                      opt.employee_id === data[name]
              ) || options[0]
            : options[0];

        return (
            <div className="flex flex-col space-y-0.5">
                <Label htmlFor={name}>
                    {label}{" "}
                    {required && showRequiredAsterisk(name) && (
                        <span className="text-red-500">*</span>
                    )}
                </Label>
                <ReactSelectInput
                    name={name}
                    options={options}
                    selected={selected}
                    onChange={(value) => handleChange(name, value)}
                    placeholder={placeholder}
                    displayKey="name"
                    valueKey={
                        optionsKey === "heads_managers" ? "employee_id" : "id"
                    }
                    required={required}
                    error={errors[name]}
                    searchValue={searchValues[name] || ""}
                    onSearchChange={(value) =>
                        setSearchValues((prev) => ({ ...prev, [name]: value }))
                    }
                    className={showErrorBorder(name) ? "!border-red-500" : ""}
                />
                {errors[name] && (
                    <span className="text-red-500 text-sm">{errors[name]}</span>
                )}
            </div>
        );
    };

    // Render form fields for a tab
    const renderFormFields = (tab) => (
        <div
            className={`grid ${
                tab === "Bank" ? "grid-cols-1" : "grid-cols-3"
            } gap-4`}
        >
            {formFields[tab].map((field) =>
                field.type === "select" ? (
                    renderSelectInput(field)
                ) : field.type === "custom" ? (
                    <PaymentMethodForm
                        paymentMethods={data.payment_methods}
                        setPaymentMethods={(methods) =>
                            setData("payment_methods", methods)
                        }
                        errors={errors}
                    />
                ) : (
                    renderTextInput(field)
                )
            )}
            {tab === "Personal" && (
                <div className="flex flex-col space-y-0.5">
                    <Label htmlFor="employee_picture">Employee Picture</Label>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed p-4 text-center rounded ${
                            isDragActive
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300"
                        }`}
                    >
                        <input {...getInputProps()} />
                        {previewImage ? (
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="rounded-full max-w-xs mt-2 mx-auto h-32 w-32 object-cover"
                            />
                        ) : isDragActive ? (
                            <p>Drop the image here...</p>
                        ) : (
                            <p>
                                Drag and drop an image here, or click to select
                            </p>
                        )}
                    </div>
                    {errors.employee_picture && (
                        <span className="text-red-500 text-sm">
                            {errors.employee_picture}
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <Modal
            show={show}
            onClose={onClose}
            size="4xl"
            style={{ height: "100vh" }}
        >
            <ModalHeader>Edit Employee</ModalHeader>
            <ModalBody>
                <div className="flex space-x-4 border-b mb-4">
                    {Object.keys(formFields).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={`px-4 py-2 capitalize ${
                                activeTab.toLowerCase() === tab.toLowerCase()
                                    ? "border-b-2 border-blue-600 font-semibold"
                                    : ""
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab} Info
                        </button>
                    ))}
                </div>
                {activeTab.toLowerCase() === "personal" &&
                    renderFormFields("Personal")}
                {activeTab.toLowerCase() === "work" && renderFormFields("Work")}
                {activeTab.toLowerCase() === "account" &&
                    renderFormFields("Account")}
                {activeTab.toLowerCase() === "leave" && (
                    <div className="grid grid-cols-3 gap-4">
                        {leaveTypes.map((leaveType) => (
                            <div key={leaveType.id} className="flex flex-col">
                                <Label
                                    htmlFor={`leave_credits_${leaveType.id}`}
                                >
                                    {leaveType.name}
                                </Label>
                                <TextInput
                                    type="number"
                                    id={`leave_credits_${leaveType.id}`}
                                    value={
                                        data.leave_credits[leaveType.id] || ""
                                    }
                                    onChange={(e) =>
                                        handleLeaveCreditsChange(
                                            leaveType.id,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter credits"
                                    className="w-full"
                                />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab.toLowerCase() === "bank" && renderFormFields("Bank")}
            </ModalBody>
            <FooterDivider />
            <div className="flex justify-end pb-6 px-6">
                <Button
                    onClick={handleSubmit}
                    isProcessing={processing}
                    className="ml-4 bg-indigo-500 hover:bg-indigo-600"
                >
                    {processing ? (
                        <span className="flex justify-center items-center gap-2">
                            <FontAwesomeIcon icon={faSpinner} spin /> Saving...
                        </span>
                    ) : (
                        "Update Employee"
                    )}
                </Button>
            </div>
        </Modal>
    );
};

export default UpdateEmployeeModal;
