import AdminHeader from "@/components/admin/AdminHeader";
import Container from "@/components/ui/Container";
import ProductForm from "@/components/admin/ProductForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store/current";
import { requireAdminProfile } from "@/lib/auth";
import { CategoryRow } from "@/types/database";

export default async function NovoProdutoPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { id: storeId } = await getCurrentStore();
  const { data } = await supabase.from("categories").select("*").eq("store_id", storeId).eq("active", true).order("display_order");

  return (
    <>
      <AdminHeader title="Novo Produto" />
      <Container className="max-w-2xl py-8">
        <ProductForm categories={(data ?? []) as CategoryRow[]} />
      </Container>
    </>
  );
}
