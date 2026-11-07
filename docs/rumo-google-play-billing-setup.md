# RUMO — Preparação para Google Play Billing (não publicada)

**Estado:** implementação em branch de prévia, SEM acesso liberado em produção. A versão 0.3.0 publicada permanece intacta.
**Android package:** `br.com.nethanel.rumo`
**Hospedagem web:** `https://rumo.nethanel.com.br`
**Supabase:** projeto "Dalton Pessoal", schema `rumo` (compartilhado com outros aplicativos).

## O que foi implementado no código web

- O paywall identifica o canal Play (referrer Android, `?platform=googleplay` e Android standalone) e **nunca** oferece Mercado Pago como fallback dentro desse canal.
- O preço vem de `getDigitalGoodsService().getDetails()`, não de um valor fixo em JavaScript.
- O clique em assinatura abre `PaymentRequest` para o produto correto.
- O token é verificado no servidor via `rumo-play-verify`, sem confiar no navegador.
- Existe opção de restaurar compras, atualização do contexto Premium e link para gerenciar a assinatura na Play Store.
- O checkout da versão web comum fica preservado; ATENÇÃO: o endpoint legado Mercado Pago é um endpoint Vercel e sua disponibilidade no Cloudflare deve ser corrigida/avaliada separadamente.

## Ações necessárias no Google Play Console (NÃO executadas)

1. No app RUMO, acessar **Monetizar com o Google Play > Produtos > Assinaturas** (ou equivalente na interface atual).
2. Criar e ativar **duas assinaturas** com IDs exatos, cada uma com um plano básico auto-renovável:
   - `rumo_premium_mensal`, período mensal; valor sugerido **R$ 19,90**.
   - `rumo_premium_anual`, período anual; valor sugerido **R$ 199,00**.
3. Confirmar disponibilidade no Brasil, status ativo e preço apresentado na Play; qualquer mudança de preços deve partir do Play Console.
4. Confirmar perfil de pagamentos do Google Play e dados de comerciante concluídos.
5. Em **Configuração > Acesso à API**, conceder permissão mínima de consulta/gerenciamento de assinaturas à conta de serviço Google Cloud vinculada. Ativar Google Play Android Developer API.
6. Guardar o JSON da conta de serviço **apenas** como segredo de backend `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` no Supabase. **Nunca** publicar JSON ou chave privada no GitHub, no Vite (`VITE_`) ou no aplicativo.

## Backend e banco — preparados, não implantados

1. Criar uma migração local com `supabase migration new rumo_google_play_billing`.
2. Copiar o conteúdo de `docs/google-play-billing-schema.sql` para a migração gerada.
3. Revisar a migração e executar primeiro em ambiente de homologação, verificar RLS e o plano GRATUITO/PREMIUM. **Não aplicar no projeto compartilhado de produção sem aprovação.**
4. Publicar a Edge Function `supabase/functions/rumo-play-verify/index.ts` usando `supabase functions deploy rumo-play-verify`, após cadastrar o segredo de serviço. Configurar validação de JWT.
5. Testar confirmação pelo método `purchases.subscriptionsv2.get` e `purchases.subscriptions.acknowledge`.
6. Confirmar que o pagamento já aprovado não pode ser reutilizado por outra conta Rumo; que pagamentos pendentes **não** liberam Premium; e que só o backend pode mudar dados de assinatura.

**Importante:** a tabela exclusiva guarda o `purchase_token` para revalidação de renovações; usa RLS e revoga acesso de `anon`/`authenticated`. Tratar o token como segredo e evitar registrá-lo em logs. A migração é uma proposta; exigir revisão de segurança antes de aplicar.

## App Android (obrigatório criar novo AAB)

Este repositório contém o frontend React/Vite e **não inclui o código-fonte Android/TWA que gerou a versão publicada**. Portanto a alteração do React, sozinha, **não habilita** o Google Play Billing no aplicativo já instalado.

Recuperar o projeto Android original do RUMO e:
- Se for Bubblewrap: configurar `features.playBilling.enabled=true` no `twa-manifest.json`; atualizar Bubblewrap (`@bubblewrap/cli@1.25.0` ou versão compatível atual), regenerar/compilar e validar a biblioteca Android Browser Helper de Billing **1.2.0+** (Play Billing Library 8.3.0+).
- Se for Android Studio: integrar Android Browser Helper `com.google.androidbrowserhelper:billing:1.2.0`, `DelegationService` e manifesto conforme exemplo oficial.
- Verificar `assetlinks.json` e certificado de assinatura da Play. Incluir `?platform=googleplay` na URL inicial da TWA para sinalização explícita de canal.
- Assinar novo **AAB** com chave de upload correta, incrementar o `versionCode`, subir **somente em teste interno** e validar com conta de teste.

**Biblioteca exigida:** desde 31/08/2026, Google Play requer Play Billing Library 8+ em novas publicações/atualizações que usam faturamento.

Referências:
- https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
- https://github.com/GoogleChrome/android-browser-helper/blob/main/playbilling/docs/play-billing-library-8-migration.md
- https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get
- https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/acknowledge

## Pendência de produção crítica: ciclo de vida das assinaturas

Antes de comercializar, implementar/configurar **Real-time Developer Notifications (RTDN)** ou conciliação segura periódica: renovações, cancelamentos, reembolsos, vencimentos, grace period e account hold devem atualizar o plano do Rumo sem depender de o usuário clicar em "Restaurar". O código atual revalida token quando o usuário restaura/visita o fluxo, mas **não substitui RTDN**.

## Testes obrigatórios antes de publicar

| Cenário | Esperado |
|---|---|
| Android Play, mensal/anual | checkout nativo Play, preço real, sem Mercado Pago |
| Navegador web comum | checkout web legado (verificar que o endpoint web realmente funciona) |
| Google Play indisponível | mensagem de erro, sem checkout externo no APK |
| Test purchase aprovado | token validado no Google, Premium após backend confirmar |
| Compra pendente/recusada | sem Premium |
| Token de outro usuário | não vincula a outra conta |
| Conta excluída | não ativa Premium |
| Renovação/cancelamento/estorno | status conciliado, sem manter acesso indevido |
| Restore em outro aparelho | compra associada à conta correta |
| Assinatura antiga Mercado Pago | permanece válida, sem duplicação/migração automática |

**Publicar produção somente após todos os testes e autorização expressa.**
