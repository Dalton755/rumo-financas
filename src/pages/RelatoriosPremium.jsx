import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    ArrowDownRight,
    ArrowUpRight,
    Crown,
    PiggyBank,
    TrendingDown,
    TrendingUp,
    Wallet,
    Download,
    FileText,
    FileSpreadsheet
} from "lucide-react";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import {
    exportarRelatorioPdf,
    exportarRelatorioExcel
} from "../services/exportarRelatorioPremium";

import MainLayout from "../layouts/MainLayout";
import LogoBanco from "../components/ui/LogoBanco";
import IconeCategoria from "../components/ui/IconeCategoria";
import { supabase } from "../services/supabase";

import "./RelatoriosPremium.css";


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

    return `${Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        )}%`;

}


function dataIso(data) {

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            data.getDate()
        ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;

}

function adicionarDiasIso(
    dataTexto,
    quantidade
) {

    if (!dataTexto) {
        return null;
    }

    const [
        ano,
        mes,
        dia
    ] =
        dataTexto
            .split("-")
            .map(Number);

    const data =
        new Date(
            ano,
            mes - 1,
            dia
        );

    data.setDate(
        data.getDate() +
        quantidade
    );

    return dataIso(data);

}


function diferencaDias(
    inicio,
    fim
) {

    if (!inicio || !fim) {
        return 0;
    }

    const [
        anoInicio,
        mesInicio,
        diaInicio
    ] =
        inicio
            .split("-")
            .map(Number);

    const [
        anoFim,
        mesFim,
        diaFim
    ] =
        fim
            .split("-")
            .map(Number);

    const a =
        new Date(
            anoInicio,
            mesInicio - 1,
            diaInicio
        );

    const b =
        new Date(
            anoFim,
            mesFim - 1,
            diaFim
        );

    return Math.round(
        (
            b.getTime() -
            a.getTime()
        ) /
        86400000
    );

}


function obterPeriodo(codigo) {

    const hoje =
        new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        hoje.getMonth();


    if (codigo === "mes") {

        const inicioAtual =
            new Date(
                ano,
                mes,
                1
            );

        const inicioAnterior =
            new Date(
                ano,
                mes - 1,
                1
            );

        const ultimoDiaAnterior =
            new Date(
                ano,
                mes,
                0
            ).getDate();

        const fimAnterior =
            new Date(
                ano,
                mes - 1,
                Math.min(
                    hoje.getDate(),
                    ultimoDiaAnterior
                )
            );

        return {
            inicioAtual:
                dataIso(inicioAtual),

            fimAtual:
                dataIso(hoje),

            inicioAnterior:
                dataIso(inicioAnterior),

            fimAnterior:
                dataIso(fimAnterior),

            comparar: true
        };

    }


    if (
        codigo === "3meses" ||
        codigo === "6meses"
    ) {

        const quantidade =
            codigo === "3meses"
                ? 3
                : 6;

        const inicioAtual =
            new Date(
                ano,
                mes - (quantidade - 1),
                1
            );

        const fimAnterior =
            new Date(
                inicioAtual.getFullYear(),
                inicioAtual.getMonth(),
                0
            );

        const inicioAnterior =
            new Date(
                inicioAtual.getFullYear(),
                inicioAtual.getMonth() -
                quantidade,
                1
            );

        return {
            inicioAtual:
                dataIso(inicioAtual),

            fimAtual:
                dataIso(hoje),

            inicioAnterior:
                dataIso(inicioAnterior),

            fimAnterior:
                dataIso(fimAnterior),

            comparar: true
        };

    }


    if (codigo === "ano") {

        const inicioAtual =
            new Date(
                ano,
                0,
                1
            );

        const inicioAnterior =
            new Date(
                ano - 1,
                0,
                1
            );

        const fimAnterior =
            new Date(
                ano - 1,
                hoje.getMonth(),
                hoje.getDate()
            );

        return {
            inicioAtual:
                dataIso(inicioAtual),

            fimAtual:
                dataIso(hoje),

            inicioAnterior:
                dataIso(inicioAnterior),

            fimAnterior:
                dataIso(fimAnterior),

            comparar: true
        };

    }


    return {
        inicioAtual: null,
        fimAtual:
            dataIso(hoje),

        inicioAnterior: null,
        fimAnterior: null,

        comparar: false
    };

}


function somarTipo(
    movimentacoes,
    tipo
) {

    return movimentacoes
        .filter(
            (item) =>
                item.tipo === tipo
        )
        .reduce(
            (total, item) =>
                total +
                Number(item.valor || 0),
            0
        );

}


function calcularVariacao(
    atual,
    anterior
) {

    if (
        anterior === null ||
        anterior === undefined ||
        Number(anterior) === 0
    ) {
        return null;
    }

    return (
        (
            Number(atual) -
            Number(anterior)
        ) /
        Math.abs(
            Number(anterior)
        )
    ) * 100;

}


