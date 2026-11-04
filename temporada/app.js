"use strict";
// Temporada: o imóvel do Airbnb que a família administra. Quem administra lança reservas e custos (com a
// foto da nota); o proprietário só vê. Cada pessoa entra pelo próprio link. Dinheiro sempre em centavos.

const NUVEM_URL = "https://rexifhjmtphbpyirajgq.supabase.co", NUVEM_CHAVE = "sb_publishable_VHk3k9180XGEVrmWKWC3OA_f0BxEzJQ";
const GUARDADO = "temporada-link";
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_C = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const CATEGORIAS = ["Manutenção", "Material de limpeza", "Enxoval e utensílios", "Contas (luz, água, internet)", "Condomínio e IPTU", "Itens para hóspedes", "Outros"];
const ABAS = [
  ["inicio", "Início", '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'],
  ["calendario", "Agenda", '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'],
  ["reservas", "Reservas", '<path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M3 19v2M21 19v2M6 10V7.5A1.5 1.5 0 0 1 7.5 6h3A1.5 1.5 0 0 1 12 7.5V10"/>'],
  ["custos", "Custos", '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/>'],
  ["ajustes", "Ajustes", '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>'],
];
const ic = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  esq: ic('<path d="m15 18-6-6 6-6"/>'), dir: ic('<path d="m9 18 6-6-6-6"/>'), mais: ic('<path d="M12 5v14M5 12h14"/>'),
  camera: ic('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  arquivo: ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  x: ic('<path d="M18 6 6 18M6 6l12 12"/>'), ok: ic('<path d="m5 12 5 5 9-10"/>'), copiar: ic('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  enviar: ic('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M7 8l5-5 5 5"/>'), cama: ic(ABAS[2][2]), nota: ic(ABAS[3][2]), cal: ic(ABAS[1][2]),
  vassoura: ic('<path d="M14 4 9 13M6 14h7l2 7H4z"/>'),
};

// Logo da Terê House's: um desenho só (img/logo.svg, letras em traço, sem fonte), o mesmo que gera os ícones.
const LOGO = `<img src="img/logo.svg" alt="Terê House's">`;

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl = (c) => dinheiro.format((c || 0) / 100);
const pct = (bp) => (bp / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
const p2 = (n) => String(n).padStart(2, "0");
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const dia = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
const deDia = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
const noites = (r) => dia(r.saida) - dia(r.entrada);
const dataCurta = (s) => `${+s.slice(8, 10)} ${MESES_C[+s.slice(5, 7) - 1]}`;
const nomeMes = (m) => `${MESES[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const somarMes = (m, n) => { const t = +m.slice(0, 4) * 12 + (+m.slice(5, 7) - 1) + n; return `${Math.floor(t / 12)}-${p2((t % 12) + 1)}`; };
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
function lerGuardado() { try { return localStorage.getItem(GUARDADO); } catch { return null; } }
function guardar(v) { try { v ? localStorage.setItem(GUARDADO, v) : localStorage.removeItem(GUARDADO); } catch { /* aparelho sem espaço: segue só nesta aba */ } }

// "150", "150,5", "1.234,56", "1234.56" → centavos; vazio → null; inválido → NaN
function lerReais(txt) {
  let t = String(txt ?? "").replace(/[R$\s]/g, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}
const mostrarReais = (c) => (c == null ? "" : (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

// ---------- nuvem ----------
async function rpc(nome, corpo) {
  const r = await fetch(`${NUVEM_URL}/rest/v1/rpc/${nome}`, { method: "POST", headers: { apikey: NUVEM_CHAVE, "Content-Type": "application/json" }, body: JSON.stringify(corpo || {}) });
  const txt = await r.text();
  if (!r.ok) {
    let msg = ""; try { msg = JSON.parse(txt).message || ""; } catch { /* resposta sem JSON */ }
    const e = new Error(msg || `Erro ${r.status}`); e.linkRuim = /link invalido/.test(msg); throw e;
  }
  return txt ? JSON.parse(txt) : null;
}

let token = lerGuardado(), D = null, abaAtual = null, mesSel = hoje().slice(0, 7), diaSel = null;
const ehAdm = () => D?.eu.papel === "admin";

// Os últimos dados ficam no aparelho: o app abre na hora com eles e atualiza em seguida.
const GUARDADO_DADOS = "temporada-dados";
function dadosGuardados() { try { const x = JSON.parse(localStorage.getItem(GUARDADO_DADOS)); return x && x.token === token ? x.dados : null; } catch { return null; } }
function guardarDados() { try { D ? localStorage.setItem(GUARDADO_DADOS, JSON.stringify({ token, dados: D })) : localStorage.removeItem(GUARDADO_DADOS); } catch { /* sem espaço: abre pela internet */ } }

// Quem começou o app ("mestre") pode ver como qualquer uma das 3 pessoas. Neste aparelho ficam guardadas
// a chave dele e as chaves que ele abriu para os outros; os outros não têm esse poder.
const GUARDADO_MESTRE = "temporada-mestre", GUARDADO_CONTAS = "temporada-contas";
const lerLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravarLocal = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* sem espaço */ } };
let mestre = lerLocal(GUARDADO_MESTRE);
const contasGuardadas = () => { try { return JSON.parse(lerLocal(GUARDADO_CONTAS)) || {}; } catch { return {}; } };

async function carregar() {
  try {
    D = await rpc("ab_dados", { p_token: token }); guardarDados();
    if (D.eu.mestre && mestre !== token) { mestre = token; gravarLocal(GUARDADO_MESTRE, token); }
  } catch (e) {
    if (!e.linkRuim) throw e;
    if (mestre && token !== mestre) {
      // a chave de "ver como" caiu (pessoa tirada, por exemplo): volta para a conta do mestre
      const c = contasGuardadas(); Object.keys(c).forEach((k) => { if (c[k] === token) delete c[k]; }); gravarLocal(GUARDADO_CONTAS, JSON.stringify(c));
      token = mestre; guardar(token); D = null; return carregar();
    }
    token = null; guardar(null); D = null; guardarDados();
    if (mestre) { mestre = null; gravarLocal(GUARDADO_MESTRE, null); gravarLocal(GUARDADO_CONTAS, null); }
    throw e;
  }
}

// ---------- moldura e navegação ----------
const app = $("#app");
let nav = null;
function montarAbas() {
  if (nav) return;
  nav = document.createElement("nav");
  nav.className = "abas"; nav.style.setProperty("--n", ABAS.length);
  nav.innerHTML = `<div class="pilula"></div>` + ABAS.map(([id, nome, p]) => `<button data-aba="${id}" aria-label="${nome}">${ic(p)}<span>${nome}</span></button>`).join("");
  nav.addEventListener("click", (e) => { const b = e.target.closest("[data-aba]"); if (b) ir(b.dataset.aba); });
  document.body.append(nav);
}
function marcarAba() {
  const i = ABAS.findIndex((a) => a[0] === abaAtual);
  nav.style.setProperty("--i", i);
  nav.querySelectorAll("button").forEach((b, j) => b.classList.toggle("ativa", j === i));
}
function ir(aba) { if (location.hash !== `#/${aba}`) location.hash = `#/${aba}`; else window.scrollTo({ top: 0, behavior: "smooth" }); }

// Convite = link de uso único. Ao ser aberto, vira a chave deste aparelho e deixa de valer.
let convite = null;
const noIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const instalado = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
let pedidoInstalar = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); pedidoInstalar = e; if (D && abaAtual === "inicio" && !document.querySelector(".folha")) desenhar(); });

// iPhone: o app da tela de início não enxerga o que foi aberto no Safari, mas abre no endereço em que foi
// adicionado. Por isso, no Safari, o convite fica no endereço (e sem manifesto, para o iPhone usar esse endereço):
// ao tocar no ícone, o app já entra sozinho, uma vez só. Nas outras aberturas o convite já usado é ignorado.
const iphoneNoSafari = () => noIphone && !instalado();
const conviteNoEndereco = /^#\/?entrar\//.test(location.hash);
if (!(iphoneNoSafari() && conviteNoEndereco)) {
  const m = document.createElement("link"); m.rel = "manifest"; m.href = "manifest.webmanifest"; document.head.append(m);
}
const GUARDADO_USADOS = "temporada-convites-usados";
const usados = () => { try { return JSON.parse(lerLocal(GUARDADO_USADOS)) || []; } catch { return []; } };

