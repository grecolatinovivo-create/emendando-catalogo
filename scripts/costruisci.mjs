// Scrittura del catalogo, diviso per fonte perché regga decine o centinaia di migliaia di voci:
//
//   data/catalogo/indice.json            elenco dei pezzi, biblioteche, lingue, categorie e autori con i conteggi (leggero: si legge per primo)
//   data/catalogo/indice/<fonte>-<n>.json  indice leggero, una riga per codice (vedi CAMPI), al massimo RIGHE_INDICE righe per pezzo
//   data/catalogo/voci/<fonte>-<n>.json    voci complete; il pezzo di un codice si ricava dal suo id: n = fnv1a(id) % pezzi della fonte
//   data/manoscritti.json                  compatibilità con i lettori del formato 1: solo i codici con autori classici (latini o greci)
//
// Gli id dei codici non cambiano mai (i link condivisi, per esempio confronto-codici.html#c=hd-cpl894,bav-pal-lat-1615, devono funzionare).
// Un file si riscrive solo se il contenuto cambia; i pezzi che non servono più si cancellano.
import fs from "node:fs";
import path from "node:path";
import { NOMI_LINGUE } from "./lingue.mjs";

export const DIR = "data/catalogo";
export const COMPAT = "data/manoscritti.json";
export const VOCI_PER_PEZZO = 800, RIGHE_INDICE = 20000;
export const CAMPI = ["id", "segnatura", "biblioteca", "lingue", "secolo_da", "secolo_a", "autori", "titolo", "opere", "truculentus", "lingua_dedotta"];
export const CATEGORIE = { "classico-latino": "classici latini", "classico-greco": "classici greci", cristiano: "autori cristiani", medievale: "autori medievali" };

// FNV-1a a 32 bit sulle unità UTF-16 dell'id: la stessa funzione è in public/assets/catalogo-dati.js del sito
export function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export const pezzoDi = (id, pezzi) => fnv1a(id) % pezzi;
export const nomeBib = m => [m.biblioteca, m.citta && !(m.biblioteca || "").includes(m.citta) ? m.citta : null].filter(Boolean).join(", ") || "Biblioteca non indicata";
const naturale = (a, b) => String(a).localeCompare(String(b), "it", { numeric: true, sensitivity: "base" });
const breve = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

// voce del catalogo -> riga dell'indice
export function riga(v, bib) {
  return [v.id, v.segnatura, bib, (v.lingue || []).join(","), v.secolo ? v.secolo[0] : 0, v.secolo ? v.secolo[1] : 0,
    v.autori.map(a => a.id).join(","), breve(v.titolo, 140), breve([...new Set(v.autori.flatMap(a => a.opere))].join(", "), 120), v.truculentus || "", v.lingua_dedotta ? 1 : 0];
}

// json con una voce (o riga) per riga: diff leggibili nei commit
const righe = (testa, chiave, arr) => JSON.stringify(testa).slice(0, -1) + (Object.keys(testa).length ? "," : "") + JSON.stringify(chiave) + ":[\n" + arr.map(x => JSON.stringify(x)).join(",\n") + "\n]}\n";

function scriviSeCambia(file, testo, stat) {
  let prima = null; try { prima = fs.readFileSync(file, "utf8"); } catch (e) {}
  stat.kb += Buffer.byteLength(testo) / 1024; stat.file++;
  stat.scritti.add(path.resolve(file));
  if (prima === testo) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", testo); fs.renameSync(file + ".tmp", file);
  stat.cambiati++;
  return true;
}

/* manoscritti: voci del catalogo (già ordinate); opz: { fonti: [ordine], nomi: {fonte: nome}, esito: {fonte: esito}, autori: AUTORI }
   restituisce { conteggio, conAutori, lingue (per fonte), cambiato, kb, file } */
