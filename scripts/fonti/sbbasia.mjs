// Staatsbibliothek zu Berlin, manoscritti dell'Asia orientale e del Sud-est asiatico (dal 26 ottobre 2026, corsia «asia»):
// OAI-PMH delle Digitalisierte Sammlungen (`oai.sbb.berlin`), insiemi «ostasiatische.handschriften» (circa 1400: manoscritti
// naxi della collezione Janert, cinesi, mancesi, mongoli, tibetani, giapponesi) e «suedostasiatische.handschriften» (circa 320:
// thai, batak, malesi, giavanesi, pali), che l'insieme «handschriften» della fonte «berlino» non comprende. Stesso identificativo
// della fonte «berlino» («sbb-<PPN>»): un codice che compare in tutte e due resta una voce sola.
// Fuori: carteggi, cataloghi di manoscritti e le cartelle «Pustaka: Bundel» (schede e fotografie di catalogazione dei pustaha batak di altre collezioni, non codici).
// Manifesti IIIF `content.staatsbibliothek-berlin.de/dc/<PPN>/manifest` (CORS aperto, come per la fonte «berlino»). Il server OAI
// è lento (circa 35 secondi per pagina di 50 record); pausa di 1,5 secondi (rete.mjs). Stato in data/sbbasia.json (raccolta
// completa ogni 14 giorni, a riprese con il token OAI).
import fs from "node:fs";
import { scarica, log, tag, records, token, totale } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { licenza } from "./oai.mjs";

export const FILE_STATO = "data/sbbasia.json";
export const BASE = "https://oai.sbb.berlin/";
export const INSIEMI = ["ostasiatische.handschriften", "suedostasiatische.handschriften"];
const GIORNI = 14;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, cursore: st.cursore ?? null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// record OAI -> [PPN, voce compatta { t, a, l, d, c, r, g }]
export function estraiSbbasia(rec, insieme) {
  if (/status="deleted"/.test(rec)) return null;
  if (!tag(rec, "dc:type").some(t => /manuscript/i.test(t))) return null;
  const ppn = tag(rec, "dc:identifier").find(x => /^PPN\w+$/.test(x)); if (!ppn) return null;
  const v = { t: tag(rec, "dc:title")[0] || null, g: insieme.startsWith("ost") ? "o" : "s" };
  const a = tag(rec, "dc:creator"); if (a.length) v.a = a.slice(0, 6);
  const l = tag(rec, "dc:language"); if (l.length) v.l = l;
  const d = tag(rec, "dc:date")[0]; if (d) v.d = d;
  const c = tag(rec, "dc:description").join(" ; ").slice(0, 1500); if (c) v.c = c;
  const r = tag(rec, "dc:rights")[0]; if (r) v.r = r;
  return [ppn, v];
}

export async function scansionaSbbasia({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {}; st.totali = st.totali || {};
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (st.cursore == null && (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5)) st.cursore = { i: 0, token: null, nuove: {} };
  if (st.cursore == null) { log("sbbasia", `raccolta del ${String(st.elenco).slice(0, 10)}: ${Object.keys(st.voci).length} manoscritti`); return st; }
  while (st.cursore.i < INSIEMI.length) {
    const ins = INSIEMI[st.cursore.i];
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`raccolta incompleta (${ins}): riprenderà alla prossima esecuzione`); }
    const url = st.cursore.token ? `${BASE}?verb=ListRecords&resumptionToken=${encodeURIComponent(st.cursore.token)}` : `${BASE}?verb=ListRecords&metadataPrefix=oai_dc&set=${ins}`;
    const r = await scarica(url, { timeout: 180000 });
    if (r.stato !== 200) throw new Error(`${ins}: HTTP ${r.stato}`);
    if (/<error code="badResumptionToken"/.test(r.testo)) { log("sbbasia", "token scaduto: ricomincio l'insieme"); st.cursore.token = null; continue; }
    for (const rec of records(r.testo)) { const x = estraiSbbasia(rec, ins); if (x && !st.cursore.nuove[x[0]]) st.cursore.nuove[x[0]] = x[1]; }
    if (totale(r.testo)) st.totali[ins] = totale(r.testo);
    st.cursore.token = token(r.testo);
    if (!st.cursore.token) { log("sbbasia", `${ins}: ${st.totali[ins] || "?"} record`); st.cursore = { i: st.cursore.i + 1, token: null, nuove: st.cursore.nuove }; }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  st.voci = st.cursore.nuove; st.cursore = null;
  st.elenco = st.aggiornato = new Date().toISOString(); st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  log("sbbasia", `raccolta finita: ${Object.keys(st.voci).length} manoscritti`);
  return st;
}

export const ammessaSbbasia = v => !!(v && v.t && !/^Pustaka:\s*Bundel|^Briefwechsel|^Briefe?\b|Verzeichniss? einer Sammlung|^Katalog/i.test(v.t));

// lingue: codici MARC; «sit» (sino-tibetano) nella collezione dell'Asia orientale sono i manoscritti naxi; «mon» è il mongolo
function lingueSbbasia(v) {
  const l = (v.l || []).map(x => (x === "sit" && v.g === "o" ? "nxq" : x === "mon" ? "khk" : x === "sin" ? "xx" : x));
  return lingueDa(l);
}

export function recordSbbasia(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaSbbasia(v)).map(([ppn, v]) => {
    const tit = v.t, m = /;\s*((?:Ms|Mss|Hs|Hdschr|Mscr|Cod|Libr|Libri|Diez|Or|Orient|Schoemann|Klaproth|Neumann)\.?\s[^;]*)$/.exec(tit);
    return {
      fonte: "sbbasia", id: "sbb-" + ppn, citta: "Berlin", biblioteca: "Staatsbibliothek zu Berlin", segnatura: m ? m[1].trim() : ppn,
      datazione: v.d || null, titolo: (m ? tit.slice(0, m.index) : tit).trim(), autori_fonte: v.a || [],
      descrizione: [v.g === "o" ? "Ostasiatische Handschriften" : "Südostasiatische Handschriften", v.c].filter(Boolean).join(" ; "),
      lingue: lingueSbbasia(v),
      manifest: `https://content.staatsbibliothek-berlin.de/dc/${ppn}/manifest`, pagina: `https://digital.staatsbibliothek-berlin.de/werkansicht?PPN=${ppn}`,
      licenza: licenza(v.r) || "Staatsbibliothek zu Berlin" };
  });
}
