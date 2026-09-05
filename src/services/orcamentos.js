import { supabase } from "./supabase";


async function obterUsuario() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    if (!user) {
        throw new Error(
            "Usuário não autenticado."
        );
    }

    return user;

}


/*
 * Recebe:
 * 2026-09
 * ou
 * 2026-09-01
 *
 * E sempre devolve:
 * 2026-09-01
 */
function normalizarMesReferencia(valor) {

    if (!valor) {
        throw new Error(
            "Informe o mês de referência."
        );
    }

    const partes = String(valor)
        .slice(0, 7)
        .split("-");

    const ano = Number(partes[0]);
    const mes = Number(partes[1]);

    if (
        !ano ||
        !mes ||
        mes < 1 ||
        mes > 12
    ) {
        throw new Error(
            "Mês de referência inválido."
        );
    }

    return `${ano}-${String(mes).padStart(2, "0")}-01`;

}


function obterIntervaloMes(
    mesReferencia
) {

    const inicio =
        normalizarMesReferencia(
            mesReferencia
        );

    const [
        ano,
        mes
    ] = inicio
        .split("-")
        .map(Number);

    const proximoMes =
        mes === 12
            ? `${ano + 1}-01-01`
            : `${ano}-${String(
                mes + 1
            ).padStart(2, "0")}-01`;

    return {
        inicio,
        proximoMes
    };

}


export async function listarCategoriasDespesa() {

    const user =
        await obterUsuario();

    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("categorias")
        .select(
            "id,nome,tipo,cor,icone,ativo"
        )
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "tipo",
            "despesa"
        )
        .eq(
            "ativo",
            true
        )
        .order(
            "nome"
        );

    if (error) {
        throw error;
    }

    return data || [];

}


export async function listarOrcamentosMes(
    mesReferencia
) {

    const user =
        await obterUsuario();

    const mes =
        normalizarMesReferencia(
            mesReferencia
        );

    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("orcamentos")
        .select(
            "id,categoria_id,mes_referencia,valor_limite,created_at,updated_at"
        )
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "mes_referencia",
            mes
        )
        .order(
            "created_at"
        );

    if (error) {
        throw error;
    }

    return data || [];

}


