// Papiri (dal 28 ottobre 2026): papiri digitalizzati che si aprono nel visore di Emendando, secondo la verifica di docs/PAPIRI.md
// (regola: entra solo il papiro che si apre dentro il sito, con l'immagine nel nostro visore). Nel catalogo sono la fonte «papiri»
// (id «pap-<raccolta>-…»), con «tipo» «papiro» e i dati papirologici in «papiro» (edizione, provenienza, testo letterario o
// documentario, numero Trismegistos, materiale). I papiri di Heidelberg (e quelli della Bayerische Staatsbibliothek) restano alle loro
// fonti e prendono solo il tipo «papiro» (papiroDa, applicato in scripts/raccogli.mjs).
//
// Schede: papyri.info (repository papyri/idp.data, dati CC BY 3.0) estratte in data/papiri-info.json da scripts/papiri-info.mjs:
// schede APIS (elenco di Michigan, Yale, Duke e Princeton, con i link alle immagini), schede HGV e DCLP (edizione, data, provenienza,
// autore e opera dei testi letterari, riconosciuti poi con data/autori.json: Omero, Menandro…).
//
// Raccolte (una «parte» ciascuna, in serie, con le pause di scripts/rete.mjs):
//   michigan   University of Michigan (APIS): nessuna richiesta. Manifesto quod.lib.umich.edu/cgi/i/image/api/manifest/apis:<entryid>
//              (CORS aperto, pubblico dominio «No Copyright»), entryid dalla scheda APIS.
//   duke       Duke University: immagini GIF a 150 dpi (library.duke.edu/papyrus/images/150dpi/<file>-at150.gif, CORS aperto), niente IIIF:
//              manifesti scritti dal catalogo (scripts/manifesti.mjs, ramo «manifesti»); di ogni immagine si leggono solo i primi 16 byte
//              (larghezza e altezza). Condizioni: solo ricerca e didattica.
//   yale       Beinecke Library, Yale: il handle della scheda APIS (hdl.handle.net/10079/digcoll/<n>) si risolve con l'API del Handle
//              System (hdl.handle.net/api/handles/…, Crawl-delay 1) nel numero dell'oggetto; manifesto collections.library.yale.edu/manifests/<oid>,
//              mai letto da qui (il robots.txt di Yale lo vieta ai programmi di raccolta): lo apre solo il browser di chi legge (CORS aperto).
//   princeton  Princeton University Library: scheda JSON del sito della mostra (dpul.princeton.edu/papyri/catalog/<ark>.json, senza parametri:
//              il robots.txt vieta solo gli indirizzi con «?»; Crawl-delay 10), che dà il manifesto di figgy.princeton.edu (CORS aperto,
//              mai letto da qui: il robots.txt di figgy vieta tutto ai programmi) e i metadati. Diritti: «No Known Copyright».
//   vienna     Österreichische Nationalbibliothek, Papyrussammlung: ricerca di ÖNB Digital (onb.digital, come scripts/fonti/onb.mjs) con
//              «P.Vindob.», poi il manifesto IIIF 3 di ogni oggetto (api.onb.ac.at, CORS aperto), letto una volta: entra solo il materiale
//              «Papyrus». Licenza: solo uso non commerciale.
//   colonia    Kölner Papyri (Universität zu Köln): niente manifesti IIIF. Elenco dalle pagine delle pubblicazioni (papyri.uni-koeln.de/publications/…)
//              e dai link di papyri.info (stueck/tm<TM>); la pagina dell'oggetto dà metadati e immagini (JPEG originali con le misure).
//              /uebersicht (elenco completo con gli inediti) è vietato dal robots.txt: non si usa. Crawl-delay 5. Immagini senza CORS (si vedono,
//              ma gli strumenti di inchiostro no); manifesti scritti dal catalogo. Licenza CC BY 4.0.
//   berkeley   Bancroft Library, Berkeley (Tebtunis): OAI-PMH di digicoll.lib.berkeley.edu (insieme «apis», Crawl-delay 5) e manifesti
//              digicoll.lib.berkeley.edu/record/<n>/export/iiif_manifest (aperti solo dal browser di chi legge). Il 28 ottobre 2026 il server
//              risponde 504 anche dal browser: la parte fallisce senza danni e riprova al giro dopo.
// Stato in data/papiri.json (una voce per riga): ogni elenco si rilegge ogni GIORNI giorni, ogni oggetto una volta sola.
import fs from "node:fs";
import { scarica, scaricaByte, log, tag, records, token } from "../rete.mjs";
import { lingueDa, secoli } from "../lingue.mjs";
import { leggiInfo } from "../papiri-info.mjs";
import { leggiPagina, manifestoOnb } from "./onb.mjs";

export const FILE_STATO = "data/papiri.json";
const VERSIONE = 1, GIORNI = 30;
export const PARTI = ["michigan", "princeton", "duke", "yale", "colonia", "berkeley", "vienna"];
export const RAW = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/";
export const BLOCCATE = {
  "papyri.uni-koeln.de/uebersicht": "robots.txt vieta l'elenco completo della collezione (con gli inediti): entrano solo i papiri delle pubblicazioni e quelli collegati da papyri.info",
  "digicoll.lib.berkeley.edu": "il 28 ottobre 2026 risponde 504 (Gateway Time-out) dal server e dal browser: Berkeley entrerà quando il sito torna",
};

