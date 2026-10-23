-- Segurança financeira, PostgreSQL 15+: views públicas devem respeitar RLS.
-- Confirmado em 22/10/2026: views no schema public apresentavam
-- registros entre usuários mesmo com papel anon ou auth.uid() inexistente.
-- Testes em transação mostraram que security_invoker=true restringe
-- corretamente os resultados sem interromper uma conta autenticada válida.
--
-- Mudança sem remoção/alteração de dados e sem impacto em outros schemas.

alter view public.vw_dashboard set (security_invoker = true);
alter view public.vw_dividas_resumo set (security_invoker = true);
alter view public.vw_indice_rumo set (security_invoker = true);
alter view public.vw_objetivos_progresso set (security_invoker = true);

revoke all privileges on public.vw_dashboard,
  public.vw_dividas_resumo, public.vw_indice_rumo,
  public.vw_objetivos_progresso
from public, anon, authenticated;

grant select on public.vw_dashboard,
  public.vw_dividas_resumo, public.vw_indice_rumo,
  public.vw_objetivos_progresso
to authenticated;

-- Comportamento esperado:
-- anon: sem acesso a essas views
-- authenticated: SELECT somente dados permitidos pelo RLS
-- service_role: acesso administrativo sem mudança
