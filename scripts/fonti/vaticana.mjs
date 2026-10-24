// Biblioteca Apostolica Vaticana (digi.vatlib.it). Il robots.txt vieta ricerca e schede (/search, /*/search, /*/index-search,
// /*/detail/*) e chiede 10 secondi tra le richieste: si rispetta la pausa (scripts/rete.mjs) e non si fanno richieste in parallelo.
// Niente più segnature provate a vuoto: l'elenco dei codici digitalizzati viene dalla pagina dei manoscritti (digi.vatlib.it/mss/,
// fondi con il numero di codici) e, per ogni fondo, da digi.vatlib.it/mss/ajax/category/<fondo> (JSON con tutte le segnature,
// comprese le parti «pt.»): sono le richieste che fa la pagina stessa del fondo, e nessuna è vietata dal robots.txt.
// L'elenco si aggiorna ogni 7 giorni (un fondo si rilegge anche quando cambia il suo numero di codici); poi si leggono solo i
// manifesti IIIF dei codici non ancora letti, e di ciascuno solo l'inizio (Range: Author, Title, Date precedono le immagini).
// Ordine: fondi latini, poi greci, poi tutti gli altri. Stato (elenco, metadati letti) in data/vaticana.json.
// Entrano tutti i manoscritti con un manifesto, anche senza autore o titolo nei metadati.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/vaticana.json";
export const HOME = "https://digi.vatlib.it/mss/";
export const elencoFondo = f => `https://digi.vatlib.it/mss/ajax/category/${encodeURIComponent(f)}`;
// ordine di lettura: prima i fondi latini (e i Chigiani, ricchi di classici), poi i greci; gli altri dopo, nell'ordine della pagina
export const PRIORITA = ["Pal.lat", "Reg.lat", "Urb.lat", "Ott.lat", "Vat.lat", "Barb.lat", "Ross", "Borg.lat", "Pap.Vat.lat", "Chig",
  "Vat.gr", "Pal.gr", "Urb.gr", "Barb.gr", "Ott.gr", "Reg.gr", "Reg.gr.Pio.II", "Borg.gr", "Pap.Vat.gr"];
const GIORNI_ELENCO = 7, GIORNI_MANCANTI = 30;
export const ordineFondi = fondi => [...PRIORITA.filter(f => fondi.includes(f)), ...fondi.filter(f => !PRIORITA.includes(f))];

