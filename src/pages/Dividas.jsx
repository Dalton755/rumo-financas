import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BadgeDollarSign,
  Calculator,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  History,
  Pencil,
  Percent,
  Plus,
  ReceiptText,
  Save,
  Sparkles,
  Trash2,
  TrendingDown,
  WalletCards,
  X,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import { useToast } from "../context/ToastContext";

import {
  alterarStatusDivida,
  atualizarDivida,
  atualizarParcelaPlanoQuitacao,
  criarDivida,
  criarParcelaPlanoQuitacao,
  excluirDivida,
  excluirParcelaPlanoQuitacao,
  listarDividas,
  listarPlanoQuitacao,
  registrarPagamentoDivida,
  simularQuitacao,
} from "../services/dividas";

import "./Dividas.css";


function formatarMoeda(valor) {
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


function formatarPercentual(valor) {
  return `${Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}%`;
}


function formatarData(data) {
  if (!data) {
    return "—";
  }

  const texto =
    String(data)
      .split("T")[0];

  const [
    ano,
    mes,
    dia,
  ] = texto.split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return "—";
  }

  return `${dia}/${mes}/${ano}`;
}


function labelPrioridade(
  prioridade
) {
  const mapa = {
    1: "Urgente",
    2: "Alta",
    3: "Média",
    4: "Baixa",
    5: "Quando possível",
  };

  return (
    mapa[
    Number(prioridade)
    ] || "Média"
  );
}


function labelStatus(
  status
) {
  const mapa = {
    ativa: "Ativa",
    negociada: "Negociada",
    quitada: "Quitada",
  };

  return (
    mapa[status] ||
    status
  );
}


function labelStatusParcela(
  status
) {
  const mapa = {
    pendente: "Pendente",
    parcial: "Parcial",
    pago: "Pago",
  };

  return (
    mapa[status] ||
    status
  );
}


function calcularPercentualQuitado(
  divida
) {
  const original =
    Number(
      divida?.valor_original ||
      0
    );

  const saldo =
    Number(
      divida?.saldo_atual ||
      0
    );

  if (original <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (
        (
          original -
          saldo
        ) /
        original
      ) *
      100
    )
  );
}


function adicionarMeses(
  quantidade
) {
  if (
    !quantidade ||
    quantidade <= 0
  ) {
    return "—";
  }

  const data =
    new Date();

  /*
   * Colocamos o dia como 1 antes
   * de adicionar os meses.
   *
   * Isso evita problemas como:
   * 31 de agosto + 8 meses
   * tentar gerar 31 de abril
   * e acabar pulando para maio.
   */
  data.setDate(1);

  data.setMonth(
    data.getMonth() +
    Number(quantidade)
  );

  return data.toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    }
  );
}


function hojeISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function Dividas() {
  const {
    showToast,
  } = useToast();


  const [
    dividas,
    setDividas,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");


  const [
    modalFormulario,
    setModalFormulario,
  ] = useState(false);

  const [
    dividaEditando,
    setDividaEditando,
  ] = useState(null);


  const [
    nome,
    setNome,
  ] = useState("");

  const [
    credor,
    setCredor,
  ] = useState("");

  const [
    valorOriginal,
    setValorOriginal,
  ] = useState("");

  const [
    saldoAtual,
    setSaldoAtual,
  ] = useState("");

  const [
    jurosMensal,
    setJurosMensal,
  ] = useState("");

  const [
    parcelaMinima,
    setParcelaMinima,
  ] = useState("");

  const [
    vencimentoDia,
    setVencimentoDia,
  ] = useState("");

  const [
    prioridade,
    setPrioridade,
  ] = useState("3");


  const [
    dividaDetalhe,
    setDividaDetalhe,
  ] = useState(null);

  const [
    plano,
    setPlano,
  ] = useState([]);

  const [
    carregandoPlano,
    setCarregandoPlano,
  ] = useState(false);


  const [
    pagamento,
    setPagamento,
  ] = useState("");


  const [
    pagamentoSimulacao,
    setPagamentoSimulacao,
  ] = useState("");


  const [
    semanaReferencia,
    setSemanaReferencia,
  ] = useState(
    hojeISO()
  );

  const [
    valorPrevisto,
    setValorPrevisto,
  ] = useState("");

  const [
    valorPagoPlano,
    setValorPagoPlano,
  ] = useState("");


  const [
    salvando,
    setSalvando,
  ] = useState(false);


  useEffect(() => {
    carregarDividas();
  }, []);


  async function carregarDividas() {
    try {
      setCarregando(true);
      setErro("");

      const dados =
        await listarDividas();

      setDividas(
        dados
      );

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Erro:",
        error
      );

      setErro(
        "Não foi possível carregar suas dívidas."
      );

    } finally {
      setCarregando(false);
    }
  }


  function limparFormulario() {
    setDividaEditando(null);

    setNome("");
    setCredor("");
    setValorOriginal("");
    setSaldoAtual("");
    setJurosMensal("");
    setParcelaMinima("");
    setVencimentoDia("");
    setPrioridade("3");
  }


  function abrirNovaDivida() {
    limparFormulario();

    setModalFormulario(
      true
    );
  }


  function abrirEditarDivida(
    divida
  ) {
    setDividaEditando(
      divida
    );

    setNome(
      divida.nome || ""
    );

    setCredor(
      divida.credor || ""
    );

    setValorOriginal(
      String(
        divida.valor_original ??
        ""
      )
    );

    setSaldoAtual(
      String(
        divida.saldo_atual ??
        ""
      )
    );

    setJurosMensal(
      String(
        divida.juros_mensal ??
        0
      )
    );

    setParcelaMinima(
      divida.parcela_minima ===
        null
        ? ""
        : String(
          divida.parcela_minima
        )
    );

    setVencimentoDia(
      divida.vencimento_dia ===
        null
        ? ""
        : String(
          divida.vencimento_dia
        )
    );

    setPrioridade(
      String(
        divida.prioridade ??
        3
      )
    );

    setModalFormulario(
      true
    );
  }


  function fecharFormulario() {
    if (salvando) {
      return;
    }

    setModalFormulario(
      false
    );

    limparFormulario();
  }


  async function salvarDivida() {
    try {
      setSalvando(true);

      if (
        dividaEditando
      ) {
        await atualizarDivida(
          dividaEditando.id,
          {
            nome,
            credor,
            valorOriginal,
            saldoAtual,
            jurosMensal:
              jurosMensal || 0,
            parcelaMinima:
              parcelaMinima ||
              null,
            vencimentoDia:
              vencimentoDia ||
              null,
            prioridade:
              Number(
                prioridade
              ),
          }
        );

        showToast(
          "Dívida atualizada",
          "As informações da dívida foram atualizadas.",
          "success"
        );

      } else {
        await criarDivida({
          nome,
          credor,
          valorOriginal,
          saldoAtual:
            saldoAtual ||
            null,
          jurosMensal:
            jurosMensal || 0,
          parcelaMinima:
            parcelaMinima ||
            null,
          vencimentoDia:
            vencimentoDia ||
            null,
          prioridade:
            Number(
              prioridade
            ),
        });

        showToast(
          "Dívida cadastrada",
          "Agora o Rumo pode acompanhar sua quitação.",
          "success"
        );
      }

      setModalFormulario(
        false
      );

      limparFormulario();

      await carregarDividas();

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Salvar:",
        error
      );

      showToast(
        "Não foi possível salvar",
        error?.message ??
        "Tente novamente.",
        "error"
      );

    } finally {
      setSalvando(false);
    }
  }


  async function carregarPlano(
    dividaId
  ) {
    try {
      setCarregandoPlano(
        true
      );

      const dados =
        await listarPlanoQuitacao(
          dividaId
        );

      setPlano(
        dados
      );

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Plano:",
        error
      );

      showToast(
        "Plano indisponível",
        "Não foi possível carregar o plano de quitação.",
        "error"
      );

    } finally {
      setCarregandoPlano(
        false
      );
    }
  }


  async function abrirDetalhes(
    divida
  ) {
    setDividaDetalhe(
      divida
    );

    setPagamento("");

    setPagamentoSimulacao(
      divida.parcela_minima
        ? String(
          divida.parcela_minima
        )
        : ""
    );

    setSemanaReferencia(
      hojeISO()
    );

    setValorPrevisto("");
    setValorPagoPlano("");

    await carregarPlano(
      divida.id
    );
  }


  function fecharDetalhes() {
    if (salvando) {
      return;
    }

    setDividaDetalhe(null);

    setPlano([]);

    setPagamento("");
    setPagamentoSimulacao("");

    setValorPrevisto("");
    setValorPagoPlano("");
  }


  async function atualizarDetalheDepoisDaAcao(
    dividaId
  ) {
    const atualizadas =
      await listarDividas();

    setDividas(
      atualizadas
    );

    const atualizada =
      atualizadas.find(
        (item) =>
          item.id ===
          dividaId
      );

    if (atualizada) {
      setDividaDetalhe(
        atualizada
      );
    }

    return atualizada;
  }


  async function registrarPagamento() {
    if (!dividaDetalhe) {
      return;
    }

    try {
      setSalvando(true);

      await registrarPagamentoDivida(
        dividaDetalhe.id,
        pagamento
      );

      showToast(
        "Pagamento registrado",
        "O saldo devedor foi atualizado.",
        "success"
      );

      setPagamento("");

      const atualizada =
        await atualizarDetalheDepoisDaAcao(
          dividaDetalhe.id
        );

      if (
        atualizada?.status ===
        "quitada"
      ) {
        showToast(
          "Dívida quitada!",
          "Parabéns. O saldo dessa dívida chegou a zero.",
          "success"
        );
      }

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Pagamento:",
        error
      );

      showToast(
        "Não foi possível registrar",
        error?.message ??
        "Tente novamente.",
        "error"
      );

    } finally {
      setSalvando(false);
    }
  }


  async function alternarNegociada(
    divida
  ) {
    try {
      const novoStatus =
        divida.status ===
          "negociada"
          ? "ativa"
          : "negociada";

      await alterarStatusDivida(
        divida.id,
        novoStatus
      );

      showToast(
        novoStatus ===
          "negociada"
          ? "Dívida negociada"
          : "Dívida reativada",
        novoStatus ===
          "negociada"
          ? "O acordo foi registrado no acompanhamento."
          : "A dívida voltou ao status ativa.",
        "success"
      );

      await carregarDividas();

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Status:",
        error
      );

      showToast(
        "Não foi possível alterar",
        error?.message ??
        "Tente novamente.",
        "error"
      );
    }
  }


  async function removerDivida(
    divida
  ) {
    const confirmou =
      window.confirm(
        `Excluir definitivamente a dívida "${divida.nome}"?`
      );

    if (!confirmou) {
      return;
    }

    try {
      await excluirDivida(
        divida.id
      );

      showToast(
        "Dívida excluída",
        "O registro foi removido.",
        "success"
      );

      await carregarDividas();

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Exclusão:",
        error
      );

      showToast(
        "Não foi possível excluir",
        error?.message ??
        "Tente novamente.",
        "error"
      );
    }
  }


  async function criarParcela() {
    if (!dividaDetalhe) {
      return;
    }

    try {
      setSalvando(true);

      await criarParcelaPlanoQuitacao(
        dividaDetalhe.id,
        {
          semanaReferencia,
          valorPrevisto,
          valorPago:
            valorPagoPlano || 0,
        }
      );

      showToast(
        "Parcela adicionada",
        "O plano de quitação foi atualizado.",
        "success"
      );

      setValorPrevisto("");
      setValorPagoPlano("");

      await atualizarDetalheDepoisDaAcao(
        dividaDetalhe.id
      );

      await carregarPlano(
        dividaDetalhe.id
      );

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Criar parcela:",
        error
      );

      showToast(
        "Não foi possível adicionar",
        error?.message ??
        "Tente novamente.",
        "error"
      );

    } finally {
      setSalvando(false);
    }
  }


  async function editarPagamentoParcela(
    parcela
  ) {
    const valor =
      window.prompt(
        "Informe o valor pago nesta parcela:",
        String(
          parcela.valor_pago ??
          0
        )
      );

    if (
      valor === null
    ) {
      return;
    }

    try {
      setSalvando(true);

      await atualizarParcelaPlanoQuitacao(
        parcela.id,
        {
          valorPrevisto:
            parcela.valor_previsto,

          valorPago:
            valor,
        }
      );

      showToast(
        "Parcela atualizada",
        "O status e o saldo devedor foram atualizados.",
        "success"
      );

      await atualizarDetalheDepoisDaAcao(
        dividaDetalhe.id
      );

      await carregarPlano(
        dividaDetalhe.id
      );

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Parcela:",
        error
      );

      showToast(
        "Não foi possível atualizar",
        error?.message ??
        "Tente novamente.",
        "error"
      );

    } finally {
      setSalvando(false);
    }
  }


  async function removerParcela(
    parcela
  ) {
    const confirmou =
      window.confirm(
        `Excluir a parcela de ${formatarMoeda(
          parcela.valor_previsto
        )}?`
      );

    if (!confirmou) {
      return;
    }

    try {
      setSalvando(true);

      await excluirParcelaPlanoQuitacao(
        parcela.id
      );

      showToast(
        "Parcela excluída",
        "O plano e o saldo devedor foram atualizados.",
        "success"
      );

      await atualizarDetalheDepoisDaAcao(
        dividaDetalhe.id
      );

      await carregarPlano(
        dividaDetalhe.id
      );

    } catch (error) {
      console.error(
        "[RUMO DIVIDAS] Excluir parcela:",
        error
      );

      showToast(
        "Não foi possível excluir",
        error?.message ??
        "Tente novamente.",
        "error"
      );

    } finally {
      setSalvando(false);
    }
  }


  const resumo =
    useMemo(() => {
      const abertas =
        dividas.filter(
          (divida) =>
            divida.status !==
            "quitada"
        );

      const saldoTotal =
        abertas.reduce(
          (
            total,
            divida
          ) =>
            total +
            Number(
              divida.saldo_atual ||
              0
            ),
          0
        );

      const parcelas =
        abertas.reduce(
          (
            total,
            divida
          ) =>
            total +
            Number(
              divida.parcela_minima ||
              0
            ),
          0
        );

      const quitadas =
        dividas.filter(
          (divida) =>
            divida.status ===
            "quitada"
        ).length;

      const jurosMedios =
        abertas.length > 0
          ? (
            abertas.reduce(
              (
                total,
                divida
              ) =>
                total +
                Number(
                  divida.juros_mensal ||
                  0
                ),
              0
            ) /
            abertas.length
          )
          : 0;

      return {
        saldoTotal,
        parcelas,
        abertas:
          abertas.length,
        quitadas,
        jurosMedios,
      };
    }, [dividas]);


  const dividasOrdenadas =
    useMemo(() => {
      const pesoStatus = {
        ativa: 1,
        negociada: 2,
        quitada: 3,
      };

      return [
        ...dividas,
      ].sort(
        (a, b) => {
          const diferencaStatus =
            (
              pesoStatus[
              a.status
              ] ?? 99
            ) -
            (
              pesoStatus[
              b.status
              ] ?? 99
            );

          if (
            diferencaStatus !==
            0
          ) {
            return diferencaStatus;
          }

          return (
            Number(
              a.prioridade || 3
            ) -
            Number(
              b.prioridade || 3
            )
          );
        }
      );
    }, [dividas]);


  const simulacaoBase =
    useMemo(() => {
      if (
        !dividaDetalhe ||
        !pagamentoSimulacao ||
        Number(
          pagamentoSimulacao
        ) <= 0 ||
        Number(
          dividaDetalhe.saldo_atual
        ) <= 0
      ) {
        return null;
      }

      try {
        return simularQuitacao({
          saldoAtual:
            dividaDetalhe
              .saldo_atual,

          jurosMensal:
            dividaDetalhe
              .juros_mensal ||
            0,

          pagamentoMensal:
            pagamentoSimulacao,
        });

      } catch {
        return null;
      }
    }, [
      dividaDetalhe,
      pagamentoSimulacao,
    ]);


  const simulacaoExtra =
    useMemo(() => {
      if (
        !dividaDetalhe ||
        !pagamentoSimulacao ||
        Number(
          pagamentoSimulacao
        ) <= 0 ||
        Number(
          dividaDetalhe.saldo_atual
        ) <= 0
      ) {
        return null;
      }

      try {
        return simularQuitacao({
          saldoAtual:
            dividaDetalhe
              .saldo_atual,

          jurosMensal:
            dividaDetalhe
              .juros_mensal ||
            0,

          pagamentoMensal:
            Number(
              pagamentoSimulacao
            ) + 300,
        });

      } catch {
        return null;
      }
    }, [
      dividaDetalhe,
      pagamentoSimulacao,
    ]);


  const resumoPlano =
    useMemo(() => {
      return {
        previsto:
          plano.reduce(
            (
              total,
              parcela
            ) =>
              total +
              Number(
                parcela.valor_previsto ||
                0
              ),
            0
          ),

        pago:
          plano.reduce(
            (
              total,
              parcela
            ) =>
              total +
              Number(
                parcela.valor_pago ||
                0
              ),
            0
          ),

        pendentes:
          plano.filter(
            (parcela) =>
              parcela.status !==
              "pago"
          ).length,
      };
    }, [plano]);


  if (carregando) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="dividas-loading">
            <CreditCard size={38} />

            <h2>
              Organizando suas dívidas...
            </h2>

            <p>
              O Rumo está preparando
              seu plano de quitação.
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
          <div className="dividas-erro">
            <AlertTriangle size={38} />

            <h2>
              Não foi possível carregar suas dívidas.
            </h2>

            <p>
              {erro}
            </p>

            <button
              type="button"
              onClick={
                carregarDividas
              }
            >
              Tentar novamente
            </button>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }


  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          titulo="Gestão de Dívidas"
          subtitulo="Entenda o saldo devedor, simule cenários e construa seu caminho até a quitação."
        >
          <div className="dividas-header-actions">
            <span className="dividas-premium-badge">
              <Sparkles size={15} />
              Premium
            </span>

            <button
              type="button"
              className="dividas-btn-nova"
              onClick={
                abrirNovaDivida
              }
            >
              <Plus size={18} />
              Nova Dívida
            </button>
          </div>
        </PageHeader>


        <section className="dividas-resumo-grid">
          <article className="dividas-resumo-card">
            <CircleDollarSign size={22} />

            <div>
              <span>
                Saldo devedor
              </span>

              <strong>
                {formatarMoeda(
                  resumo.saldoTotal
                )}
              </strong>
            </div>
          </article>


          <article className="dividas-resumo-card">
            <WalletCards size={22} />

            <div>
              <span>
                Parcelas mínimas
              </span>

              <strong>
                {formatarMoeda(
                  resumo.parcelas
                )}
              </strong>
            </div>
          </article>


          <article className="dividas-resumo-card">
            <CreditCard size={22} />

            <div>
              <span>
                Dívidas abertas
              </span>

              <strong>
                {resumo.abertas}
              </strong>
            </div>
          </article>


          <article className="dividas-resumo-card">
            <Percent size={22} />

            <div>
              <span>
                Juros médios
              </span>

              <strong>
                {formatarPercentual(
                  resumo.jurosMedios
                )}
              </strong>
            </div>
          </article>
        </section>


        <section className="dividas-section">
          <div className="dividas-section-heading">
            <div>
              <span>
                PLANO DE SAÍDA
              </span>

              <h2>
                Minhas dívidas
              </h2>
            </div>

            <div className="dividas-contagem">
              {dividas.length}{" "}
              {dividas.length === 1
                ? "dívida"
                : "dívidas"}
            </div>
          </div>


          {dividasOrdenadas.length ===
            0 ? (
            <div className="dividas-vazio">
              <CheckCircle2 size={38} />

              <h3>
                Nenhuma dívida cadastrada
              </h3>

              <p>
                Cadastre suas dívidas
                para enxergar o saldo
                total e planejar a
                quitação.
              </p>

              <button
                type="button"
                onClick={
                  abrirNovaDivida
                }
              >
                <Plus size={18} />
                Cadastrar dívida
              </button>
            </div>
          ) : (
            <div className="dividas-grid">
              {dividasOrdenadas.map(
                (divida) => {
                  const progresso =
                    calcularPercentualQuitado(
                      divida
                    );

                  return (
                    <article
                      key={
                        divida.id
                      }
                      className={`divida-card status-${divida.status}`}
                    >
                      <div className="divida-card-topo">
                        <div className="divida-identidade">
                          <div className="divida-icone">
                            {divida.status ===
                              "quitada" ? (
                              <CheckCircle2 size={22} />
                            ) : (
                              <CreditCard size={22} />
                            )}
                          </div>

                          <div>
                            <div className="divida-badges">
                              <span
                                className={`divida-status status-${divida.status}`}
                              >
                                {labelStatus(
                                  divida.status
                                )}
                              </span>

                              <span
                                className={`divida-prioridade prioridade-${divida.prioridade}`}
                              >
                                {labelPrioridade(
                                  divida.prioridade
                                )}
                              </span>
                            </div>

                            <h3>
                              {divida.nome}
                            </h3>

                            {divida.credor && (
                              <p>
                                {divida.credor}
                              </p>
                            )}
                          </div>
                        </div>


                        <div className="divida-acoes-mini">
                          {divida.status !==
                            "quitada" && (
                              <button
                                type="button"
                                title="Editar"
                                onClick={() =>
                                  abrirEditarDivida(
                                    divida
                                  )
                                }
                              >
                                <Pencil size={17} />
                              </button>
                            )}

                          <button
                            type="button"
                            title="Excluir"
                            className="perigo"
                            onClick={() =>
                              removerDivida(
                                divida
                              )
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>


                      <div className="divida-valores">
                        <div>
                          <span>
                            Saldo atual
                          </span>

                          <strong>
                            {formatarMoeda(
                              divida.saldo_atual
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Valor original
                          </span>

                          <strong>
                            {formatarMoeda(
                              divida.valor_original
                            )}
                          </strong>
                        </div>
                      </div>


                      <div className="divida-progresso">
                        <div>
                          <span>
                            Já quitado
                          </span>

                          <strong>
                            {progresso.toLocaleString(
                              "pt-BR",
                              {
                                maximumFractionDigits:
                                  1,
                              }
                            )}
                            %
                          </strong>
                        </div>

                        <div className="divida-progresso-barra">
                          <div
                            style={{
                              width:
                                `${progresso}%`,
                            }}
                          />
                        </div>
                      </div>


                      <div className="divida-info">
                        <div>
                          <Percent size={17} />

                          <span>
                            Juros{" "}
                            <strong>
                              {formatarPercentual(
                                divida.juros_mensal
                              )}
                              /mês
                            </strong>
                          </span>
                        </div>

                        <div>
                          <BadgeDollarSign size={17} />

                          <span>
                            Parcela mínima{" "}
                            <strong>
                              {divida.parcela_minima
                                ? formatarMoeda(
                                  divida.parcela_minima
                                )
                                : "Não informada"}
                            </strong>
                          </span>
                        </div>

                        <div>
                          <CalendarDays size={17} />

                          <span>
                            Vencimento{" "}
                            <strong>
                              {divida.vencimento_dia
                                ? `dia ${divida.vencimento_dia}`
                                : "não informado"}
                            </strong>
                          </span>
                        </div>
                      </div>


                      <div className="divida-card-acoes">
                        <button
                          type="button"
                          className="divida-btn-detalhes"
                          onClick={() =>
                            abrirDetalhes(
                              divida
                            )
                          }
                        >
                          <Calculator size={17} />
                          Plano de quitação
                        </button>

                        {[
                          "ativa",
                          "negociada",
                        ].includes(
                          divida.status
                        ) && (
                            <button
                              type="button"
                              className="divida-btn-secundario"
                              onClick={() =>
                                alternarNegociada(
                                  divida
                                )
                              }
                            >
                              {divida.status ===
                                "negociada"
                                ? "Reativar"
                                : "Negociada"}
                            </button>
                          )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>


        {modalFormulario && (
          <div className="dividas-modal-overlay">
            <div className="dividas-modal">
              <div className="dividas-modal-header">
                <div>
                  <span>
                    ORGANIZAR DÍVIDA
                  </span>

                  <h2>
                    {dividaEditando
                      ? "Editar dívida"
                      : "Nova dívida"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="dividas-modal-fechar"
                  onClick={
                    fecharFormulario
                  }
                >
                  <X size={20} />
                </button>
              </div>


              <div className="dividas-form">
                <label>
                  <span>
                    Nome da dívida
                  </span>

                  <input
                    type="text"
                    value={nome}
                    onChange={(
                      event
                    ) =>
                      setNome(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Cartão Nubank"
                  />
                </label>


                <label>
                  <span>
                    Credor
                  </span>

                  <input
                    type="text"
                    value={credor}
                    onChange={(
                      event
                    ) =>
                      setCredor(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Nubank"
                  />
                </label>


                <div className="dividas-form-grid">
                  <label>
                    <span>
                      Valor original
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        valorOriginal
                      }
                      onChange={(
                        event
                      ) =>
                        setValorOriginal(
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                    />
                  </label>


                  <label>
                    <span>
                      Saldo devedor atual
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        saldoAtual
                      }
                      onChange={(
                        event
                      ) =>
                        setSaldoAtual(
                          event.target.value
                        )
                      }
                      placeholder="Se vazio, usa o valor original"
                    />
                  </label>
                </div>


                <div className="dividas-form-grid">
                  <label>
                    <span>
                      Juros ao mês (%)
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        jurosMensal
                      }
                      onChange={(
                        event
                      ) =>
                        setJurosMensal(
                          event.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </label>


                  <label>
                    <span>
                      Parcela mínima
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        parcelaMinima
                      }
                      onChange={(
                        event
                      ) =>
                        setParcelaMinima(
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                    />
                  </label>
                </div>


                <div className="dividas-form-grid">
                  <label>
                    <span>
                      Dia do vencimento
                    </span>

                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={
                        vencimentoDia
                      }
                      onChange={(
                        event
                      ) =>
                        setVencimentoDia(
                          event.target.value
                        )
                      }
                      placeholder="Ex.: 15"
                    />
                  </label>


                  <label>
                    <span>
                      Prioridade
                    </span>

                    <select
                      value={
                        prioridade
                      }
                      onChange={(
                        event
                      ) =>
                        setPrioridade(
                          event.target.value
                        )
                      }
                    >
                      <option value="1">
                        1 — Urgente
                      </option>

                      <option value="2">
                        2 — Alta
                      </option>

                      <option value="3">
                        3 — Média
                      </option>

                      <option value="4">
                        4 — Baixa
                      </option>

                      <option value="5">
                        5 — Quando possível
                      </option>
                    </select>
                  </label>
                </div>
              </div>


              <div className="dividas-modal-footer">
                <button
                  type="button"
                  className="dividas-btn-fechar"
                  onClick={
                    fecharFormulario
                  }
                  disabled={
                    salvando
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="dividas-btn-salvar"
                  onClick={
                    salvarDivida
                  }
                  disabled={
                    salvando
                  }
                >
                  <Save size={18} />

                  {salvando
                    ? "Salvando..."
                    : dividaEditando
                      ? "Salvar alterações"
                      : "Cadastrar dívida"}
                </button>
              </div>
            </div>
          </div>
        )}


        {dividaDetalhe && (
          <div className="dividas-modal-overlay">
            <div className="dividas-modal dividas-modal-detalhes">
              <div className="dividas-modal-header">
                <div>
                  <span>
                    PLANO DE QUITAÇÃO
                  </span>

                  <h2>
                    {dividaDetalhe.nome}
                  </h2>
                </div>

                <button
                  type="button"
                  className="dividas-modal-fechar"
                  onClick={
                    fecharDetalhes
                  }
                >
                  <X size={20} />
                </button>
              </div>


              <div className="divida-detalhe-resumo">
                <div>
                  <span>
                    Saldo devedor
                  </span>

                  <strong>
                    {formatarMoeda(
                      dividaDetalhe.saldo_atual
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Juros mensais
                  </span>

                  <strong>
                    {formatarPercentual(
                      dividaDetalhe.juros_mensal
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Parcela mínima
                  </span>

                  <strong>
                    {dividaDetalhe.parcela_minima
                      ? formatarMoeda(
                        dividaDetalhe.parcela_minima
                      )
                      : "—"}
                  </strong>
                </div>
              </div>


              {dividaDetalhe.status !==
                "quitada" && (
                  <>
                    <section className="divida-pagamento">
                      <div className="divida-subtitulo">
                        <TrendingDown size={19} />

                        <div>
                          <strong>
                            Registrar pagamento
                          </strong>

                          <span>
                            O valor será abatido diretamente do saldo devedor.
                          </span>
                        </div>
                      </div>

                      <div className="divida-pagamento-linha">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            pagamento
                          }
                          onChange={(
                            event
                          ) =>
                            setPagamento(
                              event.target.value
                            )
                          }
                          placeholder="Valor pago"
                        />

                        <button
                          type="button"
                          onClick={
                            registrarPagamento
                          }
                          disabled={
                            salvando
                          }
                        >
                          Registrar
                        </button>
                      </div>
                    </section>


                    <section className="divida-simulador">
                      <div className="divida-subtitulo">
                        <Calculator size={19} />

                        <div>
                          <strong>
                            Simulador de quitação
                          </strong>

                          <span>
                            Estimativa simplificada com juros mensais constantes.
                          </span>
                        </div>
                      </div>


                      <label className="divida-simulador-campo">
                        <span>
                          Quanto pretende pagar por mês?
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            pagamentoSimulacao
                          }
                          onChange={(
                            event
                          ) =>
                            setPagamentoSimulacao(
                              event.target.value
                            )
                          }
                          placeholder="Ex.: 850"
                        />
                      </label>


                      {simulacaoBase && (
                        <div className="divida-simulacoes-grid">
                          <article>
                            <span>
                              Pagando{" "}
                              {formatarMoeda(
                                pagamentoSimulacao
                              )}
                              /mês
                            </span>

                            {simulacaoBase.quitavel ? (
                              <>
                                <strong>
                                  {simulacaoBase.meses} meses
                                </strong>

                                <p>
                                  Quitação estimada em{" "}
                                  <b>
                                    {adicionarMeses(
                                      simulacaoBase.meses
                                    )}
                                  </b>
                                </p>

                                <p>
                                  Juros estimados:{" "}
                                  <b>
                                    {formatarMoeda(
                                      simulacaoBase.totalJuros
                                    )}
                                  </b>
                                </p>

                                <p>
                                  Total estimado:{" "}
                                  <b>
                                    {formatarMoeda(
                                      simulacaoBase.totalPago
                                    )}
                                  </b>
                                </p>
                              </>
                            ) : (
                              <p className="divida-simulacao-alerta">
                                {simulacaoBase.motivo}
                              </p>
                            )}
                          </article>


                          {simulacaoExtra &&
                            simulacaoExtra.quitavel && (
                              <article className="destaque">
                                <span>
                                  Se pagar + R$ 300/mês
                                </span>

                                <strong>
                                  {simulacaoExtra.meses} meses
                                </strong>

                                <p>
                                  Quitação estimada em{" "}
                                  <b>
                                    {adicionarMeses(
                                      simulacaoExtra.meses
                                    )}
                                  </b>
                                </p>

                                <p>
                                  Juros estimados:{" "}
                                  <b>
                                    {formatarMoeda(
                                      simulacaoExtra.totalJuros
                                    )}
                                  </b>
                                </p>

                                {simulacaoBase.quitavel && (
                                  <p>
                                    Economia estimada de juros:{" "}
                                    <b>
                                      {formatarMoeda(
                                        Math.max(
                                          0,
                                          Number(
                                            simulacaoBase.totalJuros
                                          ) -
                                          Number(
                                            simulacaoExtra.totalJuros
                                          )
                                        )
                                      )}
                                    </b>
                                  </p>
                                )}
                              </article>
                            )}
                        </div>
                      )}

                      <div className="divida-aviso-calculo">
                        <AlertTriangle size={16} />

                        Esta é uma projeção do Rumo. O cálculo oficial do banco ou credor pode utilizar outras regras.
                      </div>
                    </section>


                    <section className="divida-plano">
                      <div className="divida-subtitulo">
                        <ReceiptText size={19} />

                        <div>
                          <strong>
                            Plano semanal
                          </strong>

                          <span>
                            Organize quanto pretende pagar em cada semana.
                          </span>
                        </div>
                      </div>


                      <div className="divida-plano-form-grid">
                        <label>
                          <span>
                            Semana
                          </span>

                          <input
                            type="date"
                            value={
                              semanaReferencia
                            }
                            onChange={(
                              event
                            ) =>
                              setSemanaReferencia(
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          <span>
                            Previsto
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              valorPrevisto
                            }
                            onChange={(
                              event
                            ) =>
                              setValorPrevisto(
                                event.target.value
                              )
                            }
                            placeholder="0,00"
                          />
                        </label>

                        <label>
                          <span>
                            Já pago
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              valorPagoPlano
                            }
                            onChange={(
                              event
                            ) =>
                              setValorPagoPlano(
                                event.target.value
                              )
                            }
                            placeholder="0,00"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={
                            criarParcela
                          }
                          disabled={
                            salvando
                          }
                        >
                          <Plus size={17} />
                          Adicionar
                        </button>
                      </div>
                    </section>
                  </>
                )}


              <section className="divida-plano-historico">
                <div className="divida-plano-resumo">
                  <div>
                    <span>
                      Previsto
                    </span>

                    <strong>
                      {formatarMoeda(
                        resumoPlano.previsto
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pago
                    </span>

                    <strong>
                      {formatarMoeda(
                        resumoPlano.pago
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pendências
                    </span>

                    <strong>
                      {resumoPlano.pendentes}
                    </strong>
                  </div>
                </div>


                <div className="divida-subtitulo">
                  <History size={19} />

                  <div>
                    <strong>
                      Cronograma de quitação
                    </strong>

                    <span>
                      {plano.length}{" "}
                      {plano.length === 1
                        ? "parcela"
                        : "parcelas"}
                    </span>
                  </div>
                </div>


                {carregandoPlano ? (
                  <div className="divida-plano-vazio">
                    Carregando plano...
                  </div>
                ) : plano.length === 0 ? (
                  <div className="divida-plano-vazio">
                    <ReceiptText size={27} />

                    <p>
                      Nenhuma parcela planejada ainda.
                    </p>
                  </div>
                ) : (
                  <div className="divida-plano-lista">
                    {plano.map(
                      (parcela) => (
                        <article
                          key={
                            parcela.id
                          }
                          className={`divida-parcela status-${parcela.status}`}
                        >
                          <div className="divida-parcela-data">
                            <CalendarDays size={18} />

                            <span>
                              {formatarData(
                                parcela.semana_referencia
                              )}
                            </span>
                          </div>

                          <div>
                            <span>
                              Previsto
                            </span>

                            <strong>
                              {formatarMoeda(
                                parcela.valor_previsto
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Pago
                            </span>

                            <strong>
                              {formatarMoeda(
                                parcela.valor_pago
                              )}
                            </strong>
                          </div>

                          <span
                            className={`divida-parcela-status status-${parcela.status}`}
                          >
                            {parcela.status ===
                              "pago" ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <Clock3 size={14} />
                            )}

                            {labelStatusParcela(
                              parcela.status
                            )}
                          </span>

                          <div className="divida-parcela-acoes">
                            <button
                              type="button"
                              title="Atualizar valor pago"
                              onClick={() =>
                                editarPagamentoParcela(
                                  parcela
                                )
                              }
                              disabled={
                                salvando
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              title="Excluir parcela"
                              className="perigo"
                              onClick={() =>
                                removerParcela(
                                  parcela
                                )
                              }
                              disabled={
                                salvando
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}


export default Dividas;