// Biblioteca Nazionale «Santi Cirillo e Metodio» (Национална библиотека «Св. св. Кирил и Методий», НБКМ), Sofia: biblioteca
// digitale «Славянски и други ръкописи» (digilib.nationallibrary.bg/slr/public/): circa 300 codici interi, slavi (dal X secolo,
// con la collezione «Il XIV secolo bulgaro»), greci, armeni, georgiani, ebraici, latini e manoscritti musicali.
// Come si legge: il sito non ha robots.txt (404) né IIIF. L'elenco viene dalla ricerca del sito, una richiesta POST per collezione
// con il termine vuoto (cinque richieste: tutte le schede di una collezione in una pagina; serve il cookie di sessione della
// pagina di ricerca). Le immagini sono JPEG in sequenza (/SLR_DOCS/SR<id a 6 cifre>/SR000000.JPG, SR000001.JPG, ...; circa
// 560x790 pixel), le stesse che mostra il visore della biblioteca (digilib.nationallibrary.bg:8082/show-sr?id=<id>, raggiungibile
// solo dal browser): si caricano come semplici <img>. Il numero delle pagine di un codice si trova con richieste di un byte
// (esponenziale e poi dicotomica sul numero dell'immagine, una ventina di richieste per codice, solo per i codici nuovi); la
// prima lettura (26 ottobre 2026) l'ha fatta il browser dal visore. Si leggono anche le misure della prima immagine.
// I manifesti IIIF (Presentation 2, immagini a misura fissa, senza servizio Image) li scrive il catalogo (scripts/manifesti.mjs,
// ramo «manifesti»), come per la Biblioteca Nazionale di Grecia.
// Condizioni: la biblioteca dichiara le copie digitali «in pieno accesso libero» (nationallibrary.bg, pagina della biblioteca digitale).
// Stato in data/nbkm.json: l'elenco si rilegge ogni 14 giorni, le pagine si contano una volta sola. Pausa di 1,5 secondi.
import fs from "node:fs";
import { UA, log, scaricaByte } from "../rete.mjs";

export const FILE_STATO = "data/nbkm.json";
export const SITO = "https://digilib.nationallibrary.bg";
export const RICERCA = `${SITO}/slr/public/`;
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/nbkm";
export const LICENZA = "Национална библиотека «Св. св. Кирил и Методий»: copie digitali in libero accesso (nationallibrary.bg, Дигитална библиотека)";
export const COLLEZIONI = { 1: "Славянски ръкописи", 2: "Българският XIV век", 3: "Гръцки ръкописи", 4: "Други чуждоезикови ръкописи", 5: "Нотирани музикални ръкописи" };
const GIORNI = 14;
const cartella = id => "SR" + String(id).padStart(6, "0");
export const immagineNbkm = (id, i) => `${SITO}/SLR_DOCS/${cartella(id)}/SR${String(i).padStart(6, "0")}.JPG`;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// richieste della ricerca: POST con il cookie della sessione; in serie, 1,5 secondi
let ultima = 0, cookie = "";
async function chiedi(url, corpo) {
  for (let k = 0; k < 4; k++) {
    const attesa = 1500 - (Date.now() - ultima); if (attesa > 0) await new Promise(r => setTimeout(r, attesa));
    ultima = Date.now();
    try {
      const h = { "user-agent": UA, accept: "text/html" };
      if (cookie) h.cookie = cookie;
      if (corpo) h["content-type"] = "application/x-www-form-urlencoded";
      const r = await fetch(url, { method: corpo ? "POST" : "GET", body: corpo || undefined, headers: h, redirect: "follow", signal: AbortSignal.timeout(180000) });
      const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
      if (sc.length) cookie = sc.map(c => c.split(";")[0]).join("; ");
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) { if (k === 3) throw e; await new Promise(r => setTimeout(r, 5000 * 2 ** k)); }
  }
}

