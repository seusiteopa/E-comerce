import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateShipping } from "@/lib/integrations/correios";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
  items: z
    .array(
      z.object({
        weightGrams: z.number().positive(),
        widthCm: z.number().positive(),
        heightCm: z.number().positive(),
        lengthCm: z.number().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

/**
 * Rota pública (Etapa 7/9: cálculo de frete acontece antes do login, no
 * carrinho). Por ser pública e depender de uma API externa com custo de
 * cota, aplica um limite simples de requisições por IP — suficiente para
 * o volume inicial do MVP sem exigir um serviço de rate limiting dedicado.
 */
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Muitas solicitações. Tente novamente em instantes." }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados de frete inválidos." }, { status: 400 });
  }

  // Agrega peso/dimensões do carrinho — simplificação de empacotamento
  // (soma pesos, usa a maior dimensão de cada eixo). Para catálogos com
  // itens muito heterogêneos, este cálculo pode ser refinado depois.
  const totalWeightGrams = parsed.data.items.reduce((sum, i) => sum + i.weightGrams * i.quantity, 0);
  const widthCm = Math.max(...parsed.data.items.map((i) => i.widthCm));
  const heightCm = Math.max(...parsed.data.items.map((i) => i.heightCm));
  const lengthCm = Math.max(...parsed.data.items.map((i) => i.lengthCm));

  try {
    const options = await calculateShipping({
      destinationZipCode: parsed.data.zipCode,
      totalWeightGrams,
      dimensions: { widthCm, heightCm, lengthCm },
    });
    return NextResponse.json({ options });
  } catch (error) {
    logger.error("Erro ao calcular frete", { integration: "correios", error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Não foi possível calcular o frete agora. Tente novamente em instantes." },
      { status: 503 }
    );
  }
}
