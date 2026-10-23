-- Etapa Play Store: solicitar exclusao de dados do app Rumo.
-- ARQUIVO DE HOMOLOGACAO: nao executar em producao sem aprovacao.
-- A identidade auth.users e compartilhada com outros aplicativos Nethanel.
-- Por isso este registro NAO executa exclusao automatica de auth.users.
-- Execucao deve depender de fluxo seguro para remover dados Rumo,
-- desconectar a Pluggy, tratar assinaturas Mercado Pago e validar retencoes.

create table if not exists rumo.solicitacoes_exclusao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDENTE'
    check (status in ('PENDENTE', 'EM_ANALISE', 'CONCLUIDA', 'CANCELADA')),
  solicitada_em timestamptz not null default now(),
  concluida_em timestamptz,
  anotacao_interna text
);

create unique index if not exists uq_rumo_exclusao_aberta
on rumo.solicitacoes_exclusao(usuario_id)
where status in ('PENDENTE', 'EM_ANALISE');

create index if not exists ix_rumo_exclusao_status_data
on rumo.solicitacoes_exclusao(status, solicitada_em);

alter table rumo.solicitacoes_exclusao enable row level security;

revoke all on rumo.solicitacoes_exclusao from public, anon, authenticated;
grant usage on schema rumo to authenticated;
grant select (id, usuario_id, status, solicitada_em, concluida_em)
  on rumo.solicitacoes_exclusao to authenticated;
grant insert (usuario_id)
  on rumo.solicitacoes_exclusao to authenticated;

drop policy if exists "Rumo exclusao: consultar propria solicitacao"
  on rumo.solicitacoes_exclusao;
create policy "Rumo exclusao: consultar propria solicitacao"
on rumo.solicitacoes_exclusao
for select to authenticated
using (usuario_id = (select auth.uid()));

drop policy if exists "Rumo exclusao: solicitar para si"
  on rumo.solicitacoes_exclusao;
create policy "Rumo exclusao: solicitar para si"
on rumo.solicitacoes_exclusao
for insert to authenticated
with check (usuario_id = (select auth.uid()));

-- Nenhuma policy publica de UPDATE ou DELETE. Operacoes administrativas
-- pela equipe em SQL autenticado/servico server-side e log auditavel.
-- NUNCA colocar service_role no cliente.