// fondi e numero di codici dalla pagina dei manoscritti
export function fondiDaHome(html) {
  const out = {}, re = /<strong>(\d+)<\/strong>\s*ITEMS?<\/span>\s*<h2>\s*<a[^>]*data-item-url="\/mss\/ajax\/category\/([^"]+)"/g;
  let m; while ((m = re.exec(html))) out[decodeURIComponent(m[2].replace(/&#39;/g, "'").replace(/&amp;/g, "&"))] = +m[1];
  return out;
}
// segnature dal JSON di un fondo ({"fond":[{"shelfmark":"Vat.lat.1",...}]})
export function segnatureDaFondo(testo) {
  const j = JSON.parse(testo);
  return [...new Set((j.fond || []).map(x => x && x.shelfmark).filter(Boolean))];
}
// lingua del fondo (quando il manifesto non la indica)
export function lingueFondo(seg) {
  const f = String(seg).toLowerCase();
  if (/\.lat\b/.test(f)) return ["la"];
  if (/\.gr\b/.test(f)) return ["grc"];
  const m = { ebr: "he", ar: "ar", sir: "syr", copt: "cop", et: "gez", arm: "hy", pers: "fa", turc: "tr", slav: "cu" };
  for (const [k, v] of Object.entries(m)) if (new RegExp(`\\.${k}\\b`).test(f)) return [v];
  if (/^neofiti/.test(f)) return ["he"];
  return [];
}
// 2: tutti i manifesti (prima solo quelli con autore o titolo); 3: elenco dei digitalizzati al posto delle segnature provate
const VERSIONE = 3;
// Vat.lat.3870 -> Vat. lat. 3870; Vat.lat.414.pt.1 -> Vat. lat. 414 pt. 1
export const segnaturaLeggibile = s => s.replace(/\.(?=\S)/g, ". ").replace(/(\d)\. pt\. /g, "$1 pt. ").replace(/\s+/g, " ").trim();
export const manifestoDi = s => `https://digi.vatlib.it/iiif/MSS_${encodeURI(s)}/manifest.json`;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { versione: VERSIONE, voci: {} }; }
}
export function salvaStato(st) {
  const ord = Object.fromEntries(Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
  fs.writeFileSync(FILE_STATO + ".tmp", JSON.stringify({ ...st, voci: ord }, null, 0).replace(/\},"/g, '},\n"') + "\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// metadati dall'inizio del manifesto (fino a "sequences"); se il JSON parziale non si chiude, espressioni regolari
export function metadatiDaInizio(testo) {
  const i = testo.indexOf('"sequences"');
  let m = null;
  if (i > 0) { try { m = JSON.parse(testo.slice(0, i).replace(/,\s*$/, "") + "}"); } catch (e) { m = null; } }
  if (!m) { try { m = JSON.parse(testo); } catch (e) { m = null; } }
  const out = { a: [], t: [], d: null, l: null, g: [] };
  if (m && Array.isArray(m.metadata)) {
    for (const x of m.metadata) {
      const v = [].concat(x.value || []).map(y => typeof y === "string" ? y : y && y["@value"] || "").filter(Boolean);
      if (/^author/i.test(x.label)) out.a.push(...v); else if (/^title/i.test(x.label)) out.t.push(...v); else if (/^date/i.test(x.label)) out.d = v[0] || null;
      else if (/^language/i.test(x.label)) out.g.push(...v);
    }
    out.l = typeof m.label === "string" ? m.label : null;
  }
  return out;
}

async function leggi(seg) {
  const r = await scarica(manifestoDi(seg), { range: 16384, basta: t => t.includes('"sequences"'), tentativi: 3 });
  if (r.stato === 404 || r.stato === 410) return null;
  if (r.stato !== 200 && r.stato !== 206) throw new Error(`HTTP ${r.stato}`);
  return metadatiDaInizio(r.testo);
}

// codici dell'elenco ancora da leggere, nell'ordine di lettura (fondi senza elenco: si conta il numero della pagina dei manoscritti)
export function daLeggere(st, ora = Date.now()) {
  const E = (st.elenco && st.elenco.fondi) || {}, voci = st.voci || {}, manc = st.mancanti || {};
  const out = [];
  let stimati = 0;
  for (const f of ordineFondi(Object.keys(E))) {
    const x = E[f];
    if (!x.s) { stimati += Math.max(0, (x.n || 0) - Object.keys(voci).filter(k => k.startsWith(f + ".")).length); continue; }
    for (const suf of x.s) { const seg = `${f}.${suf}`; if (!voci[seg] && !(manc[seg] && ora - manc[seg] < GIORNI_MANCANTI * 864e5)) out.push(seg); }
  }
  return { segnature: out, totale: out.length + stimati };
}

/* scansione a tempo: aggiorna l'elenco dei digitalizzati quando serve, poi legge i manifesti non ancora letti
   e salva lo stato su disco ogni 20 codici. minuti: tempo massimo; extra: segnature da leggere per prime */
export async function scansiona({ minuti = 20, extra = [] } = {}) {
  const st = leggiStato(), fine = Date.now() + minuti * 60e3;
  if (st.versione !== VERSIONE) {   // dalle versioni precedenti si tengono solo i metadati letti
    for (const k of ["giro", "passo", "prossimo", "visti", "visti_giro"]) delete st[k];
    st.versione = VERSIONE;
  }
  st.elenco = st.elenco || { home: 0, fondi: {} }; st.mancanti = st.mancanti || {}; st.voci = st.voci || {};
  let letti = 0, trovati = 0;
  const uno = async seg => {
    let m; try { m = await leggi(seg); } catch (e) { log("vaticana", seg, e.message); return false; }
    letti++;
    if (m) { st.voci[seg] = m.g.length && !m.g.every(x => /^und$/i.test(x)) ? { a: m.a, t: m.t, d: m.d, g: m.g } : { a: m.a, t: m.t, d: m.d }; delete st.mancanti[seg]; trovati++; }
    else { delete st.voci[seg]; st.mancanti[seg] = Date.now(); }
    if (letti % 20 === 0) { salvaStato(st); log("vaticana", `${letti} manifesti letti, ultimo ${seg}`); }
    return true;
  };
  const fresco = t => t && Date.now() - t < GIORNI_ELENCO * 864e5;
  let ok = true;
  for (const s of extra) { if (Date.now() > fine) break; if (!st.voci[s]) await uno(s); }
  // 1. fondi e numeri dalla pagina dei manoscritti
  if (!fresco(st.elenco.home) && Date.now() < fine) {
    try {
      const r = await scarica(HOME, { timeout: 240000, tentativi: 2 });
      const F = r.stato === 200 ? fondiDaHome(r.testo) : {};
      if (Object.keys(F).length < 10) throw new Error(`pagina dei manoscritti: HTTP ${r.stato}, ${Object.keys(F).length} fondi`);
      for (const [f, n] of Object.entries(F)) { const x = st.elenco.fondi[f] = st.elenco.fondi[f] || {}; if (x.n !== n) x.t = 0; x.n = n; }
      for (const f of Object.keys(st.elenco.fondi)) if (!(f in F)) delete st.elenco.fondi[f];
      st.elenco.home = Date.now(); st.elenco.totale = Object.values(F).reduce((a, b) => a + b, 0);
      log("vaticana", `elenco dei fondi: ${Object.keys(F).length} fondi, ${st.elenco.totale} codici digitalizzati`);
    } catch (e) { log("vaticana", e.message); }
  }
  // 2. fondo per fondo: elenco delle segnature (se manca o è vecchio), poi i manifesti non ancora letti
  for (const f of ordineFondi(Object.keys(st.elenco.fondi))) {
    if (!ok || Date.now() > fine) break;
    const x = st.elenco.fondi[f];
    if (!x.s || !fresco(x.t)) {
      try {
        const r = await scarica(elencoFondo(f), { timeout: 400000, tentativi: 2, accept: "application/json" });
        if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
        const L = segnatureDaFondo(r.testo), pre = f + ".";
        x.s = L.filter(s => s.startsWith(pre)).map(s => s.slice(pre.length)); x.t = Date.now();
        log("vaticana", `elenco ${f}: ${x.s.length} codici`);
        salvaStato(st);
      } catch (e) { log("vaticana", `elenco ${f}:`, e.message); if (!x.s) continue; }
    }
    for (const suf of x.s) {
      if (Date.now() > fine) break;
      const seg = `${f}.${suf}`;
      if (st.voci[seg] || (st.mancanti[seg] && Date.now() - st.mancanti[seg] < GIORNI_MANCANTI * 864e5)) continue;
      if (!(await uno(seg))) { ok = false; break; }   // server in difficoltà: si riprende la prossima volta
    }
  }
  st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("vaticana", `fine: ${letti} manifesti letti, ${trovati} codici; restano ${daLeggere(st).totale} codici da leggere`);
  return st;
}

// record compatti per il catalogo, dalle voci dello stato
export function recordVaticana(st = leggiStato()) {
  return Object.entries(st.voci).map(([seg, v]) => ({
    fonte: "vaticana", id: "bav-" + seg.toLowerCase().replace(/[^a-z0-9]+/g, "-"), citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana",
    segnatura: segnaturaLeggibile(seg), datazione: v.d || null, titolo: (v.t || []).join(" ; ") || null, autori_fonte: v.a || [],
    lingue: v.g ? lingueDa(v.g) : [],   // senza lingua nel manifesto, la deduce la costruzione dal fondo (lingueFondo, deduciLingue)
    manifest: manifestoDi(seg), pagina: `https://digi.vatlib.it/view/MSS_${seg}`, licenza: "© Biblioteca Apostolica Vaticana" }));
}
