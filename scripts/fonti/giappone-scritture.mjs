// Giappone, scritture non librarie (dal 28 ottobre 2026): tavolette di legno scritte (mokkan, 木簡) e calchi su carta di iscrizioni
// (takuhon, 拓本), con almeno una foto che si apre nel visore di Emendando (stessa regola di papiri ed epigrafi: niente schede senza
// immagine). Nel catalogo sono la fonte «giappone» (id «giap-<raccolta>-…»), con «tipo» «epigrafe» e i dati in «epigrafe»: supporto
// «legno (mokkan)» oppure «calco (takuhon)», sito di scavo o provenienza, datazione, testo (翻刻) quando le condizioni lo consentono,
// luogo di conservazione, licenza dei metadati. Censimento delle fonti in docs/EPIGRAFI.md (sezione «Giappone e Asia orientale»).
//
// Raccolte (una «parte» ciascuna, in serie, con le pause di scripts/rete.mjs):
//   mokkanko  木簡庫 Mokkanko, Istituto nazionale di ricerca sui beni culturali di Nara (Nabunken, mokkanko.nabunken.go.jp): nessun
//             robots.txt, nessuna API. Elenco dalla ricerca «すべて» con la parola «文化財研究所» (trova i campi «調査主体» di Nabunken,
//             anche col nome vecchio «奈良国立文化財研究所»), sfogliata a 96 righe per pagina con il cookie di sessione della ricerca;
//             poi la pagina di ogni tavoletta, una volta sola. Entrano solo le tavolette con «調査主体» Nabunken: per queste le
//             condizioni d'uso (ヘルプ, 利用条件) permettono a chiunque riproduzione, trasmissione al pubblico e rielaborazione, anche
//             commerciale, senza richiesta, con l'indicazione della fonte («出典：木簡庫（URL）»); le altre seguono le regole di ogni ente
//             e restano fuori. Niente IIIF: manifesti scritti dal catalogo (ramo «manifesti») con le foto in bianco e nero del sito
//             (data/mokkan/<zona>/L/<n>.jpg, da circa 384 a 1.500 pixel di altezza; niente CORS: si vedono, gli strumenti d'inchiostro no).
//             Le misure non si leggono dalle immagini: la pagina mostra ogni foto alta 120 e ne dà la larghezza in proporzione, e il
//             manifesto usa una tela alta 384 con le stesse proporzioni (il visore adatta la foto alla tela). Le foto ad alta risoluzione stanno in ColBase (API non pubblica: da confermare dal browser).
//   ndl       National Diet Library: ricerca di NDL Search (ndlsearch.ndl.go.jp/api/opensearch, «拓本» e «搨本» nel titolo, solo copie
//             digitali della biblioteca, fuori i libri a stampa «図書»), poi il manifesto IIIF di dl.ndl.go.jp: entra solo se si apre
//             (le copie solo in biblioteca danno 404) e se il calco è nel titolo o in quello del manifesto. Manifesti della biblioteca (CORS aperto).
//   waseda    Biblioteca dell'Università Waseda (古典籍総合データベース): ricerca di NDL Search (dpid «waseda», «拓本» e «搨本» nel titolo),
//             poi il manifesto IIIF (archive.wul.waseda.ac.jp/kosho/<fondo>/<id>/manifest.json). Il 28 ottobre 2026 il sito della
//             biblioteca risponde «Site Maintenance» (503) al server: la parte fallisce senza danni e riprova al giro dopo.
// Stato in data/giappone.json (una voce per riga): ogni elenco si rilegge ogni GIORNI giorni, ogni oggetto una volta sola.
import fs from "node:fs";
import { scarica, log, turno, UA } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/giappone.json";
const VERSIONE = 1, GIORNI = 60;
export const PARTI = ["ndl", "waseda", "mokkanko"];
export const RAW = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/";
export const MOKKANKO = "https://mokkanko.nabunken.go.jp";
export const BLOCCATE = {
  "colbase.nich.go.jp": "ColBase (foto ad alta risoluzione dei musei nazionali e di Nabunken): nessuna API pubblica documentata; da confermare dal browser",
  "jpsearch.go.jp": "Japan Search: il robots.txt vieta ai programmi le API di ricerca (/api/item/search/jps-cross) e lo SPARQL (/rdf/)",
  "archive.wul.waseda.ac.jp": "Waseda: il 28 ottobre 2026 il sito risponde «Site Maintenance» (503); i takuhon entreranno quando torna",
};
const LICENZA_MOKKANKO = "木簡庫 Mokkanko (奈良文化財研究所, Nabunken): foto e dati delle tavolette scavate da Nabunken liberamente riutilizzabili, anche a fini commerciali, senza richiesta, citando la fonte («出典：木簡庫»)";

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
const testo = s => String(s ?? "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&nbsp;|&ensp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const breve = (s, n = 200) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length <= n ? s || null : s.slice(0, n) + "…"; };
class TempoFinito extends Error {}

async function leggiVoci(st, parte, fine, leggi) {
  const da = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q);
  let letti = 0, errori = 0;
  for (const k of da) {
    if (Date.now() > fine) break;
    let nuova;
    try { nuova = await leggi(k.slice(parte.length + 1), st.voci[k]); errori = 0; }
    catch (e) { log("giappone", parte, k, e.message); if (++errori >= 5) throw new Error(`${parte}: troppi errori di fila (${e.message})`); continue; }
    if (nuova) { st.voci[k] = pulisci(nuova); delete st.voci[k].q; }
    if (++letti % 100 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("giappone", `${parte}: ${letti} letti su ${da.length}`); }
  }
  const resto = Object.keys(st.voci).filter(k => k.startsWith(parte + ":") && st.voci[k].q).length;
  if (resto) throw new TempoFinito(`${parte}: mancano ${resto} voci, riprenderà alla prossima esecuzione`);
}

