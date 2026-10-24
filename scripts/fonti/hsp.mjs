// Handschriftenportal (handschriftenportal.de), il portale nazionale tedesco dei manoscritti: API di ricerca pubblica
// (/api/hspobjects/search, quella che usa il sito), filtrata per biblioteca e per codici digitalizzati.
// Serve per le biblioteche i cui server respingono le richieste dai server (Wolfenbüttel): metadati dal portale,
// manifesti IIIF indicati dal portale (o ricavati dall'indirizzo della copia digitale), immagini caricate dal browser di chi usa il catalogo.
// Il robots.txt del portale non pone limiti; 100 oggetti per richiesta, pausa di 1,5 secondi (rete.mjs).
// Lo stato (cursore e codici letti) è in data/<fonte>.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const API = "https://handschriftenportal.de/api/hspobjects/search";
const RIGHE = 100, GIORNI = 6;

export function leggiStato(fonte) {
  try { return JSON.parse(fs.readFileSync(`data/${fonte}.json`, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(fonte, st) {
  const f = `data/${fonte}.json`;
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore ?? null, totale: st.totale || null });
  fs.writeFileSync(f + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(f + ".tmp", f);
}

// «https://diglib.hab.de/mss/70-gud-lat/start.htm» -> «https://iiif.hab.de/object/mss_70-gud-lat/manifest.json»
// (la forma che il portale indica per i codici di Wolfenbüttel con manifesto dichiarato)
export function manifestoDa(d) {
  if (d["manifest-url-display"]) return d["manifest-url-display"];
  const m = /^https?:\/\/diglib\.hab\.de\/mss\/([^/]+)\/start\.htm/.exec(d["external-url-display"] || "");
  return m ? `https://iiif.hab.de/object/mss_${m[1]}/manifest.json` : null;
}

// oggetto della risposta -> voce compatta { s, t, d, l, c, m, p } (null se non c'è un manifesto)
export function compattaHsp(x) {
  const o = x.hspObject || {}, dig = (x.hspDigitizeds || []).filter(d => manifestoDa(d));
  // preferito: un manifesto dichiarato dal portale, poi la prima copia digitale di manoscritto
  const d = dig.find(d => d["manifest-url-display"]) || dig[0];
  if (!d) return null;
  const titoli = [...new Set([o["title-display"], ...(x.hspDescriptions || []).map(y => y["title-display"])].filter(Boolean))];
  return { s: o["idno-display"] || null, t: titoli.join(" ; ").slice(0, 1500) || null, d: (o["orig-date-lang-display"] || []).join(" ; ") || null,
    l: o["settlement-display"] || null, c: o["repository-display"] || null, m: manifestoDa(d), p: d["external-url-display"] || o["persistent-url-display"] || null };
}

/* raccolta a riprese: cursore = posizione del prossimo oggetto; stato salvato dopo ogni pagina */
export async function scansionaHsp({ fonte, biblioteca, minuti = 10, soloCache = false }) {
  const st = leggiStato(fonte);
  if (soloCache) return st;
  const ora = Date.now();
  if (st.completato && st.cursore == null && ora - Date.parse(st.completato) < GIORNI * 864e5) { log(fonte, `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  if (st.cursore == null) st.cursore = 0; else log(fonte, `riprendo dall'oggetto ${st.cursore}`);
  const fq = encodeURIComponent(JSON.stringify({ "repository-facet": [biblioteca], "digitized-object-facet": ["true"] }));
  const fine = ora + minuti * 60e3;
  for (;;) {
    if (Date.now() > fine) { salvaStato(fonte, st); throw new Error(`raccolta incompleta (oggetto ${st.cursore}): riprenderà alla prossima esecuzione`); }
    const r = await scarica(`${API}?q=*&start=${st.cursore}&rows=${RIGHE}&sort=score-desc&fq=${fq}&hl=false&isExtended=false`, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const d = JSON.parse(r.testo), pl = d.payload || [];
    st.totale = d.metadata && d.metadata.numFound;
    for (const x of pl) { const v = compattaHsp(x); if (v) st.voci[x.hspObject.id] = v; }
    st.cursore += RIGHE; st.aggiornato = new Date().toISOString();
    salvaStato(fonte, st);
    if (!pl.length || st.cursore >= (st.totale || 0)) break;
  }
  st.cursore = null; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(fonte, st);
  log(fonte, `fine: ${Object.keys(st.voci).length} codici digitalizzati su ${st.totale}`);
  return st;
}

export function recordHsp(fonte, st = leggiStato(fonte)) {
  return Object.entries(st.voci || {}).map(([id, v]) => ({
    fonte, id: fonte.slice(0, 3) + "-" + id.replace(/^HSP-/, ""), citta: v.l, biblioteca: v.c, segnatura: v.s || id, datazione: v.d, titolo: v.t, autori_fonte: [],
    manifest: v.m, pagina: v.p, licenza: v.c ? `${v.c}: condizioni d'uso nel manifesto` : null }));
}
