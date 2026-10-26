// CrossAsia (Staatsbibliothek zu Berlin): manoscritti su foglia di palma e su carta di gelso del Laos e della Thailandia del Nord,
// pubblicati con Madoc su iiif.crossasia.org (dal 26 ottobre 2026, corsia «asia»):
//   - Digital Library of Lao Manuscripts (sito «dllm», collezione 19862, circa 13.000 manoscritti): fotografie del Preservation of Lao
//     Manuscripts Programme, Biblioteca nazionale del Laos con l'Università di Passau e la Staatsbibliothek zu Berlin
//     (www.laomanuscripts.net rimanda a digital.crossasia.org);
//   - Digital Library of Northern Thai Manuscripts (sito «lanna», collezione 554808, circa 6600 manoscritti: Lan Na, Pali, Tai Lü...);
//     la collezione «Gallery» dello stesso sito (fotografie di templi, murali, stupa) non si legge.
// Elenco: API pubblica di Madoc (`/s/<sito>/madoc/api/collections/<id>?page=N`, 24 manifesti per pagina, con i metadati di ciascuno:
// titolo, lingue, scrittura, materiale, soggetto, luogo, data, codice PLMP), così non si legge nessun manifesto. Il robots.txt di
// iiif.crossasia.org non c'è (404), quello di digital.crossasia.org non pone limiti; pausa di 1,5 secondi (rete.mjs).
// Manifesti IIIF Presentation 3 esportati da Madoc (`/s/<sito>/madoc/api/manifests/<id>/export/3.0`) e immagini
// (iiif-content.crossasia.org, IIIF Image) con CORS aperto (Access-Control-Allow-Origin: *, verificato il 26 ottobre 2026); il
// manifesto d'origine (itr02.crossasia.org/fcrepo) non risponde. Licenza delle immagini e dei metadati: CC BY-NC 4.0.
// Tutti gli oggetti sono manoscritti (foglia di palma, carta di gelso, carta industriale); fuori solo le voci senza immagini.
// Stato in data/crossasia.json: elenco a riprese (cursore), riletto da capo ogni 14 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/crossasia.json";
export const BASE = "https://iiif.crossasia.org";
export const SITI = [
  { sito: "dllm", collezione: 19862, prefisso: "dllm", biblioteca: "Digital Library of Lao Manuscripts (Biblioteca nazionale del Laos; CrossAsia, Staatsbibliothek zu Berlin)", citta: "Vientiane (Laos)" },
  { sito: "lanna", collezione: 554808, prefisso: "dlntm", biblioteca: "Digital Library of Northern Thai Manuscripts (CrossAsia, Staatsbibliothek zu Berlin)", citta: "Chiang Mai (Thailandia)" },
];
const GIORNI = 14;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, cursore: st.cursore ?? null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// valori di un campo Madoc/IIIF 3 ({ en: [...], lo: [...], none: [...] }) -> { en: «...», loc: «...» }
function val(v) {
  const o = v || {}, en = [...(o.en || []), ...(o.none || [])].map(x => String(x).replace(/<[^>]+>/g, " ").trim()).filter(Boolean);
  const loc = Object.entries(o).filter(([k]) => !["en", "none"].includes(k)).flatMap(([, x]) => x).map(x => String(x).trim()).filter(Boolean);
  return { en, loc };
}

// voce della collezione -> voce compatta { t, tl, l, d, do, m, k, p, cod, idf, sc, c, n }
export function compattaCrossasia(it) {
  const meta = {};
  for (const x of it.metadata || []) { const k = [...((x.label || {}).en || []), ...((x.label || {}).none || [])][0]; if (k && !meta[k]) meta[k] = val(x.value); }
  const g = k => (meta[k] ? meta[k].en : []);
  const v = { t: g("title").join(" ; ") || val(it.label).en.join(" ") || null };
  const tl = meta.title ? meta.title.loc.join(" ; ") : ""; if (tl) v.tl = tl;
  if (g("dc:language").length) v.l = g("dc:language");
  if (g("dc:date").length && !/undated/i.test(g("dc:date")[0])) v.d = g("dc:date")[0];
  if (g("date_original").length && !/undated/i.test(g("date_original")[0])) v.do = g("date_original")[0];
  if (g("material").length) v.m = g("material").join(" ; ");
  if (g("dc:subject").length) v.k = g("dc:subject").join(" ; ");
  if (g("full_location_name").length) v.p = g("full_location_name")[0];
  if (g("otherIdentifier.code_number").length) v.cod = g("otherIdentifier.code_number")[0];
  if (g("dc:identifier").length) v.idf = g("dc:identifier")[0];
  if (g("script").length) v.sc = g("script").join(" ; ");
  if (g("dc:extent").length) v.e = g("dc:extent")[0];
  const c = [...g("dc:description"), ...g("dc:alternative")].join(" ; ").slice(0, 600); if (c) v.c = c;
  v.n = it.canvasCount || 0;
  return v;
}

