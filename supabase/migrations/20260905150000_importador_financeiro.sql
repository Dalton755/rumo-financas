begin;


-- =========================================================
-- RECURSO PREMIUM
-- =========================================================

insert into rumo.recursos (
    codigo,
    nome,
    descricao,
    ativo
)
values (
    'IMPORTADOR_FINANCEIRO',
    'Importador Financeiro',
    'Importação de extratos bancários e comprovantes para criação assistida de movimentações',
    true
)
on conflict (codigo)
do update set
    nome = excluded.nome,
    descricao = excluded.descricao,
    ativo = excluded.ativo;


insert into rumo.plano_recursos (
    plano_id,
    recurso_id
)
select
    p.id,
    r.id
from rumo.planos p
join rumo.recursos r
    on r.codigo = 'IMPORTADOR_FINANCEIRO'
where p.codigo = 'PREMIUM'
  and not exists (
      select 1
      from rumo.plano_recursos pr
      where pr.plano_id = p.id
        and pr.recurso_id = r.id
  );


-- =========================================================
-- IMPORTAÇÕES
-- Uma linha representa um arquivo analisado.
-- =========================================================

create table if not exists rumo.importacoes (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references public.profiles(id)
        on delete cascade,

    conta_id uuid
        references rumo.contas(id)
        on delete set null,

    tipo text not null,

    formato text not null,

    nome_arquivo text,

    hash_arquivo text,

    status text not null
        default 'analisando',

    quantidade_registros integer not null
        default 0,

    quantidade_importados integer not null
        default 0,

    quantidade_ignorados integer not null
        default 0,

    quantidade_duplicados integer not null
        default 0,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint importacoes_tipo_check
        check (
            tipo in (
                'extrato',
                'comprovante'
            )
        ),

    constraint importacoes_formato_check
        check (
            formato in (
                'ofx',
                'csv',
                'pdf',
                'imagem'
            )
        ),

    constraint importacoes_status_check
        check (
            status in (
                'analisando',
                'pendente',
                'concluida',
                'cancelada',
                'erro'
            )
        )
);


-- =========================================================
-- ITENS DA IMPORTAÇÃO
-- Uma linha representa uma transação encontrada.
-- =========================================================

create table if not exists rumo.importacoes_itens (
    id uuid primary key default gen_random_uuid(),

    importacao_id uuid not null
        references rumo.importacoes(id)
        on delete cascade,

    usuario_id uuid not null
        references public.profiles(id)
        on delete cascade,

    conta_id uuid
        references rumo.contas(id)
        on delete set null,

    categoria_id uuid
        references rumo.categorias(id)
        on delete set null,

    movimentacao_id uuid
        references rumo.movimentacoes(id)
        on delete set null,

    identificador_externo text,

    hash_transacao text,

    data_movimentacao date,

    descricao_original text,

    descricao text,

    valor numeric(14,2),

    tipo text,

    status text not null
        default 'pendente',

    dados_originais jsonb,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint importacoes_itens_tipo_check
        check (
            tipo is null
            or tipo in (
                'receita',
                'despesa'
            )
        ),

    constraint importacoes_itens_status_check
        check (
            status in (
                'pendente',
                'importado',
                'ignorado',
                'duplicado',
                'erro'
            )
        ),

    constraint importacoes_itens_valor_check
        check (
            valor is null
            or valor >= 0
        )
);


-- =========================================================
-- ÍNDICES
-- =========================================================

create index if not exists importacoes_usuario_idx
    on rumo.importacoes(usuario_id);


create index if not exists importacoes_conta_idx
    on rumo.importacoes(conta_id);


create index if not exists importacoes_created_idx
    on rumo.importacoes(created_at desc);


create index if not exists importacoes_itens_importacao_idx
    on rumo.importacoes_itens(importacao_id);


create index if not exists importacoes_itens_usuario_idx
    on rumo.importacoes_itens(usuario_id);


create index if not exists importacoes_itens_hash_idx
    on rumo.importacoes_itens(
        usuario_id,
        conta_id,
        hash_transacao
    );


-- =========================================================
-- RLS
-- =========================================================

alter table rumo.importacoes
enable row level security;


alter table rumo.importacoes_itens
enable row level security;


drop policy if exists importacoes_all_own
on rumo.importacoes;

create policy importacoes_all_own
on rumo.importacoes
for all
using (
    auth.uid() = usuario_id
)
with check (
    auth.uid() = usuario_id
);


drop policy if exists importacoes_itens_all_own
on rumo.importacoes_itens;

create policy importacoes_itens_all_own
on rumo.importacoes_itens
for all
using (
    auth.uid() = usuario_id
)
with check (
    auth.uid() = usuario_id
);


-- =========================================================
-- PERMISSÕES
-- =========================================================

grant all privileges on
    rumo.importacoes,
    rumo.importacoes_itens
to authenticated;


grant all privileges on
    rumo.importacoes,
    rumo.importacoes_itens
to service_role;


commit;
