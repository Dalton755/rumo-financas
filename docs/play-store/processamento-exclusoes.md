# Protocolo de exclusão de dados — Rumo

Status: **somente procedimento para homologação**. Não executar exclusão por este documento sem análise do caso concreto e autorização operacional.

## Fluxo atual

O usuário acessa `/excluir-conta`, autentica-se via Supabase (senha ou Google) e envia um pedido. O banco recebe uma linha em `rumo.solicitacoes_exclusao`, com RLS: somente o usuário consulta/solicita seus próprios pedidos. A equipe proprietária acompanha os pedidos em `/gerencial/exclusoes` (API protegida por `rumo.usuarios_privilegiados`). O registro do pedido **não apaga dados nem cancela cobranças automaticamente**.

O banco Supabase `Dalton Pessoal` reúne outras aplicações; é **proibido excluir diretamente `auth.users`, `public.profiles` ou quaisquer tabelas de outros schemas** apenas em resposta a um pedido do Rumo.

## Lista obrigatória por usuário

- Dados do schema `rumo`: `contas`, `movimentacoes`, `categorias`, `compromissos`, `compromissos_ocorrencias`, `dividas`, `plano_quitacao`, `cartoes`, `compras_cartao`, `parcelas_cartao`, `objetivos`, `aportes_objetivos`, `metas`, `orcamentos`, `alertas`, `padroes_inteligentes`, `configuracoes`, `importacoes`, `importacoes_itens`, `open_finance_* `, `assinaturas` e `pagamentos_assinaturas`.
- Buscar quaisquer snapshots/backup `rumo.bkp_%` que contenham linhas com `usuario_id`. Estes backups devem respeitar a política de retenção e não podem ser esquecidos; registrar se e por que algo é conservado temporariamente.
- Conferir quaisquer objetos enviados para Supabase Storage e cópias de arquivo importado (se houver).
- Integrações Pluggy/Open Finance: desconectar/revogar conexões com provedor, tratar cópias do Rumo e documentar retenção legal.
- Mercado Pago: verificar assinaturas ativas, autorizar cancelamento, confirmar resposta/webhooks para impedir **novas cobranças** e reativações automáticas. Registros fiscais podem exigir retenção legal específica.
- Logs de aplicação, backups gerenciados por plataforma, exportações e relatórios que contenham dados financeiros identificáveis: verificar política e janela de retenção.
- Excluir ou anonimizar todos os registros dentro do **escopo Rumo** em ordem que respeite as chaves estrangeiras e triggers. **Não depender só de `DELETE FROM rumo.contas`** — várias tabelas não possuem `usuario_id` e dependem de entidades-pai.
- Preservar cadastro e autenticação compartilhados enquanto houver vínculo legítimo com outros aplicativos Nethanel; oferecer fluxo específico caso o usuário também queira encerrar a identidade global.

## Etapas de atendimento

1. Confirmar que `solicitacoes_exclusao.usuario_id` é o titular autenticado. Não atender pedidos não autenticados sem verificação de identidade equivalente.
2. Mudar o status administrativamente para `EM_ANALISE` via sessão segura. **Não há endpoint público de UPDATE ou DELETE**.
3. Reunir relatório da cobertura e dos provedores externos, verificando o plano contratado e faturas.
4. Executar tratamento da assinatura/integrações e depois remoção dos dados apenas após confirmar escopo e eventuais retenções legais.
5. Conferir que a consulta em todas as tabelas relevantes retorna zero dados que deveriam ser eliminados, inclusive snapshots e integrações.
6. Registrar evidências administrativas apropriadas com dados mínimos e então marcar `CONCLUIDA`, `concluida_em=now()`; não registrar sucesso antes da verificação.
7. Informar o usuário por canal apropriado quando solicitado. Se houver retenção obrigatória, explicar motivo e duração.

## Segurança

- Nunca expor `SUPABASE_SERVICE_ROLE_KEY`, tokens financeiros, senhas ou chaves privadas no navegador, repositório, relatórios ou respostas de API.
- Não criar endpoint destrutivo sem autenticação revalidada e aprovação explícita do proprietário; optar por operação interna com auditoria.
- Todo endpoint administrativo deve confirmar privilégios **no servidor** a cada requisição.
- Múltiplos serviços podem continuar sincronizando dados após a exclusão: revogar conexões e bloquear reimportações.
- Não usar dados pessoais reais em testes da Play Store. Testar com contas criadas especificamente para homologação.

## Limites atuais

A interface de solicitação e a tabela de status estão disponíveis **no banco** e **na branch de homologação**, respectivamente. O processo de exclusão dos dados ainda é manual, precisa de procedimento operacional validado e **não deve ser divulgado como exclusão imediata/automática**.

