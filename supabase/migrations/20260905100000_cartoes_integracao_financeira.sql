-- Rumo - Cartões Premium + integração financeira
-- Migration retrospectiva criada em 2026-09-05.
-- Dependências pré-existentes:
-- public.profiles, rumo.categorias, rumo.contas, rumo.movimentacoes,
-- rumo.planos, rumo.recursos, rumo.plano_recursos,
-- rumo.data_financeira_atual(), rumo.usuario_tem_recurso(text)

begin;

create schema if not exists rumo;

create table if not exists rumo.cartoes (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.profiles(id) on delete cascade,
    nome text not null,
    banco text,
    bandeira text,
    final_cartao varchar(4),
    limite_total numeric(14,2) not null default 0,
    fechamento_dia smallint not null,
    vencimento_dia smallint not null,
    ativo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cartoes_id_usuario_unique unique (id, usuario_id),
    constraint cartoes_final_cartao_check check (
        final_cartao is null or final_cartao ~ '^[0-9]{4}$'
    ),
    constraint cartoes_limite_total_check check (limite_total >= 0),
    constraint cartoes_fechamento_dia_check check (
        fechamento_dia >= 1 and fechamento_dia <= 31
    ),
    constraint cartoes_vencimento_dia_check check (
        vencimento_dia >= 1 and vencimento_dia <= 31
    )
);

create table if not exists rumo.compras_cartao (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.profiles(id) on delete cascade,
    cartao_id uuid not null,
    categoria_id uuid references rumo.categorias(id) on delete set null,
    descricao text not null,
    valor_total numeric(14,2) not null,
    data_compra date not null,
    parcelas_total smallint not null default 1,
    observacao text,
    status text not null default 'ativa',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint compras_cartao_id_usuario_unique unique (id, usuario_id),
    constraint compras_cartao_cartao_usuario_fkey
        foreign key (cartao_id, usuario_id)
        references rumo.cartoes(id, usuario_id) on delete cascade,
    constraint compras_cartao_valor_total_check check (valor_total > 0),
    constraint compras_cartao_parcelas_total_check check (
        parcelas_total >= 1 and parcelas_total <= 120
    ),
    constraint compras_cartao_status_check check (
        status in ('ativa', 'cancelada')
    )
);

