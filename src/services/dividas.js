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


function validarValorPositivo(
  valor,
  mensagem
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    throw new Error(
      mensagem
    );
  }

  return numero;
}


function validarValorNaoNegativo(
  valor,
  mensagem
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < 0
  ) {
    throw new Error(
      mensagem
    );
  }

  return numero;
}


function validarPrioridade(
  prioridade
) {
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


function validarDiaVencimento(
  dia
) {
  if (
    dia === null ||
    dia === undefined ||
    dia === ""
  ) {
    return null;
  }

  const numero =
    Number(dia);

  if (
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 31
  ) {
    throw new Error(
      "O dia de vencimento deve estar entre 1 e 31."
    );
  }

  return numero;
}


export async function listarDividas() {
  const user =
    await obterUsuario();

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .select(`
      id,
      usuario_id,
      nome,
      credor,
      valor_original,
      saldo_atual,
      juros_mensal,
      parcela_minima,
      vencimento_dia,
      prioridade,
      status,
      created_at,
      updated_at,
      quitada_em
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


export async function buscarDivida(
  dividaId
) {
  const user =
    await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .select(`
      id,
      usuario_id,
      nome,
      credor,
      valor_original,
      saldo_atual,
      juros_mensal,
      parcela_minima,
      vencimento_dia,
      prioridade,
      status,
      created_at,
      updated_at,
      quitada_em
    `)
    .eq(
      "id",
      dividaId
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


export async function criarDivida({
  nome,
  credor = "",
  valorOriginal,
  saldoAtual = null,
  jurosMensal = 0,
  parcelaMinima = null,
  vencimentoDia = null,
  prioridade = 3,
}) {
  const user =
    await obterUsuario();

  const nomeLimpo =
    String(
      nome ?? ""
    ).trim();

  if (!nomeLimpo) {
    throw new Error(
      "Informe o nome da dívida."
    );
  }

  const credorLimpo =
    String(
      credor ?? ""
    ).trim();

  const valorOriginalNumero =
    validarValorPositivo(
      valorOriginal,
      "Informe um valor original válido."
    );

  const saldoNumero =
    saldoAtual === null ||
    saldoAtual === undefined ||
    saldoAtual === ""
      ? valorOriginalNumero
      : validarValorNaoNegativo(
          saldoAtual,
          "O saldo devedor não pode ser negativo."
        );

  const jurosNumero =
    validarValorNaoNegativo(
      jurosMensal || 0,
      "A taxa de juros não pode ser negativa."
    );

  const parcelaNumero =
    parcelaMinima === null ||
    parcelaMinima === undefined ||
    parcelaMinima === ""
      ? null
      : validarValorNaoNegativo(
          parcelaMinima,
          "A parcela mínima não pode ser negativa."
        );

  const vencimentoNumero =
    validarDiaVencimento(
      vencimentoDia
    );

  const prioridadeNumero =
    validarPrioridade(
      prioridade
    );

  const quitada =
    saldoNumero <= 0;

  const agora =
    new Date()
      .toISOString();

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .insert({
      usuario_id:
        user.id,

      nome:
        nomeLimpo,

      credor:
        credorLimpo ||
        null,

      valor_original:
        valorOriginalNumero,

      saldo_atual:
        saldoNumero,

      juros_mensal:
        jurosNumero,

      parcela_minima:
        parcelaNumero,

      vencimento_dia:
        vencimentoNumero,

      prioridade:
        prioridadeNumero,

      status:
        quitada
          ? "quitada"
          : "ativa",

      quitada_em:
        quitada
          ? agora
          : null,

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


export async function atualizarDivida(
  dividaId,
  {
    nome,
    credor = "",
    valorOriginal,
    saldoAtual,
    jurosMensal = 0,
    parcelaMinima = null,
    vencimentoDia = null,
    prioridade = 3,
  }
) {
  const user =
    await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  const nomeLimpo =
    String(
      nome ?? ""
    ).trim();

  if (!nomeLimpo) {
    throw new Error(
      "Informe o nome da dívida."
    );
  }

  const credorLimpo =
    String(
      credor ?? ""
    ).trim();

  const valorOriginalNumero =
    validarValorPositivo(
      valorOriginal,
      "Informe um valor original válido."
    );

  const saldoNumero =
    validarValorNaoNegativo(
      saldoAtual,
      "O saldo devedor não pode ser negativo."
    );

  const jurosNumero =
    validarValorNaoNegativo(
      jurosMensal || 0,
      "A taxa de juros não pode ser negativa."
    );

  const parcelaNumero =
    parcelaMinima === null ||
    parcelaMinima === undefined ||
    parcelaMinima === ""
      ? null
      : validarValorNaoNegativo(
          parcelaMinima,
          "A parcela mínima não pode ser negativa."
        );

  const vencimentoNumero =
    validarDiaVencimento(
      vencimentoDia
    );

  const prioridadeNumero =
    validarPrioridade(
      prioridade
    );

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .update({
      nome:
        nomeLimpo,

      credor:
        credorLimpo ||
        null,

      valor_original:
        valorOriginalNumero,

      saldo_atual:
        saldoNumero,

      juros_mensal:
        jurosNumero,

      parcela_minima:
        parcelaNumero,

      vencimento_dia:
        vencimentoNumero,

      prioridade:
        prioridadeNumero,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      dividaId
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

  /*
   * O trigger trg_status_divida
   * cuida automaticamente de:
   *
   * saldo = 0 -> quitada
   * saldo > 0 após quitada -> ativa
   * quitada_em
   */

  return data;
}


export async function atualizarSaldoDivida(
  dividaId,
  novoSaldo
) {
  const user =
    await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  const saldoNumero =
    validarValorNaoNegativo(
      novoSaldo,
      "O saldo devedor não pode ser negativo."
    );

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .update({
      saldo_atual:
        saldoNumero,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      dividaId
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


export async function registrarPagamentoDivida(
  dividaId,
  valorPagamento
) {
  const user =
    await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  const pagamentoNumero =
    validarValorPositivo(
      valorPagamento,
      "Informe um pagamento maior que zero."
    );

  const {
    data: divida,
    error: erroBusca,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .select(`
      id,
      saldo_atual,
      status
    `)
    .eq(
      "id",
      dividaId
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
    divida.status ===
    "quitada"
  ) {
    throw new Error(
      "Esta dívida já está quitada."
    );
  }

  const saldoAtual =
    Number(
      divida.saldo_atual || 0
    );

  const novoSaldo =
    Math.max(
      0,
      saldoAtual -
      pagamentoNumero
    );

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .update({
      saldo_atual:
        novoSaldo,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      dividaId
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


export async function alterarStatusDivida(
  dividaId,
  status
) {
  const user =
    await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  const permitidos = [
    "ativa",
    "negociada",
  ];

  if (
    !permitidos.includes(
      status
    )
  ) {
    throw new Error(
      "Status inválido para a dívida."
    );
  }

  const {
    data: atual,
    error: erroBusca,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .select(`
      id,
      saldo_atual,
      status
    `)
    .eq(
      "id",
      dividaId
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
    Number(
      atual.saldo_atual || 0
    ) <= 0
  ) {
    throw new Error(
      "Esta dívida já está quitada."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .update({
      status,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      dividaId
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


export async function listarPlanoQuitacao(
  dividaId
) {
  await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from(
      "plano_quitacao"
    )
    .select(`
      id,
      divida_id,
      semana_referencia,
      valor_previsto,
      valor_pago,
      status,
      created_at,
      updated_at
    `)
    .eq(
      "divida_id",
      dividaId
    )
    .order(
      "semana_referencia",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}


export async function criarParcelaPlanoQuitacao(
  dividaId,
  {
    semanaReferencia,
    valorPrevisto,
    valorPago = 0,
  }
) {
  const user =
    await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  if (!semanaReferencia) {
    throw new Error(
      "Informe a semana de referência."
    );
  }

  const previstoNumero =
    validarValorPositivo(
      valorPrevisto,
      "Informe um valor previsto maior que zero."
    );

  const pagoNumero =
    validarValorNaoNegativo(
      valorPago || 0,
      "O valor pago não pode ser negativo."
    );

  /*
   * Confirma que a dívida pertence
   * ao usuário antes do INSERT.
   * O RLS também garante isso.
   */
  const {
    data: divida,
    error: erroDivida,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .select(`
      id,
      status
    `)
    .eq(
      "id",
      dividaId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .single();

  if (erroDivida) {
    throw erroDivida;
  }

  if (
    divida.status ===
    "quitada"
  ) {
    throw new Error(
      "Não é possível criar parcelas para uma dívida quitada."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from(
      "plano_quitacao"
    )
    .insert({
      divida_id:
        dividaId,

      semana_referencia:
        semanaReferencia,

      valor_previsto:
        previstoNumero,

      valor_pago:
        pagoNumero,
    })
    .select()
    .single();

  if (error) {
    if (
      error.code ===
      "23505"
    ) {
      throw new Error(
        "Já existe uma parcela cadastrada para esta semana."
      );
    }

    throw error;
  }

  /*
   * O trigger do banco define:
   *
   * pendente
   * parcial
   * pago
   */

  return data;
}


export async function atualizarParcelaPlanoQuitacao(
  parcelaId,
  {
    valorPrevisto,
    valorPago,
  }
) {
  await obterUsuario();

  if (!parcelaId) {
    throw new Error(
      "Parcela não informada."
    );
  }

  const previstoNumero =
    validarValorPositivo(
      valorPrevisto,
      "Informe um valor previsto maior que zero."
    );

  const pagoNumero =
    validarValorNaoNegativo(
      valorPago || 0,
      "O valor pago não pode ser negativo."
    );

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from(
      "plano_quitacao"
    )
    .update({
      valor_previsto:
        previstoNumero,

      valor_pago:
        pagoNumero,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      parcelaId
    )
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Parcela não encontrada."
    );
  }

  return data;
}


export async function excluirParcelaPlanoQuitacao(
  parcelaId
) {
  await obterUsuario();

  if (!parcelaId) {
    throw new Error(
      "Parcela não informada."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from(
      "plano_quitacao"
    )
    .delete()
    .eq(
      "id",
      parcelaId
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Parcela não encontrada."
    );
  }

  return true;
}


export async function excluirDivida(
  dividaId
) {
  const user =
    await obterUsuario();

  if (!dividaId) {
    throw new Error(
      "Dívida não informada."
    );
  }

  /*
   * Não excluímos uma dívida
   * enquanto existir um plano de
   * quitação relacionado.
   */

  const {
    count,
    error: erroContagem,
  } = await supabase
    .schema("rumo")
    .from(
      "plano_quitacao"
    )
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "divida_id",
      dividaId
    );

  if (erroContagem) {
    throw erroContagem;
  }

  if (
    Number(
      count || 0
    ) > 0
  ) {
    throw new Error(
      "Esta dívida possui um plano de quitação. Exclua as parcelas do plano antes de remover a dívida."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .schema("rumo")
    .from("dividas")
    .delete()
    .eq(
      "id",
      dividaId
    )
    .eq(
      "usuario_id",
      user.id
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Dívida não encontrada."
    );
  }

  return true;
}


/*
 * Simulação financeira simplificada.
 *
 * Ela considera:
 * - saldo atual;
 * - juros mensais fixos;
 * - pagamento mensal constante.
 *
 * Não substitui o cálculo oficial
 * feito pelo banco ou credor.
 */

export function simularQuitacao({
  saldoAtual,
  jurosMensal = 0,
  pagamentoMensal,
  limiteMeses = 600,
}) {
  const saldoInicial =
    validarValorPositivo(
      saldoAtual,
      "Informe um saldo devedor maior que zero."
    );

  const jurosPercentual =
    validarValorNaoNegativo(
      jurosMensal || 0,
      "A taxa de juros não pode ser negativa."
    );

  const pagamento =
    validarValorPositivo(
      pagamentoMensal,
      "Informe um pagamento mensal maior que zero."
    );

  const taxa =
    jurosPercentual /
    100;

  const jurosPrimeiroMes =
    saldoInicial *
    taxa;

  if (
    taxa > 0 &&
    pagamento <=
      jurosPrimeiroMes
  ) {
    return {
      quitavel: false,

      motivo:
        "O pagamento mensal informado não cobre nem os juros estimados do primeiro mês.",

      meses: null,

      totalPago: null,

      totalJuros: null,

      saldoInicial,

      pagamentoMensal:
        pagamento,

      jurosMensal:
        jurosPercentual,
    };
  }

  let saldo =
    saldoInicial;

  let meses = 0;

  let totalPago = 0;

  let totalJuros = 0;

  while (
    saldo > 0.005 &&
    meses < limiteMeses
  ) {
    meses += 1;

    const jurosMes =
      saldo *
      taxa;

    totalJuros +=
      jurosMes;

    saldo +=
      jurosMes;

    const pagamentoMes =
      Math.min(
        pagamento,
        saldo
      );

    saldo -=
      pagamentoMes;

    totalPago +=
      pagamentoMes;
  }

  if (
    saldo > 0.005
  ) {
    return {
      quitavel: false,

      motivo:
        "A simulação ultrapassou o limite máximo de meses.",

      meses: null,

      totalPago: null,

      totalJuros: null,

      saldoInicial,

      pagamentoMensal:
        pagamento,

      jurosMensal:
        jurosPercentual,
    };
  }

  return {
    quitavel: true,

    motivo: null,

    meses,

    totalPago:
      Number(
        totalPago.toFixed(2)
      ),

    totalJuros:
      Number(
        totalJuros.toFixed(2)
      ),

    saldoInicial:
      Number(
        saldoInicial.toFixed(2)
      ),

    pagamentoMensal:
      Number(
        pagamento.toFixed(2)
      ),

    jurosMensal:
      jurosPercentual,
  };
}