function rota() {
  const h = location.hash.replace(/^#\/?/, "");
  if (h.startsWith("entrar/")) {
    convite = decodeURIComponent(h.slice(7)).trim() || null;
    if (!iphoneNoSafari()) history.replaceState(null, "", location.pathname + "#/inicio");
    return "inicio";
  }
  const a = h.split("/")[0];
  return ABAS.some((x) => x[0] === a) ? a : "inicio";
}

async function resgatar(c, usarAqui = false) {
  convite = null;
  if (iphoneNoSafari() && !usarAqui) return telaInstalarPrimeiro(c);
  app.innerHTML = `<div class="boas-vindas"><div class="logo">${LOGO}</div><div class="girar" style="margin:0 auto"></div></div>`;
  try {
    const novo = await rpc("ab_resgatar", { p_convite: c });
    gravarLocal(GUARDADO_USADOS, JSON.stringify([...usados(), c].slice(-10)));
    // convite de outra pessoa aberto no aparelho do mestre: vira mais uma conta dele, sem perder a dele
    token = novo; guardar(token); D = null; abaAtual = null;
    history.replaceState(null, "", location.pathname + "#/inicio"); return mostrar();
  } catch (e) {
    if (token) { history.replaceState(null, "", location.pathname + "#/inicio"); return mostrar(); }
    return telaEntrada(/usado ou vencido/.test(e.message) ? "Este convite já foi usado ou venceu. Peça um novo a quem administra." : traduzir(e));
  }
}

async function mostrar() {
  const aba = rota();
  if (convite && token && usados().includes(convite)) convite = null;
  if (convite) return resgatar(convite);
  if (!token) return telaEntrada();
  if (!D && (D = dadosGuardados())) setTimeout(recarregar, 0);
  if (!D) {
    app.innerHTML = `<div style="height:60px"></div><div class="esqueleto" style="height:150px"></div><div class="esqueleto" style="height:220px"></div><div class="esqueleto" style="height:120px"></div>`;
    try { await carregar(); } catch (e) { return token ? telaErro(e) : telaEntrada(); }
  }
  const antes = ABAS.findIndex((a) => a[0] === abaAtual), depois = ABAS.findIndex((a) => a[0] === aba);
  const mudou = aba !== abaAtual;
  abaAtual = aba;
  desenhar(mudou ? (antes > depois ? "tela voltar" : "tela") : "");
  if (mudou) window.scrollTo(0, 0);
}

function desenhar(anim = "") {
  montarAbas(); nav.style.display = ""; marcarAba();
  const corpo = { inicio: telaInicio, calendario: telaCalendario, reservas: telaReservas, custos: telaCustos, ajustes: telaAjustes }[abaAtual]();
  const fab = ehAdm() && (abaAtual === "reservas" || abaAtual === "custos")
    ? `<button class="mais" data-acao="${abaAtual === "reservas" ? "nova-reserva" : "novo-custo"}" aria-label="Adicionar">${I.mais}</button>` : "";
  app.innerHTML = `<main class="${anim}">${corpo}</main>${fab}`;
  carregarMiniaturas(app);
}

async function recarregar() {
  try { await carregar(); if (!document.querySelector(".folha")) desenhar(); }
  catch (e) { if (!token) mostrar(); else avisar("Sem conexão agora. Tentamos de novo em seguida."); }
}

function avisar(texto) {
  const a = document.createElement("div");
  a.className = "aviso-voo"; a.textContent = texto; document.body.append(a);
  requestAnimationFrame(() => requestAnimationFrame(() => a.classList.add("ver")));
  setTimeout(() => { a.classList.remove("ver"); setTimeout(() => a.remove(), 400); }, 2600);
}

// ---------- contas ----------
function contas(r) {
  const valor = r.valor ?? 0, adm = Math.round((valor * r.pct_admin_bp) / 10000), limpeza = r.limpeza ?? 0;
  return { valor, adm, limpeza, liquido: valor - adm - limpeza };
}
// Cancelada só entra na conta se tiver valor (o que o Airbnb pagou mesmo assim).
const valeNaConta = (r) => r.tipo === "reserva" && (r.situacao !== "cancelada" || r.valor != null);
const reservas = () => D.reservas.filter((r) => r.tipo === "reserva");

function resumoMes(mes) {
  const rs = D.reservas.filter((r) => valeNaConta(r) && r.entrada.slice(0, 7) === mes);
  const cs = D.custos.filter((c) => c.data.slice(0, 7) === mes);
  let recebido = 0, adm = 0, limpeza = 0;
  rs.forEach((r) => { const k = contas(r); recebido += k.valor; adm += k.adm; limpeza += k.limpeza; });
  const custos = cs.reduce((s, c) => s + c.valor, 0);
  const ini = dia(`${mes}-01`), fim = dia(`${somarMes(mes, 1)}-01`);
  const ocupadas = reservas().filter((r) => r.situacao !== "cancelada")
    .reduce((s, r) => s + Math.max(0, Math.min(fim, dia(r.saida)) - Math.max(ini, dia(r.entrada))), 0);
  const pcts = [...new Set(rs.filter((r) => r.valor != null).map((r) => r.pct_admin_bp))];
  return { rs, cs, recebido, adm, limpeza, custos, liquido: recebido - adm - limpeza - custos, semValor: rs.filter((r) => r.valor == null && r.situacao !== "cancelada"),
    noites: rs.reduce((s, r) => s + noites(r), 0), ocupadas, diasMes: fim - ini, pctUnico: pcts.length === 1 ? pcts[0] : null };
}

// ---------- telas ----------
function cabecalho(titulo, sub, marca = false) {
  const trocar = mestre && D ? `<button class="trocar-conta${token !== mestre ? " outra" : ""}" data-acao="trocar-conta" aria-label="Trocar de conta">
    <span class="avatar">${esc(D.eu.nome.trim()[0] || "?").toUpperCase()}</span>${ic('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>')}</button>` : "";
  return `<header class="topo">${marca ? `<div class="marca-topo">${LOGO}</div>` : ""}<div class="meio"><h1>${esc(titulo)}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}</div>${trocar}</header>`;
}

async function folhaTrocarConta() {
  const { f, fechar } = abrirFolha(`<h3>Ver como</h3><div id="contas"><div class="esqueleto" style="height:150px"></div></div>`);
  try {
    const ps = await rpc("ab_pessoas_listar", { p_token: mestre });
    $("#contas", f).innerHTML = ps.map((p) => `<button class="pessoa${p.id === D.eu.id ? " atual" : ""}" data-id="${p.id}">
      <span class="avatar">${esc(p.nome.trim()[0] || "?").toUpperCase()}</span>
      <span class="meio"><b>${esc(p.nome)}</b><span class="pequeno">${p.papel === "admin" ? "Administra" : "Proprietário · só vê"}</span></span>
      ${p.id === D.eu.id ? `<span class="marcado">${I.ok}</span>` : ""}</button>`).join("");
    $("#contas", f).addEventListener("click", async (e) => {
      const b = e.target.closest("[data-id]"); if (!b || b.dataset.id === D.eu.id) return;
      const p = ps.find((x) => x.id === b.dataset.id);
      try {
        const c = contasGuardadas();
        let t = p.mestre ? mestre : c[p.id];
        if (!t) { t = await rpc("ab_entrar_como", { p_token: mestre, p_pessoa: p.id }); c[p.id] = t; gravarLocal(GUARDADO_CONTAS, JSON.stringify(c)); }
        token = t; guardar(t); D = null; abaAtual = null; fechar();
        if (location.hash !== "#/inicio") history.replaceState(null, "", location.pathname + "#/inicio");
        await mostrar(); avisar(p.mestre ? "De volta à sua conta" : `Vendo como ${p.nome.split(/\s+/)[0]}`);
      } catch (err) { avisar(traduzir(err)); }
    });
  } catch (e) { $("#contas", f).innerHTML = `<p class="pequeno">${esc(traduzir(e))}</p>`; }
}
const barraMes = () => `<div class="mesbar"><button class="redondo" data-acao="mes" data-passo="-1" aria-label="Mês anterior">${I.esq}</button>
  <div class="mes">${nomeMes(mesSel)}</div><button class="redondo" data-acao="mes" data-passo="1" aria-label="Próximo mês">${I.dir}</button></div>`;

function telaInicio() {
  const r = resumoMes(mesSel), adm = ehAdm();
  const primeiro = esc(D.eu.nome.split(/\s+/)[0]);
  const avisos = [];
  if (adm) {
    const sumiram = reservas().filter((x) => x.situacao === "sumiu");
    if (sumiram.length) avisos.push(`<div class="cartao so-adm"><h2>Confira no Airbnb</h2>${sumiram.map((x) => linhaReserva(x)).join("")}
      <div class="pequeno">Saíram do Airbnb. Se cancelaram, marque “cancelada”.</div></div>`);
  }
  const ano = mesSel.slice(0, 4);
  const meses = Array.from({ length: 12 }, (_, i) => `${ano}-${p2(i + 1)}`);
  const liq = meses.map((m) => resumoMes(m).liquido);
  const maior = Math.max(1, ...liq.map(Math.abs));
  const totalAno = liq.reduce((a, b) => a + b, 0);
  const proximas = reservas().filter((x) => x.situacao !== "cancelada" && x.saida > hoje()).slice(0, 3);
  const ocup = r.diasMes ? Math.round((r.ocupadas / r.diasMes) * 100) : 0;

  let semInstalar = false; try { semInstalar = !!localStorage.getItem("temporada-sem-instalar"); } catch { /* sem acesso */ }
  const instalar = !instalado() && !semInstalar && (pedidoInstalar || matchMedia("(pointer: coarse)").matches)
    ? `<section class="cartao instalar"><div class="meio"><b>Instale no celular</b><span class="pequeno">Abre como app, direto da tela de início.</span></div>
      <button class="botao" data-acao="instalar">Instalar</button><button class="redondo pequeno-x" data-acao="esconder-instalar" aria-label="Agora não">${I.x}</button></section>` : "";
  return `${cabecalho(D.config.nome, `Olá, ${primeiro}`, true)}
  ${instalar}
  ${barraMes()}
  <section class="destaque">
    <div class="rotulo">Líquido do proprietário em ${MESES[+mesSel.slice(5) - 1]}</div>
    <div class="valor num">${brl(r.liquido)}</div>
    <div class="nota">${plural(r.rs.length, "reserva", "reservas")} · ${plural(r.noites, "noite", "noites")}${r.semValor.length ? ` · ${plural(r.semValor.length, "valor ainda a lançar", "valores ainda a lançar")}` : ""}</div>
  </section>
  ${avisos.join("")}
  <section class="cartao"><h2>Detalhes do mês</h2><div class="linhas">
    <div class="linha"><span>Recebido do Airbnb</span><b class="num">${brl(r.recebido)}</b></div>
    <div class="linha"><span>Taxa de administração</span><span class="num menos">− ${brl(r.adm)}</span></div>
    <div class="linha"><span>Taxa de limpeza</span><span class="num menos">− ${brl(r.limpeza)}</span></div>
    <div class="linha"><span>Outros custos <span class="pequeno">(${plural(r.cs.length, "nota", "notas")})</span></span><span class="num menos">− ${brl(r.custos)}</span></div>
    <div class="linha total"><span>Líquido</span><span class="num">${brl(r.liquido)}</span></div>
  </div></section>
  ${adm ? `<section class="cartao so-adm"><h2>Administração</h2><div class="linhas">
    <div class="linha"><span>Taxa de administração</span><span class="num">${brl(r.adm)}</span></div>
    <div class="linha"><span>Taxa de limpeza</span><span class="num">${brl(r.limpeza)}</span></div>
    <div class="linha total"><span>Fica com a administração</span><span class="num">${brl(r.adm + r.limpeza)}</span></div>
  </div></section>` : ""}
  <section class="cartao"><h2>Ocupação</h2>
    <div class="ocupacao"><div style="width:${ocup}%"></div></div>
    <div class="pequeno">${plural(r.ocupadas, "noite ocupada", "noites ocupadas")} de ${r.diasMes} (${ocup}%)</div>
  </section>
  <section class="cartao"><h2>Líquido em ${ano} · <span class="num">${brl(totalAno)}</span></h2>
    <div class="barras">${meses.map((m, i) => `<button class="barra${m === mesSel ? " atual" : ""}${liq[i] < 0 ? " negativo" : ""}" data-acao="ir-mes" data-mes="${m}" aria-label="${nomeMes(m)}: ${brl(liq[i])}">
      <div style="height:${Math.round((Math.abs(liq[i]) / maior) * 100)}%;animation-delay:${i * 0.03}s"></div><span>${MESES_C[i][0]}</span></button>`).join("")}</div>
  </section>
  ${proximas.length ? `<div class="secao">Próximas hospedagens</div>${proximas.map((x) => linhaReserva(x)).join("")}` : ""}`;
}

function selosReserva(r) {
  const s = r.codigo && r.hospede ? [`<span class="selo airbnb">Airbnb</span>`] : [];
  if (r.situacao === "cancelada") s.push(`<span class="selo ruim">Cancelada</span>`);
  else if (r.situacao === "sumiu") s.push(`<span class="selo aviso">Saiu do Airbnb</span>`);
  if (r.valor == null && r.situacao !== "cancelada") s.push(`<span class="selo aviso">Valor a lançar</span>`);
  if (r.limpeza != null) s.push(`<span class="selo ok">Limpeza</span>`);
  return s.join("");
}

function linhaReserva(r) {
  const k = contas(r), adm = ehAdm();
  const rapida = adm && r.limpeza == null && r.situacao !== "cancelada"
    ? `<div class="acao-rapida"><button class="chip" data-acao="limpeza-rapida" data-id="${r.id}">${I.vassoura.replace("<svg", '<svg style="width:15px;height:15px;vertical-align:-2px"')} + Limpeza ${brl(D.config.limpeza_padrao)}</button></div>` : "";
  const selos = selosReserva(r);
  return `<div class="item toque reserva" role="button" tabindex="0" data-acao="abrir-reserva" data-id="${r.id}">
    <div class="data-bloco"><b>${+r.entrada.slice(8, 10)}</b><span>${MESES_C[+r.entrada.slice(5, 7) - 1]}</span></div>
    <div class="meio"><div class="titulo">${esc(r.hospede || (r.codigo ? `Reserva ${r.codigo}` : "Reserva"))}</div>
      <div class="pequeno">${dataCurta(r.entrada)} → ${dataCurta(r.saida)} · ${plural(noites(r), "noite", "noites")}</div>
      ${selos ? `<div class="selos">${selos}</div>` : ""}${rapida}</div>
    <div class="direita num">${r.valor != null ? brl(k.liquido) : "—"}<div class="pequeno">líquido</div></div></div>`;
}

function telaCalendario() {
  const ini = dia(`${mesSel}-01`), fim = dia(`${somarMes(mesSel, 1)}-01`);
  const semanaIni = new Date(ini * 864e5).getUTCDay();
  const ativas = D.reservas.filter((r) => r.situacao !== "cancelada");
  const ordem = reservas().filter((r) => r.situacao !== "cancelada");
  const hojeN = dia(hoje());
  let celulas = SEMANA.map((s) => `<div class="sem">${s}</div>`).join("") + `<div class="dia fora"></div>`.repeat(semanaIni);
  for (let d = ini; d < fim; d++) {
    const r = ativas.find((x) => dia(x.entrada) <= d && d < dia(x.saida));
    const sai = ordem.find((x) => dia(x.saida) === d);
    let cls = "dia", marca = "";
    if (r && r.tipo === "bloqueio") cls += " bloqueado";
    else if (r) { cls += " ocupado" + (ordem.indexOf(r) % 2 ? " alt" : ""); if (dia(r.entrada) === d) marca = "entra"; }
    if (!marca && sai) marca = "sai";
    if (d === hojeN) cls += " hoje";
    if (diaSel === d) cls += " escolhido";
    celulas += `<button class="${cls}" data-acao="dia" data-dia="${d}"><span>${new Date(d * 864e5).getUTCDate()}</span>${marca ? `<small>${marca}</small>` : ""}</button>`;
  }
  const doMes = reservas().filter((r) => dia(r.entrada) < fim && dia(r.saida) > ini);
  let detalhe = "";
  if (diaSel != null && diaSel >= ini && diaSel < fim) {
    const r = ativas.find((x) => dia(x.entrada) <= diaSel && diaSel < dia(x.saida));
    detalhe = `<div class="secao">${dataCurta(deDia(diaSel))}</div>` + (r ? (r.tipo === "bloqueio"
      ? `<div class="cartao pequeno">Data bloqueada no Airbnb (sem hóspede).</div>` : linhaReserva(r)) : `<div class="cartao pequeno">Noite livre.</div>`);
  }
  return `${cabecalho("Agenda", `${plural(resumoMes(mesSel).ocupadas, "noite ocupada", "noites ocupadas")} no mês`)}
  ${barraMes()}
  <section class="cartao"><div class="cal">${celulas}</div>
    <div class="legenda"><span><i style="background:var(--mar)"></i>Reservado</span><span><i style="background:var(--cinza-claro)"></i>Bloqueado</span><span><i style="box-shadow:inset 0 0 0 2px var(--coral)"></i>Hoje</span></div>
  </section>
  ${detalhe}
  <div class="secao">Reservas do mês</div>
  ${doMes.length ? doMes.map(linhaReserva).join("") : `<div class="cartao vazio">${I.cal}Nenhuma reserva neste mês.</div>`}
  ${ehAdm() && D.config.robo_visto_em ? `<div class="pequeno" style="text-align:center;margin-top:10px">Calendário do Airbnb conferido ${quando(D.config.robo_visto_em)}.</div>` : ""}`;
}

function telaReservas() {
  const h = hoje();
  const todas = reservas();
  const futuras = todas.filter((r) => r.saida > h), passadas = todas.filter((r) => r.saida <= h).reverse();
  const semValor = todas.filter((r) => r.valor == null && r.situacao !== "cancelada" && r.entrada <= h).length;
  return `${cabecalho("Reservas", semValor && ehAdm() ? `<span class="selo aviso">${plural(semValor, "reserva sem valor", "reservas sem valor")}</span>` : `${plural(todas.length, "reserva", "reservas")} no total`)}
  <div class="secao">Agora e próximas</div>
  ${futuras.length ? futuras.map(linhaReserva).join("") : `<div class="cartao vazio">${I.cama}Nenhuma reserva pela frente.</div>`}
  ${passadas.length ? `<div class="secao">Anteriores</div>${passadas.map(linhaReserva).join("")}` : ""}`;
}

function linhaCusto(c) {
  const img = c.arquivo_id && /^image\//.test(c.arquivo_tipo || "");
  const mini = c.arquivo_id
    ? (img ? `<img class="miniatura" alt="Nota" data-arquivo="${c.arquivo_id}">` : `<div class="miniatura">${I.arquivo}</div>`)
    : `<div class="miniatura">${I.nota}</div>`;
  return `<div class="item toque" role="button" tabindex="0" data-acao="abrir-custo" data-id="${c.id}">${mini}
    <div class="meio"><div class="titulo">${esc(c.descricao)}</div><div class="pequeno">${dataCurta(c.data)} · ${esc(c.categoria)}${c.arquivo_id ? "" : " · sem nota"}</div></div>
    <div class="direita num">${brl(c.valor)}</div></div>`;
}

function telaCustos() {
  const r = resumoMes(mesSel);
  const porCat = {};
  r.cs.forEach((c) => { porCat[c.categoria] = (porCat[c.categoria] || 0) + c.valor; });
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  return `${cabecalho("Custos", "")}
  ${barraMes()}
  <section class="cartao"><h2>Total do mês</h2><div style="font-size:30px;font-weight:750;letter-spacing:-.02em" class="num">${brl(r.custos)}</div>
    ${cats.length ? `<div class="linhas" style="margin-top:8px">${cats.map(([k, v]) => `<div class="linha"><span>${esc(k)}</span><span class="num">${brl(v)}</span></div>`).join("")}</div>` : ""}</section>
  ${r.cs.length ? r.cs.slice().reverse().map(linhaCusto).join("") : `<div class="cartao vazio">${I.nota}Nenhum custo em ${MESES[+mesSel.slice(5) - 1]}.</div>`}`;
}

function quando(iso) {
  if (!iso) return "nunca";
  const min = Math.round((Date.now() - new Date(iso)) / 6e4);
  if (min < 2) return "agora há pouco";
  if (min < 60) return `há ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${plural(h, "hora", "horas")}`;
  return `em ${new Date(iso).toLocaleDateString("pt-BR")}`;
}

function telaAjustes() {
  const meuLink = `<section class="cartao"><h2>Este aparelho</h2>
    <p class="pequeno" style="margin-top:0"><b>${esc(D.eu.nome)}</b> · ${ehAdm() ? "administra" : "proprietário"}</p>
    <div class="botoes-fim"><button class="botao claro" data-acao="conectar-aparelho" style="flex:2">${I.mais} Outro aparelho</button><button class="botao perigo" data-acao="sair">Sair</button></div></section>`;
  if (!ehAdm()) return `${cabecalho("Ajustes", "")}${meuLink}<p class="pequeno" style="text-align:center">Dúvidas sobre os valores? Fale com a administração.</p>`;
  const c = D.config, rel = c.robo_relato || {};
  return `${cabecalho("Ajustes", "")}
  <section class="cartao"><h2>Imóvel</h2>
    <label class="campo"><span>Nome do imóvel</span><input id="cfg-nome" value="${esc(c.nome)}" maxlength="60"></label>
    <div class="dupla"><label class="campo"><span>Taxa de adm. (%)</span><input id="cfg-pct" inputmode="decimal" value="${(c.pct_admin_bp / 100).toLocaleString("pt-BR")}"></label>
    <label class="campo"><span>Limpeza padrão (R$)</span><input id="cfg-limpeza" inputmode="decimal" value="${mostrarReais(c.limpeza_padrao)}"></label></div>    <button class="botao cheio" data-acao="salvar-config">Salvar</button></section>
  <section class="cartao"><h2>Quem tem acesso</h2><div id="pessoas"><div class="esqueleto" style="height:60px"></div></div></section>
  <section class="cartao"><h2>Robô do Airbnb</h2>
    ${c.robo_ligado ? `<div class="linhas">
      <div class="linha"><span>Última leitura</span><b>${quando(c.robo_visto_em)}</b></div>
      ${c.robo_visto_em ? `<div class="linha"><span>Reservas no calendário</span><span>${rel.reservas_no_calendario ?? 0}</span></div>
      <div class="linha"><span>E-mails lidos na última vez</span><span>${rel.emails_lidos ?? 0}</span></div>` : ""}
    </div>${(rel.avisos || []).map((a) => `<div class="selo aviso" style="white-space:normal;margin-top:8px;display:block;border-radius:12px;padding:8px 10px">${esc(a)}</div>`).join("")}`
    : `<p class="pequeno" style="margin-top:0">Desligado. Ligado, ele traz sozinho as datas e os valores do Airbnb.</p>`}
    <div class="botoes-fim" style="margin-top:12px;flex-wrap:wrap"><button class="botao claro" data-acao="robo-instalar">Como ligar</button>
    <button class="botao claro" data-acao="robo-segredo">${c.robo_ligado ? "Novo segredo" : "Gerar segredo"}</button></div></section>
  ${meuLink}`;
}

const MAX_PESSOAS = 3;
let pessoas = [];
async function listarPessoas() {
  const caixa = $("#pessoas"); if (!caixa) return;
  try {
    pessoas = await rpc("ab_pessoas_listar", { p_token: token });
    const situacao = (p) => p.aparelhos ? `${plural(p.aparelhos, "aparelho", "aparelhos")} · entrou ${quando(p.visto_em)}`
      : p.convite_aberto ? "convite enviado, ainda não entrou" : "sem aparelho conectado";
    caixa.innerHTML = pessoas.map((p) => `<button class="pessoa" data-acao="abrir-pessoa" data-id="${p.id}">
      <span class="avatar">${esc(p.nome.trim()[0] || "?").toUpperCase()}</span>
      <span class="meio"><b>${esc(p.nome)}</b><span class="pequeno">${p.papel === "admin" ? "Administra" : "Proprietário · só vê"} · ${situacao(p)}</span></span>
      ${p.id === D.eu.id ? `<span class="selo neutro">Você</span>` : `<span class="seta">${I.dir}</span>`}</button>`).join("")
      + (pessoas.length < MAX_PESSOAS
        ? `<button class="botao claro cheio" data-acao="nova-pessoa" style="margin-top:12px">${I.mais} Convidar pessoa</button>`
        : `<p class="pequeno" style="margin:10px 2px 0">${MAX_PESSOAS} de ${MAX_PESSOAS} acessos em uso. Ninguém mais entra.</p>`);
  } catch (e) { caixa.innerHTML = `<p class="pequeno">${esc(traduzir(e))}</p>`; }
}

function folhaPessoa(p) {
  const { f, fechar } = abrirFolha(`<h3>${esc(p.nome)}</h3>
    <p class="pequeno" style="font-size:15px;margin-top:-8px">${p.papel === "admin" ? "Administra: lança e edita" : "Proprietário: só vê"} · ${plural(p.aparelhos, "aparelho conectado", "aparelhos conectados")}</p>
    <div class="lista-acoes">
      <button class="botao claro cheio" data-p="convite">${I.enviar} Novo convite (celular novo)</button>
      ${p.aparelhos ? `<button class="botao claro cheio" data-p="desconectar">Desconectar os aparelhos</button>` : ""}
      <button class="botao perigo cheio" data-p="tirar">Tirar o acesso</button></div>`);
  f.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-p]"); if (!b) return;
    if (b.dataset.p === "convite") {
      await ocupado(b, async () => { const t = await rpc("ab_pessoa_novo_link", { p_token: token, p_id: p.id }); fechar(); listarPessoas(); mostrarLink(`Convite de ${p.nome}`, p.nome, t); }).catch(() => {});
    } else if (b.dataset.p === "desconectar") {
      if (!(await perguntar(`Desconectar ${p.nome}?`, "Todos os aparelhos dela saem na hora. Para voltar, só com convite novo.", "Desconectar"))) return;
      await ocupado(b, async () => { await rpc("ab_pessoa_desconectar", { p_token: token, p_id: p.id }); fechar(); avisar("Aparelhos desconectados"); listarPessoas(); }).catch(() => {});
    } else {
      if (!(await perguntar(`Tirar o acesso de ${p.nome}?`, "A pessoa sai de todos os aparelhos na hora e some da lista.", "Tirar acesso"))) return;
      await ocupado(b, async () => { await rpc("ab_pessoa_remover", { p_token: token, p_id: p.id }); fechar(); avisar("Acesso retirado"); listarPessoas(); }).catch(() => {});
    }
  });
}

