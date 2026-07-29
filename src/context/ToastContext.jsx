import { createContext, useContext, useState, useCallback } from "react";
import AppToast from "../components/AppToast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({
        show: false,
        message: "",
        title: "",
        bg: "success",
    });

    const showToast = useCallback((title, message, bg = "success") => {
        setToast({
            show: true,
            title,
            message,
            bg,
        });
    }, []);

    const hideToast = () => {
        setToast((prev) => ({
            ...prev,
            show: false,
        }));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <AppToast
                toast={toast}
                hideToast={hideToast}
            />


        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}