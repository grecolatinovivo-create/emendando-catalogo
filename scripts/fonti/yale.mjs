// Yale University Library (Beinecke e altre biblioteche di Yale): OAI-PMH di Digital Collections
// (collections.library.yale.edu/catalog/oai, formato oai_mods, 25 record per pagina, circa 200.000 record di ogni tipo).
// Gli insiemi sono solo per lingua: prima si leggono quelli delle lingue antiche e medievali, poi tutto, e si tengono i manoscritti (genere «Manuscripts» o segnatura «MS»/«MSS»,
// senza editore: i libri a stampa hanno l'editore), esclusi i papiri (in attesa di decisione, vedi docs/BIBLIOTECHE.md).
// Il robots.txt di Yale vieta ai programmi di raccolta /manifests/: i manifesti non si leggono mai, si ricavano dall'identificativo
// (collections.library.yale.edu/manifests/<oid>, CORS aperto) e li apre solo il browser di chi usa il catalogo.
// Lo stato (token di ripresa e manoscritti letti) è in data/yale.json: la prima raccolta (circa 8000 pagine) va a riprese
// e nel frattempo entrano i manoscritti già letti;
// poi, ogni 6 giorni, si leggono solo i record cambiati dall'ultima raccolta (from=).
import fs from "node:fs";
import { scarica, log, tag, records, token, totale } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/yale.json";
export const BASE = "https://collections.library.yale.edu/catalog/oai";
const GIORNI = 6;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => +a - +b).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, inizio: st.inizio || null, from: st.from || null,
    coda: st.coda || null, token: st.token || null, sospeso: st.sospeso || null, pagine: st.pagine || 0, totale: st.totale || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// record oai_mods -> { oid, v } (v = voce compatta, null se non è un manoscritto)
export function estraiYale(rec) {
  const oid = (/<identifier>oai:collections\.library\.yale\.edu:(\d+)<\/identifier>/.exec(rec) || [])[1];
  if (!oid) return null;
  if (/<header[^>]*status="deleted"/.test(rec)) return { oid, v: null };
  const generi = tag(rec, "mods:genre"), seg = tag(rec, "mods:classification")[0] || null;
  const ms = generi.some(g => /manuscript|codices|charters|cartular/i.test(g)) || /\bMSS?\b|^Osborn [a-z]+\d|^Takamiya|^Marston/i.test(seg || "");
  const stampa = tag(rec, "mods:publisher").length > 0 && !generi.some(g => /manuscript/i.test(g));
  const papiro = generi.some(g => /papyr|ostraca/i.test(g)) || /P\.\s?CtYBR|^P\.\s?Yale/i.test(seg || "");
  if (!ms || stampa || papiro) return { oid, v: null };
  // carte moderne (archivi di scrittori del Novecento e simili): fuori quelle datate tutte dopo il 1800
  const data = tag(rec, "mods:dateCreated")[0] || tag(rec, "mods:dateIssued")[0] || null;
  if (primoAnno(data) > 1800) return { oid, v: null };
  const note = tag(rec, "mods:note");
  const citazione = (/<mods:note type="preferred citation">([^<]*)</.exec(rec) || [])[1] || null;
  const titolo = tag(rec, "mods:title")[0] || null;
  const v = { s: seg, t: titolo, a: tag(rec, "mods:namePart").slice(0, 12), l: tag(rec, "mods:languageTerm"), d: data,
    b: citazione, g: generi.slice(0, 6) };
  const desc = [...tag(rec, "mods:abstract"), ...note.filter(n => n !== citazione && !/digitized|^On (parchment|paper)\.?$/i.test(n))].join(" ; ").slice(0, 1500);
  if (desc) v.c = desc;
  const anteprima = (/<mods:url access="preview"[^>]*xlink:href="([^"]*)"/.exec(rec) || [])[1];
  if (anteprima) v.p = anteprima.replace(/^https:\/\/collections\.library\.yale\.edu\/iiif\/2\//, "").replace(/\/full\/.*$/, "");
  return { oid, v };
}

/* raccolta a riprese: token salvato dopo ogni pagina */
// prima lettura: prima gli insiemi delle lingue antiche e medievali (poche centinaia di pagine: latino, greco, lingue orientali, volgari medievali),
// così i codici più richiesti entrano subito; poi tutti i record (anche quelli senza lingua), per non perdere nulla
export const PRIORITARI = ["Latin", "Greek, Ancient (to 1453)", "Greek", "Greek languages", "Hebrew", "Aramaic", "Syriac", "Coptic", "Arabic", "Judeo-Arabic", "Armenian", "Georgian",
  "Ethiopic", "Church Slavic", "Persian", "Turkish, Ottoman", "Turkish, Ottoman (1500-1928)", "English, Old (ca. 450-1100)", "English, Middle (1100-1500)",
  "French, Old (ca. 842-1300)", "French, Middle (ca. 1300-1600)", "French, Middle (ca.1400-1600)", "Provencal (to 1500)", "Provençal, Old (to 1500)",
  "German, Middle High (ca. 1050-1500)", "Dutch, Middle (ca. 1050-1350)", "Old Norse", "Icelandic", "Irish", "Welsh"];