export async function listarGastosMes(
    mesReferencia
) {

    const user =
        await obterUsuario();


    const {
        inicio,
        proximoMes
    } = obterIntervaloMes(
        mesReferencia
    );


    // =====================================================
    // DATA FINANCEIRA OFICIAL DO RUMO
    // =====================================================

    const {
        data: hojeFinanceiro,
        error: erroData
    } = await supabase
        .schema("rumo")
        .rpc(
            "data_financeira_atual"
        );


    if (erroData) {
        throw erroData;
    }


    /*
     * Se o mês consultado ainda nem começou,
     * não existe gasto realizado nele.
     */
    if (
        inicio >
        hojeFinanceiro
    ) {
        return {};
    }


    // =====================================================
    // MOVIMENTAÇÕES NORMAIS
    // =====================================================

    let consultaMovimentacoes =
        supabase
            .schema("rumo")
            .from("movimentacoes")
            .select(`
                categoria_id,
                valor,
                data_movimentacao,
                origem
            `)
            .eq(
                "usuario_id",
                user.id
            )
            .eq(
                "tipo",
                "despesa"
            )
            .gte(
                "data_movimentacao",
                inicio
            );


    /*
     * Mês passado:
     * considera o mês inteiro.
     *
     * Mês atual:
     * considera somente até hoje.
     */
    if (
        proximoMes <=
        hojeFinanceiro
    ) {

        consultaMovimentacoes =
            consultaMovimentacoes.lt(
                "data_movimentacao",
                proximoMes
            );

    } else {

        consultaMovimentacoes =
            consultaMovimentacoes.lte(
                "data_movimentacao",
                hojeFinanceiro
            );

    }


    const {
        data: movimentacoes,
        error: erroMovimentacoes
    } =
        await consultaMovimentacoes;


    if (erroMovimentacoes) {
        throw erroMovimentacoes;
    }


    const gastosPorCategoria = {};


    function somarGasto(
        categoriaId,
        valor
    ) {

        if (!categoriaId) {
            return;
        }


        gastosPorCategoria[
            categoriaId
        ] =
            (
                gastosPorCategoria[
                    categoriaId
                ] || 0
            )
            +
            Number(
                valor || 0
            );

    }


    /*
     * Pagamento de fatura movimenta a conta,
     * mas não representa uma nova despesa.
     */
    for (
        const movimentacao
        of movimentacoes || []
    ) {

        if (
            movimentacao.origem ===
            "cartao_fatura"
        ) {
            continue;
        }


        somarGasto(
            movimentacao.categoria_id,
            movimentacao.valor
        );

    }


    // =====================================================
    // COMPRAS NO CARTÃO
    // =====================================================

    const {
        data: comprasCartao,
        error: erroCompras
    } =
        await supabase
            .schema("rumo")
            .from("compras_cartao")
            .select(`
                id,
                categoria_id,
                data_compra,
                status
            `)
            .eq(
                "usuario_id",
                user.id
            )
            .eq(
                "status",
                "ativa"
            )
            .lte(
                "data_compra",
                hojeFinanceiro
            );


    if (erroCompras) {
        throw erroCompras;
    }


    const comprasValidas =
        (
            comprasCartao ||
            []
        ).filter(
            (compra) =>
                compra.categoria_id
        );


    if (
        comprasValidas.length ===
        0
    ) {
        return gastosPorCategoria;
    }


    const compraParaCategoria =
        new Map(
            comprasValidas.map(
                (compra) => [
                    compra.id,
                    compra.categoria_id
                ]
            )
        );


    const {
        data: parcelasCartao,
        error: erroParcelas
    } =
        await supabase
            .schema("rumo")
            .from("parcelas_cartao")
            .select(`
                compra_id,
                valor,
                competencia,
                status
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
            .in(
                "compra_id",
                comprasValidas.map(
                    (compra) =>
                        compra.id
                )
            )
            .gte(
                "competencia",
                inicio
            )
            .lt(
                "competencia",
                proximoMes
            );


    if (erroParcelas) {
        throw erroParcelas;
    }


    /*
     * Cada parcela consome o orçamento
     * da categoria na sua competência.
     */
    for (
        const parcela
        of parcelasCartao || []
    ) {

        const categoriaId =
            compraParaCategoria.get(
                parcela.compra_id
            );


        somarGasto(
            categoriaId,
            parcela.valor
        );

    }


    return gastosPorCategoria;

}


export async function obterResumoOrcamentoMes(
    mesReferencia
) {

    const [
        categorias,
        orcamentos,
        gastosPorCategoria
    ] = await Promise.all([
        listarCategoriasDespesa(),
        listarOrcamentosMes(
            mesReferencia
        ),
        listarGastosMes(
            mesReferencia
        )
    ]);

    const orcamentoPorCategoria =
        new Map(
            orcamentos.map(
                (orcamento) => [
                    orcamento.categoria_id,
                    orcamento
                ]
            )
        );

    const itens =
        categorias.map(
            (categoria) => {

                const orcamento =
                    orcamentoPorCategoria.get(
                        categoria.id
                    ) || null;

                const limite =
                    Number(
                        orcamento
                            ?.valor_limite || 0
                    );

                const gasto =
                    Number(
                        gastosPorCategoria[
                        categoria.id
                        ] || 0
                    );

                const disponivel =
                    limite - gasto;

                const percentual =
                    limite > 0
                        ? (
                            gasto /
                            limite
                        ) * 100
                        : 0;

                let situacao =
                    "SEM_ORCAMENTO";

                if (limite > 0) {

                    if (
                        gasto > limite
                    ) {

                        situacao =
                            "EXCEDIDO";

                    } else if (
                        percentual >= 80
                    ) {

                        situacao =
                            "ATENCAO";

                    } else {

                        situacao =
                            "DENTRO";

                    }

                }

                return {
                    categoria,
                    orcamento,

                    categoriaId:
                        categoria.id,

                    nome:
                        categoria.nome,

                    limite,

                    gasto,

                    disponivel,

                    percentual,

                    situacao
                };

            }
        );

    const totalLimite =
        itens.reduce(
            (
                total,
                item
            ) =>
                total +
                item.limite,
            0
        );


    /*
     * Continua representando todos os gastos
     * de despesa do mês, mesmo que alguma
     * categoria ainda não tenha orçamento.
     */
    const totalGasto =
        itens.reduce(
            (
                total,
                item
            ) =>
                total +
                item.gasto,
            0
        );


    /*
     * Para medir consumo do orçamento,
     * consideramos somente categorias
     * que possuem um limite definido.
     */
    const totalGastoOrcado =
        itens.reduce(
            (
                total,
                item
            ) => {

                if (
                    item.limite <= 0
                ) {
                    return total;
                }

                return (
                    total +
                    item.gasto
                );

            },
            0
        );


    /*
     * Uma categoria sem orçamento não pode
     * gerar "disponível negativo".
     *
     * Categorias com orçamento continuam
     * podendo deixar o total negativo quando
     * o limite realmente for ultrapassado.
     */
    const totalDisponivel =
        itens.reduce(
            (
                total,
                item
            ) => {

                if (
                    item.limite <= 0
                ) {
                    return total;
                }

                return (
                    total +
                    item.disponivel
                );

            },
            0
        );


    const percentualGeral =
        totalLimite > 0
            ? (
                totalGastoOrcado /
                totalLimite
            ) * 100
            : 0;

    return {
        mesReferencia:
            normalizarMesReferencia(
                mesReferencia
            ),

        itens,

        totalLimite,
        totalGasto,
        totalGastoOrcado,
        totalDisponivel,
        percentualGeral,

        quantidadeOrcamentos:
            orcamentos.length
    };

}


export async function salvarOrcamento({
    categoriaId,
    mesReferencia,
    valorLimite
}) {

    const user =
        await obterUsuario();

    if (!categoriaId) {
        throw new Error(
            "Selecione uma categoria."
        );
    }

    const limite =
        Number(
            valorLimite
        );

    if (
        !Number.isFinite(limite) ||
        limite <= 0
    ) {
        throw new Error(
            "Informe um limite maior que zero."
        );
    }

    const mes =
        normalizarMesReferencia(
            mesReferencia
        );

    /*
     * Confere se a categoria realmente
     * pertence ao usuário e é de despesa.
     */
    const {
        data: categoria,
        error: erroCategoria
    } = await supabase
        .schema("rumo")
        .from("categorias")
        .select(
            "id,nome,tipo,ativo"
        )
        .eq(
            "id",
            categoriaId
        )
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "tipo",
            "despesa"
        )
        .eq(
            "ativo",
            true
        )
        .maybeSingle();

    if (erroCategoria) {
        throw erroCategoria;
    }

    if (!categoria) {
        throw new Error(
            "Categoria de despesa inválida."
        );
    }

    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("orcamentos")
        .upsert(
            {
                usuario_id:
                    user.id,

                categoria_id:
                    categoriaId,

                mes_referencia:
                    mes,

                valor_limite:
                    limite
            },
            {
                onConflict:
                    "usuario_id,categoria_id,mes_referencia"
            }
        )
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;

}


export async function excluirOrcamento(
    orcamentoId
) {

    const user =
        await obterUsuario();

    if (!orcamentoId) {
        throw new Error(
            "Orçamento inválido."
        );
    }

    const {
        error
    } = await supabase
        .schema("rumo")
        .from("orcamentos")
        .delete()
        .eq(
            "id",
            orcamentoId
        )
        .eq(
            "usuario_id",
            user.id
        );

    if (error) {
        throw error;
    }

    return true;

}