#!/usr/bin/env node
// Ruota delle corsie «fino a lettura completa» (mondo, usa, italia, giornaliera): decide se la corsia deve ripartire subito.
// Nessuna richiesta in rete: legge solo gli stati delle raccolte in data/<fonte>.json.
// Uso (nel workflow comune .github/workflows/corsia.yml):
//   node scripts/ruota.mjs --fonti=ndl,kokusho,auckland > prima.json          (prima della raccolta: impronte degli stati)
//   node scripts/ruota.mjs --fonti=ndl,kokusho,auckland --prima=prima.json    (dopo: stampa «riparti» oppure «ferma»)
// Una fonte è «incompleta» finché la sua PRIMA lettura completa non è finita (regole sotto); le fonti senza regola
// (raccolte OAI in cache, dati dal browser, fonti già a ruota nelle loro corsie) contano come finite.
// Riparte solo se almeno una fonte è ancora incompleta E almeno una fonte incompleta ha fatto progressi in questo giro
// (lo stato è cambiato, a parte la data «aggiornato»): una fonte in errore non fa girare la corsia all'infinito.
import fs from "node:fs";
import crypto from "node:crypto";
import { daControllareNdl } from "./fonti/ndl.mjs";

const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const FONTI = String(arg.fonti || "").split(",").filter(Boolean);

const leggi = f => { try { return JSON.parse(fs.readFileSync(`data/${f}.json`, "utf8")); } catch (e) { return null; } };
const quante = o => Object.keys((o && o.voci) || {}).length;

// true = prima lettura completa non ancora finita; null = fonte senza regola (conta come finita)
export const INCOMPLETA = {
  // raccolte a riprese con il segnaposto «completato» (azzerato quando si rifà la lettura da capo)
  ...Object.fromEntries(["kokusho", "penn", "loc", "auckland", "toronto", "ds", "montecassino", "casanatense", "bub", "laurenziana", "leiden",
    "wolfenbuettel", "bamberga", "karlsruhe", "stoccarda", "colonia", "lipsia", "francoforte", "dresda", "tubinga",
    "handrit", "polona", "manuscriptorium", "onb", "kbdk", "uva",
    "wellcome", "bl", "isos", "manchester", "cudl", "cbl", "parker", "nlw", "mdc", "ub", "realbiblioteca", "ucm", "sevilla", "pergamos", "auc", "northwestern", "archive", "nbkm", "libfond", "getty", "bms", "stampe", "papiri", "epigrafi", "musei", "giappone"].map(f => [f, s => !s || !s.completato]),
  ),
  // National Diet Library: lettura finita e manifesti di tutte le voci controllati (m = «ok» o «ng»; scripts/fonti/ndl.mjs)
  ndl: s => !s || !s.completato || daControllareNdl(s).length > 0,
  // Berlino, manoscritti non europei: lettura OAI finita (nessun token in sospeso)
  // National Library of Israel: elenco finito (nessuna fase di ricerca in sospeso)
  nli: s => !s || !s.completato || !!s.fase,   // «completato» resta vuoto finché non sono letti gli inizi dei manifesti dei candidati
  sbbor: s => !s || !s.completato || !!s.token,
  // Ambrosiana: elenco letto e nessuna scheda ancora da leggere (le schede che non si aprono restano segnate con «x»)
  ambrosiana: s => !s || !s.elenco || s.cursore != null || Object.values(s.voci || {}).some(v => v && !v.u && !v.x),
  // Walters: tutti i codici dell'elenco letti (le misure delle immagini continuano poi ogni notte)
  walters: s => !s || !s.elenco_letto || quante(s) < (s.totale || 1),
  // Darmstadt (Handschriftenportal): elenco finito e letti i manifesti di tutti i codici (pagine per le copie dei manifesti)
  darmstadt: s => !s || !s.completato || Object.values(s.voci || {}).some(v => v && v.x == null),
  // Biblioteca Nazionale di Grecia: elenco finito (i manifesti che non si leggono si riprovano al prossimo elenco)
  nlg: s => !s || !s.elenco || !!s.token,
  // Monastero di Rousanou: elenco letto e nessun manifesto ancora da leggere (quelli che non si aprono restano segnati con «x»)
  rousanou: s => !s || !s.elenco || Object.values(s.voci || {}).some(v => v && !v.n && !v.x),
  // Real Academia de la Historia: elenco OAI finito e misure delle immagini prese (quelle che non si leggono restano segnate con «x»)
  rah: s => !s || !s.elenco || !!s.token || Object.values(s.voci || {}).some(v => v && !v.w && !v.x),
  // corsia asia: CrossAsia e Berlino (lettura a riprese con il cursore), Fondazione del Nôm (schede di tutti i volumi e pagine dei manoscritti)
  crossasia: s => !s || !s.completato || s.cursore != null,
  sbbasia: s => !s || !s.completato || s.cursore != null,
  nomfoundation: s => !s || !s.elenco || Object.values(s.voci || {}).some(v => v && !v.x && (!v.cod || (/chép tay|viết tay|manuscript|hand-?written|hand ?copied|bản thảo/i.test(v.pt || "") && v.img && !v.n))),
  // Malatestiana: schede e visore di tutti i codici dell'elenco letti
  malatestiana: s => !s || !s.completato,
  // corsia nord (dal 27 ottobre 2026): Nasjonalbiblioteket (elenchi e schede MODS delle carte), manuscripta.se, Bibliothèque nationale du Luxembourg
  nb: s => !s || !s.completato || !!s.cursore,
  manuscripta: s => !s || !s.completato,
  bnl: s => !s || !s.completato,
  // corsia «centro» (dal 27 ottobre 2026): Graz e Salisburgo (manifesti a riprese), ELTE Budapest
  vlaustria: s => !s || !s.completato,
  elte: s => !s || !s.completato,
  // corsia «medioriente» (dal 27 ottobre 2026): Iraqi Jewish Archive
  ija: s => !s || !s.completato,
};

function impronta(f) {
  let testo; try { testo = fs.readFileSync(`data/${f}.json`, "utf8"); } catch (e) { return null; }
  let s; try { s = JSON.parse(testo); } catch (e) { return crypto.createHash("sha1").update(testo).digest("hex"); }
  delete s.aggiornato;
  return crypto.createHash("sha1").update(JSON.stringify(s)).digest("hex");
}

const ora = {};
for (const f of FONTI) {
  const regola = INCOMPLETA[f];
  if (!regola) continue;
  ora[f] = { incompleta: !!regola(leggi(f)), impronta: impronta(f) };
}

if (!arg.prima) { process.stdout.write(JSON.stringify(ora) + "\n"); process.exit(0); }

let prima = {}; try { prima = JSON.parse(fs.readFileSync(arg.prima, "utf8")); } catch (e) {}
const incomplete = Object.keys(ora).filter(f => ora[f].incompleta);
// progressi: fonti che erano incomplete all'inizio del giro e il cui stato è cambiato (o che hanno finito)
const avanzate = Object.keys(ora).filter(f => prima[f] && prima[f].incompleta && prima[f].impronta !== ora[f].impronta);
const ferme = incomplete.filter(f => !avanzate.includes(f));
console.error(`ancora da finire: ${incomplete.join(", ") || "nessuna"}; avanzate in questo giro: ${avanzate.join(", ") || "nessuna"}${ferme.length ? `; senza progressi: ${ferme.join(", ")}` : ""}`);
console.log(incomplete.length && avanzate.length ? "riparti" : "ferma");
