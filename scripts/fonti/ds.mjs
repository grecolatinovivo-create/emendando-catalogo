// Digital Scriptorium (search.digital-scriptorium.org): l'aggregatore dei manoscritti premoderni delle istituzioni statunitensi
// (circa 30.000 schede, di cui circa 12.000 con immagini). Nel catalogo la fonte resta «ds», ma la biblioteca è quella vera
// (Harvard, Princeton, Columbia, Huntington, Free Library, Newberry, Boston Public Library e le altre).
// Come si legge (il robots.txt della ricerca non pone limiti; pausa di 1,5 secondi tra le richieste):
//  1. l'elenco delle schede con immagini dall'API JSON di Blacklight (catalog.json?f[images_facet][]=Yes, 100 schede per pagina,
//     circa 122 pagine): DS ID, «Istituzione, segnatura», titolo, datazione, luogo;
//  2. i dati completi (manifesto IIIF, istituzione, segnatura, titoli, nomi con il ruolo, lingue, datazione, luogo, scheda
//     dell'istituzione) con poche interrogazioni SPARQL al Wikibase di DS (catalog.digital-scriptorium.org/query/sparql), da cui
//     la ricerca è costruita: la scheda JSON di Blacklight (catalog/DSxxxx.json) risponde 500 e il manifesto non è nell'elenco;
//  3. per le schede dell'elenco che lo SPARQL non restituisce, la pagina HTML della scheda («loadedManifest» e campi).
// Lo stato è in data/ds.json; una raccolta completa si riusa per 6 giorni.
// Manifesti: entrano solo i domini che si aprono (dal container o, confermati a mano, dal browser di chi usa il catalogo).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/ds.json";
export const BASE = "https://search.digital-scriptorium.org";
export const SPARQL = "https://catalog.digital-scriptorium.org/query/sparql";
const PAGINA = 100, GIORNI = 6;

// Domini dei manifesti che dal container non si aprono (403, Cloudflare, certificato non verificabile): restano FUORI dal
// catalogo finché non si verificano dal browser (manifesto e immagini aperti da www.emendando.com).
// PER CONFERMARE UN DOMINIO: aggiungerlo alla riga DOMINI_CONFERMATI qui sotto.
export const DOMINI_DA_VERIFICARE = {
  "nrs.lib.harvard.edu": "Harvard: 403 dal container",
  "figgy.princeton.edu": "Princeton: certificato non verificabile dal container",
  "digitalcollections.rit.edu": "Rochester Institute of Technology: certificato non verificabile dal container",
  "digital.buffalolib.org": "Buffalo & Erie County Public Library: certificato non verificabile dal container",
  "preserve.lehigh.edu": "Lehigh University: Cloudflare (429) dal container; dal browser non si apre (25 ottobre 2026)",
  "repository.wellesley.edu": "Wellesley College: Cloudflare dal container; dal browser non si apre (25 ottobre 2026)",
};
export const DOMINI_CONFERMATI = ["nrs.lib.harvard.edu", "figgy.princeton.edu", "digitalcollections.rit.edu", "digital.buffalolib.org"];
// manifesti che non esistono più (404): fuori
export const DOMINI_ESCLUSI = { "colenda.library.upenn.edu": "vecchi manifesti di Colenda (404); i codici di Penn sono nella fonte penn" };

