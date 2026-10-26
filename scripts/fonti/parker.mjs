// Parker Library, Corpus Christi College, Cambridge (Parker Library on the Web, Stanford). I manifesti IIIF sono aperti
// (dms-data.stanford.edu/data/manifests/Parker/<druid>/manifest.json, CORS aperto), ma l'elenco della biblioteca (parker.stanford.edu,
// SearchWorks) è dietro una verifica anti-robot: NON si usa. L'elenco con gli identificativi di Stanford (druid) viene da una fonte
// pubblica di un altro ente, il portale Biblissima (Campus Condorcet, Francia), che descrive i codici Parker e ne cita il druid:
//   - pagina della collezione «Cambridge. Corpus Christi College, Parker Library» (ark:/43093/cdatae800...): elenco dei codici (ark mdata...);
//   - scheda di ogni codice in N3 (?vid=download-n3): segnatura (bnf-onto:cote), datazione, rimando a parker.stanford.edu/parker/catalog/<druid>.
// Il robots.txt di Biblissima vieta la ricerca, /iiif/ e /csv/, non le pagine ark che si leggono qui. Si prova prima portail.biblissima.fr,
// poi la sua copia biblissima.demo.logilab.fr (Logilab, stesso software e stessi dati).
// Di ogni manifesto di Stanford si legge una volta l'intero JSON (etichetta «Cambridge, Corpus Christi College, MS 246: Bible»,
// descrizione in fondo al manifesto, numero delle immagini). I codici Parker sono tutti manoscritti librari (codici e frammenti di codici, anche quelli recuperati dalle
// legature, «défets»); fuori solo le schede senza druid o senza manifesto.
// Stato in data/parker.json: elenco ogni 14 giorni, ogni codice una volta sola (circa 560: un quarto d'ora). Pausa di 1,5 secondi per server.
import { scarica, log } from "../rete.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/parker.json";
export const BIBLISSIMA = ["https://portail.biblissima.fr", "https://biblissima.demo.logilab.fr"];
export const COLLEZIONE = "ark:/43093/cdatae80034812bdc2493df4e236562fc55eee86b2610";
export const MANIFESTI = "https://dms-data.stanford.edu/data/manifests/Parker";
export const LICENZA = "CC BY-NC 4.0 (immagini per cortesia della Parker Library, Corpus Christi College, Cambridge)";
const GIORNI = 14;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale", "base"]);

const pulito = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

// pagina della collezione -> { ark: segnatura dall'etichetta }
export function elencoDaPagina(html) {
  const out = {};
  for (const m of html.matchAll(/<a[^>]+href="[^"]*?(mdata[0-9a-f]{40})"[^>]*>([\s\S]*?)<\/a>/g)) {
    const t = pulito(m[2]); if (!t || out[m[1]]) continue;
    out[m[1]] = t.replace(/^Cambridge\.\s*Corpus Christi College,\s*Parker Library\s*/i, "").trim() || t;
  }
  return out;
}

// scheda N3 di Biblissima -> { s, d, dr }
export function schedaN3(n3) {
  const s = (/bnf-onto:cote\s+"((?:[^"\\]|\\.)*)"/.exec(n3) || [])[1] || null;
  const dr = (/parker\.stanford\.edu\/parker\/catalog\/([a-z]{2}\d{3}[a-z]{2}\d{4})/.exec(n3) || /stacks\.stanford\.edu\/image\/iiif\/([a-z]{2}\d{3}[a-z]{2}\d{4})/.exec(n3) || [])[1] || null;
  const d = (/E52_Time-Span\s*;\s*rdf:value\s+"([^"]+)"/.exec(n3) || [])[1] || null;
  return { s, d, dr };
}

// manifesto -> { t, c, n } (etichetta senza «Cambridge, Corpus Christi College», descrizione, numero delle immagini)
export function datiManifesto(j) {
  const label = pulito(typeof j.label === "string" ? j.label : (j.label || {})["@value"] || "");
  const desc = pulito(typeof j.description === "string" ? j.description : [].concat(j.description || []).map(x => (x && x["@value"]) || x).join(" "));
  return { t: label.replace(/^Cambridge,\s*Corpus Christi College,\s*/i, "") || null, c: desc.slice(0, 2000) || null, n: (((j.sequences || [])[0] || {}).canvases || []).length };
}

