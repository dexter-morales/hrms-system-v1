import {
    Button,
    FooterDivider,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
} from "flowbite-react";
import { useState, useEffect, useCallback } from "react";
import { useForm, router } from "@inertiajs/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextInput from "../TextInput";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDropzone } from "react-dropzone";
import ReactSelectInput from "../ui/dropdown/ReactSelectInput";

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
    leave_credits: {},
    sss: "",
    philhealth: "",
    pagibig: "",
    tin: "",
    employee_picture: null,
};

const requiredFields = [
    "employee_id",
    "first_name",
    "last_name",
    "birthday",
    "department_id",
    "site_id",
    "position_id",
    "employment_status",
    "username",
    "email",
];

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
    const [activeTab, setActiveTab] = useState("Personal");
    const [touchedFields, setTouchedFields] = useState({});
    const [previewImage, setPreviewImage] = useState("");
    const { data, setData, put, processing, errors, reset } =
        useForm(initialForm);

    const [departmentSearch, setDepartmentSearch] = useState("");
    const [siteSearch, setSiteSearch] = useState("");
    const [positionSearch, setPositionSearch] = useState("");
    const [employmentStatusSearch, setEmploymentStatusSearch] = useState("");
    const [employmentTypeSearch, setEmploymentTypeSearch] = useState("");
    const [payrollStatusSearch, setPayrollStatusSearch] = useState("");
    const [managerSearch, setManagerSearch] = useState("");
    const [statusSearch, setStatusSearch] = useState("");
    const [roleAccessSearch, setRoleAccessSearch] = useState("");

    // Format numbers
    const numberFormat = (number) => {
        const parsed = parseFloat(number);
        if (isNaN(parsed)) return "0.00";

        return new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2,
        }).format(parsed);
    };

    // Load initial data when modal opens
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
            });
            setTouchedFields(
                Object.keys(employee).reduce(
                    (acc, key) => ({ ...acc, [key]: true }),
                    {}
                )
            );
            setPreviewImage(employee?.avatar ? `${employee.avatar}` : "");
        }
    }, [show, employee, setData]);

    // Reset form when modal closes
    useEffect(() => {
        if (!show) {
            reset();
            setTouchedFields({});
            setActiveTab("Personal");
            setPreviewImage(null);
            setDepartmentSearch("");
            setSiteSearch("");
            setPositionSearch("");
            setEmploymentStatusSearch("");
            setEmploymentTypeSearch("");
            setPayrollStatusSearch("");
            setManagerSearch("");
            setStatusSearch("");
            setRoleAccessSearch("");
        }
    }, [show, reset]);

    // Auto-calculate daily rate based on basic_salary and payroll_status
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

    const handleChange = (name, value) => {
        // Handle TextInput event or ReactSelectInput value
        const newValue =
            value && typeof value === "object" && "target" in value
                ? value.target.value
                : value?.id?.toString() || value || "";
        setData((prevData) => ({
            ...prevData,
            [name]: newValue,
        }));
        setTouchedFields((prev) => ({ ...prev, [name]: true }));
    };

    // Handle leave credits input
    const handleLeaveCreditsChange = (leaveTypeId, value) => {
        setData((prevData) => ({
            ...prevData,
            leave_credits: {
                ...prevData.leave_credits,
                [leaveTypeId]: value ? parseInt(value, 10) || 0 : 0,
            },
        }));
    };

    // Handle file drop for employee picture
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setData("employee_picture", file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewImage(e.target.result);
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/jpeg": [], "image/png": [] },
        maxFiles: 1,
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const formData = new FormData();
        for (const key in data) {
            if (data[key] instanceof File) {
                formData.append(key, data[key]);
            } else if (
                key === "leave_credits" &&
                typeof data[key] === "object"
            ) {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key] || "");
            }
        }

        put(route("employees.update", employee?.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const { flash } = page.props;

                if (flash?.error) {
                    toast.error(flash.error);
                } else {
                    toast.success(flash.success);
                }

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

    const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);

    const showRequiredAsterisk = (fieldName) =>
        isFieldRequired(fieldName) && !data[fieldName];

    const showErrorBorder = (fieldName) => !!errors[fieldName];

    const payrollStatusOptions = [
        { id: "Weekly", name: "Weekly" },
        { id: "Semi-monthly", name: "Semi-monthly" },
    ];

    const statusOptions = [
        { id: "Active", name: "Active" },
        { id: "Inactive", name: "Inactive" },
    ];

    return (
        <>
            {/* <ToastContainer position="top-right" autoClose={3000} /> */}
            <Modal
                show={show}
                onClose={onClose}
                size="4xl"
                style={{ height: "100vh" }}
            >
                <ModalHeader>Edit Employee</ModalHeader>
                <ModalBody>
                    <div className="flex space-x-4 border-b mb-4">
                        {["Personal", "Work", "Account", "Leave"].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                className={`px-4 py-2 capitalize ${
                                    activeTab.toLocaleLowerCase() ===
                                    tab.toLocaleLowerCase()
                                        ? "border-b-2 border-blue-600 font-semibold"
                                        : ""
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab} Info
                            </button>
                        ))}
                    </div>

                    {activeTab.toLocaleLowerCase() === "personal" && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="first_name">
                                    First Name{" "}
                                    {showRequiredAsterisk("first_name") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    id="first_name"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={data.first_name || ""}
                                    onChange={(e) =>
                                        handleChange("first_name", e)
                                    }
                                    className={
                                        showErrorBorder("first_name")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.first_name && (
                                    <span className="text-red-500 text-sm">
                                        {errors.first_name}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="last_name">
                                    Last Name{" "}
                                    {showRequiredAsterisk("last_name") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    id="last_name"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={data.last_name || ""}
                                    onChange={(e) =>
                                        handleChange("last_name", e)
                                    }
                                    className={
                                        showErrorBorder("last_name")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.last_name && (
                                    <span className="text-red-500 text-sm">
                                        {errors.last_name}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="middle_name">Middle Name</Label>
                                <TextInput
                                    id="middle_name"
                                    name="middle_name"
                                    placeholder="Middle Name"
                                    value={data.middle_name || ""}
                                    onChange={(e) =>
                                        handleChange("middle_name", e)
                                    }
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="birthday">
                                    Birthday{" "}
                                    {showRequiredAsterisk("birthday") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    id="birthday"
                                    name="birthday"
                                    type="date"
                                    value={data.birthday || ""}
                                    onChange={(e) =>
                                        handleChange("birthday", e)
                                    }
                                    className={
                                        showErrorBorder("birthday")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.birthday && (
                                    <span className="text-red-500 text-sm">
                                        {errors.birthday}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="sss">SSS</Label>
                                <TextInput
                                    id="sss"
                                    name="sss"
                                    placeholder="SSS Number"
                                    value={data.sss || ""}
                                    onChange={(e) => handleChange("sss", e)}
                                    className={
                                        showErrorBorder("sss")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.sss && (
                                    <span className="text-red-500 text-sm">
                                        {errors.sss}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="philhealth">Philhealth</Label>
                                <TextInput
                                    id="philhealth"
                                    name="philhealth"
                                    placeholder="Philhealth Number"
                                    value={data.philhealth || ""}
                                    onChange={(e) =>
                                        handleChange("philhealth", e)
                                    }
                                    className={
                                        showErrorBorder("philhealth")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.philhealth && (
                                    <span className="text-red-500 text-sm">
                                        {errors.philhealth}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="pagibig">Pag-ibig</Label>
                                <TextInput
                                    id="pagibig"
                                    name="pagibig"
                                    placeholder="Pag-ibig Number"
                                    value={data.pagibig || ""}
                                    onChange={(e) => handleChange("pagibig", e)}
                                    className={
                                        showErrorBorder("pagibig")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.pagibig && (
                                    <span className="text-red-500 text-sm">
                                        {errors.pagibig}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="tin">TIN</Label>
                                <TextInput
                                    id="tin"
                                    name="tin"
                                    placeholder="TIN Number"
                                    value={data.tin || ""}
                                    onChange={(e) => handleChange("tin", e)}
                                    className={
                                        showErrorBorder("tin")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.tin && (
                                    <span className="text-red-500 text-sm">
                                        {errors.tin}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="employee_picture">
                                    Employee Picture
                                </Label>
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
                                            src={`/storage/${previewImage}`}
                                            alt="Preview"
                                            className="rounded-full max-w-xs mt-2 mx-auto h-32 w-32 object-cover"
                                        />
                                    ) : isDragActive ? (
                                        <p>Drop the image here...</p>
                                    ) : (
                                        <p>
                                            Drag and drop an image here, or
                                            click to select
                                        </p>
                                    )}
                                </div>
                                {errors.employee_picture && (
                                    <span className="text-red-500 text-sm">
                                        {errors.employee_picture}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab.toLocaleLowerCase() === "work" && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="employee_id">
                                    Employee ID{" "}
                                    {showRequiredAsterisk("employee_id") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    id="employee_id"
                                    name="employee_id"
                                    placeholder="Employee ID"
                                    value={data.employee_id || ""}
                                    disabled={true}
                                    className={
                                        showErrorBorder("employee_id")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.employee_id && (
                                    <span className="text-red-500 text-sm">
                                        {errors.employee_id}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="department_id">
                                    Department{" "}
                                    {showRequiredAsterisk("department_id") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <ReactSelectInput
                                    name="department_id"
                                    options={departments}
                                    selected={
                                        data.department_id
                                            ? departments.find(
                                                  (dept) =>
                                                      dept.id.toString() ===
                                                      data.department_id.toString()
                                              )
                                            : null
                                    }
                                    onChange={(value) =>
                                        handleChange("department_id", value)
                                    }
                                    placeholder="Select Department"
                                    displayKey="name"
                                    valueKey="id"
                                    required={isFieldRequired("department_id")}
                                    error={errors.department_id}
                                    searchValue={departmentSearch}
                                    onSearchChange={setDepartmentSearch}
                                    className={
                                        showErrorBorder("department_id")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.department_id && (
                                    <span className="text-red-500 text-sm">
                                        {errors.department_id}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="site_id">
                                    Site/Location{" "}
                                    {showRequiredAsterisk("site_id") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <ReactSelectInput
                                    name="site_id"
                                    options={sites}
                                    selected={
                                        data.site_id
                                            ? sites.find(
                                                  (site) =>
                                                      site.id.toString() ===
                                                      data.site_id.toString()
                                              )
                                            : null
                                    }
                                    onChange={(e) => handleChange("site_id", e)}
                                    placeholder="Select Site/Location"
                                    displayKey="name"
                                    valueKey="id"
                                    required={isFieldRequired("site_id")}
                                    error={errors.site_id}
                                    searchValue={siteSearch}
                                    onSearchChange={setSiteSearch}
                                    className={
                                        showErrorBorder("site_id")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.site_id && (
                                    <span className="text-red-500 text-sm">
                                        {errors.site_id}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="position_id">
                                    Position{" "}
                                    {showRequiredAsterisk("position_id") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <ReactSelectInput
                                    name="position_id"
                                    options={positions}
                                    selected={
                                        data.position_id
                                            ? positions.find(
                                                  (pos) =>
                                                      pos.id.toString() ===
                                                      data.position_id.toString()
                                              )
                                            : null
                                    }
                                    onChange={(value) =>
                                        handleChange("position_id", value)
                                    }
                                    placeholder="Select Position"
                                    displayKey="name"
                                    valueKey="id"
                                    required={isFieldRequired("position_id")}
                                    error={errors.position_id}
                                    searchValue={positionSearch}
                                    onSearchChange={setPositionSearch}
                                    className={
                                        showErrorBorder("position_id")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.position_id && (
                                    <span className="text-red-500 text-sm">
                                        {errors.position_id}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="date_hired">Date Hired</Label>
                                <TextInput
                                    id="date_hired"
                                    name="date_hired"
                                    type="date"
                                    value={data.date_hired || ""}
                                    onChange={(e) =>
                                        handleChange("date_hired", e)
                                    }
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="end_of_contract">
                                    End of Contract
                                </Label>
                                <TextInput
                                    id="end_of_contract"
                                    name="end_of_contract"
                                    type="date"
                                    value={data.end_of_contract || ""}
                                    onChange={(e) =>
                                        handleChange("end_of_contract", e)
                                    }
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="employment_status">
                                    Employment Status{" "}
                                    {showRequiredAsterisk(
                                        "employment_status"
                                    ) && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <ReactSelectInput
                                    name="employment_status"
                                    options={employment_status}
                                    selected={
                                        data.employment_status
                                            ? employment_status.find(
                                                  (status) =>
                                                      status.id.toString() ===
                                                      data.employment_status.toString()
                                              )
                                            : null
                                    }
                                    onChange={(value) =>
                                        handleChange("employment_status", value)
                                    }
                                    placeholder="Select Employment Status"
                                    displayKey="name"
                                    valueKey="id"
                                    required={isFieldRequired(
                                        "employment_status"
                                    )}
                                    error={errors.employment_status}
                                    searchValue={employmentStatusSearch}
                                    onSearchChange={setEmploymentStatusSearch}
                                    className={
                                        showErrorBorder("employment_status")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.employment_status && (
                                    <span className="text-red-500 text-sm">
                                        {errors.employment_status}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="employment_type">
                                    Employment Type
                                </Label>
                                <ReactSelectInput
                                    name="employment_type"
                                    options={[
                                        ...employment_types,
                                        { id: "", name: "No Employment" },
                                    ]}
                                    selected={
                                        data.employment_type
                                            ? employment_types.find(
                                                  (type) =>
                                                      type.id.toString() ===
                                                      data.employment_type.toString()
                                              ) || {
                                                  id: "",
                                                  name: "No Employment",
                                              }
                                            : { id: "", name: "No Employment" }
                                    }
                                    onChange={(value) =>
                                        handleChange("employment_type", value)
                                    }
                                    placeholder="Select Employment Type"
                                    displayKey="name"
                                    valueKey="id"
                                    error={errors.employment_type}
                                    searchValue={employmentTypeSearch}
                                    onSearchChange={setEmploymentTypeSearch}
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="payroll_status">
                                    Payroll Status
                                </Label>
                                <ReactSelectInput
                                    name="payroll_status"
                                    options={payrollStatusOptions}
                                    selected={payrollStatusOptions.find(
                                        (option) =>
                                            option.id === data.payroll_status
                                    )}
                                    onChange={(value) =>
                                        handleChange("payroll_status", value)
                                    }
                                    placeholder="Select Payroll Status"
                                    displayKey="name"
                                    valueKey="id"
                                    error={errors.payroll_status}
                                    searchValue={payrollStatusSearch}
                                    onSearchChange={setPayrollStatusSearch}
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="basic_salary">
                                    Basic Salary
                                </Label>
                                <TextInput
                                    id="basic_salary"
                                    name="basic_salary"
                                    type="text"
                                    placeholder="Basic Salary"
                                    value={numberFormat(data.basic_salary)}
                                    onChange={(e) => {
                                        // Strip non-numeric characters before saving
                                        const raw = e.target.value.replace(
                                            /[^0-9.]/g,
                                            ""
                                        );
                                        handleChange("basic_salary", raw);
                                    }}
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="daily_rate">Daily Rate</Label>
                                <TextInput
                                    id="daily_rate"
                                    name="daily_rate"
                                    type="text"
                                    placeholder="Daily Rate"
                                    value={numberFormat(data.daily_rate) || ""}
                                    onChange={(e) => {
                                        // Strip non-numeric characters before saving
                                        const raw = e.target.value.replace(
                                            /[^0-9.]/g,
                                            ""
                                        );
                                        handleChange("daily_rate", raw);
                                    }}
                                    disabled={true}
                                    className={
                                        showErrorBorder("daily_rate")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.daily_rate && (
                                    <span className="text-red-500 text-sm">
                                        {errors.daily_rate}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="head_or_manager">
                                    Head or Manager{" "}
                                    {showRequiredAsterisk(
                                        "head_or_manager"
                                    ) && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <ReactSelectInput
                                    name="head_or_manager"
                                    options={[
                                        { employee_id: "", name: "No Manager" },
                                        ...heads_managers.map((manager) => ({
                                            employee_id: manager.employee_id,
                                            name: `${manager.first_name} ${manager.last_name} (${manager.employee_id})`,
                                        })),
                                    ]}
                                    selected={
                                        data.head_or_manager
                                            ? heads_managers.find(
                                                  (manager) =>
                                                      manager.employee_id ===
                                                      data.head_or_manager
                                              ) || {
                                                  employee_id: "",
                                                  name: "No Manager",
                                              }
                                            : {
                                                  employee_id: "",
                                                  name: "No Manager",
                                              }
                                    }
                                    onChange={(value) =>
                                        handleChange("head_or_manager", value)
                                    }
                                    placeholder="Select Head or Manager"
                                    displayKey="name"
                                    valueKey="employee_id"
                                    required={isFieldRequired(
                                        "head_or_manager"
                                    )}
                                    error={errors.head_or_manager}
                                    searchValue={managerSearch}
                                    onSearchChange={setManagerSearch}
                                    className={
                                        showErrorBorder("head_or_manager")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.head_or_manager && (
                                    <span className="text-red-500 text-sm">
                                        {errors.head_or_manager}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="status">Status</Label>
                                <ReactSelectInput
                                    name="status"
                                    options={statusOptions}
                                    selected={statusOptions.find(
                                        (option) => option.id === data.status
                                    )}
                                    onChange={(value) =>
                                        handleChange("status", value)
                                    }
                                    placeholder="Select Status"
                                    displayKey="name"
                                    valueKey="id"
                                    error={errors.status}
                                    searchValue={statusSearch}
                                    onSearchChange={setStatusSearch}
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="role_access">Role Access</Label>
                                <ReactSelectInput
                                    name="role_access"
                                    options={role_access}
                                    selected={
                                        data.role_access
                                            ? role_access.find(
                                                  (role) =>
                                                      role.id.toString() ===
                                                      data.role_access.toString()
                                              )
                                            : null
                                    }
                                    onChange={(value) =>
                                        handleChange("role_access", value)
                                    }
                                    placeholder="Select Role Access"
                                    displayKey="name"
                                    valueKey="id"
                                    error={errors.role_access}
                                    searchValue={roleAccessSearch}
                                    onSearchChange={setRoleAccessSearch}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab.toLocaleLowerCase() === "account" && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="username">
                                    Username{" "}
                                    {/* {showRequiredAsterisk("username") && (
                                        <span className="text-red-500">*</span>
                                    )} */}
                                </Label>
                                <TextInput
                                    id="username"
                                    name="username"
                                    placeholder="Username"
                                    value={data.username || ""}
                                    onChange={(e) =>
                                        handleChange("username", e)
                                    }
                                    autocomplete="off"
                                    className={
                                        showErrorBorder("username")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.username && (
                                    <span className="text-red-500 text-sm">
                                        {errors.username}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="email">
                                    Email{" "}
                                    {/* {showRequiredAsterisk("email") && (
                                        <span className="text-red-500">*</span>
                                    )} */}
                                </Label>
                                <TextInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Email Address"
                                    autocomplete="off"
                                    value={data.email || ""}
                                    onChange={(e) => handleChange("email", e)}
                                    className={
                                        showErrorBorder("email")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.email && (
                                    <span className="text-red-500 text-sm">
                                        {errors.email}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="password">
                                    Password{" "}
                                    {/* {showRequiredAsterisk("password") && (
                                        <span className="text-red-500">*</span>
                                    )} */}
                                </Label>
                                <TextInput
                                    id="password"
                                    name="password"
                                    autocomplete="new-password"
                                    type="password"
                                    placeholder="Password"
                                    value={data.password || ""}
                                    onChange={(e) =>
                                        handleChange("password", e)
                                    }
                                    className={
                                        showErrorBorder("password")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                />
                                {errors.password && (
                                    <span className="text-red-500 text-sm">
                                        {errors.password}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab.toLocaleLowerCase() === "leave" && (
                        <div className="grid grid-cols-3 gap-4">
                            {leaveTypes.map((leaveType) => (
                                <div
                                    key={leaveType.id}
                                    className="flex flex-col space-y-0.5"
                                >
                                    <Label
                                        htmlFor={`leave_credits_${leaveType.id}`}
                                    >
                                        {leaveType.name}
                                    </Label>
                                    <TextInput
                                        type="number"
                                        id={`leave_credits_${leaveType.id}`}
                                        value={
                                            data.leave_credits[leaveType.id] ||
                                            ""
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
                                <FontAwesomeIcon icon={faSpinner} spin />{" "}
                                Saving...
                            </span>
                        ) : (
                            "Update Employee"
                        )}
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default UpdateEmployeeModal;
