// import {
//     Button,
//     Modal,
//     ModalBody,
//     ModalHeader,
//     Label,
//     TextInput,
//     Select,
//     Textarea,
// } from "flowbite-react";
// import { useForm } from "@inertiajs/react";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { useEffect } from "react";

// const NewHolidayModal = ({ show, onClose, onSuccess }) => {
//     const { data, setData, post, processing, errors, reset } = useForm({
//         name_holiday: "",
//         date_holiday: "",
//         description: "",
//         holiday_type: "",
//     });

//     const requiredFields = [
//         "name_holiday",
//         "date_holiday",
//         "description",
//         "holiday_type",
//     ];

//     // Reset form when modal closes
//     useEffect(() => {
//         if (!show) {
//             reset();
//         }
//     }, [show, reset]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setData(name, value);
//     };

//     const validateForm = () => {
//         let isValid = true;
//         for (let field of requiredFields) {
//             if (!data[field]) {
//                 toast.warning(
//                     `Please fill in the ${field.replace("_", " ")} field.`
//                 );
//                 isValid = false;
//             }
//         }
//         return isValid;
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (!validateForm()) return;

//         post(route("holidays.store"), {
//             preserveScroll: true,
//             onSuccess: () => {
//                 toast.success("Holiday added successfully!");
//                 reset();
//                 onSuccess?.();
//                 onClose();
//             },
//             onError: (errors) => {
//                 toast.error("Failed to add holiday. Please check the form.");
//                 console.error("Submission errors:", errors);
//             },
//         });
//     };

//     return (
//         <>
//             <ToastContainer position="top-right" autoClose={3000} />
//             <Modal show={show} onClose={onClose} size="md">
//                 <ModalHeader>Add New Holiday</ModalHeader>
//                 <ModalBody>
//                     <form onSubmit={handleSubmit} className="space-y-4">
//                         <div className="flex flex-col space-y-0.5">
//                             <Label htmlFor="name_holiday">
//                                 Holiday Name{" "}
//                                 <span className="text-red-500">*</span>
//                             </Label>
//                             <TextInput
//                                 id="name_holiday"
//                                 name="name_holiday"
//                                 placeholder="e.g., Christmas Day"
//                                 value={data.name_holiday}
//                                 onChange={handleChange}
//                                 color={errors.name_holiday ? "failure" : "gray"}
//                             />
//                             {errors.name_holiday && (
//                                 <span className="text-red-500 text-sm">
//                                     {errors.name_holiday}
//                                 </span>
//                             )}
//                         </div>
//                         <div className="flex flex-col space-y-0.5">
//                             <Label htmlFor="date_holiday">
//                                 Date <span className="text-red-500">*</span>
//                             </Label>
//                             <TextInput
//                                 id="date_holiday"
//                                 name="date_holiday"
//                                 type="date"
//                                 value={data.date_holiday}
//                                 onChange={handleChange}
//                                 color={errors.date_holiday ? "failure" : "gray"}
//                             />
//                             {errors.date_holiday && (
//                                 <span className="text-red-500 text-sm">
//                                     {errors.date_holiday}
//                                 </span>
//                             )}
//                         </div>
//                         <div className="flex flex-col space-y-0.5">
//                             <Label htmlFor="description">
//                                 Description{" "}
//                                 <span className="text-red-500">*</span>
//                             </Label>
//                             <Textarea
//                                 id="description"
//                                 name="description"
//                                 placeholder="e.g., National holiday celebrating Christmas"
//                                 value={data.description}
//                                 onChange={handleChange}
//                                 color={errors.description ? "failure" : "gray"}
//                                 rows={4}
//                             />
//                             {errors.description && (
//                                 <span className="text-red-500 text-sm">
//                                     {errors.description}
//                                 </span>
//                             )}
//                         </div>
//                         <div className="flex flex-col space-y-0.5">
//                             <Label htmlFor="holiday_type">
//                                 Holiday Type{" "}
//                                 <span className="text-red-500">*</span>
//                             </Label>
//                             <Select
//                                 id="holiday_type"
//                                 name="holiday_type"
//                                 value={data.holiday_type}
//                                 onChange={handleChange}
//                                 color={errors.holiday_type ? "failure" : "gray"}
//                             >
//                                 <option value="">Select Type</option>
//                                 <option value="Regular Holiday">
//                                     Regular Holiday
//                                 </option>
//                                 <option value="Special Non-Working Day">
//                                     Special Non-Working Day
//                                 </option>
//                             </Select>
//                             {errors.holiday_type && (
//                                 <span className="text-red-500 text-sm">
//                                     {errors.holiday_type}
//                                 </span>
//                             )}
//                         </div>
//                         <div className="flex justify-end mt-6">
//                             <Button
//                                 type="submit"
//                                 isProcessing={processing}
//                                 className="bg-indigo-500 hover:bg-indigo-600"
//                             >
//                                 {processing ? "Saving..." : "Add Holiday"}
//                             </Button>
//                         </div>
//                     </form>
//                 </ModalBody>
//             </Modal>
//         </>
//     );
// };

