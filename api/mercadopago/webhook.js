import {
    WebhookSignatureValidator,
} from "mercadopago";

import {
    supabaseAdmin,
} from "../_lib/supabaseAdmin.js";


const ACCESS_TOKEN =
    process.env.MERCADOPAGO_ACCESS_TOKEN;

const WEBHOOK_SECRET =
    process.env.MERCADOPAGO_WEBHOOK_SECRET;


// ============================================================
// RESPOSTA
// ============================================================

function responder(
    res,
    status,
    body
) {
    return res
        .status(status)
        .json(body);
}


// ============================================================
// PEGAR PRIMEIRO VALOR DE HEADER / QUERY
// ============================================================

function primeiroValor(valor) {

    if (Array.isArray(valor)) {
        return valor[0];
    }

    return valor;
}


// ============================================================
// DATA.ID
// ============================================================

function obterDataId(req) {

    const queryDataId =
        primeiroValor(
            req.query?.["data.id"]
        );

    if (queryDataId) {
        return String(
            queryDataId
        );
    }


    const bodyDataId =
        req.body?.data?.id;

    if (
        bodyDataId !== undefined &&
        bodyDataId !== null
    ) {
        return String(
            bodyDataId
        );
    }


    return null;
}


// ============================================================
// TIPO DO EVENTO
// ============================================================

function obterTipoEvento(req) {

    const queryType =
        primeiroValor(
            req.query?.type
        );

    if (queryType) {
        return String(
            queryType
        );
    }


    const bodyType =
        req.body?.type;

    if (bodyType) {
        return String(
            bodyType
        );
    }


    return null;
}


// ============================================================
// VALIDAÇÃO DA ASSINATURA DO WEBHOOK
// ============================================================

function validarAssinaturaWebhook(req) {

    const signature =
        primeiroValor(
            req.headers["x-signature"]
        );

    const requestId =
        primeiroValor(
            req.headers["x-request-id"]
        );

    const dataId =
        obterDataId(req);


    if (
        !signature ||
        !requestId ||
        !dataId ||
        !WEBHOOK_SECRET
    ) {

        console.warn(
            "[RUMO WEBHOOK] Dados de assinatura ausentes.",
            {
                possuiSignature:
                    Boolean(signature),

                possuiRequestId:
                    Boolean(requestId),

                possuiDataId:
                    Boolean(dataId),

                possuiSecret:
                    Boolean(WEBHOOK_SECRET),
            }
        );

        return false;
    }


    try {

        WebhookSignatureValidator.validate({
            xSignature:
                String(signature),

            xRequestId:
                String(requestId),

            dataId:
                String(dataId),

            secret:
                WEBHOOK_SECRET,
        });

        return true;

    } catch (error) {

        console.warn(
            "[RUMO WEBHOOK] Assinatura inválida:",
            error
        );

        return false;
    }
}


// ============================================================
// CONSULTAR PREAPPROVAL
// ============================================================

async function buscarAssinaturaMercadoPago(
    preapprovalId
) {

    const resposta =
        await fetch(
            `https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`,
            {
                method:
                    "GET",

                headers: {
                    Authorization:
                        `Bearer ${ACCESS_TOKEN}`,

                    "Content-Type":
                        "application/json",
                },
            }
        );


    const dados =
        await resposta.json();


    if (!resposta.ok) {

        const erro =
            new Error(
                dados?.message ??
                `Erro HTTP ${resposta.status} ao consultar assinatura.`
            );

        erro.statusHttp =
            resposta.status;

        erro.dados =
            dados;

        throw erro;
    }


    return dados;
}


// ============================================================
// CONSULTAR PAGAMENTO
// ============================================================

