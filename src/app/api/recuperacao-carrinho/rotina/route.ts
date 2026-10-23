import { NextResponse, type NextRequest } from "next/server";
import { sendAbandonedCartReminders } from "@/lib/checkout/leads";
import { logger } from "@/lib/logger";

/**
 * Lembrete de carrinho abandonado (1 hora depois). Chamada por um agendador externo,
 * com o cabeçalho: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  try {
    const result = await sendAbandonedCartReminders();
    logger.info("Rotina de recuperação de carrinho executada", { integration: "mercadopago", ...result });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error("Falha na recuperação de carrinho", { integration: "mercadopago", error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
