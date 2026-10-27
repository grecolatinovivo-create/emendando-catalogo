// Bibliothèque nationale du Luxembourg: manoscritti di eluxemburgensia.lu (codici di Echternach e di Orval, Codex Mariendalensis,
// Bibbia gigante di San Massimino, corsi di filosofia del Collegio dei Gesuiti). Dal 27 ottobre 2026, corsia «nord».
// Nessun robots.txt su eluxemburgensia.lu, viewer.eluxemburgensia.lu e iiif.eluxemburgensia.lu (27 ottobre 2026).
// Elenco: API di ricerca del visore (viewer.eluxemburgensia.lu/api/viewer2/search, documentType=manuscript, una richiesta);
// per ogni codice la scheda (/api/viewer2/<ark>: segnatura «barcode», diritti) e l'elenco delle pagine (/api/viewer2/<ark>/pages:
// ark e misure di ogni immagine). La biblioteca NON pubblica manifesti IIIF: li scrive il catalogo (scripts/manifesti.mjs, ramo
// «manifesti»), Presentation 2 con il servizio IIIF Image 2 della biblioteca (iiif.eluxemburgensia.lu, Cantaloupe, CORS aperto).
// Entrano tutti i manoscritti aperti nel visore (diritti «public_domain» e varianti, vedi ammessaBnl).
// Stato in data/bnl.json; elenco ogni 14 giorni, scheda e pagine solo dei codici nuovi.
import { scarica, log } from "../rete.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/bnl.json";
export const API = "https://viewer.eluxemburgensia.lu/api/viewer2";
export const IMMAGINI = "https://iiif.eluxemburgensia.lu/image/iiif/2";
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/bnl";
const GIORNI = 14;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale"]);
const pulito = s => String(s ?? "").replace(/\s+/g, " ").replace(/\s*[/:;,]\s*$/, "").trim();
const primo = a => pulito([].concat(a || [])[0] || "") || null;
// «ark:70795/49rng31g4m» -> «49rng31g4m»
export const chiave = ark => String(ark).replace(/^ark:70795\//, "");

async function json(url) {
  const r = await scarica(url, { timeout: 120000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`HTTP ${r.stato} ${url}`);
  const j = JSON.parse(r.testo);
  if (j.status !== "OK") throw new Error(`risposta non valida: ${url}`);
  return j.data;
}

export async function scansionaBnl({ minuti = 5, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const q = new URLSearchParams({ query: "*", documentType: "manuscript", rows: "500", start: "0", contains: "true", exact: "false", fragSize: "1000", snippets: "5", fullText: "false" });
    const d = await json(`${API}/search?${q}`);
    const visti = new Set();
    for (const a of d.articles || []) {
      if (!a || !a.pid) continue;
      const k = chiave(a.pid), m = a.marc21Fields || {};
      visti.add(k);
      const v = st.voci[k] || {};
      Object.assign(v, { t: pulito(a.title) || null, a: primo(m.MARC21_datafield_100), alt: [].concat(m.MARC21_datafield_246 || []).map(pulito).filter(Boolean),
        e: primo(m.MARC21_datafield_300), l: [].concat(a.languages || []).filter(Boolean) });
      for (const c of Object.keys(v)) if (v[c] == null || (Array.isArray(v[c]) && !v[c].length)) delete v[c];
      st.voci[k] = v;
    }
    if (visti.size) for (const k of Object.keys(st.voci)) if (!visti.has(k)) delete st.voci[k];
    st.totale = d.numFound || visti.size; st.elenco = st.aggiornato = new Date().toISOString();
    if (Object.values(st.voci).some(v => !v.p && !v.x)) st.completato = null;
    salva(st);
    log("bnl", `elenco: ${visti.size} manoscritti`);
  }
  for (const [k, v] of Object.entries(st.voci)) {
    if (v.p || v.x) continue;
    if (Date.now() > fine) break;
    try {
      const sc = await json(`${API}/ark:70795/${k}`);
      v.s = pulito(sc.barcode) || null; v.r = (sc.rights || {}).code || null;
      const pp = await json(`${API}/ark:70795/${k}/pages`);
      // pagine: [numero nell'ark, larghezza, altezza, etichetta]
      v.p = (Array.isArray(pp) ? pp : []).map(x => [+(/\/pages\/(\d+)$/.exec(x.ark || "") || [])[1], x.imageWidth || null, x.imageHeight || null, ((x.pageData || {}).label || "").trim() || null])
        .filter(x => x[0] > 0);
      if (!v.p.length) { delete v.p; v.x = "senza pagine"; }
    } catch (e) { log("bnl", k, e.message); break; }
    st.aggiornato = new Date().toISOString(); salva(st);
  }
  const resto = Object.values(st.voci).filter(v => !v.p && !v.x).length;
  st.aggiornato = new Date().toISOString();
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  log("bnl", `${Object.values(st.voci).filter(v => v.p).length} codici con le pagine su ${Object.keys(st.voci).length}`);
  if (resto) throw new Error(`schede lette in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

// diritti: «public_domain», «custom_public_domain_leuven» (corsi dei Gesuiti digitalizzati con la KU Leuven), «custom_rec-vir_…»
// (ricostruzioni virtuali di codici di Echternach con fogli di Treviri e Parigi): tutti aperti nel visore della biblioteca
export const ammessaBnl = v => !!(v && v.p && v.p.length);
// «Zelle, Louis-Joseph 1826-1899 (LUBIBNET)000042469 auteur aut» -> «Zelle, Louis-Joseph 1826-1899»
export const autoreBnl = a => String(a || "").replace(/\(LUBIBNET\)\d+/g, " ").replace(/(?:\s+(?:auteur|aut|enseignant|tch|éditeur|edt|copiste|scr))+\s*$/g, "").replace(/\s+/g, " ").trim() || null;
const segnatura = (k, v) => v.s || (v.alt || [])[0] || k;

export function recordBnl(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaBnl(v)).map(([k, v]) => ({
    fonte: "bnl", id: "bnl-" + k, citta: "Lussemburgo", biblioteca: "Bibliothèque nationale du Luxembourg", segnatura: segnatura(k, v), datazione: null,
    titolo: [v.t, ...(v.alt || [])].filter(Boolean).join(" ; ").slice(0, 400) || null, autori_fonte: autoreBnl(v.a) ? [autoreBnl(v.a)] : [], descrizione: v.e || null,
    lingue: v.l || [], immagini: v.p.length, manifest: `${BASE_MANIFESTI}/${k}.json`, pagina: `https://viewer.eluxemburgensia.lu/ark:70795/${k}`,
    licenza: "Bibliothèque nationale du Luxembourg (pubblico dominio)" }));
}

