/**
 * Indica uma sessão iniciada pelo aplicativo Android da Google Play (TWA).
 * Não é autorização de pagamento ou autenticação: somente controla a interface.
 * O sinalizador é guardado por ABA, sem contaminar o navegador web em outra aba.
 */
const CHAVE_SESSAO = "rumo-play-twa";
const PACOTE_ANDROID = "br.com.nethanel.rumo";

export function isPlayStoreMode() {
  if (typeof window === "undefined") return false;

  const origemTwa = (document.referrer || "").startsWith(
    `android-app://${PACOTE_ANDROID}`
  );

  const origemDaAbertura = new URLSearchParams(
    window.location.search
  ).get("rumo_source") === "play";

  if (origemTwa || origemDaAbertura) {
    try {
      window.sessionStorage.setItem(CHAVE_SESSAO, "1");
    } catch {
      // Se o armazenamento for bloqueado, vale apenas o sinal de entrada.
    }
    return true;
  }

  try {
    return window.sessionStorage.getItem(CHAVE_SESSAO) === "1";
  } catch {
    return false;
  }
}

/**
 * Preserva o sinalizador da TWA após o login Google e a troca de página.
 * Evita reexibir pagamento web dentro do app Android após OAuth.
 */
export function getAppRedirectUrl(caminho) {
  if (typeof window === "undefined") return caminho;
  const url = new URL(caminho, window.location.origin);
  if (isPlayStoreMode()) url.searchParams.set("rumo_source", "play");
  return url.toString();
}