// ------------------------------------------------------------------------------------------------ Mokkanko (Nabunken)
// richiesta con il cookie della sessione di ricerca (la ricerca si sfoglia solo così), con le pause di scripts/rete.mjs
async function chiediMokkanko(url, sessione, corpo) {
  for (let k = 0; k < 4; k++) {
    await turno(new URL(url).hostname);
    try {
      const h = { "user-agent": UA, accept: "text/html" };
      if (sessione.cookie) h.cookie = sessione.cookie;
      if (corpo) h["content-type"] = "application/x-www-form-urlencoded";
      const r = await fetch(url, { method: corpo ? "POST" : "GET", body: corpo, headers: h, redirect: "follow", signal: AbortSignal.timeout(120000) });
      const c = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie")].filter(Boolean);
      if (c.length) sessione.cookie = c.map(x => x.split(";")[0]).join("; ");
      const t = await r.text();
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      return { stato: r.status, testo: t };
    } catch (e) { if (k === 3) throw e; await new Promise(f => setTimeout(f, 5000 * 2 ** k)); }
  }
}
export const PAROLA_MOKKANKO = "文化財研究所";
export function righeElencoMokkanko(h) {
  const ids = [...new Set([...h.matchAll(/<td class="honbun_left_part">\s*<a href="([0-9A-Z]{14})"/g)].map(m => m[1]))];
  const tot = +((/id="searched_record_num">(\d+)</.exec(h) || [])[1] || 0);
  return { ids, totale: tot };
}
async function leggiMokkanko(st, fine) {
  const p = st.parti.mokkanko = st.parti.mokkanko || {};
  if (!fresca(p)) {
    if (p.completato || p.pagina == null) { p.pagina = 1; p.completato = null; p.visti = []; }
    const visti = new Set(p.visti || []), sessione = {};
    const r0 = await chiediMokkanko(`${MOKKANKO}/ja/`, sessione, new URLSearchParams({ d_kensakumoji: PAROLA_MOKKANKO, search_select_mode: "1" }).toString());
    if (r0.stato !== 200 || !righeElencoMokkanko(r0.testo).totale) throw new Error(`mokkanko: ricerca non leggibile (HTTP ${r0.stato})`);
    for (;;) {
      if (Date.now() > fine) { p.visti = [...visti]; salvaStato(st); throw new TempoFinito(`mokkanko: elenco fermo alla pagina ${p.pagina}`); }
      const r = await chiediMokkanko(`${MOKKANKO}/ja/?c=index&page=${p.pagina}&limit=96`, sessione);
      const pg = r.stato === 200 ? righeElencoMokkanko(r.testo) : null;
      if (!pg || !pg.totale) throw new Error(`mokkanko: pagina ${p.pagina} non leggibile (HTTP ${r.stato})`);
      for (const id of pg.ids) { visti.add("mokkanko:" + id); if (!st.voci["mokkanko:" + id]) st.voci["mokkanko:" + id] = { q: 1 }; }
      p.totale = pg.totale;
      if (p.pagina % 20 === 0) { log("giappone", `mokkanko: elenco pagina ${p.pagina} di ${Math.ceil(pg.totale / 96)}`); p.visti = [...visti]; salvaStato(st); }
      if (!pg.ids.length || p.pagina * 96 >= pg.totale) break;
      p.pagina++;
    }
    // le tavolette sparite dall'elenco si tolgono solo se l'elenco è venuto quasi intero
    if (visti.size > 0.9 * (p.totale || 0)) for (const k of Object.keys(st.voci)) if (k.startsWith("mokkanko:") && !visti.has(k)) delete st.voci[k];
    p.visti = null; p.pagina = null; p.completato = new Date().toISOString();
    salvaStato(st);
  }
  await leggiVoci(st, "mokkanko", fine, async (id) => {
    const r = await scarica(`${MOKKANKO}/ja/${id}`, { timeout: 90000 });
    if (r.stato === 404 || r.stato === 410) return { x: `HTTP ${r.stato}` };
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    return schedaMokkanko(r.testo);
  });
}
// pagina di una tavoletta -> scheda compatta (oppure { x: motivo })
export const NABUNKEN = /奈良(?:国立)?文化財研究所/;
export function schedaMokkanko(h) {
  const tab = (/<table[^>]*id="detail_info_tbl"[^>]*>([\s\S]*?)<\/table>/.exec(h) || [])[1] || "";
  const campi = {};
  for (const m of tab.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const ths = [...m[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(x => testo(x[1]));
    const td = (/<td[^>]*>([\s\S]*?)<\/td>/.exec(m[1]) || [])[1];
    if (!ths.length || td == null) continue;
    campi[ths[ths.length - 1]] = td;
  }
  const c = k => (campi[k] == null ? null : testo(campi[k]) || null);
  // nomi con la traduzione inglese dopo <br>: si tiene la parte giapponese, l'inglese a parte
  const dueLingue = k => { const v = campi[k]; if (v == null) return [null, null]; const [a, ...b] = v.split(/<br\s*\/?>/i); return [testo(a) || null, testo(b.join(" ")) || null]; };
  if (!Object.keys(campi).length) return { x: "pagina senza scheda" };
  const [ente, enteEn] = dueLingue("調査主体");
  if (!NABUNKEN.test(ente || "")) return { x: "調査主体 " + (ente || "non indicato") + ": immagini secondo le regole dell'ente" };
  const foto = (/<p id="attached_img">([\s\S]*?)<\/p>/.exec(h) || [])[1] || "";
  const p = [];
  for (const m of foto.matchAll(/<img src="\.\.\/data\/mokkan\/([0-9A-Z]+\/L\/\d+\.jpg)" width="([\d.]+)" height="([\d.]+)"/g)) {
    // la pagina mostra le foto «L» alte 120 e ne dà la larghezza in proporzione: tela alta 384 con le stesse proporzioni
    const w = Math.round(+m[2] * 384 / +m[3]);
    if (w > 0) p.push([m[1], w, 384]);
  }
  if (!p.length) return { x: "senza foto (NoImage)" };
  const [sito, sitoEn] = dueLingue("遺跡名");
  return { n: c("木簡番号"), t: c("本文"), sz: [c("縦"), c("横"), c("厚さ")], k: c("型式番号"), e: c("出典"), f: c("形状"), j: c("樹種"), s: sito, se: sitoEn, o: c("所在地"),
    c: ente, ce: enteEn, h: c("発掘次数"), ik: c("遺構番号"), b: c("内容分類"), w: c("和暦"), y: c("西暦"), a: c("遺構の年代観"), d: breve(c("木簡説明"), 600),
    doi: (/doi\.org\/(10\.\d+\/[^\s<"]+)/.exec(campi.DOI || "") || [])[1] || null, p };
}

// ------------------------------------------------------------------------------------------------ NDL Search (NDL e Waseda)
const OPENSEARCH = "https://ndlsearch.ndl.go.jp/api/opensearch";
export const CALCO = /拓本|搨本|拓影|石摺|takuhon|rubbing/i;
// risultati di NDL Search -> [{ pid, t, d, a, l, cat, link }]
export function vociOpensearch(xml) {
  const out = [];
  for (const it of xml.split("<item>").slice(1)) {
    const v = re => (re.exec(it) || [])[1] || null;
    out.push({ pid: v(/info:ndljp\/pid\/(\d+)/), t: testo(v(/<title>([^<]*)<\/title>/)), d: v(/<dcterms:issued>([^<]*)</) || v(/<dc:date[^>]*>([^<]*)</), y: v(/<dc:date[^>]*>(\d{3,4})[^<]*</), a: testo(v(/<author>([^<]*)</)) || null,
      l: [...it.matchAll(/<dc:language[^>]*>([^<]*)</g)].map(m => m[1]), cat: [...it.matchAll(/<category>([^<]*)<\/category>/g)].map(m => m[1]),
      link: [...it.matchAll(/rdfs:seeAlso rdf:resource="([^"]+)"/g)].map(m => m[1]), serie: testo(v(/<dcndl:seriesTitle>([^<]*)</)) || null });
  }
  return out;
}
async function cercaOpensearch(param, fine) {
  const out = [];
  for (const parola of ["拓本", "搨本"]) {
    for (let idx = 1; ; idx += 200) {
      if (Date.now() > fine) throw new TempoFinito("ricerca NDL Search: tempo esaurito");
      const r = await scarica(`${OPENSEARCH}?title=${encodeURIComponent(parola)}&${param}&cnt=200&idx=${idx}`, { timeout: 120000 });
      if (r.stato !== 200) throw new Error(`NDL Search HTTP ${r.stato}`);
      const vs = vociOpensearch(r.testo); out.push(...vs);
      const tot = +((/<openSearch:totalResults>(\d+)</.exec(r.testo) || [])[1] || 0);
      if (!vs.length || idx + 200 > tot) break;
    }
  }
  return out;
}
async function leggiNdl(st, fine) {
  const p = st.parti.ndl = st.parti.ndl || {};
  if (!fresca(p)) {
    const vs = (await cercaOpensearch("dpid=ndl-dl", fine)).filter(v => v.pid && v.cat.includes("デジタル") && !v.cat.includes("図書"));
    const visti = new Set();
    for (const v of vs) { const k = "ndl:" + v.pid; visti.add(k); if (!st.voci[k]) st.voci[k] = { t: v.t, d: v.d, y: v.y, a: v.a, l: v.l, s: v.serie, q: 1 }; }
    for (const k of Object.keys(st.voci)) if (k.startsWith("ndl:") && !visti.has(k)) delete st.voci[k];
    p.totale = visti.size; p.completato = new Date().toISOString();
  }
  await leggiVoci(st, "ndl", fine, async (pid, v) => {
    const r = await scarica(`https://dl.ndl.go.jp/api/iiif/${pid}/manifest.json`, { timeout: 90000, accept: "application/json" });
    const base = { t: v.t, d: v.d, y: v.y, a: v.a, l: v.l, s: v.s };
    if (r.stato === 404 || r.stato === 403) return { ...base, x: `manifesto HTTP ${r.stato} (solo in biblioteca)` };
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const m = JSON.parse(r.testo), n = ((m.sequences || [])[0] || {}).canvases?.length || (m.items || []).length;
    const et = typeof m.label === "string" ? m.label : null;
    if (!n) return { ...base, x: "manifesto senza immagini" };
    // la ricerca trova anche le parti che nominano un calco solo nel titolo della parte («〔茶説ほか〕. 茶説（拓本）»): conta il titolo del manifesto
    if (!CALCO.test(v.t || "") && !CALCO.test(et || "")) return { ...base, x: "non è un calco", et };
    return { ...base, n, et };
  });
}
// Waseda: pagina del catalogo (www.wul.waseda.ac.jp/kotenseki/html/<fondo>/<id>/) -> manifesto IIIF
export function manifestoWaseda(pagina) {
  const m = /kotenseki\/html\/([a-z0-9_]+)\/([a-z0-9_]+)\/?$/i.exec(pagina || ""); if (!m) return null;
  return { chiave: m[2], url: `https://archive.wul.waseda.ac.jp/kosho/${m[1]}/${m[2]}/manifest.json` };
}
async function leggiWaseda(st, fine) {
  const p = st.parti.waseda = st.parti.waseda || {};
  if (!fresca(p)) {
    const vs = (await cercaOpensearch("dpid=waseda", fine)).filter(v => CALCO.test(v.t));
    const visti = new Set();
    for (const v of vs) {
      const pg = v.link.find(l => /wul\.waseda\.ac\.jp\/kotenseki\/html\//.test(l)); const mw = manifestoWaseda(pg); if (!mw) continue;
      const k = "waseda:" + mw.chiave; visti.add(k);
      if (!st.voci[k]) st.voci[k] = { t: v.t, d: v.d, y: v.y, a: v.a, l: v.l, u: pg, m: mw.url, q: 1 };
    }
    for (const k of Object.keys(st.voci)) if (k.startsWith("waseda:") && !visti.has(k)) delete st.voci[k];
    p.totale = visti.size; p.completato = new Date().toISOString();
  }
  await leggiVoci(st, "waseda", fine, async (k, v) => {
    const base = { t: v.t, d: v.d, y: v.y, a: v.a, l: v.l, u: v.u, m: v.m };
    const r = await scarica(v.m, { timeout: 90000, accept: "application/json", tentativi: 2 });
    if (r.stato === 404 || r.stato === 410 || r.stato === 403) return { ...base, x: `manifesto HTTP ${r.stato}` };
    if (r.stato !== 200 || !/^\s*\{/.test(r.testo)) throw new Error(`manifesto HTTP ${r.stato}`);
    const m = JSON.parse(r.testo), n = ((m.sequences || [])[0] || {}).canvases?.length || (m.items || []).length;
    return n ? { ...base, n } : { ...base, x: "manifesto senza immagini" };
  });
}

// ------------------------------------------------------------------------------------------------ raccolta
export async function scansionaGiappone({ minuti = 60, soloCache = false, parti = PARTI } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3, errori = [];
  const lettori = { mokkanko: leggiMokkanko, ndl: leggiNdl, waseda: leggiWaseda };
  for (const parte of parti) {
    if (Date.now() > fine) { errori.push(`${parte}: tempo esaurito`); break; }
    try { await lettori[parte](st, fine); log("giappone", `${parte}: fatto`); }
    catch (e) { errori.push(e.message); log("giappone", e instanceof TempoFinito ? "" : "ERRORE", e.message); }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  if (!errori.length) st.completato = new Date().toISOString();
  else if (st.completato && Object.values(st.parti).some(p => !p.completato)) st.completato = null;
  salvaStato(st);
  return st;
}

// ------------------------------------------------------------------------------------------------ voci del catalogo
// anni dalla scheda di Mokkanko: «西暦» (anno o anni), altrimenti la datazione dello strato («遺構の年代観», «694-710»)
export function anniMokkanko(v) {
  const da = s => { const n = String(s || "").match(/\d{3,4}/g); return n ? [+n[0], +n[n.length - 1]] : null; };
  return da(v.y) || da(v.a);
}
const dataAnni = dn => (dn ? (dn[0] === dn[1] ? `${dn[0]} d.C.` : `${dn[0]}-${dn[1]} d.C.`) : null);
const secoliAnni = dn => (dn ? [Math.ceil(dn[0] / 100), Math.ceil(dn[1] / 100)] : null);
// lingua: fino all'800 giapponese antico (testi di epoca Asuka e Nara, in caratteri cinesi), dopo giapponese
export const lingueMokkanko = dn => (dn && dn[1] <= 800 ? ["ojp"] : ["ja"]);
const misure = sz => (sz && sz.some(Boolean) ? sz.map(x => x || "?").join(" × ") + " mm" : null);
export function recordMokkanko(id, v) {
  if (!v || v.x || v.q || !(v.p || []).length) return null;
  const dn = anniMokkanko(v), lid = id.toLowerCase();
  const edizione = v.e ? v.e.replace(/\s+/g, "") : null;
  return {
    fonte: "giappone", id: "giap-mokkan-" + lid, tipo: "epigrafe", citta: "Nara", biblioteca: "Istituto nazionale di ricerca sui beni culturali di Nara (Nabunken)",
    segnatura: edizione ? edizione.replace(/\(.*$/, "") : "木簡庫 " + id, titolo: v.t ? "木簡 " + breve(v.t, 80) : "木簡", datazione: dataAnni(dn) || v.w || null, secolo: secoliAnni(dn),
    lingue: lingueMokkanko(dn), manifest: `${RAW}giappone-mokkan/${lid}.json`, pagina: `${MOKKANKO}/ja/${id}`, immagini: v.p.length,
    licenza: LICENZA_MOKKANKO,
    epigrafe: pulisci({ mokkanko: id, numero: v.n || null, edizione, provenienza: [v.s, v.o].filter(Boolean).join(", ") || null, provenienza_en: v.se || null,
      scavo: [v.h, v.ik].filter(Boolean).join(", ") || null, conservazione: "奈良文化財研究所 (Nabunken), Nara", supporto: "legno (mokkan)", legno: v.j || null,
      forma: v.k ? "型式 " + v.k : null, stato: v.f || null, genere: v.b || null, misure: misure(v.sz), era: v.w || null, datazione_strato: v.a || null,
      testo: v.t || null, descrizione: v.d || null, doi: v.doi || null, licenza_metadati: "木簡庫 (Nabunken): uso libero con citazione della fonte" }),
  };
}
const anniTesto = d => { const n = String(d || "").match(/(?<!\d)(1[0-9]{3}|[5-9][0-9]{2})(?!\d)/); return n ? [+n[1], +n[1]] : null; };
export function recordNdlTakuhon(pid, v) {
  if (!v || v.x || v.q || !v.n) return null;
  const dn = anniTesto(v.y || v.d);
  return {
    fonte: "giappone", id: "giap-ndl-" + pid, tipo: "epigrafe", citta: "Tokyo", biblioteca: "National Diet Library",
    segnatura: "NDL " + pid, titolo: v.et || v.t || null, datazione: v.d || null, secolo: secoliAnni(dn), lingue: lingueDa(v.l || []),
    autori_fonte: v.a ? [v.a] : undefined, manifest: `https://dl.ndl.go.jp/api/iiif/${pid}/manifest.json`, pagina: `https://dl.ndl.go.jp/pid/${pid}`, immagini: v.n,
    licenza: "National Diet Library: copia digitale pubblicata in Internet (condizioni d'uso di dl.ndl.go.jp)",
    epigrafe: pulisci({ supporto: "calco (takuhon)", conservazione: "National Diet Library, Tokyo", raccolta: v.s || null, licenza_metadati: "NDL Search (CC BY 4.0)" }),
  };
}
export function recordWaseda(k, v) {
  if (!v || v.x || v.q || !v.n) return null;
  const dn = anniTesto(v.y || v.d);
  return {
    fonte: "giappone", id: "giap-waseda-" + k.toLowerCase(), tipo: "epigrafe", citta: "Tokyo", biblioteca: "Waseda University Library",
    segnatura: k, titolo: v.t || null, datazione: v.d || null, secolo: secoliAnni(dn), lingue: lingueDa(v.l || []),
    autori_fonte: v.a ? [v.a] : undefined, manifest: v.m, pagina: v.u, immagini: v.n,
    licenza: "Waseda University Library, 古典籍総合データベース (condizioni d'uso della biblioteca)",
    epigrafe: pulisci({ supporto: "calco (takuhon)", conservazione: "Waseda University Library, Tokyo", licenza_metadati: "NDL Search (CC BY 4.0)" }),
  };
}
export function recordGiappone(st = leggiStato()) {
  const out = [];
  for (const [k, v] of Object.entries(st.voci || {})) {
    const i = k.indexOf(":"), parte = k.slice(0, i), id = k.slice(i + 1);
    const r = parte === "mokkanko" ? recordMokkanko(id, v) : parte === "ndl" ? recordNdlTakuhon(id, v) : parte === "waseda" ? recordWaseda(id, v) : null;
    if (r) { for (const c of Object.keys(r)) if (r[c] === undefined) delete r[c]; out.push(r); }
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ manifesti scritti dal catalogo (scripts/manifesti.mjs)
const lm = (s, l = "none") => ({ [l]: [String(s)] });
const coppia = (k, v) => (v ? { label: lm(k, "it"), value: lm(v) } : null);
export function manifestoMokkanko(r, v) {
  const id = r.manifest, e = r.epigrafe;
  const items = v.p.map(([f, w, h], i) => {
    const c = `${id}/canvas/${i + 1}`;
    return { id: c, type: "Canvas", label: lm(v.p.length > 1 ? `${i + 1}` : "全体"), width: w, height: h,
      items: [{ id: `${c}/page`, type: "AnnotationPage", items: [{ id: `${c}/page/image`, type: "Annotation", motivation: "painting", target: c,
        body: { id: `${MOKKANKO}/data/mokkan/${f}`, type: "Image", format: "image/jpeg", width: w, height: h } }] }] };
  });
  return { "@context": "http://iiif.io/api/presentation/3/context.json", id, type: "Manifest", label: lm(`木簡庫 ${e.mokkanko}: ${r.titolo}`),
    metadata: [coppia("Edizione", e.edizione), coppia("Testo", e.testo), coppia("Provenienza", e.provenienza), coppia("Scavo", e.scavo), coppia("Datazione", r.datazione),
      coppia("Datazione dello strato", e.datazione_strato), coppia("Genere", e.genere), coppia("Misure", e.misure), coppia("Legno", e.legno), coppia("Conservazione", e.conservazione)].filter(Boolean),
    requiredStatement: { label: lm("Attribuzione", "it"), value: lm(`出典：木簡庫（${r.pagina}）, 奈良文化財研究所. Manifesto scritto da Emendando con le foto del sito.`, "it") },
    homepage: [{ id: r.pagina, type: "Text", label: lm(r.titolo), format: "text/html" }], items };
}
export function manifestiGiappone(st = leggiStato()) {
  const out = { "giappone-mokkan": {} };
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!k.startsWith("mokkanko:")) continue;
    const r = recordMokkanko(k.slice(9), v); if (!r) continue;
    out["giappone-mokkan"][k.slice(9).toLowerCase()] = manifestoMokkanko(r, v);
  }
  return out;
}
