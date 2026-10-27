// ELTE Egyetemi Könyvtár (Biblioteca universitaria dell'Università Eötvös Loránd), Budapest: codici, frammenti e manoscritti in
// «EDIT» (edit.elte.hu, DSpace 9). Prova del 27 ottobre 2026: il robots.txt vieta l'interfaccia di ricerca (/search), non l'API REST
// (/server/api); niente crawl-delay. Elenco con l'API di ricerca, collezione per collezione (100 schede per pagina): «Kódexek» (codici
// medievali e moderni, con le Corvine), «Kódextöredékek» (frammenti) e «Újkori (szakrendbe sorolt) kéziratok» (manoscritti moderni).
// Manifesti IIIF Presentation 2 del DSpace (/server/iiif/<uuid>/manifest) e immagini (/iiif/2/...), CORS aperto.
// Entrano le schede con IIIF attivo (dspace.iiif.enabled); fuori lettere e carteggi («levél», «levelei»).
// I codici che Manuscriptorium dà già per la stessa biblioteca (stessa segnatura) restano a quella fonte (scripts/raccogli.mjs).
// Stato in data/elte.json, raccolta completa ogni 14 giorni (poche richieste: 5 pagine).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/elte.json";
export const SITO = "https://edit.elte.hu";
const GIORNI = 14, PER_PAGINA = 100;
export const COLLEZIONI = {
  "dc05925f-b8b0-4205-b8fa-d7df6303c190": "Kódexek",
  "83c9e629-fe36-4353-a315-a4fa38b2d9bf": "Kódextöredékek",
  "d0a5a422-b590-4096-834d-7117de8db0fe": "Újkori kéziratok",
};

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const val = (m, k) => (m[k] || []).map(x => String(x.value || "").replace(/\s+/g, " ").trim()).filter(Boolean);
// scheda DSpace -> voce compatta {c, s, t, a, d, l, f (formato), n (nota), i (IIIF attivo), h (handle), y (tipo)}
export function compattaElte(c, o) {
  const m = o.metadata || {};
  const v = { c, s: val(m, "dc.identifier.other")[0] || null, t: val(m, "dc.title")[0] || o.name || null, a: val(m, "dc.contributor.author"),
    d: val(m, "dc.description.issuedate")[0] || null, l: [...val(m, "dc.language"), ...val(m, "dc.language.iso")], f: val(m, "dc.format.page")[0] || null,
    n: (val(m, "dc.description.note")[0] || "").slice(0, 600) || null, i: val(m, "dspace.iiif.enabled")[0] === "true", h: o.handle || null, y: val(m, "dc.type.type")[0] || null };
  for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

export async function scansionaElte({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("elte", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} schede`); return st; }
  const fine = Date.now() + minuti * 60e3, voci = {};
  for (const [uuid, nome] of Object.entries(COLLEZIONI)) {
    for (let p = 0; ; p++) {
      if (Date.now() > fine) throw new Error("tempo esaurito: la raccolta riprenderà da capo alla prossima esecuzione");
      const r = await scarica(`${SITO}/server/api/discover/search/objects?scope=${uuid}&dsoType=ITEM&size=${PER_PAGINA}&page=${p}`, { timeout: 120000, accept: "application/json" });
      if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
      const sr = JSON.parse(r.testo)._embedded.searchResult, objs = (sr._embedded || {}).objects || [];
      for (const x of objs) { const o = x._embedded && x._embedded.indexableObject; if (o && o.uuid) voci[o.uuid] = compattaElte(nome, o); }
      if (p + 1 >= (sr.page.totalPages || 0) || !objs.length) break;
    }
  }
  st.voci = voci; st.totale = Object.keys(voci).length; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("elte", `${st.totale} schede`);
  return st;
}

// lingue in ungherese («latin», «német», «magyar») -> codici
const LINGUE_HU = { latin: "la", "német": "de", magyar: "hu", olasz: "it", "görög": "grc", "héber": "he", francia: "fr", cseh: "cs", lengyel: "pl", "török": "tr",
  arab: "ar", perzsa: "fa", angol: "en", spanyol: "es", "szláv": "cu", "egyházi szláv": "cu", "orosz": "ru", "örmény": "hy" };
export function lingueElte(l) {
  const out = [];
  for (const x of l || []) for (const p of String(x).toLowerCase().split(/[,;/]| és /)) {
    const s = p.trim(); if (!s) continue;
    const c = LINGUE_HU[s] || LINGUE_HU[s.replace(/ nyelvű$/, "")] || lingueDa(s)[0];
    if (c && c !== "xx" && !out.includes(c)) out.push(c);
  }
  return out;
}

export function motivoElte(v) {
  if (!v) return "senza dati";
  if (!v.i) return "senza IIIF";
  if (/\blevel(?:e|ei|ek)?\b|\blevél\b|\blevelezés/i.test(v.t || "")) return "lettere";
  if (/oklevél/i.test(v.t || "")) return "documenti d'archivio (oklevél)";
  return null;
}
export const ammessaElte = v => motivoElte(v) == null;
export const segnaturaNorm = s => String(s || "").toLowerCase().replace(/[.\s]+/g, " ").trim();

const segnaturaBase = v => String(v.s || v.t || "").replace(/\s*\[.*$/, "").replace(/\.\s*$/, "");
export function recordElte(st = leggiStato()) {
  // le miscellanee digitalizzate per parti («Cod. Lat. 134 [In laudem … oratio]») tengono la segnatura con la parte
  const quante = {};
  for (const v of Object.values(st.voci || {})) if (ammessaElte(v)) quante[segnaturaBase(v)] = (quante[segnaturaBase(v)] || 0) + 1;
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaElte(v)).map(([uuid, v]) => ({
    fonte: "elte", id: "elte-" + uuid, citta: "Budapest", biblioteca: "ELTE Egyetemi Könyvtár (Biblioteca universitaria Eötvös Loránd)",
    segnatura: (quante[segnaturaBase(v)] > 1 ? String(v.s || v.t).replace(/\.\s*$/, "") : segnaturaBase(v)) || uuid,
    // «[s.a.]» e le date di inserimento («2015-09-09») non sono datazioni
    datazione: v.d && !/^\[?s\.\s*a\.?\]?$/i.test(v.d) && !/^\d{4}-\d\d-\d\d$/.test(v.d) ? v.d.replace(/^\[|\]$/g, "") : null,
    titolo: (v.t || "").replace(/^Cod\.[^[]*\[(.*)\]\s*$/, "$1") || null, autori_fonte: v.a || [], lingue: lingueElte(v.l),
    descrizione: [v.c === "Kódextöredékek" ? "Frammento" : null, v.f, v.n].filter(Boolean).join(" ; ") || null,
    manifest: `${SITO}/server/iiif/${uuid}/manifest`, pagina: v.h ? `${SITO}/handle/${v.h}` : `${SITO}/items/${uuid}`,
    licenza: "ELTE Egyetemi Könyvtár" }));
}
