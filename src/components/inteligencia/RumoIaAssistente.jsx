import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BrainCircuit,
  Calculator,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  listarProximosCompromissos,
} from "../../services/compromissos";

import {
  listarParcelasPlanejadasDividas,
} from "../../services/dividas";

import {
  avaliarCompra,
  gerarResumoRumo,
  montarContextoRumoIa,
  responderPerguntaRumo,
} from "../../services/rumoIaLocal";

import "./RumoIaAssistente.css";

const perguntasRapidas = [
  "Quanto posso gastar agora?",
  "Quais obrigações vencem esta semana?",
  "Tenho parcelas de dívidas próximas?",
  "Como estão meus gastos?",
  "Como estão os próximos 30 dias?",
];

function RumoIaAssistente({ dados }) {
  const [
    compromissos,
    setCompromissos,
  ] = useState([]);

  const [
    parcelasDividas,
    setParcelasDividas,
  ] = useState([]);

  const [
    pergunta,
    setPergunta,
  ] = useState("");

  const [
    resposta,
    setResposta,
  ] = useState(null);

  const [
    valorCompra,
    setValorCompra,
  ] = useState("");

  const [
    simulacao,
    setSimulacao,
  ] = useState(null);

  const [
    carregandoCompromissos,
    setCarregandoCompromissos,
  ] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregandoCompromissos(true);

        const [
          resultado,
          dividasPlanejadas,
        ] =
          await Promise.all([
            listarProximosCompromissos({
              dias: 30,
              limite: 100,
            }),
            listarParcelasPlanejadasDividas({
              dias: 30,
              incluirVencidas: true,
            }),
          ]);

        if (ativo) {
          setCompromissos(
            resultado || []
          );

          setParcelasDividas(
            dividasPlanejadas ||
            []
          );
        }
      } catch (error) {
        console.error(
          "[RUMO IA] Compromissos:",
          error
        );

        if (ativo) {
          setCompromissos([]);
          setParcelasDividas([]);
        }
      } finally {
        if (ativo) {
          setCarregandoCompromissos(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const contexto =
    useMemo(
      () =>
        montarContextoRumoIa(
          dados,
          compromissos,
          parcelasDividas
        ),
      [
        dados,
        compromissos,
        parcelasDividas,
      ]
    );

  const resumo =
    useMemo(
      () =>
        gerarResumoRumo(
          contexto
        ),
      [contexto]
    );

  function perguntar(texto = pergunta) {
    const perguntaFinal =
      String(texto || "").trim();

    if (!perguntaFinal) {
      return;
    }

    setPergunta(
      perguntaFinal
    );

    setResposta(
      responderPerguntaRumo(
        perguntaFinal,
        contexto
      )
    );
  }

  function simularCompra(event) {
    event?.preventDefault();

    setSimulacao(
      avaliarCompra(
        valorCompra,
        contexto
      )
    );
  }

  return (
    <section className="rumo-ia-area">
      <div className="rumo-ia-heading">
        <div>
          <span className="rumo-ia-kicker">
            <BrainCircuit size={15} />
            Rumo IA
          </span>

          <h2>
            Entenda antes de decidir
          </h2>

          <p>
            Respostas calculadas com seus dados financeiros atuais, sem depender de uma API externa.
          </p>
        </div>

        <span className="rumo-ia-local-badge">
          <ShieldCheck size={14} />
          Motor Rumo
        </span>
      </div>

      {resumo && (
        <article
          className={
            `rumo-ia-resumo ${resumo.tipo}`
          }
        >
          <span>
            Leitura de agora
          </span>

          <strong>
            {resumo.titulo}
          </strong>

          <p>
            {resumo.resposta}
          </p>
        </article>
      )}

      <div className="rumo-ia-grid">
        <article className="rumo-ia-card rumo-ia-chat">
          <div className="rumo-ia-card-head">
            <span className="rumo-ia-card-icon">
              <Sparkles size={18} />
            </span>

            <div>
              <strong>
                Pergunte ao Rumo
              </strong>

              <small>
                Saldo, gastos, receitas, dívidas, compromissos e projeções.
              </small>
            </div>
          </div>

          <div className="rumo-ia-sugestoes">
            {perguntasRapidas.map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() =>
                    perguntar(item)
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>

          <form
            className="rumo-ia-pergunta-form"
            onSubmit={(event) => {
              event.preventDefault();
              perguntar();
            }}
          >
            <input
              type="text"
              value={pergunta}
              onChange={(event) =>
                setPergunta(
                  event.target.value
                )
              }
              placeholder="Ex.: Posso gastar R$ 350 hoje?"
              aria-label="Pergunte ao Rumo"
            />

            <button
              type="submit"
              aria-label="Enviar pergunta"
            >
              <Send size={17} />
            </button>
          </form>

          <div
            className={
              resposta
                ? `rumo-ia-resposta ${resposta.tipo}`
                : "rumo-ia-resposta neutra"
            }
          >
            {resposta ? (
              <>
                <strong>
                  {resposta.titulo}
                </strong>

                <p>
                  {resposta.resposta}
                </p>
              </>
            ) : (
              <>
                <strong>
                  Pronto para analisar
                </strong>

                <p>
                  Escolha uma pergunta acima ou escreva do seu jeito.
                </p>
              </>
            )}
          </div>
        </article>

        <article className="rumo-ia-card rumo-ia-simulador">
          <div className="rumo-ia-card-head">
            <span className="rumo-ia-card-icon">
              <Calculator size={18} />
            </span>

            <div>
              <strong>
                Posso gastar?
              </strong>

              <small>
                Veja o impacto antes de fazer uma compra.
              </small>
            </div>
          </div>

          <form
            onSubmit={
              simularCompra
            }
          >
            <label htmlFor="rumo-ia-valor">
              Valor da compra
            </label>

            <div className="rumo-ia-money-input">
              <span>R$</span>

              <input
                id="rumo-ia-valor"
                type="text"
                inputMode="decimal"
                value={valorCompra}
                onChange={(event) =>
                  setValorCompra(
                    event.target.value
                  )
                }
                placeholder="0,00"
              />
            </div>

            <button
              type="submit"
              disabled={
                carregandoCompromissos
              }
            >
              {carregandoCompromissos
                ? "Atualizando cenário..."
                : "Simular impacto"
              }
            </button>
          </form>

          <div
            className={
              simulacao
                ? `rumo-ia-resposta ${simulacao.tipo}`
                : "rumo-ia-resposta neutra"
            }
          >
            {simulacao ? (
              <>
                <strong>
                  {simulacao.titulo}
                </strong>

                <p>
                  {simulacao.resposta}
                </p>
              </>
            ) : (
              <>
                <strong>
                  Antes de comprar
                </strong>

                <p>
                  O Rumo protege primeiro os compromissos identificados para os próximos 7 dias e mostra quanto sobra depois da simulação.
                </p>
              </>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default RumoIaAssistente;
