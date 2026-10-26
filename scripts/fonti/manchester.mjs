// Manchester Digital Collections (www.digitalcollections.manchester.ac.uk), University of Manchester Library, John Rylands Research
// Institute and Library: la stessa piattaforma della Cambridge Digital Library. Il robots.txt non pone limiti e indica la sitemap
// (/sitemap.xml, circa 6900 oggetti): da lì si prendono gli identificativi dei manoscritti (prefisso «MS-»: Latin, Greek, English,
// Hebrew, Gaster, Persian, Arabic, Syriac, Samaritan, Ethiopic, Pali...); fuori archivi (AR-), stampati (PR-), oggetti di mostre di
// altre istituzioni (EX-) e il resto. Di ogni manifesto (/iiif/<id>, CORS aperto, immagini su image.digitalcollections.manchester.ac.uk
// con CORS aperto) si legge solo l'inizio con i metadati. Entrano i manoscritti librari di ogni data: fuori lettere, documenti,
// fogli singoli, amuleti (motivoManchester). Stato in data/manchester.json: elenco ogni 6 giorni, ogni manifesto una volta sola.
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { leggiTesta, schedaCudl, motivoCudl, leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/manchester.json";
export const SITO = "https://www.digitalcollections.manchester.ac.uk";
export const LICENZA = "University of Manchester Library: zoom © University of Manchester; immagini scaricabili e metadati CC BY-NC 4.0 (secondo il codice)";
const GIORNI = 6;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale"]);

// identificativi della sitemap -> solo i manoscritti (MS-...)
export function idsSitemap(xml) {
  return [...new Set([...String(xml).replace(/\s+/g, "").matchAll(/\/view\/([A-Z0-9][A-Z0-9-]*[A-Z0-9])/g)].map(m => m[1]))].filter(id => /^MS-/.test(id));
}

// motivo per cui la scheda resta fuori (null = entra)
export function motivoManchester(v) {
  if (!v) return "senza metadati";
  // parti di fondi d'archivio («English MS 1197/11»: un foglio di un fascicolo)
  if (/\/\d/.test(v.s || "") && !/codex|volume/i.test(v.f || "")) return "parte di un fondo d'archivio";
  if (/amulet/i.test([v.f, v.s].join(" "))) return "amuleto";
  // pannelli e coperte di legature (avori, smalti): oggetti, non manoscritti
  if (/^Book-covers\b/i.test(v.s || "") || /binding/i.test(v.f || "")) return "coperta di legatura";
  return motivoCudl(v);
}

export async function scansionaManchester({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const r = await scarica(`${SITO}/sitemap.xml`, { timeout: 180000 });
    if (r.stato !== 200) throw new Error(`sitemap: HTTP ${r.stato}`);
    const ids = idsSitemap(r.testo);
    if (!ids.length) throw new Error("sitemap senza manoscritti");
    for (const id of ids) if (!(id in st.voci)) st.voci[id] = { q: 1 };
    st.totale = ids.length; st.elenco = st.aggiornato = new Date().toISOString();
    salva(st);
    log("manchester", `elenco: ${ids.length} manoscritti nella sitemap`);
  }
  const da = Object.keys(st.voci).filter(id => st.voci[id] && st.voci[id].q);
  let letti = 0, errori = 0;
  for (const id of da) {
    if (Date.now() > fine) break;
    let r; try { r = await leggiTesta(`${SITO}/iiif/${id}`); } catch (e) { log("manchester", id, e.message); if (++errori >= 5) break; continue; }
    errori = 0; letti++;
    st.voci[id] = r.dati ? schedaCudl(r.dati) : 0;
    if (letti % 25 === 0) { st.aggiornato = new Date().toISOString(); salva(st); log("manchester", `${letti} manifesti letti su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  const resto = Object.values(st.voci).filter(v => v && v.q).length;
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  if (resto) throw new Error(`manifesti letti in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

export function recordManchester(st = leggiStato()) {
  const out = [];
  for (const [id, v] of Object.entries(st.voci || {})) {
    if (!v || v.q || motivoManchester(v)) continue;
    out.push({ fonte: "manchester", id: "mdc-" + id.toLowerCase(), citta: "Manchester", biblioteca: "John Rylands Research Institute and Library, University of Manchester",
      segnatura: v.s || id, datazione: v.d || null, titolo: [v.t, v.u].filter(Boolean).join(" ; ") || null, autori_fonte: v.au || [], descrizione: v.c || null,
      lingue: lingueDa(v.x || []), manifest: `${SITO}/iiif/${id}`, pagina: `${SITO}/view/${id}`, licenza: v.r ? `University of Manchester Library, ${v.r}` : LICENZA });
  }
  return out;
}
