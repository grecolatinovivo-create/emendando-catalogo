// Bodleian Libraries, Oxford (Digital Bodleian). La collezione IIIF «Western Medieval Manuscripts»
// elenca i manifesti (circa 3400, Bodleian e college di Oxford); di ogni manifesto si legge solo l'inizio
// (metadati: Shelfmark, Title, Author, Language, Date Statement, Contents precedono l'elenco delle immagini).
// Lo stato (manifesti già letti, con i metadati dei codici latini; 0 = non latino o senza metadati) è in
// data/bodleian.json, così la scansione riprende da dove si era fermata anche se la cache delle Actions va persa.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/bodleian.json";
export const COLLEZIONE = "https://iiif.bodleian.ox.ac.uk/iiif/collection/western-medieval-manuscripts";

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  // una voce per riga: diff leggibili nei commit
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, totale_collezione: st.totale_collezione || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const testo = v => [].concat(v ?? []).map(y => typeof y === "string" ? y : y && (y["@value"] || "")).join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// metadati compatti dall'inizio del manifesto (fino a "sequences"); null se non si legge
export function metadatiBodleian(t) {
  const i = t.indexOf('"sequences"');
  let m = null;
  if (i > 0) { try { m = JSON.parse(t.slice(0, i).replace(/,\s*$/, "") + "}"); } catch (e) { m = null; } }
  if (!m) { try { m = JSON.parse(t); } catch (e) { return null; } }
  const md = {}; for (const x of m.metadata || []) { const k = String(x.label || ""); (md[k] = md[k] || []).push(testo(x.value)); }
  return { s: (md.Shelfmark || [])[0] || testo(m.label), t: (md.Title || [])[0] || testo(m.description) || null, a: md.Author || [], l: md.Language || [],
    d: (md["Date Statement"] || [])[0] || null, c: (md.Contents || []).join(" ").slice(0, 1500) || null, i: (md["Holding Institution"] || [])[0] || null,
    r: /creativecommons\.org\/licenses\/([a-z-]+)\/(\d\.\d)/i.test(testo(m.attribution) + " " + JSON.stringify(m.attribution || "")) ? "CC " + RegExp.$1.toUpperCase() + " " + RegExp.$2 : null };
}

// «Bodleian Library MS. Auct. F. 1. 15» -> biblioteca «Bodleian Library», segnatura «MS. Auct. F. 1. 15»
export function dividiSegnatura(s) {
  const m = /^(.*?)\s+(MSS?\.?\s.*)$/.exec(s || "");
  return m ? { biblioteca: m[1], segnatura: m[2] } : { biblioteca: "Bodleian Library", segnatura: s };
}

const latino = l => !l.length || l.some(x => /latin/i.test(x));

/* scansione a tempo della collezione: legge i manifesti non ancora visti (o vecchi di oltre 60 giorni) */
export async function scansionaBodleian({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  const col = await scarica(COLLEZIONE, { cache: 1, timeout: 180000 });
  if (col.stato !== 200) throw new Error("collezione: HTTP " + col.stato);
  const elenco = (JSON.parse(col.testo).manifests || []).map(m => (/manifest\/([0-9a-f-]{36})\.json/.exec(m["@id"]) || [])[1]).filter(Boolean);
  const da = elenco.filter(u => !(u in st.voci));
  let letti = 0, errori = 0;
  for (const u of da) {
    if (Date.now() > fine) break;
    let r; try { r = await scarica(`https://iiif.bodleian.ox.ac.uk/iiif/manifest/${u}.json`, { range: 131072, basta: t => t.includes('"sequences"'), tentativi: 3 }); }
    catch (e) { log("bodleian", u, e.message); if (++errori >= 5) break; continue; }   // un manifesto difettoso si riprova la volta dopo
    letti++; errori = 0;
    const m = r.stato === 200 || r.stato === 206 ? metadatiBodleian(r.testo) : null;
    st.voci[u] = m && latino(m.l) && (m.a.length || m.t || m.c) ? m : 0;
    if (letti % 25 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("bodleian", `${letti} manifesti letti (${Object.keys(st.voci).length}/${elenco.length})`); }
  }
  st.totale_collezione = elenco.length;
  st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("bodleian", `fine: ${letti} manifesti letti; ${Object.keys(st.voci).length} su ${elenco.length} visti`);
  return st;
}

// record compatti per il catalogo; a parità di segnatura si tiene il primo manifesto
export function recordBodleian(st = leggiStato()) {
  const visti = new Set(), out = [];
  for (const [u, v] of Object.entries(st.voci)) {
    if (!v) continue;
    const { biblioteca, segnatura } = dividiSegnatura(v.s);
    if (visti.has(v.s)) continue; visti.add(v.s);
    out.push({ fonte: "bodleian", id: "bod-" + u, citta: "Oxford", biblioteca, segnatura, datazione: v.d, titolo: v.t, autori_fonte: v.a, descrizione: v.c,
      manifest: `https://iiif.bodleian.ox.ac.uk/iiif/manifest/${u}.json`, pagina: `https://digital.bodleian.ox.ac.uk/objects/${u}/`, licenza: v.r || "Digital Bodleian: https://digital.bodleian.ox.ac.uk/terms/" });
  }
  return out;
}
