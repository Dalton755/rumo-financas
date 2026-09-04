import {
    createHmac,
} from "node:crypto";

import {
    PluggyClient,
} from "pluggy-sdk";

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


function normalizarData(
    valor
) {

    if (!valor) {
        return null;
    }


    if (
        typeof valor === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(valor)
    ) {

        return valor.slice(
            0,
            10
        );

    }


    const data =
        new Date(valor);


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return null;
    }


    return data
        .toISOString()
        .slice(
            0,
            10
        );

}

function normalizarTexto(
    valor
) {

    return String(
        valor ?? ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            " "
        );

}


function normalizarValorFingerprint(
    valor
) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(numero)
    ) {
        return "0";
    }


    return numero
        .toFixed(8)
        .replace(
            /0+$/,
            ""
        )
        .replace(
            /\.$/,
            ""
        );

}


function criarFingerprintMovimentacao({
    usuarioId,
    fingerprintConta,
    transacao,
    secret,
}) {

    if (!fingerprintConta) {

        throw new Error(
            "A conta Open Finance não possui fingerprint."
        );

    }


    const providerId =
        normalizarTexto(
            transacao?.providerId
        );


    let base;


    if (providerId) {

        /*
         * Para Open Finance, providerId é o identificador
         * da movimentação informado pelo provedor.
         *
         * Não armazenamos o providerId puro.
         * Ele participa somente do HMAC.
         */
        base =
            [
                "PROVIDER",
                String(
                    usuarioId
                ),
                String(
                    fingerprintConta
                ),
                providerId,
            ]
                .join("|");

    } else {

        /*
         * Fallback para instituições que não forneçam
         * providerId.
         *
         * Não usamos status ou categoria porque esses
         * campos podem mudar depois da transação.
         */
        const descricao =
            normalizarTexto(
                transacao?.descriptionRaw ??
                transacao?.description
            );


        base =
            [
                "FALLBACK",
                String(
                    usuarioId
                ),
                String(
                    fingerprintConta
                ),

                normalizarData(
                    transacao?.date
                ) ?? "",

                normalizarTexto(
                    transacao?.type
                ),

                normalizarValorFingerprint(
                    transacao?.amount
                ),

                normalizarTexto(
                    transacao?.currencyCode
                ),

                descricao,

                normalizarValorFingerprint(
                    transacao?.balance
                ),

                normalizarTexto(
                    transacao?.operationType
                ),

                normalizarTexto(
                    transacao?.providerCode
                ),
            ]
                .join("|");

    }


    return createHmac(
        "sha256",
        secret
    )
        .update(
            base,
            "utf8"
        )
        .digest(
            "hex"
        );

}


function subtrairDias(
    dataTexto,
    dias
) {

    const data =
        new Date(
            `${dataTexto}T12:00:00.000Z`
        );


    data.setUTCDate(
        data.getUTCDate() -
        dias
    );


    return data
        .toISOString()
        .slice(
            0,
            10
        );

}


