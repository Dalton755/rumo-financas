begin;


-- =========================================================
-- PERFIL GLOBAL
-- =========================================================
-- auth.users é compartilhado entre os produtos da NETHANEL.
-- Portanto, este trigger não deve criar registros específicos
-- do Rumo.
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin

    insert into public.profiles (
        id,
        nome,
        frequencia_recebimento,
        created_at,
        updated_at
    )
    values (
        new.id,

        coalesce(
            nullif(
                new.raw_user_meta_data->>'name',
                ''
            ),

            nullif(
                new.raw_user_meta_data->>'full_name',
                ''
            ),

            nullif(
                new.raw_user_meta_data->>'nome',
                ''
            ),

            split_part(
                coalesce(
                    new.email,
                    ''
                ),
                '@',
                1
            ),

            ''
        ),

        'semanal',

        now(),

        now()
    )

    on conflict (id)
    do nothing;


    return new;

end;
$function$;



-- =========================================================
-- INICIALIZAÇÃO DO USUÁRIO NO RUMO
-- =========================================================
-- É chamada somente quando um usuário autenticado acessa
-- o Rumo.
--
-- Isso permite compartilhar auth.users com outros produtos
-- sem criar automaticamente dados do Rumo.
-- =========================================================

create or replace function rumo.garantir_usuario_rumo()
returns void
language plpgsql
security definer
set search_path to 'rumo', 'public', 'pg_temp'
as $function$
declare

    v_usuario_id uuid;

begin

    v_usuario_id :=
        auth.uid();


    if v_usuario_id is null then

        raise exception
            'Usuário não autenticado';

    end if;


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

end;
$function$;



revoke all
on function rumo.garantir_usuario_rumo()
from public;


grant execute
on function rumo.garantir_usuario_rumo()
to authenticated;


commit;