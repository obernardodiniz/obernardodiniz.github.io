// SolarFlix: guarda o app no celular para abrir na hora, mesmo sem internet. Entrega o que está guardado
// e busca a versão nova por trás (ela vale a partir da próxima abertura).
const CACHE = "solarflix-1";
const BASE = ["./", "index.html", "distribuidoras.js", "manifest.webmanifest", "img/logo.svg", "img/icone-180.png", "img/icone-192.png", "img/icone-512.png"];
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("solarflix-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const fonte = u.host === "fonts.googleapis.com" || u.host === "fonts.gstatic.com";
  if (!fonte && (u.origin !== location.origin || !u.pathname.includes("/solarflix/"))) return;
  const pedido = e.request.mode === "navigate" ? new Request("./") : e.request;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const guardado = await c.match(pedido, { ignoreSearch: e.request.mode === "navigate" });
    const novo = fetch(e.request).then((r) => { if (r.ok || r.type === "opaque") c.put(pedido, r.clone()); return r; });
    if (guardado) { e.waitUntil(novo.catch(() => {})); return guardado; }
    return novo;
  }));
});
