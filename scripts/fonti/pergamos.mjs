// Università di Atene (Εθνικό και Καποδιστριακό Πανεπιστήμιο Αθηνών), Biblioteca della Facoltà di Filosofia: «Χειρόγραφοι κώδικες»
// nel repository Pergamos (pergamos.lib.uoa.gr), collezione col_byzantinemanuscripts (82 codici, di cui una quarantina con
// immagini: 4 bizantini, gli altri postbizantini, per lo più di contenuto ecclesiastico; catalogo di Ζώρας e Μπουμπουλίδης).
// Niente IIIF. Il sito usa un'API pubblica (pergamos.lib.uoa.gr/public-api, non vietata dal robots.txt, che esclude solo /oai,
// /search, /browse/item e simili): POST /public-api/search con il modello «ByzantineManuscript» dà i codici, con il modello «Page»
// e il filtro sul genitore dà le pagine, ciascuna con l'immagine per il web («webFile», JPEG di circa 2000 px, misure nei metadati
// tecnici). Le immagini si scaricano da /public-api/files/uoadl/<id del file>/payload-inline con CORS aperto (Access-Control-Allow-
// Origin: *, verificato il 26 ottobre 2026): si caricano come <img>. Come per la Biblioteca Nazionale di Grecia, i manifesti IIIF
// (Presentation 2, immagini a misura fissa, senza servizio Image) li scrive il catalogo (scripts/manifesti.mjs, ramo «manifesti»).
// Licenza: Creative Commons BY-NC 4.0 (indicata nella scheda di ogni codice).
// Restano fuori gli altri tipi del repository: «FolkloreManuscript» (circa 3800 quaderni di raccolte folkloriche degli studenti,
// anni Sessanta: carte di ricerca, non codici), «PsachosBook» (libri a stampa di musica bizantina), «ArchivalBook» (registri e
// annuari dell'Università), i papiri.
// Stato in data/pergamos.json: l'elenco e le pagine si rileggono ogni 14 giorni (circa 50 richieste, una ogni 1,5 secondi).
import fs from "node:fs";
import { UA, log } from "../rete.mjs";

