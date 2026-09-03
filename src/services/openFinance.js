import {
    supabase,
} from "./supabase";


export async function criarConnectToken() {

    // =========================================================
    // SESSÃO ATUAL DO RUMO
    // =========================================================

    const {
        data: { session },
        error: sessionError,
    } =
        await supabase
            .auth
            .getSession();


    if (
        sessionError ||
        !session?.access_token
    ) {

        throw new Error(
            "Sua sessão expirou. Entre novamente no Rumo."
        );

    }


    // =========================================================
    // BACKEND DO RUMO
    // =========================================================

    const resposta =
        await fetch(
            "/api/open-finance/connect-token",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${session.access_token}`,
                },
            }
        );


    let resultado;


    try {

        resultado =
            await resposta.json();

    } catch {

        throw new Error(
            "O servidor retornou uma resposta inválida."
        );

    }


    if (
        !resposta.ok ||
        !resultado?.success
    ) {

        throw new Error(
            resultado?.error ??
            "Não foi possível iniciar o Open Finance."
        );

    }


    if (
        !resultado?.accessToken
    ) {

        throw new Error(
            "A Pluggy não retornou o Connect Token."
        );

    }


    return resultado.accessToken;

}

export async function salvarConexaoOpenFinance(
    itemId
) {

    if (!itemId) {

        throw new Error(
            "A Pluggy não retornou o identificador da conexão."
        );

    }


    // =========================================================
    // SESSÃO ATUAL DO RUMO
    // =========================================================

    const {
        data: { session },
        error: sessionError,
    } =
        await supabase
            .auth
            .getSession();


    if (
        sessionError ||
        !session?.access_token
    ) {

        throw new Error(
            "Sua sessão expirou. Entre novamente no Rumo."
        );

    }


    // =========================================================
    // BACKEND SEGURO
    // =========================================================

    const resposta =
        await fetch(
            "/api/open-finance/salvar-conexao",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${session.access_token}`,
                },

                body:
                    JSON.stringify({
                        itemId,
                    }),
            }
        );


    let resultado;


    try {

        resultado =
            await resposta.json();

    } catch {

        throw new Error(
            "O servidor retornou uma resposta inválida ao registrar a conexão."
        );

    }


    if (
        !resposta.ok ||
        !resultado?.success
    ) {

        throw new Error(
            resultado?.error ??
            "Não foi possível registrar a conexão Open Finance."
        );

    }


    if (
        !resultado?.conexao
    ) {

        throw new Error(
            "A conexão foi registrada, mas o servidor não retornou seus dados."
        );

    }


    return resultado.conexao;

}

export async function listarConexoesOpenFinance() {

    const {
        data: { session },
        error: sessionError,
    } =
        await supabase
            .auth
            .getSession();


    if (
        sessionError ||
        !session?.user
    ) {

        throw new Error(
            "Sua sessão expirou. Entre novamente no Rumo."
        );

    }


    const {
        data,
        error,
    } =
        await supabase
            .schema("rumo")
            .from(
                "open_finance_conexoes"
            )
            .select(`
                id,
                pluggy_item_id,
                pluggy_connector_id,
                instituicao_nome,
                status,
                ativo,
                ultima_sincronizacao_em,
                criado_em,
                atualizado_em
            `)
            .eq(
                "ativo",
                true
            )
            .order(
                "criado_em",
                {
                    ascending: false,
                }
            );


    if (error) {

        console.error(
            "[RUMO OPEN FINANCE] Erro ao listar conexões:",
            error
        );

        throw new Error(
            "Não foi possível carregar suas instituições conectadas."
        );

    }


    return data ?? [];

}

async function postOpenFinanceAutenticado(
    endpoint,
    conexaoId
) {

    if (!conexaoId) {

        throw new Error(
            "Conexão Open Finance não informada."
        );

    }


    const {
        data: { session },
        error: sessionError,
    } =
        await supabase
            .auth
            .getSession();


    if (
        sessionError ||
        !session?.access_token
    ) {

        throw new Error(
            "Sua sessão expirou. Entre novamente no Rumo."
        );

    }


    const resposta =
        await fetch(
            endpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${session.access_token}`,
                },

                body:
                    JSON.stringify({
                        conexaoId,
                    }),
            }
        );


    let resultado;


    try {

        resultado =
            await resposta.json();

    } catch {

        throw new Error(
            "O servidor retornou uma resposta inválida."
        );

    }


    if (
        !resposta.ok ||
        !resultado?.success
    ) {

        throw new Error(
            resultado?.error ??
            "Não foi possível concluir a sincronização Open Finance."
        );

    }


    return resultado;

}


export async function sincronizarConexaoOpenFinance(
    conexaoId
) {

    // =========================================================
    // 1. ATUALIZAR CONTAS EXTERNAS
    // =========================================================

    const contas =
        await postOpenFinanceAutenticado(
            "/api/open-finance/sincronizar-contas",
            conexaoId
        );


    // =========================================================
    // 2. ATUALIZAR MOVIMENTAÇÕES EXTERNAS
    // =========================================================

    const movimentacoes =
        await postOpenFinanceAutenticado(
            "/api/open-finance/sincronizar-movimentacoes",
            conexaoId
        );


    // =========================================================
    // 3. INTEGRAR BANK + POSTED AO RUMO
    // =========================================================

    const integracao =
        await postOpenFinanceAutenticado(
            "/api/open-finance/integrar-rumo",
            conexaoId
        );


    return {
        contas,
        movimentacoes,
        integracao,
    };

}

export async function desconectarConexaoOpenFinance(
    conexaoId
) {

    return await postOpenFinanceAutenticado(
        "/api/open-finance/desconectar",
        conexaoId
    );

}