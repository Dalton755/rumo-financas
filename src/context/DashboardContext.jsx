import { createContext, useContext, useState } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {

    const [dashboard, setDashboard] = useState(null);

    const [periodoSelecionado, setPeriodoSelecionado] = useState(null);

    const [periodos, setPeriodos] = useState([]);

    return (

        <DashboardContext.Provider
            value={{

                dashboard,
                setDashboard,

                periodoSelecionado,
                setPeriodoSelecionado,

                periodos,
                setPeriodos

            }}
        >

            {children}

        </DashboardContext.Provider>

    );

}

export function useDashboard() {

    return useContext(DashboardContext);

}