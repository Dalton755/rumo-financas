import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { autenticarUsuario } from "../_lib/autenticarUsuario.js";
import { resumirRespostaPreapproval } from "../_lib/rumoStatusMercadoPago.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }
  let adminLogado;
  try {
    adminLogado = await autenticarUsuario(req);
  } catch {
    return res.status(401).json({ error: "Sessão inválida." });
  }
  const { data: admin, error: errAdmin } = await supabaseAdmin
    .schema("rumo").from("usuarios_privilegiados")
    .select("usuario_id")
    .eq("usuario_id", adminLogado.id)
    .eq("papel", "DONO").eq("ativo", true)
    .maybeSingle();
  if (errAdmin) return res.status(503).json({ error: "Falha na validação de permissões." });
  if (!admin) return res.status(403).json({ error: "Acesso restrito." });

  const id = typeof req.query?.solicitacao_id === "string" ? req.query.solicitacao_id : "";
  if (!UUID.test(id)) return res.status(400).json({ error: "Pedido inválido." });

  const { data: pedido, error: errPedido } = await supabaseAdmin
    .schema("rumo").from("solicitacoes_exclusao")
    .select("id, usuario_id, status")
    .eq("id", id).maybeSingle();
  if (errPedido) return res.status(503).json({ error: "Falha na consulta do pedido." });
  if (!pedido || !["PENDENTE", "EM_ANALISE"].includes(pedido.status)) {
    return res.status(404).json({ error: "Pedido aberto não encontrado." });
  }

  const { data: pendencias, error: errPagamentos } = await supabaseAdmin
    .schema("rumo").from("pagamentos_assinaturas")
    .select("id, status, mercado_pago_preapproval_id, mercado_pago_payment_id")
    .eq("usuario_id", pedido.usuario_id)
    .not("mercado_pago_preapproval_id", "is", null)
    .limit(15);
  if (errPagamentos) return res.status(503).json({ error: "Falha na consulta dos pagamentos." });
  if ((pendencias ?? []).length === 15) {
    return res.status(409).json({ error: "Há muitas referências. Verificação manual necessária." });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "Credencial Mercado Pago não disponível neste ambiente." });
  }
  const resultados = [];
  for (const pagamento of pendencias || []) {
    const identificador = pagamento.mercado_pago_preapproval_id;
    if (!/^[a-zA-Z0-9_-]{10,100}$/.test(identificador || "")) {
      return res.status(503).json({ error: "Referência de cobrança inválida. Revisão manual necessária." });
    }
    let resposta;
    try {
      resposta = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(identificador)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return res.status(503).json({ error: "Não foi possível consultar Mercado Pago. Nada foi alterado." });
    }
    let dados = {};
    try { dados = await resposta.json(); } catch { /* retorno sem corpo */ }
    const resumo = resumirRespostaPreapproval(resposta.status, dados);
    // Evitar confundir referências diferentes do mesmo usuário.
    if (resposta.ok && dados?.id !== identificador) {
      return res.status(503).json({ error: "Referência divergente retornada pelo provedor." });
    }
    resultados.push({
      referenciaFinal: identificador.slice(-6),
      pagamentoStatusLocal: pagamento.status,
      pagamentoConfirmadoLocal: Boolean(pagamento.mercado_pago_payment_id),
      ...resumo,
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
