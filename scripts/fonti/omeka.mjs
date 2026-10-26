// Biblioteche spagnole su Omeka S, lette con l'API REST pubblica (/api/items, 100 schede per pagina, in serie con la pausa di 1,5 secondi):
//   - «realbiblioteca»: Real Biblioteca Digital (rbdigital.realbiblioteca.es, Patrimonio Nacional): manoscritti della Real Biblioteca
//     del Palacio Real di Madrid (segnature II/…) e della Real Biblioteca del Monasterio de El Escorial (segnature RBME: &-I-11,
//     a-I-1, b-III-12, Árabe, Hebreo…; latini, greci, arabi, ebraici, castigliani, galeghi, catalani…). Il manifesto IIIF di ogni codice
//     è indicato dalla scheda (dcterms:hasFormat, /files/manifests/<nome>.json); immagini dal server IIIF di Patrimonio Nacional
//     (imagenes.patrimonionacional.es). Manifesti e immagini con CORS aperto (prova del 26 ottobre 2026). Il sito non ha robots.txt.
//     Condizioni d'uso: uso libero, ma la riproduzione completa dei fondi di 20 pagine o più è permessa solo per collegamento al sito
//     (il visore di Emendando apre i manifesti e le immagini della biblioteca, non li copia); citazione «Patrimonio Nacional. Real
//     Biblioteca, <segnatura>». Entrano le schede di tipo «Manoscritto» o degli insiemi dei manoscritti, con il manifesto.
//   - «ucm»: Patrimonio Digital della Universidad Complutense de Madrid (patrimoniodigital.ucm.es, Biblioteca Histórica Marqués de
//     Valdecilla, con i codici del progetto Dioscórides), insieme «Manuscritos». Manifesti IIIF del modulo IIIF Server
//     (/iiif/2/<id>/manifest) e immagini con CORS aperto; licenza indicata per ogni scheda (per lo più CC BY 4.0). Il robots.txt
//     vieta solo le pagine delle schede del sito (/s/patrimonio/item), non l'API.
// Fuori lettere, documenti, fotografie, disegni e stampati (filtro ammessaOmeka, anche in costruzione); nessun limite di data.
// Stato in data/<fonte>.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FONTI_OMEKA = {
  realbiblioteca: { sito: "https://rbdigital.realbiblioteca.es", prefisso: "rbd", query: {} },
  ucm: { sito: "https://patrimoniodigital.ucm.es", prefisso: "ucm", query: { item_set_id: "937" } },
};
// insiemi dei manoscritti della Real Biblioteca Digital (gli insiemi per lingua e quelli di El Escorial)
export const INSIEMI_MSS_RB = new Set([11350, 13120, 13121, 13139, 13190, 13223, 13386, 13391, 13471, 13472, 13532, 13951, 13952, 13953, 13958, 14699, 15140, 15141, 15548, 21007, 21191]);
const PAGINA = 100, GIORNI = 6;

