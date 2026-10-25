// Registro delle biblioteche (docs/BIBLIOTECHE.md): la parte «Agganciate» si rigenera a ogni esecuzione di raccogli.mjs,
// tra i segnaposto <!-- inizio automatico --> e <!-- fine automatico -->; il resto del documento è scritto a mano.
// Gli esiti delle raccolte vere (non quelle con --solo-costruisci) si conservano in data/raccolte.json.
import fs from "node:fs";
import path from "node:path";
import { CACHE } from "./rete.mjs";
import { daLeggere, segnaturaLeggibile } from "./fonti/vaticana.mjs";
import { NOMI_LINGUE } from "./lingue.mjs";
import { FONTI_HSP } from "./fonti/hsp.mjs";
import { ammessaYale } from "./fonti/yale.mjs";
import { motivoLeiden, contestoLeiden } from "./fonti/leiden.mjs";

export const FILE_REGISTRO = "docs/BIBLIOTECHE.md";
export const FILE_RACCOLTE = "data/raccolte.json";
export const INIZIO = "<!-- inizio automatico -->", FINE = "<!-- fine automatico -->";

// biblioteca, città e modo di aggiornamento di ogni fonte agganciata
export const BIBLIOTECHE = {
  heidelberg: { biblioteca: "Universitätsbibliothek Heidelberg", citta: "Heidelberg", come: "ogni notte, da sola" },
  ecodices: { biblioteca: "e-codices (biblioteche svizzere: San Gallo, Einsiedeln, Bodmer e altre)", citta: "Svizzera", come: "ogni notte, da sola" },
  bsb: { biblioteca: "Bayerische Staatsbibliothek", citta: "Monaco di Baviera", come: "ogni notte, da sola" },
  berlino: { biblioteca: "Staatsbibliothek zu Berlin", citta: "Berlino", come: "ogni notte, da sola" },
  bodleian: { biblioteca: "Bodleian Libraries e college", citta: "Oxford", come: "corsia propria: a ruota finché non sono letti tutti, poi ogni notte" },
  gallica: { biblioteca: "Bibliothèque nationale de France (Gallica)", citta: "Parigi", come: "va rifatta a mano dal browser" },
  laurenziana: { biblioteca: "Biblioteca Medicea Laurenziana", citta: "Firenze", come: "ogni notte, da sola" },
  leiden: { biblioteca: "Universiteitsbibliotheek Leiden (manoscritti, con i Vossiani; Bibliotheca Neerlandica Manuscripta)", citta: "Leida", come: "ogni notte, da sola" },
  // biblioteche lette dal Handschriftenportal (Wolfenbüttel, Bamberga, Karlsruhe, Stoccarda, Colonia, Lipsia)
  ...Object.fromEntries(Object.entries(FONTI_HSP).map(([f, h]) => [f, { biblioteca: `${h.nome} (dati dal Handschriftenportal)`, citta: h.citta, come: "ogni notte, da sola" }])),
  yale: { biblioteca: "Yale University Library (Beinecke e altre biblioteche di Yale)", citta: "New Haven (Stati Uniti)", come: "corsia propria: a ruota finché la prima lettura non è finita, poi ogni 6 giorni" },
  penn: { biblioteca: "University of Pennsylvania Libraries (Kislak Center, Schoenberg, CAJS)", citta: "Filadelfia (Stati Uniti)", come: "ogni notte, da sola" },
  ds: { biblioteca: "Digital Scriptorium (istituzioni statunitensi: Princeton, Columbia, Harvard, Huntington, Free Library e altre; dettaglio sotto la tabella)", citta: "Stati Uniti", come: "ogni notte, da sola (raccolta completa ogni 6 giorni)" },
  walters: { biblioteca: "The Walters Art Museum (manifesti IIIF scritti da Emendando)", citta: "Baltimora (Stati Uniti)", come: "ogni notte, da sola (elenco ogni 6 giorni)" },
  loc: { biblioteca: "Library of Congress: microfilm del Monastero di Santa Caterina del Sinai e dei Patriarcati greco-ortodosso e armeno di Gerusalemme", citta: "Sinai (Egitto) e Gerusalemme", come: "ogni notte, da sola (elenco completo ogni 6 giorni; manifesti scritti dal catalogo)" },
  cudl: { biblioteca: "Cambridge Digital Library (University Library e college)", citta: "Cambridge", come: "va fatta a mano dal browser (scripts/browser/cudl.js)" },
  nlg: { biblioteca: "Biblioteca Nazionale di Grecia", citta: "Atene", come: "ogni notte, da sola (elenco ogni 6 giorni; copie dei manifesti scritte dal catalogo)" },
  ndl: { biblioteca: "National Diet Library (国立国会図書館): manoscritti dei libri antichi giapponesi e cinesi", citta: "Tokyo (Giappone)", come: "corsia mondo, ogni notte (solo i record cambiati ogni 6 giorni, raccolta completa ogni 30)" },
  kokusho: { biblioteca: "Kokusho Database (国書データベース) del National Institute of Japanese Literature: manoscritti di biblioteche, templi e collezioni giapponesi", citta: "Giappone", come: "corsia mondo, ogni notte (raccolta completa ogni 14 giorni)" },
  auckland: { biblioteca: "Auckland Libraries, Sir George Grey Special Collections", citta: "Auckland (Nuova Zelanda)", come: "corsia mondo, ogni notte (raccolta completa ogni 6 giorni)" },
  vaticana: { biblioteca: "Biblioteca Apostolica Vaticana", citta: "Città del Vaticano", come: "corsia propria: a ruota, senza pause tra un'esecuzione e l'altra" },
};

