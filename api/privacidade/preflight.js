import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { autenticarUsuario } from "../_lib/autenticarUsuario.js";
import { prepararPreflightExclusao } from "../_lib/rumoExclusaoPreflight.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Endpoint GET SOMENTE LEITURA, exclusivo do DONO. Nunca exclui dados.
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

  const { data: admin, error: erroAdmin } = await supabaseAdmin
    .schema("rumo").from("usuarios_privilegiados")
    .select("usuario_id")
    .eq("usuario_id", adminLogado.id).eq("papel", "DONO").eq("ativo", true)
    .maybeSingle();
  if (erroAdmin) return res.status(503).json({ error: "Falha na validação de permissões." });
  if (!admin) return res.status(403).json({ error: "Acesso restrito." });

  const id = typeof req.query?.solicitacao_id === "string" ? req.query.solicitacao_id : "";
  if (!UUID.test(id)) return res.status(400).json({ error: "Solicitação inválida." });
  const { data: pedido, error: erroPedido } = await supabaseAdmin
    .schema("rumo").from("solicitacoes_exclusao")
    .select("id, usuario_id, status")
    .eq("id", id).maybeSingle();
  if (erroPedido) return res.status(503).json({ error: "Não foi possível consultar a solicitação." });
  if (!pedido || !["PENDENTE", "EM_ANALISE"].includes(pedido.status)) {
    return res.status(404).json({ error: "Solicitação aberta não encontrada." });
  }

  try {
    const resultado = await prepararPreflightExclusao(supabaseAdmin, pedido.usuario_id);
    return res.status(200).json({ pedido: pedido.id, ...resultado });
  } catch {
    // Não inferir elegibilidade em caso de falha ou contagens incompletas.
    return res.status(503).json({ error: "Auditoria incompleta. Nenhuma exclusão foi executada." });
  }
}
