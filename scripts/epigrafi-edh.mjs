#!/usr/bin/env node
// Iscrizioni dell'Epigraphic Database Heidelberg (dal 28 ottobre 2026): estratto compatto dei dati aperti dell'EDH (CC BY-SA 4.0),
// usato dalla fonte «epigrafi» (scripts/fonti/epigrafi.mjs, parte «edh»). Entrano solo le iscrizioni con almeno una foto nel server
// IIIF di heidICON (Universitätsbibliothek Heidelberg): ogni foto ha il suo manifesto IIIF pubblicato dall'EDH
// (edh.ub.uni-heidelberg.de/iiif/edh/<F>.manifest.json, CORS aperto) e le misure dell'immagine nei dati, quindi nessuna richiesta
// alle pagine del sito.
// Il progetto EDH si è chiuso nel 2021: i dati non cambiano più, l'estratto si rifà solo se l'EDH pubblica dati nuovi.
// Uso:
//   node scripts/epigrafi-edh.mjs                       (scarica i due file CSV dell'EDH, 82 MB, due richieste)
//   node scripts/epigrafi-edh.mjs --csv=/percorso       (usa edh_data_text.csv e edh_data_foto.csv già scaricati in quella cartella)
// Scrive data/epigrafi-edh.json (una iscrizione per riga).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { UA, log } from "./rete.mjs";

export const FILE = "data/epigrafi-edh.json";
export const SCARICA = "https://edh.ub.uni-heidelberg.de/data/download/";
export const LICENZA = "CC BY-SA 4.0, Heidelberger Akademie der Wissenschaften, Epigraphic Database Heidelberg";

// CSV con campi tra virgolette (anche su più righe): generatore di righe come array
// (a pezzi con indexOf e slice: niente concatenazioni carattere per carattere, il file dei testi è di 60 MB)
export function* righeCsv(testo) {
  const n = testo.length;
  let i = 0, riga = [];
  while (i < n) {
    let campo;
    if (testo[i] === '"') {
      let j = i + 1, pezzi = [];
      for (;;) {
        const k = testo.indexOf('"', j);
        if (k < 0) { pezzi.push(testo.slice(j)); j = n; break; }
        pezzi.push(testo.slice(j, k));
        if (testo[k + 1] === '"') { pezzi.push('"'); j = k + 2; continue; }
        j = k + 1; break;
      }
      campo = pezzi.join(""); i = j;
    } else {
      let k = i;
      while (k < n) { const c = testo.charCodeAt(k); if (c === 44 || c === 10 || c === 13) break; k++; }
      campo = testo.slice(i, k); i = k;
    }
    riga.push(campo);
    const c = testo[i];
    if (c === ",") { i++; continue; }
    if (c === "\r") i++;
    if (testo[i] === "\n") i++;
    if (riga.length > 1 || riga[0] !== "") yield riga;
    riga = [];
  }
  if (riga.length) yield riga;
}
// righe come oggetti, solo con le colonne richieste (null = tutte)
export function leggiCsv(testo, colonne = null) {
  const it = righeCsv(testo);
  const testa = it.next().value || [];
  const usa = testa.map((k, j) => [k, j]).filter(([k]) => !colonne || colonne.includes(k));
  const out = [];
  for (const r of it) { const o = {}; for (const [k, j] of usa) o[k] = r[j] ?? ""; out.push(o); }
  return out;
}
export const COLONNE_TESTI = ["hd_nr", "tm_nr", "provinz", "land", "fo_antik", "fo_modern", "fundstelle", "aufbewahrung", "i_gattung", "denkmaltyp", "material",
  "dat_jahr_a", "dat_jahr_e", "nl_text", "atext", "literatur", "foto_nr"];
export const COLONNE_FOTO = ["f_nr", "cil", "ae", "aufschrift", "tiff_geometry", "heidicon_iiif"];

