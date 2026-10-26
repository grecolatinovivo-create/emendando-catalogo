// Harvard Library: Houghton Library, Harvard-Yenching Library e Islamic Heritage Project. Elenco da LibraryCloud
// (api.lib.harvard.edu/v2/items.json, l'API pubblica dei metadati, senza robots.txt), 250 schede per richiesta, pausa di 1,5 secondi.
// LibraryCloud risponde 403 al nostro ambiente di lavoro (prova del 26 ottobre 2026); se risponde 403 anche a GitHub Actions, l'elenco
// si raccoglie dal browser con scripts/browser/harvard.js (stesse richieste, stesso formato di data/harvard.json) e da qui si usa
// il file salvato. Manifesti IIIF Presentation 2: nrs.lib.harvard.edu/<URN dell'oggetto digitale>:MANIFEST:2 (rimanda a
// mps.lib.harvard.edu, CORS aperto; verificato dal browser il 26 ottobre 2026). Le schede raccolte sono i manoscritti con copia
// digitale pubblica (isManuscript, inDRS, accessFlag=P) della Houghton, della Harvard-Yenching e dell'Islamic Heritage Project.
// Entrano i manoscritti librari di ogni data e lingua (tipo di risorsa «text»); fuori lettere e corrispondenza, atti, contratti, diari,
// libri di conti, fotografie, ritratti, carte geografiche, musica, papiri (in attesa di decisione) e documenti (`motivoHarvard`).
// I codici di Harvard che Digital Scriptorium dà già (stesso manifesto o stessa segnatura) restano alla fonte «ds» (raccogli.mjs).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE = "data/harvard.json";
export const NRS = "https://nrs.lib.harvard.edu";
export const NON_LIBRARI = /\b(letters?|correspondence|deeds?|contracts?|indentures?|leases?|diar(?:y|ies)|account books?|accounts?|receipts?|certificates?|photographs?|portraits?|maps?|charts?|drawings?|prints?|rubbings?|posters?|broadsides?|land records|legal documents|documents|petitions?|memorials \(documents\)|wills?|registers \(lists\)|business records|ephemera|scrapbooks?|albums?|postcards?|typescripts?|papyri|ostraca|ketubbot|marriage contracts?)\b/i;
const TITOLI_NON_LIBRARI = /^(letters?|autograph letters?|[A-Z].{0,80}\bto\b [A-Z].{0,60}\[?\d{4})|\b(letters? (?:to|from)|deed of|indenture|receipt|certificate of)\b/i;
// titoli di atti e carte: inglesi (proclami, deposizioni, passaporti…), cinesi e coreani in romanizzazione (memoriali al trono «zou zhe»,
// lettere ufficiali «gong han», licenze «zhi zhao», contratti «qi yue», ricevute, registri di cassa; diari «ilgi»)
const TITOLI_ATTI = /\b(proclamation|commission|passport|deposition|affidavit|ilgi|zou zhe|zou gao|zou shu|gong han|han gao|han di|zhi zhao|jian zhao|qi yue|di qi|mai qi|fen dan|zhang bu|zhang ce|shou ju|shou tiao|qian liang|ri ji|ri lu|bi tie|chi shu|gao shen|hu bu)\b/i;

export function leggiHarvard(file = FILE) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; } }
export const API = "https://api.lib.harvard.edu/v2/items.json";
const FILTRO = "isManuscript=true&inDRS=true&accessFlag=P";
export const INSIEMI = { houghton: `${FILTRO}&repository=Houghton`, yenching: `${FILTRO}&repository=Harvard-Yenching`, ihp: `${FILTRO}&setSpec=ihp` };
const GIORNI = 14, PAGINA = 250;

// MODS di LibraryCloud -> [id del record, scheda compatta] (le stesse funzioni di scripts/browser/harvard.js)
const lista = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
const testo = x => (x == null ? "" : typeof x === "string" ? x : typeof x !== "object" ? String(x) : x["#text"] != null ? String(x["#text"]) : Array.isArray(x) ? x.map(testo).join(" ") : "");
const pulito = s => String(s || "").replace(/\s+/g, " ").trim();

