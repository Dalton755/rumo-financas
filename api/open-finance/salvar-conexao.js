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


function itemIdValido(
    valor
) {

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(
            String(valor ?? "")
        );

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
    // CONFIGURAÇÃO PLUGGY
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
            "[RUMO OPEN FINANCE] Credenciais Pluggy ausentes."
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
        // USUÁRIO
        // =================================================

        const user =
            await autenticarUsuario(
                req
            );


        // =================================================
        // RECURSO PREMIUM
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
        // ITEM INFORMADO PELO FRONTEND
        // =================================================

        const itemId =
            String(
                req.body?.itemId ??
                ""
            ).trim();


        if (
            !itemIdValido(
                itemId
            )
        ) {

            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "Identificador da conexão inválido.",
                }
            );

        }


        // =================================================
        // CONSULTA DIRETA À PLUGGY
        //
        // NÃO CONFIAMOS NOS DADOS RECEBIDOS DO NAVEGADOR.
        // =================================================

        const pluggy =
            new PluggyClient({
                clientId,
                clientSecret,
            });


        let item;


        try {

            item =
                await pluggy
                    .fetchItem(
                        itemId
                    );

        } catch (pluggyError) {

            console.error(
                "[RUMO OPEN FINANCE] Erro ao consultar Item na Pluggy:",
                pluggyError
            );

            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "Não foi possível validar a conexão junto à Pluggy.",
                }
            );

        }


        if (
            !item?.id
        ) {

            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "A Pluggy retornou uma conexão inválida.",
                }
            );

        }


        // =================================================
        // SEGURANÇA CRÍTICA
        //
        // O ITEM PRECISA PERTENCER AO MESMO USUÁRIO
        // AUTENTICADO NO RUMO.
        // =================================================

        const clientUserId =
            String(
                item?.clientUserId ??
                ""
            ).trim();


        if (
            !clientUserId ||
            clientUserId !== user.id
        ) {

            console.warn(
                "[RUMO OPEN FINANCE] Tentativa de vincular Item de outro usuário.",
                {
                    usuario_id:
                        user.id,

                    item_id:
                        itemId,
                }
            );

            return responder(
                res,
                403,
                {
                    success: false,
                    error:
                        "Esta conexão não pertence ao usuário autenticado.",
                }
            );

        }


        // =================================================
        // DADOS CONFIÁVEIS VINDOS DA PLUGGY
        // =================================================

        const connectorId =
            item?.connector?.id ??
            item?.connectorId ??
            null;


        const connectorName =
            item?.connector?.name ??
            null;


        const status =
            String(
                item?.status ??
                "DESCONHECIDO"
            );


        const agora =
            new Date()
                .toISOString();


        // =================================================
        // SALVAR / ATUALIZAR CONEXÃO
        // =================================================

        const {
            data: conexao,
            error: conexaoError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "open_finance_conexoes"
                )
                .upsert(
                    {
                        usuario_id:
                            user.id,

                        pluggy_item_id:
                            item.id,

                        pluggy_connector_id:
                            connectorId,

                        instituicao_nome:
                            connectorName,

                        status,

                        ativo:
                            true,

                        atualizado_em:
                            agora,
                    },
                    {
                        onConflict:
                            "pluggy_item_id",
                    }
                )
                .select(`
                    id,
                    pluggy_item_id,
                    pluggy_connector_id,
                    instituicao_nome,
                    status,
                    ativo,
                    criado_em,
                    atualizado_em
                `)
                .single();


        if (
            conexaoError ||
            !conexao
        ) {

            console.error(
                "[RUMO OPEN FINANCE] Erro ao salvar conexão:",
                conexaoError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "A conexão foi autorizada, mas não foi possível salvá-la no Rumo.",
                }
            );

        }


        console.log(
            "[RUMO OPEN FINANCE] Conexão salva:",
            {
                usuario_id:
                    user.id,

                conexao_id:
                    conexao.id,

                instituicao:
                    conexao.instituicao_nome,

                status:
                    conexao.status,
            }
        );


        return responder(
            res,
            200,
            {
                success: true,

                conexao,
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
            "[RUMO OPEN FINANCE] Erro interno ao salvar conexão:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Erro interno ao registrar a conexão Open Finance.",
            }
        );

    }

}