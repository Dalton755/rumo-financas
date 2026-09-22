create or replace function rumo.obter_painel_gerencial()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, rumo
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'Acesso negado'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from rumo.usuarios_privilegiados up
    where up.usuario_id = v_uid
      and up.papel = 'DONO'
      and up.ativo = true
  ) then
    raise exception 'Acesso negado'
      using errcode = '42501';
  end if;

  with
  clientes as (
    select
      u.id,
      u.email,
      u.created_at,
      u.last_sign_in_at
    from auth.users u
    where not exists (
      select 1
      from rumo.usuarios_privilegiados up
      where up.usuario_id = u.id
        and up.papel = 'DONO'
        and up.ativo = true
    )
  ),
  premium_ativos as (
    select distinct on (a.usuario_id)
      a.usuario_id,
      a.inicio_em,
      a.vence_em,
      a.preco_contratado,
      a.periodo_contratado,
      p.nome as plano_nome,
      p.preco_mensal,
      p.preco_anual
    from rumo.assinaturas a
    join rumo.planos p
      on p.id = a.plano_id
    join clientes c
      on c.id = a.usuario_id
    where a.status = 'ATIVA'
      and (
        a.vence_em is null
        or a.vence_em > now()
      )
      and p.codigo = 'PREMIUM'
    order by
      a.usuario_id,
      a.inicio_em desc
  ),
  metricas_clientes as (
    select
      count(*)::int as total,
      count(*) filter (
        where c.created_at >= now() - interval '7 days'
      )::int as novos_7_dias,
      count(*) filter (
        where c.created_at >= now() - interval '30 days'
      )::int as novos_30_dias,
      count(*) filter (
        where c.last_sign_in_at >= now() - interval '30 days'
      )::int as ativos_30_dias,
      count(pa.usuario_id)::int as premium,
      (
        count(*) -
        count(pa.usuario_id)
      )::int as gratuitos
    from clientes c
    left join premium_ativos pa
      on pa.usuario_id = c.id
  ),
  metricas_financeiras as (
    select
      coalesce(
        sum(
          case
            when pa.periodo_contratado = 'ANUAL'
              and pa.preco_contratado is not null
              then pa.preco_contratado / 12
            when pa.periodo_contratado = 'MENSAL'
              and pa.preco_contratado is not null
              then pa.preco_contratado
            else pa.preco_mensal
          end
        ),
        0
      )::numeric(14,2) as mrr_estimado
    from premium_ativos pa
  ),
  pagamentos_validos as (
    select p.*
    from rumo.pagamentos_assinaturas p
    where not exists (
      select 1
      from rumo.usuarios_privilegiados up
      where up.usuario_id = p.usuario_id
        and up.papel = 'DONO'
        and up.ativo = true
    )
  ),
  metricas_pagamentos as (
    select
      coalesce(
        sum(valor) filter (
          where status = 'APROVADO'
        ),
        0
      )::numeric(14,2) as receita_confirmada_total,
      coalesce(
        sum(valor) filter (
          where status = 'APROVADO'
            and coalesce(
              pago_em,
              atualizado_em,
              criado_em
            ) >= now() - interval '30 days'
        ),
        0
      )::numeric(14,2) as receita_confirmada_30_dias,
      coalesce(
        sum(valor) filter (
          where status = 'PENDENTE'
        ),
        0
      )::numeric(14,2) as valor_pendente,
      count(*) filter (
        where status = 'APROVADO'
      )::int as aprovados,
      count(*) filter (
        where status = 'PENDENTE'
      )::int as pendentes,
      count(*) filter (
        where status = 'RECUSADO'
      )::int as recusados
    from pagamentos_validos
  ),
  crescimento as (
    select
      gs::date as inicio_semana,
      count(c.id)::int as cadastros
    from generate_series(
      date_trunc('week', now()) - interval '7 weeks',
      date_trunc('week', now()),
      interval '1 week'
    ) gs
    left join clientes c
      on c.created_at >= gs
      and c.created_at < gs + interval '1 week'
    group by gs
    order by gs
  ),
  clientes_recentes as (
    select
      c.id,
      c.email,
      c.created_at,
      c.last_sign_in_at,
      case
        when pa.usuario_id is not null
          then 'PREMIUM'
        else 'GRATUITO'
      end as plano
    from clientes c
    left join premium_ativos pa
      on pa.usuario_id = c.id
    order by c.created_at desc
    limit 12
  ),
  pagamentos_recentes as (
    select
      p.id,
      coalesce(
        u.email,
        'Usuário removido'
      ) as email,
      pl.nome as plano,
      p.status,
      p.valor,
      p.moeda,
      p.periodo,
      p.pago_em,
      p.criado_em
    from pagamentos_validos p
    left join auth.users u
      on u.id = p.usuario_id
    left join rumo.planos pl
      on pl.id = p.plano_id
    order by p.criado_em desc
    limit 12
  )
  select jsonb_build_object(
    'atualizado_em',
      now(),
    'clientes',
      (
        select jsonb_build_object(
          'total', mc.total,
          'gratuitos', mc.gratuitos,
          'premium', mc.premium,
          'novos_7_dias', mc.novos_7_dias,
          'novos_30_dias', mc.novos_30_dias,
          'ativos_30_dias', mc.ativos_30_dias,
          'conversao_premium',
            case
              when mc.total > 0
                then round(
                  (
                    mc.premium::numeric /
                    mc.total::numeric
                  ) * 100,
                  2
                )
              else 0
            end
        )
        from metricas_clientes mc
      ),
    'financeiro',
      (
        select jsonb_build_object(
          'receita_confirmada_total',
            mp.receita_confirmada_total,
          'receita_confirmada_30_dias',
            mp.receita_confirmada_30_dias,
          'mrr_estimado',
            mf.mrr_estimado,
          'valor_pendente',
            mp.valor_pendente,
          'pagamentos_aprovados',
            mp.aprovados,
          'pagamentos_pendentes',
            mp.pendentes,
          'pagamentos_recusados',
            mp.recusados
        )
        from metricas_pagamentos mp
        cross join metricas_financeiras mf
      ),
    'planos',
      (
        select jsonb_build_array(
          jsonb_build_object(
            'codigo', 'GRATUITO',
            'nome', 'Gratuito',
            'quantidade', mc.gratuitos
          ),
          jsonb_build_object(
            'codigo', 'PREMIUM',
            'nome', 'Premium',
            'quantidade', mc.premium
          )
        )
        from metricas_clientes mc
      ),
    'crescimento',
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'inicio_semana',
                inicio_semana,
              'cadastros',
                cadastros
            )
            order by inicio_semana
          ),
          '[]'::jsonb
        )
        from crescimento
      ),
    'clientes_recentes',
      (
        select coalesce(
          jsonb_agg(
            to_jsonb(cr)
            order by cr.created_at desc
          ),
          '[]'::jsonb
        )
        from clientes_recentes cr
      ),
    'pagamentos_recentes',
      (
        select coalesce(
          jsonb_agg(
            to_jsonb(pr)
            order by pr.criado_em desc
          ),
          '[]'::jsonb
        )
        from pagamentos_recentes pr
      )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function rumo.obter_painel_gerencial()
  from public, anon;

grant execute on function rumo.obter_painel_gerencial()
  to authenticated, service_role;
