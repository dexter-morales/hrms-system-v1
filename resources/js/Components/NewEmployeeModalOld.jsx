import {
    Button,
    FooterDivider,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
    Select,
} from "flowbite-react";
import { useState, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextInput from "./TextInput";

const initialForm = {
    employee_id: "",
    username: "",
    password: "",
    email: "",
    department_id: "",
    site: "",
    position: "",
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
    employment_type: "Regular",
    allowance: "",
    head_or_manager: "",
    status: "Active",
    role_access: "Employee",
    leave_credits: 0,
};

const requiredFields = [
    "employee_id",
    "first_name",
    "last_name",
    "birthday",
    "department_id",
    "employment_status",
    "username",
    "email",
    "password",
];

const NewEmployeeModalOld = ({ show, onClose, onSuccess }) => {
    // const departments = usePage().props.departments;
    // const positions = usePage().props.positions;
    // const sites = usePage().props.site;
    const { departments, positions, sites, heads_managers } = usePage().props;

    const { data, setData, post, processing, errors, reset } =
        useForm(initialForm);
    const [activeTab, setActiveTab] = useState("personal");
    const [touchedFields, setTouchedFields] = useState({});

    useEffect(() => {
        if (!show) {
            reset();
            setTouchedFields({});
            setActiveTab("personal");
        }
    }, [show, reset]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
        setTouchedFields({ ...touchedFields, [name]: true });
    };

    const validateForm = () => {
        const newTouchedFields = {};
        let isValid = true;

        for (let field of requiredFields) {
            newTouchedFields[field] = true;
            if (!data[field]) {
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

        post(route("employees.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Employee successfully added!");
                reset();
                setTouchedFields({});
                onSuccess?.();
                onClose();
            },
            onError: (errors) => {
                toast.error("Failed to add employee. Please try again.");
                console.error(errors);
            },
        });
    };

    const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);

    const showRequiredAsterisk = (fieldName) =>
        isFieldRequired(fieldName) && !data[fieldName];

    const showErrorBorder = (fieldName) =>
        isFieldRequired(fieldName) &&
        touchedFields[fieldName] &&
        !data[fieldName];

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Modal
                show={show}
                onClose={onClose}
                size="4xl"
                style={{ height: "100vh" }}
            >
                <ModalHeader>Add New Employee</ModalHeader>
                <ModalBody>
                    {/* TABS */}
                    <div className="flex space-x-4 border-b mb-4">
                        {["personal", "work", "account"].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                className={`px-4 py-2 capitalize ${
                                    activeTab === tab
                                        ? "border-b-2 border-blue-600 font-semibold"
                                        : ""
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab} Info
                            </button>
                        ))}
                    </div>

                    {activeTab === "personal" && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="first_name">
                                    First Name{" "}
                                    {showRequiredAsterisk("first_name") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    name="first_name"
                                    placeholder="First Name"
                                    value={data.first_name}
                                    onChange={handleChange}
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
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={data.last_name}
                                    onChange={handleChange}
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
                                    name="middle_name"
                                    placeholder="Middle Name"
                                    value={data.middle_name}
                                    onChange={handleChange}
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
                                    name="birthday"
                                    type="date"
                                    value={data.birthday}
                                    onChange={handleChange}
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
                        </div>
                    )}

                    {activeTab === "work" && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="employee_id">
                                    Employee ID{" "}
                                    {showRequiredAsterisk("employee_id") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    name="employee_id"
                                    placeholder="Employee ID"
                                    value={data.employee_id}
                                    onChange={handleChange}
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
                                <Select
                                    name="department_id"
                                    value={data.department_id}
                                    onChange={handleChange}
                                    className={
                                        showErrorBorder("department_id")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </Select>
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
                                <Select
                                    name="site_id"
                                    value={data.site_id}
                                    onChange={handleChange}
                                    className={
                                        showErrorBorder("site_id")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                >
                                    <option value="">
                                        Select Site/Location
                                    </option>
                                    {sites.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name}
                                        </option>
                                    ))}
                                </Select>
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
                                <Select
                                    name="position_id"
                                    value={data.position_id}
                                    onChange={handleChange}
                                    className={
                                        showErrorBorder("position_id")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                >
                                    <option value="">Select Position</option>
                                    {positions.map((pos) => (
                                        <option key={pos.id} value={pos.id}>
                                            {pos.name}
                                        </option>
                                    ))}
                                </Select>
                                {errors.position_id && (
                                    <span className="text-red-500 text-sm">
                                        {errors.position_id}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="date_hired">Date Hired</Label>
                                <TextInput
                                    name="date_hired"
                                    type="date"
                                    value={data.date_hired}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="end_of_contract">
                                    End of Contract
                                </Label>
                                <TextInput
                                    name="end_of_contract"
                                    type="date"
                                    value={data.end_of_contract}
                                    onChange={handleChange}
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
                                <Select
                                    name="employment_status"
                                    value={data.employment_status}
                                    onChange={handleChange}
                                    className={
                                        showErrorBorder("employment_status")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                >
                                    <option value="">Select</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Probationary">
                                        Probationary
                                    </option>
                                    <option value="Project Based">
                                        Project Based
                                    </option>
                                    <option value="Consultant">
                                        Consultant
                                    </option>
                                </Select>
                                {errors.employment_status && (
                                    <span className="text-red-500 text-sm">
                                        {errors.employment_status}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="basic_salary">
                                    Basic Salary
                                </Label>
                                <TextInput
                                    name="basic_salary"
                                    type="number"
                                    placeholder="Basic Salary"
                                    value={data.basic_salary}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="daily_rate">Daily Rate</Label>
                                <TextInput
                                    name="daily_rate"
                                    type="number"
                                    placeholder="Daily Rate"
                                    value={data.daily_rate}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="payroll_status">
                                    Payroll Status
                                </Label>
                                <Select
                                    name="payroll_status"
                                    value={data.payroll_status}
                                    onChange={handleChange}
                                >
                                    <option value="Weekly">Weekly</option>
                                    <option value="Semi-monthly">
                                        Semi-monthly
                                    </option>
                                </Select>
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="employment_type">
                                    Employment Type
                                </Label>
                                <Select
                                    name="employment_type"
                                    value={data.employment_type}
                                    onChange={handleChange}
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Probationary">
                                        Probationary
                                    </option>
                                    <option value="Project Based">
                                        Project Based
                                    </option>
                                    <option value="Consultant">
                                        Consultant
                                    </option>
                                </Select>
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="allowance">Allowance</Label>
                                <TextInput
                                    name="allowance"
                                    type="number"
                                    placeholder="Allowance"
                                    value={data.allowance}
                                    onChange={handleChange}
                                />
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
                                <Select
                                    name="head_or_manager"
                                    value={data.head_or_manager || ""}
                                    onChange={handleChange}
                                    className={
                                        showErrorBorder("head_or_manager")
                                            ? "!border-red-500"
                                            : ""
                                    }
                                >
                                    <option value="">No Manager</option>
                                    {heads_managers.map((manager) => (
                                        <option
                                            key={manager.employee_id}
                                            value={manager.employee_id}
                                        >
                                            {manager.first_name}{" "}
                                            {manager.last_name} (
                                            {manager.employee_id})
                                        </option>
                                    ))}
                                </Select>
                                {errors.head_or_manager && (
                                    <span className="text-red-500 text-sm">
                                        {errors.head_or_manager}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    name="status"
                                    value={data.status}
                                    onChange={handleChange}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </Select>
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="role_access">Role Access</Label>
                                <Select
                                    name="role_access"
                                    value={data.role_access}
                                    onChange={handleChange}
                                >
                                    <option value="SuperAdmin">
                                        SuperAdmin
                                    </option>
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="HR">HR</option>
                                    <option value="Accounting">
                                        Accounting
                                    </option>
                                    <option value="Employee">Employee</option>
                                </Select>
                            </div>
                            {/* <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="leave_credits">
                                    Leave Credits
                                </Label>
                                <TextInput
                                    name="leave_credits"
                                    type="number"
                                    placeholder="Leave Credits"
                                    value={data.leave_credits}
                                    onChange={handleChange}
                                />
                            </div> */}
                        </div>
                    )}

                    {activeTab === "account" && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="username">
                                    Username{" "}
                                    {showRequiredAsterisk("username") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    name="username"
                                    placeholder="Username"
                                    value={data.username}
                                    onChange={handleChange}
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
                                    {showRequiredAsterisk("email") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    name="email"
                                    type="email"
                                    placeholder="Email Address"
                                    value={data.email}
                                    onChange={handleChange}
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
                                    {showRequiredAsterisk("password") && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </Label>
                                <TextInput
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={handleChange}
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
                </ModalBody>
                <FooterDivider />
                <div className="flex justify-end pb-6 px-6">
                    <Button
                        onClick={handleSubmit}
                        isProcessing={processing}
                        className="ml-4 bg-indigo-500 hover:bg-indigo-600"
                    >
                        {processing ? "Saving..." : "Add Employee"}
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default NewEmployeeModalOld;
