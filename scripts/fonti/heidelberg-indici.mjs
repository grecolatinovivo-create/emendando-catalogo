// Heidelberg: indice dei contenuti delle miscellanee. Molti codici sono descritti nell'OAI in modo generico
// («Sammelhandschrift», titolo vuoto o di sola materia): il loro manifesto IIIF ha però le «structures»
// (sezioni del codice con il titolo di ogni testo: «Bacchides», «Vergil, Aeneis»...). Per i codici latini che
// l'OAI da solo non fa riconoscere si legge il manifesto (prima i generici) e se ne conservano i titoli delle sezioni
// in data/heidelberg-indici.json (stato committato, si riprende da dove ci si era fermati; [] = nessun indice utile).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/heidelberg-indici.json";
const VUOTE = /^(einband|vorderdeckel|r[üu]ckdeckel|r[üu]cken|schnitt|spiegel|vorsatz|nachsatz|ma[ßs]stab|farbkeil|fragment|fragmente|leerseite|leerseiten|leer|inhaltsverzeichnis|titelblatt|register|vorderer spiegel|hinterer spiegel|deckel|maßstab\/farbkeil|blatt \d+|fol\.?\s*\d+.*|\d+[rv]?(-\d+[rv]?)?)$/i;
export const GENERICO = /sammelhandschrift|sammelband|miscellan|schriften|florileg|exzerpt|kompilation|varia|fragmente|^\s*$/i;

export function leggiIndici() { try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; } }
function salva(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  fs.writeFileSync(FILE_STATO + ".tmp", `{"aggiornato":${JSON.stringify(st.aggiornato || null)},"voci":{\n${righe.join(",\n")}\n}}\n`);
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const testo = v => [].concat(v ?? []).map(y => typeof y === "string" ? y : y && (y["@value"] || Object.values(y).flat().filter(z => typeof z === "string")[0] || "")).join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// titoli delle sezioni di un manifesto IIIF (v2 «structures», v3 «structures» con items annidati), senza le parti materiali
export function titoliSezioni(man) {
  const out = [];
  const visita = r => {
    if (!r || typeof r !== "object") return;
    const l = testo(r.label);
    if (l && !VUOTE.test(l) && !out.includes(l)) out.push(l);
    for (const x of r.items || r.members || []) if (x && (x.type === "Range" || x["@type"] === "sc:Range")) visita(x);
  };
  for (const r of man.structures || []) visita(r);
  return out.slice(0, 120);
}

const slugDi = r => r.id.replace(/^hd-/, "");

/* candidati: codici Heidelberg che l'OAI non fa riconoscere (riconosciuto(r) falso); prima le descrizioni generiche */
export async function leggiIndiciHeidelberg(records, riconosciuto, { minuti = 20 } = {}) {
  const st = leggiIndici(), fine = Date.now() + minuti * 60e3;
  const cand = records.filter(r => !(slugDi(r) in st.voci) && !riconosciuto(r))
    .sort((a, b) => (GENERICO.test(b.titolo || "") ? 1 : 0) - (GENERICO.test(a.titolo || "") ? 1 : 0));
  log("heidelberg-indici", `${cand.length} manifesti da leggere (${cand.filter(r => GENERICO.test(r.titolo || "")).length} miscellanee generiche)`);
  let letti = 0;
  for (const r of cand) {
    if (Date.now() > fine) break;
    let x; try { x = await scarica(r.manifest, { timeout: 180000, tentativi: 2 }); } catch (e) { log("heidelberg-indici", r.id, e.message); break; }
    letti++;
    let titoli = [];
    if (x.stato === 200) { try { titoli = titoliSezioni(JSON.parse(x.testo)); } catch (e) {} }
    st.voci[slugDi(r)] = titoli;
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salva(st); log("heidelberg-indici", `${letti} manifesti letti`); }
  }
  st.aggiornato = new Date().toISOString(); salva(st);
  log("heidelberg-indici", `fine: ${letti} letti, ${Object.keys(st.voci).length} in archivio`);
  return st;
}

// aggiunge ai record il campo «indice» (titoli delle sezioni)
export function conIndici(records, st = leggiIndici()) {
  return records.map(r => { const t = st.voci[slugDi(r)]; return t && t.length ? { ...r, indice: t.join(" ; ").slice(0, 4000) } : r; });
}
