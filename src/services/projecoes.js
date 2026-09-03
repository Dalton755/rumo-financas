import { supabase } from "./supabase";


export async function obterProjecoesFinanceiras() {

    const {
        data,
        error
    } = await supabase
        .schema("rumo")
        .rpc(
            "obter_projecoes_financeiras"
        );


    if (error) {

        console.error(
            "[RUMO PROJECOES] Erro ao obter projeções:",
            error
        );

        throw error;

    }


    return data;

}