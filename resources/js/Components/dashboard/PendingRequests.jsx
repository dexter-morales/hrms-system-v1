import {
    faCalendarAlt,
    faClock,
    faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, Badge } from "flowbite-react";
import { Link } from "@inertiajs/react";

const PendingRequests = ({ pending_requests, auth }) => {
    console.log("Auth: ", auth);
    const getIcon = (type) => {
        return type === "leave" ? faCalendarAlt : faClock;
    };

    const getLabel = (type) => {
        return type === "leave" ? "Leave Request" : "Overtime Request";
    };

    const getRoute = (type, id) => {
        return type === "leave"
            ? auth?.user?.roles[0].name === "HR" ||
              auth?.user?.roles[0].name === "SuperAdmin"
                ? `/leaves/admin`
                : `/leaves/employee`
            : `/overtime/list`;
    };

    return (
        <div className="space-y-4">
            <Card className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-center content-center gap-2">
                    <FontAwesomeIcon icon={faFileAlt} />
                    <h3 className="text-lg font-semibold">Pending Requests</h3>
                </div>
                {pending_requests.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                        No pending requests.
                    </p>
                ) : (
                    pending_requests.map((request, index) => (
                        <Link
                            href={getRoute(request.request_type)}
                            key={index}
                            className="block hover:opacity-90 transition"
                        >
                            <div className="flex bg-slate-500/20 rounded-lg p-4">
                                <div className="flex justify-between items-center w-full">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <FontAwesomeIcon
                                                icon={getIcon(
                                                    request.request_type
                                                )}
                                                className="text-gray-600"
                                            />
                                            <h4 className="text-md font-semibold text-gray-900">
                                                {request.name}
                                            </h4>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                {getLabel(request.request_type)}
                                            </span>
                                        </div>
                                        {request.request_type === "leave" ? (
                                            <>
                                                <p className="text-gray-600 text-sm">
                                                    {request.type} -{" "}
                                                    {request.days} day
                                                    {request.days > 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    {request.start_date} to{" "}
                                                    {request.end_date}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-gray-600 text-sm">
                                                    {request.date}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    Requested:{" "}
                                                    {request.requested_hours}{" "}
                                                    hrs | Approved:{" "}
                                                    {request.approved_hours ??
                                                        0}{" "}
                                                    hrs
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <Badge
                                        color={
                                            request.status === "Pending"
                                                ? "red"
                                                : request.status === "Approved"
                                                ? "success"
                                                : "gray"
                                        }
                                        size="sm"
                                    >
                                        {request.status}
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </Card>
        </div>
    );
};

export default PendingRequests;
