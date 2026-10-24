// Biblioteca Apostolica Vaticana (digi.vatlib.it). Il robots.txt vieta ricerca e schede (/mss/search, /mss/detail)
// e chiede 10 secondi tra le richieste: si leggono solo i manifesti IIIF, un codice alla volta, e di ciascuno
// solo l'inizio (Range: i metadati Author, Title, Date precedono l'elenco delle immagini).
// Lo stato della scansione (segnature già viste, metadati letti) è in data/vaticana.json e cresce a ogni
// esecuzione (ogni 3 ore): prima gli intervalli dove si concentrano i classici latini, poi i fondi interi.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/vaticana.json";
// intervalli prioritari (fondi umanistici e altomedievali ricchi di classici), poi i fondi latini principali per intero
export const PERCORSO = [
  ["Pal.lat", 1610, 1620], ["Vat.lat", 3860, 3880],
  ["Vat.lat", 3200, 3420], ["Pal.lat", 1490, 1720], ["Reg.lat", 1480, 1800], ["Urb.lat", 300, 700], ["Ott.lat", 1100, 1500], ["Vat.lat", 1500, 2000],
  ["Pal.lat", 1, 2050], ["Reg.lat", 1, 2130], ["Urb.lat", 1, 1780], ["Ott.lat", 1, 3420], ["Vat.lat", 1, 15400], ["Barb.lat", 1, 12000], ["Ross", 1, 1200],
];
export const segnaturaLeggibile = s => s.replace(/\.(?=\S)/g, ". ").replace(/\s+/g, " ").trim();   // Vat.lat.3870 -> Vat. lat. 3870
export const manifestoDi = s => `https://digi.vatlib.it/iiif/MSS_${s}/manifest.json`;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { giro: 1, passo: 0, prossimo: null, visti: 0, voci: {} }; }
}
export function salvaStato(st) {
  const ord = Object.fromEntries(Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
  fs.writeFileSync(FILE_STATO + ".tmp", JSON.stringify({ ...st, voci: ord }, null, 0).replace(/\},"/g, '},\n"') + "\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// metadati dall'inizio del manifesto (fino a "sequences"); se il JSON parziale non si chiude, espressioni regolari
export function metadatiDaInizio(testo) {
  const i = testo.indexOf('"sequences"');
  let m = null;
  if (i > 0) { try { m = JSON.parse(testo.slice(0, i).replace(/,\s*$/, "") + "}"); } catch (e) { m = null; } }
  if (!m) { try { m = JSON.parse(testo); } catch (e) { m = null; } }
  const out = { a: [], t: [], d: null, l: null };
  if (m && Array.isArray(m.metadata)) {
    for (const x of m.metadata) {
      const v = [].concat(x.value || []).map(y => typeof y === "string" ? y : y && y["@value"] || "").filter(Boolean);
      if (/^author/i.test(x.label)) out.a.push(...v); else if (/^title/i.test(x.label)) out.t.push(...v); else if (/^date/i.test(x.label)) out.d = v[0] || null;
    }
    out.l = typeof m.label === "string" ? m.label : null;
  }
  return out;
}

async function leggi(seg) {
  const r = await scarica(manifestoDi(seg), { range: 16384, basta: t => t.includes('"sequences"'), tentativi: 3 });
  if (r.stato === 404 || r.stato === 410) return null;
  if (r.stato !== 200 && r.stato !== 206) throw new Error(`HTTP ${r.stato}`);
  return metadatiDaInizio(r.testo);
}

/* scansione a tempo: legge i manifesti seguendo PERCORSO e aggiorna lo stato su disco ogni 20 codici.
   minuti: tempo massimo; extra: segnature da leggere per prime (es. i codici del Truculentus) */
export async function scansiona({ minuti = 20, extra = [] } = {}) {
  const st = leggiStato(), fine = Date.now() + minuti * 60e3;
  st.visti_giro = st.visti_giro || {};
  let letti = 0, trovati = 0;
  const visto = (f, n) => (st.visti_giro[f] || []).some(([a, b]) => n >= a && n <= b);
  const segna = (f, n) => {   // intervalli fusi [da, a]
    const L = st.visti_giro[f] = st.visti_giro[f] || [];
    L.push([n, n]); L.sort((x, y) => x[0] - y[0]);
    const out = []; for (const x of L) { const u = out[out.length - 1]; if (u && x[0] <= u[1] + 1) u[1] = Math.max(u[1], x[1]); else out.push([...x]); }
    st.visti_giro[f] = out;
  };
  const uno = async seg => {
    let m; try { m = await leggi(seg); } catch (e) { log("vaticana", seg, e.message); return false; }
    letti++;
    if (m && (m.a.length || m.t.length)) { st.voci[seg] = { a: m.a, t: m.t, d: m.d }; trovati++; } else delete st.voci[seg];
    if (letti % 20 === 0) { salvaStato(st); log("vaticana", `${letti} manifesti letti, ultimo ${seg}`); }
    return true;
  };
  for (const s of extra) { if (Date.now() > fine) break; if (!st.voci[s]) await uno(s); }
  while (Date.now() < fine) {
    if (st.passo >= PERCORSO.length) { st.giro++; st.passo = 0; st.prossimo = null; st.visti_giro = {}; log("vaticana", "percorso completato: nuovo giro", st.giro); }
    const [f, da, a] = PERCORSO[st.passo];
    let n = st.prossimo ?? da;
    while (n <= a && visto(f, n)) n++;
    if (n > a) { st.passo++; st.prossimo = null; continue; }
    const ok = await uno(`${f}.${n}`);
    if (!ok) { st.prossimo = n; break; }                 // server in difficoltà: si riprende la prossima volta da qui
    segna(f, n); st.prossimo = n + 1; st.visti = (st.visti || 0) + 1;
  }
  st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("vaticana", `fine: ${letti} manifesti letti, ${trovati} con autore o titolo; percorso ${st.passo + 1}/${PERCORSO.length}`);
  return st;
}

// record compatti per il catalogo, dalle voci dello stato
export function recordVaticana(st = leggiStato()) {
  return Object.entries(st.voci).filter(([, v]) => v.a.length || v.t.length).map(([seg, v]) => ({
    fonte: "vaticana", id: "bav-" + seg.toLowerCase().replace(/[^a-z0-9]+/g, "-"), citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana",
    segnatura: segnaturaLeggibile(seg), datazione: v.d || null, titolo: v.t.join(" ; ") || null, autori_fonte: v.a,
    manifest: manifestoDi(seg), pagina: `https://digi.vatlib.it/view/MSS_${seg}`, licenza: "© Biblioteca Apostolica Vaticana" }));
}
