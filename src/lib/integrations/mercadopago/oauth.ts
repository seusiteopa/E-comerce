import "server-only";
import crypto from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { platformOrigin } from "@/lib/store/urls";
import { logger } from "@/lib/logger";

const TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const AUTH_URL = "https://auth.mercadopago.com.br/authorization";
const REFRESH_MARGIN_MS = 7 * 24 * 60 * 60 * 1000; // renova quando faltar menos de 7 dias

export class PaymentNotConnectedError extends Error {
  constructor(message = "Esta loja ainda não conectou o Mercado Pago.") {
    super(message);
    this.name = "PaymentNotConnectedError";
  }
}

function oauthConfig() {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("MP_CLIENT_ID / MP_CLIENT_SECRET não configurados.");
  const redirectUri = process.env.MP_OAUTH_REDIRECT_URI || `${platformOrigin()}/api/mercadopago/oauth/callback`;
  return { clientId, clientSecret, redirectUri };
}

/** Cria o "state" (uso único) e devolve o endereço do Mercado Pago para o lojista autorizar. */
export async function buildAuthorizationUrl(storeId: string, userId: string): Promise<string> {
  const { clientId, redirectUri } = oauthConfig();
  const state = crypto.randomBytes(24).toString("hex");
  const supabase = createSupabaseServiceClient();

  // limpa estados antigos (mais de 1 hora) para a tabela não crescer
  await supabase.from("oauth_states").delete().lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  const { error } = await supabase.from("oauth_states").insert({ state, store_id: storeId, user_id: userId });
  if (error) throw new Error(`Falha ao iniciar a conexão: ${error.message}`);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    platform_id: "mp",
    state,
    redirect_uri: redirectUri,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Consome o state (uso único, válido por 10 minutos). Devolve a loja a que ele pertence. */
export async function consumeOAuthState(state: string): Promise<{ storeId: string; userId: string } | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.from("oauth_states").select("*").eq("state", state).maybeSingle();
  if (!data) return null;
  await supabase.from("oauth_states").delete().eq("state", state);
  if (Date.now() - new Date(data.created_at).getTime() > 10 * 60 * 1000) return null;
  return { storeId: data.store_id, userId: data.user_id };
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number | string;
}

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago recusou a troca de token (HTTP ${response.status}): ${text.slice(0, 200)}`);
  }
  return (await response.json()) as TokenResponse;
}

async function saveTokens(storeId: string, tokens: TokenResponse) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("store_payment_connections").upsert(
    {
      store_id: storeId,
      provider: "mercadopago",
      provider_user_id: String(tokens.user_id),
      status: "conectado",
      access_token_encrypted: encryptSecret(tokens.access_token),
      refresh_token_encrypted: encryptSecret(tokens.refresh_token),
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "store_id" }
  );
  if (error) throw new Error(`Falha ao salvar a conexão: ${error.message}`);
}

/** Troca o "code" devolvido pelo Mercado Pago pelos tokens da loja e guarda criptografados. */
export async function completeConnection(storeId: string, code: string): Promise<void> {
  const { clientId, clientSecret, redirectUri } = oauthConfig();
  const tokens = await requestToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  await saveTokens(storeId, tokens);
  logger.info("Mercado Pago conectado à loja", { storeId, integration: "mercadopago" });
}

export async function disconnectStore(storeId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  await supabase
    .from("store_payment_connections")
    .update({
      status: "desconectado",
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("store_id", storeId);
}

/** Token de acesso do vendedor (renova sozinho quando está perto de vencer). */
async function getSellerAccessToken(storeId: string): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const { data: conn } = await supabase.from("store_payment_connections").select("*").eq("store_id", storeId).maybeSingle();

  if (!conn || conn.status === "desconectado" || !conn.access_token_encrypted) throw new PaymentNotConnectedError();

  const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  if (conn.refresh_token_encrypted && expiresAt - Date.now() < REFRESH_MARGIN_MS) {
    try {
      const { clientId, clientSecret } = oauthConfig();
      const tokens = await requestToken({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: decryptSecret(conn.refresh_token_encrypted),
      });
      await saveTokens(storeId, tokens);
      return tokens.access_token;
    } catch (error) {
      logger.error("Falha ao renovar token do Mercado Pago da loja", {
        storeId,
        integration: "mercadopago",
        error: error instanceof Error ? error.message : String(error),
      });
      if (expiresAt <= Date.now()) {
        await supabase.from("store_payment_connections").update({ status: "expirado" }).eq("store_id", storeId);
        throw new PaymentNotConnectedError("A conexão do Mercado Pago desta loja expirou. O lojista precisa reconectar.");
      }
    }
  }
  return decryptSecret(conn.access_token_encrypted);
}

export interface StorePaymentContext {
  accessToken: string;
  /** Comissão da plataforma (R$) para um valor total; 0 quando não há comissão. */
  feeFor: (total: number) => number;
}

/**
 * Credenciais e regra de comissão para cobrar em nome de uma loja.
 *  - Loja da própria plataforma: token da plataforma, sem comissão (o dinheiro já é dela).
 *  - Demais lojas: token OAuth do lojista; sem comissão (plano único: mensalidade).
 */
export async function getStorePaymentContext(store: { id: string; is_platform_owned: boolean }): Promise<StorePaymentContext> {
  if (store.is_platform_owned) {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    return { accessToken: token, feeFor: () => 0 };
  }

  const accessToken = await getSellerAccessToken(store.id);
  // Sem comissão: as lojas pagam só a mensalidade, então não há taxa sobre a venda.
  const bps = 0;

  return {
    accessToken,
    feeFor: (total: number) => (bps > 0 ? Math.round(total * bps) / 10000 : 0),
  };
}
