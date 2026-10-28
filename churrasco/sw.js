// Nosso Churrasco: guarda o app para abrir sem internet. A página vem primeiro da rede (para pegar atualizações); o resto, do cache.
const CACHE = "nosso-churrasco-2";
const BASE = ["./", "index.html", "manifest.webmanifest", "img/logo.svg", "img/icone-180.png", "img/icone-192.png", "img/icone-512.png", "img/favicon.png"];
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("nosso-churrasco-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const fonte = u.host === "fonts.googleapis.com" || u.host === "fonts.gstatic.com";
  if (u.origin !== location.origin && !fonte) return;
  const guardar = (r) => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); } return r; };
  if (e.request.mode === "navigate" || u.pathname.endsWith("/index.html")) {
    e.respondWith(fetch(e.request).then(guardar).catch(() => caches.match(e.request).then((m) => m || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then(guardar)));
});