create table if not exists rumo.parcelas_cartao (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.profiles(id) on delete cascade,
    compra_id uuid not null,
    numero_parcela smallint not null,
    valor numeric(14,2) not null,
    competencia date not null,
    vencimento date not null,
    status text not null default 'pendente',
    pago_em date,
    movimentacao_pagamento_id uuid
        references rumo.movimentacoes(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint parcelas_cartao_compra_numero_unique
        unique (compra_id, numero_parcela),
    constraint parcelas_cartao_compra_usuario_fkey
        foreign key (compra_id, usuario_id)
        references rumo.compras_cartao(id, usuario_id) on delete cascade,
    constraint parcelas_cartao_numero_parcela_check check (numero_parcela >= 1),
    constraint parcelas_cartao_valor_check check (valor > 0),
    constraint parcelas_cartao_status_check check (
        status in ('pendente', 'paga', 'cancelada')
    )
);

create index if not exists cartoes_usuario_idx
    on rumo.cartoes (usuario_id);
create index if not exists compras_cartao_usuario_idx
    on rumo.compras_cartao (usuario_id);
create index if not exists compras_cartao_cartao_idx
    on rumo.compras_cartao (cartao_id);
create index if not exists compras_cartao_data_idx
    on rumo.compras_cartao (data_compra);
create index if not exists parcelas_cartao_usuario_idx
    on rumo.parcelas_cartao (usuario_id);
create index if not exists parcelas_cartao_compra_idx
    on rumo.parcelas_cartao (compra_id);
create index if not exists parcelas_cartao_competencia_idx
    on rumo.parcelas_cartao (competencia);
create index if not exists parcelas_cartao_vencimento_idx
    on rumo.parcelas_cartao (vencimento);
create index if not exists parcelas_cartao_status_idx
    on rumo.parcelas_cartao (status);

alter table rumo.cartoes enable row level security;
alter table rumo.compras_cartao enable row level security;
alter table rumo.parcelas_cartao enable row level security;

drop policy if exists cartoes_all_own on rumo.cartoes;
create policy cartoes_all_own on rumo.cartoes
    for all
    using (auth.uid() = usuario_id)
    with check (auth.uid() = usuario_id);

drop policy if exists compras_cartao_all_own on rumo.compras_cartao;
create policy compras_cartao_all_own on rumo.compras_cartao
    for all
    using (auth.uid() = usuario_id)
    with check (auth.uid() = usuario_id);

drop policy if exists parcelas_cartao_all_own on rumo.parcelas_cartao;
create policy parcelas_cartao_all_own on rumo.parcelas_cartao
    for all
    using (auth.uid() = usuario_id)
    with check (auth.uid() = usuario_id);

grant select on
    rumo.cartoes,
    rumo.compras_cartao,
    rumo.parcelas_cartao
to anon;

grant all privileges on
    rumo.cartoes,
    rumo.compras_cartao,
    rumo.parcelas_cartao
to authenticated;

grant all privileges on
    rumo.cartoes,
    rumo.compras_cartao,
    rumo.parcelas_cartao
to service_role;

insert into rumo.recursos (
    codigo, nome, descricao, ativo
)
values (
    'CARTOES',
    'Cartões',
    'Gestão de cartões de crédito, limites, compras, parcelas e faturas',
    true
)
on conflict (codigo)
do update set
    nome = excluded.nome,
    descricao = excluded.descricao,
    ativo = excluded.ativo;

insert into rumo.plano_recursos (plano_id, recurso_id)
select
    p.id,
    r.id
from rumo.planos p
join rumo.recursos r
    on r.codigo = 'CARTOES'
where p.codigo = 'PREMIUM'
  and not exists (
      select 1
      from rumo.plano_recursos pr
      where pr.plano_id = p.id
        and pr.recurso_id = r.id
  );


create or replace function rumo.criar_compra_cartao(
    p_cartao_id uuid,
    p_categoria_id uuid,
    p_descricao text,
    p_valor_total numeric,
    p_data_compra date,
    p_parcelas_total integer default 1,
    p_observacao text default null::text
)
returns uuid
language plpgsql
set search_path to 'public', 'rumo'
as $function$
declare
    v_usuario_id uuid;
    v_cartao rumo.cartoes%rowtype;
    v_compra_id uuid;
    v_competencia date;
    v_vencimento date;
    v_mes_competencia date;
    v_valor_base numeric(14,2);
    v_valor_parcela numeric(14,2);
    v_soma_anterior numeric(14,2) := 0;
    v_i integer;
    v_ultimo_dia integer;
    v_dia_vencimento integer;
begin
    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    if p_valor_total is null or p_valor_total <= 0 then
        raise exception 'O valor da compra deve ser maior que zero.';
    end if;

    if p_parcelas_total is null
       or p_parcelas_total < 1
       or p_parcelas_total > 120 then
        raise exception 'Quantidade de parcelas inválida.';
    end if;

    select *
    into v_cartao
    from rumo.cartoes
    where id = p_cartao_id
      and usuario_id = v_usuario_id
      and ativo = true;

    if not found then
        raise exception 'Cartão não encontrado.';
    end if;

    if p_categoria_id is not null
       and not exists (
            select 1
            from rumo.categorias
            where id = p_categoria_id
              and usuario_id = v_usuario_id
              and ativo = true
              and tipo = 'despesa'
       ) then
        raise exception 'Categoria inválida.';
    end if;

    insert into rumo.compras_cartao (
        usuario_id,
        cartao_id,
        categoria_id,
        descricao,
        valor_total,
        data_compra,
        parcelas_total,
        observacao,
        status
    )
    values (
        v_usuario_id,
        p_cartao_id,
        p_categoria_id,
        trim(p_descricao),
        round(p_valor_total, 2),
        p_data_compra,
        p_parcelas_total,
        nullif(trim(coalesce(p_observacao, '')), ''),
        'ativa'
    )
    returning id into v_compra_id;

    if extract(day from p_data_compra)::integer
       <= v_cartao.fechamento_dia then
        v_mes_competencia := date_trunc('month', p_data_compra)::date;
    else
        v_mes_competencia := (
            date_trunc('month', p_data_compra)
            + interval '1 month'
        )::date;
    end if;

    v_valor_base := round(
        p_valor_total / p_parcelas_total,
        2
    );

    for v_i in 1..p_parcelas_total loop
        v_competencia := (
            v_mes_competencia
            + make_interval(months => v_i - 1)
        )::date;

        if v_cartao.vencimento_dia > v_cartao.fechamento_dia then
            v_vencimento := v_competencia;
        else
            v_vencimento := (
                v_competencia + interval '1 month'
            )::date;
        end if;

        v_ultimo_dia := extract(
            day from (
                date_trunc('month', v_vencimento)
                + interval '1 month - 1 day'
            )
        )::integer;

        v_dia_vencimento := least(
            v_cartao.vencimento_dia,
            v_ultimo_dia
        );

        v_vencimento := make_date(
            extract(year from v_vencimento)::integer,
            extract(month from v_vencimento)::integer,
            v_dia_vencimento
        );

        if v_i = p_parcelas_total then
            v_valor_parcela := round(
                p_valor_total - v_soma_anterior,
                2
            );
        else
            v_valor_parcela := v_valor_base;
        end if;

        insert into rumo.parcelas_cartao (
            usuario_id,
            compra_id,
            numero_parcela,
            valor,
            competencia,
            vencimento,
            status
        )
        values (
            v_usuario_id,
            v_compra_id,
            v_i,
            v_valor_parcela,
            v_competencia,
            v_vencimento,
            'pendente'
        );

        v_soma_anterior := v_soma_anterior + v_valor_parcela;
    end loop;

    return v_compra_id;
end;
$function$;


create or replace function rumo.pagar_fatura_cartao(
    p_cartao_id uuid,
    p_vencimento date,
    p_conta_id uuid,
    p_data_pagamento date default current_date
)
returns uuid
language plpgsql
set search_path to 'public', 'rumo'
as $function$
declare
    v_usuario_id uuid;
    v_cartao rumo.cartoes%rowtype;
    v_total numeric(14,2);
    v_movimentacao_id uuid;
    v_referencia text;
begin
    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    select *
    into v_cartao
    from rumo.cartoes
    where id = p_cartao_id
      and usuario_id = v_usuario_id;

    if not found then
        raise exception 'Cartão não encontrado.';
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

    select coalesce(sum(p.valor), 0)
    into v_total
    from rumo.parcelas_cartao p
    join rumo.compras_cartao c
        on c.id = p.compra_id
    where p.usuario_id = v_usuario_id
      and c.cartao_id = p_cartao_id
      and c.status = 'ativa'
      and p.vencimento = p_vencimento
      and p.status = 'pendente';

    if v_total <= 0 then
        raise exception 'Esta fatura não possui saldo pendente.';
    end if;

    v_referencia :=
        p_cartao_id::text
        || ':'
        || p_vencimento::text;

    if exists (
        select 1
        from rumo.movimentacoes
        where usuario_id = v_usuario_id
          and origem = 'cartao_fatura'
          and origem_referencia = v_referencia
    ) then
        raise exception 'Esta fatura já foi paga.';
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
        null,
        'Pagamento fatura ' || v_cartao.nome,
        v_total,
        'despesa',
        p_data_pagamento,
        'Fatura com vencimento em ' || to_char(
            p_vencimento,
            'DD/MM/YYYY'
        ),
        'cartao_fatura',
        v_referencia
    )
    returning id into v_movimentacao_id;

    update rumo.parcelas_cartao p
    set
        status = 'paga',
        pago_em = p_data_pagamento,
        movimentacao_pagamento_id = v_movimentacao_id,
        updated_at = now()
    from rumo.compras_cartao c
    where c.id = p.compra_id
      and p.usuario_id = v_usuario_id
      and c.cartao_id = p_cartao_id
      and c.status = 'ativa'
      and p.vencimento = p_vencimento
      and p.status = 'pendente';

    return v_movimentacao_id;
