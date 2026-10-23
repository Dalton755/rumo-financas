# Play Console — Inventário de dados do Rumo

**Rascunho técnico para preencher Data Safety e Recursos financeiros.** Não submeter automaticamente. Revisar cada declaração conforme o funcionamento real em produção.

## Dados e finalidade observados

| Grupo | Exemplos no código/banco | Origem / finalidade | Revisar na Play Console |
| --- | --- | --- | --- |
| Informações pessoais | e-mail, user id Supabase, dados básicos login Google | autenticação e segurança | Email, IDs de usuários; nome se fornecido pelo Google |
| Informações financeiras | contas, saldos, receitas, despesas, transferências, cartões, dívidas, parcelas, metas | planejamento e registro | Outras informações financeiras, histórico de compras/transações |
| Compras e assinaturas | plano, identificadores de transação, Mercado Pago | liberar Premium e cobrança web | Histórico de compras; avaliar dados de pagamento efetivamente acessados |
| Integrações financeiras | Pluggy, instituições, contas sincronizadas e movimentações | importação bancária autorizada | Dados financeiros e compartilhamento com fornecedor |
| Arquivos importados | nome, hash, itens de arquivo, dados originais | importar/extrair movimentações | Arquivos e documentos, informações financeiras, se aplicável |
| Uso técnico | logs, sessão, dados de dispositivo/erro na plataforma | diagnóstico, segurança, prevenção de fraudes | Identificadores do dispositivo/uso; confirmar provedores e SDKs |

**Atenção:** 'compartilhado' na Play pode ter exceções para processamento como prestador de serviços. Não marcar genericamente 'não compartilhado' sem revisar com cada fornecedor e termos contratuais. Verificar transferências internacionais, coleta opcional/obrigatória e criptografia em trânsito.

## Declaração de recursos financeiros

O Rumo é um app de **gerenciamento das finanças pessoais**, sem oferta direta de empréstimos, serviços bancários ou transferência real de dinheiro. A opção **Outro** nos serviços de suporte financeiro pode se aplicar. Confirme na Play Console, descrevendo que 'transferência entre contas' no Rumo é **apenas registro contábil interno**, não movimentação bancária. A categoria 'consultoria financeira' deve ser avaliada somente se os recursos de IA fizerem recomendações que se enquadrem nessa definição; não é correto classificar tudo como assessoria regulamentada sem análise.

A seção é obrigatória mesmo se o app não oferecer produtos de crédito.

## Itens que exigem confirmação antes de marcar na Play

- Operador jurídico do Rumo / dados legais da Nethanel, canal de suporte real e endereço oficial da política de privacidade.
- Tratamento efetivo de dados sensíveis, logs, rastreamento e SDKs no APK/TWA, cookies e provedor de pagamentos.
- Como excluir informações dos fornecedores (Mercado Pago, Pluggy e integrações Google).
- Procedimento completo de exclusão do Rumo e retenção legal/documental, com prazo de resposta e acompanhamento.
- Apresentar link externo ativo `https://rumo.nethanel.com.br/excluir-conta` e política `https://rumo.nethanel.com.br/privacidade` **somente depois que a branch web for publicada**.
- Necessidade de conta de testes para revisão do Google, com dados fictícios e recursos Premium demonstráveis.

## Pagamentos na v1

Estratégia aprovada apenas em nível técnico: lançar a TWA como app de **somente consumo**, sem compras e sem links de pagamento externo dentro do aplicativo. O login no Rumo permite acessar gratuitamente e usar Premium previamente contratado. O Mercado Pago no site não deve ser apresentado como link de compra in-app. O Play Billing será necessário se houver contratação digital **dentro do app**, salvo exceção expressa de política ou programa específico.

## Fontes oficiais (conferidas em outubro de 2026)

- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/13849271
- https://support.google.com/googleplay/android-developer/answer/10281818
- https://support.google.com/googleplay/android-developer/answer/13327111
