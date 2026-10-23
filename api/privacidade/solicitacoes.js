import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { autenticarUsuario } from "../_lib/autenticarUsuario.js";
import { prepararPreflightExclusao } from "../_lib/rumoExclusaoPreflight.js";
import { resumirRespostaPreapproval } from "../_lib/rumoStatusMercadoPago.js";
import { validarCancelamentoPendente } from "../_lib/rumoCancelarCheckoutPendente.js";

// Reúne consultas de privacidade em uma função para atender o limite Hobby da Vercel.
// GET é estritamente somente leitura. POST de cancelamento requer confirmação
// explícita, papel DONO e comprovação de que o checkout não foi pago.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function buscarPedidoAberto(id, res) {
  if (!UUID.test(id)) {
    res.status(400).json({ error: "Solicitação inválida." });
    return null;
  }
  const { data: pedido, error } = await supabaseAdmin
    .schema("rumo").from("solicitacoes_exclusao")
    .select("id, usuario_id, status").eq("id", id).maybeSingle();
  if (error) {
    res.status(503).json({ error: "Falha na consulta do pedido." });
    return null;
  }
  if (!pedido || !["PENDENTE", "EM_ANALISE"].includes(pedido.status)) {
    res.status(404).json({ error: "Pedido aberto não encontrado." });
    return null;
  }
  return pedido;
}

async function auditarPedido(pedido, res) {
  try {
    const resultado = await prepararPreflightExclusao(supabaseAdmin, pedido.usuario_id);
    return res.status(200).json({ pedido: pedido.id, ...resultado });
  } catch {
    return res.status(503).json({
      error: "Auditoria incompleta. Nenhuma exclusão foi executada.",
    });
  }
}

async function verificarNoProvedor(pedido, res) {
  const { data: pagamentos, error } = await supabaseAdmin
    .schema("rumo").from("pagamentos_assinaturas")
    .select("id, status, mercado_pago_preapproval_id, mercado_pago_payment_id")
    .eq("usuario_id", pedido.usuario_id)
    .not("mercado_pago_preapproval_id", "is", null).limit(15);
  if (error) return res.status(503).json({ error: "Falha na consulta de pagamentos." });
  if ((pagamentos || []).length >= 15) {
    return res.status(409).json({ error: "Muitas referências: conferência manual necessária." });
  }
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "Credencial Mercado Pago indisponível neste ambiente." });
  }

  const resultados = [];
  for (const pagamento of pagamentos || []) {
    const identificador = pagamento.mercado_pago_preapproval_id;
    if (!/^[a-zA-Z0-9_-]{10,100}$/.test(identificador || "")) {
      return res.status(503).json({ error: "Referência inválida. Revisão manual necessária." });
    }
    let resposta;
    try {
      resposta = await fetch(
        `https://api.mercadopago.com/preapproval/${encodeURIComponent(identificador)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        },
      );
    } catch {
      return res.status(503).json({
        error: "Consulta ao Mercado Pago indisponível. Nada foi alterado.",
      });
    }
    let dados = {};
    try { dados = await resposta.json(); } catch { /* retorno ausente */ }
    if (resposta.ok && String(dados?.id || "") !== identificador) {
      return res.status(503).json({ error: "Referência divergente retornada pelo provedor." });
    }
    resultados.push({
      referenciaFinal: identificador.slice(-6),
      pagamentoStatusLocal: pagamento.status,
      pagamentoConfirmadoLocal: Boolean(pagamento.mercado_pago_payment_id),
      ...resumirRespostaPreapproval(resposta.status, dados),
    });
  }
  return res.status(200).json({
    pedido: pedido.id,
    modo: "CONSULTA_SEM_ALTERACAO",
    cancelamentoExecutado: false,
    totalReferencias: resultados.length,
    resultados,
  });
}


async function requisitarPreapproval(token, identificador, metodo = "GET") {
  const resposta = await fetch(
    `https://api.mercadopago.com/preapproval/${encodeURIComponent(identificador)}`,
    {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(metodo === "PUT" ? { "Content-Type": "application/json" } : {}),
      },
      ...(metodo === "PUT" ? { body: JSON.stringify({ status: "canceled" }) } : {}),
      signal: AbortSignal.timeout(8000),
    },
  );
  let dados = {};
  try { dados = await resposta.json(); } catch { /* resposta nao JSON */ }
  return { ok: resposta.ok, statusHttp: resposta.status, dados };
}

