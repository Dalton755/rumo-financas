create or replace function rumo.gerar_ocorrencias_compromissos(
    p_ate date default (current_date + interval '120 days')::date
)
returns integer
language plpgsql
security definer
set search_path = public, rumo
as $$
declare
    v_usuario_id uuid;
    v_compromisso record;

    v_data date;
    v_proxima_data date;

    v_dia integer;
    v_ultimo_dia integer;

    v_valor_previsto numeric(14,2);

    v_inseridas integer := 0;
begin

    v_usuario_id := auth.uid();


    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;


    if p_ate is null then
        raise exception 'Informe uma data limite.';
    end if;


    for v_compromisso in

        select *
        from rumo.compromissos
        where usuario_id = v_usuario_id
          and ativo = true
        order by data_inicio

    loop

        if v_compromisso.data_inicio > p_ate then
            continue;
        end if;


        /*
         * Valor usado apenas como previsão.
         *
         * FIXO:
         * usa valor_padrao.
         *
         * VARIÁVEL:
         * usa valor_estimado.
         *
         * O valor real continua vazio até
         * o usuário informar/pagar.
         */
        if v_compromisso.tipo_valor = 'fixo' then

            v_valor_previsto :=
                v_compromisso.valor_padrao;

        else

            v_valor_previsto :=
                v_compromisso.valor_estimado;

        end if;


        v_data :=
            v_compromisso.data_inicio;


        /*
         * =================================================
         * SEMANAL
         * =================================================
         */
        if v_compromisso.frequencia = 'semanal' then

            while v_data <= p_ate loop

                insert into rumo.compromissos_ocorrencias (
                    usuario_id,
                    compromisso_id,
                    vencimento,
                    valor_previsto,
                    status
                )
                values (
                    v_usuario_id,
                    v_compromisso.id,
                    v_data,
                    v_valor_previsto,
                    'pendente'
                )
                on conflict (
                    compromisso_id,
                    vencimento
                )
                do nothing;


                if found then
                    v_inseridas :=
                        v_inseridas + 1;
                end if;


                v_data :=
                    v_data
                    + (
                        7
                        * greatest(
                            v_compromisso.intervalo,
                            1
                        )
                    );

            end loop;


        /*
         * =================================================
         * QUINZENAL
         * =================================================
         */
        elsif v_compromisso.frequencia = 'quinzenal' then

            while v_data <= p_ate loop

                insert into rumo.compromissos_ocorrencias (
                    usuario_id,
                    compromisso_id,
                    vencimento,
                    valor_previsto,
                    status
                )
                values (
                    v_usuario_id,
                    v_compromisso.id,
                    v_data,
                    v_valor_previsto,
                    'pendente'
                )
                on conflict (
                    compromisso_id,
                    vencimento
                )
                do nothing;


                if found then
                    v_inseridas :=
                        v_inseridas + 1;
                end if;


                v_data :=
                    v_data
                    + (
                        14
                        * greatest(
                            v_compromisso.intervalo,
                            1
                        )
                    );

            end loop;


        /*
         * =================================================
         * MENSAL
         * =================================================
         */
        elsif v_compromisso.frequencia = 'mensal' then

            while v_data <= p_ate loop

                /*
                 * Corrige vencimentos como dia 31 em meses
                 * que possuem somente 30, 29 ou 28 dias.
                 */
                v_dia :=
                    coalesce(
                        v_compromisso.dia_mes,
                        extract(
                            day
                            from v_data
                        )::integer
                    );


                v_ultimo_dia :=
                    extract(
                        day
                        from (
                            date_trunc(
                                'month',
                                v_data
                            )
                            +
                            interval '1 month'
                            -
                            interval '1 day'
                        )
                    )::integer;


                v_proxima_data :=
                    (
                        date_trunc(
                            'month',
                            v_data
                        )::date
                        +
                        (
                            least(
                                v_dia,
                                v_ultimo_dia
                            ) - 1
                        )
                    )::date;


                /*
                 * Não gera ocorrência anterior à
                 * data inicial do compromisso.
                 */
                if v_proxima_data >= v_compromisso.data_inicio
                   and v_proxima_data <= p_ate then

                    insert into rumo.compromissos_ocorrencias (
                        usuario_id,
                        compromisso_id,
                        vencimento,
                        valor_previsto,
                        status
                    )
                    values (
                        v_usuario_id,
                        v_compromisso.id,
                        v_proxima_data,
                        v_valor_previsto,
                        'pendente'
                    )
                    on conflict (
                        compromisso_id,
                        vencimento
                    )
                    do nothing;


                    if found then
                        v_inseridas :=
                            v_inseridas + 1;
                    end if;

                end if;


                v_data :=
                    (
                        date_trunc(
                            'month',
                            v_data
                        )
                        +
                        (
                            greatest(
                                v_compromisso.intervalo,
                                1
                            )
                            || ' months'
                        )::interval
                    )::date;

            end loop;


        /*
         * =================================================
         * ANUAL
         * =================================================
         */
        elsif v_compromisso.frequencia = 'anual' then

            while v_data <= p_ate loop

                insert into rumo.compromissos_ocorrencias (
                    usuario_id,
                    compromisso_id,
                    vencimento,
                    valor_previsto,
                    status
                )
                values (
                    v_usuario_id,
                    v_compromisso.id,
                    v_data,
                    v_valor_previsto,
                    'pendente'
                )
                on conflict (
                    compromisso_id,
                    vencimento
                )
                do nothing;


                if found then
                    v_inseridas :=
                        v_inseridas + 1;
                end if;


                v_data :=
                    (
                        v_data
                        +
                        (
                            greatest(
                                v_compromisso.intervalo,
                                1
                            )
                            || ' years'
                        )::interval
                    )::date;

            end loop;

        end if;

    end loop;


    return v_inseridas;

end;
$$;


grant execute
on function rumo.gerar_ocorrencias_compromissos(date)
to authenticated;
