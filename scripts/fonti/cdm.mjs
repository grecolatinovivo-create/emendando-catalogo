// Biblioteche della Catalogna su CONTENTdm, lette con l'API dmwebservices (dmQuery, pagine di 200 record), come la Laurenziana:
//   - «mdc»: Memòria Digital de Catalunya (mdc.csuc.cat, Consorci de Serveis Universitaris de Catalunya), collezioni di manoscritti
//     della Biblioteca de Catalunya (Manuscrits), dell'Ateneu Barcelonès, della Biblioteca Museu Víctor Balaguer (Vilanova i la Geltrú)
//     e della Biblioteca Pública Episcopal del Seminari de Barcelona. Restano fuori pergamene sciolte (documenti), carte personali
//     (Manuscrits Mn. Salvador Bové, fondi personali), musica, fotografie, mappe e stampati.
//   - «ub»: Biblioteca Patrimonial Digital dell'Universitat de Barcelona (bipadi.ub.edu, CRAI Biblioteca de Fons Antic), collezione «Manuscrits».
//   - «auc» (dal 26 ottobre 2026, corsia «mondo»): American University in Cairo, Rare Books and Special Collections Library
//     (digitalcollections.aucegypt.edu): «Arabic Manuscript Collection» (codici arabi e persiani) e «Iryan Moftah Coptic Language and
//     Religion Manuscripts» (codici copti e arabo-cristiani). Il robots.txt vieta ricerca e /oai/ (Crawl-Delay 1), non l'API; manifesti
//     e immagini (cdm15795.contentdm.oclc.org) con CORS aperto (prova del 26 ottobre 2026). Ogni collezione ha i suoi nomi dei campi:
//     «campi» li riporta a quelli usati qui sotto.
// Il robots.txt dei due siti vieta le pagine di ricerca e /oai/ (Crawl-delay 1), non l'API dmwebservices; pausa di 1,5 secondi.
// Manifesti IIIF: <sito>/iiif/2/<collezione>:<numero>/manifest.json; manifesti e immagini (server cdm21058/cdm21046.contentdm.oclc.org)
// con CORS aperto (prova del 26 ottobre 2026).
// Entrano i codici (oggetti di primo livello) di ogni data; fuori lettere, carteggi e documenti (filtro ammessaCdm, anche in costruzione).
// Stato in data/<fonte>.json (cursore {collezione, inizio}); una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

const BC = "Biblioteca de Catalunya";
export const FONTI_CDM = {
  mdc: {
    sito: "https://mdc.csuc.cat", prefisso: "mdc",
    collezioni: {
      manuscritBC: { biblioteca: BC, citta: "Barcellona" },
      manuscritAB: { biblioteca: "Ateneu Barcelonès", citta: "Barcellona" },
      manuscritVB: { biblioteca: "Biblioteca Museu Víctor Balaguer", citta: "Vilanova i la Geltrú" },
      ManuscrBPEB: { biblioteca: "Biblioteca Pública Episcopal del Seminari de Barcelona", citta: "Barcellona" },
    },
    licenza: "condizioni della biblioteca indicate nella scheda (Memòria Digital de Catalunya)",
  },
  ub: {
    sito: "https://bipadi.ub.edu", prefisso: "ub",
    collezioni: { manuscrits: { biblioteca: "Universitat de Barcelona, CRAI Biblioteca de Fons Antic", citta: "Barcellona" } },
    licenza: "Universitat de Barcelona: condizioni indicate nella scheda (Biblioteca Patrimonial Digital)",
  },
  auc: {
    sito: "https://digitalcollections.aucegypt.edu", prefisso: "auc",
    collezioni: {
      // campo usato qui -> campo (o campi) della collezione
      p15795coll52: { biblioteca: "American University in Cairo, Rare Books and Special Collections Library", citta: "Il Cairo",
        campi: { title: ["title", "subjec"], creato: "creato", date: "date", langua: "rights", descri: ["format", "covera"], rights: "licens", memria: "call" } },
      p15795coll4: { biblioteca: "American University in Cairo, Rare Books and Special Collections Library", citta: "Il Cairo",
        campi: { title: ["title", "altern"], creato: "collec", contri: "videog", date: "date", langua: "langua", descri: "descri", subjec: "subjec", rights: "rightsb", memria: "identi" } },
    },
    licenza: "American University in Cairo, Rare Books and Special Collections Library: condizioni indicate nella scheda",
  },
};

