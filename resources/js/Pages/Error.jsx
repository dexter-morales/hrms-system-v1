import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

const Error = ({ status, message }) => {
    return (
        <DashboardLayout>
            <Head title={`Error ${status}`} />
            <div className="p-4">
                <h1 className="text-3xl font-bold text-red-600">
                    Error {status}
                </h1>
                <p className="mt-4 text-lg text-gray-700">{message}</p>
                <a
                    href="/dashboard"
                    className="mt-4 inline-block text-indigo-600 hover:underline"
                >
                    Back to Dashboard
                </a>
            </div>
        </DashboardLayout>
    );
};

export default Error;
