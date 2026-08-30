import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Contas from '../pages/Contas'
import Movimentacoes from '../pages/Movimentacoes'
import Relatorios from '../pages/Relatorios'
import ProtectedRoute from '../components/ProtectedRoute'

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
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/contas"
                    element={
                        <ProtectedRoute>
                            <Contas />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/movimentacoes"
                    element={
                        <ProtectedRoute>
                            <Movimentacoes />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/relatorios"
                    element={
                        <ProtectedRoute>
                            <Relatorios />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    )
}

export default AppRoutes