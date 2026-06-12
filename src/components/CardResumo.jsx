function CardResumo({
  titulo,
  valor
}) {
  return (
    <div className="col-md-3 mb-3">

      <div className="card shadow border-0 h-100">

        <div className="card-body">

          <h6 className="text-muted">
            {titulo}
          </h6>

          <h3 className="fw-bold">
            {valor}
          </h3>

        </div>

      </div>

    </div>
  )
}

export default CardResumo