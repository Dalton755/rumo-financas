import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    CalendarClock,
    CheckCircle2,
    Clock3,
    Plus,
    ReceiptText,
    TriangleAlert,
    X
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageHeader from "../components/ui/PageHeader";

import { supabase } from "../services/supabase";

import {
    criarCompromisso,
    listarCompromissos,
    listarOcorrenciasCompromissos,
    pagarOcorrenciaCompromisso,
    gerarOcorrenciasCompromissos,
    atualizarValorOcorrencia
} from "../services/compromissos";

import { useToast } from "../context/ToastContext";

import "./Compromissos.css";


function hojeTexto() {

    const agora =
        new Date();

    return [
        agora.getFullYear(),
        String(
            agora.getMonth() + 1
        ).padStart(2, "0"),
        String(
            agora.getDate()
        ).padStart(2, "0")
    ].join("-");

}


function formatarMoeda(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "Valor a informar";
    }


    return Number(
        valor
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function formatarData(data) {

    if (!data) {
        return "";
    }


    return new Date(
        `${data}T12:00:00`
    ).toLocaleDateString(
        "pt-BR"
    );

}


function descricaoFrequencia(
    compromisso
) {

    if (
        compromisso.frequencia ===
        "semanal"
    ) {
        return "Semanal";
    }


    if (
        compromisso.frequencia ===
        "quinzenal"
    ) {
        return "Quinzenal";
    }


    if (
        compromisso.frequencia ===
        "anual"
    ) {
        return "Anual";
    }


    return "Mensal";

}


function Compromissos() {

    const { showToast } =
        useToast();


    const [
        compromissos,
        setCompromissos
    ] = useState([]);


    const [
        ocorrencias,
        setOcorrencias
    ] = useState([]);


    const [
        contas,
        setContas
    ] = useState([]);


    const [
        categorias,
        setCategorias
    ] = useState([]);


    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        modalNovo,
        setModalNovo
    ] = useState(false);


    const [
        compromissoDetalhe,
        setCompromissoDetalhe
    ] = useState(null);


    const [
        ocorrenciaPagando,
        setOcorrenciaPagando
    ] = useState(null);

    const [
        ocorrenciaEditandoValor,
        setOcorrenciaEditandoValor
    ] = useState(null);


    const [
        novoValorOcorrencia,
        setNovoValorOcorrencia
    ] = useState("");


    const [nome, setNome] =
        useState("");


    const [
        categoriaId,
        setCategoriaId
    ] = useState("");


    const [
        contaId,
        setContaId
    ] = useState("");


    const [
        frequencia,
        setFrequencia
    ] = useState("mensal");


    const [
        dataInicio,
        setDataInicio
    ] = useState("");


    const [
        tipoValor,
        setTipoValor
    ] = useState("fixo");


    const [
        valorPadrao,
        setValorPadrao
    ] = useState("");


    const [
        valorEstimado,
        setValorEstimado
    ] = useState("");


    const [
        valorPagamento,
        setValorPagamento
    ] = useState("");


    const [
        contaPagamentoId,
        setContaPagamentoId
    ] = useState("");


    const [
        dataPagamento,
        setDataPagamento
    ] = useState(
        hojeTexto()
    );


    const [
        salvando,
        setSalvando
    ] = useState(false);


    useEffect(() => {

        carregarTudo();

    }, []);


    async function carregarTudo() {

        try {

            setCarregando(true);


            /*
             * Mantemos pelo menos seis meses
             * futuros gerados.
             */
            await gerarOcorrenciasCompromissos();


            const [
                dadosCompromissos,
                dadosOcorrencias,
                dadosAuxiliares
            ] =
                await Promise.all([

                    listarCompromissos(),

                    listarOcorrenciasCompromissos(),

                    carregarAuxiliares()

                ]);


            setCompromissos(
                dadosCompromissos
            );

            setOcorrencias(
                dadosOcorrencias
            );


            if (dadosAuxiliares) {

                setContas(
                    dadosAuxiliares.contas
                );

                setCategorias(
                    dadosAuxiliares.categorias
                );

            }

        } catch (error) {

            console.error(
                "Erro ao carregar compromissos:",
                error
            );


            showToast(
                "Erro",
                error.message ||
                "Não foi possível carregar os compromissos.",
                "danger"
            );

        } finally {

            setCarregando(false);

        }

    }


    async function carregarAuxiliares() {

        const [
            respostaContas,
            respostaCategorias
        ] =
            await Promise.all([

                supabase
                    .schema("rumo")
                    .from("contas")
                    .select(
                        "id,nome,banco"
                    )
                    .eq(
                        "ativo",
                        true
                    )
                    .order("nome"),

                supabase
                    .schema("rumo")
                    .from("categorias")
                    .select(
                        "id,nome,tipo"
                    )
                    .eq(
                        "ativo",
                        true
                    )
                    .eq(
                        "tipo",
                        "despesa"
                    )
                    .order("nome")

            ]);


        if (
            respostaContas.error
        ) {
            throw respostaContas.error;
        }


        if (
            respostaCategorias.error
        ) {
            throw respostaCategorias.error;
        }


        return {
            contas:
                respostaContas.data || [],

            categorias:
                respostaCategorias.data || []
        };

    }


    function abrirNovo() {

        setNome("");
        setCategoriaId("");
        setContaId("");

        setFrequencia(
            "mensal"
        );

        setDataInicio("");

        setTipoValor(
            "fixo"
        );

        setValorPadrao("");
        setValorEstimado("");

        setModalNovo(true);

    }


    async function salvarCompromisso() {

        try {

            setSalvando(true);


            await criarCompromisso({

                nome,

                categoriaId,

                contaId,

                frequencia,

                dataInicio,

                tipoValor,

                valorPadrao,

                valorEstimado

            });


            showToast(
                "Compromisso criado",
                "As próximas cobranças foram programadas.",
                "success"
            );


            setModalNovo(false);


            await carregarTudo();

        } catch (error) {

            showToast(
                "Erro",
                error.message ||
                "Não foi possível criar o compromisso.",
                "danger"
            );

        } finally {

            setSalvando(false);

        }

    }


    function ocorrenciasDoCompromisso(
        compromissoId
    ) {

        return ocorrencias
            .filter(
                (item) =>
                    item.compromisso_id ===
                    compromissoId
            )
            .sort(
                (a, b) =>
                    String(
                        a.vencimento
                    ).localeCompare(
                        String(
                            b.vencimento
                        )
                    )
            );

    }


    function obterResumo(
        compromisso
    ) {

        const hoje =
            hojeTexto();


        const mesAtual =
            hoje.slice(0, 7);


        const itens =
            ocorrenciasDoCompromisso(
                compromisso.id
            );


        const atrasadas =
            itens.filter(
                (item) =>
                    item.status ===
                    "pendente" &&
                    item.vencimento <
                    hoje
            );


        if (
            atrasadas.length > 0
        ) {

            return {
                tipo: "atrasado",

                texto:
                    atrasadas.length === 1
                        ? "1 conta atrasada"
                        : `${atrasadas.length} contas atrasadas`
            };

        }


        const pendentesMes =
            itens.filter(
                (item) =>
                    item.status ===
                    "pendente" &&
                    item.vencimento
                        .slice(0, 7) ===
                    mesAtual
            );


        if (
            pendentesMes.length > 0
        ) {

            return {
                tipo: "pendente",
                texto:
                    "Vence este mês"
            };

        }


        const pagasMes =
            itens.filter(
                (item) =>
                    item.status ===
                    "pago" &&
                    (
                        item.pago_em
                            ?.slice(0, 7) ===
                        mesAtual ||
                        item.vencimento
                            ?.slice(0, 7) ===
                        mesAtual
                    )
            );


        if (
            pagasMes.length > 0
        ) {

            return {
                tipo: "pago",
                texto:
                    "Pago este mês"
            };

        }


        const proxima =
            itens.find(
                (item) =>
                    item.status ===
                    "pendente" &&
                    item.vencimento >=
                    hoje
            );


        if (proxima) {

            return {
                tipo: "proximo",
                texto:
                    `Próximo: ${formatarData(
                        proxima.vencimento
                    )}`
            };

        }


        return {
            tipo: "neutro",
            texto:
                "Sem cobrança pendente"
        };

    }


    const resumoGeral =
        useMemo(() => {

            const hoje =
                hojeTexto();


            const pendentes =
                ocorrencias.filter(
                    (item) =>
                        item.status ===
                        "pendente"
                );


            const atrasadas =
                pendentes.filter(
                    (item) =>
                        item.vencimento <
                        hoje
                );


            const proximas =
                pendentes.filter(
                    (item) =>
                        item.vencimento >=
                        hoje
                );


            const totalAtrasado =
                atrasadas.reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.valor_real ??
                            item.valor_previsto ??
                            0
                        ),
                    0
                );


            const totalProximo =
                proximas.reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.valor_real ??
                            item.valor_previsto ??
                            0
                        ),
                    0
                );


            return {
                atrasadas:
                    atrasadas.length,

                proximas:
                    proximas.length,

                totalAtrasado,
                totalProximo
            };

        }, [ocorrencias]);

    function abrirEdicaoValor(
        ocorrencia
    ) {

        setOcorrenciaEditandoValor(
            ocorrencia
        );


        setNovoValorOcorrencia(
            String(
                ocorrencia.valor_real ??
                ocorrencia.valor_previsto ??
                ""
            )
        );

    }

    async function salvarValorOcorrencia() {

        try {

            setSalvando(true);


            await atualizarValorOcorrencia(
                ocorrenciaEditandoValor.id,
                novoValorOcorrencia
            );


            showToast(
                "Valor atualizado",
                "O valor desta cobrança foi atualizado.",
                "success"
            );


            setOcorrenciaEditandoValor(
                null
            );


            await carregarTudo();

        } catch (error) {

            showToast(
                "Erro",
                error.message ||
                "Não foi possível atualizar o valor.",
                "danger"
            );

        } finally {

            setSalvando(false);

        }

    }


    function abrirPagamento(
        ocorrencia
    ) {

        if (
            compromissoDetalhe?.tipo_valor ===
            "variavel" &&
            !ocorrencia.valor_real &&
            !ocorrencia.valor_previsto
        ) {

            showToast(
                "Informe o valor",
                "Defina o valor desta cobrança antes de registrar o pagamento.",
                "warning"
            );

            abrirEdicaoValor(
                ocorrencia
            );

            return;

        }


        setOcorrenciaPagando(
            ocorrencia
        );


        setValorPagamento(
            String(
                ocorrencia.valor_real ??
                ocorrencia.valor_previsto ??
                ""
            )
        );


        setContaPagamentoId(
            compromissoDetalhe
                ?.conta_id ||
            ""
        );


        setDataPagamento(
            hojeTexto()
        );

    }


    async function confirmarPagamento() {

        try {

            setSalvando(true);


            await pagarOcorrenciaCompromisso({

                ocorrenciaId:
                    ocorrenciaPagando.id,

                contaId:
                    contaPagamentoId,

                valor:
                    valorPagamento,

                dataPagamento

            });


            showToast(
                "Pagamento registrado",
                "A despesa foi adicionada às movimentações.",
                "success"
            );


            setOcorrenciaPagando(
                null
            );


            await carregarTudo();

        } catch (error) {

            showToast(
                "Erro",
                error.message ||
                "Não foi possível registrar o pagamento.",
                "danger"
            );

        } finally {

            setSalvando(false);

        }

    }


    return (

        <MainLayout>

            <div className="compromissos-page">

                <PageHeader
                    titulo="Compromissos"
                    subtitulo="Organize contas, assinaturas e pagamentos recorrentes."
                >

                    <button
                        type="button"
                        className="compromissos-btn-novo"
                        onClick={abrirNovo}
                    >
                        <Plus size={18} />

                        Novo compromisso
                    </button>

                </PageHeader>


                <section className="compromissos-resumo">

                    <div className="compromissos-resumo-card">

                        <Clock3 size={20} />

                        <div>
                            <span>
                                A vencer
                            </span>

                            <strong>
                                {
                                    formatarMoeda(
                                        resumoGeral.totalProximo
                                    )
                                }
                            </strong>

                            <small>
                                {
                                    resumoGeral.proximas
                                } cobranças
                            </small>
                        </div>

                    </div>


                    <div className="compromissos-resumo-card atrasado">

                        <TriangleAlert size={20} />

                        <div>
                            <span>
                                Atrasados
                            </span>

                            <strong>
                                {
                                    formatarMoeda(
                                        resumoGeral.totalAtrasado
                                    )
                                }
                            </strong>

                            <small>
                                {
                                    resumoGeral.atrasadas
                                } cobranças
                            </small>
                        </div>

                    </div>

                </section>


                {
                    carregando ? (

                        <div className="compromissos-vazio">
                            Carregando compromissos...
                        </div>

                    ) : compromissos.length === 0 ? (

                        <div className="compromissos-vazio">

                            <CalendarClock
                                size={36}
                            />

                            <h3>
                                Nenhum compromisso cadastrado
                            </h3>

                            <p>
                                Cadastre aluguel, água, luz,
                                assinaturas ou qualquer pagamento
                                recorrente.
                            </p>

                        </div>

                    ) : (

                        <div className="compromissos-grid">

                            {
                                compromissos.map(
                                    (compromisso) => {

                                        const resumo =
                                            obterResumo(
                                                compromisso
                                            );


                                        const itens =
                                            ocorrenciasDoCompromisso(
                                                compromisso.id
                                            );


                                        const proxima =
                                            itens.find(
                                                (item) =>
                                                    item.status ===
                                                    "pendente" &&
                                                    item.vencimento >=
                                                    hojeTexto()
                                            );


                                        return (

                                            <article
                                                key={
                                                    compromisso.id
                                                }
                                                className="compromisso-card"
                                            >

                                                <div className="compromisso-card-topo">

                                                    <div className="compromisso-card-icone">
                                                        <ReceiptText size={20} />
                                                    </div>


                                                    <div className="compromisso-card-titulo">

                                                        <h3>
                                                            {
                                                                compromisso.nome
                                                            }
                                                        </h3>

                                                        <span>
                                                            {
                                                                compromisso
                                                                    .categoria
                                                                    ?.nome ||
                                                                "Sem categoria"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="compromisso-card-valor">

                                                    {
                                                        compromisso.tipo_valor ===
                                                            "fixo"
                                                            ? formatarMoeda(
                                                                compromisso.valor_padrao
                                                            )
                                                            : (
                                                                compromisso.valor_estimado
                                                                    ? `Estimativa ${formatarMoeda(
                                                                        compromisso.valor_estimado
                                                                    )}`
                                                                    : "Valor variável"
                                                            )
                                                    }

                                                </div>


                                                <div className="compromisso-card-meta">

                                                    <span>
                                                        {
                                                            descricaoFrequencia(
                                                                compromisso
                                                            )
                                                        }
                                                    </span>

                                                    {
                                                        proxima && (

                                                            <span>
                                                                Vence {
                                                                    formatarData(
                                                                        proxima.vencimento
                                                                    )
                                                                }
                                                            </span>

                                                        )
                                                    }

                                                </div>


                                                <div
                                                    className={
                                                        `compromisso-status ${resumo.tipo}`
                                                    }
                                                >

                                                    {
                                                        resumo.tipo ===
                                                        "pago" && (
                                                            <CheckCircle2 size={15} />
                                                        )
                                                    }

                                                    {
                                                        resumo.tipo ===
                                                        "atrasado" && (
                                                            <TriangleAlert size={15} />
                                                        )
                                                    }

                                                    {
                                                        resumo.texto
                                                    }

                                                </div>


                                                <button
                                                    type="button"
                                                    className="compromisso-btn-detalhes"
                                                    onClick={() =>
                                                        setCompromissoDetalhe(
                                                            compromisso
                                                        )
                                                    }
                                                >
                                                    Ver cobranças
                                                </button>

                                            </article>

                                        );

                                    }
                                )
                            }

                        </div>

                    )
                }


                {
                    modalNovo && (

                        <div className="compromissos-overlay">

                            <div className="compromissos-modal">

                                <div className="compromissos-modal-header">

                                    <div>
                                        <h2>
                                            Novo compromisso
                                        </h2>

                                        <p>
                                            Cadastre um pagamento recorrente.
                                        </p>
                                    </div>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setModalNovo(false)
                                        }
                                    >
                                        <X size={20} />
                                    </button>

                                </div>


                                <div className="compromissos-form">

                                    <label>
                                        Nome

                                        <input
                                            value={nome}
                                            onChange={(e) =>
                                                setNome(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ex.: Energia elétrica"
                                        />
                                    </label>


                                    <label>
                                        Categoria

                                        <select
                                            value={categoriaId}
                                            onChange={(e) =>
                                                setCategoriaId(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Selecione
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


                                    <label>
                                        Conta habitual

                                        <select
                                            value={contaId}
                                            onChange={(e) =>
                                                setContaId(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Definir ao pagar
                                            </option>

                                            {
                                                contas.map(
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


                                    <label>
                                        Frequência

                                        <select
                                            value={frequencia}
                                            onChange={(e) =>
                                                setFrequencia(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="semanal">
                                                Semanal
                                            </option>

                                            <option value="quinzenal">
                                                Quinzenal
                                            </option>

                                            <option value="mensal">
                                                Mensal
                                            </option>

                                            <option value="anual">
                                                Anual
                                            </option>
                                        </select>
                                    </label>


                                    <label>
                                        Primeiro vencimento

                                        <input
                                            type="date"
                                            value={dataInicio}
                                            onChange={(e) =>
                                                setDataInicio(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <div className="compromissos-tipo-valor">

                                        <span>
                                            Tipo de valor
                                        </span>


                                        <div>

                                            <button
                                                type="button"
                                                className={
                                                    tipoValor ===
                                                        "fixo"
                                                        ? "ativo"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setTipoValor(
                                                        "fixo"
                                                    )
                                                }
                                            >
                                                Fixo
                                            </button>


                                            <button
                                                type="button"
                                                className={
                                                    tipoValor ===
                                                        "variavel"
                                                        ? "ativo"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setTipoValor(
                                                        "variavel"
                                                    )
                                                }
                                            >
                                                Variável
                                            </button>

                                        </div>

                                    </div>


                                    {
                                        tipoValor ===
                                            "fixo" ? (

                                            <label>
                                                Valor

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={valorPadrao}
                                                    onChange={(e) =>
                                                        setValorPadrao(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="0,00"
                                                />
                                            </label>

                                        ) : (

                                            <label>
                                                Valor estimado
                                                <small>
                                                    Opcional. O valor real poderá ser informado depois.
                                                </small>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={valorEstimado}
                                                    onChange={(e) =>
                                                        setValorEstimado(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="0,00"
                                                />
                                            </label>

                                        )
                                    }

                                </div>


                                <div className="compromissos-modal-footer">

                                    <button
                                        type="button"
                                        className="cancelar"
                                        onClick={() =>
                                            setModalNovo(false)
                                        }
                                    >
                                        Cancelar
                                    </button>


                                    <button
                                        type="button"
                                        className="salvar"
                                        disabled={salvando}
                                        onClick={
                                            salvarCompromisso
                                        }
                                    >
                                        {
                                            salvando
                                                ? "Salvando..."
                                                : "Salvar compromisso"
                                        }
                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                }


                {
                    compromissoDetalhe && (

                        <div className="compromissos-overlay">

                            <div className="compromissos-modal compromissos-modal-lista">

                                <div className="compromissos-modal-header">

                                    <div>
                                        <h2>
                                            {
                                                compromissoDetalhe.nome
                                            }
                                        </h2>

                                        <p>
                                            Cobranças geradas
                                        </p>
                                    </div>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCompromissoDetalhe(
                                                null
                                            )
                                        }
                                    >
                                        <X size={20} />
                                    </button>

                                </div>


                                <div className="compromissos-ocorrencias">

                                    {
                                        ocorrenciasDoCompromisso(
                                            compromissoDetalhe.id
                                        ).map(
                                            (ocorrencia) => {

                                                const atrasada =
                                                    ocorrencia.status ===
                                                    "pendente" &&
                                                    ocorrencia.vencimento <
                                                    hojeTexto();


                                                return (

                                                    <div
                                                        key={
                                                            ocorrencia.id
                                                        }
                                                        className="compromisso-ocorrencia"
                                                    >

                                                        <div>

                                                            <strong>
                                                                {
                                                                    formatarData(
                                                                        ocorrencia.vencimento
                                                                    )
                                                                }
                                                            </strong>


                                                            <span>
                                                                {
                                                                    <>
                                                                        {
                                                                            formatarMoeda(
                                                                                ocorrencia.valor_real ??
                                                                                ocorrencia.valor_previsto
                                                                            )
                                                                        }

                                                                        {
                                                                            compromissoDetalhe?.tipo_valor ===
                                                                            "variavel" &&
                                                                            !ocorrencia.valor_real &&
                                                                            ocorrencia.valor_previsto && (

                                                                                <small className="ocorrencia-estimativa">
                                                                                    estimado
                                                                                </small>

                                                                            )
                                                                        }
                                                                    </>
                                                                }
                                                            </span>

                                                        </div>


                                                        {
                                                            ocorrencia.status ===
                                                                "pago" ? (

                                                                <span className="ocorrencia-paga">
                                                                    Pago
                                                                </span>

                                                            ) : (

                                                                <div className="ocorrencia-acoes">

                                                                    {
                                                                        atrasada && (
                                                                            <span className="ocorrencia-atrasada">
                                                                                Atrasado
                                                                            </span>
                                                                        )
                                                                    }

                                                                    {
                                                                        compromissoDetalhe?.tipo_valor ===
                                                                        "variavel" && (

                                                                            <button
                                                                                type="button"
                                                                                className="ocorrencia-btn-valor"
                                                                                onClick={() =>
                                                                                    abrirEdicaoValor(
                                                                                        ocorrencia
                                                                                    )
                                                                                }
                                                                            >
                                                                                {
                                                                                    ocorrencia.valor_real
                                                                                        ? "Editar valor"
                                                                                        : "Informar valor"
                                                                                }
                                                                            </button>

                                                                        )
                                                                    }


                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            abrirPagamento(
                                                                                ocorrencia
                                                                            )
                                                                        }
                                                                    >
                                                                        Marcar pago
                                                                    </button>

                                                                </div>

                                                            )
                                                        }

                                                    </div>

                                                );

                                            }
                                        )
                                    }

                                </div>

                            </div>

                        </div>

                    )
                }

                {
                    ocorrenciaEditandoValor && (

                        <div className="compromissos-overlay compromissos-overlay-frente">

                            <div className="compromissos-modal compromissos-modal-pagamento">

                                <div className="compromissos-modal-header">

                                    <div>
                                        <h2>
                                            Valor da cobrança
                                        </h2>

                                        <p>
                                            {
                                                compromissoDetalhe?.nome
                                            }
                                        </p>
                                    </div>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOcorrenciaEditandoValor(
                                                null
                                            )
                                        }
                                    >
                                        <X size={20} />
                                    </button>

                                </div>


                                <div className="compromissos-form">

                                    <label>
                                        Valor real

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            autoFocus
                                            value={
                                                novoValorOcorrencia
                                            }
                                            onChange={(e) =>
                                                setNovoValorOcorrencia(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="0,00"
                                        />
                                    </label>


                                    {
                                        ocorrenciaEditandoValor
                                            ?.valor_previsto && (

                                            <div className="compromissos-estimativa-info">

                                                Estimativa:
                                                {" "}
                                                <strong>
                                                    {
                                                        formatarMoeda(
                                                            ocorrenciaEditandoValor
                                                                .valor_previsto
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        )
                                    }

                                </div>


                                <div className="compromissos-modal-footer">

                                    <button
                                        type="button"
                                        className="cancelar"
                                        onClick={() =>
                                            setOcorrenciaEditandoValor(
                                                null
                                            )
                                        }
                                    >
                                        Cancelar
                                    </button>


                                    <button
                                        type="button"
                                        className="salvar"
                                        disabled={salvando}
                                        onClick={
                                            salvarValorOcorrencia
                                        }
                                    >
                                        {
                                            salvando
                                                ? "Salvando..."
                                                : "Salvar valor"
                                        }
                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                }


                {
                    ocorrenciaPagando && (

                        <div className="compromissos-overlay compromissos-overlay-frente">

                            <div className="compromissos-modal compromissos-modal-pagamento">

                                <div className="compromissos-modal-header">

                                    <div>
                                        <h2>
                                            Registrar pagamento
                                        </h2>

                                        <p>
                                            {
                                                compromissoDetalhe?.nome
                                            }
                                        </p>
                                    </div>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOcorrenciaPagando(
                                                null
                                            )
                                        }
                                    >
                                        <X size={20} />
                                    </button>

                                </div>


                                <div className="compromissos-form">

                                    <label>
                                        Valor pago

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={valorPagamento}
                                            onChange={(e) =>
                                                setValorPagamento(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Conta utilizada

                                        <select
                                            value={contaPagamentoId}
                                            onChange={(e) =>
                                                setContaPagamentoId(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Selecione
                                            </option>

                                            {
                                                contas.map(
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


                                    <label>
                                        Data do pagamento

                                        <input
                                            type="date"
                                            value={dataPagamento}
                                            onChange={(e) =>
                                                setDataPagamento(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </label>

                                </div>


                                <div className="compromissos-modal-footer">

                                    <button
                                        type="button"
                                        className="cancelar"
                                        onClick={() =>
                                            setOcorrenciaPagando(
                                                null
                                            )
                                        }
                                    >
                                        Cancelar
                                    </button>


                                    <button
                                        type="button"
                                        className="salvar"
                                        disabled={salvando}
                                        onClick={
                                            confirmarPagamento
                                        }
                                    >
                                        {
                                            salvando
                                                ? "Salvando..."
                                                : "Confirmar pagamento"
                                        }
                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                }

            </div>

        </MainLayout>

    );

}


export default Compromissos;