const pulito = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;?/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const scriptTesto = s => { try { return JSON.parse(`"${s}"`); } catch (e) { return s; } };   // cellText con le sequenze \uXXXX

// pagina dei risultati -> { id: voce }
export function schedeNbkm(html, kolec) {
  const out = {};
  for (const blocco of html.split(/<b id=\s*(?=\d)/).slice(1)) {
    const id = (/^(\d+)/.exec(blocco) || [])[1];
    const link = (/show-sr\?id=(\d+)/.exec(blocco) || [])[1];
    if (!id || link !== id) continue;
    const campo = nome => { const m = new RegExp(`<b>\\s*${nome}:</b>&nbsp;?([^<]*)`).exec(blocco); return m ? pulito(m[1]) : null; };
    const celle = [...blocco.matchAll(/var cellText\s*=\s*"((?:[^"\\]|\\.)*)"/g)].map(m => scriptTesto(m[1]));
    // la prima cella (se c'è) dà i nomi con il ruolo («Автор:Иван;...»), l'ultima le parole chiave separate da «;»
    const autori = celle.length > 1 ? celle[0].split(/[:;]/).filter((x, i) => i % 2 === 1).map(pulito).filter(Boolean) : [];
    const chiavi = celle.length ? celle[celle.length - 1].split(";").map(pulito).filter(Boolean) : [];
    const v = { s: campo("Сигнатура"), t: campo("Заглавие"), d: campo("Датировка"), m: campo("Материал"), a: autori, k: chiavi.join("; ") || null, c: kolec };
    for (const x of Object.keys(v)) if (v[x] == null || v[x] === "" || (Array.isArray(v[x]) && !v[x].length)) delete v[x];
    out[id] = v;
  }
  return out;
}

// misure di un JPEG dai primi byte (marcatore SOF)
export function misureJpeg(b) {
  let i = 2;
  while (i + 9 < b.length && b[i] === 0xff) {
    const m = b[i + 1], l = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + l;
  }
  return null;
}
const esiste = async (id, i) => (await scaricaByte(immagineNbkm(id, i), { byte: 1, timeout: 60000 })).stato < 300;
// numero delle immagini: SR000000 ... SR(n-1), in sequenza
async function contaPagine(id) {
  if (!(await esiste(id, 0))) return 0;
  let lo = 0, hi = 1;
  while (await esiste(id, hi)) { lo = hi; hi *= 2; if (hi > 8192) return null; }
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (await esiste(id, m)) lo = m; else hi = m; }
  return lo + 1;
}

export async function scansionaNbkm({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    await chiedi(RICERCA);
    const voci = {};
    // le cinque collezioni e, per ultima, «tutte» (0), per i codici che non sono in nessuna collezione
    for (const k of [...Object.keys(COLLEZIONI), "0"]) {
      const corpo = new URLSearchParams({ kolec: k, select: "0", operator: "0", all: "", submit: "Търси" }).toString();
      const html = await chiedi(RICERCA, corpo);
      const s = schedeNbkm(html, +k);
      for (const [id, v] of Object.entries(s)) if (!voci[id]) voci[id] = { ...v, ...((st.voci || {})[id] && (st.voci || {})[id].n != null ? { n: st.voci[id].n, o: st.voci[id].o, w: st.voci[id].w, h: st.voci[id].h } : {}) };
    }
    if (Object.keys(voci).length < 100) throw new Error(`elenco troppo corto (${Object.keys(voci).length} codici)`);
    st.voci = voci; st.elenco = new Date().toISOString(); st.completato = null;
    salvaStato(st);
    log("nbkm", `elenco: ${Object.keys(voci).length} codici`);
  }
  for (const [id, v] of Object.entries(st.voci)) {
    if (v.n != null && (v.w || !v.n)) continue;
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error("pagine contate in parte: riprenderà alla prossima esecuzione"); }
    if (v.n == null) { const n = await contaPagine(id); v.n = n == null ? 0 : n; }
    if (v.n && !v.w) {
      const r = await scaricaByte(immagineNbkm(id, numeriNbkm(v)[0]), { byte: 65536 });
      const mis = r.stato < 300 ? misureJpeg(r.dati) : null;
      if (mis) [v.w, v.h] = mis; else v.n = 0;
    }
  }
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("nbkm", `${Object.values(st.voci).filter(v => v.n).length} codici con immagini su ${Object.keys(st.voci).length}`);
  return st;
}

