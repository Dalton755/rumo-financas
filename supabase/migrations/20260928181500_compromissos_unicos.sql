alter table rumo.compromissos
  drop constraint if exists compromissos_frequencia_check;

alter table rumo.compromissos
  add constraint compromissos_frequencia_check
  check (
    frequencia = any (
      array[
        'unico'::text,
        'semanal'::text,
        'quinzenal'::text,
        'mensal'::text,
        'anual'::text
      ]
    )
  );


create or replace function rumo.criar_compromisso_unico(
    p_nome text,
    p_categoria_id uuid,
    p_conta_id uuid,
    p_vencimento date,
    p_tipo_valor text,
    p_valor numeric
)
returns jsonb
language plpgsql
security invoker
set search_path = 'rumo', 'public'
as $function$
declare
    v_usuario_id uuid;
    v_compromisso_id uuid;
    v_ocorrencia_id uuid;
    v_nome text;
    v_tipo_valor text;
    v_valor numeric(14,2);
begin
    v_usuario_id := auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não autenticado.';
    end if;

    v_nome := nullif(trim(coalesce(p_nome, '')), '');

    if v_nome is null then
        raise exception 'Informe o nome do compromisso.';
    end if;

    if p_vencimento is null then
        raise exception 'Informe o vencimento.';
    end if;

    v_tipo_valor := lower(coalesce(p_tipo_valor, 'fixo'));

    if v_tipo_valor not in ('fixo', 'variavel') then
        raise exception 'Tipo de valor inválido.';
    end if;

    v_valor := case
        when p_valor is null then null
        else round(p_valor::numeric, 2)
    end;

    if v_valor is not null and v_valor <= 0 then
        raise exception 'Informe um valor maior que zero.';
    end if;

    if v_tipo_valor = 'fixo' and v_valor is null then
        raise exception 'Informe o valor do compromisso.';
    end if;

    if p_categoria_id is not null
       and not exists (
          select 1
          from rumo.categorias c
          where c.id = p_categoria_id
            and c.usuario_id = v_usuario_id
            and c.ativo = true
       ) then
        raise exception 'Categoria inválida.';
    end if;

    if p_conta_id is not null
       and not exists (
          select 1
          from rumo.contas c
          where c.id = p_conta_id
            and c.usuario_id = v_usuario_id
            and c.ativo = true
       ) then
        raise exception 'Conta inválida.';
    end if;

    insert into rumo.compromissos (
        usuario_id,
        categoria_id,
        conta_id,
        nome,
        frequencia,
        intervalo,
        dia_semana,
        dia_mes,
        data_inicio,
        tipo_valor,
        valor_padrao,
        valor_estimado,
        ativo,
        updated_at
    )
    values (
        v_usuario_id,
        p_categoria_id,
        p_conta_id,
        v_nome,
        'unico',
        1,
        null,
        null,
        p_vencimento,
        v_tipo_valor,
        case when v_tipo_valor = 'fixo' then v_valor else null end,
        case when v_tipo_valor = 'variavel' then v_valor else null end,
        true,
        now()
    )
    returning id into v_compromisso_id;

    insert into rumo.compromissos_ocorrencias (
        usuario_id,
        compromisso_id,
        vencimento,
        valor_previsto,
        status,
        updated_at
    )
    values (
        v_usuario_id,
        v_compromisso_id,
        p_vencimento,
        v_valor,
        'pendente',
        now()
    )
    returning id into v_ocorrencia_id;

    return jsonb_build_object(
        'compromisso_id', v_compromisso_id,
        'ocorrencia_id', v_ocorrencia_id,
        'vencimento', p_vencimento,
        'valor', v_valor
    );
end;
$function$;

revoke execute on function rumo.criar_compromisso_unico(text, uuid, uuid, date, text, numeric) from public;
revoke execute on function rumo.criar_compromisso_unico(text, uuid, uuid, date, text, numeric) from anon;
grant execute on function rumo.criar_compromisso_unico(text, uuid, uuid, date, text, numeric) to authenticated;
