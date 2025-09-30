import Select from "react-select";

const customStyles = {
    // control: (base, state) => ({
    //     ...base,
    //     backgroundColor: "white",
    //     borderColor: state.isFocused ? "#3b82f6" : "#d1d5db", // Tailwind: blue-500 or gray-300
    //     boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    //     "&:hover": {
    //         borderColor: "#3b82f6",
    //     },
    //     minHeight: "38px",
    //     borderRadius: "0.375rem", // rounded-md
    // }),
    // menu: (base) => ({
    //     ...base,
    //     maxHeight: "240px", // Tailwind max-h-60
    //     borderRadius: "0.375rem",
    //     overflowY: "auto",
    //     zIndex: 10,
    // }),
    // option: (base, { isFocused, isSelected }) => ({
    //     ...base,
    //     backgroundColor: isSelected
    //         ? "#3b82f6" // Tailwind blue-500
    //         : isFocused
    //         ? "#e0f2fe" // Tailwind blue-100
    //         : "white",
    //     color: isSelected ? "white" : "#111827", // Tailwind gray-900
    //     cursor: "pointer",
    //     padding: "8px 12px",
    // }),
    // singleValue: (base) => ({
    //     ...base,
    //     color: "#111827", // Tailwind gray-900
    // }),
    // placeholder: (base) => ({
    //     ...base,
    //     color: "#6b7280", // Tailwind gray-500
    // }),
};

const TermsReactSelect = ({ termsOptions, data, setData }) => {
    const selectedOption = termsOptions.find(
        (option) => option.value === data.terms
    );

    return (
        <Select
            id="terms"
            name="terms"
            value={selectedOption || null}
            onChange={(selected) => setData("terms", selected.value)}
            options={termsOptions}
            isSearchable={true}
            placeholder="Select Terms..."
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
        />
    );
};

export default TermsReactSelect;
