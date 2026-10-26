// State Library Victoria, Melbourne: elenco raccolto dal browser (scripts/browser/slv.js -> data/slv.json), perché i server della
// biblioteca (rosetta.slv.vic.gov.au) rispondono 403 alle richieste che arrivano dai server e il catalogo (Primo) vieta la ricerca ai robot.
// Nessuna richiesta da qui. Manifesti IIIF Presentation 2.1: rosetta.slv.vic.gov.au/delivery/iiif/presentation/2.1/<IE…>/manifest
// (aperti dal browser con CORS, verificato il 25 ottobre 2026). Entrano i manoscritti di ogni data (dal 25 ottobre 2026 nessun
// limite cronologico) il cui titolo non è di una lettera, di carte d'archivio o di un dattiloscritto; senza data solo se il tipo di risorsa è «manuscript».
import fs from "node:fs";
import { lingueDa } from "../lingue.mjs";

export const FILE = "data/slv.json";
const NON_LIBRARI = /\b(letters?|correspondence|papers|diary|diaries|diario|records|accounts?|minutes|journals?|photograph|deeds?|receipts?|certificates?|telegram|typescripts?|licen[cs]e|ticket|notice|chequebook|galley|procession|diagram|map|sketch(book)?|log|logbook|field book|notes|notebooks?|reminiscences|reports?|pedigree|family tree|birthday book|newspaper|record of|historical record|account of)\b/i;

export function leggiSlv(file = FILE) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; } }

export function anniSlv(d) {
  const s = String(d || ""), out = (s.match(/\b1[0-9]{3}\b|\b[5-9][0-9]{2}\b/g) || []).map(Number);
  for (const m of s.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)\s+cent/gi)) out.push((+m[1] - 1) * 100 + 1);
  for (const m of s.matchAll(/\b1(\d)(?:--|\?\?)/g)) out.push(1001 + +m[1] * 100);   // «18--» = XIX secolo
  return out;
}

export function ammessaSlv(v) {
  if (!v || !v.t) return false;
  if (NON_LIBRARI.test(v.t)) return false;
  if (anniSlv(v.d).length) return true;
  return /manuscript/i.test(v.f || "");
}

export function recordSlv(st = leggiSlv()) {
  if (!st || !st.voci) return [];
  return Object.entries(st.voci).filter(([, v]) => ammessaSlv(v)).map(([ie, v]) => ({
    fonte: "slv", id: "slv-" + ie.toLowerCase(), citta: "Melbourne (Australia)", biblioteca: "State Library Victoria",
    segnatura: v.s || ie, datazione: v.d || null, titolo: v.t, autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []),
    manifest: `https://rosetta.slv.vic.gov.au/delivery/iiif/presentation/2.1/${ie}/manifest`, pagina: `https://viewer.slv.vic.gov.au/?entity=${ie}&mode=browse`,
    licenza: "condizioni della State Library Victoria" }));
}