async function cancelarCheckoutPendente(req, pedido, res) {
  // Jamais cancelar diretamente por ID apresentado pelo cliente. O ID remoto
  // é recuperado do pedido autenticado e de seu pagamento no banco.
  const final = typeof req.body?.referenciaFinal === "string" ? req.body.referenciaFinal : "";
  const confirmacao = typeof req.body?.confirmacao === "string" ? req.body.confirmacao : "";
  if (!/^[A-Za-z0-9_-]{6}$/.test(final) || confirmacao !== `CANCELAR ${final}`) {
    return res.status(400).json({ error: "Confirmação explícita incorreta." });
  }
  const { data: authTitular, error: erroTitular } =
    await supabaseAdmin.auth.admin.getUserById(pedido.usuario_id);
  const emailTitular = authTitular?.user?.email;
  if (erroTitular || !emailTitular) {
    return res.status(503).json({ error: "Titular do pedido não encontrado." });
  }
  const { data: pagamentos, error: erroPagamento } = await supabaseAdmin
    .schema("rumo").from("pagamentos_assinaturas")
    .select("id, usuario_id, status, provedor, tipo, pago_em, mercado_pago_payment_id, mercado_pago_preapproval_id, mercado_pago_external_reference, metadata")
    .eq("usuario_id", pedido.usuario_id)
    .not("mercado_pago_preapproval_id", "is", null)
    .limit(15);
  if (erroPagamento) {
    return res.status(503).json({ error: "Não foi possível validar os pagamentos." });
  }
  const correspondentes = (pagamentos || []).filter(
    p => p.mercado_pago_preapproval_id?.slice(-6) === final,
  );
  if ((pagamentos || []).length >= 15 || correspondentes.length !== 1) {
    return res.status(409).json({ error: "Referência ambígua ou não encontrada." });
  }
  const pagamento = correspondentes[0];
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: "Credencial do provedor indisponível." });
  let consulta;
  try {
    consulta = await requisitarPreapproval(token, pagamento.mercado_pago_preapproval_id);
  } catch {
    return res.status(503).json({ error: "Falha ao consultar checkout no Mercado Pago." });
  }
  if (!consulta.ok) {
    return res.status(503).json({ error: "Provedor não confirmou a referência do checkout." });
  }
  const validacao = validarCancelamentoPendente({
    pagamento, dadosProvedor: consulta.dados, emailTitular, referenciaFinal: final,
    emailCompradorTeste: process.env.MERCADOPAGO_TEST_PAYER_EMAIL,
  });
  if (!validacao.ok) return res.status(409).json({ error: validacao.motivo });

  if (!validacao.jaCancelada) {
    let alteracao;
    try {
      alteracao = await requisitarPreapproval(token, pagamento.mercado_pago_preapproval_id, "PUT");
    } catch {
      return res.status(503).json({
        error: "Resultado do cancelamento indeterminado. Consulte o provedor antes de tentar novamente.",
      });
    }
    if (!alteracao.ok) {
      return res.status(503).json({ error: "Mercado Pago não confirmou o cancelamento." });
    }
  }

  // Releitura independente: nunca considerar status da resposta PUT suficiente.
  let depois;
  try { depois = await requisitarPreapproval(token, pagamento.mercado_pago_preapproval_id); }
  catch { return res.status(503).json({ error: "Cancelamento não pôde ser verificado." }); }
  const validacaoFinal = depois.ok
    ? validarCancelamentoPendente({
      pagamento,
      dadosProvedor: depois.dados,
      emailTitular,
      referenciaFinal: final,
      emailCompradorTeste: process.env.MERCADOPAGO_TEST_PAYER_EMAIL,
    })
    : { ok: false };
  if (!validacaoFinal.ok || !validacaoFinal.jaCancelada) {
    return res.status(503).json({
      error: "Status final não confirmado no provedor. Não concluir exclusão.",
    });
  }

  const agora = new Date().toISOString();
  const { data: atualizado, error: erroUpdate } = await supabaseAdmin
    .schema("rumo").from("pagamentos_assinaturas")
    .update({
      status: "CANCELADO",
      atualizado_em: agora,
      metadata: {
        ...(pagamento.metadata && typeof pagamento.metadata === "object" && !Array.isArray(pagamento.metadata)
          ? pagamento.metadata : {}),
        mercado_pago_status: "canceled",
        checkout_cancelado_em: agora,
        checkout_cancelado_motivo: "EXCLUSAO_DADOS_RUMO",
      },
    })
    .eq("id", pagamento.id)
    .eq("usuario_id", pedido.usuario_id)
    .eq("status", "PENDENTE")
    .is("pago_em", null)
    .is("mercado_pago_payment_id", null)
    .select("id,status");
  if (erroUpdate || !Array.isArray(atualizado) || atualizado.length !== 1) {
    return res.status(503).json({
      error: "Checkout cancelado no provedor, mas sincronização local não foi concluída. Não excluir os dados até reconciliar.",
    });
  }
  return res.status(200).json({
    pedido: pedido.id,
    referenciaFinal: final,
    statusMercadoPago: "canceled",
    statusLocal: "CANCELADO",
    exclusaoExecutada: false,
    mensagem: "Checkout pendente cancelado e conferido. Os dados do Rumo ainda não foram excluídos.",
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const acao = typeof req.query?.acao === "string" ? req.query.acao : "";
  const ehCancelamento = req.method === "POST" && acao === "cancelar-checkout";
  if (req.method !== "GET" && !ehCancelamento) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido." });
  }
  let usuario;
  try {
    usuario = await autenticarUsuario(req);
  } catch {
    return res.status(401).json({ error: "Sessão inválida." });
  }

  const { data: admin, error: erroAdmin } = await supabaseAdmin
    .schema("rumo").from("usuarios_privilegiados")
    .select("usuario_id")
    .eq("usuario_id", usuario.id).eq("papel", "DONO").eq("ativo", true)
    .maybeSingle();
  if (erroAdmin) {
    return res.status(503).json({ error: "Não foi possível verificar a permissão." });
  }
  if (!admin) return res.status(403).json({ error: "Acesso restrito ao administrador." });

  if (ehCancelamento) {
    const id = typeof req.body?.solicitacao_id === "string" ? req.body.solicitacao_id : "";
    const pedido = await buscarPedidoAberto(id, res);
    if (!pedido || pedido.status !== "EM_ANALISE") {
      if (pedido) return res.status(409).json({ error: "Pedido não está em análise." });
      return;
    }
    return cancelarCheckoutPendente(req, pedido, res);
  }
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido." });
  if (acao === "preflight" || acao === "mercadopago") {
    const id = typeof req.query?.solicitacao_id === "string" ? req.query.solicitacao_id : "";
    const pedido = await buscarPedidoAberto(id, res);
    if (!pedido) return;
    if (acao === "preflight") return auditarPedido(pedido, res);
    return verificarNoProvedor(pedido, res);
  }
  if (acao) return res.status(400).json({ error: "Ação não reconhecida." });

  const { data, error } = await supabaseAdmin
    .schema("rumo").from("solicitacoes_exclusao")
    .select("id, usuario_id, status, solicitada_em, concluida_em")
    .order("solicitada_em", { ascending: false }).limit(100);
  if (error) return res.status(503).json({ error: "Não foi possível consultar as solicitações." });
  return res.status(200).json({ solicitacoes: data || [] });
}