function CardIndicador({
    titulo,
    valor,
    Icone,
    variacao,
    invertido = false,
    sufixoVariacao = "%"
}) {

    const temVariacao =
        variacao !== null &&
        variacao !== undefined &&
        Number.isFinite(
            Number(variacao)
        );


    const melhorou =
        temVariacao
            ? (
                invertido
                    ? variacao <= 0
                    : variacao >= 0
            )
            : null;


    return (

        <div className="rel-premium-indicador">

            <div className="rel-premium-indicador-topo">

                <span>
                    {titulo}
                </span>

                <div className="rel-premium-indicador-icone">

                    <Icone size={20} />

                </div>

            </div>


            <strong>
                {valor}
            </strong>


            <div
                className={`rel-premium-variacao ${!temVariacao
                    ? "neutra"
                    : melhorou
                        ? "positiva"
                        : "negativa"
                    }`}
            >

                {
                    !temVariacao
                        ? (
                            <span>
                                Sem comparação anterior
                            </span>
                        )
                        : (
                            <>

                                {
                                    variacao >= 0
                                        ? (
                                            <ArrowUpRight
                                                size={15}
                                            />
                                        )
                                        : (
                                            <ArrowDownRight
                                                size={15}
                                            />
                                        )
                                }

                                <span>

                                    {
                                        Math.abs(
                                            variacao
                                        ).toLocaleString(
                                            "pt-BR",
                                            {
                                                minimumFractionDigits: 1,
                                                maximumFractionDigits: 1
                                            }
                                        )
                                    }

                                    {sufixoVariacao}

                                    {" "}
                                    vs. período anterior

                                </span>

                            </>
                        )
                }

            </div>

        </div>

    );

}