async function obterDataFinanceiraAtual() {

    const {
        data,
        error,
    } =
        await supabaseAdmin
            .schema("rumo")
            .rpc(
                "data_financeira_atual"
            );


    if (
        error ||
        !data
    ) {

        console.error(
            "[RUMO OPEN FINANCE] Erro ao obter data financeira:",
            error
        );

        throw new Error(
            "ERRO_DATA_FINANCEIRA"
        );

    }


    return String(data);

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


    if (assinaturaError) {

        throw new Error(
            "ERRO_ASSINATURA"
        );

    }


    if (!assinatura?.plano_id) {
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

        throw new Error(
            "ERRO_RECURSO"
        );

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

        throw new Error(
            "ERRO_PLANO_RECURSO"
        );

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


    const clientId =
        String(
            process.env.PLUGGY_CLIENT_ID ??
            ""
        ).trim();


    const clientSecret =
        String(
            process.env.PLUGGY_CLIENT_SECRET ??
            ""
        ).trim();

    const fingerprintSecret =
        String(
            process.env.OPEN_FINANCE_FINGERPRINT_SECRET ??
            ""
        ).trim();


    if (
        !clientId ||
        !clientSecret ||
        !fingerprintSecret
    ) {

        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Integração Open Finance não configurada no servidor.",
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
        // VALIDAR ITEM NA PLUGGY
        // =====================================================

        const pluggy =
            new PluggyClient({
                clientId,
                clientSecret,
            });


        const item =
            await pluggy
                .fetchItem(
                    String(
                        conexao.pluggy_item_id
                    )
                );


        if (
            !item?.id ||
            String(
                item?.clientUserId ??
                ""
            ) !== user.id
        ) {

            return responder(
                res,
                403,
                {
                    success: false,
                    error:
                        "A conexão não pertence ao usuário autenticado.",
                }
            );

        }


        // =====================================================
        // PERÍODO
        //
        // PRIMEIRO TESTE:
        // últimos 90 dias até a data financeira do Rumo.
        // =====================================================

        const hoje =
            await obterDataFinanceiraAtual();


        const dataInicial =
            subtrairDias(
                hoje,
                90
            );


        // =====================================================
        // CONTAS EXTERNAS DA CONEXÃO
        // =====================================================

        const {
            data: contas,
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
                    tipo_pluggy,
                    nome
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
                    "ativo",
                    true
                );


        if (contasError) {

            throw contasError;

        }


        let totalRecebido =
            0;

        let totalSalvo =
            0;

        const resumoContas =
            [];


        // =====================================================
        // TRANSAÇÕES DE CADA CONTA
        // =====================================================

        for (
            const conta of
            contas ?? []
        ) {

            const transacoes =
                await pluggy
                    .fetchAllTransactions(
                        conta.pluggy_account_id,
                        {
                            dateFrom:
                                dataInicial,

                            dateTo:
                                hoje,
                        }
                    );


            const lista =
                Array.isArray(
                    transacoes
                )
                    ? transacoes
                    : [];


            totalRecebido +=
                lista.length;


            const agora =
                new Date()
                    .toISOString();


            const registros =
                lista
                    .filter(
                        (transacao) =>
                            Boolean(
                                transacao?.id
                            ) &&
                            Boolean(
                                normalizarData(
                                    transacao?.date
                                )
                            )
                    )
                    .map(
                        (transacao) => ({

                            usuario_id:
                                user.id,

                            fingerprint_movimentacao:
                                criarFingerprintMovimentacao({
                                    usuarioId:
                                        user.id,

                                    fingerprintConta:
                                        conta.fingerprint_conta,

                                    transacao,

                                    secret:
                                        fingerprintSecret,
                                }),

                            open_finance_conta_id:
                                conta.id,

                            pluggy_transaction_id:
                                String(
                                    transacao.id
                                ),

                            pluggy_account_id:
                                String(
                                    transacao.accountId ??
                                    conta.pluggy_account_id
                                ),

                            data_movimentacao:
                                normalizarData(
                                    transacao.date
                                ),

                            descricao:
                                transacao.description ??
                                "Movimentação bancária",

                            descricao_original:
                                transacao.descriptionRaw ??
                                null,

                            tipo_pluggy:
                                String(
                                    transacao.type ??
                                    "DESCONHECIDO"
                                ),

                            // Mantemos o valor original da Pluggy.
                            valor:
                                Number(
                                    transacao.amount ??
                                    0
                                ),

                            saldo_apos_movimentacao:
                                Number.isFinite(
                                    Number(
                                        transacao.balance
                                    )
                                )
                                    ? Number(
                                        transacao.balance
                                    )
                                    : null,

                            moeda:
                                transacao.currencyCode ??
                                null,

                            categoria_pluggy:
                                transacao.category ??
                                null,

                            status_pluggy:
                                transacao.status ??
                                null,

                            provider_code:
                                transacao.providerCode ??
                                null,

                            /*
                             * Não armazenamos paymentData neste
                             * momento porque pode conter CPF/CNPJ
                             * e dados de contraparte.
                             */
                            dados_pagamento:
                                null,

                            /*
                             * Também não armazenamos o objeto
                             * completo do cartão por enquanto.
                             */
                            dados_cartao:
                                null,

                            atualizado_em:
                                agora,
                        })
                    );


                      if (
                registros.length > 0
            ) {

                // =============================================
                // RECONCILIAR MOVIMENTAÇÕES
                //
                // pluggy_transaction_id pode mudar depois de
                // uma reconexão da instituição.
                //
                // Como a conta Open Finance interna é
                // preservada, podemos reconhecer o mesmo
                // lançamento dentro dela.
                // =============================================

                const {
                    data: movimentacoesExistentes,
                    error: movimentacoesExistentesError,
                } =
                    await supabaseAdmin
                        .schema("rumo")
                        .from(
                            "open_finance_movimentacoes"
                        )
                        .select(`
                            id,
                            open_finance_conta_id,
                            pluggy_transaction_id,
                            pluggy_account_id,
                            fingerprint_movimentacao,
                            data_movimentacao,
                            descricao,
                            descricao_original,
                            tipo_pluggy,
                            valor,
                            moeda,
                            movimentacao_rumo_id
                        `)
                        .eq(
                            "usuario_id",
                            user.id
                        )
                        .eq(
                            "open_finance_conta_id",
                            conta.id
                        );


                if (
                    movimentacoesExistentesError
                ) {

                    throw movimentacoesExistentesError;

                }


                let movimentacoesConhecidas =
                    movimentacoesExistentes ??
                    [];


                for (
                    const registro of
                    registros
                ) {

                    let movimentacaoExistente =
                        null;


                    // =========================================
                    // 1. MESMO ID DA PLUGGY
                    //
                    // Fluxo normal sem reconexão.
                    // =========================================

                    movimentacaoExistente =
                        movimentacoesConhecidas
                            .find(
                                (movimentacaoLocal) =>
                                    movimentacaoLocal
                                        .pluggy_transaction_id ===
                                    registro
                                        .pluggy_transaction_id
                            ) ??
                        null;


                    // =========================================
                    // 2. MESMO FINGERPRINT
                    //
                    // Proteção adicional dentro da mesma
                    // identidade atual da conta.
                    // =========================================

                    if (
                        !movimentacaoExistente
                    ) {

                        const candidatosFingerprint =
                            movimentacoesConhecidas
                                .filter(
                                    (movimentacaoLocal) =>
                                        movimentacaoLocal
                                            .fingerprint_movimentacao ===
                                        registro
                                            .fingerprint_movimentacao
                                );


                        if (
                            candidatosFingerprint.length ===
                            1
                        ) {

                            movimentacaoExistente =
                                candidatosFingerprint[0];

                        }

                    }


                    // =========================================
                    // 3. RECONEXÃO
                    //
                    // O ID da Pluggy e o fingerprint podem
                    // ter mudado.
                    //
                    // Então reconhecemos pela identidade
                    // financeira do lançamento:
                    //
                    // - mesma conta interna
                    // - mesma data
                    // - mesmo tipo
                    // - mesmo valor
                    // - mesma descrição
                    // =========================================

                    if (
                        !movimentacaoExistente
                    ) {

                        const descricaoRegistro =
                            normalizarTexto(
                                registro
                                    .descricao_original ??
                                registro
                                    .descricao
                            );


                        const candidatosCompatibilidade =
                            movimentacoesConhecidas
                                .filter(
                                    (movimentacaoLocal) => {

                                        const descricaoLocal =
                                            normalizarTexto(
                                                movimentacaoLocal
                                                    .descricao_original ??
                                                movimentacaoLocal
                                                    .descricao
                                            );


                                        return (
                                            movimentacaoLocal
                                                .data_movimentacao ===
                                                registro
                                                    .data_movimentacao &&

                                            normalizarTexto(
                                                movimentacaoLocal
                                                    .tipo_pluggy
                                            ) ===
                                            normalizarTexto(
                                                registro
                                                    .tipo_pluggy
                                            ) &&

                                            normalizarValorFingerprint(
                                                movimentacaoLocal
                                                    .valor
                                            ) ===
                                            normalizarValorFingerprint(
                                                registro
                                                    .valor
                                            ) &&

                                            descricaoLocal ===
                                            descricaoRegistro
                                        );

                                    }
                                );


                        if (
                            candidatosCompatibilidade.length ===
                            1
                        ) {

                            movimentacaoExistente =
                                candidatosCompatibilidade[0];

                        } else if (
                            candidatosCompatibilidade.length >
                            1
                        ) {

                            console.warn(
                                "[RUMO OPEN FINANCE] Movimentação de reconexão ambígua.",
                                {
                                    usuario_id:
                                        user.id,

                                    conta_id:
                                        conta.id,

                                    data:
                                        registro
                                            .data_movimentacao,

                                    valor:
                                        registro.valor,

                                    descricao:
                                        registro.descricao,

                                    candidatos:
                                        candidatosCompatibilidade
                                            .length,
                                }
                            );

                        }

                    }


                    // =========================================
                    // MOVIMENTAÇÃO RECONHECIDA
                    //
                    // Atualizamos o MESMO registro interno.
                    //
                    // movimentacao_rumo_id não está presente
                    // em "registro", portanto o vínculo com
                    // o Rumo é preservado.
                    // =========================================

                    if (
                        movimentacaoExistente
                    ) {

                        const {
                            error: atualizarMovimentacaoError,
                        } =
                            await supabaseAdmin
                                .schema("rumo")
                                .from(
                                    "open_finance_movimentacoes"
                                )
                                .update(
                                    registro
                                )
                                .eq(
                                    "id",
                                    movimentacaoExistente.id
                                )
                                .eq(
                                    "usuario_id",
                                    user.id
                                );


                        if (
                            atualizarMovimentacaoError
                        ) {

                            console.error(
                                "[RUMO OPEN FINANCE] Erro ao atualizar movimentação reconhecida:",
                                atualizarMovimentacaoError
                            );

                            throw atualizarMovimentacaoError;

                        }


                        movimentacoesConhecidas =
                            movimentacoesConhecidas
                                .map(
                                    (
                                        movimentacaoLocal
                                    ) =>
                                        movimentacaoLocal.id ===
                                        movimentacaoExistente.id
                                            ? {
                                                ...movimentacaoLocal,
                                                ...registro,
                                            }
                                            : movimentacaoLocal
                                );


                        totalSalvo +=
                            1;


                        continue;

                    }


                    // =========================================
                    // MOVIMENTAÇÃO REALMENTE NOVA
                    // =========================================

                    const {
                        data: movimentacaoCriada,
                        error: inserirMovimentacaoError,
                    } =
                        await supabaseAdmin
                            .schema("rumo")
                            .from(
                                "open_finance_movimentacoes"
                            )
                            .insert(
                                registro
                            )
                            .select(`
                                id,
                                open_finance_conta_id,
                                pluggy_transaction_id,
                                pluggy_account_id,
                                fingerprint_movimentacao,
                                data_movimentacao,
                                descricao,
                                descricao_original,
                                tipo_pluggy,
                                valor,
                                moeda,
                                movimentacao_rumo_id
                            `)
                            .single();


                    if (
                        inserirMovimentacaoError ||
                        !movimentacaoCriada
                    ) {

                        console.error(
                            "[RUMO OPEN FINANCE] Erro ao criar movimentação:",
                            {
                                conta:
                                    conta.pluggy_account_id,

                                erro:
                                    inserirMovimentacaoError,
                            }
                        );


                        throw inserirMovimentacaoError ??
                            new Error(
                                "Não foi possível criar a movimentação Open Finance."
                            );

                    }


                    movimentacoesConhecidas
                        .push(
                            movimentacaoCriada
                        );


                    totalSalvo +=
                        1;

                }

            }


            resumoContas.push({
                conta:
                    conta.nome ??
                    conta.pluggy_account_id,

                tipo:
                    conta.tipo_pluggy,

                total:
                    lista.length,
            });

        }


        // =====================================================
        // ATUALIZAR CONEXÃO
        // =====================================================

        const agora =
            new Date()
                .toISOString();


        await supabaseAdmin
            .schema("rumo")
            .from(
                "open_finance_conexoes"
            )
            .update({
                ultima_sincronizacao_em:
                    agora,

                atualizado_em:
                    agora,

                status:
                    item?.status ??
                    "UPDATED",
            })
            .eq(
                "id",
                conexao.id
            );


        return responder(
            res,
            200,
            {
                success: true,

                periodo: {
                    de:
                        dataInicial,

                    ate:
                        hoje,
                },

                contas:
                    resumoContas,

                total_recebido:
                    totalRecebido,

                total_processado:
                    totalSalvo,
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
            "[RUMO OPEN FINANCE] Erro ao sincronizar movimentações:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Não foi possível sincronizar as movimentações da instituição.",
            }
        );

    }

}