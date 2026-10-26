// Chester Beatty, Dublino: Digital Collections su Goobi viewer (viewer.cbl.ie). Elenco dalle collezioni IIIF dell'API pubblica
// (/viewer/api/v1/collections/DC/ e /viewer/api/v1/collections/DC/<collezione>/, che elencano i manifesti), non dalla ricerca né
// dall'OAI, vietate dal robots.txt; il robots.txt chiede 10 secondi tra una richiesta e l'altra (scripts/rete.mjs).
// Di ogni manifesto (/viewer/api/v1/records/<PI>/manifest/, CORS aperto come le immagini) si legge una volta solo l'inizio con i
// metadati (Object no, Title, Production date, Language, Creator, gerarchia del tipo d'oggetto «Manuscript/Codex/...»).
// Fuori le collezioni di papiri (in attesa di decisione), tavolette e stampe; poi entrano solo i manoscritti librari (codici e loro
// fogli, rotoli di testo), non dipinti, pagine d'album, stampe, documenti (motivoCbl). Nessun limite di data.
// Stato in data/cbl.json: elenco ogni 6 giorni, ogni manifesto una volta sola (circa 3000: 8 ore e mezza in tutto, a riprese).
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { leggiTesta, leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/cbl.json";
export const API = "https://viewer.cbl.ie/viewer/api/v1";
export const LICENZA = "© Chester Beatty, Dublino (condizioni d'uso: chesterbeatty.ie)";
// ordine di lettura; fuori papiri, tavolette d'argilla, stampe e disegni
export const COLLEZIONI = ["westerncollection", "westernmiscellaneouscollection", "copticcollection", "syriaccollection", "armeniancollection", "ethiopiancollection",
  "hebrewcollection", "arabiccollection", "islamiccollection", "persiancollection", "turkishcollection", "indiancollection", "indiannonmughalcollection",
  "tibetancollection", "thaicollection", "burmesecollection", "sumatrancollection", "mongoliancollection", "chinesecollection", "japanesecollection"];
const GIORNI = 6;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale", "collezioni"]);

export function schedaCbl({ m }) {
  const u = k => (m[k] || [])[0] || null;
  return { s: u("Object no"), t: u("Title"), d: u("Production date"), l: (m.Language || []).slice(0, 3), a: [...(m.Creator || []), ...(m["Scribe and production place"] || [])].slice(0, 6),
    o: u("MD_OBJECT_NAME_HIERARCHY") || u("Object name"), y: u("Document type"), c: (u("Description") || "").slice(0, 1000) || null };
}

// motivo per cui la scheda resta fuori (null = entra)
export function motivoCbl(v) {
  if (!v) return "senza metadati";
  const o = v.o || "";
  if (/Codex/i.test(o)) return null;
  if (!/Manuscript/i.test(o) && !/Manuscript/i.test(v.y || "")) return "non manoscritto";
  if (/Album|Painting|Drawing|Print|Calligraph|Document|Letter|Amulet|Seal|Talisman|Photograph|Textile|Binding|Map/i.test(o)) return "non librario";
  if (/^(Detached|Single) (painting|calligraph)|album (page|leaf)/i.test(v.c || "")) return "non librario";
  return null;
}

export async function scansionaCbl({ minuti = 60, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const coll = {}, visti = new Set();
    for (const c of COLLEZIONI) {
      const r = await scarica(`${API}/collections/DC/${c}/`, { timeout: 180000, accept: "application/json" });
      if (r.stato === 404) continue;
      if (r.stato !== 200) throw new Error(`collezione ${c}: HTTP ${r.stato}`);
      const pis = (JSON.parse(r.testo).members || []).filter(x => /Manifest/.test(x["@type"] || "")).map(x => (/\/records\/([^/]+)\/manifest/.exec(x["@id"]) || [])[1]).filter(Boolean);
      coll[c] = pis.length;
      for (const pi of pis) { visti.add(pi); if (!(pi in st.voci)) st.voci[pi] = { q: 1, k: c }; }
    }
    st.collezioni = coll; st.totale = visti.size; st.elenco = st.aggiornato = new Date().toISOString();
    salva(st);
    log("cbl", `elenco: ${visti.size} oggetti in ${Object.keys(coll).length} collezioni`);
  }
  // ordine delle collezioni (gli oggetti orientali più numerosi, cinesi e giapponesi, per ultimi)
  const da = Object.keys(st.voci).filter(pi => st.voci[pi] && st.voci[pi].q).sort((a, b) => COLLEZIONI.indexOf(st.voci[a].k) - COLLEZIONI.indexOf(st.voci[b].k));
  let letti = 0, errori = 0;
  for (const pi of da) {
    if (Date.now() > fine) break;
    let r; try { r = await leggiTesta(`${API}/records/${pi}/manifest/`); } catch (e) { log("cbl", pi, e.message); if (++errori >= 5) break; continue; }
    errori = 0; letti++;
    st.voci[pi] = r.dati ? { ...schedaCbl(r.dati), k: st.voci[pi].k } : 0;
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salva(st); log("cbl", `${letti} manifesti letti su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  const resto = Object.values(st.voci).filter(v => v && v.q).length;
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  if (resto) throw new Error(`manifesti letti in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

export function recordCbl(st = leggiStato()) {
  const out = [];
  for (const [pi, v] of Object.entries(st.voci || {})) {
    if (!v || v.q || motivoCbl(v)) continue;
    out.push({ fonte: "cbl", id: "cbl-" + pi.toLowerCase().replace(/_/g, "-"), citta: "Dublino", biblioteca: "Chester Beatty", segnatura: v.s || pi.replace(/_/g, " "),
      datazione: v.d || null, titolo: v.t || null, autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa((v.l || []).map(x => x.replace(/\s*\(language\)/i, ""))),
      manifest: `${API}/records/${pi}/manifest/`, pagina: `https://viewer.cbl.ie/viewer/object/${pi}/1/`, licenza: LICENZA });
  }
  return out;
}
