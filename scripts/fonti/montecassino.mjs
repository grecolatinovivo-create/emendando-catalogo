// Biblioteca statale del Monumento nazionale di Montecassino: «Memory of Montecassino» (piattaforma OMNES di DB Seret,
// omnes.dbseret.com/montecassino). Il sito non ha robots.txt (404). L'elenco viene dalla ricerca del sito filtrata per tipo
// «Manoscritto» (circa 210 codici dell'Archivio, Cod. 1 e seguenti; fuori le pergamene, cioè i documenti d'archivio): 25 schede per
// pagina, sfogliate come fa il sito (POST con faction=pagemove), con segnatura, descrizione, contenuto, scrittura, datazione e
// numero delle immagini. Manifesti IIIF (Presentation 2) e immagini con CORS aperto (prova del 25 ottobre 2026).
// Lo stato è in data/montecassino.json; una raccolta completa (circa 9 pagine) si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/montecassino.json";
export const SITO = "https://omnes.dbseret.com/montecassino";
const RPP = 25, GIORNI = 6;
export const manifestoMontecassino = id => `${SITO}/iiif/${id}/manifest`;
export const LICENZA = "Biblioteca statale del Monumento nazionale di Montecassino (MiC); piattaforma OMNES © DB Seret";

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const testo = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export const corpoRicerca = pagina => new URLSearchParams({ fsearch: "", fmetadata: "", fcreator: "", fidentifier: "", fsubject: "", ftype: "Manoscritto", fcontributor: "",
  ftitle: "", fpublisher: "", fdescription: "", frelation: "", fadvsearch: "1", fpage: String(pagina), faction: pagina > 1 ? "pagemove" : "", rpp: String(RPP), fcollectiononly: "1" }).toString();

// pagina dei risultati -> { schede: [{ id, v }], totale }
export function estraiMontecassino(html) {
  html = String(html);
  const totale = +((/(\d+)\s+risultati trovati/.exec(testo(html)) || [])[1] || 0);
  const schede = [];
  for (const b of html.split(/<div class="title">/).slice(1)) {
    const tipo = testo((/<span class="itemtype[^"]*">([\s\S]*?)<\/span>/.exec(b) || [])[1]);
    const campi = {};
    for (const m of b.matchAll(/<tr><td><b>([^<]+)<\/b><\/td><td>([\s\S]*?)<\/td><\/tr>/g)) campi[testo(m[1])] = testo(m[2]);
    const id = campi["Identificatore"];
    if (!id || !/^IT-FR0084_[A-Za-z0-9_.-]+$/.test(id)) continue;
    const imm = +((/(\d+)\s+immagini/.exec(b) || [])[1] || 0);
    const v = { tipo: tipo || null, s: campi["Segnatura"] || null, t: campi["Contenuto"] || null, c: campi["Descrizione"] || null, d: campi["Datazione"] || campi["Datato"] || null,
      w: campi["Scrittura"] || null, m: [campi["Materiale"], campi["Consistenza"], campi["Dimensioni"]].filter(Boolean).join("; ") || null, i: imm || null };
    const mol = (/manus\.iccu\.sbn\.it\/cnmd\/(\d+)/.exec(b) || [])[1]; if (mol) v.mol = mol;
    for (const k of Object.keys(v)) if (v[k] == null) delete v[k];
    schede.push({ id, v });
  }
  return { schede, totale };
}

// «Biblioteca statale del Monumento nazionale di Montecassino, Archivio, Cod. 97» -> «Cod. 97»
export const segnaturaMontecassino = s => String(s || "").replace(/^Biblioteca statale del Monumento nazionale di Montecassino,\s*(Archivio( dell'Abbazia)?,\s*)?/i, "").trim() || null;

export async function scansionaMontecassino({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("montecassino", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const fine = Date.now() + minuti * 60e3, voci = {};
  let totale = 0;
  for (let p = 1; ; p++) {
    if (Date.now() > fine) throw new Error(`raccolta incompleta (pagina ${p}): si rifà alla prossima esecuzione`);
    const r = await scarica(`${SITO}/`, { corpo: corpoRicerca(p), timeout: 120000 });
    if (r.stato !== 200) throw new Error(`pagina ${p}: HTTP ${r.stato}`);
    const e = estraiMontecassino(r.testo);
    totale = e.totale || totale;
    const prima = Object.keys(voci).length;
    for (const { id, v } of e.schede) voci[id] = v;
    if (!e.schede.length || Object.keys(voci).length === prima || p * RPP >= totale) break;
  }
  if (!Object.keys(voci).length) throw new Error("nessun codice nei risultati");
  st.voci = voci; st.totale = totale; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("montecassino", `${Object.keys(voci).length} codici su ${totale}`);
  return st;
}

export function recordMontecassino(st = leggiStato()) {
  return Object.entries((st && st.voci) || {}).filter(([, v]) => v && (!v.tipo || /manoscritt/i.test(v.tipo))).map(([id, v]) => ({
    fonte: "montecassino", id: "mcas-" + id.replace(/^IT-FR0084_/, "").toLowerCase(), citta: "Montecassino (Cassino)", biblioteca: "Biblioteca statale del Monumento nazionale di Montecassino",
    segnatura: segnaturaMontecassino(v.s) || id, datazione: v.d || null, titolo: v.t || null, descrizione: [v.c, v.w && "Scrittura: " + v.w, v.m].filter(Boolean).join(" ; ") || null,
    immagini: v.i || null, manifest: manifestoMontecassino(id), pagina: v.mol ? `https://manus.iccu.sbn.it/cnmd/${v.mol}` : `${SITO}/`, licenza: LICENZA }));
}