// istituzione come la scrive DS -> nome nel catalogo e città
export const ISTITUZIONI = {
  "University of Pennsylvania": ["University of Pennsylvania Libraries", "Philadelphia"],
  "Princeton University": ["Princeton University Library", "Princeton"],
  "Columbia University Rare Book & Manuscript Library": ["Columbia University, Rare Book & Manuscript Library", "New York"],
  "University of California, Berkeley": ["University of California, Berkeley, Bancroft Library", "Berkeley"],
  "Harvard University": ["Harvard University, Houghton Library", "Cambridge (Massachusetts)"],
  "The Huntington Library, Art Museum, and Botanical Gardens": ["The Huntington Library", "San Marino (California)"],
  "Free Library of Philadelphia": ["Free Library of Philadelphia", "Philadelphia"],
  "Boston Public Library": ["Boston Public Library", "Boston"],
  "Newberry Library": ["Newberry Library", "Chicago"],
  "Newberry Library & Western Michigan University": ["Newberry Library e Western Michigan University", "Chicago"],
  "Western Michigan University": ["Western Michigan University", "Kalamazoo"],
  "University of Kansas": ["University of Kansas, Kenneth Spencer Research Library", "Lawrence (Kansas)"],
  "University of Chicago": ["University of Chicago Library", "Chicago"],
  "Rutgers University": ["Rutgers University Libraries", "New Brunswick (New Jersey)"],
  "Indiana University Bloomington": ["Indiana University, Lilly Library", "Bloomington"],
  "Ohio University": ["Ohio University Libraries", "Athens (Ohio)"],
  "Rochester Institute of Technology": ["Rochester Institute of Technology, Cary Graphic Arts Collection", "Rochester"],
  "Lehigh University": ["Lehigh University", "Bethlehem (Pennsylvania)"],
  "Saint Louis University": ["Saint Louis University", "Saint Louis"],
  "Folger Shakespeare Library": ["Folger Shakespeare Library", "Washington"],
  "Wellesley College": ["Wellesley College", "Wellesley"],
  "Bryn Mawr College": ["Bryn Mawr College", "Bryn Mawr"],
  "California State Library": ["California State Library, Sutro Library", "San Francisco"],
  "State of California": ["California State Library, Sutro Library", "San Francisco"],
  "Conception Abbey and Seminary": ["Conception Abbey and Seminary", "Conception (Missouri)"],
  "Nelson-Atkins Museum of Art": ["Nelson-Atkins Museum of Art", "Kansas City"],
  "The Nelson-Atkins Museum of Art": ["Nelson-Atkins Museum of Art", "Kansas City"],
  "University of California, Davis": ["University of California, Davis", "Davis"],
  "Buffalo & Erie County Public Library": ["Buffalo & Erie County Public Library", "Buffalo"],
  "General Theological Seminary": ["General Theological Seminary", "New York"],
  "Grolier Club": ["Grolier Club", "New York"],
  "Smith College": ["Smith College", "Northampton (Massachusetts)"],
  "New York University": ["New York University", "New York"],
  "Burke Library at Union Theological Seminary": ["Burke Library at Union Theological Seminary", "New York"],
  "Providence Public Library": ["Providence Public Library", "Providence"],
  "Fordham University": ["Fordham University", "New York"],
  "American Academy in Rome": ["American Academy in Rome", "Roma"],
  "Harry Ransom Center": ["Harry Ransom Center, University of Texas", "Austin"],
  "City College of New York": ["City College of New York", "New York"],
  "Pepperdine University": ["Pepperdine University", "Malibu"],
};
export const istituzione = n => { const x = ISTITUZIONI[n]; return x ? { biblioteca: x[0], citta: x[1] } : { biblioteca: n || "Digital Scriptorium", citta: null }; };

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || null, cursore: st.cursore || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const val = (a, k) => (a && a[k] && a[k].attributes ? a[k].attributes.value : null);
// riga dell'elenco JSON di Blacklight -> { e: «Istituzione, segnatura», t, d, p }
export function rigaElenco(x) {
  const a = x.attributes || {};
  return { e: typeof a.title === "string" ? a.title : null, t: val(a, "title_facet"), d: val(a, "date_meta"), p: val(a, "place_facet") };
}

