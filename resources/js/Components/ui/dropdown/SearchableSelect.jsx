import { useState, useEffect } from "react";
import { Combobox } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";

export default function SearchableSelect({
    label,
    name,
    options = [],
    selected,
    onChange,
    placeholder = "Select an option...",
    displayKey = "name",
    valueKey = "id",
    required = false,
    error = "",
    searchValue = "",
    onSearchChange = () => {},
}) {
    const [query, setQuery] = useState(searchValue || "");

    useEffect(() => {
        setQuery(searchValue || "");
    }, [searchValue]);

    const filteredOptions =
        query === ""
            ? options
            : options.filter((item) =>
                  item[displayKey].toLowerCase().includes(query.toLowerCase())
              );

    return (
        <div className="flex flex-col gap-1">
            {/* {label && (
                <label
                    htmlFor={name}
                    className="text-sm font-medium text-gray-700"
                >
                    {label}{" "}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )} */}

            <Combobox value={selected} onChange={onChange} name={name}>
                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white border shadow-sm border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
                        <Combobox.Input
                            className="w-full !border-none py-2 pl-3 pr-10 text-sm text-gray-900 focus:outline-none"
                            displayValue={(item) => item?.[displayKey] || ""}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                onSearchChange(e.target.value);
                            }}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <SelectorIcon className="h-5 w-5 text-gray-400" />
                        </Combobox.Button>
                    </div>

                    {filteredOptions.length > 0 ? (
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto border border-gray-300 rounded-md bg-white py-1 text-sm shadow-lg focus:outline-none">
                            {filteredOptions.map((item) => (
                                <Combobox.Option
                                    key={item[valueKey]}
                                    value={item}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
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
                                                {item[displayKey]}
                                            </span>
                                            {selected && (
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
                                            )}
                                        </>
                                    )}
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    ) : (
                        <div className="absolute z-10 mt-1 w-full rounded-md bg-white border border-gray-300 py-2 px-3 text-sm text-gray-500 shadow-sm">
                            No results found.
                        </div>
                    )}
                </div>
            </Combobox>

            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
}
