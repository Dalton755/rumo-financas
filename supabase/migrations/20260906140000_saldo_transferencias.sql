begin;


-- =========================================================
-- SALDO REAL DE UMA CONTA
-- =========================================================

create or replace function rumo.calcular_saldo_conta(
    p_usuario_id uuid,
    p_conta_id uuid,
    p_ate date default current_date
)
returns numeric
language sql
stable
set search_path = rumo, public
as $function$

    select

        coalesce(
            c.saldo_inicial,
            0
        )

        +

        /*
         * Entradas e saídas cuja conta
         * é a conta principal da movimentação.
         */
        coalesce(
            (
                select
                    sum(
                        case

                            when m.tipo = 'receita'
                                then m.valor

                            when m.tipo in (
                                'despesa',
                                'pagamento_divida',
                                'aporte_objetivo'
                            )
                                then -m.valor

                            /*
                             * Transferência:
                             * conta_id representa a origem.
                             */
                            when m.tipo = 'transferencia'
                                then -m.valor

                            else 0

                        end
                    )

                from rumo.movimentacoes m

                where m.usuario_id =
                      p_usuario_id

                  and m.conta_id =
                      p_conta_id

                  and m.data_movimentacao <=
                      p_ate
            ),
            0
        )

        +

        /*
         * Transferências recebidas.
         *
         * conta_destino_id representa
         * a conta que recebeu o dinheiro.
         */
        coalesce(
            (
                select
                    sum(m.valor)

                from rumo.movimentacoes m

                where m.usuario_id =
                      p_usuario_id

                  and m.tipo =
                      'transferencia'

                  and m.conta_destino_id =
                      p_conta_id

                  and m.data_movimentacao <=
                      p_ate
            ),
            0
        )

    from rumo.contas c

    where c.id =
          p_conta_id

      and c.usuario_id =
          p_usuario_id;

$function$;


-- =========================================================
-- DASHBOARD
-- =========================================================

create or replace function rumo.obter_dashboard(
    p_usuario_id uuid,
    p_ano integer,
    p_mes integer
)
returns table(
    saldo_total numeric,
    receitas_mes numeric,
    despesas_mes numeric,
    indice_rumo integer
)
language sql
stable
as $function$

with data_atual as (

    select
        rumo.data_financeira_atual()
            as hoje

),

movimentacoes_mes as (

    select
        m.tipo,
        m.valor,
        m.origem

    from rumo.movimentacoes m

    where m.usuario_id =
          p_usuario_id

      and extract(
            year
            from m.data_movimentacao
          ) = p_ano

      and extract(
            month
            from m.data_movimentacao
          ) = p_mes

),

parcelas_cartao_mes as (

    select
        p.valor

    from rumo.parcelas_cartao p

    join rumo.compras_cartao compra
        on compra.id =
           p.compra_id

       and compra.usuario_id =
           p.usuario_id

    where p.usuario_id =
          p_usuario_id

      and compra.status =
          'ativa'

      and p.status in (
          'pendente',
          'paga'
      )

      and extract(
            year
            from p.competencia
          ) = p_ano

      and extract(
            month
            from p.competencia
          ) = p_mes

),

resumo_mes as (

    select

        coalesce(
            (
                select
                    sum(valor)

                from movimentacoes_mes

                where tipo =
                      'receita'
            ),
            0
        ) as receitas_mes,


        (
            coalesce(
                (
                    select
                        sum(valor)

                    from movimentacoes_mes

                    where tipo =
                          'despesa'

                      and coalesce(
                            origem,
                            ''
                          ) <>
                          'cartao_fatura'
                ),
                0
            )

            +

            coalesce(
                (
                    select
                        sum(valor)

                    from parcelas_cartao_mes
                ),
                0
            )

        ) as despesas_mes

),

saldo_real as (

    select

        coalesce(
            sum(
                rumo.calcular_saldo_conta(
                    p_usuario_id,
                    conta.id,
                    data.hoje
                )
            ),
            0
        ) as saldo_total

    from rumo.contas conta

    cross join data_atual data

    where conta.usuario_id =
          p_usuario_id

),

resultado as (

    select

        saldo_real.saldo_total,

        resumo_mes.receitas_mes,

        resumo_mes.despesas_mes,

        least(
            100,

            greatest(
                0,

                (
                    (
                        resumo_mes.receitas_mes
                        -
                        resumo_mes.despesas_mes
                    )

                    /

                    greatest(
                        resumo_mes.receitas_mes,
                        1
                    )

                    * 100
                )
            )
        )::integer
            as indice_rumo

    from resumo_mes

    cross join saldo_real

)

select
    saldo_total,
    receitas_mes,
    despesas_mes,
    indice_rumo

from resultado;

$function$;


commit;