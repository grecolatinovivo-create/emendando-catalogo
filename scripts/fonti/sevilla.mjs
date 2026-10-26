// Biblioteca de la Universidad de Sevilla (Fondo Antiguo): la biblioteca pubblica le sue copie digitali su Internet Archive, nella
// collezione «bibliotecauniversitariadesevilla» (circa 28.000 volumi, quasi tutti stampati). Il sito della biblioteca
// (fondosdigitales.us.es) non si apre né dal server né dal browser (certificato non valido, prova del 26 ottobre 2026).
// Elenco: ricerca di Internet Archive (advancedsearch.php, consentita dal robots.txt), volumi con la materia «Manuscritos»
// (circa 1300), una richiesta sola. Manifesti IIIF Presentation 3 di Internet Archive (iiif.archive.org/iiif/3/<id>/manifest.json)
// e immagini con CORS aperto (prova del 26 ottobre 2026); licenza per lo più Public Domain Mark.
// Fuori i legajos dell'Archivo de Antonio Delgado, i pleitos e alegaciones, i conti, i «papeles varios» e le lettere (ammessaSevilla).
// Stato in data/sevilla.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/sevilla.json";
const CAMPI = ["identifier", "title", "date", "subject", "description", "language", "creator", "licenseurl", "imagecount"];
const GIORNI = 6;

export function leggiStato() { try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; } }
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const lista = x => (x == null ? [] : Array.isArray(x) ? x : [x]).map(s => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
// documento della ricerca -> voce compatta
export function compattaSevilla(x) {
  const desc = String([].concat(x.description || []).join(" "));
  const seg = (/SIGNATURA\s*(?:<[^>]+>\s*)*([^<]+)/.exec(desc) || [])[1];
  const fis = (/DESCR\. F[ÍI]SICA\s*(?:<[^>]+>\s*)*([^<]+)/.exec(desc) || [])[1];
  const nota = (/NOTA\s*(?:<[^>]+>\s*)*([^<]+)/.exec(desc) || [])[1];
  const v = { t: lista(x.title)[0] || null, d: String(x.date || "").slice(0, 4) || null, a: lista(x.creator), l: lista(x.language), m: lista(x.subject),
    s: seg ? seg.replace(/\s*Cat[áa]logo Fama.*$/, "").trim() || null : null, c: [fis, nota].filter(Boolean).join(" ; ") || null, r: lista(x.licenseurl)[0] || null, n: +x.imagecount || null };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

const FUORI_TITOLO = /^\s*\[?\s*(papeles|legajo|colecci[oó]n antonio delgado|libro de cuentas|cuentas|cartas?\s+(a|al|de)\b|correspondencia|pleito|alegaci[oó]n|porc[oó]n|expediente|escritura|modelos corp[oó]reos)/i;
export function ammessaSevilla(v) {
  if (!v || !v.t) return false;
  if (!(v.m || []).includes("Manuscritos")) return false;
  if ((v.m || []).some(s => /Archivo de Antonio Delgado|Porcones|Alegaciones|Pleitos/i.test(s))) return false;
  return !FUORI_TITOLO.test(v.t);
}

// «A330106» -> «A 330/106»; «A332020bis» -> «A 332/020 bis»
export function segnaturaSevilla(id, v) {
  if (v && v.s) return v.s;
  const m = /^([A-Z]{1,3})(\d{3})(\d{3})(.*)$/.exec(id);
  return m ? `${m[1]} ${m[2]}/${m[3]}${m[4] ? " " + m[4] : ""}` : id;
}

export async function scansionaSevilla({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("sevilla", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} volumi`); return st; }
  const q = new URLSearchParams({ q: "collection:bibliotecauniversitariadesevilla AND subject:(manuscritos)", rows: "5000", output: "json" });
  for (const c of CAMPI) q.append("fl[]", c);
  const r = await scarica(`https://archive.org/advancedsearch.php?${q}`, { timeout: 180000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
  const docs = JSON.parse(r.testo).response.docs || [];
  if (!docs.length) throw new Error("ricerca vuota");
  st.voci = Object.fromEntries(docs.map(x => [x.identifier, compattaSevilla(x)]));
  st.totale = docs.length;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("sevilla", `fine: ${docs.length} volumi con la materia «Manuscritos»`);
  return st;
}

export function recordSevilla(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaSevilla(v)).map(([id, v]) => ({
    fonte: "sevilla", id: "usev-" + id.toLowerCase(), citta: "Siviglia", biblioteca: "Biblioteca de la Universidad de Sevilla",
    segnatura: segnaturaSevilla(id, v), datazione: v.d || null, titolo: v.t, autori_fonte: v.a || [], descrizione: [v.c, (v.m || []).join(" ; ")].filter(Boolean).join(" ; ") || null,
    lingue: lingueDa(v.l || []), immagini: v.n || null, manifest: `https://iiif.archive.org/iiif/3/${id}/manifest.json`, pagina: `https://archive.org/details/${id}`,
    licenza: v.r || "Biblioteca de la Universidad de Sevilla (Internet Archive)" }));
}