export const fileStato = f => `data/${f}.json`;
export function leggiStato(f) {
  try { return JSON.parse(fs.readFileSync(fileStato(f), "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(f, st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, totale: st.totale || 0 });
  fs.writeFileSync(fileStato(f) + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(fileStato(f) + ".tmp", fileStato(f));
}

const val = (x, k) => (x[k] || []).filter(y => y.is_public !== false).map(y => String(y["@value"] ?? y["o:label"] ?? y["@id"] ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
const uri = (x, k) => (x[k] || []).map(y => y["@id"] || (/^https?:\/\//.test(y["@value"] || "") ? y["@value"] : null)).filter(Boolean);

// scheda Omeka S -> voce compatta
export function compattaOmeka(x) {
  if (!x || !x["o:id"]) return null;
  const v = { t: val(x, "dcterms:title")[0] || x["o:title"] || null, a: val(x, "dcterms:creator"), k: val(x, "dcterms:contributor").slice(0, 20),
    d: val(x, "dcterms:date")[0] || val(x, "dcterms:created")[0] || val(x, "dcterms:temporal")[0] || null,
    l: [...new Set([...val(x, "dcterms:language"), ...val(x, "buc:language")])],
    y: [...new Set(val(x, "dcterms:type"))],
    s: val(x, "buc:shelfmark")[0] || val(x, "dcterms:identifier").find(s => !/^\d{6,}$/.test(s) && !/^https?:/.test(s)) || null,
    e: val(x, "dcterms:extent")[0] || val(x, "dcterms:format").find(s => /\b(f|h|fol|hojas?|p)\b\.?/.test(s)) || null,
    c: [...val(x, "dcterms:description"), ...val(x, "dcterms:subject"), ...val(x, "dcterms:tableOfContents")].join(" ; ").slice(0, 3000) || null,
    r: (x["edm:rights"] || []).map(y => y["o:label"] || y["@id"]).find(Boolean) || val(x, "dcterms:rights")[0] || null,
    m: uri(x, "dcterms:hasFormat").find(u => /\.json$|\/manifest/.test(u)) || null,
    i: (x["o:item_set"] || []).map(s => s["o:id"]),
    q: val(x, "buc:series").slice(0, 4), p: val(x, "edm:currentLocation")[0] || null,
  };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return { id: String(x["o:id"]), v };
}

// solo codici: fuori lettere, documenti sciolti, titoli e diplomi, carte d'archivio, disegni e fotografie
const NON_LIBRARI = /^\s*\[?\s*(cartas?|carta-|carteo|correspondencia|epistolario de|oficio|documento|expediente|t[íi]tulo de|diploma|certificad|nombramiento|real (c[ée]dula|provisi[oó]n|orden|despacho)|provisi[oó]n|privilegio|ejecutoria|escritura|poder|testamento|recibo|factura|tarjeta|telegrama|fotograf|dibujo|grabado|plano|mapa|partitura suelta)\b/i;
const FONDI_ARCHIVIO = /Castroviejo|Archivo Hist[óo]rico del PCE|Fondo Personal|Rub[ée]n Dar[íi]o|Lafuente Ferrari|Hern[áa]ndez-Pacheco|diplomas de la Escuela|Diapositivas|Encuadernaciones|Planos de la|Atlas y material|Fotogr[áa]fic/i;
export function ammessaOmeka(fonte, v) {
  if (!v || !v.t) return false;
  if (NON_LIBRARI.test(v.t)) return false;
  if ((v.q || []).some(s => FONDI_ARCHIVIO.test(s))) return false;
  const tipi = (v.y || []).join(" ");
  if (/mapas?\b|planos?\b|dibujos?\b|grabados?\b|fotograf|carteles?|estampas?/i.test(tipi) && !/manuscritos?$|^manuscritos?\b/i.test((v.y || [])[0] || "")) return false;
  if (fonte === "realbiblioteca") {
    if (!v.m) return false;
    const tipo = (v.y || []).join(" ");
    if (/dibujo|grabado|fotograf|impreso|estampa|mapa|plano/i.test(tipo) && !/manuscrit/i.test(tipo)) return false;
    // musica manoscritta (partiture e parti sciolte, segnature MUS/…): fuori, tranne i libri corali (Cantorales)
    if ((/musical|partitura/i.test(tipo) || /^MUS\//.test(v.s || "")) && !(v.i || []).includes(14699)) return false;
    if (/correspondencia|cartas\b|documento manuscrito|censos/i.test(tipo)) return false;
    return /manuscrit/i.test(tipo) || (v.i || []).some(i => INSIEMI_MSS_RB.has(i));
  }
  // ucm: un solo foglio o pochi fogli sono quasi sempre documenti (pergamene, fogli sciolti)
  if (/\bpergamino \d+\)?$/i.test(v.t)) return false;
  const n = /^\s*\[?(\d+)\]?\s*(h|f|hojas|fol|p)\b/i.exec(v.e || "");
  if (n && +n[1] < 4) return false;
  return true;
}

export async function scansionaOmeka({ fonte, minuti = 10, soloCache = false } = {}) {
  const cfg = FONTI_OMEKA[fonte];
  const st = leggiStato(fonte);
  if (soloCache) return st;
  if (st.completato && !st.cursore && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log(fonte, `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} schede`); return st; }
  if (!st.cursore) st.cursore = { pagina: 1, voci: {} };
  else log(fonte, `riprendo dalla pagina ${st.cursore.pagina}`);
  const fine = Date.now() + minuti * 60e3;
  for (;;) {
    if (Date.now() > fine) { salvaStato(fonte, st); throw new Error(`raccolta incompleta (pagina ${st.cursore.pagina}): riprenderà alla prossima esecuzione`); }
    const q = new URLSearchParams({ ...cfg.query, per_page: String(PAGINA), page: String(st.cursore.pagina), sort_by: "id", sort_order: "asc" });
    const r = await scarica(`${cfg.sito}/api/items?${q}`, { timeout: 180000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`pagina ${st.cursore.pagina}: HTTP ${r.stato}`);
    const lista = JSON.parse(r.testo);
    for (const x of lista) { const c = compattaOmeka(x); if (c) st.cursore.voci[c.id] = c.v; }
    st.aggiornato = new Date().toISOString();
    if (lista.length < PAGINA) break;
    st.cursore.pagina++;
    salvaStato(fonte, st);
  }
  st.voci = st.cursore.voci; delete st.cursore;
  st.totale = Object.keys(st.voci).length;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(fonte, st);
  log(fonte, `fine: ${st.totale} schede`);
  return st;
}

// biblioteca e città della Real Biblioteca Digital: El Escorial se la segnatura è della RBME o il manifesto è «esc_…»
export function sedeRb(v) {
  const esc = /^RBME\b|^RBMECAT\b/i.test(v.s || "") || /\/esc_[^/]*$/.test(v.m || "");
  return esc ? { biblioteca: "Real Biblioteca del Monasterio de El Escorial", citta: "San Lorenzo de El Escorial" }
    : { biblioteca: "Real Biblioteca (Palacio Real)", citta: "Madrid" };
}

export function recordOmeka(fonte, st = leggiStato(fonte)) {
  const cfg = FONTI_OMEKA[fonte], out = [];
  for (const [id, v] of Object.entries(st.voci || {})) {
    if (!ammessaOmeka(fonte, v)) continue;
    let sede, manifest, pagina, licenza, segnatura = v.s || null;
    if (fonte === "realbiblioteca") {
      sede = sedeRb(v); manifest = v.m; pagina = `${cfg.sito}/s/realbiblioteca/item/${id}`;
      segnatura = segnatura ? segnatura.replace(/^RBME(CAT)?\s+/i, "") : null;
      licenza = `Patrimonio Nacional, ${sede.biblioteca}: uso libero con citazione «Patrimonio Nacional. ${sede.biblioteca}${segnatura ? ", " + segnatura : ""}»; riproduzione completa solo per collegamento al sito (rbdigital.realbiblioteca.es)`;
    } else {
      sede = { biblioteca: "Universidad Complutense de Madrid, Biblioteca Histórica Marqués de Valdecilla", citta: "Madrid" };
      manifest = `${cfg.sito}/iiif/2/${id}/manifest`; pagina = `${cfg.sito}/s/patrimonio/item/${id}`; licenza = v.r || "Universidad Complutense de Madrid";
    }
    out.push({ fonte, id: `${cfg.prefisso}-${id}`, citta: sede.citta, biblioteca: sede.biblioteca, segnatura: segnatura || `${cfg.prefisso} ${id}`, datazione: v.d || null,
      titolo: v.t, autori_fonte: v.a || [], collaboratori: v.k || [], descrizione: [v.e, v.c].filter(Boolean).join(" ; ").slice(0, 3000) || null,
      lingue: lingueDa(v.l || []), manifest, pagina, licenza });
  }
  return out;
}