const pulisci = v => { for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k]; return v; };
const num = s => (s == null || String(s).trim() === "" || isNaN(+s)) ? null : +s;
const entita = s => String(s || "").replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d)).replace(/&quot;/g, '"').replace(/&amp;(?=\w+;|#)/g, "&");
const breve = (s, n) => { s = entita(s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

// edizione principale: il primo rimando della bibliografia dell'EDH («AE 1983, 0192. # M. Annecchino, … #») e i rimandi al CIL e
// all'AE delle foto
export function edizioneEdh(literatur, foto = []) {
  const prima = String(literatur || "").split("#")[0].replace(/\s*\([A-Z]\)\s*/g, " ").replace(/\.\s*$/, "").replace(/\s+/g, " ").trim();
  const cil = [...new Set(foto.map(f => f.cil).filter(Boolean))][0];
  const parti = [];
  if (cil) parti.push("CIL " + cil.split(";")[0].replace(/\.\s*$/, "").trim());
  if (prima && !parti.some(p => p.replace(/\s+/g, "") === prima.replace(/\s+/g, ""))) parti.push(prima);
  return parti.join(" ; ") || null;
}

// righe dei due CSV -> { HDnnnnnn: voce compatta }
export function estraiEdh(testi, foto) {
  const perF = new Map(foto.filter(f => f.f_nr && f.heidicon_iiif).map(f => [f.f_nr, f]));
  const voci = {};
  for (const t of testi) {
    if (!/^HD\d+$/.test(t.hd_nr || "")) continue;
    const fs_ = [...new Set((t.foto_nr || "").match(/F\d{6}/g) || [])].map(k => perF.get(k)).filter(Boolean);
    if (!fs_.length) continue;
    const f = fs_.map(x => {
      const [w, h] = String(x.tiff_geometry || "").split("x").map(Number);
      const iiif = String(x.heidicon_iiif).replace(/^https?:\/\/heidicon\.ub\.uni-heidelberg\.de\/iiif\/2\//, "");
      return [x.f_nr, iiif, w || null, h || null, breve(x.aufschrift, 80) || null];
    });
    const a = num(t.dat_jahr_a), e = num(t.dat_jahr_e);
    voci[t.hd_nr] = pulisci({
      tm: num(t.tm_nr) || null, pr: (t.provinz || "").replace(/\?$/, "") || null, la: t.land || null,
      fa: t.fo_antik || null, fm: t.fo_modern || null, fs: breve(t.fundstelle, 160) || null, co: breve(t.aufbewahrung, 160) || null,
      ge: (t.i_gattung || "").replace(/\?$/, "") || null, mo: t.denkmaltyp || null, ma: t.material || null,
      dn: a != null || e != null ? [a ?? e, e ?? a] : null, li: t.nl_text || null, tx: breve(t.atext, 800) || null,
      ed: edizioneEdh(t.literatur, fs_), f,
    });
  }
  return voci;
}

export function leggiEdh(file = FILE) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { voci: {} }; }
}
export function salvaEdh(voci, file = FILE) {
  const righe = Object.entries(voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: 1, aggiornato: new Date().toISOString(), fonte: "https://edh.ub.uni-heidelberg.de/data/download", licenza: LICENZA });
  fs.writeFileSync(file + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(file + ".tmp", file);
}

async function scaricaCsv(nome, dir) {
  const r = await fetch(SCARICA + nome, { headers: { "user-agent": UA } });
  if (!r.ok) throw new Error(`${nome}: HTTP ${r.status}`);
  const p = path.join(dir, nome);
  fs.writeFileSync(p, Buffer.from(await r.arrayBuffer()));
  return p;
}

async function main() {
  const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
  let dir = arg.csv;
  if (!dir) {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "edh-"));
    for (const n of ["edh_data_text.csv", "edh_data_foto.csv"]) { log("edh", "scarico", n); await scaricaCsv(n, dir); await new Promise(r => setTimeout(r, 2000)); }
  }
  const foto = leggiCsv(fs.readFileSync(path.join(dir, "edh_data_foto.csv"), "utf8"), COLONNE_FOTO);
  const testi = leggiCsv(fs.readFileSync(path.join(dir, "edh_data_text.csv"), "utf8"), COLONNE_TESTI).filter(t => t.foto_nr);
  const voci = estraiEdh(testi, foto);
  salvaEdh(voci);
  log("edh", `${testi.length} iscrizioni, ${foto.length} foto: ${Object.keys(voci).length} iscrizioni con foto IIIF in ${FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
