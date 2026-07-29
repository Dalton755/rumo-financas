import Card from "./Card";
import "./CardResumo.css";
import { MoreVertical } from "lucide-react";

export default function CardResumo({
  titulo,
  subtitulo,
  valor,
  icone,
  badge,
  cor = "blue"
}) {

  return (

    <Card className="rumo-resumo-card">

      <div className="rumo-resumo-topo">

        <div className={`rumo-resumo-icon ${cor}`}>

          {icone}

        </div>

        <button className="rumo-card-menu">

          <MoreVertical size={18} />

        </button>

      </div>

      <div className="rumo-resumo-info">

        <h3>

          {titulo}

        </h3>

        {subtitulo && (

          <p>

            {subtitulo}

          </p>

        )}

      </div>

      <div className="rumo-resumo-valor">

        {valor}

      </div>

      {badge && (

        <div className="rumo-resumo-badge">

          {badge}

        </div>

      )}

    </Card>

  )

}