import { useState } from "react";
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDoubleUpIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "flowbite-react";
// import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const TermsCombobox = ({ termsOptions, data, setData }) => {
    const selectedTerm = termsOptions.find(
        (option) => option.value === data.terms
    );
    const [query, setQuery] = useState("");

    const filteredOptions =
        query === ""
            ? termsOptions
            : termsOptions.filter((option) =>
                  option.label.toLowerCase().includes(query.toLowerCase())
              );

    return (
        <Combobox
            as="div"
            value={selectedTerm}
            onChange={(selected) => setData("terms", selected.value)}
        >
            <div className="relative">
                <ComboboxInput
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                    displayValue={(option) => option?.label || ""}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Select Terms..."
                    required
                />
                <ComboboxButton className="absolute inset-y-0 right-0 p-2 flex items-center pr-2 border-l-2 border-gray-300">
                    <ChevronDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                    />
                </ComboboxButton>

                <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredOptions.length === 0 && query !== "" ? (
                        <div className="cursor-default select-none px-4 py-2 text-gray-700">
                            No results found.
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <ComboboxOption
                                key={option.value}
                                value={option}
                                className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                        active
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-900"
                                    }`
                                }
                            >
                                {({ selected, active }) => (
                                    <>
                                        <span
                                            className={`block truncate ${
                                                selected
                                                    ? "font-medium"
                                                    : "font-normal"
                                            }`}
                                        >
                                            {option.label}
                                        </span>
                                        {selected ? (
                                            <span
                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                    active
                                                        ? "text-white"
                                                        : "text-blue-600"
                                                }`}
                                            >
                                                <CheckIcon
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </ComboboxOption>
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
};

export default TermsCombobox;
