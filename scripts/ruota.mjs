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

const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const FONTI = String(arg.fonti || "").split(",").filter(Boolean);

const leggi = f => { try { return JSON.parse(fs.readFileSync(`data/${f}.json`, "utf8")); } catch (e) { return null; } };
const quante = o => Object.keys((o && o.voci) || {}).length;

// true = prima lettura completa non ancora finita; null = fonte senza regola (conta come finita)
export const INCOMPLETA = {
  // raccolte a riprese con il segnaposto «completato» (azzerato quando si rifà la lettura da capo)
  ...Object.fromEntries(["ndl", "kokusho", "penn", "loc", "auckland", "toronto", "ds", "montecassino", "casanatense", "bub", "laurenziana", "leiden",
    "wolfenbuettel", "bamberga", "karlsruhe", "stoccarda", "colonia", "lipsia",
    "wellcome", "isos", "manchester", "cudl", "cbl"].map(f => [f, s => !s || !s.completato]),
  ),
  // Ambrosiana: elenco letto e nessuna scheda ancora da leggere (le schede che non si aprono restano segnate con «x»)
  ambrosiana: s => !s || !s.elenco || s.cursore != null || Object.values(s.voci || {}).some(v => v && !v.u && !v.x),
  // Walters: tutti i codici dell'elenco letti (le misure delle immagini continuano poi ogni notte)
  walters: s => !s || !s.elenco_letto || quante(s) < (s.totale || 1),
  // Biblioteca Nazionale di Grecia: elenco finito (i manifesti che non si leggono si riprovano al prossimo elenco)
  nlg: s => !s || !s.elenco || !!s.token,
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
