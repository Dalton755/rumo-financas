import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import RedefinirSenha from "../pages/RedefinirSenha";
import Dashboard from "../pages/Dashboard";
import Contas from "../pages/Contas";
import Movimentacoes from "../pages/Movimentacoes";
import Compromissos from "../pages/Compromissos";
import Relatorios from "../pages/Relatorios";
import Inteligencia from "../pages/Inteligencia";
import Metas from "../pages/Metas";
import Objetivos from "../pages/Objetivos";
import Dividas from "../pages/Dividas";
import Cartoes from "../pages/Cartoes";
import Premium from "../pages/Premium";
import Orcamento from "../pages/Orcamento";
import Projecoes from "../pages/Projecoes";
import Alertas from "../pages/Alertas";
import Gerencial from "../pages/Gerencial";
import Calculadoras from "../pages/Calculadoras";

import ProtectedRoute from "../components/ProtectedRoute";
import RecursoRoute from "../components/RecursoRoute";
import DonoRoute from "../components/DonoRoute";


function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/redefinir-senha"
                    element={<RedefinirSenha />}
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
                    path="/compromissos"
                    element={
                        <ProtectedRoute>
                            <Compromissos />
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

                <Route
                    path="/calculos"
                    element={
                        <ProtectedRoute>
                            <Calculadoras />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/premium"
                    element={
                        <ProtectedRoute>
                            <Premium />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/inteligencia"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="INTELIGENCIA_FINANCEIRA"
                                titulo="Inteligência Financeira"
                            >
                                <Inteligencia />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/metas"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="METAS"
                                titulo="Metas Financeiras"
                            >
                                <Metas />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/objetivos"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="OBJETIVOS"
                                titulo="Objetivos Financeiros"
                            >
                                <Objetivos />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dividas"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="DIVIDAS"
                                titulo="Gestão de Dívidas"
                            >
                                <Dividas />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cartoes"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="CARTOES"
                                titulo="Cartões de Crédito"
                            >
                                <Cartoes />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projecoes"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="PROJECOES"
                                titulo="Projeções Financeiras"
                            >
                                <Projecoes />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/orcamento"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="ORCAMENTO"
                                titulo="Orçamento por Categoria"
                            >
                                <Orcamento />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/alertas"
                    element={
                        <ProtectedRoute>
                            <RecursoRoute
                                codigo="ALERTAS_INTELIGENTES"
                                titulo="Alertas Inteligentes"
                            >
                                <Alertas />
                            </RecursoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/gerencial"
                    element={
                        <ProtectedRoute>
                            <DonoRoute>
                                <Gerencial />
                            </DonoRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/open-finance"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