end;
$function$;


create or replace function rumo.listar_periodos_dashboard(
    p_usuario_id uuid
)
returns table(
    ano integer,
    mes integer,
    descricao text
)
language sql
stable
as $function$

with periodos as (

    select
        extract(year from m.data_movimentacao)::int as ano,
        extract(month from m.data_movimentacao)::int as mes
    from rumo.movimentacoes m
    where m.usuario_id = p_usuario_id

    union

    select
        extract(year from p.competencia)::int as ano,
        extract(month from p.competencia)::int as mes
    from rumo.parcelas_cartao p
    join rumo.compras_cartao c
        on c.id = p.compra_id
       and c.usuario_id = p.usuario_id
    where p.usuario_id = p_usuario_id
      and c.status = 'ativa'
      and p.status in ('pendente', 'paga')
)

select
    ano,
    mes,
    case mes
        when 1 then 'Janeiro'
        when 2 then 'Fevereiro'
        when 3 then 'Março'
        when 4 then 'Abril'
        when 5 then 'Maio'
        when 6 then 'Junho'
        when 7 then 'Julho'
        when 8 then 'Agosto'
        when 9 then 'Setembro'
        when 10 then 'Outubro'
        when 11 then 'Novembro'
        when 12 then 'Dezembro'
    end
    || ' ' ||
    ano as descricao