function nomi(m) {
  const out = [];
  for (const n of lista(m.name)) {
    if (!n) continue;
    const ruoli = lista(n.role).flatMap(r => lista(r && r.roleTerm)).map(testo).join(" ").toLowerCase();
    if (ruoli && !/creator|author|scribe|compiler|attributed|calligrapher|translator/.test(ruoli)) continue;
    const parti = lista(n.namePart).map(p => (p == null ? "" : typeof p === "string" ? p : p["@type"] === "date" ? "" : testo(p))).filter(Boolean);
    const s = pulito(parti.join(" ").replace(/,\s*$/, "")); if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 8);
}
export function compattaHarvard(m) {
  const ext = lista(m.extension).filter(Boolean);
  const drs = ext.map(e => e.DRSMetadata).filter(Boolean);
  const lc = ext.map(e => e.librarycloud).filter(Boolean)[0] || {};
  const sets = ext.flatMap(e => lista(e.sets && e.sets.set)).filter(Boolean).map(s => s.setSpec).filter(Boolean);
  const id = testo(lista(m.recordInfo).filter(Boolean).flatMap(r => lista(r.recordIdentifier))[0]);
  const urn = (drs.map(d => d.fileDeliveryURL).find(u => /urn-3:/i.test(u || "")) || "").replace(/^https?:\/\/nrs\.harvard\.edu\//i, "");
  if (!id || !urn) return null;
  const ti = lista(m.titleInfo).filter(Boolean);
  const t0 = ti.filter(t => !t["@type"])[0] || ti[0] || {};
  const t = pulito([testo(t0.nonSort), testo(t0.title), t0.subTitle ? ": " + testo(t0.subTitle) : "", t0.partName ? ". " + testo(t0.partName) : ""].join(" "));
  const oi = lista(m.originInfo).filter(Boolean);
  const tutte = oi.flatMap(o => lista(o.dateCreated).concat(lista(o.dateIssued))).filter(x => x != null);
  const date = tutte.filter(d => !(typeof d === "object" && d["@encoding"] === "marc")).map(testo).map(pulito).filter(Boolean);
  const marc = tutte.filter(d => typeof d === "object" && d["@encoding"] === "marc").map(testo).filter(Boolean);
  const loc = lista(m.location).filter(Boolean);
  const scaffale = loc.map(l => testo(l.shelfLocator)).map(pulito).filter(Boolean);
  const repo = loc.map(l => testo(l.physicalLocation)).map(pulito).filter(Boolean);
  const lingue = lista(m.language).filter(Boolean).flatMap(l => lista(l.languageTerm)).filter(x => x && x["@type"] === "code").map(testo).filter(Boolean);
  const note = lista(m.note).map(testo).concat(lista(m.abstract).map(testo), lista(m.tableOfContents).map(testo)).map(pulito).filter(Boolean);
  const v = { t: t || null, a: nomi(m), d: date[0] || (marc.length ? marc.join("-") : null), l: [...new Set(lingue)], s: scaffale[0] || null,
    r: repo[0] || (lc.HarvardRepositories && testo(lista(lc.HarvardRepositories.HarvardRepository)[0])) || null, u: urn,
    g: [...new Set(lista(m.genre).map(testo).map(pulito).filter(Boolean))].join(" ; ").slice(0, 400) || null,
    ty: testo(lista(m.typeOfResource)[0]) || null, c: note.join(" ; ").slice(0, 1200) || null,
    x: pulito(lista(m.physicalDescription).filter(Boolean).map(p => lista(p.extent).map(testo).join(" ")).join(" ")) || null,
    set: [...new Set(sets)] };
  if (sets.includes("ihp")) v.ihp = 1;
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return [id, v];
}


function salvaHarvard(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  fs.writeFileSync(FILE + ".tmp", JSON.stringify({ formato: 1, raccolto: st.raccolto || null, completato: st.completato || null, insiemi: st.insiemi || {} }).slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE + ".tmp", FILE);
}

// raccolta dal server (GitHub Actions); il file raccolto dal browser resta valido finché questa non riesce
export async function scansionaHarvard({ minuti = 10, soloCache = false } = {}) {
  const st = leggiHarvard() || { formato: 1, voci: {} };
  if (soloCache) return st;
  const quando = st.completato || st.raccolto;
  if (quando && Date.now() - Date.parse(quando) < GIORNI * 864e5) { log("harvard", `riuso la raccolta del ${quando.slice(0, 10)}`); return st; }
  const fine = Date.now() + minuti * 60e3, voci = {}, insiemi = {};
  for (const [nome, q] of Object.entries(INSIEMI)) {
    for (let start = 0; start < 10000; start += PAGINA) {
      if (Date.now() > fine) throw new Error("raccolta incompleta: riprenderà alla prossima esecuzione");
      const r = await scarica(`${API}?${q}&limit=${PAGINA}&start=${start}`, { timeout: 180000, accept: "application/json" });
      if (r.stato !== 200) throw new Error(`LibraryCloud: HTTP ${r.stato} (resta il file raccolto dal browser, se c'è)`);
      const j = JSON.parse(r.testo), tot = +((j.pagination || {}).numFound || 0), items = j.items ? lista(j.items.mods) : [];
      insiemi[nome] = tot;
      for (const m of items) { const c = compattaHarvard(m); if (!c) continue; const [id, v] = c; voci[id] = voci[id] ? { ...voci[id], ...v } : v; }
      if (!items.length || start + PAGINA >= tot) break;
    }
  }
  if (Object.keys(voci).length < 1000) throw new Error(`elenco troppo corto (${Object.keys(voci).length} schede)`);
  st.voci = voci; st.insiemi = insiemi; st.raccolto = st.completato = new Date().toISOString();
  salvaHarvard(st);
  log("harvard", `fine: ${Object.keys(voci).length} schede`);
  return st;
}

const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const manifestoDa = urn => `${NRS}/${String(urn).replace(/^urn-3:/i, "URN-3:")}:MANIFEST:2`;

export function motivoHarvard(v) {
  if (!v || !v.u) return "senza copia digitale";
  if (!(/Houghton|Yenching/i.test(v.r || "") || v.ihp)) return "altra biblioteca di Harvard";
  if (v.ty && !/^text$/i.test(v.ty)) return "non testo (" + v.ty + ")";
  if (/\bpapyr/i.test([v.g, v.s, v.t].join(" "))) return "papiro";
  if (NON_LIBRARI.test(v.g || "")) return "non librario (genere)";
  if (TITOLI_NON_LIBRARI.test(v.t || "")) return "non librario (titolo)";
  if (TITOLI_ATTI.test(v.t || "")) return "non librario (titolo)";
  return null;
}

export function biblioteca(v) {
  const r = v.r || "";
  if (/Yenching/i.test(r)) return "Harvard-Yenching Library, Harvard University";
  if (/Houghton/i.test(r)) return "Harvard University, Houghton Library";
  if (r) return /Harvard/i.test(r) ? r : `${r}, Harvard University`;
  return "Harvard University";
}

// esistenti: { manifesti: Set (minuscole), segnature: Set (normalizzate) } dei codici di Harvard già dati da Digital Scriptorium
export function recordHarvard(st = leggiHarvard(), { esistenti = { manifesti: new Set(), segnature: new Set() }, scarti } = {}) {
  if (!st || !st.voci) return [];
  const out = [];
  for (const [id, v] of Object.entries(st.voci)) {
    const motivo = motivoHarvard(v);
    if (motivo) { if (scarti) scarti[motivo.replace(/ \(.*/, "")] = (scarti[motivo.replace(/ \(.*/, "")] || 0) + 1; continue; }
    const manifest = manifestoDa(v.u);
    const bib = biblioteca(v);
    if (esistenti.manifesti.has(manifest.toLowerCase()) || (/Houghton/.test(bib) && v.s && esistenti.segnature.has(norm(v.s)))) { if (scarti) scarti["già in Digital Scriptorium"] = (scarti["già in Digital Scriptorium"] || 0) + 1; continue; }
    out.push({ fonte: "harvard", id: "harvard-" + id, citta: "Cambridge (Massachusetts)", biblioteca: bib,
      segnatura: v.s || id, datazione: v.d || null, titolo: v.t || null, autori_fonte: v.a || [],
      descrizione: [v.c, v.g, v.x, v.ihp ? "Islamic Heritage Project" : null].filter(Boolean).join(" ; ").slice(0, 4000) || null,
      lingue: lingueDa(v.l || []).filter(x => x !== "xx").length ? lingueDa(v.l || []) : [],
      manifest, pagina: `https://id.lib.harvard.edu/alma/${id}/catalog`,
      licenza: "Harvard Library: copia digitale ad accesso libero; per la riproduzione vedere le condizioni della biblioteca" });
  }
  return out;
}

// codici di Harvard già nel catalogo da Digital Scriptorium
export function esistentiHarvard(record) {
  const manifesti = new Set(), segnature = new Set();
  for (const r of record) {
    if (!/Harvard/i.test(r.biblioteca || "")) continue;
    if (r.manifest) manifesti.add(String(r.manifest).toLowerCase());
    if (r.segnatura) segnature.add(norm(r.segnatura));
  }
  return { manifesti, segnature };
}
