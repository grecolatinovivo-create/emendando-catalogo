// manuscripta.se (Kungliga biblioteket, Stoccolma): catalogo digitale dei manoscritti medievali e della prima età moderna nelle
// biblioteche svedesi (Kungliga biblioteket, Uppsala universitetsbibliotek, Riksantikvarieämbetet e Vitterhetsakademiens bibliotek,
// Linköping, Lund, Göteborg, Strängnäs, Skokloster e altre). Dal 27 ottobre 2026, corsia «nord».
// Il robots.txt chiede 10 secondi tra le richieste e vieta solo le sottopagine /iiif/*/annotation/ e /iiif/*/canvas/: elenco dal
// modulo di ricerca del sito (/modules/get_search.xql, JSON, 100 schede per pagina), filtro «digitised» (Yes e Partial).
// Le lingue vengono dalle faccette «textLang» (una ricerca per lingua), i frammenti dalla faccetta «docType».
// Manifesti IIIF Presentation 2 del sito (www.manuscripta.se/iiif/<n>/manifest.json) e immagini (iiif.manuscripta.se) con CORS aperto
// (verificato il 27 ottobre 2026); licenza dichiarata nei manifesti: Public Domain Mark.
// I codici di Uppsala e Lund qui pubblicati entrano anche se Alvin resta chiuso (vedi docs/BIBLIOTECHE.md).
// Stato in data/manuscripta.json; elenco completo ogni 14 giorni (circa 40 richieste, 7 minuti).
import { scarica, log } from "../rete.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/manuscripta.json";
export const SITO = "https://www.manuscripta.se";
const GIORNI = 14, RIGHE = 100, PAUSA = 8500;   // + 1,5 secondi di rete.mjs = 10 secondi (Crawl-delay del robots.txt)
const attendi = ms => new Promise(r => setTimeout(r, ms));

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "completato", "totale"]);

// biblioteca (nome inglese del sito) -> [nome, città]
export const BIBLIOTECHE = {
  "National Library of Sweden": ["Kungliga biblioteket", "Stoccolma"],
  "Uppsala University Library": ["Uppsala universitetsbibliotek", "Uppsala"],
  "Swedish National Heritage Board": ["Riksantikvarieämbetet, Vitterhetsakademiens bibliotek", "Stoccolma"],
  "Linköping Diocesan Library": ["Linköpings stiftsbibliotek", "Linköping"],
  "Lund University Library": ["Lunds universitetsbibliotek", "Lund"],
  "Gothenburg University Library": ["Göteborgs universitetsbibliotek", "Göteborg"],
  "National Archives": ["Riksarkivet", "Stoccolma"],
  "Swedish National Archives": ["Riksarkivet", "Stoccolma"],
  // alcune schede usano il nome svedese
  "Kungliga biblioteket": ["Kungliga biblioteket", "Stoccolma"],
  "Uppsala universitetsbibliotek": ["Uppsala universitetsbibliotek", "Uppsala"],
  "Roggebiblioteket": ["Roggebiblioteket", "Strängnäs"],
  "Riksantikvarieämbetet": ["Riksantikvarieämbetet, Vitterhetsakademiens bibliotek", "Stoccolma"],
  "National Archives of the Faroe Islands": ["Tjóðskjalasavnið", "Tórshavn"],
  "Nationalmuseum": ["Nationalmuseum", "Stoccolma"],
  "Rogge Library": ["Roggebiblioteket", "Strängnäs"],
  "Skokloster Castle Library": ["Skoklosters slottsbibliotek", "Skokloster"],
  "Strängnäs Cathedral Library": ["Strängnäs domkyrkobibliotek", "Strängnäs"],
};
// codici di lingua del sito -> ISO 639 del catalogo
const LINGUE = { "non-swe": "sv", "non-dan": "da", "non-gut": "sv", sp: "es", el: "el", grc: "grc" };

