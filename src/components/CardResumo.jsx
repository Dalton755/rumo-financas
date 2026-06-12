function CardResumo({
    titulo,
    valor
  }) {
  
    return (
  
      <div className="col-md-3">
  
        <div className="card shadow-sm">
  
          <div className="card-body">
  
            <h6 className="text-muted">
              {titulo}
            </h6>
  
            <h3>
              {valor}
            </h3>
  
          </div>
  
        </div>
  
      </div>
  
    )
  
  }
  
  export default CardResumo