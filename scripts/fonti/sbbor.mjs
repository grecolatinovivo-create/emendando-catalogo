// Staatsbibliothek zu Berlin, manoscritti non europei («Orientalische Handschriften digital»): tibetani (Hs. or., Tibetica),
// mongoli, sanscriti e nepalesi, islamici, ebraici, cristiano-orientali, africani. Dal 26 ottobre 2026, corsia «asia».
// L'Asia orientale e il Sud-est asiatico (insiemi «ostasiatische» e «suedostasiatische.handschriften») restano alla fonte «sbbasia»:
// qui si saltano (ASIA_EST, dalla classificazione della scheda), insieme ai PPN che «berlino» o «sbbasia» hanno già.
// Perché una fonte a parte: la fonte «berlino» legge il set OAI «handschriften», che contiene solo i manoscritti occidentali;
// i manoscritti orientali stanno nel set «aussereuropaeische.handschriften» (9245 schede a ottobre 2026), che nessuna fonte leggeva.
// Come si legge: lo stesso OAI-PMH della biblioteca (oai.sbb.berlin, nessun robots.txt), formato «mets» (MODS: la segnatura,
// che oai_dc non dà), 10 schede per pagina, a riprese con il token salvato nello stato. Manifesti IIIF content.staatsbibliothek-berlin.de
// (gli stessi della fonte «berlino»), CORS aperto («*», prova del 26 ottobre 2026). Licenza: Public Domain Mark 1.0.
// Entrano solo i manoscritti librari: fuori i documenti d'archivio e le lettere (Urkunde, Brief, Vertrag, Dokument: vedi DOCUMENTI; i 308
// «Tibetische Urkunde» sono documenti), le coperte lignee dei libri tibetani e i cataloghi a stampa finiti nel set (NON_LIBRI),
// e i codici che la fonte «berlino» ha già (stesso PPN). Stato in data/sbbor.json; una raccolta completa si riusa per 14 giorni.
import fs from "node:fs";
import { scarica, log, tag, records, token } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/sbbor.json";
const BASE = "https://oai.sbb.berlin/", SET = "aussereuropaeische.handschriften", GIORNI = 14;
// documenti d'archivio e corrispondenza, non libri
export const DOCUMENTI = /Urkunde|Briefsammlung|Briefwechsel|\bBriefe\b|\bBriefen\b|\bBrief von\b|^\[?Brief\]?$|^\S+ Brief$|Dokument|\bVertrag\b|\bErlass\b|Quittung|Petition|Schuldschein/i;
// non manoscritti librari: coperte lignee intagliate dei libri tibetani (oggetti), libri a stampa finiti nel set (cataloghi della biblioteca)
export const ASIA_EST = v => /(Süd)?[oO]stasiatische Handschriften/.test(v.c || "");
export const NON_LIBRI = v => /Buchdeckel/i.test(v.t || "") || /Historische Drucke/i.test(v.c || "");

