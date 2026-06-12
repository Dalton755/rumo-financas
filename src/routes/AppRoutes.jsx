        import { BrowserRouter, Routes, Route } from 'react-router-dom'

        import Login from '../pages/Login'
        import Dashboard from '../pages/Dashboard'
        import Contas from '../pages/Contas'
        import Movimentacoes from '../pages/Movimentacoes'

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

            </Routes>

            </BrowserRouter>
        )
        }

        export default AppRoutes