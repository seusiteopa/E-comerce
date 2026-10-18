import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { getCurrentStore } from "@/lib/store/current";

// Um único app instalável para o domínio inteiro (evita o conflito de dois
// apps/manifests/service workers para a mesma origem no Android). O admin
// usa o mesmo manifesto da loja — quem entra como administrador já é
// levado direto para /admin no login (ver src/app/(conta)/login/page.tsx).
export const metadata: Metadata = {
  title: "Vecorion Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await getCurrentStore();
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminMobileNav storeHome={`/lojas/${store.slug}`} />
        {children}
      </div>
    </div>
  );
}
