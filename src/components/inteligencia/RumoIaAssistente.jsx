import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BrainCircuit,
  Calculator,
  CheckCircle2,
  CreditCard,
  Flag,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import {
  listarProximosCompromissos,
} from "../../services/compromissos";

import {
  listarParcelasPlanejadasDividas,
} from "../../services/dividas";

import {
  listarFaturasPendentesCartoes,
} from "../../services/cartoes";

import {
  executarAcaoRumo,
  interpretarAcaoRumo,
  listarOpcoesRumoAcoes,
} from "../../services/rumoAcoesLocal";

import MoneyCalculatorInput from "../ui/MoneyCalculatorInput";

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
  "Como está minha próxima fatura?",
  "Como estão meus gastos?",
  "Como estão os próximos 30 dias?",
];


function formatarMoeda(
  valor
) {
  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}


function RumoIaAssistente({
  dados,
  onAtualizou,
}) {
  const [
    compromissos,
    setCompromissos,
  ] = useState([]);

  const [
    parcelasDividas,
    setParcelasDividas,
  ] = useState([]);

  const [
    faturasCartao,
    setFaturasCartao,
  ] = useState([]);

  const [
    opcoesAcoes,
    setOpcoesAcoes,
  ] = useState({
    contas: [],
    categorias: [],
    cartoes: [],
  });

  const [
    pergunta,
    setPergunta,
  ] = useState("");

  const [
    resposta,
    setResposta,
  ] = useState(null);

  const [
    acaoPendente,
    setAcaoPendente,
  ] = useState(null);

  const [
    executandoAcao,
    setExecutandoAcao,
  ] = useState(false);

  const [
    feedbackAcao,
    setFeedbackAcao,
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


  async function carregarAuxiliares() {
    try {
      setCarregandoCompromissos(
        true
      );

      const [
        resultado,
        dividasPlanejadas,
        faturasPendentes,
        opcoes,
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

          listarFaturasPendentesCartoes({
            dias: 30,
            incluirVencidas: true,
          }),

          listarOpcoesRumoAcoes(),
        ]);

      setCompromissos(
        resultado || []
      );

      setParcelasDividas(
        dividasPlanejadas || []
      );

      setFaturasCartao(
        faturasPendentes || []
      );

      setOpcoesAcoes(
        opcoes || {
          contas: [],
          categorias: [],
          cartoes: [],
        }
      );

    } catch (error) {
      console.error(
        "[RUMO IA] Contexto auxiliar:",
        error
      );

      setCompromissos([]);
      setParcelasDividas([]);
      setFaturasCartao([]);

    } finally {
      setCarregandoCompromissos(
        false
      );
    }
  }


  useEffect(() => {
    carregarAuxiliares();
  }, []);


  const contexto =
    useMemo(
      () =>
        montarContextoRumoIa(
          dados,
          compromissos,
          parcelasDividas,
          faturasCartao
        ),
      [
        dados,
        compromissos,
        parcelasDividas,
        faturasCartao,
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


  const categoriasAcao =
    useMemo(
      () =>
        opcoesAcoes.categorias
          .filter(
            (categoria) =>
              categoria.tipo ===
              (
                acaoPendente?.tipo ===
                "receita"
                  ? "receita"
                  : "despesa"
              )
          ),
      [
        opcoesAcoes.categorias,
        acaoPendente,
      ]
    );


  const acaoValida =
    useMemo(
      () => {
        if (!acaoPendente) {
          return false;
        }

        const valorOk =
          Number(
            acaoPendente.valor
          ) > 0;

        const descricaoOk =
          Boolean(
            acaoPendente.descricao
              ?.trim()
          );

        if (
          !valorOk ||
          !descricaoOk
        ) {
          return false;
        }

        if (
          acaoPendente.tipo ===
          "despesa" ||
          acaoPendente.tipo ===
          "receita"
        ) {
          return Boolean(
            acaoPendente.conta_id &&
            acaoPendente.categoria_id &&
            acaoPendente.data
          );
        }

        if (
          acaoPendente.tipo ===
          "compra_cartao"
        ) {
          return Boolean(
            acaoPendente.cartao_id &&
            acaoPendente.categoria_id &&
            acaoPendente.data &&
            Number(
              acaoPendente.parcelas
            ) >= 1
          );
        }

        if (
          acaoPendente.tipo ===
          "meta"
        ) {
          return true;
        }

        return false;
      },
      [acaoPendente]
    );


  function atualizarAcao(
    campo,
    valor
  ) {
    setAcaoPendente(
      (atual) => ({
        ...atual,
        [campo]: valor,
      })
    );
  }


  function processarEntrada(
    texto = pergunta
  ) {
    const entrada =
      String(
        texto || ""
      ).trim();

    if (!entrada) {
      return;
    }

    setPergunta(
      entrada
    );

    setFeedbackAcao(
      null
    );

    const acao =
      interpretarAcaoRumo(
        entrada,
        opcoesAcoes
      );

    if (acao) {
      setAcaoPendente(
        acao
      );

      setResposta(
        null
      );

      return;
    }

    setAcaoPendente(
      null
    );

    setResposta(
      responderPerguntaRumo(
        entrada,
        contexto
      )
    );
  }


  async function confirmarAcao() {
    if (
      !acaoPendente ||
      !acaoValida
    ) {
      return;
    }

    try {
      setExecutandoAcao(
        true
      );

      setFeedbackAcao(
        null
      );

      const resultado =
        await executarAcaoRumo(
          acaoPendente
        );

      setFeedbackAcao({
        tipo:
          "sucesso",

        titulo:
          resultado.titulo,

        texto:
          `${acaoPendente.descricao} • ${formatarMoeda(
            acaoPendente.valor
          )}`,
      });

      setResposta(
        null
      );

      setPergunta("");
      setAcaoPendente(
        null
      );

      await Promise.all([
        carregarAuxiliares(),
        onAtualizou
          ? onAtualizou()
          : Promise.resolve(),
      ]);

    } catch (error) {
      console.error(
        "[RUMO IA] Executar ação:",
        error
      );

      setFeedbackAcao({
        tipo:
          "erro",

        titulo:
          "Não foi possível concluir",

        texto:
          error?.message ||
          "Revise os dados e tente novamente.",
      });

    } finally {
      setExecutandoAcao(
        false
      );
    }
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
            Entenda e aja pelo mesmo campo
          </h2>

          <p>
            Pergunte sobre suas finanças ou descreva uma ação. O Rumo interpreta, prepara e só executa depois da sua confirmação.
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
                Fale com o Rumo
              </strong>

              <small>
                Pergunte ou registre algo em linguagem natural.
              </small>
            </div>
          </div>


          <div className="rumo-ia-command-examples">
            <span>
              Agora também entende ações:
            </span>

            <p>
              “Gastei R$ 50 de gasolina hoje” • “Recebi R$ 850 da Shopee” • “Comprei R$ 600 no cartão em 3x” • “Quero guardar R$ 5.000”
            </p>
          </div>


          <div className="rumo-ia-sugestoes">
            {perguntasRapidas.map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() =>
                    processarEntrada(
                      item
                    )
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

              processarEntrada();
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
              placeholder="Ex.: Gastei R$ 50 de gasolina hoje"
              aria-label="Fale com o Rumo"
            />

            <button
              type="submit"
              aria-label="Enviar ao Rumo"
            >
              <Send size={17} />
            </button>
          </form>


          {
            acaoPendente && (
              <div className="rumo-ia-action-review">

                <div className="rumo-ia-action-head">
                  <div>
                    <span>
                      ENTENDI ASSIM
                    </span>

                    <strong>
                      {
                        acaoPendente
                          .rotulo
                      }
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="rumo-ia-action-close"
                    onClick={() =>
                      setAcaoPendente(
                        null
                      )
                    }
                    aria-label="Cancelar ação"
                  >
                    <X size={16} />
                  </button>
                </div>


                <div className="rumo-ia-action-fields">

                  <label className="rumo-ia-action-field full">
                    <span>
                      Descrição
                    </span>

                    <input
                      type="text"
                      value={
                        acaoPendente
                          .descricao
                      }
                      onChange={(
                        event
                      ) =>
                        atualizarAcao(
                          "descricao",
                          event.target.value
                        )
                      }
                    />
                  </label>


                  <label className="rumo-ia-action-field">
                    <span>
                      Valor
                    </span>

                    <MoneyCalculatorInput
                      value={
                        acaoPendente
                          .valor
                      }
                      onChange={(
                        valor
                      ) =>
                        atualizarAcao(
                          "valor",
                          valor
                        )
                      }
                      placeholder="R$ 0,00"
                      ariaLabel="Valor da ação"
                      className="rumo-ia-action-money"
                    />
                  </label>


                  {
                    acaoPendente.tipo !==
                    "meta" && (
                      <label className="rumo-ia-action-field">
                        <span>
                          Data
                        </span>

                        <input
                          type="date"
                          value={
                            acaoPendente
                              .data ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            atualizarAcao(
                              "data",
                              event.target.value
                            )
                          }
                        />
                      </label>
                    )
                  }


                  {
                    (
                      acaoPendente.tipo ===
                      "despesa" ||
                      acaoPendente.tipo ===
                      "receita"
                    ) && (
                      <>
                        <label className="rumo-ia-action-field">
                          <span>
                            Conta
                          </span>

                          <select
                            value={
                              acaoPendente
                                .conta_id ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarAcao(
                                "conta_id",
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Selecione
                            </option>

                            {
                              opcoesAcoes
                                .contas
                                .map(
                                  (
                                    conta
                                  ) => (
                                    <option
                                      key={
                                        conta.id
                                      }
                                      value={
                                        conta.id
                                      }
                                    >
                                      {
                                        conta.banco
                                          ? `${conta.nome} • ${conta.banco}`
                                          : conta.nome
                                      }
                                    </option>
                                  )
                                )
                            }
                          </select>
                        </label>


                        <label className="rumo-ia-action-field">
                          <span>
                            Categoria
                          </span>

                          <select
                            value={
                              acaoPendente
                                .categoria_id ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarAcao(
                                "categoria_id",
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Selecione
                            </option>

                            {
                              categoriasAcao
                                .map(
                                  (
                                    categoria
                                  ) => (
                                    <option
                                      key={
                                        categoria.id
                                      }
                                      value={
                                        categoria.id
                                      }
                                    >
                                      {
                                        categoria.nome
                                      }
                                    </option>
                                  )
                                )
                            }
                          </select>
                        </label>
                      </>
                    )
                  }


                  {
                    acaoPendente.tipo ===
                    "compra_cartao" && (
                      <>
                        <label className="rumo-ia-action-field">
                          <span>
                            Cartão
                          </span>

                          <select
                            value={
                              acaoPendente
                                .cartao_id ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarAcao(
                                "cartao_id",
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Selecione
                            </option>

                            {
                              opcoesAcoes
                                .cartoes
                                .map(
                                  (
                                    cartao
                                  ) => (
                                    <option
                                      key={
                                        cartao.id
                                      }
                                      value={
                                        cartao.id
                                      }
                                    >
                                      {
                                        cartao.nome
                                      }
                                      {
                                        cartao.final_cartao
                                          ? ` •••• ${cartao.final_cartao}`
                                          : ""
                                      }
                                    </option>
                                  )
                                )
                            }
                          </select>
                        </label>


                        <label className="rumo-ia-action-field">
                          <span>
                            Categoria
                          </span>

                          <select
                            value={
                              acaoPendente
                                .categoria_id ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarAcao(
                                "categoria_id",
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Selecione
                            </option>

                            {
                              categoriasAcao
                                .map(
                                  (
                                    categoria
                                  ) => (
                                    <option
                                      key={
                                        categoria.id
                                      }
                                      value={
                                        categoria.id
                                      }
                                    >
                                      {
                                        categoria.nome
                                      }
                                    </option>
                                  )
                                )
                            }
                          </select>
                        </label>


                        <label className="rumo-ia-action-field">
                          <span>
                            Parcelas
                          </span>

                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={
                              acaoPendente
                                .parcelas ||
                              1
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarAcao(
                                "parcelas",
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </>
                    )
                  }


                  {
                    acaoPendente.tipo ===
                    "meta" && (
                      <>
                        <label className="rumo-ia-action-field">
                          <span>
                            Prazo
                          </span>

                          <input
                            type="date"
                            value={
                              acaoPendente
                                .prazo ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarAcao(
                                "prazo",
                                event.target.value
                              )
                            }
                          />
                        </label>


                        <label className="rumo-ia-action-field">
                          <span>
                            Conta vinculada
                          </span>

                          <select
                            value={
                              acaoPendente
                                .conta_id ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              atualizarAcao(
                                "conta_id",
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Nenhuma
                            </option>

                            {
                              opcoesAcoes
                                .contas
                                .map(
                                  (
                                    conta
                                  ) => (
                                    <option
                                      key={
                                        conta.id
                                      }
                                      value={
                                        conta.id
                                      }
                                    >
                                      {
                                        conta.nome
                                      }
                                    </option>
                                  )
                                )
                            }
                          </select>
                        </label>
                      </>
                    )
                  }

                </div>


                <div className="rumo-ia-action-summary">
                  {
                    acaoPendente.tipo ===
                    "compra_cartao"
                      ? <CreditCard size={16} />
                      : acaoPendente.tipo ===
                        "meta"
                        ? <Flag size={16} />
                        : <ReceiptText size={16} />
                  }

                  <span>
                    Nada foi salvo ainda. Confira os dados antes de confirmar.
                  </span>
                </div>


                <div className="rumo-ia-action-buttons">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setAcaoPendente(
                        null
                      )
                    }
                    disabled={
                      executandoAcao
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="primary"
                    onClick={
                      confirmarAcao
                    }
                    disabled={
                      !acaoValida ||
                      executandoAcao
                    }
                  >
                    <CheckCircle2 size={16} />

                    {
                      executandoAcao
                        ? "Confirmando..."
                        : "Confirmar ação"
                    }
                  </button>
                </div>

              </div>
            )
          }


          {
            feedbackAcao && (
              <div
                className={
                  `rumo-ia-action-feedback ${feedbackAcao.tipo}`
                }
              >
                <strong>
                  {
                    feedbackAcao
                      .titulo
                  }
                </strong>

                <span>
                  {
                    feedbackAcao
                      .texto
                  }
                </span>
              </div>
            )
          }


          {
            !acaoPendente && (
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
                ) : !feedbackAcao ? (
                  <>
                    <strong>
                      Pronto para analisar ou registrar
                    </strong>

                    <p>
                      Faça uma pergunta ou descreva algo que aconteceu com seu dinheiro.
                    </p>
                  </>
                ) : null}
              </div>
            )
          }

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
              {
                carregandoCompromissos
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
                  O Rumo protege primeiro todas as obrigações dos próximos 7 dias — incluindo dívidas e faturas — e mostra quanto sobra depois da simulação.
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
