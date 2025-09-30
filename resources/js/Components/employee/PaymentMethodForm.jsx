import { useState } from "react";
import { Button, Label } from "flowbite-react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextInput from "../TextInput";
import { toast } from "react-toastify";

const PaymentMethodForm = ({ paymentMethods, setPaymentMethods, errors }) => {
    console.log("PaymentMethods: ", paymentMethods);
    const [newMethod, setNewMethod] = useState({
        type: "bank",
        bank_name: "",
        bank_account_number: "",
        account_name: "",
        ewallet_name: "",
        ewallet_number: "",
    });

    const paymentTypeOptions = [
        { id: "bank", name: "Bank" },
        { id: "ewallet", name: "E-wallet" },
    ];

    // Handle changes to new payment method fields
    const handleNewMethodChange = (field, value) => {
        setNewMethod((prev) => ({
            ...prev,
            [field]: value || "",
        }));
    };

    // Add new payment method
    const addPaymentMethod = () => {
        if (
            newMethod.type === "bank" &&
            (!newMethod.bank_name ||
                !newMethod.bank_account_number ||
                !newMethod.account_name)
        ) {
            toast.warning("Please fill in all bank details.");
            return;
        }
        if (
            newMethod.type === "ewallet" &&
            (!newMethod.ewallet_name || !newMethod.ewallet_number)
        ) {
            toast.warning("Please fill in all e-wallet details.");
            return;
        }

        const newPaymentMethod = {
            id: null,
            type: newMethod.type,
            bank_name: newMethod.type === "bank" ? newMethod.bank_name : "",
            bank_account_number:
                newMethod.type === "bank" ? newMethod.bank_account_number : "",
            account_name:
                newMethod.type === "bank" ? newMethod.account_name : "",
            ewallet_name:
                newMethod.type === "ewallet" ? newMethod.ewallet_name : "",
            ewallet_number:
                newMethod.type === "ewallet" ? newMethod.ewallet_number : "",
        };

        setPaymentMethods((prevData) => ({
            ...prevData,
            payment_methods: [
                ...prevData.payment_methods,
                { ...newPaymentMethod },
            ],
        }));

        setNewMethod({
            type: "bank",
            bank_name: "",
            bank_account_number: "",
            account_name: "",
            ewallet_name: "",
            ewallet_number: "",
        });

        toast.success("Payment method added to the list.");
    };

    // Handle changes to existing payment methods
    const handleMethodChange = (index, field, value) => {
        setPaymentMethods((prevData) => {
            const updatedMethods = [...prevData.payment_methods];
            updatedMethods[index] = {
                ...updatedMethods[index],
                [field]: value,
            };
            return { ...prevData, payment_methods: updatedMethods };
        });
    };

    // Delete a payment method
    const deletePaymentMethod = (index) => {
        setPaymentMethods((prev) => prev.filter((_, i) => i !== index));
        toast.info("Payment method removed from the list.");
    };

    return (
        <div className="space-y-4">
            <div className="border p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">
                    Add Payment Method
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col space-y-0.5">
                        <Label htmlFor="new_payment_type">Type</Label>
                        <select
                            id="new_payment_type"
                            name="new_payment_type"
                            value={newMethod.type}
                            onChange={(e) =>
                                handleNewMethodChange("type", e.target.value)
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
                    {newMethod.type === "bank" ? (
                        <>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="new_bank_name">Bank Name</Label>
                                <TextInput
                                    id="new_bank_name"
                                    value={newMethod.bank_name}
                                    onChange={(e) =>
                                        handleNewMethodChange(
                                            "bank_name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Bank Name"
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="new_bank_account_number">
                                    Bank Account Number
                                </Label>
                                <TextInput
                                    id="new_bank_account_number"
                                    value={newMethod.bank_account_number}
                                    onChange={(e) =>
                                        handleNewMethodChange(
                                            "bank_account_number",
                                            e.target.value
                                        )
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
                                    value={newMethod.account_name}
                                    onChange={(e) =>
                                        handleNewMethodChange(
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
                                <Label htmlFor="new_ewallet_name">
                                    E-wallet Name
                                </Label>
                                <TextInput
                                    id="new_ewallet_name"
                                    value={newMethod.ewallet_name}
                                    onChange={(e) =>
                                        handleNewMethodChange(
                                            "ewallet_name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="E-wallet Name"
                                />
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="new_ewallet_number">
                                    E-wallet Number
                                </Label>
                                <TextInput
                                    id="new_ewallet_number"
                                    value={newMethod.ewallet_number}
                                    onChange={(e) =>
                                        handleNewMethodChange(
                                            "ewallet_number",
                                            e.target.value
                                        )
                                    }
                                    placeholder="E-wallet Number"
                                />
                            </div>
                        </>
                    )}
                    <div className="flex items-end">
                        <Button
                            type="button"
                            onClick={addPaymentMethod}
                            className="bg-green-500 hover:bg-green-600"
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                    Existing Payment Methods
                </h3>
                {paymentMethods.length === 0 && (
                    <p>No payment methods added.</p>
                )}
                {paymentMethods.map((method, index) => (
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
                                        handleMethodChange(
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
                                                handleMethodChange(
                                                    index,
                                                    "bank_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Bank Name"
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
                                                handleMethodChange(
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
                                                handleMethodChange(
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
                                                handleMethodChange(
                                                    index,
                                                    "ewallet_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="E-wallet Name"
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
                                                handleMethodChange(
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
};

export default PaymentMethodForm;
