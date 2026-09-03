import {
    MercadoPagoConfig,
    PreApproval,
} from "mercadopago";

import {
    supabaseAdmin,
} from "../_lib/supabaseAdmin.js";

import {
    autenticarUsuario,
} from "../_lib/autenticarUsuario.js";


function responder(res, status, body) {
    return res
        .status(status)
        .json(body);
}


export default async function handler(req, res) {

    // =========================================================
    // MÉTODO
    // =========================================================

    if (req.method !== "POST") {
        return responder(
            res,
            405,
            {
                success: false,
                error: "Método não permitido.",
            }
        );
    }


    // =========================================================
    // CONFIGURAÇÃO DO SERVIDOR
    // =========================================================

    const accessToken =
        process.env.MERCADOPAGO_ACCESS_TOKEN;

    const isTestMode =
        String(
            process.env.MERCADOPAGO_MODO_TESTE ?? ""
        )
            .trim()
            .toLowerCase() === "true";

    const backUrl =
        process.env.MERCADOPAGO_BACK_URL;


    if (
        !accessToken ||
        !backUrl
    ) {
        console.error(
            "[RUMO CHECKOUT] Variáveis do Mercado Pago ausentes."
        );

        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Configuração de pagamento incompleta no servidor.",
            }
        );
    }


    try {

        // =====================================================
        // USUÁRIO AUTENTICADO
        // =====================================================

        const user =
            await autenticarUsuario(req);


        if (!user?.email) {
            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "O usuário autenticado não possui e-mail válido.",
                }
            );
        }


        // =====================================================
        // PERÍODO
        //
        // O FRONTEND PODE ESCOLHER SOMENTE O PERÍODO.
        // ELE NÃO ENVIA PREÇO.
        // =====================================================

        const periodo =
            String(
                req.body?.periodo ?? ""
            )
                .trim()
                .toUpperCase();


        if (
            periodo !== "MENSAL" &&
            periodo !== "ANUAL"
        ) {
            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "Período inválido. Use MENSAL ou ANUAL.",
                }
            );
        }


        // =====================================================
        // BUSCAR PREMIUM NO BANCO
        // =====================================================

        const {
            data: plano,
            error: planoError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from("planos")
                .select(
                    `
                    id,
                    codigo,
                    nome,
                    preco_mensal,
                    preco_anual,
                    ativo
                    `
                )
                .eq(
                    "codigo",
                    "PREMIUM"
                )
                .eq(
                    "ativo",
                    true
                )
                .maybeSingle();


        if (planoError) {
            console.error(
                "[RUMO CHECKOUT] Erro ao buscar plano:",
                planoError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Não foi possível consultar o plano Premium.",
                }
            );
        }


        if (!plano) {
            return responder(
                res,
                404,
                {
                    success: false,
                    error:
                        "Plano Premium não encontrado.",
                }
            );
        }


        // =====================================================
        // PREÇO VEM DO BANCO
        // =====================================================

        const valor =
            periodo === "MENSAL"
                ? Number(
                    plano.preco_mensal
                )
                : Number(
                    plano.preco_anual
                );


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {
            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Preço do plano Premium não está configurado corretamente.",
                }
            );
        }


        // =====================================================
        // ASSINATURA ATUAL DO USUÁRIO
        // =====================================================

        const {
            data: assinatura,
            error: assinaturaError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from("assinaturas")
                .select(
                    `
                    id,
                    usuario_id,
                    plano_id,
                    status,
                    mercado_pago_preapproval_id
                    `
                )
                .eq(
                    "usuario_id",
                    user.id
                )
                .maybeSingle();


        if (assinaturaError) {
            console.error(
                "[RUMO CHECKOUT] Erro ao buscar assinatura:",
                assinaturaError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Não foi possível consultar sua assinatura.",
                }
            );
        }


        if (!assinatura) {
            return responder(
                res,
                409,
                {
                    success: false,
                    error:
                        "Assinatura base do usuário não encontrada.",
                }
            );
        }


        // =====================================================
        // NÃO CRIAR NOVA COBRANÇA SE JÁ FOR PREMIUM
        // =====================================================

        if (
            assinatura.plano_id ===
            plano.id &&
            assinatura.status ===
            "ATIVA"
        ) {
            return responder(
                res,
                409,
                {
                    success: false,
                    error:
                        "Sua conta já possui o Rumo Premium ativo.",
                }
            );
        }


        // =====================================================
        // FREQUÊNCIA MERCADO PAGO
        // =====================================================

        const frequency =
            periodo === "MENSAL"
                ? 1
                : 12;

        const frequencyType =
            "months";


        // =====================================================
        // REFERÊNCIA ÚNICA
        // =====================================================

        const externalReference =
            [
                "RUMO",
                user.id,
                periodo,
                Date.now(),
            ].join("-");


        // =====================================================
        // PRIMEIRO REGISTRAMOS A INTENÇÃO NO BANCO
        //
        // Assim já existe um registro antes mesmo de chamarmos
        // o Mercado Pago.
        // =====================================================

        const metadataInicial = {
            user_id:
                user.id,

            email:
                user.email,

            plano_codigo:
                plano.codigo,

            plano_nome:
                plano.nome,

            periodo,

            origem:
                "CHECKOUT_RUMO",
        };


        const {
            data: pagamento,
            error: pagamentoError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "pagamentos_assinaturas"
                )
                .insert({
                    usuario_id:
                        user.id,

                    assinatura_id:
                        assinatura.id,

                    plano_id:
                        plano.id,

                    provedor:
                        "MERCADO_PAGO",

                    tipo:
                        "ASSINATURA",

                    status:
                        "PENDENTE",

                    valor,

                    moeda:
                        "BRL",

                    periodo,

                    mercado_pago_preapproval_id:
                        null,

                    mercado_pago_payment_id:
                        null,

                    mercado_pago_external_reference:
                        externalReference,

                    checkout_url:
                        null,

                    pago_em:
                        null,

                    vencimento_em:
                        null,

                    metadata:
                        metadataInicial,
                })
                .select("id")
                .single();


        if (
            pagamentoError ||
            !pagamento?.id
        ) {
            console.error(
                "[RUMO CHECKOUT] Erro ao registrar intenção de pagamento:",
                pagamentoError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Não foi possível iniciar o pagamento.",
                }
            );
        }


        // =====================================================
        // CLIENTE MERCADO PAGO
        // =====================================================

        const mercadoPago =
            new MercadoPagoConfig({
                accessToken,
            });


        const preApproval =
            new PreApproval(
                mercadoPago
            );

        const testPayerEmail =
            String(
                process.env.MERCADOPAGO_TEST_PAYER_EMAIL ?? ""
            ).trim();

        if (
            isTestMode &&
            !testPayerEmail
        ) {
            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "E-mail do comprador de teste não configurado.",
                }
            );
        }

        const payerEmail =
            isTestMode
                ? testPayerEmail
                : user.email;


        // =====================================================
        // PAYLOAD
        // =====================================================

        const checkoutBody = {

            reason:
                periodo === "MENSAL"
                    ? "Rumo Premium - Plano Mensal"
                    : "Rumo Premium - Plano Anual",

            external_reference:
                externalReference,

            payer_email:
                payerEmail,

            back_url:
                backUrl,

            auto_recurring: {

                frequency,

                frequency_type:
                    frequencyType,

                transaction_amount:
                    valor,

                currency_id:
                    "BRL",
            },
        };


        // =====================================================
        // CRIAR PREAPPROVAL
        // =====================================================

        let mercadoPagoResult;


        try {

            mercadoPagoResult =
                await preApproval.create({
                    body:
                        checkoutBody,
                });

        } catch (erroMercadoPago) {

            console.error(
                "[RUMO CHECKOUT] Mercado Pago recusou o checkout:",
                erroMercadoPago
            );


            await supabaseAdmin
                .schema("rumo")
                .from(
                    "pagamentos_assinaturas"
                )
                .update({
                    status:
                        "RECUSADO",

                    atualizado_em:
                        new Date()
                            .toISOString(),

                    metadata: {
                        ...metadataInicial,

                        erro_checkout:
                            erroMercadoPago?.message ??
                            "Erro ao criar assinatura no Mercado Pago",
                    },
                })
                .eq(
                    "id",
                    pagamento.id
                );


            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "O Mercado Pago recusou a criação do checkout.",
                }
            );
        }


        // =====================================================
        // DADOS RETORNADOS
        // =====================================================

        const preapprovalId =
            mercadoPagoResult?.id
                ? String(
                    mercadoPagoResult.id
                )
                : null;


        const checkoutUrl =
            mercadoPagoResult?.init_point
                ? String(
                    mercadoPagoResult.init_point
                )
                : mercadoPagoResult?.sandbox_init_point
                    ? String(
                        mercadoPagoResult.sandbox_init_point
                    )
                    : null;


        if (
            !preapprovalId ||
            !checkoutUrl
        ) {

            console.error(
                "[RUMO CHECKOUT] Resposta incompleta do Mercado Pago:",
                {
                    possuiPreapprovalId:
                        Boolean(
                            preapprovalId
                        ),

                    possuiCheckoutUrl:
                        Boolean(
                            checkoutUrl
                        ),
                }
            );


            await supabaseAdmin
                .schema("rumo")
                .from(
                    "pagamentos_assinaturas"
                )
                .update({
                    status:
                        "RECUSADO",

                    atualizado_em:
                        new Date()
                            .toISOString(),

                    metadata: {
                        ...metadataInicial,

                        erro_checkout:
                            "Mercado Pago retornou resposta incompleta.",
                    },
                })
                .eq(
                    "id",
                    pagamento.id
                );


            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "Mercado Pago não retornou os dados necessários para o checkout.",
                }
            );
        }


        // =====================================================
        // ATUALIZAR REGISTRO PENDENTE
        // =====================================================

        const {
            error: atualizacaoError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "pagamentos_assinaturas"
                )
                .update({

                    mercado_pago_preapproval_id:
                        preapprovalId,

                    checkout_url:
                        checkoutUrl,

                    atualizado_em:
                        new Date()
                            .toISOString(),

                    metadata: {
                        ...metadataInicial,

                        mercado_pago_status:
                            mercadoPagoResult?.status ??
                            null,
                    },
                })
                .eq(
                    "id",
                    pagamento.id
                );


        if (atualizacaoError) {

            console.error(
                "[RUMO CHECKOUT] Checkout criado, mas houve erro ao atualizar o banco:",
                atualizacaoError
            );


            return responder(
                res,
                200,
                {
                    success: true,

                    checkout_url:
                        checkoutUrl,

                    pagamento_id:
                        pagamento.id,

                    mercado_pago_preapproval_id:
                        preapprovalId,

                    warning:
                        "Checkout criado, mas houve falha ao salvar todos os dados locais.",
                }
            );
        }


        // =====================================================
        // SUCESSO
        // =====================================================

        console.log(
            "[RUMO CHECKOUT] Checkout criado:",
            {
                usuario_id:
                    user.id,

                pagamento_id:
                    pagamento.id,

                preapproval_id:
                    preapprovalId,

                periodo,

                valor,
            }
        );


        return responder(
            res,
            200,
            {
                success: true,

                checkout_url:
                    checkoutUrl,

                pagamento_id:
                    pagamento.id,

                mercado_pago_preapproval_id:
                    preapprovalId,

                plano:
                    plano.codigo,

                plano_nome:
                    plano.nome,

                periodo,

                valor,
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
            "[RUMO CHECKOUT] Erro interno:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Erro interno ao iniciar o checkout.",
            }
        );
    }
}