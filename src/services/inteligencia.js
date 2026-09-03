import { supabase } from "./supabase";

export async function obterInteligenciaFinanceira() {
    const {
        data,
        error,
    } = await supabase
        .schema("rumo")
        .rpc("obter_inteligencia_financeira");

    if (error) {
        console.error(
            "Erro ao obter inteligência financeira:",
            error
        );

        throw error;
    }

    return data;
}