// ---------- entrada ----------
function telaInstalarPrimeiro(c) {
  if (nav) nav.style.display = "none";
  const link = linkDe(c);
  app.innerHTML = `<main class="tela"><div class="boas-vindas"><div class="logo">${LOGO}</div>
    <h1>Instale o app</h1>
    <ol class="passos"><li>Toque em <b>Compartilhar</b> ${ic('<path d="M12 3v12M7 8l5-5 5 5M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>').replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-3px"')} no Safari.</li>
      <li>Toque em <b>Adicionar à Tela de Início</b>.</li>
      <li>Abra pelo ícone. Você já entra — uma vez só, para sempre.</li></ol>
    <button class="botao claro cheio" id="usar-aqui">Prefiro usar aqui no Safari</button>
    <button class="botao claro cheio" id="copiar-convite" style="margin-top:10px;box-shadow:none;background:none">${I.copiar} Copiar convite</button>
  </div></main>`;
  $("#copiar-convite").addEventListener("click", () => copiar(link, "Convite copiado"));
  $("#usar-aqui").addEventListener("click", () => resgatar(c, true));
}

async function telaEntrada(erro) {
  if (nav) nav.style.display = "none";
  app.innerHTML = `<div class="boas-vindas"><div class="logo">${LOGO}</div><div class="girar" style="margin:0 auto"></div></div>`;
  let iniciado = true;
  try { iniciado = await rpc("ab_ja_iniciado"); } catch { /* sem internet: mostra a entrada por convite */ }
  app.innerHTML = `<main class="tela"><div class="boas-vindas"><div class="logo">${LOGO}</div>
    ${iniciado ? `<h1>Terê House's</h1><p>Este app é só para quem recebeu um convite.<br>Abra o convite que mandaram para você — ou cole aqui:</p>
      ${erro ? `<p class="selo aviso" style="display:block;white-space:normal;border-radius:12px;padding:10px 12px;margin:0 0 14px">${esc(erro)}</p>` : ""}
      <label class="campo"><input id="colar" placeholder="Cole o convite aqui" autocomplete="off"></label>
      <button class="botao cheio" data-acao="entrar-colado">Entrar</button>`
    : `<h1>Vamos começar</h1><p>Você é a primeira pessoa. Depois você convida as outras duas.</p>
      <label class="campo"><input id="meu-nome" placeholder="Seu nome" maxlength="60" autocomplete="name"></label>
      <button class="botao cheio" data-acao="iniciar">Começar</button>`}
  </div></main>`;
}

