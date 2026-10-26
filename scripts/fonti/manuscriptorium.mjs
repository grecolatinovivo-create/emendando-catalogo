// Manuscriptorium (www.manuscriptorium.com), la biblioteca digitale internazionale dei manoscritti gestita dalla Národní knihovna
// České republiky (Praga): codici della Biblioteca nazionale ceca e di molte altre biblioteche (Breslavia, Toruń, Lituania, Madrid
// Patrimonio Nacional e altre), insieme a stampati antichi e a copie di altre biblioteche digitali.
// Elenco: la ricerca Solr che usa il sito (/castor/manuscriptorium/search/solrSearch, JSON, 100 schede per richiesta; robots.txt
// senza limiti per queste pagine), sulle schede con la copia digitale («Popisný záznam s digitalizátem») senza editore (dcPublisher:
// i libri a stampa lo hanno) e senza i soggetti «Staré tisky» e «Tisky 19. století» (stampati), circa 52.000 schede; pausa di 1,5 secondi.
// Manifesti IIIF dalla scheda (iiifManifest, su collectiones.manuscriptorium.com); manifesti e immagini (imagines.manuscriptorium.com)
// con CORS aperto (prova del 26 ottobre 2026, dal browser per le immagini). I manifesti non si leggono dal server.
// Poi un filtro (motivoManuscriptorium) tiene solo i manoscritti librari, di ogni data: fuori le copie di biblioteche già nel
// catalogo per altre vie (Heidelberg, handrit.is, e-codices, Wolfenbüttel e le altre: manifesto su un altro dominio o biblioteca
// nell'elenco GIA_NEL_CATALOGO), carte geografiche e atlanti, lettere, e gli stampati riconoscibili dalla segnatura
// (Národní knihovna: si tengono le segnature dei manoscritti, in numeri romani come «XXIII.A.1»; Toruń: solo «Rps»).
// Lo stato è in data/manuscriptorium.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/manuscriptorium.json";
export const SITO = "https://www.manuscriptorium.com";
export const API = `${SITO}/castor/manuscriptorium/search/solrSearch`;
export const QUERY = 'recContent:"Popisný záznam s digitalizátem" AND NOT dcPublisher:* AND NOT dcSubject:"Staré tisky" AND NOT dcSubject:"Tisky 19. století"';
const PAGINA = 100, GIORNI = 6;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore ?? null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"nuove":' + JSON.stringify(st.nuove || null) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const uno = x => (Array.isArray(x) ? x[0] : x) ?? null;
const anno = s => { const m = /\b(\d{4})\b/.exec(String(s || "")); return m ? +m[1] : null; };
// scheda della ricerca -> voce compatta (null senza manifesto)
export function compattaManuscriptorium(r) {
  const m = uno(r.iiifManifest); if (!m) return null;
  const da = anno(uno(r.origDateFrom)), a = anno(uno(r.origDateTo));
  const v = { s: uno(r.mnsIdno) || uno(r.idno) || null, t: uno(r.dcTitle) || null, c: r.mnsIdSettlement || null, b: r.mnsIdRepository || uno(r.dcSource) || null,
    p: r.profile || null, d: (r.dcDate || []).filter(x => x && x !== "undefined").join(" ; ") || (da ? (a && a !== da ? `${da}-${a - 1 > da ? a - 1 : a}` : String(da)) : null),
    l: r.dcLanguage_en || r.dcLanguage || [], a: r.dcCreator || [], k: (r.dcSubject || []).slice(0, 12), m, r: r.copyright || null, g: r.genDocId || null };
  for (const k of ["l", "a", "k"]) if (!v[k].length) delete v[k];
  for (const k of Object.keys(v)) if (v[k] == null) delete v[k];
  return v;
}

/* raccolta a riprese: cursore = posizione della prossima scheda; stato salvato dopo ogni pagina */
export async function scansionaManuscriptorium({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now(), fine = ora + minuti * 60e3;
  if (st.completato && st.cursore == null && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("manuscriptorium", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} schede`); return st; }
  if (st.cursore == null) { st.cursore = 0; st.nuove = {}; } else log("manuscriptorium", `riprendo dalla scheda ${st.cursore}`);
  st.nuove = st.nuove || {};
  for (;;) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (scheda ${st.cursore} di ${st.totale}): riprenderà alla prossima esecuzione`); }
    // ordinamento stabile (identificativo), perché le pagine non si sovrappongano
    const url = `${API}?coreId=manuscriptorium&rows=${PAGINA}&start=${st.cursore}&fields=&sort=${encodeURIComponent("ID asc")}&query=${encodeURIComponent(QUERY)}`;
    const r = await scarica(url, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    const d = (JSON.parse(r.testo).response || {}).result || {};
    st.totale = d.found || st.totale;
    const rs = d.recordList || [];
    for (const x of rs) { const v = compattaManuscriptorium(x); if (v && x.ID) st.nuove[x.ID] = v; }
    st.cursore += PAGINA; st.aggiornato = new Date().toISOString();
    if (!rs.length || st.cursore >= st.totale) break;
    salvaStato(st);
  }
  st.voci = st.nuove; st.nuove = null; st.cursore = null;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("manuscriptorium", `fine: ${Object.keys(st.voci).length} schede su ${st.totale}`);
  return st;
}

