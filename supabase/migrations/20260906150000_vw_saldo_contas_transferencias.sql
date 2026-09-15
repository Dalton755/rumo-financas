begin;


create or replace view rumo.vw_saldo_contas
as

select
    c.id,
    c.usuario_id,
    c.nome,
    c.banco,
    c.tipo,
    c.saldo_inicial,

    rumo.calcular_saldo_conta(
        c.usuario_id,
        c.id,
        rumo.data_financeira_atual()
    ) as saldo_atual

from rumo.contas c;


commit;