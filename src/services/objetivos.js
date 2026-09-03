import { supabase } from "./supabase";


async function obterUsuario() {
  const {
    data: { user },
    error,
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


function validarPrioridade(prioridade) {
  const numero =
    Number(prioridade);

  if (
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 5
  ) {
    throw new Error(
      "A prioridade deve estar entre 1 e 5."
    );
  }

  return numero;
}


function validarValorMeta(valorMeta) {
  const numero =
    Number(valorMeta);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    throw new Error(
      "Informe um valor válido para o objetivo."
    );
  }

  return numero;
}


function validarValorAporte(valor) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    throw new Error(
      "Informe um valor de aporte maior que zero."
    );
  }

  return numero;
}


export async function listarObjetivos() {
  const user =
    await obterUsuario();

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .select(`
      id,
      usuario_id,
      nome,
      descricao,
      valor_meta,
      valor_atual,
      prazo_meta,
      prioridade,
      status,
      created_at,
      updated_at,
      concluido_em
    `)
    .eq(
      "usuario_id",
      user.id
    )
    .order(
      "prioridade",
      {
        ascending: true,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}


export async function buscarObjetivo(
  objetivoId
) {
  const user =
    await obterUsuario();

  if (!objetivoId) {
    throw new Error(
      "Objetivo não informado."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .select(`
      id,
      usuario_id,
      nome,
      descricao,
      valor_meta,
      valor_atual,
      prazo_meta,
      prioridade,
      status,
      created_at,
      updated_at,
      concluido_em
    `)
    .eq(
      "id",
      objetivoId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function criarObjetivo({
  nome,
  descricao = "",
  valorMeta,
  prazoMeta = null,
  prioridade = 3,
}) {
  const user =
    await obterUsuario();

  const nomeLimpo =
    String(
      nome ?? ""
    ).trim();

  const descricaoLimpa =
    String(
      descricao ?? ""
    ).trim();

  if (!nomeLimpo) {
    throw new Error(
      "Informe o nome do objetivo."
    );
  }

  const valorMetaNumero =
    validarValorMeta(
      valorMeta
    );

  const prioridadeNumero =
    validarPrioridade(
      prioridade
    );

  const agora =
    new Date()
      .toISOString();

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .insert({
      usuario_id:
        user.id,

      nome:
        nomeLimpo,

      descricao:
        descricaoLimpa ||
        null,

      valor_meta:
        valorMetaNumero,

      valor_atual:
        0,

      prazo_meta:
        prazoMeta || null,

      prioridade:
        prioridadeNumero,

      status:
        "ativo",

      concluido_em:
        null,

      updated_at:
        agora,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function atualizarObjetivo(
  objetivoId,
  {
    nome,
    descricao = "",
    valorMeta,
    prazoMeta = null,
    prioridade = 3,
  }
) {
  const user =
    await obterUsuario();

  if (!objetivoId) {
    throw new Error(
      "Objetivo não informado."
    );
  }

  const nomeLimpo =
    String(
      nome ?? ""
    ).trim();

  if (!nomeLimpo) {
    throw new Error(
      "Informe o nome do objetivo."
    );
  }

  const descricaoLimpa =
    String(
      descricao ?? ""
    ).trim();

  const valorMetaNumero =
    validarValorMeta(
      valorMeta
    );

  const prioridadeNumero =
    validarPrioridade(
      prioridade
    );

  const {
    data: objetivoAtual,
    error: erroBusca,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .select(`
      id,
      valor_atual,
      status,
      concluido_em
    `)
    .eq(
      "id",
      objetivoId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .single();

  if (erroBusca) {
    throw erroBusca;
  }

  const valorAtual =
    Number(
      objetivoAtual
        ?.valor_atual || 0
    );

  const atingiuObjetivo =
    valorAtual >=
    valorMetaNumero;

  let novoStatus =
    objetivoAtual.status;

  let concluidoEm =
    objetivoAtual
      .concluido_em;

  if (
    objetivoAtual.status !==
    "cancelado"
  ) {
    if (atingiuObjetivo) {
      novoStatus =
        "concluido";

      concluidoEm =
        concluidoEm ||
        new Date()
          .toISOString();

    } else if (
      objetivoAtual.status ===
      "concluido"
    ) {
      novoStatus =
        "ativo";

      concluidoEm =
        null;
    }
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .update({
      nome:
        nomeLimpo,

      descricao:
        descricaoLimpa ||
        null,

      valor_meta:
        valorMetaNumero,

      prazo_meta:
        prazoMeta || null,

      prioridade:
        prioridadeNumero,

      status:
        novoStatus,

      concluido_em:
        concluidoEm,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      objetivoId
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


export async function listarAportesObjetivo(
  objetivoId
) {
  await obterUsuario();

  if (!objetivoId) {
    throw new Error(
      "Objetivo não informado."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from(
      "aportes_objetivos"
    )
    .select(`
      id,
      objetivo_id,
      valor,
      data_aporte,
      observacao,
      created_at
    `)
    .eq(
      "objetivo_id",
      objetivoId
    )
    .order(
      "data_aporte",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}


export async function adicionarAporteObjetivo(
  objetivoId,
  {
    valor,
    dataAporte = null,
    observacao = "",
  }
) {
  const user =
    await obterUsuario();

  if (!objetivoId) {
    throw new Error(
      "Objetivo não informado."
    );
  }

  const valorNumero =
    validarValorAporte(
      valor
    );

  const observacaoLimpa =
    String(
      observacao ?? ""
    ).trim();

  /*
   * Confirmamos o objetivo antes do INSERT.
   * Além desta validação, o RLS do banco
   * também impede aportes em objetivos
   * pertencentes a outro usuário.
   */
  const {
    data: objetivo,
    error: erroObjetivo,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .select(`
      id,
      status
    `)
    .eq(
      "id",
      objetivoId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .single();

  if (erroObjetivo) {
    throw erroObjetivo;
  }

  if (
    objetivo.status ===
    "cancelado"
  ) {
    throw new Error(
      "Não é possível adicionar aportes a um objetivo cancelado."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from(
      "aportes_objetivos"
    )
    .insert({
      objetivo_id:
        objetivoId,

      valor:
        valorNumero,

      data_aporte:
        dataAporte ||
        new Date()
          .toISOString()
          .slice(0, 10),

      observacao:
        observacaoLimpa ||
        null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  /*
   * O trigger do banco recalcula:
   * valor_atual
   * status
   * concluido_em
   */
  return data;
}


export async function excluirAporteObjetivo(
  aporteId
) {
  await obterUsuario();

  if (!aporteId) {
    throw new Error(
      "Aporte não informado."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from(
      "aportes_objetivos"
    )
    .delete()
    .eq(
      "id",
      aporteId
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Aporte não encontrado."
    );
  }

  /*
   * O DELETE também dispara o trigger,
   * recalculando o valor do objetivo.
   */
  return true;
}


export async function alterarStatusObjetivo(
  objetivoId,
  status
) {
  const user =
    await obterUsuario();

  if (!objetivoId) {
    throw new Error(
      "Objetivo não informado."
    );
  }

  const permitidos = [
    "ativo",
    "pausado",
    "cancelado",
  ];

  if (
    !permitidos.includes(
      status
    )
  ) {
    throw new Error(
      "Status inválido para o objetivo."
    );
  }

  const {
    data: objetivo,
    error: erroBusca,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .select(`
      id,
      valor_meta,
      valor_atual,
      status
    `)
    .eq(
      "id",
      objetivoId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .single();

  if (erroBusca) {
    throw erroBusca;
  }

  if (
    status === "ativo" &&
    Number(
      objetivo.valor_atual || 0
    ) >=
    Number(
      objetivo.valor_meta || 0
    )
  ) {
    throw new Error(
      "Esse objetivo já foi concluído."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .update({
      status,

      concluido_em:
        status ===
        "cancelado"
          ? null
          : undefined,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      objetivoId
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


export async function excluirObjetivo(
  objetivoId
) {
  const user =
    await obterUsuario();

  if (!objetivoId) {
    throw new Error(
      "Objetivo não informado."
    );
  }

  /*
   * Neste momento não fazemos DELETE físico
   * se houver histórico de aportes.
   * Isso evita perder dados financeiros.
   */

  const {
    count,
    error: erroContagem,
  } = await supabase
    .schema("rumo")
    .from(
      "aportes_objetivos"
    )
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "objetivo_id",
      objetivoId
    );

  if (erroContagem) {
    throw erroContagem;
  }

  if (
    Number(count || 0) > 0
  ) {
    throw new Error(
      "Este objetivo possui histórico de aportes. Cancele o objetivo em vez de excluí-lo."
    );
  }

  const {
    error,
  } = await supabase
    .schema("rumo")
    .from("objetivos")
    .delete()
    .eq(
      "id",
      objetivoId
    )
    .eq(
      "usuario_id",
      user.id
    );

  if (error) {
    throw error;
  }

  return true;
}