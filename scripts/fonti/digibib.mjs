// Biblioteche digitali spagnole su DIGIBIB (DIGIBÍS): nessun manifesto IIIF, ma OAI-PMH con il formato «didl», che per ogni scheda
// elenca tutte le immagini (imagen_id.do?idImagen=<n>), e immagini JPEG che si caricano come semplici <img> (nessun CORS: il servizio
// Image non c'è). Come per la Biblioteca Nazionale di Grecia, il catalogo scrive i manifesti IIIF (Presentation 2, immagini a misura
// fissa, nessun servizio Image) nel ramo «manifesti» (scripts/manifesti.mjs); gli strumenti del visore che hanno bisogno del servizio
// Image (inchiostro) non funzionano per questi codici. Le misure delle immagini sono quelle di un'immagine per codice (intestazione del
// JPEG, primi 4 KB), usate per tutte le pagine.
//   - «rah»: Biblioteca Digital de la Real Academia de la Historia (bibliotecadigital.rah.es), Madrid: OAI-PMH (/es/oai/oai.do, circa
//     24.700 schede, quasi tutte manoscritte: codici, ma soprattutto documenti, lettere e carte d'archivio delle collezioni). Nessun
//     robots.txt; pausa di 1,5 secondi. Entrano la Sezione dei codici (materia «Códices») e i manoscritti in volume di almeno 20 carte
//     che non sono documenti (ammessaDigibib).
// Stato in data/<fonte>.json: elenco OAI a riprese (token), poi le misure; una raccolta completa si riusa per 14 giorni.
import fs from "node:fs";
import { scarica, scaricaByte, log, records, token, decodifica } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { misuraJpeg } from "./walters.mjs";

export const FONTI_DIGIBIB = {
  rah: { sito: "https://bibliotecadigital.rah.es", oai: "https://bibliotecadigital.rah.es/es/oai/oai.do", prefisso: "rah", citta: "Madrid",
    biblioteca: "Real Academia de la Historia", nome: "Biblioteca Digital de la Real Academia de la Historia" },
};
const GIORNI = 14;
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti";
export const LARGHEZZA = 2000;

export const fileStato = f => `data/${f}.json`;
export function leggiStato(f) { try { return JSON.parse(fs.readFileSync(fileStato(f), "utf8")); } catch (e) { return { voci: {} }; } }
function salvaStato(f, st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, elenco: st.elenco || null, token: st.token || null, letti: st.letti || 0, totale: st.totale || 0 });
  fs.writeFileSync(fileStato(f) + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(fileStato(f) + ".tmp", fileStato(f));
}

// identificativi delle immagini in forma compatta: [primo, quanti] se consecutivi, altrimenti l'elenco
export function compattaImmagini(ids) {
  if (!ids.length) return null;
  return ids.every((x, i) => x === ids[0] + i) ? [ids[0], ids.length] : ids;
}
export function espandiImmagini(c) {
  if (!c) return [];
  return c.length === 2 && !Array.isArray(c[0]) && c[1] < 100000 && c[1] < c[0] ? Array.from({ length: c[1] }, (_, i) => c[0] + i) : c;
}

