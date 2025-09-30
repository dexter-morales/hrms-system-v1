import DataTable from "react-data-table-component";
import { useState, useMemo } from "react";
import { TextInput, Button, Select, Label } from "flowbite-react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ImportEmployee from "./employee/ImportEmployee";

// Utility to get nested object value by dot-notation
const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
};

const TableComponent = ({
    columns,
    data = [],
    modalComponent: ModalComponent,
    modalProps = {},
    deleteModalComponent: DeleteModalComponent,
    deleteModalProps = {},
    searchFields = [],
    filterField = [],
    filterOptions = {},
    addButtonText,
    renderActions,
    placeholder = "Search...",
    importEmployeeButton = false,
    generated_employee_id = null,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterValue, setFilterValue] = useState(
        Array.isArray(filterField)
            ? filterField.reduce((acc, field) => ({ ...acc, [field]: "" }), {})
            : { [filterField]: "" }
    );
    const [perPage, setPerPage] = useState(10);

    const customStyles = {
        table: {
            style: {
                width: "1200px",
                minWidth: "100%",
                zIndex: "0",
            },
        },
        headCells: {
            style: {
                fontSize: "12px",
                fontWeight: "bold",
                textAlign: "center",
                backgroundColor: "#f3f4f6",
                padding: "20px",
            },
        },
        cells: {
            style: {
                fontFamily: "CircularStd, sans-serif",
                fontSize: "12px",
                padding: "20px",
                // Ensure nested elements inherit styles or don't get overridden
                "& span": {
                    display: "inline-block", // Ensure span is treated as a block for styling
                },
            },
        },
    };

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // Search filter
            const matchesSearch =
                !searchTerm ||
                searchFields.some((field) => {
                    const value = getNestedValue(item, field);
                    return (
                        value &&
                        value
                            .toString()
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    );
                });

            // Dropdown filters
            const matchesFilters = Object.entries(filterValue).every(
                ([field, value]) => {
                    if (!value || !field) return true;
                    const itemValue = getNestedValue(item, field);
                    return (
                        itemValue &&
                        itemValue.toString().toLowerCase() ===
                            value.toLowerCase()
                    );
                }
            );

            return matchesSearch && matchesFilters;
        });
    }, [data, searchTerm, searchFields, filterValue]);

    const combinedColumns = useMemo(() => {
        const baseColumns = columns.map((col) => ({
            name: col.name || "",
            cell: col.cell
                ? (row, index) => col.cell(row, index)
                : col.render
                ? (row, index) => col.render(row, index)
                : col.selector
                ? (row) => col.selector(row) ?? "-"
                : col.accessor
                ? (row) => getNestedValue(row, col.accessor) ?? "-"
                : "-",
            selector: col.selector
                ? (row) => col.selector(row) ?? ""
                : col.accessor
                ? (row) => getNestedValue(row, col.accessor) ?? ""
                : (row) => "",
            sortable: col.sortable !== false,
            wrap: col.wrap ?? true,
            width: col.width,
        }));

        if (renderActions.length > 0) {
            baseColumns.push({
                name: "Actions",
                cell: (row) => (
                    <div className="flex gap-1">{renderActions(row)}</div>
                ),
                ignoreRowClick: true,
                allowOverflow: true,
                button: true,
                width: "100px",
                sortable: false,
            });
        }

        return baseColumns;
    }, [columns, renderActions]);

    const handleFilterChange = (field, value) => {
        setFilterValue((prev) => ({ ...prev, [field]: value }));
    };

    const getFilterLabel = (field) => {
        if (field === "employee.site.id") return "Site";
        if (field === "pay_schedule") return "Pay Schedule";
        return field.replace(/\./g, " ").replace(/_/g, " ").toUpperCase();
    };

    const [modalEmployeeImportOpen, setModalEmployeeImportOpen] =
        useState(false);

    return (
        <div className="p-0 space-y-3">
            {DeleteModalComponent && (
                <DeleteModalComponent {...deleteModalProps} />
            )}
            {ModalComponent && <ModalComponent {...modalProps} />}

            <div className="mb-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search" value="Search" />
                    <TextInput
                        id="search"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {Array.isArray(filterField)
                    ? filterField.map(
                          (field) =>
                              filterOptions[field]?.length > 0 && (
                                  <div
                                      key={field}
                                      className="flex-1 min-w-[200px]"
                                  >
                                      <Label
                                          htmlFor={`filter-${field.replace(
                                              /\./g,
                                              "_"
                                          )}`}
                                          value={`Filter by ${getFilterLabel(
                                              field
                                          )}`}
                                      />
                                      <Select
                                          id={`filter-${field.replace(
                                              /\./g,
                                              "_"
                                          )}`}
                                          value={filterValue[field] || ""}
                                          onChange={(e) =>
                                              handleFilterChange(
                                                  field,
                                                  e.target.value
                                              )
                                          }
                                      >
                                          {filterOptions[field].map(
                                              (option) => (
                                                  <option
                                                      key={option.value}
                                                      value={option.value}
                                                  >
                                                      {option.label}
                                                  </option>
                                              )
                                          )}
                                      </Select>
                                  </div>
                              )
                      )
                    : console.log("Filter field is not an array")}

                {addButtonText && (
                    <div className="flex items-end gap-2">
                        <Button
                            className="bg-red-700 hover:!bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                            size="md"
                            onClick={() => modalProps.onOpen?.()}
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                            {addButtonText}
                        </Button>
                        {importEmployeeButton && generated_employee_id && (
                            <>
                                <Button
                                    className="bg-gray-700 hover:!bg-gray-900 text-white transition-all duration-300 ease-in-out font-semibold"
                                    size="md"
                                    onClick={() =>
                                        setModalEmployeeImportOpen(true)
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        className="mr-2"
                                    />
                                    Import Employees
                                </Button>
                                <ImportEmployee
                                    generate_employee_id={generated_employee_id}
                                    isOpen={modalEmployeeImportOpen}
                                    onClose={() =>
                                        setModalEmployeeImportOpen(false)
                                    }
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="relative overflow-x-auto max-w-full shadow-md">
                <DataTable
                    columns={combinedColumns}
                    data={filteredData}
                    pagination
                    paginationPerPage={perPage}
                    paginationRowsPerPageOptions={[10, 25, 50]}
                    onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                    striped
                    customStyles={customStyles}
                    highlightOnHover
                    dense
                    fixedHeader
                    responsive
                    fixedHeaderScrollHeight="500px"
                    noDataComponent={
                        <div>
                            <img
                                src="/images/no-data.webp"
                                alt="Empty"
                                className="max-w-xs mt-2 mx-auto"
                                onError={(e) => {
                                    e.target.style.display = "none";
                                }}
                            />
                            <p className="text-center mb-5 badge badge-error ">
                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                                    No Records Found
                                </span>
                            </p>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default TableComponent;
