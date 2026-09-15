create or replace function rumo.atualizar_alertas_compromissos()
returns jsonb
language plpgsql
security definer
set search_path = rumo, public
as $$
declare

    v_usuario_id uuid;
    v_hoje date;

    v_chave text;

    v_chaves_ativas text[] :=
        array[]::text[];

    v_dias integer;

    v_valor numeric;

    v_processados integer := 0;

    r record;

begin

    -- =====================================================
    -- USUÁRIO
    -- =====================================================

    v_usuario_id :=
        auth.uid();


    if v_usuario_id is null then
        raise exception
            'Usuário não autenticado';
    end if;


    -- =====================================================
    -- RECURSO PREMIUM
    -- =====================================================

    if not rumo.usuario_tem_recurso(
        'ALERTAS_INTELIGENTES'
    ) then

        raise exception
            'Recurso não disponível no plano atual';

    end if;


    -- =====================================================
    -- DATA FINANCEIRA
    -- =====================================================

    v_hoje :=
        rumo.data_financeira_atual();


    -- =====================================================
    -- OCORRÊNCIAS PENDENTES
    --
    -- Só analisamos:
    --   atrasadas
    --   vence hoje
    --   próximos 3 dias
    -- =====================================================

    for r in

        select

            o.id
                as ocorrencia_id,

            o.compromisso_id,

            o.vencimento,

            o.valor_previsto,

            o.valor_real,

            c.nome
                as compromisso_nome,

            c.tipo_valor,

            cat.nome
                as categoria

        from rumo.compromissos_ocorrencias o

        join rumo.compromissos c
            on c.id =
                o.compromisso_id

        left join rumo.categorias cat
            on cat.id =
                c.categoria_id

        where
            o.usuario_id =
                v_usuario_id

            and c.usuario_id =
                v_usuario_id

            and c.ativo =
                true

            and o.status =
                'pendente'

            and o.vencimento <=
                (
                    v_hoje
                    +
                    interval '3 days'
                )::date

        order by
            o.vencimento

    loop

        v_dias :=
            r.vencimento -
            v_hoje;


        v_valor :=
            coalesce(
                r.valor_real,
                r.valor_previsto
            );


        v_chave :=
            'COMPROMISSO:'
            ||
            r.ocorrencia_id::text;


        v_chaves_ativas :=
            array_append(
                v_chaves_ativas,
                v_chave
            );


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

                when v_dias < 0 then

                    case

                        when abs(v_dias) = 1 then
                            r.compromisso_nome
                            ||
                            ' está atrasado há 1 dia'

                        else
                            r.compromisso_nome
                            ||
                            ' está atrasado há '
                            ||
                            abs(v_dias)
                            ||
                            ' dias'

                    end


                when v_dias = 0 then

                    r.compromisso_nome
                    ||
                    ' vence hoje'


                when v_dias = 1 then

                    r.compromisso_nome
                    ||
                    ' vence amanhã'


                else

                    r.compromisso_nome
                    ||
                    ' vence em '
                    ||
                    v_dias
                    ||
                    ' dias'

            end,


            case

                when v_dias < 0 then

                    'Existe um compromisso pendente com vencimento em '
                    ||
                    to_char(
                        r.vencimento,
                        'DD/MM/YYYY'
                    )
                    ||
                    '.'


                when v_dias = 0 then

                    'Este compromisso vence hoje.'


                else

                    'Este compromisso vence em '
                    ||
                    to_char(
                        r.vencimento,
                        'DD/MM/YYYY'
                    )
                    ||
                    '.'

            end,


            v_chave,


            case

                when v_dias < 0 then
                    'critico'

                else
                    'atencao'

            end,


            '/compromissos',

            true,

            false,


            jsonb_build_object(

                'ocorrencia_id',
                r.ocorrencia_id,

                'compromisso_id',
                r.compromisso_id,

                'compromisso',
                r.compromisso_nome,

                'categoria',
                r.categoria,

                'vencimento',
                r.vencimento,

                'dias',
                v_dias,

                'valor',
                v_valor,

                'valor_real',
                r.valor_real,

                'valor_previsto',
                r.valor_previsto,

                'tipo_valor',
                r.tipo_valor

            ),


            now(),

            null

        )

        on conflict (
            usuario_id,
            chave
        )
        where chave is not null

        do update set

            tipo =
                excluded.tipo,

            titulo =
                excluded.titulo,

            descricao =
                excluded.descricao,

            nivel =
                excluded.nivel,

            rota =
                excluded.rota,

            ativo =
                true,


            lido =
                case

                    when
                        a.nivel is distinct from
                            excluded.nivel

                        or
                        a.titulo is distinct from
                            excluded.titulo

                        or
                        a.descricao is distinct from
                            excluded.descricao

                        or
                        a.dados is distinct from
                            excluded.dados

                        or
                        a.ativo = false

                    then false

                    else a.lido

                end,


            created_at =
                case

                    when a.ativo = false then
                        now()

                    else
                        a.created_at

                end,


            updated_at =
                now(),

            resolvido_em =
                null,

            dados =
                excluded.dados;


        v_processados :=
            v_processados + 1;

    end loop;


    -- =====================================================
    -- RESOLVER ALERTAS
    --
    -- Se a ocorrência foi paga, cancelada,
    -- removida da janela ou o compromisso foi
    -- arquivado, o alerta deixa de estar ativo.
    -- =====================================================

    update rumo.alertas

    set

        ativo =
            false,

        resolvido_em =
            coalesce(
                resolvido_em,
                now()
            ),

        updated_at =
            now()

    where

        usuario_id =
            v_usuario_id

        and ativo =
            true

        and chave like
            'COMPROMISSO:%'

        and not (
            chave =
            any(
                v_chaves_ativas
            )
        );


    -- =====================================================
    -- RETORNO
    -- =====================================================

    return jsonb_build_object(

        'hoje',
        v_hoje,

        'processados',
        v_processados,

        'alertas_compromissos_ativos',
        (

            select
                count(*)

            from rumo.alertas

            where
                usuario_id =
                    v_usuario_id

                and ativo =
                    true

                and chave like
                    'COMPROMISSO:%'

        )

    );

end;
$$;


grant execute
on function rumo.atualizar_alertas_compromissos()
to authenticated;
