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
        //
        // NÃO EXIGIMOS PREMIUM PARA DESCONECTAR.
        // O USUÁRIO DEVE PODER REVOGAR O ACESSO
        // MESMO APÓS CANCELAMENTO DO PLANO.
        // =================================================

        const user =
            await autenticarUsuario(
                req
            );


        // =================================================
        // CONEXÃO
        // =================================================

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
                    instituicao_nome,
                    status,
                    ativo,
                    desconectado_em
                `)
                .eq(
                    "id",
                    conexaoId
                )
                .eq(
                    "usuario_id",
                    user.id
                )
                .maybeSingle();


        if (conexaoError) {

            console.error(
                "[RUMO OPEN FINANCE] Erro ao consultar conexão:",
                conexaoError
            );


            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Não foi possível consultar a conexão.",
                }
            );

        }


        if (!conexao) {

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


        // =================================================
        // JÁ DESCONECTADA
        //
        // TORNA A OPERAÇÃO IDEMPOTENTE.
        // =================================================

        if (
            conexao.ativo === false ||
            conexao.desconectado_em
        ) {

            return responder(
                res,
                200,
                {
                    success: true,
                    ja_desconectada:
                        true,

                    message:
                        "A instituição já estava desconectada.",
                }
            );

        }


        // =================================================
        // REVOGAR NA PLUGGY
        // =================================================

        const pluggy =
            new PluggyClient({
                clientId,
                clientSecret,
            });


        try {

            await pluggy
                .deleteItem(
                    String(
                        conexao.pluggy_item_id
                    )
                );

        } catch (pluggyError) {

            const statusPluggy =
                Number(
                    pluggyError?.response?.status ??
                    pluggyError?.status ??
                    0
                );


            /*
             * Se a Pluggy responder 404, o Item já não
             * existe mais no provedor.
             *
             * Isso significa que a autorização já foi
             * revogada anteriormente.
             *
             * Nesse cenário devemos continuar e corrigir
             * o estado local do Rumo para REVOGADO.
             */
            if (
                statusPluggy === 404
            ) {

                console.warn(
                    "[RUMO OPEN FINANCE] Item já removido da Pluggy. Ajustando estado local.",
                    {
                        usuario_id:
                            user.id,

                        conexao_id:
                            conexao.id,

                        pluggy_item_id:
                            conexao.pluggy_item_id,
                    }
                );

            } else {

                console.error(
                    "[RUMO OPEN FINANCE] Falha ao revogar Item na Pluggy:",
                    pluggyError
                );


                return responder(
                    res,
                    502,
                    {
                        success: false,
                        error:
                            "Não foi possível revogar a autorização junto à instituição. Tente novamente.",
                    }
                );

            }

        }


        const agora =
            new Date()
                .toISOString();


        // =================================================
        // MARCAR CONEXÃO COMO REVOGADA
        // =================================================

        const {
            error: atualizarConexaoError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "open_finance_conexoes"
                )
                .update({
                    ativo:
                        false,

                    status:
                        "REVOGADO",

                    desconectado_em:
                        agora,

                    motivo_desconexao:
                        "USUARIO",

                    atualizado_em:
                        agora,
                })
                .eq(
                    "id",
                    conexao.id
                )
                .eq(
                    "usuario_id",
                    user.id
                );


        if (atualizarConexaoError) {

            console.error(
                "[RUMO OPEN FINANCE] Item revogado, mas houve erro ao atualizar banco:",
                atualizarConexaoError
            );


            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "A autorização foi revogada, mas não foi possível atualizar o status no Rumo.",
                }
            );

        }


        // =================================================
        // DESATIVAR CONTAS EXTERNAS
        //
        // NÃO APAGAMOS:
        // - rumo.contas
        // - rumo.movimentacoes
        //
        // O HISTÓRICO FINANCEIRO PERMANECE.
        // =================================================

        const {
            error: contasError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "open_finance_contas"
                )
                .update({
                    ativo:
                        false,

                    atualizado_em:
                        agora,
                })
                .eq(
                    "conexao_id",
                    conexao.id
                )
                .eq(
                    "usuario_id",
                    user.id
                );


        if (contasError) {

            console.error(
                "[RUMO OPEN FINANCE] Conexão revogada, mas houve erro ao desativar contas externas:",
                contasError
            );

        }


        console.log(
            "[RUMO OPEN FINANCE] Instituição desconectada:",
            {
                usuario_id:
                    user.id,

                conexao_id:
                    conexao.id,

                instituicao:
                    conexao.instituicao_nome,
            }
        );


        return responder(
            res,
            200,
            {
                success: true,

                ja_desconectada:
                    false,

                message:
                    "Instituição desconectada com sucesso.",
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
            "[RUMO OPEN FINANCE] Erro ao desconectar instituição:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Erro interno ao desconectar a instituição.",
            }
        );

    }

}