// campi della richiesta e record riportato ai nomi standard (collezioni con «campi» propri)
const campiRichiesta = col => (col && col.campi ? [...new Set(Object.values(col.campi).flat())] : CAMPI);
function rimappa(x, col) {
  if (!col || !col.campi) return x;
  const y = { pointer: x.pointer, parentobject: x.parentobject };
  for (const [k, v] of Object.entries(col.campi)) {
    const valori = [].concat(v).map(n => (typeof x[n] === "string" ? x[n].trim() : "")).filter(Boolean);
    y[k] = k === "title" ? valori.join(" = ") : valori.join(" ; ");
  }
  return y;
}
const CAMPI = ["title", "creato", "contri", "date", "langua", "descri", "subjec", "source", "rights", "gestia", "type", "format", "caract", "identi", "memria", "relati", "publis", "formaa"];
const PAGINA = 200, GIORNI = 6;

export const fileStato = f => `data/${f}.json`;
export function leggiStato(f) {
  try { return JSON.parse(fs.readFileSync(fileStato(f), "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(f, st) {
  // una voce per riga (diff leggibili); durante una raccolta le voci nuove stanno nel cursore, nella testa
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, totali: st.totali || {} });
  fs.writeFileSync(fileStato(f) + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(fileStato(f) + ".tmp", fileStato(f));
}

const pulito = s => (typeof s === "string" ? s : "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// segnatura: «Document original: Biblioteca de Catalunya. Ms. 3482» -> «Ms. 3482»; «[Ms. 215]» nel titolo (Ateneu); campo Referència (UB)
export function segnaturaCdm(v) {
  const f = v.o || "";
  let m = /(?:^|[.:;]\s*)((?:Ms|MS|Mss)\.?\s*[\w./-]+(?:\s*bis)?)\s*$/.exec(f) || /\b((?:Ms|MS)\.\s*\d[\w./-]*)/.exec(f);
  if (m) return m[1].replace(/^(Ms|MS)\.?\s*/, "Ms. ");
  m = /\[(Ms\.?\s*[^\]]+)\]/.exec(v.t || "");
  if (m) return m[1].replace(/^Ms\.?\s*/, "Ms. ");
  if (v.n) return v.n;
  return null;
}

// record di dmQuery -> voce compatta (null per le pagine figlie)
export function compattaCdm(r) {
  if (!r || r.parentobject !== -1) return null;
  const lista = s => pulito(s).split(";").map(x => x.trim()).filter(Boolean);
  const v = { t: pulito(r.title) || null, a: lista(r.creato), d: pulito(r.date) || null, l: pulito(r.langua) || null, o: pulito(r.source) || null,
    y: pulito(r.type) || null, r: pulito(r.rights) || pulito(r.gestia) || null, n: pulito(r.memria) || (/^https?:/.test(pulito(r.identi)) ? null : pulito(r.identi)) || null,
    c: [pulito(r.descri), pulito(r.subjec), pulito(r.formaa), pulito(r.caract), /manuscrit/i.test(pulito(r.format)) ? "" : pulito(r.format)].filter(Boolean).join(" ; ").slice(0, 3000) || null };
  const k = lista(r.contri); if (k.length) v.k = k;
  for (const x of Object.keys(v)) if (v[x] == null || (Array.isArray(v[x]) && !v[x].length)) delete v[x];
  return v;
}

// solo codici: fuori lettere, carteggi, documenti sciolti, ritagli; il resto (anche moderno e senza data) entra
const NON_LIBRARI = /^\s*\[?\s*((cartas?|cartes|lletr[ae]s?)\s+(a|al|als|à|dirigida|adre[çc]ada)\b|(dues|tres|dos) cartes|carta autògrafa|correspond[eè]ncia|epistolari|documents?\b|telegrama|targeta|postal|rebuts?\b|recibos?\b|certifica(t|do)|nomenament|nombramiento|t[íi]tol de|t[íi]tulo de|diploma|contracte|contrato|escriptura|escritura de|testament|instància|instancia|oficio|retall|recorte|invitaci[oó]|programa|full solt|hoja suelta)/i;
export function ammessaCdm(v) {
  if (!v || !v.t) return false;
  if (NON_LIBRARI.test(v.t)) return false;
  if (/\b(fotograf|imatge|image|mapa|map|so|sound|àudio)\b/i.test(v.y || "") && !/text/i.test(v.y || "")) return false;
  return true;
}

/* raccolta a riprese: cursore {collezione, inizio}; stato salvato dopo ogni pagina */
export async function scansionaCdm({ fonte, minuti = 10, soloCache = false } = {}) {
  const cfg = FONTI_CDM[fonte], COLL = Object.keys(cfg.collezioni);
  const st = leggiStato(fonte);
  if (soloCache) return st;
  if (st.completato && !st.cursore && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log(fonte, `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  if (!st.cursore || !COLL.includes(st.cursore.collezione)) st.cursore = { collezione: COLL[0], inizio: 1, voci: {} };
  else log(fonte, `riprendo da ${st.cursore.collezione}, record ${st.cursore.inizio}`);
  st.cursore.voci = st.cursore.voci || {};
  st.totali = st.totali || {};
  const fine = Date.now() + minuti * 60e3;
  for (let i = COLL.indexOf(st.cursore.collezione); i < COLL.length; i++) {
    const c = COLL[i];
    if (st.cursore.collezione !== c) st.cursore = { collezione: c, inizio: 1, voci: st.cursore.voci };
    for (;;) {
      if (Date.now() > fine) { salvaStato(fonte, st); throw new Error(`raccolta incompleta (${c}, record ${st.cursore.inizio}): riprenderà alla prossima esecuzione`); }
      const url = `${cfg.sito}/digital/bl/dmwebservices/index.php?q=dmQuery/${c}/0/${campiRichiesta(cfg.collezioni[c]).join("!")}/nosort/${PAGINA}/${st.cursore.inizio}/0/0/0/0/json`;
      const r = await scarica(url, { timeout: 120000 });
      if (r.stato !== 200) throw new Error(`${c}: HTTP ${r.stato}`);
      const d = JSON.parse(r.testo), recs = d.records || [];
      st.totali[c] = +d.pager.total;
      for (const x of recs) { const v = compattaCdm(rimappa(x, cfg.collezioni[c])); if (v) st.cursore.voci[`${c}:${x.pointer}`] = v; }
      st.cursore.inizio += PAGINA;
      st.aggiornato = new Date().toISOString();
      salvaStato(fonte, st);
      if (!recs.length || st.cursore.inizio > st.totali[c]) break;
    }
    log(fonte, `${c}: ${st.totali[c]} record`);
  }
  st.voci = st.cursore.voci; delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(fonte, st);
  log(fonte, `fine: ${Object.keys(st.voci).length} oggetti`);
  return st;
}

export function recordCdm(fonte, st = leggiStato(fonte)) {
  const cfg = FONTI_CDM[fonte], out = [];
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!ammessaCdm(v)) continue;
    const [alias, pointer] = k.split(":"), col = cfg.collezioni[alias];
    if (!col) continue;
    out.push({ fonte, id: `${cfg.prefisso}-${alias.toLowerCase()}-${pointer}`, citta: col.citta, biblioteca: col.biblioteca, segnatura: segnaturaCdm(v) || `${fonte === "ub" ? "BiPaDi" : fonte.toUpperCase()}, ${alias} ${pointer}`,
      datazione: v.d || null, titolo: v.t, autori_fonte: v.a || [], collaboratori: v.k || [], descrizione: v.c || null, lingue: lingueDa(v.l ? v.l.split(/\s*;\s*/) : []),
      manifest: `${cfg.sito}/iiif/2/${alias}:${pointer}/manifest.json`, pagina: `${cfg.sito}/digital/collection/${alias}/id/${pointer}`, licenza: v.r || cfg.licenza });
  }
  return out;
}
