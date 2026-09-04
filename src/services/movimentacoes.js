import { supabase } from "./supabase";

export async function listarMovimentacoes(usuarioId) {

    const { data, error } = await supabase
        .schema("rumo")
        .from("movimentacoes")

        .select(`
            id,
            descricao,
            valor,
            tipo,
            data_movimentacao,
            observacao,
            conta_id,
            categoria_id,
            categoria:categorias!movimentacoes_categoria_id_fkey(
                nome,
                icone,
                cor
            ),
            conta:contas!movimentacoes_conta_id_fkey(
                nome,
                banco
            )
        `)

        .eq("usuario_id", usuarioId)

        .order("data_movimentacao", {
            ascending: false
        });

    if (error) throw error;

    return data;

}

export async function salvarMovimentacao(dados) {

    const { error } = await supabase
        .schema("rumo")
        .from("movimentacoes")

        .insert(dados);

    if (error) throw error;

}

export async function editarMovimentacao(id, dados) {

    const { error } = await supabase
        .schema("rumo")
        .from("movimentacoes")

        .update(dados)

        .eq("id", id);

    if (error) throw error;

}

export async function excluirMovimentacao(id) {

    const { error } = await supabase
        .schema("rumo")
        .from("movimentacoes")

        .delete()

        .eq("id", id);

    if (error) throw error;

}