function telaErro(e) {
  app.innerHTML = `<main class="tela"><div class="boas-vindas"><div class="logo">${LOGO}</div>
    <h1>Sem conexão</h1><p>${esc(e.message === "Failed to fetch" ? "Não deu para falar com o servidor. Confira a internet." : e.message)}</p>
    <button class="botao cheio" data-acao="tentar">Tentar de novo</button></div></main>`;
}

// ---------- folhas (janelas que sobem) ----------
function abrirFolha(html) {
  const n = document.querySelectorAll(".folha").length;
  const veu = document.createElement("div"), f = document.createElement("div");
  veu.className = "veu"; f.className = "folha"; veu.style.zIndex = 40 + n * 2; f.style.zIndex = 41 + n * 2;
  f.innerHTML = `<div class="alca"></div>${html}`;
  document.body.append(veu, f);
  requestAnimationFrame(() => requestAnimationFrame(() => { veu.classList.add("aberto"); f.classList.add("aberta"); }));
  const fechar = () => { veu.classList.remove("aberto"); f.style.transform = ""; f.classList.remove("aberta"); setTimeout(() => { veu.remove(); f.remove(); }, 450); };
  veu.addEventListener("click", fechar);
  // arrastar a alça para baixo fecha
  let y0 = null, dy = 0;
  f.addEventListener("touchstart", (e) => { if (f.scrollTop <= 0 && e.touches[0].clientY - f.getBoundingClientRect().top < 56) { y0 = e.touches[0].clientY; dy = 0; f.style.transition = "none"; } }, { passive: true });
  f.addEventListener("touchmove", (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); f.style.transform = `translate(-50%, ${dy}px)`; }, { passive: true });
  f.addEventListener("touchend", () => { if (y0 == null) return; f.style.transition = ""; y0 = null; if (dy > 110) fechar(); else f.style.transform = ""; });
  return { f, fechar };
}