async function buscarPagamentoMercadoPago(
    paymentId
) {

    const resposta =
        await fetch(
            `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
            {
                method:
                    "GET",

                headers: {
                    Authorization:
                        `Bearer ${ACCESS_TOKEN}`,

                    "Content-Type":
                        "application/json",
                },
            }
        );


    const dados =
        await resposta.json();


    if (!resposta.ok) {

        const erro =
            new Error(
                dados?.message ??
                `Erro HTTP ${resposta.status} ao consultar pagamento.`
            );

        erro.statusHttp =
            resposta.status;

        erro.dados =
            dados;

        throw erro;
    }


    return dados;
}


// ============================================================
// MAPEAR STATUS
// ============================================================

function mapearStatusPagamento(
    statusMP,
    statusDetailMP
) {

    const status =
        String(
            statusMP ?? ""
        )
            .trim()
            .toLowerCase();


    const statusDetail =
        String(
            statusDetailMP ?? ""
        )
            .trim()
            .toLowerCase();


    switch (status) {

        case "approved":
            return "APROVADO";


        case "rejected":
            return "RECUSADO";


        case "cancelled":
        case "canceled":
            return "CANCELADO";


        case "refunded":
            return "ESTORNADO";


        case "charged_back":

            if (
                statusDetail ===
                "settled"
            ) {
                return "ESTORNADO";
            }

            return "APROVADO";


        default:
            return "PENDENTE";
    }
}


// ============================================================
// STATUS DE ASSINATURA CANCELADA
// ============================================================

function assinaturaFoiCancelada(statusMP) {

    const status =
        String(
            statusMP ?? ""
        )
            .trim()
            .toLowerCase();


    return [
        "cancelled",
        "canceled",
    ].includes(status);
}


// ============================================================
// ATIVAR / RENOVAR PREMIUM
//
// IMPORTANTE:
// ESTA FUNÇÃO SÓ É CHAMADA APÓS PAGAMENTO APROVADO.
// ============================================================

async function ativarOuRenovarPremium({
    pagamento,
    pagamentoMP,
}) {

    const preapprovalId =
        pagamento
            ?.mercado_pago_preapproval_id
            ? String(
                pagamento
                    .mercado_pago_preapproval_id
            )
            : null;


    if (!preapprovalId) {
        throw new Error(
            "Pagamento aprovado sem preapproval_id."
        );
    }


    const assinaturaMP =
        await buscarAssinaturaMercadoPago(
            preapprovalId
        );


    if (
        String(
            assinaturaMP?.status ?? ""
        ).toLowerCase() !==
        "authorized"
    ) {

        throw new Error(
            `Preapproval não autorizado. Status: ${assinaturaMP?.status ?? "desconhecido"}`
        );
    }


    const venceEm =
        assinaturaMP
            ?.next_payment_date ??
        null;


    if (!venceEm) {

        throw new Error(
            "Mercado Pago não retornou next_payment_date."
        );
    }


    const agora =
        new Date()
            .toISOString();


    const inicioEm =
        pagamentoMP
            ?.date_approved ??
        agora;


    const {
        data: assinaturaAtual,
        error: assinaturaAtualError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from("assinaturas")
            .select(`
                id,
                usuario_id,
                plano_id,
                status,
                inicio_em,
                vence_em,
                preco_contratado,
                periodo_contratado,
                mercado_pago_preapproval_id
            `)
            .eq(
                "usuario_id",
                pagamento.usuario_id
            )
            .maybeSingle();


    if (assinaturaAtualError) {
        throw assinaturaAtualError;
    }


    if (!assinaturaAtual) {
        throw new Error(
            "Assinatura do usuário não encontrada."
        );
    }


    const mesmoPreapproval =
        assinaturaAtual
            .mercado_pago_preapproval_id ===
        preapprovalId;


    const atualizacaoAssinatura = {

        plano_id:
            pagamento.plano_id,

        status:
            "ATIVA",

        vence_em:
            venceEm,

        preco_contratado:
            Number(
                pagamento.valor
            ),

        periodo_contratado:
            pagamento.periodo,

        mercado_pago_preapproval_id:
            preapprovalId,

        renovacao_automatica:
            true,

        cancelamento_provedor_pendente:
            false,

        cancelamento_provedor_em:
            null,

        cancelamento_provedor_erro:
            null,

        updated_at:
            agora,
    };


    /*
     * Na primeira ativação Premium,
     * atualizamos o início da assinatura.
     *
     * Em renovações do mesmo preapproval,
     * preservamos o início original.
     */
    if (!mesmoPreapproval) {
        atualizacaoAssinatura.inicio_em =
            inicioEm;
    }


    const {
        error: atualizarAssinaturaError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from("assinaturas")
            .update(
                atualizacaoAssinatura
            )
            .eq(
                "id",
                assinaturaAtual.id
            );


    if (atualizarAssinaturaError) {
        throw atualizarAssinaturaError;
    }


    return {
        assinaturaId:
            assinaturaAtual.id,

        venceEm,

        preapprovalId,
    };
}


// ============================================================
// ATUALIZAR PAGAMENTO EXISTENTE
// ============================================================

async function atualizarPagamentoExistente(
    pagamentoExistente,
    pagamentoMP,
    paymentId,
    statusRumo
) {

    const agora =
        new Date()
            .toISOString();


    const metadataAtual =
        pagamentoExistente?.metadata &&
            typeof pagamentoExistente.metadata ===
            "object" &&
            !Array.isArray(
                pagamentoExistente.metadata
            )
            ? pagamentoExistente.metadata
            : {};


    const atualizacao = {

        status:
            statusRumo,

        atualizado_em:
            agora,

        metadata: {
            ...metadataAtual,

            mercado_pago_status:
                pagamentoMP?.status ??
                null,

            mercado_pago_status_detail:
                pagamentoMP
                    ?.status_detail ??
                null,

            webhook_atualizado_em:
                agora,
        },
    };


    if (
        statusRumo ===
        "APROVADO"
    ) {

        atualizacao.pago_em =
            pagamentoExistente.pago_em ??
            pagamentoMP?.date_approved ??
            agora;
    }


    const {
        error,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .update(
                atualizacao
            )
            .eq(
                "id",
                pagamentoExistente.id
            );


    if (error) {
        throw error;
    }


    let assinaturaResultado =
        null;


    if (
        statusRumo ===
        "APROVADO"
    ) {

        assinaturaResultado =
            await ativarOuRenovarPremium({
                pagamento:
                    pagamentoExistente,

                pagamentoMP,
            });


        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .update({

                assinatura_id:
                    assinaturaResultado
                        .assinaturaId,

                vencimento_em:
                    assinaturaResultado
                        .venceEm,

                atualizado_em:
                    agora,
            })
            .eq(
                "id",
                pagamentoExistente.id
            );
    }


    return {
        processado:
            true,

        duplicado:
            true,

        status:
            statusRumo,

        pagamentoId:
            pagamentoExistente.id,

        assinatura:
            assinaturaResultado,
    };
}


// ============================================================
// PROCESSAR PAGAMENTO
// ============================================================

async function processarPagamento(
    pagamentoMP,
    paymentId
) {

    const agora =
        new Date()
            .toISOString();


    const statusRumo =
        mapearStatusPagamento(
            pagamentoMP?.status,
            pagamentoMP?.status_detail
        );


    // ========================================================
    // 1. IDEMPOTÊNCIA POR PAYMENT_ID
    // ========================================================

    const {
        data: pagamentoExistente,
        error: pagamentoExistenteError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .select("*")
            .eq(
                "mercado_pago_payment_id",
                paymentId
            )
            .maybeSingle();


    if (pagamentoExistenteError) {
        throw pagamentoExistenteError;
    }


    if (pagamentoExistente) {

        return atualizarPagamentoExistente(
            pagamentoExistente,
            pagamentoMP,
            paymentId,
            statusRumo
        );
    }


    // ========================================================
    // 2. LOCALIZAR CHECKOUT ORIGINAL PELO EXTERNAL_REFERENCE
    // ========================================================

    const externalReference =
        pagamentoMP
            ?.external_reference;


    if (!externalReference) {

        return {
            processado:
                false,

            ignorado:
                true,

            motivo:
                "Pagamento sem external_reference.",
        };
    }


    const {
        data: pagamentoBase,
        error: pagamentoBaseError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .select("*")
            .eq(
                "mercado_pago_external_reference",
                externalReference
            )
            .order(
                "criado_em",
                {
                    ascending:
                        false,
                }
            )
            .limit(1)
            .maybeSingle();


    if (pagamentoBaseError) {
        throw pagamentoBaseError;
    }


    if (!pagamentoBase) {

        return {
            processado:
                false,

            ignorado:
                true,

            motivo:
                "Pagamento não pertence ao Rumo.",
        };
    }


    // ========================================================
    // 3. PRIMEIRA COBRANÇA
    // ========================================================

    if (
        !pagamentoBase
            .mercado_pago_payment_id
    ) {

        const metadataBase =
            pagamentoBase?.metadata &&
                typeof pagamentoBase.metadata ===
                "object" &&
                !Array.isArray(
                    pagamentoBase.metadata
                )
                ? pagamentoBase.metadata
                : {};


        const atualizacao = {

            status:
                statusRumo,

            mercado_pago_payment_id:
                paymentId,

            atualizado_em:
                agora,

            metadata: {
                ...metadataBase,

                mercado_pago_status:
                    pagamentoMP?.status ??
                    null,

                mercado_pago_status_detail:
                    pagamentoMP
                        ?.status_detail ??
                    null,

                webhook_atualizado_em:
                    agora,
            },
        };


        if (
            statusRumo ===
            "APROVADO"
        ) {

            atualizacao.pago_em =
                pagamentoMP
                    ?.date_approved ??
                agora;
        }


        const {
            error: atualizarError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "pagamentos_assinaturas"
                )
                .update(
                    atualizacao
                )
                .eq(
                    "id",
                    pagamentoBase.id
                );


        if (atualizarError) {
            throw atualizarError;
        }


        let assinaturaResultado =
            null;


        if (
            statusRumo ===
            "APROVADO"
        ) {

            assinaturaResultado =
                await ativarOuRenovarPremium({
                    pagamento: {
                        ...pagamentoBase,

                        mercado_pago_payment_id:
                            paymentId,
                    },

                    pagamentoMP,
                });


            const {
                error: vincularError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from(
                        "pagamentos_assinaturas"
                    )
                    .update({

                        assinatura_id:
                            assinaturaResultado
                                .assinaturaId,

                        vencimento_em:
                            assinaturaResultado
                                .venceEm,

                        atualizado_em:
                            agora,
                    })
                    .eq(
                        "id",
                        pagamentoBase.id
                    );


            if (vincularError) {
                throw vincularError;
            }
        }


        return {
            processado:
                true,

            duplicado:
                false,

            renovacao:
                false,

            pagamentoId:
                pagamentoBase.id,

            status:
                statusRumo,

            assinatura:
                assinaturaResultado,
        };
    }


    // ========================================================
    // 4. RENOVAÇÃO
    // ========================================================

    let assinaturaResultado =
        null;


    if (
        statusRumo ===
        "APROVADO"
    ) {

        assinaturaResultado =
            await ativarOuRenovarPremium({
                pagamento:
                    pagamentoBase,

                pagamentoMP,
            });
    }


    const metadataBase =
        pagamentoBase?.metadata &&
            typeof pagamentoBase.metadata ===
            "object" &&
            !Array.isArray(
                pagamentoBase.metadata
            )
            ? pagamentoBase.metadata
            : {};


    const novoPagamento = {

        usuario_id:
            pagamentoBase.usuario_id,

        assinatura_id:
            assinaturaResultado
                ?.assinaturaId ??
            pagamentoBase.assinatura_id ??
            null,

        plano_id:
            pagamentoBase.plano_id,

        provedor:
            "MERCADO_PAGO",

        tipo:
            "RENOVACAO",

        status:
            statusRumo,

        valor:
            Number(
                pagamentoMP
                    ?.transaction_amount ??
                pagamentoBase.valor
            ),

        moeda:
            pagamentoMP
                ?.currency_id ??
            pagamentoBase.moeda ??
            "BRL",

        periodo:
            pagamentoBase.periodo,

        mercado_pago_preapproval_id:
            pagamentoBase
                .mercado_pago_preapproval_id,

        mercado_pago_payment_id:
            paymentId,

        mercado_pago_external_reference:
            externalReference,

        checkout_url:
            null,

        pago_em:
            statusRumo ===
                "APROVADO"
                ? pagamentoMP
                    ?.date_approved ??
                agora
                : null,

        vencimento_em:
            assinaturaResultado
                ?.venceEm ??
            null,

        criado_em:
            agora,

        atualizado_em:
            agora,

        metadata: {
            ...metadataBase,

            origem:
                "WEBHOOK_MERCADO_PAGO",

            mercado_pago_status:
                pagamentoMP?.status ??
                null,

            mercado_pago_status_detail:
                pagamentoMP
                    ?.status_detail ??
                null,
        },
    };


    const {
        data: pagamentoRenovacao,
        error: inserirError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .insert(
                novoPagamento
            )
            .select("id")
            .single();


    if (inserirError) {

        /*
         * Webhook pode chegar duas vezes simultaneamente.
         * O índice UNIQUE de payment_id protege o banco.
         */
        if (
            inserirError.code ===
            "23505"
        ) {

            const {
                data: jaCriado,
                error: jaCriadoError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from(
                        "pagamentos_assinaturas"
                    )
                    .select(
                        "id, status, assinatura_id"
                    )
                    .eq(
                        "mercado_pago_payment_id",
                        paymentId
                    )
                    .maybeSingle();


            if (jaCriadoError) {
                throw jaCriadoError;
            }


            return {
                processado:
                    true,

                duplicado:
                    true,

                renovacao:
                    true,

                pagamentoId:
                    jaCriado?.id ??
                    null,

                status:
                    jaCriado?.status ??
                    statusRumo,

                assinaturaId:
                    jaCriado
                        ?.assinatura_id ??
                    null,
            };
        }


        throw inserirError;
    }


    return {
        processado:
            true,

        duplicado:
            false,

        renovacao:
            true,

        pagamentoId:
            pagamentoRenovacao?.id ??
            null,

        status:
            statusRumo,

        assinatura:
            assinaturaResultado,
    };
}


// ============================================================
// PROCESSAR SUBSCRIPTION PREAPPROVAL
// ============================================================

async function processarPreapproval(
    preapprovalId
) {

    const assinaturaMP =
        await buscarAssinaturaMercadoPago(
            preapprovalId
        );


    const {
        data: pagamento,
        error: pagamentoError,
    } =
        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .select("*")
            .eq(
                "mercado_pago_preapproval_id",
                preapprovalId
            )
            .order(
                "criado_em",
                {
                    ascending:
                        true,
                }
            )
            .limit(1)
            .maybeSingle();


    if (pagamentoError) {
        throw pagamentoError;
    }


    if (!pagamento) {

        return {
            processado:
                false,

            ignorado:
                true,

            motivo:
                "Preapproval não pertence ao Rumo.",
        };
    }


    const statusMP =
        String(
            assinaturaMP?.status ??
            ""
        )
            .trim()
            .toLowerCase();


    const agora =
        new Date()
            .toISOString();


    /*
     * AUTORIZADO:
     *
     * Não libera Premium aqui.
     * A liberação acontece somente após payment = approved.
     */
    if (
        statusMP ===
        "authorized"
    ) {

        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .update({

                atualizado_em:
                    agora,

                metadata: {
                    ...(
                        pagamento?.metadata &&
                            typeof pagamento.metadata ===
                            "object" &&
                            !Array.isArray(
                                pagamento.metadata
                            )
                            ? pagamento.metadata
                            : {}
                    ),

                    mercado_pago_preapproval_status:
                        statusMP,

                    webhook_preapproval_em:
                        agora,
                },
            })
            .eq(
                "id",
                pagamento.id
            );


        return {
            processado:
                true,

            status:
                statusMP,

            premiumLiberado:
                false,
        };
    }


    /*
     * CANCELADO:
     *
     * Cancela somente a renovação.
     * O acesso já pago permanece até vence_em.
     */
    if (
        assinaturaFoiCancelada(
            statusMP
        )
    ) {

        await supabaseAdmin
            .schema("rumo")
            .from(
                "pagamentos_assinaturas"
            )
            .update({

                status:
                    pagamento.status ===
                        "PENDENTE"
                        ? "CANCELADO"
                        : pagamento.status,

                atualizado_em:
                    agora,
            })
            .eq(
                "id",
                pagamento.id
            );


        await supabaseAdmin
            .schema("rumo")
            .from("assinaturas")
            .update({

                renovacao_automatica:
                    false,

                cancelamento_provedor_pendente:
                    false,

                cancelamento_provedor_em:
                    agora,

                cancelamento_provedor_erro:
                    null,

                updated_at:
                    agora,
            })
            .eq(
                "usuario_id",
                pagamento.usuario_id
            )
            .eq(
                "mercado_pago_preapproval_id",
                preapprovalId
            );


        return {
            processado:
                true,

            status:
                statusMP,

            renovacaoAutomatica:
                false,
        };
    }


    return {
        processado:
            true,

        status:
            statusMP,

        premiumLiberado:
            false,
    };
}


// ============================================================
// HANDLER
// ============================================================

export default async function handler(
    req,
    res
) {

    if (
        req.method !==
        "POST"
    ) {

        return responder(
            res,
            405,
            {
                success:
                    false,

                error:
                    "Método não permitido.",
            }
        );
    }


    if (
        !ACCESS_TOKEN ||
        !WEBHOOK_SECRET
    ) {

        console.error(
            "[RUMO WEBHOOK] Configuração incompleta."
        );

        return responder(
            res,
            500,
            {
                success:
                    false,

                error:
                    "Configuração do webhook incompleta.",
            }
        );
    }


    if (
        !validarAssinaturaWebhook(
            req
        )
    ) {

        return responder(
            res,
            401,
            {
                success:
                    false,

                error:
                    "Assinatura do webhook inválida.",
            }
        );
    }


    const tipoEvento =
        obterTipoEvento(req);

    const dataId =
        obterDataId(req);


    console.log(
        "[RUMO WEBHOOK] Evento recebido:",
        {
            tipo:
                tipoEvento,

            dataId,
        }
    );


    const eventosAceitos = [
        "subscription_preapproval",
        "subscription_authorized_payment",
        "payment",
    ];


    if (
        !tipoEvento ||
        !eventosAceitos.includes(
            tipoEvento
        )
    ) {

        return responder(
            res,
            200,
            {
                success:
                    true,

                ignored:
                    true,

                type:
                    tipoEvento ??
                    null,
            }
        );
    }


    if (!dataId) {

        return responder(
            res,
            400,
            {
                success:
                    false,

                error:
                    "data.id não informado.",
            }
        );
    }


    try {

        // ====================================================
        // PREAPPROVAL
        // ====================================================

        if (
            tipoEvento ===
            "subscription_preapproval"
        ) {

            const resultado =
                await processarPreapproval(
                    String(
                        dataId
                    )
                );


            return responder(
                res,
                200,
                {
                    success:
                        true,

                    type:
                        tipoEvento,

                    resultado,
                }
            );
        }

        // ====================================================
        // AUTHORIZED PAYMENT DA ASSINATURA
        // ====================================================

        if (
            tipoEvento ===
            "subscription_authorized_payment"
        ) {

            const authorizedPaymentId =
                String(
                    dataId
                );


            const respostaAuthorizedPayment =
                await fetch(
                    `https://api.mercadopago.com/authorized_payments/${encodeURIComponent(authorizedPaymentId)}`,
                    {
                        method:
                            "GET",

                        headers: {
                            Authorization:
                                `Bearer ${ACCESS_TOKEN}`,

                            "Content-Type":
                                "application/json",
                        },
                    }
                );


            let authorizedPayment =
                null;


            try {

                authorizedPayment =
                    await respostaAuthorizedPayment.json();

            } catch {

                authorizedPayment =
                    null;
            }


            /*
             * FALLBACK DO SIMULADOR DO MERCADO PAGO
             *
             * Já observamos que o simulador pode informar:
             *
             * type = subscription_authorized_payment
             *
             * mas enviar em data.id um PREAPPROVAL_ID.
             *
             * Nesse cenário:
             *
             * /authorized_payments/{id}
             *
             * retorna HTTP 400.
             *
             * Então tratamos o mesmo data.id como preapproval.
             */
            if (
                !respostaAuthorizedPayment.ok &&
                respostaAuthorizedPayment.status === 400
            ) {

                console.warn(
                    "[RUMO WEBHOOK] Fallback: data.id será tratado como preapproval_id:",
                    {
                        dataId:
                            authorizedPaymentId,

                        authorizedPaymentStatus:
                            respostaAuthorizedPayment.status,

                        resposta:
                            authorizedPayment,
                    }
                );


                const resultado =
                    await processarPreapproval(
                        authorizedPaymentId
                    );


                return responder(
                    res,
                    200,
                    {
                        success:
                            true,

                        type:
                            tipoEvento,

                        fallback_preapproval:
                            true,

                        preapproval_id:
                            authorizedPaymentId,

                        resultado,
                    }
                );
            }


            /*
             * Qualquer outro erro continua sendo erro real.
             *
             * Exemplo:
             * 401 = token inválido
             * 403 = acesso negado
             * 500 = erro do provedor
             */
            if (
                !respostaAuthorizedPayment.ok
            ) {

                const erro =
                    new Error(
                        authorizedPayment?.message ??
                        `Erro HTTP ${respostaAuthorizedPayment.status} ao consultar pagamento autorizado.`
                    );

                erro.statusHttp =
                    respostaAuthorizedPayment.status;

                erro.dados =
                    authorizedPayment;

                throw erro;
            }


            const paymentId =
                String(
                    authorizedPayment
                        ?.payment
                        ?.id ??
                    ""
                );


            if (!paymentId) {

                throw new Error(
                    "Pagamento autorizado não possui payment.id."
                );
            }


            console.log(
                "[RUMO WEBHOOK] Pagamento autorizado identificado:",
                {
                    authorizedPaymentId,

                    paymentId,

                    preapprovalId:
                        authorizedPayment
                            ?.preapproval_id ??
                        null,
                }
            );


            const pagamentoMP =
                await buscarPagamentoMercadoPago(
                    paymentId
                );


            const resultado =
                await processarPagamento(
                    pagamentoMP,
                    paymentId
                );


            return responder(
                res,
                200,
                {
                    success:
                        true,

                    type:
                        tipoEvento,

                    authorized_payment_id:
                        authorizedPaymentId,

                    payment_id:
                        paymentId,

                    resultado,
                }
            );
        }



        // ====================================================
        // PAYMENT
        // ====================================================

        if (
            tipoEvento ===
            "payment"
        ) {

            const paymentId =
                String(
                    dataId
                );


            const pagamentoMP =
                await buscarPagamentoMercadoPago(
                    paymentId
                );


            const resultado =
                await processarPagamento(
                    pagamentoMP,
                    paymentId
                );


            return responder(
                res,
                200,
                {
                    success:
                        true,

                    type:
                        tipoEvento,

                    resultado,
                }
            );
        }


        return responder(
            res,
            200,
            {
                success:
                    true,

                ignored:
                    true,
            }
        );

    } catch (error) {

        console.error(
            "[RUMO WEBHOOK] Erro:",
            error
        );


        return responder(
            res,
            500,
            {
                success:
                    false,

                error:
                    "Erro interno ao processar webhook.",
            }
        );
    }
}