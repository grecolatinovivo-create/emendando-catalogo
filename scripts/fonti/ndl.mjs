// National Diet Library, Tokyo (NDL Digital Collections, dl.ndl.go.jp): OAI-PMH della biblioteca digitale
// (dl.ndl.go.jp/api/oaipmh, solo ListRecords e GetRecord; «from» obbligatorio), insieme «D:24» = «古典籍資料（貴重書等）»
// (libri giapponesi e cinesi antichi, circa 115.000 volumi digitalizzati), formato «dcndl_porta» (il più ricco:
// tipo di materiale, segnatura, lingua, datazione, diritti). 200 record per pagina, circa 1,2 MB e 10 secondi per pagina.
// Entrano solo i manoscritti (materialType «Manuscript», editore «写»): i libri a stampa xilografici («刊») restano fuori.
// Ogni volume digitalizzato è un oggetto con il suo manifesto (le opere in più volumi danno più voci, con il volume in segnatura).
// Nessun limite di data (dal 25 ottobre 2026 il catalogo tiene anche i manoscritti moderni); fuori lettere e documenti d'archivio.
// Il robots.txt di dl.ndl.go.jp non pone limiti; pausa di 1,5 secondi. Manifesti IIIF Presentation 2:
// dl.ndl.go.jp/api/iiif/<pid>/manifest.json (CORS aperto su manifesti e immagini), dominio pubblico (PDM) quasi sempre.
// Stato in data/ndl.json; il token OAI codifica la posizione, quindi la raccolta riprende anche il giorno dopo.
// Raccolta completa ogni 30 giorni; nel frattempo, ogni 6 giorni, solo i record cambiati (from=ultima raccolta).
import fs from "node:fs";
import { scarica, log, decodifica } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { NON_LIBRARI_JA } from "./kokusho.mjs";
import { cartaGiapponese } from "../carte.mjs";

export const FILE_STATO = "data/ndl.json";
export const BASE = "https://dl.ndl.go.jp/api/oaipmh";
export const INSIEME = "D:24";
const GIORNI = 6, GIORNI_COMPLETA = 30;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, completa: st.completa || null, cursore: st.cursore || null, g: st.g || 0, totale: st.totale || null, letti: st.letti || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// valori di un elemento (con o senza attributi), decodificati
function valori(xml, nome, tipo) {
  const re = new RegExp(`<${nome}(\\s[^>]*)?>([^<]*)</${nome}>`, "g"); const out = []; let m;
  while ((m = re.exec(xml))) { if (tipo != null && !String(m[1] || "").includes(tipo)) continue; if (tipo === "" && m[1] && /xsi:type/.test(m[1])) continue; out.push(decodifica(m[2])); }
  return out.filter(Boolean);
}

/* record OAI dcndl_porta -> [pid, voce compatta] (voce null se non è un manoscritto dei libri antichi o non è aperto in rete) */
export function estraiNdl(rec) {
  const pid = (/<identifier>oai:dl\.ndl\.go\.jp:info:ndljp\/pid\/(\d+)<\/identifier>/.exec(rec) || [])[1];
  if (!pid) return null;
  if (/status="deleted"/.test(rec)) return [pid, null];
  const tipi = valori(rec, "dcndl:materialType"), editori = valori(rec, "dc:publisher");
  // solo i libri antichi (JapaneseClassicalBook, ChineseClassicalBook…): nell'insieme ci sono anche manoscritti moderni («Book», «稿本»)
  const manoscritto = tipi.includes("Manuscript") || editori.some(e => /^写/.test(e));
  if (!manoscritto || !tipi.some(t => /Classical/i.test(t))) return [pid, null];
  const date = valori(rec, "dcterms:issued");
  // pubblicazione solo in biblioteca (non su Internet): niente immagini aperte
  const diritti = valori(rec, "dcterms:rights");
  const accesso = valori(rec, "dcterms:accessRights");
  if (accesso.length && !accesso.some(a => /^S01/.test(a))) return [pid, null];
  const v = { s: valori(rec, "dcndl:callNumber")[0] || null, t: valori(rec, "dcterms:title")[0] || null };
  const vol = valori(rec, "dcndl:volume")[0]; if (vol) v.v = vol;
  const autori = valori(rec, "dc:creator", "").slice(0, 6); if (autori.length) v.a = autori;
  const d = date.find(x => !/^\d{4}(-\d\d)?(-\d\d)?$/.test(x)) || date[0]; if (d) v.d = d;
  const l = valori(rec, "dc:language", "ISO639-2"); if (l.length) v.l = l;
  if (diritti[0] && diritti[0] !== "PDM") v.r = diritti[0];
  const parti = [...valori(rec, "dcndl:partTitle"), ...valori(rec, "dcndl:partCreator")].join(" ; ");
  const desc = [valori(rec, "dc:subject").join(" ; "), valori(rec, "dc:description").join(" ; "), parti].filter(Boolean).join(" ; ").slice(0, 1500);
  if (desc) v.c = desc;
  return [pid, v];
}

