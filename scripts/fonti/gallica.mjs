// Gallica / Bibliothèque nationale de France (e biblioteche partner di Gallica): tutti i manoscritti, di ogni fondo e lingua.
// Interfaccia SRU di Gallica (https://gallica.bnf.fr/SRU, risposta in Dublin Core), 50 record per pagina.
// Manifesto IIIF: https://gallica.bnf.fr/iiif/ark:/12148/<id>/manifest.json
//
// Gallica respinge le richieste dai server (GitHub compreso): la raccolta si fa dal browser con scripts/browser/gallica.js,
// che salva data/gallica.json (formato 2: record compatti, uno per scheda). Se la lettura diretta fallisce si usano quei dati.
// Il formato 1 (raccolta dal browser del 2026-10-24, solo fondi latini: campo «voci» già nel formato del catalogo) resta leggibile.
import fs from "node:fs";
import { scarica, statoFonte, tag, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const RACCOLTA_BROWSER = "data/gallica.json";
export const BASE = "https://gallica.bnf.fr/SRU";
// tutti i documenti di tipo «manuscrit» (anche delle biblioteche partner); la stessa interrogazione è in scripts/browser/gallica.js
export const QUERY = 'dc.type all "manuscrit"';
const PAGINA = 50;
const VERSIONE = 2;

function daBrowser(motivo) {
  let d = null; try { d = JSON.parse(fs.readFileSync(RACCOLTA_BROWSER, "utf8")); } catch (e) {}
  if (d && Array.isArray(d.record) && d.record.length) {
    log("gallica", `${motivo}: uso la raccolta fatta dal browser il ${String(d.raccolto || "").slice(0, 10)} (${d.record.length} schede)`);
    return unici(d.record.map(recordGallica).filter(Boolean));
  }
  if (d && Array.isArray(d.voci) && d.voci.length) {
    log("gallica", `${motivo}: uso la raccolta (formato 1) fatta dal browser il ${String(d.raccolto || "").slice(0, 10)} (${d.voci.length} codici)`);
    return d.voci;
  }
  throw new Error(motivo);
}
const unici = rs => [...new Map(rs.map(v => [v.id, v])).values()];

// «Bibliothèque nationale de France. Département des Manuscrits. Latin 7899» -> «Latin 7899» (qualunque fondo: Grec 2934, Français 2, Arabe 1, NAL 1132...)
export function segnaturaGallica(fonti) {
  for (const s of [].concat(fonti || [])) {
    const m = /D[ée]partement des manuscrits[.,]?\s*(.+)$/i.exec(s);
    if (m && /\d/.test(m[1])) return m[1].replace(/\s+/g, " ").replace(/[ ,.;-]+$/, "").trim();
  }
  return null;
}

// fonte (dc:source) -> { biblioteca, citta, segnatura }
export function luogoGallica(fonti) {
  const seg = segnaturaGallica(fonti);
  if (seg) return { biblioteca: "Bibliothèque nationale de France", citta: "Paris", segnatura: seg };
  for (const s0 of [].concat(fonti || [])) {
    const s = String(s0 || "").replace(/\s+/g, " ").trim(); if (!s || !/\d/.test(s)) continue;
    // «Bibliothèque nationale de France. Bibliothèque de l'Arsenal. Ms-5070», «Bibliothèque municipale de Tours, Ms. 924»
    // parti separate da «, » o da «. » seguito da maiuscola; la segnatura è l'ultima parte con un numero
    // (unita alla precedente se è solo un numero o se la precedente è un'abbreviazione come «Ms», «Cod», «Latin»)
    const parti = s.split(/\.\s+(?=[A-ZÀ-Ý])|,\s+/).map(x => x.trim()).filter(Boolean);
    let k = parti.length - 1; while (k > 0 && !/\d/.test(parti[k])) k--;
    let i = k;
    if (i > 0 && (/^[\d\s()a-z-]+$/i.test(parti[k]) && /^\d/.test(parti[k]) || /^(ms|mss|cod|codex|fonds?|latin|grec|fr|nal|naf)$/i.test(parti[k - 1]))) i--;
    const biblioteca = parti.slice(0, i).filter(x => !/^d[ée]partement/i.test(x)).join(", ") || "Gallica";
    const nazionale = /biblioth[èe]que nationale de france/i.test(biblioteca);
    const arsenal = /arsenal/i.test(s);
    const citta = nazionale || arsenal ? "Paris" : ((/\b(?:de|d')\s*([A-ZÀ-Ý][\w'À-ÿ-]+(?:[- ][A-ZÀ-Ý][\w'À-ÿ-]+)*)\s*$/.exec(biblioteca) || [])[1] || null);
    return { biblioteca: arsenal ? "Bibliothèque de l'Arsenal (BnF)" : biblioteca, citta, segnatura: parti.slice(i, k + 1).join(" ") };
  }
  return null;
}

// record SRU (Dublin Core) -> scheda compatta (lo stesso formato che produce scripts/browser/gallica.js)
export function compattaGallica(rec) {
  const pagina = tag(rec, "dc:identifier").find(x => /gallica\.bnf\.fr\/ark:\/12148\//.test(x)); if (!pagina) return null;
  const k = /ark:\/12148\/([a-z0-9]+)/i.exec(pagina)[1];
  return { k, y: tag(rec, "dc:type"), t: tag(rec, "dc:title").join(" ; ").slice(0, 600), c: tag(rec, "dc:creator"), d: tag(rec, "dc:date")[0] || null,
    s: tag(rec, "dc:source"), l: tag(rec, "dc:language"), x: [...tag(rec, "dc:description"), ...tag(rec, "dc:subject")].join(" ; ").slice(0, 1500),
    r: tag(rec, "dc:rights").join(" ") };
}

// scheda compatta -> record del catalogo (null se non è un manoscritto o non ha una segnatura)
export function recordGallica(o) {
  if (!o || !o.k) return null;
  if (o.y && o.y.length && !o.y.some(t => /manuscrit/i.test(t))) return null;
  const L = luogoGallica(o.s); if (!L) return null;
  return { fonte: "gallica", id: "bnf-" + o.k, ...L, datazione: o.d || null, titolo: o.t || null, autori_fonte: o.c || [], lingue: lingueDa(o.l || []),
    descrizione: o.x || null, manifest: `https://gallica.bnf.fr/iiif/ark:/12148/${o.k}/manifest.json`, pagina: `https://gallica.bnf.fr/ark:/12148/${o.k}`,
    licenza: /domaine public|public domain/i.test(o.r || "") ? "Domaine public (Gallica, conditions d'utilisation)" : ((o.r || "").slice(0, 200) || null) };
}

export const estraiGallica = rec => recordGallica(compattaGallica(rec));

export async function raccogliGallica(opz = {}) {
  try { return await raccogliDiretta(opz); }
  catch (e) { return daBrowser(e.message); }
}

async function raccogliDiretta({ limiteMinuti = 0, soloCache = false, giorni = 6 } = {}) {
  const st = statoFonte("gallica"), ora = Date.now();
  let d = st.dati;
  if (d && d.versione !== VERSIONE) d = null;
  if (soloCache) { if (!d || !d.completato) throw new Error("nessuna raccolta completa in cache"); return d.voci; }
  if (d && d.completato && ora - d.completato < giorni * 864e5) { log("gallica", `riuso la raccolta del ${new Date(d.completato).toISOString().slice(0, 10)}: ${d.voci.length} record`); return d.voci; }
  if (!d || d.completato || ora - d.aggiornato > 3 * 864e5) d = { versione: VERSIONE, iniziato: ora, aggiornato: ora, inizio: 1, voci: [] };
  else log("gallica", `riprendo dal record ${d.inizio} (${d.voci.length} già letti)`);
  const fine = limiteMinuti ? ora + limiteMinuti * 60e3 : Infinity;
  for (;;) {
    const url = `${BASE}?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(QUERY)}&startRecord=${d.inizio}&maximumRecords=${PAGINA}`;
    const r = await scarica(url, { timeout: 120000, accept: "application/xml,text/xml" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    if (!/searchRetrieveResponse/.test(r.testo)) throw new Error("risposta non SRU (blocco o pagina di errore)");
    const recs = r.testo.match(/<srw:record>[\s\S]*?<\/srw:record>/g) || [];
    for (const rec of recs) { const v = estraiGallica(rec); if (v) d.voci.push(v); }
    const tot = +((/<srw:numberOfRecords>(\d+)/.exec(r.testo) || [])[1] || 0);
    d.inizio += PAGINA; d.aggiornato = Date.now(); d.totale = tot;
    if ((d.inizio - 1) % 1000 === 0) log("gallica", `${d.inizio - 1} su ${tot}, ${d.voci.length} manoscritti`);
    if (!recs.length || d.inizio > tot) { d.completato = Date.now(); st.salva(d); break; }
    st.salva(d);
    if (Date.now() > fine) throw new Error(`raccolta incompleta (${d.inizio - 1} su ${tot}): riprenderà alla prossima esecuzione`);
  }
  // un codice può comparire con più record (volumi, riproduzioni): uno per ark
  return unici(d.voci);
}
