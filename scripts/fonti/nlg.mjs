// Biblioteca Nazionale di Grecia (Εθνική Βιβλιοθήκη της Ελλάδος), Atene: Piattaforma delle collezioni digitali
// (digitalcollections.nlg.gr). Elenco dall'OAI-PMH della piattaforma (/nlg-repo/dl/oaipmh, insieme «manuscript», circa 780
// manoscritti, quasi tutti greci: Codices Athenienses e codici di altri enti digitalizzati con la Biblioteca); il sito non ha
// robots.txt, pausa di 1,5 secondi.
// I manifesti IIIF della Biblioteca (/nlg-repo/dl/el/iiifmetadata/<id>) si aprono dal server ma né i manifesti né gli info.json
// del servizio Image mandano l'intestazione CORS: dal visore di Emendando non si aprono (prova del 25 ottobre 2026). Le immagini
// invece si caricano come semplici <img>. Quindi: si legge una volta il manifesto di ogni codice (immagini e misure di ogni
// pagina, in data/nlg.json) e se ne scrive una copia nostra (scripts/manifesti.mjs, ramo «manifesti») con le immagini a misura
// fissa (/full/<larghezza>,/0/default.jpg) e senza servizio Image: il visore le mostra, ma gli strumenti (per esempio quelli per
// l'inchiostro) non funzionano per questi codici.
// Entrano solo i codici di cui si è letto il manifesto. Lo stato è in data/nlg.json: l'elenco si rilegge ogni 6 giorni,
// i manifesti una volta sola (si rileggono solo i codici nuovi o cambiati, cioè con data OAI diversa).
import fs from "node:fs";
import { scarica, log, tag, records, token, decodifica } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/nlg.json";
export const SITO = "https://digitalcollections.nlg.gr";
export const OAI = `${SITO}/nlg-repo/dl/oaipmh`;
export const manifestoNlg = id => `${SITO}/nlg-repo/dl/el/iiifmetadata/${id}`;
const GIORNI = 6;
export const LARGHEZZA = 2000;   // larghezza massima delle immagini a misura fissa nelle copie dei manifesti

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  for (const v of Object.values(st.voci)) if (Array.isArray(v.p)) v.p = compattaPagine(v.p);
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, token: st.token || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// lingue della piattaforma, in greco («Ελληνική, Αρχαία», «Λατινική»)
const LINGUE = { "ελληνικ": "grc", "λατινικ": "la", "αραβικ": "ar", "τουρκικ": "tr", "ιταλικ": "it", "γαλλικ": "fr", "γερμανικ": "de", "αγγλικ": "en",
  "ισπανικ": "es", "εβραϊκ": "he", "εβραικ": "he", "συριακ": "syr", "κοπτικ": "cop", "αρμενικ": "hy", "γεωργιανικ": "ka", "σλαβικ": "cu", "ρωσικ": "ru", "περσικ": "fa", "ρουμανικ": "xx" };
