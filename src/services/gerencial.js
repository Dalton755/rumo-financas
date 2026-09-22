import { supabase } from "./supabase";

export async function obterPainelGerencial() {
  const {
    data,
    error
  } = await supabase
    .schema("rumo")
    .rpc("obter_painel_gerencial");

  if (error) {
    throw error;
  }

  return data;
}
