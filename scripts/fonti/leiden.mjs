// Universiteitsbibliotheek Leiden: collezioni «Manuscripts, Archives & Letters» (tutti i manoscritti: occidentali medievali con i Vossiani
// latini e greci e i BPL, orientali, moderni) e «Bibliotheca Neerlandica Manuscripta» (manoscritti medievali in nederlandese) di Digital Collections
// (Islandora, digitalcollections.universiteitleiden.nl).
// Niente OAI-PMH pubblico (quello di Alma risponde «Unauthorized»), e l'API dei manifesti richiede l'accesso:
// si leggono le pagine dei risultati della collezione (20 codici per pagina), che danno segnatura, titolo, autori e datazione.
// Il robots.txt chiede 10 secondi tra le richieste (rete.mjs) e non vieta /islandora/search.
// Manifesto IIIF: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:<n>/manifest (rimanda al catalogo, con CORS aperto).
// Lo stato (cursore e codici letti) è in data/leiden.json: la raccolta riprende da dove si era fermata
// e una raccolta completa si riusa per 6 giorni.
// In costruzione (recordLeiden) un filtro tiene solo i manoscritti librari fino al 1800 (motivoLeiden): fuori le schede di documentazione
// della Bibliotheca Neerlandica Manuscripta (BNM, senza manifesto), le lettere, i documenti d'archivio, le carte dopo il 1800
// e le parti di codici già presenti con la loro segnatura (stesse immagini).
import fs from "node:fs";
import { scarica, decodifica, log } from "../rete.mjs";
import { anniDa } from "./yale.mjs";