export function lingueNlg(valori) {
  const out = [];
  for (const v of [].concat(valori || [])) {
    const s = String(v).toLowerCase();
    const k = Object.keys(LINGUE).find(x => s.includes(x));
    for (const c of k ? [LINGUE[k]] : lingueDa([v])) if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

// record oai_dc -> { id, voce } (null se non è un manoscritto)
export function estraiNlg(rec) {
  const id = (/<identifier>oai:nlg\.gr:(\d+)<\/identifier>/.exec(rec) || [])[1];
  if (!id || !/<dc:type>manuscript<\/dc:type>/.test(rec)) return null;
  const titolo = (/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/.exec(rec) || [])[1];
  const ds = (/<datestamp>([^<]+)<\/datestamp>/.exec(rec) || [])[1] || null;
  const v = { s: decodifica(titolo || ""), d: tag(rec, "dc:date")[0] || null, l: tag(rec, "dc:language"), k: tag(rec, "dc:subject").join(" ; ") || null,
    m: tag(rec, "dc:format").join(" ; ") || null, ds };
  return { id, v };
}

// «ΕΒΕ 919 (Codex Atheniensis 919)» -> «EBE 919 (Codex Atheniensis 919)» resta com'è: è la segnatura della Biblioteca
// manifesto della Biblioteca -> pagine [file, larghezza, altezza] (file: parte finale dell'indirizzo del servizio, dopo /iiif/<id>/), titolare dei diritti
export function pagineDaManifesto(m, id) {
  const pre = `${SITO}/iiif/${id}/`;
  const pagine = [];
  for (const c of ((m.sequences || [])[0] || {}).canvases || []) {
    const r = ((c.images || [])[0] || {}).resource || {};
    const svc = (r.service && r.service["@id"]) || String(r["@id"] || "").replace(/\/full\/.*$/, "");
    if (!svc.startsWith(pre)) return null;   // forma inattesa: il codice resta fuori
    pagine.push([svc.slice(pre.length), r.width || c.width, r.height || c.height]);
  }
  const meta = Object.fromEntries((m.metadata || []).map(x => [Array.isArray(x.label) ? (x.label.find(l => l["@language"] === "en") || x.label[0])["@value"] : x.label, x.value]));
  return { pagine, titolare: typeof meta["Rights holder"] === "string" ? meta["Rights holder"] : null, contenuto: typeof meta["Category"] === "string" ? meta["Category"] : null };
}

// pagine in forma compatta, per tenere piccolo data/nlg.json: { a: prefisso, z: suffisso, q: cifre (se i nomi sono 1, 2, 3...
// con zeri davanti), m: misure [larghezza, altezza, ...] } oppure, se i nomi non sono in sequenza, { a, z, n: [parti centrali], m }
export function compattaPagine(pagine) {
  if (!pagine.length) return null;
  const nomi = pagine.map(p => p[0]);
  let a = nomi[0], z = nomi[0];
  for (const n of nomi) { while (!n.startsWith(a)) a = a.slice(0, -1); while (!n.endsWith(z)) z = z.slice(1); }
  if (nomi.length === 1) { const m = /^(.*?)(\d*)(\.[a-z0-9]+)?$/i.exec(nomi[0]); a = m[1]; z = m[3] || ""; }
  // il prefisso non deve mangiare le cifre della numerazione («...-0000» comune a 1-9)
  a = a.replace(/\d+$/, ""); z = z.replace(/^\d+/, "");
  const m = pagine.flatMap(p => [p[1] || 0, p[2] || 0]);
  // numerazione 1, 2, 3... con zeri davanti, subito prima del suffisso
  for (let q = 1; q <= 8; q++) {
    const a2 = nomi[0].slice(0, nomi[0].length - z.length - q);
    if (nomi.every((n, i) => n === a2 + String(i + 1).padStart(q, "0") + z)) return { a: a2, z, q, m };
  }
  const mezzi = nomi.map(n => n.slice(a.length, n.length - z.length));
  return { a, z, n: mezzi, m };
}
export function espandiPagine(p) {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  const k = p.m.length / 2;
  return Array.from({ length: k }, (_, i) => [p.a + (p.n ? p.n[i] : String(i + 1).padStart(p.q, "0")) + p.z, p.m[2 * i], p.m[2 * i + 1]]);
}
export const numeroPagine = p => (!p ? 0 : Array.isArray(p) ? p.length : p.m.length / 2);

/* raccolta: elenco OAI (ogni 6 giorni), poi i manifesti dei codici non ancora letti, finché c'è tempo */
export async function scansionaNlg({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5 || st.token) {
    const vecchie = st.voci || {}, nuove = st.token ? { ...st.voci } : {};
    for (;;) {
      if (Date.now() > fine) { salvaStato(st); throw new Error("elenco incompleto: riprenderà alla prossima esecuzione"); }
      const url = st.token ? `${OAI}?verb=ListRecords&resumptionToken=${encodeURIComponent(st.token)}` : `${OAI}?verb=ListRecords&metadataPrefix=oai_dc&set=manuscript`;
      const r = await scarica(url, { timeout: 120000 });
      if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
      if (/badResumptionToken/.test(r.testo)) { st.token = null; continue; }
      for (const rec of records(r.testo)) {
        const x = estraiNlg(rec); if (!x) continue;
        const prima = vecchie[x.id];
        // le pagine lette restano finché il record non cambia
        nuove[x.id] = prima && prima.p && prima.ds === x.v.ds ? { ...x.v, p: prima.p, t: prima.t, c: prima.c } : x.v;
      }
      const m = /completeListSize="(\d+)"/.exec(r.testo); if (m) st.totale = +m[1];
      st.token = token(r.testo);
      st.voci = nuove; st.aggiornato = new Date().toISOString();
      if (!st.token) { st.elenco = st.aggiornato; salvaStato(st); break; }
      salvaStato(st);
    }
    log("nlg", `elenco: ${Object.keys(st.voci).length} manoscritti`);
  }
  // manifesti dei codici non ancora letti
  const da = Object.keys(st.voci).filter(id => !st.voci[id].p && !st.voci[id].x);
  let letti = 0;
  for (const id of da) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`manifesti letti in parte (${Object.keys(st.voci).length - da.length + letti} su ${Object.keys(st.voci).length}): riprenderà alla prossima esecuzione`); }
    const v = st.voci[id];
    // un manifesto che non si legge (errore del server) si riprova al prossimo elenco, fra 6 giorni
    let r; try { r = await scarica(manifestoNlg(id), { timeout: 180000, accept: "application/json", tentativi: 2 }); } catch (e) { v.x = e.message.slice(0, 80); continue; }
    if (r.stato !== 200) { v.x = `HTTP ${r.stato}`; continue; }
    let p = null; try { p = pagineDaManifesto(JSON.parse(r.testo), id); } catch (e) {}
    if (!p || !p.pagine.length) { v.x = "manifesto senza pagine leggibili"; continue; }
    v.p = compattaPagine(p.pagine); v.t = p.titolare; v.c = p.contenuto; letti++;
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("nlg", `${letti} manifesti letti su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  salvaStato(st);
  return st;
}

export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/nlg";
export const LICENZA = "Biblioteca Nazionale di Grecia: uso secondo le condizioni della piattaforma (digitalcollections.nlg.gr/nlg-repo/dl/el/terms.html)";

export function recordNlg(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v && numeroPagine(v.p)).map(([id, v]) => {
    const altro = v.t && !/Εθνική Βιβλιοθήκη/.test(v.t);
    return { fonte: "nlg", id: "nlg-" + id, citta: "Atene", biblioteca: altro ? `${v.t} (copie digitali della Biblioteca Nazionale di Grecia)` : "Biblioteca Nazionale di Grecia",
      segnatura: v.s || id, datazione: v.d, titolo: [v.s, v.c, v.k].filter(Boolean).join(" ; ") || null, descrizione: v.m || null, lingue: lingueNlg(v.l), immagini: numeroPagine(v.p),
      manifest: `${BASE_MANIFESTI}/${id}.json`, pagina: `${SITO}/nlg-repo/dl/el/browse/${id}`, licenza: LICENZA };
  });
}

// copia del manifesto: immagini a misura fissa, senza servizio Image (gli info.json della Biblioteca non hanno CORS)
export function manifestoScritto(id, v) {
  const mid = `${BASE_MANIFESTI}/${id}.json`;
  const canvases = espandiPagine(v.p).map(([f, w, h], i) => {
    const cid = `${SITO}/iiif/${id}/${f}`, lw = Math.min(w || LARGHEZZA, LARGHEZZA), lh = w && h ? Math.round(h * lw / w) : undefined;
    // id del canvas: l'indirizzo dell'immagine presso la Biblioteca (più corto dell'indirizzo del manifesto)
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: w, height: h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid,
        resource: { "@id": `${cid}/full/${lw},/0/default.jpg`, "@type": "dctypes:Image", format: "image/jpeg", width: lw, height: lh } }] };
  });
  const meta = [["Segnatura", v.s], ["Datazione", v.d], ["Lingua", [].concat(v.l || []).join(", ")], ["Contenuto", v.c || v.k], ["Supporto", v.m], ["Titolare dei diritti", v.t]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: v.s || id, metadata: meta,
    attribution: "Biblioteca Nazionale di Grecia (Εθνική Βιβλιοθήκη της Ελλάδος). Copia del manifesto della Biblioteca scritta dal catalogo di Emendando, con le immagini della Biblioteca a misura fissa.",
    license: `${SITO}/nlg-repo/dl/el/terms.html`, related: `${SITO}/nlg-repo/dl/el/browse/${id}`, seeAlso: manifestoNlg(id),
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
