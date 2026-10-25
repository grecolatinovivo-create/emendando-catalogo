// Biblioteca Casanatense, Roma: biblioteca digitale su CONTENTdm (casanatense.contentdm.oclc.org), collezione «Manoscritti»
// (circa 40 codici, dal XII secolo). Come per la Laurenziana si usa l'API dmwebservices (dmQuery, una pagina di 200 record), che il
// robots.txt non vieta (vieta le pagine di ricerca del sito e /oai/; Crawl-Delay: 1, si usa la pausa di 1,5 secondi).
// Le altre collezioni (Miniature e illustrazioni, Fondo antico, Rari, Incunaboli, stampe, fotografie, bandi, archivi) sono
// immagini singole, libri a stampa o carte d'archivio: restano fuori.
// Manifesti IIIF (Presentation 2) e immagini di CONTENTdm con CORS aperto (prova del 25 ottobre 2026).
// Lo stato è in data/casanatense.json; una raccolta completa (una richiesta) si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/casanatense.json";
export const BASE = "https://casanatense.contentdm.oclc.org";
export const COLLEZIONE = "manoscritti";
const CAMPI = ["title", "titolo", "creato", "contri", "aa", "descri", "langua", "shelfm", "rightsa", "luogo", "type"];
const GIORNI = 6;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => +a - +b).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const pulito = s => (typeof s === "string" ? s : "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const lista = s => pulito(s).split(";").map(x => x.trim()).filter(Boolean);

// record di dmQuery -> voce compatta (null per le pagine figlie e per ciò che non è un manoscritto)
export function compattaCasanatense(r) {
  if (!r || r.parentobject !== -1) return null;
  if (r.type && !/manoscritt/i.test(pulito(r.type))) return null;
  const v = { s: pulito(r.shelfm) || pulito(r.title) || null, t: pulito(r.titolo) || null, a: lista(r.creato), d: pulito(r.aa) || null, l: lista(r.langua), r: pulito(r.rightsa) || null };
  const k = lista(r.contri); if (k.length) v.k = k;
  const c = [pulito(r.descri), pulito(r.luogo)].filter(Boolean).join(" ; ").slice(0, 3000); if (c) v.c = c;
  return v;
}

export async function scansionaCasanatense({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("casanatense", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const voci = {};
  let inizio = 1, totale = 0;
  const fine = Date.now() + minuti * 60e3;
  for (;;) {
    if (Date.now() > fine) throw new Error("raccolta incompleta: si rifà alla prossima esecuzione");
    const r = await scarica(`${BASE}/digital/bl/dmwebservices/index.php?q=dmQuery/${COLLEZIONE}/0/${CAMPI.join("!")}/nosort/200/${inizio}/0/0/0/0/json`, { timeout: 120000 });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const d = JSON.parse(r.testo), recs = d.records || [];
    totale = +d.pager.total;
    for (const x of recs) { const v = compattaCasanatense(x); if (v) voci[x.pointer] = v; }
    inizio += 200;
    if (!recs.length || inizio > totale) break;
  }
  st.voci = voci; st.totale = totale; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("casanatense", `${Object.keys(voci).length} codici`);
  return st;
}

// «Ms.716» -> «Ms. 716»
export const segnaturaCasanatense = s => pulito(s).replace(/^Ms\.\s*/i, "Ms. ");

export function recordCasanatense(st = leggiStato()) {
  return Object.entries((st && st.voci) || {}).filter(([, v]) => v).map(([p, v]) => ({
    fonte: "casanatense", id: `bcas-${p}`, citta: "Roma", biblioteca: "Biblioteca Casanatense", segnatura: segnaturaCasanatense(v.s || p), datazione: v.d || null,
    titolo: v.t || null, autori_fonte: v.a || [], collaboratori: v.k || [], descrizione: v.c || null, lingue: lingueDa(v.l || []).filter(c => c !== "xx"),
    manifest: `${BASE}/iiif/2/${COLLEZIONE}:${p}/manifest.json`, pagina: `${BASE}/digital/collection/${COLLEZIONE}/id/${p}`,
    licenza: v.r && !/^pubblico$/i.test(v.r) ? v.r : "Biblioteca Casanatense (MiC): accesso pubblico" }));
}
