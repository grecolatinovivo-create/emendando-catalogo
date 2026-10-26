// National Library of Israel, Gerusalemme (Ktiv, collezione dei manoscritti): dal 26 ottobre 2026, corsia «mondo».
// Il sito (www.nli.org.il), il suo robots.txt e la ricerca sono dietro la verifica anti-robot di Cloudflare (Turnstile) anche dal
// browser; l'API Open Library (api.nli.org.il) chiede una chiave personale: nessuno dei due si usa. I manifesti IIIF invece rispondono
// (iiif.nli.org.il/IIIFv21/DOCID/PNX_MANUSCRIPTS<MMS>-1/manifest, Presentation 2, CORS aperto, servizio Image IIPImage con CORS aperto;
// prova del 26 ottobre 2026), ma da qui non si leggono: li apre solo il browser di chi usa il catalogo.
// Elenco: Europeana (API pubblica di ricerca, chiave dimostrativa «api2demo», come per la National Library of Wales), insieme
// «318_Ag_JHN_NationalLibraryIsrael» (Jewish Heritage Network): le schede di tipo «Manuscript language material» (circa 19.300), con
// un'immagine della NLI (edmIsShownBy su …/IIIFv21/FL<n>/…). L'id Europeana «marc_nli_<numero Aleph a 9 cifre>» dà il numero MMS
// (99 + numero Aleph + 0205171) e quindi il manifesto. Diritti dichiarati: «In Copyright - Educational Use Permitted» (InC-EDU).
// Proprietario: la NLI, tranne le schede con «dc:rights» «Bibliotheca Rosenthaliana» (Amsterdam, copie digitali ospitate dalla NLI:
// entrano, con la loro biblioteca) e «Leipzig University Library» (fuori: i codici ebraici di Lipsia sono già nella fonte «lipsia»,
// con gli stessi manifesti). I microfilm di altre biblioteche che Ktiv mostra non sono in Europeana e non si possono elencare senza la
// ricerca del sito: restano fuori.
// Entrano i codici, i frammenti e i fogli di codici; fuori ketubbot, lettere, atti, registri, documenti, ghittin, mezuzot e le
// bibliografie (`motivoNli`). I manifesti già nel catalogo per altre vie (Lipsia) restano alle loro fonti (raccogli.mjs).
// Stato in data/nli.json; elenco completo ogni 14 giorni (circa 210 pagine da 100 schede, pausa di 1,5 secondi).
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/nli.json";
export const EUROPEANA = "https://api.europeana.eu/record/v2/search.json";
export const IIIF = "https://iiif.nli.org.il/IIIFv21/DOCID";
const FORNITORE = 'DATA_PROVIDER:"National Library of Israel"';
const TIPO = 'proxy_dc_type.en:"Manuscript language material"';
const PROPRIETARI = { ros: "Bibliotheca Rosenthaliana", lip: "Leipzig University Library" };
const GIORNI = 14, RIGHE = 100;
// generi (dc:type) che non sono codici
export const NON_LIBRARI = /^(Ketubbot|Personal correspondence|Records \(Documents\)|Family records|Negotiable instruments|Registers of births|Wills|Gittin|Death registers|Licenses|Business records|Society records|Account books|Commercial documents|Announcements|Community records|Taḳanot|Pinkasim|Mezuzot|Bibliographies|Forms \(Jewish law\))/i;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale", "cursore", "fase"]);

export const mmsDa = aleph => `99${aleph}0205171`;
const lista = x => [].concat(x ?? []);
const pulito = s => String(s ?? "").replace(/\s+/g, " ").trim();

