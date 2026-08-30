import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import "./MainLayout.css";
import { supabase } from "../services/supabase";

import {
  Menu,
  X,
  LayoutDashboard,
  WalletCards,
  ArrowLeftRight,
  BarChart3,
  LogOut
} from "lucide-react";

function MainLayout({ children }) {
  const [menuAberto, setMenuAberto] = useState(false)

  async function sair() {

    await supabase.auth.signOut();

    window.location.href = "/";

  }



  return (
    <div className="container-fluid">

      <div className="d-md-none p-2">

        <button
          className="btn btn-dark"
          onClick={() => setMenuAberto(!menuAberto)}
        >

          {
            menuAberto
              ? <X size={20} />
              : <Menu size={20} />
          }

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

            <p className="sidebar-subtitle">
              Veja para onde seu dinheiro está levando você.
            </p>

          </div>

          <hr />

          <div className="rumo-sidebar-menu">

            <NavLink
              to="/dashboard"
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
              className="rumo-sidebar-item"
            >
              <WalletCards size={20} />
              <span>Contas</span>
            </NavLink>

            <NavLink
              to="/movimentacoes"
              className="rumo-sidebar-item"
            >
              <ArrowLeftRight size={20} />
              <span>Movimentações</span>
            </NavLink>

            <NavLink
              to="/relatorios"
              className="rumo-sidebar-item"
            >
              <BarChart3 size={20} />
              <span>Relatórios</span>
            </NavLink>

           

            <button
              className="rumo-sidebar-logout"
              onClick={sair}
            >

              <LogOut size={20} />

              <span>Sair</span>

            </button>

          </div>



        </div>



        <div className="col-md-10 p-4">

          {children}



        </div>

      </div>

    </div>
  )

}

export default MainLayout