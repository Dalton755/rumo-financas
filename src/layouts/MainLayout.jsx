import { Link } from 'react-router-dom'
import { useState } from 'react'

import {
  Menu,
  X
} from 'lucide-react'

function MainLayout({ children }) {
  const [menuAberto, setMenuAberto] = useState(false)

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
    bg-dark
    text-white
    min-vh-100
    p-3
    ${menuAberto ? 'd-block' : 'd-none'}
    d-md-block
  `}
        >

          <div className="text-center mb-4">

            <h2 className="fw-bold text-success">
              ↗ Rumo
            </h2>

            <small className="text-light">
              Veja para onde seu dinheiro
              está levando você
            </small>

          </div>

          <hr />

          <div className="d-grid gap-2">

            <Link
              to="/dashboard"
              className="btn btn-outline-light"
            >
              Dashboard
            </Link>

            <Link
              to="/contas"
              className="btn btn-outline-light"
            >
              Contas
            </Link>

            <Link
              to="/movimentacoes"
              className="btn btn-outline-light"
            >
              Movimentações
            </Link>
            <button
              className="btn btn-danger mt-3"
            >
              <Link
                to="/relatorios"
                className="btn btn-outline-light"
              >
                Relatórios
              </Link>

              Sair
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