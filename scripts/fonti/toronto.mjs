// University of Toronto, Thomas Fisher Rare Book Library (Toronto, Canada): Collections U of T (collections.library.utoronto.ca).
// L'elenco viene dalle collezioni IIIF pubbliche del servizio iiif.library.utoronto.ca (nessun robots.txt; il robots.txt di
// collections.library.utoronto.ca vieta solo /api/, che non si usa): «Thomas Fisher Rare Book Library Manuscripts» (fisher2:root,
// circa 140 manifesti più alcune sottocollezioni) e «Collection of Manuscript Fragments» (fisher21:root: un manifesto per foglio,
// raccolti in sottocollezioni per frammento). Di ogni manifesto si legge una volta l'intero JSON (metadati: titolo, data, luogo,
// segnatura, soggetti, note, diritti; numero delle immagini). Manifesti IIIF Presentation 2 e immagini (IIIF Image 2) con CORS
// aperto (Access-Control-Allow-Origin: *, verificato il 26 ottobre 2026).
// Entrano i manoscritti librari di ogni data e lingua (codici medievali latini, greci, ebraici, orientali, ricettari, miscellanee,
// frammenti di codici); fuori lettere, diari e giornali, carte d'archivio (charters, deeds, land grants, certificati, petizioni,
// registri, atti di processo), album, disegni, rotoli di amuleti, e i papiri (collezione a parte, fisher22, non letta).
// Le collezioni didattiche di paleografia (paleography, italianpaleography) non si leggono: sono campioni di documenti e di codici
// di altre biblioteche.
// Lo stato è in data/toronto.json; l'elenco si rilegge ogni 6 giorni, i manifesti una volta sola. Pausa di 1,5 secondi (rete.mjs).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/toronto.json";
export const IIIF = "https://iiif.library.utoronto.ca/presentation/v2";
export const SITO = "https://collections.library.utoronto.ca";
export const RADICI = ["fisher2:root", "fisher21:root"];
const GIORNI = 6;
export const NON_LIBRARI = /\b(letters?|correspondence|diary|diaries|journals?|charters?|deeds?|land ?grants?|grant by|grant from|edict|beneficiaries|landclaim|quitclaim|indenture|lease|certificate|petition|proceedings and tryal|trial of|baptismos|records|papers?|album|sketchbook|drawings|amulet|scroll|photograph|map|postcards?|dates of decease|report|receipt for|accounts? rendered|catalogue of)\b/i;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const valori = v => [].concat(v ?? []).map(x => (x && typeof x === "object" ? x["@value"] : x)).filter(x => x != null).map(x => String(x).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
const pidDa = url => (/\/v2\/(?:collections\/)?([^/]+?)(?:\/manifest)?$/.exec(url) || [])[1] || null;

// metadati del manifesto -> voce compatta { t, s, d, p, k, c, r, ty, h, n, ll }
export function compattaToronto(m) {
  // il server a volte risponde 200 con {"error": "...timeout"} per i manifesti grandi: si riprova al prossimo elenco
  if (!m || m.error || !(((m.sequences || [])[0] || {}).canvases || []).length) throw new Error(m && m.error ? String(m.error).slice(0, 60) : "manifesto senza immagini");
  const meta = {};
  for (const x of m.metadata || []) { const k = typeof x.label === "string" ? x.label : valori(x.label)[0]; if (k) meta[k] = valori(x.value); }
  const titolo = meta.Title || [];
  const linguaTitolo = [].concat((m.metadata || []).find(x => x.label === "Title")?.value || []).map(x => x && x["@language"]).filter(x => x && x !== "none");
  const v = { t: titolo.join(" ; ") || valori(m.label).join(" ") || null };
  const seg = (meta["Call Number"] || []).filter(x => !/^mfm\b/i.test(x));
  if (seg.length) v.s = seg[0];
  if (meta["Fisher F Number"]) v.f = meta["Fisher F Number"][0];
  if ((meta.Date || []).length) v.d = meta.Date.join(" ; ");
  if ((meta.Place || []).length) v.p = meta.Place.join(" ; ");
  if ((meta["Creator or Contributor"] || []).length) v.a = meta["Creator or Contributor"].slice(0, 8);
  if ((meta["Uniform Title"] || []).length) v.u = meta["Uniform Title"].join(" ; ");
  if ((meta["Subject(s)"] || []).length) v.k = meta["Subject(s)"].join(" ; ");
  const nota = [...(meta["Table of Contents"] || []), ...(meta.Note || [])].join(" ; ").slice(0, 1500); if (nota) v.c = nota;
  if ((meta["Type of Resource"] || []).length) v.ty = meta["Type of Resource"].join(" ; ");
  if ((meta.Genre || []).length) v.g = meta.Genre.join(" ; ").slice(0, 300);
  if ((meta.Rights || []).length) v.r = meta.Rights.join(" ; ");
  if ((meta["Holding Institution"] || []).length) v.h = meta["Holding Institution"][0];
  if (linguaTitolo.length) v.ll = [...new Set(linguaTitolo)];
  v.n = (((m.sequences || [])[0] || {}).canvases || []).length;
  return v;
}

// lingue: dai soggetti «Manuscripts, Latin», «Manuscripts, Hebrew» (le altre parole, come «Medieval», non sono lingue)
const ISO1 = { la: "la", he: "he", el: "grc", grc: "grc", ar: "ar", fa: "fa", tr: "tr", it: "it", fr: "fr", de: "de", en: "en", es: "es", pt: "pt", nl: "nl", syr: "syr", hy: "hy", cop: "cop" };
export function lingueToronto(v) {
  const da = [];
  for (const m of String(v.k || "").matchAll(/Manuscripts,\s*([A-Z][A-Za-z ()-]+?)(?:\s*;|\s*$|\s+--)/g)) {
    const c = lingueDa([m[1].trim()]).filter(x => x !== "xx"); for (const x of c) if (!da.includes(x)) da.push(x);
  }
  if (da.length) return da;
  return [...new Set((v.ll || []).map(x => ISO1[x]).filter(Boolean))];
}

export function ammessaToronto(v) {
  if (!v || !(v.t || v.l) || !v.n) return false;
  if (v.ty && !/text|manuscript|mixed/i.test(v.ty)) return false;   // still image, cartographic, notated music senza testo...
  if (NON_LIBRARI.test(v.t || v.l)) return false;
  if (v.gr && NON_LIBRARI.test(v.gr)) return false;              // sottocollezione di lettere, diari, carte
  return true;
}

// elenco: collezioni IIIF dalle radici, ricorsivamente -> { pid: { l: titolo, gr: titolo della sottocollezione } }
async function elenco() {
  const out = {}, viste = new Set();
  async function visita(pid, gruppo, prof) {
    if (viste.has(pid) || prof > 4) return; viste.add(pid);
    const r = await scarica(`${IIIF}/collections/${pid}`, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`collezione ${pid}: HTTP ${r.stato}`);
    const c = JSON.parse(r.testo);
    for (const m of c.manifests || []) { const p = pidDa(m["@id"]); if (p) out[p] = { l: valori(m.label).join(" ") || null, ...(gruppo ? { gr: gruppo } : {}) }; }
    for (const s of c.collections || []) { const p = pidDa(s["@id"]); if (p) await visita(p, valori(s.label).join(" ") || gruppo, prof + 1); }
  }
  for (const r of RADICI) await visita(r, null, 0);
  return out;
}

export async function scansionaToronto({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {};
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const nuovo = await elenco(), vecchie = st.voci;
    st.voci = Object.fromEntries(Object.entries(nuovo).map(([p, x]) => [p, vecchie[p] && vecchie[p].n ? { ...vecchie[p], ...x } : x]));
    st.elenco = st.aggiornato = new Date().toISOString();
    if (Object.values(st.voci).some(v => !v.n && !v.x)) st.completato = null;
    salvaStato(st);
    log("toronto", `elenco: ${Object.keys(st.voci).length} manifesti`);
  }
  const da = Object.keys(st.voci).filter(p => !st.voci[p].n && !st.voci[p].x);
  let letti = 0;
  for (const p of da) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`manifesti letti in parte (${letti} su ${da.length}): riprenderà alla prossima esecuzione`); }
    let r; try { r = await scarica(`${IIIF}/${p}/manifest`, { timeout: 180000, accept: "application/json", tentativi: 2 }); } catch (e) { st.voci[p].x = e.message.slice(0, 80); continue; }
    if (r.stato !== 200) { st.voci[p].x = `HTTP ${r.stato}`; continue; }
    try { st.voci[p] = { ...st.voci[p], ...compattaToronto(JSON.parse(r.testo)) }; letti++; } catch (e) { st.voci[p].x = ("manifesto non leggibile: " + e.message).slice(0, 80); }
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); }
  }
  st.aggiornato = new Date().toISOString();
  st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  log("toronto", `manifesti letti: ${letti}; codici: ${Object.values(st.voci).filter(ammessaToronto).length} su ${Object.keys(st.voci).length}`);
  return st;
}

export function recordToronto(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaToronto(v)).map(([p, v]) => ({
    fonte: "toronto", id: "uoft-" + p.toLowerCase().replace(/[^a-z0-9]+/g, "-"), citta: "Toronto (Canada)",
    biblioteca: v.h && !/Fisher/i.test(v.h) ? `${v.h} (University of Toronto)` : "Thomas Fisher Rare Book Library, University of Toronto",
    segnatura: v.s || (v.f ? "Fisher " + v.f : p), datazione: v.d || null,
    titolo: [v.gr && v.gr !== (v.t || v.l) ? v.gr : null, v.t || v.l, v.u].filter(Boolean).join(" ; "), autori_fonte: v.a || [],
    descrizione: [v.c, v.k, v.p].filter(Boolean).join(" ; ").slice(0, 4000) || null, lingue: lingueToronto(v), immagini: v.n,
    manifest: `${IIIF}/${p}/manifest`, pagina: `${SITO}/view/${p}`,
    licenza: v.r || "Thomas Fisher Rare Book Library: per i diritti e la riproduzione rivolgersi a fisher.library@utoronto.ca" }));
}
