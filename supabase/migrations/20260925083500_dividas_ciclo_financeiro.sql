create or replace function rumo.atualizar_alertas_dividas()
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
    v_restante numeric(14,2);
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
            p.id as parcela_id,
            p.divida_id,
            p.semana_referencia as vencimento,
            p.valor_previsto,
            coalesce(p.valor_pago, 0) as valor_pago,
            p.status,
            d.nome as divida_nome,
            d.credor
        from rumo.plano_quitacao p
        join rumo.dividas d
          on d.id = p.divida_id
         and d.usuario_id = v_usuario_id
         and d.status <> 'quitada'
        where p.status <> 'pago'
          and p.semana_referencia <= v_hoje + 7
        order by p.semana_referencia asc, p.created_at asc
    loop
        v_dias := v_item.vencimento - v_hoje;
        v_restante := greatest(
            coalesce(v_item.valor_previsto, 0) -
            coalesce(v_item.valor_pago, 0),
            0
        );

        if v_restante <= 0 then
            continue;
        end if;

        v_chave := 'DIVIDA_PARCELA:' || v_item.parcela_id::text;
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
            'DIVIDA_PARCELA',
            case
                when v_dias < 0 then 'Parcela de dívida atrasada'
                when v_dias = 0 then 'Parcela de dívida vence hoje'
                when v_dias = 1 then 'Parcela de dívida vence amanhã'
                else 'Parcela de dívida vence em ' || v_dias || ' dias'
            end,
            v_item.divida_nome || ' • ' || to_char(v_item.vencimento, 'DD/MM/YYYY'),
            v_chave,
            case
                when v_dias <= 0 then 'critico'
                when v_dias = 1 then 'atencao'
                else 'informacao'
            end,
            '/dividas',
            true,
            false,
            jsonb_build_object(
                'parcela_id', v_item.parcela_id,
                'divida_id', v_item.divida_id,
                'divida', v_item.divida_nome,
                'credor', v_item.credor,
                'vencimento', v_item.vencimento,
                'dias_restantes', v_dias,
                'valor_previsto', v_item.valor_previsto,
                'valor_pago', v_item.valor_pago,
                'valor_restante', v_restante
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
                  or a.nivel is distinct from excluded.nivel
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
      and chave like 'DIVIDA_PARCELA:%'
      and not (chave = any(v_chaves_ativas));

    return jsonb_build_object(
        'hoje', v_hoje,
        'processados', v_processados
    );
end;
$function$;

revoke execute on function rumo.atualizar_alertas_dividas() from public;
revoke execute on function rumo.atualizar_alertas_dividas() from anon;
grant execute on function rumo.atualizar_alertas_dividas() to authenticated;


create or replace function rumo.pagar_parcela_divida(
    p_parcela_id uuid,
    p_conta_id uuid,
    p_data_pagamento date default null
)
returns jsonb
language plpgsql
security invoker
set search_path = 'rumo', 'public'
as $function$
declare
    v_usuario_id uuid;
    v_parcela record;
    v_valor numeric(14,2);
    v_data date;
    v_movimentacao_id uuid;
    v_novo_pago numeric(14,2);
    v_novo_previsto numeric(14,2);
begin
    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    select
        p.id,
        p.divida_id,
        p.valor_previsto,
        coalesce(p.valor_pago, 0) as valor_pago,
        p.status,
        d.nome as divida_nome,
        d.saldo_atual
    into v_parcela
    from rumo.plano_quitacao p
    join rumo.dividas d
      on d.id = p.divida_id
     and d.usuario_id = v_usuario_id
    where p.id = p_parcela_id
    for update of p, d;

    if not found then
        raise exception 'Parcela não encontrada.';
    end if;

    if v_parcela.status = 'pago' then
        raise exception 'Esta parcela já está paga.';
    end if;

    if not exists (
        select 1
        from rumo.contas c
        where c.id = p_conta_id
          and c.usuario_id = v_usuario_id
          and c.ativo = true
    ) then
        raise exception 'Conta inválida.';
    end if;

    v_valor := least(
        greatest(
            coalesce(v_parcela.valor_previsto, 0) -
            coalesce(v_parcela.valor_pago, 0),
            0
        ),
        greatest(
            coalesce(v_parcela.saldo_atual, 0),
            0
        )
    );

    if v_valor <= 0 then
        raise exception 'Não há valor pendente para esta parcela.';
    end if;

    v_data := coalesce(
        p_data_pagamento,
        (now() at time zone 'America/Sao_Paulo')::date
    );

    insert into rumo.movimentacoes (
        usuario_id,
        conta_id,
        categoria_id,
        descricao,
        valor,
        tipo,
        data_movimentacao,
        observacao,
        origem,
        origem_referencia
    )
    values (
        v_usuario_id,
        p_conta_id,
        null,
        'Pagamento dívida • ' || v_parcela.divida_nome,
        v_valor,
        'pagamento_divida',
        v_data,
        'Pagamento do plano de quitação',
        'divida_plano',
        p_parcela_id::text
    )
    returning id into v_movimentacao_id;

    v_novo_pago := coalesce(v_parcela.valor_pago, 0) + v_valor;

    v_novo_previsto := case
        when v_novo_pago < v_parcela.valor_previsto
         and v_valor = v_parcela.saldo_atual
        then v_novo_pago
        else v_parcela.valor_previsto
    end;

    update rumo.plano_quitacao
    set
        valor_previsto = v_novo_previsto,
        valor_pago = v_novo_pago,
        updated_at = now()
    where id = p_parcela_id;

    return jsonb_build_object(
        'parcela_id', p_parcela_id,
        'divida_id', v_parcela.divida_id,
        'movimentacao_id', v_movimentacao_id,
        'valor_pago', v_valor,
        'data_pagamento', v_data
    );
end;
$function$;

revoke execute on function rumo.pagar_parcela_divida(uuid, uuid, date) from public;
revoke execute on function rumo.pagar_parcela_divida(uuid, uuid, date) from anon;
grant execute on function rumo.pagar_parcela_divida(uuid, uuid, date) to authenticated;


create or replace function rumo.pagar_divida_avulsa(
    p_divida_id uuid,
    p_conta_id uuid,
    p_valor numeric,
    p_data_pagamento date default null
)
returns jsonb
language plpgsql
security invoker
set search_path = 'rumo', 'public'
as $function$
declare
    v_usuario_id uuid;
    v_divida record;
    v_valor numeric(14,2);
    v_data date;
    v_movimentacao_id uuid;
begin
    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    select
        d.id,
        d.nome,
        d.saldo_atual,
        d.status
    into v_divida
    from rumo.dividas d
    where d.id = p_divida_id
      and d.usuario_id = v_usuario_id
    for update;

    if not found then
        raise exception 'Dívida não encontrada.';
    end if;

    if v_divida.status = 'quitada'
       or coalesce(v_divida.saldo_atual, 0) <= 0 then
        raise exception 'Esta dívida já está quitada.';
    end if;

    if not exists (
        select 1
        from rumo.contas c
        where c.id = p_conta_id
          and c.usuario_id = v_usuario_id
          and c.ativo = true
    ) then
        raise exception 'Conta inválida.';
    end if;

    v_valor := coalesce(p_valor, 0);

    if v_valor <= 0 then
        raise exception 'Informe um pagamento maior que zero.';
    end if;

    if v_valor > v_divida.saldo_atual then
        raise exception 'O pagamento não pode ser maior que o saldo devedor.';
    end if;

    v_data := coalesce(
        p_data_pagamento,
        (now() at time zone 'America/Sao_Paulo')::date
    );

    insert into rumo.movimentacoes (
        usuario_id,
        conta_id,
        categoria_id,
        descricao,
        valor,
        tipo,
        data_movimentacao,
        observacao,
        origem,
        origem_referencia
    )
    values (
        v_usuario_id,
        p_conta_id,
        null,
        'Pagamento dívida • ' || v_divida.nome,
        v_valor,
        'pagamento_divida',
        v_data,
        'Pagamento avulso de dívida',
        'divida_avulsa',
        p_divida_id::text
    )
    returning id into v_movimentacao_id;

    update rumo.dividas
    set
        saldo_atual = saldo_atual - v_valor,
        updated_at = now()
    where id = p_divida_id;

    return jsonb_build_object(
        'divida_id', p_divida_id,
        'movimentacao_id', v_movimentacao_id,
        'valor_pago', v_valor,
        'data_pagamento', v_data
    );
end;
$function$;

revoke execute on function rumo.pagar_divida_avulsa(uuid, uuid, numeric, date) from public;
revoke execute on function rumo.pagar_divida_avulsa(uuid, uuid, numeric, date) from anon;
grant execute on function rumo.pagar_divida_avulsa(uuid, uuid, numeric, date) to authenticated;
