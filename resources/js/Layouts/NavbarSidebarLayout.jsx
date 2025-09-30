import { Footer } from "flowbite-react";
// import Navbar from "../components/navbar";
// import Sidebar from "../components/sidebar";
import { MdFacebook } from "react-icons/md";
import { FaDribbble, FaGithub, FaInstagram, FaTwitter } from "react-icons/fa";
import SidebarTemplate from "@/Components/SidebarTemplate";
import NavbarTemplate from "@/Components/NavbarTemplate";

const NavbarSidebarLayout = ({ children, isFooter = true }) => {
    return (
        <>
            <NavbarTemplate />
            <div className="flex items-start">
                <SidebarTemplate />
                <MainContent isFooter={isFooter}>{children}</MainContent>
            </div>
        </>
    );
};

const MainContent = ({ children, isFooter }) => {
    return (
        <main className="relative h-full w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 lg:ml-0">
            {children}
            {isFooter && (
                <div className="mx-4 mt-4">
                    <MainContentFooter />
                </div>
            )}
        </main>
    );
};

const MainContentFooter = () => {
    return (
        <>
            {/* <Footer container>
                <div className="flex w-full flex-col gap-y-6 lg:flex-row lg:justify-between lg:gap-y-0">
                    <Footer.LinkGroup>
                        <Footer.Link href="#" className="mr-3 mb-3 lg:mb-0">
                            Terms and conditions
                        </Footer.Link>
                        <Footer.Link href="#" className="mr-3 mb-3 lg:mb-0">
                            Privacy Policy
                        </Footer.Link>
                        <Footer.Link href="#" className="mr-3">
                            Licensing
                        </Footer.Link>
                        <Footer.Link href="#" className="mr-3">
                            Cookie Policy
                        </Footer.Link>
                        <Footer.Link href="#">Contact</Footer.Link>
                    </Footer.LinkGroup>
                    <Footer.LinkGroup>
                        <div className="flex gap-x-1">
                            <Footer.Link
                                href="#"
                                className="hover:[&>*]:text-black dark:hover:[&>*]:text-gray-300"
                            >
                                <MdFacebook className="text-lg" />
                            </Footer.Link>
                            <Footer.Link
                                href="#"
                                className="hover:[&>*]:text-black dark:hover:[&>*]:text-gray-300"
                            >
                                <FaInstagram className="text-lg" />
                            </Footer.Link>
                            <Footer.Link
                                href="#"
                                className="hover:[&>*]:text-black dark:hover:[&>*]:text-gray-300"
                            >
                                <FaTwitter className="text-lg" />
                            </Footer.Link>
                            <Footer.Link
                                href="#"
                                className="hover:[&>*]:text-black dark:hover:[&>*]:text-gray-300"
                            >
                                <FaGithub className="text-lg" />
                            </Footer.Link>
                            <Footer.Link
                                href="#"
                                className="hover:[&>*]:text-black dark:hover:[&>*]:text-gray-300"
                            >
                                <FaDribbble className="text-lg" />
                            </Footer.Link>
                        </div>
                    </Footer.LinkGroup>
                </div>
            </Footer> */}
            <p className="my-8 text-center text-sm text-gray-500 dark:text-gray-300">
                &copy; 2025 All rights reserved.
            </p>
        </>
    );
};

export default NavbarSidebarLayout;
