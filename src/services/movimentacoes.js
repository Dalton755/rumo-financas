import { supabase } from "./supabase";

export async function listarMovimentacoes(usuarioId) {

    const { data, error } = await supabase

        .from("movimentacoes")

        .select(`
            *,
            contas(nome),
            categorias(nome)
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

        .from("movimentacoes")

        .insert(dados);

    if (error) throw error;

}

export async function editarMovimentacao(id, dados) {

    const { error } = await supabase

        .from("movimentacoes")

        .update(dados)

        .eq("id", id);

    if (error) throw error;

}

export async function excluirMovimentacao(id) {

    const { error } = await supabase

        .from("movimentacoes")

        .delete()

        .eq("id", id);

    if (error) throw error;

}