// British Library, Londra (dal 26 ottobre 2026). Dopo l'attacco informatico del 2023 il vecchio visore «Digitised Manuscripts»
// e api.bl.uk restano spenti, ma la Biblioteca ha rimesso in linea una parte dei codici digitalizzati con un nuovo servizio IIIF
// (manifesti IIIF Presentation 3 su bl.digirati.io/iiif/ark:/81055/<lark>, servizio Image 2 e 3, CORS aperto su manifesti e
// immagini, verificato il 26 ottobre 2026 dal server e da un browser con un'altra origine). L'elenco viene dal catalogo
// provvisorio «Archives and Manuscripts» (searcharchives.bl.uk, Blacklight; robots.txt senza limiti): ricerca JSON con il filtro
// «url_stub_si» sul dominio della copia digitale.
//  - «iiif.bl.uk»: le schede con il nuovo visore (circa 3700: manoscritti occidentali, orientali, musicali, India Office Records);
//  - «www.qdl.qa»: le schede con la copia digitale nella Qatar Digital Library (manoscritti arabi, persiani e scientifici della
//    British Library: fondi Or., Add., IO Islamic, Delhi Arabic, Arundel Or., Sloane), solo nelle aree «Oriental Manuscripts» e
//    «Western Manuscripts» (fuori i fascicoli dell'India Office Records, IOR/R/15 e gli altri, che sono documenti d'archivio).
//    I manifesti IIIF Presentation 2 della QDL (www.qdl.qa/en/iiif/81055/<vdc>/manifest) e le immagini (iiif.qdl.qa) si aprono
//    dal browser con CORS aperto; dal server www.qdl.qa risponde con la verifica di Cloudflare, quindi la QDL non si legge mai:
//    l'identificativo del manifesto è quello del collegamento della scheda della British Library.
// Di ogni scheda candidata si legge una volta la scheda JSON (catalog/<id>?format=json): collegamento alla copia digitale,
// datazione (anni dell'era volgare anche per le date dell'Egira), lingue, livello, fondo, nomi. Le schede «Item»/«File» che
// sono parti di un codice già presente (stessa segnatura prima di «, ff» o di «/») non sono voci a sé: i loro titoli entrano
// nel titolo del codice. Fuori: India Office Records e Mss Eur, charters e rotoli (Ch, Roll, Cotton MS Augustus II), papiri
// (in attesa di decisione, come per la Chester Beatty), lettere, documenti e legature.
// Stato in data/bl.json; l'elenco si rilegge ogni 6 giorni, le schede una volta sola. Pausa di 1,5 secondi (rete.mjs).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/bl.json";
export const SITO = "https://searcharchives.bl.uk";
const GIORNI = 6;
export const RICERCHE = [
  { nome: "iiif", filtri: [["f[url_stub_si][]", "iiif.bl.uk"]] },
  { nome: "qdl-or", filtri: [["f[url_stub_si][]", "www.qdl.qa"], ["f[collection_area_ssi][]", "Oriental Manuscripts"]] },
  { nome: "qdl-wm", filtri: [["f[url_stub_si][]", "www.qdl.qa"], ["f[collection_area_ssi][]", "Western Manuscripts"]] },
];
const AREE = /^(Western Manuscripts|Oriental Manuscripts|Music Collections)$/;
const NON_LIBRARI = /^letters?\b|\bletters? (to|from|of|by)\b|\bcorrespondence\b|\bcharters?\b|\bdeeds?\b|\bbinding\b|\bcovers of\b|^(manuscript |wooden )?covers\b|\bwriting desk\b|\bwriting box\b|\breceipts?\b|\bindentures?\b|\bwrit\b|\bseal matrix\b|\bphotograph/i;

