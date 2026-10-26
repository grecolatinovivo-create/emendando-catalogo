// Biblioteca Nazionale Centrale di Firenze: i manoscritti che la Biblioteca stessa pubblica su Internet Archive (collezione «BNCF»,
// soggetto «BNCF - Manuscripts», circa 1.400 oggetti il 26 ottobre 2026). Il sito della Biblioteca (bncf.cultura.gov.it) risponde
// 403 ai server; la sua teca (teca.bncf.firenze.sbn.it, OAI-PMH «ManoscrittiInRete») dà immagini di soli 768 pixel e senza IIIF.
// Internet Archive invece ha manifesti IIIF Presentation 3 (iiif.archive.org/iiif/3/<id>/manifest.json) e immagini a piena
// risoluzione, con CORS aperto (verificato il 26 ottobre 2026), e una ricerca aperta (advancedsearch.php): una richiesta sola.
// Entrano i codici; fuori le lettere e i carteggi sciolti (inserti dei fondi Rinuccini, Nuove Accessioni, Galileiani, Carteggi),
// le carte nautiche e geografiche (Portolani), i disegni e gli inventari moderni della Sala Manoscritti.
// Licenza: riproduzioni in pubblico dominio, solo per fini non commerciali (art. 108 del Codice dei Beni Culturali).
// Stato in data/bncf.json; la ricerca si rifà ogni 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/bncf.json";
const GIORNI = 6;
const CAMPI = ["identifier", "title", "description", "date", "language", "creator", "imagecount"];
export const RICERCA = "https://archive.org/advancedsearch.php?" + new URLSearchParams([["q", 'collection:BNCF AND subject:"BNCF - Manuscripts"'], ...CAMPI.map(c => ["fl[]", c]),
  ["rows", "10000"], ["output", "json"]]).toString();
export const manifestoBncf = id => `https://iiif.archive.org/iiif/3/${encodeURIComponent(id)}/manifest.json`;
export const LICENZA = "Biblioteca Nazionale Centrale di Firenze: pubblico dominio, riproduzioni solo per fini non commerciali (art. 108 del Codice dei Beni Culturali)";

export function leggiStato(file = FILE_STATO) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { voci: {} }; } }
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const uno = x => (Array.isArray(x) ? x.join(" ; ") : x) || "";
const pulito = s => uno(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export async function scansionaBncf({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) return st;
  const r = await scarica(RICERCA, { timeout: Math.max(60000, minuti * 60e3), accept: "application/json" });
  if (r.stato !== 200) throw new Error(`ricerca di Internet Archive: HTTP ${r.stato}`);
  const docs = (JSON.parse(r.testo).response || {}).docs || [];
  if (!docs.length) throw new Error("nessun oggetto nella ricerca");
  st.voci = {};
  for (const d of docs) {
    const v = { t: pulito(d.title), c: pulito(d.description).slice(0, 1500) || null, d: pulito(d.date) || null, l: [].concat(d.language || []), a: [].concat(d.creator || []).map(pulito).slice(0, 6), n: +d.imagecount || null };
    for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
    st.voci[d.identifier] = v;
  }
  st.totale = docs.length; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("bncf", `${docs.length} oggetti «BNCF - Manuscripts» su Internet Archive`);
  return st;
}

// «BNCF, Palatino 795» -> «Palatino 795»
export function segnaturaBncf(t, c) {
  if (/^\s*BNCF\b/i.test(t || "")) return String(t).replace(/^\s*BNCF\s*[,-]?\s*/i, "").replace(/^[\s.;,]+/, "").trim();
  const m = /\((?:Firenze,\s*)?(?:BNCF|Biblioteca Nazionale Centrale(?: di Firenze)?)\s*,\s*(?:Firenze\s*,\s*)?([^)]+)\)/i.exec(c || "");
  return (m ? m[1] : String(t || "")).replace(/^[\s.;,]+|[.\s]+$/g, "").trim();
}
const LETTERE = /\b(lettera|lettere|epistol[ae]|carteggio|minute di lettere|biglietto)\b/i;
export function motivoBncf(id, v) {
  const s = segnaturaBncf(v.t, v.c), testo = `${v.t} ${v.c || ""}`;
  if (/^(Catalogo|Inventario)\b|Sala Mss\.? Cat|Inventario Nuove Accessioni|\bCat\.\s*\d/i.test(s) || /^sala\.-mss/i.test(id)) return "inventario moderno";
  if (/^Autografi\b/i.test(s)) return "autografi";
  if (/^Portolan/i.test(s) || /\b(carta nautica|carta topografica|carta geografica|abbozzo di carta|rotolo manoscritto)\b/i.test(testo)) return "carta geografica o nautica";
  if (/\b(disegni|caricature|bandiere)\b/i.test(testo) && !/\bms\.,/i.test(v.c || "")) return "disegni";
  // lettere e carteggi sciolti (inserti, fondi epistolari); i codici che contengono anche lettere restano
  const titolo = String(v.c || "").split(/,\s*ms\b|\(Firenze/)[0];
  if (LETTERE.test(titolo) && (/inserto|Carteggi|Galileiani|Nuove Accessioni 754/i.test(s) || /^\s*(\w+\s+){0,3}(lettera|lettere)\b/i.test(titolo))) return "lettere";
  return null;
}
// datazione dalla descrizione: «…, ms., sec. XVI, cart. (…)» -> «sec. XVI»
export function datazioneBncf(v) {
  const c = String(v.c || "").split(/\(Firenze/)[0];
  const m = /\bsecc?\.?\s*[IVXL]+\b[^,(;]*/i.exec(c) || /\b1[0-9]{3}(?:\s*[-–]\s*1?[0-9]{2,3})?\b/.exec(c.replace(/mm\s*\d+\s*x\s*\d+/gi, ""));
  return (m && m[0].replace(/[.\s]+$/, "").trim()) || v.d || null;
}

export function recordBncf(st = leggiStato()) {
  return Object.entries((st && st.voci) || {}).filter(([id, v]) => v && v.t && !motivoBncf(id, v)).map(([id, v]) => ({
    fonte: "bncf", id: "bncf-" + id.toLowerCase().replace(/[^a-z0-9.-]+/g, "-"), citta: "Firenze", biblioteca: "Biblioteca Nazionale Centrale di Firenze",
    segnatura: segnaturaBncf(v.t, v.c) || id, datazione: datazioneBncf(v), titolo: String(v.c || v.t).split(/\s*\(Firenze/)[0].slice(0, 400) || null,
    autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []), immagini: v.n || null,
    manifest: manifestoBncf(id), pagina: `https://archive.org/details/${id}`, licenza: LICENZA }));
}
