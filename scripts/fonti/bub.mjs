// Biblioteca Universitaria di Bologna: codici digitalizzati pubblicati in Historica (historica.unibo.it, la biblioteca digitale
// dell'Università di Bologna su DSpace-GLAM, già AMS Historica): circa 900 codici (manoscritti di Ulisse Aldrovandi, codici arabi
// della raccolta Marsili, latini, italiani, greci). Elenco: API REST di DSpace (/server/api/discover/search/objects) con il filtro
// del tipo fisico «codices (bound manuscripts)», 100 schede per richiesta: il robots.txt vieta le pagine di ricerca del sito
// (/search) e /server/opensearch, non l'API REST. Manifesti IIIF (/server/iiif/<uuid>/manifest) e immagini (/iiif-server/) con
// CORS aperto (prova del 25 ottobre 2026). Licenza delle immagini indicata per ogni codice (per lo più CC BY-NC-ND 4.0).
// Lo stato è in data/bub.json; una raccolta completa (una decina di richieste) si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/bub.json";
export const SITO = "https://historica.unibo.it";
export const TIPO = "codices (bound manuscripts)";
const PAGINA = 100, GIORNI = 6;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([, a], [, b]) => String(a.s).localeCompare(String(b.s), "it", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// oggetto della ricerca DSpace -> { uuid, v } (null se manca il manifesto o non è della BUB)
export function compattaBub(o) {
  const it = (o && o._embedded && o._embedded.indexableObject) || o;
  if (!it || !it.uuid) return null;
  const m = it.metadata || {}, val = k => (m[k] || []).map(x => String(x.value || "").trim()).filter(Boolean);
  if (val("dspace.iiif.enabled")[0] === "false") return null;
  const prov = val("edm.dataprovider")[0] || null;
  if (prov && !/Biblioteca Universitaria di Bologna/i.test(prov)) return null;
  const da = val("dc.date.start")[0], a = val("dc.date.end")[0], iss = val("dc.date.issued")[0];
  const d = iss || (da && a && da !== a ? `${da}-${a}` : da || a) || val("dc.coverage.temporal").join(", ") || null;
  // segnatura: dal titolo quando è nella forma «Bologna, Biblioteca Universitaria di Bologna, Aldrovandi, ms. 1», altrimenti dal campo apposito
  const BUB = /^Bologna,\s*Biblioteca Universitaria di Bologna,\s*/i, tit = val("dc.title")[0] || "";
  const seg = (BUB.test(tit) ? tit : val("dc.identifier.shelfmark")[0] || tit).replace(BUB, "");
  const v = { s: seg || null, t: val("dc.title")[0] || null, a: val("dc.contributor.author"), d, l: [...new Set(val("dc.language.iso"))], r: val("dc.rights.license")[0] || null,
    f: val("dc.relation.fonds")[0] || null, c: [val("dc.description.abstract")[0], val("dc.description")[0], val("dc.format.medium")[0], val("dc.format.extent")[0]].filter(Boolean).join(" ; ").slice(0, 3000) || null,
    h: (val("dc.identifier.uri")[0] || "").replace(/^https?:\/\/hdl\.handle\.net\//, "") || null };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return { uuid: it.uuid, v };
}

export async function scansionaBub({ minuti = 10, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("bub", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const fine = Date.now() + minuti * 60e3, voci = {};
  let totale = 0;
  for (let p = 0; ; p++) {
    if (Date.now() > fine) throw new Error(`raccolta incompleta (pagina ${p}): si rifà alla prossima esecuzione`);
    const q = new URLSearchParams({ "f.typephysical": `${TIPO},equals`, dsoType: "ITEM", size: String(PAGINA), page: String(p), sort: "dc.date.accessioned,ASC" });
    const r = await scarica(`${SITO}/server/api/discover/search/objects?${q}`, { timeout: 180000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`pagina ${p}: HTTP ${r.stato}`);
    const sr = JSON.parse(r.testo)._embedded.searchResult;
    totale = sr.page.totalElements;
    const objs = (sr._embedded && sr._embedded.objects) || [];
    for (const o of objs) { const x = compattaBub(o); if (x) voci[x.uuid] = x.v; }
    if (!objs.length || p + 1 >= sr.page.totalPages) break;
  }
  if (!Object.keys(voci).length) throw new Error("nessun codice nei risultati");
  st.voci = voci; st.totale = totale; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("bub", `${Object.keys(voci).length} codici su ${totale}`);
  return st;
}

export function recordBub(st = leggiStato()) {
  return Object.entries((st && st.voci) || {}).filter(([, v]) => v).map(([u, v]) => ({
    fonte: "bub", id: `bub-${u}`, citta: "Bologna", biblioteca: "Biblioteca Universitaria di Bologna", segnatura: v.s || v.t || u, datazione: v.d || null,
    titolo: v.t && v.t !== v.s && !/^Bologna, Biblioteca Universitaria/i.test(v.t) ? v.t : v.f || null, autori_fonte: v.a || [], descrizione: [v.f, v.c].filter(Boolean).join(" ; ") || null,
    lingue: lingueDa(v.l || []).filter(c => c !== "xx"), manifest: `${SITO}/server/iiif/${u}/manifest`, pagina: v.h ? `${SITO}/handle/${v.h}` : `${SITO}/entities/publication/${u}`,
    licenza: v.r || "Università di Bologna" }));
}
