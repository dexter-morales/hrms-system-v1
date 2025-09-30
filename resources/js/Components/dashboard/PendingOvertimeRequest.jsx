import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, Badge } from "flowbite-react";

const PendingOvertimeRequest = ({ overtime_requests }) => {
    return (
        <div className="space-y-4">
            <Card className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-center content-center gap-2">
                    <FontAwesomeIcon icon={faClock} />
                    <h3 className="text-lg font-semibold">Pending Overtime</h3>
                </div>
                {overtime_requests.map((request, index) => (
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
                                    {request.date}
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Requested: {request.requested_hours} hrs |
                                    Approved: {request.approved_hours ?? 0} hrs
                                </p>
                            </div>
                            <Badge
                                color={
                                    request.status === "Pending"
                                        ? "red"
                                        : request.status === "Approved"
                                        ? "success"
                                        : "red"
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

export default PendingOvertimeRequest;
