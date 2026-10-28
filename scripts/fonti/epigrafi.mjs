// Epigrafi (dal 28 ottobre 2026): iscrizioni greche, latine e di altre lingue antiche con almeno una foto che si apre nel visore di
// Emendando, secondo la verifica di docs/EPIGRAFI.md (stessa regola dei papiri: niente schede senza immagine). Nel catalogo sono la
// fonte «epigrafi» (id «ep-<raccolta>-…»), con «tipo» «epigrafe» e i dati epigrafici in «epigrafe» (edizione, numeri EDH e
// Trismegistos, luogo di ritrovamento, luogo di conservazione, datazione, supporto, genere dell'iscrizione, testo quando la licenza
// lo consente, licenza dei metadati).
//
// Raccolte (una «parte» ciascuna, in serie, con le pause di scripts/rete.mjs):
//   edh        Epigraphic Database Heidelberg: nessuna richiesta. Estratto dei dati aperti (CC BY-SA 4.0) in data/epigrafi-edh.json,
//              scritto da scripts/epigrafi-edh.mjs; foto nel server IIIF di heidICON (CORS aperto). Una foto: manifesto IIIF dell'EDH
//              (edh.ub.uni-heidelberg.de/iiif/edh/<F>.manifest.json); più foto: manifesto scritto dal catalogo (ramo «manifesti») con
//              i servizi IIIF di heidICON. Metadati e testi CC BY-SA 4.0: restano aperti (docs/LICENZE.md).
//   met        The Metropolitan Museum of Art: ricerca dell'API (collectionapi.metmuseum.org, v1.1) per dipartimento, poi la scheda di
//              ogni oggetto, una volta sola; entrano solo le iscrizioni in pubblico dominio (Open Access, CC0) con immagine. Niente IIIF:
//              manifesti scritti dal catalogo, con le misure lette dai primi 64 KB di ogni JPEG (images.metmuseum.org, CORS aperto).
//   wikidata   Wikidata (dati CC0): una interrogazione SPARQL delle iscrizioni (Q1640824 e sottoclassi) con immagine (P18), solo
//              quelle antiche (lingua antica, numero di una banca dati epigrafica, oppure data prima del 700); misure, licenza e
//              autore delle immagini dall'API di Wikimedia Commons (50 file per richiesta). Manifesti scritti dal catalogo con le
//              immagini di upload.wikimedia.org (CORS aperto). Fuori i doppioni di EDH e del Met (stesso numero EDH o oggetto del Met).
// Stato in data/epigrafi.json (una voce per riga): ogni elenco si rilegge ogni GIORNI giorni, ogni oggetto una volta sola.
import fs from "node:fs";
import { scarica, scaricaByte, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { leggiEdh, LICENZA as LICENZA_EDH } from "../epigrafi-edh.mjs";
import { dataItaliana, secoloDa } from "./papiri.mjs";

export const FILE_STATO = "data/epigrafi.json";
const VERSIONE = 1, GIORNI = 30;
export const PARTI = ["edh", "wikidata", "met"];
export const RAW = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/";
export const HEIDICON = "https://heidicon.ub.uni-heidelberg.de/iiif/2/";
export const EDH = "https://edh.ub.uni-heidelberg.de";

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
class TempoFinito extends Error {}
const breve = (s, n = 200) => { s = String(s || "").replace(/\s+/g, " ").trim(); if (s.length <= n) return s || null; const p = s.slice(0, n).lastIndexOf(" "); return s.slice(0, p > 80 ? p : n) + "…"; };

async function leggiVoci(st, parte, fine, leggi) {
  const da = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q);
  let letti = 0, errori = 0;
  for (const k of da) {
    if (Date.now() > fine) break;
    let nuova;
    try { nuova = await leggi(k.slice(parte.length + 1), st.voci[k], fine); errori = 0; }
    catch (e) { if (e instanceof TempoFinito) break; log("epigrafi", parte, k, e.message); if (++errori >= 5) throw new Error(`${parte}: troppi errori di fila (${e.message})`); continue; }
    if (nuova) { st.voci[k] = pulisci(nuova); delete st.voci[k].q; }
    if (++letti % 50 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("epigrafi", `${parte}: ${letti} letti su ${da.length}`); }
  }
  const resto = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q).length;
  if (resto) throw new TempoFinito(`${parte}: mancano ${resto} voci, riprenderà alla prossima esecuzione`);
}