// lingue: dalla collezione e, per gli «altri» manoscritti, dal fondo nella segnatura (НБКМ Arm. 1, Georg. 1, Hebr. 2, Lat. 7)
export function lingueNbkm(v) {
  if (v.c === 1 || v.c === 2) return ["cu"];
  if (v.c === 3) return ["grc"];
  const s = String(v.s || "");
  if (/\bArm\b/i.test(s)) return ["hy"];
  if (/\bGeorg\b/i.test(s)) return ["ka"];
  if (/\bHebr\b/i.test(s)) return ["he"];
  if (/\bLat\b/i.test(s)) return ["la"];
  if (/\bGr(aec)?\b/i.test(s)) return ["grc"];
  return [];
}
// fuori le carte sciolte (грамоти: diplomi e privilegi)
export const ammessaNbkm = v => !!(v && v.n && v.w && !/[Гг]рамот/.test(v.t || ""));
// numeri delle immagini: 0 ... n-1, oppure l'ordine del visore della biblioteca («o»: «1-738,0,740-754») per i pochi codici in cui
// la sequenza dei file ha salti o immagini fuori posto (letto dal browser il 26 ottobre 2026)
export function numeriNbkm(v) {
  if (!v.o) return Array.from({ length: v.n }, (_, i) => i);
  const out = [];
  for (const p of v.o.split(",")) { const [x, y] = p.split("-").map(Number); for (let i = x; i <= (y ?? x); i++) out.push(i); }
  return out;
}
export function recordNbkm(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaNbkm(v)).map(([id, v]) => ({
    fonte: "nbkm", id: "nbkm-" + id, citta: "Sofia", biblioteca: "Biblioteca Nazionale «Santi Cirillo e Metodio» (НБКМ)",
    segnatura: v.s || `SR ${id}`, datazione: v.d || null, titolo: v.t || null, autori_fonte: v.a || [],
    descrizione: [COLLEZIONI[v.c], v.m, v.k].filter(Boolean).join(" ; ") || null, lingue: lingueNbkm(v), immagini: v.n,
    manifest: `${BASE_MANIFESTI}/${id}.json`, pagina: `http://digilib.nationallibrary.bg:8082/show-sr?id=${id}`, licenza: LICENZA }));
}

// manifesto IIIF Presentation 2 scritto dal catalogo: JPEG della biblioteca a misura fissa (misure della prima immagine)
export function manifestoScritto(id, v) {
  const mid = `${BASE_MANIFESTI}/${id}.json`;
  const canvases = numeriNbkm(v).map((k, i) => {
    // id del canvas corto (cartella delle immagini con il numero d'ordine): i manifesti restano leggeri
    const cid = `${SITO}/SLR_DOCS/${cartella(id)}#${i + 1}`;
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: v.w, height: v.h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid, resource: { "@id": immagineNbkm(id, k), "@type": "dctypes:Image", format: "image/jpeg" } }] };
  });
  const meta = [["Segnatura", v.s], ["Titolo", v.t], ["Datazione", v.d], ["Materiale", v.m], ["Collezione", COLLEZIONI[v.c]], ["Parole chiave", v.k]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s, v.t].filter(Boolean).join(": ") || `SR ${id}`, metadata: meta,
    attribution: "Национална библиотека «Св. св. Кирил и Методий», София. Manifesto scritto dal catalogo di Emendando con le immagini della biblioteca digitale.",
    related: `http://digilib.nationallibrary.bg:8082/show-sr?id=${id}`,
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
