import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarClock,
  Check,
  CircleAlert,
  CircleDollarSign,
  PiggyBank,
  Repeat2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import RumoIaAssistente from "../components/inteligencia/RumoIaAssistente";
import { useToast } from "../context/ToastContext";

import {
  obterInteligenciaFinanceira,
} from "../services/inteligencia";
import {
  detectarPadroesFinanceiros,
} from "../services/motoresInteligentes";
import {
  confirmarPadraoInteligente,
  ignorarPadraoInteligente,
} from "../services/acoesMotoresInteligentes";
import {
  obterPrimeiroRiscoSaldo,
  obterProjecoesInteligentes,
} from "../services/projecoesInteligentes";

import "./Inteligencia.css";
import "./InteligenciaMotores.css";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatarPercentual(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "Sem comparação";
  }

  return `${Math.abs(Number(valor)).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}%`;
}

function formatarData(valor) {
  if (!valor) return "";

  return new Date(
    `${valor}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

function textoFrequencia(valor) {
  return valor === "semanal"
    ? "toda semana"
    : "todo mês";
}

function Inteligencia() {
  const { showToast } = useToast();

  const [dados, setDados] = useState(null);
  const [padroes, setPadroes] = useState([]);
  const [riscoSaldo, setRiscoSaldo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [processandoPadrao, setProcessandoPadrao] =
    useState("");

  async function carregarInteligencia() {
    try {
      setCarregando(true);
      setErro("");

      const [
        respostaInteligencia,
        respostaPadroes,
        respostaProjecoes,
      ] = await Promise.allSettled([
        obterInteligenciaFinanceira(),
        detectarPadroesFinanceiros({
          diasHistorico: 180,
          limite: 5,
        }),
        obterProjecoesInteligentes(),
      ]);

      if (
        respostaInteligencia.status !==
        "fulfilled"
      ) {
        throw respostaInteligencia.reason;
      }

      setDados(
        respostaInteligencia.value
      );

      setPadroes(
        respostaPadroes.status ===
          "fulfilled"
          ? respostaPadroes.value || []
          : []
      );

      setRiscoSaldo(
        respostaProjecoes.status ===
          "fulfilled"
          ? obterPrimeiroRiscoSaldo(
              respostaProjecoes.value
            )
          : null
      );
    } catch (error) {
      console.error(error);

      setErro(
        "Não foi possível carregar sua análise financeira."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarInteligencia();

    function atualizar() {
      carregarInteligencia();
    }

    window.addEventListener(
      "rumo:dados-atualizados",
      atualizar
    );

    return () => {
      window.removeEventListener(
        "rumo:dados-atualizados",
        atualizar
      );
    };
  }, []);

  async function confirmarPadrao(padrao) {
    try {
      setProcessandoPadrao(
        padrao.chave
      );

      await confirmarPadraoInteligente(
        padrao
      );

      setPadroes((atuais) =>
        atuais.filter(
          (item) =>
            item.chave !== padrao.chave
        )
      );

      showToast(
        "Rumo aprendeu",
        padrao.tipo === "receita"
          ? "Essa entrada recorrente já pode participar das próximas projeções."
          : "Esse gasto recorrente já entrou no seu planejamento.",
        "success"
      );

      const projecoes =
        await obterProjecoesInteligentes()
          .catch(() => null);

      setRiscoSaldo(
        projecoes
          ? obterPrimeiroRiscoSaldo(
              projecoes
            )
          : null
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Não foi possível aprender esse padrão",
        error.message ||
          "Tente novamente.",
        "danger"
      );
    } finally {
      setProcessandoPadrao("");
    }
  }

  async function ignorarPadrao(padrao) {
    try {
      setProcessandoPadrao(
        padrao.chave
      );

      await ignorarPadraoInteligente(
        padrao
      );

      setPadroes((atuais) =>
        atuais.filter(
          (item) =>
            item.chave !== padrao.chave
        )
      );

      showToast(
        "Entendido",
        "O Rumo não vai tratar esse lançamento como recorrente.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Não foi possível salvar sua escolha",
        error.message ||
          "Tente novamente.",
        "danger"
      );
    } finally {
      setProcessandoPadrao("");
    }
  }

  const insights = useMemo(() => {
    if (!dados) return [];

    const lista = [];

    const variacaoDespesas =
      dados.comparacao
        ?.variacao_despesas_pct;

    const variacaoReceitas =
      dados.comparacao
        ?.variacao_receitas_pct;

    const taxaEconomia =
      dados.mes_atual
        ?.taxa_economia_pct;

    const categoria =
      dados.maior_categoria_despesa;

    const futuro =
      dados.proximos_30_dias;

    if (
      variacaoDespesas !== null &&
      variacaoDespesas !== undefined
    ) {
      lista.push({
        tipo:
          variacaoDespesas <= 0
            ? "positivo"
            : "atencao",
        titulo:
          variacaoDespesas <= 0
            ? "Seus gastos diminuíram"
            : "Seus gastos aumentaram",
        texto:
          `Suas despesas ${
            variacaoDespesas <= 0
              ? "caíram"
              : "subiram"
          } ${formatarPercentual(
            variacaoDespesas
          )} em relação ao mesmo período do mês passado.`,
      });
    }

    if (
      variacaoReceitas !== null &&
      variacaoReceitas !== undefined
    ) {
      lista.push({
        tipo:
          variacaoReceitas >= 0
            ? "positivo"
            : "atencao",
        titulo:
          variacaoReceitas >= 0
            ? "Suas receitas cresceram"
            : "Suas receitas diminuíram",
        texto:
          `Suas entradas ${
            variacaoReceitas >= 0
              ? "aumentaram"
              : "diminuíram"
          } ${formatarPercentual(
            variacaoReceitas
          )} em relação ao mesmo período do mês passado.`,
      });
    }

    if (
      taxaEconomia !== null &&
      taxaEconomia !== undefined
    ) {
      lista.push({
        tipo:
          taxaEconomia > 0
            ? "positivo"
            : "atencao",
        titulo:
          taxaEconomia > 0
            ? "Você está preservando parte da renda"
            : "As despesas superaram as receitas",
        texto:
          taxaEconomia > 0
            ? `Sua taxa de economia no período está em ${formatarPercentual(
                taxaEconomia
              )}.`
            : "Seu saldo do período está negativo. Vale revisar os maiores gastos.",
      });
    }

    if (categoria?.categoria) {
      lista.push({
        tipo: "informacao",
        titulo:
          `${categoria.categoria} é seu maior gasto`,
        texto:
          `Essa categoria soma ${formatarMoeda(
            categoria.valor
          )} no mês atual.`,
      });
    }

    if (
      Number(
        futuro?.receitas_previstas || 0
      ) !== 0 ||
      Number(
        futuro?.despesas_previstas || 0
      ) !== 0
    ) {
      lista.push({
        tipo:
          Number(
            futuro?.saldo_previsto || 0
          ) >= 0
            ? "informacao"
            : "atencao",
        titulo: "Próximos 30 dias",
        texto:
          `Há ${formatarMoeda(
            futuro?.receitas_previstas
          )} em receitas e ${formatarMoeda(
            futuro?.despesas_previstas
          )} em despesas previstas.`,
      });
    }

    return lista;
  }, [dados]);

  if (carregando) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="inteligencia-loading">
            <BrainCircuit size={36} />
            <h2>Analisando suas finanças...</h2>
            <p>
              O Rumo está procurando padrões,
              riscos e próximos passos nos seus dados.
            </p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (erro) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="inteligencia-erro">
            <h2>
              Não foi possível gerar sua análise.
            </h2>
            <p>{erro}</p>
            <button
              type="button"
              onClick={carregarInteligencia}
            >
              Tentar novamente
            </button>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  const mesAtual =
    dados?.mes_atual || {};

  const comparacao =
    dados?.comparacao || {};

  const variacaoDespesas =
    comparacao.variacao_despesas_pct;

  const variacaoReceitas =
    comparacao.variacao_receitas_pct;

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          titulo="Rumo IA"
          subtitulo="O Rumo observa seus padrões, antecipa riscos e sugere o próximo passo."
        >
          <span className="inteligencia-premium-badge">
            <Sparkles size={15} />
            Inteligência ativa
          </span>
        </PageHeader>

        <section className="inteligencia-motores">
          {riscoSaldo && (
            <article className="inteligencia-motor-risco">
              <div className="inteligencia-motor-risco-copy">
                <div className="inteligencia-motor-risco-icone">
                  <CircleAlert size={20} />
                </div>

                <div>
                  <span>Rumo antecipou um risco</span>
                  <h3>
                    Seu saldo pode ficar negativo em {formatarData(
                      riscoSaldo.data
                    )}
                  </h3>
                  <p>
                    Mantendo o cenário atual, podem faltar aproximadamente {formatarMoeda(
                      riscoSaldo.falta
                    )}. Vale agir antes dessa data.
                  </p>
                </div>
              </div>

              <Link to="/projecoes">
                Ver cenário
                <ArrowRight size={14} />
              </Link>
            </article>
          )}

          {padroes.length > 0 && (
            <section className="inteligencia-padroes">
              <div className="inteligencia-padroes-head">
                <div>
                  <BrainCircuit size={20} />
                </div>

                <div>
                  <span>O Rumo percebeu</span>
                  <h2>
                    Confirme uma vez. Depois eu acompanho.
                  </h2>
                </div>
              </div>

              <div className="inteligencia-padroes-lista">
                {padroes.map((padrao) => {
                  const processando =
                    processandoPadrao ===
                    padrao.chave;

                  return (
                    <article
                      className="inteligencia-padrao-card"
                      key={padrao.chave}
                    >
                      <div>
                        <span className="inteligencia-padrao-kicker">
                          <Repeat2 size={13} />
                          {padrao.quantidadeOcorrencias} vezes detectado
                        </span>

                        <h3>
                          {padrao.tipo === "receita"
                            ? `Parece que você recebe ${formatarMoeda(
                                padrao.valorEstimado
                              )} ${textoFrequencia(
                                padrao.frequencia
                              )}.`
                            : `Parece que você paga ${formatarMoeda(
                                padrao.valorEstimado
                              )} ${textoFrequencia(
                                padrao.frequencia
                              )}.`}
                        </h3>

                        <p>
                          {padrao.descricao}
                          {padrao.proximaData
                            ? ` • Próxima data provável: ${formatarData(
                                padrao.proximaData
                              )}`
                            : ""}
                        </p>
                      </div>

                      <div className="inteligencia-padrao-acoes">
                        <button
                          type="button"
                          className="inteligencia-padrao-ignorar"
                          disabled={processando}
                          onClick={() =>
                            ignorarPadrao(
                              padrao
                            )
                          }
                        >
                          <X size={13} />
                          Não é recorrente
                        </button>

                        <button
                          type="button"
                          className="inteligencia-padrao-confirmar"
                          disabled={processando}
                          onClick={() =>
                            confirmarPadrao(
                              padrao
                            )
                          }
                        >
                          <Check size={13} />
                          Sim, acompanhar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </section>

        <section className="inteligencia-resumo-grid">
          <article className="inteligencia-metrica">
            <div className="inteligencia-metrica-topo">
              <div className="inteligencia-metrica-icone receita">
                <ArrowUpRight size={22} />
              </div>
              <span>Receitas do mês</span>
            </div>
            <strong>
              {formatarMoeda(
                mesAtual.receitas
              )}
            </strong>
            <div
              className={`inteligencia-variacao ${
                Number(variacaoReceitas) >= 0
                  ? "positiva"
                  : "negativa"
              }`}
            >
              {Number(variacaoReceitas) >= 0
                ? <TrendingUp size={15} />
                : <TrendingDown size={15} />}
              {variacaoReceitas === null ||
              variacaoReceitas === undefined
                ? "Sem comparação"
                : `${formatarPercentual(
                    variacaoReceitas
                  )} vs. mês anterior`}
            </div>
          </article>

          <article className="inteligencia-metrica">
            <div className="inteligencia-metrica-topo">
              <div className="inteligencia-metrica-icone despesa">
                <ArrowDownRight size={22} />
              </div>
              <span>Despesas do mês</span>
            </div>
            <strong>
              {formatarMoeda(
                mesAtual.despesas
              )}
            </strong>
            <div
              className={`inteligencia-variacao ${
                Number(variacaoDespesas) <= 0
                  ? "positiva"
                  : "negativa"
              }`}
            >
              {Number(variacaoDespesas) <= 0
                ? <TrendingDown size={15} />
                : <TrendingUp size={15} />}
              {variacaoDespesas === null ||
              variacaoDespesas === undefined
                ? "Sem comparação"
                : `${formatarPercentual(
                    variacaoDespesas
                  )} vs. mês anterior`}
            </div>
          </article>

          <article className="inteligencia-metrica">
            <div className="inteligencia-metrica-topo">
              <div className="inteligencia-metrica-icone economia">
                <PiggyBank size={22} />
              </div>
              <span>Taxa de economia</span>
            </div>
            <strong>
              {mesAtual.taxa_economia_pct === null ||
              mesAtual.taxa_economia_pct === undefined
                ? "—"
                : formatarPercentual(
                    mesAtual.taxa_economia_pct
                  )}
            </strong>
            <div className="inteligencia-metrica-legenda">
              Quanto da sua receita permaneceu disponível.
            </div>
          </article>

          <article className="inteligencia-metrica">
            <div className="inteligencia-metrica-topo">
              <div className="inteligencia-metrica-icone saldo">
                <WalletCards size={22} />
              </div>
              <span>Saldo real das contas</span>
            </div>
            <strong>
              {formatarMoeda(
                dados?.saldo_real_contas
              )}
            </strong>
            <div className="inteligencia-metrica-legenda">
              Considerando somente movimentações realizadas.
            </div>
          </article>
        </section>

        <RumoIaAssistente dados={dados} />

        <section className="inteligencia-painel">
          <div className="inteligencia-painel-cabecalho">
            <div className="inteligencia-painel-icone">
              <BrainCircuit size={26} />
            </div>
            <div>
              <span>LEITURA DO RUMO</span>
              <h2>
                O que seus números estão dizendo
              </h2>
            </div>
          </div>

          <div className="inteligencia-insights">
            {insights.length > 0
              ? insights.map(
                  (insight, index) => (
                    <article
                      className={`inteligencia-insight ${insight.tipo}`}
                      key={`${insight.titulo}-${index}`}
                    >
                      <div className="inteligencia-insight-icon">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h3>{insight.titulo}</h3>
                        <p>{insight.texto}</p>
                      </div>
                    </article>
                  )
                )
              : (
                <div className="inteligencia-sem-insights">
                  Ainda não há movimentações suficientes para gerar uma leitura detalhada.
                </div>
              )}
          </div>
        </section>

        <section className="inteligencia-destaques">
          <article>
            <div>
              <span>
                Maior categoria de despesa
              </span>
              <strong>
                {dados?.maior_categoria_despesa
                  ?.categoria ||
                  "Sem despesas"}
              </strong>
            </div>
            <CircleDollarSign size={28} />
            <b>
              {formatarMoeda(
                dados?.maior_categoria_despesa
                  ?.valor
              )}
            </b>
          </article>

          <article>
            <div>
              <span>Saldo do mês</span>
              <strong>
                Resultado até hoje
              </strong>
            </div>
            <PiggyBank size={28} />
            <b>
              {formatarMoeda(
                mesAtual.saldo
              )}
            </b>
          </article>
        </section>
      </PageContainer>
    </MainLayout>
  );
}

export default Inteligencia;
