import {
    supabaseAdmin,
} from "../_lib/supabaseAdmin.js";

import {
    autenticarUsuario,
} from "../_lib/autenticarUsuario.js";


function responder(
    res,
    status,
    body
) {

    return res
        .status(status)
        .json(body);

}


function arredondar2(
    valor
) {

    return Math.round(
        (
            Number(valor || 0) +
            Number.EPSILON
        ) * 100
    ) / 100;

}


function efeitoMovimentacao(
    movimentacao
) {

    const valor =
        Math.abs(
            Number(
                movimentacao?.valor || 0
            )
        );


    if (
        movimentacao?.tipo_pluggy ===
        "CREDIT"
    ) {

        return valor;

    }


    if (
        movimentacao?.tipo_pluggy ===
        "DEBIT"
    ) {

        return -valor;

    }


    return 0;

}


function tipoMovimentacaoRumo(
    tipoPluggy
) {

    if (
        tipoPluggy ===
        "CREDIT"
    ) {

        return "receita";

    }


    if (
        tipoPluggy ===
        "DEBIT"
    ) {

        return "despesa";

    }


    return null;

}


async function usuarioTemOpenFinance(
    usuarioId
) {

    const agora =
        new Date()
            .toISOString();


    const {
        data: assinatura,
        error: assinaturaError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from("assinaturas")
            .select(`
                plano_id,
                status,
                vence_em
            `)
            .eq(
                "usuario_id",
                usuarioId
            )
            .eq(
                "status",
                "ATIVA"
            )
            .or(
                `vence_em.is.null,vence_em.gt.${agora}`
            )
            .limit(1)
            .maybeSingle();


    if (
        assinaturaError ||
        !assinatura?.plano_id
    ) {

        return false;

    }


    const {
        data: recurso,
        error: recursoError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from("recursos")
            .select("id")
            .eq(
                "codigo",
                "OPEN_FINANCE"
            )
            .eq(
                "ativo",
                true
            )
            .maybeSingle();


    if (
        recursoError ||
        !recurso?.id
    ) {

        return false;

    }


    const {
        data: planoRecurso,
        error: planoRecursoError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from("plano_recursos")
            .select("plano_id")
            .eq(
                "plano_id",
                assinatura.plano_id
            )
            .eq(
                "recurso_id",
                recurso.id
            )
            .eq(
                "ativo",
                true
            )
            .maybeSingle();


    if (planoRecursoError) {

        throw planoRecursoError;

    }


    return Boolean(
        planoRecurso
    );

}


export default async function handler(
    req,
    res
) {

    if (
        req.method !== "POST"
    ) {

        return responder(
            res,
            405,
            {
                success: false,
                error:
                    "Método não permitido.",
            }
        );

    }


    try {

        // =====================================================
        // USUÁRIO
        // =====================================================

        const user =
            await autenticarUsuario(
                req
            );


        const permitido =
            await usuarioTemOpenFinance(
                user.id
            );


        if (!permitido) {

            return responder(
                res,
                403,
                {
                    success: false,
                    error:
                        "Open Finance não está disponível no seu plano.",
                }
            );

        }


        // =====================================================
        // CONEXÃO
        // =====================================================

        const conexaoId =
            String(
                req.body?.conexaoId ??
                ""
            ).trim();


        if (!conexaoId) {

            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "Conexão Open Finance não informada.",
                }
            );

        }


        const {
            data: conexao,
            error: conexaoError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "open_finance_conexoes"
                )
                .select(`
                    id,
                    usuario_id,
                    pluggy_item_id,
                    ativo
                `)
                .eq(
                    "id",
                    conexaoId
                )
                .eq(
                    "usuario_id",
                    user.id
                )
                .eq(
                    "ativo",
                    true
                )
                .maybeSingle();


        if (
            conexaoError ||
            !conexao
        ) {

            return responder(
                res,
                404,
                {
                    success: false,
                    error:
                        "Conexão Open Finance não encontrada.",
                }
            );

        }


        // =====================================================
        // SOMENTE CONTAS BANK
        //
        // CARTÃO DE CRÉDITO CONTINUA FORA DESTA INTEGRAÇÃO.
        // =====================================================

        const {
            data: contasExternas,
            error: contasError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "open_finance_contas"
                )
                .select(`
                    id,
                    fingerprint_conta,
                    pluggy_account_id,
                    nome,
                    numero_mascarado,
                    saldo,
                    tipo_pluggy,
                    subtipo_pluggy,
                    conta_rumo_id,
                    ativo
                `)
                .eq(
                    "usuario_id",
                    user.id
                )
                .eq(
                    "conexao_id",
                    conexao.id
                )
                .eq(
                    "tipo_pluggy",
                    "BANK"
                )
                .eq(
                    "ativo",
                    true
                );


        if (contasError) {

            throw contasError;

        }


        let contasCriadas =
            0;

        let contasJaExistentes =
            0;

        let movimentacoesProcessadas =
            0;


        const resumo =
            [];


        for (
            const contaExterna of
            contasExternas ?? []
        ) {

            // =================================================
            // MOVIMENTAÇÕES POSTED DESTA CONTA
            // =================================================

            const {
                data: movimentacoesExternas,
                error: movimentacoesError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from(
                        "open_finance_movimentacoes"
                    )
                    .select(`
                        id,
                        fingerprint_movimentacao,
                        pluggy_transaction_id,
                        data_movimentacao,
                        descricao,
                        descricao_original,
                        tipo_pluggy,
                        valor,
                        categoria_pluggy,
                        status_pluggy,
                        movimentacao_rumo_id
                    `)
                    .eq(
                        "usuario_id",
                        user.id
                    )
                    .eq(
                        "open_finance_conta_id",
                        contaExterna.id
                    )
                    .eq(
                        "status_pluggy",
                        "POSTED"
                    );


            if (movimentacoesError) {

                throw movimentacoesError;

            }


            const movimentacoesValidas =
                (
                    movimentacoesExternas ??
                    []
                )
                    .filter(
                        (movimentacao) =>
                            movimentacao.tipo_pluggy ===
                            "DEBIT" ||
                            movimentacao.tipo_pluggy ===
                            "CREDIT"
                    );

            /*
* Migração dos registros que já foram integrados
* anteriormente usando pluggy_transaction_id.
*
* Transformamos a origem_referencia existente no
* fingerprint estável antes do novo upsert.
*/
            for (
                const movimentacao of
                movimentacoesValidas
            ) {

                if (
                    !movimentacao
                        .fingerprint_movimentacao
                ) {

                    throw new Error(
                        "A movimentação Open Finance não possui fingerprint."
                    );

                }


                if (
                    !movimentacao
                        .movimentacao_rumo_id
                ) {
                    continue;
                }


                const {
                    error: referenciaMovimentacaoError,
                } =
                    await supabaseAdmin
                        .schema("rumo")
                        .from("movimentacoes")
                        .update({
                            origem_referencia:
                                movimentacao
                                    .fingerprint_movimentacao,
                        })
                        .eq(
                            "id",
                            movimentacao
                                .movimentacao_rumo_id
                        )
                        .eq(
                            "usuario_id",
                            user.id
                        )
                        .eq(
                            "origem",
                            "OPEN_FINANCE"
                        );


                if (
                    referenciaMovimentacaoError
                ) {

                    throw referenciaMovimentacaoError;

                }

            }


            // =================================================
            // EFEITO DO HISTÓRICO IMPORTADO
            // =================================================

            const efeitoHistorico =
                movimentacoesValidas
                    .reduce(
                        (
                            total,
                            movimentacao
                        ) =>
                            total +
                            efeitoMovimentacao(
                                movimentacao
                            ),
                        0
                    );


            const saldoAtualPluggy =
                Number(
                    contaExterna.saldo ??
                    0
                );


            const saldoInicialCalculado =
                arredondar2(
                    saldoAtualPluggy -
                    efeitoHistorico
                );


            // =================================================
            // PROCURAR CONTA JÁ IMPORTADA
            //
            // ISSO PROTEGE TAMBÉM UMA EXECUÇÃO ANTERIOR PARCIAL.
            // =================================================

            if (!contaExterna.fingerprint_conta) {

                throw new Error(
                    "A conta Open Finance não possui fingerprint."
                );

            }


           let contaExistente =
    null;


/*
 * A identidade financeira estável sempre tem prioridade.
 *
 * Em uma reconexão, conta_rumo_id pode apontar para uma
 * conta criada por uma integração antiga. O fingerprint
 * é a referência canônica.
 */
const {
    data: contaPorFingerprint,
    error: contaPorFingerprintError,
} =
    await supabaseAdmin
        .schema("rumo")
        .from("contas")
        .select(`
            id,
            nome,
            saldo_inicial
        `)
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "origem",
            "OPEN_FINANCE"
        )
        .eq(
            "origem_referencia",
            contaExterna.fingerprint_conta
        )
        .maybeSingle();


if (contaPorFingerprintError) {

    throw contaPorFingerprintError;

}


contaExistente =
    contaPorFingerprint;


/*
 * Compatibilidade com registros antigos.
 *
 * Só usamos o vínculo anterior se ainda não existir uma
 * conta canônica identificada pelo fingerprint.
 */
if (
    !contaExistente &&
    contaExterna.conta_rumo_id
) {

    const {
        data: contaVinculada,
        error: contaVinculadaError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from("contas")
            .select(`
                id,
                nome,
                saldo_inicial
            `)
            .eq(
                "id",
                contaExterna.conta_rumo_id
            )
            .eq(
                "usuario_id",
                user.id
            )
            .eq(
                "origem",
                "OPEN_FINANCE"
            )
            .maybeSingle();


    if (contaVinculadaError) {

        throw contaVinculadaError;

    }


    contaExistente =
        contaVinculada;

}


            let contaRumo =
                contaExistente;


            if (!contaRumo) {

                const nomeConta =
                    [
                        contaExterna.nome ??
                        "Conta bancária",

                        contaExterna.numero_mascarado ??
                        "",
                    ]
                        .filter(Boolean)
                        .join(" ");


                const {
                    data: novaConta,
                    error: novaContaError,
                } =
                    await supabaseAdmin
                        .schema("rumo")
                        .from("contas")
                        .insert({
                            usuario_id:
                                user.id,

                            nome:
                                nomeConta,

                            banco:
                                "open_finance",

                            tipo:
                                "corrente",

                            saldo_inicial:
                                saldoInicialCalculado,

                            ativo:
                                true,

                            origem:
                                "OPEN_FINANCE",

                            origem_referencia:
                                contaExterna
                                    .fingerprint_conta,
                        })
                        .select(`
                            id,
                            nome,
                            saldo_inicial
                        `)
                        .single();


                if (
                    novaContaError ||
                    !novaConta
                ) {

                    throw novaContaError ??
                    new Error(
                        "Não foi possível criar a conta do Rumo."
                    );

                }


                contaRumo =
                    novaConta;

                contasCriadas +=
                    1;

            } else {

                contasJaExistentes +=
                    1;

            }

            /*
 * Garante que contas antigas, que ainda tinham o
 * pluggy_account_id como origem_referencia, sejam
 * migradas para o fingerprint estável.
 */
            const {
                error: referenciaContaError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from("contas")
                    .update({
                        origem_referencia:
                            contaExterna.fingerprint_conta,
                    })
                    .eq(
                        "id",
                        contaRumo.id
                    )
                    .eq(
                        "usuario_id",
                        user.id
                    )
                    .eq(
                        "origem",
                        "OPEN_FINANCE"
                    );


            if (referenciaContaError) {

                throw referenciaContaError;

            }


            // =================================================
            // VINCULAR CONTA EXTERNA À CONTA DO RUMO
            // =================================================

            const {
                error: vinculoContaError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from(
                        "open_finance_contas"
                    )
                    .update({
                        conta_rumo_id:
                            contaRumo.id,

                        atualizado_em:
                            new Date()
                                .toISOString(),
                    })
                    .eq(
                        "id",
                        contaExterna.id
                    )
                    .eq(
                        "usuario_id",
                        user.id
                    );


            if (vinculoContaError) {

                throw vinculoContaError;

            }


            // =================================================
            // IMPORTAR MOVIMENTAÇÕES
            // =================================================

            const registrosRumo =
                movimentacoesValidas
                    .map(
                        (movimentacao) => {

                            const tipoRumo =
                                tipoMovimentacaoRumo(
                                    movimentacao
                                        .tipo_pluggy
                                );


                            return {

                                usuario_id:
                                    user.id,

                                conta_id:
                                    contaRumo.id,

                                categoria_id:
                                    null,

                                descricao:
                                    movimentacao
                                        .descricao ??
                                    "Movimentação Open Finance",

                                valor:
                                    arredondar2(
                                        Math.abs(
                                            Number(
                                                movimentacao
                                                    .valor ??
                                                0
                                            )
                                        )
                                    ),

                                tipo:
                                    tipoRumo,

                                data_movimentacao:
                                    movimentacao
                                        .data_movimentacao,

                                observacao:
                                    movimentacao
                                        .categoria_pluggy
                                        ? `Open Finance · ${movimentacao.categoria_pluggy}`
                                        : "Importado automaticamente via Open Finance",

                                origem:
                                    "OPEN_FINANCE",

                                origem_referencia:
                                    movimentacao
                                        .fingerprint_movimentacao,
                            };

                        }
                    );


            if (
                registrosRumo.length >
                0
            ) {

                const {
                    data: movimentacoesRumo,
                    error: upsertError,
                } =
                    await supabaseAdmin
                        .schema("rumo")
                        .from(
                            "movimentacoes"
                        )
                        .upsert(
                            registrosRumo,
                            {
                                onConflict:
                                    "usuario_id,origem,origem_referencia",
                            }
                        )
                        .select(`
                            id,
                            origem_referencia
                        `);


                if (upsertError) {

                    throw upsertError;

                }


                const mapaIds =
                    new Map(
                        (
                            movimentacoesRumo ??
                            []
                        )
                            .map(
                                (registro) => [
                                    registro
                                        .origem_referencia,

                                    registro.id,
                                ]
                            )
                    );


                for (
                    const movimentacaoExterna of
                    movimentacoesValidas
                ) {

                    const movimentacaoRumoId =
                        mapaIds.get(
                            movimentacaoExterna
                                .fingerprint_movimentacao
                        );


                    if (!movimentacaoRumoId) {
                        continue;
                    }


                    const {
                        error: vinculoMovimentacaoError,
                    } =
                        await supabaseAdmin
                            .schema("rumo")
                            .from(
                                "open_finance_movimentacoes"
                            )
                            .update({
                                movimentacao_rumo_id:
                                    movimentacaoRumoId,

                                atualizado_em:
                                    new Date()
                                        .toISOString(),
                            })
                            .eq(
                                "id",
                                movimentacaoExterna.id
                            )
                            .eq(
                                "usuario_id",
                                user.id
                            );


                    if (
                        vinculoMovimentacaoError
                    ) {

                        throw vinculoMovimentacaoError;

                    }

                }


                movimentacoesProcessadas +=
                    registrosRumo.length;

            }


            resumo.push({

                conta:
                    contaRumo.nome,

                saldo_inicial:
                    Number(
                        contaRumo.saldo_inicial
                    ),

                saldo_atual_pluggy:
                    saldoAtualPluggy,

                movimentacoes:
                    registrosRumo.length,

            });

        }


        return responder(
            res,
            200,
            {
                success: true,

                contas_criadas:
                    contasCriadas,

                contas_ja_existentes:
                    contasJaExistentes,

                movimentacoes_processadas:
                    movimentacoesProcessadas,

                contas:
                    resumo,
            }
        );

    } catch (error) {

        if (
            error?.message ===
            "TOKEN_AUSENTE" ||
            error?.message ===
            "TOKEN_INVALIDO"
        ) {

            return responder(
                res,
                401,
                {
                    success: false,
                    error:
                        "Não autorizado.",
                }
            );

        }


        console.error(
            "[RUMO OPEN FINANCE] Erro ao integrar dados ao Rumo:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Não foi possível integrar os dados Open Finance ao Rumo.",
            }
        );

    }

}