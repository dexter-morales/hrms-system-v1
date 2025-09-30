import Select from "react-select";

const FlowbiteReactSelect = ({
    termsOptions,
    value,
    onChange,
    placeholder = "Select an option...",
}) => {
    const customStyles = {
        // control: (base, state) => ({
        //     ...base,
        //     backgroundColor: "white",
        //     borderColor: state.isFocused ? "#3b82f6" : "#d1d5db", // blue-500 or gray-300
        //     boxShadow: state.isFocused
        //         ? "0 0 0 2px rgba(59,130,246,0.5)"
        //         : "none", // ring-blue-500
        //     borderRadius: "0.5rem", // rounded-md
        //     paddingLeft: "0.25rem", // pl-1
        //     minHeight: "42px",
        //     transition: "all 0.2s ease",
        // }),
        // menu: (base) => ({
        //     ...base,
        //     zIndex: 50,
        //     maxHeight: "240px", // max-h-60
        //     overflowY: "auto",
        //     borderRadius: "0.5rem",
        // }),
        // option: (base, { isFocused, isSelected }) => ({
        //     ...base,
        //     backgroundColor: isSelected
        //         ? "#3b82f6" // blue-500
        //         : isFocused
        //         ? "#e0f2fe" // blue-100
        //         : "white",
        //     color: isSelected ? "white" : "#111827", // gray-900
        //     padding: "8px 12px",
        // }),
        // placeholder: (base) => ({
        //     ...base,
        //     color: "#6b7280", // gray-500
        // }),
        // singleValue: (base) => ({
        //     ...base,
        //     color: "#111827", // gray-900
        // }),
    };

    return (
        <Select
            options={termsOptions}
            value={value}
            onChange={onChange}
            isSearchable
            placeholder={placeholder}
            styles={customStyles}
            className="text-sm"
            classNamePrefix="react-select"
        />
    );
};

export default FlowbiteReactSelect;
