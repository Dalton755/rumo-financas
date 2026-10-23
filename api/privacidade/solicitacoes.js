import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { autenticarUsuario } from "../_lib/autenticarUsuario.js";
import { prepararPreflightExclusao } from "../_lib/rumoExclusaoPreflight.js";
import { resumirRespostaPreapproval } from "../_lib/rumoStatusMercadoPago.js";

// Reúne consultas de privacidade em uma função para atender o limite Hobby da Vercel.
// Por segurança, TODAS as ações são GET, somente leitura, protegidas pelo papel DONO.
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

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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

  const acao = typeof req.query?.acao === "string" ? req.query.acao : "";
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
