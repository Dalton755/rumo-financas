import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowUpCircle,
    CalendarDays,
    Clock3,
    Pencil,
    PiggyBank,
    Play,
    Plus,
    Save,
    Sparkles,
    Target,
    Trash2,
    Trophy,
    WalletCards,
    X,
    Pause,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import { useToast } from "../context/ToastContext";

import {
    adicionarValorMeta,
    alterarStatusMeta,
    atualizarMeta,
    criarMeta,
    excluirMeta,
    listarContasParaMetas,
    listarMetas,
} from "../services/metas";

import "./Metas.css";


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

    const [ano, mes, dia] =
        String(data)
            .split("T")[0]
            .split("-");

    if (
        !ano ||
        !mes ||
        !dia
    ) {
        return "Sem prazo";
    }

    return `${dia}/${mes}/${ano}`;
}


function calcularProgresso(meta) {
    const alvo =
        Number(
            meta?.valor_meta || 0
        );

    const atual =
        Number(
            meta?.valor_atual || 0
        );

    if (alvo <= 0) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(
            100,
            (
                atual /
                alvo
            ) * 100
        )
    );
}


function calcularMesesRestantes(prazo) {
    if (!prazo) {
        return null;
    }

    const hoje =
        new Date();

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

    const diferenca =
        destino.getTime() -
        hoje.getTime();

    if (diferenca <= 0) {
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


function calcularValorMensal(meta) {
    const meses =
        calcularMesesRestantes(
            meta?.prazo
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
                meta?.valor_meta || 0
            ) -
            Number(
                meta?.valor_atual || 0
            )
        );

    return restante / meses;
}


function Metas() {
    const {
        showToast,
    } = useToast();

    const [
        metas,
        setMetas,
    ] = useState([]);

    const [
        contas,
        setContas,
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
        modalMetaAberto,
        setModalMetaAberto,
    ] = useState(false);

    const [
        metaEditando,
        setMetaEditando,
    ] = useState(null);


    const [
        descricao,
        setDescricao,
    ] = useState("");

    const [
        valorMeta,
        setValorMeta,
    ] = useState("");

    const [
        valorAtual,
        setValorAtual,
    ] = useState("");

    const [
        prazo,
        setPrazo,
    ] = useState("");

    const [
        contaId,
        setContaId,
    ] = useState("");


    const [
        metaAporte,
        setMetaAporte,
    ] = useState(null);

    const [
        valorAporte,
        setValorAporte,
    ] = useState("");


    const [
        salvando,
        setSalvando,
    ] = useState(false);


    useEffect(() => {
        carregarDados();
    }, []);


    async function carregarDados() {
        try {
            setCarregando(true);
            setErro("");

            const [
                metasResultado,
                contasResultado,
            ] =
                await Promise.all([
                    listarMetas(),
                    listarContasParaMetas(),
                ]);

            setMetas(
                metasResultado
            );

            setContas(
                contasResultado
            );

        } catch (error) {
            console.error(
                "[RUMO METAS] Erro ao carregar:",
                error
            );

            setErro(
                "Não foi possível carregar suas metas."
            );

        } finally {
            setCarregando(false);
        }
    }


    function limparFormulario() {
        setMetaEditando(null);

        setDescricao("");
        setValorMeta("");
        setValorAtual("");
        setPrazo("");
        setContaId("");
    }


    function abrirNovaMeta() {
        limparFormulario();

        setModalMetaAberto(
            true
        );
    }


    function abrirEditarMeta(meta) {
        setMetaEditando(
            meta
        );

        setDescricao(
            meta.descricao || ""
        );

        setValorMeta(
            String(
                meta.valor_meta ?? ""
            )
        );

        setValorAtual(
            String(
                meta.valor_atual ?? 0
            )
        );

        setPrazo(
            meta.prazo
                ? String(
                    meta.prazo
                ).split("T")[0]
                : ""
        );

        setContaId(
            meta.conta_id || ""
        );

        setModalMetaAberto(
            true
        );
    }


    function fecharModalMeta() {
        if (salvando) {
            return;
        }

        setModalMetaAberto(
            false
        );

        limparFormulario();
    }


    async function salvarMeta() {
        try {
            setSalvando(true);

            if (metaEditando) {
                await atualizarMeta(
                    metaEditando.id,
                    {
                        descricao,
                        valorMeta,
                        valorAtual,
                        prazo:
                            prazo || null,
                        contaId:
                            contaId || null,
                    }
                );

                showToast(
                    "Meta atualizada",
                    "As informações da meta foram atualizadas.",
                    "success"
                );

            } else {
                await criarMeta({
                    descricao,
                    valorMeta,
                    valorAtual:
                        valorAtual || 0,
                    prazo:
                        prazo || null,
                    contaId:
                        contaId || null,
                });

                showToast(
                    "Meta criada",
                    "Sua nova meta financeira foi criada.",
                    "success"
                );
            }

            setModalMetaAberto(false);
            limparFormulario();

            await carregarDados();

        } catch (error) {
            console.error(
                "[RUMO METAS] Erro ao salvar:",
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


    function abrirAporte(meta) {
        setMetaAporte(
            meta
        );

        setValorAporte("");
    }


    function fecharAporte() {
        if (salvando) {
            return;
        }

        setMetaAporte(null);
        setValorAporte("");
    }


    async function confirmarAporte() {
        if (!metaAporte) {
            return;
        }

        try {
            setSalvando(true);

            await adicionarValorMeta(
                metaAporte.id,
                valorAporte
            );

            showToast(
                "Valor adicionado",
                "O progresso da meta foi atualizado.",
                "success"
            );

            setMetaAporte(null);
            setValorAporte("");

            await carregarDados();

        } catch (error) {
            console.error(
                "[RUMO METAS] Erro ao adicionar valor:",
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


    async function alternarPausa(meta) {
        try {
            const novoStatus =
                meta.status ===
                    "PAUSADA"
                    ? "ATIVA"
                    : "PAUSADA";

            await alterarStatusMeta(
                meta.id,
                novoStatus
            );

            showToast(
                novoStatus === "ATIVA"
                    ? "Meta retomada"
                    : "Meta pausada",
                novoStatus === "ATIVA"
                    ? "O acompanhamento da meta foi retomado."
                    : "A meta ficará pausada até você retomá-la.",
                "success"
            );

            await carregarDados();

        } catch (error) {
            console.error(
                "[RUMO METAS] Erro ao alterar status:",
                error
            );

            showToast(
                "Não foi possível alterar a meta",
                error?.message ??
                "Tente novamente.",
                "error"
            );
        }
    }


    async function removerMeta(meta) {
        const confirmou =
            window.confirm(
                `Excluir a meta "${meta.descricao}"?`
            );

        if (!confirmou) {
            return;
        }

        try {
            await excluirMeta(
                meta.id
            );

            showToast(
                "Meta excluída",
                "A meta foi removida.",
                "success"
            );

            await carregarDados();

        } catch (error) {
            console.error(
                "[RUMO METAS] Erro ao excluir:",
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


    const contasPorId =
        useMemo(() => {
            const mapa =
                new Map();

            contas.forEach(
                (conta) => {
                    mapa.set(
                        conta.id,
                        conta
                    );
                }
            );

            return mapa;
        }, [contas]);


    const resumo =
        useMemo(() => {
            const totalPlanejado =
                metas.reduce(
                    (
                        total,
                        meta
                    ) =>
                        total +
                        Number(
                            meta.valor_meta || 0
                        ),
                    0
                );

            const totalAcumulado =
                metas.reduce(
                    (
                        total,
                        meta
                    ) =>
                        total +
                        Number(
                            meta.valor_atual || 0
                        ),
                    0
                );

            const ativas =
                metas.filter(
                    (meta) =>
                        meta.status ===
                        "ATIVA"
                ).length;

            const concluidas =
                metas.filter(
                    (meta) =>
                        meta.status ===
                        "CONCLUIDA"
                ).length;

            const progresso =
                totalPlanejado > 0
                    ? Math.min(
                        100,
                        (
                            totalAcumulado /
                            totalPlanejado
                        ) * 100
                    )
                    : 0;

            return {
                totalPlanejado,
                totalAcumulado,
                ativas,
                concluidas,
                progresso,
            };
        }, [metas]);


    const metasOrdenadas =
        useMemo(() => {
            const peso = {
                ATIVA: 1,
                PAUSADA: 2,
                CONCLUIDA: 3,
            };

            return [
                ...metas,
            ].sort(
                (a, b) =>
                    (
                        peso[a.status] ??
                        99
                    ) -
                    (
                        peso[b.status] ??
                        99
                    )
            );
        }, [metas]);


    if (carregando) {
        return (
            <MainLayout>
                <PageContainer>
                    <div className="metas-loading">
                        <Target size={38} />

                        <h2>
                            Organizando suas metas...
                        </h2>

                        <p>
                            O Rumo está preparando
                            seu planejamento financeiro.
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
                    <div className="metas-erro">
                        <Target size={38} />

                        <h2>
                            Não foi possível carregar suas metas.
                        </h2>

                        <p>
                            {erro}
                        </p>

                        <button
                            type="button"
                            onClick={
                                carregarDados
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
                    titulo="Metas Financeiras"
                    subtitulo="Transforme planos em números claros e acompanhe cada avanço."
                >
                    <div className="metas-header-actions">
                        <span className="metas-premium-badge">
                            <Sparkles size={15} />
                            Premium
                        </span>

                        <button
                            type="button"
                            className="metas-btn-nova"
                            onClick={
                                abrirNovaMeta
                            }
                        >
                            <Plus size={18} />
                            Nova Meta
                        </button>
                    </div>
                </PageHeader>


                <section className="metas-resumo-grid">
                    <article className="metas-resumo-card">
                        <div className="metas-resumo-icon">
                            <Target size={22} />
                        </div>

                        <div>
                            <span>
                                Total planejado
                            </span>

                            <strong>
                                {formatarMoeda(
                                    resumo.totalPlanejado
                                )}
                            </strong>
                        </div>
                    </article>


                    <article className="metas-resumo-card">
                        <div className="metas-resumo-icon">
                            <PiggyBank size={22} />
                        </div>

                        <div>
                            <span>
                                Já acumulado
                            </span>

                            <strong>
                                {formatarMoeda(
                                    resumo.totalAcumulado
                                )}
                            </strong>
                        </div>
                    </article>


                    <article className="metas-resumo-card">
                        <div className="metas-resumo-icon">
                            <Clock3 size={22} />
                        </div>

                        <div>
                            <span>
                                Metas ativas
                            </span>

                            <strong>
                                {resumo.ativas}
                            </strong>
                        </div>
                    </article>


                    <article className="metas-resumo-card">
                        <div className="metas-resumo-icon">
                            <Trophy size={22} />
                        </div>

                        <div>
                            <span>
                                Progresso geral
                            </span>

                            <strong>
                                {resumo.progresso.toLocaleString(
                                    "pt-BR",
                                    {
                                        maximumFractionDigits:
                                            1,
                                    }
                                )}
                                %
                            </strong>
                        </div>
                    </article>
                </section>


                <section className="metas-section">
                    <div className="metas-section-heading">
                        <div>
                            <span>
                                SEU PLANEJAMENTO
                            </span>

                            <h2>
                                Minhas metas
                            </h2>
                        </div>

                        <div className="metas-section-contagem">
                            {metas.length}{" "}
                            {metas.length === 1
                                ? "meta"
                                : "metas"}
                        </div>
                    </div>


                    {metasOrdenadas.length === 0 ? (
                        <div className="metas-vazio">
                            <div className="metas-vazio-icon">
                                <Target size={34} />
                            </div>

                            <h3>
                                Sua primeira meta começa aqui
                            </h3>

                            <p>
                                Defina um valor, escolha
                                um prazo e acompanhe o
                                progresso pelo Rumo.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    abrirNovaMeta
                                }
                            >
                                <Plus size={18} />
                                Criar primeira meta
                            </button>
                        </div>
                    ) : (
                        <div className="metas-grid">
                            {metasOrdenadas.map(
                                (meta) => {
                                    const progresso =
                                        calcularProgresso(
                                            meta
                                        );

                                    const restante =
                                        Math.max(
                                            0,
                                            Number(
                                                meta.valor_meta ||
                                                0
                                            ) -
                                            Number(
                                                meta.valor_atual ||
                                                0
                                            )
                                        );

                                    const mensal =
                                        calcularValorMensal(
                                            meta
                                        );

                                    const conta =
                                        contasPorId.get(
                                            meta.conta_id
                                        );

                                    return (
                                        <article
                                            className={`meta-card status-${String(
                                                meta.status
                                            ).toLowerCase()}`}
                                            key={meta.id}
                                        >
                                            <div className="meta-card-topo">
                                                <div className="meta-card-titulo">
                                                    <div className="meta-card-icon">
                                                        {meta.status ===
                                                            "CONCLUIDA" ? (
                                                            <Trophy size={22} />
                                                        ) : (
                                                            <Target size={22} />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <span
                                                            className={`meta-status status-${String(
                                                                meta.status
                                                            ).toLowerCase()}`}
                                                        >
                                                            {meta.status ===
                                                                "CONCLUIDA"
                                                                ? "Concluída"
                                                                : meta.status ===
                                                                    "PAUSADA"
                                                                    ? "Pausada"
                                                                    : "Ativa"}
                                                        </span>

                                                        <h3>
                                                            {meta.descricao}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="meta-card-acoes-mini">
                                                    <button
                                                        type="button"
                                                        title="Editar meta"
                                                        onClick={() =>
                                                            abrirEditarMeta(
                                                                meta
                                                            )
                                                        }
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Excluir meta"
                                                        className="perigo"
                                                        onClick={() =>
                                                            removerMeta(
                                                                meta
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </div>


                                            <div className="meta-valores">
                                                <div>
                                                    <span>
                                                        Acumulado
                                                    </span>

                                                    <strong>
                                                        {formatarMoeda(
                                                            meta.valor_atual
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Meta
                                                    </span>

                                                    <strong>
                                                        {formatarMoeda(
                                                            meta.valor_meta
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>


                                            <div className="meta-progresso-linha">
                                                <div>
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

                                                <div className="meta-progresso-barra">
                                                    <div
                                                        style={{
                                                            width:
                                                                `${progresso}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>


                                            <div className="meta-informacoes">
                                                <div>
                                                    <PiggyBank size={17} />

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
                                                            meta.prazo
                                                        )}
                                                    </span>
                                                </div>

                                                <div>
                                                    <WalletCards size={17} />

                                                    <span>
                                                        {conta
                                                            ? conta.nome
                                                            : "Sem conta vinculada"}
                                                    </span>
                                                </div>
                                            </div>


                                            {meta.status !==
                                                "CONCLUIDA" &&
                                                mensal !==
                                                null && (
                                                    <div className="meta-ritmo">
                                                        <ArrowUpCircle size={18} />

                                                        <div>
                                                            <span>
                                                                Ritmo necessário
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


                                            <div className="meta-card-acoes">
                                                {meta.status !==
                                                    "CONCLUIDA" && (
                                                        <button
                                                            type="button"
                                                            className="meta-btn-aporte"
                                                            onClick={() =>
                                                                abrirAporte(
                                                                    meta
                                                                )
                                                            }
                                                        >
                                                            <Plus size={17} />
                                                            Adicionar valor
                                                        </button>
                                                    )}

                                                {meta.status !==
                                                    "CONCLUIDA" && (
                                                        <button
                                                            type="button"
                                                            className="meta-btn-secundario"
                                                            onClick={() =>
                                                                alternarPausa(
                                                                    meta
                                                                )
                                                            }
                                                        >
                                                            {meta.status ===
                                                                "PAUSADA" ? (
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
                                            </div>
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>


                {modalMetaAberto && (
                    <div className="metas-modal-overlay">
                        <div className="metas-modal">
                            <div className="metas-modal-header">
                                <div>
                                    <span>
                                        PLANEJAMENTO
                                    </span>

                                    <h2>
                                        {metaEditando
                                            ? "Editar meta"
                                            : "Nova meta"}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="metas-modal-fechar"
                                    onClick={
                                        fecharModalMeta
                                    }
                                >
                                    <X size={20} />
                                </button>
                            </div>


                            <div className="metas-form">
                                <label>
                                    <span>
                                        Nome da meta
                                    </span>

                                    <input
                                        type="text"
                                        value={
                                            descricao
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setDescricao(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Ex.: Reserva de emergência"
                                    />
                                </label>


                                <div className="metas-form-grid">
                                    <label>
                                        <span>
                                            Valor da meta
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
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="0,00"
                                        />
                                    </label>


                                    <label>
                                        <span>
                                            Valor já acumulado
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                valorAtual
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setValorAtual(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="0,00"
                                        />
                                    </label>
                                </div>


                                <div className="metas-form-grid">
                                    <label>
                                        <span>
                                            Prazo
                                        </span>

                                        <input
                                            type="date"
                                            value={
                                                prazo
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setPrazo(
                                                    event.target
                                                        .value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        <span>
                                            Conta vinculada
                                        </span>

                                        <select
                                            value={
                                                contaId
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setContaId(
                                                    event.target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Sem conta vinculada
                                            </option>

                                            {contas.map(
                                                (conta) => (
                                                    <option
                                                        key={
                                                            conta.id
                                                        }
                                                        value={
                                                            conta.id
                                                        }
                                                    >
                                                        {conta.nome}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                </div>
                            </div>


                            <div className="metas-modal-footer">
                                <button
                                    type="button"
                                    className="metas-btn-cancelar"
                                    onClick={
                                        fecharModalMeta
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="metas-btn-salvar"
                                    onClick={
                                        salvarMeta
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    <Save size={18} />

                                    {salvando
                                        ? "Salvando..."
                                        : metaEditando
                                            ? "Salvar alterações"
                                            : "Criar meta"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {metaAporte && (
                    <div className="metas-modal-overlay">
                        <div className="metas-modal metas-modal-aporte">
                            <div className="metas-modal-header">
                                <div>
                                    <span>
                                        ADICIONAR VALOR
                                    </span>

                                    <h2>
                                        {metaAporte.descricao}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="metas-modal-fechar"
                                    onClick={
                                        fecharAporte
                                    }
                                >
                                    <X size={20} />
                                </button>
                            </div>


                            <div className="metas-aporte-resumo">
                                <div>
                                    <span>
                                        Atual
                                    </span>

                                    <strong>
                                        {formatarMoeda(
                                            metaAporte.valor_atual
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Objetivo
                                    </span>

                                    <strong>
                                        {formatarMoeda(
                                            metaAporte.valor_meta
                                        )}
                                    </strong>
                                </div>
                            </div>


                            <label className="metas-aporte-campo">
                                <span>
                                    Quanto deseja adicionar?
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    value={
                                        valorAporte
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setValorAporte(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="R$ 0,00"
                                />
                            </label>


                            <div className="metas-modal-footer">
                                <button
                                    type="button"
                                    className="metas-btn-cancelar"
                                    onClick={
                                        fecharAporte
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="metas-btn-salvar"
                                    onClick={
                                        confirmarAporte
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    <PiggyBank size={18} />

                                    {salvando
                                        ? "Adicionando..."
                                        : "Adicionar valor"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </PageContainer>
        </MainLayout>
    );
}


export default Metas;