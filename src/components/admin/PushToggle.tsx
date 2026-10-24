"use client";

import { useEffect, useState } from "react";
import { subscribePushAction } from "@/actions/admin/push";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Ativa as notificações de pedido neste aparelho (pede permissão ao navegador). */
export default function PushToggle() {
  const [state, setState] = useState<"verificando" | "indisponivel" | "desligado" | "ativo">("verificando");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      queueMicrotask(() => setState("indisponivel"));
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setState(existing ? "ativo" : "desligado");
    });
  }, []);

  async function ativar() {
    setMessage(null);
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return setMessage("Notificações ainda não configuradas.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setMessage("Permissão negada. Libere as notificações nas configurações do navegador.");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
    const json = sub.toJSON();
    const result = await subscribePushAction({ endpoint: json.endpoint, keys: json.keys });
    if (!result.success) return setMessage(result.error);
    setState("ativo");
    setMessage("Notificações ativadas neste aparelho.");
  }

  if (state === "indisponivel") {
    return (
      <p className="text-sm text-ink-soft">
        Notificações não disponíveis neste navegador. No iPhone, instale o painel na tela inicial (Compartilhar → Adicionar à Tela de Início).
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {state === "ativo" ? (
        <span className="text-sm font-semibold text-navy">Notificações ativas neste aparelho</span>
      ) : (
        <button type="button" onClick={ativar} disabled={state === "verificando"} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-paper">
          Ativar notificações de pedido
        </button>
      )}
      {message && <span role="status" className="text-xs text-ink-soft">{message}</span>}
    </div>
  );
}
