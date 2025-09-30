import {
    Button,
    FooterDivider,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
} from "flowbite-react";
import { useState, useEffect, useCallback } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextInput from "../TextInput";
import CryptoJS from "crypto-js";
import { faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDropzone } from "react-dropzone";
import ReactSelectInput from "../ui/dropdown/ReactSelectInput";

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
    employment_status: "1",
    basic_salary: "",
    daily_rate: "",
    payroll_status: "Semi-monthly",
    employment_type: "1",
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
    payment_methods: [], // New field for payment methods
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
    "basic_salary",
    "employment_status",
    "date_hired",
    // "head_or_manager",
    "daily_rate",
];

const NewEmployeeModal = ({
    show,
    onClose,
    onSuccess,
    generated_employee_id,
}) => {
    const {
        departments,
        positions,
        sites,
        heads_managers,
        employment_types,
        employment_status,
        role_access,
        leaveTypes,
        generated_superAdmin_id,
    } = usePage().props;

    const { data, setData, post, processing, errors, reset } =
        useForm(initialForm);
    const [activeTab, setActiveTab] = useState("Personal");
    const [touchedFields, setTouchedFields] = useState({});
    const [previewImage, setPreviewImage] = useState(null);
    const [searchValues, setSearchValues] = useState({});
    const [newPaymentMethod, setNewPaymentMethod] = useState({
        type: "bank",
        bank_name: "",
        bank_account_number: "",
        account_name: "",
        ewallet_name: "",
        ewallet_number: "",
    });

    const ENCRYPTION_KEY = "xai-employee-form-key-2025";

    const payrollStatusOptions = [
        { id: "Weekly", name: "Weekly" },
        { id: "Semi-monthly", name: "Semi-monthly" },
    ];

    const statusOptions = [
        { id: "Active", name: "Active" },
        { id: "Inactive", name: "Inactive" },
    ];

    const paymentTypeOptions = [
        { id: "bank", name: "Bank" },
        { id: "ewallet", name: "E-wallet" },
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
            {
                name: "sss",
                label: "SSS",
                type: "text",
                placeholder: "SSS Number",
            },
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
            {
                name: "tin",
                label: "TIN",
                type: "text",
                placeholder: "TIN Number",
            },
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
                options: departments,
            },
            {
                name: "site_id",
                label: "Site/Location",
                type: "select",
                placeholder: "Select Site/Location",
                options: sites,
            },
            {
                name: "position_id",
                label: "Position",
                type: "select",
                placeholder: "Select Position",
                options: positions,
            },
            { name: "date_hired", label: "Date Hired", type: "date" },
            { name: "end_of_contract", label: "End of Contract", type: "date" },
            {
                name: "employment_status",
                label: "Employment Status",
                type: "select",
                placeholder: "Select Employment Status",
                options: employment_status,
            },
            {
                name: "employment_type",
                label: "Employment Type",
                type: "select",
                placeholder: "Select Employment Type",
                options: [
                    ...employment_types,
                    { id: "", name: "No Employment" },
                ],
            },
            {
                name: "payroll_status",
                label: "Payroll Status",
                type: "select",
                placeholder: "Select Payroll Status",
                options: payrollStatusOptions,
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
                options: [
                    { employee_id: "0", name: "No Manager" },
                    ...heads_managers.map((manager) => ({
                        employee_id: manager.employee_id,
                        name: `${manager.first_name} ${manager.last_name} (${manager.employee_id})`,
                    })),
                ],
            },
            {
                name: "status",
                label: "Status",
                type: "select",
                placeholder: "Select Status",
                options: statusOptions,
            },
            {
                name: "role_access",
                label: "Role Access",
                type: "select",
                placeholder: "Select Role Access",
                options: role_access,
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

    // Format numbers
    const numberFormat = (number) => {
        const parsed = parseFloat(number);
        return isNaN(parsed)
            ? "0.00"
            : new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              }).format(parsed);
    };

    // Load saved form data
    useEffect(() => {
        if (show && typeof window !== "undefined") {
            const savedData = localStorage.getItem("employeeFormData");
            if (savedData) {
                try {
                    const bytes = CryptoJS.AES.decrypt(
                        savedData,
                        ENCRYPTION_KEY
                    );
                    const decryptedData = JSON.parse(
                        bytes.toString(CryptoJS.enc.Utf8)
                    );
                    setData((prevData) => ({
                        ...prevData,
                        ...decryptedData,
                        password: "",
                        employee_picture: null,
                        payment_methods: decryptedData.payment_methods || [],
                    }));
                    setTouchedFields(
                        Object.keys(decryptedData).reduce(
                            (acc, key) => ({ ...acc, [key]: true }),
                            {}
                        )
                    );
                } catch (error) {
                    console.error("Failed to decrypt form data:", error);
                    localStorage.removeItem("employeeFormData");
                }
            }
            // Set employee_id based on role_access
            const isSuperAdmin =
                data.role_access === (role_access[0]?.id || "SuperAdmin");
            setData(
                "employee_id",
                isSuperAdmin ? generated_superAdmin_id : generated_employee_id
            );
            // Auto-populate account_name for new payment methods
            setNewPaymentMethod((prev) => ({
                ...prev,
                account_name: `${data.first_name} ${data.last_name}`.trim(),
            }));
        }
    }, [
        show,
        generated_employee_id,
        generated_superAdmin_id,
        setData,
        data.role_access,
        data.first_name,
        data.last_name,
        role_access,
    ]);

    // Reset form on close
    useEffect(() => {
        if (!show) {
            reset();
            setTouchedFields({});
            setActiveTab("Personal");
            setPreviewImage(null);
            setSearchValues({});
            setNewPaymentMethod({
                type: "bank",
                bank_name: "",
                bank_account_number: "",
                account_name: "",
                ewallet_name: "",
                ewallet_number: "",
            });
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

    // Auto-update account_name in newPaymentMethod when first_name or last_name changes
    useEffect(() => {
        setNewPaymentMethod((prev) => ({
            ...prev,
            account_name: `${data.first_name} ${data.last_name}`.trim(),
        }));
    }, [data.first_name, data.last_name]);

    // Handle form input changes
    const handleChange = (name, value) => {
        const newValue =
            value && typeof value === "object" && "target" in value
                ? value.target.value
                : value?.id?.toString() || value || "";
        setData((prevData) => ({ ...prevData, [name]: newValue }));
        setTouchedFields((prev) => ({ ...prev, [name]: true }));

        if (typeof window !== "undefined") {
            const { password, employee_picture, ...dataToSave } = data;
            dataToSave[name] = newValue;
            try {
                const encryptedData = CryptoJS.AES.encrypt(
                    JSON.stringify(dataToSave),
                    ENCRYPTION_KEY
                ).toString();
                localStorage.setItem("employeeFormData", encryptedData);
            } catch (error) {
                console.error("Failed to encrypt form data:", error);
            }
        }
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

    // Handle payment method changes
    const handlePaymentMethodChange = (index, field, value) => {
        setData((prevData) => {
            const updatedMethods = [...prevData.payment_methods];
            updatedMethods[index] = {
                ...updatedMethods[index],
                [field]: value,
            };
            return { ...prevData, payment_methods: updatedMethods };
        });
    };

    // Add new payment method
    const addPaymentMethod = () => {
        if (
            newPaymentMethod.type === "bank" &&
            (!newPaymentMethod.bank_name ||
                !newPaymentMethod.bank_account_number ||
                !newPaymentMethod.account_name)
        ) {
            toast.warning("Please fill in all bank details.");
            return;
        }
        if (
            newPaymentMethod.type === "ewallet" &&
            (!newPaymentMethod.ewallet_name || !newPaymentMethod.ewallet_number)
        ) {
            toast.warning("Please fill in all e-wallet details.");
            return;
        }
        setData((prevData) => ({
            ...prevData,
            payment_methods: [
                ...prevData.payment_methods,
                { ...newPaymentMethod, id: null },
            ],
        }));
        setNewPaymentMethod({
            type: "bank",
            bank_name: "",
            bank_account_number: "",
            account_name: `${data.first_name} ${data.last_name}`.trim(),
            ewallet_name: "",
            ewallet_number: "",
        });
        toast.success("Payment method added to the list.");
    };

    // Delete payment method
    const deletePaymentMethod = (index) => {
        setData((prevData) => ({
            ...prevData,
            payment_methods: prevData.payment_methods.filter(
                (_, i) => i !== index
            ),
        }));
        toast.info("Payment method removed from the list.");
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

        // Validate at least one payment method
        // if (data.payment_methods.length === 0) {
        //     toast.warning("Please add at least one payment method.");
        //     isValid = false;
        // }

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

        post(route("employees.store"), {
            preserveScroll: true,
            data: formData,
            forceFormData: true,
            onSuccess: (page) => {
                const { flash } = page.props;
                if (flash?.success) toast.success(flash.success);
                if (flash?.error) toast.error(flash.error);
                reset();
                setTouchedFields({});
                localStorage.removeItem("employeeFormData");
                setPreviewImage(null);
                setNewPaymentMethod({
                    type: "bank",
                    bank_name: "",
                    bank_account_number: "",
                    account_name: "",
                    ewallet_name: "",
                    ewallet_number: "",
                });
                onSuccess?.();
                onClose();
            },
            onError: (errors) => {
                toast.error("Failed to add employee. Please try again.");
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
        options,
        required = false,
    }) => {
        const selected =
            options[0]?.employee_id !== undefined
                ? data[name] == null
                    ? { employee_id: "0", name: "No Manager" }
                    : options.find(
                          (opt) => opt.employee_id === data[name].toString()
                      ) || { employee_id: "0", name: "No Manager" }
                : data[name] != null
                ? options.find(
                      (opt) => opt.id?.toString() === data[name].toString()
                  ) || null
                : null;

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
                    options={options || []}
                    selected={selected}
                    onChange={(value) => handleChange(name, value)}
                    placeholder={placeholder}
                    displayKey="name"
                    valueKey={
                        options[0]?.employee_id !== undefined
                            ? "employee_id"
                            : "id"
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

    // Render bank info form
    const renderBankInfoForm = () => (
        <div className="space-y-4">
            <div className="border p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">
                    Add Payment Method
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col space-y-0.5 w-1/2">
                        <Label htmlFor="new_payment_type">Type</Label>
                        <select
                            id="new_payment_type"
                            name="new_payment_type"
                            value={newPaymentMethod.type}
                            onChange={(e) =>
                                setNewPaymentMethod((prev) => ({
                                    ...prev,
                                    type: e.target.value,
                                }))
                            }
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        >
                            <option value="" disabled>
                                Select Type
                            </option>
                            {paymentTypeOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {newPaymentMethod.type === "bank" ? (
                            <>
                                <div className="flex flex-col space-y-0.5">
                                    <Label htmlFor="new_bank_name">
                                        Bank Name
                                    </Label>
                                    <TextInput
                                        id="new_bank_name"
                                        value={newPaymentMethod.bank_name}
                                        onChange={(e) =>
                                            setNewPaymentMethod((prev) => ({
                                                ...prev,
                                                bank_name: e.target.value,
                                            }))
                                        }
                                        placeholder="Bank Name (e.g., BDO, BPI)"
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <Label htmlFor="new_bank_account_number">
                                        Bank Account Number
                                    </Label>
                                    <TextInput
                                        id="new_bank_account_number"
                                        value={
                                            newPaymentMethod.bank_account_number
                                        }
                                        onChange={(e) =>
                                            setNewPaymentMethod((prev) => ({
                                                ...prev,
                                                bank_account_number:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="Bank Account Number"
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <Label htmlFor="new_account_name">
                                        Account Name
                                    </Label>
                                    <TextInput
                                        id="new_account_name"
                                        value={newPaymentMethod.account_name}
                                        onChange={(e) =>
                                            setNewPaymentMethod((prev) => ({
                                                ...prev,
                                                account_name: e.target.value,
                                            }))
                                        }
                                        placeholder="Account Name"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col space-y-0.5">
                                    <Label htmlFor="new_ewallet_name">
                                        E-wallet Name
                                    </Label>
                                    <TextInput
                                        id="new_ewallet_name"
                                        value={newPaymentMethod.ewallet_name}
                                        onChange={(e) =>
                                            setNewPaymentMethod((prev) => ({
                                                ...prev,
                                                ewallet_name: e.target.value,
                                            }))
                                        }
                                        placeholder="E-wallet Name (e.g., GCash, PayMaya)"
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <Label htmlFor="new_ewallet_number">
                                        E-wallet Number
                                    </Label>
                                    <TextInput
                                        id="new_ewallet_number"
                                        value={newPaymentMethod.ewallet_number}
                                        onChange={(e) =>
                                            setNewPaymentMethod((prev) => ({
                                                ...prev,
                                                ewallet_number: e.target.value,
                                            }))
                                        }
                                        placeholder="E-wallet Number"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-end">
                        <Button onClick={addPaymentMethod} color={"gray"}>
                            Add
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                    Existing Payment Methods
                </h3>
                {data.payment_methods.length === 0 && (
                    <p>No payment methods added.</p>
                )}
                {data.payment_methods.map((method, index) => (
                    <div
                        key={index}
                        className="border p-4 rounded flex justify-between items-center"
                    >
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor={`payment_type_${index}`}>
                                    Type
                                </Label>
                                <select
                                    id={`payment_type_${index}`}
                                    name={`payment_type_${index}`}
                                    value={method.type}
                                    onChange={(e) =>
                                        handlePaymentMethodChange(
                                            index,
                                            "type",
                                            e.target.value
                                        )
                                    }
                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="" disabled>
                                        Select Type
                                    </option>
                                    {paymentTypeOptions.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {method.type === "bank" ? (
                                <>
                                    <div className="flex flex-col space-y-0.5">
                                        <Label htmlFor={`bank_name_${index}`}>
                                            Bank Name
                                        </Label>
                                        <TextInput
                                            id={`bank_name_${index}`}
                                            value={method.bank_name || ""}
                                            onChange={(e) =>
                                                handlePaymentMethodChange(
                                                    index,
                                                    "bank_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Bank Name (e.g., BDO, BPI)"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-0.5">
                                        <Label
                                            htmlFor={`bank_account_number_${index}`}
                                        >
                                            Bank Account Number
                                        </Label>
                                        <TextInput
                                            id={`bank_account_number_${index}`}
                                            value={
                                                method.bank_account_number || ""
                                            }
                                            onChange={(e) =>
                                                handlePaymentMethodChange(
                                                    index,
                                                    "bank_account_number",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Bank Account Number"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-0.5">
                                        <Label
                                            htmlFor={`account_name_${index}`}
                                        >
                                            Account Name
                                        </Label>
                                        <TextInput
                                            id={`account_name_${index}`}
                                            value={method.account_name || ""}
                                            onChange={(e) =>
                                                handlePaymentMethodChange(
                                                    index,
                                                    "account_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Account Name"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col space-y-0.5">
                                        <Label
                                            htmlFor={`ewallet_name_${index}`}
                                        >
                                            E-wallet Name
                                        </Label>
                                        <TextInput
                                            id={`ewallet_name_${index}`}
                                            value={method.ewallet_name || ""}
                                            onChange={(e) =>
                                                handlePaymentMethodChange(
                                                    index,
                                                    "ewallet_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="E-wallet Name (e.g., GCash, PayMaya)"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-0.5">
                                        <Label
                                            htmlFor={`ewallet_number_${index}`}
                                        >
                                            E-wallet Number
                                        </Label>
                                        <TextInput
                                            id={`ewallet_number_${index}`}
                                            value={method.ewallet_number || ""}
                                            onChange={(e) =>
                                                handlePaymentMethodChange(
                                                    index,
                                                    "ewallet_number",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="E-wallet Number"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <Button
                            color="failure"
                            onClick={() => deletePaymentMethod(index)}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                    </div>
                ))}
                {errors.payment_methods && (
                    <span className="text-red-500 text-sm">
                        {errors.payment_methods}
                    </span>
                )}
            </div>
        </div>
    );

    // Render form fields for a tab
    const renderFormFields = (tab) => (
        <div className="grid grid-cols-3 gap-4">
            {formFields[tab].map((field) =>
                field.type === "select"
                    ? renderSelectInput({
                          name: field.name,
                          label: field.label,
                          placeholder: field.placeholder,
                          options: field.options,
                          required: isFieldRequired(field.name),
                      })
                    : field.type === "custom"
                    ? renderBankInfoForm()
                    : renderTextInput(field)
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
            <ModalHeader>Add New Employee</ModalHeader>
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
                {activeTab.toLowerCase() === "bank" && renderBankInfoForm()}
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
                        "Add Employee"
                    )}
                </Button>
            </div>
        </Modal>
    );
};

export default NewEmployeeModal;
