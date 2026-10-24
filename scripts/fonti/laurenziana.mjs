// Biblioteca Medicea Laurenziana, Firenze: Teca Digitale su CONTENTdm (tecabml.contentdm.oclc.org).
// L'OAI-PMH di CONTENTdm della Teca non funziona; si usa l'API dmwebservices (dmQuery), a pagine di 200 record,
// collezione per collezione: tutti i fondi di manoscritti, compresi gli Orientali e i Documenti del Concilio di Firenze
// (esclusi solo i cataloghi a stampa).
// Si tengono solo gli oggetti di primo livello (i codici; parentobject = -1), non le singole pagine.
// Lo stato (cursore e record letti) è in data/laurenziana.json: la raccolta riprende da dove si era fermata
// e una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/laurenziana.json";
export const BASE = "https://tecabml.contentdm.oclc.org";
export const COLLEZIONI = ["plutei", "acquisti-doni", "ashburnham", "san-marco", "con-soppressi", "edili", "gaddi", "med-palatino", "amiatino", "pandette", "orientali", "doc-concilio"];
// 2: con Orientali e Documenti del Concilio (una raccolta di versione diversa si rifà)
const VERSIONE = 2;
const CAMPI = ["title", "creato", "contri", "descri", "date", "datazi", "subjec", "rights", "source", "conten"];
const PAGINA = 200, GIORNI = 6;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  // una voce per riga: diff leggibili nei commit
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: st.versione || null, aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const pulito = s => (typeof s === "string" ? s : "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// «1401; 1402; ...; 1500» -> «1401-1500»
export function intervalloAnni(s) {
  const a = (String(s || "").match(/\b\d{3,4}\b/g) || []).map(Number);
  if (!a.length) return pulito(s).slice(0, 60) || null;
  const min = Math.min(...a), max = Math.max(...a);
  return min === max ? String(min) : `${min}-${max}`;
}

// «Plut.36.41» -> «Plut. 36.41»; «Conv.Soppr.150» -> «Conv. Soppr. 150»; le altre come le dà la Teca
export function segnaturaLaurenziana(s) {
  return pulito(s).replace(/^Plut\.\s*/, "Plut. ").replace(/^Conv\.\s*Soppr\.\s*/, "Conv. Soppr. ").replace(/^Ashb\.\s*/, "Ashb. ")
    .replace(/^Med\.\s*Palat\.\s*/, "Med. Palat. ").replace(/^Amiat\.\s*/, "Amiat. ").replace(/^S\.\s*Marco\s*/, "S. Marco ");
}

// record di dmQuery -> voce compatta dello stato (null per le pagine figlie)
export function compattaLaurenziana(r) {
  if (!r || r.parentobject !== -1) return null;
  const autori = pulito(r.creato).split(";").map(x => x.trim()).filter(x => x && x !== "s.a.");
  const contri = pulito(r.contri).split(";").map(x => x.trim()).filter(x => x && x !== "s.a.");
  // «Comprende»: le unità del codice, separate da «|», ciascuna «titolo; autore; {identificativo}»
  const comprende = pulito(r.source).split("|").map(x => x.replace(/;?\s*\{[^}]*\}\s*$/, "").replace(/;\s*s\.a\.\s*$/, "").trim()).filter(Boolean).join(" | ");
  const v = { s: pulito(r.subjec) || null, t: pulito(r.title) || null, a: autori, d: pulito(r.datazi) || intervalloAnni(r.date), r: pulito(r.rights) || null };
  if (contri.length) v.k = contri;
  const desc = [pulito(r.descri), comprende, pulito(r.conten)].filter(x => x && x !== "datazione non espressa").join(" ; ").slice(0, 3000);
  if (desc) v.c = desc;
  return v;
}

/* raccolta a riprese: un cursore {collezione, inizio}; stato salvato dopo ogni pagina */
export async function scansionaLaurenziana({ minuti = 20, soloCache = false } = {}) {
  let st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  if (st.versione !== VERSIONE) { st.versione = VERSIONE; st.completato = null; st.cursore = null; }
  if (st.completato && !st.cursore && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("laurenziana", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  // nuova raccolta: si ricomincia dalla prima collezione, i record letti si sovrascrivono man mano
  if (!st.cursore) st.cursore = { collezione: COLLEZIONI[0], inizio: 1, voci: {} };
  else log("laurenziana", `riprendo da ${st.cursore.collezione}, record ${st.cursore.inizio}`);
  st.cursore.voci = st.cursore.voci || {};
  st.totali = st.totali || {};
  const fine = ora + minuti * 60e3;
  for (let i = COLLEZIONI.indexOf(st.cursore.collezione); i >= 0 && i < COLLEZIONI.length; i++) {
    const c = COLLEZIONI[i];
    if (st.cursore.collezione !== c) st.cursore = { collezione: c, inizio: 1, voci: st.cursore.voci };
    for (;;) {
      if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${c}, record ${st.cursore.inizio}): riprenderà alla prossima esecuzione`); }
      const url = `${BASE}/digital/bl/dmwebservices/index.php?q=dmQuery/${c}/0/${CAMPI.join("!")}/nosort/${PAGINA}/${st.cursore.inizio}/0/0/0/0/json`;
      const r = await scarica(url, { timeout: 120000 });
      if (r.stato !== 200) throw new Error(`${c}: HTTP ${r.stato}`);
      const d = JSON.parse(r.testo), recs = d.records || [];
      st.totali[c] = +d.pager.total;
      for (const x of recs) { const v = compattaLaurenziana(x); if (v) st.cursore.voci[`${c}:${x.pointer}`] = v; }
      st.cursore.inizio += PAGINA;
      st.aggiornato = new Date().toISOString();
      salvaStato(st);
      if (!recs.length || st.cursore.inizio > st.totali[c]) break;
    }
    log("laurenziana", `${c}: ${st.totali[c]} record`);
  }
  st.voci = st.cursore.voci; delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("laurenziana", `fine: ${Object.keys(st.voci).length} codici`);
  return st;
}

// record compatti per il catalogo
export function recordLaurenziana(st = leggiStato()) {
  const out = [];
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!v) continue;
    const [alias, pointer] = k.split(":");
    out.push({ fonte: "laurenziana", id: `bml-${alias}-${pointer}`, citta: "Firenze", biblioteca: "Biblioteca Medicea Laurenziana", segnatura: segnaturaLaurenziana(v.s || k),
      datazione: v.d, titolo: v.t, autori_fonte: v.a, collaboratori: v.k || [], descrizione: v.c || null,
      manifest: `${BASE}/iiif/${alias}:${pointer}/manifest.json`, pagina: `${BASE}/digital/collection/${alias}/id/${pointer}`, licenza: v.r || null });
  }
  return out;
}
