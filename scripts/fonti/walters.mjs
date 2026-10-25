// Walters Art Museum, Baltimora: The Digital Walters (www.thedigitalwalters.org). Il museo pubblica le foto dei suoi
// manoscritti (immagini CC0, come dichiara OPenn per le raccolte 0020 e 0054; descrizioni GNU FDL) con le descrizioni TEI,
// ma senza IIIF: i manifesti IIIF Presentation 3 li scriviamo noi (data/manifesti/walters/<cartella>.json), con le immagini
// JPEG pubblicate dal museo: «SAP» (1800 px sul lato lungo) per leggere, «thumb» (190 px) come miniatura.
// Elenco: la pagina 01_ACCESS_WALTERS_MANUSCRIPTS.html (tutti i codici con le immagini, con o senza descrizione TEI).
// Per ogni codice: la descrizione TEI (ManuscriptDescriptions/<cartella>_tei.xml: segnatura, titoli, autori, datazione,
// lingue e la sequenza delle immagini con le etichette dei fogli); per i codici senza TEI («Cataloging in process») la pagina
// delle immagini (html/<cartella>/) e la riga dell'elenco.
// Larghezza e altezza: dalla TEI quando le indica; altrimenti dall'intestazione del JPEG (richiesta Range dei primi 4 KB,
// mai l'immagine intera). Il server del museo è lento (10-20 secondi per richiesta, spesso 522/525 da Cloudflare), quindi:
// alla prima lettura di un codice si misura una sola immagine (quella di mezzo del tipo di pagina più numeroso, di solito i
// recto, che verifica anche la cartella) e le altre prendono quelle misure (stima, segnata nello stato: p[i][4] = 0);
// col tempo che resta si misura un'immagine per ogni altro tipo di pagina (verso, piatti, dorso, tagli…) in tutti i codici,
// poi le immagini stimate una per una; a ogni misura nuova il manifesto si riscrive con le misure vere.
// Le immagini si chiedono a www.thedigitalwalters.org, che risponde con CORS aperto (Access-Control-Allow-Origin: *);
// OPenn (openn.library.upenn.edu/Data/0020/) ha gli stessi file ma senza CORS.
// robots.txt (uguale su entrambi): vieta solo i TIFF; si leggono solo HTML, TEI e i primi byte dei JPEG.
// Stato in data/walters.json; l'elenco si rilegge ogni 6 giorni.
import fs from "node:fs";
import path from "node:path";
import { scarica, scaricaByte, decodifica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/walters.json";
export const BASE = "https://www.thedigitalwalters.org";
export const ELENCO = BASE + "/01_ACCESS_WALTERS_MANUSCRIPTS.html";
export const DIR_MANIFESTI = "data/manifesti/walters";
export const RAW = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/main/" + DIR_MANIFESTI + "/";
export const CC0 = "http://creativecommons.org/publicdomain/zero/1.0/";
// il server del museo è lento e spesso risponde 522/525 (Cloudflare non raggiunge l'origine): più tentativi del solito
const GIORNI = 6, LATO = 1800, LATO_MINI = 190, TENTATIVI = 6;

export function leggiStato(file = FILE_STATO) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { elenco: {}, voci: {} }; }
}
export function salvaStato(st, file = FILE_STATO) {
  const ord = o => Object.entries(o || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco_letto: st.elenco_letto || null, totale: st.totale || 0 });
  const el = ord(st.elenco).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const vo = ord(st.voci).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", testa.slice(0, -1) + ',"elenco":{\n' + el.join(",\n") + '\n},"voci":{\n' + vo.join(",\n") + "\n}}\n");
  fs.renameSync(file + ".tmp", file);
}

/* ---------------------------------------------------------------- elenco dei codici
   <li> <span class="shelf_mark">W.105</span>, Butler Hours, Latin (1340 - 1355 CE, Probably Shropshire, England) <br />
        <a href="./Data/WaltersManuscripts/html/W105/">Browse images</a> | Cataloging in process | <a href="http://art.thewalters.org/detail/25556">…
   -> { W105: { s: "W.105", r: "Butler Hours, Latin (1340 - 1355 CE, Probably Shropshire, England)", tei: 0, art: "http://art.thewalters.org/detail/25556" } } */
