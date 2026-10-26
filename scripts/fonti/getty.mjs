// J. Paul Getty Museum, Los Angeles: manoscritti del dipartimento Manuscripts (collezione Ludwig e acquisti successivi). Dal 26 ottobre
// 2026, corsia «usa». Il Getty Research Institute non ha codici nelle sue collezioni digitali (data.getty.edu/research/collections:
// archivi, carte, dattiloscritti; i pochi «Manuscripts» sono documenti): i manoscritti del Getty sono quelli del Museo.
// Come si legge: dati aperti del Getty (data.getty.edu, Linked Art, nessun robots.txt):
//   - elenco con una interrogazione SPARQL (data.getty.edu/museum/collection/sparql): oggetti classificati «Manuscripts»
//     (AAT 300265483) con struttura «Whole» (circa 370: codici, volumi, fogli e ritagli catalogati da soli); fuori le schede «Part»
//     (fogli di un codice, già nel suo manifesto) e «Group» (un codice in più volumi: stesse immagini dei volumi);
//   - di ogni oggetto la scheda JSON-LD (titolo, segnatura «Ms. …», numero d'inventario, datazione, luogo, cultura, descrizione,
//     manifesti IIIF), una volta sola; l'elenco si rilegge ogni 6 giorni.
// Manifesti IIIF Presentation 2 (media.getty.edu/iiif/manifest/2/<uuid>) e immagini con CORS aperto, CC0 (Open Content Program).
// Spesso il manifesto ha solo le pagine scelte (miniature), non tutto il codice.
// Il certificato di data.getty.edu e media.getty.edu è emesso sotto la radice emSign (presente nelle radici di Node e dei browser,
// assente dal nostro ambiente di lavoro): la raccolta gira su GitHub Actions. Pausa di 1,5 secondi (rete.mjs).
import { scarica, log } from "../rete.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/getty.json";
export const SPARQL = "https://data.getty.edu/museum/collection/sparql";
export const OGGETTO = "https://data.getty.edu/museum/collection/object";
const GIORNI = 6;
export const QUERY = `PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
SELECT ?o WHERE { ?o a crm:E22_Human-Made_Object ; crm:P2_has_type <http://vocab.getty.edu/aat/300265483> ;
  crm:P2_has_type <https://data.getty.edu/local/thesaurus/object-record-structure-whole> . }`;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale"]);

const etichette = x => (x.classified_as || []).map(c => c._label || "");
const pulito = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// scheda Linked Art -> voce compatta { t, s, i, d, p, cu, a, c, m, w, r, g, f }
export function compattaGetty(o) {
  const id = (o.identified_by || []);
  const nome = re => { const x = id.find(i => etichette(i).some(l => re.test(l))); return x ? pulito(x.content) : null; };
  const rif = re => (o.referred_to_by || []).filter(r => etichette(r).some(l => re.test(l))).map(r => pulito(r.content)).filter(Boolean);
  const man = (o.subject_of || []).map(s => s.id || "").filter(u => /media\.getty\.edu\/iiif\/manifest\/2\//.test(u));
  const pagina = (o.subject_of || []).map(s => s.id || "").find(u => /getty\.edu\/art\/collection\/object\//.test(u)) || null;
  const p = o.produced_by || {};
  const ts = ((p.timespan || {}).identified_by || []).map(x => pulito(x.content)).filter(Boolean)[0] || null;
  const autori = (p.carried_out_by || []).concat(...(p.part || []).map(x => x.carried_out_by || [])).map(x => pulito(x._label)).filter(x => x && !/^unknown$/i.test(x));
  const v = { t: nome(/^Primary Title$/) || nome(/Preferred Term/) || pulito(o._label), s: nome(/Getty Manuscript Number/), i: nome(/Accession Number/),
    d: ts, p: rif(/Creation Place Description/)[0] || null, cu: rif(/^Culture$/)[0] || null, a: [...new Set(autori)].slice(0, 6),
    c: rif(/^Description$/)[0] ? rif(/^Description$/)[0].slice(0, 1500) : null, f: rif(/Dimensions Description/)[0] || null,
    m: man[0] || null, w: pagina, r: rif(/Rights Statement/)[0] || null,
    g: (o.classified_as || []).map(c => c._label).filter(l => l && !/^(Artwork|Manuscripts|Object Record Structure)/.test(l)) };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

export function motivoGetty(v) {
  if (!v || !v.m) return "senza manifesto";
  return null;
}

export async function scansionaGetty({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {};
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const r = await scarica(`${SPARQL}?query=${encodeURIComponent(QUERY)}`, { timeout: 180000, accept: "application/sparql-results+json" });
    if (r.stato !== 200) throw new Error(`SPARQL: HTTP ${r.stato}`);
    const ids = JSON.parse(r.testo).results.bindings.map(b => b.o.value.replace(/^.*\/object\//, "")).filter(Boolean);
    if (ids.length < 100) throw new Error(`elenco troppo corto (${ids.length} oggetti)`);
    const vecchie = st.voci; st.voci = {};
    for (const u of ids) st.voci[u] = vecchie[u] && !vecchie[u].q ? vecchie[u] : { q: 1 };
    st.totale = ids.length; st.elenco = st.aggiornato = new Date().toISOString();
    if (Object.values(st.voci).some(v => v.q)) st.completato = null;
    salva(st);
    log("getty", `elenco: ${ids.length} manoscritti`);
  }
  const da = Object.keys(st.voci).filter(u => st.voci[u].q);
  let letti = 0, errori = 0;
  for (const u of da) {
    if (Date.now() > fine) break;
    let r; try { r = await scarica(`${OGGETTO}/${u}`, { timeout: 120000, accept: "application/ld+json, application/json", tentativi: 3 }); }
    catch (e) { log("getty", u, e.message); if (++errori >= 5) break; continue; }
    errori = 0; letti++;
    if (r.stato !== 200) { st.voci[u] = { x: `HTTP ${r.stato}` }; continue; }
    try { st.voci[u] = compattaGetty(JSON.parse(r.testo)); } catch (e) { st.voci[u] = { x: "scheda non leggibile" }; }
    if (letti % 25 === 0) { st.aggiornato = new Date().toISOString(); salva(st); }
  }
  st.aggiornato = new Date().toISOString();
  const resto = Object.values(st.voci).filter(v => v.q).length;
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  log("getty", `schede lette: ${letti}; codici: ${Object.values(st.voci).filter(v => !v.q && !v.x && !motivoGetty(v)).length} su ${Object.keys(st.voci).length}`);
  if (resto) throw new Error(`schede lette in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

export function recordGetty(st = leggiStato()) {
  const out = [];
  for (const [u, v] of Object.entries(st.voci || {})) {
    if (!v || v.q || v.x || motivoGetty(v)) continue;
    out.push({ fonte: "getty", id: "getty-" + u, citta: "Los Angeles", biblioteca: "J. Paul Getty Museum",
      segnatura: v.s ? `${v.s}${v.i ? ` (${v.i})` : ""}` : v.i || u, datazione: v.d || null, titolo: v.t || null, autori_fonte: v.a || [],
      descrizione: [v.c, v.p, v.cu, (v.g || []).join(", "), v.f].filter(Boolean).join(" ; ").slice(0, 4000) || null, lingue: [],
      manifest: v.m, pagina: v.w || `${OGGETTO}/${u}`,
      licenza: "J. Paul Getty Museum, Open Content Program: immagini CC0" });
  }
  return out;
}
