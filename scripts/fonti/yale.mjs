// Yale University Library (Beinecke e altre biblioteche di Yale): OAI-PMH di Digital Collections
// (collections.library.yale.edu/catalog/oai, formato oai_mods, 25 record per pagina, circa 200.000 record di ogni tipo).
// Gli insiemi sono solo per lingua: prima si leggono quelli delle lingue antiche e medievali, poi tutto, e si tengono i manoscritti (genere «Manuscripts» o segnatura «MS»/«MSS»,
// senza editore: i libri a stampa hanno l'editore), esclusi i papiri (in attesa di decisione, vedi docs/BIBLIOTECHE.md).
// Poi il filtro dei manoscritti librari (ammessaYale, applicato in raccolta e in costruzione): fuori archivi, corrispondenza, fotografie,
// carte personali e tutto quello che è datato dopo il 1800; senza data entrano solo le voci dei fondi di codici.
// Il robots.txt di Yale vieta ai programmi di raccolta /manifests/: i manifesti non si leggono mai, si ricavano dall'identificativo
// (collections.library.yale.edu/manifests/<oid>, CORS aperto) e li apre solo il browser di chi usa il catalogo.
// Lo stato (token di ripresa e manoscritti letti) è in data/yale.json: la prima raccolta (circa 8000 pagine) va a riprese
// e nel frattempo entrano i manoscritti già letti;
// poi, ogni 6 giorni, si leggono solo i record cambiati dall'ultima raccolta (from=).
import fs from "node:fs";
import { scarica, log, tag, records, token, totale } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/yale.json";
export const BASE = "https://collections.library.yale.edu/catalog/oai";
const GIORNI = 6;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => +a - +b).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, inizio: st.inizio || null, from: st.from || null,
    coda: st.coda || null, token: st.token || null, sospeso: st.sospeso || null, pagine: st.pagine || 0, totale: st.totale || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// record oai_mods -> { oid, v } (v = voce compatta, null se non è un manoscritto)
export function estraiYale(rec) {
  const oid = (/<identifier>oai:collections\.library\.yale\.edu:(\d+)<\/identifier>/.exec(rec) || [])[1];
  if (!oid) return null;
  if (/<header[^>]*status="deleted"/.test(rec)) return { oid, v: null };
  const generi = tag(rec, "mods:genre"), seg = tag(rec, "mods:classification")[0] || null;
  const ms = generi.some(g => /manuscript|codices|charters|cartular/i.test(g)) || /\bMSS?\b|^Osborn [a-z]+\d|^Takamiya|^Marston/i.test(seg || "");
  const stampa = tag(rec, "mods:publisher").length > 0 && !generi.some(g => /manuscript/i.test(g));
  const papiro = generi.some(g => /papyr|ostraca/i.test(g)) || /P\.\s?CtYBR|^P\.\s?Yale/i.test(seg || "");
  if (!ms || stampa || papiro) return { oid, v: null };
  const data = tag(rec, "mods:dateCreated")[0] || tag(rec, "mods:dateIssued")[0] || null;
  const note = tag(rec, "mods:note");
  const citazione = (/<mods:note type="preferred citation">([^<]*)</.exec(rec) || [])[1] || null;
  const titolo = tag(rec, "mods:title")[0] || null;
  const v = { s: seg, t: titolo, a: tag(rec, "mods:namePart").slice(0, 12), l: tag(rec, "mods:languageTerm"), d: data,
    b: citazione, g: generi.slice(0, 6) };
  const desc = [...tag(rec, "mods:abstract"), ...note.filter(n => n !== citazione && !/digitized|^On (parchment|paper)\.?$/i.test(n))].join(" ; ").slice(0, 1500);
  if (desc) v.c = desc;
  const anteprima = (/<mods:url access="preview"[^>]*xlink:href="([^"]*)"/.exec(rec) || [])[1];
  if (anteprima) v.p = anteprima.replace(/^https:\/\/collections\.library\.yale\.edu\/iiif\/2\//, "").replace(/\/full\/.*$/, "");
  // solo manoscritti librari medievali e della prima età moderna (vedi ammessaYale)
  if (!ammessaYale(v)) return { oid, v: null };
  return { oid, v };
}

