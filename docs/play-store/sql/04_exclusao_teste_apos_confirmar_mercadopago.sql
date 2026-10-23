-- RUMO — EXCLUSÃO DE DADOS DO APLICATIVO, SEM DELETAR AUTH COMPARTILHADO
-- PROCEDIMENTO DE HOMOLOGAÇÃO NÃO EXECUTADO. REVISAR ANTES DE USAR.
--
-- REQUISITOS EXTERNOS OBRIGATÓRIOS ANTES DO USO:
-- 1. Confirmar no Mercado Pago, VIA API ou PAINEL, que TODOS os IDs de
--    preapproval foram cancelados. Status "PENDENTE" não é cancelamento.
--    Registrar o cancelamento no Rumo por canal administrativo auditado.
-- 2. Revogar conexões Pluggy/Open Finance e impedir novas sincronizações.
-- 3. Conferir ausência de arquivos Storage e retenções fiscais/regulatórias.
-- 4. Confirmar identidade do titular e do pedido (status EM_ANALISE).
-- 5. Não executar via cliente/browser. Usar transação no SQL Editor seguro.
--
-- OBS.: esta versão está PROPOSITADAMENTE BLOQUEADA enquanto existirem
-- pagamentos MP sem comprovação registrada de cancelamento.
-- Não executar até incluir evidência do provedor.

BEGIN;

DO $$
DECLARE
  v_usuario uuid := '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
  v_email text;
  v_pedidos integer;
  v_pagamentos_nao_cancelados integer;
  v_conexoes_nao_revogadas integer;
  v_objetos_storage integer;
  v_administradores integer;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = v_usuario FOR SHARE;
  IF v_email IS DISTINCT FROM 'testadorebd@gmail.com' THEN
    RAISE EXCEPTION 'ABORTADO: identidade da conta de homologação divergente';
  END IF;
  SELECT count(*) INTO v_pedidos
    FROM rumo.solicitacoes_exclusao
   WHERE usuario_id = v_usuario AND status = 'EM_ANALISE';
  IF v_pedidos <> 1 THEN
    RAISE EXCEPTION 'ABORTADO: solicitação EM_ANALISE não encontrada ou ambígua';
  END IF;

  -- Mesmo um checkout não concluído pode conter uma autorização MP ativa.
  SELECT count(*) INTO v_pagamentos_nao_cancelados
    FROM rumo.pagamentos_assinaturas
   WHERE usuario_id = v_usuario
     AND mercado_pago_preapproval_id IS NOT NULL
     AND status <> 'CANCELADO';
  IF v_pagamentos_nao_cancelados <> 0 THEN
    RAISE EXCEPTION 'ABORTADO: preapproval Mercado Pago não confirmado como cancelado';
  END IF;

  -- Proteção extra: assinatura MP local não pode continuar ativa.
  IF EXISTS (
    SELECT 1 FROM rumo.assinaturas
     WHERE usuario_id = v_usuario
       AND mercado_pago_preapproval_id IS NOT NULL
       AND cancelamento_provedor_em IS NULL
  ) THEN
    RAISE EXCEPTION 'ABORTADO: assinatura Mercado Pago não confirmada no provedor';
  END IF;

  SELECT count(*) INTO v_conexoes_nao_revogadas
    FROM rumo.open_finance_conexoes
   WHERE usuario_id = v_usuario
     AND pluggy_item_id IS NOT NULL
     AND desconectado_em IS NULL;
  IF v_conexoes_nao_revogadas > 0 THEN
    RAISE EXCEPTION 'ABORTADO: conexões financeiras ainda não revogadas';
  END IF;

  SELECT count(*) INTO v_objetos_storage
    FROM storage.objects
   WHERE owner_id = v_usuario::text;
  IF v_objetos_storage > 0 THEN
    RAISE EXCEPTION 'ABORTADO: objetos Supabase Storage do usuário requerem revisão';
  END IF;

  SELECT count(*) INTO v_administradores
    FROM rumo.usuarios_privilegiados WHERE usuario_id = v_usuario;
  IF v_administradores > 0 THEN
    RAISE EXCEPTION 'ABORTADO: usuário com privilégios administrativos';
  END IF;
END $$;

-- Cópias históricas do Rumo (não conservá-las indefinidamente).
DELETE FROM rumo.bkp_contas_20260903 WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_limpeza_final_20260904_contas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_limpeza_final_20260904_metas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_limpeza_final_20260904_movimentacoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_limpeza_final_20260904_of_conexoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_limpeza_final_20260904_of_contas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_limpeza_final_20260904_of_movimentacoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_mov_rumo_dup_reconexao_20260904 WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_movimentacoes_20260903 WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_of_contas_20260903 WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_of_contas_20260904_final WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_of_mov_dup_reconexao_20260904 WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_of_movimentacoes_20260903 WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.bkp_of_movimentacoes_20260904_final WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;

-- Dependências sem usuario_id próprio.
DELETE FROM rumo.aportes_objetivos AS a USING rumo.objetivos AS o
 WHERE a.objetivo_id = o.id AND o.usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.plano_quitacao AS p USING rumo.dividas AS d
 WHERE p.divida_id = d.id AND d.usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;

-- Filhas antes das entidades referenciadas: evita bloqueios FK.
DELETE FROM rumo.importacoes_itens WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.compromissos_ocorrencias WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.parcelas_cartao WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.open_finance_movimentacoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.pagamentos_assinaturas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.padroes_inteligentes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.orcamentos WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.compras_cartao WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.open_finance_contas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;

-- Entidades primárias da conta Rumo.
DELETE FROM rumo.alertas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.metas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.movimentacoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.importacoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.compromissos WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.open_finance_conexoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.assinaturas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.dividas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.objetivos WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.cartoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.categorias WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.contas WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;
DELETE FROM rumo.configuracoes WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid;

-- Se as limpezas acima e confirmações externas funcionarem, registrar
-- conclusão mínima auditável. Guardamos só ID, status e datas do pedido.
UPDATE rumo.solicitacoes_exclusao
   SET status = 'CONCLUIDA', concluida_em = now(), anotacao_interna = NULL
 WHERE usuario_id = '3d642a9c-e359-4afc-9331-691d2f1a2eea'::uuid AND status = 'EM_ANALISE';

-- NÃO tocar auth.users, public.profiles nem schemas ebd, beleza, etc.
COMMIT;

-- APÓS executar, usar docs/play-store/sql/03_preflight_exclusao_readonly.sql
-- com o UUID da conta de homologação. Deve restar apenas o pedido CONCLUIDA.
-- Revalidar registros dos outros schemas, cobrar que webhooks não recriem nada.
