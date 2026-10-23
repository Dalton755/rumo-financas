import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { autenticarUsuario } from "../_lib/autenticarUsuario.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  let user;
  try {
    user = await autenticarUsuario(req);
  } catch {
    return res.status(401).json({ error: "Sessão inválida." });
  }

  // Verificação server-side. Não confiar em papéis informados pelo cliente.
  const { data: admin, error: erroAdmin } = await supabaseAdmin
    .schema("rumo")
    .from("usuarios_privilegiados")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .eq("papel", "DONO")
    .eq("ativo", true)
    .maybeSingle();

  if (erroAdmin) {
    return res.status(503).json({ error: "Não foi possível verificar a permissão." });
  }
  if (!admin) {
    return res.status(403).json({ error: "Acesso restrito ao administrador." });
  }

  const { data, error } = await supabaseAdmin
    .schema("rumo")
    .from("solicitacoes_exclusao")
    .select("id, usuario_id, status, solicitada_em, concluida_em")
    .order("solicitada_em", { ascending: false })
    .limit(100);

  if (error) {
    return res.status(503).json({ error: "Não foi possível consultar as solicitações." });
  }
  return res.status(200).json({ solicitacoes: data ?? [] });
}
