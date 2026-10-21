import { ImageResponse } from "next/og";
import { getCurrentStore } from "@/lib/store/current";

/**
 * Imagem de compartilhamento gerada para a loja atual (1200 × 630), usada quando a loja
 * não tem banner, OG ou logo. Rota comum (não é a imagem automática do Next), para não
 * sobrescrever a imagem da loja nas páginas.
 */
export async function GET() {
  const store = await getCurrentStore();
  const name = store.name || "Loja";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#173F82", color: "#ffffff" }}>
        <div style={{ fontSize: 28, opacity: 0.8 }}>Loja</div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>{name}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
