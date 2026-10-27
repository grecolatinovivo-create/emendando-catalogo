// Iraqi Jewish Archive (ijarchive.org): libri, documenti e oggetti della comunità ebraica di Baghdad ritrovati nel 2003, restaurati e
// digitalizzati dalla U.S. National Archives and Records Administration (NARA); il sito è curato dal CLIR. Dal 27 ottobre 2026, corsia
// «medioriente» (controllo dei paesi del Vicino Oriente e del Golfo, docs/COPERTURA.md).
// Come si legge: Omeka S, API REST pubblica (/api/items, 100 schede per pagina, 37 pagine per 3604 schede; nessun robots.txt, il sito
// risponde 404), in serie con la pausa di 1,5 secondi (rete.mjs). Il sito respinge gli user-agent generici delle librerie (403 a
// «Python-urllib»), non quello identificativo del catalogo. Manifesti IIIF Presentation 2 del modulo IIIF Server di Omeka
// (/iiif/2/<id>/manifest) e immagini del servizio Image 3 (/iiif/3/<media>), con CORS aperto (prova del 27 ottobre 2026).
// Diritti dichiarati dai manifesti: rightsstatements.org «CNE» (copyright non valutato).
// Che cosa entra: dei 3604 oggetti, quasi tutti libri a stampa e carte d'archivio (scuole, comunità, registri), entrano solo i
// manoscritti con la copia intera nelle immagini IIIF: i frammenti di rotoli della Torah e di Ester (circa 50, una o tre immagini
// ciascuno). Restano fuori i libri e i quaderni manoscritti (una decina) perché le immagini IIIF sono solo alcune pagine scelte e la
// copia intera è un PDF (motivoIja), i libri a stampa con postille, le carte d'archivio, le fotografie e i «tiq» (custodie dei rotoli).
// Stato in data/ija.json: elenco ogni 14 giorni, poi una lettura dei media (/api/media?item_id=) per ogni candidato nuovo.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/ija.json";
export const SITO = "https://ijarchive.org";
const GIORNI = 14, PER_PAGINA = 100;
export const LICENZA = "Iraqi Jewish Archive (U.S. National Archives and Records Administration; rightsstatements.org: copyright non valutato)";

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const val = (x, k) => (x[k] || []).filter(y => y.is_public !== false).map(y => String(y["@value"] ?? y["o:label"] ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
// titoli dei manoscritti librari (rotoli, frammenti di rotoli, libri e quaderni scritti a mano); fuori i «tiq», custodie dei rotoli
const LIBRARIO = /scroll fragment|handwritten (?:hebrew |judeo-arabic |arabic )?(?:book|notebook)|book in (?:hebrew|judeo-arabic|arabic)|manuscript on|^manuscript\b|handwritten notebook/i;
export function candidatoIja(x) {
  const m = val(x, "ija:metadata"), t = val(x, "dcterms:title")[0] || x["o:title"] || "";
  return m.includes("Handwritten") && !m.includes("Printed Text") && LIBRARIO.test(t) && !/\btiq\b/i.test(t);
}
// scheda Omeka S -> voce compatta { t: titolo, c: descrizione, l: lingue, r: tipo di materiale, s: numero IJA }
export function compattaIja(x) {
  const v = { t: val(x, "dcterms:title")[0] || x["o:title"] || null, c: (val(x, "dcterms:description")[0] || "").slice(0, 800) || null,
    l: val(x, "dcterms:language"), r: val(x, "ija:record_type")[0] || null, s: val(x, "ija:ija_number")[0] || null };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

async function json(url) {
  const r = await scarica(url, { timeout: 120000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`HTTP ${r.stato} ${url}`);
  return JSON.parse(r.testo);
}

export async function scansionaIja({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  st.voci = st.voci || {};
  // 1. elenco: tutte le schede, si tengono solo i candidati (manoscritti librari)
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const voci = {};
    let viste = 0;
    for (let p = 1; p <= 200; p++) {
      if (Date.now() > fine) throw new Error("tempo esaurito: l'elenco riprenderà da capo alla prossima esecuzione");
      const its = await json(`${SITO}/api/items?per_page=${PER_PAGINA}&page=${p}&sort_by=id&sort_order=asc`);
      if (!Array.isArray(its) || !its.length) break;
      viste += its.length;
      for (const x of its) if (x && x["o:id"] && candidatoIja(x)) {
        const id = String(x["o:id"]), prima = st.voci[id] || {};
        voci[id] = { ...compattaIja(x), ...(prima.i != null ? { i: prima.i, p: prima.p } : {}) };
      }
      if (its.length < PER_PAGINA) break;
    }
    if (viste < 1000) throw new Error(`elenco troppo corto (${viste} schede)`);
    st.voci = voci; st.totale = viste; st.elenco = new Date().toISOString(); st.completato = null;
    log("ija", `elenco: ${viste} schede, ${Object.keys(voci).length} manoscritti candidati`);
    salvaStato(st);
  }
  // 2. media dei candidati nuovi: immagini e PDF (una richiesta per candidato)
  let letti = 0;
  for (const [id, v] of Object.entries(st.voci)) {
    if (v.i != null || v.x) continue;
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`media letti in parte (${letti} in questo giro): riprenderà alla prossima esecuzione`); }
    try {
      const ms = await json(`${SITO}/api/media?item_id=${id}`);
      v.i = ms.filter(m => /^image\//.test(m["o:media_type"] || "")).length;
      v.p = ms.filter(m => m["o:media_type"] === "application/pdf").length;
      letti++;
    } catch (e) { v.x = e.message.slice(0, 80); }
  }
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("ija", `${recordIja(st).length} entrano su ${Object.keys(st.voci).length} candidati`);
  return st;
}

export function motivoIja(v) {
  if (!v) return "senza dati";
  if (v.x) return "media non leggibili";
  if (!v.i) return "senza immagini";
  if (v.p) return "copia intera solo in PDF (immagini IIIF di poche pagine scelte)";
  return null;
}
export const ammessaIja = v => motivoIja(v) == null;

const LINGUE = { hebrew: "he", aramaic: "xx", arabic: "ar", "judeo-arabic": "ar", english: "en", french: "fr" };
export function lingueIja(l) {
  const out = [];
  for (const x of l || []) { const c = LINGUE[String(x).toLowerCase()] || lingueDa(x)[0]; if (c && !out.includes(c)) out.push(c); }
  return out;
}

export function recordIja(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaIja(v)).map(([id, v]) => ({
    fonte: "ija", id: "ija-" + id, citta: "College Park (Stati Uniti), dalla comunità ebraica di Baghdad",
    biblioteca: "Iraqi Jewish Archive (U.S. National Archives and Records Administration)",
    segnatura: v.s ? `IJA ${v.s}` : `IJA, oggetto ${id}`, datazione: null, titolo: v.t || null, autori_fonte: [],
    descrizione: [/scroll fragment/i.test(v.t || "") ? "Frammento di rotolo" : null, v.c].filter(Boolean).join(" ; ") || null,
    lingue: lingueIja(v.l), immagini: v.i,
    manifest: `${SITO}/iiif/2/${id}/manifest`, pagina: `${SITO}/s/iraqi-jewish-archive/item/${id}`, licenza: LICENZA,
  }));
}
