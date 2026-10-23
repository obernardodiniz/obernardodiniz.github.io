// Caderneta UFF: guarda o app para abrir sem internet. Página e dados vêm primeiro da rede; o resto, do cache.
const CACHE = "caderneta-uff-1";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "index.html", "manifest.webmanifest", "dados/caderneta.json"]))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("caderneta-uff-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const rede = u.pathname.includes("/dados/") || e.request.mode === "navigate" || u.pathname.endsWith("/index.html");
  if (rede) { e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }))); return; }
  e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })));
});
