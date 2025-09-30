import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { Link, useForm, usePage } from "@inertiajs/react";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import { router } from "@inertiajs/react";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const user = usePage().props.auth.user;

    const [avatarPreview, setAvatarPreview] = useState(
        user.employee.avatar ? `/storage/${user.employee.avatar}` : null
    );

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            first_name: user.employee.first_name,
            last_name: user.employee.last_name,
            email: user.email,
            avatar: null,
        });

    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setData("avatar", file); // Store the file object
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result); // Set preview as base64
            };
            reader.readAsDataURL(file);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
        },
        maxFiles: 1,
        maxSize: 2 * 1024 * 1024, // 2MB limit
    });

    const submit = (e) => {
        e.preventDefault();
        console.log("Form Data before submission:", data); // Debug: Log data

        // Use router.post for better file handling
        const formData = new FormData();
        formData.append("first_name", data.first_name);
        formData.append("last_name", data.last_name);
        formData.append("email", data.email);
        if (data.avatar) {
            formData.append("avatar", data.avatar);
        }
        formData.append("_method", "PATCH"); // Simulate PATCH request

        router.post(route("profile.update"), formData, {
            forceFormData: true,
            onBefore: () => console.log("Before send:", data), // Debug before send
            onError: (errors) => console.error("Errors:", errors),
            onSuccess: () => {
                console.log("Success:", user.employee.avatar); // Debug success
                setAvatarPreview(`/storage/${user.employee.avatar}`);
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="avatar" value="Avatar" />
                    <div
                        {...getRootProps()}
                        className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                            isDragActive
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-300 hover:border-indigo-500"
                        }`}
                    >
                        <input {...getInputProps()} />
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar Preview"
                                className="w-32 h-32 mx-auto rounded-full object-cover mb-2"
                            />
                        ) : (
                            <p className="text-gray-600">
                                Drag 'n' drop an image here, or click to select
                                one (JPG, PNG, max 2MB)
                            </p>
                        )}
                    </div>
                    <InputError className="mt-2" message={errors.avatar} />
                </div>

                <div>
                    <InputLabel htmlFor="first_name" value="First Name" />
                    <TextInput
                        id="first_name"
                        className="mt-1 block w-full"
                        value={data.first_name}
                        onChange={(e) => setData("first_name", e.target.value)}
                        required
                        isFocused
                        autoComplete="first_name"
                    />
                    <InputError className="mt-2" message={errors.first_name} />
                </div>

                <div>
                    <InputLabel htmlFor="last_name" value="Last Name" />
                    <TextInput
                        id="last_name"
                        className="mt-1 block w-full"
                        value={data.last_name}
                        onChange={(e) => setData("last_name", e.target.value)}
                        required
                        autoComplete="last_name"
                    />
                    <InputError className="mt-2" message={errors.last_name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route("verification.send")}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>
                        {status === "verification-link-sent" && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
