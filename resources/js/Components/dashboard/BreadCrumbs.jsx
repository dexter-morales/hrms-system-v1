import React from "react";
import { usePage, Link } from "@inertiajs/react";

const BreadCrumbs = () => {
    const { url } = usePage();
    // Remove query parameters and split into segments
    const pathWithoutParams = url.split("?")[0];
    const pathSegments = pathWithoutParams.split("/").filter(Boolean);

    const formatSegment = (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    return (
        <div>
            <ul className="breadcrumb mt-2 text-sm text-gray-400 flex space-x-2">
                {pathSegments.map((segment, index) => {
                    const href =
                        "/" + pathSegments.slice(0, index + 1).join("/");
                    const isLast = index === pathSegments.length - 1;

                    return (
                        <li
                            key={href}
                            className="flex items-center space-x-1 font-semibold"
                        >
                            {!isLast ? (
                                <>
                                    {index === 0 ? (
                                        <>
                                            <Link
                                                href={"/dashboard"}
                                                className="text-blue-500 hover:underline"
                                            >
                                                Dashboard
                                            </Link>
                                            <span>/</span>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href={href}
                                                className="text-blue-500 hover:underline"
                                            >
                                                {formatSegment(segment)}
                                            </Link>
                                            <span>/</span>
                                        </>
                                    )}
                                </>
                            ) : (
                                <span className="text-gray-500">
                                    {formatSegment(segment)}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default BreadCrumbs;
