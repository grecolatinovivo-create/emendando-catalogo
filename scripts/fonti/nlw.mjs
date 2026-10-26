// National Library of Wales / Llyfrgell Genedlaethol Cymru, Aberystwyth. I manifesti IIIF sono aperti
// (iiif.llyfrgell.cymru/manifests/2.0/<pid>/manifest.json, CORS aperto), ma il sito e il catalogo della biblioteca (www.library.wales,
// archives.library.wales) sono dietro Cloudflare: NON si usano. L'elenco con gli identificativi dei manifesti (pid, lo stesso numero del
// permalink hdl.handle.net/10107/<pid>) viene da fonti pubbliche di altri enti:
//   - Wikidata (query.wikidata.org): manoscritti della collezione NLW (P195 = Q666063, istanza di manoscritto) con «IIIF manifest URL»
//     (P6108) o «Handle ID» (P1184), caricati dalla biblioteca stessa nel suo progetto Wikidata;
//   - Europeana (API pubblica di ricerca, chiave dimostrativa «api2demo»): insieme «104_RoL_NLWales_Manuscripts» (Rise of Literacy).
// Di ogni manifesto si legge una volta l'intero JSON (titolo, periodo, descrizione fisica, lingua, segnatura «Reference», descrizione).
// Entrano solo i manoscritti librari (codici, frammenti di codici); fuori carte d'archivio (charters, deeds, confirmationes, grants,
// registri), lettere, mappe, rotoli e fogli singoli, disegni e album.
// Stato in data/nlw.json: elenco ogni 14 giorni, ogni manifesto una volta sola (circa 130). Pausa di 1,5 secondi per server (rete.mjs).
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/nlw.json";
export const IIIF = "https://iiif.llyfrgell.cymru/manifests/2.0";
export const WIKIDATA = "https://query.wikidata.org/sparql";
export const EUROPEANA = "https://api.europeana.eu/record/v2/search.json";
export const INSIEMI_EUROPEANA = ["104_RoL_NLWales_Manuscripts"];
const GIORNI = 14;
export const NON_LIBRARI = /\b(charters?|deeds?|confirmatio|grant|indenture|lease|letters? (?:of|from|to)|correspondence|map|plan of|register of|drawings?|sketch|album|photograph|poster|ballad sheet|will of|inventory of|rental|survey of)\b/i;
// descrizione fisica di un foglio solo o di un rotolo (carte d'archivio, non codici)
export const NON_CODICE = /^\s*1 f\.|\b\d+ rolls?\b|kept in a roll|\b1 sheet\b/i;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale", "fonti_elenco"]);

const QUERY = `SELECT ?i ?m ?h WHERE { ?i wdt:P195 wd:Q666063 ; wdt:P31/wdt:P279* wd:Q87167 .
  OPTIONAL { ?i wdt:P6108 ?m } OPTIONAL { ?i wdt:P1184 ?h } FILTER(BOUND(?m) || BOUND(?h)) }`;

const pidDa = s => (/(?:10107\/|\/2\.0\/|\/iiif\/2\.0\/)(\d{5,9})\b/.exec(String(s || "")) || /^(\d{5,9})$/.exec(String(s || "").trim()) || [])[1] || null;

