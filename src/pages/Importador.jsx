import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Check,
    FileDown,
    FileSpreadsheet,
    LoaderCircle,
    Upload,
    X
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageHeader from "../components/ui/PageHeader";

import {
    listarContasImportacao,
    listarCategoriasImportacao,
    criarImportacao,
    registrarItensImportacao,
    confirmarItensImportacao,
    verificarDuplicidade
} from "../services/importador";

import {
    parseOfx
} from "../utils/parserOfx";

import {
    parsePdfExtrato
} from "../utils/parserPdfExtrato";

import {
    useToast
} from "../context/ToastContext";

import "./Importador.css";


function formatarMoeda(
    valor
) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style:
                "currency",
            currency:
                "BRL"
        }
    );

}


function formatarData(
    data
) {

    if (!data) {
        return "";
    }


    return new Date(
        `${data}T12:00:00`
    ).toLocaleDateString(
        "pt-BR"
    );

}


export default function Importador() {

    const { showToast } =
        useToast();


    const [
        contas,
        setContas
    ] = useState([]);


    const [
        categorias,
        setCategorias
    ] = useState([]);


    const [
        contaId,
        setContaId
    ] = useState("");


    const [
        arquivo,
        setArquivo
    ] = useState(null);


    const [
        itens,
        setItens
    ] = useState([]);


    const [
        analisando,
        setAnalisando
    ] = useState(false);


    const [
        importando,
        setImportando
    ] = useState(false);


    const [
        importacaoId,
        setImportacaoId
    ] = useState(null);


    useEffect(() => {

        carregarAuxiliares();

    }, []);


    async function carregarAuxiliares() {

        try {

            const [
                dadosContas,
                dadosCategorias
            ] =
                await Promise.all([

                    listarContasImportacao(),

                    listarCategoriasImportacao()

                ]);


            setContas(
                dadosContas
            );


            setCategorias(
                dadosCategorias
            );

        } catch (error) {

            showToast(
                "Erro",
                error.message ||
                "Não foi possível carregar o importador.",
                "danger"
            );

        }

    }


    async function analisarArquivo() {

        if (!contaId) {

            showToast(
                "Selecione uma conta",
                "Informe em qual conta este extrato será importado.",
                "warning"
            );

            return;

        }


        if (!arquivo) {

            showToast(
                "Selecione um arquivo",
                "Escolha um arquivo OFX para analisar.",
                "warning"
            );

            return;

        }


        try {

            setAnalisando(true);


            const extensao =
                arquivo.name
                    .split(".")
                    .pop()
                    ?.toLowerCase();


            if (
                ![
                    "ofx",
                    "pdf"
                ].includes(
                    extensao
                )
            ) {

                throw new Error(
                    "Selecione um extrato OFX ou PDF."
                );

            }


            let transacoes;


            if (
                extensao === "ofx"
            ) {

                const conteudo =
                    await arquivo.text();


                transacoes =
                    parseOfx(
                        conteudo
                    );

            }


            if (
                extensao === "pdf"
            ) {

                const resultado =
                    await parsePdfExtrato(
                        arquivo
                    );


                transacoes =
                    resultado.transacoes;

            }


            /*
             * Verificação inicial de duplicidade.
             */
            transacoes =
                await Promise.all(

                    transacoes.map(
                        async (item) => {

                            const duplicado =
                                await verificarDuplicidade({

                                    contaId,

                                    identificadorExterno:
                                        item.identificadorExterno,

                                    dataMovimentacao:
                                        item.data,

                                    valor:
                                        item.valor,

                                    descricaoOriginal:
                                        item.descricaoOriginal

                                });


                            return {
                                ...item,

                                duplicado,

                                selecionado:
                                    !duplicado
                            };

                        }
                    )

                );


            setItens(
                transacoes
            );


            setImportacaoId(
                null
            );


            showToast(
                "Extrato analisado",
                `${transacoes.length} movimentações encontradas.`,
                "success"
            );

        } catch (error) {

            console.error(
                "Erro ao analisar OFX:",
                error
            );


            showToast(
                "Erro",
                error.message ||
                "Não foi possível analisar o extrato.",
                "danger"
            );

        } finally {

            setAnalisando(false);

        }

    }


    function atualizarItem(
        chave,
        campo,
        valor
    ) {

        setItens(
            (anteriores) =>
                anteriores.map(
                    (item) =>
                        item.chave === chave
                            ? {
                                ...item,
                                [campo]:
                                    valor
                            }
                            : item
                )
        );

    }


    const resumo =
        useMemo(() => {

            const selecionados =
                itens.filter(
                    (item) =>
                        item.selecionado &&
                        !item.duplicado
                );


            const receitas =
                selecionados.filter(
                    (item) =>
                        item.tipo ===
                        "receita"
                );


            const despesas =
                selecionados.filter(
                    (item) =>
                        item.tipo ===
                        "despesa"
                );


            return {

                selecionados:
                    selecionados.length,

                duplicados:
                    itens.filter(
                        (item) =>
                            item.duplicado
                    ).length,

                receitas:
                    receitas.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.valor
                            ),
                        0
                    ),

                despesas:
                    despesas.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.valor
                            ),
                        0
                    )

            };

        }, [itens]);


    async function confirmarImportacao() {

        const selecionados =
            itens.filter(
                (item) =>
                    item.selecionado &&
                    !item.duplicado
            );


        if (
            selecionados.length ===
            0
        ) {

            showToast(
                "Nada para importar",
                "Selecione ao menos uma movimentação.",
                "warning"
            );

            return;

        }


        const semCategoria =
            selecionados.some(
                (item) =>
                    !item.categoriaId
            );


        if (semCategoria) {

            showToast(
                "Categoria necessária",
                "Selecione uma categoria para cada movimentação que será importada.",
                "warning"
            );

            return;

        }


        try {

            setImportando(true);


            const importacao =
                await criarImportacao({

                    contaId,

                    formato:
                        arquivo.name
                            .split(".")
                            .pop()
                            ?.toLowerCase() === "pdf"
                            ? "pdf"
                            : "ofx",

                    nomeArquivo:
                        arquivo.name,

                    quantidadeRegistros:
                        itens.length

                });


            setImportacaoId(
                importacao.id
            );


            await registrarItensImportacao({

                importacaoId:
                    importacao.id,

                contaId,

                itens

            });


            const quantidade =
                await confirmarItensImportacao(
                    importacao.id
                );


            showToast(
                "Importação concluída",
                `${quantidade} movimentações foram registradas.`,
                "success"
            );


            setItens([]);
            setArquivo(null);
            setImportacaoId(null);


            const input =
                document.getElementById(
                    "arquivo-ofx"
                );


            if (input) {
                input.value = "";
            }

        } catch (error) {

            console.error(
                "Erro ao importar extrato:",
                error
            );


            showToast(
                "Erro",
                error.message ||
                "Não foi possível concluir a importação.",
                "danger"
            );

        } finally {

            setImportando(false);

        }

    }


    return (

        <MainLayout>

            <div className="importador-page">

                <PageHeader
                    titulo="Importador Financeiro"
                    subtitulo="Importe seus extratos e transforme lançamentos bancários em movimentações do Rumo."
                />


                <section className="importador-tipo-card">

                    <div className="importador-tipo-icone">
                        <FileSpreadsheet size={26} />
                    </div>

                    <div>

                        <h3>
                            Extrato bancário
                        </h3>

                        <p>
                            Importe um extrato OFX ou PDF
                            revise os lançamentos e
                            escolha o que deseja registrar.
                        </p>

                    </div>

                </section>


                <section className="importador-upload-card">

                    <label>

                        Conta do extrato

                        <select
                            value={
                                contaId
                            }
                            onChange={(e) =>
                                setContaId(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Selecione uma conta
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


                    <label className="importador-arquivo">

                        <input
                            id="arquivo-ofx"
                            type="file"
                            accept=".ofx,.pdf,application/pdf"
                            onChange={(e) =>
                                setArquivo(
                                    e.target
                                        .files?.[0] ||
                                    null
                                )
                            }
                        />

                        <Upload size={20} />

                        <div>

                            <strong>
                                {
                                    arquivo
                                        ? arquivo.name
                                        : "Selecionar extrato OFX ou PDF"
                                }
                            </strong>

                            <span>
                                O arquivo é analisado diretamente no navegador.
                            </span>

                        </div>

                    </label>


                    <button
                        type="button"
                        className="importador-btn-analisar"
                        disabled={
                            analisando
                        }
                        onClick={
                            analisarArquivo
                        }
                    >

                        {
                            analisando
                                ? (
                                    <>
                                        <LoaderCircle
                                            size={17}
                                            className="importador-spin"
                                        />
                                        Analisando...
                                    </>
                                )
                                : (
                                    <>
                                        <FileDown size={17} />
                                        Analisar extrato
                                    </>
                                )
                        }

                    </button>

                </section>


                {
                    itens.length > 0 && (

                        <>

                            <section className="importador-resumo">

                                <div>
                                    <span>
                                        Selecionados
                                    </span>

                                    <strong>
                                        {
                                            resumo.selecionados
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Receitas
                                    </span>

                                    <strong className="receita">
                                        {
                                            formatarMoeda(
                                                resumo.receitas
                                            )
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Despesas
                                    </span>

                                    <strong className="despesa">
                                        {
                                            formatarMoeda(
                                                resumo.despesas
                                            )
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Duplicados
                                    </span>

                                    <strong>
                                        {
                                            resumo.duplicados
                                        }
                                    </strong>
                                </div>

                            </section>


                            <section className="importador-lista">

                                {
                                    itens.map(
                                        (item) => (

                                            <article
                                                key={
                                                    item.chave
                                                }
                                                className={
                                                    `importador-item ${item.duplicado
                                                        ? "duplicado"
                                                        : ""
                                                    }`
                                                }
                                            >

                                                <div className="importador-item-check">

                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            item.selecionado
                                                        }
                                                        disabled={
                                                            item.duplicado
                                                        }
                                                        onChange={(e) =>
                                                            atualizarItem(
                                                                item.chave,
                                                                "selecionado",
                                                                e.target.checked
                                                            )
                                                        }
                                                    />

                                                </div>


                                                <div className="importador-item-principal">

                                                    <div className="importador-item-topo">

                                                        <strong>
                                                            {
                                                                item.descricaoOriginal
                                                            }
                                                        </strong>

                                                        {
                                                            item.duplicado && (

                                                                <span className="importador-duplicado-badge">
                                                                    Possível duplicado
                                                                </span>

                                                            )
                                                        }

                                                    </div>


                                                    <div className="importador-item-meta">

                                                        <span>
                                                            {
                                                                formatarData(
                                                                    item.data
                                                                )
                                                            }
                                                        </span>

                                                        <strong
                                                            className={
                                                                item.tipo
                                                            }
                                                        >
                                                            {
                                                                item.tipo ===
                                                                    "receita"
                                                                    ? "+"
                                                                    : "-"
                                                            }
                                                            {
                                                                formatarMoeda(
                                                                    item.valor
                                                                )
                                                            }
                                                        </strong>

                                                    </div>


                                                    {
                                                        !item.duplicado && (

                                                            <div className="importador-item-edicao">

                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        item.descricao
                                                                    }
                                                                    onChange={(e) =>
                                                                        atualizarItem(
                                                                            item.chave,
                                                                            "descricao",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />


                                                                <select
                                                                    value={
                                                                        item.tipo
                                                                    }
                                                                    onChange={(e) => {

                                                                        atualizarItem(
                                                                            item.chave,
                                                                            "tipo",
                                                                            e.target.value
                                                                        );

                                                                        atualizarItem(
                                                                            item.chave,
                                                                            "categoriaId",
                                                                            ""
                                                                        );

                                                                    }}
                                                                >

                                                                    <option value="receita">
                                                                        Receita
                                                                    </option>

                                                                    <option value="despesa">
                                                                        Despesa
                                                                    </option>

                                                                </select>


                                                                <select
                                                                    value={
                                                                        item.categoriaId
                                                                    }
                                                                    onChange={(e) =>
                                                                        atualizarItem(
                                                                            item.chave,
                                                                            "categoriaId",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                >

                                                                    <option value="">
                                                                        Categoria
                                                                    </option>

                                                                    {
                                                                        categorias
                                                                            .filter(
                                                                                (categoria) =>
                                                                                    categoria.tipo ===
                                                                                    item.tipo
                                                                            )
                                                                            .map(
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

                                                            </div>

                                                        )
                                                    }

                                                </div>

                                            </article>

                                        )
                                    )
                                }

                            </section>


                            <div className="importador-footer">

                                <button
                                    type="button"
                                    className="importador-btn-cancelar"
                                    onClick={() => {

                                        setItens([]);
                                        setImportacaoId(null);

                                    }}
                                >
                                    <X size={17} />

                                    Cancelar
                                </button>


                                <button
                                    type="button"
                                    className="importador-btn-confirmar"
                                    disabled={
                                        importando
                                    }
                                    onClick={
                                        confirmarImportacao
                                    }
                                >

                                    {
                                        importando
                                            ? (
                                                <>
                                                    <LoaderCircle
                                                        size={17}
                                                        className="importador-spin"
                                                    />
                                                    Importando...
                                                </>
                                            )
                                            : (
                                                <>
                                                    <Check size={17} />

                                                    Importar {
                                                        resumo.selecionados
                                                    } movimentações
                                                </>
                                            )
                                    }

                                </button>

                            </div>

                        </>

                    )
                }

            </div>

        </MainLayout>

    );

}