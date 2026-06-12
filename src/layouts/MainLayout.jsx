import { Link } from 'react-router-dom'

function MainLayout({ children }) {

  return (
    <div className="container-fluid">

      <div className="row">

        <div
          className="col-md-2 bg-dark text-white min-vh-100 p-3"
        >

          <h3>Rumo</h3>

          <p>
            Seu futuro financeiro
          </p>

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