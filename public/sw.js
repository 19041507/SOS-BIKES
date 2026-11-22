// Service worker do SOS Bikes: só o básico para o app instalado.
// - Navegação: sempre a rede primeiro; sem internet, mostra /offline.html.
// - Arquivos com hash do Next (/_next/static) e ícones: cache primeiro.
// - Nada da área logada, do Supabase ou de outros domínios fica no cache.
// - Web Push: mostra os avisos do atendimento, com o app aberto ou fechado (ver /api/notificacoes).
// Mudou a lógica? Troque a versão para apagar o cache antigo.
const CACHE = "sos-bikes-v3";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, "/icons/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const pedido = event.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  if (pedido.mode === "navigate") {
    event.respondWith(fetch(pedido).catch(() => caches.match(OFFLINE)));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(pedido).then(
        (guardado) =>
          guardado ||
          fetch(pedido).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(CACHE).then((cache) => cache.put(pedido, copia));
            }
            return resposta;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const aviso = event.data.json();
  // Mostra sempre, inclusive com o app aberto: o som e a vibração são os do celular.
  event.waitUntil(
    self.registration.showNotification(aviso.titulo, {
      body: aviso.texto,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: aviso.tag,
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: Boolean(aviso.insistente),
      data: { url: aviso.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((janela) => new URL(janela.url).origin === self.location.origin);
      if (aberta) return aberta.navigate(url).then((janela) => (janela ?? aberta).focus());
      return self.clients.openWindow(url);
    }),
  );
});
