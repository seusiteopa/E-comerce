import { NextResponse, type NextRequest } from "next/server";
import { runBillingRoutine } from "@/lib/billing/invoice-service";
import { logger } from "@/lib/logger";

/**
 * Rotina diária da mensalidade: cria cobranças, gera Pix e envia lembretes.
 * Chamada por um agendador externo, com o cabeçalho: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  try {
    const result = await runBillingRoutine();
    logger.info("Rotina de cobrança executada", { integration: "mercadopago", ...result });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error("Falha na rotina de cobrança", { integration: "mercadopago", error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