export async function scansionaCrossasia({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {}; st.totali = st.totali || {};
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  // lettura da capo ogni 14 giorni (le voci restano finché la nuova lettura non le ritrova)
  if (st.cursore == null && (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5)) st.cursore = { s: 0, p: 1, viste: [] };
  if (st.cursore == null) { log("crossasia", `elenco del ${String(st.elenco).slice(0, 10)}: ${Object.keys(st.voci).length} manoscritti`); return st; }
  const viste = new Set(st.cursore.viste || []);
  while (st.cursore.s < SITI.length) {
    const s = SITI[st.cursore.s];
    if (Date.now() > fine) { st.cursore.viste = [...viste]; st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`elenco letto in parte (sito ${s.sito}, pagina ${st.cursore.p}): riprenderà alla prossima esecuzione`); }
    const r = await scarica(`${BASE}/s/${s.sito}/madoc/api/collections/${s.collezione}?page=${st.cursore.p}`, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`${s.sito}, pagina ${st.cursore.p}: HTTP ${r.stato}`);
    const d = JSON.parse(r.testo), its = (d.collection && d.collection.items) || [], pag = d.pagination || {};
    for (const it of its) { if (it.type && it.type !== "manifest") continue; const id = `${s.prefisso}-${it.id}`; st.voci[id] = compattaCrossasia(it); viste.add(id); }
    st.totali[s.sito] = pag.totalResults || st.totali[s.sito] || 0;
    if (!its.length || st.cursore.p >= (pag.totalPages || 0)) { st.cursore = { s: st.cursore.s + 1, p: 1, viste: [...viste] }; log("crossasia", `${s.sito}: ${st.totali[s.sito]} manifesti`); }
    else st.cursore.p++;
    if (st.cursore.p % 25 === 0) { st.cursore.viste = [...viste]; st.aggiornato = new Date().toISOString(); salvaStato(st); }
  }
  // lettura finita: restano solo le voci ritrovate
  for (const k of Object.keys(st.voci)) if (!viste.has(k)) delete st.voci[k];
  st.cursore = null; st.elenco = st.aggiornato = new Date().toISOString(); st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  log("crossasia", `elenco finito: ${Object.keys(st.voci).length} manoscritti`);
  return st;
}

export const ammessaCrossasia = v => !!(v && v.n > 0 && (v.t || v.tl));

export function recordCrossasia(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaCrossasia(v)).map(([id, v]) => {
    const s = SITI.find(x => id.startsWith(x.prefisso + "-")), num = id.slice(s.prefisso.length + 1);
    const segn = s.sito === "dllm" ? `${v.idf ? v.idf.toUpperCase().replace("_", " ") : "DLLM " + num}${v.cod ? ", PLMP " + v.cod : ""}` : `DLNTM ${v.idf || num}${v.cod ? ", " + v.cod : ""}`;
    return {
      fonte: "crossasia", id, citta: s.citta, biblioteca: s.biblioteca, segnatura: segn,
      datazione: v.do ? `${v.do}${v.d && !String(v.do).startsWith(v.d) ? " = " + v.d : ""}` : v.d || null,
      titolo: [v.t, v.tl].filter(Boolean).join(" ; "),
      descrizione: [v.k, v.p, v.m, v.sc ? "scrittura: " + v.sc : null, v.e, v.c].filter(Boolean).join(" ; ").slice(0, 2000) || null,
      lingue: lingueDa(v.l || []).filter(x => x !== "xx").length ? lingueDa(v.l || []) : [], immagini: v.n,
      manifest: `${BASE}/s/${s.sito}/madoc/api/manifests/${num}/export/3.0`, pagina: `${BASE}/s/${s.sito}/manifests/${num}`,
      licenza: "CC BY-NC 4.0 (immagini e metadati: Biblioteca nazionale del Laos e progetti DLLM/DLNTM, tramite la Staatsbibliothek zu Berlin, CrossAsia)",
    };
  });
}