const leggi = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
const giorno = t => (t ? new Date(t).toISOString().slice(0, 10) : null);
const num = n => Number(n || 0).toLocaleString("it-IT");
// tempo che manca, in parole semplici: ore fino a due giorni, poi giorni
export const durata = ore => (ore <= 48 ? `circa ${Math.max(1, Math.ceil(ore))} ${Math.ceil(ore) <= 1 ? "ora" : "ore"}` : `circa ${Math.ceil(ore / 24)} giorni`);
// ritmi delle corsie a ruota (circa 150 minuti di lavoro ogni 165 minuti circa): Vaticana un manifesto ogni 10 secondi,
// Yale una pagina OAI ogni 5 secondi circa, Bodleian un manifesto ogni 2,7 secondi circa
export const ORARI = { vaticana: 330, yale: 640, bodleian: 1200 };   // al netto delle pause tra un'esecuzione e l'altra, per ora

// avanzamento della lettura, in parole semplici, dagli stati delle raccolte
export const AVANZAMENTO = {
  heidelberg: (det = {}) => {
    const c = leggi(path.join(CACHE, "stato-heidelberg.json")), i = leggi("data/heidelberg-indici.json");
    // senza la cache delle raccolte OAI (corsie diverse dalla giornaliera) resta il testo precedente
    if (!c) return { testo: null };
    const parti = [];
    if (c && c.versione === 2) parti.push(c.completato ? `schede lette tutte (${num(c.voci.length)})` : `schede: ${num(c.pagine)} pagine lette, in corso`);
    else if (c) parti.push("raccolta da rifare con tutti i manoscritti (alla prossima notte)");
    if (i) parti.push(`indici ${num(Object.keys(i.voci || {}).length)}${det.candidati ? " su " + num(det.candidati) : ""}`);
    return { testo: parti.join("; ") || "schede lette ogni 6 giorni", data: (i && i.aggiornato) || (c && c.aggiornato) };
  },
  ecodices: () => oai("ecodices"),
  bsb: () => oai("bsb"),
  berlino: () => oai("berlino"),
  bodleian: () => {
    const s = leggi("data/bodleian.json"); if (!s) return { testo: "non ancora cominciata" };
    const letti = Object.keys(s.voci || {}).length, resto = Math.max(0, (s.totale_collezione || 0) - letti);
    return { testo: `${num(letti)} schede lette su ${num(s.totale_collezione)}${resto ? `; a riprese, a ruota: mancano ${durata(resto / ORARI.bodleian)}` : ""}`, data: s.aggiornato };
  },
  gallica: () => {
    const s = leggi("data/gallica.json"); if (!s) return { testo: "nessuna raccolta dal browser" };
    if (!s.record) return { testo: `solo i fondi latini (raccolta dal browser del ${giorno(s.raccolto)}): per avere tutti i manoscritti va lanciato scripts/browser/gallica.js`, data: s.raccolto };
    return { testo: `${num(s.schede_lette)} schede lette su ${num(s.totale)}${s.completa ? "" : " (raccolta non completa)"} (raccolta dal browser del ${giorno(s.raccolto)})`, data: s.raccolto };
  },
  laurenziana: () => {
    const s = leggi("data/laurenziana.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso: collezione ${s.cursore.collezione}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} codici)`, data: s.aggiornato };
  },
  leiden: () => {
    const s = leggi("data/leiden.json"); if (!s) return { testo: "non ancora cominciata" };
    // solo i manoscritti librari che passano il filtro (fuori schede BNM, lettere, archivi, carte dopo il 1800, parti doppie)
    const ctx = contestoLeiden(s.voci), tutte = Object.values(s.voci || {}), n = tutte.filter(v => motivoLeiden(v, ctx) == null).length;
    if (s.cursore != null) return { testo: `in corso: ${num(n)} codici su ${num(tutte.length)} schede lette (collezione ${(s.cursore.c ?? 0) + 1} di 2, pagina ${(s.cursore.p ?? 0) + 1})`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(tutte.length)}); ${num(n)} manoscritti librari fino al 1800`, data: s.aggiornato };
  },
  yale: () => {
    const s = leggi("data/yale.json"); if (!s) return { testo: "non ancora cominciata" };
    // solo i manoscritti librari che passano il filtro (fuori archivi, lettere, fotografie e carte dopo il 1800)
    const n = Object.values(s.voci || {}).filter(ammessaYale).length, pagine = Math.ceil((s.totale || 0) / 25);
    const pagina = Math.max(s.pagine || 0, s.sospeso ? +(/:(\d+)$/.exec(s.sospeso) || [0, 0])[1] / 25 : 0);
    if (s.coda && s.coda.length && !s.completato) {
      const ore = Math.max(0, pagine - pagina) / ORARI.yale;
      const fase = s.coda[0] ? `lingue antiche e medievali (insiemi rimasti: ${s.coda.length - 1}), poi tutti i record` : `tutti i record, ${num(pagina)} pagine su circa ${num(pagine)}`;
      return { testo: `prima lettura in corso: ${fase} (${num(n)} manoscritti finora); mancano ${durata(ore)}`, data: s.aggiornato };
    }
    if (s.coda && s.coda.length) return { testo: `aggiornamento in corso (${num(n)} manoscritti)`, data: s.aggiornato };
    return { testo: `record letti tutti (${num(n)} manoscritti); poi solo i record cambiati, ogni 6 giorni`, data: s.completato || s.aggiornato };
  },
  penn: () => {
    const s = leggi("data/penn.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso: forma ${(s.cursore.f ?? 0) + 1}, pagina ${s.cursore.p}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} manoscritti fino al 1800)`, data: s.aggiornato };
  },
  ds: () => {
    const s = leggi("data/ds.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length;
    if (s.cursore) return { testo: `in corso: ${s.cursore.fase}${s.cursore.fase === "elenco" ? ", pagina " + s.cursore.p : ""}`, data: s.aggiornato };
    return { testo: `schede con immagini lette tutte (${num(n)} con manifesto su ${num(s.totale)}); fuori i doppioni di Penn e Yale e i domini non verificati`, data: s.completato || s.aggiornato };
  },
  walters: () => {
    const s = leggi("data/walters.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), n = vs.length, imm = vs.flatMap(v => v.p || []), mis = imm.filter(x => x[4] !== 0).length;
    const ore = (imm.length - mis) * 15 / 3600, giorni = Math.ceil(ore);   // circa 15 secondi per misura, 60 minuti per notte
    const misure = `misure delle immagini: ${num(mis)} su ${num(imm.length)} vere${imm.length > mis ? `, le altre stimate dal tipo di pagina (mancano circa ${num(giorni)} notti)` : ""}`;
    // circa 100 secondi per codice (descrizione e una misura): circa 36 codici per notte
    if (n < (s.totale || 0)) return { testo: `in corso: ${num(n)} codici letti su ${num(s.totale)} (mancano circa ${num(Math.ceil((s.totale - n) / 36))} notti); ${misure}`, data: s.aggiornato };
    return { testo: `codici letti tutti (${num(n)}); ${misure}`, data: s.aggiornato };
  },
  loc: () => {
    const s = leggi("data/loc.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length, tot = Object.values(s.totali || {}).reduce((a, b) => a + b, 0);
    if (s.cursore) return { testo: `in corso: ${s.cursore.c ? "Gerusalemme" : "Sinai"}, pagina ${s.cursore.p}`, data: s.aggiornato };
    return { testo: `item letti tutti (${num(n)} codici su ${num(tot)} item delle due collezioni; fuori firmani, rotoli, cataloghi moderni)`, data: s.completato || s.aggiornato };
  },
  cudl: () => {
    const s = leggi("data/cudl.json"); if (!s) return { testo: "elenco non ancora raccolto: va lanciato scripts/browser/cudl.js dal browser" };
    return { testo: `${num(Object.keys(s.voci || {}).length)} schede raccolte dal browser il ${giorno(s.raccolto)}`, data: s.raccolto };
  },
  nlg: () => {
    const s = leggi("data/nlg.json"); if (!s) return { testo: "non ancora cominciata" };
    const v = Object.values(s.voci || {}), letti = v.filter(x => x.p).length, err = v.filter(x => x.x).length;
    return { testo: `${num(letti)} manifesti letti su ${num(v.length)} manoscritti${err ? `; ${num(err)} con il manifesto non leggibile` : ""}${letti + err < v.length ? "; gli altri alla prossima" : ""}`, data: s.aggiornato };
  },
  ndl: () => {
    const s = leggi("data/ndl.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length;
    if (s.cursore) return { testo: `in corso: ${num(s.letti)} record letti${s.cursore.completa && s.totale ? " su " + num(s.totale) : " (record cambiati)"}; ${num(n)} manoscritti finora`, data: s.aggiornato };
    return { testo: `record letti tutti (${num(s.totale)} libri antichi digitalizzati; ${num(n)} manoscritti fino al 1800 o senza data; fuori i libri a stampa)`, data: s.completato || s.aggiornato };
  },
  kokusho: () => {
    const s = leggi("data/kokusho.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length;
    if (s.cursore) return { testo: `in corso: pagina ${num(s.cursore.p)} di ${num(s.pagine)} (${num(n)} manoscritti finora)`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(s.totale)} manoscritti con immagini; ${num(n)} con immagini proprie fino al 1800 o senza data; fuori i libri a stampa e la NDL)`, data: s.completato || s.aggiornato };
  },
  auckland: () => {
    const s = leggi("data/auckland.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `oggetti letti tutti (${num(s.totale)}; ${num(Object.keys(s.voci || {}).length)} codici: medievali e orientali fino al 1800, fuori lettere e carte d'archivio)`, data: s.completato || s.aggiornato };
  },
  ...Object.fromEntries(Object.keys(FONTI_HSP).map(f => [f, () => { const a = aRiprese(`data/${f}.json`, 1); return { ...a, testo: a.testo.replace("schede lette tutte", "codici digitalizzati letti tutti") }; }])),
  vaticana: () => {
    const s = leggi("data/vaticana.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length;
    if (!s.elenco || !s.elenco.totale) return { testo: `${num(n)} codici letti; elenco dei codici digitalizzati non ancora scaricato`, data: s.aggiornato };
    const g = stimaVaticana(s);
    if (!g.manifesti) return { testo: `codici digitalizzati letti tutti (${num(n)} su ${num(s.elenco.totale)})`, data: s.aggiornato };
    return { testo: `${num(n)} codici letti su ${num(s.elenco.totale)} digitalizzati; ${g.fondo ? "fondo in corso: " + segnaturaLeggibile(g.fondo + ".").trim() + "; " : ""}` +
      `restano circa ${num(g.manifesti)} manifesti da leggere, cioè ${durata(g.ore)} (un manifesto ogni 10 secondi, come chiede la biblioteca)`, data: s.aggiornato };
  },
};

// Vaticana: codici digitalizzati ancora da leggere (dall'elenco della biblioteca) e tempo che serve, a circa 330 manifesti
// all'ora (corsia propria a ruota: circa 7900 al giorno)
export function stimaVaticana(s) {
  const d = daLeggere(s), p = d.segnature[0];
  return { manifesti: d.totale, ore: d.totale / ORARI.vaticana, giorni: Math.ceil(d.totale / ORARI.vaticana / 24), fondo: p ? Object.keys(s.elenco.fondi).filter(f => p.startsWith(f + ".")).sort((a, b) => b.length - a.length)[0] : null };
}

// fonti lette a pagine con stato in data/<fonte>.json: { totale, cursore (pagina), completato, voci }
function aRiprese(file, perPagina) {
  const s = leggi(file); if (!s) return { testo: "non ancora cominciata" };
  const n = Object.keys(s.voci || {}).length;
  if (s.cursore != null) return { testo: `in corso: ${num(Math.min(s.cursore * perPagina, s.totale || 0) || n)} schede lette su ${num(s.totale)}`, data: s.aggiornato };
  return { testo: `schede lette tutte (${num(n)} su ${num(s.totale)})`, data: s.aggiornato };
}

function oai(fonte) {
  const c = leggi(path.join(CACHE, `stato-${fonte}.json`));
  // senza la cache delle raccolte OAI (corsie diverse dalla giornaliera) resta il testo precedente
  if (!c) return { testo: null };
  if (c.versione !== 2) return { testo: "raccolta da rifare con tutti i manoscritti (alla prossima notte)", data: c.aggiornato };
  return { testo: c.completato ? `schede lette tutte (${num(c.voci.length)} schede)` : `in corso: ${num(c.pagine)} pagine lette`, data: c.aggiornato };
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

// lingue di una fonte: le tre più frequenti, con il numero di codici
function lingueTesto(lf = {}) {
  const arr = Object.entries(lf).sort((a, b) => b[1] - a[1]);
  if (!arr.length) return "—";
  const nome = k => (k === "?" ? "non indicata" : NOMI_LINGUE[k] || k);
  const testa = arr.slice(0, 3).map(([k, n]) => `${nome(k)} ${num(n)}`).join(", ");
  return arr.length > 3 ? `${testa}, altre ${num(arr.slice(3).reduce((x, y) => x + y[1], 0))}` : testa;
}

// tabella delle fonti agganciate (testo tra i segnaposto)
// celle della tabella già scritta, per biblioteca (per tenere l'avanzamento quando lo stato non è disponibile)
export function righePrecedenti(doc = "") {
  const m = {};
  for (const r of doc.split("\n")) if (/^Digital Scriptorium, codici per istituzione/.test(r)) m.__ds = r;
  for (const r of doc.split("\n")) if (/^\| /.test(r) && !/^\| (Biblioteca|---)/.test(r)) { const c = r.split(" | "); c[0] = c[0].replace(/^\| /, ""); m[c[0]] = c; }
  return m;
}

export function tabella({ fonti, conteggio = {}, conAutori = {}, lingue = {}, dettagli = {}, precedenti = {} } = {}) {
  const r = leggi(FILE_RACCOLTE) || {};
  const righe = [
    "| Biblioteca | Città | Codici totali | Di cui con autori riconosciuti | Lingue | Avanzamento della lettura | Come si aggiorna | Ultimo aggiornamento | Ultima raccolta |",
    "|---|---|---|---|---|---|---|---|---|",
  ];
  let tot = 0, totA = 0;
  for (const f of fonti) {
    const b = BIBLIOTECHE[f] || { biblioteca: f, citta: "", come: "ogni notte, da sola" };
    const a = (AVANZAMENTO[f] || (() => ({ testo: "" })))(dettagli[f] || {});
    if (a.testo == null) a.testo = (precedenti[b.biblioteca] || [])[5] || "schede lette ogni 6 giorni";
    let come = b.come;
    if (f === "gallica") { const g = leggi("data/gallica.json"); if (g) come += ` (ultima raccolta: ${giorno(g.raccolto)})`; }
    const e = r[f];
    const data = giorno((e && e.ultimo_ok) || a.data) || "—";
    tot += conteggio[f] || 0; totA += conAutori[f] || 0;
    righe.push(`| ${b.biblioteca} | ${b.citta} | ${num(conteggio[f])} | ${num(conAutori[f])} | ${lingueTesto(lingue[f])} | ${a.testo} | ${come} | ${data} | ${esitoLeggibile(e)} |`);
  }
  const dopo = [];
  const ds = dettagli.ds && dettagli.ds.perIstituzione;
  if (ds && Object.keys(ds).length) {
    const sc = dettagli.ds.scarti || {};
    dopo.push("", `Digital Scriptorium, codici per istituzione: ${Object.entries(ds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${num(n)}`).join("; ")}` +
      `${sc.doppioni ? `. Lasciati alle fonti Penn e Yale (doppioni): ${num(sc.doppioni)}` : ""}${sc.dominio ? `. Fuori per manifesto non raggiungibile o da verificare: ${num(sc.dominio)}` : ""}.`);
  } else if (precedenti.__ds) dopo.push("", precedenti.__ds);
  return [`Codici nel catalogo, in tutto: **${num(tot)}**, di cui **${num(totA)}** con almeno un autore riconosciuto.`, "", ...righe, ...dopo].join("\n");
}

export function scriviRegistro(opz) {
  let doc = ""; try { doc = fs.readFileSync(FILE_REGISTRO, "utf8"); } catch (e) {}
  if (!doc.includes(INIZIO) || !doc.includes(FINE)) doc = `# Biblioteche del catalogo\n\n## Agganciate\n\n${INIZIO}\n${FINE}\n` + (doc ? "\n" + doc : "");
  const vecchia = doc.slice(doc.indexOf(INIZIO), doc.indexOf(FINE));
  const nuovo = doc.slice(0, doc.indexOf(INIZIO) + INIZIO.length) + "\n" + tabella({ ...opz, precedenti: righePrecedenti(vecchia) }) + "\n" + doc.slice(doc.indexOf(FINE));
  if (nuovo !== doc) { fs.mkdirSync(path.dirname(FILE_REGISTRO), { recursive: true }); fs.writeFileSync(FILE_REGISTRO, nuovo); return true; }
  return false;
}
