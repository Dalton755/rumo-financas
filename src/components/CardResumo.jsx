function CardResumo({
  titulo,
  valor,
  icone
}) {

  return (

    <div className="col-md-6 col-lg-3 mb-3">

      <div className="card shadow-sm border-0 h-100">

        <div className="card-body text-center py-4">

          <div className="mb-3">
            {icone}
          </div>

          <h6 className="text-uppercase text-muted mb-3">
            {titulo}
          </h6>

          <h4 className="fw-bold text-nowrap">
            {valor}
          </h4>

        </div>

      </div>

    </div>

  )

}

export default CardResumo