from periodos
group by ano, mes
order by ano desc, mes desc;

$function$;


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
    select rumo.data_financeira_atual() as hoje
),

movimentacoes_mes as (
    select
        m.tipo,
        m.valor,
        m.origem
    from rumo.movimentacoes m
    where m.usuario_id = p_usuario_id
      and extract(year from m.data_movimentacao) = p_ano
      and extract(month from m.data_movimentacao) = p_mes
),

parcelas_cartao_mes as (
    select p.valor
    from rumo.parcelas_cartao p
    join rumo.compras_cartao compra
        on compra.id = p.compra_id
       and compra.usuario_id = p.usuario_id
    where p.usuario_id = p_usuario_id
      and compra.status = 'ativa'
      and p.status in ('pendente', 'paga')
      and extract(year from p.competencia) = p_ano
      and extract(month from p.competencia) = p_mes
),

resumo_mes as (
    select
        coalesce(
            (
                select sum(valor)
                from movimentacoes_mes
                where tipo = 'receita'
            ),
            0
        ) as receitas_mes,

        (
            coalesce(
                (
                    select sum(valor)
                    from movimentacoes_mes
                    where tipo = 'despesa'
                      and coalesce(origem, '') <> 'cartao_fatura'
                ),
                0
            )
            +
            coalesce(
                (
                    select sum(valor)
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
                conta.saldo_inicial
                +
                coalesce(
                    (
                        select sum(
                            case
                                when mov.tipo = 'receita'
                                    then mov.valor
                                when mov.tipo in (
                                    'despesa',
                                    'pagamento_divida',
                                    'aporte_objetivo'
                                )
                                    then -mov.valor
                                else 0
                            end
                        )
                        from rumo.movimentacoes mov
                        cross join data_atual data
                        where mov.usuario_id = p_usuario_id
                          and mov.conta_id = conta.id
                          and mov.data_movimentacao <= data.hoje
                    ),
                    0
                )
            ),
            0
        ) as saldo_total
    from rumo.contas conta
    where conta.usuario_id = p_usuario_id
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
                        - resumo_mes.despesas_mes
                    )
                    /
                    greatest(
                        resumo_mes.receitas_mes,
                        1
                    )
                    * 100
                )
            )
        )::integer as indice_rumo
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


create or replace function rumo.obter_movimentacoes_dashboard(
    p_usuario_id uuid,
    p_ano integer,
    p_mes integer
)
returns table(
    descricao text,
    valor numeric,
    tipo text,
    data_movimentacao date,
    categoria text,
    conta text
)
language sql
stable
as $function$

