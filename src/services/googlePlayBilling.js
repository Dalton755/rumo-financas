// RUMO: o canal instalado pela Play Store deve usar somente Google Play Billing.
// Os IDs abaixo precisam ser cadastrados como assinaturas no Play Console.
export const PLAY_PRODUCTS = Object.freeze({
  MENSAL: "rumo_premium_mensal",
  ANUAL: "rumo_premium_anual",
});
const PAYMENT_METHOD = "https://play.google.com/billing";
const CHANNEL_KEY = "rumo:play-billing-channel";
const SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions?package=br.com.nethanel.rumo";

export function isGooglePlayChannel() {
  if (typeof window === "undefined") return false;
  const referrer = String(document.referrer || "");
  const params = new URLSearchParams(window.location.search);
  const fromApp = /^android-app:\/\/br\.com\.nethanel\.rumo(?:\/|$)/i.test(referrer);
  const explicit = params.get("platform") === "googleplay";
  // Android standalone sem indicação clara também fica no fluxo Play:
  // melhor impedir checkout externo indevido do que abrir Mercado Pago no APK.
  const androidStandalone =
    /Android/i.test(navigator.userAgent || "") &&
    window.matchMedia?.("(display-mode: standalone)")?.matches;
  if (fromApp || explicit || androidStandalone) {
    try { sessionStorage.setItem(CHANNEL_KEY, "1"); } catch { /* sem storage */ }
    return true;
  }
  try { return sessionStorage.getItem(CHANNEL_KEY) === "1"; }
  catch { return false; }
}

export async function connectGooglePlay() {
  if (typeof window.getDigitalGoodsService !== "function" ||
      typeof window.PaymentRequest !== "function") {
    throw new Error("Esta versão do aplicativo não tem o faturamento Google Play habilitado. Atualize pela Play Store.");
  }
  const service = await window.getDigitalGoodsService(PAYMENT_METHOD);
  if (!service?.getDetails || !service?.listPurchases) {
    throw new Error("Não foi possível conectar ao serviço de pagamentos Google Play.");
  }
  const details = await service.getDetails(Object.values(PLAY_PRODUCTS));
  const products = {};
  for (const item of details || []) {
    if (item?.itemId && item?.price?.currency && Number.isFinite(Number(item.price.value))) {
      const amount = Number(item.price.value);
      products[item.itemId] = new Intl.NumberFormat("pt-BR", {
        style: "currency", currency: item.price.currency,
      }).format(amount);
    }
  }
  return { service, products };
}

async function verifyOnServer(body) {
  const { supabase } = await import("./supabase");
  const { data, error } = await supabase.functions.invoke("rumo-play-verify", { body });
  if (error || data?.error) {
    throw new Error(data?.message || "Não foi possível confirmar o pagamento na Google Play.");
  }
  return data;
}

export async function purchaseGooglePlay(service, periodo) {
  const sku = PLAY_PRODUCTS[periodo];
  if (!sku || !service) throw new Error("Plano indisponível na Google Play.");
  // show() ocorre imediatamente no clique; evite qualquer await antes dele.
  const request = new PaymentRequest(
    [{ supportedMethods: PAYMENT_METHOD, data: { sku } }],
    { total: { label: "Rumo Premium", amount: { currency: "BRL", value: "0" } } },
  );
  let response;
  try {
    response = await request.show();
    const token = String(response?.details?.purchaseToken || "");
    if (!token) throw new Error("A Google Play não retornou a identificação da compra.");
    const result = await verifyOnServer({ productId: sku, purchaseToken: token });
    if (!result?.active) {
      throw new Error("Pagamento ainda não confirmado. Use Restaurar assinatura após a aprovação.");
    }
    await response.complete("success");
    return result;
  } catch (error) {
    if (response) {
      try { await response.complete("fail"); } catch { /* já encerrado */ }
    }
    throw error;
  }
}

export async function restoreGooglePlay(service) {
  if (!service) throw new Error("Google Play indisponível nesta versão.");
  const purchases = await service.listPurchases();
  const owned = (purchases || []).find(
    (item) => Object.values(PLAY_PRODUCTS).includes(item.itemId) && item.purchaseToken,
  );
  if (owned) {
    return verifyOnServer({ productId: owned.itemId, purchaseToken: owned.purchaseToken });
  }
  // Pode haver assinatura em renovação, dispositivo novo ou compra cancelada ainda válida.
  return verifyOnServer({ refresh: true });
}

export function manageGooglePlaySubscription() {
  window.open(SUBSCRIPTIONS_URL, "_blank", "noopener,noreferrer");
}
