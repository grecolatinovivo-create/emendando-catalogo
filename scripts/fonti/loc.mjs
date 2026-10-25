// Library of Congress: microfilm dei manoscritti del Monastero di Santa Caterina del Sinai (collezione
// «manuscripts-in-st-catherines-monastery-mount-sinai», circa 1700 codici: greci, arabi, siriaci, georgiani, slavi, etiopici)
// e delle biblioteche dei Patriarcati greco-ortodosso e armeno di Gerusalemme («greek-and-armenian-patriarchates-of-jerusalem»,
// circa 1000 codici: Panagios Taphos, Hagios Sabas, Hagios Stavros, greci, georgiani, arabi, siriaci, armeni, etiopici).
// Microfilm degli anni 1949-1950; loc.gov: «no known restrictions on use or reproduction».
//
// L'elenco viene dall'API JSON delle collezioni di loc.gov (100 item per pagina; il robots.txt chiede 5 secondi: rete.mjs).
// I manifesti IIIF di loc.gov (www.loc.gov/item/<id>/manifest.json) non si aprono né dal server (Cloudflare) né dal browser
// di chi usa il catalogo (prova del 25 ottobre 2026), mentre le immagini del servizio IIIF Image di tile.loc.gov rispondono
// a tutti con CORS aperto. I manifesti quindi li scriviamo noi (Presentation 2, con il servizio Image di tile.loc.gov, così
// funzionano anche gli strumenti del visore): data/manifesti/loc/<id>.json, serviti da raw.githubusercontent.com.
// Le immagini di un item sono numerate di seguito, 0001 ... <files> (verificato su campioni); le misure di ogni fotogramma
// sono quelle del fotogramma rappresentativo dato dall'elenco (i fotogrammi di un microfilm hanno tutti la stessa misura).
// Fuori: firmani e rotoli turchi (documenti d'archivio), pagine di servizio della collezione, cataloghi moderni (dopo il 1800).
// Lo stato è in data/loc.json; una raccolta completa (circa 28 pagine) si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/loc.json";
export const DIR_MANIFESTI = "data/manifesti/loc";
// i manifesti scritti da noi stanno nel ramo «manifesti» del repository (non in main: sono circa 400 MB di JSON e le corsie
// non devono scaricarli a ogni esecuzione); si rigenerano con scripts/manifesti.mjs (workflow manifesti.yml)
export const RAMO_MANIFESTI = "manifesti";
export const BASE_MANIFESTI = `https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/${RAMO_MANIFESTI}/data/manifesti/loc`;
export const COLLEZIONI = { sinai: "manuscripts-in-st-catherines-monastery-mount-sinai", gerusalemme: "greek-and-armenian-patriarchates-of-jerusalem" };
const PAGINA = 100, GIORNI = 6;
export const LICENZA = "Nessuna restrizione nota all'uso e alla riproduzione (Library of Congress: «no known restrictions on use or reproduction»)";

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, totali: st.totali || {}, nuove: st.cursore ? st.nuove : undefined });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// «Greek Manuscripts 792. Parakletike.» -> { s: «Greek 792», t: «Parakletike» }; «Georgian 96. John Climacus. 11th cent. 209 f. Pg. 29 ft.»
//   -> { s: «Georgian 96», t: «John Climacus», d: «11th cent.» }
export function dividiTitolo(titolo) {
  const t = String(titolo || "").replace(/\s+/g, " ").trim();
  const m = /^(.*?\d+[A-Za-z]?(?:\s?\([^)]*\))?)\.\s*(.*)$/.exec(t);
  let s = m ? m[1] : t, resto = m ? m[2] : "";
  s = s.replace(/\s+Manuscripts\b\.?/i, "").replace(/^Slavonic \[Slavic\]/, "Slavonic").trim();
  // datazione e descrizione fisica in coda (Gerusalemme): «11th cent. 209 f. Pg. 29 ft.», «1618 A.D. 173 f. Pa. 20 ft.»
  let d = null;
  const dm = /\s*((?:ca\.\s*)?(?:\d{1,2}(?:st|nd|rd|th)(?:[\/-]\d{1,2}(?:st|nd|rd|th))?\s+cent\.?|\d{3,4}(?:\s*-\s*\d{2,4})?\s*A\.\s?D\.)).*$/i.exec(resto);
  if (dm) { d = dm[1].trim(); resto = resto.slice(0, dm.index); }
  resto = resto.replace(/\s*\d+\s*f\.\s*.*$/i, "").replace(/[.\s]+$/, "").trim();
  return { s, t: resto || null, d };
}