// ------------------------------------------------------------------------------------------------ stato
export function leggiStato(file = FILE_STATO) {
  try { const s = JSON.parse(fs.readFileSync(file, "utf8")); if (s.versione === VERSIONE) return s; } catch (e) {}
  return { versione: VERSIONE, parti: {}, voci: {} };
}
export function salvaStato(st, file = FILE_STATO) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: VERSIONE, aggiornato: st.aggiornato || null, completato: st.completato || null, parti: st.parti || {} });
  fs.writeFileSync(file + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(file + ".tmp", file);
}
const pulisci = v => { for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k]; return v; };
const fresca = p => p && p.completato && Date.now() - Date.parse(p.completato) < GIORNI * 864e5;
const testo = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&([aouAOU])uml;/g, (m, c) => ({ a: "ä", o: "ö", u: "ü", A: "Ä", O: "Ö", U: "Ü" })[c]).replace(/&szlig;/g, "ß").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
class TempoFinito extends Error {}
const controlla = (fine, msg) => { if (Date.now() > fine) throw new TempoFinito(msg); };

// voci di una parte ancora da leggere (q: 1) e lettura una per una, con salvataggio ogni 50
async function leggiVoci(st, parte, fine, leggi) {
  const da = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q);
  let letti = 0, errori = 0;
  for (const k of da) {
    if (Date.now() > fine) break;
    let nuova;
    try { nuova = await leggi(k.slice(parte.length + 1), st.voci[k]); errori = 0; }
    catch (e) { log("papiri", parte, k, e.message); if (++errori >= 5) throw new Error(`${parte}: troppi errori di fila (${e.message})`); continue; }
    if (nuova) { st.voci[k] = pulisci(nuova); delete st.voci[k].q; }
    if (++letti % 50 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("papiri", `${parte}: ${letti} letti su ${da.length}`); }
  }
  const resto = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q).length;
  if (resto) throw new TempoFinito(`${parte}: mancano ${resto} voci, riprenderà alla prossima esecuzione`);
}
// elenco di una parte da una lista di chiavi: le nuove entrano «da leggere», quelle sparite si tolgono
function aggiornaElenco(st, parte, chiavi, iniziale = () => ({})) {
  const visti = new Set(chiavi.map(c => parte + ":" + c));
  for (const c of chiavi) { const k = parte + ":" + c; if (!st.voci[k]) st.voci[k] = { ...iniziale(c), q: 1 }; }
  for (const k of Object.keys(st.voci)) if (k.startsWith(parte + ":") && !visti.has(k)) delete st.voci[k];
  return visti.size;
}
const apisDi = raccolta => Object.entries(leggiInfo().apis).filter(([k]) => k.startsWith(raccolta + ".apis."));

// ------------------------------------------------------------------------------------------------ Duke (misure delle GIF)
export function misureGif(b) {
  if (!b || b.length < 10 || b.toString("latin1", 0, 3) !== "GIF") return null;
  return [b.readUInt16LE(6), b.readUInt16LE(8)];
}
async function leggiDuke(st, fine) {
  const p = st.parti.duke = st.parti.duke || {};
  if (!fresca(p) || !Object.keys(st.voci).some(k => k.startsWith("duke:"))) {
    p.totale = aggiornaElenco(st, "duke", apisDi("duke").map(([k]) => k));
    p.completato = new Date().toISOString();
  }
  await leggiVoci(st, "duke", fine, async (k) => {
    const s = leggiInfo().apis[k]; if (!s) return { x: "scheda APIS sparita" };
    const pg = [];
    for (const f of s.du || []) {
      controlla(fine, "duke: tempo esaurito");
      const r = await scaricaByte(`https://library.duke.edu/papyrus/images/150dpi/${encodeURI(f)}-at150.gif`, { byte: 16 });
      const m = (r.stato === 200 || r.stato === 206) ? misureGif(r.dati) : null;
      if (m) pg.push([f, m[0], m[1]]);
    }
    return pg.length ? { p: pg } : { x: "immagini non raggiungibili" };
  });
}

// ------------------------------------------------------------------------------------------------ Yale (handle -> oggetto)
async function leggiYale(st, fine) {
  const p = st.parti.yale = st.parti.yale || {};
  if (!fresca(p) || !Object.keys(st.voci).some(k => k.startsWith("yale:"))) {
    p.totale = aggiornaElenco(st, "yale", apisDi("yale").map(([k]) => k));
    p.completato = new Date().toISOString();
  }
  await leggiVoci(st, "yale", fine, async (k) => {
    const s = leggiInfo().apis[k]; const h = (s && s.h || [])[0]; if (!h) return { x: "senza handle" };
    const r = await scarica(`https://hdl.handle.net/api/handles/10079/digcoll/${h}`, { timeout: 60000, accept: "application/json" });
    if (r.stato === 404 || r.stato === 410) return { x: `handle HTTP ${r.stato}` };
    if (r.stato !== 200) throw new Error(`handle HTTP ${r.stato}`);
    const url = ((JSON.parse(r.testo).values || []).find(v => v.type === "URL") || {}).data;
    const oid = (/collections\.library\.yale\.edu\/catalog\/(\d+)/.exec(url && url.value || "") || [])[1];
    return oid ? { o: oid } : { x: "handle senza oggetto in Digital Collections" };
  });
}

