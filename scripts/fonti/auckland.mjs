// Auckland Libraries, Heritage Collections (Sir George Grey Special Collections), Auckland (Nuova Zelanda):
// Kura Heritage Collections Online su CONTENTdm (kura.aucklandlibraries.govt.nz), collezione «manuscripts» (circa 6500 oggetti,
// quasi tutti lettere e carte d'archivio neozelandesi). Si usa l'API dmwebservices (dmQuery, pagine di 200 record), che il
// robots.txt non vieta (vieta solo le pagine di ricerca del sito). Entrano solo i manoscritti librari con immagini (oggetti
// composti, «cpd»): tutti i «Medieval manuscripts» (i codici medievali e rinascimentali donati da Grey e altri, de Hamel),
// e i codici orientali (arabi, persiani, turchi, ebraici…) delle raccolte Grey e internazionali fino al 1800 circa
// (fuori lettere, note, pagine sciolte, giornali di bordo e ciò che è datato al XIX secolo o dopo).
// Manifesti IIIF Presentation 2 di CONTENTdm: kura.aucklandlibraries.govt.nz/iiif/2/manuscripts:<numero>/manifest.json (CORS aperto).
// Diritti: «No known copyright restrictions». Stato in data/auckland.json; una raccolta completa (circa 33 richieste) si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/auckland.json";
export const BASE = "https://kura.aucklandlibraries.govt.nz";
const CAMPI = ["title", "datec", "identi", "langua", "formatb", "collea", "creato", "rights", "descri"];
const PAGINA = 200, GIORNI = 6;
const ORIENTALI = /Arabic|Persian|Turkish|Urdu|Hebrew|Syriac|Armenian|Ethiopic|Sanskrit|Malay|Greek|Latin/i;
const NON_LIBRARI = /^(letter|note|notes|specimen|pages from|log-book|copy of|copies of|receipt|treaty|broadsheet|address)\b/i;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, totale: st.totale || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}
const pulito = s => (typeof s === "string" ? s : "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// anni cristiani della datazione («Between 1450 and 1475», «1072 AH (circa 1662)», «18th century», «16th or early 17th»)
export function anniAuckland(d) {
  const s = pulito(d);
  const out = [];
  for (const m of s.matchAll(/\b(\d{3,4})\s*AH\b/gi)) out.push(Math.round(+m[1] * 0.97 + 622));
  for (const m of s.replace(/\b\d{3,4}\s*AH\b/gi, "").matchAll(/\b(1[0-9]{3})\b/g)) out.push(+m[1]);
  for (const m of s.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)\b(?:\s+or\s+(?:early\s+|late\s+)?\d{1,2}(?:st|nd|rd|th))?\s+cent/gi)) out.push((+m[1] - 1) * 100 + 1);
  return out;
}

// record di dmQuery -> voce compatta (null se non è un manoscritto librario con immagini fino al 1800 circa)
export function compattaAuckland(r) {
  if (!r || r.parentobject !== -1 || r.filetype !== "cpd") return null;
  const coll = pulito(r.collea), titolo = pulito(r.title), lingue = pulito(r.langua), data = pulito(r.datec);
  const medievale = /^Medieval manuscripts$/i.test(coll);
  if (!medievale) {
    if (!ORIENTALI.test(lingue) || /M[aā]ori/i.test(lingue) || NON_LIBRARI.test(titolo) || /letters?$/i.test(coll)) return null;
    const a = anniAuckland(data);
    if (/\b(19th|20th)\b/i.test(data) || (a.length && Math.min(...a) > 1800)) return null;
  }
  const v = { s: pulito(r.identi) || null, t: titolo || null, d: data || null, l: lingue ? lingue.split(/;\s*/) : [], k: coll || null };
  const autori = pulito(r.creato).split(";").map(x => x.trim()).filter(Boolean); if (autori.length) v.a = autori;
  if (r.rights && !/no known copyright/i.test(r.rights)) v.r = pulito(r.rights);
  const c = pulito(r.descri).slice(0, 1500); if (c) v.c = c;
  return v;
}

export async function scansionaAuckland({ minuti = 10, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {};
  if (soloCache) return st;
  const ora = Date.now();
  if (st.completato && !st.cursore && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("auckland", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  if (!st.cursore) st.cursore = { inizio: 1, voci: {} };
  const fine = ora + minuti * 60e3;
  for (;;) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (record ${st.cursore.inizio}): riprenderà alla prossima esecuzione`); }
    const url = `${BASE}/digital/bl/dmwebservices/index.php?q=dmQuery/manuscripts/0/${CAMPI.join("!")}/nosort/${PAGINA}/${st.cursore.inizio}/1/0/0/0/json`;
    const r = await scarica(url, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const d = JSON.parse(r.testo), recs = d.records || [];
    st.totale = +(d.pager && d.pager.total) || st.totale;
    for (const x of recs) { const v = compattaAuckland(x); if (v) st.cursore.voci[x.pointer] = v; }
    st.aggiornato = new Date().toISOString();
    st.cursore.inizio += PAGINA;
    if (!recs.length || st.cursore.inizio > (st.totale || 0)) break;
    salvaStato(st);
  }
  st.voci = st.cursore.voci; delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("auckland", `fine: ${Object.keys(st.voci).length} codici su ${st.totale} oggetti`);
  return st;
}

export function recordAuckland(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v).map(([n, v]) => ({
    fonte: "auckland", id: "akl-" + n, citta: "Auckland (Nuova Zelanda)", biblioteca: "Auckland Libraries, Sir George Grey Special Collections",
    segnatura: v.s || "manuscripts " + n, datazione: v.d, titolo: v.t, autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []),
    manifest: `${BASE}/iiif/2/manuscripts:${n}/manifest.json`, pagina: `${BASE}/digital/collection/manuscripts/id/${n}`,
    licenza: v.r || "No known copyright restrictions" }));
}
