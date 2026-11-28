import type { Metadata } from "next";
import MeusPedidosServico from "@/components/conta/MeusPedidosServico";

export const metadata: Metadata = { title: "Meus vídeos", robots: { index: false, follow: false } };

export default function ContaVideosPage() {
  return <MeusPedidosServico kind="videos" />;
}