// ------------------------------------------------------------------------------------------------ Princeton (schede JSON della mostra)
async function leggiPrinceton(st, fine) {
  const p = st.parti.princeton = st.parti.princeton || {};
  if (!fresca(p) || !Object.keys(st.voci).some(k => k.startsWith("princeton:"))) {
    const ark = new Map(); for (const [k, s] of apisDi("princeton")) for (const a of s.pr || []) if (!ark.has(a)) ark.set(a, k);
    p.totale = aggiornaElenco(st, "princeton", [...ark.keys()], a => ({ k: ark.get(a) }));
    p.completato = new Date().toISOString();
  }
  await leggiVoci(st, "princeton", fine, async (ark, v) => {
    const r = await scarica(`https://dpul.princeton.edu/papyri/catalog/${ark}.json`, { timeout: 90000, accept: "application/json" });
    if (r.stato === 404 || r.stato === 410) return { k: v.k, x: `HTTP ${r.stato}` };
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const d = (JSON.parse(r.testo).response || {}).document || {};
    const u = x => (d["readonly_" + x + "_tesim"] || []).map(testo);
    const m = d.content_metadata_iiif_manifest_field_ssi;
    if (!m) return { k: v.k, x: "senza manifesto" };
    return { k: v.k, m, t: u("title")[0] || null, s: (u("call-number")[0] || "").replace(/^Princeton Papyri Collections\s*/i, "") || null, d: u("description").join(" ; ") || null,
      e: u("extent")[0] || null, g: lingueDa(u("language")), r: u("edm-rights")[0] || null };
  });
}

// ------------------------------------------------------------------------------------------------ Vienna (ÖNB Digital)
const QUERY_VIENNA = "P.Vindob.";
// stessa richiesta della pagina di ricerca di ÖNB Digital (come corpoRicerca di scripts/fonti/onb.mjs), senza filtro sul tipo
export function corpoVienna(da, righe = 300) {
  const api = `https://digital.onb.ac.at/rep/discovery/public/search?query=${encodeURIComponent(QUERY_VIENNA)}&fulltext=false&sort=+&rows=${righe}&facetlimit=1&from=${da}`;
  return new URLSearchParams({ api_query: api, item_id: "", keywords: "", from: "", rows: String(righe), auto_complete: "false",
    filters_array: JSON.stringify({ keywords: "", fulltext: "false", years: { von: "", bis: "" }, sort: "+" }) }).toString();
}
async function leggiVienna(st, fine) {
  const p = st.parti.vienna = st.parti.vienna || {};
  if (!fresca(p)) {
    if (p.completato || p.da == null) { p.da = 0; p.completato = null; p.visti = []; }
    const visti = new Set(p.visti || []);
    for (;;) {
      if (Date.now() > fine) { p.visti = [...visti]; throw new TempoFinito(`vienna: elenco fermo a ${p.da}`); }
      const corpo = corpoVienna(p.da);
      const r = await scarica("https://onb.digital/Frontend/search_api_search", { corpo, timeout: 180000 });
      const pg = r.stato === 200 ? leggiPagina(r.testo) : null;
      if (!pg) throw new Error(`vienna: ricerca non leggibile (HTTP ${r.stato}, da ${p.da})`);
      for (const x of pg.voci) {
        if (!/P\.\s?Vindob/i.test(x.t || "")) continue;
        const k = "vienna:" + x.id; visti.add(k);
        st.voci[k] = st.voci[k] && !st.voci[k].q ? { ...st.voci[k], e: { t: x.t, d: x.d } } : { e: { t: x.t, d: x.d }, q: 1 };
      }
      p.totale = pg.totale; p.da += 300;
      if (p.da % 3000 === 0) { log("papiri", `vienna: elenco ${p.da} su ${pg.totale}`); p.visti = [...visti]; salvaStato(st); }
      if (!pg.voci.length || p.da >= pg.totale) break;
    }
    if (visti.size > 1000) for (const k of Object.keys(st.voci)) if (k.startsWith("vienna:") && !visti.has(k)) delete st.voci[k];
    p.visti = null; p.da = null; p.completato = new Date().toISOString();
    salvaStato(st);
  }
  await leggiVoci(st, "vienna", fine, async (id, v) => {
    const r = await scarica(manifestoOnb(id), { timeout: 120000, accept: "application/json", tentativi: 2 });
    if (r.stato === 404 || r.stato === 410) return { e: v.e, x: `HTTP ${r.stato}` };
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    return { e: v.e, ...schedaVienna(JSON.parse(r.testo)) };
  });
}
// manifesto IIIF 3 dell'ÖNB -> { s, t, d, l, mt, rz, n, c } oppure { x: motivo }
export function schedaVienna(m) {
  const meta = {};
  for (const x of m.metadata || []) { const k = (x.label && (x.label.de || x.label.en || Object.values(x.label)[0]) || [])[0]; if (k) meta[k] = x.value; }
  const de = k => { const v = meta[k]; if (!v) return []; return (v.de || v.none || v.en || Object.values(v)[0] || []).map(testo).filter(Boolean); };
  const en = k => { const v = meta[k]; if (!v) return []; return (v.en || v.none || v.de || []).map(testo).filter(Boolean); };
  const mt = de("Medientyp")[0] || null, n = (m.items || []).length;
  const seg = (de("Signatur")[0] || "").replace(/\s+PAP\s+[A-Z]+$/, "").trim();
  if (!n) return { x: "manifesto senza immagini", s: seg || undefined };
  if (!/papyrus/i.test(mt || "")) return { x: "materiale " + (mt || "non indicato"), s: seg || undefined };
  return { s: seg || null, t: de("Titel")[0] || null, d: de("Jahr/Datierung")[0] || null, o: de("Erscheinungsort")[0] || null, l: en("Sprachen"), mt, rz: de("IDNR")[0] || null, n,
    c: de("Weitere Informationen").join(" ; ").slice(0, 600) || null };
}