function perguntar(titulo, texto, sim, perigo = true) {
  return new Promise((ok) => {
    const { f, fechar } = abrirFolha(`<h3>${esc(titulo)}</h3><p class="pequeno" style="font-size:15px;margin-top:-6px">${texto}</p>
      <div class="botoes-fim"><button class="botao claro" data-r="0">Voltar</button><button class="botao ${perigo ? "perigo" : ""}" data-r="1">${esc(sim)}</button></div>`);
    let dado = false;
    f.addEventListener("click", (e) => { const b = e.target.closest("[data-r]"); if (!b) return; dado = true; fechar(); ok(b.dataset.r === "1"); });
    f.previousSibling.addEventListener("click", () => { if (!dado) ok(false); });
  });
}

async function ocupado(botao, fn) {
  const antes = botao.innerHTML; botao.disabled = true; botao.innerHTML = `<div class="girar"></div>`;
  try { return await fn(); }
  catch (e) { avisar(traduzir(e)); throw e; }
  finally { botao.disabled = false; botao.innerHTML = antes; }
}
function traduzir(e) {
  const m = e.message || "";
  if (m === "Failed to fetch") return "Sem internet agora.";
  if (/check constraint|saida/.test(m)) return "Confira as datas e os valores.";
  if (/so quem administra/.test(m)) return "Só quem administra pode mexer.";
  if (/ja tem 3 pessoas/.test(m)) return "Já são 3 pessoas com acesso.";
  return m;
}

