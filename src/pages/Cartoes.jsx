import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    CalendarDays,
    ChevronRight,
    CreditCard,
    Pencil,
    Plus,
    ReceiptText,
    Trash2,
    WalletCards,
    X
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";

import PageContainer
    from "../components/ui/PageContainer";

import PageHeader
    from "../components/ui/PageHeader";

import LogoBanco
    from "../components/ui/LogoBanco";

import SeletorBanco
    from "../components/ui/SeletorBanco";

import {
    arquivarCartao,
    criarCompraCartao,
    listarCartoes,
    listarCategoriasDespesa,
    listarContasPagamento,
    listarParcelasCartao,
    pagarFaturaCartao,
    salvarCartao
} from "../services/cartoes";

import {
    useToast
} from "../context/ToastContext";

import "./Cartoes.css";


function formatarMoeda(
    valor
) {

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

function formatarData(
    dataTexto
) {

    if (!dataTexto) {
        return "—";
    }


    const [
        ano,
        mes,
        dia
    ] =
        dataTexto
            .split("-");


    return `${dia}/${mes}/${ano}`;

}


function formatarMesFatura(
    dataTexto
) {

    if (!dataTexto) {
        return "";
    }


    const [
        ano,
        mes,
        dia
    ] =
        dataTexto
            .split("-")
            .map(Number);


    const texto =
        new Date(
            ano,
            mes - 1,
            dia
        )
            .toLocaleDateString(
                "pt-BR",
                {
                    month: "long",
                    year: "numeric"
                }
            );


    return (
        texto
            .charAt(0)
            .toUpperCase() +
        texto.slice(1)
    );

}

function hojeISO() {

    const hoje =
        new Date();


    const ano =
        hoje.getFullYear();


    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${ano}-${mes}-${dia}`;

}


function Cartoes() {

    const {
        showToast
    } =
        useToast();


    const [
        cartoes,
        setCartoes
    ] =
        useState([]);


    const [
        carregando,
        setCarregando
    ] =
        useState(true);


    const [
        modalAberto,
        setModalAberto
    ] =
        useState(false);


    const [
        cartaoEditando,
        setCartaoEditando
    ] =
        useState(null);


    const [
        nome,
        setNome
    ] =
        useState("");


    const [
        banco,
        setBanco
    ] =
        useState("");


    const [
        bandeira,
        setBandeira
    ] =
        useState("mastercard");


    const [
        finalCartao,
        setFinalCartao
    ] =
        useState("");


    const [
        limiteTotal,
        setLimiteTotal
    ] =
        useState("");


    const [
        fechamentoDia,
        setFechamentoDia
    ] =
        useState("");


    const [
        vencimentoDia,
        setVencimentoDia
    ] =
        useState("");


    const [
        salvando,
        setSalvando
    ] =
        useState(false);

    const [
        modalCompraAberto,
        setModalCompraAberto
    ] =
        useState(false);


    const [
        cartaoCompra,
        setCartaoCompra
    ] =
        useState(null);


    const [
        categorias,
        setCategorias
    ] =
        useState([]);


    const [
        compraDescricao,
        setCompraDescricao
    ] =
        useState("");


    const [
        compraCategoria,
        setCompraCategoria
    ] =
        useState("");


    const [
        compraValor,
        setCompraValor
    ] =
        useState("");


    const [
        compraData,
        setCompraData
    ] =
        useState(
            new Date()
                .toISOString()
                .slice(0, 10)
        );


    const [
        compraParcelas,
        setCompraParcelas
    ] =
        useState("1");


    const [
        compraObservacao,
        setCompraObservacao
    ] =
        useState("");


    const [
        salvandoCompra,
        setSalvandoCompra
    ] =
        useState(false);

    const [
        modalFaturaAberto,
        setModalFaturaAberto
    ] =
        useState(false);


    const [
        cartaoFatura,
        setCartaoFatura
    ] =
        useState(null);


    const [
        parcelasFatura,
        setParcelasFatura
    ] =
        useState([]);


    const [
        carregandoFatura,
        setCarregandoFatura
    ] =
        useState(false);

    const [
        faturaExpandida,
        setFaturaExpandida
    ] =
        useState("");

    const [
        contasPagamento,
        setContasPagamento
    ] =
        useState([]);


    const [
        pagamentoAberto,
        setPagamentoAberto
    ] =
        useState(false);


    const [
        contaPagamento,
        setContaPagamento
    ] =
        useState("");


    const [
        dataPagamento,
        setDataPagamento
    ] =
        useState(
            hojeISO()
        );


    const [
        pagandoFatura,
        setPagandoFatura
    ] =
        useState(false);


    useEffect(() => {

        carregarCartoes();

        carregarCategorias();

        carregarContasPagamento();

    }, []);


    async function carregarCartoes() {

        try {

            setCarregando(true);


            const dados =
                await listarCartoes();


            setCartoes(
                dados
            );

        } catch (error) {

            console.error(
                "[RUMO CARTÕES]",
                error
            );


            showToast(
                "Cartões indisponíveis",
                "Não foi possível carregar seus cartões.",
                "error"
            );

        } finally {

            setCarregando(false);

        }

    }

    async function carregarCategorias() {

        try {

            const dados =
                await listarCategoriasDespesa();


            setCategorias(
                dados
            );

        } catch (error) {

            console.error(
                "[RUMO CARTÕES] Categorias:",
                error
            );

        }

    }

    async function carregarContasPagamento() {

        try {

            const dados =
                await listarContasPagamento();


            setContasPagamento(
                dados
            );

        } catch (error) {

            console.error(
                "[RUMO CARTÕES] Contas para pagamento:",
                error
            );

        }

    }


    const resumo =
        useMemo(() => {

            const limiteTotalGeral =
                cartoes.reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.limite_total ||
                            0
                        ),
                    0
                );


            const limiteUsadoGeral =
                cartoes.reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.limite_usado ||
                            0
                        ),
                    0
                );


            return {
                total:
                    limiteTotalGeral,

                usado:
                    limiteUsadoGeral,

                disponivel:
                    Math.max(
                        limiteTotalGeral -
                        limiteUsadoGeral,
                        0
                    )
            };

        }, [cartoes]);

    const faturas =
        useMemo(() => {

            const mapa =
                new Map();


            parcelasFatura.forEach(
                (parcela) => {

                    const chave =
                        parcela.vencimento;


                    if (
                        !mapa.has(
                            chave
                        )
                    ) {

                        mapa.set(
                            chave,
                            {
                                vencimento:
                                    parcela.vencimento,

                                competencia:
                                    parcela.competencia,

                                total: 0,

                                parcelas: []
                            }
                        );

                    }


                    const fatura =
                        mapa.get(
                            chave
                        );


                    fatura.total +=
                        Number(
                            parcela.valor ||
                            0
                        );


                    fatura.parcelas.push(
                        parcela
                    );

                }
            );


            return Array
                .from(
                    mapa.values()
                )
                .map(
                    (fatura) => {

                        const todasPagas =
                            fatura.parcelas.length >
                            0 &&
                            fatura.parcelas.every(
                                (parcela) =>
                                    parcela.status ===
                                    "paga"
                            );


                        const datasPagamento =
                            fatura.parcelas
                                .filter(
                                    (parcela) =>
                                        parcela.status ===
                                        "paga"
                                )
                                .map(
                                    (parcela) =>
                                        parcela.pago_em
                                )
                                .filter(Boolean)
                                .sort();


                        return {
                            ...fatura,

                            paga:
                                todasPagas,

                            status:
                                todasPagas
                                    ? "paga"
                                    : "pendente",

                            pago_em:
                                datasPagamento.length
                                    ? datasPagamento[
                                    datasPagamento.length -
                                    1
                                    ]
                                    : null
                        };

                    }
                )
                .sort(
                    (a, b) =>
                        a.vencimento
                            .localeCompare(
                                b.vencimento
                            )
                );

        }, [parcelasFatura]);


    const faturasAbertas =
        faturas.filter(
            (fatura) =>
                !fatura.paga
        );


    const faturaAtual =
        faturasAbertas[0];


    const proximasFaturas =
        faturasAbertas.slice(1);


    const historicoFaturas =
        faturas
            .filter(
                (fatura) =>
                    fatura.paga
            )
            .sort(
                (a, b) =>
                    b.vencimento
                        .localeCompare(
                            a.vencimento
                        )
            );


    function limparFormulario() {

        setCartaoEditando(
            null
        );

        setNome("");

        setBanco("");

        setBandeira(
            "mastercard"
        );

        setFinalCartao("");

        setLimiteTotal("");

        setFechamentoDia("");

        setVencimentoDia("");

    }

    async function abrirFatura(
        cartao
    ) {

        try {

            setFaturaExpandida("");

            setCartaoFatura(
                cartao
            );

            setParcelasFatura(
                []
            );

            setPagamentoAberto(
                false
            );

            setContaPagamento("");

            setDataPagamento(
                hojeISO()
            );

            setModalFaturaAberto(
                true
            );

            setCarregandoFatura(
                true
            );


            const dados =
                await listarParcelasCartao(
                    cartao.id
                );


            setParcelasFatura(
                dados
            );

        } catch (error) {

            console.error(
                "[RUMO CARTÕES] Fatura:",
                error
            );


            showToast(
                "Fatura indisponível",
                "Não foi possível carregar a fatura deste cartão.",
                "error"
            );

        } finally {

            setCarregandoFatura(
                false
            );

        }

    }


    function fecharFatura() {

        setFaturaExpandida("");

        setModalFaturaAberto(
            false
        );

        setCartaoFatura(
            null
        );

        setParcelasFatura(
            []
        );

        setPagamentoAberto(
            false
        );

        setContaPagamento("");

        setDataPagamento(
            hojeISO()
        );

    }

    function alternarFatura(
        vencimento
    ) {

        setFaturaExpandida(
            (atual) =>
                atual === vencimento
                    ? ""
                    : vencimento
        );

    }

    async function confirmarPagamentoFatura() {

        if (
            !cartaoFatura ||
            !faturaAtual
        ) {
            return;
        }


        if (!contaPagamento) {

            showToast(
                "Selecione uma conta",
                "Escolha de qual conta sairá o pagamento.",
                "error"
            );

            return;

        }


        try {

            setPagandoFatura(
                true
            );


            const valorPago =
                faturaAtual.total;


            await pagarFaturaCartao({
                cartaoId:
                    cartaoFatura.id,

                vencimento:
                    faturaAtual.vencimento,

                contaId:
                    contaPagamento,

                dataPagamento
            });


            showToast(
                "Fatura paga",
                `${formatarMoeda(
                    valorPago
                )} foram registrados como pagamento da fatura.`,
                "success"
            );


            fecharFatura();


            await carregarCartoes();

        } catch (error) {

            console.error(
                "[RUMO CARTÕES] Pagamento da fatura:",
                error
            );


            showToast(
                "Não foi possível pagar a fatura",
                error?.message ||
                "Tente novamente.",
                "error"
            );

        } finally {

            setPagandoFatura(
                false
            );

        }

    }

    function limparCompra() {

        setCartaoCompra(
            null
        );

        setCompraDescricao("");

        setCompraCategoria("");

        setCompraValor("");

        setCompraData(
            new Date()
                .toISOString()
                .slice(0, 10)
        );

        setCompraParcelas(
            "1"
        );

        setCompraObservacao("");

    }


    function abrirNovaCompra(
        cartao
    ) {

        limparCompra();

        setCartaoCompra(
            cartao
        );

        setModalCompraAberto(
            true
        );

    }


    function fecharCompra() {

        if (salvandoCompra) {
            return;
        }


        setModalCompraAberto(
            false
        );

        limparCompra();

    }


    async function registrarCompra() {

        try {

            setSalvandoCompra(
                true
            );


            if (!cartaoCompra) {

                throw new Error(
                    "Cartão não selecionado."
                );

            }


            if (
                Number(compraValor) >
                Number(
                    cartaoCompra
                        .limite_disponivel ||
                    0
                )
            ) {

                throw new Error(
                    "O valor da compra é maior que o limite disponível."
                );

            }


            await criarCompraCartao({
                cartaoId:
                    cartaoCompra.id,

                categoriaId:
                    compraCategoria ||
                    null,

                descricao:
                    compraDescricao,

                valorTotal:
                    compraValor,

                dataCompra:
                    compraData,

                parcelasTotal:
                    compraParcelas,

                observacao:
                    compraObservacao
            });


            showToast(
                "Compra registrada",
                Number(compraParcelas) > 1
                    ? `Compra parcelada em ${compraParcelas}x criada com sucesso.`
                    : "A compra foi adicionada à fatura.",
                "success"
            );


            setModalCompraAberto(
                false
            );

            limparCompra();


            await carregarCartoes();

        } catch (error) {

            console.error(
                "[RUMO CARTÕES] Compra:",
                error
            );


            showToast(
                "Não foi possível registrar",
                error?.message ||
                "Verifique os dados da compra.",
                "error"
            );

        } finally {

            setSalvandoCompra(
                false
            );

        }

    }


    function abrirNovo() {

        limparFormulario();

        setModalAberto(
            true
        );

    }


    function abrirEditar(
        cartao
    ) {

        setCartaoEditando(
            cartao
        );

        setNome(
            cartao.nome || ""
        );

        setBanco(
            cartao.banco || ""
        );

        setBandeira(
            cartao.bandeira ||
            "mastercard"
        );

        setFinalCartao(
            cartao.final_cartao ||
            ""
        );

        setLimiteTotal(
            String(
                cartao.limite_total ??
                ""
            )
        );

        setFechamentoDia(
            String(
                cartao.fechamento_dia ??
                ""
            )
        );

        setVencimentoDia(
            String(
                cartao.vencimento_dia ??
                ""
            )
        );

        setModalAberto(
            true
        );

    }


    function fecharModal() {

        if (salvando) {
            return;
        }


        setModalAberto(
            false
        );

        limparFormulario();

    }


    async function salvar() {

        try {

            setSalvando(true);


            await salvarCartao({
                id:
                    cartaoEditando?.id,

                nome,

                banco,

                bandeira,

                finalCartao,

                limiteTotal,

                fechamentoDia,

                vencimentoDia
            });


            showToast(
                cartaoEditando
                    ? "Cartão atualizado"
                    : "Cartão cadastrado",

                cartaoEditando
                    ? "As informações do cartão foram atualizadas."
                    : "Seu cartão já está disponível no Rumo.",

                "success"
            );


            fecharModal();

            await carregarCartoes();

        } catch (error) {

            console.error(
                "[RUMO CARTÕES] Salvar:",
                error
            );


            showToast(
                "Não foi possível salvar",
                error?.message ||
                "Verifique os dados e tente novamente.",
                "error"
            );

        } finally {

            setSalvando(false);

        }

    }


    async function arquivar(
        cartao
    ) {

        const confirmou =
            window.confirm(
                `Arquivar o cartão "${cartao.nome}"?`
            );


        if (!confirmou) {
            return;
        }


        try {

            await arquivarCartao(
                cartao.id
            );


            showToast(
                "Cartão arquivado",
                "O cartão não aparecerá mais na sua lista.",
                "success"
            );


            await carregarCartoes();

        } catch (error) {

            console.error(
                "[RUMO CARTÕES] Arquivar:",
                error
            );


            showToast(
                "Não foi possível arquivar",
                error?.message ||
                "Tente novamente.",
                "error"
            );

        }

    }


    return (

        <MainLayout>

            <PageContainer>

                <PageHeader
                    titulo="Cartões"
                    subtitulo="Controle limites, compras, parcelas e faturas."
                >

                    <button
                        type="button"
                        className="cartoes-novo"
                        onClick={
                            abrirNovo
                        }
                    >

                        <Plus
                            size={18}
                        />

                        Novo cartão

                    </button>

                </PageHeader>


                <section className="cartoes-resumo">

                    <div className="cartoes-resumo-card">

                        <span>
                            Limite total
                        </span>

                        <strong>
                            {
                                formatarMoeda(
                                    resumo.total
                                )
                            }
                        </strong>

                        <WalletCards
                            size={22}
                        />

                    </div>


                    <div className="cartoes-resumo-card">

                        <span>
                            Limite utilizado
                        </span>

                        <strong>
                            {
                                formatarMoeda(
                                    resumo.usado
                                )
                            }
                        </strong>

                        <CreditCard
                            size={22}
                        />

                    </div>


                    <div className="cartoes-resumo-card">

                        <span>
                            Limite disponível
                        </span>

                        <strong>
                            {
                                formatarMoeda(
                                    resumo.disponivel
                                )
                            }
                        </strong>

                        <CalendarDays
                            size={22}
                        />

                    </div>

                </section>


                {
                    carregando ? (

                        <div className="cartoes-estado">
                            Carregando cartões...
                        </div>

                    ) : cartoes.length === 0 ? (

                        <section className="cartoes-vazio">

                            <CreditCard
                                size={42}
                            />

                            <h2>
                                Nenhum cartão cadastrado
                            </h2>

                            <p>
                                Cadastre seu primeiro cartão para acompanhar limites e faturas.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    abrirNovo
                                }
                            >
                                <Plus size={17} />
                                Cadastrar cartão
                            </button>

                        </section>

                    ) : (

                        <section className="cartoes-grid">

                            {
                                cartoes.map(
                                    (cartao) => {

                                        const percentual =
                                            cartao.limite_total > 0
                                                ? (
                                                    cartao.limite_usado /
                                                    cartao.limite_total
                                                ) * 100
                                                : 0;


                                        return (

                                            <article
                                                className="cartao-item"
                                                key={
                                                    cartao.id
                                                }
                                            >

                                                <div className="cartao-item-topo">

                                                    <LogoBanco
                                                        banco={
                                                            cartao.banco
                                                        }
                                                        size={46}
                                                        radius={12}
                                                    />


                                                    <div className="cartao-item-acoes">

                                                        <button
                                                            type="button"
                                                            title="Editar cartão"
                                                            onClick={() =>
                                                                abrirEditar(
                                                                    cartao
                                                                )
                                                            }
                                                        >
                                                            <Pencil
                                                                size={16}
                                                            />
                                                        </button>


                                                        <button
                                                            type="button"
                                                            title="Arquivar cartão"
                                                            onClick={() =>
                                                                arquivar(
                                                                    cartao
                                                                )
                                                            }
                                                        >
                                                            <Trash2
                                                                size={16}
                                                            />
                                                        </button>

                                                    </div>

                                                </div>


                                                <div className="cartao-item-identidade">

                                                    <h2>
                                                        {
                                                            cartao.nome
                                                        }
                                                    </h2>

                                                    <span>
                                                        {
                                                            cartao.final_cartao
                                                                ? `•••• ${cartao.final_cartao}`
                                                                : "Final não informado"
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            cartao.bandeira ||
                                                            "Cartão"
                                                        }
                                                    </small>

                                                </div>


                                                <div className="cartao-item-limite">

                                                    <div>

                                                        <span>
                                                            Limite disponível
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatarMoeda(
                                                                    cartao.limite_disponivel
                                                                )
                                                            }
                                                        </strong>

                                                    </div>


                                                    <span>
                                                        {
                                                            percentual
                                                                .toLocaleString(
                                                                    "pt-BR",
                                                                    {
                                                                        maximumFractionDigits: 0
                                                                    }
                                                                )
                                                        }% usado
                                                    </span>

                                                </div>


                                                <div className="cartao-item-barra">

                                                    <div
                                                        style={{
                                                            width:
                                                                `${Math.min(
                                                                    percentual,
                                                                    100
                                                                )}%`
                                                        }}
                                                    />

                                                </div>

                                                <div className="cartao-item-botoes">

                                                    <button
                                                        type="button"
                                                        className="cartao-item-compra"
                                                        onClick={() =>
                                                            abrirNovaCompra(
                                                                cartao
                                                            )
                                                        }
                                                    >

                                                        <Plus size={16} />

                                                        Nova compra

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="cartao-item-fatura"
                                                        onClick={() =>
                                                            abrirFatura(
                                                                cartao
                                                            )
                                                        }
                                                    >
                                                        <ReceiptText size={16} />

                                                        Ver fatura
                                                    </button>

                                                </div>


                                                <div className="cartao-item-rodape">

                                                    <span>
                                                        Fecha dia{" "}
                                                        <strong>
                                                            {
                                                                cartao.fechamento_dia
                                                            }
                                                        </strong>
                                                    </span>

                                                    <span>
                                                        Vence dia{" "}
                                                        <strong>
                                                            {
                                                                cartao.vencimento_dia
                                                            }
                                                        </strong>
                                                    </span>

                                                </div>

                                            </article>

                                        );

                                    }
                                )
                            }

                        </section>

                    )
                }


                {
                    modalAberto && (

                        <div
                            className="cartoes-modal-overlay"
                            onMouseDown={
                                fecharModal
                            }
                        >

                            <div
                                className="cartoes-modal"
                                onMouseDown={
                                    (e) =>
                                        e.stopPropagation()
                                }
                            >

                                <div className="cartoes-modal-header">

                                    <div>

                                        <h2>
                                            {
                                                cartaoEditando
                                                    ? "Editar cartão"
                                                    : "Novo cartão"
                                            }
                                        </h2>

                                        <p>
                                            Informe os dados básicos do cartão.
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={
                                            fecharModal
                                        }
                                    >
                                        <X size={20} />
                                    </button>

                                </div>


                                <div className="cartoes-form">

                                    <label>

                                        Nome do cartão

                                        <input
                                            type="text"
                                            value={
                                                nome
                                            }
                                            placeholder="Ex.: Nubank Platinum"
                                            onChange={
                                                (e) =>
                                                    setNome(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                    </label>


                                    <SeletorBanco
                                        banco={
                                            banco
                                        }
                                        setBanco={
                                            setBanco
                                        }
                                    />


                                    <div className="cartoes-form-grid">

                                        <label>

                                            Bandeira

                                            <select
                                                value={
                                                    bandeira
                                                }
                                                onChange={
                                                    (e) =>
                                                        setBandeira(
                                                            e.target.value
                                                        )
                                                }
                                            >

                                                <option value="mastercard">
                                                    Mastercard
                                                </option>

                                                <option value="visa">
                                                    Visa
                                                </option>

                                                <option value="elo">
                                                    Elo
                                                </option>

                                                <option value="american-express">
                                                    American Express
                                                </option>

                                                <option value="hipercard">
                                                    Hipercard
                                                </option>

                                                <option value="outra">
                                                    Outra
                                                </option>

                                            </select>

                                        </label>


                                        <label>

                                            Últimos 4 dígitos

                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={4}
                                                value={
                                                    finalCartao
                                                }
                                                placeholder="1234"
                                                onChange={
                                                    (e) =>
                                                        setFinalCartao(
                                                            e.target.value
                                                                .replace(
                                                                    /\D/g,
                                                                    ""
                                                                )
                                                                .slice(
                                                                    0,
                                                                    4
                                                                )
                                                        )
                                                }
                                            />

                                        </label>

                                    </div>


                                    <label>

                                        Limite total

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                limiteTotal
                                            }
                                            placeholder="5000,00"
                                            onChange={
                                                (e) =>
                                                    setLimiteTotal(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                    </label>


                                    <div className="cartoes-form-grid">

                                        <label>

                                            Dia do fechamento

                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={
                                                    fechamentoDia
                                                }
                                                placeholder="18"
                                                onChange={
                                                    (e) =>
                                                        setFechamentoDia(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </label>


                                        <label>

                                            Dia do vencimento

                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={
                                                    vencimentoDia
                                                }
                                                placeholder="25"
                                                onChange={
                                                    (e) =>
                                                        setVencimentoDia(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </label>

                                    </div>

                                </div>


                                <div className="cartoes-modal-actions">

                                    <button
                                        type="button"
                                        className="secundario"
                                        disabled={
                                            salvando
                                        }
                                        onClick={
                                            fecharModal
                                        }
                                    >
                                        Cancelar
                                    </button>


                                    <button
                                        type="button"
                                        className="primario"
                                        disabled={
                                            salvando
                                        }
                                        onClick={
                                            salvar
                                        }
                                    >
                                        {
                                            salvando
                                                ? "Salvando..."
                                                : "Salvar cartão"
                                        }
                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                }

                {
                    modalCompraAberto &&
                    cartaoCompra && (

                        <div
                            className="cartoes-modal-overlay"
                            onMouseDown={
                                fecharCompra
                            }
                        >

                            <div
                                className="cartoes-modal"
                                onMouseDown={
                                    (e) =>
                                        e.stopPropagation()
                                }
                            >

                                <div className="cartoes-modal-header">

                                    <div>

                                        <h2>
                                            Nova compra
                                        </h2>

                                        <p>
                                            {
                                                cartaoCompra.nome
                                            }

                                            {
                                                cartaoCompra.final_cartao
                                                    ? ` · •••• ${cartaoCompra.final_cartao}`
                                                    : ""
                                            }
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={
                                            fecharCompra
                                        }
                                    >
                                        <X size={20} />
                                    </button>

                                </div>


                                <div className="cartoes-form">

                                    <div className="cartoes-compra-cartao">

                                        <LogoBanco
                                            banco={
                                                cartaoCompra.banco
                                            }
                                            size={42}
                                            radius={11}
                                        />

                                        <div>

                                            <span>
                                                Cartão
                                            </span>

                                            <strong>
                                                {
                                                    cartaoCompra.nome
                                                }
                                            </strong>

                                            <small>
                                                Limite disponível{" "}
                                                {
                                                    formatarMoeda(
                                                        cartaoCompra
                                                            .limite_disponivel
                                                    )
                                                }
                                            </small>

                                        </div>

                                    </div>


                                    <label>

                                        Descrição

                                        <input
                                            type="text"
                                            value={
                                                compraDescricao
                                            }
                                            placeholder="Ex.: Mercado"
                                            onChange={
                                                (e) =>
                                                    setCompraDescricao(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                    </label>


                                    <label>

                                        Categoria

                                        <select
                                            value={
                                                compraCategoria
                                            }
                                            onChange={
                                                (e) =>
                                                    setCompraCategoria(
                                                        e.target.value
                                                    )
                                            }
                                        >

                                            <option value="">
                                                Sem categoria
                                            </option>

                                            {
                                                categorias.map(
                                                    (categoria) => (

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


                                    <div className="cartoes-form-grid">

                                        <label>

                                            Valor da compra

                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={
                                                    compraValor
                                                }
                                                placeholder="0,00"
                                                onChange={
                                                    (e) =>
                                                        setCompraValor(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </label>


                                        <label>

                                            Data da compra

                                            <input
                                                type="date"
                                                value={
                                                    compraData
                                                }
                                                onChange={
                                                    (e) =>
                                                        setCompraData(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </label>

                                    </div>


                                    <label>

                                        Parcelamento

                                        <select
                                            value={
                                                compraParcelas
                                            }
                                            onChange={
                                                (e) =>
                                                    setCompraParcelas(
                                                        e.target.value
                                                    )
                                            }
                                        >

                                            {
                                                Array
                                                    .from(
                                                        {
                                                            length: 24
                                                        },
                                                        (
                                                            _,
                                                            index
                                                        ) =>
                                                            index + 1
                                                    )
                                                    .map(
                                                        (quantidade) => (

                                                            <option
                                                                key={
                                                                    quantidade
                                                                }
                                                                value={
                                                                    quantidade
                                                                }
                                                            >

                                                                {
                                                                    quantidade === 1
                                                                        ? "À vista"
                                                                        : `${quantidade}x`
                                                                }

                                                            </option>

                                                        )
                                                    )
                                            }

                                        </select>

                                    </label>


                                    {
                                        compraValor &&
                                        Number(compraParcelas) > 1 && (

                                            <div className="cartoes-parcela-preview">

                                                <span>
                                                    Valor aproximado por parcela
                                                </span>

                                                <strong>
                                                    {
                                                        formatarMoeda(
                                                            Number(
                                                                compraValor
                                                            ) /
                                                            Number(
                                                                compraParcelas
                                                            )
                                                        )
                                                    }
                                                </strong>

                                                <small>
                                                    O Rumo ajustará automaticamente os centavos na última parcela.
                                                </small>

                                            </div>

                                        )
                                    }


                                    <label>

                                        Observação

                                        <textarea
                                            rows={3}
                                            value={
                                                compraObservacao
                                            }
                                            placeholder="Opcional"
                                            onChange={
                                                (e) =>
                                                    setCompraObservacao(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                    </label>

                                </div>


                                <div className="cartoes-modal-actions">

                                    <button
                                        type="button"
                                        className="secundario"
                                        disabled={
                                            salvandoCompra
                                        }
                                        onClick={
                                            fecharCompra
                                        }
                                    >
                                        Cancelar
                                    </button>


                                    <button
                                        type="button"
                                        className="primario"
                                        disabled={
                                            salvandoCompra
                                        }
                                        onClick={
                                            registrarCompra
                                        }
                                    >

                                        {
                                            salvandoCompra
                                                ? "Registrando..."
                                                : "Registrar compra"
                                        }

                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                }

                {
                    modalFaturaAberto &&
                    cartaoFatura && (

                        <div
                            className="cartoes-modal-overlay"
                            onMouseDown={
                                fecharFatura
                            }
                        >

                            <div
                                className="cartoes-modal cartoes-modal-fatura"
                                onMouseDown={
                                    (e) =>
                                        e.stopPropagation()
                                }
                            >

                                <div className="cartoes-modal-header">

                                    <div>

                                        <h2>
                                            Fatura
                                        </h2>

                                        <p>
                                            {
                                                cartaoFatura.nome
                                            }

                                            {
                                                cartaoFatura.final_cartao
                                                    ? ` · •••• ${cartaoFatura.final_cartao}`
                                                    : ""
                                            }
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={
                                            fecharFatura
                                        }
                                    >
                                        <X size={20} />
                                    </button>

                                </div>


                                {
                                    carregandoFatura ? (

                                        <div className="cartoes-fatura-estado">
                                            Carregando fatura...
                                        </div>

                                    ) : !faturaAtual ? (

                                        <div className="cartoes-fatura-estado">

                                            <ReceiptText
                                                size={36}
                                            />

                                            <strong>
                                                Nenhuma fatura em aberto
                                            </strong>

                                            <span>
                                                Este cartão não possui parcelas pendentes.
                                            </span>

                                        </div>

                                    ) : (

                                        <div className="cartoes-fatura-conteudo">

                                            <section className="cartoes-fatura-resumo">

                                                <div className="cartoes-fatura-identidade">

                                                    <LogoBanco
                                                        banco={
                                                            cartaoFatura.banco
                                                        }
                                                        size={46}
                                                        radius={12}
                                                    />


                                                    <div>

                                                        <span>
                                                            Fatura atual
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatarMesFatura(
                                                                    faturaAtual.vencimento
                                                                )
                                                            }
                                                        </strong>

                                                        <small>
                                                            Vence em{" "}
                                                            {
                                                                formatarData(
                                                                    faturaAtual.vencimento
                                                                )
                                                            }
                                                        </small>

                                                    </div>

                                                </div>


                                                <div className="cartoes-fatura-total">

                                                    <span>
                                                        Total da fatura
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatarMoeda(
                                                                faturaAtual.total
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                            </section>


                                            <section className="cartoes-fatura-secao">

                                                <div className="cartoes-fatura-secao-titulo">

                                                    <h3>
                                                        Lançamentos
                                                    </h3>

                                                    <span>
                                                        {
                                                            faturaAtual
                                                                .parcelas
                                                                .length
                                                        }{" "}
                                                        {
                                                            faturaAtual
                                                                .parcelas
                                                                .length === 1
                                                                ? "lançamento"
                                                                : "lançamentos"
                                                        }
                                                    </span>

                                                </div>


                                                <div className="cartoes-fatura-itens">

                                                    {
                                                        faturaAtual
                                                            .parcelas
                                                            .map(
                                                                (parcela) => {

                                                                    const compra =
                                                                        parcela.compra;


                                                                    const categoria =
                                                                        categorias.find(
                                                                            (item) =>
                                                                                item.id ===
                                                                                compra
                                                                                    ?.categoria_id
                                                                        );


                                                                    return (

                                                                        <div
                                                                            className="cartoes-fatura-item"
                                                                            key={
                                                                                parcela.id
                                                                            }
                                                                        >

                                                                            <div className="cartoes-fatura-item-info">

                                                                                <strong>
                                                                                    {
                                                                                        compra
                                                                                            ?.descricao ||
                                                                                        "Compra"
                                                                                    }
                                                                                </strong>


                                                                                <span>

                                                                                    {
                                                                                        categoria
                                                                                            ?.nome ||
                                                                                        "Sem categoria"
                                                                                    }

                                                                                    {
                                                                                        Number(
                                                                                            compra
                                                                                                ?.parcelas_total ||
                                                                                            1
                                                                                        ) > 1
                                                                                            ? ` · ${parcela.numero_parcela}/${compra.parcelas_total}`
                                                                                            : ""
                                                                                    }

                                                                                </span>

                                                                            </div>


                                                                            <strong className="cartoes-fatura-item-valor">
                                                                                {
                                                                                    formatarMoeda(
                                                                                        parcela.valor
                                                                                    )
                                                                                }
                                                                            </strong>

                                                                        </div>

                                                                    );

                                                                }
                                                            )
                                                    }

                                                </div>

                                            </section>


                                            {
                                                proximasFaturas.length > 0 && (

                                                    <section className="cartoes-fatura-secao">

                                                        <div className="cartoes-fatura-secao-titulo">

                                                            <h3>
                                                                Próximas faturas
                                                            </h3>

                                                        </div>


                                                        <div className="cartoes-proximas-faturas">

                                                            {
                                                                proximasFaturas.map(
                                                                    (fatura) => {

                                                                        const aberta =
                                                                            faturaExpandida ===
                                                                            fatura.vencimento;


                                                                        return (

                                                                            <div
                                                                                className={
                                                                                    aberta
                                                                                        ? "cartoes-proxima-fatura aberta"
                                                                                        : "cartoes-proxima-fatura"
                                                                                }
                                                                                key={
                                                                                    fatura.vencimento
                                                                                }
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onClick={() =>
                                                                                    alternarFatura(
                                                                                        fatura.vencimento
                                                                                    )
                                                                                }
                                                                            >

                                                                                <div className="cartoes-proxima-fatura-linha">

                                                                                    <div>

                                                                                        <strong>
                                                                                            {
                                                                                                formatarMesFatura(
                                                                                                    fatura.vencimento
                                                                                                )
                                                                                            }
                                                                                        </strong>

                                                                                        <span>
                                                                                            Vence{" "}
                                                                                            {
                                                                                                formatarData(
                                                                                                    fatura.vencimento
                                                                                                )
                                                                                            }
                                                                                        </span>

                                                                                    </div>


                                                                                    <div className="cartoes-proxima-fatura-valor">

                                                                                        <strong>
                                                                                            {
                                                                                                formatarMoeda(
                                                                                                    fatura.total
                                                                                                )
                                                                                            }
                                                                                        </strong>

                                                                                        <ChevronRight
                                                                                            size={17}
                                                                                            className={
                                                                                                aberta
                                                                                                    ? "aberto"
                                                                                                    : ""
                                                                                            }
                                                                                        />

                                                                                    </div>

                                                                                </div>


                                                                                {
                                                                                    aberta && (

                                                                                        <div className="cartoes-fatura-expandida">

                                                                                            {
                                                                                                fatura.parcelas.map(
                                                                                                    (parcela) => {

                                                                                                        const compra =
                                                                                                            parcela.compra;


                                                                                                        const categoria =
                                                                                                            categorias.find(
                                                                                                                (item) =>
                                                                                                                    item.id ===
                                                                                                                    compra
                                                                                                                        ?.categoria_id
                                                                                                            );


                                                                                                        return (

                                                                                                            <div
                                                                                                                className="cartoes-fatura-expandida-item"
                                                                                                                key={
                                                                                                                    parcela.id
                                                                                                                }
                                                                                                            >

                                                                                                                <div>

                                                                                                                    <strong>
                                                                                                                        {
                                                                                                                            compra
                                                                                                                                ?.descricao ||
                                                                                                                            "Compra"
                                                                                                                        }
                                                                                                                    </strong>

                                                                                                                    <span>

                                                                                                                        {
                                                                                                                            categoria
                                                                                                                                ?.nome ||
                                                                                                                            "Sem categoria"
                                                                                                                        }

                                                                                                                        {
                                                                                                                            Number(
                                                                                                                                compra
                                                                                                                                    ?.parcelas_total ||
                                                                                                                                1
                                                                                                                            ) > 1
                                                                                                                                ? ` · ${parcela.numero_parcela}/${compra.parcelas_total}`
                                                                                                                                : ""
                                                                                                                        }

                                                                                                                    </span>

                                                                                                                </div>


                                                                                                                <strong>
                                                                                                                    {
                                                                                                                        formatarMoeda(
                                                                                                                            parcela.valor
                                                                                                                        )
                                                                                                                    }
                                                                                                                </strong>

                                                                                                            </div>

                                                                                                        );

                                                                                                    }
                                                                                                )
                                                                                            }

                                                                                        </div>

                                                                                    )
                                                                                }

                                                                            </div>

                                                                        );

                                                                    }
                                                                )
                                                            }

                                                        </div>

                                                    </section>

                                                )
                                            }

                                            {
                                                historicoFaturas.length > 0 && (

                                                    <section className="cartoes-fatura-secao">

                                                        <div className="cartoes-fatura-secao-titulo">

                                                            <h3>
                                                                Histórico
                                                            </h3>

                                                            <span>
                                                                Faturas pagas
                                                            </span>

                                                        </div>


                                                        <div className="cartoes-historico-faturas">

                                                            {
                                                                historicoFaturas.map(
                                                                    (fatura) => {

                                                                        const aberta =
                                                                            faturaExpandida ===
                                                                            fatura.vencimento;


                                                                        return (

                                                                            <div
                                                                                className={
                                                                                    aberta
                                                                                        ? "cartoes-historico-fatura aberta"
                                                                                        : "cartoes-historico-fatura"
                                                                                }
                                                                                key={
                                                                                    fatura.vencimento
                                                                                }
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onClick={() =>
                                                                                    alternarFatura(
                                                                                        fatura.vencimento
                                                                                    )
                                                                                }
                                                                            >

                                                                                <div className="cartoes-proxima-fatura-linha">

                                                                                    <div>

                                                                                        <strong>
                                                                                            ✓{" "}
                                                                                            {
                                                                                                formatarMesFatura(
                                                                                                    fatura.vencimento
                                                                                                )
                                                                                            }
                                                                                        </strong>

                                                                                        <span>

                                                                                            {
                                                                                                fatura.pago_em
                                                                                                    ? `Paga em ${formatarData(
                                                                                                        fatura.pago_em
                                                                                                    )}`
                                                                                                    : "Fatura paga"
                                                                                            }

                                                                                        </span>

                                                                                    </div>


                                                                                    <div className="cartoes-proxima-fatura-valor">

                                                                                        <strong>
                                                                                            {
                                                                                                formatarMoeda(
                                                                                                    fatura.total
                                                                                                )
                                                                                            }
                                                                                        </strong>

                                                                                        <ChevronRight
                                                                                            size={17}
                                                                                            className={
                                                                                                aberta
                                                                                                    ? "aberto"
                                                                                                    : ""
                                                                                            }
                                                                                        />

                                                                                    </div>

                                                                                </div>


                                                                                {
                                                                                    aberta && (

                                                                                        <div className="cartoes-fatura-expandida">

                                                                                            {
                                                                                                fatura.parcelas.map(
                                                                                                    (parcela) => {

                                                                                                        const compra =
                                                                                                            parcela.compra;


                                                                                                        const categoria =
                                                                                                            categorias.find(
                                                                                                                (item) =>
                                                                                                                    item.id ===
                                                                                                                    compra
                                                                                                                        ?.categoria_id
                                                                                                            );


                                                                                                        return (

                                                                                                            <div
                                                                                                                className="cartoes-fatura-expandida-item"
                                                                                                                key={
                                                                                                                    parcela.id
                                                                                                                }
                                                                                                            >

                                                                                                                <div>

                                                                                                                    <strong>
                                                                                                                        {
                                                                                                                            compra
                                                                                                                                ?.descricao ||
                                                                                                                            "Compra"
                                                                                                                        }
                                                                                                                    </strong>

                                                                                                                    <span>

                                                                                                                        {
                                                                                                                            categoria
                                                                                                                                ?.nome ||
                                                                                                                            "Sem categoria"
                                                                                                                        }

                                                                                                                        {
                                                                                                                            Number(
                                                                                                                                compra
                                                                                                                                    ?.parcelas_total ||
                                                                                                                                1
                                                                                                                            ) > 1
                                                                                                                                ? ` · ${parcela.numero_parcela}/${compra.parcelas_total}`
                                                                                                                                : ""
                                                                                                                        }

                                                                                                                    </span>

                                                                                                                </div>


                                                                                                                <strong>
                                                                                                                    {
                                                                                                                        formatarMoeda(
                                                                                                                            parcela.valor
                                                                                                                        )
                                                                                                                    }
                                                                                                                </strong>

                                                                                                            </div>

                                                                                                        );

                                                                                                    }
                                                                                                )
                                                                                            }

                                                                                        </div>

                                                                                    )
                                                                                }

                                                                            </div>

                                                                        );

                                                                    }
                                                                )
                                                            }

                                                        </div>

                                                    </section>

                                                )
                                            }


                                            <div className="cartoes-fatura-actions">

                                                {
                                                    pagamentoAberto ? (

                                                        <div className="cartoes-pagamento">

                                                            <div className="cartoes-pagamento-topo">

                                                                <div>

                                                                    <span>
                                                                        Valor do pagamento
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            formatarMoeda(
                                                                                faturaAtual.total
                                                                            )
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <small>
                                                                    Fatura{" "}
                                                                    {
                                                                        formatarData(
                                                                            faturaAtual.vencimento
                                                                        )
                                                                    }
                                                                </small>

                                                            </div>


                                                            <label>

                                                                Pagar usando

                                                                <select
                                                                    value={
                                                                        contaPagamento
                                                                    }
                                                                    onChange={
                                                                        (e) =>
                                                                            setContaPagamento(
                                                                                e.target.value
                                                                            )
                                                                    }
                                                                >

                                                                    <option value="">
                                                                        Selecione uma conta
                                                                    </option>

                                                                    {
                                                                        contasPagamento.map(
                                                                            (conta) => (

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


                                                            {
                                                                contaPagamento && (() => {

                                                                    const conta =
                                                                        contasPagamento.find(
                                                                            (item) =>
                                                                                item.id ===
                                                                                contaPagamento
                                                                        );


                                                                    if (!conta) {
                                                                        return null;
                                                                    }


                                                                    return (

                                                                        <div className="cartoes-pagamento-conta">

                                                                            <LogoBanco
                                                                                banco={
                                                                                    conta.banco
                                                                                }
                                                                                size={38}
                                                                                radius={10}
                                                                            />

                                                                            <div>

                                                                                <span>
                                                                                    Conta selecionada
                                                                                </span>

                                                                                <strong>
                                                                                    {
                                                                                        conta.nome
                                                                                    }
                                                                                </strong>

                                                                            </div>

                                                                        </div>

                                                                    );

                                                                })()
                                                            }


                                                            <label>

                                                                Data do pagamento

                                                                <input
                                                                    type="date"
                                                                    value={
                                                                        dataPagamento
                                                                    }
                                                                    max={
                                                                        hojeISO()
                                                                    }
                                                                    onChange={
                                                                        (e) =>
                                                                            setDataPagamento(
                                                                                e.target.value
                                                                            )
                                                                    }
                                                                />

                                                            </label>


                                                            <div className="cartoes-pagamento-aviso">

                                                                O Rumo registrará uma saída de{" "}

                                                                <strong>
                                                                    {
                                                                        formatarMoeda(
                                                                            faturaAtual.total
                                                                        )
                                                                    }
                                                                </strong>

                                                                {" "}na conta selecionada e liberará esse valor no limite do cartão.

                                                            </div>


                                                            <div className="cartoes-pagamento-botoes">

                                                                <button
                                                                    type="button"
                                                                    className="secundario"
                                                                    disabled={
                                                                        pagandoFatura
                                                                    }
                                                                    onClick={() =>
                                                                        setPagamentoAberto(
                                                                            false
                                                                        )
                                                                    }
                                                                >
                                                                    Cancelar
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="primario"
                                                                    disabled={
                                                                        pagandoFatura ||
                                                                        !contaPagamento ||
                                                                        !dataPagamento
                                                                    }
                                                                    onClick={
                                                                        confirmarPagamentoFatura
                                                                    }
                                                                >
                                                                    {
                                                                        pagandoFatura
                                                                            ? "Pagando..."
                                                                            : "Confirmar pagamento"
                                                                    }
                                                                </button>

                                                            </div>

                                                        </div>

                                                    ) : (

                                                        <>

                                                            <button
                                                                type="button"
                                                                className="cartoes-pagar-fatura"
                                                                disabled={
                                                                    contasPagamento.length === 0
                                                                }
                                                                onClick={() =>
                                                                    setPagamentoAberto(
                                                                        true
                                                                    )
                                                                }
                                                            >
                                                                Pagar fatura
                                                            </button>


                                                            {
                                                                contasPagamento.length === 0 && (

                                                                    <small className="cartoes-sem-conta-pagamento">
                                                                        Cadastre uma conta no Rumo antes de pagar a fatura.
                                                                    </small>

                                                                )
                                                            }

                                                        </>

                                                    )
                                                }

                                            </div>

                                        </div>

                                    )
                                }

                            </div>

                        </div>

                    )
                }

            </PageContainer>

        </MainLayout>

    );

}


export default Cartoes;