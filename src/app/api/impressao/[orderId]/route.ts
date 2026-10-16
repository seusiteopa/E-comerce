import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";
import { buildTicketLines, toThermerJson } from "@/lib/print/ticket";

/**
 * O app de impressão (Thermer) busca o cupom aqui. Ele não tem login, então o acesso é por um
 * link assinado (HMAC) que vale 10 minutos e só serve para ESTE pedido desta loja.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const payload = verifyToken(token); // formato: print:<storeId>:<orderId>
  if (!payload) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [kind, storeId, tokenOrderId] = payload.split(":");
  if (kind !== "print" || !storeId || tokenOrderId !== orderId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lines = await buildTicketLines(orderId, storeId);
  if (!lines) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(toThermerJson(lines), { headers: { "Cache-Control": "no-store" } });
}
