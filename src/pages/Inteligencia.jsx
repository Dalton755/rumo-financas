import { useEffect, useMemo, useState } from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CircleDollarSign,
  PiggyBank,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import { obterInteligenciaFinanceira } from "../services/inteligencia";

import "./Inteligencia.css";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarPercentual(valor) {
  if (valor === null || valor === undefined) {
    return "Sem comparação";
  }

  return `${Math.abs(Number(valor)).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function Inteligencia() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarInteligencia();
  }, []);

  async function carregarInteligencia() {
    try {
      setCarregando(true);
      setErro("");

      const resultado =
        await obterInteligenciaFinanceira();

      setDados(resultado);
    } catch (error) {
      console.error(error);

      setErro(
        "Não foi possível carregar sua análise financeira."
      );
    } finally {
      setCarregando(false);
    }
  }

  const insights = useMemo(() => {
    if (!dados) {
      return [];
    }

    const lista = [];

    const variacaoDespesas =
      dados.comparacao?.variacao_despesas_pct;

    const variacaoReceitas =
      dados.comparacao?.variacao_receitas_pct;

    const taxaEconomia =
      dados.mes_atual?.taxa_economia_pct;

    const categoria =
      dados.maior_categoria_despesa;

    const futuro =
      dados.proximos_30_dias;

    if (
      variacaoDespesas !== null &&
      variacaoDespesas !== undefined
    ) {
      if (variacaoDespesas < 0) {
        lista.push({
          tipo: "positivo",
          titulo: "Seus gastos diminuíram",
          texto:
            `Suas despesas caíram ${formatarPercentual(
              variacaoDespesas
            )} em relação ao mesmo período do mês passado.`,
        });
      } else if (variacaoDespesas > 0) {
        lista.push({
          tipo: "atencao",
          titulo: "Seus gastos aumentaram",
          texto:
            `Suas despesas subiram ${formatarPercentual(
              variacaoDespesas
            )} em relação ao mesmo período do mês passado.`,
        });
      }
    }

    if (
      variacaoReceitas !== null &&
      variacaoReceitas !== undefined
    ) {
      if (variacaoReceitas < 0) {
        lista.push({
          tipo: "atencao",
          titulo: "Suas receitas diminuíram",
          texto:
            `Suas entradas estão ${formatarPercentual(
              variacaoReceitas
            )} menores que no mesmo período do mês passado.`,
        });
      } else if (variacaoReceitas > 0) {
        lista.push({
          tipo: "positivo",
          titulo: "Suas receitas cresceram",
          texto:
            `Suas entradas aumentaram ${formatarPercentual(
              variacaoReceitas
            )} em relação ao mesmo período do mês passado.`,
        });
      }
    }

    if (
      taxaEconomia !== null &&
      taxaEconomia !== undefined
    ) {
      if (taxaEconomia > 0) {
        lista.push({
          tipo: "positivo",
          titulo: "Você está preservando parte da renda",
          texto:
            `Sua taxa de economia no período está em ${formatarPercentual(
              taxaEconomia
            )}.`,
        });
      } else {
        lista.push({
          tipo: "atencao",
          titulo: "As despesas superaram as receitas",
          texto:
            "Seu saldo do período está negativo. Vale revisar os maiores gastos.",
        });
      }
    }

    if (categoria?.categoria) {
      lista.push({
        tipo: "informacao",
        titulo: `${categoria.categoria} é seu maior gasto`,
        texto:
          `Essa categoria soma ${formatarMoeda(
            categoria.valor
          )} no mês atual.`,
      });
    }

    if (
      Number(futuro?.receitas_previstas || 0) !== 0 ||
      Number(futuro?.despesas_previstas || 0) !== 0
    ) {
      const saldoPrevisto =
        Number(futuro?.saldo_previsto || 0);

      lista.push({
        tipo:
          saldoPrevisto >= 0
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
              O Rumo está organizando seus dados para
              gerar sua leitura financeira.
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
            <h2>Não foi possível gerar sua análise.</h2>

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
          titulo="Inteligência Financeira"
          subtitulo="O Rumo analisa seus números e mostra o que merece sua atenção."
        >
          <span className="inteligencia-premium-badge">
            <Sparkles size={15} />
            Premium
          </span>
        </PageHeader>

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
              {Number(variacaoReceitas) >= 0 ? (
                <TrendingUp size={15} />
              ) : (
                <TrendingDown size={15} />
              )}

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
              {Number(variacaoDespesas) <= 0 ? (
                <TrendingDown size={15} />
              ) : (
                <TrendingUp size={15} />
              )}

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
            {insights.length > 0 ? (
              insights.map(
                (insight, index) => (
                  <article
                    className={`inteligencia-insight ${insight.tipo}`}
                    key={`${insight.titulo}-${index}`}
                  >
                    <div className="inteligencia-insight-icon">
                      <Sparkles size={18} />
                    </div>

                    <div>
                      <h3>
                        {insight.titulo}
                      </h3>

                      <p>
                        {insight.texto}
                      </p>
                    </div>
                  </article>
                )
              )
            ) : (
              <div className="inteligencia-sem-insights">
                Ainda não há movimentações suficientes para
                gerar uma leitura detalhada.
              </div>
            )}
          </div>
        </section>

        <section className="inteligencia-destaques">
          <article>
            <div>
              <span>Maior categoria de despesa</span>

              <strong>
                {dados?.maior_categoria_despesa?.categoria ||
                  "Sem despesas"}
              </strong>
            </div>

            <CircleDollarSign size={28} />

            <b>
              {formatarMoeda(
                dados?.maior_categoria_despesa?.valor
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