// ---------- reserva ----------
function folhaReserva(r) {
  if (!ehAdm()) return verReserva(r);
  const novo = !r;
  r = r || { entrada: hoje(), saida: deDia(dia(hoje()) + 2), pct_admin_bp: D.config.pct_admin_bp, limpeza: null, situacao: "confirmada", origem: "manual" };
  const padrao = D.config.limpeza_padrao;
  let modoLimpeza = r.limpeza == null ? "nao" : r.limpeza === padrao ? "padrao" : "outro";
  const doCalendario = r.origem !== "manual";
  const { f, fechar } = abrirFolha(`<h3>${novo ? "Nova reserva" : "Reserva"}</h3>
    ${doCalendario ? `<p class="pequeno" style="margin-top:-8px">Veio do Airbnb${r.codigo ? ` · código ${esc(r.codigo)}` : ""}. As datas se atualizam sozinhas.</p>` : ""}
    <div class="dupla"><label class="campo"><span>Chegada</span><input type="date" id="r-entrada" value="${r.entrada}"></label>
    <label class="campo"><span>Saída</span><input type="date" id="r-saida" value="${r.saida}"></label></div>
    <label class="campo"><span>Hóspede</span><input id="r-hospede" value="${esc(r.hospede)}" maxlength="80" placeholder="Nome (opcional)"></label>
    <label class="campo"><span>Quanto o Airbnb paga (R$)</span><input id="r-valor" inputmode="decimal" value="${mostrarReais(r.valor)}" placeholder="0,00"></label>
    ${r.valor_origem === "email" ? `<p class="pequeno" style="margin-top:-8px">Este valor foi lido do e-mail do Airbnb. Confira.</p>` : ""}
    <div class="campo"><span>Taxa de limpeza</span><div class="chips" id="r-limpeza">
      <button class="chip" data-l="nao">Sem limpeza</button><button class="chip" data-l="padrao">${brl(padrao)}</button><button class="chip" data-l="outro">Outro valor</button></div>
      <input id="r-limpeza-valor" inputmode="decimal" placeholder="Valor da limpeza" value="${modoLimpeza === "outro" ? mostrarReais(r.limpeza) : ""}" style="margin-top:10px;${modoLimpeza === "outro" ? "" : "display:none"}"></div>
    <div class="previa" id="r-previa"></div>
    <details style="margin-bottom:14px"><summary class="pequeno" style="cursor:pointer;padding:4px 2px">Mais opções</summary><div style="margin-top:12px">
      <div class="dupla"><label class="campo"><span>Código do Airbnb</span><input id="r-codigo" value="${esc(r.codigo)}" placeholder="HM..." autocapitalize="characters"></label>
      <label class="campo"><span>Taxa de adm. (%)</span><input id="r-pct" inputmode="decimal" value="${(r.pct_admin_bp / 100).toLocaleString("pt-BR")}"></label></div>
      <label class="campo"><span>Situação</span><select id="r-situacao">
        <option value="confirmada"${r.situacao === "confirmada" ? " selected" : ""}>Confirmada</option>
        <option value="cancelada"${r.situacao === "cancelada" ? " selected" : ""}>Cancelada</option>
        ${r.situacao === "sumiu" ? `<option value="sumiu" selected>Saiu do calendário do Airbnb</option>` : ""}</select></label>
      <label class="campo"><span>Observação</span><textarea id="r-obs" maxlength="500">${esc(r.obs)}</textarea></label></div></details>
    <div class="botoes-fim">${novo ? "" : `<button class="botao perigo" id="r-apagar">Apagar</button>`}<button class="botao" id="r-salvar">Salvar</button></div>`);

  const ler = () => {
    const pctTxt = $("#r-pct", f).value.replace(",", ".");
    const limpeza = modoLimpeza === "nao" ? null : modoLimpeza === "padrao" ? padrao : lerReais($("#r-limpeza-valor", f).value);
    return { id: r.id, entrada: $("#r-entrada", f).value, saida: $("#r-saida", f).value, hospede: $("#r-hospede", f).value,
      valor: lerReais($("#r-valor", f).value), limpeza, codigo: $("#r-codigo", f).value, pct_admin_bp: Math.round(Number(pctTxt) * 100),
      situacao: $("#r-situacao", f).value, obs: $("#r-obs", f).value };
  };
  const previa = () => {
    $("#r-limpeza", f).querySelectorAll(".chip").forEach((c) => c.classList.toggle("ligado", c.dataset.l === modoLimpeza));
    const x = ler();
    if (x.valor == null || Number.isNaN(x.valor) || Number.isNaN(x.limpeza) || !Number.isFinite(x.pct_admin_bp)) { $("#r-previa", f).innerHTML = `<span class="pequeno">Digite o valor para ver o líquido.</span>`; return; }
    const k = contas({ ...x });
    const n = x.saida > x.entrada ? noites(x) : 0;
    $("#r-previa", f).innerHTML = `<div class="linha"><span>Taxa de administração (${pct(x.pct_admin_bp)})</span><span class="num menos">− ${brl(k.adm)}</span></div>
      <div class="linha"><span>Taxa de limpeza</span><span class="num menos">− ${brl(k.limpeza)}</span></div>
      <div class="linha"><b>Líquido desta reserva${n ? ` · ${plural(n, "noite", "noites")}` : ""}</b><b class="num">${brl(k.liquido)}</b></div>`;
  };
  $("#r-limpeza", f).addEventListener("click", (e) => {
    const b = e.target.closest("[data-l]"); if (!b) return;
    modoLimpeza = b.dataset.l;
    const campo = $("#r-limpeza-valor", f); campo.style.display = modoLimpeza === "outro" ? "" : "none";
    if (modoLimpeza === "outro") campo.focus();
    previa();
  });
  f.addEventListener("input", previa);
  $("#r-valor", f).addEventListener("blur", (e) => { const v = lerReais(e.target.value); if (v != null && !Number.isNaN(v)) e.target.value = mostrarReais(v); });
  previa();
  $("#r-salvar", f).addEventListener("click", (e) => ocupado(e.currentTarget, async () => {
    const x = ler();
    if (!x.entrada || !x.saida || x.saida <= x.entrada) throw new Error("A saída tem que ser depois da chegada.");
    if (Number.isNaN(x.valor) || Number.isNaN(x.limpeza)) throw new Error("Valor em reais inválido.");
    if (!Number.isFinite(x.pct_admin_bp) || x.pct_admin_bp < 0 || x.pct_admin_bp > 10000) throw new Error("Taxa de administração inválida.");
    await rpc("ab_reserva_salvar", { p_token: token, p_r: x });
    fechar(); avisar(novo ? "Reserva lançada" : "Reserva salva"); await recarregar();
  }).catch(() => {}));
  $("#r-apagar", f)?.addEventListener("click", async (e) => {
    const aviso = doCalendario && r.situacao !== "cancelada" ? " Ela veio do Airbnb: se ainda estiver lá, o robô traz de volta. Para cancelada, use “Mais opções”." : "";
    if (!(await perguntar("Apagar reserva?", `Isto não tem volta.${aviso}`, "Apagar"))) return;
    await ocupado(e.target, async () => { await rpc("ab_reserva_apagar", { p_token: token, p_id: r.id }); fechar(); avisar("Reserva apagada"); await recarregar(); }).catch(() => {});
  });
}

function verReserva(r) {
  const k = contas(r);
  const ligados = D.custos.filter((c) => c.reserva_id === r.id);
  const { f } = abrirFolha(`<h3>${esc(r.hospede || "Reserva")}</h3>
    <p class="pequeno" style="margin-top:-8px">${dataCurta(r.entrada)} → ${dataCurta(r.saida)} · ${plural(noites(r), "noite", "noites")} ${selosReserva(r)}</p>
    <div class="linhas">
      <div class="linha"><span>Recebido do Airbnb</span><b class="num">${r.valor != null ? brl(k.valor) : "a lançar"}</b></div>
      <div class="linha"><span>Taxa de administração (${pct(r.pct_admin_bp)})</span><span class="num menos">− ${brl(k.adm)}</span></div>
      <div class="linha"><span>Taxa de limpeza</span><span class="num menos">− ${brl(k.limpeza)}</span></div>
      <div class="linha total"><span>Líquido</span><span class="num">${r.valor != null ? brl(k.liquido) : "—"}</span></div></div>
    ${ligados.length ? `<div class="secao">Custos desta hospedagem</div>${ligados.map(linhaCusto).join("")}` : ""}
    ${r.obs ? `<p class="pequeno">${esc(r.obs)}</p>` : ""}`);
  carregarMiniaturas(f);
}

