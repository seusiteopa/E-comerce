// Service worker da Vecorion (loja + admin).
//
// Estratégia deliberadamente conservadora para não quebrar nada que já
// funciona (checkout, webhooks, APIs):
//  - Nunca intercepta métodos que não sejam GET (POST/PUT/DELETE passam
//    direto pra rede — inclui toda ação de servidor do Next.js).
//  - Nunca intercepta /api/* nem /admin (dados sempre mudam e são
//    sensíveis; navegação de admin sempre busca da rede).
//  - Assets estáticos (_next/static, /icons, /brand, fontes) — cache-first
//    com atualização em segundo plano (stale-while-revalidate).
//  - Navegação de página (loja) — network-first, cai pro cache se offline,
//    e cai pra /offline se não tiver nada em cache.
//
// Versionamento simples: mudar CACHE_VERSION invalida o cache antigo no
// próximo deploy.
const CACHE_VERSION = "v1";
const CACHE_NAME = `vecorion-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  // Não ativa sozinho — espera o usuário confirmar (ver mensagem SKIP_WAITING
  // abaixo), pra evitar trocar a versão no meio de uma ação em andamento.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(png|jpg|jpeg|svg|webp|avif|ico|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Admin nunca passa pelo service worker: dados mudam o tempo todo e são
  // sensíveis a ficar "presos" em cache ou em fallback de offline — sempre
  // direto pra rede, sem interferência nenhuma daqui.
  if (url.pathname.startsWith("/admin")) return;

  // Navegação (troca de página) — network-first, com fallback pro cache
  // e, em último caso, pra tela offline. Cobre loja e admin igualmente;
  // admin nunca fica "preso" em uma versão de dados antiga porque tenta a
  // rede primeiro sempre.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
            return response;
          })
          .catch(() => cached);
        return cached ?? networkFetch;
      })
    );
  }
});

// Notificação de pedido pago (chega mesmo com o app fechado). O som é o do próprio celular.
self.addEventListener("push", (event) => {
  let data = { title: "Novo pedido", body: "Abra o painel para ver.", url: "/admin/pedidos" };
  try {
    data = { ...data, ...event.data.json() };
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: { url: data.url },
      renotify: true,
      tag: "novo-pedido",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin/pedidos";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.navigate(url).then(() => client.focus());
      }
      return self.clients.openWindow(url);
    })
  );
});
