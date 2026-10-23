/**
 * Auditoria somente leitura para solicitações de exclusão do Rumo.
 * Não altera usuário, cobrança, integração, tabela ou arquivo.
 *
 * "Pronto para excluir" não é inferido de contagens zero: assinaturas,
 * backups gerenciados, storage, logs e retenção legal exigem análise humana.
 */
export const TABELAS_USUARIO_RUMO = Object.freeze([
  "alertas", "assinaturas", "cartoes", "categorias", "compras_cartao",
  "compromissos", "compromissos_ocorrencias", "configuracoes", "contas",
  "dividas", "importacoes", "importacoes_itens", "metas", "movimentacoes",
  "objetivos", "open_finance_conexoes", "open_finance_contas",
  "open_finance_movimentacoes", "orcamentos", "padroes_inteligentes",
  "pagamentos_assinaturas", "parcelas_cartao", "solicitacoes_exclusao",
  "usuarios_privilegiados",
]);

export const TABELAS_BACKUP_RUMO = Object.freeze([
  "bkp_contas_20260903",
  "bkp_limpeza_final_20260904_contas",
  "bkp_limpeza_final_20260904_metas",
  "bkp_limpeza_final_20260904_movimentacoes",
  "bkp_limpeza_final_20260904_of_conexoes",
  "bkp_limpeza_final_20260904_of_contas",
  "bkp_limpeza_final_20260904_of_movimentacoes",
  "bkp_mov_rumo_dup_reconexao_20260904",
  "bkp_movimentacoes_20260903",
  "bkp_of_contas_20260903",
  "bkp_of_contas_20260904_final",
  "bkp_of_mov_dup_reconexao_20260904",
  "bkp_of_movimentacoes_20260903",
  "bkp_of_movimentacoes_20260904_final",
]);

const DIRETAS = [...TABELAS_USUARIO_RUMO, ...TABELAS_BACKUP_RUMO];
const DEPENDENTES = [
  { tabela: "aportes_objetivos", relacao: "objetivos", origem: "objetivos" },
  { tabela: "plano_quitacao", relacao: "dividas", origem: "dividas" },
];

async function contar(supabaseAdmin, tabela, usuarioId, relacao) {
  let consulta = supabaseAdmin.schema("rumo").from(tabela)
    .select(relacao ? `*, ${relacao}!inner(usuario_id)` : "*", {
      count: "exact", head: true,
    });
  consulta = consulta.eq(relacao ? `${relacao}.usuario_id` : "usuario_id", usuarioId);
  const { count, error } = await consulta;
  if (error || !Number.isSafeInteger(count) || count < 0) {
    throw new Error(`Não foi possível contar os registros em rumo.${tabela}.`);
  }
  return count;
}

export async function prepararPreflightExclusao(supabaseAdmin, usuarioId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(usuarioId || "")) {
    throw new Error("Identificador de usuário inválido.");
  }
  const contagens = {};
  // Não sobrecarregar o projeto compartilhado com 40 consultas simultâneas.
  for (let i = 0; i < DIRETAS.length; i += 4) {
    const grupo = DIRETAS.slice(i, i + 4);
    const resultado = await Promise.all(grupo.map((nome) => contar(supabaseAdmin, nome, usuarioId)));
    grupo.forEach((nome, indice) => { contagens[nome] = resultado[indice]; });
  }
  for (const dep of DEPENDENTES) {
    contagens[dep.tabela] = await contar(supabaseAdmin, dep.tabela, usuarioId, dep.relacao);
  }
  const total = Object.values(contagens).reduce((a, b) => a + b, 0);
  const backups = TABELAS_BACKUP_RUMO.reduce((s, nome) => s + contagens[nome], 0);
  const alertas = [
    "Processamento de exclusão não executado. Verificar retenção legal, Storage, logs e backups externos.",
  ];
  if (contagens.assinaturas || contagens.pagamentos_assinaturas) {
    alertas.push("Verificar/cancelar cobranças Mercado Pago e registrar retenções fiscais antes da exclusão.");
  }
  if (contagens.open_finance_conexoes || contagens.open_finance_contas) {
    alertas.push("Revogar conexões Pluggy/Open Finance antes de apagar os dados do Rumo.");
  }
  if (backups) alertas.push("Existem cópias históricas do Rumo para este usuário; avaliar exclusão ou retenção justificada.");
  if (contagens.usuarios_privilegiados) alertas.push("Usuário com acesso administrativo: requer revisão adicional.");
  return {
    modo: "SOMENTE_LEITURA",
    exclusaoExecutada: false,
    elegivelParaExclusaoAutomatica: false,
    totalRegistros: total,
    totalTabelasVerificadas: Object.keys(contagens).length,
    totalBackups: backups,
    contagens,
    alertas,
  };
}
