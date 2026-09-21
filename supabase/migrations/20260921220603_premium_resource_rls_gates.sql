-- Garante que recursos Premium não possam ser usados contornando a interface.
-- Policies RESTRICTIVE são somadas às policies de propriedade já existentes.

drop policy if exists metas_recurso_gate on rumo.metas;
create policy metas_recurso_gate on rumo.metas as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('METAS'))
with check (rumo.usuario_tem_recurso('METAS'));

drop policy if exists objetivos_recurso_gate on rumo.objetivos;
create policy objetivos_recurso_gate on rumo.objetivos as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('OBJETIVOS'))
with check (rumo.usuario_tem_recurso('OBJETIVOS'));

drop policy if exists aportes_objetivos_recurso_gate on rumo.aportes_objetivos;
create policy aportes_objetivos_recurso_gate on rumo.aportes_objetivos as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('OBJETIVOS'))
with check (rumo.usuario_tem_recurso('OBJETIVOS'));

drop policy if exists dividas_recurso_gate on rumo.dividas;
create policy dividas_recurso_gate on rumo.dividas as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('DIVIDAS'))
with check (rumo.usuario_tem_recurso('DIVIDAS'));

drop policy if exists plano_quitacao_recurso_gate on rumo.plano_quitacao;
create policy plano_quitacao_recurso_gate on rumo.plano_quitacao as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('DIVIDAS'))
with check (rumo.usuario_tem_recurso('DIVIDAS'));

drop policy if exists cartoes_recurso_gate on rumo.cartoes;
create policy cartoes_recurso_gate on rumo.cartoes as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('CARTOES'))
with check (rumo.usuario_tem_recurso('CARTOES'));

drop policy if exists compras_cartao_recurso_gate on rumo.compras_cartao;
create policy compras_cartao_recurso_gate on rumo.compras_cartao as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('CARTOES'))
with check (rumo.usuario_tem_recurso('CARTOES'));

drop policy if exists parcelas_cartao_recurso_gate on rumo.parcelas_cartao;
create policy parcelas_cartao_recurso_gate on rumo.parcelas_cartao as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('CARTOES'))
with check (rumo.usuario_tem_recurso('CARTOES'));

drop policy if exists orcamentos_recurso_gate on rumo.orcamentos;
create policy orcamentos_recurso_gate on rumo.orcamentos as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('ORCAMENTO'))
with check (rumo.usuario_tem_recurso('ORCAMENTO'));

drop policy if exists alertas_recurso_gate on rumo.alertas;
create policy alertas_recurso_gate on rumo.alertas as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('ALERTAS_INTELIGENTES'))
with check (rumo.usuario_tem_recurso('ALERTAS_INTELIGENTES'));

drop policy if exists importacoes_recurso_gate on rumo.importacoes;
create policy importacoes_recurso_gate on rumo.importacoes as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('IMPORTADOR_FINANCEIRO'))
with check (rumo.usuario_tem_recurso('IMPORTADOR_FINANCEIRO'));

drop policy if exists importacoes_itens_recurso_gate on rumo.importacoes_itens;
create policy importacoes_itens_recurso_gate on rumo.importacoes_itens as restrictive for all to authenticated
using (rumo.usuario_tem_recurso('IMPORTADOR_FINANCEIRO'))
with check (rumo.usuario_tem_recurso('IMPORTADOR_FINANCEIRO'));