/* raccolta a riprese: token salvato dopo ogni pagina */
// prima lettura: prima gli insiemi delle lingue antiche e medievali (poche centinaia di pagine: latino, greco, lingue orientali, volgari medievali),
// così i codici più richiesti entrano subito; poi tutti i record (anche quelli senza lingua), per non perdere nulla
export const PRIORITARI = ["Latin", "Greek, Ancient (to 1453)", "Greek", "Greek languages", "Hebrew", "Aramaic", "Syriac", "Coptic", "Arabic", "Judeo-Arabic", "Armenian", "Georgian",
  "Ethiopic", "Church Slavic", "Persian", "Turkish, Ottoman", "Turkish, Ottoman (1500-1928)", "English, Old (ca. 450-1100)", "English, Middle (1100-1500)",
  "French, Old (ca. 842-1300)", "French, Middle (ca. 1300-1600)", "French, Middle (ca.1400-1600)", "Provencal (to 1500)", "Provençal, Old (to 1500)",
  "German, Middle High (ca. 1050-1500)", "Dutch, Middle (ca. 1050-1350)", "Old Norse", "Icelandic", "Irish", "Welsh"];

export async function scansionaYale({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  // stato della prima versione (solo la lettura completa, già avviata): la si mette in coda dopo gli insiemi prioritari
  if (st.token && !st.coda && !st.completato) { st.coda = [...PRIORITARI.map(x => "language:" + x), ""]; st.sospeso = st.token; st.token = null; }
  if (!st.coda || !st.coda.length) {
    if (st.completato && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("yale", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} manoscritti`); return st; }
    // dopo la prima raccolta completa: solo i record cambiati dall'inizio della raccolta precedente
    st.from = st.completato ? (st.inizio || st.completato).slice(0, 19) + "Z" : null;
    st.coda = st.completato ? [""] : [...PRIORITARI.map(x => "language:" + x), ""];
    st.inizio = new Date().toISOString(); st.pagine = 0; st.token = null;
  } else log("yale", `riprendo: ${st.coda[0] || "tutti i record"}${st.coda[0] ? "" : ", pagina " + (st.pagine + 1)}`);
  const fine = ora + minuti * 60e3;
  while (st.coda.length) {
    const insieme = st.coda[0];
    if (!insieme && !st.token && st.sospeso) { st.token = st.sospeso; st.pagine = Math.round(+((/:(\d+)$/.exec(st.sospeso) || [0, 0])[1]) / 25); delete st.sospeso; }
    // tempo finito: si salva e si usano i manoscritti letti finora (come per la Bodleian); si riprende alla prossima esecuzione
    if (Date.now() > fine) { salvaStato(st); log("yale", `tempo esaurito (${insieme || "tutti i record, pagina " + st.pagine + " di circa " + Math.ceil((st.totale || 0) / 25)}): riprenderà alla prossima esecuzione`); return st; }
    const url = st.token ? `${BASE}?verb=ListRecords&resumptionToken=${encodeURIComponent(st.token)}`
      : `${BASE}?verb=ListRecords&metadataPrefix=oai_mods${insieme ? "&set=" + encodeURIComponent(insieme) : ""}${st.from ? "&from=" + encodeURIComponent(st.from) : ""}`;
    const r = await scarica(url, { timeout: 180000 });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    let prossimo = null;
    if (/<error code="(noRecordsMatch|badArgument)"/.test(r.testo)) prossimo = null;
    else if (/<error code="badResumptionToken"/.test(r.testo)) { log("yale", "token non valido: ricomincio l'insieme"); st.token = null; if (!insieme) st.pagine = 0; continue; }
    else if (/<error /.test(r.testo)) throw new Error("errore OAI: " + (/<error[^>]*>([^<]*)/.exec(r.testo) || [])[1]);
    else {
      for (const rec of records(r.testo)) { const x = estraiYale(rec); if (!x) continue; if (x.v) st.voci[x.oid] = x.v; else if (!insieme) delete st.voci[x.oid]; }
      prossimo = token(r.testo);
      if (!insieme) { st.pagine++; st.totale = totale(r.testo) || st.totale; if (st.pagine % 100 === 0) log("yale", `pagina ${st.pagine} di circa ${Math.ceil((st.totale || 0) / 25)}, ${Object.keys(st.voci).length} manoscritti`); }
    }
    st.token = prossimo; st.aggiornato = new Date().toISOString();
    if (!prossimo) { if (insieme) log("yale", `${insieme}: fatto (${Object.keys(st.voci).length} manoscritti finora)`); st.coda.shift(); }
    salvaStato(st);
  }
  st.coda = null; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("yale", `fine: ${Object.keys(st.voci).length} manoscritti`);
  return st;
}

/* filtro dei manoscritti librari */
// Regola del catalogo: entrano i manoscritti librari medievali e della prima età moderna (codici, frammenti, rotoli, manoscritti orientali);
// restano fuori archivi, corrispondenza, fotografie, carte personali e documenti dopo il 1800. A Yale l'OAI dà come «Manuscripts»
// anche le carte dei fondi d'archivio (GEN MSS, YCAL, WA, JWJ, OSB MSS, MS <numero> di Manuscripts and Archives...), quasi sempre
// senza data («n.d.») o del Novecento: qui si tengono fuori.

// anni ricavabili da una datazione: «1450-1500», «[ca. 1460]», «[14--]», «176-?», «s. XV», «Early 9th century», «[before 1395]», «c1980»;
// con titolo = true (data presa dal titolo) solo anni di quattro cifre e secoli, perché nei titoli ci sono altri numeri
const ROMANI = { I: 1, V: 5, X: 10, L: 50 };
const romano = r => [...r.toUpperCase()].reduce((t, c, i, a) => t + (ROMANI[c] < (ROMANI[a[i + 1]] || 0) ? -ROMANI[c] : ROMANI[c]), 0);
export function anniDa(d, { titolo = false } = {}) {
  const s = String(d || ""), anni = [];
  for (const m of s.matchAll(/(\d{1,2})(?:st|nd|rd|th)(?:[\s-]+(?:or\s+|and\s+)?\d{1,2}(?:st|nd|rd|th))?\s*(?:cent|c\.|Jh|sec|siècle)/gi)) {
    const tutti = [...m[0].matchAll(/(\d{1,2})(?:st|nd|rd|th)/gi)].map(x => +x[1]);
    anni.push((Math.min(...tutti) - 1) * 100 + 1, Math.max(...tutti) * 100);   // il XIX secolo comincia nel 1801
  }
  for (const m of s.matchAll(/\b(?:s|saec|sec|sæc)\.\s*([IVXL]{1,6})\b|\b([IVXL]{1,6})(?:th|e)?\s+(?:cent|siècle|secolo)/g)) {
    const n = romano(m[1] || m[2]); if (n >= 1 && n <= 21) anni.push((n - 1) * 100 + 1, n * 100);
  }
  // «14--», «15--?», «176-», «16uu»: secolo o decennio
  for (const m of s.matchAll(/(?<!\d)(1\d)(?:--|uu)(?!\d)/g)) anni.push(+m[1] * 100, +m[1] * 100 + 99);
  for (const m of s.matchAll(/(?<!\d)(1\d{2})(?:-|u)(?![\d-])/g)) anni.push(+m[1] * 10, +m[1] * 10 + 9);
  const re = titolo ? /(?<!\d)(1\d{3}|20\d{2})(?!\d)/g : /(?<![\d\/])(\d{3,4})(?!\d)/g;
  for (const m of s.matchAll(re)) { const n = +m[1]; if (n >= 300 && n <= 2099) anni.push(n); }
  return anni;
}
export function primoAnno(d) { const a = anniDa(d); return a.length ? Math.min(...a) : null; }

// fondi di codici: le voci senza data sono ammesse (codici e frammenti medievali, manoscritti orientali, raccolte Osborn rilegate)
export const FONDI_CODICI = /^(?:Beinecke MS|Marston MS|Takamiya MS|Mellon MS|Landberg MSS|(?:Arabic|Persian|Hebrew|Turkish|Syriac|Coptic|Ethiopic|Armenian|Georgian|Greek|Latin|Sanskrit|Indic|Malay|Javanese|Batak|Burmese|Siamese|Pali|Tibet) MSS|Hartford Seminary \w+ MSS|Music Deposit|Manuscript Arabic)\b|^Osborn (?:[a-g]|f[a-g])\s?\d/;
// fondi d'archivio e di stampe: dentro solo i veri manoscritti librari, datati tutti entro il 1800
export const FONDI_ARCHIVIO = /^(?:YCAL|WA|JWJ|LWL|GEN|OSB|YCGL|YAJ|Uncat|BrSides|MS \d|MSS \d|Ms Coll|MS Coll|Folio|Quarto|\d{4} (?:Folio|Quarto|\+|\d))|^(?:Folio|Quarto) LWL/i;
// lettere singole (sempre fuori, in ogni fondo): sigle dei cataloghi angloamericani (ALS, LS, TLS...), «Letter to...», «Norton Nicholls to Jane Floyer Nicholls. Eton.»
const LETTERA_SINGOLA = /^\[?(?:\d+|two|three|four|five|six|seven|eight|nine|ten)?\s*(?:autograph |love |signet )?letters?\b(?! patent)(?!.*\b(?:and|treatises?|orations?|collection|book|epistolae)\b)|^(?:carta|lettera|lettre)\s+(?:al|a|à|to)\b|\bautograph letter\b|^(?:[A-Z][\w'’()-]*\.?\s){2,6}to (?:[A-Z][\w'’().,-]*\s?){1,8}\.\s/i;
// parole d'archivio nel titolo
const SIGLE_LETTERE = /(?:^|[\s\[(;,])(?:ALS|TLS|ANS|AL|LS|AMS|AMsS|ADS|DS|TL|AN|A\.L\.S\.|L\.S\.|T\.L\.S\.)(?=[\s,.:;)\]]|$)/;
const TITOLO_MODERNO = /\b(?:photo(?:graph)?s?|photographic|photograph(?:ed|er)|snapshots?|negatives?|typescripts?|carbon cop|scrap ?books?|clippings?|post ?cards?|posters?|telegrams?|facsimiles?|faksimile|reproductions?|microfilms?|recordings?|interviews?|research by|newspapers?|gazette|broadsides?|paper money|banknotes?|tankas?|thangkas?|silhouettes?|engravings?|etchings?|lithographs?|woodcuts?|wood ?blocks?|ketubb?ah?s?|plaques?)\b/i;
const TITOLO_ARCHIVIO = /\b(?:correspondence|letters?|autograph (?:letter|note)|papers|notes (?:on|for|about|to|by)|memorand(?:um|a)|receipts?|invoices?|bills? of|deeds?|indentures?|certificates?|passports?|invitations?|programs?|programmes?|menus?|tickets?|ephemera|diary|diaries|account ?books?|accounts|inventor(?:y|ies)|warrants?|power of attorney|bonds?|documents?|sketch(?:es|book)?|watercolou?rs?|portraits?|drawings?|interior|exterior|recipes?|speech(?:es)?|minutes|petitions?|commissions?|wills?|leases?)\b/i;
// generi d'archivio e di stampe
const GENERI_MODERNI = /^(?:Photograph|Photographic|Photos|Typescripts|Scrapbooks|Clippings|Postcards|Posters|Facsimiles|Microfilm|Engravings|Etchings|Lithographs|Woodcuts|Wood blocks|Prints|Portrait prints|Newspapers|Broadsides|Paper money|Letterheads|Ephemera|Incunabula|Paintings|Door knockers|Realia|Studio portraits|Ketubahs)/i;
const GENERI_ARCHIVIO = /^(?:Correspondence|Letters|Diaries|Account books|Accounts|Receipts|Business records|Certificates|Bonds|Inventories|Legal documents|Deeds|Military records|Archives|Telegrams|Invitations|Programs)/i;
// generi che fuori dai fondi di codici indicano fogli sciolti (disegni, ritratti, carte geografiche, spartiti)
const GENERI_FOGLI = /^(?:Sketches|Drawings|Portraits|Pictorial works|Maps|Manuscript maps|Portolan charts|Sheet music|Cartographic)/i;
// segnali di manoscritto librario: generi di Yale per i codici medievali, rinascimentali e orientali
const GENERI_LIBRARI = /^(?:Manuscripts, (?:Medieval|Renaissance|Arabic|Persian|Turkish|Hebrew|Syriac|Armenian|Ethiopic|Coptic|Greek|Latin)|Medieval and Renaissance Manuscript|Codices|Books of hours|Psalters|Breviaries|Missals|Antiphonaries|Graduals|Bibles|Sammelbands|Commonplace books|Arabic manuscripts|Persian manuscripts|Illuminated manuscripts)/i;
const TITOLO_LIBRARIO = /\b(?:codex|codices|zibaldone|commonplace book|book of hours|breviar\w*|psalter\w*|missal\w*|antiphon\w*|horae|florilegium|miscellany|poetical works|manuscript volume)\b/i;

// motivo per cui una voce resta fuori (null = ammessa)
export function motivoYale(v) {
  if (!v) return "vuota";
  const s = v.s || "", t = v.t || "", g = v.g || [];
  const codici = FONDI_CODICI.test(s), archivio = !codici && FONDI_ARCHIVIO.test(s);
  if (TITOLO_MODERNO.test(t) || g.some(x => GENERI_MODERNI.test(x))) return "fotografie, stampe e materiali moderni";
  if (SIGLE_LETTERE.test(t) || LETTERA_SINGOLA.test(t)) return "archivio, corrispondenza, carte personali";
  if (/\b(?:Tanka|Paper money)\b/i.test(g.join(" "))) return "fotografie, stampe e materiali moderni";
  // data: dalla datazione, altrimenti dal titolo («Commonplace book, [1599-1608]», «Kitāb ... / 1737»)
  let anni = anniDa(v.d);
  if (!anni.length) anni = anniDa(t, { titolo: true });
  const primo = anni.length ? Math.min(...anni) : null, ultimo = anni.length ? Math.max(...anni) : null;
  if (primo != null && primo > 1800) return "dopo il 1800";
  const librario = g.some(x => GENERI_LIBRARI.test(x));
  const lettere = SIGLE_LETTERE.test(t) || /\b(?:letters?|correspondence|papers)\b/i.test(t) || g.some(x => /^(?:Correspondence|Letters)/i.test(x));
  const carte = lettere || TITOLO_ARCHIVIO.test(t) || g.some(x => GENERI_ARCHIVIO.test(x));
  if (codici) {
    // fondi di codici: entrano anche i documenti e gli epistolari medievali e della prima età moderna, se datati tutti entro il 1800,
    // ma le lettere sciolte solo se Yale le cataloga tra i manoscritti medievali, rinascimentali o orientali
    if (carte && !(primo != null && ultimo <= 1800 && (librario || !lettere))) return "archivio, corrispondenza, carte personali";
    return null;
  }
  // fuori dai fondi di codici: carte d'archivio fuori, tranne i codici che Yale cataloga tra i manoscritti medievali e rinascimentali
  // (per esempio un epistolario umanistico miniato), datati tutti entro il 1800
  if (carte && !(librario && primo != null && ultimo <= 1800)) return "archivio, corrispondenza, carte personali";
  if (g.some(x => GENERI_FOGLI.test(x))) return "fogli sciolti: disegni, ritratti, carte geografiche, musica";
  if (archivio) {
    if (primo == null) return "fondo d'archivio, senza data";
    if (ultimo > 1800) return "fondo d'archivio, carte anche dopo il 1800";
    if (!librario && !TITOLO_LIBRARIO.test(t)) return "fondo d'archivio, non un manoscritto librario";
    return null;
  }
  // senza data: solo i frammenti e codici che Yale cataloga tra i manoscritti medievali e rinascimentali (per esempio i frammenti «Zi»)
  if (primo == null && !g.some(x => /^(?:Manuscripts, (?:Medieval|Renaissance)|Medieval and Renaissance Manuscript)/i.test(x))) return "senza data, fuori dai fondi di codici";
  return null;
}
export const ammessaYale = v => motivoYale(v) == null;

export function recordYale(st = leggiStato()) {
  const out = [];
  for (const [oid, v] of Object.entries(st.voci || {})) {
    if (!ammessaYale(v)) continue;
    out.push({ fonte: "yale", id: "yale-" + oid, citta: "New Haven", biblioteca: v.b || "Yale University Library", segnatura: v.s ? v.s.replace(/^(.*\bMSS? [\w.]+) 1$/, "$1") : "oid " + oid, datazione: v.d, titolo: v.t,
      autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []),
      manifest: `https://collections.library.yale.edu/manifests/${oid}`, pagina: `https://collections.library.yale.edu/catalog/${oid}`,
      licenza: "Yale University Library: condizioni d'uso nella pagina del codice" });
  }
  return out;
}
