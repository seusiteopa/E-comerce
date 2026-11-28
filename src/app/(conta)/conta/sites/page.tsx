import type { Metadata } from "next";
import MeusPedidosServico from "@/components/conta/MeusPedidosServico";

export const metadata: Metadata = { title: "Meus sites", robots: { index: false, follow: false } };

export default function ContaSitesPage() {
  return <MeusPedidosServico kind="site" />;
}
