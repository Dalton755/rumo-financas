import { NavLink } from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";

import "./MainLayout.css";

import { supabase } from "../services/supabase";
import { usePlano } from "../context/PlanoContext";

import {
  Menu,
  X,
  LayoutDashboard,
  WalletCards,
  ArrowLeftRight,
  BarChart3,
  BrainCircuit,
  Target,
  Trophy,
  CreditCard,
  TrendingUp,
  PieChart,
  BellRing,
  LockKeyhole,
  LogOut,
} from "lucide-react";

const recursosPremium = [
  {
    codigo: "INTELIGENCIA_FINANCEIRA",
    nome: "Inteligência",
    rota: "/inteligencia",
    Icone: BrainCircuit,
  },
  {
    codigo: "METAS",
    nome: "Metas",
    rota: "/metas",
    Icone: Target,
  },
  {
    codigo: "OBJETIVOS",
    nome: "Objetivos",
    rota: "/objetivos",
    Icone: Trophy,
  },
  {
    codigo: "DIVIDAS",
    nome: "Dívidas",
    rota: "/dividas",
    Icone: CreditCard,
  },

  {
    codigo: "CARTOES",
    nome: "Cartões",
    rota: "/cartoes",
    Icone: WalletCards,
  },
  {
    codigo: "PROJECOES",
    nome: "Projeções",
    rota: "/projecoes",
    Icone: TrendingUp,
  },
  {
    codigo: "ORCAMENTO",
    nome: "Orçamento",
    rota: "/orcamento",
    Icone: PieChart,
  },
  {
    codigo: "ALERTAS_INTELIGENTES",
    nome: "Alertas",
    rota: "/alertas",
    Icone: BellRing,
  },

];

function MainLayout({ children }) {
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (menuAberto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  const {
    premium,
    temRecurso,
  } = usePlano();

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function fecharMenuMobile() {
    setMenuAberto(false);
  }

  return (
    <div className="container-fluid">
      <div
        className="d-md-none p-2"
        style={{
          position: "relative",
          zIndex: 1100,
        }}
      >
        <button
          className="btn btn-dark"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          {menuAberto ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </div>

      <div className="row">
        <div
          className={`
            col-md-2
            rumo-sidebar
            ${menuAberto ? "d-block" : "d-none"}
            d-md-block
          `}
        >
          <div className="rumo-logo">
            <h2>
              ↗ Rumo
            </h2>

            {premium && (
              <span className="rumo-plan-badge">
                Premium
              </span>
            )}

            <p className="sidebar-subtitle">
              Veja para onde seu dinheiro está levando você.
            </p>
          </div>

          <hr />

          <div className="rumo-sidebar-menu">
            <NavLink
              to="/dashboard"
              onClick={fecharMenuMobile}
              className={({ isActive }) =>
                isActive
                  ? "rumo-sidebar-item active"
                  : "rumo-sidebar-item"
              }
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/contas"
              onClick={fecharMenuMobile}
              className={({ isActive }) =>
                isActive
                  ? "rumo-sidebar-item active"
                  : "rumo-sidebar-item"
              }
            >
              <WalletCards size={20} />
              <span>Contas</span>
            </NavLink>

            <NavLink
              to="/movimentacoes"
              onClick={fecharMenuMobile}
              className={({ isActive }) =>
                isActive
                  ? "rumo-sidebar-item active"
                  : "rumo-sidebar-item"
              }
            >
              <ArrowLeftRight size={20} />
              <span>Movimentações</span>
            </NavLink>

            <NavLink
              to="/relatorios"
              onClick={fecharMenuMobile}
              className={({ isActive }) =>
                isActive
                  ? "rumo-sidebar-item active"
                  : "rumo-sidebar-item"
              }
            >
              <BarChart3 size={20} />
              <span>Relatórios</span>
            </NavLink>

            <div className="rumo-sidebar-premium-label">
              Premium
            </div>

            <div className="rumo-sidebar-premium-list">
              {recursosPremium.map(
                ({
                  codigo,
                  nome,
                  rota,
                  Icone,
                }) => {
                  const liberado =
                    temRecurso(codigo);

                  return (
                    <NavLink
                      key={codigo}
                      to={rota}
                      onClick={fecharMenuMobile}
                      className={({ isActive }) =>
                        [
                          "rumo-sidebar-item",
                          "rumo-sidebar-item-premium",
                          isActive ? "active" : "",
                          !liberado
                            ? "rumo-sidebar-premium-locked"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                    >
                      <Icone size={19} />

                      <span>
                        {nome}
                      </span>

                      {liberado ? (
                        <span className="rumo-sidebar-premium-pill">
                          PRO
                        </span>
                      ) : (
                        <span
                          className="rumo-sidebar-lock"
                          title="Recurso exclusivo Premium"
                        >
                          <LockKeyhole size={14} />
                        </span>
                      )}
                    </NavLink>
                  );
                }
              )}
            </div>

            <button
              className="rumo-sidebar-logout"
              onClick={sair}
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>

        <div
          className={`col-md-10 p-4 rumo-main-content ${menuAberto ? "rumo-main-content-menu-open" : ""
            }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
