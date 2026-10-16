import "server-only";
import crypto from "crypto";

/**
 * Criptografia de segredos guardados no banco (tokens do Mercado Pago dos lojistas).
 * AES-256-GCM. A chave vem de TOKEN_ENCRYPTION_KEY (32 bytes em base64) e NUNCA fica no banco:
 * quem vazar só o banco não consegue usar os tokens.
 * Gerar uma chave:  openssl rand -base64 32
 */
function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("TOKEN_ENCRYPTION_KEY não configurada.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY deve ter 32 bytes (base64).");
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Segredo criptografado em formato inválido.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

/** Assinatura HMAC curta usada em links temporários (ex.: impressão). */
export function signToken(payload: string, ttlSeconds: number): string {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY não configurada.");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${payload}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length < 3) return null;
  const sig = parts[parts.length - 1];
  const exp = Number(parts[parts.length - 2]);
  const payload = parts.slice(0, -2).join(".");
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const expected = crypto.createHmac("sha256", secret).update(`${payload}.${exp}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? payload : null;
  } catch {
    return null;
  }
}