// ---------- custo ----------
function folhaCusto(c) {
  if (!ehAdm()) return c.arquivo_id ? verArquivo(c.arquivo_id) : avisar("Este custo não tem nota anexada.");
  const novo = !c;
  c = c || { data: hoje(), categoria: CATEGORIAS[0] };
  let arquivo = c.arquivo_id ? { id: c.arquivo_id, tipo: c.arquivo_tipo } : null; // {id} já na nuvem ou {blob, tipo} novo
  let categoria = c.categoria;
  const opcoesReserva = reservas().filter((r) => r.situacao !== "cancelada")
    .sort((a, b) => Math.abs(dia(a.entrada) - dia(c.data)) - Math.abs(dia(b.entrada) - dia(c.data))).slice(0, 15);
  const { f, fechar } = abrirFolha(`<h3>${novo ? "Novo custo" : "Custo"}</h3>
    <div class="foto-nota" id="k-foto"></div>
    <input type="file" id="k-camera" accept="image/*" capture="environment" hidden>
    <input type="file" id="k-arquivo" accept="image/*,application/pdf" hidden>
    <label class="campo"><span>Valor (R$)</span><input id="k-valor" inputmode="decimal" value="${mostrarReais(c.valor)}" placeholder="0,00"></label>
    <label class="campo"><span>O que foi</span><input id="k-desc" value="${esc(c.descricao)}" maxlength="120" placeholder="Ex.: troca do chuveiro"></label>
    <div class="campo"><span>Tipo</span><div class="chips" id="k-cat">${[...new Set([...CATEGORIAS, categoria])].map((k) => `<button class="chip" data-c="${esc(k)}">${esc(k)}</button>`).join("")}</div></div>
    <div class="dupla"><label class="campo"><span>Data</span><input type="date" id="k-data" value="${c.data}"></label>
    <label class="campo"><span>Hospedagem (opcional)</span><select id="k-reserva"><option value="">Nenhuma</option>
      ${opcoesReserva.map((r) => `<option value="${r.id}"${r.id === c.reserva_id ? " selected" : ""}>${dataCurta(r.entrada)} · ${esc(r.hospede || r.codigo || "reserva")}</option>`).join("")}</select></label></div>
    <div class="botoes-fim">${novo ? "" : `<button class="botao perigo" id="k-apagar">Apagar</button>`}<button class="botao" id="k-salvar">Salvar</button></div>`);

  const marcarCat = () => $("#k-cat", f).querySelectorAll(".chip").forEach((b) => b.classList.toggle("ligado", b.dataset.c === categoria));
  $("#k-cat", f).addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) { categoria = b.dataset.c; marcarCat(); } });
  marcarCat();

  const desenharFoto = async () => {
    const caixa = $("#k-foto", f);
    if (!arquivo) {
      caixa.innerHTML = `<div class="botoes"><button class="botao" data-f="camera">${I.camera} Tirar foto da nota</button><button class="botao claro" data-f="arquivo">${I.arquivo} Arquivo ou PDF</button></div>`;
      return;
    }
    const tipo = arquivo.tipo || "";
    let url = arquivo.blob ? URL.createObjectURL(arquivo.blob) : null;
    if (!url && /^image\//.test(tipo)) { caixa.innerHTML = `<div class="girar"></div>`; url = (await pegarArquivo(arquivo.id)).url; }
    caixa.innerHTML = (/^image\//.test(tipo) ? `<img src="${url}" alt="Nota">` : `<div class="botoes">${I.arquivo}<b>PDF anexado</b></div>`)
      + `<button class="redondo trocar" data-f="tirar" aria-label="Tirar a nota">${I.x}</button>`;
  };
  $("#k-foto", f).addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    if (b.dataset.f === "camera") $("#k-camera", f).click();
    else if (b.dataset.f === "arquivo") $("#k-arquivo", f).click();
    else { arquivo = null; desenharFoto(); }
  });
  const escolher = async (e) => {
    const file = e.target.files[0]; e.target.value = ""; if (!file) return;
    $("#k-foto", f).innerHTML = `<div class="girar"></div>`;
    try { arquivo = await prepararArquivo(file); } catch (err) { avisar(err.message); arquivo = null; }
    desenharFoto();
  };
  $("#k-camera", f).addEventListener("change", escolher);
  $("#k-arquivo", f).addEventListener("change", escolher);
  $("#k-valor", f).addEventListener("blur", (e) => { const v = lerReais(e.target.value); if (v != null && !Number.isNaN(v)) e.target.value = mostrarReais(v); });
  desenharFoto();

  $("#k-salvar", f).addEventListener("click", (e) => ocupado(e.currentTarget, async () => {
    const valor = lerReais($("#k-valor", f).value), descricao = $("#k-desc", f).value.trim(), data = $("#k-data", f).value;
    if (!valor || Number.isNaN(valor)) throw new Error("Digite o valor do custo.");
    if (!descricao) throw new Error("Diga o que foi o custo.");
    if (!data) throw new Error("Escolha a data.");
    let arquivoId = arquivo?.id || null;
    if (arquivo?.blob) arquivoId = await rpc("ab_arquivo_por", { p_token: token, p_tipo: arquivo.tipo, p_base64: await paraBase64(arquivo.blob) });
    await rpc("ab_custo_salvar", { p_token: token, p_c: { id: c.id, data, descricao, categoria, valor, reserva_id: $("#k-reserva", f).value, arquivo_id: arquivoId } });
    fechar(); avisar(novo ? "Custo lançado" : "Custo salvo"); await recarregar();
  }).catch(() => {}));
  $("#k-apagar", f)?.addEventListener("click", async (e) => {
    if (!(await perguntar("Apagar custo?", "O custo e a foto da nota somem. Isto não tem volta.", "Apagar"))) return;
    await ocupado(e.target, async () => { await rpc("ab_custo_apagar", { p_token: token, p_id: c.id }); fechar(); avisar("Custo apagado"); await recarregar(); }).catch(() => {});
  });
}

// Foto vira JPEG de até 1800 px (nota continua legível e o banco não enche); PDF vai como está.
async function prepararArquivo(file) {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    if (file.size > 5.5e6) throw new Error("PDF grande demais (máximo 5 MB).");
    return { blob: file, tipo: "application/pdf" };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => erro(new Error("Não deu para abrir esta imagem.")); i.src = url; });
    const escala = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.naturalWidth * escala); cv.height = Math.round(img.naturalHeight * escala);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    const blob = await new Promise((ok) => cv.toBlob(ok, "image/jpeg", 0.8));
    if (!blob) throw new Error("Não deu para preparar a foto.");
    return { blob, tipo: "image/jpeg" };
  } finally { URL.revokeObjectURL(url); }
}
const paraBase64 = (blob) => new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = () => erro(r.error); r.readAsDataURL(blob); });

const arquivos = new Map();
function pegarArquivo(id) {
  if (!arquivos.has(id)) {
    arquivos.set(id, rpc("ab_arquivo_pegar", { p_token: token, p_id: id }).then(async (r) => {
      if (!r) throw new Error("Nota não encontrada.");
      const bin = atob(r.base64.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: r.tipo });
      return { url: URL.createObjectURL(blob), tipo: r.tipo };
    }).catch((e) => { arquivos.delete(id); throw e; }));
  }
  return arquivos.get(id);
}
function carregarMiniaturas(raiz) {
  raiz.querySelectorAll("img[data-arquivo]").forEach((img) => pegarArquivo(img.dataset.arquivo).then((a) => { img.src = a.url; }).catch(() => {}));
}
async function verArquivo(id) {
  try {
    const a = await pegarArquivo(id);
    if (!/^image\//.test(a.tipo)) { const l = document.createElement("a"); l.href = a.url; l.target = "_blank"; l.rel = "noopener"; l.click(); return; }
    const v = document.createElement("div");
    v.className = "visor"; v.innerHTML = `<img src="${a.url}" alt="Nota fiscal"><button class="redondo fechar" aria-label="Fechar">${I.x}</button>`;
    document.body.append(v);
    requestAnimationFrame(() => requestAnimationFrame(() => v.classList.add("aberto")));
    v.addEventListener("click", () => { v.classList.remove("aberto"); setTimeout(() => v.remove(), 300); });
  } catch (e) { avisar(traduzir(e)); }
}

// ---------- acessos e robô ----------
const linkDe = (t) => `${location.origin}${location.pathname}#/entrar/${encodeURIComponent(t)}`;
async function copiar(texto, ok = "Copiado") {
  try { await navigator.clipboard.writeText(texto); avisar(ok); }
  catch { prompt("Copie:", texto); }
}
function mostrarLink(titulo, nome, t, explica = "") {
  const link = linkDe(t);
  const { f } = abrirFolha(`<h3>${esc(titulo)}</h3>${explica ? `<p class="pequeno" style="font-size:15px;margin-top:-6px">${explica}</p>` : ""}
    <div class="link-caixa">${esc(link)}</div>
    <div class="botoes-fim"><button class="botao claro" data-l="copiar">${I.copiar} Copiar</button>${navigator.share ? `<button class="botao" data-l="enviar">${I.enviar} Enviar</button>` : ""}</div>
    <p class="pequeno">Funciona <b>uma vez só</b>, em um aparelho, e vence em 7 dias. Depois de usado, não serve para mais ninguém — ${esc(nome)} entra sempre como ${esc(nome)}.</p>`);
  f.addEventListener("click", (e) => {
    const b = e.target.closest("[data-l]"); if (!b) return;
    if (b.dataset.l === "copiar") copiar(link, "Link copiado");
    else navigator.share({ title: "Terê House's", text: `Seu convite para o app da Terê House's (${D?.config.nome || "imóvel"}). Abra no seu celular:`, url: link }).catch(() => {});
  });
}

function folhaNovaPessoa() {
  let papel = "dono";
  const { f, fechar } = abrirFolha(`<h3>Convidar pessoa</h3>
    <label class="campo"><span>Nome</span><input id="p-nome" maxlength="60" placeholder="Nome completo"></label>
    <div class="campo"><span>O que a pessoa pode fazer</span><div class="chips" id="p-papel">
      <button class="chip" data-p="dono">Proprietário · só vê</button><button class="chip" data-p="admin">Administra junto · lança e edita</button></div></div>
    <button class="botao cheio" id="p-criar">Criar convite</button>`);
  const marcar = () => $("#p-papel", f).querySelectorAll(".chip").forEach((b) => b.classList.toggle("ligado", b.dataset.p === papel));
  $("#p-papel", f).addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { papel = b.dataset.p; marcar(); } });
  marcar();
  $("#p-criar", f).addEventListener("click", (e) => ocupado(e.currentTarget, async () => {
    const nome = $("#p-nome", f).value.trim();
    if (!nome) throw new Error("Digite o nome.");
    const t = await rpc("ab_pessoa_criar", { p_token: token, p_nome: nome, p_papel: papel });
    fechar(); listarPessoas();
    mostrarLink(`Convite de ${nome}`, nome, t, papel === "dono" ? "O proprietário vê o resumo, a agenda, as reservas e as notas — sem poder mudar nada." : "Esta pessoa pode lançar e editar reservas e custos.");
  }).catch(() => {}));
}