// scheda della ricerca Europeana -> [aleph, voce compatta] (null se manca l'immagine)
export function compattaNli(it) {
  const aleph = (/marc_nli_(\d{9})$/.exec(it.id || "") || [])[1];
  const f = (/IIIFv21\/(FL\d+)\//.exec(lista(it.edmIsShownBy)[0] || "") || [])[1];
  if (!aleph || !f) return null;
  const en = new Set(lista((it.dcTitleLangAware || {}).en));
  const titoli = [...new Set(lista(it.title).map(pulito).filter(t => t && !en.has(t)))];
  const tipi = it.dcTypeLangAware || {};
  const generi = [...new Set(Object.entries(tipi).filter(([k]) => k !== "en").flatMap(([, v]) => v).map(pulito).filter(Boolean))];
  const descr = (it.dcDescriptionLangAware || {});
  const c = [...new Set([...lista(descr.def), ...lista(descr.he)].map(pulito))].join(" ; ").slice(0, 1500);
  const v = { t: titoli.slice(0, 3).join(" ; ").slice(0, 400) || null, a: [...new Set(lista(it.dcCreator).map(pulito))].slice(0, 6),
    d: lista(it.year)[0] || null, l: [...new Set(lista(it.dcLanguage))], g: generi, c: c || null, f };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return [aleph, v];
}

export function motivoNli(v) {
  if (!v || !v.f) return "senza immagini";
  if (v.x) return "manifesto non leggibile";
  if (v.o === "lip") return "Lipsia: già nella fonte «lipsia»";
  if ((v.g || []).some(g => NON_LIBRARI.test(g))) return "non librario";
  if (v.o !== "lip" && /^Leipzig\b/i.test(v.s || "")) return "Lipsia: già nella fonte «lipsia»";
  if (/^(פנקס|הקדש בוך)/.test(v.t || "")) return "non librario";   // pinkas e libri dell'hekdesh: registri di comunità e confraternite
  if (/(^|[\s:(])דפוס[\s,]/.test(v.t || "")) return "stampato con note manoscritte";   // «הגהות … : דפוס ונציה» = libro a stampa annotato
  return null;
}
// entra nel catalogo solo dopo che l'inizio del manifesto è stato letto (alcune schede non hanno il manifesto PNX_MANUSCRIPTS)
export function entraNli(v) {
  return !motivoNli(v) && !!v.h;
}

// una ricerca Europeana completa con il cursore: chiama `ogni(scheda)` per ogni scheda
async function cerca(qf, ogni, { fine, st, fase }) {
  let cursore = st.fase === fase && st.cursore ? st.cursore : "*", n = 0;
  for (;;) {
    if (Date.now() > fine) { st.fase = fase; st.cursore = cursore; return false; }
    const q = new URLSearchParams({ wskey: "api2demo", query: FORNITORE, rows: String(RIGHE), profile: "rich", cursor: cursore });
    for (const x of qf) q.append("qf", x);
    const r = await scarica(`${EUROPEANA}?${q}`, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`Europeana: HTTP ${r.stato}`);
    const j = JSON.parse(r.testo);
    for (const it of j.items || []) { ogni(it); n++; }
    if (fase === "codici") st.totale = j.totalResults;
    if (!j.nextCursor || !(j.items || []).length) break;
    cursore = j.nextCursor;
    if (n % 2000 < RIGHE) log("nli", `${fase}: ${n} schede su ${j.totalResults}`);
  }
  st.fase = null; st.cursore = null;
  return true;
}

export async function scansionaNli({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {};
  if (soloCache) return st;
  if (st.completato && st.elenco && Date.now() - Date.parse(st.elenco) < GIORNI * 864e5) { log("nli", `riuso la raccolta del ${st.completato.slice(0, 10)}`); return st; }
  const fine = Date.now() + minuti * 60e3;
  // elenco recente e non interrotto: si continuano solo i manifesti
  if (st.elenco && !st.fase && Date.now() - Date.parse(st.elenco) < GIORNI * 864e5) { await leggiTeste(st, fine); return st; }
  // fasi: codici (tutte le schede), poi i proprietari diversi dalla NLI (Rosenthaliana, Lipsia)
  const fasi = [["codici", [TIPO], it => { const c = compattaNli(it); if (c) st.voci[c[0]] = { ...(st.voci[c[0]] && st.voci[c[0]].o ? { o: st.voci[c[0]].o } : {}), ...c[1], k: 1 }; }],
    ...Object.entries(PROPRIETARI).map(([o, nome]) => [o, [TIPO, `proxy_dc_rights:"${nome}"`], it => { const a = (/marc_nli_(\d{9})$/.exec(it.id || "") || [])[1]; if (a && st.voci[a]) st.voci[a].o = o; }])];
  const inizio = st.fase ? fasi.findIndex(f => f[0] === st.fase) : 0;
  if (!st.fase) for (const v of Object.values(st.voci)) delete v.k;   // nuova lettura: «k» segna le schede viste
  for (const [fase, qf, ogni] of fasi.slice(Math.max(0, inizio))) {
    const finita = await cerca(qf, ogni, { fine, st, fase });
    st.aggiornato = new Date().toISOString();
    if (!finita) { salva(st); throw new Error(`raccolta incompleta (fase ${fase}): riprenderà alla prossima esecuzione`); }
    if (fase === "codici") { for (const [a, v] of Object.entries(st.voci)) if (!v.k) delete st.voci[a]; }
  }
  for (const v of Object.values(st.voci)) delete v.k;
  if (Object.keys(st.voci).length < 1000) throw new Error(`elenco troppo corto (${Object.keys(st.voci).length} schede)`);
  st.elenco = st.aggiornato = new Date().toISOString();
  salva(st);
  log("nli", `elenco: ${Object.keys(st.voci).length} schede, candidati ${Object.values(st.voci).filter(v => !motivoNli(v)).length}`);
  await leggiTeste(st, fine);
  return st;
}

// inizio di ogni manifesto (una volta sola, solo per i candidati): conferma che il manifesto c'è (alcune schede non hanno il manifesto
// PNX_MANUSCRIPTS) e dà la segnatura con la biblioteca, in coda all'etichetta («… JER NLI 1183=28», «… BAR ILAN 1035»), e la datazione
export async function leggiTeste(st, fine) {
  const da = Object.keys(st.voci).filter(a => !st.voci[a].h && !motivoNli(st.voci[a]));
  let letti = 0, errori = 0;
  for (const a of da) {
    if (Date.now() > fine) break;
    let r; try { r = await scarica(`${IIIF}/PNX_MANUSCRIPTS${mmsDa(a)}-1/manifest`, { range: 8000, basta: t => /"SysNum"/.test(t), timeout: 60000, tentativi: 2 }); }
    catch (e) { if (++errori >= 8) break; continue; }
    errori = 0; letti++;
    const v = st.voci[a];
    if (r.stato !== 200 && r.stato !== 206) { v.x = `HTTP ${r.stato}`; continue; }
    Object.assign(v, testaNli(r.testo));
    if (letti % 100 === 0) { st.aggiornato = new Date().toISOString(); salva(st); }
  }
  st.aggiornato = new Date().toISOString();
  const resto = Object.values(st.voci).filter(v => !v.h && !motivoNli(v)).length;
  if (!resto) st.completato = st.completato || st.aggiornato;
  else st.completato = null;
  salva(st);
  log("nli", `manifesti letti: ${letti}; mancano ${resto}`);
  if (resto) throw new Error(`manifesti letti in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
}

const stringa = s => { try { return JSON.parse('"' + s + '"'); } catch (e) { return s; } };
// inizio del manifesto -> { h: 1, s: segnatura, dd: datazione } oppure { x: motivo }
export function testaNli(t) {
  if (!/"@type"\s*:\s*"sc:Manifest"/.test(t)) return { x: "manifesto non leggibile" };
  const label = stringa((/"label"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(t) || [])[1] || "");
  const data = stringa((/"label"\s*:\s*"Creation Date"\s*,\s*"value"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(t) || [])[1] || "");
  const out = { h: 1 };
  const seg = segnaturaNli(label); if (seg) out.s = seg;
  if (data) out.dd = data.replace(/\.$/, "");
  return out;
}

// segnatura in coda all'etichetta: la parte finale in caratteri latini che contiene un numero
export function segnaturaNli(label) {
  const m = /([A-Z][A-Za-z.'&-]*(?: [A-Za-z.'&()-]+)*\.? ?[A-Za-z0-9.,=\/:()° -]*\d[A-Za-z0-9.,=\/:()° -]*)\s*$/.exec(String(label || "").trim());
  return m ? m[1].trim() : null;
}

// collezioni di altri enti che la NLI ospita, riconosciute dall'inizio della segnatura; «doppio»: già nel catalogo per altre vie
export const COLLEZIONI = [
  [/^(JER NLI|Ms\.? ?(Yah\.? ?)?Heb|Heb\.|Yah\.)/i, null],   // NLI, compresa la collezione Yahuda
  [/^(AMST(ERDAM)? )?Ros\b/i, { b: "Bibliotheca Rosenthaliana, Allard Pierson, Universiteit van Amsterdam", c: "Amsterdam" }],
  [/^Tel Aviv Gross/i, { b: "Gross Family Collection", c: "Tel Aviv" }],
  [/^BAR ILAN/i, { b: "Bar-Ilan University Library", c: "Ramat Gan" }],
  [/^JER HEKHAL/i, { b: "Heichal Shlomo", c: "Gerusalemme" }],
  [/^JER FELDMAN/i, { b: "Collezione Feldman", c: "Gerusalemme" }],
  [/^Nonantola/i, { b: "Archivio storico comunale di Nonantola", c: "Nonantola" }],
  [/^ZURICH Braginsky/i, "doppio"],   // Braginsky Collection: già in e-codices
  [/^Leipzig/i, "doppio"],            // Universitätsbibliothek Leipzig: già nella fonte «lipsia»
];
export function collezioneNli(v) {
  if (v.o === "ros") return COLLEZIONI[1][1];
  if (!v.s) return null;
  for (const [re, c] of COLLEZIONI) if (re.test(v.s)) return c;
  const nome = v.s.replace(/\s*(Ms\.?|Cod\.?|MS)?\s*[\d=].*$/, "").trim();
  return nome ? { b: nome, c: null } : null;
}

// «מאה י"ח» (secolo XVIII in lettere ebraiche), anche «מאה י"ד-ט"ו»: si aggiunge «(14th-15th century)» per il calcolo del secolo
const VALORI = { "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9, "י": 10, "כ": 20, "ך": 20 };
const numeroEbraico = t => [...String(t).replace(/["'״׳]/g, "")].reduce((n, c) => n + (VALORI[c] || 0), 0);
const ordinale = n => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
export function datazioneNli(d) {
  if (!d || /\d{3,4}/.test(d)) return d || null;
  const m = /מאה\s+([א-ת"'״׳]+)(?:\s*-\s*([א-ת"'״׳]+))?/.exec(d);
  if (!m) return d;
  const a = numeroEbraico(m[1]), b = m[2] ? numeroEbraico(m[2]) : a;
  if (!a || a > 21 || b < a || b > 21) return d;
  return `${d} (${a === b ? ordinale(a) : ordinale(a) + "-" + ordinale(b)} century)`;
}

export function recordNli(st = leggiStato()) {
  const out = [];
  for (const [a, v] of Object.entries(st.voci || {})) {
    if (!entraNli(v)) continue;
    const col = collezioneNli(v);
    if (col === "doppio") continue;
    const mms = mmsDa(a);
    out.push({ fonte: "nli", id: "nli-" + mms, citta: col ? col.c : "Gerusalemme",
      biblioteca: col ? `${col.b} (copia digitale della National Library of Israel)` : "National Library of Israel",
      segnatura: v.s || `NLI ${mms}`, datazione: datazioneNli(v.dd) || v.d || null, titolo: v.t || null, autori_fonte: v.a || [],
      descrizione: [v.c, (v.g || []).join(" ; ")].filter(Boolean).join(" ; ").slice(0, 4000) || null,
      lingue: lingueDa(v.l || []), manifest: `${IIIF}/PNX_MANUSCRIPTS${mms}-1/manifest`,
      anteprima: `https://iiif.nli.org.il/IIIFv21/${v.f}/full/,300/0/default.jpg`,
      pagina: `https://www.nli.org.il/en/manuscripts/NNL_ALEPH${mms}/NLI`,
      licenza: col ? `${col.b}, immagini della National Library of Israel (Ktiv): uso didattico consentito (In Copyright - Educational Use Permitted)`
        : "National Library of Israel (Ktiv): uso didattico consentito (In Copyright - Educational Use Permitted); altri usi con il permesso della biblioteca" });
  }
  return out;
}
