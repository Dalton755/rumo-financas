# Rumo → Google Play (preparação de homologação)

Data da auditoria: 22/10/2026 · Repositório: `Dalton755/rumo-financas` · Domínio pretendido: `https://rumo.nethanel.com.br`

## Estratégia
O Rumo é um React/Vite com manifesto PWA e login Supabase. Recomenda-se **Trusted Web Activity (TWA) + Bubblewrap**, preservando o aplicativo web e as contas já existentes. O Android abre a origem própria em tela cheia, sem fazer um clone de dados ou mudar banco de dados. A publicação na Google Play só acontecerá depois da homologação.

A branch contém `android/twa-manifest.json` com identificador provisório `br.com.nethanel.rumo`, integração de **compilação de APK de debug via GitHub Actions** (`.github/workflows/android-twa-debug.yml`) e sinalização de sessão Android para **ocultar o checkout Mercado Pago somente dentro da TWA**. A versão web mantém o checkout e as assinaturas existentes continuam reconhecidas pelo backend.

**O APK de debug foi compilado e instalado em aparelho real, e o usuário confirmou seu funcionamento.** Ainda não existe AAB assinado para publicação. Para ocultar a barra de endereço da TWA é necessária associação Digital Asset Links com certificado válido da versão instalada.

## Diagnóstico observado no código
- `public/manifest.webmanifest` já define ícones 192, 512, maskable, cores e `display: standalone`. Esta branch adiciona ID estável, idioma e categorias ao manifesto.
- `vercel.json` não incluía rewrites para `/planejamento`, `/compromissos`, `/calculos` e `/gerencial`: esta branch acrescenta os caminhos para abrir links diretos/recarregar telas.
- `src/pages/Login.jsx` permite cadastro por email/senha e login Google, com retorno para a origem do Rumo. É obrigatório testar autenticação no contêiner TWA, links de recuperação e sessão persistente.
- `src/pages/Premium.jsx` inicia checkout do **Mercado Pago** para assinatura mensal e anual. **Bloqueador de publicação**: compra de recursos digitais dentro de app distribuído na Play exige adequação à Política de pagamentos. Decidir entre implementar Google Play Billing (ou programa de cobrança alternativa habilitado, quando elegível) **ou** oferecer na versão Play somente o uso de assinaturas já adquiridas, sem permitir compras nem links para checkout no app. A TWA pode integrar Google Play Billing com **Digital Goods API + Payment Request API**, com validação de compras pelo backend. **Não remover a cobrança do site nem aplicar solução de produção sem revisão.**
- `src/routes/AppRoutes.jsx` não expõe rota específica para política de privacidade ou exclusão de conta. Não há funcionalidade de exclusão identificada nos caminhos auditados: precisa implementar pedido/exclusão verificável e auditar limpeza dos dados em Supabase/serviços integrados. Exige também recurso web externo que funcione sem instalar o app. **Atenção:** o projeto Supabase pode compartilhar autenticação com outros apps da Nethanel (por exemplo EBD Manager e Zaia). Excluir a identidade global de `auth.users` sem auditar vínculos poderia excluir acesso aos outros produtos: remover primeiro os dados do schema `rumo` com procedimento seguro e decidir de forma explícita quando a conta global pode ser excluída.
- Não foi localizado projeto Android/Capacitor nem `public/.well-known/assetlinks.json`. Não foi localizado `public/sw.js` — confirmar se existe outro registro de service worker e decidir experiência de erro de rede.

## Passos da homologação
1. Confirmar conta de desenvolvedor Nethanel e o **identificador definitivo**, sugestão provisória `br.com.nethanel.rumo`. Não registrar pacote com nome incerto.
2. Resolver **cobrança Play**, publicar **política de privacidade real**, implementar **exclusão de conta** e página de solicitação externa, e revisar **Segurança dos dados** e **Recursos financeiros** na Play Console.
3. O CI utiliza `@bubblewrap/cli@1.25.0` (que gera `targetSdkVersion 36`). Para geração manual, criar projeto TWA com Bubblewrap usando **HTTPS do domínio de produção**, preferencialmente num diretório de distribuição isolado. Comandos (na máquina de build com Android SDK/JDK):
   ```bash
   npm install --global @bubblewrap/cli
   bubblewrap init --manifest=https://rumo.nethanel.com.br/manifest.webmanifest
   bubblewrap build
   ```
   O assistente solicitará nome do pacote, versão, chave de assinatura e outros detalhes. NÃO versionar arquivos `.jks`, `.keystore` ou senhas.
4. Criar **Android App Bundle (.aab)** assinado para a Play e APK para teste local, conforme comandos e opções da versão do Bubblewrap instalada. Ativar Play App Signing na Play Console.
5. Adicionar `public/.well-known/assetlinks.json` **somente após** obter a SHA-256 do certificado **App signing key** na Play Console; o certificado de upload pode ser diferente. Conteúdo de referência:
   ```json
   [{
     "relation":["delegate_permission/common.handle_all_urls"],
     "target":{"namespace":"android_app","package_name":"br.com.nethanel.rumo","sha256_cert_fingerprints":["SUBSTITUIR_SHA256_REAL"]}
   }]
   ```
   O arquivo acima é exemplo, NÃO deve ser publicado com o placeholder.
