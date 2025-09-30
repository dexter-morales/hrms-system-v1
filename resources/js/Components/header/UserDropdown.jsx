import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link } from "@inertiajs/react";

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center text-gray-700 dark:text-gray-400"
            >
                <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
                    <img src="/images/user/owner.jpg" alt="User" />
                </span>
                <span className="block mr-1 font-medium text-theme-sm">
                    Musharof
                </span>
                <svg
                    className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    width="18"
                    height="20"
                    viewBox="0 0 18 20"
                    fill="none"
                >
                    <path
                        d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
            >
                <div>
                    <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                        Musharof Chowdhury
                    </span>
                    <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                        randomuser@pimjo.com
                    </span>
                </div>

                <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
                    <li>
                        <Link
                            href="/profile"
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            <svg
                                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12..."
                                    fill="currentColor"
                                />
                            </svg>
                            Edit Profile
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/settings"
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            <svg
                                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M10.4858 3.5L13.5182 3.5C13.9233 3.5..."
                                    fill="currentColor"
                                />
                            </svg>
                            Settings
                        </Link>
                    </li>
                </ul>
            </Dropdown>
        </div>
    );
}