export function elencoDaPagina(html) {
  const out = {};
  for (const li of String(html).split(/<li[\s>]/i).slice(1)) {
    const s = /<span class="shelf_mark">([^<]*)<\/span>/.exec(li); if (!s) continue;
    const c = /href="[^"]*\/html\/([^"/]+)\/"/.exec(li); if (!c) continue;
    const riga = decodifica((/<\/span>\s*,?\s*([\s\S]*?)<br/i.exec(li) || [])[1] || "");
    const art = (/href="(https?:\/\/art\.thewalters\.org\/[^"]+)"/.exec(li) || [])[1] || null;
    out[c[1]] = { s: decodifica(s[1]), r: riga, tei: /_tei\.xml"/.test(li) ? 1 : 0, ...(art ? { art } : {}) };
  }
  return out;
}

// riga dell'elenco -> { titolo, datazione, luogo, lingue } (per i codici senza TEI)
export function datiDaRiga(riga) {
  const r = String(riga || "").trim();
  const m = /\(([^()]*?\d[^()]*?\b(?:CE|BCE|AH)\b[^()]*)\)\s*$/.exec(r);
  let testa = m ? r.slice(0, m.index).trim() : r, datazione = null, luogo = null;
  if (m) { const p = m[1].split(/,\s*/); const i = p.findIndex(x => /\b(?:CE|BCE)\b/.test(x)); datazione = p.slice(0, i + 1).join(", "); luogo = p.slice(i + 1).join(", ") || null; }
  // lingue: i segmenti finali riconosciuti come lingua («Latin», «French, Old (842-ca.1400)»)
  const parti = testa.replace(/\s*\([^()]*\)/g, "").split(/,\s*/);
  const lingue = []; let k = parti.length;
  while (k > 1) {
    const l = lingueDa([parti[k - 1]]).filter(x => x !== "xx");
    const l2 = k > 2 ? lingueDa([parti[k - 2] + ", " + parti[k - 1]]).filter(x => x !== "xx") : [];
    if (/^(Old|Middle|Modern|Ancient|Ottoman|Classical)$/i.test(parti[k - 1]) && l2.length) { lingue.unshift(...l2); k -= 2; continue; }
    if (!l.length) break;
    lingue.unshift(...l); k--;
  }
  const titolo = parti.slice(0, Math.max(1, k)).join(", ");
  return { titolo, datazione, luogo, lingue: [...new Set(lingue)] };
}

/* ---------------------------------------------------------------- descrizione TEI */
const attr = (tag, nome) => { const m = new RegExp(`\\s${nome}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
const tutti = (xml, re) => [...String(xml).matchAll(re)];
// <graphic url="sap/W622_000001_sap.jpg" width="1426px" height="1800px"/> -> { stem, w, h }
function sapDi(surface) {
  for (const [g] of tutti(surface, /<graphic\b[^>]*>/g)) {
    const u = attr(g, "url") || ""; const m = /(?:^|\/)sap\/([^/]+)_sap\.jpg$/i.exec(u); if (!m) continue;
    const w = parseInt(attr(g, "width") || "", 10), h = parseInt(attr(g, "height") || "", 10);
    return { stem: m[1], w: w > 0 ? w : 0, h: h > 0 ? h : 0 };
  }
  return null;
}

/* TEI -> { s, t, a, d, l, o, w, p: [[etichetta, stem, w, h, misurata]] } (w e h 0 se la TEI non li indica) */
export function datiDaTei(xml) {
  const x = String(xml);
  const idno = decodifica((/<msIdentifier[\s\S]*?<idno\b[^>]*>([\s\S]*?)<\/idno>/.exec(x) || [])[1] || "");
  const comune = decodifica((/<title\b[^>]*type="common"[^>]*>([\s\S]*?)<\/title>/.exec(x) || [])[1] || "");
  const titolo = comune.replace(/^Walters\s+(?:Ms\.|Art Museum)\s*[^,]*,\s*/i, "") || comune;
  const opere = [...new Set(tutti(x, /<title\b[^>]*type="work"[^>]*>([\s\S]*?)<\/title>/g).map(m => decodifica(m[1])).filter(Boolean))];
  const autori = [];
  for (const [, a] of tutti(x, /<author\b[^>]*>([\s\S]*?)<\/author>/g)) {
    const nomi = tutti(a, /<name\b([^>]*)>([\s\S]*?)<\/name>/g).map(m => ({ tipo: attr(m[1], "type"), testo: decodifica(m[2]) }));
    const n = (nomi.find(z => z.tipo === "authority") || nomi.find(z => z.tipo === "known-as") || nomi.find(z => z.tipo !== "vernacular" && z.tipo !== "note") || {}).testo || decodifica(a);
    if (n && !autori.includes(n)) autori.push(n);
  }
  const tl = /<textLang\b[^>]*>/.exec(x);
  const codici = tl ? [attr(tl[0], "mainLang"), ...(attr(tl[0], "otherLangs") || "").split(/\s+/)].filter(Boolean) : [];
  const datazione = decodifica((/<origDate\b[^>]*>([\s\S]*?)<\/origDate>/.exec(x) || [])[1] || "") || null;
  const luogo = decodifica((/<origPlace\b[^>]*>([\s\S]*?)<\/origPlace>/.exec(x) || [])[1] || "") || null;
  const pagine = [];
  for (const [s] of tutti(x, /<surface\b[^>]*>[\s\S]*?<\/surface>/g)) {
    const sap = sapDi(s); if (!sap) continue;
    const et = decodifica(attr(/<surface\b[^>]*>/.exec(s)[0], "n") || "");
    pagine.push([et, sap.stem, sap.w, sap.h, sap.w && sap.h ? 1 : 0]);
  }
  return { s: idno || null, t: titolo || null, a: autori.slice(0, 12), d: datazione, l: lingueDa(codici).filter(z => z !== "xx"), o: luogo, w: opere.slice(0, 40), p: pagine };
}

/* pagina delle immagini (html/<cartella>/): <a href="./../../../../Data/WaltersManuscripts/W622/data/W.622/sap/W622_000001_sap.jpg" title="Large JPEG image of W.622, Upper board outside">
   -> { dir: "Data/WaltersManuscripts/W622/data/W.622", p: [[etichetta, stem, 0, 0, 0]] } */
export function datiDaPaginaImmagini(html, segnatura = "") {
  const visti = new Set(), p = []; let dir = null;
  for (const m of String(html).matchAll(/href="(?:\.\/|(?:\.\.\/)+)*(Data\/[^"]*?)\/sap\/([^"/]+)_sap\.jpg"[^>]*?title="([^"]*)"/g)) {
    if (visti.has(m[2])) continue; visti.add(m[2]); dir = dir || m[1];
    let et = decodifica(m[3]).replace(/^Large JPEG image of\s*/i, "");
    if (segnatura && et.startsWith(segnatura + ", ")) et = et.slice(segnatura.length + 2);
    p.push([et, m[2], 0, 0, 0]);
  }
  return { dir, p };
}

/* ---------------------------------------------------------------- misure dei JPEG */
// dimensioni dall'intestazione di un JPEG (marcatore SOF); null se non si trovano nei byte letti
export function misuraJpeg(buf) {
  const b = Buffer.from(buf);
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const L = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    if (m === 0xda) return null;
    i += 2 + L;
  }
  return null;
}
export const urlSap = (v, stem) => `${BASE}/${v.dir}/sap/${stem}_sap.jpg`;
export const urlMini = (v, stem) => `${BASE}/${v.dir}/thumb/${stem}_thumb.jpg`;
async function misura(url) {
  for (const byte of [4096, 65536]) {
    const r = await scaricaByte(url, { byte, timeout: 120000, tentativi: TENTATIVI });
    if (r.stato === 404 || r.stato === 403) return { stato: r.stato };
    if (r.stato !== 200 && r.stato !== 206) throw new Error(`HTTP ${r.stato} ${url}`);
    const d = misuraJpeg(r.dati); if (d) return d;
  }
  return null;
}
// tipo di pagina, per le stime: «fol. 12r» -> «fol. #r», «Front flyleaf ii, v» -> «front flyleaf #, v»
export const tipoPagina = et => String(et || "").toLowerCase().replace(/\d+/g, "#").replace(/\b[ivxl]+(?=[ab]?\s*,|[ab]$)/g, "#").replace(/\s+/g, " ").trim();
// stima: le immagini non misurate prendono le misure di una misurata dello stesso tipo (o, in mancanza, della più vicina)
export function stima(p) {
  const per = new Map();
  p.forEach((x, i) => { if (x[4] === 1) { const k = tipoPagina(x[0]); if (!per.has(k)) per.set(k, i); } });
  const misurate = p.map((x, i) => (x[4] === 1 ? i : -1)).filter(i => i >= 0);
  for (let i = 0; i < p.length; i++) {
    if (p[i][4] !== 0) continue;   // 1: misurata; 2: immagine mancante; 3: intestazione illeggibile
    let j = per.get(tipoPagina(p[i][0]));
    if (j == null && misurate.length) j = misurate.reduce((a, b) => (Math.abs(b - i) < Math.abs(a - i) ? b : a));
    if (j != null) { p[i][2] = p[j][2]; p[i][3] = p[j][3]; p[i][4] = 0; }
  }
  return p;
}
// immagine da misurare per prima: quella di mezzo del gruppo più numeroso (di solito i recto), che verifica anche la cartella
export function campionePrincipale(p) {
  const g = new Map();
  p.forEach((x, i) => { const k = tipoPagina(x[0]); if (!g.has(k)) g.set(k, []); g.get(k).push(i); });
  const idx = [...g.values()].sort((a, b) => b.length - a.length)[0] || [0];
  return idx[Math.floor(idx.length / 2)];
}
// un'immagine da misurare per tipo di pagina (quella di mezzo del gruppo)
export function campioni(p) {
  const g = new Map();
  p.forEach((x, i) => { const k = tipoPagina(x[0]); if (!g.has(k)) g.set(k, []); g.get(k).push(i); });
  const out = [];
  for (const idx of g.values()) { if (idx.some(i => p[i][4] === 1)) continue; out.push(idx[Math.floor(idx.length / 2)]); }
  return out;
}

/* ---------------------------------------------------------------- raccolta */
const dirDaTei = (cartella, s) => `Data/WaltersManuscripts/${cartella}/data/${String(s || cartella).replace(/\s+/g, "")}`;

async function leggiCodice(cartella, e, fine) {
  let v;
  if (e.tei) {
    const r = await scarica(`${BASE}/Data/WaltersManuscripts/ManuscriptDescriptions/${cartella}_tei.xml`, { timeout: 180000, tentativi: TENTATIVI });
    if (r.stato !== 200) throw new Error(`TEI ${cartella}: HTTP ${r.stato}`);
    v = datiDaTei(r.testo); v.s = v.s || e.s; v.dir = dirDaTei(cartella, v.s);
  }
  if (!v || !v.p.length) {
    const r = await scarica(`${BASE}/Data/WaltersManuscripts/html/${cartella}/`, { timeout: 180000, tentativi: TENTATIVI });
    if (r.stato !== 200) throw new Error(`immagini ${cartella}: HTTP ${r.stato}`);
    const pi = datiDaPaginaImmagini(r.testo, e.s);
    const d = datiDaRiga(e.r);
    v = v ? { ...v, dir: pi.dir || v.dir, p: pi.p } : { s: e.s, t: d.titolo, a: [], d: d.datazione, l: d.lingue, o: d.luogo, w: [], dir: pi.dir, p: pi.p };
  }
  if (!v.p.length || !v.dir) { v.p = []; return v; }
  // la prima misura verifica anche la cartella delle immagini (se manca, si prende dalla pagina delle immagini)
  const prima = campionePrincipale(v.p);
  let d = await misura(urlSap(v, v.p[prima][1]));
  if (d && d.stato) {
    const r = await scarica(`${BASE}/Data/WaltersManuscripts/html/${cartella}/`, { timeout: 180000, tentativi: TENTATIVI });
    const pi = r.stato === 200 ? datiDaPaginaImmagini(r.testo, v.s) : { dir: null };
    if (!pi.dir || pi.dir === v.dir) throw new Error(`immagini di ${cartella} non trovate (HTTP ${d.stato})`);
    v.dir = pi.dir; d = await misura(urlSap(v, v.p[prima][1]));
    if (!d || d.stato) throw new Error(`immagini di ${cartella} non trovate`);
  }
  if (d) { v.p[prima][2] = d.w; v.p[prima][3] = d.h; v.p[prima][4] = 1; }
  stima(v.p);
  // senza nessuna misura: 1800 px sul lato lungo, in verticale (la forma delle SAP)
  for (const x of v.p) if (!x[2] || !x[3]) { x[2] = Math.round(LATO * 2 / 3); x[3] = LATO; x[4] = 0; }
  return v;
}

export async function scansionaWalters({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  st.elenco = st.elenco || {}; st.voci = st.voci || {};
  if (soloCache) return st;
  const ora = Date.now(), fine = ora + minuti * 60e3;
  if (!st.elenco_letto || ora - Date.parse(st.elenco_letto) > GIORNI * 864e5 || !Object.keys(st.elenco).length) {
    const r = await scarica(ELENCO, { timeout: 180000, tentativi: TENTATIVI });
    if (r.stato !== 200) throw new Error(`elenco: HTTP ${r.stato}`);
    const el = elencoDaPagina(r.testo);
    if (Object.keys(el).length < 100) throw new Error(`elenco: solo ${Object.keys(el).length} codici, pagina cambiata?`);
    // codici tolti dall'elenco: fuori anche dallo stato; codici con la TEI arrivata dopo: si rileggono
    for (const k of Object.keys(st.voci)) if (!el[k] || (el[k].tei && !(st.elenco[k] || {}).tei)) delete st.voci[k];
    st.elenco = el; st.totale = Object.keys(el).length; st.elenco_letto = st.aggiornato = new Date().toISOString();
    salvaStato(st);
    log("walters", `elenco: ${st.totale} codici (${Object.values(el).filter(x => x.tei).length} con descrizione TEI)`);
  }
  const da = Object.keys(st.elenco).filter(k => !st.voci[k]).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  let errori = 0, n = 0;
  for (const k of da) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${Object.keys(st.voci).length} codici su ${st.totale}): riprenderà alla prossima esecuzione`); }
    try { st.voci[k] = await leggiCodice(k, st.elenco[k], fine); errori = 0; }
    catch (e) { log("walters", "ERRORE", k, e.message); if (++errori >= 5) { salvaStato(st); throw new Error("5 errori di fila: " + e.message); } continue; }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
    if (++n % 20 === 0) log("walters", `${Object.keys(st.voci).length} codici letti su ${st.totale}`);
  }
  // tempo che resta: prima un'immagine per ogni tipo di pagina non ancora misurato (verso, dorso, taglio…) in tutti i codici,
  // poi le misure vere delle immagini stimate, una per una
  const chiavi = Object.keys(st.voci).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  let misurate = 0;
  const una = async (v, x) => {
    const m = await misura(urlSap(v, x[1]));
    if (m && !m.stato) { x[2] = m.w; x[3] = m.h; x[4] = 1; misurate++; } else x[4] = m ? 2 : 3;   // 2: immagine mancante (fuori dal manifesto); 3: intestazione illeggibile (resta la stima)
    if (misurate && misurate % 50 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); }
  };
  try {
    fuori: for (const fase of ["tipi", "tutte"]) for (const k of chiavi) {
      const v = st.voci[k]; if (!v.p || !v.p.length) continue;
      const da = fase === "tipi" ? campioni(v.p).filter(i => v.p[i][4] === 0) : v.p.map((x, i) => i).filter(i => v.p[i][4] === 0);
      for (const i of da) { if (Date.now() > fine) break fuori; await una(v, v.p[i]); }
      if (da.length) stima(v.p);
    }
  } catch (e) { log("walters", "misura non riuscita:", e.message); }
  if (misurate) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("walters", `${misurate} immagini misurate`); }
  return st;
}

