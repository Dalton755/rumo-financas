import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  Crown,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import "./PremiumFeaturePreview.css";

export default function PremiumFeaturePreview({
  titulo,
  subtitulo,
  descricao,
  beneficios = [],
  previewTitulo = "Veja o que você vai desbloquear",
  previewDescricao,
  previewCards = [],
  insightTitulo = "Insight do Rumo",
  insightTexto =
    "O Premium transforma seus dados em informações práticas para ajudar você a tomar decisões melhores.",
  ctaTexto = "Conhecer o Rumo Premium",
  onCta,
}) {
  const navigate = useNavigate();

  function clicarCta() {
    if (onCta) {
      onCta();
      return;
    }

    navigate("/premium");
  }

  return (
    <section className="premium-preview">
      <div className="premium-preview-grid">
        <div className="premium-preview-conteudo">
          <span className="premium-preview-badge">
            <Crown size={15} />
            Rumo Premium
          </span>

          <div className="premium-preview-lock">
            <LockKeyhole size={26} />
          </div>

          <h1>{titulo}</h1>

          <h2>{subtitulo}</h2>

          <p className="premium-preview-descricao">
            {descricao}
          </p>

          {beneficios.length > 0 && (
            <div className="premium-preview-beneficios">
              {beneficios.map((beneficio, index) => (
                <div
                  className="premium-preview-beneficio"
                  key={`${beneficio}-${index}`}
                >
                  <CheckCircle2 size={19} />
                  <span>{beneficio}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="premium-preview-cta"
            onClick={clicarCta}
          >
            <Sparkles size={18} />
            {ctaTexto}
            <ArrowRight size={18} />
          </button>

          <span className="premium-preview-observacao">
            Seu plano Gratuito continuará funcionando normalmente.
          </span>
        </div>

        <div className="premium-preview-visual">
          <div className="premium-preview-browser">
            <div className="premium-preview-browser-top">
              <div className="premium-preview-browser-dots">
                <span />
                <span />
                <span />
              </div>

              <span className="premium-preview-browser-label">
                PRÉVIA DO RECURSO
              </span>
            </div>

            <div className="premium-preview-browser-body">
              <div className="premium-preview-browser-header">
                <div>
                  <span>RUMO PREMIUM</span>

                  <h3>{previewTitulo}</h3>

                  {previewDescricao && (
                    <p>{previewDescricao}</p>
                  )}
                </div>

                <div className="premium-preview-mini-badge">
                  PRO
                </div>
              </div>

              <div className="premium-preview-cards">
                {previewCards.map((card, index) => (
                  <article
                    className={`premium-preview-card ${
                      card.destaque ? "destaque" : ""
                    }`}
                    key={`${card.titulo}-${index}`}
                  >
                    <span>{card.titulo}</span>

                    <strong>{card.valor}</strong>

                    {card.descricao && (
                      <p>{card.descricao}</p>
                    )}

                    {typeof card.progresso === "number" && (
                      <div className="premium-preview-progress">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, card.progresso)
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="premium-preview-insight">
                <div className="premium-preview-insight-icon">
                  <Sparkles size={18} />
                </div>

                <div>
                  <span>
                    {insightTitulo.toUpperCase()}
                  </span>

                  <p>{insightTexto}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-preview-blur premium-preview-blur-1" />
          <div className="premium-preview-blur premium-preview-blur-2" />
        </div>
      </div>
    </section>
  );
}
