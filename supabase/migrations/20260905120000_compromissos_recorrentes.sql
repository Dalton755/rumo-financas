create table if not exists rumo.compromissos (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references auth.users(id) on delete cascade,
    categoria_id uuid references rumo.categorias(id) on delete set null,
    conta_id uuid references rumo.contas(id) on delete set null,

    nome text not null,

    frequencia text not null,
    intervalo integer not null default 1,

    dia_semana smallint,
    dia_mes smallint,
    data_inicio date not null,

    tipo_valor text not null,
    valor_padrao numeric(14,2),
    valor_estimado numeric(14,2),

    ativo boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint compromissos_frequencia_check
        check (
            frequencia in (
                'semanal',
                'quinzenal',
                'mensal',
                'anual'
            )
        ),

    constraint compromissos_tipo_valor_check
        check (
            tipo_valor in (
                'fixo',
                'variavel'
            )
        ),

    constraint compromissos_intervalo_check
        check (intervalo >= 1),

    constraint compromissos_dia_semana_check
        check (
            dia_semana is null
            or dia_semana between 0 and 6
        ),

    constraint compromissos_dia_mes_check
        check (
            dia_mes is null
            or dia_mes between 1 and 31
        )
);


create table if not exists rumo.compromissos_ocorrencias (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    compromisso_id uuid not null
        references rumo.compromissos(id)
        on delete cascade,

    vencimento date not null,

    valor_previsto numeric(14,2),
    valor_real numeric(14,2),

    status text not null default 'pendente',

    pago_em date,

    movimentacao_id uuid
        references rumo.movimentacoes(id)
        on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint compromissos_ocorrencias_status_check
        check (
            status in (
                'pendente',
                'pago',
                'cancelado'
            )
        ),

    constraint compromissos_ocorrencias_unica
        unique (
            compromisso_id,
            vencimento
        )
);


create index if not exists idx_compromissos_usuario
    on rumo.compromissos(usuario_id);


create index if not exists idx_compromissos_ocorrencias_usuario
    on rumo.compromissos_ocorrencias(usuario_id);


create index if not exists idx_compromissos_ocorrencias_vencimento
    on rumo.compromissos_ocorrencias(vencimento);


create index if not exists idx_compromissos_ocorrencias_status
    on rumo.compromissos_ocorrencias(status);


alter table rumo.compromissos
enable row level security;


alter table rumo.compromissos_ocorrencias
enable row level security;


drop policy if exists compromissos_select_proprio
on rumo.compromissos;

create policy compromissos_select_proprio
on rumo.compromissos
for select
using (
    usuario_id = auth.uid()
);


drop policy if exists compromissos_insert_proprio
on rumo.compromissos;

create policy compromissos_insert_proprio
on rumo.compromissos
for insert
with check (
    usuario_id = auth.uid()
);


drop policy if exists compromissos_update_proprio
on rumo.compromissos;

create policy compromissos_update_proprio
on rumo.compromissos
for update
using (
    usuario_id = auth.uid()
)
with check (
    usuario_id = auth.uid()
);


drop policy if exists compromissos_delete_proprio
on rumo.compromissos;

create policy compromissos_delete_proprio
on rumo.compromissos
for delete
using (
    usuario_id = auth.uid()
);


drop policy if exists compromissos_ocorrencias_select_proprio
on rumo.compromissos_ocorrencias;

create policy compromissos_ocorrencias_select_proprio
on rumo.compromissos_ocorrencias
for select
using (
    usuario_id = auth.uid()
);


drop policy if exists compromissos_ocorrencias_insert_proprio
on rumo.compromissos_ocorrencias;

create policy compromissos_ocorrencias_insert_proprio
on rumo.compromissos_ocorrencias
for insert
with check (
    usuario_id = auth.uid()
);


drop policy if exists compromissos_ocorrencias_update_proprio
on rumo.compromissos_ocorrencias;

create policy compromissos_ocorrencias_update_proprio
on rumo.compromissos_ocorrencias
for update
using (
    usuario_id = auth.uid()
)
with check (
    usuario_id = auth.uid()
);


create or replace function rumo.pagar_compromisso_ocorrencia(
    p_ocorrencia_id uuid,
    p_conta_id uuid,
    p_valor numeric,
    p_data_pagamento date
)
returns uuid
language plpgsql
security definer
set search_path = public, rumo
as $$
declare
    v_usuario_id uuid;
    v_ocorrencia rumo.compromissos_ocorrencias%rowtype;
    v_compromisso rumo.compromissos%rowtype;
    v_movimentacao_id uuid;
    v_referencia text;
begin

    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;


    select *
    into v_ocorrencia
    from rumo.compromissos_ocorrencias
    where id = p_ocorrencia_id
      and usuario_id = v_usuario_id;


    if not found then
        raise exception 'Ocorrência não encontrada.';
    end if;


    if v_ocorrencia.status = 'pago' then
        raise exception 'Esta ocorrência já foi paga.';
    end if;


    select *
    into v_compromisso
    from rumo.compromissos
    where id = v_ocorrencia.compromisso_id
      and usuario_id = v_usuario_id;


    if not found then
        raise exception 'Compromisso não encontrado.';
    end if;


    if not exists (
        select 1
        from rumo.contas
        where id = p_conta_id
          and usuario_id = v_usuario_id
          and ativo = true
    ) then
        raise exception 'Conta de pagamento inválida.';
    end if;


    if p_valor is null or p_valor <= 0 then
        raise exception 'Informe um valor de pagamento válido.';
    end if;


    if p_data_pagamento is null then
        raise exception 'Informe a data do pagamento.';
    end if;


    v_referencia := v_ocorrencia.id::text;


    if exists (
        select 1
        from rumo.movimentacoes
        where usuario_id = v_usuario_id
          and origem = 'compromisso'
          and origem_referencia = v_referencia
    ) then
        raise exception 'Este compromisso já possui movimentação de pagamento.';
    end if;


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
        v_compromisso.categoria_id,
        v_compromisso.nome,
        p_valor,
        'despesa',
        p_data_pagamento,
        'Pagamento de compromisso com vencimento em '
            || to_char(
                v_ocorrencia.vencimento,
                'DD/MM/YYYY'
            ),
        'compromisso',
        v_referencia
    )
    returning id
    into v_movimentacao_id;


    update rumo.compromissos_ocorrencias
    set
        valor_real = p_valor,
        status = 'pago',
        pago_em = p_data_pagamento,
        movimentacao_id = v_movimentacao_id,
        updated_at = now()
    where id = p_ocorrencia_id
      and usuario_id = v_usuario_id;


    return v_movimentacao_id;

end;
$$;


grant execute
on function rumo.pagar_compromisso_ocorrencia(
    uuid,
    uuid,
    numeric,
    date
)
to authenticated;
