// Universiteitsbibliotheek Leiden: collezioni «Manuscripts, Archives & Letters» (tutti i manoscritti: occidentali medievali con i Vossiani
// latini e greci e i BPL, orientali, moderni) e «Bibliotheca Neerlandica Manuscripta» (manoscritti medievali in nederlandese) di Digital Collections
// (Islandora, digitalcollections.universiteitleiden.nl).
// Niente OAI-PMH pubblico (quello di Alma risponde «Unauthorized»), e l'API dei manifesti richiede l'accesso:
// si leggono le pagine dei risultati della collezione (20 codici per pagina), che danno segnatura, titolo, autori e datazione.
// Il robots.txt chiede 10 secondi tra le richieste (rete.mjs) e non vieta /islandora/search.
// Manifesto IIIF: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:<n>/manifest (rimanda al catalogo, con CORS aperto).
// Lo stato (cursore e codici letti) è in data/leiden.json: la raccolta riprende da dove si era fermata
// e una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, decodifica, log } from "../rete.mjs";

export const FILE_STATO = "data/leiden.json";
export const BASE = "https://digitalcollections.universiteitleiden.nl";
export const COLLEZIONI = ["ubl_manuscripts", "bnm"];
const filtro = c => `f%5B0%5D=RELS_EXT_isMemberOfCollection_uri_ms%3A%22info%5C%3Afedora%5C/collection%5C%3A${c}%22`;
const GIORNI = 6, VERSIONE = 2;   // 2: più collezioni (cursore { c: indice della collezione, p: pagina })

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: st.versione || null, aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore ?? null, totale: st.totale || null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// pagina dei risultati -> { totale, voci: { "<item>": { s, t, a, d } } }
export function leggiPagina(html) {
  const tot = /\(\s*\d[\d,.]*\s*-\s*\d[\d,.]*\s+of\s+([\d,.]+)\s*\)/.exec(html);
  const voci = {};
  for (const blocco of html.split(/<tr class="islandora-solr-search-result/).slice(1)) {
    const id = (/href="\/view\/item\/(\d+)/.exec(blocco) || [])[1]; if (!id) continue;
    const campo = c => { const m = new RegExp(`<dd class="solr-value ${c}">([\\s\\S]*?)</dd>`).exec(blocco); return m ? decodifica(m[1]) : ""; };
    const s = campo("mods-relateditem-otherformat-identifier-ms");
    let t = campo("fgs-label-s");
    if (s && t.endsWith(", " + s)) t = t.slice(0, -(s.length + 2));
    voci[id] = { s: s || null, t: t || null, a: campo("mods-name-personal-namepart-ms") || null, d: campo("mods-relateditem-otherformat-origininfo-publisher-ms") || null };
  }
  return { totale: tot ? +tot[1].replace(/[,.]/g, "") : null, voci };
}

/* raccolta a riprese: cursore = { c: collezione, p: prossima pagina (da 0) }; stato salvato dopo ogni pagina.
   Un codice che sta in più collezioni si conta una volta sola (chiave: numero dell'oggetto). */
export async function scansionaLeiden({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  if (st.versione !== VERSIONE) { st.versione = VERSIONE; st.completato = null; st.cursore = null; st.totali = {}; }
  if (st.completato && st.cursore == null && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("leiden", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  if (st.cursore == null || typeof st.cursore !== "object") st.cursore = { c: 0, p: 0 }; else log("leiden", `riprendo da ${COLLEZIONI[st.cursore.c]}, pagina ${st.cursore.p + 1}`);
  st.totali = st.totali || {};
  const fine = ora + minuti * 60e3;
  while (st.cursore.c < COLLEZIONI.length) {
    const col = COLLEZIONI[st.cursore.c];
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${col}, pagina ${st.cursore.p + 1}): riprenderà alla prossima esecuzione`); }
    const r = await scarica(`${BASE}/islandora/search?page=${st.cursore.p}&type=dismax&islandora_solr_search_navigation=0&${filtro(col)}`, { timeout: 120000, accept: "text/html" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    if (/Access blocked/i.test(r.testo)) throw new Error("richiesta respinta dal sistema di protezione del sito");
    const p = leggiPagina(r.testo);
    if (p.totale) st.totali[col] = p.totale;
    Object.assign(st.voci, p.voci);
    st.cursore.p++; st.aggiornato = new Date().toISOString();
    if (st.cursore.p % 10 === 0) log("leiden", `${col}: ${st.cursore.p} pagine, ${Object.keys(st.voci).length} codici`);
    if (!Object.keys(p.voci).length || st.cursore.p * 20 >= (st.totali[col] || 0)) { log("leiden", `${col}: fine (${st.totali[col]})`); st.cursore = { c: st.cursore.c + 1, p: 0 }; }
    st.totale = Object.values(st.totali).reduce((a, b) => a + b, 0);
    salvaStato(st);
  }
  st.cursore = null; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("leiden", `fine: ${Object.keys(st.voci).length} codici`);
  return st;
}

// «VLQ 79» -> «Voss. Lat. Q. 79» (forma usata dagli editori); le altre segnature come le dà la biblioteca
export function segnaturaLeiden(s) {
  const m = /^VL([FQO])\s*(.+)$/.exec(String(s || "").trim());
  return m ? `Voss. Lat. ${m[1]}. ${m[2]}` : String(s || "").trim();
}

export function recordLeiden(st = leggiStato()) {
  return Object.entries(st.voci || {}).map(([id, v]) => ({
    fonte: "leiden", id: "lei-" + id, citta: "Leiden", biblioteca: "Universiteitsbibliotheek Leiden", segnatura: segnaturaLeiden(v.s || "item " + id),
    datazione: v.d, titolo: v.t, autori_fonte: v.a ? [v.a] : [],
    manifest: `https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:${id}/manifest`, pagina: `https://hdl.handle.net/1887.1/item:${id}`,
    licenza: "Leiden University Libraries: Public Domain Mark o CC BY (indicata nel manifesto)" }));
}
