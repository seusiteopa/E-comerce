import { createSupabaseServerClient } from "@/lib/supabase/server";
import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const W = 32; // colunas de uma bobina de 58 mm

interface Line {
  text: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
}

const plain = (t: unknown) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const brl = (n: number) => n.toFixed(2).replace(".", ",");

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let t = plain(text).trim();
  while (t.length > width) {
    let k = t.lastIndexOf(" ", width);
    if (k < 1) k = width;
    out.push(t.slice(0, k).trim());
    t = t.slice(k).trim();
  }
  out.push(t);
  return out;
}

const two = (left: string, right: string): Line => ({ text: plain(left).padEnd(Math.max(1, W - right.length)).slice(0, W - right.length) + right });

export async function buildTicketLines(
  orderId: string,
  storeId: string,
  client?: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<Line[] | null> {
  // Com o cliente do próprio lojista, a leitura segue as regras do banco (pedidos e pagamentos da loja).
  const supabase = client ?? createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, created_at, total, customer_name, channel, store_id, order_items(product_name_snapshot, unit_price_snapshot, quantity), payments(method, status)")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (!order) return null;
  const { data: store } = await supabase.from("stores").select("name").eq("id", storeId).maybeSingle();

  const lines: Line[] = [];
  wrap(store?.name ?? "Pedido", W).forEach((t) => lines.push({ text: t, bold: true, align: "center" }));
  lines.push({ text: `PEDIDO #${order.id.slice(0, 6).toUpperCase()}`, bold: true, align: "center" });
  lines.push({
    text: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(order.created_at)),
    align: "center",
  });
  lines.push({ text: "-".repeat(W) });
  lines.push({ text: order.channel === "balcao" ? "BALCAO" : "ONLINE", bold: true });
  if (order.customer_name) wrap(`Cliente: ${order.customer_name}`, W).forEach((t) => lines.push({ text: t }));
  lines.push({ text: "-".repeat(W) });

  for (const item of order.order_items as { product_name_snapshot: string; unit_price_snapshot: number; quantity: number }[]) {
    const price = brl(Number(item.unit_price_snapshot) * item.quantity);
    const parts = wrap(`${item.quantity}x ${item.product_name_snapshot}`, W - price.length - 1);
    lines.push(two(parts[0], price));
    parts.slice(1).forEach((t) => lines.push({ text: "   " + t }));
  }

  lines.push({ text: "-".repeat(W) });
  lines.push({ text: `TOTAL  R$ ${brl(Number(order.total))}`, bold: true, align: "right" });
  const method = (order.payments as { method: string | null }[] | null)?.[0]?.method;
  if (method) lines.push({ text: `Pagamento: ${method}` });
  lines.push({ text: " " }, { text: " " });
  return lines;
}

/** Formato do app Thermer (Bluetooth Print): lista de linhas de texto. */
export function toThermerJson(lines: Line[]) {
  return lines.map((l) => ({
    type: 0,
    content: l.text === "" ? " " : l.text,
    bold: l.bold ? 1 : 0,
    align: l.align === "center" ? 1 : l.align === "right" ? 2 : 0,
  }));
}

/** Texto puro com alinhamento por espaços — para o RawBT. */
export function toPlainText(lines: Line[]): string {
  return (
    lines
      .map((l) => {
        if (l.align === "center") return " ".repeat(Math.max(0, Math.floor((W - l.text.length) / 2))) + l.text;
        if (l.align === "right") return " ".repeat(Math.max(0, W - l.text.length)) + l.text;
        return l.text;
      })
      .join("\n") + "\n"
  );
}