/* raccolta a riprese: cursore = { token, from } (token OAI); stato salvato dopo ogni pagina */
export async function scansionaNdl({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {};
  if (soloCache) return st;
  const ora = Date.now();
  if (!st.cursore) {
    if (st.completato && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("ndl", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} manoscritti`); return st; }
    // ogni 30 giorni da capo (per togliere i record cancellati), altrimenti solo i cambiati
    const completa = !st.completa || ora - Date.parse(st.completa) > GIORNI_COMPLETA * 864e5;
    // raccolta completa: ogni voce letta riceve il numero della raccolta (g); alla fine si tolgono quelle non più restituite
    st.cursore = { token: null, from: completa ? "2000-01-01" : st.completato.slice(0, 10), completa, g: completa ? (st.g || 0) + 1 : null };
    st.letti = 0;
  } else log("ndl", `riprendo (${st.letti || 0} record già letti${st.totale ? " su " + st.totale : ""})`);
  const fine = ora + minuti * 60e3;
  for (;;) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${st.letti} record letti su ${st.totale || "?"}): riprenderà alla prossima esecuzione`); }
    const c = st.cursore;
    const url = c.token ? `${BASE}?verb=ListRecords&resumptionToken=${encodeURIComponent(c.token)}` : `${BASE}?verb=ListRecords&metadataPrefix=dcndl_porta&set=${encodeURIComponent(INSIEME)}&from=${c.from}`;
    const r = await scarica(url, { timeout: 180000 });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    if (/<error code="noRecordsMatch"/.test(r.testo)) { c.token = null; break; }
    if (/<error code="badResumptionToken"/.test(r.testo)) { log("ndl", "token scaduto: ricomincio"); delete st.cursore; salvaStato(st); throw new Error("token scaduto: la raccolta ricomincerà"); }
    for (const rec of r.testo.match(/<record>[\s\S]*?<\/record>/g) || []) {
      const x = estraiNdl(rec); if (!x) continue;
      st.letti = (st.letti || 0) + 1;
      if (x[1]) { if (c.g) x[1].g = c.g; else if (st.voci[x[0]]) x[1].g = st.voci[x[0]].g; st.voci[x[0]] = x[1]; } else delete st.voci[x[0]];
    }
    const tot = /completeListSize="(\d+)"/.exec(r.testo); if (tot && c.completa) st.totale = +tot[1];
    c.token = (/<resumptionToken[^>]*>([^<]+)<\/resumptionToken>/.exec(r.testo) || [])[1] || null;
    st.aggiornato = new Date().toISOString();
    if (!c.token) break;
    salvaStato(st);
    if (st.letti % 4000 === 0) log("ndl", `${st.letti} record letti${st.totale ? " su " + st.totale : ""}, ${Object.keys(st.voci).length} manoscritti`);
  }
  if (st.cursore.completa) {
    for (const [k, v] of Object.entries(st.voci)) if (v.g !== st.cursore.g) delete st.voci[k];
    st.g = st.cursore.g; st.completa = new Date().toISOString();
  }
  delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("ndl", `fine: ${Object.keys(st.voci).length} manoscritti`);
  return st;
}

// lingue NDL (ISO 639-2: jpn, chi, kor, ...) -> codici del catalogo; senza lingua: giapponese se il titolo ha kana
export function lingueNdl(v) {
  const l = lingueDa(v.l || []);
  if (l.length) return l;
  return /[぀-ヿ]/.test(v.t || "") ? ["ja"] : [];
}

// filtro applicato anche in costruzione (basta --solo-costruisci per ripulire le voci già raccolte): fuori le lettere
// e i documenti d'archivio («書簡», «文書»); nessun limite di data
export function ammessaNdl(v) {
  if (!v) return false;
  return !NON_LIBRARI_JA.test(v.t || "");
}

// carte (dal 26 ottobre 2026, scripts/carte.mjs): titolo o classificazione «地図・絵図»; manoscritte, salvo una datazione che dica
// stampa («刊», «版»: carta_stampa); «刊写入交» (volumi stampati e copiati insieme) resta carta manoscritta
export function tipoNdl(v) {
  if (!v || !cartaGiapponese(v.t, v.c || "")) return null;
  const d = v.d || "";
  return /刊|版/.test(d) && !/写|寫/.test(d) ? "carta_stampa" : "carta";
}
export function recordNdl(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaNdl(v)).map(([pid, v]) => ({
    fonte: "ndl", id: "ndl-" + pid, citta: "Tokyo", biblioteca: "National Diet Library (国立国会図書館)",
    segnatura: [v.s, v.v].filter(Boolean).join(", ") || "pid " + pid, datazione: v.d || null, titolo: [v.t, v.v].filter(Boolean).join(". "),
    autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueNdl(v),
    manifest: `https://dl.ndl.go.jp/api/iiif/${pid}/manifest.json`, pagina: `https://dl.ndl.go.jp/pid/${pid}`,
    licenza: v.r || "Public Domain Mark 1.0", ...(tipoNdl(v) ? { tipo: tipoNdl(v) } : {}) }));
}
