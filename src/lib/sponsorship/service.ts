import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { addMonths, daysBetween, isBlockedByOverdue } from "@/lib/billing/invoices";
import { logger } from "@/lib/logger";

const CREATE_DAYS_BEFORE = 5;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cria a primeira cobrança do destaque no ato da ativação. */
export async function activateSponsorship(storeId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createSupabaseServiceClient();
  const { data: billing } = await service.from("store_billing").select("subscription_status").eq("store_id", storeId).maybeSingle();
  if (!billing) return { ok: false, error: "Loja sem cadastro de cobrança." };

  const { data: mensalidades } = await service.from("billing_invoices").select("status, due_date").eq("store_id", storeId).eq("kind", "mensalidade");
  if (isBlockedByOverdue(mensalidades ?? [], todayIso())) {
    return { ok: false, error: "Regularize a mensalidade antes de ativar o destaque." };
  }

  const { data: sponsor } = await service.from("sponsorships").select("monthly_fee_cents").eq("store_id", storeId).maybeSingle();
  const fee = sponsor?.monthly_fee_cents ?? 10000;
  await service.from("sponsorships").upsert({ store_id: storeId, status: "ativo", monthly_fee_cents: fee }, { onConflict: "store_id" });

  const { data: open } = await service.from("billing_invoices").select("id").eq("store_id", storeId).eq("kind", "destaque").eq("status", "aberta").maybeSingle();
  if (!open) {
    const { error } = await service.from("billing_invoices").insert({
      store_id: storeId,
      kind: "destaque",
      period_start: todayIso(),
      due_date: new Date(Date.now() + CREATE_DAYS_BEFORE * 86_400_000).toISOString().slice(0, 10),
      amount_cents: fee,
    });
    if (error) logger.warn("Não foi possível criar a cobrança do destaque", { storeId, error: error.message });
  }
  return { ok: true };
}

/** Cria a cobrança do próximo mês do destaque, 5 dias antes do vencimento (mesma regra da mensalidade). */
export async function ensureNextSponsorshipInvoice(storeId: string): Promise<void> {
  const service = createSupabaseServiceClient();
  const { data: sponsor } = await service.from("sponsorships").select("status, monthly_fee_cents").eq("store_id", storeId).maybeSingle();
  if (!sponsor || sponsor.status !== "ativo") return;

  const { data: invoices } = await service.from("billing_invoices").select("status, due_date, period_start").eq("store_id", storeId).eq("kind", "destaque").order("due_date", { ascending: false });
  if ((invoices ?? []).some((i) => i.status === "aberta")) return;
  const last = invoices?.[0];
  if (!last) return;

  const dueDate = addMonths(last.due_date, 1);
  if (daysBetween(todayIso(), dueDate) > CREATE_DAYS_BEFORE) return;

  await service.from("billing_invoices").insert({
    store_id: storeId,
    kind: "destaque",
    period_start: addMonths(last.period_start, 1),
    due_date: dueDate,
    amount_cents: sponsor.monthly_fee_cents,
  });
}

/** Lojas com destaque ativo e em dia (mensalidade e destaque). Só essas aparecem patrocinadas. */
export async function getEligibleSponsoredStoreIds(): Promise<string[]> {
  const service = createSupabaseServiceClient();
  const { data: sponsors } = await service.from("sponsorships").select("store_id").eq("status", "ativo");
  const ids = (sponsors ?? []).map((s) => s.store_id as string);
  if (ids.length === 0) return [];

  const { data: invoices } = await service.from("billing_invoices").select("store_id, kind, status, due_date").in("store_id", ids);
  const today = todayIso();
  return ids.filter((id) => {
    const mine = (invoices ?? []).filter((i) => i.store_id === id);
    return !isBlockedByOverdue(mine.filter((i) => i.kind === "mensalidade").map((i) => ({ status: i.status, due_date: i.due_date })), today)
      && !isBlockedByOverdue(mine.filter((i) => i.kind === "destaque").map((i) => ({ status: i.status, due_date: i.due_date })), today);
  });
}