// interrogazioni SPARQL (piatte: una riga per valore) sui record di DS con un manifesto IIIF
const PREF = `PREFIX wdt: <https://catalog.digital-scriptorium.org/prop/direct/>
PREFIX p: <https://catalog.digital-scriptorium.org/prop/>
PREFIX ps: <https://catalog.digital-scriptorium.org/prop/statement/>
PREFIX pq: <https://catalog.digital-scriptorium.org/prop/qualifier/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
`;
const REC = "?r wdt:P41 ?m ; wdt:P3 ?ms . ?ms wdt:P1 ?ds .";
export const QUERY = {
  base: `SELECT ?ds ?m ?ist ?seg ?link WHERE { ${REC} ?ms wdt:P2 ?h . OPTIONAL { ?h wdt:P5 ?ist } OPTIONAL { ?h wdt:P8 ?seg } OPTIONAL { ?h wdt:P9 ?link } }`,
  titoli: `SELECT ?ds ?v ?u WHERE { ${REC} OPTIONAL { ?r wdt:P10 ?v } OPTIONAL { ?r wdt:P12 ?u } }`,
  nomi: `SELECT ?ds ?v ?ruolo WHERE { ${REC} ?r p:P14 ?st . ?st ps:P14 ?v . OPTIONAL { ?st pq:P15 ?ro . ?ro rdfs:label ?ruolo . FILTER(lang(?ruolo)="en") } }`,
  lingue: `SELECT ?ds ?v ?l WHERE { ${REC} ?r p:P21 ?st . ?st ps:P21 ?v . OPTIONAL { ?st pq:P22 ?li . ?li rdfs:label ?l . FILTER(lang(?l)="en") } }`,
  date: `SELECT ?ds ?v ?a0 ?a1 WHERE { ${REC} ?r p:P23 ?st . ?st ps:P23 ?v . OPTIONAL { ?st pq:P37 ?a0 } OPTIONAL { ?st pq:P36 ?a1 } }`,
  luoghi: `SELECT ?ds ?v WHERE { ${REC} ?r wdt:P27 ?v }`,
};

async function sparql(q) {
  const r = await scarica(`${SPARQL}?query=${encodeURIComponent(PREF + q)}`, { timeout: 180000, accept: "application/sparql-results+json" });
  if (r.stato !== 200) throw new Error(`SPARQL: HTTP ${r.stato}`);
  return JSON.parse(r.testo).results.bindings.map(b => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
}

const agg = (arr, x) => { if (x && !arr.includes(x)) arr.push(x); return arr; };
const anno = t => { const m = /^([+-]?\d+)-/.exec(t || ""); return m ? +m[1] : null; };
const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// righe delle interrogazioni SPARQL + elenco di Blacklight -> voci compatte per DS ID
// { m: manifesto, i: istituzione (come in DS), s: segnatura, u: scheda dell'istituzione, t: titolo, a: autori, c: altri nomi (ruolo),
//   l: lingue, d: datazione, p: luogo }
export function unisciDs(righe, elenco = {}) {
  const v = {};
  const prendi = ds => (v[ds] = v[ds] || { m: null, i: null, s: null, u: null, t: [], a: [], c: [], l: [], d: [], p: [], h: [] });
  // più manifesti o più collocazioni per lo stesso codice (segnature precedenti): si tiene quella dell'elenco («Istituzione, segnatura»)
  for (const b of righe.base || []) prendi(b.ds).h.push(b);
  for (const [ds, x] of Object.entries(v)) {
    const e = elenco[ds] && elenco[ds].e;
    const h = (e && x.h.find(b => b.ist && b.seg && e === `${b.ist}, ${b.seg}`)) || (e && x.h.find(b => b.seg && e.endsWith(b.seg))) || x.h[0];
    Object.assign(x, { m: h.m, i: h.ist || null, s: h.seg || null, u: h.link || null });
  }
  for (const b of righe.titoli || []) if (v[b.ds]) { agg(v[b.ds].t, b.v); agg(v[b.ds].t, b.u); }
  for (const b of righe.nomi || []) if (v[b.ds]) { if (!b.ruolo || /author/i.test(b.ruolo)) agg(v[b.ds].a, b.v); else agg(v[b.ds].c, `${b.v} (${b.ruolo.toLowerCase()})`); }
  for (const b of righe.lingue || []) if (v[b.ds]) agg(v[b.ds].l, b.l || b.v);
  for (const b of righe.date || []) if (v[b.ds]) {
    const a0 = anno(b.a0), a1 = anno(b.a1);
    agg(v[b.ds].d, b.v + (a0 && a1 && !/\d{3}/.test(b.v) ? ` (${a0}-${a1})` : ""));
  }
  for (const b of righe.luoghi || []) if (v[b.ds]) agg(v[b.ds].p, b.v);
  const out = {};
  for (const [ds, x] of Object.entries(v)) {
    const r = { m: x.m, i: x.i, s: x.s, u: x.u, t: x.t.join(" ; ").slice(0, 400) || (elenco[ds] && elenco[ds].t) || null, a: x.a.slice(0, 12), c: x.c.slice(0, 12),
      l: x.l, d: x.d.join(" ; ") || (elenco[ds] && elenco[ds].d) || null, p: x.p.join(" ; ") || null };
    for (const k of Object.keys(r)) if (r[k] == null || (Array.isArray(r[k]) && !r[k].length)) delete r[k];
    out[ds] = r;
  }
  return out;
}

// pagina HTML di una scheda (per le schede che lo SPARQL non restituisce)
export function daPagina(html) {
  const campo = nome => {
    const m = new RegExp(`<dt class="blacklight-${nome}[^"]*">[\\s\\S]*?</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>`).exec(html);
    return m ? m[1].replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim() || null : null;
  };
  const m = /"loadedManifest":\s*"([^"]+)"/.exec(html);
  const r = { m: m ? m[1] : null, i: campo("institution"), s: campo("shelfmark"), t: campo("title"), d: campo("date"), l: campo("language") ? [campo("language").replace(/^In /, "")] : [] };
  for (const k of Object.keys(r)) if (r[k] == null || (Array.isArray(r[k]) && !r[k].length)) delete r[k];
  return r;
}

