create table if not exists rumo.usuarios_privilegiados (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  papel varchar(20) not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint usuarios_privilegiados_papel_check
    check (papel in ('DONO'))
);

alter table rumo.usuarios_privilegiados enable row level security;

revoke all on table rumo.usuarios_privilegiados from public, anon, authenticated;
grant select, insert, update, delete on table rumo.usuarios_privilegiados to service_role;

insert into rumo.usuarios_privilegiados (
  usuario_id,
  papel,
  ativo
)
select
  id,
  'DONO',
  true
from auth.users
where lower(email) = lower('rochadalton00@gmail.com')
on conflict (usuario_id)
do update set
  papel = excluded.papel,
  ativo = true,
  atualizado_em = now();

create or replace function rumo.usuario_e_dono()
returns boolean
language sql
stable
security definer
set search_path = rumo, pg_catalog
as $$
  select exists (
    select 1
    from rumo.usuarios_privilegiados up
    where up.usuario_id = auth.uid()
      and up.papel = 'DONO'
      and up.ativo = true
  );
$$;

revoke all on function rumo.usuario_e_dono() from public, anon;
grant execute on function rumo.usuario_e_dono() to authenticated, service_role;

create or replace function rumo.usuario_tem_recurso(
  p_codigo_recurso character varying
)
returns boolean
language plpgsql
stable
security definer
set search_path = rumo, pg_catalog
as $$
declare
  v_usuario_id uuid;
  v_plano_id uuid;
  v_tem_recurso boolean;
begin
  v_usuario_id := auth.uid();

  if v_usuario_id is null then
    return false;
  end if;

  if rumo.usuario_e_dono() then
    return exists (
      select 1
      from rumo.recursos r
      where r.codigo = p_codigo_recurso
        and r.ativo = true
    );
  end if;

  select a.plano_id
    into v_plano_id
  from rumo.assinaturas a
  where a.usuario_id = v_usuario_id
    and a.status = 'ATIVA'
    and (
      a.vence_em is null
      or a.vence_em > now()
    )
  limit 1;

  if v_plano_id is null then
    select p.id
      into v_plano_id
    from rumo.planos p
    where p.codigo = 'GRATUITO'
      and p.ativo = true
    limit 1;
  end if;

  select exists (
    select 1
    from rumo.plano_recursos pr
    join rumo.recursos r
      on r.id = pr.recurso_id
    where pr.plano_id = v_plano_id
      and pr.ativo = true
      and r.ativo = true
      and r.codigo = p_codigo_recurso
  )
  into v_tem_recurso;

  return coalesce(v_tem_recurso, false);
end;
$$;

revoke all on function rumo.usuario_tem_recurso(character varying)
  from public, anon;
grant execute on function rumo.usuario_tem_recurso(character varying)
  to authenticated, service_role;
