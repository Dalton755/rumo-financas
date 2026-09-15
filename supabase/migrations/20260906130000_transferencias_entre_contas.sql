begin;


-- =========================================================
-- CONTA DE DESTINO
-- =========================================================

alter table rumo.movimentacoes
add column if not exists conta_destino_id uuid;


do $$
begin

    if not exists (
        select 1
        from pg_constraint
        where conname =
            'movimentacoes_conta_destino_id_fkey'
          and conrelid =
            'rumo.movimentacoes'::regclass
    ) then

        alter table rumo.movimentacoes
        add constraint movimentacoes_conta_destino_id_fkey
        foreign key (conta_destino_id)
        references rumo.contas(id);

    end if;

end;
$$;


create index if not exists
idx_movimentacoes_conta_destino
on rumo.movimentacoes(conta_destino_id);


-- =========================================================
-- VALIDAÇÃO E CRIAÇÃO DE TRANSFERÊNCIA
-- =========================================================

create or replace function rumo.criar_transferencia(
    p_conta_origem_id uuid,
    p_conta_destino_id uuid,
    p_valor numeric,
    p_data_movimentacao date,
    p_descricao text default null,
    p_observacao text default null,
    p_origem text default 'manual',
    p_origem_referencia text default null
)
returns uuid
language plpgsql
security definer
set search_path = rumo, public
as $$
declare

    v_usuario_id uuid;
    v_movimentacao_id uuid;
    v_conta_origem rumo.contas%rowtype;
    v_conta_destino rumo.contas%rowtype;

begin

    v_usuario_id :=
        auth.uid();


    if v_usuario_id is null then

        raise exception
            'Usuário não autenticado.';

    end if;


    if p_conta_origem_id is null then

        raise exception
            'Informe a conta de origem.';

    end if;


    if p_conta_destino_id is null then

        raise exception
            'Informe a conta de destino.';

    end if;


    if (
        p_conta_origem_id =
        p_conta_destino_id
    ) then

        raise exception
            'A conta de origem e a conta de destino devem ser diferentes.';

    end if;


    if (
        p_valor is null
        or p_valor <= 0
    ) then

        raise exception
            'Informe um valor válido.';

    end if;


    if p_data_movimentacao is null then

        raise exception
            'Informe a data da transferência.';

    end if;


    -- =====================================================
    -- CONTA DE ORIGEM
    -- =====================================================

    select *
    into v_conta_origem
    from rumo.contas
    where id =
        p_conta_origem_id
      and usuario_id =
        v_usuario_id
      and ativo =
        true;


    if not found then

        raise exception
            'Conta de origem inválida.';

    end if;


    -- =====================================================
    -- CONTA DE DESTINO
    -- =====================================================

    select *
    into v_conta_destino
    from rumo.contas
    where id =
        p_conta_destino_id
      and usuario_id =
        v_usuario_id
      and ativo =
        true;


    if not found then

        raise exception
            'Conta de destino inválida.';

    end if;


    -- =====================================================
    -- REGISTRO ÚNICO
    -- =====================================================

    insert into rumo.movimentacoes (

        usuario_id,
        conta_id,
        conta_destino_id,
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

        p_conta_origem_id,

        p_conta_destino_id,

        null,

        coalesce(
            nullif(
                trim(p_descricao),
                ''
            ),
            'Transferência entre contas'
        ),

        p_valor,

        'transferencia',

        p_data_movimentacao,

        p_observacao,

        p_origem,

        p_origem_referencia

    )
    returning id
    into v_movimentacao_id;


    return v_movimentacao_id;

end;
$$;


grant execute
on function rumo.criar_transferencia(
    uuid,
    uuid,
    numeric,
    date,
    text,
    text,
    text,
    text
)
to authenticated;


commit;