export const FILE_STATO = "data/pergamos.json";
export const SITO = "https://pergamos.lib.uoa.gr";
export const API = `${SITO}/public-api`;
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/pergamos";
export const LICENZA = "CC BY-NC 4.0 (Pergamos, Εθνικό και Καποδιστριακό Πανεπιστήμιο Αθηνών)";
const GIORNI = 14;
export const immagine = f => `${API}/files/uoadl/${f}/payload-inline`;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const ricerca = (modelli, filtri, start, count, ordine = []) => JSON.stringify({ start, count, models: [modelli], query: { filters: filtri, aggregations: [], sorting: ordine } });
// l'API vuole un corpo JSON (scarica() di rete.mjs manda i corpi come modulo): stesse regole, una richiesta per volta, 1,5 secondi
let ultima = 0;
async function cerca(corpo, url = `${API}/search`) {
  for (let k = 0; k < 4; k++) {
    const attesa = 1500 - (Date.now() - ultima); if (attesa > 0) await new Promise(r => setTimeout(r, attesa));
    ultima = Date.now();
    try {
      const r = await fetch(url, { method: "POST", body: corpo, headers: { "content-type": "application/json", accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(120000) });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { if (k === 3) throw e; await new Promise(r => setTimeout(r, 5000 * 2 ** k)); }
  }
}

const it = (arr, l = "el") => { const a = [].concat(arr || []); return ((a.find(x => x && x.key === l) || a[0] || {}).value) || null; };
const termini = arr => [].concat(arr || []).map(t => it(t && (t.displayTitle || t.title))).filter(x => x && x !== "null");
const pulito = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// codice (ByzantineManuscript) -> voce compatta
export function compattaPergamos(x) {
  const v = { t: pulito(x.title || it(x.displayTitle)) || null, s: x.usherNumber ? String(it(x.usherNumber) || x.usherNumber) : null, d: it(x.timeCoverage) || null,
    y: it(x.creationYearText) || null, a: termini(x.creator), e: [it(x.numberOfPagesText) || x.numberOfPagesText, it(x.dimensions)].filter(Boolean).join("; ") || null,
    m: termini([].concat(x.physicalMaterial || [])).join(", ") || null, c: pulito([it(x.additionalInfo), ...[].concat(x.description || []).map(d => it([d]))].filter(Boolean).join(" ; ")).slice(0, 2000) || null,
    r: it(x.license && (x.license.displayTitle || x.license.title)) || null };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}
// pagina (Page) -> [id del file, larghezza, altezza]
export function paginaPergamos(p) {
  const f = p.webFile; if (!f || !f.id || f.publish === "false") return null;
  const tm = String(f.technicalMetadata || "");
  const w = +((/Image Width = (\d+)/.exec(tm) || [])[1] || 0), h = +((/Image Height = (\d+)/.exec(tm) || [])[1] || 0);
  return [f.id, w, h];
}

export async function scansionaPergamos({ minuti = 10, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("pergamos", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const fine = Date.now() + minuti * 60e3, voci = {};
  for (let start = 0; ; start += 50) {
    const d = await cerca(ricerca("ByzantineManuscript", {}, start, 50));
    st.totale = d.total;
    for (const x of d.items || []) voci[x.id] = compattaPergamos(x);
    if (!(d.items || []).length || start + 50 >= d.total) break;
  }
  log("pergamos", `elenco: ${Object.keys(voci).length} codici`);
  for (const id of Object.keys(voci)) {
    if (Date.now() > fine) throw new Error("pagine lette in parte: si rifà alla prossima esecuzione");
    const filtri = { and: [{ eq: { parents: `uoadl:${id}` } }, { exists: "webFile" }] };
    const pagine = [];
    for (let start = 0; ; start += 500) {
      const d = await cerca(ricerca("Page", filtri, start, 500, ["pageNumber:asc"]));
      for (const p of d.items || []) { const q = paginaPergamos(p); if (q) pagine.push(q); }
      if (!(d.items || []).length || start + 500 >= d.total) break;
    }
    if (pagine.length) voci[id].p = pagine;
  }
  st.voci = voci; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("pergamos", `${Object.values(voci).filter(v => v.p).length} codici con immagini su ${Object.keys(voci).length}`);
  return st;
}

// fuori i volumi di carte d'archivio (atti notarili, carteggi di una persona: «Νοταριακά έγγραφα», «Επιστολαί Σπυρίδωνος Τρικούπη»)
export const NON_LIBRARI = /έγγραφ|^Επιστολαί\s+[Α-ΩΆ-Ώ][α-ωά-ώ]+\s+[Α-ΩΆ-Ώ]/i;
export const ammessaPergamos = v => !!(v && (v.p || []).length && !NON_LIBRARI.test(v.t || ""));
// secoli in numeri greci («ΙΗ΄-ΙΘ΄», «ΙΣΤ΄») -> numeri romani («sec. XVIII-XIX»); il resto resta com'è («τέλη 19ου»)
const GRECI = { Α: 1, Β: 2, Γ: 3, Δ: 4, Ε: 5, ΣΤ: 6, Ϛ: 6, Ζ: 7, Η: 8, Θ: 9 };
const romano = n => [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((o, [v, r]) => { while (n >= v) { o += r; n -= v; } return o; }, "");
export function secoloPergamos(d) {
  if (!d) return null;
  const parti = String(d).split(/\s*[-–]\s*/).map(x => x.replace(/[΄'ʹ\s]/g, ""));
  const num = parti.map(x => { const m = /^(Κ|Ι)?(ΣΤ|[ΑΒΓΔΕϚΖΗΘ])?$/.exec(x); if (!m || (!m[1] && !m[2])) return null; return (m[1] === "Κ" ? 20 : m[1] === "Ι" ? 10 : 0) + (m[2] ? GRECI[m[2]] : 0); });
  return num.every(Boolean) ? "sec. " + num.map(romano).join("-") : `sec. ${d}`;
}
export function recordPergamos(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaPergamos(v)).map(([id, v]) => ({
    fonte: "pergamos", id: "uoa-" + id, citta: "Atene", biblioteca: "Università di Atene, Biblioteca della Facoltà di Filosofia (Pergamos)",
    segnatura: v.s ? `Χειρόγραφο ${v.s}` : `uoadl:${id}`, datazione: [secoloPergamos(v.d), v.y].filter(Boolean).join(", ") || null, titolo: v.t || null, autori_fonte: v.a || [],
    descrizione: [v.c, v.e, v.m].filter(Boolean).join(" ; ") || null, lingue: /Σλαβονικ/i.test(v.t || "") ? ["cu"] : ["grc"], immagini: v.p.length,
    manifest: `${BASE_MANIFESTI}/${id}.json`, pagina: `${SITO}/item/uoadl:${id}`, licenza: LICENZA }));
}

// manifesto IIIF Presentation 2 scritto dal catalogo: immagini JPEG della biblioteca, misura fissa, senza servizio Image
export function manifestoScritto(id, v) {
  const mid = `${BASE_MANIFESTI}/${id}.json`;
  const canvases = (v.p || []).map(([f, w, h], i) => {
    const src = immagine(f), cid = `${mid}/c${i + 1}`;
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: w || 1500, height: h || 2000,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid, resource: { "@id": src, "@type": "dctypes:Image", format: "image/jpeg", width: w || undefined, height: h || undefined } }] };
  });
  const meta = [["Segnatura", v.s], ["Titolo", v.t], ["Autori", (v.a || []).join(", ")], ["Secolo", v.d], ["Anni", v.y], ["Descrizione fisica", v.e], ["Materiale", v.m], ["Note", v.c], ["Licenza", v.r]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s && `Χειρόγραφο ${v.s}`, v.t].filter(Boolean).join(": ") || id, metadata: meta,
    attribution: "Εθνικό και Καποδιστριακό Πανεπιστήμιο Αθηνών, Βιβλιοθήκη Φιλοσοφικής Σχολής (Pergamos). CC BY-NC 4.0. Manifesto scritto dal catalogo di Emendando con le immagini del repository.",
    license: "https://creativecommons.org/licenses/by-nc/4.0/", related: `${SITO}/item/uoadl:${id}`,
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
