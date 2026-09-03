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


function mascararNumeroConta(
    valor
) {

    const texto =
        String(
            valor ?? ""
        )
            .replace(/\s+/g, "")
            .trim();


    if (!texto) {
        return null;
    }


    const final =
        texto.slice(-4);


    return `•••• ${final}`;

}

function normalizarIdentificador(
    valor
) {

    return String(
        valor ?? ""
    )
        .trim()
        .toUpperCase()
        .replace(
            /[^A-Z0-9]/g,
            ""
        );

}


function criarFingerprintConta({
    usuarioId,
    connectorId,
    conta,
    secret,
}) {

    const identificador =
        normalizarIdentificador(
            conta?.bankData
                ?.transferNumber
        ) ||
        normalizarIdentificador(
            conta?.number
        );


    if (!identificador) {

        throw new Error(
            "A instituição não retornou um identificador estável para a conta."
        );

    }


    if (!connectorId) {

        throw new Error(
            "A conexão não possui identificador da instituição."
        );

    }


    const base =
        [
            String(
                usuarioId
            ),

            String(
                connectorId
            ),

            String(
                conta?.type ??
                ""
            )
                .trim()
                .toUpperCase(),

            String(
                conta?.subtype ??
                ""
            )
                .trim()
                .toUpperCase(),

            identificador,
        ]
            .join("|");


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
    // PLUGGY
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

        // =================================================
        // USUÁRIO
        // =================================================

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


        // =================================================
        // CONEXÃO DO RUMO
        //
        // O FRONTEND ENVIA O ID INTERNO DA CONEXÃO.
        // O itemId DA PLUGGY VEM DO NOSSO BANCO.
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
                    pluggy_connector_id,
                    status,
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


        const itemId =
            String(
                conexao.pluggy_item_id
            );


        // =================================================
        // VALIDAR ITEM DIRETAMENTE NA PLUGGY
        // =================================================

        const pluggy =
            new PluggyClient({
                clientId,
                clientSecret,
            });


        const item =
            await pluggy
                .fetchItem(
                    itemId
                );


        if (
            !item?.id ||
            String(
                item?.clientUserId ??
                ""
            ) !== user.id
        ) {

            console.warn(
                "[RUMO OPEN FINANCE] Item não pertence ao usuário.",
                {
                    usuario_id:
                        user.id,

                    conexao_id:
                        conexao.id,
                }
            );


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


        // =================================================
        // BUSCAR CONTAS NA PLUGGY
        // =================================================

        const respostaContas =
            await pluggy
                .fetchAccounts(
                    itemId
                );


        const contasPluggy =
            Array.isArray(
                respostaContas?.results
            )
                ? respostaContas.results
                : [];


        const agora =
            new Date()
                .toISOString();


        // =================================================
        // PREPARAR DADOS
        //
        // NÃO ARMAZENAMOS CPF, TITULAR OU NÚMERO COMPLETO.
        // =================================================

        const registros =
            contasPluggy
                .filter(
                    (conta) =>
                        Boolean(
                            conta?.id
                        )
                )
                .map(
                    (conta) => ({
                        usuario_id:
                            user.id,

                        fingerprint_conta:
                            criarFingerprintConta({
                                usuarioId:
                                    user.id,

                                connectorId:
                                    conexao
                                        .pluggy_connector_id,

                                conta,

                                secret:
                                    fingerprintSecret,
                            }),

                        conexao_id:
                            conexao.id,

                        pluggy_account_id:
                            String(
                                conta.id
                            ),

                        pluggy_item_id:
                            String(
                                conta.itemId ??
                                itemId
                            ),

                        tipo_pluggy:
                            conta.type ??
                            null,

                        subtipo_pluggy:
                            conta.subtype ??
                            null,

                        nome:
                            conta.name ??
                            null,

                        nome_marketing:
                            conta.marketingName ??
                            null,

                        saldo:
                            Number.isFinite(
                                Number(
                                    conta.balance
                                )
                            )
                                ? Number(
                                    conta.balance
                                )
                                : null,

                        moeda:
                            conta.currencyCode ??
                            null,

                        numero_mascarado:
                            mascararNumeroConta(
                                conta.number
                            ),

                        // Guardaremos detalhes adicionais somente
                        // quando realmente forem necessários.
                        banco_dados:
                            null,

                        credito_dados:
                            null,

                        ativo:
                            true,

                        sincronizado_em:
                            agora,

                        atualizado_em:
                            agora,
                    })
                );


        // =================================================
        // UPSERT DAS CONTAS
        // =================================================

        if (
            registros.length > 0
        ) {

            const {
                error: upsertError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from(
                        "open_finance_contas"
                    )
                    .upsert(
                        registros,
                        {
                            onConflict:
                                "pluggy_account_id",
                        }
                    );


            if (upsertError) {

                console.error(
                    "[RUMO OPEN FINANCE] Erro ao salvar contas:",
                    upsertError
                );


                return responder(
                    res,
                    500,
                    {
                        success: false,
                        error:
                            "Não foi possível salvar as contas sincronizadas.",
                    }
                );

            }

        }


        // =================================================
        // DESATIVAR CONTAS QUE NÃO VIERAM MAIS DA PLUGGY
        // =================================================

        const {
            data: contasLocais,
            error: contasLocaisError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "open_finance_contas"
                )
                .select(`
                    id,
                    pluggy_account_id
                `)
                .eq(
                    "conexao_id",
                    conexao.id
                )
                .eq(
                    "usuario_id",
                    user.id
                );


        if (contasLocaisError) {

            console.error(
                "[RUMO OPEN FINANCE] Erro ao revisar contas locais:",
                contasLocaisError
            );

        } else {

            const idsAtuais =
                new Set(
                    registros.map(
                        (registro) =>
                            registro.pluggy_account_id
                    )
                );


            const idsParaDesativar =
                (contasLocais ?? [])
                    .filter(
                        (registro) =>
                            !idsAtuais.has(
                                registro.pluggy_account_id
                            )
                    )
                    .map(
                        (registro) =>
                            registro.id
                    );


            if (
                idsParaDesativar.length > 0
            ) {

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
                    .in(
                        "id",
                        idsParaDesativar
                    );

            }

        }


        // =================================================
        // ATUALIZAR CONEXÃO
        // =================================================

        await supabaseAdmin
            .schema("rumo")
            .from(
                "open_finance_conexoes"
            )
            .update({
                status:
                    item?.status ??
                    conexao.status,

                ultima_sincronizacao_em:
                    agora,

                atualizado_em:
                    agora,
            })
            .eq(
                "id",
                conexao.id
            );


        // =================================================
        // RETORNO SEM DADOS SENSÍVEIS
        // =================================================

        const {
            data: contasSalvas,
            error: contasSalvasError,
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
                    subtipo_pluggy,
                    nome,
                    nome_marketing,
                    saldo,
                    moeda,
                    numero_mascarado,
                    ativo,
                    sincronizado_em
                `)
                .eq(
                    "conexao_id",
                    conexao.id
                )
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
                        ascending: true,
                    }
                );


        if (contasSalvasError) {

            throw contasSalvasError;

        }


        console.log(
            "[RUMO OPEN FINANCE] Contas sincronizadas:",
            {
                usuario_id:
                    user.id,

                conexao_id:
                    conexao.id,

                quantidade:
                    contasSalvas?.length ??
                    0,
            }
        );


        return responder(
            res,
            200,
            {
                success: true,

                total:
                    contasSalvas?.length ??
                    0,

                contas:
                    contasSalvas ??
                    [],
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
            "[RUMO OPEN FINANCE] Erro ao sincronizar contas:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Não foi possível sincronizar as contas da instituição.",
            }
        );

    }

}