with lancamentos as (

    select
        m.descricao,
        m.valor,
        m.tipo,
        m.data_movimentacao,
        c.nome as categoria,
        ct.nome as conta
    from rumo.movimentacoes m
    left join rumo.categorias c
        on c.id = m.categoria_id
    left join rumo.contas ct
        on ct.id = m.conta_id
    where m.usuario_id = p_usuario_id
      and coalesce(m.origem, '') <> 'cartao_fatura'
      and extract(year from m.data_movimentacao) = p_ano
      and extract(month from m.data_movimentacao) = p_mes

    union all

    select
        case
            when compra.parcelas_total > 1
            then
                compra.descricao
                || ' · '
                || parcela.numero_parcela
                || '/'
                || compra.parcelas_total
            else
                compra.descricao
        end as descricao,
        parcela.valor,
        'despesa'::text as tipo,
        case
            when date_trunc('month', compra.data_compra)::date
                 = parcela.competencia
            then compra.data_compra
            else parcela.competencia
        end as data_movimentacao,
        categoria.nome as categoria,
        cartao.nome as conta
    from rumo.parcelas_cartao parcela
    join rumo.compras_cartao compra
        on compra.id = parcela.compra_id
       and compra.usuario_id = parcela.usuario_id
    join rumo.cartoes cartao
        on cartao.id = compra.cartao_id
       and cartao.usuario_id = compra.usuario_id
    left join rumo.categorias categoria
        on categoria.id = compra.categoria_id
    where parcela.usuario_id = p_usuario_id
      and compra.status = 'ativa'
      and parcela.status in ('pendente', 'paga')
      and extract(year from parcela.competencia) = p_ano
      and extract(month from parcela.competencia) = p_mes
)

select
    descricao,
    valor,
    tipo,
    data_movimentacao,
    categoria,
    conta
from lancamentos
order by data_movimentacao desc, descricao
limit 5;

$function$;


