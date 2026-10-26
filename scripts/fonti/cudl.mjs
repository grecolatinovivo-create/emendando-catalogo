// Cambridge Digital Library (cudl.lib.cam.ac.uk): Cambridge University Library e college (latini, greci, orientali, ebraici...).
// Dal 26 ottobre 2026 l'elenco si legge dal server: le pagine del sito (/collections, ricerca, sitemap, robots.txt) rispondono 403
// ai server, ma le collezioni IIIF no: /iiif/collection/all elenca le collezioni, /iiif/collection/<slug> i manifesti di ciascuna.
// Si leggono solo le collezioni di manoscritti (COLLEZIONI) e, di ogni manifesto (cudl.lib.cam.ac.uk/iiif/<id>, CORS aperto, come le
// immagini di images.lib.cam.ac.uk), solo l'inizio con i metadati (Classmark, Title, Date of Creation, Language(s), Format...).
// Entrano i manoscritti librari di ogni data; fuori lettere, carte, stampati, fotografie (motivoCudl). La Genizah (circa 142.000
// frammenti) resta fuori. Stato in data/cudl.json: elenco ogni 6 giorni, ogni manifesto una volta sola.
// Immagini: zoom © University Library; le immagini scaricabili sono CC BY-NC 4.0; metadati CC BY-NC-ND 4.0.
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { leggiTesta, schedaCudl, motivoCudl, leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_DATI = "data/cudl.json";
export const SITO = "https://cudl.lib.cam.ac.uk";
export const LICENZA = "Cambridge University Library: immagini scaricabili CC BY-NC 4.0 (zoom © University Library); metadati CC BY-NC-ND 4.0";
// collezioni di manoscritti, nell'ordine di lettura (prima i medievali e i greci)
export const COLLEZIONI = ["medieval", "greekmanuscripts", "codexzacynthius", "christian", "hebrew", "islamic", "ethiopianmanuscripts", "minganalewis", "lewisgibson",
  "sanskrit", "ras", "aiit", "shahnama", "music", "treasures", "scriptorium", "medievalmedicalrecipes", "paperstocks", "linesofthought", "merlinfragment", "explosivewace",
  "thomasgray", "universitylibrary", "corpuschristicollege", "gonvilleandcaius", "peterhouse", "pembroke", "stjohns", "sidneysussex", "trinityhall", "clare", "christs",
  "queens", "stcatharines", "magdalenecollege", "downing", "girton", "newnham", "westminster", "kingsrarebooksandmanuscripts", "chinese", "japanese", "koreanworks"];
const GIORNI = 6;
const CARTE = /\b(letters?|correspondence|papers|photograph|map|notebook|diary|printed book|archive|typescripts?)\b/i;

export function leggiDati() { return leggiJson(FILE_DATI, null); }
const salva = st => salvaJson(FILE_DATI, st, ["formato", "aggiornato", "elenco", "completato", "totale", "collezioni"]);

// «Cambridge, University Library, MS Nn.2.41» -> { biblioteca: «Cambridge University Library», segnatura: «MS Nn.2.41» }
export function dividiCudl(s, p) {
  const t = String(s || "").replace(/^Cambridge,\s*/, "");
  const m = /^(.*?(?:Library|College|Museum|Institute|Society|Trust|Hall)[^,]*),\s*(.+)$/.exec(t);
  let biblioteca = m ? m[1] : p || "Cambridge University Library", segnatura = m ? m[2] : t || null;
  if (/^(Cambridge )?University Library$/.test(biblioteca)) biblioteca = "Cambridge University Library";
  return { biblioteca, segnatura };
}

/* raccolta: elenco delle collezioni (ogni 6 giorni), poi l'inizio dei manifesti non ancora letti, finché c'è tempo */
export async function scansionaCudl({ minuti = 30, soloCache = false } = {}) {
  const st = leggiDati() || {};
  if (soloCache) return st;
  if (st.formato !== 2) { st.formato = 2; st.voci = {}; st.elenco = null; st.completato = null; }
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const coll = {}, visti = {};
    for (const c of COLLEZIONI) {
      const r = await scarica(`${SITO}/iiif/collection/${c}`, { timeout: 180000 });
      if (r.stato === 404) { log("cudl", `collezione ${c}: non c'è più`); continue; }
      if (r.stato !== 200) throw new Error(`collezione ${c}: HTTP ${r.stato}`);
      const ms = (JSON.parse(r.testo).manifests || []).map(m => String(m["@id"] || "").split("/iiif/")[1]).filter(Boolean);
      coll[c] = ms.length;
      for (const id of ms) (visti[id] = visti[id] || []).push(c);
    }
    // q: manifesto ancora da leggere; k: collezioni del codice
    for (const [id, cs] of Object.entries(visti)) { if (!(id in st.voci) || st.voci[id] === null) st.voci[id] = { q: 1, k: cs }; else if (st.voci[id]) st.voci[id].k = cs; }
    st.collezioni = coll; st.totale = Object.keys(visti).length; st.elenco = st.aggiornato = new Date().toISOString();
    salva(st);
    log("cudl", `elenco: ${st.totale} manifesti in ${Object.keys(coll).length} collezioni`);
  }
  const da = Object.keys(st.voci).filter(id => st.voci[id] && st.voci[id].q);
  let letti = 0, errori = 0;
  for (const id of da) {
    if (Date.now() > fine) break;
    let r; try { r = await leggiTesta(`${SITO}/iiif/${id}`); } catch (e) { log("cudl", id, e.message); if (++errori >= 5) break; continue; }
    errori = 0; letti++;
    st.voci[id] = r.dati ? { ...schedaCudl(r.dati), k: st.voci[id].k } : 0;
    if (letti % 25 === 0) { st.aggiornato = new Date().toISOString(); salva(st); log("cudl", `${letti} manifesti letti su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  if (!Object.values(st.voci).some(v => v && v.q)) st.completato = st.completato || st.aggiornato;
  salva(st);
  const resto = Object.values(st.voci).filter(v => v && v.q).length;
  if (resto) throw new Error(`manifesti letti in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

// record per il catalogo (accetta anche le schede del vecchio formato raccolto dal browser: l, a0, a1)
export function recordCudl(d = leggiDati()) {
  if (!d || !d.voci) return [];
  const out = [];
  for (const [id, v] of Object.entries(d.voci)) {
    if (!v || v.q) continue;
    if (CARTE.test([v.f, v.t].filter(Boolean).join(" ")) && !/codex|manuscript/i.test(v.f || "")) continue;
    if (d.formato === 2 && motivoCudl(v)) continue;
    const { biblioteca, segnatura } = dividiCudl(v.s, v.p);
    out.push({ fonte: "cudl", id: "cudl-" + id.toLowerCase(), citta: "Cambridge", biblioteca, segnatura: segnatura || id,
      datazione: v.d || (v.a0 ? (v.a1 && v.a1 !== v.a0 ? `${v.a0}-${v.a1}` : String(v.a0)) : null),
      titolo: [v.t, v.u].filter(Boolean).join(" ; ") || null, autori_fonte: v.au || [], descrizione: v.c || null,
      lingue: lingueDa([...(v.l || []), ...(v.l && v.l.length ? [] : v.x || [])]),
      manifest: `${SITO}/iiif/${id}`, pagina: `${SITO}/view/${id}`, licenza: LICENZA });
  }
  return out;
}
