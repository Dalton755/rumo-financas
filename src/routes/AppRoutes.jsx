import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Contas from '../pages/Contas'
import Movimentacoes from '../pages/Movimentacoes'
import Relatorios from '../pages/Relatorios'

function AppRoutes() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/contas"
                    element={<Contas />}
                />

                <Route
                    path="/movimentacoes"
                    element={<Movimentacoes />}
                />

                <Route
                    path="/relatorios"
                    element={<Relatorios />}
                />

            </Routes>

        </BrowserRouter>
    )
}

export default AppRoutes