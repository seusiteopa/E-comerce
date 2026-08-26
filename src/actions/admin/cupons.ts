"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";
import { couponAdminSchema } from "@/lib/validation/admin-schemas";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

async function guardAdmin() {
  try {
    return await requireAdminProfile();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) throw error;
    throw new ForbiddenError();
  }
}

export async function createCouponAction(formData: FormData): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const raw = {
    code: formData.get("code") as string,
    discountType: formData.get("discountType") as string,
    discountValue: Number(formData.get("discountValue")),
    validFrom: (formData.get("validFrom") as string) || new Date().toISOString(),
    validUntil: (formData.get("validUntil") as string) || undefined,
    usageLimit: formData.get("usageLimit") ? Number(formData.get("usageLimit")) : undefined,
    usageLimitPerCustomer: formData.get("usageLimitPerCustomer") ? Number(formData.get("usageLimitPerCustomer")) : 1,
  };

  const parsed = couponAdminSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError ?? "Verifique os campos do cupom.");
  }

  const active = formData.get("active") === "on";
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("coupons").insert({
    code: parsed.data.code,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountValue,
    valid_from: parsed.data.validFrom,
    valid_until: parsed.data.validUntil ?? null,
    usage_limit: parsed.data.usageLimit ?? null,
    usage_limit_per_customer: parsed.data.usageLimitPerCustomer,
    active,
  });

  if (error) {
    logger.error("Erro ao criar cupom", { error: error.message });
    if (error.code === "23505") {
      return actionError("Já existe um cupom com esse código.");
    }
    return actionError("Não foi possível salvar o cupom.");
  }

  revalidatePath("/admin/cupons");
  return actionSuccess(undefined);
}

export async function toggleCouponActiveAction(code: string, active: boolean): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("coupons").update({ active }).eq("code", code);
  if (error) return actionError("Não foi possível atualizar o cupom.");

  revalidatePath("/admin/cupons");
  return actionSuccess(undefined);
}

export async function deleteCouponAction(code: string): Promise<ActionResult> {
  try {
    await guardAdmin();
  } catch {
    return actionError("Acesso restrito ao painel administrativo.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("coupons").delete().eq("code", code);
  if (error) return actionError("Não foi possível excluir o cupom.");

  revalidatePath("/admin/cupons");
  return actionSuccess(undefined);
}