function RelatoriosPremium() {

    const [movimentacoes, setMovimentacoes] =
        useState([]);

    const [periodo, setPeriodo] =
        useState("mes");

    const [contaFiltro, setContaFiltro] =
        useState("");

    const [categoriaFiltro, setCategoriaFiltro] =
        useState("");

    const [dataInicio, setDataInicio] =
        useState("");

    const [dataFim, setDataFim] =
        useState("");

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    const [menuExportacaoAberto, setMenuExportacaoAberto] =
        useState(false);

    const [exportando, setExportando] =
        useState("");


    useEffect(() => {

        carregarDados();

    }, []);


    async function carregarDados() {

        try {

            setCarregando(true);
            setErro("");


            const {
                data: { user }
            } =
                await supabase.auth.getUser();


            if (!user) {

                setMovimentacoes([]);

                return;

            }


            const hoje =
                dataIso(
                    new Date()
                );


            const {
                data: movimentacoesBanco,
                error: erroMovimentacoes
            } =
                await supabase
                    .schema("rumo")
                    .from("movimentacoes")
                    .select(`
                        id,
                        descricao,
                        valor,
                        tipo,
                        data_movimentacao,
                        conta_id,
                        categoria_id,
                        origem,
                        origem_referencia,

                        conta:contas!movimentacoes_conta_id_fkey(
                            id,
                            nome,
                            banco
                        ),

                        categoria:categorias!movimentacoes_categoria_id_fkey(
                            id,
                            nome,
                            icone,
                            cor
                        )
        `)
                    .eq(
                        "usuario_id",
                        user.id
                    )
                    .lte(
                        "data_movimentacao",
                        hoje
                    );


            if (erroMovimentacoes) {
                throw erroMovimentacoes;
            }


            /*
             * ==========================================================
             * DADOS DE CARTÕES
             * ==========================================================
             *
             * Compras no cartão representam DESPESA econômica.
             *
             * O pagamento da fatura representa apenas
             * a saída do dinheiro da conta bancária.
             *
             * Por isso:
             *
             * - parcelas entram no relatório;
             * - pagamento de fatura não entra como nova despesa.
             */
            const [
                resultadoCartoes,
                resultadoCompras,
                resultadoParcelas,
                resultadoCategorias
            ] =
                await Promise.all([

                    supabase
                        .schema("rumo")
                        .from("cartoes")
                        .select(`
                            id,
                            nome,
                            banco
                        `)
                        .eq(
                            "usuario_id",
                            user.id
                        ),


                    supabase
                        .schema("rumo")
                        .from("compras_cartao")
                        .select(`
                            id,
                            cartao_id,
                            categoria_id,
                            descricao,
                            valor_total,
                            data_compra,
                            parcelas_total,
                            status
                        `)
                        .eq(
                            "usuario_id",
                            user.id
                        )
                        .eq(
                            "status",
                            "ativa"
                        ),


                    supabase
                        .schema("rumo")
                        .from("parcelas_cartao")
                        .select(`
                            id,
                            compra_id,
                            numero_parcela,
                            valor,
                            competencia,
                            vencimento,
                            status,
                            pago_em
                        `)
                        .eq(
                            "usuario_id",
                            user.id
                        )
                        .in(
                            "status",
                            [
                                "pendente",
                                "paga"
                            ]
                        )
                        .lte(
                            "competencia",
                            hoje
                        ),


                    supabase
                        .schema("rumo")
                        .from("categorias")
                        .select(`
                            id,
                            nome,
                            icone,
                            cor
                        `)
                        .eq(
                            "usuario_id",
                            user.id
                        )

                ]);


            if (resultadoCartoes.error) {
                throw resultadoCartoes.error;
            }


            if (resultadoCompras.error) {
                throw resultadoCompras.error;
            }


            if (resultadoParcelas.error) {
                throw resultadoParcelas.error;
            }


            if (resultadoCategorias.error) {
                throw resultadoCategorias.error;
            }


            const cartoesPorId =
                new Map(
                    (
                        resultadoCartoes.data ||
                        []
                    ).map(
                        (cartao) => [
                            cartao.id,
                            cartao
                        ]
                    )
                );


            const comprasPorId =
                new Map(
                    (
                        resultadoCompras.data ||
                        []
                    ).map(
                        (compra) => [
                            compra.id,
                            compra
                        ]
                    )
                );


            const categoriasPorId =
                new Map(
                    (
                        resultadoCategorias.data ||
                        []
                    ).map(
                        (categoria) => [
                            categoria.id,
                            categoria
                        ]
                    )
                );


            /*
             * Converte cada parcela em algo que o relatório
             * já sabe analisar como uma movimentação.
             */
            const movimentacoesCartao =
                (
                    resultadoParcelas.data ||
                    []
                )
                    .map(
                        (parcela) => {

                            const compra =
                                comprasPorId.get(
                                    parcela.compra_id
                                );


                            if (!compra) {
                                return null;
                            }


                            const cartao =
                                cartoesPorId.get(
                                    compra.cartao_id
                                );


                            const categoria =
                                compra.categoria_id
                                    ? categoriasPorId.get(
                                        compra.categoria_id
                                    )
                                    : null;


                            const idContaCartao =
                                `cartao:${compra.cartao_id}`;


                            return {
                                /*
                                 * Prefixo impede colisão com IDs
                                 * reais de movimentações.
                                 */
                                id:
                                    `parcela-cartao:${parcela.id}`,

                                descricao:
                                    Number(
                                        compra.parcelas_total ||
                                        1
                                    ) > 1
                                        ? `${compra.descricao} · ${parcela.numero_parcela}/${compra.parcelas_total}`
                                        : compra.descricao,

                                valor:
                                    Number(
                                        parcela.valor ||
                                        0
                                    ),

                                tipo:
                                    "despesa",

                                /*
                                 * A despesa é reconhecida pela
                                 * competência da parcela.
                                 *
                                 * Portanto:
                                 * 1/3 → setembro
                                 * 2/3 → outubro
                                 * 3/3 → novembro
                                 */
                                data_movimentacao:
                                    parcela.competencia,

                                conta_id:
                                    idContaCartao,

                                categoria_id:
                                    compra.categoria_id ||
                                    null,

                                origem:
                                    "cartao_compra",

                                origem_referencia:
                                    parcela.id,

                                conta: {
                                    id:
                                        idContaCartao,

                                    nome:
                                        cartao?.nome ||
                                        "Cartão",

                                    banco:
                                        cartao?.banco ||
                                        null
                                },

                                categoria:
                                    categoria
                                        ? {
                                            id:
                                                categoria.id,

                                            nome:
                                                categoria.nome,

                                            icone:
                                                categoria.icone,

                                            cor:
                                                categoria.cor
                                        }
                                        : null,

                                /*
                                 * Campos auxiliares.
                                 */
                                cartao_id:
                                    compra.cartao_id,

                                data_compra:
                                    compra.data_compra,

                                vencimento:
                                    parcela.vencimento,

                                status_parcela:
                                    parcela.status
                            };

                        }
                    )
                    .filter(Boolean);


            /*
             * Remove do RELATÓRIO o pagamento da fatura.
             *
             * A movimentação continua existindo normalmente
             * na tela Movimentações e continua alterando
             * o saldo bancário.
             */
            const movimentacoesNormais =
                (
                    movimentacoesBanco ||
                    []
                ).filter(
                    (item) =>
                        item.origem !==
                        "cartao_fatura"
                );


            const movimentacoesConsolidadas =
                [
                    ...movimentacoesNormais,
                    ...movimentacoesCartao
                ].sort(
                    (a, b) =>
                        b.data_movimentacao
                            .localeCompare(
                                a.data_movimentacao
                            )
                );


            setMovimentacoes(
                movimentacoesConsolidadas
            );

        } catch (error) {

            console.error(
                "Erro ao carregar relatório Premium:",
                error
            );

            setErro(
                error.message ||
                "Não foi possível carregar os relatórios."
            );

        } finally {

            setCarregando(false);

        }

    }

    const contasDisponiveis =
        useMemo(() => {

            const mapa =
                new Map();

            movimentacoes.forEach(
                (item) => {

                    const conta =
                        item.conta;

                    if (!conta?.id) {
                        return;
                    }

                    if (
                        !mapa.has(
                            conta.id
                        )
                    ) {

                        mapa.set(
                            conta.id,
                            {
                                id: conta.id,
                                nome:
                                    conta.nome ||
                                    "Conta",
                                banco:
                                    conta.banco
                            }
                        );

                    }

                }
            );

            return Array
                .from(
                    mapa.values()
                )
                .sort(
                    (a, b) =>
                        a.nome.localeCompare(
                            b.nome,
                            "pt-BR"
                        )
                );

        }, [movimentacoes]);


    const categoriasDisponiveis =
        useMemo(() => {

            const mapa =
                new Map();

            movimentacoes.forEach(
                (item) => {

                    const categoria =
                        item.categoria;

                    if (!categoria?.id) {
                        return;
                    }

                    if (
                        !mapa.has(
                            categoria.id
                        )
                    ) {

                        mapa.set(
                            categoria.id,
                            {
                                id:
                                    categoria.id,

                                nome:
                                    categoria.nome ||
                                    "Categoria",

                                icone:
                                    categoria.icone,

                                cor:
                                    categoria.cor
                            }
                        );

                    }

                }
            );

            return Array
                .from(
                    mapa.values()
                )
                .sort(
                    (a, b) =>
                        a.nome.localeCompare(
                            b.nome,
                            "pt-BR"
                        )
                );

        }, [movimentacoes]);


    const analise =
        useMemo(() => {

            let faixa;


            if (
                periodo === "personalizado" &&
                dataInicio &&
                dataFim
            ) {

                const quantidadeDias =
                    diferencaDias(
                        dataInicio,
                        dataFim
                    ) + 1;


                const fimAnterior =
                    adicionarDiasIso(
                        dataInicio,
                        -1
                    );


                const inicioAnterior =
                    adicionarDiasIso(
                        dataInicio,
                        -quantidadeDias
                    );


                faixa = {
                    inicioAtual:
                        dataInicio,

                    fimAtual:
                        dataFim,

                    inicioAnterior,

                    fimAnterior,

                    comparar: true
                };

            } else {

                faixa =
                    obterPeriodo(
                        periodo
                    );

            }

            const passaFiltros =
                (item) => {

                    if (
                        contaFiltro &&
                        item.conta_id !==
                        contaFiltro
                    ) {
                        return false;
                    }

                    if (
                        categoriaFiltro &&
                        item.categoria_id !==
                        categoriaFiltro
                    ) {
                        return false;
                    }

                    return true;

                };


            const movimentacoesFiltradas =
                movimentacoes.filter(
                    passaFiltros
                );


            const atual =
                movimentacoesFiltradas.filter(
                    (item) => {

                        const data =
                            item.data_movimentacao;

                        if (
                            faixa.inicioAtual &&
                            data <
                            faixa.inicioAtual
                        ) {
                            return false;
                        }

                        if (
                            faixa.fimAtual &&
                            data >
                            faixa.fimAtual
                        ) {
                            return false;
                        }

                        return true;

                    }
                );


            const anterior =
                faixa.comparar
                    ? movimentacoesFiltradas.filter(
                        (item) => {

                            const data =
                                item.data_movimentacao;

                            return (
                                data >=
                                faixa.inicioAnterior &&
                                data <=
                                faixa.fimAnterior
                            );

                        }
                    )
                    : [];


            const receitas =
                somarTipo(
                    atual,
                    "receita"
                );

            const despesas =
                somarTipo(
                    atual,
                    "despesa"
                );

            const resultado =
                receitas -
                despesas;


            const receitasAnterior =
                faixa.comparar
                    ? somarTipo(
                        anterior,
                        "receita"
                    )
                    : null;

            const despesasAnterior =
                faixa.comparar
                    ? somarTipo(
                        anterior,
                        "despesa"
                    )
                    : null;

            const resultadoAnterior =
                faixa.comparar
                    ? (
                        receitasAnterior -
                        despesasAnterior
                    )
                    : null;


            const taxaEconomia =
                receitas > 0
                    ? (
                        resultado /
                        receitas
                    ) * 100
                    : 0;


            const taxaEconomiaAnterior =
                receitasAnterior &&
                    receitasAnterior > 0
                    ? (
                        resultadoAnterior /
                        receitasAnterior
                    ) * 100
                    : null;


            const meses =
                new Map();


            atual.forEach(
                (item) => {

                    const chave =
                        item
                            .data_movimentacao
                            .substring(
                                0,
                                7
                            );


                    if (
                        !meses.has(chave)
                    ) {

                        meses.set(
                            chave,
                            {
                                chave,
                                receitas: 0,
                                despesas: 0
                            }
                        );

                    }


                    const registro =
                        meses.get(chave);


                    if (
                        item.tipo ===
                        "receita"
                    ) {

                        registro.receitas +=
                            Number(
                                item.valor || 0
                            );

                    } else {

                        registro.despesas +=
                            Number(
                                item.valor || 0
                            );

                    }

                }
            );


            const evolucao =
                Array
                    .from(
                        meses.values()
                    )
                    .sort(
                        (a, b) =>
                            a.chave.localeCompare(
                                b.chave
                            )
                    )
                    .map(
                        (item) => {

                            const [
                                ano,
                                mes
                            ] =
                                item.chave
                                    .split("-");


                            const data =
                                new Date(
                                    Number(ano),
                                    Number(mes) - 1,
                                    1
                                );


                            return {
                                ...item,

                                periodo:
                                    data.toLocaleDateString(
                                        "pt-BR",
                                        {
                                            month: "short",
                                            year: "2-digit"
                                        }
                                    )
                            };

                        }
                    );


            const categorias =
                new Map();


            atual
                .filter(
                    (item) =>
                        item.tipo ===
                        "despesa"
                )
                .forEach(
                    (item) => {

                        const categoria =
                            item.categoria;


                        const chave =
                            categoria?.id ||
                            "sem-categoria";


                        if (
                            !categorias.has(chave)
                        ) {

                            categorias.set(
                                chave,
                                {
                                    id: chave,

                                    nome:
                                        categoria?.nome ||
                                        "Sem categoria",

                                    icone:
                                        categoria?.icone,

                                    cor:
                                        categoria?.cor ||
                                        "#64748B",

                                    total: 0
                                }
                            );

                        }


                        categorias.get(
                            chave
                        ).total +=
                            Number(
                                item.valor || 0
                            );

                    }
                );


            const gastosCategorias =
                Array
                    .from(
                        categorias.values()
                    )
                    .sort(
                        (a, b) =>
                            b.total -
                            a.total
                    );


            const contas =
                new Map();


            atual
                .filter(
                    (item) =>
                        item.tipo ===
                        "despesa"
                )
                .forEach(
                    (item) => {

                        const conta =
                            item.conta;


                        const chave =
                            conta?.id ||
                            item.conta_id;


                        if (!chave) {
                            return;
                        }


                        if (
                            !contas.has(chave)
                        ) {

                            contas.set(
                                chave,
                                {
                                    id: chave,

                                    nome:
                                        conta?.nome ||
                                        "Conta",

                                    banco:
                                        conta?.banco,

                                    total: 0
                                }
                            );

                        }


                        contas.get(
                            chave
                        ).total +=
                            Number(
                                item.valor || 0
                            );

                    }
                );


            const gastosContas =
                Array
                    .from(
                        contas.values()
                    )
                    .sort(
                        (a, b) =>
                            b.total -
                            a.total
                    );


            const maioresDespesas =
                atual
                    .filter(
                        (item) =>
                            item.tipo ===
                            "despesa"
                    )
                    .sort(
                        (a, b) =>
                            Number(b.valor) -
                            Number(a.valor)
                    )
                    .slice(
                        0,
                        5
                    );


            return {
                atual,
                anterior,

                receitas,
                despesas,
                resultado,

                receitasAnterior,
                despesasAnterior,
                resultadoAnterior,

                taxaEconomia,
                taxaEconomiaAnterior,

                evolucao,
                gastosCategorias,
                gastosContas,
                maioresDespesas
            };

        }, [
            movimentacoes,
            periodo,
            contaFiltro,
            categoriaFiltro,
            dataInicio,
            dataFim
        ]);


    const variacaoReceitas =
        calcularVariacao(
            analise.receitas,
            analise.receitasAnterior
        );


    const variacaoDespesas =
        calcularVariacao(
            analise.despesas,
            analise.despesasAnterior
        );


    const variacaoResultado =
        calcularVariacao(
            analise.resultado,
            analise.resultadoAnterior
        );


    const variacaoEconomia =
        analise.taxaEconomiaAnterior ===
            null
            ? null
            : (
                analise.taxaEconomia -
                analise.taxaEconomiaAnterior
            );


    const maiorCategoria =
        analise
            .gastosCategorias[0];


    const maiorConta =
        analise
            .gastosContas[0];

    const maiorDespesa =
        analise
            .maioresDespesas[0];


    const percentualMaiorCategoria =
        maiorCategoria &&
            analise.despesas > 0
            ? (
                maiorCategoria.total /
                analise.despesas
            ) * 100
            : 0;


    const percentualMaiorConta =
        maiorConta &&
            analise.despesas > 0
            ? (
                maiorConta.total /
                analise.despesas
            ) * 100
            : 0;


    const percentualMaiorDespesa =
        maiorDespesa &&
            analise.despesas > 0
            ? (
                Number(maiorDespesa.valor) /
                analise.despesas
            ) * 100
            : 0;

    const contaSelecionada =
        contasDisponiveis.find(
            (item) =>
                item.id === contaFiltro
        );


    const categoriaSelecionada =
        categoriasDisponiveis.find(
            (item) =>
                item.id === categoriaFiltro
        );

    async function gerarPdf() {

        try {

            setMenuExportacaoAberto(
                false
            );

            setExportando(
                "pdf"
            );


            await exportarRelatorioPdf({
                analise,

                periodo,

                dataInicio,

                dataFim,

                contaNome:
                    contaSelecionada?.nome,

                categoriaNome:
                    categoriaSelecionada?.nome
            });

        } catch (error) {

            console.error(
                "Erro ao exportar PDF:",
                error
            );

            window.alert(
                "Não foi possível gerar o PDF."
            );

        } finally {

            setExportando("");

        }

    }


    async function gerarExcel() {

        try {

            setMenuExportacaoAberto(
                false
            );

            setExportando(
                "excel"
            );


            await exportarRelatorioExcel({
                analise,

                periodo,

                dataInicio,

                dataFim,

                contaNome:
                    contaSelecionada?.nome,

                categoriaNome:
                    categoriaSelecionada?.nome
            });

        } catch (error) {

            console.error(
                "Erro ao exportar Excel:",
                error
            );

            window.alert(
                "Não foi possível gerar o Excel."
            );

        } finally {

            setExportando("");

        }

    }

    function limparFiltros() {

        setPeriodo("mes");

        setContaFiltro("");

        setCategoriaFiltro("");

        setDataInicio("");

        setDataFim("");

    }


    return (

        <MainLayout>

            <div className="rel-premium">

                <div className="rel-premium-header">

                    <div>

                        <div className="rel-premium-titulo-linha">

                            <h1>
                                Relatórios
                            </h1>

                            <span className="rel-premium-badge">

                                <Crown size={15} />

                                Premium

                            </span>

                        </div>


                        <p>
                            Uma visão completa da sua vida financeira.
                        </p>

                    </div>


                    <div className="rel-premium-filtros">

                        <select
                            className="rel-premium-periodo"
                            value={periodo}
                            onChange={(e) =>
                                setPeriodo(
                                    e.target.value
                                )
                            }
                        >


                            <option value="mes">
                                Este mês
                            </option>

                            <option value="3meses">
                                Últimos 3 meses
                            </option>

                            <option value="6meses">
                                Últimos 6 meses
                            </option>

                            <option value="ano">
                                Este ano
                            </option>

                            <option value="tudo">
                                Todo o período
                            </option>

                            <option value="personalizado">
                                Personalizado
                            </option>

                        </select>

                        {
                            periodo === "personalizado" && (

                                <>

                                    <input
                                        type="date"
                                        className="rel-premium-data"
                                        value={dataInicio}
                                        onChange={(e) =>
                                            setDataInicio(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <input
                                        type="date"
                                        className="rel-premium-data"
                                        value={dataFim}
                                        min={dataInicio || undefined}
                                        onChange={(e) =>
                                            setDataFim(
                                                e.target.value
                                            )
                                        }
                                    />

                                </>

                            )
                        }



                        <select
                            className="rel-premium-periodo"
                            value={contaFiltro}
                            onChange={(e) =>
                                setContaFiltro(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Todas as contas
                            </option>

                            {
                                contasDisponiveis.map(
                                    (conta) => (

                                        <option
                                            key={conta.id}
                                            value={conta.id}
                                        >
                                            {conta.nome}
                                        </option>

                                    )
                                )
                            }

                        </select>


                        <select
                            className="rel-premium-periodo"
                            value={categoriaFiltro}
                            onChange={(e) =>
                                setCategoriaFiltro(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Todas as categorias
                            </option>

                            {
                                categoriasDisponiveis.map(
                                    (categoria) => (

                                        <option
                                            key={categoria.id}
                                            value={categoria.id}
                                        >
                                            {categoria.nome}
                                        </option>

                                    )
                                )
                            }

                        </select>

                        <button
                            type="button"
                            className="rel-premium-limpar"
                            onClick={limparFiltros}
                        >
                            Limpar
                        </button>

                        <div className="rel-premium-exportar">

                            <button
                                type="button"
                                className="rel-premium-exportar-botao"
                                onClick={() =>
                                    setMenuExportacaoAberto(
                                        (valor) => !valor
                                    )
                                }
                                disabled={
                                    Boolean(exportando)
                                }
                            >

                                <Download size={17} />

                                {
                                    exportando
                                        ? "Gerando..."
                                        : "Exportar"
                                }

                            </button>


                            {
                                menuExportacaoAberto && (

                                    <div className="rel-premium-exportar-menu">

                                        <button
                                            type="button"
                                            onClick={gerarPdf}
                                        >

                                            <FileText size={18} />

                                            <div>

                                                <strong>
                                                    PDF
                                                </strong>

                                                <span>
                                                    Relatório pronto para imprimir
                                                </span>

                                            </div>

                                        </button>


                                        <button
                                            type="button"
                                            onClick={gerarExcel}
                                        >

                                            <FileSpreadsheet size={18} />

                                            <div>

                                                <strong>
                                                    Excel
                                                </strong>

                                                <span>
                                                    Planilha completa com os dados
                                                </span>

                                            </div>

                                        </button>

                                    </div>

                                )
                            }

                        </div>

                    </div>

                </div>


                {
                    carregando ? (

                        <div className="rel-premium-estado">
                            Carregando análise financeira...
                        </div>

                    ) : erro ? (

                        <div className="rel-premium-estado erro">
                            {erro}
                        </div>

                    ) : (

                        <>

                            <div className="rel-premium-indicadores">

                                <CardIndicador
                                    titulo="Receitas"
                                    valor={
                                        formatarMoeda(
                                            analise.receitas
                                        )
                                    }
                                    Icone={TrendingUp}
                                    variacao={
                                        variacaoReceitas
                                    }
                                />


                                <CardIndicador
                                    titulo="Despesas"
                                    valor={
                                        formatarMoeda(
                                            analise.despesas
                                        )
                                    }
                                    Icone={TrendingDown}
                                    variacao={
                                        variacaoDespesas
                                    }
                                    invertido
                                />


                                <CardIndicador
                                    titulo="Resultado"
                                    valor={
                                        formatarMoeda(
                                            analise.resultado
                                        )
                                    }
                                    Icone={Wallet}
                                    variacao={
                                        variacaoResultado
                                    }
                                />


                                <CardIndicador
                                    titulo="Taxa de economia"
                                    valor={
                                        formatarPercentual(
                                            analise.taxaEconomia
                                        )
                                    }
                                    Icone={PiggyBank}
                                    variacao={
                                        variacaoEconomia
                                    }
                                    sufixoVariacao=" p.p."
                                />

                            </div>


                            <div className="rel-premium-grid">

                                <section className="rel-premium-card rel-premium-card-grande">

                                    <div className="rel-premium-card-header">

                                        <div>

                                            <h2>
                                                Evolução financeira
                                            </h2>

                                            <p>
                                                Receitas e despesas ao longo do período.
                                            </p>

                                        </div>

                                    </div>


                                    {
                                        analise.evolucao.length ===
                                            0 ? (

                                            <div className="rel-premium-vazio">
                                                Ainda não há movimentações neste período.
                                            </div>

                                        ) : (

                                            <div className="rel-premium-grafico">

                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >

                                                    <LineChart
                                                        data={
                                                            analise.evolucao
                                                        }
                                                    >

                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                        />

                                                        <XAxis
                                                            dataKey="periodo"
                                                        />

                                                        <YAxis
                                                            tickFormatter={
                                                                (valor) =>
                                                                    `R$ ${Number(
                                                                        valor
                                                                    ).toLocaleString(
                                                                        "pt-BR"
                                                                    )}`
                                                            }
                                                        />

                                                        <Tooltip
                                                            formatter={
                                                                (valor) =>
                                                                    formatarMoeda(
                                                                        valor
                                                                    )
                                                            }
                                                        />

                                                        <Legend />

                                                        <Line
                                                            type="monotone"
                                                            dataKey="receitas"
                                                            name="Receitas"
                                                            stroke="#22C55E"
                                                            strokeWidth={3}
                                                            dot={{
                                                                r: 4
                                                            }}
                                                        />

                                                        <Line
                                                            type="monotone"
                                                            dataKey="despesas"
                                                            name="Despesas"
                                                            stroke="#EF4444"
                                                            strokeWidth={3}
                                                            dot={{
                                                                r: 4
                                                            }}
                                                        />

                                                    </LineChart>

                                                </ResponsiveContainer>

                                            </div>

                                        )
                                    }

                                </section>


                                <section className="rel-premium-card">

                                    <div className="rel-premium-card-header">

                                        <div>

                                            <h2>
                                                Gastos por categoria
                                            </h2>

                                            <p>
                                                Onde seu dinheiro está concentrado.
                                            </p>

                                        </div>

                                    </div>


                                    {
                                        analise
                                            .gastosCategorias
                                            .length === 0 ? (

                                            <div className="rel-premium-vazio">
                                                Nenhuma despesa no período.
                                            </div>

                                        ) : (

                                            <div className="rel-premium-grafico-categorias">

                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >

                                                    <BarChart
                                                        data={
                                                            analise.gastosCategorias
                                                        }
                                                        layout="vertical"
                                                        margin={{
                                                            left: 15
                                                        }}
                                                    >

                                                        <XAxis
                                                            type="number"
                                                            hide
                                                        />

                                                        <YAxis
                                                            type="category"
                                                            dataKey="nome"
                                                            width={105}
                                                            tick={{
                                                                fontSize: 12
                                                            }}
                                                        />

                                                        <Tooltip
                                                            formatter={
                                                                (valor) =>
                                                                    formatarMoeda(
                                                                        valor
                                                                    )
                                                            }
                                                        />

                                                        <Bar
                                                            dataKey="total"
                                                            radius={[
                                                                0,
                                                                8,
                                                                8,
                                                                0
                                                            ]}
                                                        >

                                                            {
                                                                analise
                                                                    .gastosCategorias
                                                                    .map(
                                                                        (item) => (

                                                                            <Cell
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                fill={
                                                                                    item.cor
                                                                                }
                                                                            />

                                                                        )
                                                                    )
                                                            }

                                                        </Bar>

                                                    </BarChart>

                                                </ResponsiveContainer>

                                            </div>

                                        )
                                    }

                                </section>

                            </div>


                            <div className="rel-premium-grid rel-premium-grid-inferior">

                                <section className="rel-premium-card">

                                    <div className="rel-premium-card-header">

                                        <div>

                                            <h2>
                                                Gastos por conta
                                            </h2>

                                            <p>
                                                Veja quais contas concentram suas despesas.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="rel-premium-contas">

                                        {
                                            analise
                                                .gastosContas
                                                .length === 0 ? (

                                                <div className="rel-premium-vazio">
                                                    Nenhuma despesa no período.
                                                </div>

                                            ) : (

                                                analise
                                                    .gastosContas
                                                    .map(
                                                        (conta) => {

                                                            const percentual =
                                                                analise.despesas > 0
                                                                    ? (
                                                                        conta.total /
                                                                        analise.despesas
                                                                    ) * 100
                                                                    : 0;


                                                            return (

                                                                <div
                                                                    className="rel-premium-conta"
                                                                    key={
                                                                        conta.id
                                                                    }
                                                                >

                                                                    <LogoBanco
                                                                        banco={
                                                                            conta.banco
                                                                        }
                                                                        size={42}
                                                                        radius={11}
                                                                    />


                                                                    <div className="rel-premium-conta-conteudo">

                                                                        <div className="rel-premium-conta-linha">

                                                                            <strong>
                                                                                {
                                                                                    conta.nome
                                                                                }
                                                                            </strong>

                                                                            <span>
                                                                                {
                                                                                    formatarMoeda(
                                                                                        conta.total
                                                                                    )
                                                                                }
                                                                            </span>

                                                                        </div>


                                                                        <div className="rel-premium-barra">

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

                                                                    </div>

                                                                </div>

                                                            );

                                                        }
                                                    )

                                            )
                                        }

                                    </div>

                                </section>


                                <section className="rel-premium-card">

                                    <div className="rel-premium-card-header">

                                        <div>

                                            <h2>
                                                Maiores despesas
                                            </h2>

                                            <p>
                                                Os lançamentos que mais pesaram no período.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="rel-premium-despesas">

                                        {
                                            analise
                                                .maioresDespesas
                                                .length === 0 ? (

                                                <div className="rel-premium-vazio">
                                                    Nenhuma despesa no período.
                                                </div>

                                            ) : (

                                                analise
                                                    .maioresDespesas
                                                    .map(
                                                        (item) => (

                                                            <div
                                                                className="rel-premium-despesa"
                                                                key={
                                                                    item.id
                                                                }
                                                            >

                                                                <div className="rel-premium-despesa-icone">

                                                                    <IconeCategoria
                                                                        nome={
                                                                            item
                                                                                .categoria
                                                                                ?.nome
                                                                        }
                                                                        icone={
                                                                            item
                                                                                .categoria
                                                                                ?.icone
                                                                        }
                                                                        cor={
                                                                            item
                                                                                .categoria
                                                                                ?.cor
                                                                        }
                                                                        tipo="despesa"
                                                                        size={21}
                                                                    />

                                                                </div>


                                                                <div className="rel-premium-despesa-info">

                                                                    <strong>
                                                                        {
                                                                            item.descricao
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            item
                                                                                .categoria
                                                                                ?.nome ||
                                                                            "Sem categoria"
                                                                        }
                                                                    </span>

                                                                </div>


                                                                <strong className="rel-premium-despesa-valor">

                                                                    {
                                                                        formatarMoeda(
                                                                            item.valor
                                                                        )
                                                                    }

                                                                </strong>

                                                            </div>

                                                        )
                                                    )

                                            )
                                        }

                                    </div>

                                </section>

                            </div>


                            <section className="rel-premium-insights">

                                <div className="rel-premium-insights-header">

                                    <Crown size={19} />

                                    <div>

                                        <strong>
                                            Insights do período
                                        </strong>

                                        <span>
                                            O Rumo analisou os dados selecionados para destacar o que mais importa.
                                        </span>

                                    </div>

                                </div>


                                <div className="rel-premium-insights-grid">

                                    <div>

                                        <span>
                                            Maior concentração por categoria
                                        </span>

                                        <strong>
                                            {
                                                maiorCategoria
                                                    ? `${maiorCategoria.nome} representa ${formatarPercentual(
                                                        percentualMaiorCategoria
                                                    )} das suas despesas.`
                                                    : "Não há despesas suficientes para esta análise."
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Conta mais utilizada
                                        </span>

                                        <strong>
                                            {
                                                maiorConta
                                                    ? `${maiorConta.nome} concentrou ${formatarPercentual(
                                                        percentualMaiorConta
                                                    )} dos gastos do período.`
                                                    : "Nenhuma conta concentrou despesas neste período."
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Maior despesa
                                        </span>

                                        <strong>
                                            {
                                                maiorDespesa
                                                    ? `${maiorDespesa.descricao} foi sua maior despesa: ${formatarMoeda(
                                                        maiorDespesa.valor
                                                    )}, equivalente a ${formatarPercentual(
                                                        percentualMaiorDespesa
                                                    )} do total gasto.`
                                                    : "Nenhuma despesa registrada."
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Capacidade de economia
                                        </span>

                                        <strong
                                            className={
                                                analise.taxaEconomia >= 0
                                                    ? "positivo"
                                                    : "negativo"
                                            }
                                        >
                                            {
                                                analise.receitas <= 0
                                                    ? "Não há receitas no período para calcular sua taxa de economia."
                                                    : analise.taxaEconomia >= 0
                                                        ? `Você preservou ${formatarPercentual(
                                                            analise.taxaEconomia
                                                        )} das receitas do período.`
                                                        : `Seus gastos ultrapassaram suas receitas em ${formatarPercentual(
                                                            Math.abs(
                                                                analise.taxaEconomia
                                                            )
                                                        )}.`
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Comparação de despesas
                                        </span>

                                        <strong
                                            className={
                                                variacaoDespesas === null
                                                    ? ""
                                                    : variacaoDespesas <= 0
                                                        ? "positivo"
                                                        : "negativo"
                                            }
                                        >
                                            {
                                                variacaoDespesas === null
                                                    ? "Ainda não há histórico suficiente para comparar despesas."
                                                    : variacaoDespesas < 0
                                                        ? `Você gastou ${formatarPercentual(
                                                            Math.abs(
                                                                variacaoDespesas
                                                            )
                                                        )} menos que no período anterior.`
                                                        : variacaoDespesas > 0
                                                            ? `Suas despesas aumentaram ${formatarPercentual(
                                                                variacaoDespesas
                                                            )} em relação ao período anterior.`
                                                            : "Suas despesas permaneceram iguais ao período anterior."
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Resultado financeiro
                                        </span>

                                        <strong
                                            className={
                                                analise.resultado >= 0
                                                    ? "positivo"
                                                    : "negativo"
                                            }
                                        >
                                            {
                                                analise.resultado >= 0
                                                    ? `O período terminou positivo em ${formatarMoeda(
                                                        analise.resultado
                                                    )}.`
                                                    : `O período terminou negativo em ${formatarMoeda(
                                                        Math.abs(
                                                            analise.resultado
                                                        )
                                                    )}.`
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </section>

                        </>

                    )
                }

            </div>

        </MainLayout>

    );

}

export default RelatoriosPremium;