export function leggiStato() { try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; } }
function salva(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, token: st.token || null, pagine: st.pagine || 0, totale: st.totale || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// record OAI (METS con MODS) -> [ppn, voce compatta] oppure null
export function compattaSbbor(rec) {
  if (/status="deleted"/.test(rec.slice(0, 600))) return null;
  // PPN della scheda: quello dell'intestazione OAI (nei volumi di un'opera in più volumi la prima segnatura PPN è quella dell'opera)
  const ppn = (/<identifier>[^<]*?:(PPN\w+)<\/identifier>/.exec(rec.slice(0, 2000)) || [])[1]; if (!ppn) return null;
  // solo la parte MODS (i METS dei codici grandi hanno centinaia di KB di elenchi di file)
  const i = rec.indexOf("<mods:mods"), j = rec.indexOf("</mods:mods>", i);
  if (i < 0 || j < 0) return null;
  rec = rec.slice(i, j + 12);
  // l'opera in più volumi (senza segnatura) non è un codice: entrano i suoi volumi
  if (!/<mods:shelfLocator>/.test(rec)) return null;
  const titoli = tag(rec, "mods:title").filter(t => !/^Orientalische Handschriften digital$/i.test(t));
  const date = tag(rec, "mods:dateCreated");
  const v = { s: tag(rec, "mods:shelfLocator")[0] || null, t: (titoli[0] || "").slice(0, 400) || null,
    d: date.find(x => !/^\d{3,4}$/.test(x)) || date[0] || null, l: tag(rec, "mods:languageTerm"),
    c: [...titoli.slice(1), ...tag(rec, "mods:classification").filter(x => !/^Außereuropäische Handschriften$/.test(x)), ...tag(rec, "mods:extent")].join(" ; ").slice(0, 2000) || null,
    a: tag(rec, "mods:namePart").slice(0, 6) };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return [ppn, v];
}

export async function scansionaSbbor({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && !st.token && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("sbbor", `riuso la raccolta del ${st.completato.slice(0, 10)}`); return st; }
  // raccolta nuova (o rifatta dopo 14 giorni): si riparte dal primo elenco, tenendo le voci già lette finché non finisce
  // (una lettura ripresa col token riparte dalle voci salvate, che contengono già le pagine lette)
  if (!st.token) { st.pagine = 0; st.nuove = {}; } else st.nuove = { ...(st.voci || {}) };
  const fine = Date.now() + minuti * 60e3;
  for (;;) {
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaConNuove(st); throw new Error(`raccolta incompleta (${st.pagine} pagine): riprenderà alla prossima esecuzione`); }
    const url = st.token ? `${BASE}?verb=ListRecords&resumptionToken=${encodeURIComponent(st.token)}` : `${BASE}?verb=ListRecords&metadataPrefix=mets&set=${SET}`;
    const r = await scarica(url, { timeout: 180000 });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    if (/<error code="badResumptionToken"/.test(r.testo)) { log("sbbor", "token scaduto: ricomincio"); st.token = null; st.pagine = 0; st.nuove = {}; continue; }
    for (const rec of records(r.testo)) { const x = compattaSbbor(rec); if (x) st.nuove[x[0]] = x[1]; }
    const tot = /completeListSize="(\d+)"/.exec(r.testo); if (tot) st.totale = +tot[1];
    st.pagine++; st.token = token(r.testo);
    if (st.pagine % 50 === 0) { log("sbbor", `pagina ${st.pagine}, ${Object.keys(st.nuove).length} schede`); st.aggiornato = new Date().toISOString(); salvaConNuove(st); }
    if (!st.token) break;
  }
  st.voci = st.nuove; delete st.nuove;
  st.completato = st.aggiornato = new Date().toISOString();
  salva(st);
  log("sbbor", `fine: ${Object.keys(st.voci).length} schede`);
  return st;
}
// a raccolta in corso le schede nuove si salvano accanto alle vecchie (che restano nel catalogo finché la lettura non finisce)
function salvaConNuove(st) {
  const voci = { ...(st.voci || {}) };
  for (const [k, v] of Object.entries(st.nuove || {})) voci[k] = v;
  salva({ ...st, voci });
}

export function recordSbbor(st = leggiStato(), { esistenti = new Set() } = {}) {
  const out = [];
  for (const [ppn, v] of Object.entries(st.voci || {})) {
    if (esistenti.has("sbb-" + ppn) || ASIA_EST(v)) continue;
    if (DOCUMENTI.test(v.t || "") || NON_LIBRI(v)) continue;
    out.push({ fonte: "sbbor", id: "sbbor-" + ppn, citta: "Berlin", biblioteca: "Staatsbibliothek zu Berlin", segnatura: v.s || ppn, datazione: v.d || null,
      titolo: v.t || null, autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []),
      manifest: `https://content.staatsbibliothek-berlin.de/dc/${ppn}/manifest`, pagina: `https://digital.staatsbibliothek-berlin.de/werkansicht?PPN=${ppn}`,
      licenza: "Public Domain Mark 1.0" });
  }
  return out;
}