create or replace function rumo._obter_inteligencia_financeira_base()
returns jsonb
language plpgsql
security definer
set search_path to 'rumo', 'public'
as $function$
declare
    v_usuario_id uuid;
    v_hoje date;
    v_mes_atual date;
    v_mes_anterior date;
    v_fim_comparacao_anterior date;

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
    v_mes_atual := date_trunc('month', v_hoje)::date;
    v_mes_anterior := (
        v_mes_atual - interval '1 month'
    )::date;

    v_fim_comparacao_anterior := least(
        (v_mes_atual - interval '1 day')::date,
        (
            v_mes_anterior
            + (
                extract(day from v_hoje)::integer - 1
            )
        )::date
    );

    select
        coalesce(
            sum(valor) filter (
                where tipo = 'receita'
            ),
            0
        ),
        coalesce(
            sum(valor) filter (
                where tipo in (
                    'despesa',
                    'pagamento_divida',
                    'aporte_objetivo'
                )
                and coalesce(origem, '') <> 'cartao_fatura'
            ),
            0
        )
    into
        v_receitas_atual,
        v_despesas_atual
    from rumo.movimentacoes
    where usuario_id = v_usuario_id
      and data_movimentacao >= v_mes_atual
      and data_movimentacao <= v_hoje;

    select
        coalesce(sum(p.valor), 0)
    into
        v_despesas_cartao_atual
    from rumo.parcelas_cartao p
    join rumo.compras_cartao compra
        on compra.id = p.compra_id
       and compra.usuario_id = p.usuario_id
    where p.usuario_id = v_usuario_id
      and compra.status = 'ativa'
      and p.status in ('pendente', 'paga')
      and (
            case
                when date_trunc('month', compra.data_compra)::date
                     = p.competencia
                then compra.data_compra
                else p.competencia
            end
          ) >= v_mes_atual
      and (
            case
                when date_trunc('month', compra.data_compra)::date
                     = p.competencia
                then compra.data_compra
                else p.competencia
            end
          ) <= v_hoje;

    v_despesas_atual :=
        v_despesas_atual + v_despesas_cartao_atual;

    v_saldo_atual :=
        v_receitas_atual - v_despesas_atual;

    select
        coalesce(
            sum(valor) filter (
                where tipo = 'receita'
            ),
            0
        ),
        coalesce(
            sum(valor) filter (
                where tipo in (
                    'despesa',
                    'pagamento_divida',
                    'aporte_objetivo'
                )
                and coalesce(origem, '') <> 'cartao_fatura'
            ),
            0
        )
    into
        v_receitas_anterior,
        v_despesas_anterior
    from rumo.movimentacoes
    where usuario_id = v_usuario_id
      and data_movimentacao >= v_mes_anterior
      and data_movimentacao <= v_fim_comparacao_anterior;

    select
        coalesce(sum(p.valor), 0)
    into
        v_despesas_cartao_anterior
    from rumo.parcelas_cartao p
    join rumo.compras_cartao compra
        on compra.id = p.compra_id
       and compra.usuario_id = p.usuario_id
    where p.usuario_id = v_usuario_id
      and compra.status = 'ativa'
      and p.status in ('pendente', 'paga')
      and (
            case
                when date_trunc('month', compra.data_compra)::date
                     = p.competencia
                then compra.data_compra
                else p.competencia
            end
          ) >= v_mes_anterior
      and (
            case
                when date_trunc('month', compra.data_compra)::date
                     = p.competencia
                then compra.data_compra
                else p.competencia
            end
          ) <= v_fim_comparacao_anterior;

    v_despesas_anterior :=
        v_despesas_anterior + v_despesas_cartao_anterior;

    v_saldo_anterior :=
        v_receitas_anterior - v_despesas_anterior;

    if v_receitas_atual > 0 then
        v_taxa_economia := round(
            (v_saldo_atual / v_receitas_atual) * 100,
            2
        );
    else
        v_taxa_economia := null;
    end if;

    if v_receitas_anterior > 0 then
        v_variacao_receitas := round(
            (
                (
                    v_receitas_atual
                    - v_receitas_anterior
                )
                / v_receitas_anterior
            ) * 100,
            2
        );
    else
        v_variacao_receitas := null;
    end if;

    if v_despesas_anterior > 0 then
        v_variacao_despesas := round(
            (
                (
                    v_despesas_atual
                    - v_despesas_anterior
                )
                / v_despesas_anterior
            ) * 100,
            2
        );
    else
        v_variacao_despesas := null;
    end if;

    select
        c.nome,
        sum(g.valor)
    into
        v_categoria_top,
        v_categoria_top_valor
    from (
        select
            m.categoria_id,
            m.valor
        from rumo.movimentacoes m
        where m.usuario_id = v_usuario_id
          and m.tipo in (
              'despesa',
              'pagamento_divida',
              'aporte_objetivo'
          )
          and coalesce(m.origem, '') <> 'cartao_fatura'
          and m.data_movimentacao >= v_mes_atual
          and m.data_movimentacao <= v_hoje

        union all

        select
            compra.categoria_id,
            p.valor
        from rumo.parcelas_cartao p
        join rumo.compras_cartao compra
            on compra.id = p.compra_id
           and compra.usuario_id = p.usuario_id
        where p.usuario_id = v_usuario_id
          and compra.status = 'ativa'
          and p.status in ('pendente', 'paga')
          and (
                case
                    when date_trunc('month', compra.data_compra)::date
                         = p.competencia
                    then compra.data_compra
                    else p.competencia
                end
              ) >= v_mes_atual
          and (
                case
                    when date_trunc('month', compra.data_compra)::date
                         = p.competencia
                    then compra.data_compra
                    else p.competencia
                end
              ) <= v_hoje
    ) g
    join rumo.categorias c
        on c.id = g.categoria_id
    where g.categoria_id is not null
    group by c.id, c.nome
    order by sum(g.valor) desc
    limit 1;

    v_categoria_top_valor :=
        coalesce(v_categoria_top_valor, 0);


    select
        coalesce(
            sum(
                c.saldo_inicial
                +
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
                                    else 0
                                end
                            )
                        from rumo.movimentacoes m
                        where m.conta_id = c.id
                          and m.usuario_id = v_usuario_id
                          and m.data_movimentacao <= v_hoje
                    ),
                    0
                )
            ),
            0
        )
    into
        v_saldo_contas
    from rumo.contas c
    where c.usuario_id = v_usuario_id;

    select
        coalesce(
            sum(valor) filter (
                where tipo = 'receita'
            ),
            0
        ),
        coalesce(
            sum(valor) filter (
                where tipo in (
                    'despesa',
                    'pagamento_divida',
                    'aporte_objetivo'
                )
                and coalesce(origem, '') <> 'cartao_fatura'
            ),
            0
        )
    into
        v_receitas_futuras,
        v_despesas_futuras
    from rumo.movimentacoes
    where usuario_id = v_usuario_id
      and data_movimentacao > v_hoje
      and data_movimentacao <= (
          v_hoje + interval '30 days'
      )::date;

    select
        coalesce(sum(p.valor), 0)
    into
        v_despesas_cartao_futuras
    from rumo.parcelas_cartao p
    join rumo.compras_cartao compra
        on compra.id = p.compra_id
       and compra.usuario_id = p.usuario_id
    where p.usuario_id = v_usuario_id
      and compra.status = 'ativa'
      and p.status = 'pendente'
      and p.vencimento > v_hoje
      and p.vencimento <= (
          v_hoje + interval '30 days'
      )::date;

    v_despesas_futuras :=
        v_despesas_futuras
        + v_despesas_cartao_futuras;

    return jsonb_build_object(
        'periodo',
        jsonb_build_object(
            'hoje', v_hoje,
            'mes_atual', v_mes_atual,
            'mes_anterior', v_mes_anterior,
            'fim_comparacao_anterior',
            v_fim_comparacao_anterior
        ),

        'mes_atual',
        jsonb_build_object(
            'receitas', v_receitas_atual,
            'despesas', v_despesas_atual,
            'saldo', v_saldo_atual,
            'taxa_economia_pct', v_taxa_economia
        ),

        'mes_anterior',
        jsonb_build_object(
            'receitas', v_receitas_anterior,
            'despesas', v_despesas_anterior,
            'saldo', v_saldo_anterior
        ),

        'comparacao',
        jsonb_build_object(
            'variacao_receitas_pct', v_variacao_receitas,
            'variacao_despesas_pct', v_variacao_despesas
        ),

        'maior_categoria_despesa',
        case
            when v_categoria_top is null
                then null
            else
                jsonb_build_object(
                    'categoria', v_categoria_top,
                    'valor', v_categoria_top_valor
                )
        end,

        'saldo_real_contas',
        v_saldo_contas,

        'proximos_30_dias',
        jsonb_build_object(
            'receitas_previstas', v_receitas_futuras,
            'despesas_previstas', v_despesas_futuras,
            'saldo_previsto',
            (
                v_receitas_futuras
                - v_despesas_futuras
            )
        )
    );
