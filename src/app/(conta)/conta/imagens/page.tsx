import type { Metadata } from "next";
import MeusPedidosServico from "@/components/conta/MeusPedidosServico";

export const metadata: Metadata = { title: "Minhas imagens", robots: { index: false, follow: false } };

export default function ContaImagensPage() {
  return <MeusPedidosServico kind="imagens" />;
}
