import { useState, useEffect, useCallback } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    Button,
    Label,
    Select,
    TextInput,
} from "flowbite-react";
import { useForm, router } from "@inertiajs/react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";

const LeaveRequestModal = ({ show, onClose, leaveCredits }) => {
    const [previewImage, setPreviewImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const { data, setData, errors, reset } = useForm({
        start_date: "",
        end_date: "",
        leave_type: "",
        reason: "",
        status: "Pending",
        image: null,
    });

    useEffect(() => {
        if (!show) {
            reset();
            setPreviewImage(null);
        }
    }, [show, reset]);

    const onDrop = useCallback(
        (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                setData("image", file);
                const reader = new FileReader();
                reader.onload = (e) => setPreviewImage(e.target.result);
                reader.readAsDataURL(file);
            }
        },
        [setData]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [],
            "image/png": [],
        },
        maxFiles: 1,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const missingFields = [];
        if (!data.start_date) missingFields.push("Start Date");
        if (!data.end_date) missingFields.push("End Date");
        if (!data.leave_type) missingFields.push("Leave Type");
        if (!data.reason) missingFields.push("Reason");
        if (!data.image) missingFields.push("Attachment");

        if (missingFields.length > 0) {
            toast.error(
                `Please fill in the following: ${missingFields.join(", ")}`
            );
            return;
        }

        const formData = new FormData();
        formData.append("start_date", data.start_date);
        formData.append("end_date", data.end_date);
        formData.append("leave_type", data.leave_type);
        formData.append("reason", data.reason);
        formData.append("status", data.status);
        formData.append("image", data.image);

        setIsProcessing(true);
        router.post(route("leave.store"), formData, {
            onSuccess: () => {
                toast.success("Leave request submitted successfully!");
                setIsProcessing(false);
                reset();
                onClose();
                setPreviewImage(null);
            },
            onError: (errors) => {
                console.log(errors);
                setIsProcessing(false);
            },
            forceFormData: true,
        });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <ModalHeader>Request Leave</ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="start_date">
                            Start Date <span className="text-red-500">*</span>
                        </Label>
                        <TextInput
                            id="start_date"
                            type="date"
                            value={data.start_date}
                            onChange={(e) =>
                                setData("start_date", e.target.value)
                            }
                            required
                        />
                        {errors.start_date && (
                            <p className="text-red-500 text-sm">
                                {errors.start_date}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="end_date">
                            End Date <span className="text-red-500">*</span>
                        </Label>
                        <TextInput
                            id="end_date"
                            type="date"
                            value={data.end_date}
                            onChange={(e) =>
                                setData("end_date", e.target.value)
                            }
                            required
                        />
                        {errors.end_date && (
                            <p className="text-red-500 text-sm">
                                {errors.end_date}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="leave_type">
                            Leave Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            id="leave_type"
                            value={data.leave_type}
                            onChange={(e) =>
                                setData("leave_type", e.target.value)
                            }
                            required
                        >
                            <option value="">Select...</option>
                            {leaveCredits.map((leave_credit, index) => (
                                <option
                                    key={index}
                                    value={leave_credit.leave_type.name}
                                >
                                    {leave_credit.leave_type.name} Leave{" "}
                                    <span>({leave_credit.credits})</span>
                                </option>
                            ))}
                        </Select>
                        {errors.leave_type && (
                            <p className="text-red-500 text-sm">
                                {errors.leave_type}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="reason">
                            Reason <span className="text-red-500">*</span>
                        </Label>
                        <TextInput
                            id="reason"
                            type="text"
                            value={data.reason}
                            onChange={(e) => setData("reason", e.target.value)}
                            required
                        />
                        {errors.reason && (
                            <p className="text-red-500 text-sm">
                                {errors.reason}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label>
                            Supporting Image{" "}
                            <span className="text-red-500">*</span>
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
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-w-xs mt-2 mx-auto"
                                />
                            ) : isDragActive ? (
                                <p>Drop the image here...</p>
                            ) : (
                                <p>
                                    Drag and drop an image here, or click to
                                    select
                                </p>
                            )}
                        </div>
                        {errors.image && (
                            <p className="text-red-500 text-sm">
                                {errors.image}
                            </p>
                        )}
                    </div>
                    <Button type="submit" disabled={isProcessing} color="blue">
                        {isProcessing && (
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                className="mr-2"
                            />
                        )}
                        Submit Request
                    </Button>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default LeaveRequestModal;
