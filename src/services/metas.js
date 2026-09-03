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


export async function listarMetas() {
  const user =
    await obterUsuario();

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("metas")
    .select(`
      id,
      usuario_id,
      descricao,
      valor_meta,
      valor_atual,
      prazo,
      status,
      concluida_em,
      conta_id,
      created_at,
      updated_at
    `)
    .eq(
      "usuario_id",
      user.id
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


export async function listarContasParaMetas() {
  const user =
    await obterUsuario();

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("contas")
    .select(`
      id,
      nome,
      banco,
      tipo,
      saldo_inicial
    `)
    .eq(
      "usuario_id",
      user.id
    )
    .order(
      "nome",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}


export async function criarMeta({
  descricao,
  valorMeta,
  valorAtual = 0,
  prazo = null,
  contaId = null,
}) {
  const user =
    await obterUsuario();

  const descricaoLimpa =
    String(
      descricao ?? ""
    ).trim();

  const valorMetaNumero =
    Number(valorMeta);

  const valorAtualNumero =
    Number(valorAtual || 0);


  if (!descricaoLimpa) {
    throw new Error(
      "Informe a descrição da meta."
    );
  }


  if (
    !Number.isFinite(
      valorMetaNumero
    ) ||
    valorMetaNumero <= 0
  ) {
    throw new Error(
      "Informe um valor válido para a meta."
    );
  }


  if (
    !Number.isFinite(
      valorAtualNumero
    ) ||
    valorAtualNumero < 0
  ) {
    throw new Error(
      "O valor atual da meta não pode ser negativo."
    );
  }


  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("metas")
    .insert({
      usuario_id:
        user.id,

      descricao:
        descricaoLimpa,

      valor_meta:
        valorMetaNumero,

      valor_atual:
        valorAtualNumero,

      prazo:
        prazo || null,

      conta_id:
        contaId || null,

      status:
        valorAtualNumero >=
        valorMetaNumero
          ? "CONCLUIDA"
          : "ATIVA",

      concluida_em:
        valorAtualNumero >=
        valorMetaNumero
          ? new Date()
              .toISOString()
          : null,

      updated_at:
        new Date()
          .toISOString(),
    })
    .select()
    .single();


  if (error) {
    throw error;
  }


  return data;
}


export async function atualizarMeta(
  metaId,
  {
    descricao,
    valorMeta,
    valorAtual,
    prazo = null,
    contaId = null,
  }
) {
  const user =
    await obterUsuario();

  const descricaoLimpa =
    String(
      descricao ?? ""
    ).trim();

  const valorMetaNumero =
    Number(valorMeta);

  const valorAtualNumero =
    Number(valorAtual || 0);


  if (!metaId) {
    throw new Error(
      "Meta não informada."
    );
  }


  if (!descricaoLimpa) {
    throw new Error(
      "Informe a descrição da meta."
    );
  }


  if (
    !Number.isFinite(
      valorMetaNumero
    ) ||
    valorMetaNumero <= 0
  ) {
    throw new Error(
      "Informe um valor válido para a meta."
    );
  }


  if (
    !Number.isFinite(
      valorAtualNumero
    ) ||
    valorAtualNumero < 0
  ) {
    throw new Error(
      "O valor atual da meta não pode ser negativo."
    );
  }


  const concluida =
    valorAtualNumero >=
    valorMetaNumero;


  const atualizacao = {
    descricao:
      descricaoLimpa,

    valor_meta:
      valorMetaNumero,

    valor_atual:
      valorAtualNumero,

    prazo:
      prazo || null,

    conta_id:
      contaId || null,

    updated_at:
      new Date()
        .toISOString(),
  };


    if (concluida) {
    atualizacao.status =
      "CONCLUIDA";

    atualizacao.concluida_em =
      new Date()
        .toISOString();
  } else {
    atualizacao.status =
      "ATIVA";

    atualizacao.concluida_em =
      null;
  }


  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("metas")
    .update(
      atualizacao
    )
    .eq(
      "id",
      metaId
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


export async function adicionarValorMeta(
  metaId,
  valorAdicionar
) {
  const user =
    await obterUsuario();

  const valorNumero =
    Number(
      valorAdicionar
    );


  if (!metaId) {
    throw new Error(
      "Meta não informada."
    );
  }


  if (
    !Number.isFinite(
      valorNumero
    ) ||
    valorNumero <= 0
  ) {
    throw new Error(
      "Informe um valor maior que zero."
    );
  }


  const {
    data: meta,
    error: metaError,
  } = await supabase
    .schema("rumo")
    .from("metas")
    .select(`
      id,
      valor_meta,
      valor_atual,
      status
    `)
    .eq(
      "id",
      metaId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .single();


  if (metaError) {
    throw metaError;
  }


  const novoValor =
    Number(
      meta.valor_atual || 0
    ) +
    valorNumero;


  const concluida =
    novoValor >=
    Number(
      meta.valor_meta || 0
    );


  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("metas")
    .update({
      valor_atual:
        novoValor,

      status:
        concluida
          ? "CONCLUIDA"
          : (
              meta.status ===
              "CONCLUIDA"
                ? "ATIVA"
                : meta.status
            ),

      concluida_em:
        concluida
          ? new Date()
              .toISOString()
          : null,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      metaId
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


export async function alterarStatusMeta(
  metaId,
  status
) {
  const user =
    await obterUsuario();

  const statusPermitidos = [
    "ATIVA",
    "PAUSADA",
    "CONCLUIDA",
  ];


  if (
    !statusPermitidos.includes(
      status
    )
  ) {
    throw new Error(
      "Status inválido para a meta."
    );
  }


  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("metas")
    .update({
      status,

      concluida_em:
        status ===
        "CONCLUIDA"
          ? new Date()
              .toISOString()
          : null,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      metaId
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


export async function excluirMeta(
  metaId
) {
  const user =
    await obterUsuario();


  if (!metaId) {
    throw new Error(
      "Meta não informada."
    );
  }


  const {
    error,
  } = await supabase
    .schema("rumo")
    .from("metas")
    .delete()
    .eq(
      "id",
      metaId
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