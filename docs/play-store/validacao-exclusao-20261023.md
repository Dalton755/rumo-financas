# Rumo — verificação segura do fluxo de exclusão (23/10/2026)

**Status: PARCIAL / sem exclusão real executada.** Auditoria feita diretamente no projeto Supabase compartilhado `Dalton Pessoal` (`sxghzubovthsvmfqncch`) por consultas de leitura. Nenhuma conta, linha, arquivo ou pagamento foi excluído, e não houve alteração de schema/deploy.

## Verificações realizadas

1. `rumo.solicitacoes_exclusao` **existe** e tem RLS. As policies `SELECT` e `INSERT` limitam ao titular `auth.uid() = usuario_id`; cliente autenticado não tem permissões para `UPDATE` ou `DELETE`. `anotacao_interna` não tem permissão de leitura via cliente. `anon` não possui acesso de leitura.
2. Consulta SQL em transação `BEGIN ... SET LOCAL ROLE authenticated ... ROLLBACK`, simulando um UUID de sessão que não corresponde a conta existente, retornou **zero solicitações** sem alterar dados. Esse é um teste de isolamento de leitura, **não** substitui teste real de criação/execução de exclusão.
3. No momento da consulta, havia **zero solicitações de exclusão**, portanto ainda não há evidência de um pedido ponta a ponta nem de operação de limpeza.
4. Foram examinadas as foreign keys do schema `rumo`: há entidades sem `usuario_id` (notadamente `aportes_objetivos` e `plano_quitacao`) que devem ser removidas por relação aos respectivos objetivos/dívidas. Exclusão de entidades-pai antes de dependentes pode falhar por chaves estrangeiras.
5. Existem múltiplas tabelas históricas `rumo.bkp_*` com `usuario_id`. Não ignorar essas cópias ao definir retenção/deleção e documentação de auditoria.
6. O endpoint `GET /api/privacidade/solicitacoes` **apenas lista pedidos** para perfil `DONO`. O formulário público **registra um pedido**. Atualmente não há processador que revogue Pluggy/Mercado Pago e apague todos os dados do Rumo ao marcar concluído.
7. Os usuários do Supabase/Auth são compartilhados com outros produtos: `auth.users` e `public.profiles` **não devem ser excluídos genericamente** ao apagar dados do Rumo. É necessário definir como impedir acesso ou recriação de dados do Rumo após encerramento da conta específica, preservando legitimamente outros aplicativos se aplicável.

## Ferramenta de preflight

O SQL `docs/play-store/sql/03_preflight_exclusao_readonly.sql` consulta, **sem escrita**, a quantidade de registros associados a um usuário em **40 origens**: tabelas do Rumo, backups e tabelas dependentes. O script foi executado no banco com UUID sintético e retornou 0 para as 40 origens, conforme esperado. Isso valida a execução da consulta e mostra as localizações que precisam ser verificadas; **não confirma exclusão de uma conta existente**.

## Critérios para aprovação da exclusão (ainda não atendidos)

- [ ] Conta de teste exclusiva criada no app com autenticação por e-mail/senha e valores totalmente fictícios.
- [ ] Pedido enviado por `/excluir-conta` e exibido no painel `/gerencial/exclusoes` como `PENDENTE`, sem pedir senha ao operador.
- [ ] Solicitação ligada ao titular real e nenhum acesso a pedidos de terceiros.
- [ ] Processador operacional implementado e testado, com duas etapas e auditoria, capaz de tratar assinatura Mercado Pago e conexões Pluggy antes de excluir os dados do Rumo.
- [ ] Execução limitada à conta de teste, sem apagar `auth.users` ou `public.profiles` compartilhados; registros de outros aplicativos intactos.
- [ ] Preflight após o processamento demonstra ausência dos dados apagáveis em **todas as origens aplicáveis**, incluídas as tabelas relacionadas e cópias; retenções legais justificadas e períodos documentados.
- [ ] Bloqueio de reimportação/sincronização, comunicação ao titular e status `CONCLUIDA` somente após verificação.
- [ ] Revisão de arquivo/storage, logs, backups do provedor, políticas e prazo de resposta.

**Conclusão:** a **entrada do pedido** e seus controles de acesso estão tecnicamente presentes, porém a **exclusão efetiva da conta e dados** continua como pendência de conformidade para lançamento público. Não declarar "exclusão validada" ou marcar pedido como `CONCLUIDA` sem execução e provas. Não usar contas de produção para teste.

## Implementação adicional (em homologação, sem deploy)

- `api/_lib/rumoExclusaoPreflight.js` calcula contagens por usuário em 40 fontes, incluindo 14 backups históricos e 2 tabelas dependentes; falha fechada quando alguma contagem é incompleta. Retorna somente contagens, sem dados pessoais das movimentações. Inclui alertas de pagamentos e conexões financeiras.
- `GET /api/privacidade/preflight?solicitacao_id=<UUID>` exige token válido, privilégio `DONO` validado no servidor e solicitação aberta; é **somente leitura** e não executa exclusão.
- `src/pages/SolicitacoesExclusao.jsx`: botão **Conferir dados (sem excluir)** com totais e bloqueadores. Nenhum botão destrutivo foi liberado.
- `scripts/tests/rumo-exclusao-preflight.test.mjs`: testes automatizados para 40 contagens, integrações, backup e falha segura, adicionados ao CI Android TWA.

**Importante:** a contagem através do REST Supabase nos relacionamentos indiretos requer teste com solicitação/conta de homologação reais em ambiente autorizado. A configuração da branch não altera o aplicativo já publicado. Um resultado de preflight não constitui prova de exclusão efetiva.
