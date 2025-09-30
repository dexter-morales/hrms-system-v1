import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import {
    faSpinner,
    faEye,
    faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { toast } from "react-toastify";
import { useState } from "react";
import { ToastContainer } from "react-toastify";

export default function Login({ status, canResetPassword }) {
    const { company_settings } = usePage().props;
    console.log("company_settings: ", company_settings);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [touchedFields, setTouchedFields] = useState({});
    const [showPassword, setShowPassword] = useState(false); // 👈 password visibility toggle

    const requiredFields = ["email", "password"];

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

    // if (errors.login) {
    //     console.log("Errors:", errors.login);
    //     toast.error(errors.login);
    // }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        post(route("login"), {
            onSuccess: () => {
                toast.success("Successfully logged in!");
                reset();
                setTouchedFields({});
            },
            onError: () => {
                toast.error("Login failed. Please check your credentials.");
            },
        });
    };

    return (
        <>
            <Head title="Log in" />
            <ToastContainer position="top-right" autoClose={3000} />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="mb-6 text-center">
                        {company_settings?.company_logo ? (
                            <img
                                src={`/storage/${company_settings?.company_logo}`}
                                alt="Logo"
                                className="w-20 h-20 mx-auto mb-4"
                            />
                        ) : (
                            //  <img
                            //     src={`/storage/${setting.company_logo}`}
                            //     alt="Current Logo"
                            //     className="mt-0 h-16 rounded-full border-2 border-gray-300"
                            // />
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Login
                            </h1>
                        )}

                        <p className="text-gray-500 dark:text-gray-300">
                            Sign in to your account
                        </p>
                    </div>

                    {(errors.email || errors.password) && (
                        <div className="mb-4 text-sm text-red-600 bg-red-100 px-4 py-2 rounded dark:bg-red-900 dark:text-red-300">
                            {errors.email || errors.password}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Email
                            </label>
                            <TextInput
                                type="text"
                                name="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                required
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2.5 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Password
                            </label>
                            <div className="relative">
                                <TextInput
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    required
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2.5 pr-10 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    tabIndex={-1}
                                >
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEyeSlash : faEye}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <TextInput
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2">Remember me</span>
                            </label>
                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {processing ? (
                                <span className="flex justify-center items-center gap-2">
                                    <FontAwesomeIcon icon={faSpinner} spin />{" "}
                                    Signing In...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
