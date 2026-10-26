// Universiteit van Amsterdam, Allard Pierson (Bijzondere Collecties): manoscritti in «UvA Erfgoed» (uvaerfgoed.nl, Goobi viewer di intranda).
// Elenco dall'indice del visore: POST /viewer/api/v1/index/query/ (API pubblica, non vietata dal robots.txt, che esclude la ricerca
// del sito /viewer/search/, l'OAI e i PDF e chiede 10 secondi tra le richieste: rete.mjs). Una sola richiesta per tutto l'elenco.
// Manifesti IIIF Presentation 2 del visore (/viewer/api/v1/records/<PI>/manifest/) e immagini (images.uba.uva.nl) con CORS aperto
// (verificato il 26 ottobre 2026).
// Dei circa 10.270 oggetti di tipo «Manuscript» quasi tutti sono lettere (archivio dei Pekidim & Amarkalim nella Bibliotheca
// Rosenthaliana, carteggi): entrano solo i codici, cioè la Bibliotheca Philosophica Hermetica (segnature PH, BPH: testi alchemici,
// ermetici e cabalistici, libri d'ore), i manoscritti «OTM: hs.» (Moninckx Atlas, Max Havelaar, codici ebraici della Rosenthaliana) e
// simili. Fuori: lettere e copie di lettere, le tesi a stampa (segnature «UBM:», immagini «bnb»), i cataloghi di manoscritti.
// I libri a stampa con segnatura «hs.» (tipo «Monograph») non sono letti.
// Stato in data/uva.json (raccolta completa ogni 6 giorni).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { anniDa } from "./yale.mjs";

export const FILE_STATO = "data/uva.json";
export const SITO = "https://uvaerfgoed.nl/viewer";
const GIORNI = 6;
const CAMPI = ["PI", "MD_SHELFMARK", "MD_TITLE", "MD_AUTHOR", "MD_PUBLISHDATE", "MD_EXTENT", "NUMPAGES", "THUMBNAIL", "MD_NOTE", "MD_UVACOPYRIGHT", "MD_LANGUAGE", "DOCSTRCT"];

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const pulito = s => String(s || "").replace(/\s+/g, " ").replace(/\s*[:;/,]\s*$/, "").trim();
const primo = a => [].concat(a || []).map(pulito).find(Boolean) || null;
// documento dell'indice -> voce compatta { s, t, a, d, e (estensione), p (pagine), b (cartella delle immagini), n (note), l }
export function compattaUva(x) {
  const v = { s: primo(x.MD_SHELFMARK), t: primo(x.MD_TITLE), a: [...new Set([].concat(x.MD_AUTHOR || []).map(pulito).filter(Boolean))], d: primo(x.MD_PUBLISHDATE),
    e: primo(x.MD_EXTENT), p: x.NUMPAGES || null, b: (/\/iiif\/2\/([^!]+(?:![^!]+)?)!/.exec(x.THUMBNAIL || "") || [])[1] || null,
    n: [].concat(x.MD_NOTE || []).map(pulito).filter(Boolean).join(" ; ").slice(0, 1500) || null, l: [].concat(x.MD_LANGUAGE || []).map(pulito).filter(Boolean) };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

export async function scansionaUva({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("uva", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} schede`); return st; }
  // tutti gli oggetti «Manuscript» che non sono lettere (le lettere sono quasi 10.000: si tolgono già nella ricerca)
  const query = "ISWORK:true AND (DOCSTRCT:Manuscript OR DOCSTRCT:manuscript) AND -MD_TITLE:Brief* AND -MD_TITLE:Brieven*";
  const r = await scarica(`${SITO}/api/v1/index/query/`, { json: JSON.stringify({ query, count: 2000, offset: 0, resultFields: CAMPI }), timeout: Math.max(60000, minuti * 60e3), accept: "application/json" });
  if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
  const j = JSON.parse(r.testo), voci = {};
  for (const x of j.docs || []) if (x && x.PI) voci[x.PI] = compattaUva(x);
  st.voci = voci; st.totale = j.numFound || 0; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("uva", `${Object.keys(voci).length} schede (su ${st.totale})`);
  return st;
}

// motivo per cui una voce resta fuori (null = ammessa)
const LETTERE = /\bbrie(?:f|ven)\b|\bletters?\b|\blettres?\b|\bbriefe?\b|\bepistola/i;
export function motivoUva(v) {
  if (!v) return "senza dati";
  if (/^UBM:/i.test(v.s || "") || /^erfgoed!bnb/.test(v.b || "")) return "tesi e libri a stampa";
  if (/!brieven/.test(v.b || "") || /\bbr\.\s*$/.test(v.e || "") || LETTERE.test(v.t || "")) return "lettere";
  if (/\bcatalogue of [\w ]*manuscripts\b|\bcatalogus (?:van|der) handschriften\b/i.test(v.t || "")) return "catalogo di manoscritti";
  if (!v.p) return "senza immagini";
  return null;
}
export const ammessaUva = v => motivoUva(v) == null;

export function recordUva(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaUva(v)).map(([pi, v]) => {
    const anni = anniDa(v.d || "");
    return { fonte: "uva", id: "uva-" + pi.replace(/^11245_3_/, ""), citta: "Amsterdam", biblioteca: "Allard Pierson, Universiteit van Amsterdam",
      segnatura: (v.s || pi).replace(/^OTM:\s*/, ""), datazione: v.d || (anni.length ? String(Math.min(...anni)) : null), titolo: v.t || null, autori_fonte: v.a || [],
      // PH, BPH: Bibliotheca Philosophica Hermetica (collezione Ritman acquistata dallo Stato olandese, conservata all'Allard Pierson)
      descrizione: [/^B?PH\s?\d/.test(v.s || "") ? "Bibliotheca Philosophica Hermetica" : null, v.e, v.n].filter(Boolean).join(" ; ") || null, lingue: [], immagini: v.p || null,
      manifest: `${SITO}/api/v1/records/${pi}/manifest/`, pagina: `${SITO}/object/${pi}/1/`, licenza: "Allard Pierson, Universiteit van Amsterdam (pubblico dominio)" };
  });
}