// elenco: { pid: { w: qid Wikidata, e: id Europeana } }
async function elenco() {
  const out = {}, conta = {};
  const r = await scarica(`${WIKIDATA}?format=json&query=${encodeURIComponent(QUERY)}`, { timeout: 120000, accept: "application/sparql-results+json" });
  if (r.stato !== 200) throw new Error(`Wikidata: HTTP ${r.stato}`);
  for (const b of JSON.parse(r.testo).results.bindings) {
    for (const k of ["m", "h"]) { const p = pidDa(b[k] && b[k].value); if (p) (out[p] = out[p] || {}).w = b.i.value.replace(/^.*\//, ""); }
  }
  conta.wikidata = Object.keys(out).length;
  for (const ds of INSIEMI_EUROPEANA) {
    let n = 0;
    for (let start = 1; start < 2000; start += 100) {
      const q = new URLSearchParams({ wskey: "api2demo", query: "*", qf: `edm_datasetName:${ds}`, rows: "100", start: String(start) });
      const e = await scarica(`${EUROPEANA}?${q}`, { timeout: 120000, accept: "application/json" });
      if (e.stato !== 200) throw new Error(`Europeana: HTTP ${e.stato}`);
      const j = JSON.parse(e.testo), it = j.items || [];
      for (const x of it) { const p = pidDa([].concat(x.edmIsShownAt || [])[0]) || pidDa(x.id); if (p) { (out[p] = out[p] || {}).e = x.id; n++; } }
      if (start + 100 > (j.totalResults || 0) || !it.length) break;
    }
    conta[ds] = n;
  }
  return { out, conta };
}

// manifesto -> scheda compatta { t, s, d, f, l, c, n, r }
export function schedaNlw(j) {
  const v = x => [].concat(x ?? []).map(y => (y && typeof y === "object" ? y["@value"] : y)).filter(y => y != null).map(y => String(y).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  const m = {};
  for (const x of j.metadata || []) { const k = typeof x.label === "string" ? x.label : (v([].concat(x.label).filter(y => !y["@language"] || /^en/.test(y["@language"])))[0] || v(x.label)[0]); if (k) m[k] = typeof x.value === "string" ? v(x.value) : v([].concat(x.value).filter(y => !(y && y["@language"]) || /^en/.test(y["@language"]))); }
  const u = k => (m[k] || [])[0] || null;
  const s = (u("Reference") || "").replace(/^Preferred citation:\s*/i, "").replace(/\s*\[RESTRICTED ACCESS\]\.?/i, "").replace(/\.\s*$/, "").trim() || null;
  return { t: u("Title") || v(j.label)[0] || null, s, d: u("Period") || null, f: u("Physical description"), l: (m.Language || []).map(x => x.replace(/\.$/, "")),
    c: (v(j.description).join(" ") || "").slice(0, 2000) || null, n: (((j.sequences || [])[0] || {}).canvases || []).length, r: typeof j.license === "string" ? j.license : null };
}

// motivo per cui resta fuori (null = entra)
export function motivoNlw(v) {
  if (!v || !v.n) return "senza immagini";
  if (NON_LIBRARI.test(v.t || "")) return "non librario";
  if (v.f && NON_CODICE.test(v.f)) return "non librario";
  return null;
}

export async function scansionaNlw({ minuti = 10, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const { out, conta } = await elenco();
    if (Object.keys(out).length < 50) throw new Error(`elenco troppo corto (${Object.keys(out).length} manifesti)`);
    for (const [p, x] of Object.entries(out)) st.voci[p] = st.voci[p] && !st.voci[p].q ? { ...st.voci[p], ...x } : { q: 1, ...x };
    for (const p of Object.keys(st.voci)) if (!(p in out)) delete st.voci[p];
    st.totale = Object.keys(out).length; st.fonti_elenco = conta; st.elenco = st.aggiornato = new Date().toISOString();
    if (Object.values(st.voci).some(v => v.q)) st.completato = null;
    salva(st);
    log("nlw", `elenco: ${st.totale} manifesti (${Object.entries(conta).map(([k, n]) => `${k} ${n}`).join(", ")})`);
  }
  const da = Object.keys(st.voci).filter(p => st.voci[p].q);
  let letti = 0, errori = 0;
  for (const p of da) {
    if (Date.now() > fine) break;
    const { w, e } = st.voci[p];
    let r; try { r = await scarica(`${IIIF}/${p}/manifest.json`, { timeout: 180000, accept: "application/json", tentativi: 3 }); }
    catch (er) { log("nlw", p, er.message); if (++errori >= 5) break; continue; }
    errori = 0; letti++;
    if (r.stato !== 200) { st.voci[p] = { w, e, x: `HTTP ${r.stato}` }; continue; }
    try { st.voci[p] = { ...(w ? { w } : {}), ...(e ? { e } : {}), ...schedaNlw(JSON.parse(r.testo)) }; } catch (er) { st.voci[p] = { w, e, x: "manifesto non leggibile" }; }
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salva(st); }
  }
  st.aggiornato = new Date().toISOString();
  const resto = Object.values(st.voci).filter(v => v.q).length;
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  log("nlw", `manifesti letti: ${letti}; codici: ${Object.values(st.voci).filter(v => !v.q && !v.x && !motivoNlw(v)).length} su ${Object.keys(st.voci).length}`);
  if (resto) throw new Error(`manifesti letti in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

export function recordNlw(st = leggiStato()) {
  const out = [];
  for (const [p, v] of Object.entries(st.voci || {})) {
    if (!v || v.q || v.x || motivoNlw(v)) continue;
    out.push({ fonte: "nlw", id: "nlw-" + p, citta: "Aberystwyth", biblioteca: "National Library of Wales", segnatura: (v.s || p).replace(/^Preferred citation:\s*/i, ""), datazione: v.d || null,
      titolo: v.t || null, autori_fonte: [], descrizione: [v.c, v.f].filter(Boolean).join(" ; ").slice(0, 4000) || null, lingue: lingueDa(v.l || []).filter(x => x !== "xx"),
      immagini: v.n, manifest: `${IIIF}/${p}/manifest.json`, pagina: `https://hdl.handle.net/10107/${p}`,
      licenza: /PublicDomain/i.test(v.r || "") ? "Pubblico dominio (Public Domain Mark), National Library of Wales" : "© National Library of Wales / Llyfrgell Genedlaethol Cymru" });
  }
  return out;
}
