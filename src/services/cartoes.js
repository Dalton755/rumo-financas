import { supabase } from "./supabase";


async function obterUsuario() {

    const {
        data: { user },
        error
    } =
        await supabase.auth.getUser();


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


export async function listarCartoes() {

    const user =
        await obterUsuario();


    const {
        data: cartoes,
        error: erroCartoes
    } =
        await supabase
            .schema("rumo")
            .from("cartoes")
            .select(`
                id,
                usuario_id,
                nome,
                banco,
                bandeira,
                final_cartao,
                limite_total,
                fechamento_dia,
                vencimento_dia,
                ativo,
                created_at,
                updated_at
            `)
            .eq(
                "usuario_id",
                user.id
            )
            .eq(
                "ativo",
                true
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (erroCartoes) {
        throw erroCartoes;
    }


    const {
        data: compras,
        error: erroCompras
    } =
        await supabase
            .schema("rumo")
            .from("compras_cartao")
            .select(`
                id,
                cartao_id
            `)
            .eq(
                "usuario_id",
                user.id
            )
            .eq(
                "status",
                "ativa"
            );


    if (erroCompras) {
        throw erroCompras;
    }


    const comprasLista =
        compras || [];


    const compraParaCartao =
        new Map(
            comprasLista.map(
                (item) => [
                    item.id,
                    item.cartao_id
                ]
            )
        );


    let parcelas = [];


    if (
        comprasLista.length > 0
    ) {

        const {
            data,
            error
        } =
            await supabase
                .schema("rumo")
                .from("parcelas_cartao")
                .select(`
                    compra_id,
                    valor,
                    status
                `)
                .eq(
                    "usuario_id",
                    user.id
                )
                .eq(
                    "status",
                    "pendente"
                )
                .in(
                    "compra_id",
                    comprasLista.map(
                        (item) =>
                            item.id
                    )
                );


        if (error) {
            throw error;
        }


        parcelas =
            data || [];

    }


    const usadoPorCartao =
        new Map();


    parcelas.forEach(
        (parcela) => {

            const cartaoId =
                compraParaCartao.get(
                    parcela.compra_id
                );


            if (!cartaoId) {
                return;
            }


            const atual =
                usadoPorCartao.get(
                    cartaoId
                ) || 0;


            usadoPorCartao.set(
                cartaoId,
                atual +
                Number(
                    parcela.valor || 0
                )
            );

        }
    );


    return (
        cartoes || []
    ).map(
        (cartao) => {

            const limiteTotal =
                Number(
                    cartao.limite_total ||
                    0
                );


            const limiteUsado =
                usadoPorCartao.get(
                    cartao.id
                ) || 0;


            return {
                ...cartao,

                limite_total:
                    limiteTotal,

                limite_usado:
                    limiteUsado,

                limite_disponivel:
                    Math.max(
                        limiteTotal -
                        limiteUsado,
                        0
                    )
            };

        }
    );

}


export async function salvarCartao({
    id = null,
    nome,
    banco,
    bandeira,
    finalCartao,
    limiteTotal,
    fechamentoDia,
    vencimentoDia
}) {

    const user =
        await obterUsuario();


    if (!nome?.trim()) {
        throw new Error(
            "Informe o nome do cartão."
        );
    }


    if (
        !fechamentoDia ||
        Number(fechamentoDia) < 1 ||
        Number(fechamentoDia) > 31
    ) {
        throw new Error(
            "Informe um dia de fechamento válido."
        );
    }


    if (
        !vencimentoDia ||
        Number(vencimentoDia) < 1 ||
        Number(vencimentoDia) > 31
    ) {
        throw new Error(
            "Informe um dia de vencimento válido."
        );
    }


    const finalLimpo =
        String(
            finalCartao || ""
        )
            .replace(/\D/g, "")
            .slice(0, 4);


    if (
        finalLimpo &&
        finalLimpo.length !== 4
    ) {
        throw new Error(
            "Informe os 4 últimos dígitos do cartão."
        );
    }


    const payload = {
        usuario_id:
            user.id,

        nome:
            nome.trim(),

        banco:
            banco || null,

        bandeira:
            bandeira || null,

        final_cartao:
            finalLimpo || null,

        limite_total:
            Number(
                limiteTotal || 0
            ),

        fechamento_dia:
            Number(
                fechamentoDia
            ),

        vencimento_dia:
            Number(
                vencimentoDia
            ),

        updated_at:
            new Date()
                .toISOString()
    };


    if (id) {

        const {
            data,
            error
        } =
            await supabase
                .schema("rumo")
                .from("cartoes")
                .update(
                    payload
                )
                .eq(
                    "id",
                    id
                )
                .eq(
                    "usuario_id",
                    user.id
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        return data;

    }


    const {
        data,
        error
    } =
        await supabase
            .schema("rumo")
            .from("cartoes")
            .insert(
                payload
            )
            .select()
            .single();


    if (error) {
        throw error;
    }


    return data;

}


export async function arquivarCartao(
    cartaoId
) {

    const user =
        await obterUsuario();


    const {
        error
    } =
        await supabase
            .schema("rumo")
            .from("cartoes")
            .update({
                ativo: false,
                updated_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "id",
                cartaoId
            )
            .eq(
                "usuario_id",
                user.id
            );


    if (error) {
        throw error;
    }

}

export async function listarCategoriasDespesa() {

    const user =
        await obterUsuario();


    const {
        data,
        error
    } =
        await supabase
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
            .eq(
                "tipo",
                "despesa"
            )
            .eq(
                "ativo",
                true
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (error) {
        throw error;
    }


    return data || [];

}


export async function criarCompraCartao({
    cartaoId,
    categoriaId,
    descricao,
    valorTotal,
    dataCompra,
    parcelasTotal = 1,
    observacao = ""
}) {

    if (!cartaoId) {
        throw new Error(
            "Selecione um cartão."
        );
    }


    if (!descricao?.trim()) {
        throw new Error(
            "Informe a descrição da compra."
        );
    }


    if (
        !valorTotal ||
        Number(valorTotal) <= 0
    ) {
        throw new Error(
            "Informe um valor válido."
        );
    }


    if (!dataCompra) {
        throw new Error(
            "Informe a data da compra."
        );
    }


    const {
        data,
        error
    } =
        await supabase
            .schema("rumo")
            .rpc(
                "criar_compra_cartao",
                {
                    p_cartao_id:
                        cartaoId,

                    p_categoria_id:
                        categoriaId ||
                        null,

                    p_descricao:
                        descricao.trim(),

                    p_valor_total:
                        Number(
                            valorTotal
                        ),

                    p_data_compra:
                        dataCompra,

                    p_parcelas_total:
                        Number(
                            parcelasTotal ||
                            1
                        ),

                    p_observacao:
                        observacao?.trim() ||
                        null
                }
            );


    if (error) {
        throw error;
    }


    return data;

}

export async function listarParcelasCartao(
    cartaoId
) {

    const user =
        await obterUsuario();


    const {
        data: compras,
        error: erroCompras
    } =
        await supabase
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
                "cartao_id",
                cartaoId
            )
            .eq(
                "status",
                "ativa"
            );


    if (erroCompras) {
        throw erroCompras;
    }


    if (
        !compras ||
        compras.length === 0
    ) {
        return [];
    }


    const mapaCompras =
        new Map(
            compras.map(
                (compra) => [
                    compra.id,
                    compra
                ]
            )
        );


    const {
        data: parcelas,
        error: erroParcelas
    } =
        await supabase
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
                pago_em,
                movimentacao_pagamento_id
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
                compras.map(
                    (compra) =>
                        compra.id
                )
            )
            .order(
                "vencimento",
                {
                    ascending: true
                }
            )
            .order(
                "numero_parcela",
                {
                    ascending: true
                }
            );


    if (erroParcelas) {
        throw erroParcelas;
    }


    return (
        parcelas || []
    ).map(
        (parcela) => ({
            ...parcela,

            compra:
                mapaCompras.get(
                    parcela.compra_id
                )
        })
    );

}
export async function listarContasPagamento() {

    const user =
        await obterUsuario();


    const {
        data,
        error
    } =
        await supabase
            .schema("rumo")
            .from("contas")
            .select(`
                id,
                nome,
                banco,
                tipo
            `)
            .eq(
                "usuario_id",
                user.id
            )
            .eq(
                "ativo",
                true
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (error) {
        throw error;
    }




    return data || [];

}


export async function pagarFaturaCartao({
    cartaoId,
    vencimento,
    contaId,
    dataPagamento
}) {

    await obterUsuario();


    if (!cartaoId) {
        throw new Error(
            "Cartão não informado."
        );
    }


    if (!vencimento) {
        throw new Error(
            "Fatura não informada."
        );
    }


    if (!contaId) {
        throw new Error(
            "Selecione a conta usada para pagar a fatura."
        );
    }


    if (!dataPagamento) {
        throw new Error(
            "Informe a data do pagamento."
        );
    }


    const {
        data,
        error
    } =
        await supabase
            .schema("rumo")
            .rpc(
                "pagar_fatura_cartao",
                {
                    p_cartao_id:
                        cartaoId,

                    p_vencimento:
                        vencimento,

                    p_conta_id:
                        contaId,

                    p_data_pagamento:
                        dataPagamento
                }
            );


    if (error) {
        throw error;
    }


    return data;

}