/* ---------------------------------------------------------------- manifesti IIIF Presentation 3 */
const lm = (s, lingua = "none") => ({ [lingua]: [String(s)] });
const coppia = (et, val) => (val && (!Array.isArray(val) || val.length) ? { label: lm(et, "it"), value: { none: Array.isArray(val) ? val.map(String) : [String(val)] } } : null);
export const nomeFile = cartella => String(cartella).replace(/[^A-Za-z0-9._-]+/g, "_");
export const urlManifesto = cartella => RAW + nomeFile(cartella) + ".json";
export const paginaCodice = cartella => `${BASE}/Data/WaltersManuscripts/html/${cartella}/`;
const RTL = new Set(["ar", "fa", "he", "tr", "syr", "ur"]);
const mini = (w, h) => { const k = LATO_MINI / Math.max(w, h, 1); return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))]; };
// prima pagina utile per la miniatura: il primo foglio numerato
export const primaUtile = p => Math.max(0, p.findIndex(x => /^fol\.\s*\d/i.test(x[0])));

export function manifestoWalters(cartella, v, e = {}) {
  const id = urlManifesto(cartella);
  const p = (v.p || []).filter(x => x[4] !== 2);
  const items = p.map((x, i) => {
    const c = `${id}/canvas/${i + 1}`, [tw, th] = mini(x[2], x[3]);
    return { id: c, type: "Canvas", label: lm(x[0] || String(i + 1)), width: x[2], height: x[3],
      thumbnail: [{ id: urlMini(v, x[1]), type: "Image", format: "image/jpeg", width: tw, height: th }],
      items: [{ id: `${c}/page`, type: "AnnotationPage", items: [{ id: `${c}/page/image`, type: "Annotation", motivation: "painting", target: c,
        body: { id: urlSap(v, x[1]), type: "Image", format: "image/jpeg", width: x[2], height: x[3] } }] }] };
  });
  const titolo = v.t ? `${v.s}: ${v.t}` : v.s;
  const m = { "@context": "http://iiif.io/api/presentation/3/context.json", id, type: "Manifest",
    label: lm(`Walters Art Museum, ${titolo}`),
    metadata: [coppia("Biblioteca", "The Walters Art Museum, Baltimore"), coppia("Segnatura", v.s), coppia("Titolo", v.t), coppia("Autori", v.a), coppia("Opere", v.w),
      coppia("Datazione", v.d), coppia("Luogo d'origine", v.o), coppia("Lingue", v.l)].filter(Boolean),
    requiredStatement: { label: lm("Attribuzione", "it"), value: lm("The Walters Art Museum, Baltimore. Immagini: CC0 1.0 (dominio pubblico); descrizione: GNU FDL.", "it") },
    rights: CC0,
    provider: [{ id: "https://thewalters.org/", type: "Agent", label: lm("The Walters Art Museum"), homepage: [{ id: "https://thewalters.org/", type: "Text", label: lm("The Walters Art Museum"), format: "text/html" }] }],
    homepage: [{ id: paginaCodice(cartella), type: "Text", label: lm(`The Digital Walters, ${v.s}`), format: "text/html" }],
    ...(e.tei ? { seeAlso: [{ id: `${BASE}/Data/WaltersManuscripts/ManuscriptDescriptions/${cartella}_tei.xml`, type: "Dataset", format: "application/tei+xml", label: lm("TEI") }] } : {}),
    ...(items.length ? { thumbnail: items[primaUtile(p)].thumbnail } : {}),
    ...((v.l || []).length && RTL.has(v.l[0]) ? { viewingDirection: "right-to-left" } : {}),
    items: "§ITEMS§" };
  // un foglio per riga: diff leggibili nei commit
  return JSON.stringify(m).replace('"§ITEMS§"', "[\n" + items.map(x => JSON.stringify(x)).join(",\n") + "\n]") + "\n";
}

