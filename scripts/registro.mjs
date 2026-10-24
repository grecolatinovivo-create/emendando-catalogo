// Registro delle biblioteche (docs/BIBLIOTECHE.md): la parte «Agganciate» si rigenera a ogni esecuzione di raccogli.mjs,
// tra i segnaposto <!-- inizio automatico --> e <!-- fine automatico -->; il resto del documento è scritto a mano.
// Gli esiti delle raccolte vere (non quelle con --solo-costruisci) si conservano in data/raccolte.json.
import fs from "node:fs";
import path from "node:path";
import { CACHE } from "./rete.mjs";
import { PERCORSO, segnaturaLeggibile } from "./fonti/vaticana.mjs";

export const FILE_REGISTRO = "docs/BIBLIOTECHE.md";
export const FILE_RACCOLTE = "data/raccolte.json";
export const INIZIO = "<!-- inizio automatico -->", FINE = "<!-- fine automatico -->";

// biblioteca, città e modo di aggiornamento di ogni fonte agganciata
export const BIBLIOTECHE = {
  heidelberg: { biblioteca: "Universitätsbibliothek Heidelberg", citta: "Heidelberg", come: "ogni notte, da sola" },
  ecodices: { biblioteca: "e-codices (biblioteche svizzere: San Gallo, Einsiedeln, Bodmer e altre)", citta: "Svizzera", come: "ogni notte, da sola" },
  bsb: { biblioteca: "Bayerische Staatsbibliothek", citta: "Monaco di Baviera", come: "ogni notte, da sola" },
  berlino: { biblioteca: "Staatsbibliothek zu Berlin", citta: "Berlino", come: "ogni notte, da sola" },
  bodleian: { biblioteca: "Bodleian Libraries e college", citta: "Oxford", come: "ogni notte, da sola" },
  gallica: { biblioteca: "Bibliothèque nationale de France (Gallica)", citta: "Parigi", come: "va rifatta a mano dal browser" },
  laurenziana: { biblioteca: "Biblioteca Medicea Laurenziana", citta: "Firenze", come: "ogni notte, da sola" },
  leiden: { biblioteca: "Universiteitsbibliotheek Leiden (Western Medieval Manuscripts, con i Vossiani latini)", citta: "Leida", come: "ogni notte, da sola" },
  wolfenbuettel: { biblioteca: "Herzog August Bibliothek (dati dal Handschriftenportal)", citta: "Wolfenbüttel", come: "ogni notte, da sola" },
  vaticana: { biblioteca: "Biblioteca Apostolica Vaticana", citta: "Città del Vaticano", come: "ogni 3 ore, da sola" },
};

const leggi = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
const giorno = t => (t ? new Date(t).toISOString().slice(0, 10) : null);
const num = n => Number(n || 0).toLocaleString("it-IT");