// ------------------------------------------------------------------------------------------------ misure dei JPEG (primi byte)
// larghezza e altezza dal segmento SOF (dopo EXIF, XMP e profili ICC, di solito nei primi 64 KB)
export function misureJpeg(b) {
  if (!b || b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xFF) return null;
    const m = b[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ Met
const MET = "https://collectionapi.metmuseum.org/public/collection/v1";
// dipartimenti: 13 arte greca e romana, 3 Vicino Oriente antico, 10 arte egizia, 17 arte medievale (iscrizioni tardoantiche e bizantine)
export const RICERCHE_MET = [[13, "inscription"], [13, "inscribed"], [13, "stele"], [13, "epitaph"], [3, "inscription"], [3, "cuneiform"], [10, "stela"], [10, "inscription"], [17, "inscription"]];
const SI_MET = /\binscri(?:bed|ption|ptions)\b|\bstel[ae]\b|\bstelai\b|\bepitaph|\bdecree\b|\bcippus\b|\bmilestone\b|\bkudurru\b|\bcuneiform\b|\bfunerary (?:plaque|altar|relief|monument)\b|\bboundary stone\b|\bdedicat(?:ion|ory)\b/i;
const NO_MET = /\b(?:vases?|lamps?|coins?|gems?|jewel(?:ry|lery)|seals?|scarabs?|rings?|cups?|bowls?|kylix|lekythos|amphora|hydria|krater|oinochoe|skyphos|aryballos|pyxis|mirrors?|figurines?|statuettes?|beads?|amulets?|weights?|textiles?|glass|ostraka?|papyrus|papyri|manuscripts?|leaf|folio)\b/i;
export function iscrizioneMet(o) {
  if (!o || !o.isPublicDomain || !o.primaryImage) return false;
  const nome = [o.objectName, o.title].filter(Boolean).join(" ; ");
  if (NO_MET.test(o.objectName || "") || /^(?:Vases|Gems|Coins|Jewelry|Glass|Lamps|Seals|Terracottas|Textiles|Papyri)/i.test(o.classification || "")) return false;
  return SI_MET.test(nome);
}
async function leggiMet(st, fine) {
  const p = st.parti.met = st.parti.met || {};
  if (!fresca(p)) {
    const ids = new Set();
    for (const [dip, q] of RICERCHE_MET) {
      for (let da = 0; ; da += 100) {
        if (Date.now() > fine) throw new TempoFinito("met: tempo esaurito nell'elenco");
        const r = await scarica(`${MET}.1/search?departmentId=${dip}&q=${encodeURIComponent(q)}&hasImages=true&limit=100&offset=${da}`, { timeout: 90000, accept: "application/json" });
        if (r.stato !== 200) throw new Error(`met: ricerca HTTP ${r.stato}`);
        const d = JSON.parse(r.testo), lista = d.objectIDs || [];
        for (const id of lista) ids.add(String(id));
        if (!lista.length || da + 100 >= (d.total || 0)) break;
      }
    }
    for (const id of ids) { const k = "met:" + id; if (!st.voci[k]) st.voci[k] = { q: 1 }; }
    p.totale = ids.size; p.completato = new Date().toISOString();
    salvaStato(st);
  }
  await leggiVoci(st, "met", fine, async (id, v, fine) => {
    const r = await scarica(`${MET}/objects/${id}`, { timeout: 90000, accept: "application/json" });
    if (r.stato === 404 || r.stato === 410) return { x: `HTTP ${r.stato}` };
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const o = JSON.parse(r.testo);
    if (!iscrizioneMet(o)) return { x: o.isPublicDomain === false ? "non in pubblico dominio" : !o.primaryImage ? "senza immagine" : "non è un'iscrizione" };
    const pg = [];
    for (const u of [o.primaryImage, ...(o.additionalImages || [])].filter(Boolean).slice(0, 8)) {
      if (Date.now() > fine) throw new TempoFinito("met: tempo esaurito");
      const b = await scaricaByte(u, { byte: 65536 });
      const m = (b.stato === 200 || b.stato === 206) ? misureJpeg(b.dati) : null;
      if (m) pg.push([u.replace(/^https:\/\/images\.metmuseum\.org\/CRDImages\//, ""), m[0], m[1]]);
    }
    if (!pg.length) return { x: "immagini non leggibili" };
    const t = s => breve(s, 300);
    return { t: t(o.title), n: t(o.objectName), s: o.accessionNumber || null, d: o.objectDate || null, dn: o.objectBeginDate != null ? [o.objectBeginDate, o.objectEndDate] : null,
      cu: t(o.culture), pe: t(o.period), me: t(o.medium), di: t(o.dimensions), dip: o.department || null,
      o: t([o.excavation, o.city, o.region, o.subregion, o.country].filter(Boolean).join(", ")), u: o.objectURL || null, cl: o.classification || null, p: pg };
  });
}

// ------------------------------------------------------------------------------------------------ Wikidata e Wikimedia Commons
const SPARQL = "https://query.wikidata.org/sparql";
export const QUERY_WD = `SELECT ?i (SAMPLE(?lab) AS ?l) (GROUP_CONCAT(DISTINCT ?img; separator="|") AS ?imgs) (GROUP_CONCAT(DISTINCT ?lc; separator="|") AS ?lingue)
  (SAMPLE(?edh) AS ?edh) (SAMPLE(?edcs) AS ?edcs) (SAMPLE(?edr) AS ?edr) (SAMPLE(?tm) AS ?tm) (SAMPLE(?phi) AS ?phi) (SAMPLE(?rib) AS ?rib) (SAMPLE(?met) AS ?met)
  (SAMPLE(?collL) AS ?coll) (SAMPLE(?locL) AS ?loc) (SAMPLE(?foundL) AS ?found) (SAMPLE(?inc) AS ?inc) (GROUP_CONCAT(DISTINCT ?matL; separator="|") AS ?mat) (SAMPLE(?inv) AS ?inv) WHERE {
  ?i wdt:P31/wdt:P279* wd:Q1640824 ; wdt:P18 ?img .
  OPTIONAL { ?i wdt:P407 ?lg . OPTIONAL { ?lg wdt:P218 ?iso1 } OPTIONAL { ?lg wdt:P220 ?iso3 } BIND(COALESCE(?iso1, ?iso3, STRAFTER(STR(?lg), "entity/")) AS ?lc) }
  OPTIONAL { ?i wdt:P11273 ?edh } OPTIONAL { ?i wdt:P11656 ?edcs } OPTIONAL { ?i wdt:P12495 ?edr } OPTIONAL { ?i wdt:P8532 ?tm } OPTIONAL { ?i wdt:P11299 ?phi }
  OPTIONAL { ?i wdt:P13241 ?rib } OPTIONAL { ?i wdt:P3634 ?met }
  OPTIONAL { ?i wdt:P571 ?inc } OPTIONAL { ?i wdt:P217 ?inv }
  OPTIONAL { ?i wdt:P195 ?col . ?col rdfs:label ?collL . FILTER(LANG(?collL) = "en") }
  OPTIONAL { ?i wdt:P276 ?lo . ?lo rdfs:label ?locL . FILTER(LANG(?locL) = "en") }
  OPTIONAL { ?i wdt:P189 ?fo . ?fo rdfs:label ?foundL . FILTER(LANG(?foundL) = "en") }
  OPTIONAL { ?i wdt:P186 ?m . ?m rdfs:label ?matL . FILTER(LANG(?matL) = "en") }
  OPTIONAL { ?i rdfs:label ?lab . FILTER(LANG(?lab) IN ("it", "en")) }
} GROUP BY ?i`;
// lingue antiche (codici ISO dati da Wikidata)
const ANTICHE = new Set("la grc egy cop arc phn xpu akk sux hit xlc xly xpr peo elx osc ett xum xve xce xga xcg xib xlu xls hbo he syc gez xsa xna ave pal xmn obm uga".split(" "));
export function anticaWd(x) {
  const ids = ["edh", "edcs", "edr", "tm", "phi", "rib"].some(k => x[k]);
  const lg = (x.lingue || []).some(l => ANTICHE.has(l));
  const anno = (/^(-?\d+)-/.exec(x.inc || "") || [])[1];
  return ids || lg || (anno != null && +anno < 700);
}
const fileCommons = u => decodeURIComponent(String(u).replace(/^https?:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//, "")).replace(/_/g, " ");
async function leggiWikidata(st, fine) {
  const p = st.parti.wikidata = st.parti.wikidata || {};
  if (!fresca(p)) {
    const r = await scarica(SPARQL, { corpo: new URLSearchParams({ query: QUERY_WD }).toString(), accept: "application/sparql-results+json", timeout: 180000, tentativi: 2 });
    if (r.stato !== 200) throw new Error(`wikidata: SPARQL HTTP ${r.stato}`);
    const visti = new Set();
    for (const b of JSON.parse(r.testo).results.bindings) {
      const g = k => (b[k] && b[k].value) || null;
      const q = g("i").replace(/^.*\//, "");
      const x = pulisci({ l: g("l"), imgs: (g("imgs") || "").split("|").filter(Boolean).map(fileCommons).slice(0, 8), lingue: (g("lingue") || "").split("|").filter(Boolean),
        edh: g("edh"), edcs: g("edcs"), edr: g("edr"), tm: g("tm"), phi: g("phi"), rib: g("rib"), met: g("met"), coll: g("coll"), loc: g("loc"), found: g("found"),
        inc: g("inc"), mat: (g("mat") || "").split("|").filter(Boolean), inv: g("inv") });
      if (!anticaWd(x)) continue;
      const k = "wikidata:" + q; visti.add(k);
      const prima = st.voci[k];
      // dati della scheda sempre aggiornati; le misure delle immagini restano se i file non cambiano
      st.voci[k] = prima && !prima.q && JSON.stringify(prima.imgs) === JSON.stringify(x.imgs) ? { ...x, p: prima.p, x: prima.x } : { ...x, q: 1 };
    }
    for (const k of Object.keys(st.voci)) if (k.startsWith("wikidata:") && !visti.has(k)) delete st.voci[k];
    p.totale = visti.size; p.completato = new Date().toISOString();
    salvaStato(st);
  }
  // misure, licenza e autore delle immagini: API di Commons, 50 file per richiesta
  const da = Object.keys(st.voci).filter(k => k.startsWith("wikidata:") && st.voci[k].q);
  const file = [...new Set(da.flatMap(k => st.voci[k].imgs || []))];
  const info = new Map();
  for (let i = 0; i < file.length; i += 50) {
    if (Date.now() > fine) throw new TempoFinito(`wikidata: tempo esaurito nelle immagini (${i} file su ${file.length})`);
    const titoli = file.slice(i, i + 50).map(f => "File:" + f).join("|");
    const corpo = new URLSearchParams({ action: "query", format: "json", formatversion: "2", prop: "imageinfo", iiprop: "size|url|extmetadata|mime", iiurlwidth: "3000",
      iiextmetadatafilter: "LicenseShortName|Artist|UsageTerms", titles: titoli }).toString();
    const r = await scarica("https://commons.wikimedia.org/w/api.php", { corpo, accept: "application/json", timeout: 90000 });
    if (r.stato !== 200) throw new Error(`commons: HTTP ${r.stato}`);
    const d = JSON.parse(r.testo), norm = new Map(((d.query || {}).normalized || []).map(n => [n.to, n.from]));
    for (const pg of (d.query || {}).pages || []) {
      const ii = (pg.imageinfo || [])[0]; if (!ii) continue;
      const nome = (norm.get(pg.title) || pg.title).replace(/^File:/, "");
      const em = ii.extmetadata || {}, val = k => breve(String((em[k] || {}).value || "").replace(/<[^>]+>/g, " "), 120);
      if (!/^image\/(jpeg|png|gif|webp|tiff)$/.test(ii.mime || "")) continue;
      // immagine: la miniatura di Commons larga al massimo 3000 pixel (stessa licenza del file), oppure l'originale se è più piccolo
      const usaMini = ii.thumburl && ii.thumbwidth && ii.thumbwidth < ii.width;
      const senzaUtm = u => String(u || "").replace(/\?utm_[^#]*$/, "");
      info.set(nome.replace(/_/g, " "), [senzaUtm(usaMini ? ii.thumburl : ii.url), usaMini ? ii.thumbwidth : ii.width, usaMini ? ii.thumbheight : ii.height, val("LicenseShortName") || val("UsageTerms"), val("Artist"), ii.descriptionurl || null]);
    }
  }
  for (const k of da) {
    const v = st.voci[k], pg = (v.imgs || []).map(f => info.get(f)).filter(Boolean);
    if (pg.length) { v.p = pg; delete v.x; } else v.x = "immagini non leggibili su Commons";
    delete v.q;
  }
}

// ------------------------------------------------------------------------------------------------ scansione
export async function scansionaEpigrafi({ minuti = 30, soloCache = false, parti = PARTI } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  const lavori = { edh: async () => { st.parti.edh = { totale: Object.keys(leggiEdh().voci || {}).length, completato: new Date().toISOString() }; },
    met: f => leggiMet(st, f), wikidata: f => leggiWikidata(st, f) };
  const errori = [];
  const daFare = parti.filter(p => lavori[p]);
  for (let i = 0; i < daFare.length; i++) {
    const pt = daFare[i], quota = Date.now() + Math.max(0, fine - Date.now()) / (daFare.length - i);
    try { await lavori[pt](quota); log("epigrafi", `${pt}: ${pt === "edh" ? st.parti.edh.totale : Object.keys(st.voci).filter(k => k.startsWith(pt + ":")).length} voci`); }
    catch (e) { if (!(e instanceof TempoFinito)) errori.push(e.message); log("epigrafi", e instanceof TempoFinito ? "" : "ERRORE", e.message); }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  const finita = pt => st.parti[pt] && st.parti[pt].completato && !Object.keys(st.voci).some(k => k.startsWith(pt + ":") && st.voci[k].q);
  if (PARTI.every(finita)) st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  if (errori.length) { const e = new Error(errori.join("; ")); e.stato = st; throw e; }
  return st;
}

// ------------------------------------------------------------------------------------------------ schede per il catalogo
// EDH: codici della banca dati -> italiano
export const PROVINCE_EDH = { Ach: "Achaia", Aeg: "Aegyptus", Aem: "Aemilia (Regio VIII)", Afr: "Africa Proconsularis", AlC: "Alpes Cottiae", AlG: "Alpes Graiae", AlM: "Alpes Maritimae",
  AlP: "Alpes Poeninae", ApC: "Apulia et Calabria (Regio II)", Aqu: "Aquitania", Ara: "Arabia", Arm: "Armenia", Asi: "Asia", Ass: "Assyria", Bae: "Baetica", Bar: "Barbaricum",
  Bel: "Belgica", BiP: "Bithynia et Pontus", BrL: "Bruttium et Lucania (Regio III)", Bri: "Britannia", Cap: "Cappadocia", Cil: "Cilicia", Cor: "Corsica", Cre: "Creta",
  Cyp: "Cyprus", Cyr: "Cyrene", Dac: "Dacia", Dal: "Dalmatia", Epi: "Epirus", Etr: "Etruria (Regio VII)", Gal: "Galatia", GeI: "Germania inferior", GeS: "Germania superior",
  HiC: "Hispania citerior", Inc: "provincia incerta", Iud: "Iudaea", LaC: "Latium et Campania (Regio I)", Lig: "Liguria (Regio IX)", Lug: "Lugdunensis", Lus: "Lusitania",
  LyP: "Lycia et Pamphylia", MaC: "Mauretania Caesariensis", MaT: "Mauretania Tingitana", Mak: "Macedonia", Mes: "Mesopotamia", MoI: "Moesia inferior", MoS: "Moesia superior",
  Nar: "Narbonensis", Nor: "Noricum", Num: "Numidia", PaI: "Pannonia inferior", PaS: "Pannonia superior", Pic: "Picenum (Regio V)", Rae: "Raetia", ReB: "Regnum Bospori",
  Rom: "Roma", Sam: "Samnium (Regio IV)", Sar: "Sardinia", Sic: "Sicilia, Melita", Syr: "Syria", Thr: "Thracia", Tra: "Transpadana (Regio XI)", Tri: "Tripolitania",
  Umb: "Umbria (Regio VI)", Val: "Valeria", VeH: "Venetia et Histria (Regio X)" };
export const GENERI_EDH = { titsep: "iscrizione sepolcrale", titsac: "iscrizione votiva", tithon: "iscrizione onoraria", titoppubpriv: "iscrizione di edificio o dedica",
  miliarium: "miliario", elogium: "elogio", titpossfabr: "iscrizione di proprietario o artefice", nota: "iscrizione di identificazione", titterm: "iscrizione di confine",
  indexlaterc: "elenco", titiurpub: "iscrizione di diritto pubblico", titreiexpl: "didascalia", titaccl: "acclamazione", diplmil: "diploma militare", oratio: "preghiera",
  titadsig: "iscrizione di assegnazione", titdefix: "defixio", titsedspect: "iscrizione di posto a sedere", titiurpriv: "iscrizione di diritto privato", fasti: "calendario",
  brief: "lettera", titadnun: "annuncio" };
export const SUPPORTI_EDH = { Altar: "altare", Tafel: "tavola", Stele: "stele", Statuenbasis: "base di statua", Architekturteil: "elemento architettonico", Block: "blocco",
  Basis: "base", Sarkophag: "sarcofago", Meilenstein: "miliario", Relief: "rilievo", Platte: "lastra", instrsac: "instrumentum sacro", EhrenVotivsäule: "colonna onoraria o votiva",
  Cippus: "cippo", instrdom: "instrumentum domestico", Grabbau: "monumento funerario", Urne: "urna", Statue: "statua", Tessera: "tessera", Fels: "roccia", Ziegel: "laterizio",
  EhrenVotivbogen: "arco onorario o votivo", Herme: "erma", instrmil: "instrumentum militare", Mensa: "mensa", Cupa: "cupa", Schmuck: "gioiello", Brunnen: "fontana",
  Stadtbefestigung: "fortificazione", Pflaster: "pavimento", Clipeus: "clipeo", Skulptur: "scultura", Waffe: "arma", Diptychon: "dittico", Bueste: "busto", Barren: "lingotto",
  Bank: "panca" };
export const MATERIALI_EDH = { Kalkstein: "calcare", Sandstein: "arenaria", Marmor: "marmo", Gesteine: "pietra", "Marmor, weiß": "marmo bianco", Ton: "terracotta", Bronze: "bronzo",
  "Marmor, geädert / farbig": "marmo venato o colorato", Tuff: "tufo", Trachyt: "trachite", Muschelkalk: "calcare conchigliare", Basalt: "basalto", Travertin: "travertino",
  Konglomerat: "conglomerato", Oolith: "oolite", Blei: "piombo", "Gesteine unbestimmt": "pietra non determinata", Vulkantuff: "tufo vulcanico", Granit: "granito", Silber: "argento",
  Kalktuff: "tufo calcareo", Gneis: "gneiss", Schiefer: "ardesia", Andesit: "andesite", "Silber, Gold": "argento e oro", Eisen: "ferro", "Bronze, Gold": "bronzo e oro",
  Steatit: "steatite", Holz: "legno", Leder: "cuoio", Speckstein: "steatite", Glas: "vetro", "Bronze, Silber": "bronzo e argento", Porphyr: "porfido", Messing: "ottone",
  Kupfer: "rame", Dolomit: "dolomite", Gold: "oro" };
const LINGUE_EDH = { L: "la", G: "grc", H: "he", P: "xpu" };
export const lingueEdh = s => [...new Set(String(s || "").replace(/Ib|Py|It/g, "").split("").map(c => LINGUE_EDH[c]).filter(Boolean))].sort((a, b) => (a === "la" ? -1 : b === "la" ? 1 : 0));
const CONC_MIC = /Conc\.?\s*Min/i;
const maiuscola = s => s ? s[0].toUpperCase() + s.slice(1) : s;

export function recordEdh(hd, v) {
  const fotos = v.f || []; if (!fotos.length) return null;
  const co = v.co && !/^verschollen|^unbekannt|^nicht/i.test(v.co) ? v.co : null;
  const citta = co ? (co.includes(",") ? co.split(",")[0].trim() : null) : null;
  const presso = x => x ? x.replace(/,\s*bei\b/g, " (nei pressi)").replace(/\bbei\s+/g, "presso ") : x;
  const luogo = [presso(v.fa), v.fm && v.fm !== v.fa ? presso(v.fm) : null].filter(Boolean).join(" / ") || null;
  const genere = GENERI_EDH[v.ge] || null, supporto = [SUPPORTI_EDH[v.mo] || v.mo, MATERIALI_EDH[v.ma] || v.ma].filter(Boolean).join(", ") || null;
  const datazione = dataItaliana(v.dn);
  const mic = fotos.some(f => CONC_MIC.test(f[4] || ""));
  return {
    fonte: "epigrafi", id: "ep-edh-" + hd.toLowerCase(), tipo: "epigrafe",
    citta, biblioteca: co || (v.co ? "Luogo di conservazione sconosciuto (EDH: " + v.co + ")" : "Luogo di conservazione non indicato (EDH)"),
    segnatura: v.ed ? `${v.ed} (EDH ${hd})` : `EDH ${hd}`,
    titolo: [maiuscola(genere || "iscrizione"), luogo ? "da " + luogo : null].filter(Boolean).join(" ") || null,
    datazione, secolo: secoloDa(v.dn, datazione), lingue: lingueEdh(v.li),
    manifest: fotos.length === 1 ? `${EDH}/iiif/edh/${fotos[0][0]}.manifest.json` : `${RAW}epigrafi-edh/${hd.toLowerCase()}.json`,
    pagina: `${EDH}/edh/inschrift/${hd}`, immagini: fotos.length,
    licenza: "Foto: diritti riservati (heidICON, Heidelberger Akademie der Wissenschaften), pubblicate con il manifesto IIIF dell'EDH" + (mic ? "; foto su concessione del Ministero della Cultura, divieto di ulteriore riproduzione" : "") + `. Dati e testo: ${LICENZA_EDH}`,
    epigrafe: pulisci({ edizione: v.ed || null, edh: hd, tm: v.tm || null, provenienza: [luogo, v.fs].filter(Boolean).join(", ") || null, provincia: PROVINCE_EDH[v.pr] || v.pr || null,
      conservazione: v.co || null, supporto, genere, testo: v.tx || null, licenza_metadati: "CC BY-SA 4.0", aperta: true }),
  };
}

// Met: lingua dal titolo o dalla cultura
function lingueMet(v) {
  const t = [v.t, v.n].join(" ");
  const l = [];
  if (/\blatin\b/i.test(t)) l.push("la");
  if (/\bgreek\b/i.test(t) || /^Greek/i.test(v.cu || "")) l.push("grc");
  if (/Egyptian/i.test(v.dip || "") && !l.length) l.push("egy");
  if (/\b(?:aramaic|palmyrene)\b/i.test(t)) l.push("arc");
  if (/\bsouth arabian|sabaean|himyarite\b/i.test(t)) l.push("xsa");
  return l;
}
export function recordMet(id, v) {
  if (!v || !(v.p || []).length) return null;
  const dn = v.dn && v.dn[0] != null ? v.dn : null;
  return {
    fonte: "epigrafi", id: "ep-met-" + id, tipo: "epigrafe", citta: "New York", biblioteca: "The Metropolitan Museum of Art",
    segnatura: v.s || "Met " + id, titolo: v.t || v.n || null, datazione: v.d || dataItaliana(dn), secolo: secoloDa(dn, v.d),
    lingue: lingueMet(v), manifest: `${RAW}epigrafi-met/${id}.json`, pagina: v.u || `https://www.metmuseum.org/art/collection/search/${id}`, immagini: v.p.length,
    licenza: "The Metropolitan Museum of Art, Open Access: immagini e dati in pubblico dominio (CC0)",
    epigrafe: pulisci({ provenienza: v.o || null, conservazione: "The Metropolitan Museum of Art, New York", supporto: v.me || null, genere: v.n || null,
      cultura: [v.cu, v.pe].filter(Boolean).join(", ") || null, misure: v.di || null, licenza_metadati: "CC0" }),
  };
}

// Wikidata
const LIC_LIBERE = /^(?:CC0|Public domain|PD|CC BY(?:-SA)? \d|CC-BY|CC BY-SA|GFDL|Attribution|FAL|No restrictions)/i;
export function recordWikidata(q, v) {
  if (!v || !(v.p || []).length) return null;
  const pg = v.p.filter(x => LIC_LIBERE.test(x[3] || "")); if (!pg.length) return null;
  const anno = (/^(-?\d+)-/.exec(v.inc || "") || [])[1];
  const dn = anno != null ? [+anno, +anno] : null;
  const segn = v.inv || (v.edh ? "EDH " + v.edh : v.edcs ? "EDCS-" + v.edcs : v.tm ? "TM " + v.tm : q);
  return {
    fonte: "epigrafi", id: "ep-wd-" + q.toLowerCase(), tipo: "epigrafe", citta: null, biblioteca: v.coll || v.loc || "Luogo di conservazione non indicato (Wikidata)",
    segnatura: segn, titolo: v.l || null, datazione: dn ? dataItaliana(dn) + " (secondo Wikidata)" : null, secolo: secoloDa(dn, null),
    lingue: lingueDa((v.lingue || []).filter(l => !/^Q\d+$/.test(l))), manifest: `${RAW}epigrafi-wd/${q.toLowerCase()}.json`,
    pagina: `https://www.wikidata.org/wiki/${q}`, immagini: pg.length,
    licenza: `Metadati: Wikidata, CC0. Immagini: Wikimedia Commons (${[...new Set(pg.map(x => x[3]))].join(", ")})`,
    epigrafe: pulisci({ edh: v.edh || null, edcs: v.edcs || null, edr: v.edr || null, tm: v.tm ? +v.tm || v.tm : null, phi: v.phi || null, rib: v.rib || null,
      provenienza: v.found || null, conservazione: [v.coll, v.loc && v.loc !== v.coll ? v.loc : null].filter(Boolean).join(", ") || null,
      supporto: (v.mat || []).join(", ") || null, wikidata: q, licenza_metadati: "CC0" }),
  };
}

export function recordEpigrafi(st = leggiStato(), edh = leggiEdh()) {
  const out = [];
  const hdEdh = new Set();
  for (const [hd, v] of Object.entries(edh.voci || {})) { const r = recordEdh(hd, v); if (r) { out.push(r); hdEdh.add(hd); } }
  const met = new Set();
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!k.startsWith("met:") || !v || v.q || v.x) continue;
    const r = recordMet(k.slice(4), v); if (r) { out.push(r); met.add(k.slice(4)); }
  }
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!k.startsWith("wikidata:") || !v || v.q || v.x) continue;
    if ((v.edh && hdEdh.has(v.edh)) || (v.met && met.has(String(v.met)))) continue;   // doppioni: restano all'EDH e al Met
    const r = recordWikidata(k.slice(9), v); if (r) out.push(r);
  }
  for (const r of out) if (!r.titolo) delete r.titolo;
  return out;
}

// ------------------------------------------------------------------------------------------------ manifesti scritti dal catalogo (scripts/manifesti.mjs)
const lm = (s, l = "none") => ({ [l]: [String(s)] });
const coppia = (k, v) => v && (!Array.isArray(v) || v.length) ? { label: lm(k, "it"), value: lm(Array.isArray(v) ? v.join(" ; ") : v) } : null;
// immagini: [{ url, w, h, etichetta, servizio (IIIF Image 2, facoltativo), formato }]
export function manifestoEpigrafe(id, titolo, meta, attribuzione, pagina, immagini, diritti) {
  const items = immagini.map((x, i) => {
    const c = `${id}/canvas/${i + 1}`;
    const body = { id: x.url, type: "Image", format: x.formato || "image/jpeg", width: x.w, height: x.h };
    if (x.servizio) body.service = [{ id: x.servizio, type: "ImageService2", profile: "level2" }];
    return { id: c, type: "Canvas", label: lm(x.etichetta || String(i + 1)), width: x.w, height: x.h,
      items: [{ id: `${c}/page`, type: "AnnotationPage", items: [{ id: `${c}/page/image`, type: "Annotation", motivation: "painting", target: c, body }] }] };
  });
  return { "@context": "http://iiif.io/api/presentation/3/context.json", id, type: "Manifest", label: lm(titolo), metadata: meta.filter(Boolean),
    requiredStatement: { label: lm("Attribuzione", "it"), value: lm(attribuzione, "it") }, ...(diritti ? { rights: diritti } : {}),
    homepage: [{ id: pagina, type: "Text", label: lm(titolo), format: "text/html" }], items };
}
const metaEp = r => [coppia("Conservazione", r.biblioteca), coppia("Edizione", r.epigrafe.edizione || r.segnatura), coppia("Datazione", r.datazione),
  coppia("Provenienza", r.epigrafe.provenienza), coppia("Supporto", r.epigrafe.supporto), coppia("Genere", r.epigrafe.genere)];
export function manifestiEpigrafi(st = leggiStato(), edh = leggiEdh()) {
  const out = { "epigrafi-edh": {}, "epigrafi-met": {}, "epigrafi-wd": {} };
  const rs = new Map(recordEpigrafi(st, edh).map(r => [r.id, r]));
  for (const [hd, v] of Object.entries(edh.voci || {})) {
    const r = rs.get("ep-edh-" + hd.toLowerCase()); if (!r || (v.f || []).length < 2) continue;
    const ok = v.f.filter(f => f[2] && f[3]); if (!ok.length) continue;
    const crediti = [...new Set(ok.map(f => f[4]).filter(Boolean))].join(" ; ");
    out["epigrafi-edh"][hd.toLowerCase()] = manifestoEpigrafe(`${RAW}epigrafi-edh/${hd.toLowerCase()}.json`, `EDH ${hd}: ${r.titolo || "iscrizione"}`, metaEp(r),
      `Heidelberger Akademie der Wissenschaften, Epigraphic Database Heidelberg (foto in heidICON, Universitätsbibliothek Heidelberg). ${crediti}`.trim(), r.pagina,
      ok.map(f => ({ url: `${HEIDICON}${f[1]}/full/full/0/default.jpg`, w: f[2], h: f[3], etichetta: f[0] + (f[4] ? " (" + f[4] + ")" : ""), servizio: `${HEIDICON}${f[1]}` })),
      "http://rightsstatements.org/vocab/InC/1.0/");
  }
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!v || v.q || v.x || !(v.p || []).length) continue;
    if (k.startsWith("met:")) {
      const id = k.slice(4), r = rs.get("ep-met-" + id); if (!r) continue;
      out["epigrafi-met"][id] = manifestoEpigrafe(`${RAW}epigrafi-met/${id}.json`, `The Metropolitan Museum of Art, ${r.segnatura}: ${r.titolo || ""}`.replace(/: $/, ""), metaEp(r),
        "The Metropolitan Museum of Art, New York. Open Access: pubblico dominio (CC0).", r.pagina,
        v.p.map(([f, w, h], i) => ({ url: "https://images.metmuseum.org/CRDImages/" + f, w, h, etichetta: String(i + 1) })), "http://creativecommons.org/publicdomain/zero/1.0/");
    } else if (k.startsWith("wikidata:")) {
      const q = k.slice(9), r = rs.get("ep-wd-" + q.toLowerCase()); if (!r) continue;
      const pg = v.p.filter(x => LIC_LIBERE.test(x[3] || ""));
      out["epigrafi-wd"][q.toLowerCase()] = manifestoEpigrafe(`${RAW}epigrafi-wd/${q.toLowerCase()}.json`, r.titolo || q, metaEp(r),
        "Immagini da Wikimedia Commons: " + pg.map(x => [x[4], x[3]].filter(Boolean).join(", ")).join(" ; ") + ". Metadati da Wikidata (CC0).", r.pagina,
        pg.map(x => ({ url: x[0], w: x[1], h: x[2], etichetta: [x[4], x[3]].filter(Boolean).join(", "), formato: /\.png$/i.test(x[0]) ? "image/png" : "image/jpeg" })), null);
    }
  }
  return out;
}
