-- Diagnóstico SOMENTE LEITURA para homologação da exclusão de conta do Rumo.
-- NÃO apaga nem modifica dados. Testado com UUID sintético (sem conta real).
-- Para uma conta de teste dedicada, substitua o UUID abaixo pelo ID do titular
-- autenticado obtido de forma segura. Não use IDs de usuários reais sem necessidade.
-- NÃO executar DELETE em auth.users/public.profiles: Supabase é compartilhado.
-- Contagens incluem cópias históricas que exigem plano de retenção.
WITH alvo AS (
  SELECT '00000000-0000-4000-8000-000000000042'::uuid AS usuario_id
), contagens AS (
  SELECT 'rumo.alertas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.alertas JOIN alvo a ON alertas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.assinaturas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.assinaturas JOIN alvo a ON assinaturas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_contas_20260903'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_contas_20260903 JOIN alvo a ON bkp_contas_20260903.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_limpeza_final_20260904_contas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_limpeza_final_20260904_contas JOIN alvo a ON bkp_limpeza_final_20260904_contas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_limpeza_final_20260904_metas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_limpeza_final_20260904_metas JOIN alvo a ON bkp_limpeza_final_20260904_metas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_limpeza_final_20260904_movimentacoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_limpeza_final_20260904_movimentacoes JOIN alvo a ON bkp_limpeza_final_20260904_movimentacoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_limpeza_final_20260904_of_conexoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_limpeza_final_20260904_of_conexoes JOIN alvo a ON bkp_limpeza_final_20260904_of_conexoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_limpeza_final_20260904_of_contas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_limpeza_final_20260904_of_contas JOIN alvo a ON bkp_limpeza_final_20260904_of_contas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_limpeza_final_20260904_of_movimentacoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_limpeza_final_20260904_of_movimentacoes JOIN alvo a ON bkp_limpeza_final_20260904_of_movimentacoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_mov_rumo_dup_reconexao_20260904'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_mov_rumo_dup_reconexao_20260904 JOIN alvo a ON bkp_mov_rumo_dup_reconexao_20260904.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_movimentacoes_20260903'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_movimentacoes_20260903 JOIN alvo a ON bkp_movimentacoes_20260903.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_of_contas_20260903'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_of_contas_20260903 JOIN alvo a ON bkp_of_contas_20260903.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_of_contas_20260904_final'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_of_contas_20260904_final JOIN alvo a ON bkp_of_contas_20260904_final.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_of_mov_dup_reconexao_20260904'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_of_mov_dup_reconexao_20260904 JOIN alvo a ON bkp_of_mov_dup_reconexao_20260904.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_of_movimentacoes_20260903'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_of_movimentacoes_20260903 JOIN alvo a ON bkp_of_movimentacoes_20260903.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.bkp_of_movimentacoes_20260904_final'::text AS origem, count(*)::bigint AS registros
  FROM rumo.bkp_of_movimentacoes_20260904_final JOIN alvo a ON bkp_of_movimentacoes_20260904_final.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.cartoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.cartoes JOIN alvo a ON cartoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.categorias'::text AS origem, count(*)::bigint AS registros
  FROM rumo.categorias JOIN alvo a ON categorias.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.compras_cartao'::text AS origem, count(*)::bigint AS registros
  FROM rumo.compras_cartao JOIN alvo a ON compras_cartao.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.compromissos'::text AS origem, count(*)::bigint AS registros
  FROM rumo.compromissos JOIN alvo a ON compromissos.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.compromissos_ocorrencias'::text AS origem, count(*)::bigint AS registros
  FROM rumo.compromissos_ocorrencias JOIN alvo a ON compromissos_ocorrencias.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.configuracoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.configuracoes JOIN alvo a ON configuracoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.contas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.contas JOIN alvo a ON contas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.dividas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.dividas JOIN alvo a ON dividas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.importacoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.importacoes JOIN alvo a ON importacoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.importacoes_itens'::text AS origem, count(*)::bigint AS registros
  FROM rumo.importacoes_itens JOIN alvo a ON importacoes_itens.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.metas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.metas JOIN alvo a ON metas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.movimentacoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.movimentacoes JOIN alvo a ON movimentacoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.objetivos'::text AS origem, count(*)::bigint AS registros
  FROM rumo.objetivos JOIN alvo a ON objetivos.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.open_finance_conexoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.open_finance_conexoes JOIN alvo a ON open_finance_conexoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.open_finance_contas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.open_finance_contas JOIN alvo a ON open_finance_contas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.open_finance_movimentacoes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.open_finance_movimentacoes JOIN alvo a ON open_finance_movimentacoes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.orcamentos'::text AS origem, count(*)::bigint AS registros
  FROM rumo.orcamentos JOIN alvo a ON orcamentos.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.padroes_inteligentes'::text AS origem, count(*)::bigint AS registros
  FROM rumo.padroes_inteligentes JOIN alvo a ON padroes_inteligentes.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.pagamentos_assinaturas'::text AS origem, count(*)::bigint AS registros
  FROM rumo.pagamentos_assinaturas JOIN alvo a ON pagamentos_assinaturas.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.parcelas_cartao'::text AS origem, count(*)::bigint AS registros
  FROM rumo.parcelas_cartao JOIN alvo a ON parcelas_cartao.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.solicitacoes_exclusao'::text AS origem, count(*)::bigint AS registros
  FROM rumo.solicitacoes_exclusao JOIN alvo a ON solicitacoes_exclusao.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.usuarios_privilegiados'::text AS origem, count(*)::bigint AS registros
  FROM rumo.usuarios_privilegiados JOIN alvo a ON usuarios_privilegiados.usuario_id=a.usuario_id
  UNION ALL
  SELECT 'rumo.aportes_objetivos (por objetivos)'::text, count(*)::bigint
  FROM rumo.aportes_objetivos ao JOIN rumo.objetivos o ON o.id=ao.objetivo_id JOIN alvo a ON a.usuario_id=o.usuario_id
  UNION ALL
  SELECT 'rumo.plano_quitacao (por dividas)'::text, count(*)::bigint
  FROM rumo.plano_quitacao pq JOIN rumo.dividas d ON d.id=pq.divida_id JOIN alvo a ON a.usuario_id=d.usuario_id
)
SELECT origem, registros
FROM contagens
ORDER BY origem;

-- Bloqueadores externos também devem ser conferidos antes de excluir:
-- 1. assinaturas Mercado Pago: cancelar no provedor, confirmar webhook;
-- 2. Open Finance/Pluggy: revogar conexões e impedir nova sincronização;
-- 3. objetos Storage, arquivos, backups, relatórios e retenção legal;
-- 4. provas mínimas da solicitação e conclusão, sem dados pessoais adicionais.
