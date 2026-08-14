import "server-only";
import { logger } from "@/lib/logger";

/**
 * Módulo de fronteira com a API dos Correios (Etapa 2/4/7).
 *
 * A API oficial dos Correios (api.correios.com.br) exige autenticação via
 * token: um POST em /token/v1/autentica/cartaopostagem com Basic Auth
 * (usuário = número do contrato, senha = código de acesso da API,
 * gerados no Meu Correios/Portal do Desenvolvedor) devolve um bearer
 * token de curta duração, usado nas chamadas de preço/prazo.
 *
 * IMPORTANTE: os nomes exatos de endpoint/payload abaixo seguem a
 * documentação pública dos Correios vigente na criação deste módulo.
 * Como é uma API de orgão público sujeita a mudança de contrato, valide
 * contra a documentação atual (https://www.correios.com.br/atendimento/developers)
 * antes de ativar em produção, e ajuste apenas este arquivo se necessário
 * — nenhum outro módulo do sistema conhece os detalhes dessa API.
 */

const CORREIOS_BASE_URL = "https://api.correios.com.br";
const ORIGIN_ZIP_CODE = "13330000"; // TODO: confirmar CEP de origem real de despacho da Vecorion

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const user = process.env.CORREIOS_API_USER;
  const password = process.env.CORREIOS_API_PASSWORD;
  if (!user || !password) {
    throw new Error("CORREIOS_API_USER / CORREIOS_API_PASSWORD não configurados.");
  }

  const basicAuth = Buffer.from(`${user}:${password}`).toString("base64");

  const response = await fetch(`${CORREIOS_BASE_URL}/token/v1/autentica/cartaopostagem`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/json" },
  });

  if (!response.ok) {
    logger.error("Falha ao autenticar na API dos Correios", {
      integration: "correios",
      status: response.status,
    });
    throw new Error("Não foi possível autenticar com os Correios.");
  }

  const data = await response.json();
  // Token dos Correios expira tipicamente em algumas horas — renovamos com
  // 5 min de margem de segurança antes do vencimento informado.
  const expiresInMs = (data.expiraEm ? new Date(data.expiraEm).getTime() - Date.now() : 3 * 60 * 60 * 1000) - 5 * 60 * 1000;
  cachedToken = { value: data.token, expiresAt: Date.now() + Math.max(expiresInMs, 60_000) };

  return cachedToken.value;
}

export interface CalculateShippingInput {
  destinationZipCode: string;
  totalWeightGrams: number;
  dimensions: { widthCm: number; heightCm: number; lengthCm: number };
}

export interface ShippingOption {
  method: "pac" | "sedex";
  price: number;
  estimatedDays: number;
}

const SERVICE_CODES = { pac: "03298", sedex: "03220" } as const;

/**
 * Calcula frete real para PAC e SEDEX. Chamado pela rota /api/frete
 * (Etapa 7/9), nunca diretamente do navegador do cliente.
 */
export async function calculateShipping(input: CalculateShippingInput): Promise<ShippingOption[]> {
  const token = await getAccessToken();
  const cleanZip = input.destinationZipCode.replace(/\D/g, "");

  const results = await Promise.allSettled(
    (Object.entries(SERVICE_CODES) as [ShippingOption["method"], string][]).map(async ([method, serviceCode]) => {
      const params = new URLSearchParams({
        cepOrigem: ORIGIN_ZIP_CODE,
        cepDestino: cleanZip,
        peso: String(input.totalWeightGrams / 1000), // API espera quilogramas
        comprimento: String(input.dimensions.lengthCm),
        largura: String(input.dimensions.widthCm),
        altura: String(input.dimensions.heightCm),
        codigoServico: serviceCode,
      });

      const response = await fetch(`${CORREIOS_BASE_URL}/preco/v1/nacional?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        // Timeout curto com fallback amigável — a API dos Correios tem
        // histórico de lentidão em horário de pico (Etapa 4, ponto de atenção).
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`Correios respondeu HTTP ${response.status} para o serviço ${method}.`);
      }

      const data = await response.json();
      return {
        method,
        price: Number(data.precoFinal ?? data.preco),
        estimatedDays: Number(data.prazoEntrega ?? data.prazoEntregaDias),
      } satisfies ShippingOption;
    })
  );

  const options: ShippingOption[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      options.push(result.value);
    } else {
      logger.warn("Falha ao calcular uma modalidade de frete", {
        integration: "correios",
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  if (options.length === 0) {
    throw new Error("Não foi possível calcular o frete agora. Tente novamente em instantes.");
  }

  return options;
}
