import Card from "./Card";
import "./CardResumo.css";

export default function CardResumo({
  titulo,
  subtitulo,
  valor,
  icone,
  badge,
  cor = "blue"
}) {
  return (
    <Card
      className={
        `rumo-resumo-card ${cor}`
      }
    >
      <div className="rumo-resumo-topo">
        <div
          className={
            `rumo-resumo-icon ${cor}`
          }
        >
          {icone}
        </div>

        {badge && (
          <span className="rumo-resumo-badge">
            {badge}
          </span>
        )}
      </div>

      <div className="rumo-resumo-info">
        <span className="rumo-resumo-titulo">
          {titulo}
        </span>

        <strong className="rumo-resumo-valor">
          {valor}
        </strong>

        {subtitulo && (
          <span className="rumo-resumo-subtitulo">
            {subtitulo}
          </span>
        )}
      </div>
    </Card>
  );
}