// biblioteche già nel catalogo per altre vie (le loro copie in Manuscriptorium restano fuori; Complutense e Patrimonio Nacional
// dalla corsia iberia, Nazionale Centrale di Firenze e Österreichische Nationalbibliothek da fonti proprie)
export const GIA_NEL_CATALOGO = /Heidelberg|Handritasafn|Handritasvið|Landsbókasafn|Árna Magnússonar|Arnamagn|e-codices|Herzog August|Wolfenbüttel|Bayerische Staatsbibliothek|Staatsbibliothek zu Berlin|Bodleian|Vaticana|Leipzig|Laurenziana|Kantons|Stiftsbibliothek St\. Gallen|Einsiedeln|Bodmer|Biblioteka Narodowa|Jagiello|Darmstadt|Tübingen|Dresden|Frankfurt|Complutense|Patrimonio Nacional|Real Biblioteca|Nazionale Centrale di Firenze|Bibl\. Nazionale Centrale|Österreichische Nationalbibliothek/i;
// fondi d'archivio (carte e documenti, non codici)
const ARCHIVI = /\bArchiv\b(?!,\s*knihovna)|Diözesanarchiv|\bAchiv\b|Literární archív|Archiwum|Archivo|Arquivo|Archives?\b/i;
const CARTE = /\b(Mapy|Kartografia|Atlas[ey]?|Plany?|Widoki|Pocztówki|Fotografie|Listy|Korespondencja|Dokumenty|Akta)\b/i;
const LETTERE = /^(\[?Brief|\[?Karte von|\[?Postkarte|\[?Dopis|\[?List\b|\[?Listy\b|\[?Letter|\[?Lettera|\[?Lettere|\[?Copia di (una|due|tre)? ?letter|\[?Carta\b|\[?Carte\b|\[?Mapa\b|\[?Map of|\[?A new (and correct )?map|\[?Plan de|\[?Plan der|\[?Plan of|\[?Panorama|\[?Pianta|\[?Veduta|\[?Ansicht)/i;
const CARTE_SEGNATURA = /Cart\.?\s*geog|Carte\s*mil|Piante\b|Mappe\b|\bMapy\b|Kartograf/i;
const KARTE = /\b(Karte|Landkarte|Special-Karte|map|mapa|carta geografica|carte géographique)\b/i;

export function motivoManuscriptorium(v) {
  if (!v || !v.m) return "senza manifesto";
  if (!/^https:\/\/collectiones\.manuscriptorium\.com\//.test(v.m)) return "copia di un'altra biblioteca digitale";
  if (GIA_NEL_CATALOGO.test([v.b, v.p].join(" "))) return "biblioteca già nel catalogo per altre vie";
  if (ARCHIVI.test(v.b || "")) return "fondi d'archivio";
  if ((v.k || []).some(k => CARTE.test(k))) return "carte geografiche, lettere o documenti";
  if (LETTERE.test(v.t || "") || CARTE_SEGNATURA.test(v.s || "") || KARTE.test(v.t || "")) return "carte geografiche, lettere o documenti";
  const s = String(v.s || "").trim();
  // giornali e periodici a stampa (es. «газета 1», the newspaper «Kazak», Biblioteca nazionale del Kazakhstan)
  if (/\bnewspaper|газета|\bperiodical|\bZeitung\b|\bgazeta\b/i.test([v.t, s].join(" "))) return "giornali e periodici";
  if (/Národní knihovna České republiky/.test(v.b || "") && !/^[IVXL]+\s*\.?\s*[A-Z]\s*\.?\s*\d/.test(s)) return "stampati (segnatura della Biblioteca nazionale ceca)";
  if (/Toruniu/.test(v.b || "") && !/^Rps\b/i.test(s)) return "stampati (segnatura di Toruń)";
  // Biblioteca Nazionale Centrale di Firenze: in Manuscriptorium anche stampati (collocazioni numeriche come «MAGL.1.6.333», «PALAT.10.5.2.36»,
  // «RARI.», miscellanee) e carteggi (fondo Rinuccini); si tengono le segnature dei manoscritti («Magl. VII 1234», «Gal. 176», «II.I.123»)
  if (/Firenze/i.test([v.b, v.c].join(" ")) && (/^[A-Z]+\.\d|^\d|\d+\.\d+\.\d+|^A\.I\.\d|^RARI\b|Misc\.|^Rinuccini|^PALAT\.Cart/i.test(s) || /^Carteggio\b/i.test(v.t || ""))) return "stampati o carteggi (segnatura della Nazionale di Firenze)";
  // Biblioteca Nacional de Portugal: fuori i documenti sciolti dei «maços» («MSS. 208, n. 73, doc. 9») e l'archivio Tarouca («A.T./L.»)
  if (/Portugal/.test(v.b || "") && /\bdoc\.|^A\.T\.\//.test(s)) return "documenti d'archivio";
  // Vilnius: la Biblioteca universitaria (lettere e atti dei Radziwiłł, ritratti a stampa del 1758) e il reparto dei libri rari e dei
  // manoscritti della Biblioteca nazionale (testamenti, sentenze, lettere: fondi F93, F101, F103, F130) danno carte d'archivio e stampe;
  // restano i codici della Biblioteca Wróblewski dell'Accademia delle scienze (LMAB)
  if (/Vilniaus Universiteto|Retų knygų/.test(v.b || "")) return "carte d'archivio e stampe (Vilnius)";
  return null;
}
export const ammessaManuscriptorium = v => !motivoManuscriptorium(v);

// città: quella della scheda; le grafie ceche delle città straniere si correggono
const CITTA = { "Wroclav": "Breslavia", "Wrocław": "Breslavia", "Praha": "Praga", "Prague": "Praga", "Lisboa": "Lisbona", "Bucuresti": "Bucarest", "Bucharest": "Bucarest",
  "Alba-Iulia": "Alba Iulia", "Ljubljana": "Lubiana", "Београд": "Belgrado", "Алма-Ата": "Almaty", "Пловдив": "Plovdiv", "Stockholm": "Stoccolma", "cologne": "Colonia",
  "Wien": "Vienna", "Kynžvart": "Lázně Kynžvart", "depozitář Zlatá Koruna": "Zlatá Koruna", "Niederlande": null, "Washington, D.C.": "Washington, D.C." };
// «Praha (Prague)», «Brno, Smetanova 14», «Niederösterreich (St. Pölten)»: si tiene il nome della città; i luoghi incerti («?») restano senza città
export function cittaManuscriptorium(c) {
  let s = String(c || "").trim(); if (!s || s.includes("?")) return null;
  if (Object.prototype.hasOwnProperty.call(CITTA, s)) return CITTA[s];
  const no = /^Niederösterreich\b/.exec(s); if (no) { const m = /St\. Pölten|Wien|Klosterneuburg/.exec(s); s = m ? m[0] : ""; }
  s = s.split(",")[0].replace(/\s*\(.*$/, "").trim(); if (!s) return null;
  return Object.prototype.hasOwnProperty.call(CITTA, s) ? CITTA[s] : s;
}
export function recordManuscriptorium(st = leggiStato()) {
  // un manifesto entra una volta sola (più schede, per esempio le parti di un codice o le schede ceca e inglese, rimandano alla stessa
  // copia digitale): resta la prima in ordine di id; lo stesso per gli id del catalogo
  const visti = new Set(), idVisti = new Set(), idc = id => "mns-" + id.replace(/-(cs|en)$/, "").toLowerCase();
  return Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b))
    .filter(([id, v]) => ammessaManuscriptorium(v) && !visti.has(v.m) && !idVisti.has(idc(id)) && visti.add(v.m) && idVisti.add(idc(id))).map(([id, v]) => ({
    fonte: "manuscriptorium", id: "mns-" + id.replace(/-(cs|en)$/, "").toLowerCase(), citta: cittaManuscriptorium(v.c), biblioteca: v.b || v.p || "Manuscriptorium",
    segnatura: v.s || id, datazione: v.d && !/undefined/.test(v.d) ? v.d : null, titolo: v.t || null, autori_fonte: v.a || [], descrizione: (v.k || []).join(" ; ") || null, lingue: lingueDa(v.l || []),
    manifest: v.m, pagina: `${SITO}/apps/index.php?direct=record&pid=${encodeURIComponent(id)}`, licenza: v.r || "Manuscriptorium" }));
}
