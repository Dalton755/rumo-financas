-- PREPARAÇÃO / NÃO EXECUTAR EM PRODUÇÃO SEM VALIDAR.
-- Depois do teste: supabase migration new rumo_google_play_billing
-- Copiar este SQL para o arquivo de migração gerado e aplicar em staging.
begin;

alter table rumo.assinaturas
  add column if not exists provedor_assinatura text;
-- NULL = origem legada; valores novos 'GOOGLE_PLAY' ou 'MERCADO_PAGO'.

create table if not exists rumo.google_play_assinaturas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references public.profiles(id) on delete cascade,
  purchase_token text not null,
  token_sha256 text not null unique,
  product_id text not null check (product_id in ('rumo_premium_mensal','rumo_premium_anual')),
  estado_google text not null,
  vencimento_em timestamptz,
  renovacao_automatica boolean not null default false,
  ultimo_pedido_google text,
  teste boolean not null default false,
  atualizado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

alter table rumo.google_play_assinaturas enable row level security;
-- Dados fiscais e tokens NÃO podem ser lidos/escritos pelo cliente.
revoke all on rumo.google_play_assinaturas from public, anon, authenticated;
grant select, insert, update, delete on rumo.google_play_assinaturas to service_role;

create or replace function rumo.aplicar_estado_play(
  p_usuario_id uuid,
  p_purchase_token text,
  p_token_sha256 text,
  p_product_id text,
  p_estado text,
  p_vencimento timestamptz,
  p_renovacao boolean,
  p_pedido text,
  p_teste boolean
) returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'rumo', 'pg_temp'
as $$
declare
  v_assinatura rumo.assinaturas%rowtype;
  v_gratuito uuid;
  v_premium uuid;
  v_ativo boolean;
  v_dono uuid;
  v_periodo text;
begin
  if p_usuario_id is null or p_purchase_token is null or length(p_purchase_token) < 12
     or p_token_sha256 !~ '^[a-f0-9]{64}$'
     or p_product_id not in ('rumo_premium_mensal','rumo_premium_anual')
     or p_estado not like 'SUBSCRIPTION_STATE_%' then
    raise exception 'Parâmetros Google Play inválidos';
  end if;
  if exists (
    select 1 from rumo.solicitacoes_exclusao
    where usuario_id=p_usuario_id and status='CONCLUIDA'
  ) then
    raise exception 'RUMO_CONTA_ENCERRADA';
  end if;

  select usuario_id into v_dono from rumo.google_play_assinaturas
    where token_sha256=p_token_sha256 limit 1;
  if v_dono is not null and v_dono<>p_usuario_id then
    raise exception 'Token Google Play já associado a outra conta';
  end if;

  v_periodo := case p_product_id
    when 'rumo_premium_mensal' then 'MENSAL'
    else 'ANUAL' end;
  v_ativo := p_estado in (
    'SUBSCRIPTION_STATE_ACTIVE',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    'SUBSCRIPTION_STATE_CANCELED'
  ) and p_vencimento > now();

  select * into v_assinatura from rumo.assinaturas
  where usuario_id=p_usuario_id for update;
  if not found then
    raise exception 'Conta Rumo não inicializada';
  end if;

  -- Não converter assinatura de outro meio em Google Play.
  -- Se existe Premium de outra origem ainda válido, a operação aguarda conciliação.
  if v_assinatura.provedor_assinatura is distinct from 'GOOGLE_PLAY'
     and v_assinatura.status='ATIVA'
     and (v_assinatura.vence_em is null or v_assinatura.vence_em > now())
     and exists (select 1 from rumo.planos where id=v_assinatura.plano_id and codigo='PREMIUM') then
    raise exception 'Usuário já possui Premium de outra origem';
  end if;

  insert into rumo.google_play_assinaturas
    (usuario_id,purchase_token,token_sha256,product_id,estado_google,
     vencimento_em,renovacao_automatica,ultimo_pedido_google,teste,atualizado_em)
  values
    (p_usuario_id,p_purchase_token,p_token_sha256,p_product_id,p_estado,
     p_vencimento,coalesce(p_renovacao,false),p_pedido,coalesce(p_teste,false),now())
  on conflict (usuario_id) do update set
    purchase_token=excluded.purchase_token,
    token_sha256=excluded.token_sha256,
    product_id=excluded.product_id,
    estado_google=excluded.estado_google,
    vencimento_em=excluded.vencimento_em,
    renovacao_automatica=excluded.renovacao_automatica,
    ultimo_pedido_google=excluded.ultimo_pedido_google,
    teste=excluded.teste,
    atualizado_em=now();

  select id into v_gratuito from rumo.planos
    where codigo='GRATUITO' and ativo=true limit 1;
  select id into v_premium from rumo.planos
    where codigo='PREMIUM' and ativo=true limit 1;
  if v_gratuito is null or v_premium is null then
    raise exception 'Planos RUMO não configurados';
  end if;

  update rumo.assinaturas set
    plano_id=case when v_ativo then v_premium else v_gratuito end,
    status='ATIVA',
    inicio_em=case when v_ativo then coalesce(inicio_em,now()) else inicio_em end,
    vence_em=case when v_ativo then p_vencimento else null end,
    renovacao_automatica=case when v_ativo then coalesce(p_renovacao,false) else false end,
    periodo_contratado=case when v_ativo then v_periodo else null end,
    preco_contratado=case when v_ativo then null else 0 end,
    mercado_pago_preapproval_id=null,
    provedor_assinatura='GOOGLE_PLAY',
    updated_at=now()
  where usuario_id=p_usuario_id;

  return v_ativo;
end;
$$;

revoke all on function rumo.aplicar_estado_play(uuid,text,text,text,text,timestamptz,boolean,text,boolean)
  from public, anon, authenticated;
grant execute on function rumo.aplicar_estado_play(uuid,text,text,text,text,timestamptz,boolean,text,boolean)
  to service_role;

commit;
