begin;

-- =========================================================
-- GARANTIR USUÁRIO DO RUMO + ASSINATURA GRATUITA
-- =========================================================
-- Executada quando um usuário autenticado acessa o Rumo.
--
-- Garante:
--   1. configuracoes do Rumo;
--   2. assinatura base GRATUITA.
--
-- Se já existir qualquer assinatura para o usuário,
-- inclusive PREMIUM, ela é preservada.
-- =========================================================

create or replace function rumo.garantir_usuario_rumo()
returns void
language plpgsql
security definer
set search_path to 'rumo', 'public', 'pg_temp'
as $function$
declare

    v_usuario_id uuid;
    v_plano_gratuito_id uuid;

begin

    v_usuario_id :=
        auth.uid();


    if v_usuario_id is null then

        raise exception
            'Usuário não autenticado';

    end if;


    -- =====================================================
    -- CONFIGURAÇÕES DO RUMO
    -- =====================================================

    insert into rumo.configuracoes (
        usuario_id,
        frequencia_recebimento,
        tema,
        created_at
    )
    values (
        v_usuario_id,
        'semanal',
        'dark',
        now()
    )

    on conflict (usuario_id)
    do nothing;


    -- =====================================================
    -- PLANO GRATUITO
    -- =====================================================

    select id
    into v_plano_gratuito_id
    from rumo.planos
    where codigo = 'GRATUITO'
      and ativo = true
    limit 1;


    if v_plano_gratuito_id is null then

        raise exception
            'Plano GRATUITO ativo não encontrado';

    end if;


    -- =====================================================
    -- ASSINATURA BASE
    --
    -- UNIQUE(usuario_id) impede duplicidade.
    -- ON CONFLICT preserva qualquer assinatura existente,
    -- inclusive PREMIUM.
    -- =====================================================

    insert into rumo.assinaturas (
        usuario_id,
        plano_id,
        status,
        inicio_em,
        vence_em,
        renovacao_automatica,
        preco_contratado,
        periodo_contratado,
        created_at,
        updated_at
    )
    values (
        v_usuario_id,
        v_plano_gratuito_id,
        'ATIVA',
        now(),
        null,
        false,
        0.00,
        null,
        now(),
        now()
    )

    on conflict (usuario_id)
    do nothing;

end;
$function$;


revoke all
on function rumo.garantir_usuario_rumo()
from public;


grant execute
on function rumo.garantir_usuario_rumo()
to authenticated;


commit;
