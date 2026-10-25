#!/usr/bin/env node
// Manifesti IIIF scritti dal catalogo, per le fonti i cui manifesti non si aprono dentro il sito:
//   - Library of Congress (microfilm del Sinai e di Gerusalemme): manifesti di loc.gov bloccati, immagini di tile.loc.gov aperte
//     (CORS *): manifesti P2 con il servizio Image di tile.loc.gov (scripts/fonti/loc.mjs);
//   - Biblioteca Nazionale di Grecia: manifesti e info.json senza CORS, immagini caricabili come <img>: copie P2 con immagini
//     a misura fissa, senza servizio Image (scripts/fonti/nlg.mjs).
// Nessuna richiesta di rete: si scrivono dagli stati delle raccolte (data/loc.json, data/nlg.json).
// I manifesti stanno nel ramo «manifesti» del repository, non in main (circa 400 MB di JSON): il workflow manifesti.yml
// li rigenera ogni giorno in una copia di quel ramo e salva solo se cambiano.
// Uso: node scripts/manifesti.mjs [--dir=<cartella radice della copia del ramo manifesti>]   (scrive <dir>/data/manifesti/<fonte>/<id>.json)
import fs from "node:fs";
import path from "node:path";
import * as loc from "./fonti/loc.mjs";
import * as nlg from "./fonti/nlg.mjs";

// scrive i manifesti che mancano o sono cambiati e toglie quelli dei codici usciti (solo se lo stato ha voci)
export function scriviManifesti(voci, cartella, scrivi) {
  fs.mkdirSync(cartella, { recursive: true });
  const nomi = new Set();
  let scritti = 0, tolti = 0;
  for (const [id, v] of Object.entries(voci)) {
    const m = scrivi(id, v); if (!m) continue;
    const f = path.join(cartella, id + ".json"); nomi.add(id + ".json");
    const testo = JSON.stringify(m) + "\n";
    let prima = null; try { prima = fs.readFileSync(f, "utf8"); } catch (e) {}
    if (prima !== testo) { fs.writeFileSync(f, testo); scritti++; }
  }
  if (nomi.size) for (const f of fs.readdirSync(cartella)) if (f.endsWith(".json") && !nomi.has(f)) { fs.unlinkSync(path.join(cartella, f)); tolti++; }
  return { scritti, tolti, totale: nomi.size };
}

export function scriviTutti(dir = ".") {
  const l = loc.leggiStato(), n = nlg.leggiStato();
  return {
    loc: scriviManifesti(l.voci || {}, path.join(dir, "data/manifesti/loc"), (id, v) => (v ? loc.manifestoScritto(id, v) : null)),
    nlg: scriviManifesti(n.voci || {}, path.join(dir, "data/manifesti/nlg"), (id, v) => (v && nlg.numeroPagine(v.p) ? nlg.manifestoScritto(id, v) : null)),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
  const r = scriviTutti(arg.dir || ".");
  for (const [f, x] of Object.entries(r)) console.error(`${f}: ${x.totale} manifesti, ${x.scritti} scritti, ${x.tolti} tolti`);
}
