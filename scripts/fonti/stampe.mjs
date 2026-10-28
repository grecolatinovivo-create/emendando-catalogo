// Stampe antiche (dal 27 ottobre 2026): incunaboli (stampati prima del 1501) e edizioni principi dei classici greci e latini,
// anche del Cinquecento, digitalizzati in IIIF. Nel catalogo sono la fonte «stampe» (id «stp-…»), con «tipo» «incunabolo» oppure
// «stampa» (edizione principe cinquecentesca) e, per le edizioni principi, il contrassegno «editio_princeps» (elenco curato in
// data/edizioni-principi.json). Le cinquecentine che non sono edizioni principi restano fuori.
//
// Biblioteche lette (una dopo l'altra, richieste in serie con le pause di scripts/rete.mjs):
//   bsb        Bayerische Staatsbibliothek e biblioteche bavaresi (MDZ): API di ricerca del sito (www.digitale-sammlungen.de/api/search,
//              la stessa che usa la pagina di ricerca; robots.txt senza divieti), stampati con data fino al 1500, 250 per pagina;
//              per le edizioni principi del Cinquecento una ricerca mirata per ciascuna (autore e anno). Il portale BSB-Ink
//              (inkunabeln.digitale-sammlungen.de) ha un robots.txt che vieta tutto: non si usa.
//   heidelberg Universitätsbibliothek Heidelberg: OAI-PMH, insieme «sammlung13» (Inkunabeln), poi l'inizio di ogni manifesto per la segnatura
//   bodleian   Bodleian Libraries: collezione IIIF «incunabula» (Incunabula and Blockbooks), inizio di ogni manifesto
//   cudl       Cambridge University Library: collezione IIIF «incunabula», inizio di ogni manifesto
//   archive    Internet Archive: incunaboli della Boston Public Library (collezione bplscinc) e della National Library of Medicine
//   vaticana   Biblioteca Apostolica Vaticana: fondo «Inc.» degli stampati (digi.vatlib.it/stp/ajax/category/Inc, 10 secondi tra le richieste)
//   gallica    Gallica (BnF e biblioteche partner): Cloudflare respinge i server, quindi NESSUNA richiesta da qui. Gli incunaboli e le copie
//              delle edizioni principi del Cinquecento si raccolgono dal browser (SRU di Gallica, una pagina di 50 schede ogni 5 secondi
//              come chiede il Crawl-delay del robots.txt) e stanno in data/stampe-gallica.json, che questa fonte si limita a leggere.
// Bloccate e non usate dai server: e-rara (robots.txt vieta tutto), Gallica (Cloudflare respinge i server: entra dal browser), BSB-Ink (robots.txt).
// Stato in data/stampe.json (una voce per riga): ogni elenco si rilegge ogni GIORNI giorni, ogni manifesto una volta sola.
import fs from "node:fs";
import { scarica, log, tag, records, token } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { metadatiTesta } from "./cudl-piattaforma.mjs";
import { luogoGallica } from "./gallica.mjs";

export const FILE_STATO = "data/stampe.json";
export const FILE_EP = "data/edizioni-principi.json";
export const FILE_GALLICA = "data/stampe-gallica.json";
const VERSIONE = 1, GIORNI = 30;
export const PARTI = ["bsb", "heidelberg", "bodleian", "cudl", "archive", "vaticana", "ep"];
export const BLOCCATE = {
  "e-rara.ch": "robots.txt vieta tutto agli agenti generici (anche l'OAI-PMH)",
  "gallica.bnf.fr": "Cloudflare respinge le richieste dei server (403, «Attention Required»): la raccolta si fa dal browser (data/stampe-gallica.json)",
  "inkunabeln.digitale-sammlungen.de": "robots.txt vieta tutto (BSB-Ink); gli stessi incunaboli si leggono dall'API di ricerca del MDZ",
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
// chiave di una voce: «<parte>:<id nella biblioteca>»; valore compatto
//   s segnatura, t titolo, a autori, d datazione, l luogo di stampa, p tipografo, b biblioteca, c città, g lingue, r licenza, m manifesto, u pagina
//   q: 1 = manifesto ancora da leggere (bodleian, cudl, heidelberg); x: 1 = manifesto che non si legge
const pulisci = v => { for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k]; return v; };
const fresca = p => p && p.completato && Date.now() - Date.parse(p.completato) < GIORNI * 864e5;

