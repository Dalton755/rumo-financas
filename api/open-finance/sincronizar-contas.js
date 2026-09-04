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
        // RECONCILIAR CONTAS
        //
        // IMPORTANTE:
        // pluggy_account_id pertence ao Item da Pluggy e
        // pode mudar quando o usuário desconecta e conecta
        // novamente a mesma instituição.
        //
        // Por isso tentamos reconhecer a conta existente
        // antes de criar um novo registro.
        // =================================================

        let contasReconhecidas =
            0;

        let contasNovas =
            0;


        // -------------------------------------------------
        // BUSCAR TODAS AS CONEXÕES DO MESMO CONNECTOR
        //
        // Incluímos conexões antigas/inativas porque é
        // justamente nelas que estará a conta anterior.
        // -------------------------------------------------

        const {
            data: conexoesDaInstituicao,
            error: conexoesDaInstituicaoError,
        } =
            await supabaseAdmin
                .schema("rumo")
                .from(
                    "open_finance_conexoes"
                )
                .select(`
                    id,
                    pluggy_connector_id,
                    ativo
                `)
                .eq(
                    "usuario_id",
                    user.id
                )
                .eq(
                    "pluggy_connector_id",
                    conexao.pluggy_connector_id
                );


        if (conexoesDaInstituicaoError) {

            throw conexoesDaInstituicaoError;

        }


        const idsConexoesDaInstituicao =
            (
                conexoesDaInstituicao ??
                []
            )
                .map(
                    (registro) =>
                        registro.id
                );


        let contasConhecidas =
            [];


        if (
            idsConexoesDaInstituicao.length >
            0
        ) {

            const {
                data: contasHistoricas,
                error: contasHistoricasError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from(
                        "open_finance_contas"
                    )
                    .select(`
                        id,
                        usuario_id,
                        conexao_id,
                        fingerprint_conta,
                        pluggy_account_id,
                        tipo_pluggy,
                        subtipo_pluggy,
                        nome,
                        numero_mascarado,
                        conta_rumo_id,
                        ativo,
                        sincronizado_em
                    `)
                    .eq(
                        "usuario_id",
                        user.id
                    )
                    .in(
                        "conexao_id",
                        idsConexoesDaInstituicao
                    );


            if (contasHistoricasError) {

                throw contasHistoricasError;

            }


            contasConhecidas =
                contasHistoricas ??
                [];

        }


        // -------------------------------------------------
        // PROCESSAR CADA CONTA RECEBIDA
        // -------------------------------------------------

        for (
            const registro of
            registros
        ) {

            let contaExistente =
                null;


            // =============================================
            // 1. MESMO pluggy_account_id
            //
            // Fluxo normal de sincronizações seguintes.
            // =============================================

            contaExistente =
                contasConhecidas
                    .find(
                        (contaLocal) =>
                            contaLocal
                                .pluggy_account_id ===
                            registro
                                .pluggy_account_id
                    ) ??
                null;


            // =============================================
            // 2. MESMO fingerprint
            //
            // Reconexões em que o ID da Pluggy mudou mas
            // o identificador bancário permaneceu estável.
            // =============================================

            if (!contaExistente) {

                const candidatosFingerprint =
                    contasConhecidas
                        .filter(
                            (contaLocal) =>
                                contaLocal
                                    .fingerprint_conta ===
                                registro
                                    .fingerprint_conta
                        );


                if (
                    candidatosFingerprint.length ===
                    1
                ) {

                    contaExistente =
                        candidatosFingerprint[0];

                } else if (
                    candidatosFingerprint.length >
                    1
                ) {

                    const vinculados =
                        candidatosFingerprint
                            .filter(
                                (contaLocal) =>
                                    Boolean(
                                        contaLocal
                                            .conta_rumo_id
                                    )
                            );


                    if (
                        vinculados.length ===
                        1
                    ) {

                        contaExistente =
                            vinculados[0];

                    }

                }

            }


            // =============================================
            // 3. RECONEXÃO COM IDENTIFICADOR ALTERADO
            //
            // Mesmo banco/connector
            // + mesmo tipo geral BANK/CREDIT
            // + mesmos últimos dígitos.
            //
            // Não exigimos subtipo porque a própria Pluggy
            // pode mudar SAVINGS_ACCOUNT para
            // CHECKING_ACCOUNT, como vimos no Sib 22-4.
            // =============================================

            if (
                !contaExistente &&
                registro.numero_mascarado
            ) {

                const candidatosConta =
                    contasConhecidas
                        .filter(
                            (contaLocal) =>
                                contaLocal
                                    .tipo_pluggy ===
                                registro
                                    .tipo_pluggy &&

                                contaLocal
                                    .numero_mascarado ===
                                registro
                                    .numero_mascarado
                        );


                if (
                    candidatosConta.length ===
                    1
                ) {

                    contaExistente =
                        candidatosConta[0];

                } else if (
                    candidatosConta.length >
                    1
                ) {

                    /*
                     * Se houver várias candidatas, somente
                     * adotamos automaticamente quando apenas
                     * uma delas já estiver vinculada a uma
                     * conta real do Rumo.
                     *
                     * Caso contrário preferimos NÃO unir
                     * contas potencialmente diferentes.
                     */
                    const vinculados =
                        candidatosConta
                            .filter(
                                (contaLocal) =>
                                    Boolean(
                                        contaLocal
                                            .conta_rumo_id
                                    )
                            );


                    if (
                        vinculados.length ===
                        1
                    ) {

                        /*
                         * Prioridade máxima:
                         * conta que já está integrada ao Rumo.
                         */
                        contaExistente =
                            vinculados[0];

                    } else {

                        /*
                         * Cartões de crédito normalmente não possuem
                         * conta_rumo_id.
                         *
                         * Duplicatas antigas, criadas antes da implantação
                         * dos fingerprints, possuem fingerprint_conta NULL.
                         *
                         * Se existir exatamente uma candidata que já tenha
                         * fingerprint, ela passa a ser considerada a conta
                         * canônica daquele cartão.
                         */
                        const candidatosComFingerprint =
                            candidatosConta
                                .filter(
                                    (contaLocal) =>
                                        Boolean(
                                            contaLocal
                                                .fingerprint_conta
                                        )
                                );


                        if (
                            candidatosComFingerprint.length ===
                            1
                        ) {

                            contaExistente =
                                candidatosComFingerprint[0];

                        } else {

                            /*
                             * Continuamos sem escolher arbitrariamente se
                             * houver mais de uma candidata válida.
                             *
                             * Isso protege contra duas contas reais que,
                             * por coincidência, terminem com os mesmos
                             * dígitos.
                             */
                            console.warn(
                                "[RUMO OPEN FINANCE] Reconexão ambígua de conta.",
                                {
                                    usuario_id:
                                        user.id,

                                    conexao_id:
                                        conexao.id,

                                    tipo:
                                        registro.tipo_pluggy,

                                    numero:
                                        registro.numero_mascarado,

                                    candidatos:
                                        candidatosConta.length,

                                    candidatos_com_fingerprint:
                                        candidatosComFingerprint.length,
                                }
                            );

                        }

                    }

                }

            }


            // =============================================
            // CONTA JÁ EXISTE
            //
            // Atualizamos o mesmo registro interno.
            //
            // conta_rumo_id NÃO está no objeto registro,
            // então o vínculo anterior é preservado.
            // =============================================

            if (contaExistente) {

                const {
                    error: atualizarContaError,
                } =
                    await supabaseAdmin
                        .schema("rumo")
                        .from(
                            "open_finance_contas"
                        )
                        .update(
                            registro
                        )
                        .eq(
                            "id",
                            contaExistente.id
                        )
                        .eq(
                            "usuario_id",
                            user.id
                        );


                if (atualizarContaError) {

                    console.error(
                        "[RUMO OPEN FINANCE] Erro ao atualizar conta reconhecida:",
                        atualizarContaError
                    );

                    throw atualizarContaError;

                }


                contasReconhecidas +=
                    1;


                // Atualizamos também a cópia em memória.
                contasConhecidas =
                    contasConhecidas
                        .map(
                            (contaLocal) =>
                                contaLocal.id ===
                                    contaExistente.id
                                    ? {
                                        ...contaLocal,
                                        ...registro,
                                    }
                                    : contaLocal
                        );


                continue;

            }


            // =============================================
            // CONTA REALMENTE NOVA
            // =============================================

            const {
                data: contaCriada,
                error: inserirContaError,
            } =
                await supabaseAdmin
                    .schema("rumo")
                    .from(
                        "open_finance_contas"
                    )
                    .insert(
                        registro
                    )
                    .select(`
                        id,
                        usuario_id,
                        conexao_id,
                        fingerprint_conta,
                        pluggy_account_id,
                        tipo_pluggy,
                        subtipo_pluggy,
                        nome,
                        numero_mascarado,
                        conta_rumo_id,
                        ativo,
                        sincronizado_em
                    `)
                    .single();


            if (
                inserirContaError ||
                !contaCriada
            ) {

                console.error(
                    "[RUMO OPEN FINANCE] Erro ao criar nova conta:",
                    inserirContaError
                );

                throw inserirContaError ??
                new Error(
                    "Não foi possível criar a conta Open Finance."
                );

            }


            contasConhecidas.push(
                contaCriada
            );


            contasNovas +=
                1;

        }


        console.log(
            "[RUMO OPEN FINANCE] Reconciliação das contas:",
            {
                usuario_id:
                    user.id,

                conexao_id:
                    conexao.id,

                reconhecidas:
                    contasReconhecidas,

                novas:
                    contasNovas,
            }
        );


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