// export default NewHolidayModal;

import {
    Button,
    Modal,
    ModalBody,
    ModalHeader,
    Label,
    TextInput,
    Select,
    Textarea,
} from "flowbite-react";
import { useForm, router } from "@inertiajs/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";

const NewHolidayModal = ({ show, onClose, onSuccess, editHoliday = null }) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name_holiday: editHoliday?.name_holiday || "",
        date_holiday: editHoliday?.date_holiday || "",
        description: editHoliday?.description || "",
        holiday_type: editHoliday?.holiday_type || "",
    });

    const requiredFields = [
        "name_holiday",
        "date_holiday",
        "description",
        "holiday_type",
    ];

    // Reset or prefill form based on editHoliday
    useEffect(() => {
        if (show) {
            if (editHoliday) {
                setData({
                    name_holiday: editHoliday.name_holiday,
                    date_holiday: editHoliday.date_holiday,
                    description: editHoliday.description,
                    holiday_type: editHoliday.holiday_type,
                });
            } else {
                reset();
            }
        }
    }, [show, editHoliday, setData, reset]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const validateForm = () => {
        let isValid = true;
        for (let field of requiredFields) {
            if (!data[field]) {
                toast.warning(
                    `Please fill in the ${field.replace("_", " ")} field.`
                );
                isValid = false;
            }
        }
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        console.log("Submitting form data:", data);

        if (editHoliday) {
            put(route("holidays.update", editHoliday.id), {
                data,
                preserveScroll: true,
                onSuccess: () => {
                    console.log("Update successful");
                    toast.success("Holiday updated successfully!");
                    router.reload({ only: ["holidays"] });
                    reset();
                    onSuccess?.();
                    onClose();
                },
                onError: (errors) => {
                    console.error("Update errors:", errors);
                    toast.error("Failed to update holiday.");
                },
            });
        } else {
            post(route("holidays.store"), {
                data,
                preserveScroll: true,
                onSuccess: () => {
                    console.log("Create successful");
                    toast.success("Holiday added successfully!");
                    router.reload({ only: ["holidays"] });
                    reset();
                    onSuccess?.();
                    onClose();
                },
                onError: (errors) => {
                    console.error("Create errors:", errors);
                    toast.error("Failed to add holiday.");
                },
            });
        }
    };

    return (
        <>
            {/* <ToastContainer position="top-right" autoClose={3000} /> */}
            <Modal show={show} onClose={onClose} size="md">
                <ModalHeader>
                    {editHoliday ? "Edit Holiday" : "Add New Holiday"}
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="name_holiday">
                                Holiday Name{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <TextInput
                                id="name_holiday"
                                name="name_holiday"
                                placeholder="e.g., Christmas Day"
                                value={data.name_holiday}
                                onChange={handleChange}
                                color={errors.name_holiday ? "failure" : "gray"}
                            />
                            {errors.name_holiday && (
                                <span className="text-red-500 text-sm">
                                    {errors.name_holiday}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="date_holiday">
                                Date <span className="text-red-500">*</span>
                            </Label>
                            <TextInput
                                id="date_holiday"
                                name="date_holiday"
                                type="date"
                                value={data.date_holiday}
                                onChange={handleChange}
                                color={errors.date_holiday ? "failure" : "gray"}
                            />
                            {errors.date_holiday && (
                                <span className="text-red-500 text-sm">
                                    {errors.date_holiday}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="description">
                                Description{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="e.g., National holiday celebrating Christmas"
                                value={data.description}
                                onChange={handleChange}
                                color={errors.description ? "failure" : "gray"}
                                rows={4}
                            />
                            {errors.description && (
                                <span className="text-red-500 text-sm">
                                    {errors.description}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="holiday_type">
                                Holiday Type{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                id="holiday_type"
                                name="holiday_type"
                                value={data.holiday_type}
                                onChange={handleChange}
                                color={errors.holiday_type ? "failure" : "gray"}
                            >
                                <option value="">Select Type</option>
                                <option value="Regular Holiday">
                                    Regular Holiday
                                </option>
                                <option value="Special Working">
                                    Special Working
                                </option>
                                <option value="Special Non-Working">
                                    Special Non-Working
                                </option>
                            </Select>
                            {errors.holiday_type && (
                                <span className="text-red-500 text-sm">
                                    {errors.holiday_type}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button
                                type="submit"
                                isProcessing={processing}
                                disabled={processing}
                                className="bg-indigo-500 hover:bg-indigo-600"
                            >
                                {processing
                                    ? "Saving..."
                                    : editHoliday
                                    ? "Update Holiday"
                                    : "Add Holiday"}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        </>
    );
};

export default NewHolidayModal;
