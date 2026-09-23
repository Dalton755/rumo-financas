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


export async function listarCompromissos() {

    const user =
        await obterUsuario();


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("compromissos")
        .select(`
            id,
            usuario_id,
            categoria_id,
            conta_id,
            nome,
            frequencia,
            intervalo,
            dia_semana,
            dia_mes,
            data_inicio,
            tipo_valor,
            valor_padrao,
            valor_estimado,
            ativo,
            created_at,
            updated_at,

            categoria:categorias(
                id,
                nome,
                icone,
                cor
            ),

            conta:contas(
                id,
                nome,
                banco
            )
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


export async function listarOcorrenciasCompromissos() {

    const user =
        await obterUsuario();


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("compromissos_ocorrencias")
        .select(`
            id,
            usuario_id,
            compromisso_id,
            vencimento,
            valor_previsto,
            valor_real,
            status,
            pago_em,
            movimentacao_id,
            created_at,
            updated_at
        `)
        .eq(
            "usuario_id",
            user.id
        )
        .neq(
            "status",
            "cancelado"
        )
        .order(
            "vencimento",
            {
                ascending: true
            }
        );


    if (error) {
        throw error;
    }


    return data || [];

}


export async function criarCompromisso({
    nome,
    categoriaId,
    contaId,
    frequencia,
    dataInicio,
    tipoValor,
    valorPadrao,
    valorEstimado
}) {

    const user =
        await obterUsuario();


    if (!nome?.trim()) {
        throw new Error(
            "Informe o nome do compromisso."
        );
    }


    if (!dataInicio) {
        throw new Error(
            "Informe o primeiro vencimento."
        );
    }


    const data =
        new Date(
            `${dataInicio}T12:00:00`
        );


    const diaSemana =
        data.getDay();


    const diaMes =
        data.getDate();


    const {
        data: compromisso,
        error
    } = await supabase
        .schema("rumo")
        .from("compromissos")
        .insert({
            usuario_id:
                user.id,

            categoria_id:
                categoriaId || null,

            conta_id:
                contaId || null,

            nome:
                nome.trim(),

            frequencia,

            intervalo: 1,

            dia_semana:
                frequencia === "semanal"
                    ? diaSemana
                    : null,

            dia_mes:
                frequencia === "mensal"
                    ? diaMes
                    : null,

            data_inicio:
                dataInicio,

            tipo_valor:
                tipoValor,

            valor_padrao:
                tipoValor === "fixo"
                    ? Number(
                        valorPadrao || 0
                    )
                    : null,

            valor_estimado:
                tipoValor === "variavel"
                    ? (
                        valorEstimado
                            ? Number(
                                valorEstimado
                            )
                            : null
                    )
                    : null,

            ativo: true
        })
        .select()
        .single();


    if (error) {
        throw error;
    }


    /*
     * Depois de criar o compromisso,
     * gera automaticamente as próximas
     * ocorrências.
     */
    await gerarOcorrenciasCompromissos();


    return compromisso;

}


export async function gerarOcorrenciasCompromissos(
    dataLimite = null
) {

    const limite =
        dataLimite ||
        (() => {

            const data =
                new Date();

            data.setMonth(
                data.getMonth() + 6
            );

            return data
                .toISOString()
                .slice(0, 10);

        })();


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .rpc(
            "gerar_ocorrencias_compromissos",
            {
                p_ate:
                    limite
            }
        );


    if (error) {
        throw error;
    }


    return data;

}


export async function atualizarValorOcorrencia(
    ocorrenciaId,
    valor
) {

    const user =
        await obterUsuario();


    if (
        !valor ||
        Number(valor) <= 0
    ) {
        throw new Error(
            "Informe um valor válido."
        );
    }


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("compromissos_ocorrencias")
        .update({
            valor_real:
                Number(valor),

            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            ocorrenciaId
        )
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "status",
            "pendente"
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;

}


export async function pagarOcorrenciaCompromisso({
    ocorrenciaId,
    contaId,
    valor,
    dataPagamento
}) {

    if (!ocorrenciaId) {
        throw new Error(
            "Ocorrência não informada."
        );
    }


    if (!contaId) {
        throw new Error(
            "Selecione a conta utilizada no pagamento."
        );
    }


    if (
        !valor ||
        Number(valor) <= 0
    ) {
        throw new Error(
            "Informe o valor pago."
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
    } = await supabase
        .schema("rumo")
        .rpc(
            "pagar_compromisso_ocorrencia",
            {
                p_ocorrencia_id:
                    ocorrenciaId,

                p_conta_id:
                    contaId,

                p_valor:
                    Number(valor),

                p_data_pagamento:
                    dataPagamento
            }
        );


    if (error) {
        throw error;
    }


    return data;

}


export async function arquivarCompromisso(
    compromissoId
) {

    const user =
        await obterUsuario();


    const {
        error
    } = await supabase
        .schema("rumo")
        .from("compromissos")
        .update({
            ativo: false,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            compromissoId
        )
        .eq(
            "usuario_id",
            user.id
        );


    if (error) {
        throw error;
    }

}