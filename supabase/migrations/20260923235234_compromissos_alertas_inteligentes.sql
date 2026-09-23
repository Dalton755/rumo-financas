create or replace function rumo.atualizar_alertas_compromissos()
returns jsonb
language plpgsql
security invoker
set search_path = 'rumo', 'public'
as $function$
declare
    v_usuario_id uuid;
    v_hoje date;
    v_item record;
    v_chave text;
    v_chaves_ativas text[] := array[]::text[];
    v_dias integer;
    v_valor numeric(14,2);
    v_processados integer := 0;
begin
    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    if not rumo.usuario_tem_recurso('ALERTAS_INTELIGENTES') then
        raise exception 'Recurso não disponível no plano atual.';
    end if;

    v_hoje := (now() at time zone 'America/Sao_Paulo')::date;

    for v_item in
        select
            o.id as ocorrencia_id,
            o.compromisso_id,
            o.vencimento,
            o.valor_previsto,
            o.valor_real,
            c.nome
        from rumo.compromissos_ocorrencias o
        join rumo.compromissos c
          on c.id = o.compromisso_id
         and c.usuario_id = v_usuario_id
         and c.ativo = true
        where o.usuario_id = v_usuario_id
          and o.status = 'pendente'
          and o.vencimento >= v_hoje
          and o.vencimento <= v_hoje + 7
        order by o.vencimento asc, o.created_at asc
    loop
        v_dias := v_item.vencimento - v_hoje;
        v_valor := coalesce(v_item.valor_real, v_item.valor_previsto, 0);
        v_chave := 'COMPROMISSO:' || v_item.ocorrencia_id::text;

        v_chaves_ativas := array_append(v_chaves_ativas, v_chave);

        insert into rumo.alertas as a (
            usuario_id,
            tipo,
            titulo,
            descricao,
            chave,
            nivel,
            rota,
            ativo,
            lido,
            dados,
            updated_at,
            resolvido_em
        )
        values (
            v_usuario_id,
            'COMPROMISSO',
            case
                when v_dias = 0 then 'Compromisso vence hoje'
                when v_dias = 1 then 'Compromisso vence amanhã'
                else 'Compromisso vence em ' || v_dias || ' dias'
            end,
            v_item.nome || ' • vencimento em ' || to_char(v_item.vencimento, 'DD/MM/YYYY'),
            v_chave,
            case
                when v_dias = 0 then 'critico'
                when v_dias = 1 then 'atencao'
                else 'informacao'
            end,
            '/compromissos',
            true,
            false,
            jsonb_build_object(
                'ocorrencia_id', v_item.ocorrencia_id,
                'compromisso_id', v_item.compromisso_id,
                'vencimento', v_item.vencimento,
                'dias_restantes', v_dias,
                'valor_total', v_valor
            ),
            now(),
            null
        )
        on conflict (usuario_id, chave)
        where chave is not null
        do update set
            tipo = excluded.tipo,
            titulo = excluded.titulo,
            descricao = excluded.descricao,
            nivel = excluded.nivel,
            rota = excluded.rota,
            ativo = true,
            lido = case
                when a.dados is distinct from excluded.dados
                  or a.ativo = false
                then false
                else a.lido
            end,
            created_at = case
                when a.ativo = false then now()
                else a.created_at
            end,
            updated_at = now(),
            resolvido_em = null,
            dados = excluded.dados;

        v_processados := v_processados + 1;
    end loop;

    update rumo.alertas
    set
        ativo = false,
        resolvido_em = coalesce(resolvido_em, now()),
        updated_at = now()
    where usuario_id = v_usuario_id
      and ativo = true
      and chave like 'COMPROMISSO:%'
      and not (chave = any(v_chaves_ativas));

    return jsonb_build_object(
        'hoje', v_hoje,
        'processados', v_processados
    );
end;
$function$;

revoke execute on function rumo.atualizar_alertas_compromissos() from public;
grant execute on function rumo.atualizar_alertas_compromissos() to authenticated;