// avanzamento della lettura, in parole semplici, dagli stati delle raccolte
export const AVANZAMENTO = {
  heidelberg: (det = {}) => {
    const c = leggi(path.join(CACHE, "stato-heidelberg.json")), i = leggi("data/heidelberg-indici.json");
    const parti = [];
    if (c) parti.push(c.completato ? `schede lette tutte (${num(c.voci.length)})` : `schede: ${num(c.pagine)} pagine lette, in corso`);
    if (i) parti.push(`indici ${num(Object.keys(i.voci || {}).length)}${det.candidati ? " su " + num(det.candidati) : ""}`);
    return { testo: parti.join("; ") || "schede lette ogni 6 giorni", data: (i && i.aggiornato) || (c && c.aggiornato) };
  },
  ecodices: () => oai("ecodices"),
  bsb: () => oai("bsb"),
  berlino: () => oai("berlino"),
  bodleian: () => {
    const s = leggi("data/bodleian.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `${num(Object.keys(s.voci || {}).length)} schede lette su ${num(s.totale_collezione)}`, data: s.aggiornato };
  },
  gallica: () => {
    const s = leggi("data/gallica.json"); if (!s) return { testo: "nessuna raccolta dal browser" };
    return { testo: `${num(s.schede_lette)} schede lette (raccolta dal browser del ${giorno(s.raccolto)})`, data: s.raccolto };
  },
  laurenziana: () => {
    const s = leggi("data/laurenziana.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso: collezione ${s.cursore.collezione}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} codici)`, data: s.aggiornato };
  },
  leiden: () => aRiprese("data/leiden.json", 20),
  wolfenbuettel: () => { const a = aRiprese("data/wolfenbuettel.json", 1); return { ...a, testo: a.testo.replace("schede lette tutte", "codici digitalizzati letti tutti") }; },
  vaticana: () => {
    const s = leggi("data/vaticana.json"); if (!s) return { testo: "non ancora cominciata" };
    const t = PERCORSO[s.passo] || PERCORSO[0];
    return { testo: `${num(s.visti)} schede viste; fondo in corso: ${segnaturaLeggibile(t[0] + ".").trim()} (dal n. ${s.prossimo ?? t[1]}), tratto ${(s.passo || 0) + 1} di ${PERCORSO.length}`, data: s.aggiornato };
  },
};

// fonti lette a pagine con stato in data/<fonte>.json: { totale, cursore (pagina), completato, voci }
function aRiprese(file, perPagina) {
  const s = leggi(file); if (!s) return { testo: "non ancora cominciata" };
  const n = Object.keys(s.voci || {}).length;
  if (s.cursore != null) return { testo: `in corso: ${num(Math.min(s.cursore * perPagina, s.totale || 0) || n)} schede lette su ${num(s.totale)}`, data: s.aggiornato };
  return { testo: `schede lette tutte (${num(n)} su ${num(s.totale)})`, data: s.aggiornato };
}

function oai(fonte) {
  const c = leggi(path.join(CACHE, `stato-${fonte}.json`));
  if (!c) return { testo: "schede lette tutte ogni 6 giorni" };
  return { testo: c.completato ? `schede lette tutte (${num(c.voci.length)} manoscritti latini)` : `in corso: ${num(c.pagine)} pagine lette`, data: c.aggiornato };
}

// esiti delle raccolte vere: { fonte: { quando, esito, ultimo_ok } }
export function registraEsiti(esito) {
  const r = leggi(FILE_RACCOLTE) || {};
  const ora = new Date().toISOString();
  for (const [f, e] of Object.entries(esito)) {
    if (e === "precedente") continue;
    r[f] = { quando: ora, esito: e, ultimo_ok: e === "ok" ? ora : (r[f] && r[f].ultimo_ok) || null };
  }
  fs.mkdirSync(path.dirname(FILE_RACCOLTE), { recursive: true });
  fs.writeFileSync(FILE_RACCOLTE, JSON.stringify(Object.fromEntries(Object.entries(r).sort()), null, 1) + "\n");
  return r;
}

// esito in parole semplici
export function esitoLeggibile(e) {
  if (!e) return "—";
  if (e.esito === "ok") return "riuscita";
  if (/incomplet|riprender/i.test(e.esito)) return "in corso, riprende alla prossima";
  if (/tempo complessivo esaurito/.test(e.esito)) return "rimandata alla prossima";
  return "non riuscita: " + e.esito.replace(/^errore:\s*/, "").slice(0, 120);
}

// tabella delle fonti agganciate (testo tra i segnaposto)
export function tabella({ fonti, conteggio = {}, dettagli = {} } = {}) {
  const r = leggi(FILE_RACCOLTE) || {};
  const righe = [
    "| Biblioteca | Città | Codici nel catalogo | Avanzamento della lettura | Come si aggiorna | Ultimo aggiornamento | Ultima raccolta |",
    "|---|---|---|---|---|---|---|",
  ];
  let tot = 0;
  for (const f of fonti) {
    const b = BIBLIOTECHE[f] || { biblioteca: f, citta: "", come: "ogni notte, da sola" };
    const a = (AVANZAMENTO[f] || (() => ({ testo: "" })))(dettagli[f] || {});
    const testo = a.testo;
    let come = b.come;
    if (f === "gallica") { const g = leggi("data/gallica.json"); if (g) come += ` (ultima raccolta: ${giorno(g.raccolto)})`; }
    const e = r[f];
    const data = giorno((e && e.ultimo_ok) || a.data) || "—";
    tot += conteggio[f] || 0;
    righe.push(`| ${b.biblioteca} | ${b.citta} | ${num(conteggio[f])} | ${testo} | ${come} | ${data} | ${esitoLeggibile(e)} |`);
  }
  return [`Codici nel catalogo, in tutto: **${num(tot)}**.`, "", ...righe].join("\n");
}

export function scriviRegistro(opz) {
  let doc = ""; try { doc = fs.readFileSync(FILE_REGISTRO, "utf8"); } catch (e) {}
  if (!doc.includes(INIZIO) || !doc.includes(FINE)) doc = `# Biblioteche del catalogo\n\n## Agganciate\n\n${INIZIO}\n${FINE}\n` + (doc ? "\n" + doc : "");
  const nuovo = doc.slice(0, doc.indexOf(INIZIO) + INIZIO.length) + "\n" + tabella(opz) + "\n" + doc.slice(doc.indexOf(FINE));
  if (nuovo !== doc) { fs.mkdirSync(path.dirname(FILE_REGISTRO), { recursive: true }); fs.writeFileSync(FILE_REGISTRO, nuovo); return true; }
  return false;
}