export async function scansionaYale({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  // stato della prima versione (solo la lettura completa, già avviata): la si mette in coda dopo gli insiemi prioritari
  if (st.token && !st.coda && !st.completato) { st.coda = [...PRIORITARI.map(x => "language:" + x), ""]; st.sospeso = st.token; st.token = null; }
  if (!st.coda || !st.coda.length) {
    if (st.completato && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("yale", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} manoscritti`); return st; }
    // dopo la prima raccolta completa: solo i record cambiati dall'inizio della raccolta precedente
    st.from = st.completato ? (st.inizio || st.completato).slice(0, 19) + "Z" : null;
    st.coda = st.completato ? [""] : [...PRIORITARI.map(x => "language:" + x), ""];
    st.inizio = new Date().toISOString(); st.pagine = 0; st.token = null;
  } else log("yale", `riprendo: ${st.coda[0] || "tutti i record"}${st.coda[0] ? "" : ", pagina " + (st.pagine + 1)}`);
  const fine = ora + minuti * 60e3;
  while (st.coda.length) {
    const insieme = st.coda[0];
    if (!insieme && !st.token && st.sospeso) { st.token = st.sospeso; st.pagine = Math.round(+((/:(\d+)$/.exec(st.sospeso) || [0, 0])[1]) / 25); delete st.sospeso; }
    // tempo finito: si salva e si usano i manoscritti letti finora (come per la Bodleian); si riprende alla prossima esecuzione
    if (Date.now() > fine) { salvaStato(st); log("yale", `tempo esaurito (${insieme || "tutti i record, pagina " + st.pagine + " di circa " + Math.ceil((st.totale || 0) / 25)}): riprenderà alla prossima esecuzione`); return st; }
    const url = st.token ? `${BASE}?verb=ListRecords&resumptionToken=${encodeURIComponent(st.token)}`
      : `${BASE}?verb=ListRecords&metadataPrefix=oai_mods${insieme ? "&set=" + encodeURIComponent(insieme) : ""}${st.from ? "&from=" + encodeURIComponent(st.from) : ""}`;
    const r = await scarica(url, { timeout: 180000 });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    let prossimo = null;
    if (/<error code="(noRecordsMatch|badArgument)"/.test(r.testo)) prossimo = null;
    else if (/<error code="badResumptionToken"/.test(r.testo)) { log("yale", "token non valido: ricomincio l'insieme"); st.token = null; if (!insieme) st.pagine = 0; continue; }
    else if (/<error /.test(r.testo)) throw new Error("errore OAI: " + (/<error[^>]*>([^<]*)/.exec(r.testo) || [])[1]);
    else {
      for (const rec of records(r.testo)) { const x = estraiYale(rec); if (!x) continue; if (x.v) st.voci[x.oid] = x.v; else if (!insieme) delete st.voci[x.oid]; }
      prossimo = token(r.testo);
      if (!insieme) { st.pagine++; st.totale = totale(r.testo) || st.totale; if (st.pagine % 100 === 0) log("yale", `pagina ${st.pagine} di circa ${Math.ceil((st.totale || 0) / 25)}, ${Object.keys(st.voci).length} manoscritti`); }
    }
    st.token = prossimo; st.aggiornato = new Date().toISOString();
    if (!prossimo) { if (insieme) log("yale", `${insieme}: fatto (${Object.keys(st.voci).length} manoscritti finora)`); st.coda.shift(); }
    salvaStato(st);
  }
  st.coda = null; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("yale", `fine: ${Object.keys(st.voci).length} manoscritti`);
  return st;
}

// solo manoscritti medievali e della prima età moderna: fuori quelli datati tutti dopo il 1800
export function primoAnno(d) {
  const s = String(d || "");
  const sec = /(\d{1,2})(?:st|nd|rd|th)\s+cent/i.exec(s); if (sec) return (+sec[1] - 1) * 100;
  // «176-?»: decennio (1760)
  const t = s.replace(/\b(1[0-9]{2})-(?!\d)/g, (_, x) => x + "0");
  const a = (t.match(/\b1[0-9]{3}\b|\b[1-9][0-9]{2}\b/g) || []).map(Number);
  return a.length ? Math.min(...a) : null;
}

export function recordYale(st = leggiStato()) {
  const out = [];
  for (const [oid, v] of Object.entries(st.voci || {})) {
    if (!v) continue;
    const anno = primoAnno(v.d);
    if (anno != null && anno > 1800) continue;
    out.push({ fonte: "yale", id: "yale-" + oid, citta: "New Haven", biblioteca: v.b || "Yale University Library", segnatura: v.s ? v.s.replace(/^(.*\bMSS? [\w.]+) 1$/, "$1") : "oid " + oid, datazione: v.d, titolo: v.t,
      autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []),
      manifest: `https://collections.library.yale.edu/manifests/${oid}`, pagina: `https://collections.library.yale.edu/catalog/${oid}`,
      licenza: "Yale University Library: condizioni d'uso nella pagina del codice" });
  }
  return out;
}