const CARTE = /\b(state papers|official papers|original letters|letters and (state )?papers|letters,? written to|autograph signatures|royal and noble autographs|document (sent|records)|correspondence|warrants?|proclamations?|petitions?|orders (of|for) the (parliament|government)|inventor(y|ies) of goods)\b|^(the )?documents?\b/i;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, totali: st.totali || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const pulito = s => String(s ?? "").replace(/<br\s*\/?>|<\/p>\s*<p>/gi, " ; ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/\s+/g, " ").replace(/^[\s;]+|[\s;]+$/g, "").trim();
const campo = (a, k) => { const x = a && a[k]; if (x == null) return null; return typeof x === "object" ? (x.attributes ? x.attributes.value : null) : x; };

// segnatura -> motivo di esclusione (prima di leggere la scheda), o null
export function motivoBl(v) {
  const r = v.r || "", t = v.t || "";
  if (/^(IOR\/|Mss Eur|Photo\s)/.test(r)) return "India Office Records (documenti d'archivio)";
  if (/\b(Ch|Roll|Rolls)\b/.test(r) || /^Cotton MS Augustus II\b/.test(r)) return "charter o rotolo";
  if (/^Papyrus\b/.test(r)) return "papiro (in attesa di decisione)";
  if (v.ca && !AREE.test(v.ca)) return "area " + v.ca;
  if (NON_LIBRARI.test(t)) return "lettera o documento";
  // titolo vuoto o generico: si guarda l'inizio della descrizione (Zweig, Ashley, raccolte di carte negli Harley e negli Add MS)
  const inizio = String(v.c || "").replace(/^STEFAN ZWEIG COLLECTION\. Vol\. [CLXVI]+\.\s*/i, "").slice(0, 160);
  if (CARTE.test(t) || CARTE.test(inizio)) return "carte d'archivio, lettere o documenti";
  if (v.x) return "scheda non leggibile: " + v.x;
  if (v.n === 0 || (v.y && !v.m)) return "senza copia digitale aperta";
  return null;
}

// manifesto dal collegamento della scheda
export function manifestoDa(url) {
  const u = String(url || "");
  let m = /manifest=(https:\/\/bl\.digirati\.io\/iiif\/ark:\/81055\/[^"&#\s<]+)/.exec(u);
  if (m) return m[1];
  m = /https?:\/\/www\.qdl\.qa\/(?:en|ar)\/archive\/81055\/(vdc_[0-9a-fx.]+)/i.exec(u);
  if (m) return `https://www.qdl.qa/en/iiif/81055/${m[1]}/manifest`;
  return null;
}

// scheda JSON -> campi compatti
export function compattaScheda(d) {
  const a = (d && d.data && d.data.attributes) || {};
  const out = {};
  const url = campo(a, "url_tsi") || campo(a, "thumbnail_path_ss");
  out.m = manifestoDa(url);
  out.y = pulito(campo(a, "type_of_record_tsi")) || "?";
  const ini = pulito(campo(a, "start_date_tsi")), fin = pulito(campo(a, "end_date_tsi")), dr = pulito(campo(a, "date_range_tsi")), era = pulito(campo(a, "era_tsi"));
  const anni = ini ? (fin && fin !== ini ? `${ini}-${fin}` : ini) : null;
  out.d = era === "CE" || !era ? (dr || anni) : (anni ? `${anni}${dr ? " (" + dr + ")" : ""}` : dr);
  if (out.d && era && era !== "CE" && anni && !/\d{3,4}/.test(out.d.split("(")[0])) out.d = anni;
  const l = String(campo(a, "language_ssim") || "").split(/<br\s*\/?>/i).map(pulito).filter(Boolean);
  if (l.length) out.l = l;
  const tt = pulito(campo(a, "title_tsi")); if (tt) out.t = tt.slice(0, 400);
  const p = String(campo(a, "project_collections_ssim") || "").split(/<br\s*\/?>/i).map(pulito).filter(Boolean); if (p.length) out.p = p;
  const c = pulito(campo(a, "scope_and_content_tsi")); if (c) out.c = c.slice(0, 1500);
  const nomi = String(campo(a, "related_names_ssim") || "").split(/<br\s*\/?>/i).map(x => pulito(x).replace(/,?\s*https?:\/\/\S+/g, "").replace(/,\s*$/, "")).filter(Boolean);
  if (nomi.length) out.a = nomi.slice(0, 10).map(x => x.slice(0, 160));
  const fis = pulito(campo(a, "physical_characteristics_tsi")); if (fis) out.f = fis.slice(0, 300);
  const e = pulito(campo(a, "extent_tsi")); if (e) out.e = e.slice(0, 120);
  return out;
}

async function pagina(R, p) {
  const q = new URLSearchParams([...R.filtri, ["per_page", "100"], ["page", String(p)], ["sort", "reference_for_sort_si asc"], ["format", "json"]]);
  const r = await scarica(`${SITO}/?${q}`, { timeout: 180000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`ricerca ${R.nome}, pagina ${p}: HTTP ${r.stato}`);
  return JSON.parse(r.testo);
}

async function elenco(st) {
  const out = {};
  st.totali = {};
  for (const R of RICERCHE) {
    for (let p = 1; ; p++) {
      const d = await pagina(R, p);
      st.totali[R.nome] = d.meta.pages.total_count;
      for (const x of d.data || []) {
        const a = x.attributes || {};
        out[x.id] = { r: pulito(campo(a, "reference_ssi")) || pulito(a.title), t: pulito(campo(a, "title_tsi")).slice(0, 400) || null,
          ca: pulito(campo(a, "collection_area_tsi")) || null, q: R.nome };
      }
      if (d.meta.pages["last_page?"] || !(d.data || []).length) break;
    }
  }
  return out;
}

export async function scansionaBl({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {};
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const nuovo = await elenco(st), vecchie = st.voci;
    st.voci = Object.fromEntries(Object.entries(nuovo).map(([id, x]) => [id, vecchie[id] && vecchie[id].y ? { ...vecchie[id], ...x, t: vecchie[id].t || x.t } : x]));
    st.elenco = st.aggiornato = new Date().toISOString();
    if (Object.values(st.voci).some(v => !v.y && !v.x && !motivoBl(v))) st.completato = null;
    salvaStato(st);
    log("bl", `elenco: ${Object.keys(st.voci).length} schede (${Object.entries(st.totali).map(([k, n]) => k + " " + n).join(", ")})`);
  }
  const da = Object.keys(st.voci).filter(id => !st.voci[id].y && !st.voci[id].x && !motivoBl(st.voci[id]));
  let letti = 0;
  for (const id of da) {
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`schede lette in parte (${letti} su ${da.length}): riprenderà alla prossima esecuzione`); }
    let r; try { r = await scarica(`${SITO}/catalog/${encodeURIComponent(id)}?format=json`, { timeout: 120000, accept: "application/json", tentativi: 3 }); }
    catch (e) { st.voci[id].x = e.message.slice(0, 80); continue; }
    if (r.stato !== 200) { st.voci[id].x = `HTTP ${r.stato}`; continue; }
    try { st.voci[id] = { ...st.voci[id], ...compattaScheda(JSON.parse(r.testo)) }; letti++; }
    catch (e) { st.voci[id].x = ("scheda non leggibile: " + e.message).slice(0, 80); }
    if (letti % 25 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); }
  }
  st.aggiornato = new Date().toISOString();
  st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  log("bl", `schede lette: ${letti}; codici: ${recordBl(st).length} su ${Object.keys(st.voci).length} schede`);
  return st;
}

const LINGUE = { "Farsi": "Persian", "Turkish, Ottoman": "Turkish", "Judeo-Arabic": "Arabic", "Greek, Modern": "Greek" };
const madre = r => { const m = /^(.+?)(?:,\s*ff?\.?\s+\S.*|\/\d+[A-Za-z]?(?:\/.*)?)$/.exec(r || ""); return m ? m[1].trim() : null; };

export function recordBl(st = leggiStato()) {
  const ammesse = Object.entries(st.voci || {}).filter(([, v]) => v.y && v.m && !motivoBl(v));
  // un manifesto entra una volta sola: si tiene la scheda con la segnatura più corta (il codice, non una sua parte)
  const perManifesto = new Map();
  for (const [id, v] of ammesse) { const x = perManifesto.get(v.m); if (!x || (v.r || "").length < (x[1].r || "").length) perManifesto.set(v.m, [id, v]); }
  const scelte = [...perManifesto.values()];
  const perSegnatura = new Map(scelte.map(([id, v]) => [v.r, [id, v]]));
  const parti = new Map();
  const out = [];
  for (const [id, v] of scelte) {
    const p = madre(v.r);
    if (p && perSegnatura.has(p)) { const k = perSegnatura.get(p)[0]; if (!parti.has(k)) parti.set(k, []); parti.get(k).push(v); continue; }
    out.push([id, v]);
  }
  return out.map(([id, v]) => {
    const sotto = (parti.get(id) || []).map(x => x.t).filter(Boolean);
    const lingue = [...new Set(lingueDa((v.l || []).map(x => LINGUE[x] || x).filter(x => !/^(Not applicable|Undetermined|Unspecified|Multiple languages)$/i.test(x))))];
    const qdl = v.m.includes("qdl.qa");
    return { fonte: "bl", id: "bl-" + id, citta: "Londra", biblioteca: "British Library",
      segnatura: v.r || id, datazione: v.d || null, titolo: [v.t, ...sotto].filter(Boolean).join(" ; ").slice(0, 400) || null,
      autori_fonte: v.a || [], descrizione: [v.c, v.f, v.e].filter(Boolean).join(" ; ").slice(0, 4000) || null,
      lingue: lingue.length > 1 ? lingue.filter(x => x !== "xx") : lingue, manifest: v.m, pagina: `${SITO}/catalog/${id}`,
      licenza: qdl ? "British Library, copia digitale nella Qatar Digital Library (condizioni d'uso nella scheda della QDL)"
        : "British Library (condizioni d'uso indicate nel manifesto, per lo più pubblico dominio)" };
  });
}
