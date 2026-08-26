"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registra o service worker, avisa quando há uma versão nova pronta
 * (com botão pra atualizar sem perder o que a pessoa está fazendo) e
 * mostra um botão discreto de "Instalar aplicativo" quando o navegador
 * sinaliza que a instalação é possível (Chrome/Edge/Samsung Internet no
 * Android; Safari/iOS não dispara esse evento — lá a instalação continua
 * sendo via "Adicionar à Tela de Início" no menu de compartilhar).
 */
export default function PwaManager() {
  const [updateReady, setUpdateReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) setUpdateReady(true);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleUpdate() {
    const registration = await navigator.serviceWorker.getRegistration();
    registration?.waiting?.postMessage("SKIP_WAITING");
    setUpdateReady(false);
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <>
      {updateReady && (
        <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg sm:inset-x-auto sm:right-4 sm:w-80">
          <p className="text-sm text-ink">Nova versão disponível.</p>
          <button
            type="button"
            onClick={handleUpdate}
            className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white"
          >
            Atualizar
          </button>
        </div>
      )}

      {installPrompt && !installed && (
        <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg sm:inset-x-auto sm:left-4 sm:w-80">
          <p className="text-sm text-ink">Instalar como aplicativo?</p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setInstallPrompt(null)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft"
            >
              Agora não
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white"
            >
              Instalar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
