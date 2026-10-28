const CACHE = "b27-1793161305580";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "index.html", "manifest.webmanifest"]))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // o mesmo endereço hospeda outros apps (uff/, churrasco/...): só cuida dos arquivos do Brasil 2027
  const partes = u.pathname.split("/").filter(Boolean);
  if (partes.length > 1 && !/^(img|dados)$/.test(partes[0])) return;
  const rede = u.pathname.includes("/dados/") || e.request.mode === "navigate";
  if (rede) { e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })));
});
