-- RUMO / Play Store — bloquear recriação de dados após solicitação CONCLUIDA.
-- Objetivo: proteger SOMENTE o schema rumo; auth.users é compartilhado.
-- NÃO EXECUTADO EM PRODUÇÃO. Executar somente após homologação/autorizar.
-- RLS isolada não basta: garantir_usuario_rumo é SECURITY DEFINER e serviços
-- administrativos/service_role podem contornar políticas RLS.
--
-- Nota: PENDENTE/EM_ANALISE continuam manipuláveis pelo processamento da
-- exclusão (cancelamento de pagamento); concluída bloqueia INSERT/UPDATE.
-- Não executar DELETE em auth.users, profiles ou outros schemas.
BEGIN;

CREATE OR REPLACE FUNCTION rumo.bloquear_escrita_conta_encerrada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rumo, pg_temp
AS $function$
BEGIN
  IF NEW.usuario_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM rumo.solicitacoes_exclusao
       WHERE usuario_id = NEW.usuario_id AND status = 'CONCLUIDA'
     ) THEN
    RAISE EXCEPTION 'RUMO_CONTA_ENCERRADA'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$function$;

-- Não criar caminho executável público para SECURITY DEFINER.
REVOKE ALL ON FUNCTION rumo.bloquear_escrita_conta_encerrada() FROM PUBLIC;
REVOKE ALL ON FUNCTION rumo.bloquear_escrita_conta_encerrada() FROM anon, authenticated;

-- Contagem das tabelas de titular é calculada no catálogo do próprio schema.
-- Exclui propositalmente o registro mínimo da solicitação e privilégios.
DO $guard$
DECLARE
  v record;
  v_quantidade integer := 0;
BEGIN
  FOR v IN
    SELECT c.relname AS tabela
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid
    WHERE n.nspname='rumo'
      AND c.relkind IN ('r','p')
      AND a.attname='usuario_id'
      AND a.attnum>0 AND NOT a.attisdropped
      AND c.relname NOT LIKE 'bkp_%'
      AND c.relname NOT IN ('solicitacoes_exclusao', 'usuarios_privilegiados')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_rumo_conta_encerrada ON rumo.%I',v.tabela);
    EXECUTE format(
      'CREATE TRIGGER trg_rumo_conta_encerrada BEFORE INSERT OR UPDATE ON rumo.%I ' ||
      'FOR EACH ROW EXECUTE FUNCTION rumo.bloquear_escrita_conta_encerrada()',
      v.tabela
    );
    v_quantidade := v_quantidade + 1;
  END LOOP;
  IF v_quantidade < 20 THEN
    RAISE EXCEPTION 'Cobertura insuficiente das tabelas de usuário: %', v_quantidade;
  END IF;
END
$guard$;

-- Ponto real da recriação automática do Rumo após autenticar:
-- colocar guarda ANTES de qualquer INSERT, mesmo quando chamada via RPC.
CREATE OR REPLACE FUNCTION rumo.garantir_usuario_rumo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rumo, pg_temp
AS $function$
DECLARE
  v_usuario_id uuid;
  v_plano_gratuito_id uuid;
BEGIN
  v_usuario_id := auth.uid();
  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM rumo.solicitacoes_exclusao
    WHERE usuario_id = v_usuario_id
      AND status = 'CONCLUIDA'
  ) THEN
    RAISE EXCEPTION 'RUMO_CONTA_ENCERRADA'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO rumo.configuracoes (
    usuario_id, frequencia_recebimento, tema, created_at
  )
  VALUES (v_usuario_id, 'semanal', 'dark', now())
  ON CONFLICT (usuario_id) DO NOTHING;

  SELECT id INTO v_plano_gratuito_id
  FROM rumo.planos
  WHERE codigo = 'GRATUITO' AND ativo = true
  LIMIT 1;
  IF v_plano_gratuito_id IS NULL THEN
    RAISE EXCEPTION 'Plano GRATUITO ativo não encontrado';
  END IF;

  INSERT INTO rumo.assinaturas (
    usuario_id, plano_id, status, inicio_em, vence_em,
    renovacao_automatica, preco_contratado, periodo_contratado,
    created_at, updated_at
  )
  VALUES (
    v_usuario_id, v_plano_gratuito_id, 'ATIVA', now(), null,
    false, 0.00, null, now(), now()
  )
  ON CONFLICT (usuario_id) DO NOTHING;
END;
$function$;

COMMIT;

-- Em SQL Editor homologação: simular com BEGIN; ... ROLLBACK;
-- Testes recomendados: verificar função + triggers em pg_catalog, tentar
-- INSERT de configuracoes para uma solicitação CONCLUIDA e confirmar erro
-- 'RUMO_CONTA_ENCERRADA' sem criar linha; login de conta ativa deve funcionar.
