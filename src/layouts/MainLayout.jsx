import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import "./MainLayout.css";

import { supabase } from "../services/supabase";
import { usePlano } from "../context/PlanoContext";
import ModalNovaMovimentacao from "../components/ui/ModalNovaMovimentacao";

import {
  ArrowLeftRight,
  BarChart3,
  BellRing,
  BrainCircuit,
  Calculator,
  CalendarClock,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  PieChart,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  WalletCards,
  X,
} from "lucide-react";

const navegacaoPrincipal = [
  {
    nome: "Início",
    rota: "/dashboard",
    Icone: LayoutDashboard,
  },
  {
    nome: "Movimentações",
    rota: "/movimentacoes",
    Icone: ArrowLeftRight,
  },
  {
    nome: "Planejamento",
    rota: "/planejamento",
    Icone: Target,
  },
  {
    codigo: "INTELIGENCIA_FINANCEIRA",
    nome: "Rumo IA",
    rota: "/inteligencia",
    Icone: BrainCircuit,
  },
];

const ferramentasOrganizacao = [
  {
    nome: "Contas",
    rota: "/contas",
    Icone: WalletCards,
  },
  {
    nome: "Compromissos",
    rota: "/compromissos",
    Icone: CalendarClock,
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
];

const ferramentasAnalise = [
  {
    nome: "Relatórios",
    rota: "/relatorios",
    Icone: BarChart3,
  },
  {
    nome: "Cálculos",
    rota: "/calculos",
    Icone: Calculator,
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
  const [
    novaMovimentacaoAberta,
    setNovaMovimentacaoAberta,
  ] = useState(false);

  const {
    premium,
    dono,
    temRecurso,
  } = usePlano();

  useEffect(() => {
    document.body.style.overflow =
      menuAberto || novaMovimentacaoAberta
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    menuAberto,
    novaMovimentacaoAberta,
  ]);

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function fecharMenuMobile() {
    setMenuAberto(false);
  }

  function renderLink({
    nome,
    rota,
    Icone,
    codigo,
  }) {
    const liberado =
      !codigo ||
      temRecurso(codigo);

    return (
      <NavLink
        key={rota}
        to={rota}
        onClick={fecharMenuMobile}
        className={({ isActive }) =>
          [
            "rumo-sidebar-item",
            isActive ? "active" : "",
            !liberado
              ? "rumo-sidebar-item-locked"
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <span className="rumo-sidebar-item-icon">
          <Icone size={18} strokeWidth={2} />
        </span>

        <span className="rumo-sidebar-item-label">
          {nome}
        </span>

        {!liberado && (
          <LockKeyhole
            className="rumo-sidebar-lock"
            size={14}
            aria-label="Recurso Premium"
          />
        )}
      </NavLink>
    );
  }

  return (
    <div className="rumo-shell">
      <header className="rumo-mobile-topbar">
        <div className="rumo-mobile-brand">
          <span className="rumo-mobile-brand-mark">
            ↗
          </span>

          <strong>Rumo</strong>

          {(premium || dono) && (
            <span className="rumo-mobile-plan">
              {dono ? "Dono" : "Premium"}
            </span>
          )}
        </div>

        <button
          type="button"
          className="rumo-mobile-menu-button"
          onClick={() =>
            setMenuAberto(true)
          }
          aria-label="Abrir ferramentas"
        >
          <Menu size={21} />
        </button>
      </header>

      {menuAberto && (
        <button
          type="button"
          className="rumo-sidebar-overlay"
          onClick={fecharMenuMobile}
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={
          menuAberto
            ? "rumo-sidebar is-open"
            : "rumo-sidebar"
        }
      >
        <div className="rumo-sidebar-brand">
          <div className="rumo-brand-mark">
            ↗
          </div>

          <div className="rumo-brand-copy">
            <div className="rumo-brand-line">
              <strong>Rumo</strong>

              {(premium || dono) && (
                <span className="rumo-plan-badge">
                  {dono ? "Dono" : "Premium"}
                </span>
              )}
            </div>

            <span>
              Finanças com direção
            </span>
          </div>

          <button
            type="button"
            className="rumo-sidebar-close"
            onClick={fecharMenuMobile}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="rumo-sidebar-menu">
          <div className="rumo-nav-group">
            <span className="rumo-nav-label">
              Seu Rumo
            </span>

            {navegacaoPrincipal.map(
              renderLink
            )}
          </div>

          <button
            type="button"
            className="rumo-sidebar-new-action"
            onClick={() => {
              setMenuAberto(false);
              setNovaMovimentacaoAberta(true);
            }}
          >
            <Plus size={17} />
            <span>
              <strong>Registrar</strong>
              <small>
                entrada, gasto ou transferência
              </small>
            </span>
          </button>

          <details className="rumo-advanced-menu">
            <summary>
              <span>
                Ferramentas avançadas
              </span>
              <ChevronDown size={15} />
            </summary>

            <div className="rumo-advanced-content">
              <div className="rumo-nav-group">
                <span className="rumo-nav-label">
                  Organizar
                </span>

                {ferramentasOrganizacao.map(
                  renderLink
                )}
              </div>

              <div className="rumo-nav-group">
                <span className="rumo-nav-label">
                  Analisar
                </span>

                {ferramentasAnalise.map(
                  renderLink
                )}
              </div>
            </div>
          </details>
        </nav>

        <div className="rumo-sidebar-footer">
          {dono && (
            <NavLink
              to="/gerencial"
              onClick={fecharMenuMobile}
              className="rumo-owner-panel-link"
            >
              <span className="rumo-owner-panel-icon">
                <ShieldCheck size={17} />
              </span>

              <span>
                <strong>Painel gerencial</strong>
                <small>
                  Administração do Rumo
                </small>
              </span>
            </NavLink>
          )}

          {!premium && !dono ? (
            <NavLink
              to="/premium"
              onClick={fecharMenuMobile}
              className="rumo-upgrade-card"
            >
              <span className="rumo-upgrade-icon">
                <Sparkles size={17} />
              </span>

              <span>
                <strong>Rumo Premium</strong>
                <small>
                  Libere todo o planejamento
                </small>
              </span>
            </NavLink>
          ) : (
            <div
              className={
                dono
                  ? "rumo-current-plan owner"
                  : "rumo-current-plan"
              }
            >
              {dono
                ? <ShieldCheck size={16} />
                : <Sparkles size={16} />
              }
              <span>
                {dono
                  ? "Acesso de proprietário"
                  : "Plano Premium ativo"
                }
              </span>
            </div>
          )}

          <button
            type="button"
            className="rumo-sidebar-logout"
            onClick={sair}
          >
            <LogOut size={17} />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      <main className="rumo-main-content">
        {children}
      </main>

      <nav
        className="rumo-bottom-nav"
        aria-label="Navegação principal"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? "rumo-bottom-item active"
              : "rumo-bottom-item"
          }
        >
          <LayoutDashboard size={20} />
          <span>Início</span>
        </NavLink>

        <NavLink
          to="/movimentacoes"
          className={({ isActive }) =>
            isActive
              ? "rumo-bottom-item active"
              : "rumo-bottom-item"
          }
        >
          <ArrowLeftRight size={20} />
          <span>Movimentos</span>
        </NavLink>

        <button
          type="button"
          className="rumo-bottom-add"
          onClick={() =>
            setNovaMovimentacaoAberta(true)
          }
          aria-label="Registrar movimentação"
        >
          <span>
            <Plus size={24} />
          </span>
          <small>Registrar</small>
        </button>

        <NavLink
          to="/planejamento"
          className={({ isActive }) =>
            isActive
              ? "rumo-bottom-item active"
              : "rumo-bottom-item"
          }
        >
          <Target size={20} />
          <span>Planejar</span>
        </NavLink>

        <NavLink
          to="/inteligencia"
          className={({ isActive }) =>
            isActive
              ? "rumo-bottom-item active"
              : "rumo-bottom-item"
          }
        >
          <BrainCircuit size={20} />
          <span>Rumo IA</span>
        </NavLink>
      </nav>

      {novaMovimentacaoAberta && (
        <ModalNovaMovimentacao
          onFechar={() =>
            setNovaMovimentacaoAberta(false)
          }
        />
      )}
    </div>
  );
}

export default MainLayout;
