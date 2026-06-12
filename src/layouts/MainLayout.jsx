  import { Link } from 'react-router-dom'

  function MainLayout({ children }) {

    return (
      <div className="container-fluid">

        <div className="row">

          <div
            className="col-md-2 bg-dark text-white min-vh-100 p-3"
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