// la prima base che risponde resta quella buona per tutta l'esecuzione (dal nostro ambiente portail.biblissima.fr non sempre si apre)
let buona = null;
async function pagina(percorso, accept) {
  let ultimo;
  for (const b of buona ? [buona] : BIBLISSIMA) {
    try { const r = await scarica(b + percorso, { timeout: 120000, accept, tentativi: buona ? 3 : 1 }); if (r.stato === 200) { buona = b; return { r, base: b }; } ultimo = new Error(`HTTP ${r.stato} ${b}${percorso}`); }
    catch (e) { ultimo = e; }
  }
  throw ultimo;
}

export async function scansionaParker({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const { r, base } = await pagina(`/fr/${COLLEZIONE}`, "text/html");
    const el = elencoDaPagina(r.testo), n = Object.keys(el).length;
    if (n < 100) throw new Error(`elenco di Biblissima troppo corto (${n} codici)`);
    for (const [a, s] of Object.entries(el)) if (!(a in st.voci)) st.voci[a] = { q: 1, s };
    for (const a of Object.keys(st.voci)) if (!(a in el)) delete st.voci[a];
    st.totale = n; st.base = base; st.elenco = st.aggiornato = new Date().toISOString();
    if (Object.values(st.voci).some(v => v && v.q)) st.completato = null;
    salva(st);
    log("parker", `elenco da Biblissima (${base}): ${n} codici`);
  }
  const da = Object.keys(st.voci).filter(a => st.voci[a] && st.voci[a].q);
  let letti = 0, errori = 0;
  for (const a of da) {
    if (Date.now() > fine) break;
    try {
      const { r } = await pagina(`/fr/ark:/43093/${a}?vid=download-n3`, "text/n3, text/turtle, */*");
      const sc = schedaN3(r.testo), v = { s: sc.s || st.voci[a].s, d: sc.d || null };
      if (!sc.dr) { st.voci[a] = { ...v, x: "senza druid" }; letti++; continue; }
      v.dr = sc.dr;
      const m = await scarica(`${MANIFESTI}/${sc.dr}/manifest.json`, { timeout: 180000, accept: "application/json", tentativi: 3 });
      if (m.stato !== 200) { st.voci[a] = { ...v, x: `manifesto HTTP ${m.stato}` }; letti++; continue; }
      let dm; try { dm = datiManifesto(JSON.parse(m.testo)); } catch (e) { dm = null; }
      st.voci[a] = dm && dm.n ? { ...v, ...dm } : { ...v, x: "manifesto senza immagini" };
      letti++; errori = 0;
    } catch (e) { log("parker", a, e.message); if (++errori >= 5) break; continue; }
    if (letti % 25 === 0) { st.aggiornato = new Date().toISOString(); salva(st); log("parker", `${letti} codici letti su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  const resto = Object.values(st.voci).filter(v => v && v.q).length;
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  log("parker", `codici: ${Object.values(st.voci).filter(v => v && v.dr && !v.x).length} con manifesto su ${Object.keys(st.voci).length}`);
  if (resto) throw new Error(`codici letti in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

export function recordParker(st = leggiStato()) {
  const out = [];
  for (const v of Object.values(st.voci || {})) {
    if (!v || v.q || v.x || !v.dr) continue;
    const titolo = v.t && v.t.includes(":") ? v.t.slice(v.t.indexOf(":") + 1).trim() : null;
    out.push({ fonte: "parker", id: "parker-" + v.dr, citta: "Cambridge", biblioteca: "Parker Library, Corpus Christi College", segnatura: v.s || v.t || v.dr,
      datazione: v.d || null, titolo: titolo || null, immagini: v.n || null, autori_fonte: [], descrizione: v.c || null, lingue: [],
      manifest: `${MANIFESTI}/${v.dr}/manifest.json`, pagina: `https://parker.stanford.edu/parker/catalog/${v.dr}`, licenza: LICENZA });
  }
  return out;
}
