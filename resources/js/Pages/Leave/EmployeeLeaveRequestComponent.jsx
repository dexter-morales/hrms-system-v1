import { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import { TextInput, Select, Label, Button } from "flowbite-react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import BreadCrumbs from "@/Components/dashboard/BreadCrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import LeaveRequestModal from "@/Components/leave_request/LeaveRequestModal";
import AttachmentViewer from "@/Components/leave_request/AttachmentViewer";
import LeaveTable from "@/Components/leave_request/LeaveTable";
// import LeaveTable from "./LeaveTable";
// import LeaveRequestModal from "./LeaveRequestModal";
// import AttachmentViewer from "./AttachmentViewer";

const EmployeeLeaveRequestComponent = () => {
    const { auth, leaves, myLeaves, leave_types, leave_credits } =
        usePage().props;
    console.log("Leaves: ", { leaves, myLeaves, leave_types, leave_credits });

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [showAttachment, setShowAttachment] = useState(null);
    const [filterText, setFilterText] = useState("");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const filteredLeaves = leaves
        .filter((leave) =>
            auth.user.role === "manager"
                ? leave.employee.manager_id === auth.user.id
                : auth.user.role === "employee"
                ? leave.employee.id === auth.user.id
                : true
        )
        .filter(
            (leave) =>
                (leave.employee.name
                    .toLowerCase()
                    .includes(filterText.toLowerCase()) ||
                    leave.employee.id
                        .toString()
                        .includes(filterText.toLowerCase())) &&
                (leaveTypeFilter === "" ||
                    leave.leave_type === leaveTypeFilter) &&
                (statusFilter === "" || leave.status === statusFilter)
        );

    const filteredMyLeaves = Array.isArray(myLeaves)
        ? myLeaves.filter(
              (leave) =>
                  (leave.employee.name
                      .toLowerCase()
                      .includes(filterText.toLowerCase()) ||
                      leave.employee.id
                          .toString()
                          .includes(filterText.toLowerCase())) &&
                  (leaveTypeFilter === "" ||
                      leave.leave_type === leaveTypeFilter) &&
                  (statusFilter === "" || leave.status === statusFilter)
          )
        : [];

    return (
        <DashboardLayout>
            <Head title="Employee Leave" />
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Employee Leave
                </h3>
                <BreadCrumbs />
            </div>
            <div className="p-0">
                <div className="mb-4 flex justify-between items-center">
                    <div className="flex gap-4 w-2/3">
                        <TextInput
                            placeholder="Search Name or Emp ID"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-1/3"
                        />
                        <Select
                            value={leaveTypeFilter}
                            onChange={(e) => setLeaveTypeFilter(e.target.value)}
                            className="w-1/6"
                        >
                            <option value="">All Leave Types</option>
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick</option>
                            <option value="personal">Personal</option>
                        </Select>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-1/6"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </Select>
                    </div>
                    <div>
                        <Button
                            color="blue"
                            onClick={() => setIsRequestModalOpen(true)}
                            className="bg-red-700 hover:bg-red-900 text-white transition-all duration-300 ease-in-out font-semibold"
                        >
                            <span>
                                <FontAwesomeIcon icon={faPlus} /> Request Leave
                            </span>
                        </Button>
                    </div>
                </div>

                <LeaveRequestModal
                    show={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                    leaveCredits={leave_credits}
                />

                <AttachmentViewer
                    showAttachment={showAttachment}
                    onClose={() => setShowAttachment(null)}
                />

                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">
                            My Requests
                        </h2>
                        <LeaveTable
                            leaves={filteredMyLeaves}
                            isManager={false}
                            auth={auth}
                            setShowAttachment={setShowAttachment}
                        />
                    </div>
                    {auth.user.roles[0].name !== "Employee" && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">
                                Requests
                            </h2>
                            <LeaveTable
                                leaves={filteredLeaves}
                                isManager={true}
                                auth={auth}
                                setShowAttachment={setShowAttachment}
                            />
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeLeaveRequestComponent;