const anno = r => { const a = (r.dates || [r.date]).join(" ").match(/\d{4}/g); return a ? Math.min(...a.map(Number)) : null; };
// misure piene del fotogramma rappresentativo: l'ultimo image_url («.../pct:100/0/default.jpg#h=3426&w=5029»)
export function misure(r) {
  for (const u of [...(r.image_url || [])].reverse()) { const m = /#h=(\d+)&w=(\d+)/.exec(u); if (m) return { w: +m[2], h: +m[1] }; }
  return null;
}

// item dell'elenco -> voce compatta (null se fuori)
export function compattaLoc(r, collezione) {
  if (!r || !r.id || !/\/item\/[^/]+\/?$/.test(r.id)) return null;
  const res = (r.resources || [])[0];
  if (!res || !res.files || !res.image) return null;
  const titolo = String(r.title || "");
  if (/firman|scroll|^related resources|^rights and access|^articles and essays|^abbreviations/i.test(titolo)) return null;
  const a = anno(r);
  if (a && a > 1800) return null;
  const m = /(https:\/\/tile\.loc\.gov\/image-services\/iiif\/service:[^/]+):(\d{4})\//.exec(res.image);
  const mis = misure(r);
  if (!m || !mis) return null;
  const { s, t, d } = dividiTitolo(titolo);
  const parte = (r.partof || []).find(p => p.includes(":")) || "";
  const fondo = (/: microfilm [^:]*: (.*)$/.exec(parte) || [])[1] || null;
  const v = { s, t, d: d || (r.item && r.item.created_published && r.item.created_published[0]) || (a ? String(a) : null), l: [].concat(r.language || (r.item && r.item.language) || []),
    c: collezione, sv: m[1], n: res.files, w: mis.w, h: mis.h };
  if (fondo) v.f = fondo;
  if (/: microfilm 5018: armenian$/.test(parte)) v.arm = 1;
  const note = (r.item && r.item.notes) || [];
  if (note.length) v.k = note.join(" ; ").slice(0, 800);
  return v;
}

// lingua del fondo del microfilm (i fondi greci di Gerusalemme hanno il nome della biblioteca: Panagios Taphos, Hagios Sabas...)
const LINGUA_FONDO = { greek: "grc", arabic: "ar", syriac: "syr", georgian: "ka", armenian: "hy", ethiopic: "gez", slavonic: "cu", "slavonic abraam": "cu" };
export function lingueLoc(v) {
  const fondo = v.f ? LINGUA_FONDO[v.f] || (v.c === "gerusalemme" ? "grc" : null) : null;
  // l'inglese nei dati di loc.gov è la lingua della scheda, non del codice
  const dichiarate = lingueDa(v.l || []).filter(l => l !== "en" && l !== "xx");
  return [...new Set([fondo, ...dichiarate].filter(Boolean))];
}

const idDi = u => /\/item\/([^/]+)\/?$/.exec(u)[1];

/* raccolta a riprese: cursore { c: collezione, p: pagina }; stato salvato dopo ogni pagina */
export async function scansionaLoc({ minuti = 10, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  if (st.completato && !st.cursore && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("loc", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const nomi = Object.keys(COLLEZIONI);
  if (!st.cursore) st.cursore = { c: 0, p: 1 };
  else log("loc", `riprendo da ${nomi[st.cursore.c]}, pagina ${st.cursore.p}`);
  st.nuove = st.nuove || {}; if (st.cursore.c === 0 && st.cursore.p === 1) st.nuove = {};
  st.totali = st.totali || {};
  const fine = ora + minuti * 60e3;
  for (; st.cursore.c < nomi.length; st.cursore.c++, st.cursore.p = 1) {
    const c = nomi[st.cursore.c];
    for (;;) {
      if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${c}, pagina ${st.cursore.p}): riprenderà alla prossima esecuzione`); }
      const url = `https://www.loc.gov/collections/${COLLEZIONI[c]}/?fo=json&c=${PAGINA}&sp=${st.cursore.p}`;
      let d = null;
      // risposte grandi (circa 1 MB) a volte arrivano troncate: si riprova
      for (let k = 0; k < 4 && !d; k++) {
        const r = await scarica(url, { timeout: 120000, accept: "application/json" });
        if (r.stato !== 200) throw new Error(`${c}: HTTP ${r.stato}`);
        try { d = JSON.parse(r.testo); } catch (e) { log("loc", `risposta incompleta (${c}, pagina ${st.cursore.p}): riprovo`); }
      }
      if (!d) throw new Error(`${c}: risposta incompleta`);
      st.totali[c] = d.pagination ? d.pagination.of : 0;
      for (const x of d.results || []) { const v = compattaLoc(x, c); if (v) st.nuove[idDi(x.id)] = v; }
      st.aggiornato = new Date().toISOString();
      salvaStato(st);
      if (!d.pagination || !d.pagination.next) break;
      st.cursore.p++;
    }
    log("loc", `${c}: ${st.totali[c]} item`);
  }
  st.voci = st.nuove; delete st.nuove; delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("loc", `fine: ${Object.keys(st.voci).length} codici`);
  return st;
}

export function bibliotecaLoc(v) {
  if (v.c === "sinai") return { biblioteca: "Monastero di Santa Caterina del Sinai (microfilm della Library of Congress)", citta: "Sinai (Egitto)" };
  if (v.arm) return { biblioteca: "Patriarcato armeno di Gerusalemme (microfilm della Library of Congress)", citta: "Gerusalemme" };
  return { biblioteca: "Patriarcato greco-ortodosso di Gerusalemme (microfilm della Library of Congress)", citta: "Gerusalemme" };
}

export const manifestoLoc = id => `${BASE_MANIFESTI}/${id}.json`;

export function recordLoc(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v).map(([id, v]) => ({
    fonte: "loc", id: "loc-" + id.toLowerCase(), ...bibliotecaLoc(v), segnatura: v.s, datazione: v.d, titolo: v.t || v.s,
    descrizione: [v.f ? "Fondo: " + v.f : null, v.k].filter(Boolean).join(" ; ") || null, lingue: lingueLoc(v), immagini: v.n,
    manifest: manifestoLoc(id), pagina: `https://www.loc.gov/item/${id}/`, licenza: LICENZA }));
}

// manifesto IIIF Presentation 2 scritto da noi: un canvas per fotogramma, con il servizio IIIF Image di tile.loc.gov
export function manifestoScritto(id, v) {
  const mid = manifestoLoc(id), pag = `https://www.loc.gov/item/${id}/`;
  const { biblioteca } = bibliotecaLoc(v);
  const canvases = [];
  for (let i = 1; i <= v.n; i++) {
    // id del canvas: la pagina di loc.gov di quel fotogramma (più corta dell'indirizzo del manifesto)
    const n = String(i).padStart(4, "0"), cid = `https://www.loc.gov/resource/${v.sv.split("service:")[1].split(":").slice(1).join(".")}/?sp=${i}`, svc = `${v.sv}:${n}`;
    canvases.push({ "@id": cid, "@type": "sc:Canvas", label: String(i), width: v.w, height: v.h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid,
        resource: { "@id": `${svc}/full/pct:25/0/default.jpg`, "@type": "dctypes:Image",
          service: { "@context": "http://iiif.io/api/image/2/context.json", "@id": svc, profile: "http://iiif.io/api/image/2/level2.json" } } }] });
  }
  const meta = [["Segnatura", v.s], ["Titolo", v.t], ["Datazione", v.d], ["Lingua", [].concat(v.l || []).join(", ")], ["Fondo", v.f], ["Biblioteca", biblioteca]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s, v.t].filter(Boolean).join(". "),
    metadata: meta, attribution: "Library of Congress, Manuscript Division (microfilm). Manifesto scritto dal catalogo di Emendando con le immagini di tile.loc.gov.",
    license: "https://www.loc.gov/legal/", related: pag, seeAlso: `${pag}?fo=json`, within: "https://www.loc.gov/collections/" + COLLEZIONI[v.c] + "/",
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
