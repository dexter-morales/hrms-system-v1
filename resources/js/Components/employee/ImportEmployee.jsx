import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ImportEmployee = ({
    generate_employee_id,
    isOpen,
    onClose,
    errors: initialErrors = [],
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
    });

    const [importMessage, setImportMessage] = useState("");
    const [importErrors, setImportErrors] = useState(initialErrors);

    const handleFileChange = (e) => {
        setData("file", e.target.files[0]);
    };

    useEffect(() => {
        if (importErrors.length > 0) {
            toast.error(
                <div>
                    <h3 className="font-bold">Import Errors:</h3>
                    <ul className="list-disc pl-5 mt-1 text-sm">
                        {importErrors.map((error, index) => (
                            <li key={index}>
                                Row {error.row}: {error.errors.join(", ")}
                            </li>
                        ))}
                    </ul>
                </div>,
                {
                    autoClose: false, // Keep it open until user dismisses
                    closeOnClick: true,
                }
            );
        }
    }, [importErrors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("employees.import"), {
            onSuccess: (response) => {
                toast.success(
                    response.props.flash.success ||
                        "Employees imported successfully!"
                );
                setImportMessage(
                    response.props.flash.success ||
                        "Import completed successfully."
                );
                setImportErrors(response.props.flash.import_errors || []);
                reset();
                onClose(); // Close modal on success
            },
            onError: (response) => {
                toast.error(
                    response.props.flash.error || "Error importing employees."
                );
                setImportMessage(
                    response.props.flash.error ||
                        "Error during import. Check file format."
                );
                setImportErrors(response.props.flash.import_errors || []);
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white max-w-lg w-full p-6 rounded-lg shadow-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
                >
                    ×
                </button>

                <h2 className="text-2xl font-bold mb-4">
                    Import Employees from Excel
                </h2>
                <p className="text-gray-600 mb-4">
                    Download the sample Excel file, fill it with employee data,
                    and upload it here. The next employee ID is{" "}
                    <strong>{generate_employee_id}</strong>.
                </p>

                {importMessage && (
                    <div
                        className={`mb-4 p-2 text-sm rounded ${
                            importMessage.includes("Error") ||
                            importMessage.includes("errors")
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                        }`}
                    >
                        {importMessage}
                    </div>
                )}

                {importErrors.length > 0 && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                        <h3 className="font-bold">Import Errors:</h3>
                        <ul className="list-disc pl-5">
                            {importErrors.map((error, index) => (
                                <li key={index}>
                                    Row {error.row}: {error.errors.join(", ")}{" "}
                                    {/* (Data: {JSON.stringify(error.data)}) */}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Upload Excel File
                        </label>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            disabled={processing}
                        />
                        {errors.file && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.file}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                        disabled={processing || !data.file}
                    >
                        {processing ? "Importing..." : "Import Employees"}
                    </button>
                </form>

                <a
                    href={route("employees.download-sample")}
                    download="sample-employee-import.xlsx"
                    className="mt-4 inline-block text-blue-600 hover:underline"
                >
                    Download Sample Excel File
                </a>
            </div>
        </div>
    );
};

export default ImportEmployee;