export const FILE_STATO = "data/leiden.json";
export const BASE = "https://digitalcollections.universiteitleiden.nl";
export const COLLEZIONI = ["ubl_manuscripts", "bnm"];
const filtro = c => `f%5B0%5D=RELS_EXT_isMemberOfCollection_uri_ms%3A%22info%5C%3Afedora%5C/collection%5C%3A${c}%22`;
const GIORNI = 6, VERSIONE = 2;   // 2: più collezioni (cursore { c: indice della collezione, p: pagina })

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: st.versione || null, aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore ?? null, totale: st.totale || null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// pagina dei risultati -> { totale, voci: { "<item>": { s, t, a, d } } }
export function leggiPagina(html) {
  const tot = /\(\s*\d[\d,.]*\s*-\s*\d[\d,.]*\s+of\s+([\d,.]+)\s*\)/.exec(html);
  const voci = {};
  for (const blocco of html.split(/<tr class="islandora-solr-search-result/).slice(1)) {
    const id = (/href="\/view\/item\/(\d+)/.exec(blocco) || [])[1]; if (!id) continue;
    const campo = c => { const m = new RegExp(`<dd class="solr-value ${c}">([\\s\\S]*?)</dd>`).exec(blocco); return m ? decodifica(m[1]) : ""; };
    const s = campo("mods-relateditem-otherformat-identifier-ms");
    let t = campo("fgs-label-s");
    if (s && t.endsWith(", " + s)) t = t.slice(0, -(s.length + 2));
    voci[id] = { s: s || null, t: t || null, a: campo("mods-name-personal-namepart-ms") || null, d: campo("mods-relateditem-otherformat-origininfo-publisher-ms") || null };
  }
  return { totale: tot ? +tot[1].replace(/[,.]/g, "") : null, voci };
}

/* raccolta a riprese: cursore = { c: collezione, p: prossima pagina (da 0) }; stato salvato dopo ogni pagina.
   Un codice che sta in più collezioni si conta una volta sola (chiave: numero dell'oggetto). */
export async function scansionaLeiden({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  if (st.versione !== VERSIONE) { st.versione = VERSIONE; st.completato = null; st.cursore = null; st.totali = {}; }
  if (st.completato && st.cursore == null && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("leiden", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  if (st.cursore == null || typeof st.cursore !== "object") st.cursore = { c: 0, p: 0 }; else log("leiden", `riprendo da ${COLLEZIONI[st.cursore.c]}, pagina ${st.cursore.p + 1}`);
  st.totali = st.totali || {};
  const fine = ora + minuti * 60e3;
  while (st.cursore.c < COLLEZIONI.length) {
    const col = COLLEZIONI[st.cursore.c];
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${col}, pagina ${st.cursore.p + 1}): riprenderà alla prossima esecuzione`); }
    const r = await scarica(`${BASE}/islandora/search?page=${st.cursore.p}&type=dismax&islandora_solr_search_navigation=0&${filtro(col)}`, { timeout: 120000, accept: "text/html" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    if (/Access blocked/i.test(r.testo)) throw new Error("richiesta respinta dal sistema di protezione del sito");
    const p = leggiPagina(r.testo);
    if (p.totale) st.totali[col] = p.totale;
    Object.assign(st.voci, p.voci);
    st.cursore.p++; st.aggiornato = new Date().toISOString();
    if (st.cursore.p % 10 === 0) log("leiden", `${col}: ${st.cursore.p} pagine, ${Object.keys(st.voci).length} codici`);
    if (!Object.keys(p.voci).length || st.cursore.p * 20 >= (st.totali[col] || 0)) { log("leiden", `${col}: fine (${st.totali[col]})`); st.cursore = { c: st.cursore.c + 1, p: 0 }; }
    st.totale = Object.values(st.totali).reduce((a, b) => a + b, 0);
    salvaStato(st);
  }
  st.cursore = null; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("leiden", `fine: ${Object.keys(st.voci).length} codici`);
  return st;
}

// «VLQ 79» -> «Voss. Lat. Q. 79» (forma usata dagli editori); le altre segnature come le dà la biblioteca
export function segnaturaLeiden(s) {
  const m = /^VL([FQO])\s*(.+)$/.exec(String(s || "").trim());
  return m ? `Voss. Lat. ${m[1]}. ${m[2]}` : String(s || "").trim();
}

/* filtro dei manoscritti librari */
// prefissi delle segnature di Leida (per ricavare la segnatura dal titolo quando la scheda non la dà)
const PREFISSI = "(?:Or\\.|BPL|BPG|LTK|VL[FQO]|VC[FQO]|VG[GQFO]|VMI|PAP|D H|D Or\\.|VUL|GRO|SCA|PER|BUR|SINOL\\.(?: [A-Za-z]+)?|LIP|Ser\\.|MAR|Acad\\.|NBG-Kl\\.|NBG-Boeg|NBG|OUD|THYSIA|BOL|ABL|BA|WYT|RUH|AHM|BWA|ROS|MEY|BCB|RF-|CUN|ZZU|SEM|PK-|VCO|ATH|BET|KORT|Kort)";
const RE_SEGNATURA = new RegExp(`(?:^|[\\s,(\\[])(${PREFISSI}\\s?(?:[FQO]\\s)?\\d[\\d.]*[a-z]?(?:\\s?[a-dA-D](?:\\s?-\\s?[a-dA-D])?\\b)?)`, "g");
const PARTE = /^\s*(?:,|-)?\s*(?:part|vol\.?|volume)\s*[\w()]+|^\s*:\s*[\w.]+|^\s*(?:-\s*)?(?:recto|verso)\b/i;

// segnatura della voce: { seg (da mostrare), base (del codice intero), parte (true se è una parte o un volume del codice) }
export function segnaturaVoce(v) {
  const t = v.t || "";
  if (v.s) {
    const seg = v.s.trim().replace(/\s+/g, " ");
    const m = /^(.*?)(?:\s*(?:,|-)\s*part\b.*|\s*:\s*[\w.]+)$/i.exec(seg);
    return { seg, base: m ? m[1].trim() : seg, parte: !!m };
  }
  const tutte = [...t.matchAll(RE_SEGNATURA)];
  if (tutte.length) {
    const m = tutte[tutte.length - 1], base = m[1].trim(), resto = t.slice(m.index + m[0].length);
    const p = PARTE.exec(resto);
    return { seg: p ? (base + resto.slice(0, p[0].length).replace(/^\s*-\s*/, " - ")).trim() : base, base, parte: !!p || /\bpart\s+\w+\s*$/i.test(t.slice(0, m.index)) };
  }
  // nessuna segnatura: parte o volume di un codice riconoscibile dal titolo («La Galigo - Part 2», «Kitab al-Muqaffa, volume IV»)
  const p = /^(.*?)\s*(?:,|-)\s*(?:part|vol\.?|volume)\s*[\w()]+\s*$|^(.*?)\s+(?:recto|verso)\s*$/i.exec(t);
  return { seg: null, base: null, parte: !!p, titoloBase: p ? (p[1] || p[2]).trim() : null };
}

// fondi d'archivio (KITLV: D H, D Or.) e documentazione (BNM): niente voci senza data, e solo carte tutte entro il 1800
const FONDI_ARCHIVIO = /^(?:D H|D Or\.|N \d)/;
const LETTERE = /^\[?letters?\]?(?:\s|$)|\bbrie(?:f|ven|fje)\b|\bcorrespond\w*|\bletters? (?:from|to)\b|\bbusiness letter|\bepistolae (?:autographae |apographae )?ad (?!Atticum|familiares|Quintum|Brutum|Lucilium)/i;
const ARCHIVIO = /\b(?:rapport|documenten|stukken|contracten|slavencontracten|testament van|het testament|akten?|rekening(?:en)?|notulen|kwitanties?|dagboek|dagverhaal|journaal|memoriaal|geslachtsregisters?|stamboom|levensverhaal|plattegrond\w*|fiches|klapper|knipsels|bijlagen|doos)\b/i;
const GIORNO = /\b\d{1,2}(?:\s+|-)(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|apr|jun|jul|aug|sep|sept|okt|oct|nov|dec|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|may|june|july|august|october)\.?\s+1\d{3}\b/i;
const MODERNO = /\b(?:foto\w*|photo\w*|sound recording|recordings?|cartoon|cards of an index|prints database|portrait|typoscript|typescript|microfilm|kopie)\b/i;

// anni dell'egira: se c'è l'anno cristiano tra parentesi si usa quello («1245 H. [1829]», «678/[9 November 1279]»),
// altrimenti si converte («575 H», «6 Rabīʿ I 1334»)
const MESI_EGIRA = /rab[iī]|ǧum|jum[aā]d|cemaz|mu[hḥ]arr|[sṣ]afar|safer|ra[ǧj]ab|receb|[sšş]a[ʿ']?b[aā]n|rama[dḍz]|[sšş]aww[aā]l|şevval|[ḏd]h?[uū][ -]?l|zilka|zilhic/i;
export function dataCristiana(d) {
  let x = String(d || "").replace(/(?<!\d)(\d{3,4})\s*(?:H\.?|A\.?H\.?)?\s*\/?\s*\[(?:[^\]\d]*?)(\d{4})/g, "[$2");
  x = x.replace(/(?<!\d)(\d{3,4})\s*(?:H\b\.?|A\.H\.|\(Islamic)/g, (_, n) => String(Math.round(+n * 0.97 + 622)));
  // anno giavanese (Anno Javanico, circa 70 anni indietro rispetto all'anno cristiano nell'Ottocento)
  x = x.replace(/(?<!\d)(1\d{3})\s*\(Javanese/g, (_, n) => String(+n + 70));
  if (MESI_EGIRA.test(x)) x = x.replace(/(?<![\d\[])(\d{3,4})(?![\d\]])/g, (m, n) => (+n < 1500 ? String(Math.round(+n * 0.97 + 622)) : m));
  return x;
}

// motivo per cui una voce resta fuori (null = ammessa); presenti = segnature dei codici interi presenti, titoli = loro titoli
export function motivoLeiden(v, { presenti = new Set(), titoli = [] } = {}) {
  const s = (v.s || "").trim(), t = v.t || "";
  if (/^BNM\b/.test(s)) return "documentazione della Bibliotheca Neerlandica Manuscripta (schede, non manoscritti)";
  if (MODERNO.test(t)) return "fotografie, stampe e materiali moderni";
  if (LETTERE.test(t)) return "lettere";
  if (ARCHIVIO.test(t)) return "documenti d'archivio e carte personali";
  // datazione al giorno («Rotterdam, 9 februari 1678»): lettere e atti, non codici (ma non le date dei colofoni orientali)
  if (GIORNO.test(v.d || "") && !/dated|colophon|\//i.test(v.d) && !/^(?:Or\.|Acad\.|SINOL|Ser\.|NBG)/.test(s)) return "lettere";
  const sg = segnaturaVoce(v);
  // anni: dalla datazione (anno dell'egira seguito da quello cristiano tra parentesi: si usa il secondo), altrimenti dal titolo senza le segnature
  const d = dataCristiana(v.d);
  let anni = anniDa(d);
  if (!anni.length) anni = anniDa(t.replace(RE_SEGNATURA, " ").replace(s, " "), { titolo: true });
  const primo = anni.length ? Math.min(...anni) : null, ultimo = anni.length ? Math.max(...anni) : null;
  if (primo != null && primo > 1800) return "dopo il 1800";
  if (FONDI_ARCHIVIO.test(sg.seg || "")) {
    if (primo == null) return "fondo d'archivio, senza data";
    if (ultimo > 1800) return "fondo d'archivio, carte anche dopo il 1800";
  }
  if (sg.parte && sg.base && presenti.has(sg.base)) return "parte di un codice già presente (stesse immagini)";
  if (sg.parte && !sg.base && sg.titoloBase && titoli.some(x => x.startsWith(sg.titoloBase))) return "parte di un codice già presente (stesse immagini)";
  if (!sg.seg && primo == null) return "senza segnatura né data";
  return null;
}

// segnature e titoli dei codici interi presenti (per riconoscere le parti doppie)
export function contestoLeiden(voci) {
  const presenti = new Set(), titoli = [];
  for (const v of Object.values(voci || {})) {
    if (!v || !v.s || /^BNM\b/.test(v.s)) continue;
    const sg = segnaturaVoce(v);
    if (!sg.parte) { presenti.add(sg.seg); if (v.t) titoli.push(v.t); }
  }
  return { presenti, titoli };
}

export function recordLeiden(st = leggiStato()) {
  const ctx = contestoLeiden(st.voci);
  return Object.entries(st.voci || {}).filter(([, v]) => motivoLeiden(v, ctx) == null).map(([id, v]) => ({
    fonte: "leiden", id: "lei-" + id, citta: "Leiden", biblioteca: "Universiteitsbibliotheek Leiden", segnatura: segnaturaLeiden(segnaturaVoce(v).seg || "item " + id),
    datazione: v.d, titolo: v.t, autori_fonte: v.a ? [v.a] : [],
    manifest: `https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:${id}/manifest`, pagina: `https://hdl.handle.net/1887.1/item:${id}`,
    licenza: "Leiden University Libraries: Public Domain Mark o CC BY (indicata nel manifesto)" }));
}
