import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  AlertTriangle,
  BellRing,
  Check,
  CheckCheck,
  CircleAlert,
  CircleCheckBig,
  Info,
  Sparkles
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import {
  carregarCentralAlertas,
  marcarAlertaComoLido,
  marcarTodosComoLidos
} from "../services/alertas";

import "./Alertas.css";


function formatarMoeda(valor) {

  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


function formatarDataHora(valor) {

  if (!valor) {
    return "";
  }

  return new Date(
    valor
  ).toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


function obterIcone(nivel) {

  switch (nivel) {

    case "critico":
      return <CircleAlert size={22} />;

    case "atencao":
      return <AlertTriangle size={22} />;

    case "positivo":
      return <CircleCheckBig size={22} />;

    default:
      return <Info size={22} />;

  }

}


function montarDetalhe(alerta) {

  const dados =
    alerta?.dados || {};


  if (
    alerta?.tipo === "ORCAMENTO"
  ) {

    const percentual =
      Number(
        dados.percentual || 0
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );

    return (
      <>
        <strong>
          {percentual}% do orçamento utilizado
        </strong>

        <span>
          {
            formatarMoeda(
              dados.gasto
            )
          }{" "}
          gastos de{" "}
          {
            formatarMoeda(
              dados.limite
            )
          }
        </span>
      </>
    );

  }


  if (
    alerta?.tipo === "PROJECAO"
  ) {

    return (
      <>
        <strong>
          Saldo projetado:{" "}
          {
            formatarMoeda(
              dados.saldo_projetado
            )
          }
        </strong>

        {
          dados.data && (
            <span>
              Previsão para{" "}
              {
                new Date(
                  `${dados.data}T12:00:00`
                ).toLocaleDateString(
                  "pt-BR"
                )
              }
            </span>
          )
        }
      </>
    );

  }


  if (
    alerta?.tipo ===
    "MOVIMENTACAO_FUTURA"
  ) {

    return (
      <>
        <strong>
          {
            dados.quantidade || 0
          }{" "}
          {
            Number(
              dados.quantidade || 0
            ) === 1
              ? "despesa prevista"
              : "despesas previstas"
          }
        </strong>

        <span>
          Total:{" "}
          {
            formatarMoeda(
              dados.valor_total
            )
          }
        </span>
      </>
    );

  }


  return null;

}


function Alertas() {

  const navigate =
    useNavigate();

  const [
    alertas,
    setAlertas
  ] = useState([]);

  const [
    carregando,
    setCarregando
  ] = useState(true);

  const [
    erro,
    setErro
  ] = useState("");

  const [
    processando,
    setProcessando
  ] = useState(false);


  useEffect(() => {

    carregarAlertas();

  }, []);


  async function carregarAlertas() {

    try {

      setCarregando(true);
      setErro("");

      const resultado =
        await carregarCentralAlertas();

      setAlertas(
        resultado
      );

    } catch (error) {

      console.error(
        "[RUMO ALERTAS]",
        error
      );

      setErro(
        "Não foi possível carregar seus alertas."
      );

    } finally {

      setCarregando(false);

    }

  }


  async function marcarComoLido(
    alerta
  ) {

    if (
      !alerta ||
      alerta.lido
    ) {
      return;
    }

    try {

      const atualizado =
        await marcarAlertaComoLido(
          alerta.id
        );

      setAlertas(
        (atuais) =>
          atuais.map(
            (item) =>
              item.id ===
              atualizado.id
                ? atualizado
                : item
          )
      );

    } catch (error) {

      console.error(
        "[RUMO ALERTAS] Marcar como lido:",
        error
      );

    }

  }


  async function abrirAlerta(
    alerta
  ) {

    try {

      if (!alerta.lido) {

        await marcarComoLido(
          alerta
        );

      }

      if (
        alerta.rota
      ) {

        navigate(
          alerta.rota
        );

      }

    } catch (error) {

      console.error(
        error
      );

    }

  }


  async function marcarTodos() {

    try {

      setProcessando(true);

      await marcarTodosComoLidos();

      setAlertas(
        (atuais) =>
          atuais.map(
            (item) => ({
              ...item,
              lido: true
            })
          )
      );

    } catch (error) {

      console.error(
        "[RUMO ALERTAS] Marcar todos:",
        error
      );

    } finally {

      setProcessando(false);

    }

  }


  const resumo =
    useMemo(
      () => {

        const naoLidos =
          alertas.filter(
            (alerta) =>
              !alerta.lido
          ).length;

        const criticos =
          alertas.filter(
            (alerta) =>
              alerta.nivel ===
              "critico"
          ).length;

        const atencao =
          alertas.filter(
            (alerta) =>
              alerta.nivel ===
              "atencao"
          ).length;

        return {
          total:
            alertas.length,

          naoLidos,

          criticos,

          atencao
        };

      },
      [alertas]
    );


  return (

    <MainLayout>

      <PageContainer>

        <PageHeader
          titulo="Alertas Inteligentes"
          subtitulo="O Rumo acompanha seus números e destaca automaticamente situações que merecem sua atenção."
        >

          <div className="alertas-header-acoes">

            <span className="alertas-premium-badge">

              <Sparkles size={15} />

              Premium

            </span>


            {
              resumo.naoLidos > 0 && (

                <button
                  type="button"
                  className="alertas-marcar-todos"
                  onClick={
                    marcarTodos
                  }
                  disabled={
                    processando
                  }
                >

                  <CheckCheck size={16} />

                  {
                    processando
                      ? "Marcando..."
                      : "Marcar todos como lidos"
                  }

                </button>

              )
            }

          </div>

        </PageHeader>


        {
          carregando && (

            <div className="alertas-estado">

              Analisando suas finanças...

            </div>

          )
        }


        {
          !carregando &&
          erro && (

            <div className="alertas-estado erro">

              <strong>
                Não foi possível carregar
              </strong>

              <span>
                {erro}
              </span>

              <button
                type="button"
                onClick={
                  carregarAlertas
                }
              >
                Tentar novamente
              </button>

            </div>

          )
        }


        {
          !carregando &&
          !erro && (

            <>

              <section className="alertas-resumo">

                <article>

                  <div className="alertas-resumo-icone total">

                    <BellRing size={22} />

                  </div>

                  <div>

                    <span>
                      Alertas ativos
                    </span>

                    <strong>
                      {resumo.total}
                    </strong>

                  </div>

                </article>


                <article>

                  <div className="alertas-resumo-icone novos">

                    <Info size={22} />

                  </div>

                  <div>

                    <span>
                      Não lidos
                    </span>

                    <strong>
                      {resumo.naoLidos}
                    </strong>

                  </div>

                </article>


                <article>

                  <div className="alertas-resumo-icone atencao">

                    <AlertTriangle size={22} />

                  </div>

                  <div>

                    <span>
                      Atenção
                    </span>

                    <strong>
                      {resumo.atencao}
                    </strong>

                  </div>

                </article>


                <article>

                  <div className="alertas-resumo-icone critico">

                    <CircleAlert size={22} />

                  </div>

                  <div>

                    <span>
                      Críticos
                    </span>

                    <strong>
                      {resumo.criticos}
                    </strong>

                  </div>

                </article>

              </section>


              <section className="alertas-painel">

                <div className="alertas-painel-cabecalho">

                  <div>

                    <span>
                      Central de alertas
                    </span>

                    <h2>
                      O Rumo está de olho
                    </h2>

                    <p>
                      Os alertas são atualizados automaticamente conforme sua situação financeira muda.
                    </p>

                  </div>

                </div>


                {
                  alertas.length === 0
                    ? (

                      <div className="alertas-vazio">

                        <CircleCheckBig
                          size={36}
                        />

                        <strong>
                          Tudo tranquilo por enquanto
                        </strong>

                        <span>
                          Nenhuma situação importante exige sua atenção neste momento.
                        </span>

                      </div>

                    )
                    : (

                      <div className="alertas-lista">

                        {
                          alertas.map(
                            (alerta) => (

                              <article
                                key={
                                  alerta.id
                                }
                                className={
                                  `alerta-item ${alerta.nivel} ${
                                    alerta.lido
                                      ? "lido"
                                      : "novo"
                                  }`
                                }
                              >

                                <div
                                  className={
                                    `alerta-item-icone ${alerta.nivel}`
                                  }
                                >

                                  {
                                    obterIcone(
                                      alerta.nivel
                                    )
                                  }

                                </div>


                                <div className="alerta-item-conteudo">

                                  <div className="alerta-item-topo">

                                    <div>

                                      <div className="alerta-item-titulo-linha">

                                        <h3>
                                          {
                                            alerta.titulo
                                          }
                                        </h3>

                                        {
                                          !alerta.lido && (

                                            <span className="alerta-novo-badge">
                                              NOVO
                                            </span>

                                          )
                                        }

                                      </div>

                                      <p>
                                        {
                                          alerta.descricao
                                        }
                                      </p>

                                    </div>

                                  </div>


                                  <div className="alerta-item-detalhes">

                                    {
                                      montarDetalhe(
                                        alerta
                                      )
                                    }

                                  </div>


                                  <div className="alerta-item-rodape">

                                    <span>
                                      Atualizado em{" "}
                                      {
                                        formatarDataHora(
                                          alerta.updated_at
                                        )
                                      }
                                    </span>

                                    <div>

                                      {
                                        !alerta.lido && (

                                          <button
                                            type="button"
                                            className="alerta-btn-secundario"
                                            onClick={
                                              () =>
                                                marcarComoLido(
                                                  alerta
                                                )
                                            }
                                          >

                                            <Check size={15} />

                                            Marcar como lido

                                          </button>

                                        )
                                      }


                                      {
                                        alerta.rota && (

                                          <button
                                            type="button"
                                            className="alerta-btn-principal"
                                            onClick={
                                              () =>
                                                abrirAlerta(
                                                  alerta
                                                )
                                            }
                                          >

                                            Ver detalhes

                                          </button>

                                        )
                                      }

                                    </div>

                                  </div>

                                </div>

                              </article>

                            )
                          )
                        }

                      </div>

                    )
                }

              </section>

            </>

          )
        }

      </PageContainer>

    </MainLayout>

  );

}


export default Alertas;