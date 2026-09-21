-- Hardening de segurança do schema Rumo.
-- Aplicado inicialmente no banco e registrado na migration history em 21/09/2026.

revoke usage on schema rumo from public, anon;
grant usage on schema rumo to authenticated, service_role;

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'rumo'
      and tablename like 'bkp_%'
  loop
    execute format('alter table %I.%I enable row level security', 'rumo', r.tablename);
    execute format('revoke all privileges on table %I.%I from public, anon, authenticated', 'rumo', r.tablename);
  end loop;
end
$$;

alter view rumo.vw_saldo_atual set (security_invoker = true);
alter view rumo.vw_saldo_contas set (security_invoker = true);

revoke all privileges on table rumo.vw_saldo_atual from public, anon, authenticated;
revoke all privileges on table rumo.vw_saldo_contas from public, anon, authenticated;
grant select on table rumo.vw_saldo_atual to authenticated, service_role;
grant select on table rumo.vw_saldo_contas to authenticated, service_role;

revoke execute on all functions in schema rumo from public, anon;
grant execute on all functions in schema rumo to service_role;

do $$
declare
  r record;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'rumo'
      and p.prorettype <> 'pg_catalog.trigger'::regtype
      and p.proname not like '\_%'
  loop
    execute format('grant execute on function %s to authenticated', r.oid::regprocedure);
  end loop;
end
$$;

do $$
declare
  r record;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'rumo'
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) cfg
        where cfg like 'search_path=%'
      )
  loop
    execute format(
      'alter function %s set search_path = pg_catalog, rumo, public, extensions',
      r.oid::regprocedure
    );
  end loop;
end
$$;
