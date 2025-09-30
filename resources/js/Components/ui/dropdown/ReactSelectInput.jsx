import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const customStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: "white",
        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
        "&:hover": {
            borderColor: "#3b82f6",
        },
        minHeight: "38px",
        borderRadius: "0.375rem",
    }),
    menu: (base) => ({
        ...base,
        borderRadius: "0.375rem",
        position: "absolute", // Explicitly set to absolute
        zIndex: 1000, // High z-index to ensure it overlays modal
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 1000, // Match menu z-index
    }),
    option: (base, { isFocused, isSelected }) => ({
        ...base,
        backgroundColor: isSelected
            ? "#3b82f6"
            : isFocused
            ? "#e0f2fe"
            : "white",
        color: isSelected ? "white" : "#111827",
        cursor: "pointer",
        padding: "8px 12px",
    }),
    singleValue: (base) => ({
        ...base,
        color: "#111827",
    }),
    placeholder: (base) => ({
        ...base,
        color: "#6b7280",
    }),
    clearIndicator: (base) => ({
        ...base,
        padding: "0 8px",
        cursor: "pointer",
        color: "#6b7280",
        "&:hover": {
            color: "#ef4444",
        },
    }),
    indicatorSeparator: () => ({
        display: "none",
    }),
};

const ClearIndicator = (props) => {
    const {
        innerProps: { ref, ...restInnerProps },
        selectProps: { onClear, onSearchChange },
    } = props;
    return (
        <div
            {...restInnerProps}
            ref={ref}
            style={{
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onClear) onClear();
                if (onSearchChange) onSearchChange("");
                if (props.selectProps.onMenuClose)
                    props.selectProps.onMenuClose();
            }}
        >
            <FontAwesomeIcon
                icon={faTimes}
                style={{
                    width: "12px",
                    height: "12px",
                    cursor: "pointer",
                }}
            />
        </div>
    );
};

export default function ReactSelectInput({
    label,
    name,
    options = [],
    selected = null,
    onChange,
    placeholder = "Select an option...",
    displayKey = "name",
    valueKey = "id",
    required = false,
    error = "",
    isDisabled = false,
    searchValue = "",
    onSearchChange = () => {},
    className = "",
}) {
    const formattedOptions = options.map((option) => ({
        label: option[displayKey],
        value: option[valueKey],
        original: option,
    }));
    console.log(`[${name}] Formatted Options:`, formattedOptions);

    const getSelectedOption = () => {
        console.log(`[${name}] Selected Prop Received:`, selected);
        if (!selected) {
            console.log(`[${name}] No selected value, returning null`);
            return null;
        }
        const selectedValue =
            typeof selected === "object" && selected[valueKey]
                ? selected[valueKey].toString()
                : selected?.toString();
        console.log(`[${name}] Extracted Selected Value:`, selectedValue);
        const foundOption = formattedOptions.find(
            (opt) => opt?.value?.toString() === selectedValue
        );
        console.log(`[${name}] Found Option:`, foundOption);
        return foundOption || null;
    };

    const selectedOption = getSelectedOption();

    const handleChange = (newOption) => {
        console.log(`[${name}] Handle Change - New Option:`, newOption);
        if (!newOption) {
            console.log(`[${name}] Deselecting, calling onChange with null`);
            onChange(null);
            onSearchChange(""); // Sync search with deselection
            return;
        }
        console.log(`[${name}] Calling onChange with value:`, newOption.value);
        onChange(newOption.value);
    };

    const handleClear = () => {
        console.log(
            `[${name}] Clearing selection and search, calling onChange with null`
        );
        onChange(null);
        onSearchChange(""); // Reset search input
    };

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label
                    htmlFor={name}
                    className="text-sm font-medium text-gray-700"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <Select
                inputId={name}
                name={name}
                isDisabled={isDisabled}
                value={selectedOption}
                onChange={handleChange}
                options={formattedOptions}
                isSearchable
                onInputChange={(input) => onSearchChange(input)}
                placeholder={placeholder}
                classNamePrefix="react-select"
                className={className}
                styles={customStyles}
                components={{
                    ClearIndicator,
                    IndicatorSeparator: () => null,
                }}
                isClearable={!!selectedOption}
                onClear={handleClear}
                menuPortalTarget={document.body} // Render menu outside modal
            />

            {error && (
                <p className="text-sm text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    );
}
