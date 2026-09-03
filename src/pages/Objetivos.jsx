import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Flag,
  History,
  Pencil,
  Pause,
  PiggyBank,
  Play,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  X,
  Ban,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import { useToast } from "../context/ToastContext";

import {
  adicionarAporteObjetivo,
  alterarStatusObjetivo,
  atualizarObjetivo,
  criarObjetivo,
  excluirAporteObjetivo,
  excluirObjetivo,
  listarAportesObjetivo,
  listarObjetivos,
} from "../services/objetivos";

import "./Objetivos.css";


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


function formatarData(data) {
  if (!data) {
    return "Sem prazo";
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
    return "Sem prazo";
  }

  return `${dia}/${mes}/${ano}`;
}


function progressoObjetivo(
  objetivo
) {
  const meta =
    Number(
      objetivo?.valor_meta || 0
    );

  const atual =
    Number(
      objetivo?.valor_atual || 0
    );

  if (meta <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (
        atual /
        meta
      ) * 100
    )
  );
}


function mesesRestantes(
  prazo
) {
  if (!prazo) {
    return null;
  }

  const destino =
    new Date(
      `${prazo}T23:59:59`
    );

  if (
    Number.isNaN(
      destino.getTime()
    )
  ) {
    return null;
  }

  const hoje =
    new Date();

  const diferenca =
    destino.getTime() -
    hoje.getTime();

  if (
    diferenca <= 0
  ) {
    return 0;
  }

  const dias =
    diferenca /
    (
      1000 *
      60 *
      60 *
      24
    );

  return Math.max(
    1,
    Math.ceil(
      dias / 30.4375
    )
  );
}


function valorMensalNecessario(
  objetivo
) {
  const meses =
    mesesRestantes(
      objetivo?.prazo_meta
    );

  if (
    meses === null ||
    meses <= 0
  ) {
    return null;
  }

  const restante =
    Math.max(
      0,
      Number(
        objetivo?.valor_meta || 0
      ) -
      Number(
        objetivo?.valor_atual || 0
      )
    );

  return restante / meses;
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
    ativo: "Ativo",
    pausado: "Pausado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return (
    mapa[status] ||
    status
  );
}


function hojeISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function Objetivos() {
  const {
    showToast,
  } = useToast();


  const [
    objetivos,
    setObjetivos,
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
    objetivoEditando,
    setObjetivoEditando,
  ] = useState(null);


  const [
    nome,
    setNome,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    valorMeta,
    setValorMeta,
  ] = useState("");

  const [
    prazoMeta,
    setPrazoMeta,
  ] = useState("");

  const [
    prioridade,
    setPrioridade,
  ] = useState("3");


  const [
    objetivoDetalhe,
    setObjetivoDetalhe,
  ] = useState(null);

  const [
    aportes,
    setAportes,
  ] = useState([]);

  const [
    carregandoAportes,
    setCarregandoAportes,
  ] = useState(false);


  const [
    valorAporte,
    setValorAporte,
  ] = useState("");

  const [
    dataAporte,
    setDataAporte,
  ] = useState(
    hojeISO()
  );

  const [
    observacaoAporte,
    setObservacaoAporte,
  ] = useState("");


  const [
    salvando,
    setSalvando,
  ] = useState(false);


  useEffect(() => {
    carregarObjetivos();
  }, []);


  async function carregarObjetivos() {
    try {
      setCarregando(true);
      setErro("");

      const dados =
        await listarObjetivos();

      setObjetivos(
        dados
      );

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Erro:",
        error
      );

      setErro(
        "Não foi possível carregar seus objetivos."
      );

    } finally {
      setCarregando(false);
    }
  }


  function limparFormulario() {
    setObjetivoEditando(
      null
    );

    setNome("");
    setDescricao("");
    setValorMeta("");
    setPrazoMeta("");
    setPrioridade("3");
  }


  function abrirNovoObjetivo() {
    limparFormulario();

    setModalFormulario(
      true
    );
  }


  function abrirEditarObjetivo(
    objetivo
  ) {
    setObjetivoEditando(
      objetivo
    );

    setNome(
      objetivo.nome || ""
    );

    setDescricao(
      objetivo.descricao || ""
    );

    setValorMeta(
      String(
        objetivo.valor_meta ??
        ""
      )
    );

    setPrazoMeta(
      objetivo.prazo_meta
        ? String(
            objetivo.prazo_meta
          ).split("T")[0]
        : ""
    );

    setPrioridade(
      String(
        objetivo.prioridade ??
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


  async function salvarObjetivo() {
    try {
      setSalvando(true);

      if (
        objetivoEditando
      ) {
        await atualizarObjetivo(
          objetivoEditando.id,
          {
            nome,
            descricao,
            valorMeta,
            prazoMeta:
              prazoMeta ||
              null,
            prioridade:
              Number(
                prioridade
              ),
          }
        );

        showToast(
          "Objetivo atualizado",
          "As informações foram atualizadas.",
          "success"
        );

      } else {
        await criarObjetivo({
          nome,
          descricao,
          valorMeta,
          prazoMeta:
            prazoMeta ||
            null,
          prioridade:
            Number(
              prioridade
            ),
        });

        showToast(
          "Objetivo criado",
          "Sua nova conquista já está sendo acompanhada.",
          "success"
        );
      }

      setModalFormulario(
        false
      );

      limparFormulario();

      await carregarObjetivos();

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Erro ao salvar:",
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


  async function abrirDetalhes(
    objetivo
  ) {
    setObjetivoDetalhe(
      objetivo
    );

    setValorAporte("");
    setDataAporte(
      hojeISO()
    );
    setObservacaoAporte("");

    await carregarAportes(
      objetivo.id
    );
  }


  async function carregarAportes(
    objetivoId
  ) {
    try {
      setCarregandoAportes(
        true
      );

      const dados =
        await listarAportesObjetivo(
          objetivoId
        );

      setAportes(
        dados
      );

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Erro ao carregar aportes:",
        error
      );

      showToast(
        "Histórico indisponível",
        "Não foi possível carregar os aportes.",
        "error"
      );

    } finally {
      setCarregandoAportes(
        false
      );
    }
  }


  function fecharDetalhes() {
    if (salvando) {
      return;
    }

    setObjetivoDetalhe(
      null
    );

    setAportes([]);
    setValorAporte("");
    setObservacaoAporte("");
  }


  async function adicionarAporte() {
    if (
      !objetivoDetalhe
    ) {
      return;
    }

    try {
      setSalvando(true);

      await adicionarAporteObjetivo(
        objetivoDetalhe.id,
        {
          valor:
            valorAporte,

          dataAporte:
            dataAporte ||
            hojeISO(),

          observacao:
            observacaoAporte,
        }
      );

      showToast(
        "Aporte registrado",
        "O progresso do objetivo foi atualizado.",
        "success"
      );

      setValorAporte("");
      setObservacaoAporte("");
      setDataAporte(
        hojeISO()
      );

      await carregarObjetivos();

      const atualizados =
        await listarObjetivos();

      setObjetivos(
        atualizados
      );

      const atualizado =
        atualizados.find(
          (item) =>
            item.id ===
            objetivoDetalhe.id
        );

      if (atualizado) {
        setObjetivoDetalhe(
          atualizado
        );
      }

      await carregarAportes(
        objetivoDetalhe.id
      );

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Erro no aporte:",
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


  async function removerAporte(
    aporte
  ) {
    const confirmou =
      window.confirm(
        `Excluir o aporte de ${formatarMoeda(
          aporte.valor
        )}?`
      );

    if (!confirmou) {
      return;
    }

    try {
      setSalvando(true);

      await excluirAporteObjetivo(
        aporte.id
      );

      showToast(
        "Aporte excluído",
        "O valor do objetivo foi recalculado.",
        "success"
      );

      const atualizados =
        await listarObjetivos();

      setObjetivos(
        atualizados
      );

      const atualizado =
        atualizados.find(
          (item) =>
            item.id ===
            objetivoDetalhe.id
        );

      if (atualizado) {
        setObjetivoDetalhe(
          atualizado
        );
      }

      await carregarAportes(
        objetivoDetalhe.id
      );

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Erro ao excluir aporte:",
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


  async function alternarPausa(
    objetivo
  ) {
    try {
      const novoStatus =
        objetivo.status ===
        "pausado"
          ? "ativo"
          : "pausado";

      await alterarStatusObjetivo(
        objetivo.id,
        novoStatus
      );

      showToast(
        novoStatus ===
        "ativo"
          ? "Objetivo retomado"
          : "Objetivo pausado",
        novoStatus ===
        "ativo"
          ? "O planejamento foi retomado."
          : "O objetivo ficará pausado até você retomá-lo.",
        "success"
      );

      await carregarObjetivos();

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Status:",
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


  async function cancelarObjetivo(
    objetivo
  ) {
    const confirmou =
      window.confirm(
        `Cancelar o objetivo "${objetivo.nome}"? O histórico de aportes será preservado.`
      );

    if (!confirmou) {
      return;
    }

    try {
      await alterarStatusObjetivo(
        objetivo.id,
        "cancelado"
      );

      showToast(
        "Objetivo cancelado",
        "O histórico financeiro foi preservado.",
        "success"
      );

      if (
        objetivoDetalhe?.id ===
        objetivo.id
      ) {
        setObjetivoDetalhe(
          null
        );
      }

      await carregarObjetivos();

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Cancelamento:",
        error
      );

      showToast(
        "Não foi possível cancelar",
        error?.message ??
          "Tente novamente.",
        "error"
      );
    }
  }


  async function removerObjetivo(
    objetivo
  ) {
    const confirmou =
      window.confirm(
        `Excluir definitivamente "${objetivo.nome}"?`
      );

    if (!confirmou) {
      return;
    }

    try {
      await excluirObjetivo(
        objetivo.id
      );

      showToast(
        "Objetivo excluído",
        "O objetivo foi removido.",
        "success"
      );

      await carregarObjetivos();

    } catch (error) {
      console.error(
        "[RUMO OBJETIVOS] Exclusão:",
        error
      );

      showToast(
        "Não foi possível excluir",
        error?.message ??
          "Tente cancelar o objetivo.",
        "error"
      );
    }
  }


  const resumo =
    useMemo(() => {
      const validos =
        objetivos.filter(
          (objetivo) =>
            objetivo.status !==
            "cancelado"
        );

      const totalPlanejado =
        validos.reduce(
          (
            total,
            objetivo
          ) =>
            total +
            Number(
              objetivo.valor_meta ||
              0
            ),
          0
        );

      const totalReservado =
        validos.reduce(
          (
            total,
            objetivo
          ) =>
            total +
            Number(
              objetivo.valor_atual ||
              0
            ),
          0
        );

      const ativos =
        validos.filter(
          (objetivo) =>
            objetivo.status ===
            "ativo"
        ).length;

      const concluidos =
        validos.filter(
          (objetivo) =>
            objetivo.status ===
            "concluido"
        ).length;

      return {
        totalPlanejado,
        totalReservado,
        ativos,
        concluidos,
      };
    }, [objetivos]);


  const objetivosOrdenados =
    useMemo(() => {
      const pesoStatus = {
        ativo: 1,
        pausado: 2,
        concluido: 3,
        cancelado: 4,
      };

      return [
        ...objetivos,
      ].sort(
        (a, b) => {
          const status =
            (
              pesoStatus[a.status] ??
              99
            ) -
            (
              pesoStatus[b.status] ??
              99
            );

          if (status !== 0) {
            return status;
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
    }, [objetivos]);


  if (carregando) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="objetivos-loading">
            <Trophy size={38} />

            <h2>
              Preparando suas conquistas...
            </h2>

            <p>
              O Rumo está organizando
              seus objetivos financeiros.
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
          <div className="objetivos-erro">
            <Target size={38} />

            <h2>
              Não foi possível carregar seus objetivos.
            </h2>

            <p>
              {erro}
            </p>

            <button
              type="button"
              onClick={
                carregarObjetivos
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
          titulo="Objetivos Financeiros"
          subtitulo="Planeje suas conquistas, registre aportes e acompanhe cada etapa."
        >
          <div className="objetivos-header-actions">
            <span className="objetivos-premium-badge">
              <Sparkles size={15} />
              Premium
            </span>

            <button
              type="button"
              className="objetivos-btn-novo"
              onClick={
                abrirNovoObjetivo
              }
            >
              <Plus size={18} />
              Novo Objetivo
            </button>
          </div>
        </PageHeader>


        <section className="objetivos-resumo-grid">
          <article className="objetivos-resumo-card">
            <Target size={22} />

            <div>
              <span>
                Total dos objetivos
              </span>

              <strong>
                {formatarMoeda(
                  resumo.totalPlanejado
                )}
              </strong>
            </div>
          </article>


          <article className="objetivos-resumo-card">
            <PiggyBank size={22} />

            <div>
              <span>
                Já reservado
              </span>

              <strong>
                {formatarMoeda(
                  resumo.totalReservado
                )}
              </strong>
            </div>
          </article>


          <article className="objetivos-resumo-card">
            <Clock3 size={22} />

            <div>
              <span>
                Em andamento
              </span>

              <strong>
                {resumo.ativos}
              </strong>
            </div>
          </article>


          <article className="objetivos-resumo-card">
            <Trophy size={22} />

            <div>
              <span>
                Conquistas
              </span>

              <strong>
                {resumo.concluidos}
              </strong>
            </div>
          </article>
        </section>


        <section className="objetivos-section">
          <div className="objetivos-section-heading">
            <div>
              <span>
                SUAS CONQUISTAS
              </span>

              <h2>
                Meus objetivos
              </h2>
            </div>

            <div className="objetivos-contagem">
              {objetivos.length}{" "}
              {objetivos.length === 1
                ? "objetivo"
                : "objetivos"}
            </div>
          </div>


          {objetivosOrdenados.length === 0 ? (
            <div className="objetivos-vazio">
              <Trophy size={38} />

              <h3>
                Qual é sua próxima conquista?
              </h3>

              <p>
                Pode ser uma viagem,
                um carro, uma reforma,
                um curso ou qualquer
                projeto importante para você.
              </p>

              <button
                type="button"
                onClick={
                  abrirNovoObjetivo
                }
              >
                <Plus size={18} />
                Criar objetivo
              </button>
            </div>
          ) : (
            <div className="objetivos-grid">
              {objetivosOrdenados.map(
                (objetivo) => {
                  const progresso =
                    progressoObjetivo(
                      objetivo
                    );

                  const restante =
                    Math.max(
                      0,
                      Number(
                        objetivo.valor_meta ||
                        0
                      ) -
                      Number(
                        objetivo.valor_atual ||
                        0
                      )
                    );

                  const mensal =
                    valorMensalNecessario(
                      objetivo
                    );

                  return (
                    <article
                      key={
                        objetivo.id
                      }
                      className={`objetivo-card status-${objetivo.status}`}
                    >
                      <div className="objetivo-card-topo">
                        <div className="objetivo-card-identidade">
                          <div className="objetivo-card-icone">
                            {objetivo.status ===
                            "concluido" ? (
                              <Trophy size={22} />
                            ) : (
                              <Target size={22} />
                            )}
                          </div>

                          <div>
                            <div className="objetivo-badges">
                              <span
                                className={`objetivo-status status-${objetivo.status}`}
                              >
                                {labelStatus(
                                  objetivo.status
                                )}
                              </span>

                              <span
                                className={`objetivo-prioridade prioridade-${objetivo.prioridade}`}
                              >
                                <Flag size={11} />

                                {labelPrioridade(
                                  objetivo.prioridade
                                )}
                              </span>
                            </div>

                            <h3>
                              {objetivo.nome}
                            </h3>
                          </div>
                        </div>


                        <div className="objetivo-acoes-mini">
                          {objetivo.status !==
                            "cancelado" && (
                            <button
                              type="button"
                              title="Editar"
                              onClick={() =>
                                abrirEditarObjetivo(
                                  objetivo
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
                              removerObjetivo(
                                objetivo
                              )
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>


                      {objetivo.descricao && (
                        <p className="objetivo-descricao">
                          {objetivo.descricao}
                        </p>
                      )}


                      <div className="objetivo-valores">
                        <div>
                          <span>
                            Reservado
                          </span>

                          <strong>
                            {formatarMoeda(
                              objetivo.valor_atual
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Objetivo
                          </span>

                          <strong>
                            {formatarMoeda(
                              objetivo.valor_meta
                            )}
                          </strong>
                        </div>
                      </div>


                      <div className="objetivo-progresso">
                        <div className="objetivo-progresso-topo">
                          <span>
                            Progresso
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

                        <div className="objetivo-progresso-barra">
                          <div
                            style={{
                              width:
                                `${progresso}%`,
                            }}
                          />
                        </div>
                      </div>


                      <div className="objetivo-info">
                        <div>
                          <CircleDollarSign size={17} />

                          <span>
                            Falta{" "}
                            <strong>
                              {formatarMoeda(
                                restante
                              )}
                            </strong>
                          </span>
                        </div>

                        <div>
                          <CalendarDays size={17} />

                          <span>
                            {formatarData(
                              objetivo.prazo_meta
                            )}
                          </span>
                        </div>
                      </div>


                      {objetivo.status ===
                        "ativo" &&
                        mensal !==
                          null && (
                          <div className="objetivo-ritmo">
                            <PiggyBank size={18} />

                            <div>
                              <span>
                                Sugestão mensal
                              </span>

                              <strong>
                                {formatarMoeda(
                                  mensal
                                )}
                                /mês
                              </strong>
                            </div>
                          </div>
                        )}


                      <div className="objetivo-card-acoes">
                        <button
                          type="button"
                          className="objetivo-btn-detalhes"
                          onClick={() =>
                            abrirDetalhes(
                              objetivo
                            )
                          }
                        >
                          <History size={17} />
                          Ver detalhes
                          <ChevronRight size={16} />
                        </button>

                        {[
                          "ativo",
                          "pausado",
                        ].includes(
                          objetivo.status
                        ) && (
                          <button
                            type="button"
                            className="objetivo-btn-secundario"
                            onClick={() =>
                              alternarPausa(
                                objetivo
                              )
                            }
                          >
                            {objetivo.status ===
                            "pausado" ? (
                              <>
                                <Play size={16} />
                                Retomar
                              </>
                            ) : (
                              <>
                                <Pause size={16} />
                                Pausar
                              </>
                            )}
                          </button>
                        )}

                        {[
                          "ativo",
                          "pausado",
                        ].includes(
                          objetivo.status
                        ) && (
                          <button
                            type="button"
                            className="objetivo-btn-cancelar"
                            title="Cancelar objetivo"
                            onClick={() =>
                              cancelarObjetivo(
                                objetivo
                              )
                            }
                          >
                            <Ban size={16} />
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
          <div className="objetivos-modal-overlay">
            <div className="objetivos-modal">
              <div className="objetivos-modal-header">
                <div>
                  <span>
                    PLANEJAMENTO
                  </span>

                  <h2>
                    {objetivoEditando
                      ? "Editar objetivo"
                      : "Novo objetivo"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="objetivos-modal-fechar"
                  onClick={
                    fecharFormulario
                  }
                >
                  <X size={20} />
                </button>
              </div>


              <div className="objetivos-form">
                <label>
                  <span>
                    Nome do objetivo
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
                    placeholder="Ex.: Viagem para o Nordeste"
                  />
                </label>


                <label>
                  <span>
                    Descrição
                  </span>

                  <textarea
                    rows="3"
                    value={
                      descricao
                    }
                    onChange={(
                      event
                    ) =>
                      setDescricao(
                        event.target.value
                      )
                    }
                    placeholder="Descreva sua conquista..."
                  />
                </label>


                <div className="objetivos-form-grid">
                  <label>
                    <span>
                      Valor necessário
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        valorMeta
                      }
                      onChange={(
                        event
                      ) =>
                        setValorMeta(
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                    />
                  </label>


                  <label>
                    <span>
                      Prazo
                    </span>

                    <input
                      type="date"
                      value={
                        prazoMeta
                      }
                      onChange={(
                        event
                      ) =>
                        setPrazoMeta(
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>


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


              <div className="objetivos-modal-footer">
                <button
                  type="button"
                  className="objetivos-btn-fechar"
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
                  className="objetivos-btn-salvar"
                  onClick={
                    salvarObjetivo
                  }
                  disabled={
                    salvando
                  }
                >
                  <Save size={18} />

                  {salvando
                    ? "Salvando..."
                    : objetivoEditando
                    ? "Salvar alterações"
                    : "Criar objetivo"}
                </button>
              </div>
            </div>
          </div>
        )}


        {objetivoDetalhe && (
          <div className="objetivos-modal-overlay">
            <div className="objetivos-modal objetivos-modal-detalhes">
              <div className="objetivos-modal-header">
                <div>
                  <span>
                    HISTÓRICO DA CONQUISTA
                  </span>

                  <h2>
                    {objetivoDetalhe.nome}
                  </h2>
                </div>

                <button
                  type="button"
                  className="objetivos-modal-fechar"
                  onClick={
                    fecharDetalhes
                  }
                >
                  <X size={20} />
                </button>
              </div>


              <div className="objetivo-detalhe-resumo">
                <div>
                  <span>
                    Reservado
                  </span>

                  <strong>
                    {formatarMoeda(
                      objetivoDetalhe.valor_atual
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Objetivo
                  </span>

                  <strong>
                    {formatarMoeda(
                      objetivoDetalhe.valor_meta
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Progresso
                  </span>

                  <strong>
                    {progressoObjetivo(
                      objetivoDetalhe
                    ).toLocaleString(
                      "pt-BR",
                      {
                        maximumFractionDigits:
                          1,
                      }
                    )}
                    %
                  </strong>
                </div>
              </div>


              {[
                "ativo",
                "pausado",
              ].includes(
                objetivoDetalhe.status
              ) && (
                <div className="objetivo-novo-aporte">
                  <div className="objetivo-subtitulo">
                    <Plus size={18} />

                    <div>
                      <strong>
                        Registrar aporte
                      </strong>

                      <span>
                        Cada aporte ficará salvo no histórico.
                      </span>
                    </div>
                  </div>


                  <div className="objetivo-aporte-grid">
                    <label>
                      <span>
                        Valor
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          valorAporte
                        }
                        onChange={(
                          event
                        ) =>
                          setValorAporte(
                            event.target.value
                          )
                        }
                        placeholder="0,00"
                      />
                    </label>


                    <label>
                      <span>
                        Data
                      </span>

                      <input
                        type="date"
                        value={
                          dataAporte
                        }
                        onChange={(
                          event
                        ) =>
                          setDataAporte(
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>


                  <label className="objetivo-observacao">
                    <span>
                      Observação
                    </span>

                    <input
                      type="text"
                      value={
                        observacaoAporte
                      }
                      onChange={(
                        event
                      ) =>
                        setObservacaoAporte(
                          event.target.value
                        )
                      }
                      placeholder="Ex.: Parte do 13º salário"
                    />
                  </label>


                  <button
                    type="button"
                    className="objetivo-btn-aportar"
                    onClick={
                      adicionarAporte
                    }
                    disabled={
                      salvando
                    }
                  >
                    <PiggyBank size={18} />

                    {salvando
                      ? "Registrando..."
                      : "Registrar aporte"}
                  </button>
                </div>
              )}


              <div className="objetivo-historico">
                <div className="objetivo-subtitulo">
                  <History size={18} />

                  <div>
                    <strong>
                      Histórico de aportes
                    </strong>

                    <span>
                      {aportes.length}{" "}
                      {aportes.length === 1
                        ? "registro"
                        : "registros"}
                    </span>
                  </div>
                </div>


                {carregandoAportes ? (
                  <div className="objetivo-historico-vazio">
                    Carregando histórico...
                  </div>
                ) : aportes.length === 0 ? (
                  <div className="objetivo-historico-vazio">
                    <FileText size={26} />

                    <p>
                      Nenhum aporte registrado ainda.
                    </p>
                  </div>
                ) : (
                  <div className="objetivo-historico-lista">
                    {aportes.map(
                      (aporte) => (
                        <article
                          key={
                            aporte.id
                          }
                          className="objetivo-aporte-item"
                        >
                          <div className="objetivo-aporte-icone">
                            <CheckCircle2 size={18} />
                          </div>

                          <div className="objetivo-aporte-conteudo">
                            <strong>
                              +{" "}
                              {formatarMoeda(
                                aporte.valor
                              )}
                            </strong>

                            <span>
                              {formatarData(
                                aporte.data_aporte
                              )}
                            </span>

                            {aporte.observacao && (
                              <p>
                                {aporte.observacao}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            title="Excluir aporte"
                            onClick={() =>
                              removerAporte(
                                aporte
                              )
                            }
                            disabled={
                              salvando
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}


export default Objetivos;