end;
$function$;


create or replace function rumo.obter_inteligencia_financeira()
returns jsonb
language plpgsql
security definer
set search_path to 'rumo', 'public'
as $function$
begin
    if auth.uid() is null then
        raise exception 'Usuário não autenticado';
    end if;

    if not rumo.usuario_tem_recurso(
        'INTELIGENCIA_FINANCEIRA'
    ) then
        raise exception
            'Recurso não disponível no plano atual';
    end if;

    return rumo._obter_inteligencia_financeira_base();
end;
$function$;


revoke all on function rumo.criar_compra_cartao(
    uuid,
    uuid,
    text,
    numeric,
    date,
    integer,
    text
) from public;

grant execute on function rumo.criar_compra_cartao(
    uuid,
    uuid,
    text,
    numeric,
    date,
    integer,
    text
) to authenticated, service_role;


revoke all on function rumo.pagar_fatura_cartao(
    uuid,
    date,
    uuid,
    date
) from public;

grant execute on function rumo.pagar_fatura_cartao(
    uuid,
    date,
    uuid,
    date
) to authenticated, service_role;


revoke all on function rumo.listar_periodos_dashboard(
    uuid
) from public;

grant execute on function rumo.listar_periodos_dashboard(
    uuid
) to authenticated, service_role;


revoke all on function rumo.obter_dashboard(
    uuid,
    integer,
    integer
) from public;

grant execute on function rumo.obter_dashboard(
    uuid,
    integer,
    integer
) to authenticated, service_role;


revoke all on function rumo.obter_movimentacoes_dashboard(
    uuid,
    integer,
    integer
) from public;

grant execute on function rumo.obter_movimentacoes_dashboard(
    uuid,
    integer,
    integer
) to authenticated, service_role;


revoke all on function rumo._obter_inteligencia_financeira_base()
    from public;

grant execute on function rumo._obter_inteligencia_financeira_base()
    to authenticated, service_role;


revoke all on function rumo.obter_inteligencia_financeira()
    from public;

grant execute on function rumo.obter_inteligencia_financeira()
    to authenticated, service_role;

commit;
