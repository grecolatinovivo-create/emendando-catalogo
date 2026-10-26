// Meteore, Monastero di Rousanou (Ιερά Μονή Ρουσάνου): i codici del monastero (secoli XIII-XIX: libri liturgici, menei,
// paraclitiche, sinassari, omelie dei Padri; catalogo di Δ. Ζ. Σοφιανός, 2009), digitalizzati dalla Biblioteca comunale di
// Kalambaka (opac.kalambakalibrary.org, Iguana): manifesti IIIF Presentation 2 (/iguana/iiif/3_<n>/manifest) e immagini IIIF
// Image 2 con CORS aperto (Access-Control-Allow-Origin: *, verificato il 26 ottobre 2026). Licenza CC BY-SA 4.0.
// Il catalogo della biblioteca non ha un elenco aperto ai programmi; l'elenco viene da SearchCulture.gr (aggregatore nazionale
// greco dell'EKT, robots.txt senza divieti), collezione «Κώδικες της Ιεράς Μονής Ρουσάνου των Μετεώρων» (39 codici), sfogliata
// come fa il sito (/aggregator/portal/collections/<collezione>/search?page.page=N, 30 schede per pagina): l'identificativo della
// scheda (000149-3_<n>) dà quello del manifesto (3_<n>). Di ogni manifesto si legge una volta titolo, datazione, descrizione fisica
// e numero delle immagini. Nei manifesti gli indirizzi sono senza schema («//opac.kalambakalibrary.org/...»): il visore li apre in
// https come la pagina.
// Stato in data/rousanou.json: l'elenco si rilegge ogni 14 giorni, i manifesti una volta sola. Pausa di 1,5 secondi (rete.mjs).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/rousanou.json";
export const SC = "https://www.searchculture.gr/aggregator";
export const COLLEZIONE = "rousanou_mon_codices";
export const OPAC = "https://opac.kalambakalibrary.org/iguana";
export const manifestoRousanou = id => `${OPAC}/iiif/${id}/manifest`;
export const LICENZA = "CC BY-SA 4.0 (Βιβλιοθήκη Καλαμπάκας για την Ιερά Μονή Ρουσάνου)";
const GIORNI = 14;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const pulito = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
// manifesto -> voce compatta { s, t, d, e, n }
export function compattaRousanou(m) {
  const c = (((m && m.sequences) || [])[0] || {}).canvases || [];
  if (!c.length) return null;
  const md = Object.fromEntries((m.metadata || []).map(x => [pulito(x.label), pulito(x.value)]));
  // numero del codice nel nome dei file («Meteora_Moni_Roussanou_17_f.001.tif»: codice 17)
  const img = String((((c[0].images || [])[0] || {}).resource || {})["@id"] || "");
  const num = (/Roussanou_(\d+[A-Za-z]?)_/i.exec(img) || [])[1] || null;
  const v = { s: num, t: md["Τίτλος"] || pulito(m.label) || null, d: md["Χρονολογία"] || null, e: md["Φυσική περιγραφή"] || null, n: c.length };
  for (const k of Object.keys(v)) if (v[k] == null) delete v[k];
  return v;
}
// «XVI», «XIV (ἔτ. 1370)» -> «sec. XVI», «sec. XIV (ἔτ. 1370)»
export const datazioneRousanou = d => (!d ? null : /^[IVXL]+\b/.test(d) ? `sec. ${d}` : d);

export async function scansionaRousanou({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const ids = new Set();
    for (let p = 1; p <= 20; p++) {
      const r = await scarica(`${SC}/portal/collections/${COLLEZIONE}/search?page.page=${p}&resultsMode=GRID`, { timeout: 120000 });
      if (r.stato !== 200) throw new Error(`SearchCulture, pagina ${p}: HTTP ${r.stato}`);
      const prima = ids.size;
      for (const m of r.testo.matchAll(new RegExp(`/aggregator/edm/${COLLEZIONE}/\\d+-(3_\\d+)\\b`, "g"))) ids.add(m[1]);
      if (ids.size === prima || ids.size % 30) break;
    }
    if (!ids.size) throw new Error("SearchCulture: nessun codice nell'elenco");
    const voci = {};
    for (const id of ids) voci[id] = (st.voci || {})[id] || {};
    st.voci = voci; st.elenco = new Date().toISOString();
    salvaStato(st);
    log("rousanou", `elenco: ${ids.size} codici`);
  }
  for (const id of Object.keys(st.voci).filter(id => !st.voci[id].n)) {
    if (Date.now() > fine) { salvaStato(st); throw new Error("manifesti letti in parte: riprenderà alla prossima esecuzione"); }
    const r = await scarica(manifestoRousanou(id), { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) { st.voci[id] = { x: `HTTP ${r.stato}` }; continue; }
    let v = null; try { v = compattaRousanou(JSON.parse(r.testo)); } catch (e) {}
    st.voci[id] = v || { x: "manifesto senza immagini" };
  }
  st.aggiornato = new Date().toISOString();
  salvaStato(st);
  return st;
}

export function recordRousanou(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v && v.n).map(([id, v]) => ({
    fonte: "rousanou", id: "rousanou-" + id.replace("_", "-"), citta: "Meteore (Kalambaka)", biblioteca: "Monastero di Rousanou, Meteore (copie digitali della Biblioteca di Kalambaka)",
    segnatura: v.s ? `Cod. ${v.s}` : `Rousanou, ${id.replace("_", ".")}`, datazione: datazioneRousanou(v.d), titolo: v.t || null, descrizione: v.e || null, lingue: ["grc"], immagini: v.n,
    manifest: manifestoRousanou(id), pagina: `${SC}/edm/${COLLEZIONE}/000149-${id}`, licenza: LICENZA }));
}