async function pagina(fs, page) {
  await attendi(PAUSA);
  const q = new URLSearchParams({ q: "", m: "", o: "", fs, n: String(RIGHE), page: String(page) });
  const r = await scarica(`${SITO}/modules/get_search.xql?${q}`, { timeout: 120000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`HTTP ${r.stato} (${fs}, pagina ${page})`);
  return JSON.parse(r.testo);
}
// tutte le schede di una faccetta: [risultati, faccette della prima pagina]
async function tutte(fs) {
  const out = []; let faccette = null;
  for (let p = 1; ; p++) {
    const j = await pagina(fs, p);
    if (!faccette) faccette = j.availableFacets || [];
    const rs = j.results || [];
    out.push(...rs);
    if (!rs.length || out.length >= +j.totalHits) break;
  }
  return [out, faccette];
}

// scheda dei risultati -> voce compatta { b: biblioteca (nome inglese), s: segnatura, t: titolo, d: datazione, m: supporto, o: origine, p: «Partial» }
export function compattaManuscripta(x, biblioteche = Object.keys(BIBLIOTECHE)) {
  const titolo = String(x.title || "").trim();
  const b = biblioteche.find(n => titolo.startsWith(n + ", ")) || (titolo.includes(", ") ? titolo.slice(0, titolo.indexOf(", ")) : null);
  const s = b && titolo.startsWith(b + ", ") ? titolo.slice(b.length + 2).trim() : titolo;
  const parti = String(x.subtitle || "").split(/\s*―\s*/).map(z => z.trim());
  const v = { b, s, t: String(x.info || "").replace(/\s+/g, " ").trim() || null, m: parti[0] || null, d: parti[1] || null, o: parti[2] || null };
  for (const k of Object.keys(v)) if (v[k] == null || v[k] === "") delete v[k];
  return v;
}

export async function scansionaManuscripta({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("manuscripta", `riuso l'elenco del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci || {}).length} codici`); return st; }
  const fine = Date.now() + minuti * 60e3, voci = {};
  let faccette = [];
  for (const [dig, parziale] of [["Yes", false], ["Partial", true]]) {
    const [rs, f] = await tutte(`digitised:${dig}`);
    if (!faccette.length) faccette = f;
    for (const x of rs) if (x && x.msId) { voci[x.msId] = compattaManuscripta(x); if (parziale) voci[x.msId].p = 1; }
  }
  const nomi = (faccette.find(f => f.name === "repo") || { options: [] }).options.map(o => o.label);
  for (const [id, v] of Object.entries(voci)) {
    // segnature col nome di una biblioteca che contiene una virgola: si rifà la divisione con i nomi del sito
    const x = { title: v.b ? `${v.b}, ${v.s}` : v.s };
    const b = nomi.find(n => x.title.startsWith(n + ", "));
    if (b && b !== v.b) { v.b = b; v.s = x.title.slice(b.length + 2); }
  }
  // lingue e frammenti dalle faccette (una ricerca per valore)
  const lingue = (faccette.find(f => f.name === "textLang") || { options: [] }).options;
  for (const o of lingue) {
    if (Date.now() > fine) throw new Error("tempo esaurito durante la lettura delle lingue: l'elenco si rifà alla prossima esecuzione");
    const [rs] = await tutte(`textLang:${o.name}`);
    for (const x of rs) { const v = voci[x && x.msId]; if (v) { v.l = v.l || []; const c = LINGUE[o.name] || o.name; if (!v.l.includes(c)) v.l.push(c); } }
  }
  const [fr] = await tutte("docType:fragment");
  for (const x of fr) { const v = voci[x && x.msId]; if (v) v.f = 1; }
  st.voci = voci; st.totale = Object.keys(voci).length; st.completato = st.aggiornato = new Date().toISOString();
  salva(st);
  log("manuscripta", `${st.totale} codici digitalizzati (anche in parte)`);
  return st;
}

export function recordManuscripta(st = leggiStato()) {
  return Object.entries(st.voci || {}).map(([id, v]) => {
    const n = id.replace(/^ms-/, ""), [biblioteca, citta] = BIBLIOTECHE[v.b] || [v.b || "manuscripta.se", "Svezia"];
    return { fonte: "manuscripta", id: "manuscripta-" + n, citta, biblioteca, segnatura: v.s || id, datazione: v.d || null, titolo: v.t || null, autori_fonte: [],
      descrizione: [v.f ? "Frammento" : null, v.m, v.o ? "Origine: " + v.o : null, v.p ? "Digitalizzato in parte" : null].filter(Boolean).join(" ; ") || null,
      lingue: v.l || [], manifest: `${SITO}/iiif/${n}/manifest.json`, pagina: `${SITO}/ms/${n}`, licenza: "Public Domain Mark 1.0 (manuscripta.se)" };
  });
}
