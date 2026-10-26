// Biblioteca Classense, Ravenna: «Collezioni Digitali Classensi» (www.cdc.classense.ra.it, Omeka S), insieme «Manoscritti»
// (item set 25527: 28 oggetti il 26 ottobre 2026, tra cui l'Aristofane Ravennate, MS 429). Elenco raccolto dal browser
// (scripts/browser/classense.js -> data/classense.json), perché il sito risponde 403 alle richieste che arrivano dai server e il
// robots.txt vieta l'API (/api/): lo script legge la pagina pubblica dell'insieme e i manifesti IIIF.
// Nessuna richiesta da qui. Manifesti IIIF Presentation 2 (www.cdc.classense.ra.it/iiif/2/<id>/manifest) e info.json del servizio
// Image con CORS aperto (verificato dal browser il 26 ottobre 2026). Entrano i codici con almeno due immagini: fuori i disegni
// sciolti inseriti nelle miscellanee e le schede con una sola immagine (per esempio MS 374, Giornale di Ravenna).
import fs from "node:fs";
import { lingueDa } from "../lingue.mjs";

export const FILE = "data/classense.json";
export const SITO = "https://www.cdc.classense.ra.it";
export function leggiClassense(file = FILE) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; } }
const LINGUE = { latino: "la", greco: "grc", italiano: "it", volgare: "it", francese: "fr", ebraico: "he", arabo: "ar", tedesco: "de", spagnolo: "es" };

export const ammessaClassense = v => !!(v && v.n >= 2 && !/^(Dissegno|Disegno)\b/i.test(v.t || ""));

export function recordClassense(st = leggiClassense()) {
  if (!st || !st.voci) return [];
  return Object.entries(st.voci).filter(([, v]) => ammessaClassense(v)).map(([id, v]) => ({
    fonte: "classense", id: "cls-" + id, citta: "Ravenna", biblioteca: "Biblioteca Classense",
    segnatura: v.s || id, datazione: v.d || null, titolo: v.t || null, autori_fonte: (v.a || []).filter(a => !/^Anonimo$/i.test(a)), descrizione: v.c || null,
    lingue: [...new Set((v.l || []).map(l => LINGUE[String(l).toLowerCase()] || lingueDa([l])[0]).filter(Boolean))], immagini: v.n || null,
    manifest: `${SITO}/iiif/2/${id}/manifest`, pagina: `${SITO}/s/Classense/item/${id}`, licenza: "condizioni d'uso della Biblioteca Classense" }));
}
