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


export async function atualizarAlertasInteligentes() {

  const {
    data,
    error
  } = await supabase
    .schema("rumo")
    .rpc(
      "atualizar_alertas_inteligentes"
    );


  if (error) {

    console.error(
      "[RUMO ALERTAS] Erro ao atualizar alertas:",
      error
    );

    throw error;

  }


  return data;

}


export async function listarAlertasAtivos() {

  const user =
    await obterUsuario();


  const {
    data,
    error
  } = await supabase
    .schema("rumo")
    .from("alertas")
    .select(`
      id,
      usuario_id,
      tipo,
      titulo,
      descricao,
      lido,
      created_at,
      chave,
      nivel,
      rota,
      ativo,
      updated_at,
      resolvido_em,
      dados
    `)
    .eq(
      "usuario_id",
      user.id
    )
    .eq(
      "ativo",
      true
    )
    .order(
      "lido",
      {
        ascending: true
      }
    )
    .order(
      "updated_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "[RUMO ALERTAS] Erro ao listar alertas:",
      error
    );

    throw error;

  }


  return data || [];

}


export async function carregarCentralAlertas() {

  /*
   * Primeiro o motor verifica a situação
   * financeira atual do usuário.
   */
  await atualizarAlertasInteligentes();


  /*
   * Depois buscamos somente os alertas
   * que continuam ativos.
   */
  return listarAlertasAtivos();

}


export async function marcarAlertaComoLido(
  alertaId
) {

  const user =
    await obterUsuario();


  if (!alertaId) {
    throw new Error(
      "Alerta não informado."
    );
  }


  const {
    data,
    error
  } = await supabase
    .schema("rumo")
    .from("alertas")
    .update({
      lido: true,
      updated_at:
        new Date().toISOString()
    })
    .eq(
      "id",
      alertaId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .select()
    .single();


  if (error) {
    throw error;
  }


  return data;

}


export async function marcarTodosComoLidos() {

  const user =
    await obterUsuario();


  const {
    data,
    error
  } = await supabase
    .schema("rumo")
    .from("alertas")
    .update({
      lido: true,
      updated_at:
        new Date().toISOString()
    })
    .eq(
      "usuario_id",
      user.id
    )
    .eq(
      "ativo",
      true
    )
    .eq(
      "lido",
      false
    )
    .select();


  if (error) {
    throw error;
  }


  return data || [];

}