function folhaRoboInstalar() {
  abrirFolha(`<h3>Ligar o robô do Airbnb</h3>
    <p class="pequeno" style="font-size:15px;margin-top:-6px">Ele roda de graça no Google, na conta de e-mail que recebe os avisos do Airbnb. Faça uma vez, pelo computador:</p>
    <ol style="padding-left:20px;line-height:1.6">
      <li>Toque em <b>Gerar segredo</b> (em Ajustes) e guarde o segredo.</li>
      <li>No Airbnb: <b>Anúncios › seu imóvel › Disponibilidade › Sincronizar calendários › Exportar calendário</b>. Copie o link.</li>
      <li>Entre em <b>script.google.com</b> com a conta que recebe os e-mails do Airbnb › <b>Novo projeto</b>. Apague o que vier e cole o código do robô.</li>
      <li>Engrenagem (<b>Configurações do projeto</b>) › <b>Propriedades do script</b>: crie <b>SEGREDO</b> (o segredo do passo 1) e <b>CALENDARIO</b> (o link do passo 2).</li>
      <li>Volte ao editor, escolha a função <b>instalar</b> e clique em <b>Executar</b>. Autorize quando o Google pedir.</li>
    </ol>
    <p class="pequeno">Depois disso ele lê de hora em hora. O valor só é preenchido quando o e-mail diz com clareza quanto o anfitrião recebe; se não, aparece “valor a lançar”.</p>
    <button class="botao cheio" id="copiar-robo">${I.copiar} Copiar código do robô</button>`).f.querySelector("#copiar-robo").addEventListener("click", async (e) => {
    await ocupado(e.currentTarget, async () => { const r = await fetch("robo.gs.txt", { cache: "no-cache" }); if (!r.ok) throw new Error("Não deu para pegar o código."); await copiar(await r.text(), "Código copiado"); }).catch(() => {});
  });
}

// ---------- ações dos botões ----------
const ACOES = {
  mes: (b) => { mesSel = somarMes(mesSel, +b.dataset.passo); diaSel = null; desenhar(); },
  "ir-mes": (b) => { mesSel = b.dataset.mes; desenhar(); },
  dia: (b) => { const d = +b.dataset.dia; diaSel = diaSel === d ? null : d; desenhar(); },
  "abrir-reserva": (b) => folhaReserva(D.reservas.find((r) => r.id === b.dataset.id)),
  "nova-reserva": () => folhaReserva(null),
  "abrir-custo": (b) => folhaCusto(D.custos.find((c) => c.id === b.dataset.id)),
  "novo-custo": () => folhaCusto(null),
  "limpeza-rapida": (b) => {
    const r = D.reservas.find((x) => x.id === b.dataset.id);
    ocupado(b, async () => { await rpc("ab_reserva_salvar", { p_token: token, p_r: { ...r, limpeza: D.config.limpeza_padrao } }); avisar(`Limpeza de ${brl(D.config.limpeza_padrao)} lançada`); await recarregar(); }).catch(() => {});
  },
  "salvar-config": (b) => ocupado(b, async () => {
    const p = Math.round(Number($("#cfg-pct").value.replace(",", ".")) * 100), l = lerReais($("#cfg-limpeza").value);
    if (!Number.isFinite(p) || p < 0 || p > 10000) throw new Error("Taxa de administração inválida.");
    if (l == null || Number.isNaN(l)) throw new Error("Limpeza padrão inválida.");
    await rpc("ab_config_salvar", { p_token: token, p_c: { nome: $("#cfg-nome").value, pct_admin_bp: p, limpeza_padrao: l } });
    avisar("Ajustes salvos"); await recarregar();
  }).catch(() => {}),
  "nova-pessoa": () => folhaNovaPessoa(),
  "abrir-pessoa": (b) => { const p = pessoas.find((x) => x.id === b.dataset.id); if (p && p.id !== D.eu.id) folhaPessoa(p); },
  "conectar-aparelho": (b) => ocupado(b, async () => {
    const t = await rpc("ab_pessoa_novo_link", { p_token: token, p_id: D.eu.id });
    mostrarLink("Convite para outro aparelho", D.eu.nome, t, "Abra este convite no outro celular ou computador. Este aparelho continua conectado.");
  }).catch(() => {}),
  instalar: async () => {
    if (pedidoInstalar) { pedidoInstalar.prompt(); const r = await pedidoInstalar.userChoice.catch(() => null); pedidoInstalar = null; if (r?.outcome === "accepted") avisar("App instalado"); desenhar(); return; }
    abrirFolha(`<h3>Instalar no celular</h3><ol class="passos">${noIphone
      ? `<li>No Safari, toque em <b>Compartilhar</b> (o quadrado com a seta para cima).</li><li>Toque em <b>Adicionar à Tela de Início</b>.</li><li>Abra o <b>Terê House's</b> pela tela de início e use <b>Ajustes › Outro aparelho</b> para gerar um convite e colar lá.</li>`
      : `<li>No Chrome, toque nos <b>três pontinhos</b> lá em cima.</li><li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li>`}</ol>`);
  },
  "esconder-instalar": () => { try { localStorage.setItem("temporada-sem-instalar", "1"); } catch { /* sem espaço */ } desenhar(); },
  "robo-instalar": () => folhaRoboInstalar(),
  "robo-segredo": async () => {
    if (D.config.robo_ligado && !(await perguntar("Trocar o segredo do robô?", "O robô para até você colar o segredo novo no Google (propriedade SEGREDO).", "Trocar", false))) return;
    try {
      const s = await rpc("ab_robo_novo_segredo", { p_token: token });
      const { f } = abrirFolha(`<h3>Segredo do robô</h3><p class="pequeno" style="font-size:15px;margin-top:-6px">Cole no Google, em Propriedades do script, com o nome <b>SEGREDO</b>. Ele não aparece de novo.</p>
        <div class="link-caixa">${esc(s)}</div><button class="botao cheio" id="cs">${I.copiar} Copiar segredo</button>`);
      $("#cs", f).addEventListener("click", () => copiar(s, "Segredo copiado"));
      await recarregar();
    } catch (e) { avisar(traduzir(e)); }
  },
  sair: async () => {
    if (!(await perguntar("Sair deste aparelho?", "Para entrar de novo, você vai precisar de um convite novo.", "Sair"))) return;
    token = null; D = null; guardar(null); guardarDados(); abaAtual = null;
    mestre = null; gravarLocal(GUARDADO_MESTRE, null); gravarLocal(GUARDADO_CONTAS, null);
    mostrar();
  },
  "trocar-conta": () => folhaTrocarConta(),
  tentar: () => mostrar(),
  iniciar: (b) => ocupado(b, async () => {
    const nome = $("#meu-nome").value.trim();
    if (!nome) throw new Error("Digite seu nome.");
    token = await rpc("ab_iniciar", { p_nome: nome }); guardar(token);
    await mostrar();
    abrirFolha(`<h3>Pronto, ${esc(nome.split(/\s+/)[0])}!</h3><p class="pequeno" style="font-size:15px;margin-top:-6px">Agora vá em <b>Ajustes › Convidar pessoa</b> para mandar o convite de quem administra junto e o do proprietário. Cada convite serve para uma pessoa só.</p>`);
  }).catch(() => {}),
  "entrar-colado": () => {
    const m = /entrar\/([^\s#?&]+)/.exec($("#colar").value);
    if (!m) return avisar("Cole o convite inteiro que você recebeu.");
    resgatar(decodeURIComponent(m[1]), true);
  },
};

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-acao]");
  if (!b || b.closest(".folha") && !b.dataset.acao.startsWith("abrir-")) return;
  e.preventDefault();
  ACOES[b.dataset.acao]?.(b, e);
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[role=button][data-acao]")) { e.preventDefault(); e.target.click(); }
});
window.addEventListener("hashchange", mostrar);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && D) recarregar(); });
const observarAjustes = new MutationObserver(() => { if ($("#pessoas") && !$("#pessoas").dataset.ok) { $("#pessoas").dataset.ok = "1"; listarPessoas(); } });
observarAjustes.observe(app, { childList: true, subtree: false });

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
mostrar();
