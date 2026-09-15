import { supabase } from "./supabase";


async function obterUsuario() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if (error) {
        throw error;
    }


    if (!user) {
        throw new Error(
            "Usuário não autenticado."
        );
    }


    return user;

}


export async function listarContasImportacao() {

    const user =
        await obterUsuario();


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("contas")
        .select(`
            id,
            nome,
            banco,
            tipo
        `)
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "ativo",
            true
        )
        .order("nome");


    if (error) {
        throw error;
    }


    return data || [];

}


export async function listarCategoriasImportacao() {

    const user =
        await obterUsuario();


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("categorias")
        .select(`
            id,
            nome,
            tipo,
            icone,
            cor
        `)
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "ativo",
            true
        )
        .order("nome");


    if (error) {
        throw error;
    }


    return data || [];

}


export async function criarImportacao({
    contaId,
    formato,
    nomeArquivo,
    quantidadeRegistros
}) {

    const user =
        await obterUsuario();


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("importacoes")
        .insert({
            usuario_id:
                user.id,

            conta_id:
                contaId,

            tipo:
                "extrato",

            formato,

            nome_arquivo:
                nomeArquivo,

            status:
                "pendente",

            quantidade_registros:
                Number(
                    quantidadeRegistros || 0
                )
        })
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;

}


export async function verificarDuplicidade({
    contaId,
    identificadorExterno,
    dataMovimentacao,
    valor,
    descricaoOriginal
}) {

    const user =
        await obterUsuario();


    let consulta =
        supabase
            .schema("rumo")
            .from("importacoes_itens")
            .select("id,status")
            .eq(
                "usuario_id",
                user.id
            )
            .eq(
                "conta_id",
                contaId
            );


    if (identificadorExterno) {

        consulta =
            consulta.eq(
                "identificador_externo",
                identificadorExterno
            );

    } else {

        consulta =
            consulta
                .eq(
                    "data_movimentacao",
                    dataMovimentacao
                )
                .eq(
                    "valor",
                    Number(valor)
                )
                .eq(
                    "descricao_original",
                    descricaoOriginal
                );

    }


    const {
        data,
        error
    } =
        await consulta.limit(1);


    if (error) {
        throw error;
    }


    return Boolean(
        data?.length
    );

}


export async function registrarItensImportacao({
    importacaoId,
    contaId,
    itens
}) {

    const user =
        await obterUsuario();


    if (!itens?.length) {
        return [];
    }


    const registros =
        itens.map(
            (item) => ({

                importacao_id:
                    importacaoId,

                usuario_id:
                    user.id,

                conta_id:
                    contaId,

                categoria_id:
                    item.categoriaId ||
                    null,

                identificador_externo:
                    item.identificadorExterno ||
                    null,

                data_movimentacao:
                    item.data,

                descricao_original:
                    item.descricaoOriginal,

                descricao:
                    item.descricao,

                valor:
                    Number(item.valor),

                tipo:
                    item.tipo,

                status:
                    item.duplicado
                        ? "duplicado"
                        : item.selecionado
                            ? "pendente"
                            : "ignorado",

                dados_originais:
                    item.dadosOriginais ||
                    null
            })
        );


    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .from("importacoes_itens")
        .insert(
            registros
        )
        .select();


    if (error) {
        throw error;
    }


    return data || [];

}


export async function confirmarItensImportacao(
    importacaoId
) {

    const user =
        await obterUsuario();


    const {
        data: itens,
        error: erroItens
    } = await supabase
        .schema("rumo")
        .from("importacoes_itens")
        .select(`
            id,
            conta_id,
            categoria_id,
            descricao,
            valor,
            tipo,
            data_movimentacao,
            status
        `)
        .eq(
            "usuario_id",
            user.id
        )
        .eq(
            "importacao_id",
            importacaoId
        )
        .eq(
            "status",
            "pendente"
        );


    if (erroItens) {
        throw erroItens;
    }


    let importados = 0;


    for (const item of itens || []) {

        const {
            data: movimentacao,
            error
        } = await supabase
            .schema("rumo")
            .from("movimentacoes")
            .insert({
                usuario_id:
                    user.id,

                conta_id:
                    item.conta_id,

                categoria_id:
                    item.categoria_id,

                descricao:
                    item.descricao,

                valor:
                    Number(
                        item.valor
                    ),

                tipo:
                    item.tipo,

                data_movimentacao:
                    item.data_movimentacao,

                observacao:
                    "Importado de extrato bancário",

                origem:
                    "importacao_extrato",

                origem_referencia:
                    item.id
            })
            .select("id")
            .single();


        if (error) {
            throw error;
        }


        const {
            error: erroAtualizar
        } = await supabase
            .schema("rumo")
            .from("importacoes_itens")
            .update({
                status:
                    "importado",

                movimentacao_id:
                    movimentacao.id,

                updated_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "id",
                item.id
            )
            .eq(
                "usuario_id",
                user.id
            );


        if (erroAtualizar) {
            throw erroAtualizar;
        }


        importados++;

    }


    const {
        error: erroImportacao
    } = await supabase
        .schema("rumo")
        .from("importacoes")
        .update({
            status:
                "concluida",

            quantidade_importados:
                importados,

            updated_at:
                new Date()
                    .toISOString()
        })
        .eq(
            "id",
            importacaoId
        )
        .eq(
            "usuario_id",
            user.id
        );


    if (erroImportacao) {
        throw erroImportacao;
    }


    return importados;

}