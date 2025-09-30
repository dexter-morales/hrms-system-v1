import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePage } from "@inertiajs/react";
import { Card, Badge } from "flowbite-react";

const PendingLeaveRequest = ({ leave_requests }) => {
    console.log("leave_requestsleave_requests: ", leave_requests);
    return (
        <div className="space-y-4">
            <Card className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-center content-center gap-2">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <h3 className="text-lg font-semibold">Pending Leave</h3>
                </div>
                {leave_requests.map((request, index) => (
                    <div
                        key={index}
                        className="flex bg-slate-500/20 rounded-lg p-4"
                    >
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <h4 className="text-md font-semibold text-gray-900">
                                    {request.name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                    {request.type} - {request.days} day
                                    {request.days > 1 ? "s" : ""}
                                </p>
                                <p className="text-gray-500 text-xs">
                                    {request.start_date} to {request.end_date}
                                </p>
                            </div>
                            <Badge
                                color={
                                    request.status === "Pending"
                                        ? "red"
                                        : "success"
                                }
                                size="sm"
                            >
                                {request.status}
                            </Badge>
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
};

export default PendingLeaveRequest;
