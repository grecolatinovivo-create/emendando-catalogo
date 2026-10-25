// Kokusho Database (国書データベース) del National Institute of Japanese Literature (国文学研究資料館, NIJL), Tokyo:
// libri giapponesi antichi di centinaia di biblioteche, templi e collezioni del Giappone (e del NIJL stesso), con le immagini
// digitalizzate (spesso da microfilm) servite dal NIJL. Elenco: l'API JSON della ricerca avanzata che usa il sito
// (kokusho.nijl.ac.jp/api/biblioAdvanceSearch, 100 schede per pagina; il robots.txt non pone limiti), con i filtri
// «写» (kansha=copy: solo manoscritti, i libri a stampa «刊» restano fuori) e «con immagini» (image≠all), in ordine di bid.
// Entrano solo le schede con immagini proprie (image = "1": le altre hanno un manifesto vuoto), di ogni data (dal 25 ottobre 2026
// nessun limite cronologico; le date in ere giapponesi, «文政１１», si convertono qui solo per mostrarle), fuori lettere e documenti d'archivio.
// Fuori le schede della National Diet Library (fonte «ndl»). Manifesti IIIF Presentation 2: kokusho.nijl.ac.jp/biblio/<bid>/manifest
// (CORS aperto). Condizioni d'uso diverse per proprietario (pubblico dominio, CC, All Rights Reserved): il catalogo ne dà solo i riferimenti.
// Stato in data/kokusho.json (raccolta a riprese, pagina per pagina); una raccolta completa si riusa per 14 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/kokusho.json";
export const BASE = "https://kokusho.nijl.ac.jp";
const GIORNI = 14;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => +a - +b).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, g: st.g || 0, totale: st.totale || null, pagine: st.pagine || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// ere giapponesi (dal 1573): primo anno dell'era
export const ERE = { 天正: 1573, 文禄: 1592, 慶長: 1596, 元和: 1615, 寛永: 1624, 正保: 1644, 慶安: 1648, 承応: 1652, 明暦: 1655, 万治: 1658, 萬治: 1658, 寛文: 1661,
  延宝: 1673, 延寶: 1673, 天和: 1681, 貞享: 1684, 元禄: 1688, 元祿: 1688, 宝永: 1704, 寶永: 1704, 正徳: 1711, 享保: 1716, 元文: 1736, 寛保: 1741, 延享: 1744, 寛延: 1748,
  宝暦: 1751, 寶暦: 1751, 明和: 1764, 安永: 1772, 天明: 1781, 寛政: 1789, 享和: 1801, 文化: 1804, 文政: 1818, 天保: 1830, 弘化: 1844, 嘉永: 1848, 安政: 1854,
  万延: 1860, 萬延: 1860, 文久: 1861, 元治: 1864, 慶応: 1865, 慶應: 1865, 明治: 1868, 大正: 1912, 昭和: 1926 };
const KANJI = { 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function numero(s) {
  s = String(s).replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (/^\d+$/.test(s)) return +s;
  if (s === "元") return 1;
  let n = 0, cur = 0;
  for (const c of s) { if (c === "十") { n += (cur || 1) * 10; cur = 0; } else if (c in KANJI) cur = KANJI[c]; else return null; }
  return n + cur;
}
// «文政１１» -> 1828; «慶応» -> 1865; «1820» -> 1820; «江戸末期», «幕末» -> 1850; sconosciuta -> null
export function annoKokusho(y) {
  const s = String(y || "").replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).trim();
  if (!s) return null;
  for (const [era, inizio] of Object.entries(ERE)) {
    const i = s.indexOf(era); if (i < 0) continue;
    const m = /^([0-9元〇一二三四五六七八九十]+)/.exec(s.slice(i + era.length));
    const n = m ? numero(m[1]) : null;
    return inizio + (n ? n - 1 : 0);
  }
  const w = /\b(1[0-9]{3})\b/.exec(s); if (w) return +w[1];
  if (/江戸末期|幕末|明治|大正|昭和/.test(s)) return 1850;
  return null;
}

// lettere e documenti d'archivio (non libri): «…書簡», «…書状», «…文書»
export const NON_LIBRARI_JA = /(書簡|書翰|書状|文書)(\s*[0-9０-９].*)?$/;

// scheda della ricerca -> voce compatta [nome, collezione, segnatura, anno (testo), autore] (null se fuori)
export function compattaKokusho(x) {
  if (!x || x.image !== "1" || x.kansha !== "写") return null;
  if (/^国会/.test(x.collection || "") || NON_LIBRARI_JA.test(x.name || "")) return null;   // National Diet Library: fonte «ndl»
  return [x.name || x.wname || null, x.collection || null, x.seikyu || null, x.year || null, x.authorhead || x.wauthor || null];
}

export async function scansionaKokusho({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {};
  if (soloCache) return st;
  const ora = Date.now();
  if (!st.cursore) {
    if (st.completato && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("kokusho", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} manoscritti`); return st; }
    st.cursore = { p: 1, g: (st.g || 0) + 1 };
  } else log("kokusho", `riprendo dalla pagina ${st.cursore.p}${st.pagine ? " di " + st.pagine : ""}`);
  const fine = ora + minuti * 60e3;
  for (;;) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (pagina ${st.cursore.p} di ${st.pagine || "?"}): riprenderà alla prossima esecuzione`); }
    const url = `${BASE}/api/biblioAdvanceSearch?kansha=copy&image=with&sort=bid&order=asc&page=${st.cursore.p}`;
    const r = await scarica(url, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const d = JSON.parse(r.testo), dati = d.data || [];
    st.totale = d.total || st.totale; st.pagine = d.last_page || st.pagine;
    for (const x of dati) { const v = compattaKokusho(x); if (v) { v.push(st.cursore.g); st.voci[x.bid] = v; } else delete st.voci[x.bid]; }
    st.aggiornato = new Date().toISOString();
    if (!dati.length || st.cursore.p >= (d.last_page || 0)) break;
    st.cursore.p++;
    if (st.cursore.p % 20 === 0) { salvaStato(st); log("kokusho", `pagina ${st.cursore.p} di ${st.pagine}, ${Object.keys(st.voci).length} manoscritti`); }
  }
  for (const [k, v] of Object.entries(st.voci)) if (v[5] !== st.cursore.g) delete st.voci[k];
  st.g = st.cursore.g; delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("kokusho", `fine: ${Object.keys(st.voci).length} manoscritti`);
  return st;
}

export function recordKokusho(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v && !NON_LIBRARI_JA.test(v[0] || "")).map(([bid, v]) => {
    const anno = annoKokusho(v[3]);
    return { fonte: "kokusho", id: "nijl-" + bid, citta: "Giappone", biblioteca: v[1] ? `${v[1]} (Kokusho Database, NIJL)` : "Kokusho Database (NIJL)",
      segnatura: v[2] || "bid " + bid, datazione: v[3] ? (anno && !/\b1[0-9]{3}\b/.test(v[3]) ? `${v[3]} (${anno})` : v[3]) : null, titolo: v[0],
      autori_fonte: v[4] ? [v[4].replace(/／/g, " ")] : [], descrizione: null, lingue: ["ja"],
      manifest: `${BASE}/biblio/${bid}/manifest`, pagina: `${BASE}/biblio/${bid}`, licenza: "condizioni del proprietario (kokusho.nijl.ac.jp/page/usage.html)" };
  });
}
