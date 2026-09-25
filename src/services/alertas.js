import { supabase } from "./supabase";
import { listarFaturasPendentesCartoes } from "./cartoes";


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


export async function atualizarAlertasCompromissos() {

  const {
    data,
    error
  } = await supabase
    .schema("rumo")
    .rpc(
      "atualizar_alertas_compromissos"
    );


  if (error) {

    console.error(
      "[RUMO ALERTAS] Erro ao atualizar compromissos:",
      error
    );

    throw error;

  }


  return data;

}


export async function atualizarAlertasDividas() {

  const {
    data,
    error
  } = await supabase
    .schema("rumo")
    .rpc(
      "atualizar_alertas_dividas"
    );


  if (error) {

    console.error(
      "[RUMO ALERTAS] Erro ao atualizar dívidas:",
      error
    );

    throw error;

  }


  return data;

}


export async function atualizarAlertasCartoes() {

  const user =
    await obterUsuario();


  const faturas =
    await listarFaturasPendentesCartoes({
      dias: 7,
      incluirVencidas: true
    });


  const hoje =
    new Date();

  hoje.setHours(
    12,
    0,
    0,
    0
  );


  const chavesAtivas =
    [];


  for (
    const fatura of
    faturas
  ) {

    const vencimento =
      new Date(
        String(
          fatura.vencimento
        ) +
        "T12:00:00"
      );


    const dias =
      Math.round(
        (
          vencimento -
          hoje
        ) /
        86400000
      );


    const chave =
      "CARTAO_FATURA:" +
      fatura.cartao_id +
      ":" +
      fatura.vencimento;


    chavesAtivas.push(
      chave
    );


    const titulo =
      dias < 0
        ? "Fatura de cartão atrasada"
        : dias === 0
          ? "Fatura de cartão vence hoje"
          : dias === 1
            ? "Fatura de cartão vence amanhã"
            : `Fatura de cartão vence em ${dias} dias`;


    const nivel =
      dias <= 0
        ? "critico"
        : dias === 1
          ? "atencao"
          : "informacao";


    const dados = {
      cartao_id:
        fatura.cartao_id,
      cartao:
        fatura.cartao?.nome ||
        "Cartão",
      banco:
        fatura.cartao?.banco ||
        null,
      vencimento:
        fatura.vencimento,
      dias_restantes:
        dias,
      valor:
        Number(
          fatura.valor ||
          0
        ),
      quantidade_parcelas:
        fatura.quantidade_parcelas ||
        0
    };


    const {
      data: existente,
      error: erroBusca
    } =
      await supabase
        .schema("rumo")
        .from("alertas")
        .select(
          "id,lido,ativo,dados"
        )
        .eq(
          "usuario_id",
          user.id
        )
        .eq(
          "chave",
          chave
        )
        .maybeSingle();


    if (erroBusca) {
      throw erroBusca;
    }


    const payload = {
      usuario_id:
        user.id,
      tipo:
        "CARTAO_FATURA",
      titulo,
      descricao:
        `${dados.cartao} • ${new Date(
          String(
            fatura.vencimento
          ) +
          "T12:00:00"
        ).toLocaleDateString(
          "pt-BR"
        )}`,
      chave,
      nivel,
      rota:
        "/cartoes",
      ativo:
        true,
      lido:
        existente &&
        existente.ativo &&
        Number(
          existente.dados
            ?.valor ||
          0
        ) ===
        Number(
          dados.valor ||
          0
        ) &&
        Number(
          existente.dados
            ?.dias_restantes ??
          0
        ) ===
        Number(
          dados.dias_restantes ??
          0
        )
          ? existente.lido
          : false,
      dados,
      updated_at:
        new Date()
          .toISOString(),
      resolvido_em:
        null
    };


    if (existente?.id) {

      const {
        error
      } =
        await supabase
          .schema("rumo")
          .from("alertas")
          .update(
            payload
          )
          .eq(
            "id",
            existente.id
          )
          .eq(
            "usuario_id",
            user.id
          );


      if (error) {
        throw error;
      }

    } else {

      const {
        error
      } =
        await supabase
          .schema("rumo")
          .from("alertas")
          .insert(
            payload
          );


      if (error) {
        throw error;
      }

    }

  }


  const {
    data: antigos,
    error: erroAntigos
  } =
    await supabase
      .schema("rumo")
      .from("alertas")
      .select(
        "id,chave"
      )
      .eq(
        "usuario_id",
        user.id
      )
      .eq(
        "tipo",
        "CARTAO_FATURA"
      )
      .eq(
        "ativo",
        true
      );


  if (erroAntigos) {
    throw erroAntigos;
  }


  const obsoletos =
    (antigos || [])
      .filter(
        (item) =>
          !chavesAtivas.includes(
            item.chave
          )
      )
      .map(
        (item) =>
          item.id
      );


  if (obsoletos.length) {

    const {
      error
    } =
      await supabase
        .schema("rumo")
        .from("alertas")
        .update({
          ativo: false,
          resolvido_em:
            new Date()
              .toISOString(),
          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "usuario_id",
          user.id
        )
        .in(
          "id",
          obsoletos
        );


    if (error) {
      throw error;
    }

  }


  return {
    processados:
      faturas.length
  };

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
   * Compromissos possuem seu próprio motor porque
   * não são movimentações financeiras realizadas.
   */
  await atualizarAlertasCompromissos();


  /*
   * Dívidas planejadas também são obrigações
   * financeiras e precisam entrar na mesma
   * central de decisão.
   */
  await atualizarAlertasDividas();


  /*
   * Faturas de cartão pendentes são obrigações
   * futuras e precisam participar da mesma
   * central de decisão.
   */
  await atualizarAlertasCartoes();


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