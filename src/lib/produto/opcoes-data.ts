import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SavedGroup = {
  id?: string;
  name: string;
  mode: "escolha" | "multipla";
  required: boolean;
  min_choices: number;
  max_choices: number | null;
  options: { id?: string; name: string; extra_price: number }[];
};

/** Grupos e opções salvos de um produto, na ordem cadastrada. */
export async function getProductGroups(productId: string): Promise<SavedGroup[]> {
  const service = createSupabaseServiceClient();
  const { data: groups } = await service
    .from("product_option_groups")
    .select("id, name, mode, required, min_choices, max_choices, position")
    .eq("product_id", productId)
    .order("position");
  if (!groups || groups.length === 0) return [];
  const { data: options } = await service
    .from("product_options")
    .select("id, group_id, name, extra_price, position")
    .in("group_id", groups.map((g) => g.id))
    .order("position");
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    mode: g.mode as "escolha" | "multipla",
    required: g.required,
    min_choices: g.min_choices,
    max_choices: g.max_choices,
    options: (options ?? [])
      .filter((o) => o.group_id === g.id)
      .map((o) => ({ id: o.id, name: o.name, extra_price: Number(o.extra_price) })),
  }));
}
