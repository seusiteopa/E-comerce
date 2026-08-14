"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile, UnauthorizedError } from "@/lib/auth";
import { addressSchema } from "@/lib/validation/schemas";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

export async function createAddressAction(formData: FormData): Promise<ActionResult<{ addressId: string }>> {
  try {
    const profile = await requireAuthenticatedProfile();

    const parsed = addressSchema.safeParse({
      label: formData.get("label") || "Principal",
      zipCode: formData.get("zipCode"),
      street: formData.get("street"),
      number: formData.get("number"),
      complement: formData.get("complement") || undefined,
      neighborhood: formData.get("neighborhood"),
      city: formData.get("city"),
      state: formData.get("state"),
    });

    if (!parsed.success) {
      return actionError("Verifique os campos do endereço.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: address, error } = await supabase
      .from("addresses")
      .insert({
        profile_id: profile.id,
        label: parsed.data.label,
        zip_code: parsed.data.zipCode,
        street: parsed.data.street,
        number: parsed.data.number,
        complement: parsed.data.complement ?? null,
        neighborhood: parsed.data.neighborhood,
        city: parsed.data.city,
        state: parsed.data.state.toUpperCase(),
      })
      .select("id")
      .single();

    if (error || !address) {
      logger.error("Erro ao criar endereço", { userId: profile.id, error: error?.message });
      return actionError("Não foi possível salvar o endereço agora.");
    }

    revalidatePath("/conta/enderecos");
    return actionSuccess({ addressId: address.id });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return actionError("Faça login para cadastrar um endereço.");
    }
    return actionError("Ocorreu um erro inesperado.");
  }
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  try {
    const profile = await requireAuthenticatedProfile();
    const supabase = await createSupabaseServerClient();

    // RLS garante que só o dono pode excluir, mesmo sem o filtro explícito —
    // filtro mantido aqui por clareza de intenção no código.
    const { error } = await supabase.from("addresses").delete().eq("id", addressId).eq("profile_id", profile.id);

    if (error) {
      return actionError("Não foi possível remover o endereço.");
    }

    revalidatePath("/conta/enderecos");
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return actionError("Faça login para gerenciar seus endereços.");
    }
    return actionError("Ocorreu um erro inesperado.");
  }
}