6. Testar **TWA em tela cheia**, OAuth Google, email, recuperação de senha, retorno de checkout (caso permitido), navegação Voltar, recarregamento, deep links, perda de internet, leitura e escrita Supabase; reproduzir fluxo de usuário gratuito e premium.
7. Preparar arte de listagem e declarações na Play Console. Fazer teste interno, depois teste fechado quando aplicável à conta, e só então requerer liberação de produção.

## Requisitos atuais para 2026
- Novos apps móveis submetidos após 31/08/2026 precisam **targetSdk 36 (Android 16)**, salvo exceções de plataforma. Conferir target gerado pelo Bubblewrap.
- Projetos que integram compras Google Play em TWA precisam **Play Billing Library 8+** desde 31/08/2026; para Bubblewrap usar **1.25.0+** e conferir a versão gerada do módulo `com.google.androidbrowserhelper:billing` (**1.2.0+**).
- A compilação inicial do Rumo tem **Play Billing desabilitado** por segurança: a interface Android oculta o checkout web, mas compra de Premium no Android permanece bloqueada até a integração de pagamentos Google Play validada no backend.
- A auditoria atual de `npm audit --audit-level=high` no GitHub encontrou **1 vulnerabilidade crítica e 4 altas** entre dependências do projeto web (incluindo `dompurify`, `vite` e dependências transitivas). **Resolver, testar regressões e passar no CI antes de qualquer lançamento.** Não fazer `npm audit fix --force` diretamente em produção.
- Apps com conta precisam permitir solicitação de exclusão **dentro do app e por recurso web externo**, juntamente com os dados correspondentes, ressalvadas retenções legais justificadas e divulgadas.
- Completar **Data safety** e **Financial features** na Play Console; finanças pessoais envolvem dados financeiros sensíveis e o formulário deve corresponder ao fluxo de dados real, inclusive integrações.
- Conta **pessoal** criada depois de 13/11/2023: geralmente exige teste fechado com **12 testadores opt-in por 14 dias contínuos** antes de pedir acesso à produção. Não assumir que isso se aplica a uma conta de organização.

## Referências oficiais
- Google Play API: https://support.google.com/googleplay/android-developer/answer/11926878
- Política de pagamentos: https://support.google.com/googleplay/android-developer/answer/10281818
- Programas de cobrança alternativa: https://support.google.com/googleplay/android-developer/answer/13821247
- Excluir conta: https://support.google.com/googleplay/android-developer/answer/13327111
- Segurança dos dados: https://support.google.com/googleplay/android-developer/answer/10787469
- Declaração de recursos financeiros: https://support.google.com/googleplay/android-developer/answer/13849271
- Testadores: https://support.google.com/googleplay/android-developer/answer/14151465
- TWA: https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
- Google Play Billing em TWA: https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing

## Acessar o APK de debug quando o build concluir com sucesso
GitHub → repositório `rumo-financas` → **Actions** → **Rumo Android TWA - APK de homologacao** → execução mais recente → **Artifacts** → `rumo-android-debug-apk`. Esta versão tem assinatura de debug efêmera e nunca deve ser enviada para a Play Console.

**Critério de saída:** após resolver bloqueadores e validar APK/AAB instalado, fazer PR separado de ajustes específicos para Play e publicar somente mediante autorização explícita.


## Progresso em 22/10/2026 — privacidade e segurança
- O usuário confirmou a instalação/abertura do APK de debug no Android.
- **Aplicado no Supabase `Dalton Pessoal`**: migration `rumo_playstore_solicitacoes_exclusao_20261022`, apenas tabela `rumo.solicitacoes_exclusao` com RLS para solicitações do próprio titular. A tabela estava vazia no teste e sem privilégios de leitura anônima ou exclusão pelo cliente.
- A interface `/excluir-conta`, política `/privacidade` e painel admin `/gerencial/exclusoes` estão **na branch de homologação, não em produção**. O pedido não provoca exclusão automática. Procedimento: `processamento-exclusoes.md`.
- **Falha grave preexistente encontrada e corrigida no banco:** quatro views financeiras em `public` usavam permissões de proprietário e podiam retornar registros de outros usuários, inclusive na sessão anônima. A migration `rumo_proteger_views_financeiras_20261022` aplicou `security_invoker=true` e removeu acesso do papel `anon`, preservando SELECT com RLS para usuários autenticados. Testes: `authenticated` com usuário inexistente vê zero registros; com sessão simulada válida vê somente seu próprio dashboard. **Nenhum dado foi removido.** É prudente revisar histórico de acessos/logs e funções privilegiadas restantes.
- A correção de dependências pelo CI gerou Vite `8.3.5` e lockfile auditado. O workflow `Security checks` passou em `npm audit --audit-level=high`, lint e build na execução de referência `39878702064` (GitHub Actions), sem lançamento em produção.
- **Política de pagamentos:** para primeira publicação, o Rumo pode ser distribuído como aplicativo de **somente consumo**, sem compras ou links de checkout no Android; assinaturas adquiridas fora da Play continuam sendo reconhecidas. A interface do app Play foi preparada para ocultar checkout do Mercado Pago. Só ativar Google Play Billing se houver produtos cadastrados, credenciais de desenvolvedor, verificação server-side e testes; não fazer cobrança in-app sem a integração.
- As páginas web novas permanecem sem validação de acesso público no domínio até publicação autorizada.
