create or replace function rumo._obter_inteligencia_financeira_base()
returns jsonb
language plpgsql
security definer
set search_path to 'rumo', 'public'
as $function$
declare
    v_usuario_id uuid;
    v_hoje date;
    v_mes_calendario date;
    v_mes_analise date;
    v_fim_analise date;
    v_mes_anterior date;
    v_fim_comparacao_anterior date;
    v_usando_ultimo_mes boolean := false;

    v_receitas_atual numeric := 0;
    v_despesas_atual numeric := 0;
    v_despesas_cartao_atual numeric := 0;
    v_saldo_atual numeric := 0;

    v_receitas_anterior numeric := 0;
    v_despesas_anterior numeric := 0;
    v_despesas_cartao_anterior numeric := 0;
    v_saldo_anterior numeric := 0;

    v_taxa_economia numeric;
    v_variacao_receitas numeric;
    v_variacao_despesas numeric;

    v_categoria_top text;
    v_categoria_top_valor numeric := 0;
    v_saldo_contas numeric := 0;

    v_receitas_futuras numeric := 0;
    v_despesas_futuras numeric := 0;
    v_despesas_cartao_futuras numeric := 0;
begin
    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    v_hoje := rumo.data_financeira_atual();
    v_mes_calendario := date_trunc('month', v_hoje)::date;

    /*
     * Quando o mês acabou de virar e ainda não existe lançamento
     * realizado no novo mês, a leitura histórica continua usando
     * o último mês que possui dados. O saldo real e o futuro
     * permanecem ancorados na data de hoje.
     */
    if exists (
        select 1
        from rumo.movimentacoes m
        where m.usuario_id = v_usuario_id
          and m.data_movimentacao >= v_mes_calendario
          and m.data_movimentacao <= v_hoje

        union all

        select 1
        from rumo.parcelas_cartao p
        join rumo.compras_cartao compra
          on compra.id = p.compra_id
         and compra.usuario_id = p.usuario_id
        where p.usuario_id = v_usuario_id
          and compra.status = 'ativa'
          and p.status in ('pendente','paga')
          and (
              case
                  when date_trunc('month', compra.data_compra)::date = p.competencia
                      then compra.data_compra
                  else p.competencia
              end
          ) >= v_mes_calendario
          and (
              case
                  when date_trunc('month', compra.data_compra)::date = p.competencia
                      then compra.data_compra
                  else p.competencia
              end
          ) <= v_hoje
        limit 1
    ) then
        v_mes_analise := v_mes_calendario;
    else
        select max(date_trunc('month', fonte.data_evento)::date)
        into v_mes_analise
        from (
            select m.data_movimentacao as data_evento
            from rumo.movimentacoes m
            where m.usuario_id = v_usuario_id
              and m.data_movimentacao <= v_hoje

            union all

            select
                case
                    when date_trunc('month', compra.data_compra)::date = p.competencia
                        then compra.data_compra
                    else p.competencia
                end as data_evento
            from rumo.parcelas_cartao p
            join rumo.compras_cartao compra
              on compra.id = p.compra_id
             and compra.usuario_id = p.usuario_id
            where p.usuario_id = v_usuario_id
              and compra.status = 'ativa'
              and p.status in ('pendente','paga')
              and (
                  case
                      when date_trunc('month', compra.data_compra)::date = p.competencia
                          then compra.data_compra
                      else p.competencia
                  end
              ) <= v_hoje
        ) fonte;

        if v_mes_analise is null then
            v_mes_analise := v_mes_calendario;
        end if;

        v_usando_ultimo_mes := v_mes_analise < v_mes_calendario;
    end if;

    if v_mes_analise = v_mes_calendario then
        v_fim_analise := v_hoje;
    else
        v_fim_analise := (v_mes_analise + interval '1 month - 1 day')::date;
    end if;

    v_mes_anterior := (v_mes_analise - interval '1 month')::date;

    v_fim_comparacao_anterior := least(
        (v_mes_analise - interval '1 day')::date,
        (
            v_mes_anterior +
            (extract(day from v_fim_analise)::integer - 1)
        )::date
    );

    select
        coalesce(sum(valor) filter (where tipo = 'receita'), 0),
        coalesce(sum(valor) filter (
            where tipo in ('despesa','pagamento_divida','aporte_objetivo')
              and coalesce(origem,'') <> 'cartao_fatura'
        ), 0)
    into v_receitas_atual, v_despesas_atual
    from rumo.movimentacoes
    where usuario_id = v_usuario_id
      and data_movimentacao >= v_mes_analise
      and data_movimentacao <= v_fim_analise;

    select coalesce(sum(p.valor), 0)
    into v_despesas_cartao_atual
    from rumo.parcelas_cartao p
    join rumo.compras_cartao compra
      on compra.id = p.compra_id
     and compra.usuario_id = p.usuario_id
    where p.usuario_id = v_usuario_id
      and compra.status = 'ativa'
      and p.status in ('pendente','paga')
      and (
          case
              when date_trunc('month', compra.data_compra)::date = p.competencia
                  then compra.data_compra
              else p.competencia
          end
      ) >= v_mes_analise
      and (
          case
              when date_trunc('month', compra.data_compra)::date = p.competencia
                  then compra.data_compra
              else p.competencia
          end
      ) <= v_fim_analise;

    v_despesas_atual := v_despesas_atual + v_despesas_cartao_atual;
    v_saldo_atual := v_receitas_atual - v_despesas_atual;

    select
        coalesce(sum(valor) filter (where tipo = 'receita'), 0),
        coalesce(sum(valor) filter (
            where tipo in ('despesa','pagamento_divida','aporte_objetivo')
              and coalesce(origem,'') <> 'cartao_fatura'
        ), 0)
    into v_receitas_anterior, v_despesas_anterior
    from rumo.movimentacoes
    where usuario_id = v_usuario_id
      and data_movimentacao >= v_mes_anterior
      and data_movimentacao <= v_fim_comparacao_anterior;

    select coalesce(sum(p.valor), 0)
    into v_despesas_cartao_anterior
    from rumo.parcelas_cartao p
    join rumo.compras_cartao compra
      on compra.id = p.compra_id
     and compra.usuario_id = p.usuario_id
    where p.usuario_id = v_usuario_id
      and compra.status = 'ativa'
      and p.status in ('pendente','paga')
      and (
          case
              when date_trunc('month', compra.data_compra)::date = p.competencia
                  then compra.data_compra
              else p.competencia
          end
      ) >= v_mes_anterior
      and (
          case
              when date_trunc('month', compra.data_compra)::date = p.competencia
                  then compra.data_compra
              else p.competencia
          end
      ) <= v_fim_comparacao_anterior;

    v_despesas_anterior := v_despesas_anterior + v_despesas_cartao_anterior;
    v_saldo_anterior := v_receitas_anterior - v_despesas_anterior;

    if v_receitas_atual > 0 then
        v_taxa_economia := round((v_saldo_atual / v_receitas_atual) * 100, 2);
    else
        v_taxa_economia := null;
    end if;

    if v_receitas_anterior > 0 then
        v_variacao_receitas := round(((v_receitas_atual - v_receitas_anterior) / v_receitas_anterior) * 100, 2);
    else
        v_variacao_receitas := null;
    end if;

    if v_despesas_anterior > 0 then
        v_variacao_despesas := round(((v_despesas_atual - v_despesas_anterior) / v_despesas_anterior) * 100, 2);
    else
        v_variacao_despesas := null;
    end if;

    select c.nome, sum(g.valor)
    into v_categoria_top, v_categoria_top_valor
    from (
        select m.categoria_id, m.valor
        from rumo.movimentacoes m
        where m.usuario_id = v_usuario_id
          and m.tipo in ('despesa','pagamento_divida','aporte_objetivo')
          and coalesce(m.origem,'') <> 'cartao_fatura'
          and m.data_movimentacao >= v_mes_analise
          and m.data_movimentacao <= v_fim_analise

        union all

        select compra.categoria_id, p.valor
        from rumo.parcelas_cartao p
        join rumo.compras_cartao compra
          on compra.id = p.compra_id
         and compra.usuario_id = p.usuario_id
        where p.usuario_id = v_usuario_id
          and compra.status = 'ativa'
          and p.status in ('pendente','paga')
          and (
              case
                  when date_trunc('month', compra.data_compra)::date = p.competencia
                      then compra.data_compra
                  else p.competencia
              end
          ) >= v_mes_analise
          and (
              case
                  when date_trunc('month', compra.data_compra)::date = p.competencia
                      then compra.data_compra
                  else p.competencia
              end
          ) <= v_fim_analise
    ) g
    join rumo.categorias c on c.id = g.categoria_id
    where g.categoria_id is not null
    group by c.id, c.nome
    order by sum(g.valor) desc
    limit 1;

    v_categoria_top_valor := coalesce(v_categoria_top_valor, 0);

    select coalesce(
        sum(
            c.saldo_inicial +
            coalesce((
                select sum(
                    case
                        when m.tipo = 'receita' then m.valor
                        when m.tipo in ('despesa','pagamento_divida','aporte_objetivo') then -m.valor
                        else 0
                    end
                )
                from rumo.movimentacoes m
                where m.conta_id = c.id
                  and m.usuario_id = v_usuario_id
                  and m.data_movimentacao <= v_hoje
            ),0)
        ),0
    )
    into v_saldo_contas
    from rumo.contas c
    where c.usuario_id = v_usuario_id;

    select
        coalesce(sum(valor) filter (where tipo = 'receita'),0),
        coalesce(sum(valor) filter (
            where tipo in ('despesa','pagamento_divida','aporte_objetivo')
              and coalesce(origem,'') <> 'cartao_fatura'
        ),0)
    into v_receitas_futuras, v_despesas_futuras
    from rumo.movimentacoes
    where usuario_id = v_usuario_id
      and data_movimentacao > v_hoje
      and data_movimentacao <= (v_hoje + interval '30 days')::date;

    select coalesce(sum(p.valor),0)
    into v_despesas_cartao_futuras
    from rumo.parcelas_cartao p
    join rumo.compras_cartao compra
      on compra.id = p.compra_id
     and compra.usuario_id = p.usuario_id
    where p.usuario_id = v_usuario_id
      and compra.status = 'ativa'
      and p.status = 'pendente'
      and p.vencimento > v_hoje
      and p.vencimento <= (v_hoje + interval '30 days')::date;

    v_despesas_futuras := v_despesas_futuras + v_despesas_cartao_futuras;

    return jsonb_build_object(
        'periodo', jsonb_build_object(
            'hoje', v_hoje,
            'mes_calendario', v_mes_calendario,
            'mes_referencia', v_mes_analise,
            'fim_referencia', v_fim_analise,
            'mes_anterior', v_mes_anterior,
            'fim_comparacao_anterior', v_fim_comparacao_anterior,
            'usando_ultimo_mes_com_dados', v_usando_ultimo_mes
        ),
        'mes_atual', jsonb_build_object(
            'receitas', v_receitas_atual,
            'despesas', v_despesas_atual,
            'saldo', v_saldo_atual,
            'taxa_economia_pct', v_taxa_economia
        ),
        'mes_anterior', jsonb_build_object(
            'receitas', v_receitas_anterior,
            'despesas', v_despesas_anterior,
            'saldo', v_saldo_anterior
        ),
        'comparacao', jsonb_build_object(
            'variacao_receitas_pct', v_variacao_receitas,
            'variacao_despesas_pct', v_variacao_despesas
        ),
        'maior_categoria_despesa',
            case
                when v_categoria_top is null then null
                else jsonb_build_object(
                    'categoria', v_categoria_top,
                    'valor', v_categoria_top_valor
                )
            end,
        'saldo_real_contas', v_saldo_contas,
        'proximos_30_dias', jsonb_build_object(
            'receitas_previstas', v_receitas_futuras,
            'despesas_previstas', v_despesas_futuras,
            'saldo_previsto', v_receitas_futuras - v_despesas_futuras
        )
    );
end;
$function$;
