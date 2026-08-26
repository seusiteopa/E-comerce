import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";

// Sobrescreve o manifesto da loja (definido em src/app/manifest.ts) só para
// as páginas /admin — permite instalar um "app" separado, com nome e ícone
// próprios, que abre direto no painel administrativo.
export const metadata: Metadata = {
  title: "Vecorion Admin",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Vecorion Admin",
    statusBarStyle: "black-translucent",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminMobileNav />
        {children}
      </div>
    </div>
  );
}