// manifesto IIIF Presentation 2 scritto dal catalogo, con il servizio Image 2 della biblioteca
export function manifestoScritto(k, v) {
  const mid = `${BASE_MANIFESTI}/${k}.json`;
  const canvases = v.p.map(([n, w, h, et], i) => {
    const svc = `${IMMAGINI}/${encodeURIComponent(`ark:70795/${k}/pages/${n}`)}`;
    return { "@id": `${mid}/c${n}`, "@type": "sc:Canvas", label: et || String(i + 1), width: w || 2000, height: h || 3000,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: `${mid}/c${n}`,
        resource: { "@id": `${svc}/full/full/0/default.jpg`, "@type": "dctypes:Image", format: "image/jpeg", width: w || 2000, height: h || 3000,
          service: { "@context": "http://iiif.io/api/image/2/context.json", "@id": svc, profile: "http://iiif.io/api/image/2/level2.json" } } }] };
  });
  const meta = [["Segnatura", v.s], ["Titolo", v.t], ["Altri titoli", (v.alt || []).join(" ; ")], ["Autore", autoreBnl(v.a)], ["Descrizione fisica", v.e], ["Lingue", (v.l || []).join(", ")]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [segnatura(k, v), v.t].filter(Boolean).join(" : ").slice(0, 300), metadata: meta,
    attribution: "Bibliothèque nationale du Luxembourg (pubblico dominio). Manifesto scritto dal catalogo di Emendando con le immagini IIIF della biblioteca (iiif.eluxemburgensia.lu).",
    related: `https://viewer.eluxemburgensia.lu/ark:70795/${k}`,
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
