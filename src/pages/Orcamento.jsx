import {
    useEffect,
    useState,
} from "react";

import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Pencil,
    PiggyBank,
    Plus,
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
    excluirOrcamento,
    obterResumoOrcamentoMes,
    salvarOrcamento,
} from "../services/orcamentos";

import "./Orcamento.css";


function mesAtual() {

    const hoje = new Date();

    return `${hoje.getFullYear()}-${String(
        hoje.getMonth() + 1
    ).padStart(2, "0")}`;

}


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


function formatarMes(valor) {

    if (!valor) {
        return "";
    }

    const data =
        new Date(
            `${valor.slice(0, 7)}-01T12:00:00`
        );

    return data
        .toLocaleDateString(
            "pt-BR",
            {
                month: "long",
                year: "numeric",
            }
        )
        .replace(
            /^./,
            (letra) =>
                letra.toUpperCase()
        );

}


function labelSituacao(situacao) {

    const mapa = {
        SEM_ORCAMENTO:
            "Sem orçamento",
        DENTRO:
            "Dentro do limite",
        ATENCAO:
            "Atenção ao limite",
        EXCEDIDO:
            "Orçamento excedido",
    };

    return (
        mapa[situacao] ||
        situacao
    );

}


export default function Orcamento() {

    const { showToast } =
        useToast();

    const [
        mesSelecionado,
        setMesSelecionado,
    ] = useState(
        mesAtual()
    );

    const [
        resumo,
        setResumo,
    ] = useState(null);

    const [
        carregando,
        setCarregando,
    ] = useState(true);

    const [
        erro,
        setErro,
    ] = useState("");

    const [
        categoriaEditando,
        setCategoriaEditando,
    ] = useState(null);

    const [
        valorLimite,
        setValorLimite,
    ] = useState("");

    const [
        salvando,
        setSalvando,
    ] = useState(false);


    useEffect(() => {

        carregarDados();

    }, [mesSelecionado]);


    async function carregarDados() {

        try {

            setCarregando(true);
            setErro("");

            const dados =
                await obterResumoOrcamentoMes(
                    mesSelecionado
                );

            setResumo(dados);

        } catch (error) {

            console.error(
                "Erro ao carregar orçamento:",
                error
            );

            setErro(
                error.message ||
                "Não foi possível carregar o orçamento."
            );

        } finally {

            setCarregando(false);

        }

    }


    function alterarMes(
        quantidade
    ) {

        const [
            ano,
            mes,
        ] = mesSelecionado
            .split("-")
            .map(Number);

        const data =
            new Date(
                ano,
                mes - 1,
                1,
                12,
                0,
                0
            );

        data.setMonth(
            data.getMonth() +
            quantidade
        );

        setMesSelecionado(
            `${data.getFullYear()}-${String(
                data.getMonth() + 1
            ).padStart(2, "0")}`
        );

    }


    function abrirOrcamento(
        item
    ) {

        setCategoriaEditando(
            item
        );

        setValorLimite(
            item.limite > 0
                ? String(
                    item.limite
                )
                : ""
        );

    }


    function fecharModal() {

        if (salvando) {
            return;
        }

        setCategoriaEditando(
            null
        );

        setValorLimite("");

    }


    async function salvar() {

        if (
            !categoriaEditando
        ) {
            return;
        }

        try {

            setSalvando(true);

            await salvarOrcamento({
                categoriaId:
                    categoriaEditando
                        .categoriaId,

                mesReferencia:
                    mesSelecionado,

                valorLimite:
                    valorLimite,
            });

            showToast(
                "Orçamento salvo",
                `O limite de ${categoriaEditando.nome} foi atualizado.`,
                "success"
            );

            fecharModal();

            await carregarDados();

        } catch (error) {

            console.error(
                "Erro ao salvar orçamento:",
                error
            );

            showToast(
                "Erro",
                error.message ||
                "Não foi possível salvar o orçamento.",
                "danger"
            );

        } finally {

            setSalvando(false);

        }

    }


    async function remover(
        item
    ) {

        if (
            !item.orcamento?.id
        ) {
            return;
        }

        const confirmou =
            window.confirm(
                `Excluir o orçamento de ${item.nome} para ${formatarMes(
                    mesSelecionado
                )}?`
            );

        if (!confirmou) {
            return;
        }

        try {

            await excluirOrcamento(
                item.orcamento.id
            );

            showToast(
                "Orçamento excluído",
                "O limite foi removido. Suas movimentações não foram alteradas.",
                "success"
            );

            await carregarDados();

        } catch (error) {

            console.error(
                "Erro ao excluir orçamento:",
                error
            );

            showToast(
                "Erro",
                error.message ||
                "Não foi possível excluir o orçamento.",
                "danger"
            );

        }

    }


    if (carregando) {

        return (
            <MainLayout>
                <PageContainer>

                    <div className="orcamento-loading">

                        <WalletCards
                            size={38}
                        />

                        <h2>
                            Preparando seu orçamento...
                        </h2>

                        <p>
                            O Rumo está comparando seus limites com os gastos do mês.
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

                    <div className="orcamento-erro">

                        <AlertTriangle
                            size={38}
                        />

                        <h2>
                            Não foi possível carregar seu orçamento.
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


    const itens =
        resumo?.itens || [];


    return (
        <MainLayout>
            <PageContainer>

                <PageHeader
                    titulo="Orçamento por Categoria"
                    subtitulo="Defina limites mensais e acompanhe automaticamente quanto já foi consumido."
                >

                    <div className="orcamento-header-actions">

                        <span className="orcamento-premium-badge">

                            <Sparkles
                                size={15}
                            />

                            Premium

                        </span>

                    </div>

                </PageHeader>


                <section className="orcamento-controle-mes">

                    <button
                        type="button"
                        onClick={() =>
                            alterarMes(-1)
                        }
                    >
                        ‹
                    </button>

                    <div>

                        <CalendarDays
                            size={20}
                        />

                        <input
                            type="month"
                            value={
                                mesSelecionado
                            }
                            onChange={(e) =>
                                setMesSelecionado(
                                    e.target.value
                                )
                            }
                        />

                        <strong>
                            {
                                formatarMes(
                                    mesSelecionado
                                )
                            }
                        </strong>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            alterarMes(1)
                        }
                    >
                        ›
                    </button>

                </section>


                <section className="orcamento-resumo-grid">

                    <article className="orcamento-resumo-card">

                        <div className="orcamento-resumo-icon">

                            <PiggyBank
                                size={22}
                            />

                        </div>

                        <span>
                            Limite total
                        </span>

                        <strong>
                            {
                                formatarMoeda(
                                    resumo?.totalLimite
                                )
                            }
                        </strong>

                    </article>


                    <article className="orcamento-resumo-card">

                        <div className="orcamento-resumo-icon">

                            <TrendingDown
                                size={22}
                            />

                        </div>

                        <span>
                            Gasto no mês
                        </span>

                        <strong>
                            {
                                formatarMoeda(
                                    resumo?.totalGasto
                                )
                            }
                        </strong>

                    </article>


                    <article className="orcamento-resumo-card">

                        <div className="orcamento-resumo-icon">

                            <CircleDollarSign
                                size={22}
                            />

                        </div>

                        <span>
                            Disponível
                        </span>

                        <strong>
                            {
                                formatarMoeda(
                                    resumo?.totalDisponivel
                                )
                            }
                        </strong>

                    </article>

                </section>


                {
                    itens.length === 0 ? (

                        <section className="orcamento-vazio">

                            <WalletCards
                                size={46}
                            />

                            <h2>
                                Nenhuma categoria de despesa ainda
                            </h2>

                            <p>
                                Cadastre uma categoria ao registrar uma movimentação de despesa. Depois ela aparecerá automaticamente aqui para você definir o limite mensal.
                            </p>

                        </section>

                    ) : (

                        <section className="orcamento-grid">

                            {
                                itens.map(
                                    (item) => {

                                        const percentualVisual =
                                            Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    item.percentual
                                                )
                                            );

                                        const excedido =
                                            item.disponivel <
                                            0;

                                        return (

                                            <article
                                                key={
                                                    item.categoriaId
                                                }
                                                className={`orcamento-card situacao-${String(
                                                    item.situacao
                                                ).toLowerCase()}`}
                                            >

                                                <div className="orcamento-card-topo">

                                                    <div className="orcamento-card-identidade">

                                                        <div className="orcamento-card-icone">

                                                            {
                                                                item.situacao ===
                                                                "EXCEDIDO"
                                                                    ? (
                                                                        <AlertTriangle
                                                                            size={21}
                                                                        />
                                                                    )
                                                                    : (
                                                                        <CheckCircle2
                                                                            size={21}
                                                                        />
                                                                    )
                                                            }

                                                        </div>

                                                        <div>

                                                            <h3>
                                                                {
                                                                    item.nome
                                                                }
                                                            </h3>

                                                            <span className="orcamento-status">

                                                                {
                                                                    labelSituacao(
                                                                        item.situacao
                                                                    )
                                                                }

                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="orcamento-card-acoes">

                                                        <button
                                                            type="button"
                                                            title={
                                                                item.orcamento
                                                                    ? "Editar orçamento"
                                                                    : "Definir orçamento"
                                                            }
                                                            onClick={() =>
                                                                abrirOrcamento(
                                                                    item
                                                                )
                                                            }
                                                        >

                                                            {
                                                                item.orcamento
                                                                    ? (
                                                                        <Pencil
                                                                            size={17}
                                                                        />
                                                                    )
                                                                    : (
                                                                        <Plus
                                                                            size={18}
                                                                        />
                                                                    )
                                                            }

                                                        </button>


                                                        {
                                                            item.orcamento && (

                                                                <button
                                                                    type="button"
                                                                    title="Excluir orçamento"
                                                                    onClick={() =>
                                                                        remover(
                                                                            item
                                                                        )
                                                                    }
                                                                >

                                                                    <Trash2
                                                                        size={17}
                                                                    />

                                                                </button>

                                                            )
                                                        }

                                                    </div>

                                                </div>


                                                <div className="orcamento-valores">

                                                    <div>

                                                        <span>
                                                            Limite
                                                        </span>

                                                        <strong>
                                                            {
                                                                item.limite >
                                                                0
                                                                    ? formatarMoeda(
                                                                        item.limite
                                                                    )
                                                                    : "Não definido"
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Gasto
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatarMoeda(
                                                                    item.gasto
                                                                )
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>


                                                {
                                                    item.limite >
                                                    0 && (

                                                        <>

                                                            <div className="orcamento-progresso-topo">

                                                                <span>
                                                                    Uso do orçamento
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        item.percentual.toFixed(
                                                                            1
                                                                        )
                                                                    }%
                                                                </strong>

                                                            </div>


                                                            <div className="orcamento-progresso">

                                                                <div
                                                                    style={{
                                                                        width:
                                                                            `${percentualVisual}%`,
                                                                    }}
                                                                />

                                                            </div>


                                                            <div
                                                                className={
                                                                    excedido
                                                                        ? "orcamento-saldo excedido"
                                                                        : "orcamento-saldo"
                                                                }
                                                            >

                                                                {
                                                                    excedido
                                                                        ? `${formatarMoeda(
                                                                            Math.abs(
                                                                                item.disponivel
                                                                            )
                                                                        )} acima do limite`
                                                                        : `${formatarMoeda(
                                                                            item.disponivel
                                                                        )} disponíveis`
                                                                }

                                                            </div>

                                                        </>

                                                    )
                                                }


                                                {
                                                    item.limite ===
                                                    0 && (

                                                        <button
                                                            type="button"
                                                            className="orcamento-definir"
                                                            onClick={() =>
                                                                abrirOrcamento(
                                                                    item
                                                                )
                                                            }
                                                        >

                                                            <Plus
                                                                size={17}
                                                            />

                                                            Definir limite mensal

                                                        </button>

                                                    )
                                                }

                                            </article>

                                        );

                                    }
                                )
                            }

                        </section>

                    )
                }


                {
                    categoriaEditando && (

                        <div className="orcamento-modal-overlay">

                            <div className="orcamento-modal">

                                <div className="orcamento-modal-header">

                                    <div>

                                        <span>
                                            Orçamento mensal
                                        </span>

                                        <h2>
                                            {
                                                categoriaEditando.nome
                                            }
                                        </h2>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            fecharModal
                                        }
                                    >

                                        <X
                                            size={20}
                                        />

                                    </button>

                                </div>


                                <div className="orcamento-modal-body">

                                    <label>
                                        Mês
                                    </label>

                                    <div className="orcamento-modal-mes">

                                        {
                                            formatarMes(
                                                mesSelecionado
                                            )
                                        }

                                    </div>


                                    <label>
                                        Limite de gastos
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Ex.: 1200,00"
                                        value={
                                            valorLimite
                                        }
                                        onChange={(e) =>
                                            setValorLimite(
                                                e.target.value
                                            )
                                        }
                                        autoFocus
                                    />


                                    <p>
                                        O gasto será calculado automaticamente pelas movimentações de despesa desta categoria.
                                    </p>

                                </div>


                                <div className="orcamento-modal-footer">

                                    <button
                                        type="button"
                                        className="orcamento-btn-cancelar"
                                        onClick={
                                            fecharModal
                                        }
                                        disabled={
                                            salvando
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="orcamento-btn-salvar"
                                        onClick={
                                            salvar
                                        }
                                        disabled={
                                            salvando
                                        }
                                    >

                                        {
                                            salvando
                                                ? "Salvando..."
                                                : "Salvar orçamento"
                                        }

                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                }

            </PageContainer>
        </MainLayout>
    );

}