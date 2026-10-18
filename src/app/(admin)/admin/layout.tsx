import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { StoreBaseProvider } from "@/components/store/StoreLink";
import { storeBasePath } from "@/lib/store/base-path";
import { redirect } from "next/navigation";
import { requireAdminProfile, ForbiddenError, UnauthorizedError } from "@/lib/auth";

// Um único app instalável para o domínio inteiro (evita o conflito de dois
// apps/manifests/service workers para a mesma origem no Android). O admin
// usa o mesmo manifesto da loja — quem entra como administrador já é
// levado direto para /admin no login (ver src/app/(conta)/login/page.tsx).
export const metadata: Metadata = {
  title: "Vecorion Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdminProfile();
  } catch (err) {
    if (err instanceof UnauthorizedError) redirect("/login?redirecionar=/admin");
    if (err instanceof ForbiddenError) redirect("/");
    throw err;
  }
  const base = await storeBasePath();

  return (
    <StoreBaseProvider value={base}>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1">
          <AdminMobileNav />
          {children}
        </div>
      </div>
    </StoreBaseProvider>
  );
}