/* raccolta: cursore = { fase: "elenco" | "pagine", p: pagina dell'elenco, elenco: {DS ID: riga} }; stato salvato dopo ogni pagina */
export async function scansionaDs({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  if (st.completato && !st.cursore && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("ds", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const fine = ora + minuti * 60e3;
  if (!st.cursore) st.cursore = { fase: "elenco", p: 1, elenco: {} };
  else log("ds", `riprendo: ${st.cursore.fase}, pagina ${st.cursore.p}`);
  const c = st.cursore;
  while (c.fase === "elenco") {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (elenco, pagina ${c.p}): riprenderà alla prossima esecuzione`); }
    const r = await scarica(`${BASE}/catalog.json?f%5Bimages_facet%5D%5B%5D=Yes&per_page=${PAGINA}&page=${c.p}`, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`elenco: HTTP ${r.stato}`);
    const j = JSON.parse(r.testo), pg = (j.meta || {}).pages || {};
    for (const x of j.data || []) c.elenco[x.id] = rigaElenco(x);
    st.totale = pg.total_count || st.totale; st.aggiornato = new Date().toISOString();
    if (c.p % 20 === 0) log("ds", `elenco: pagina ${c.p} su ${pg.total_pages}`);
    if (pg["last_page?"] || !(j.data || []).length) { c.fase = "sparql"; break; }
    c.p++; salvaStato(st);
  }
  if (c.fase === "sparql") {
    const righe = {};
    for (const k of Object.keys(QUERY)) righe[k] = await sparql(QUERY[k]);
    const tutte = unisciDs(righe, c.elenco);
    c.voci = {};
    for (const ds of Object.keys(c.elenco)) if (tutte[ds]) c.voci[ds] = tutte[ds];
    c.mancanti = Object.keys(c.elenco).filter(ds => !tutte[ds]);
    c.fase = "pagine";
    log("ds", `SPARQL: ${Object.keys(c.voci).length} schede dell'elenco, ${c.mancanti.length} da leggere dalla pagina`);
    salvaStato(st);
  }
  while (c.mancanti && c.mancanti.length) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (pagine delle schede, ne restano ${c.mancanti.length}): riprenderà alla prossima esecuzione`); }
    const ds = c.mancanti[0];
    const r = await scarica(`${BASE}/catalog/${encodeURIComponent(ds)}`, { timeout: 60000, accept: "text/html" });
    if (r.stato === 200) { const x = daPagina(r.testo); if (x.m) c.voci[ds] = x; }
    c.mancanti.shift();
    if (c.mancanti.length % 25 === 0) salvaStato(st);
  }
  st.voci = c.voci; delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("ds", `fine: ${Object.keys(st.voci).length} codici con manifesto su ${st.totale}`);
  return st;
}

export const dominio = u => { try { return new URL(u).hostname; } catch (e) { return null; } };
// manifesto utilizzabile (o null): gli indirizzi di Internet Archive «/details/<id>/manifest» diventano quelli IIIF
export function manifestoDs(m) {
  if (!m) return null;
  const ia = /^https?:\/\/(?:www\.)?archive\.org\/details\/([^/]+)\/manifest/.exec(m);
  if (ia) return `https://iiif.archive.org/iiif/${ia[1]}/manifest.json`;
  return m.replace(/^http:\/\//, "https://");
}
export function ammesso(m, confermati = DOMINI_CONFERMATI) {
  const d = dominio(m);
  if (!d || DOMINI_ESCLUSI[d]) return false;
  return !DOMINI_DA_VERIFICARE[d] || confermati.includes(d);
}

/* voci compatte -> record del catalogo. esistenti: { manifesti: Set, segnature: Map(biblioteca -> Set di segnature normalizzate) }
   delle fonti già presenti (Penn, Yale): i doppioni restano a quelle fonti. */
export function recordDs(st = leggiStato(), { esistenti = { manifesti: new Set(), segnature: new Map() }, confermati = DOMINI_CONFERMATI, scarti } = {}) {
  const out = [];
  for (const [ds, v] of Object.entries(st.voci || {})) {
    const manifest = manifestoDs(v.m);
    if (!manifest || !ammesso(manifest, confermati)) { if (scarti) scarti.dominio = (scarti.dominio || 0) + 1; continue; }
    const doppia = esistenti.manifesti.has(manifest) ||
      [...esistenti.segnature.entries()].some(([re, set]) => new RegExp(re).test(v.i || "") && set.has(norm(v.s)));
    if (doppia) { if (scarti) scarti.doppioni = (scarti.doppioni || 0) + 1; continue; }
    const { biblioteca, citta } = istituzione(v.i);
    out.push({ fonte: "ds", id: "ds-" + ds.toLowerCase(), citta, biblioteca, segnatura: v.s || ds, datazione: v.d || null, titolo: v.t || null,
      autori_fonte: v.a || [], collaboratori: v.c || [], descrizione: v.p ? "Luogo: " + v.p : null, lingue: lingueDa(v.l || []),
      manifest, pagina: `${BASE}/catalog/${ds}`, licenza: null });
  }
  return out;
}

// manifesti e segnature delle fonti già presenti, per escludere i doppioni (Penn/Kislak, Yale/Beinecke)
export function esistentiDa(record) {
  const manifesti = new Set(), segnature = new Map([["^University of Pennsylvania", new Set()], ["^Yale", new Set()]]);
  for (const r of record) {
    if (r.manifest) manifesti.add(r.manifest);
    const k = r.fonte === "penn" ? "^University of Pennsylvania" : r.fonte === "yale" ? "^Yale" : null;
    if (k && r.segnatura) segnature.get(k).add(norm(r.segnatura));
  }
  return { manifesti, segnature };
}