// ------------------------------------------------------------------------------------------------ riconoscimento delle edizioni principi
export function leggiEdizioni(file = FILE_EP) {
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const luoghi = Object.fromEntries(Object.entries(d.luoghi).map(([k, r]) => [k, new RegExp(r, "i")]));
  return d.edizioni.map(e => ({ ...e, _a: new RegExp(e.riconosci.autore, "i"), _o: e.riconosci.opera ? new RegExp(e.riconosci.opera, "i") : null,
    _l: e.riconosci.luogo ? luoghi[e.riconosci.luogo] : null, _p: e.riconosci.tipografo ? new RegExp(e.riconosci.tipografo, "i") : null }));
}
// anni di una datazione («[nicht nach 1470]», «1492.01.09», «[c. 1496]», «1495-1498») -> [primo, ultimo] o null
export function anniDi(d) {
  const a = (String(d || "").match(/1[45]\d\d/g) || []).map(Number);
  return a.length ? [Math.min(...a), Math.max(...a)] : null;
}
const GRECO = /[Ͱ-Ͽἀ-῿]|graec|græc|grec|griech|greek/i;
// voce compatta -> id dell'edizione principe o null
export function edizioneDi(v, EP) {
  const anni = anniDi(v.d); if (!anni) return null;
  const testo = [...(v.a || []), v.t || ""].join(" ; ");
  for (const e of EP) {
    const [a, b] = e.riconosci.anni;
    if (anni[1] < a || anni[0] > b) continue;
    if (!e._a.test(testo)) continue;
    if (e._o && !e._o.test(v.t || "")) continue;
    if (e._l && v.l && !e._l.test(v.l)) continue;
    if (e._p && v.p) { if (!e._p.test(v.p)) continue; }
    else if (e.lingua === "grc" && !((v.g || []).includes("grc") || GRECO.test(v.t || ""))) continue;
    return e.id;
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ BSB (MDZ)
const MDZ = "https://www.digitale-sammlungen.de/api/search";
function urlMdz({ query = "", pagina = 0, dimensione = 250, da, a }) {
  const p = new URLSearchParams({ query, handler: "simple-all", startPage: String(pagina), pageSize: String(dimensione), sortField: "shelfNo", sortOrder: "asc" });
  p.append("filter", 'type_manufact:"print"');
  p.append("filter", `date_facet:[${da}-01-01 TO ${a}-12-31]`);
  return `${MDZ}?${p}`;
}
// testo semplice: la ricerca del MDZ evidenzia le parole cercate con <em> e lascia entità HTML
const piano = v => String(v ?? "").replace(/<[^>]+>/g, "").replace(/&apos;|&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export function compattaMdz(x) {
  const [c, ...b] = piano(x.provenance).split(", ");
  return pulisci({ s: piano((x.shelfNos || [])[0]) || x.id, t: piano(x.title) || null, a: (x.authors || []).slice(0, 6).map(piano), d: piano(x.publicationDate) || null, l: (x.publicationPlaces || []).map(piano).join(" ; ") || null,
    p: (x.publishers || []).map(piano).join(" ; ") || null, b: b.join(", ") || x.provenance || null, c: b.length ? c : null });
}
async function leggiBsb(st, fine) {
  const p = st.parti.bsb = st.parti.bsb || {};
  if (fresca(p)) return;
  if (p.completato || p.pagina == null) { p.pagina = 0; p.completato = null; }
  for (;;) {
    if (Date.now() > fine) throw new Error(`bsb: tempo esaurito alla pagina ${p.pagina}`);
    const r = await scarica(urlMdz({ pagina: p.pagina, da: 1400, a: 1500 }), { timeout: 180000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`bsb: HTTP ${r.stato}`);
    const j = JSON.parse(r.testo);
    for (const x of j.docs || []) if (x.id && x.iiifAvailable !== false) st.voci["bsb:" + x.id] = compattaMdz(x);
    p.totale = j.numTotal; p.pagina++;
    if (p.pagina % 5 === 0) { log("stampe", `bsb: pagina ${p.pagina} su ${Math.ceil(j.numTotal / 250)}`); salvaStato(st); }
    if (!(j.docs || []).length || p.pagina * 250 >= j.numTotal) break;
  }
  p.completato = new Date().toISOString(); p.pagina = null;
}
// edizioni principi del Cinquecento: una ricerca mirata nel MDZ per ciascuna (parola dell'autore, anni dell'edizione)
async function leggiEp(st, fine, EP) {
  const p = st.parti.ep = st.parti.ep || {};
  if (fresca(p)) return;
  const fatte = new Set(p.fatte || []);
  for (const e of EP.filter(e => e.riconosci.anni[0] > 1500)) {
    if (fatte.has(e.id)) continue;
    if (Date.now() > fine) { p.fatte = [...fatte]; throw new Error("ep: tempo esaurito"); }
    const r = await scarica(urlMdz({ query: e.riconosci.parola, dimensione: 100, da: e.riconosci.anni[0], a: e.riconosci.anni[1] }), { timeout: 180000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`ep: HTTP ${r.stato}`);
    let n = 0;
    for (const x of JSON.parse(r.testo).docs || []) {
      if (!x.id || x.iiifAvailable === false) continue;
      const v = compattaMdz(x);
      if (edizioneDi(v, [e])) { st.voci["ep:" + x.id] = v; n++; }
    }
    fatte.add(e.id);
    if (n) log("stampe", `ep: ${e.id}, ${n} copie`);
  }
  p.fatte = null; p.completato = new Date().toISOString();
}

// ------------------------------------------------------------------------------------------------ Heidelberg (OAI, insieme sammlung13)
const OAI_HD = "https://digi.ub.uni-heidelberg.de/cgi-bin/digioai.cgi";
async function leggiHeidelberg(st, fine) {
  const p = st.parti.heidelberg = st.parti.heidelberg || {};
  if (!fresca(p)) {
    if (p.completato || p.token === undefined) { p.token = null; p.completato = null; p.visti = []; }
    const visti = new Set(p.visti || []);
    for (;;) {
      if (Date.now() > fine) { p.visti = [...visti]; throw new Error("heidelberg: tempo esaurito nell'elenco"); }
      const url = p.token ? `${OAI_HD}?verb=ListRecords&resumptionToken=${encodeURIComponent(p.token)}` : `${OAI_HD}?verb=ListRecords&metadataPrefix=oai_dc&set=sammlung13`;
      const r = await scarica(url, { timeout: 180000 });
      if (r.stato !== 200) throw new Error(`heidelberg: HTTP ${r.stato}`);
      for (const rec of records(r.testo)) {
        if (/status="deleted"/.test(rec)) continue;
        const id = tag(rec, "dc:identifier").find(x => /\/diglit\//.test(x)); if (!id) continue;
        const slug = id.split("/diglit/")[1].replace(/\/.*/, ""), k = "heidelberg:" + slug;
        visti.add(k);
        const vecchia = st.voci[k];
        st.voci[k] = pulisci({ ...(vecchia || {}), t: tag(rec, "dc:title")[0] || null, a: tag(rec, "dc:creator").slice(0, 6), d: tag(rec, "dc:date")[0] || null,
          g: lingueDa(tag(rec, "dc:language")), m: tag(rec, "dc:hasFormat").find(x => /iiif.*manifest/.test(x)) || null, q: vecchia && !vecchia.q ? null : 1 });
      }
      p.token = token(r.testo);
      if (!p.token) break;
    }
    for (const k of Object.keys(st.voci)) if (k.startsWith("heidelberg:") && !visti.has(k)) delete st.voci[k];
    p.visti = null; p.completato = new Date().toISOString();
  }
  await leggiManifesti(st, "heidelberg", fine, (k, v) => v.m || `https://digi.ub.uni-heidelberg.de/diglit/iiif/${k}/manifest.json`, (v, { m }) => {
    const seg = (m.Shelfmark || [])[0] || "";
    const parti = seg.split(", ");
    return { ...v, s: parti.length >= 3 ? parti.slice(2).join(", ") : seg || null, c: parti.length >= 3 ? parti[0] : "Heidelberg", b: parti.length >= 3 ? parti[1] : "Universitätsbibliothek Heidelberg",
      l: (m.Location || [])[0] || null, p: (m.Publisher || m.Printer || [])[0] || null };
  });
}

// ------------------------------------------------------------------------------------------------ manifesti (inizio) di una parte
async function leggiManifesti(st, parte, fine, url, scheda) {
  const da = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q);
  let letti = 0, errori = 0;
  for (const k of da) {
    if (Date.now() > fine) break;
    let r; try { r = await scarica(url(k.slice(parte.length + 1), st.voci[k]), { range: 524288, basta: t => /"(structures|sequences|items)"\s*:/.test(t), tentativi: 3, timeout: 120000 }); }
    catch (e) { log("stampe", parte, k, e.message); if (++errori >= 5) break; continue; }
    errori = 0; letti++;
    const dati = r.stato === 200 || r.stato === 206 ? metadatiTesta(r.testo) : null;
    const v = { ...st.voci[k] }; delete v.q;
    st.voci[k] = dati ? pulisci(scheda(v, dati)) : { ...v, x: 1 };
    if (letti % 50 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("stampe", `${parte}: ${letti} manifesti letti su ${da.length}`); }
  }
  const resto = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q).length;
  if (resto) throw new Error(`${parte}: mancano ${resto} manifesti, riprenderà alla prossima esecuzione`);
}
// elenco da una collezione IIIF (Presentation 2: «manifests»)
async function leggiCollezione(st, parte, url, chiave) {
  const p = st.parti[parte] = st.parti[parte] || {};
  if (fresca(p)) return;
  const r = await scarica(url, { timeout: 180000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`${parte}: collezione HTTP ${r.stato}`);
  const visti = new Set();
  for (const m of JSON.parse(r.testo).manifests || []) {
    const id = chiave(m["@id"] || m.id || ""); if (!id) continue;
    const k = parte + ":" + id; visti.add(k);
    if (!st.voci[k]) st.voci[k] = { q: 1, s: typeof m.label === "string" ? m.label : null };
  }
  for (const k of Object.keys(st.voci)) if (k.startsWith(parte + ":") && !visti.has(k)) delete st.voci[k];
  p.totale = visti.size; p.completato = new Date().toISOString();
}
const uno = (m, ...k) => { for (const x of k) if (m[x] && m[x][0]) return m[x][0]; return null; };
async function leggiBodleian(st, fine) {
  await leggiCollezione(st, "bodleian", "https://iiif.bodleian.ox.ac.uk/iiif/collection/incunabula", u => (/manifest\/([0-9a-f-]{36})\.json/.exec(u) || [])[1]);
  await leggiManifesti(st, "bodleian", fine, id => `https://iiif.bodleian.ox.ac.uk/iiif/manifest/${id}.json`, (v, { m, attribuzione }) => {
    const seg = uno(m, "Shelfmark") || v.s || "";
    const b = /^(.*?(?:Library|College|Institution))\s+(.*)$/.exec(seg);
    return { s: b ? b[2] : seg, b: b ? b[1] : "Bodleian Library", c: "Oxford", t: uno(m, "Title"), a: (m.Author || []).slice(0, 6), d: uno(m, "Date Statement", "Date"),
      l: uno(m, "Place of Origin"), p: uno(m, "Printer", "Publisher"), g: lingueDa(m.Language || []), r: /CC BY-NC 4\.0|licenses\/by-nc\/4\.0/i.test(attribuzione || "") ? "CC BY-NC 4.0" : null };
  });
}
async function leggiCudl(st, fine) {
  await leggiCollezione(st, "cudl", "https://cudl.lib.cam.ac.uk/iiif/collection/incunabula", u => (/\/iiif\/([A-Za-z0-9-]+)$/.exec(u) || [])[1]);
  await leggiManifesti(st, "cudl", fine, id => `https://cudl.lib.cam.ac.uk/iiif/${id}`, (v, { m }) => ({
    s: uno(m, "Classmark", "Shelfmark") || v.s, b: "Cambridge University Library", c: "Cambridge", t: uno(m, "Title"), a: (m["Author(s)"] || []).join(" ; ").split(/\s*;\s*/).filter(Boolean).slice(0, 6),
    d: uno(m, "Date of Creation", "Date"), l: uno(m, "Place of Publication", "Origin Place", "Place"), p: uno(m, "Publisher", "Printer"), g: lingueDa(m["Language(s)"] || []) }));
}

// ------------------------------------------------------------------------------------------------ Internet Archive
const IA_RICERCHE = [
  { q: "collection:bplscinc AND date:[1440-01-01 TO 1500-12-31]", b: "Boston Public Library", c: "Boston" },
  { q: "collection:usnationallibraryofmedicine AND mediatype:texts AND date:[1440-01-01 TO 1500-12-31]", b: "National Library of Medicine", c: "Bethesda" },
];
async function leggiArchive(st, fine) {
  const p = st.parti.archive = st.parti.archive || {};
  if (fresca(p)) return;
  const visti = new Set();
  for (const ric of IA_RICERCHE) {
    let cursore = null;
    for (;;) {
      if (Date.now() > fine) throw new Error("archive: tempo esaurito");
      const q = new URLSearchParams({ q: ric.q, fields: "identifier,title,creator,date,publisher,language,call_number", count: "1000" });
      if (cursore) q.set("cursor", cursore);
      const r = await scarica(`https://archive.org/services/search/v1/scrape?${q}`, { timeout: 180000, accept: "application/json" });
      if (r.stato !== 200) throw new Error(`archive: HTTP ${r.stato}`);
      const j = JSON.parse(r.testo);
      for (const d of j.items || []) {
        if (!d.identifier) continue;
        const L = x => [].concat(x ?? []).map(String);
        const k = "archive:" + d.identifier; visti.add(k);
        const pub = L(d.publisher)[0] || "";
        st.voci[k] = pulisci({ s: L(d.call_number)[0] || d.identifier, t: L(d.title)[0] || null, a: L(d.creator).slice(0, 6), d: L(d.date)[0] ? L(d.date)[0].slice(0, 4) : null,
          l: pub.split(/\s*:\s*/)[0] || null, p: pub.split(/\s*:\s*/).slice(1).join(" : ") || null, g: lingueDa(L(d.language)), b: ric.b, c: ric.c });
      }
      cursore = j.cursor || null;
      if (!cursore) break;
    }
  }
  for (const k of Object.keys(st.voci)) if (k.startsWith("archive:") && !visti.has(k)) delete st.voci[k];
  p.totale = visti.size; p.completato = new Date().toISOString();
}

// ------------------------------------------------------------------------------------------------ Vaticana (fondo Inc. degli stampati)
// i manifesti degli stampati della Vaticana non hanno metadati (solo la segnatura): entrano solo gli incunaboli del fondo «Inc.»
async function leggiVaticana(st, fine) {
  const p = st.parti.vaticana = st.parti.vaticana || {};
  if (fresca(p)) return;
  if (Date.now() > fine) throw new Error("vaticana: tempo esaurito");
  const r = await scarica("https://digi.vatlib.it/stp/ajax/category/Inc", { timeout: 120000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`vaticana: HTTP ${r.stato}`);
  const segs = [...new Set((JSON.parse(r.testo).fond || []).map(x => x && x.shelfmark).filter(Boolean))];
  for (const k of Object.keys(st.voci)) if (k.startsWith("vaticana:")) delete st.voci[k];
  for (const s of segs) st.voci["vaticana:" + s] = { s: s.replace(/\.(?=\S)/g, ". ").replace(/\s+/g, " ").trim(), b: "Biblioteca Apostolica Vaticana", c: "Città del Vaticano" };
  p.totale = segs.length; p.completato = new Date().toISOString();
}

// ------------------------------------------------------------------------------------------------ scansione
export async function scansionaStampe({ minuti = 30, soloCache = false, parti = PARTI } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3, EP = leggiEdizioni();
  const lavori = { bsb: () => leggiBsb(st, fine), heidelberg: () => leggiHeidelberg(st, fine), bodleian: () => leggiBodleian(st, fine), cudl: () => leggiCudl(st, fine),
    archive: () => leggiArchive(st, fine), vaticana: () => leggiVaticana(st, fine), ep: () => leggiEp(st, fine, EP) };
  const errori = [];
  for (const p of parti) {
    try { await lavori[p](); log("stampe", `${p}: ${Object.keys(st.voci).filter(k => k.startsWith(p + ":")).length} voci`); }
    catch (e) { errori.push(e.message); log("stampe", "ERRORE", e.message); }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  if (!errori.length && PARTI.every(p => st.parti[p] && st.parti[p].completato)) st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  if (errori.length) { const e = new Error(errori.join("; ")); e.stato = st; throw e; }
  return st;
}

// ------------------------------------------------------------------------------------------------ Gallica (raccolta dal browser)
// data/stampe-gallica.json: { formato: 1, raccolto, query, totale, completa, ricerche_ep, record: [scheda, ...] }
// scheda (Dublin Core dell'SRU di Gallica): k ark, y tipi, t titolo, c autori (con il ruolo), d data, p editori («Tipografo (Luogo)»),
// s fonti (biblioteca e segnatura), g lingue, f formato, r diritti («dp» = domaine public), e (se c'è) id dell'edizione principe cercata
// voci compatte «gallica:<ark>» come le altre parti; solo i documenti a stampa (non i manoscritti, che sono della fonte «gallica»)
export function vociGallica(file = FILE_GALLICA) {
  let d; try { d = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return {}; }
  const out = {};
  for (const o of d.record || []) {
    if (!o || !o.k || !(o.y || []).some(y => /imprim|printed/i.test(y)) || (o.y || []).some(y => /manuscrit/i.test(y))) continue;
    const L = luogoGallica(o.s) || {};
    const editori = (o.p || []).map(x => /^(.*?)\s*\(([^()]*)\)\s*$/.exec(x) || [x, x, null]);
    out["gallica:" + o.k] = pulisci({ s: L.segnatura || null, b: L.biblioteca || "Bibliothèque nationale de France", c: L.citta || null, t: o.t || null,
      a: (o.c || []).map(x => x.replace(/\.\s*(Auteur|[ÉE]diteur|Traducteur|Commentateur|Annotateur|Pr[ée]facier|Imprimeur|Libraire|Illustrateur|Compilateur|Glossateur|Correcteur|Destinataire|Auteur adapt)[^.]*$/i, "").trim()).filter(Boolean).slice(0, 6),
      // «14» o «14..» (secolo XV senza anno) = incunabolo senza data precisa
      d: /^14(\.\.|--|\?\?)?$/.test(String(o.d || "").trim()) ? "[14..]" : o.d || null, i: /^14(\.\.|--|\?\?)?$/.test(String(o.d || "").trim()) ? 1 : null, l: [...new Set(editori.map(m => m[2]).filter(Boolean).map(x => x.replace(/[\[\]]/g, "")))].join(" ; ") || null,
      // «(Venetiis in aedibus Aldi ...)» senza tipografo davanti: la nota tipografica intera vale anche come tipografo
      p: editori.map(m => (m[1].replace(/[\[\]]/g, "").trim() || (m[2] || "").replace(/[\[\]]/g, "").trim())).filter(Boolean).join(" ; ") || null, g: lingueDa(o.g || []), r: o.r === "dp" ? "dp" : null });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ record per il catalogo
const LICENZE = { bsb: "Bayerische Staatsbibliothek: condizioni d'uso del MDZ (digitale-sammlungen.de)", ep: "Bayerische Staatsbibliothek: condizioni d'uso del MDZ (digitale-sammlungen.de)",
  heidelberg: "Public Domain Mark 1.0", bodleian: "Digital Bodleian: https://digital.bodleian.ox.ac.uk/terms/",
  cudl: "Cambridge University Library: immagini scaricabili CC BY-NC 4.0 (zoom © University Library)", archive: "Internet Archive: condizioni d'uso della biblioteca che ha pubblicato l'oggetto", vaticana: "",
  gallica: "Source gallica.bnf.fr / BnF: riuso non commerciale libero con la menzione della fonte (condizioni d'uso di Gallica)" };
function indirizzi(parte, id, v) {
  switch (parte) {
    case "bsb": case "ep": return { manifest: `https://api.digitale-sammlungen.de/iiif/presentation/v2/${id}/manifest`, pagina: `https://www.digitale-sammlungen.de/view/${id}` };
    case "heidelberg": return { manifest: v.m || `https://digi.ub.uni-heidelberg.de/diglit/iiif/${id}/manifest.json`, pagina: `https://digi.ub.uni-heidelberg.de/diglit/${id}` };
    case "bodleian": return { manifest: `https://iiif.bodleian.ox.ac.uk/iiif/manifest/${id}.json`, pagina: `https://digital.bodleian.ox.ac.uk/objects/${id}/` };
    case "cudl": return { manifest: `https://cudl.lib.cam.ac.uk/iiif/${id}`, pagina: `https://cudl.lib.cam.ac.uk/view/${id}` };
    case "archive": return { manifest: `https://iiif.archive.org/iiif/3/${encodeURIComponent(id)}/manifest.json`, pagina: `https://archive.org/details/${id}` };
    case "gallica": return { manifest: `https://gallica.bnf.fr/iiif/ark:/12148/${id}/manifest.json`, pagina: `https://gallica.bnf.fr/ark:/12148/${id}` };
    case "vaticana": return { manifest: `https://digi.vatlib.it/iiif/STP_${encodeURI(id)}/manifest.json`, pagina: `https://digi.vatlib.it/view/STP_${encodeURI(id)}` };
  }
  return {};
}
// Gallica: la BnF chiede «Source gallica.bnf.fr / BnF»; per le biblioteche partner valgono le loro condizioni
const licenza = (parte, v) => parte !== "gallica" ? LICENZE[parte] || null
  : /Biblioth[èe]que nationale de France|Arsenal \(BnF\)/.test(v.b || "") && v.r === "dp" ? LICENZE.gallica
  : `Source gallica.bnf.fr / ${v.b || "biblioteca partner"}: condizioni d'uso della biblioteca partner`;
const idCatalogo = (parte, id) => "stp-" + (parte === "ep" ? "bsb" : parte) + "-" + String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// st -> record compatti delle fonti (fonte «stampe»); solo incunaboli (fino al 1500) e edizioni principi
export function recordStampe(st = leggiStato(), EP = leggiEdizioni(), gallica = vociGallica()) {
  const out = [], visti = new Set();
  const perEp = Object.fromEntries(EP.map(e => [e.id, e]));
  for (const [k, v] of [...Object.entries(st.voci), ...Object.entries(gallica)]) {
    if (!v || v.q || v.x) continue;
    const i = k.indexOf(":"), parte = k.slice(0, i), id = k.slice(i + 1);
    const cid = idCatalogo(parte, id); if (visti.has(cid)) continue;
    const anni = anniDi(v.d);
    const ep = edizioneDi(v, EP);
    const incunabolo = parte === "vaticana" || v.i === 1 || (anni && anni[0] <= 1500);
    if (!incunabolo && !ep) continue;      // cinquecentine che non sono edizioni principi: fuori
    visti.add(cid);
    const e = ep ? perEp[ep] : null;
    out.push({ fonte: "stampe", id: cid, citta: v.c || null, biblioteca: v.b || null, segnatura: v.s || id, datazione: v.d || null, titolo: v.t || null,
      autori_fonte: v.a || [], lingue: v.g || [], ...indirizzi(parte, id, v), licenza: licenza(parte, v),
      tipo: incunabolo ? "incunabolo" : "stampa", stampa: pulisci({ luogo: v.l || null, tipografo: v.p || null }),
      ...(e ? { editio_princeps: { id: e.id, autore: e.autore, opera: e.opera, luogo: e.luogo, tipografo: e.tipografo, anno: e.anno } } : {}) });
  }
  return out;
}