const tutti = (rec, t) => [...rec.matchAll(new RegExp(`<dc:${t}[^>]*>([\\s\\S]*?)</dc:${t}>`, "g"))].map(m => decodifica(m[1]).replace(/\s+/g, " ").trim()).filter(Boolean);
// record didl -> { id, v } (null se non è un manoscritto con immagini)
export function estraiDigibib(rec) {
  const id = (/<identifier>oai:[^:<]+:(\d+)<\/identifier>/.exec(rec) || [])[1];
  if (!id || /status="deleted"/.test(rec)) return null;
  const tipi = tutti(rec, "type");
  if (!tipi.some(t => /manuscrit/i.test(t))) return null;
  const imm = [...rec.matchAll(/mimeType="image\/jpeg"\s+ref="[^"]*idImagen=(\d+)"/g)].map(m => +m[1]);
  if (!imm.length) return null;
  const fmt = tutti(rec, "format").filter(x => !/^image\//.test(x));
  const rel = tutti(rec, "relation");
  const cod = rel.map(x => (/C[áa]t[áa]logo de la secci[óo]n de c[óo]dices[^]*?cod\.\s*(\d+\w*)/i.exec(x) || [])[1]).find(Boolean);
  const grupo = tutti(rec, "identifier").map(x => (/grupo\.do\?path=(\d+)/.exec(x) || [])[1]).find(Boolean);
  const v = { t: tutti(rec, "title")[0] || null, a: tutti(rec, "creator").filter(x => !/^https?:/.test(x)), d: tutti(rec, "date")[0] || null, l: tutti(rec, "language"),
    e: fmt[0] || null, k: tutti(rec, "subject").filter(x => !/^https?:/.test(x)).slice(0, 8), s: cod ? `Cód. ${cod}` : null,
    c: tutti(rec, "description").join(" ; ").slice(0, 2000) || null, r: tutti(rec, "rights")[0] || null, g: grupo || null, i: compattaImmagini(imm) };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return { id, v };
}

// carte del volume dall'estensione: «119 h.», «[1], 237 h.», «26 h.», «15 ff.», «23 p.» (le pagine valgono mezza carta)
export function carte(e) {
  let n = 0;
  for (const m of String(e || "").matchAll(/(\d+)\s*(?:\]\s*)?(h|f|ff|fol|hojas|p|pp|págs?)\b\.?/gi)) n += /^p/i.test(m[2]) ? +m[1] / 2 : +m[1];
  return n;
}
const DOCUMENTO = /^\s*\[?\s*(carta|cartas|oficio|real (c[ée]dula|provisi[oó]n|orden|despacho|carta)|provisi[oó]n|privilegio|ejecutoria|bula|breve|documento|expediente|acta|proclama|bando|minuta|recibo|certificaci[oó]n|nombramiento|t[íi]tulo de|poder|testamento|escritura|carta de|sentencia|pleito|memorial de|petici[oó]n|instancia|copia de (carta|oficio|real))\b/i;
export function ammessaDigibib(f, v) {
  if (!v || !v.t || !v.i) return false;
  if ((v.k || []).some(k => /^C[óo]dices$/i.test(k))) return true;
  if (DOCUMENTO.test(v.t) || /\bcartas?\b.*\b(a|al)\b.*\d{4}/i.test(v.t)) return false;
  if ((v.k || []).some(k => /Cartas|Autógrafos|Morillo/i.test(k))) return false;
  return carte(v.e) >= 20;
}

export async function scansionaDigibib({ fonte, minuti = 30, soloCache = false } = {}) {
  const cfg = FONTI_DIGIBIB[fonte], st = leggiStato(fonte);
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  const nuova = !st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5;
  if (nuova || st.token) {
    if (!st.token) { st.nuove = {}; st.letti = 0; }
    st.nuove = st.nuove || {};
    for (;;) {
      if (Date.now() > fine) { st.voci = { ...st.voci, ...st.nuove }; salvaStato(fonte, st); throw new Error(`elenco incompleto (${st.letti} schede lette): riprenderà alla prossima esecuzione`); }
      const url = st.token ? `${cfg.oai}?verb=ListRecords&resumptionToken=${encodeURIComponent(st.token)}` : `${cfg.oai}?verb=ListRecords&metadataPrefix=didl`;
      const r = await scarica(url, { timeout: 180000 });
      if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
      if (/badResumptionToken/.test(r.testo)) { st.token = null; st.nuove = {}; st.letti = 0; continue; }
      for (const rec of records(r.testo)) {
        st.letti++;
        const x = estraiDigibib(rec); if (!x || !ammessaDigibib(fonte, x.v)) continue;
        const prima = (st.voci || {})[x.id];
        if (prima && prima.w && JSON.stringify(prima.i) === JSON.stringify(x.v.i)) { x.v.w = prima.w; x.v.h = prima.h; }
        st.nuove[x.id] = x.v;
      }
      const m = /completeListSize="(\d+)"/.exec(r.testo); if (m) st.totale = +m[1];
      st.token = token(r.testo);
      st.aggiornato = new Date().toISOString();
      if (!st.token) { st.voci = st.nuove; delete st.nuove; st.elenco = st.aggiornato; salvaStato(fonte, st); break; }
      if (st.letti % 1000 < 100) log(fonte, `${st.letti} schede lette su ${st.totale}, ${Object.keys(st.nuove).length} codici`);
      salvaStato(fonte, { ...st, voci: { ...st.voci, ...st.nuove } });
    }
    log(fonte, `elenco: ${Object.keys(st.voci).length} codici su ${st.totale} schede`);
  }
  // misure: un'immagine per codice (la terza, se c'è: la prima è spesso la coperta)
  const da = Object.keys(st.voci).filter(id => !st.voci[id].w && !st.voci[id].x);
  let n = 0;
  for (const id of da) {
    if (Date.now() > fine) { salvaStato(fonte, st); throw new Error(`misure in parte (${n} su ${da.length}): riprenderà alla prossima esecuzione`); }
    const v = st.voci[id], imm = espandiImmagini(v.i), img = imm[Math.min(2, imm.length - 1)];
    try {
      const r = await scaricaByte(`${cfg.sito}/es/catalogo_imagenes/imagen_id.do?idImagen=${img}&formato=jpg&registrardownload=0`, { byte: 8192, tentativi: 2 });
      const m = r.stato === 200 ? misuraJpeg(r.dati) : null;
      if (m) { v.w = m.w; v.h = m.h; n++; } else v.x = `HTTP ${r.stato}`;
    } catch (e) { v.x = e.message.slice(0, 60); }
    if (n % 50 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(fonte, st); }
  }
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(fonte, st);
  log(fonte, `misure: ${n} nuove`);
  return st;
}

export function recordDigibib(fonte, st = leggiStato(fonte)) {
  const cfg = FONTI_DIGIBIB[fonte];
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaDigibib(fonte, v) && v.w).map(([id, v]) => ({
    fonte, id: `${cfg.prefisso}-${id}`, citta: v.citta || cfg.citta, biblioteca: v.bib || cfg.biblioteca, segnatura: v.s || `${cfg.prefisso.toUpperCase()} reg. ${id}`,
    datazione: v.d || null, titolo: v.t.replace(/\s*\[Manuscrito\]\s*/i, " ").replace(/\s+/g, " ").trim(), autori_fonte: v.a || [], descrizione: [v.e, (v.k || []).join(" ; "), v.c].filter(Boolean).join(" ; ").slice(0, 3000),
    lingue: lingueDa(v.l || []), immagini: espandiImmagini(v.i).length, manifest: `${BASE_MANIFESTI}/${fonte}/${id}.json`,
    pagina: `${cfg.sito}/es/consulta/registro.do?id=${id}`, licenza: v.r || `${cfg.nome}: condizioni del sito` }));
}

// manifesto scritto dal catalogo: immagini JPEG a misura fissa della biblioteca, senza servizio Image
export function manifestoScritto(fonte, id, v) {
  const cfg = FONTI_DIGIBIB[fonte], mid = `${BASE_MANIFESTI}/${fonte}/${id}.json`;
  const w = v.w, h = v.h;
  const canvases = espandiImmagini(v.i).map((img, i) => {
    const cid = `${cfg.sito}/es/catalogo_imagenes/imagen_id.do?idImagen=${img}`;
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: w, height: h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid,
        resource: { "@id": `${cid}&formato=jpg&registrardownload=0`, "@type": "dctypes:Image", format: "image/jpeg", width: w, height: h } }] };
  });
  const meta = [["Segnatura", v.s], ["Datazione", v.d], ["Lingua", (v.l || []).join(", ")], ["Descrizione fisica", v.e], ["Materie", (v.k || []).join(" ; ")]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: v.t || id, metadata: meta,
    attribution: `${cfg.nome}. Manifesto scritto dal catalogo di Emendando con le immagini della biblioteca (misure di un'immagine per codice).`,
    license: v.r && /https?:\/\/\S+/.exec(v.r) ? /https?:\/\/\S+/.exec(v.r)[0] : undefined, related: `${cfg.sito}/es/consulta/registro.do?id=${id}`,
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
