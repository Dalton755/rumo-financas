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


async function usuarioTemOpenFinance(
    usuarioId
) {

    // =====================================================
    // ASSINATURA ATIVA
    // =====================================================

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
                id,
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

        console.error(
            "[RUMO OPEN FINANCE] Erro ao consultar assinatura:",
            assinaturaError
        );

        throw new Error(
            "ERRO_ASSINATURA"
        );

    }


    if (!assinatura?.plano_id) {
        return false;
    }


    // =====================================================
    // RECURSO OPEN_FINANCE NO PLANO
    // =====================================================

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

        console.error(
            "[RUMO OPEN FINANCE] Recurso OPEN_FINANCE não encontrado:",
            recursoError
        );

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

        console.error(
            "[RUMO OPEN FINANCE] Erro ao consultar recurso do plano:",
            planoRecursoError
        );

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

    // =====================================================
    // MÉTODO
    // =====================================================

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


    // =====================================================
    // CREDENCIAIS PLUGGY
    // SOMENTE NO SERVIDOR
    // =====================================================

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


    if (
        !clientId ||
        !clientSecret
    ) {

        console.error(
            "[RUMO OPEN FINANCE] Credenciais da Pluggy ausentes."
        );

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

        // =================================================
        // USUÁRIO AUTENTICADO
        // =================================================

        const user =
            await autenticarUsuario(
                req
            );


        // =================================================
        // PREMIUM + OPEN_FINANCE
        // =================================================

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


        // =================================================
        // CLIENTE PLUGGY
        // =================================================

        const pluggy =
            new PluggyClient({
                clientId,
                clientSecret,
            });


        // =================================================
        // CONNECT TOKEN
        //
        // O UUID DO RUMO É ENVIADO COMO clientUserId.
        // ISSO PERMITE ASSOCIAR FUTURAMENTE O ITEM DA
        // PLUGGY AO USUÁRIO CORRETO.
        // =================================================

        const connectToken =
            await pluggy
                .createConnectToken(
                    undefined,
                    {
                        clientUserId:
                            user.id,

                        avoidDuplicates:
                            true,
                    }
                );


        const accessToken =
            connectToken
                ?.accessToken;


        if (!accessToken) {

            console.error(
                "[RUMO OPEN FINANCE] Pluggy não retornou Connect Token."
            );

            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "Não foi possível iniciar a conexão bancária.",
                }
            );

        }


        console.log(
            "[RUMO OPEN FINANCE] Connect Token criado:",
            {
                usuario_id:
                    user.id,

                // Nunca registrar o token.
                token_criado:
                    true,
            }
        );


        return responder(
            res,
            200,
            {
                success: true,

                accessToken,
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
            "[RUMO OPEN FINANCE] Erro:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Erro interno ao iniciar o Open Finance.",
            }
        );

    }

}