// scrive (solo se cambiano) i manifesti di tutti i codici letti; cancella quelli dei codici usciti dall'elenco
export function scriviManifestiWalters(st, dir = DIR_MANIFESTI) {
  const scritti = new Set(); let cambiati = 0;
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!v || !(v.p || []).length) continue;
    const f = path.join(dir, nomeFile(k) + ".json"), testo = manifestoWalters(k, v, (st.elenco || {})[k] || {});
    scritti.add(path.basename(f));
    let prima = null; try { prima = fs.readFileSync(f, "utf8"); } catch (e) {}
    if (prima !== testo) { fs.writeFileSync(f + ".tmp", testo); fs.renameSync(f + ".tmp", f); cambiati++; }
  }
  // stato vuoto o illeggibile: non si cancella niente
  if (scritti.size) for (const n of fs.readdirSync(dir)) if (n.endsWith(".json") && !scritti.has(n)) { fs.unlinkSync(path.join(dir, n)); cambiati++; }
  return { manifesti: scritti.size, cambiati };
}

export function recordWalters(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v && (v.p || []).length).map(([k, v]) => {
    const e = (st.elenco || {})[k] || {}, p = v.p.filter(x => x[4] !== 2);
    return { fonte: "walters", id: "walters-" + k.toLowerCase().replace(/[^a-z0-9]+/g, "-"), citta: "Baltimore", biblioteca: "The Walters Art Museum",
      segnatura: v.s || e.s || k, datazione: v.d || null, titolo: v.t || null, autori_fonte: v.a || [], descrizione: (v.w || []).join(" ; ").slice(0, 1500) || null,
      lingue: v.l || [], manifest: urlManifesto(k), pagina: paginaCodice(k), licenza: "CC0 1.0 (immagini); descrizione GNU FDL", immagini: p.length,
      anteprima: p.length ? urlMini(v, p[primaUtile(p)][1]) : null };
  });
}
