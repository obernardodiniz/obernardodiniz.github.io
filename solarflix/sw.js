// SolarFlix: a página sempre vem da internet primeiro (assim a versão nova aparece na hora);
// a cópia guardada só é usada sem internet. Fotos e fontes ficam guardadas para abrir rápido.
const CACHE = "solarflix-5";
const BASE = ["./", "index.html", "distribuidoras.js", "manifest.webmanifest", "img/logo.svg", "img/icone-180.png", "img/icone-192.png", "img/icone-512.png"];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => fetch(u, { cache: "reload" }).then((r) => r.ok && c.put(u, r)).catch(() => {})))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("solarflix-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const deFora = u.host === "fonts.googleapis.com" || u.host === "fonts.gstatic.com" || u.host === "images.unsplash.com";
  const nosso = u.origin === location.origin && u.pathname.includes("/solarflix/");
  if (!deFora && !nosso) return;
  // página e código do app: internet primeiro, cópia só sem internet
  if (nosso && (e.request.mode === "navigate" || /\.(html|js|webmanifest)$/.test(u.pathname) || u.pathname.endsWith("/"))) {
    const chave = e.request.mode === "navigate" ? "./" : e.request;
    e.respondWith(fetch(e.request, { cache: "no-store" }).then((r) => {
      if (r.ok) caches.open(CACHE).then((c) => c.put(chave, r.clone()));
      return r;
    }).catch(() => caches.match(chave, { ignoreSearch: true })));
    return;
  }
  // fotos, fontes e ícones: cópia guardada primeiro
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const guardado = await c.match(e.request);
    if (guardado) return guardado;
    const r = await fetch(e.request);
    if (r.ok || r.type === "opaque") c.put(e.request, r.clone());
    return r;
  }));
});
