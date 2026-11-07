// Supabase Edge Function: rumo-play-verify
// ATENÇÃO: não implantar antes de cadastrar os produtos no Play Console,
// aplicar a migração SQL e configurar a credencial Google somente no servidor.
import { createClient } from "npm:@supabase/supabase-js@2.108.1";

const PACKAGE = "br.com.nethanel.rumo";
const PRODUCTS = new Set(["rumo_premium_mensal", "rumo_premium_anual"]);
const PLAY_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const PLAY_API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";
const ALLOWED_ORIGIN = "https://rumo.nethanel.com.br";

const headers = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Content-Type": "application/json; charset=utf-8",
};
function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers });
}
function bytesBase64Url(bytes: Uint8Array) {
  let value = "";
  for (const b of bytes) value += String.fromCharCode(b);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function encodeJson(value: unknown) {
  return bytesBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}
async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
}

type GoogleServiceAccount = { client_email: string; private_key: string; token_uri?: string };
async function accessToken() {
  const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("Credencial Google Play não configurada.");
  const account = JSON.parse(raw) as GoogleServiceAccount;
  if (!account.client_email || !account.private_key) throw new Error("Credencial Google Play incompleta.");
  const encodedKey = account.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(encodedKey), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const assertionBase = [
    encodeJson({ typ: "JWT", alg: "RS256" }),
    encodeJson({
      iss: account.client_email, scope: PLAY_SCOPE,
      aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
    }),
  ].join(".");
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(assertionBase),
  );
  const assertion = assertionBase + "." + bytesBase64Url(new Uint8Array(signature));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error("Google Play não autorizou a verificação da assinatura.");
  const json = await response.json();
  if (!json?.access_token) throw new Error("Token de autorização Google ausente.");
  return String(json.access_token);
}

type PlayLineItem = {
  productId?: string;
  expiryTime?: string;
  autoRenewingPlan?: { autoRenewEnabled?: boolean };
};
type SubscriptionV2 = {
  subscriptionState?: string;
  acknowledgementState?: string;
  latestOrderId?: string;
  lineItems?: PlayLineItem[];
  testPurchase?: unknown;
};
async function fetchGoogleSubscription(token: string, googleBearer: string): Promise<SubscriptionV2> {
  const url = `${PLAY_API}/${PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${googleBearer}`, Accept: "application/json" },
  });
  if (!response.ok) {
    if (response.status === 400 || response.status === 404 || response.status === 410) {
      throw new Error("Compra não encontrada ou token inválido na Google Play.");
    }
    throw new Error("Google Play indisponível para validar sua compra.");
  }
  return response.json();
}
async function acknowledgeGoogleSubscription(
  productId: string, token: string, googleBearer: string,
) {
  const url = `${PLAY_API}/${PACKAGE}/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(token)}:acknowledge`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${googleBearer}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) throw new Error("Compra registrada, mas ainda não confirmada pela Google Play.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply(405, { error: true, message: "Método não permitido." });

  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return reply(401, { error: true, message: "Entre na sua conta Rumo." });

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRole) throw new Error("Configuração incompleta no servidor.");

    const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await admin.auth.getUser(auth.slice(7));
    if (authError || !user) return reply(401, { error: true, message: "Sessão inválida. Faça login novamente." });

    const body = await req.json().catch(() => ({}));
    const refresh = body?.refresh === true;
    let productId = String(body?.productId || "");
    let token = String(body?.purchaseToken || "");
    if (refresh) {
      const { data, error } = await admin.schema("rumo").from("google_play_assinaturas")
        .select("purchase_token, product_id").eq("usuario_id", user.id).maybeSingle();
      if (error) throw error;
      if (!data) return reply(200, { active: false, status: "NOT_FOUND" });
      productId = data.product_id;
      token = data.purchase_token;
    }
    if (!PRODUCTS.has(productId) || token.length < 12 || token.length > 4096) {
      return reply(400, { error: true, message: "Identificação da compra inválida." });
    }

    // Nunca confiar no status ou preço informado pelo navegador.
    const bearer = await accessToken();
    const google = await fetchGoogleSubscription(token, bearer);
    const line = (google.lineItems || []).find((item) => item.productId === productId);
    if (!line) return reply(403, { error: true, message: "Produto não corresponde à assinatura do Rumo." });
    const expiry = line.expiryTime || null;
    const state = String(google.subscriptionState || "");
    const active = [
      "SUBSCRIPTION_STATE_ACTIVE",
      "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
      "SUBSCRIPTION_STATE_CANCELED",
    ].includes(state) && !!expiry && new Date(expiry).getTime() > Date.now();

    const { data: applied, error: applyError } = await admin.schema("rumo")
      .rpc("aplicar_estado_play", {
        p_usuario_id: user.id,
        p_purchase_token: token,
        p_token_sha256: await hashToken(token),
        p_product_id: productId,
        p_estado: state,
        p_vencimento: expiry,
        p_renovacao: Boolean(line.autoRenewingPlan?.autoRenewEnabled),
        p_pedido: google.latestOrderId || null,
        p_teste: Object.prototype.hasOwnProperty.call(google, "testPurchase"),
      });
    if (applyError) {
      console.error("Rumo Play: erro na conciliação", applyError.code);
      return reply(409, { error: true, message: "Não foi possível associar essa compra à sua conta Rumo. Contate o suporte." });
    }

    // A confirmação precisa ser feita no servidor para evitar estorno automático.
    if (active && google.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
      await acknowledgeGoogleSubscription(productId, token, bearer);
    }

    return reply(200, {
      active: Boolean(applied), productId,
      status: state, expiry,
    });
  } catch (error) {
    console.error("Rumo Play: falha ao validar/confirmar", String(error?.message || error).slice(0, 180));
    return reply(503, { error: true, message: "Não foi possível validar a assinatura agora. Tente Restaurar assinatura." });
  }
});
