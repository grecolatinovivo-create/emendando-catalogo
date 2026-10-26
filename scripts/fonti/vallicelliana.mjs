// Biblioteca Vallicelliana, Roma: piattaforma OMNES di DB Seret (omnes.dbseret.com/vallicelliana), la stessa di Montecassino.
// Il sito della Biblioteca (vallicelliana.cultura.gov.it) non ha una biblioteca digitale propria: i 64 codici del progetto BIM
// stanno in Internet Culturale (elenco non raccoglibile, vedi docs/BIBLIOTECHE.md); su OMNES c'è il lascito di Achille Stazio
// (23 volumi, manoscritti e a stampa, il 26 ottobre 2026). Il sito OMNES non ha robots.txt (404) e risponde anche dal server.
// Elenco dalla ricerca del sito (tipo «Manoscritto», come per Montecassino, ma qui OMNES restituisce tutti i volumi): entrano solo
// i manoscritti, cioè le schede che non rimandano a un record SBN di libro a stampa («IT\ICCU\…»: Bibbia complutense, incunaboli,
// cinquecentine postillate). Manifesti IIIF Presentation 2 e immagini con CORS aperto (verificato il 26 ottobre 2026).
// Stato in data/vallicelliana.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { corpoRicerca } from "./montecassino.mjs";

export const FILE_STATO = "data/vallicelliana.json";
export const SITO = "https://omnes.dbseret.com/vallicelliana";
const RPP = 25, GIORNI = 6;
export const manifestoVallicelliana = id => `${SITO}/iiif/${id}/manifest`;
export const LICENZA = "Biblioteca Vallicelliana (MiC); piattaforma OMNES © DB Seret";

export function leggiStato() { try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; } }
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}
const testo = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// pagina dei risultati -> { schede: [{ id, v }], totale }
export function estraiVallicelliana(html) {
  html = String(html);
  const totale = +((/(\d+)\s+risultati trovati/.exec(testo(html)) || [])[1] || 0);
  const schede = [];
  for (const b of html.split(/<div class="title">/).slice(1)) {
    const campi = {};
    for (const m of b.matchAll(/<tr><td>(?:<b>)?([^<]+)(?:<\/b>)?<\/td><td>([\s\S]*?)<\/td><\/tr>/g)) campi[testo(m[1])] = testo(m[2]);
    const id = campi["Identificatore"];
    if (!id || !/^IT-RM0281_[A-Za-z0-9_.-]+$/.test(id)) continue;
    const v = { s: campi["Segnatura"] || null, t: campi["Contenuto"] || null, c: campi["Descrizione"] || null, d: campi["Datazione"] || campi["Datato"] || null,
      m: [campi["Materia"], campi["Consistenza"], campi["Dimensioni"]].filter(Boolean).join("; ") || null, e: campi["ID ESTERNO"] || null,
      i: +((/(\d+)\s+immagini/.exec(b) || [])[1] || 0) || null };
    const mol = (/manus\.iccu\.sbn\.it\/cnmd\/(\d+)/.exec(b) || [])[1]; if (mol) v.mol = mol;
    for (const k of Object.keys(v)) if (v[k] == null) delete v[k];
    schede.push({ id, v });
  }
  return { schede, totale };
}

export async function scansionaVallicelliana({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) return st;
  const fine = Date.now() + minuti * 60e3, voci = {};
  let totale = 0;
  for (let p = 1; ; p++) {
    if (Date.now() > fine) throw new Error(`raccolta incompleta (pagina ${p}): si rifà alla prossima esecuzione`);
    const r = await scarica(`${SITO}/`, { corpo: corpoRicerca(p), timeout: 120000 });
    if (r.stato !== 200) throw new Error(`pagina ${p}: HTTP ${r.stato}`);
    const e = estraiVallicelliana(r.testo);
    totale = e.totale || totale;
    const prima = Object.keys(voci).length;
    for (const { id, v } of e.schede) voci[id] = v;
    if (!e.schede.length || Object.keys(voci).length === prima || p * RPP >= totale) break;
  }
  if (!Object.keys(voci).length) throw new Error("nessun volume nei risultati");
  st.voci = voci; st.totale = totale; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("vallicelliana", `${Object.keys(voci).length} volumi su ${totale}`);
  return st;
}

// manoscritto: nessun rimando a un record SBN di libro a stampa
export const ammessaVallicelliana = v => !!v && !/ICCU/i.test(v.e || "") && !/\bINC\b|\bRARI\b|S\.\s*BOR\./.test(v.s || "");
export const segnaturaVallicelliana = s => String(s || "").replace(/^Biblioteca Vallicelliana,\s*/i, "").replace(/^ms\s+/i, "Ms. ").trim() || null;

export function recordVallicelliana(st = leggiStato()) {
  return Object.entries((st && st.voci) || {}).filter(([, v]) => ammessaVallicelliana(v)).map(([id, v]) => ({
    fonte: "vallicelliana", id: "vall-" + id.replace(/^IT-RM0281_/, "").toLowerCase(), citta: "Roma", biblioteca: "Biblioteca Vallicelliana",
    segnatura: segnaturaVallicelliana(v.s) || id, datazione: v.d || null, titolo: v.t || null, descrizione: [v.c, v.m].filter(Boolean).join(" ; ") || null,
    immagini: v.i || null, manifest: manifestoVallicelliana(id), pagina: v.mol ? `https://manus.iccu.sbn.it/cnmd/${v.mol}` : `${SITO}/`, licenza: LICENZA }));
}
