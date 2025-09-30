import { usePage } from "@inertiajs/react";
import axios from "axios";
import React, { createContext, useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
// import toast from "react-hot-toast";

const DataStoreContext = createContext();

export function DataStoreProvider({ children }) {
    const [isSidebarMobileOpen, setIsSideisSidebarMobileOpen] = useState("");

    return (
        <DataStoreContext.Provider
            value={{
                isSidebarMobileOpen,
                setIsSideisSidebarMobileOpen,
            }}
        >
            {children}
        </DataStoreContext.Provider>
    );
}

export function useDataStore() {
    return useContext(DataStoreContext);
}
