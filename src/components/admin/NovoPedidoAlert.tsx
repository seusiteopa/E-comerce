"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { listPaidOrderIdsAction } from "@/actions/admin/pedidos-novos";

const STORAGE_KEY = "vecorion-som-pedidos";
const CHECK_EVERY_MS = 15000;

function playChime() {
  try {
    const audio = new Audio("/sons/novo-pedido.wav");
    void audio.play().catch(() => undefined);
  } catch {
    // sem suporte a áudio: o aviso visual continua
  }
}

/**
 * Avisa, com som, quando aparece pedido pago que ainda não estava na tela.
 * Compara por id (e não por data), porque um pedido de Pix pode ser pago depois de criado.
 */
export default function NovoPedidoAlert({ knownPaidIds }: { knownPaidIds: string[] }) {
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const seen = useRef(new Set(knownPaidIds));
  const soundRef = useRef(false);

  useEffect(() => {
    soundRef.current = localStorage.getItem(STORAGE_KEY) === "1";
    setSoundOn(soundRef.current);
  }, []);

  useEffect(() => {
    let active = true;
    async function check() {
      const result = await listPaidOrderIdsAction();
      if (!active || !result.success) return;
      const fresh = result.data.ids.filter((id) => !seen.current.has(id));
      if (fresh.length === 0) return;
      fresh.forEach((id) => seen.current.add(id));
      if (soundRef.current) playChime();
      setBanner(fresh.length === 1 ? "Novo pedido pago!" : `${fresh.length} novos pedidos pagos!`);
      router.refresh();
    }
    const id = window.setInterval(check, CHECK_EVERY_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [router]);

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="min-w-0">
        {banner ? (
          <p role="status" className="text-sm font-semibold text-navy">{banner}</p>
        ) : (
          <p className="text-sm text-ink-soft">Os pedidos pagos avisam aqui com som.</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          const next = !soundRef.current;
          soundRef.current = next;
          localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
          setSoundOn(next);
          if (next) playChime(); // o toque no botão libera o som no navegador
        }}
        className="shrink-0 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
      >
        {soundOn ? "Som ligado" : "Ativar som dos pedidos"}
      </button>
    </div>
  );
}