// ------------------------------------------------------------------------------------------------ Colonia (pagine degli oggetti)
const KOELN = "https://papyri.uni-koeln.de";
async function leggiColonia(st, fine) {
  const p = st.parti.colonia = st.parti.colonia || {};
  if (!fresca(p)) {
    const ids = new Set();
    // link di papyri.info: pagine nuove (stueck/<id>) e vecchie (si usa il numero Trismegistos: stueck/tm<TM>)
    const ch = leggiInfo().chiavi || {};
    for (const k of Object.keys(ch)) if (k.startsWith("koeln:")) ids.add(k.slice(6));
    for (const t of ch.koeln || []) ids.add("tm" + t);
    // pagine delle pubblicazioni
    controlla(fine, "colonia: tempo esaurito");
    const r = await scarica(`${KOELN}/publications`, { timeout: 90000 });
    if (r.stato !== 200) throw new Error(`colonia: pubblicazioni HTTP ${r.stato}`);
    for (const pub of [...new Set([...r.testo.matchAll(/href="https:\/\/papyri\.uni-koeln\.de\/publications\/([^"#?]+)"/g)].map(m => m[1]))]) {
      controlla(fine, "colonia: tempo esaurito nell'elenco");
      const x = await scarica(`${KOELN}/publications/${pub}`, { timeout: 90000 });
      if (x.stato !== 200) { log("papiri", `colonia: ${pub} HTTP ${x.stato}`); continue; }
      for (const m of x.testo.matchAll(/papyri\.uni-koeln\.de\/stueck\/([A-Za-z0-9_]+)/g)) ids.add(m[1]);
    }
    // gli id «DS_…» delle pagine delle pubblicazioni e i «tm…» possono indicare lo stesso oggetto: lo si scopre leggendo la pagina (campo «tm»)
    for (const id of ids) { const k = "colonia:" + id; if (!st.voci[k]) st.voci[k] = { q: 1 }; }
    p.totale = ids.size; p.completato = new Date().toISOString();
    salvaStato(st);
  }
  await leggiVoci(st, "colonia", fine, async (id) => {
    const r = await scarica(`${KOELN}/stueck/${id}`, { timeout: 90000 });
    if (r.stato === 404 || r.stato === 410) return { x: `HTTP ${r.stato}` };
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    return schedaColonia(r.testo);
  });
}
// pagina di un oggetto di Colonia -> { s, tm, perm, mat, ts, d, o, l, pub, c, p: [[url, w, h, etichetta]] }
export function schedaColonia(h) {
  const campo = (et) => {
    const i = h.indexOf(`field-label">${et}<`); if (i < 0) return null;
    const j = h.indexOf("field-value", i); if (j < 0) return null;
    const fine = [h.indexOf("field-label", j), h.indexOf("field-comment", j)].filter(x => x > 0);
    // il pezzo finisce davanti alla classe successiva: si toglie il tag rimasto a metà («<div class="»)
    return testo(h.slice(h.indexOf(">", j) + 1, fine.length ? Math.min(...fine) : j + 2000).replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*$/, "")).replace(/^-->\s*/, "") || null;
  };
  const immagini = [];
  for (const m of h.matchAll(/<div class="desc">([\s\S]*?)<\/div>\s*<ul class="resolutions">\s*<li><a href="([^"]+)">\s*(\d+)x(\d+)/g))
    immagini.push([m[2], +m[3], +m[4], testo(m[1])]);
  const inv = testo((/<title[^>]*>([^<]*)<\/title>/.exec(h) || [])[1] || "").replace(/\s*[–-]\s*Kölner Papyri\s*$/, "");
  const perm = (/Persistenter Link zu diesem Objekt:[\s\S]*?href="https:\/\/papyri\.uni-koeln\.de\/stueck\/([A-Za-z0-9_]+)"/.exec(h) || [])[1] || null;
  if (!immagini.length) return { s: inv || null, perm, x: "senza immagini pubbliche" };
  const pub = (/field-label">Publikationsnr\.<[\s\S]*?<a [^>]*>([^<]*)<\/a>\s*([^<]*)</.exec(h) || []).slice(1, 3).map(testo).join(" ").trim() || null;
  return { s: inv || null, perm, tm: (campo("Trismegistos-Nummer") || "").replace(/\D.*$/, "") || null, mat: campo("Material"), ts: campo("Textsorte"), d: campo("Datierung"), o: campo("Herkunft"),
    l: campo("Sprache/n"), pub, p: immagini.slice(0, 40) };
}

// ------------------------------------------------------------------------------------------------ Berkeley (OAI-PMH)
const OAI_BK = "https://digicoll.lib.berkeley.edu/oai2d";
async function leggiBerkeley(st, fine) {
  const p = st.parti.berkeley = st.parti.berkeley || {};
  if (fresca(p)) return;
  if (p.completato || p.token === undefined) { p.token = null; p.completato = null; p.visti = []; }
  const visti = new Set(p.visti || []);
  for (;;) {
    if (Date.now() > fine) { p.visti = [...visti]; throw new TempoFinito("berkeley: tempo esaurito nell'elenco"); }
    const url = p.token ? `${OAI_BK}?verb=ListRecords&resumptionToken=${encodeURIComponent(p.token)}` : `${OAI_BK}?verb=ListRecords&metadataPrefix=oai_dc&set=apis`;
    const r = await scarica(url, { timeout: 180000, tentativi: 2 });
    if (r.stato !== 200) throw new Error(`berkeley: HTTP ${r.stato}`);
    for (const rec of records(r.testo)) {
      if (/status="deleted"/.test(rec)) continue;
      const n = (/<identifier>[^<]*?(\d+)<\/identifier>/.exec(rec) || [])[1]; if (!n) continue;
      const k = "berkeley:" + n; visti.add(k);
      // dc:identifier: scheda APIS, numero Trismegistos, file delle immagini; dc:date è la data del record, non del papiro
      const ids = tag(rec, "dc:identifier"), img = ids.filter(x => /\/files\/[^/]+\.(jpe?g|tiff?|png)$/i.test(x)).length;
      st.voci[k] = pulisci({ t: tag(rec, "dc:title")[0] || null, g: lingueDa(tag(rec, "dc:language")), a: (ids.map(x => (/(berkeley\.apis\.\d+)/.exec(x) || [])[1]).find(Boolean)) || null,
        tm: (ids.map(x => (/trismegistos\.org\/text\/(\d+)/.exec(x) || [])[1]).find(Boolean)) || null, n: img, c: tag(rec, "dc:description").join(" ; ").slice(0, 600) || null,
        ...(img ? {} : { x: "senza immagini" }) });
    }
    p.token = token(r.testo);
    if (!p.token) break;
  }
  for (const k of Object.keys(st.voci)) if (k.startsWith("berkeley:") && !visti.has(k)) delete st.voci[k];
  p.visti = null; p.totale = visti.size; p.completato = new Date().toISOString();
}

// ------------------------------------------------------------------------------------------------ scansione
export async function scansionaPapiri({ minuti = 30, soloCache = false, parti = PARTI } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  const lavori = { michigan: async () => {}, duke: f => leggiDuke(st, f), yale: f => leggiYale(st, f), princeton: f => leggiPrinceton(st, f),
    vienna: f => leggiVienna(st, f), colonia: f => leggiColonia(st, f), berkeley: f => leggiBerkeley(st, f) };
  const errori = [];
  // tempo diviso fra le parti ancora da fare: nessuna raccolta lunga (Vienna, Yale) toglie tutto il tempo alle altre
  const daFare = parti.filter(p => lavori[p]);
  for (let i = 0; i < daFare.length; i++) {
    const pt = daFare[i], quota = Date.now() + Math.max(0, fine - Date.now()) / (daFare.length - i);
    try { await lavori[pt](quota); log("papiri", `${pt}: ${Object.keys(st.voci).filter(k => k.startsWith(pt + ":")).length} voci`); }
    catch (e) { if (!(e instanceof TempoFinito)) errori.push(e.message); log("papiri", e instanceof TempoFinito ? "" : "ERRORE", e.message); }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  const finita = pt => pt === "michigan" || (st.parti[pt] && st.parti[pt].completato && !Object.keys(st.voci).some(k => k.startsWith(pt + ":") && st.voci[k].q));
  // Berkeley non blocca la «prima lettura completa» finché il suo server non risponde (docs/PAPIRI.md)
  if (PARTI.filter(p => p !== "berkeley").every(finita)) st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  if (errori.length) { const e = new Error(errori.join("; ")); e.stato = st; throw e; }
  return st;
}

// ------------------------------------------------------------------------------------------------ schede per il catalogo
// date: [inizio, fine] con anni negativi per l'a.C. -> testo italiano; secolo solo per le date d.C. (l'indice non ha secoli a.C.)
export function dataItaliana(dn, incerta) {
  if (!dn) return null;
  const [a, b] = dn, y = n => n < 0 ? `${-n} a.C.` : `${n} d.C.`;
  const t = a === b ? y(a) : a < 0 && b < 0 ? `${-a}-${-b} a.C.` : a > 0 && b > 0 ? `${a}-${b} d.C.` : `${y(a)} - ${y(b)}`;
  return t + (incerta ? " (?)" : "");
}
export function secoloDa(dn, testoData) {
  if (dn) return dn[0] > 0 && dn[1] > 0 ? [Math.ceil(dn[0] / 100), Math.ceil(dn[1] / 100)] : null;
  // date dell'egira insieme a quelle cristiane («3. Jh. AH / 9. Jh. n. Chr.»): conta la parte cristiana
  if (/\bAH\b|\bA\.H\./.test(testoData || "")) { const p = String(testoData).split("/").find(x => /n\.\s*Chr|\bAD\b|\bCE\b|d\.\s*C\./.test(x)); testoData = p || ""; }
  if (/v\.\s*Chr|a\.\s*C\.|\bB\.?\s?C\.?(?![a-z])|BCE|av\.\s*J\.-C/i.test(testoData || "")) return null;
  return secoli(testoData);
}
const LINGUE_INV = { G: "grc", L: "la", K: "cop", A: "ar", D: "egy", Aeg: "egy" };
const edizioneDa = (tm, apis) => (tm && tm.e && !/^TM\s?\d+$/.test(tm.e) ? tm.e : null) || (apis && apis.ddb ? apis.ddb.split(";").filter(Boolean).map((x, i) => i ? x : x.replace(/(^|\.)([a-z])/g, (m, p, c) => p + c.toUpperCase()).replace(/([^.])$/, "$1.")).join(" ") : null);
const genereDa = (tm, extra = "") => (tm && tm.lit) || /\bliterar|\bliterary|literarisch|paraliterar/i.test(extra) ? "letterario" : tm || /documentar|dokumentar/i.test(extra) ? "documentario" : null;
// materiale: entrano solo i papiri (fuori legno, ostraka, tavolette, pergamena, carta, pelle) quando la scheda dice il materiale
export const NON_PAPIRO = /\b(wood(en)?|ostra[ck](a|on|ons)?|tablets?|limestone|pottery|(pot)?sherds?|leather|parchment|vellum|paper|linen|bone|stone|clay|holz|pergament|papier|leinen|kalkstein|ton(scherbe)?)\b/i;
export const papiroVero = (...materiali) => { const t = materiali.filter(Boolean).join(" ; "); return !t || /papyr/i.test(t) || !NON_PAPIRO.test(t); };
const breve = (s, n = 200) => { s = String(s || "").replace(/\s+/g, " ").trim(); if (s.length <= n) return s || null; const p = s.slice(0, n).lastIndexOf(" "); return s.slice(0, p > 80 ? p : n) + "…"; };
const titoloApis = s => breve(s.t && !/^(Documentary text|Literary text|Document \(\?\)|Fragment|Text)$/i.test(s.t) ? s.t : s.s || s.t);
const infoTm = n => (n && leggiInfo().tm[n]) || null;
const tmDi = chiave => ((leggiInfo().chiavi || {})[chiave] || [])[0] || null;

function base(parte, id, campi) {
  const { tm, apis, extra = "" } = campi;
  const t = infoTm(tm);
  const dn = (apis && apis.dn) || (t && t.dn) || null;
  const dataTesto = dataItaliana(dn, (apis && apis.dc) || (t && t.dc)) || campi.datazione || (apis && apis.dt) || (t && t.dt) || null;
  const autori = (t && t.a) || [];
  return {
    fonte: "papiri", id: "pap-" + parte + "-" + String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    datazione: dataTesto, secolo: secoloDa(dn, campi.datazione || (apis && apis.dt) || (t && t.dt)),
    titolo: [autori.length ? [autori.join(", "), (t.o || []).join(", ")].filter(Boolean).join(", ") : null, campi.titolo].filter(Boolean).join(" ; ") || null,
    autori_fonte: autori, tipo: "papiro",
    papiro: pulisci({ edizione: edizioneDa(t, apis), provenienza: [campi.provenienza, apis && apis.luogo, t && t.luogo].find(x => x && !/^(unknown|unbekannt|unbekannter herkunft|not known|\?)\.?$/i.test(x.trim())) || null, genere: genereDa(t, extra),
      tm: tm || null, ldab: (t && t.ldab) || null, materiale: campi.materiale || (t && t.mat) || null }),
  };
}

export function recordPapiri(st = leggiStato()) {
  const info = leggiInfo(), out = [];
  // Michigan: dalle schede APIS (nessuna richiesta)
  for (const [k, s] of Object.entries(info.apis)) {
    if (!k.startsWith("michigan.") || !(s.mi || []).length) continue;
    const tm = s.tm || tmDi(k);
    if (!papiroVero(s.sup, (infoTm(tm) || {}).mat)) continue;
    out.push({ ...base("michigan", s.mi[0], { tm, apis: s, titolo: titoloApis(s), extra: [s.t, ...(s.k || [])].join(" ") }), citta: "Ann Arbor", biblioteca: "University of Michigan Library, Papyrology Collection",
      segnatura: s.inv || k, lingue: lingueDa(s.g || []), manifest: `https://quod.lib.umich.edu/cgi/i/image/api/manifest/apis:${s.mi[0]}`,
      pagina: `https://quod.lib.umich.edu/a/apis/x-${s.mi[0]}`, licenza: "University of Michigan Library: pubblico dominio («No Copyright»)", descrizione: s.sup || null });
  }
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!v || v.q || v.x) continue;
    const i = k.indexOf(":"), parte = k.slice(0, i), id = k.slice(i + 1);
    if (parte === "duke" && (v.p || []).length) {
      const s = info.apis[id] || {}, tm = s.tm || tmDi(id), n = id.split(".").pop();
      if (!papiroVero(s.sup, (infoTm(tm) || {}).mat)) continue;
      out.push({ ...base("duke", n, { tm, apis: s, titolo: titoloApis(s), extra: [s.t, ...(s.k || [])].join(" ") }), citta: "Durham (NC)", biblioteca: "Duke University, David M. Rubenstein Rare Book & Manuscript Library",
        segnatura: s.inv || id, lingue: lingueDa(s.g || []), manifest: `${RAW}papiri-duke/${n}.json`, pagina: `https://library.duke.edu/papyrus/`,
        licenza: "Duke University: immagini solo per ricerca e didattica (per riprodurle serve il permesso della biblioteca)", immagini: v.p.length, descrizione: s.sup || null });
    } else if (parte === "yale" && v.o) {
      const s = info.apis[id] || {}, tm = s.tm || tmDi(id);
      if (!papiroVero(s.sup, (infoTm(tm) || {}).mat)) continue;
      out.push({ ...base("yale", v.o, { tm, apis: s, titolo: titoloApis(s), extra: [s.t, ...(s.k || [])].join(" ") }), citta: "New Haven", biblioteca: "Beinecke Rare Book and Manuscript Library, Yale University",
        segnatura: s.inv || id, lingue: lingueDa(s.g || []), manifest: `https://collections.library.yale.edu/manifests/${v.o}`, pagina: `https://collections.library.yale.edu/catalog/${v.o}`,
        licenza: "Yale University Library: accesso pubblico (condizioni d'uso di Digital Collections)", descrizione: s.sup || null });
    } else if (parte === "princeton" && v.m) {
      const s = info.apis[v.k] || {}, tm = s.tm || tmDi(v.k);
      if (!papiroVero(v.e, s.sup)) continue;
      out.push({ ...base("princeton", id, { tm, apis: s, titolo: v.t || s.t, extra: [s.t, ...(s.k || [])].join(" ") }), citta: "Princeton", biblioteca: "Princeton University Library, Princeton Papyri Collections",
        segnatura: v.s || s.inv || id, lingue: (v.g || []).length ? v.g : lingueDa(s.g || []), manifest: v.m, pagina: `https://dpul.princeton.edu/papyri/catalog/${id}`,
        licenza: v.r ? `Princeton University Library: ${v.r}` : "Princeton University Library", descrizione: [v.e, v.d].filter(Boolean).join(" ; ") || null });
    } else if (parte === "vienna" && v.s) {
      const tm = v.rz ? tmDi(v.rz.toUpperCase()) : null;
      const lettera = (/^([A-Z][a-z]*)\s/.exec(v.s) || [])[1];
      const lingue = lingueDa(v.l || []); if (!lingue.length && LINGUE_INV[lettera]) lingue.push(LINGUE_INV[lettera]);
      out.push({ ...base("vienna", id, { tm, titolo: v.t || (v.e && v.e.t), datazione: v.d || null, provenienza: v.o || null, materiale: v.mt }), citta: "Vienna", biblioteca: "Österreichische Nationalbibliothek, Papyrussammlung",
        segnatura: "P.Vindob. " + v.s, lingue, manifest: manifestoOnb(id), pagina: `https://data.onb.ac.at/rep/${id}`, immagini: v.n || null,
        licenza: "Österreichische Nationalbibliothek: solo uso non commerciale", descrizione: v.c || null });
    } else if (parte === "colonia" && (v.p || []).length) {
      // stesso oggetto raggiunto da due indirizzi (DS_… e tm…): si tiene quello del link permanente
      if (v.perm && v.perm !== id && st.voci["colonia:" + v.perm] && !st.voci["colonia:" + v.perm].x) continue;
      const tm = v.tm || (/^tm(\d+)$/.exec(id) || [])[1] || null;
      if (!papiroVero(v.mat)) continue;
      out.push({ ...base("colonia", id, { tm, titolo: null, datazione: v.d, provenienza: v.o, materiale: v.mat, extra: v.ts || "" }), citta: "Köln", biblioteca: "Universität zu Köln, Papyrussammlung",
        segnatura: v.s ? "P.Köln " + v.s : id, lingue: lingueDa((v.l || "").split(/,\s*/)), manifest: `${RAW}papiri-colonia/${id.toLowerCase()}.json`,
        pagina: `${KOELN}/stueck/${v.perm || id}`, licenza: "CC BY 4.0, Institut für Altertumskunde der Universität zu Köln", immagini: v.p.length });
      const r = out[out.length - 1]; if (v.pub && !r.papiro.edizione) r.papiro.edizione = v.pub;
    } else if (parte === "berkeley") {
      const s = info.apis[v.a] || {}, tm = v.tm || s.tm || (v.a ? tmDi(v.a) : null);
      if (!papiroVero(s.sup)) continue;
      out.push({ ...base("berkeley", id, { tm, apis: s, titolo: v.t || titoloApis(s), extra: [s.t, ...(s.k || [])].join(" ") }), immagini: v.n || null, citta: "Berkeley", biblioteca: "Bancroft Library, University of California, Berkeley (Center for the Tebtunis Papyri)",
        segnatura: s.inv || (v.t || "").split(". ")[0] || "Record " + id, lingue: (v.g || []).length ? v.g : lingueDa(s.g || []), manifest: `https://digicoll.lib.berkeley.edu/record/${id}/export/iiif_manifest`,
        pagina: `https://digicoll.lib.berkeley.edu/record/${id}`, licenza: "Bancroft Library: uso libero del materiale di pubblico dominio", descrizione: v.c || null });
    }
  }
  for (const r of out) if (!r.titolo) delete r.titolo;
  return out;
}

// papiri già nel catalogo da altre fonti: Heidelberger Papyrussammlung (fonte «heidelberg») e «Pap.» della Bayerische Staatsbibliothek
export function papiroDa(v) {
  if (!v || v.tipo) return null;
  if (v.fonte === "heidelberg" && /Papyrussammlung/.test(v.biblioteca || "") && !/^O\.|Ostr/i.test(v.segnatura || "")) return "papiro";
  if (v.fonte === "bsb" && /^Pap\.[a-z]+\.mon\./i.test(v.segnatura || "")) return "papiro";
  return null;
}

// ------------------------------------------------------------------------------------------------ manifesti scritti dal catalogo (scripts/manifesti.mjs)
const lm = (s, l = "none") => ({ [l]: [String(s)] });
const coppia = (k, v) => v && (!Array.isArray(v) || v.length) ? { label: lm(k, "it"), value: lm(Array.isArray(v) ? v.join(" ; ") : v) } : null;
function manifestoImmagini(id, titolo, meta, attribuzione, pagina, immagini, formato, diritti) {
  const items = immagini.map(([url, w, h, et], i) => {
    const c = `${id}/canvas/${i + 1}`;
    return { id: c, type: "Canvas", label: lm(et || String(i + 1)), width: w, height: h,
      items: [{ id: `${c}/page`, type: "AnnotationPage", items: [{ id: `${c}/page/image`, type: "Annotation", motivation: "painting", target: c,
        body: { id: url, type: "Image", format: formato, width: w, height: h } }] }] };
  });
  return { "@context": "http://iiif.io/api/presentation/3/context.json", id, type: "Manifest", label: lm(titolo), metadata: meta.filter(Boolean),
    requiredStatement: { label: lm("Attribuzione", "it"), value: lm(attribuzione, "it") }, ...(diritti ? { rights: diritti } : {}),
    homepage: [{ id: pagina, type: "Text", label: lm(titolo), format: "text/html" }], items };
}
export function manifestiPapiri(st = leggiStato()) {
  const out = { "papiri-duke": {}, "papiri-colonia": {} };
  const rs = new Map(recordPapiri(st).map(r => [r.id, r]));
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!v || v.q || v.x || !(v.p || []).length) continue;
    const [parte, id] = [k.slice(0, k.indexOf(":")), k.slice(k.indexOf(":") + 1)];
    if (parte === "duke") {
      const n = id.split(".").pop(), r = rs.get("pap-duke-" + n); if (!r) continue;
      out["papiri-duke"][n] = manifestoImmagini(`${RAW}papiri-duke/${n}.json`, `Duke University, ${r.segnatura}`,
        [coppia("Biblioteca", r.biblioteca), coppia("Segnatura", r.segnatura), coppia("Edizione", r.papiro.edizione), coppia("Datazione", r.datazione), coppia("Contenuto", r.titolo)],
        "Duke University, David M. Rubenstein Rare Book & Manuscript Library. Immagini solo per ricerca e didattica.", r.pagina,
        v.p.map(([f, w, h]) => [`https://library.duke.edu/papyrus/images/150dpi/${encodeURI(f)}-at150.gif`, w, h, f]), "image/gif", null);
    } else if (parte === "colonia") {
      const r = rs.get("pap-colonia-" + id.toLowerCase().replace(/[^a-z0-9]+/g, "-")); if (!r) continue;
      out["papiri-colonia"][id.toLowerCase()] = manifestoImmagini(`${RAW}papiri-colonia/${id.toLowerCase()}.json`, `Kölner Papyri, ${r.segnatura}`,
        [coppia("Biblioteca", r.biblioteca), coppia("Segnatura", r.segnatura), coppia("Edizione", r.papiro.edizione), coppia("Datazione", r.datazione), coppia("Provenienza", r.papiro.provenienza)],
        "Institut für Altertumskunde der Universität zu Köln, Papyrussammlung. Immagini e metadati CC BY 4.0.", r.pagina, v.p, "image/jpeg", "http://creativecommons.org/licenses/by/4.0/");
    }
  }
  return out;
}