export function scriviCatalogo(manoscritti, { fonti, nomi = {}, esito = {}, autori = [], dir = DIR, compat: fileCompat = COMPAT } = {}) {
  const DIR = dir, COMPAT = fileCompat;
  const stat = { kb: 0, file: 0, cambiati: 0, scritti: new Set() };
  const perFonte = {};
  for (const v of manoscritti) (perFonte[v.fonte] = perFonte[v.fonte] || []).push(v);
  const ordine = [...new Set([...(fonti || []), ...Object.keys(perFonte)])].filter(f => perFonte[f]);
  const biblioteche = [], bibIdx = new Map();
  const idxBib = v => { const n = nomeBib(v); if (!bibIdx.has(n)) { bibIdx.set(n, biblioteche.length); biblioteche.push(n); } return bibIdx.get(n); };
  // biblioteche in ordine alfabetico (indici stabili tra una raccolta e l'altra se non cambiano i nomi)
  for (const n of [...new Set(manoscritti.map(nomeBib))].sort(naturale)) { bibIdx.set(n, biblioteche.length); biblioteche.push(n); }
  const conteggio = {}, conAutori = {}, lingueFonte = {}, pezzi = [], infoFonti = {};
  const lingue = {}, categorie = {}, contaAutori = {};
  for (const f of ordine) {
    const vs = perFonte[f];
    conteggio[f] = vs.length; conAutori[f] = vs.filter(v => v.autori.length).length;
    const lf = {}; for (const v of vs) { for (const l of v.lingue.length ? v.lingue : ["?"]) lf[l] = (lf[l] || 0) + 1; }
    lingueFonte[f] = lf;
    // indice leggero
    const file = [];
    for (let i = 0, k = 0; i < vs.length; i += RIGHE_INDICE, k++) {
      const nome = `indice/${f}-${k}.json`;
      scriviSeCambia(path.join(DIR, nome), righe({}, "righe", vs.slice(i, i + RIGHE_INDICE).map(v => riga(v, idxBib(v)))), stat);
      file.push(nome); pezzi.push({ file: nome, fonte: f, righe: Math.min(RIGHE_INDICE, vs.length - i) });
    }
    // voci complete, divise per hash dell'id
    const nPezzi = Math.max(1, Math.ceil(vs.length / VOCI_PER_PEZZO));
    const gruppi = Array.from({ length: nPezzi }, () => []);
    for (const v of vs) gruppi[pezzoDi(v.id, nPezzi)].push(v);
    gruppi.forEach((g, k) => scriviSeCambia(path.join(DIR, `voci/${f}-${k}.json`), righe({ fonte: f, pezzo: k, pezzi: nPezzi }, "manoscritti", g), stat));
    const prefissi = [...new Set(vs.map(v => v.id.replace(/-.*$/, "-")))];
    infoFonti[f] = { nome: nomi[f] || f, codici: vs.length, con_autori: conAutori[f], lingue: lf, esito: esito[f] || null, prefissi, pezzi_voci: nPezzi, indice: file };
    for (const v of vs) {
      for (const l of v.lingue.length ? v.lingue : ["?"]) lingue[l] = (lingue[l] || 0) + 1;
      for (const c of new Set(v.autori.map(a => a.categoria))) categorie[c] = (categorie[c] || 0) + 1;
      for (const a of v.autori) contaAutori[a.id] = (contaAutori[a.id] || 0) + 1;
    }
  }
  const nomiAutori = Object.fromEntries(autori.filter(a => contaAutori[a.id]).map(a => [a.id, { nome: a.nome, latino: a.latino, categoria: a.categoria, codici: contaAutori[a.id] }]));
  const indice = {
    versione: 2, aggiornato: null, totale: manoscritti.length, con_autori: manoscritti.filter(v => v.autori.length).length,
    nota: "Catalogo aperto dei manoscritti digitalizzati (IIIF) delle biblioteche agganciate, di ogni lingua ed epoca. Le righe dell'indice seguono «campi»; " +
      "«biblioteca» è la posizione in «biblioteche»; «lingue» sono codici (vedi «lingue»), dichiarati dalla fonte oppure dedotti da fondo, segnatura o titolo quando «lingua_dedotta» è 1; il pezzo delle voci complete di un codice è fnv1a(id) % pezzi_voci della sua fonte " +
      "(data/catalogo/voci/<fonte>-<pezzo>.json); la fonte di un id si riconosce dal prefisso.",
    campi: CAMPI, hash: "fnv1a-32",
    lingue: Object.fromEntries(Object.entries(lingue).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, { nome: k === "?" ? "lingua non indicata" : NOMI_LINGUE[k] || k, codici: n }])),
    categorie: Object.fromEntries(Object.entries(CATEGORIE).map(([k, nome]) => [k, { nome, codici: categorie[k] || 0 }])),
    autori: nomiAutori, biblioteche, fonti: infoFonti, pezzi,
  };
  // l'indice si riscrive (con la data) solo se cambia qualcosa
  const fileIndice = path.join(DIR, "indice.json");
  let vecchio = null; try { vecchio = JSON.parse(fs.readFileSync(fileIndice, "utf8")); } catch (e) {}
  const senzaData = d => JSON.stringify({ ...d, aggiornato: null, fonti: Object.fromEntries(Object.entries(d.fonti || {}).map(([k, v]) => [k, { ...v, esito: null }])) });
  const cambiato = stat.cambiati > 0 || !vecchio || senzaData(vecchio) !== senzaData(indice);
  indice.aggiornato = cambiato ? new Date().toISOString() : vecchio.aggiornato;
  if (!cambiato) indice.fonti = Object.fromEntries(Object.entries(indice.fonti).map(([k, v]) => [k, { ...v, esito: (vecchio.fonti[k] || {}).esito ?? v.esito }]));
  scriviSeCambia(fileIndice, JSON.stringify(indice, null, 1) + "\n", stat);
  // compatibilità (formato 1): solo i codici con autori classici, latini o greci, e quelli del Truculentus
  const classici = manoscritti.filter(v => v.truculentus || v.autori.some(a => a.categoria === "classico-latino" || a.categoria === "classico-greco"));
  const compat = { aggiornato: indice.aggiornato, nota: "Formato 1, per compatibilità: solo i codici con autori classici. Il catalogo completo è in data/catalogo/ (indice.json).",
    fonti: Object.fromEntries(ordine.map(f => [f, { nome: nomi[f] || f, codici: classici.filter(v => v.fonte === f).length, esito: esito[f] || null }])), totale: classici.length, manoscritti: classici };
  let vc = null; try { vc = JSON.parse(fs.readFileSync(COMPAT, "utf8")); } catch (e) {}
  if (!vc || senzaData(vc) !== senzaData(compat)) { compat.aggiornato = indice.aggiornato; scriviSeCambia(COMPAT, JSON.stringify(compat, null, 1) + "\n", stat); }
  // pezzi che non servono più
  for (const sotto of ["indice", "voci"]) {
    let nomiFile = []; try { nomiFile = fs.readdirSync(path.join(DIR, sotto)); } catch (e) {}
    for (const n of nomiFile) { const f = path.resolve(DIR, sotto, n); if (n.endsWith(".json") && !stat.scritti.has(f)) { fs.unlinkSync(f); stat.cambiati++; } }
  }
  return { conteggio, conAutori, lingue: lingueFonte, cambiato: stat.cambiati > 0, kb: Math.round(stat.kb), file: stat.file };
}

// voci del catalogo precedente (per le fonti che in questa esecuzione non rispondono): formato 2 se c'è, altrimenti data/manoscritti.json (formato 1)
export function catalogoPrecedente(DIR_ = DIR, COMPAT_ = COMPAT) {
  const DIR = DIR_, COMPAT = COMPAT_;
  const out = [];
  let ind = null; try { ind = JSON.parse(fs.readFileSync(path.join(DIR, "indice.json"), "utf8")); } catch (e) {}
  if (ind && ind.fonti) {
    for (const [f, info] of Object.entries(ind.fonti)) for (let k = 0; k < (info.pezzi_voci || 0); k++) {
      try { out.push(...JSON.parse(fs.readFileSync(path.join(DIR, `voci/${f}-${k}.json`), "utf8")).manoscritti); } catch (e) {}
    }
    return out;
  }
  let c = null; try { c = JSON.parse(fs.readFileSync(COMPAT, "utf8")); } catch (e) {}
  return ((c && c.manoscritti) || []).map(v => ({ ...v, lingue: v.lingue || [], secolo: v.secolo || null, autori: (v.autori || []).map(a => ({ categoria: "classico-latino", ...a })) }));
}
