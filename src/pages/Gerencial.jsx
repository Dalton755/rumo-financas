import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
  XCircle
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import {
  obterPainelGerencial
} from "../services/gerencial";

import "./Gerencial.css";

function formatarMoeda(valor) {
  return Number(valor || 0)
    .toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );
}

function formatarPercentual(valor) {
  return Number(valor || 0)
    .toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    ) + "%";
}

function formatarData(valor) {
  if (!valor) {
    return "—";
  }

  return new Date(valor)
    .toLocaleDateString(
      "pt-BR"
    );
}

function formatarDataHora(valor) {
  if (!valor) {
    return "Nunca";
  }

  return new Date(valor)
    .toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
}

function statusPagamento(status) {
  if (status === "APROVADO") {
    return {
      classe: "approved",
      label: "Aprovado"
    };
  }

  if (status === "RECUSADO") {
    return {
      classe: "refused",
      label: "Recusado"
    };
  }

  return {
    classe: "pending",
    label: "Pendente"
  };
}

function Gerencial() {
  const [
    painel,
    setPainel
  ] = useState(null);

  const [
    carregando,
    setCarregando
  ] = useState(true);

  const [
    atualizando,
    setAtualizando
  ] = useState(false);

  const [
    erro,
    setErro
  ] = useState("");

  async function carregar({
    silencioso = false
  } = {}) {
    try {
      if (silencioso) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro("");

      const dados =
        await obterPainelGerencial();

      setPainel(dados);
    } catch (error) {
      console.error(
        "[RUMO GERENCIAL]",
        error
      );

      setErro(
        "Não foi possível carregar os dados gerenciais."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const clientes =
    painel?.clientes || {};

  const financeiro =
    painel?.financeiro || {};

  const planos =
    painel?.planos || [];

  const crescimento =
    useMemo(
      () =>
        (
          painel?.crescimento ||
          []
        ).map(
          (item) => ({
            ...item,
            semana:
              new Date(
                `${item.inicio_semana}T12:00:00`
              )
                .toLocaleDateString(
                  "pt-BR",
                  {
                    day: "2-digit",
                    month: "2-digit"
                  }
                )
          })
        ),
      [painel]
    );

  const taxaAtividade =
    clientes.total > 0
      ? (
          Number(
            clientes.ativos_30_dias ||
            0
          ) /
          Number(clientes.total)
        ) * 100
      : 0;

  const maiorPlano =
    planos.reduce(
      (maior, item) =>
        Number(item.quantidade || 0) >
        Number(maior?.quantidade || 0)
          ? item
          : maior,
      null
    );

  if (carregando) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="gerencial-loading">
            <BarChart3 size={24} />

            <strong>
              Montando o painel gerencial
            </strong>

            <span>
              Consolidando clientes, planos e pagamentos reais...
            </span>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          titulo="Painel gerencial"
          subtitulo="Clientes, receita e crescimento real do Rumo."
        >
          <div className="gerencial-header-actions">
            <span className="gerencial-owner-badge">
              <ShieldCheck size={14} />
              Dono
            </span>

            <button
              type="button"
              className="gerencial-refresh"
              onClick={() =>
                carregar({
                  silencioso: true
                })
              }
              disabled={atualizando}
            >
              <RefreshCw
                size={15}
                className={
                  atualizando
                    ? "spin"
                    : ""
                }
              />

              Atualizar
            </button>
          </div>
        </PageHeader>

        {erro && (
          <section className="gerencial-error">
            <strong>
              Dados indisponíveis
            </strong>

            <span>
              {erro}
            </span>

            <button
              type="button"
              onClick={() =>
                carregar()
              }
            >
              Tentar novamente
            </button>
          </section>
        )}

        {!erro && painel && (
          <>
            <section className="gerencial-hero">
              <div className="gerencial-hero-main">
                <span className="gerencial-eyebrow">
                  Base de clientes
                </span>

                <strong className="gerencial-hero-value">
                  {clientes.total || 0}
                </strong>

                <p>
                  Usuários reais do Rumo, excluindo a conta de proprietário.
                </p>

                <div className="gerencial-hero-chips">
                  <span>
                    <TrendingUp size={13} />
                    {clientes.novos_30_dias || 0} novos em 30 dias
                  </span>

                  <span>
                    <Activity size={13} />
                    {clientes.ativos_30_dias || 0} ativos em 30 dias
                  </span>
                </div>
              </div>

              <div className="gerencial-hero-side">
                <div>
                  <span>
                    Conversão Premium
                  </span>

                  <strong>
                    {formatarPercentual(
                      clientes.conversao_premium
                    )}
                  </strong>

                  <small>
                    {clientes.premium || 0} clientes Premium
                  </small>
                </div>

                <div>
                  <span>
                    Taxa de atividade
                  </span>

                  <strong>
                    {formatarPercentual(
                      taxaAtividade
                    )}
                  </strong>

                  <small>
                    acessaram nos últimos 30 dias
                  </small>
                </div>
              </div>
            </section>

            <section className="gerencial-kpis">
              <article>
                <div className="gerencial-kpi-icon premium">
                  <ShieldCheck size={18} />
                </div>

                <span>
                  Premium ativos
                </span>

                <strong>
                  {clientes.premium || 0}
                </strong>

                <small>
                  de {clientes.total || 0} clientes
                </small>
              </article>

              <article>
                <div className="gerencial-kpi-icon free">
                  <Users size={18} />
                </div>

                <span>
                  Gratuitos
                </span>

                <strong>
                  {clientes.gratuitos || 0}
                </strong>

                <small>
                  base com potencial de conversão
                </small>
              </article>

              <article>
                <div className="gerencial-kpi-icon revenue">
                  <WalletCards size={18} />
                </div>

                <span>
                  Receita confirmada
                </span>

                <strong>
                  {formatarMoeda(
                    financeiro.receita_confirmada_total
                  )}
                </strong>

                <small>
                  pagamentos aprovados registrados
                </small>
              </article>

              <article>
                <div className="gerencial-kpi-icon recurring">
                  <BarChart3 size={18} />
                </div>

                <span>
                  MRR estimado
                </span>

                <strong>
                  {formatarMoeda(
                    financeiro.mrr_estimado
                  )}
                </strong>

                <small>
                  com base nos Premium ativos
                </small>
              </article>

              <article>
                <div className="gerencial-kpi-icon active">
                  <Activity size={18} />
                </div>

                <span>
                  Ativos 30 dias
                </span>

                <strong>
                  {clientes.ativos_30_dias || 0}
                </strong>

                <small>
                  {formatarPercentual(taxaAtividade)} da base
                </small>
              </article>

              <article>
                <div className="gerencial-kpi-icon pending">
                  <Clock3 size={18} />
                </div>

                <span>
                  Valor pendente
                </span>

                <strong>
                  {formatarMoeda(
                    financeiro.valor_pendente
                  )}
                </strong>

                <small>
                  {financeiro.pagamentos_pendentes || 0} tentativas pendentes
                </small>
              </article>
            </section>

            <section className="gerencial-analytics-grid">
              <article className="gerencial-panel">
                <div className="gerencial-panel-head">
                  <div>
                    <span>
                      Aquisição
                    </span>

                    <h2>
                      Crescimento de clientes
                    </h2>

                    <p>
                      Cadastros por semana nas últimas 8 semanas.
                    </p>
                  </div>

                  <strong>
                    +{clientes.novos_30_dias || 0}
                    <small>
                      últimos 30 dias
                    </small>
                  </strong>
                </div>

                <div className="gerencial-chart">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={crescimento}
                      margin={{
                        top: 8,
                        right: 4,
                        left: -24,
                        bottom: 0
                      }}
                    >
                      <CartesianGrid
                        stroke="#edf1f5"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="semana"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 9
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 9
                        }}
                      />

                      <Tooltip
                        cursor={{
                          fill:
                            "rgba(15,159,179,.04)"
                        }}
                        contentStyle={{
                          border:
                            "1px solid #e6ebf0",
                          borderRadius: 11,
                          boxShadow:
                            "0 10px 25px rgba(15,23,42,.08)",
                          fontSize: 10
                        }}
                        formatter={(value) => [
                          value,
                          "Cadastros"
                        ]}
                      />

                      <Bar
                        dataKey="cadastros"
                        fill="#0f9fb3"
                        radius={[
                          6,
                          6,
                          0,
                          0
                        ]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="gerencial-panel">
                <div className="gerencial-panel-head">
                  <div>
                    <span>
                      Planos
                    </span>

                    <h2>
                      Distribuição da base
                    </h2>

                    <p>
                      Onde os clientes estão hoje.
                    </p>
                  </div>
                </div>

                <div className="gerencial-plan-list">
                  {planos.map(
                    (plano) => {
                      const percentual =
                        clientes.total > 0
                          ? (
                              Number(
                                plano.quantidade ||
                                0
                              ) /
                              Number(clientes.total)
                            ) * 100
                          : 0;

                      return (
                        <div
                          key={plano.codigo}
                          className="gerencial-plan-item"
                        >
                          <div className="gerencial-plan-line">
                            <div>
                              <strong>
                                {plano.nome}
                              </strong>

                              <span>
                                {formatarPercentual(
                                  percentual
                                )}
                              </span>
                            </div>

                            <b>
                              {plano.quantidade}
                            </b>
                          </div>

                          <div className="gerencial-plan-bar">
                            <span
                              style={{
                                width:
                                  `${percentual}%`
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="gerencial-plan-insight">
                  <ShieldCheck size={16} />

                  <div>
                    <span>
                      Leitura do Rumo
                    </span>

                    <strong>
                      {maiorPlano?.nome || "Sem dados"} concentra a maior parte da base.
                    </strong>

                    <p>
                      A conversão atual para Premium está em {formatarPercentual(clientes.conversao_premium)}.
                    </p>
                  </div>
                </div>
              </article>
            </section>

            <section className="gerencial-finance-row">
              <div>
                <span className="gerencial-finance-label">
                  Saúde dos pagamentos
                </span>

                <strong>
                  {financeiro.pagamentos_aprovados || 0}
                </strong>

                <small>
                  aprovados
                </small>
              </div>

              <div>
                <span className="gerencial-status-icon approved">
                  <CheckCircle2 size={16} />
                </span>

                <strong>
                  {formatarMoeda(
                    financeiro.receita_confirmada_30_dias
                  )}
                </strong>

                <small>
                  receita aprovada em 30 dias
                </small>
              </div>

              <div>
                <span className="gerencial-status-icon pending">
                  <Clock3 size={16} />
                </span>

                <strong>
                  {financeiro.pagamentos_pendentes || 0}
                </strong>

                <small>
                  pendentes
                </small>
              </div>

              <div>
                <span className="gerencial-status-icon refused">
                  <XCircle size={16} />
                </span>

                <strong>
                  {financeiro.pagamentos_recusados || 0}
                </strong>

                <small>
                  recusados
                </small>
              </div>
            </section>

            <section className="gerencial-lists-grid">
              <article className="gerencial-panel">
                <div className="gerencial-panel-head compact">
                  <div>
                    <span>
                      Clientes
                    </span>

                    <h2>
                      Cadastros recentes
                    </h2>
                  </div>

                  <Users size={17} />
                </div>

                <div className="gerencial-client-list">
                  {(painel.clientes_recentes || [])
                    .map(
                      (cliente) => (
                        <div
                          key={cliente.id}
                          className="gerencial-client-item"
                        >
                          <div className="gerencial-avatar">
                            {String(
                              cliente.email ||
                              "?"
                            )
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>

                          <div className="gerencial-client-main">
                            <strong>
                              {cliente.email}
                            </strong>

                            <span>
                              Cadastro {formatarData(cliente.created_at)}
                            </span>
                          </div>

                          <div className="gerencial-client-meta">
                            <span
                              className={
                                cliente.plano === "PREMIUM"
                                  ? "gerencial-plan-chip premium"
                                  : "gerencial-plan-chip"
                              }
                            >
                              {cliente.plano}
                            </span>

                            <small>
                              Último acesso: {formatarDataHora(cliente.last_sign_in_at)}
                            </small>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </article>

              <article className="gerencial-panel">
                <div className="gerencial-panel-head compact">
                  <div>
                    <span>
                      Financeiro
                    </span>

                    <h2>
                      Pagamentos recentes
                    </h2>
                  </div>

                  <CreditCard size={17} />
                </div>

                <div className="gerencial-payment-list">
                  {(painel.pagamentos_recentes || [])
                    .map(
                      (pagamento) => {
                        const status =
                          statusPagamento(
                            pagamento.status
                          );

                        return (
                          <div
                            key={pagamento.id}
                            className="gerencial-payment-item"
                          >
                            <div className="gerencial-payment-main">
                              <strong>
                                {formatarMoeda(
                                  pagamento.valor
                                )}
                              </strong>

                              <span>
                                {pagamento.email}
                              </span>
                            </div>

                            <div className="gerencial-payment-meta">
                              <span
                                className={
                                  `gerencial-payment-status ${status.classe}`
                                }
                              >
                                {status.label}
                              </span>

                              <small>
                                {pagamento.periodo} • {formatarData(pagamento.criado_em)}
                              </small>
                            </div>
                          </div>
                        );
                      }
                    )}
                </div>
              </article>
            </section>

            <div className="gerencial-footnote">
              <span>
                Atualizado em {formatarDataHora(painel.atualizado_em)}
              </span>

              <span>
                Receita confirmada considera apenas pagamentos APROVADOS. MRR é uma estimativa baseada nos Premium ativos e no preço contratado/plano.
              </span>
            </div>
          </>
        )}
      </PageContainer>
    </MainLayout>
  );
}

export default Gerencial;
