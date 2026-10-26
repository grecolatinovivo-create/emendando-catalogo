// Northwestern University Libraries, Melville J. Herskovits Library of African Studies (Evanston): manoscritti arabi e in ajami
// dell'Africa occidentale (Nigeria settentrionale, soprattutto Kano e Sokoto; Ghana, Senegal, Mali), collezione «Arabic Manuscripts
// from West Africa» (fondi Falke, Hunwick, Paden, Ghana). Dal 26 ottobre 2026, corsia «mondo».
// Come si legge: l'API pubblica delle Digital Collections (api.dc.library.northwestern.edu/api/v2, documentata, senza robots.txt;
// il sito dc.library.northwestern.edu respinge i server ma non serve): una sola ricerca POST con la collezione, i campi ridotti
// con «_source» (le schede complete hanno anche vettori di ricerca pesanti), 100 schede per pagina.
// Manifesti IIIF Presentation 3 (api.dc.library.northwestern.edu/api/v2/works/<id>?as=iiif) e immagini (iiif.dc.library.northwestern.edu,
// Image API 3) con CORS aperto all'origine che chiede (prova del 26 ottobre 2026 da www.emendando.com).
// Entrano solo le schede pubbliche e pubblicate di tipo «Image» (tutti codici e opuscoli manoscritti; nessuna carta d'archivio).
// Condizioni: «No Copyright - United States»; la biblioteca chiede uso di studio e ricerca, niente usi commerciali.
// Stato in data/northwestern.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/northwestern.json";
export const API = "https://api.dc.library.northwestern.edu/api/v2";
export const COLLEZIONI = { "59ec43f9-a96c-4314-9b44-9923790b371c": "Arabic Manuscripts from West Africa" };
const BIBLIOTECA = "Northwestern University Libraries, Melville J. Herskovits Library of African Studies";
const GIORNI = 6, PAGINA = 100;
const CAMPI = ["id", "title", "alternate_title", "identifier", "date_created", "language.label", "contributor.label", "contributor.role",
  "description", "series", "physical_description_material", "physical_description_size", "visibility", "published", "work_type",
  "iiif_manifest", "rights_statement.label", "subject.label"];

export function leggiStato() { try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; } }
function salva(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const pulito = s => String(s ?? "").replace(/\s+/g, " ").trim();
const lista = x => [].concat(x ?? []).map(pulito).filter(Boolean);

// scheda dell'API -> voce compatta (null se non entra)
export function compattaNorthwestern(w) {
  if (!w || !w.id || !w.iiif_manifest) return null;
  if (w.visibility !== "Public" || w.published === false || w.work_type !== "Image") return null;
  const ids = lista(w.identifier);
  // segnatura: il numero del fondo («Hunwick 7 MS», «Falke 1284 ME», «Paden 438 ME», «Ghana 8 MSX»); il numero del West African
  // Arabic Manuscript Project va nella descrizione
  const s = ids.find(x => !/West African Arabic Manuscript Project/i.test(x)) || ids[0] || null;
  const wamp = ids.filter(x => x !== s);
  const d = lista(w.date_created)[0] || null;
  const autori = (w.contributor || []).filter(c => !/collection/i.test(c.label || "") && (!c.role || /author|creator|scribe|copyist/i.test(c.role.label || c.role || "")))
    .map(c => pulito(c.label)).filter(Boolean);
  const v = { s, t: pulito(w.title).slice(0, 400) || null,
    // datazioni segnaposto del catalogo («650? to 2010?»): niente
    d: d && !/^650\?/.test(d) ? d : null,
    l: (w.language || []).map(x => x.label).filter(Boolean), a: [...new Set(autori)].slice(0, 8),
    c: [...lista(w.description), ...lista(w.alternate_title), ...lista(w.series), ...lista(w.physical_description_material), ...lista(w.physical_description_size),
      ...(w.subject || []).map(x => x.label).filter(Boolean), ...wamp].join(" ; ").slice(0, 3000) || null,
    m: w.iiif_manifest, r: w.rights_statement ? w.rights_statement.label : null };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

export async function scansionaNorthwestern({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("northwestern", `riuso la raccolta del ${st.completato.slice(0, 10)}`); return st; }
  const fine = Date.now() + minuti * 60e3, voci = {}, totali = {};
  for (const [c, nome] of Object.entries(COLLEZIONI)) {
    for (let p = 1; ; p++) {
      if (Date.now() > fine) throw new Error("raccolta incompleta: riprenderà alla prossima esecuzione");
      const corpo = JSON.stringify({ query: { term: { "collection.id": c } }, _source: CAMPI, size: PAGINA, sort: [{ id: "asc" }] });
      const r = await scarica(`${API}/search?size=${PAGINA}&page=${p}`, { json: corpo, accept: "application/json", timeout: 120000 });
      if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
      const d = JSON.parse(r.testo);
      totali[nome] = d.pagination.total_hits;
      for (const w of d.data || []) { const v = compattaNorthwestern(w); if (v) voci[w.id] = v; }
      if (!(d.data || []).length || p >= d.pagination.total_pages) break;
    }
  }
  if (!Object.keys(voci).length) throw new Error("nessuna scheda letta");
  st.voci = voci; st.totali = totali;
  st.completato = st.aggiornato = new Date().toISOString();
  salva(st);
  log("northwestern", `fine: ${Object.keys(voci).length} codici`);
  return st;
}

export function recordNorthwestern(st = leggiStato()) {
  const out = [];
  for (const [id, v] of Object.entries(st.voci || {})) {
    out.push({ fonte: "northwestern", id: "nu-" + id, citta: "Evanston", biblioteca: BIBLIOTECA, segnatura: v.s ? "Herskovits, " + v.s : id, datazione: v.d || null,
      titolo: v.t || null, autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []), manifest: v.m,
      pagina: `https://dc.library.northwestern.edu/items/${id}`,
      licenza: `Northwestern University Libraries${v.r ? ", " + v.r : ""} (uso di studio e ricerca, niente usi commerciali)` });
  }
  return out;
}
