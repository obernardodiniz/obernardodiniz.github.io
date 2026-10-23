// Caderneta UFF: guarda o app para abrir sem internet. Página e dados vêm primeiro da rede; o resto, do cache.
// Os dados são buscados com "?v=..." para furar o cache do GitHub; aqui eles são guardados pelo endereço sem esse final.
const CACHE = "caderneta-uff-3";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "index.html", "manifest.webmanifest", "dados/caderneta.json", "img/logo-uff.svg", "img/logo-uff-branco.svg"]))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("caderneta-uff-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const chave = u.origin + u.pathname;
  const rede = u.pathname.includes("/dados/") || e.request.mode === "navigate" || u.pathname.endsWith("/index.html");
  if (rede) {
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(chave, c)); } return r; })
      .catch(() => caches.match(e.request.mode === "navigate" ? u.origin + u.pathname.replace(/[^/]*$/, "") : chave).then((m) => m || caches.match(chave))));
    return;
  }
  e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); } return r; })));
});
