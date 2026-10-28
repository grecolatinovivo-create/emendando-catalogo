// Musei (dal 28 ottobre 2026): oggetti scritti dei musei con foto che si aprono nel visore di Emendando, e modelli 3D di oggetti scritti
// (docs/EPIGRAFI.md, sezioni «Museo Egizio di Torino» e «Modelli 3D»). Nel catalogo sono la fonte «musei» (id «mu-…»):
//   egizio     Museo Egizio, Torino (collezioni.museoegizio.it): l'elenco degli oggetti dalla sitemap (permessa dal robots.txt, che vieta solo
//              /xml/, /js/, /libs/ e /Error.aspx), poi la scheda italiana di ogni oggetto, una volta sola, a una richiesta ogni 1,5 secondi
//              (nessun Crawl-delay dichiarato). Entrano solo gli oggetti con scrittura: papiri (tipo «papiro»), stele, ostraka, tavolette,
//              sarcofagi, statue e oggetti iscritti (tipo «epigrafe», con il supporto). Immagini dichiarate dal museo CC0, servite con CORS
//              aperto: manifesti scritti dal catalogo con le immagini «_full» (misure dai primi 64 KB di ogni JPEG).
//   sketchfab  Modelli 3D di oggetti scritti antichi e medievali (API pubblica api.sketchfab.com/v3/search, che il robots.txt non vieta),
//              solo da account di musei, università e progetti seri (ACCOUNT) e per parole chiave (PAROLE); entra solo un modello pubblico
//              il cui incorporamento è consentito (oEmbed di sketchfab.com con l'iframe ufficiale). Il modello si collega alla voce che il
//              catalogo ha già per lo stesso oggetto (Museo Egizio: stesso inventario; EDH: stesso numero HD o stessa edizione CIL, AE,
//              RIB); altrimenti è una voce nuova, con l'anteprima di Sketchfab come immagine del manifesto scritto dal catalogo.
//              Ogni voce con modello ha «modello3d»: { sketchfab: uid, licenza, autore, url }.
//   tpop       Museo Egizio, Turin Papyrus Online Platform (collezionepapiri.museoegizio.it): i circa 130 papiri pubblici, senza registrazione
//              (il database completo TPOP chiede l'accesso e il vecchio papyri.museoegizio.it è vietato dal robots.txt: non si usano).
//              Il server non raggiunge il sito: l'elenco è letto dal browser e salvato in data/musei-tpop.json (FILE_TPOP); foto CC0
//              (pagina «Politica di accesso e utilizzo»), JPEG interi con CORS aperto; manifesti scritti dal catalogo. Un papiro che c'è
//              anche nella collezione online (stesso inventario) resta solo nella voce TPOP.
// Stato in data/musei.json (una voce per riga): ogni elenco si rilegge ogni GIORNI giorni, ogni oggetto una volta sola.
import fs from "node:fs";
import { scarica, scaricaByte, log } from "../rete.mjs";
import { misureJpeg, RAW, manifestoEpigrafe } from "./epigrafi.mjs";
import { leggiEdh } from "../epigrafi-edh.mjs";
import { dataItaliana, secoloDa } from "./papiri.mjs";

export const FILE_STATO = "data/musei.json", FILE_TPOP = "data/musei-tpop.json";
export const TPOP = "https://collezionepapiri.museoegizio.it";
export function leggiTpop(file = FILE_TPOP) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { voci: {} }; } }
const VERSIONE = 1, GIORNI = 30;
export const PARTI = ["sketchfab", "egizio"];
export const EGIZIO = "https://collezioni.museoegizio.it";
const SF = "https://api.sketchfab.com/v3", TUTTI_PAGINE = 40;

// ------------------------------------------------------------------------------------------------ stato
export function leggiStato(file = FILE_STATO) {
  try { const s = JSON.parse(fs.readFileSync(file, "utf8")); if (s.versione === VERSIONE) return s; } catch (e) {}
  return { versione: VERSIONE, parti: {}, voci: {} };
}
export function salvaStato(st, file = FILE_STATO) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: VERSIONE, aggiornato: st.aggiornato || null, completato: st.completato || null, parti: st.parti || {} });
  fs.writeFileSync(file + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(file + ".tmp", file);
}
const pulisci = v => { for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k]; return v; };
const fresca = p => p && p.completato && Date.now() - Date.parse(p.completato) < GIORNI * 864e5;
class TempoFinito extends Error {}
const breve = (s, n = 200) => { s = String(s || "").replace(/\s+/g, " ").trim(); if (s.length <= n) return s || null; const p = s.slice(0, n).lastIndexOf(" "); return s.slice(0, p > 80 ? p : n) + "…"; };
const ent = s => String(s || "").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const testo = h => ent(String(h || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// ------------------------------------------------------------------------------------------------ Museo Egizio: scheda
// id della sitemap («Cat_1374», «S_1277», «Provv_199») -> id della voce
export const idEgizio = id => "mu-egizio-" + String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// inventario («Cat. 1374», «C.1587», «S. 13115», «Provv. 199») -> chiave per i collegamenti
export const chiaveInv = s => { const m = /\b(Cat|C|S|Provv|Suppl)\.?\s*(\d+)(?:\s*\/\s*(\d+))?/i.exec(String(s || "")); if (!m) return null; const p = { cat: "cat", c: "cat", s: "s", provv: "provv", suppl: "suppl" }[m[1].toLowerCase()]; return p + "-" + m[2] + (m[3] ? "/" + +m[3] : ""); };
export function schedaEgizio(html) {
  const s = String(html || "");
  const t = testo((/<h1>([\s\S]*?)<\/h1>/.exec(s) || [])[1]);
  const campi = {};
  for (const m of s.matchAll(/<label[^>]*>([^<]*?):<\/label>\s*<\/div>\s*<div class="col-lg-9">\s*<(span|div) class="value">([\s\S]*?)<\/\2>/g)) campi[testo(m[1])] = testo(m[3]);
  const gi = /<div class="general-info">([\s\S]*?)<\/div>\s*<\/div>/.exec(s);
  const galleria = (/<div class="owl-carousel owl-theme gallery-object">([\s\S]*?)<div class="row">\s*<div class="col-lg-12">/.exec(s) || [])[1] || "";
  const img = [...new Set([...galleria.matchAll(/\/public\/objects\/images\/([A-Za-z0-9_]+)_big\.jpg/g)].map(m => m[1]))];
  const c = k => campi[k] || null;
  return pulisci({ t: t || null, inv: c("Nr. inv."), mat: c("Materiale"), dim: c("Dimensioni"), dat: c("Datazione"), per: c("Periodo"), din: c("Dinastia"), reg: c("Regno"),
    pro: c("Provenienza"), acq: c("Acquisizione"), d: breve(gi ? testo(gi[1]) : "", 700), img });
}
// datazione del museo («1482–1480 a.C.», «30 a.C. – 395 d.C.», «664 a.C.») -> [da, a] (anni negativi prima di Cristo)
export function anniEgizio(s) {
  const t = String(s || "").replace(/[–—]/g, "-");
  const m = /(\d+)\s*(a\.C\.|d\.C\.)?\s*(?:-\s*(\d+)\s*(a\.C\.|d\.C\.)?)?/.exec(t); if (!m) return null;
  const e2 = m[4] || m[2] || "d.C.", e1 = m[2] || (m[3] ? e2 : e2);
  const a = +m[1] * (e1 === "a.C." ? -1 : 1), b = m[3] ? +m[3] * (e2 === "a.C." ? -1 : 1) : a;
  return a <= b ? [a, b] : [b, a];
}
// scrittura dal titolo e dalla descrizione
export function scritturaEgizio(v) {
  const x = [v.t, v.d].join(" ");
  const sc = [];
  if (/geroglific/i.test(x)) sc.push("geroglifico");
  if (/ieratic/i.test(x)) sc.push("ieratico");
  if (/demotic/i.test(x)) sc.push("demotico");
  if (/\bcopt[oaie]\b|in copto/i.test(x)) sc.push("copto");
  if (/\b(?:in|iscrizione|testo|lettera|epigrafe|papiro|scritt[oa]) grec[oa]|\bgreco\b(?! -?romano)|lingua greca/i.test(x)) sc.push("greco");
  if (/\blatin[oa]\b/i.test(x)) sc.push("latino");
  if (/aramaic/i.test(x)) sc.push("aramaico");
  if (/\barab[oa]\b/i.test(x)) sc.push("arabo");
  return sc;
}
const LINGUA_SCRITTURA = { geroglifico: "egy", ieratico: "egy", demotico: "egy", copto: "cop", greco: "grc", latino: "la", aramaico: "arc", arabo: "ar" };
// dèi e animali: un titolo «Statuetta di Osiride» non dice che ci sia un'iscrizione
const DEI = /^(?:il dio |la dea )?(?:Osiride|Iside|Horo|Harpocrate|Arpocrate|Amon|Amon-Ra|Ra|Anubi|Bastet|Sekhmet|Thot|Ptah|Ptah-Sokar-Osiride|Hathor|Bes|Apis|Nefertum|Neith|Maat|Khonsu|Mut|Min|Sobek|Taweret|Thoeris|Serapide|Shu|Tefnut|Nut|Geb|Nefti|Neftis|Seth|Khnum|Atum|Aton|Wadjet|Nekhbet|Hapi|Duamutef|Qebehsenuf|Imseti|Amset|Pataikos|Uadjet|Mahes|Onuris|Satet|Anuket|Renenutet|Meretseger)\b/;
// tipo dell'oggetto: «papiro», «epigrafe» (con il supporto) oppure null (senza scrittura o in dubbio: fuori)
export function classeEgizio(v) {
  const t = String(v.t || ""), d = String(v.d || ""), mat = String(v.mat || ""), x = t + " ; " + d;
  if (/papir/i.test(mat) || /^(?:frammento di |frammenti di )?papir/i.test(t) || /\bpapiro\b/i.test(t)) return { tipo: "papiro" };
  if (/ostrak|ostrac/i.test(x)) return { tipo: "epigrafe", supporto: "ostrakon" };
  if (/\btavolett[ae]\b/i.test(t) && !/\b(?:per (?:il )?trucco|da trucco|cosmetic)/i.test(t)) return { tipo: "epigrafe", supporto: "tavoletta" };
  if (/\bstel[ae]\b|\bstela\b/i.test(t)) return { tipo: "epigrafe", supporto: "stele" };
  if (/etichetta di mummia/i.test(t)) return { tipo: "epigrafe", supporto: "etichetta di mummia" };
  if (/cono funerario/i.test(t)) return { tipo: "epigrafe", supporto: "cono funerario" };
  // scrittura dichiarata nel titolo o nella descrizione
  const scritto = /\biscri[tz]|\biscritt|\bgeroglifi|\bieratic|\bdemotic|\bcartigli|\btitolatura|libro dei morti|\bformula d.offerta|\bformula di offerta|\bcon (?:il )?(?:nome|testo)|\btesto\b|\bscritt[oa]\b|\bepigrafe|\bleggenda\b|statua magica|cippo di Horo|stele di Horo/i.test(x);
  // titolo con il nome di una persona («Sarcofago di Butehamon», «Ushabti di Pakep», «Statua di Amenhotep II»): il nome viene dall'iscrizione
  const nome = /\b(?:di|del|della|dello)\s+(?:(?:sacerdote|scriba|dama|signora|regina|re|faraone|principe|principessa|visir|cantatrice|capo|sovrintendente|nobile|padre divino|dignitario)\s+)?([A-Z][a-zà-ÿ'’-]+)/.exec(t);
  const nominato = nome && !DEI.test(t.slice(nome.index).replace(/^\s*(?:di|del|della|dello)\s+/, "")) && !/\b(?:raffigurante|a forma di|con testa di)\b/i.test(t.slice(0, nome.index));
  if (/sarcofag|coperchio|cassa|ushabti|shabti|sciabti|statu|stelof|vaso canopo|canopo|tavola d.offerta|altare|naos|blocco|rilievo|architrave|stipite|pilastro|lastra|cassetta|scarabeo|sigillo|amuleto|anello|placchetta|cartonnage|maschera|pettorale|cuscino|poggiatesta|tavolozza|paletta|calamaio|vaso|piatto|ciotola|mattone|frammento/i.test(t)) {
    if (/mummia di (?:pesce|animale|gatto|coccodrillo|ibis|falco|serpente)|per mummia di (?:pesce|animale)/i.test(t)) return null;
    if (scritto || nominato) {
      const supporto = /sarcofag|coperchio|cassa/i.test(t) ? "sarcofago" : /ushabti|shabti|sciabti/i.test(t) ? "ushabti" : /statu/i.test(t) ? "statua" : /canopo/i.test(t) ? "vaso canopo"
        : /tavola d.offerta|altare/i.test(t) ? "tavola d'offerta" : /scarabeo/i.test(t) ? "scarabeo" : /sigillo/i.test(t) ? "sigillo" : /amuleto/i.test(t) ? "amuleto"
        : /blocco|rilievo|architrave|stipite|pilastro|lastra|naos/i.test(t) ? "elemento architettonico" : "oggetto iscritto (instrumentum)";
      return { tipo: "epigrafe", supporto };
    }
    return null;
  }
  if (scritto) return { tipo: "epigrafe", supporto: "oggetto iscritto (instrumentum)" };
  return null;
}

async function leggiEgizio(st, fine) {
  const p = st.parti.egizio = st.parti.egizio || {};
  if (!fresca(p)) {
    const r = await scarica(`${EGIZIO}/sitemap.xml`, { timeout: 180000, accept: "application/xml" });
    if (r.stato !== 200) throw new Error(`egizio: sitemap HTTP ${r.stato}`);
    const ids = new Set([...r.testo.matchAll(/<loc>https?:\/\/collezioni\.museoegizio\.it\/(?:en-GB|it-IT)\/material\/([^<\/?#]+)\/?<\/loc>/g)].map(m => decodeURIComponent(m[1])));
    if (!ids.size) throw new Error("egizio: sitemap senza oggetti");
    for (const id of ids) { const k = "egizio:" + id; if (!st.voci[k]) st.voci[k] = { q: 1 }; }
    p.totale = ids.size; p.completato = new Date().toISOString();
    salvaStato(st);
  }
  // 1) schede
  const da = Object.keys(st.voci).filter(k => k.startsWith("egizio:") && st.voci[k].q);
  let letti = 0, errori = 0;
  for (const k of da) {
    if (Date.now() > fine) throw new TempoFinito(`egizio: tempo esaurito nelle schede (${letti} lette su ${da.length})`);
    const id = k.slice(7);
    try {
      const r = await scarica(`${EGIZIO}/it-IT/material/${encodeURIComponent(id)}`, { timeout: 90000, accept: "text/html" });
      if (r.stato === 404 || r.stato === 410) { st.voci[k] = { x: `HTTP ${r.stato}` }; continue; }
      if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
      const v = schedaEgizio(r.testo);
      if (!v.t && !v.inv) { st.voci[k] = { x: "scheda vuota" }; continue; }
      const c = classeEgizio(v);
      if (c) { v.c = c.tipo; if (c.supporto) v.su = c.supporto; }
      if (!(v.img || []).length) v.x = "senza immagini";
      st.voci[k] = v; errori = 0;
    } catch (e) { log("musei", "egizio", id, e.message); if (++errori >= 8) throw new Error(`egizio: troppi errori di fila (${e.message})`); continue; }
    if (++letti % 100 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("musei", `egizio: ${letti} schede lette su ${da.length}`); }
  }
  // 2) misure delle immagini, solo per gli oggetti con scrittura e per quelli che hanno un modello 3D collegato
  const forzati = new Set((st.parti.sketchfab || {}).egizio || []);
  const serve = Object.keys(st.voci).filter(k => { const v = st.voci[k]; return k.startsWith("egizio:") && !v.q && !v.x && (v.c || forzati.has(chiaveInv(v.inv))) && !v.p; });
  let fatte = 0;
  for (const k of serve) {
    const v = st.voci[k], pg = [];
    for (const h of (v.img || []).slice(0, 12)) {
      if (Date.now() > fine) throw new TempoFinito(`egizio: tempo esaurito nelle immagini (${fatte} oggetti su ${serve.length})`);
      const b = await scaricaByte(`${EGIZIO}/public/objects/images/${h}_full.jpg`, { byte: 65536 });
      const m = (b.stato === 200 || b.stato === 206) ? misureJpeg(b.dati) : null;
      if (m) pg.push([h, m[0], m[1]]);
    }
    if (pg.length) v.p = pg; else v.x = "immagini non leggibili";
    if (++fatte % 50 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("musei", `egizio: immagini di ${fatte} oggetti su ${serve.length}`); }
  }
}

// ------------------------------------------------------------------------------------------------ Sketchfab
// account di musei, università e progetti seri: username -> [museo o istituzione, città] (città null se l'account raccoglie musei diversi)
export const ACCOUNT = {
  britishmuseum: ["The British Museum", "London"], GlobalDigitalHeritage: ["Global Digital Heritage", null], "www.noe-3d.at": ["Landessammlungen Niederösterreich (noe-3d.at)", null],
  "landessammlungen-noe": ["Landessammlungen Niederösterreich", null], WirtualneMuzeaMalopolski: ["Wirtualne Muzea Małopolski", null],
  hmane: ["Harvard Museum of the Ancient Near East", "Cambridge (Massachusetts)"], fitzwilliammuseum: ["Fitzwilliam Museum", "Cambridge"], MAACambridge: ["Museum of Archaeology and Anthropology", "Cambridge"],
  mnattgn: ["Museu Nacional Arqueològic de Tarragona", "Tarragona"], micropasts: ["MicroPasts", null], Smithsonian: ["Smithsonian Institution", "Washington"],
  artsmia: ["Minneapolis Institute of Art", "Minneapolis"], danilopavone: ["CNR, Istituto di Scienze del Patrimonio Culturale", null], "CNR-LINKS": ["CNR ISPC, Lecce", null],
  Museoegizio: ["Museo Egizio", "Torino"], TheEgyptCentre: ["The Egypt Centre, Swansea University", "Swansea"], Kelseymuseum: ["Kelsey Museum of Archaeology", "Ann Arbor"],
  britishlibrary: ["The British Library", "London"], IPCH_Yale: ["Yale Institute for the Preservation of Cultural Heritage", "New Haven"], yalepeabodymuseum: ["Yale Peabody Museum", "New Haven"],
  USF_digital: ["University of South Florida Libraries", null], mtrc: ["Museo del Teatro Romano de Cartagena", "Cartagena"], banalesmuseovirtual: ["Los Bañales, Museo Virtual", "Uncastillo"],
  museopopulonia: ["Museo etrusco di Populonia, Collezione Gasparri", "Piombino"], bcdh: ["Bonn Center for Digital Humanities", "Bonn"], ICAC: ["Institut Català d'Arqueologia Clàssica", "Tarragona"],
  GabrieleGuidi: ["Politecnico di Milano, Laboratorio di Computer Vision e Reverse Engineering", null], IU3D: ["Indiana University", null], iuegypt: ["Indiana University", null],
  imagingcenter: ["Smith College, Imaging Center", null], hendrikhameeuw: ["KU Leuven", null], garstang: ["Garstang Museum of Archaeology", "Liverpool"], Museovirasto: ["Museovirasto", "Helsinki"],
  varldskulturmuseerna: ["Världskulturmuseerna", null], huis_van_hilde: ["Archeologiemuseum Huis van Hilde", "Castricum"], MuseuManacor: ["Museu d'Història de Manacor", "Manacor"],
  mupac: ["Museo de Prehistoria y Arqueología de Cantabria", "Santander"], fieldmuseumeducation: ["Field Museum", "Chicago"], pmanuelian: ["Harvard University, Giza Project", null],
  tokovinin3d: ["University of Alabama (Alexandre Tokovinine)", null], Ohioudigiarchives: ["Ohio University Digital Archives", null], danielpett: ["Fitzwilliam Museum (Daniel Pett)", null],
  nationalmuseumsscotland: ["National Museums Scotland", "Edinburgh"], TheJohnRylandsLibrary: ["The John Rylands Library", "Manchester"],
  mkghamburg: ["Museum für Kunst und Gewerbe", "Hamburg"], tdr125: ["Epigrafi di Tarragona (tdr125)", "Tarragona"], LivAncWorlds: ["University of Liverpool, Archaeology, Classics and Egyptology", "Liverpool"], MANN: ["Museo Archeologico Nazionale di Napoli", "Napoli"], historicengland: ["Historic England", null],
};
export const PAROLE = ["inscription", "inscribed", "stela", "stele", "altar", "cippus", "milestone", "tombstone", "epitaph", "tablet", "cuneiform", "ostracon", "papyrus",
  "seal", "stamp", "lamp", "weight", "coin", "legend", "sarcophagus", "mosaic", "manuscript", "codex", "binding", "scroll", "hieroglyph", "rune", "ogham", "lapide", "iscrizione", "inschrift", "inscripción", "napis"];
// oggetto scritto (nome, descrizione e tag)
const SCRITTO = /\binscri(?:bed|ption|ptions|ptio)\b|\bepigra(?:ph|f)|\bstel[ae]i?\b|\bcipp(?:us|i|o)\b|\bmilestone|\bmiliar(?:io|ium)\b|\btombstone|\bgravestone|\bepitaph|\bfunerary (?:plaque|altar)|\bvotive altar|\baltar (?:of|to|dedicated)|\bcuneiform|\bclay tablet|\bwax tablet|\bwriting tablet|\bvindolanda|\bcurse tablet|\bdefixio|\bostra[ck](?:on|a)\b|\bpapyr(?:us|i)\b|\bstamped (?:tile|brick|amphora|handle)|\b(?:tile|brick|amphora) stamp|\bbollo\b|\bcylinder seal|\bstamp seal|\bseal(?:ing)? of\b|\bsigill|\bkudurru|\bhieroglyph|\bhieratic|\bdemotic|\bcartouche|\brune ?stone|\brunestone|\brunic|\bogham|\bcodex\b|\bmanuscript|\bbook ?binding|\bscroll\b|\btorah|\bcoin\b|\bdenari(?:us|i)\b|\baure(?:us|i)\b|\bsolid(?:us|i)\b|\bsesterti|\btetradrachm|\bdrachm|\bobol\b|\bfollis\b|\bdirham|\bdinar\b|\blegend\b|\bnapis\b|\binschrift|\bgrabstein|\bweihestein|\bmeilenstein|\binscripci[oó]n?\b|\binscripció\b|\bl[aá]pida\b|\biscrizion|\bepigrafe|\blapide\b|\bara votiva|\bkaiser ?inschrift/i;
const ANTICO = /\broman?\b|\bgreek\b|\begypt|\bhellenist|\bbyzant|\bmedi(?:a)?eval|\banglo-saxon|\bviking|\bnorse\b|\bceltic|\betrusc|\bphoenic|\bpunic|\bassyr|\bbabylon|\bsumer|\bakkad|\bmesopotam|\bhittite|\bdynasty|\bpharaoh|\bptolem|\bachaemenid|\bsasanian|\bparthian|\bnabat|\bpalmyr|\baramaic|\bhebrew|\bsouth arabian|\bsabaean|\biron age|\bbronze age|\bantiquity|\bancient|\bmaya\b|\bclassic period|\b\d+\s?(?:BC|BCE|B\.C\.)|\b(?:AD|A\.D\.)\s?\d{1,4}\b|\b\d{1,2}(?:st|nd|rd|th)\s?(?:century|c\.?|C)\s?(?:BC|BCE|AD|CE)\b|\b(?:[1-9]|1[0-5])(?:st|nd|rd|th) century\b|\broman[oa]\b|\bromain|\brömisch|\bgriech|\bägypt|\bmittelalter|\bantik|\brzymsk|\bśredniow|\bromà\b|\bibèric|\bib[eé]ric[oa]|\bislamic|\babbasid|\bumayyad|\bfatimid|\bcoptic|\bhieroglyph|\bcuneiform|\brunic|\bogham|\blatin\b|\bcarnuntum|\bvindolanda|\btarraco|\bpompei/i;
const MODERNO = /\b(?:replica|reproduction|copy of|cast of|plaster cast|facsimile|souvenir|fantasy|game ?asset|low ?poly|lowpoly|fake|forgery|world war|wwi|ww1|ww2|wwii|war memorial|1[6-9]th century|1[6-9]\d\d\b|20\d\d\b(?! ?(?:BC|BCE))|victorian|georgian|ottoman|civil war|church ?bell|modern|contemporary|calligraphy by|typewriter|banknote|postage|medal of|commemorative medal|token of)\b/i;
// prova forte di scrittura: senza una di queste parole una stele, una lapide, una moneta o un sigillo non bastano (molte stele medievali,
// molte lapidi e i sigilli figurati non hanno testo)
const FORTE = /\binscri(?:bed|ption|ptions|ptio)\b|\bepigra(?:ph|f)|\bepitaph|\bmilestone|\bmiliar(?:io|ium)\b|\bcuneiform|\bwax tablet|\bwriting tablet|\bvindolanda|\bcurse tablet|\bdefixio|\bostra[ck](?:on|a)\b|\bpapyr(?:us|i)\b|\bstamped (?:tile|brick|amphora|handle)|\b(?:tile|brick|amphora) stamp|\bbollo\b|\bkudurru|\bhieroglyph|\bhieratic|\bdemotic|\bcartouche|\brune ?stone|\brunestone|\brunic|\bogham|\bcodex\b|\bmanuscript|\btorah|\blegend\b|\bnapis\b|\binschrift|\binscripci[oó]n?\b|\binscripció\b|\biscrizion|\bepigrafe|\bclay tablet|\bwritten\b|\btext of\b|\bletters? (?:read|reading)|\bdedicat(?:ion|ory|ed to)\b|\bdecree\b/i;
// esclusi a mano dopo la verifica dell'elenco (28 ottobre 2026): monumenti moderni e oggetti la cui sola «scritta» è un'annotazione moderna
export const ESCLUSI_SF = new Map([
  ["9a546c62cee24635948e291dfe239a80", "monumento moderno a Marco Aurelio (Bad Deutsch-Altenburg), scritta in tedesco"],
  ["f53bc35f3d774f11a9476bfdadae94f7", "tomba di Carl Menger (1840-1921), Zentralfriedhof di Vienna"],
  ["3c35b2a1c02e41e7ba5a1398ce1c59c6", "stele con serpenti senza iscrizione antica (sul retro solo numeri arabi moderni)"],
  ["47ababa2dd594379861de66212426d13", "ostrakon figurato, solo disegno (sul retro una nota moderna a matita)"],
  ["b795363bc5194815a5e05c6202a5a0d6", "volto di sarcofago senza iscrizione antica (sul retro una nota d'archivio)"],
  ["1c5c7836045d4e40809d9e01f28a8f4e", "patera senza iscrizione (la descrizione dice solo che le patere potevano averne)"],
]);
// date moderne nella descrizione o nei tag («c.1833-38», «eighteenth-century», «18th-century», «dates the gate to 1858», «Qing dynasty»)
const DATA_MODERNA = /\bc\.\s?1[5-9]\d\d\b|\b(?:sixteenth|seventeenth|eighteenth|nineteenth|twentieth)[- ]century\b|\b(?:1[6-9]|20)th[- ]century\b|\bdates? (?:the \w+ )?to 1[5-9]\d\d\b|\bqing dynasty\b/i;
export function scrittoSf(m, uid) {
  if (uid && ESCLUSI_SF.has(uid)) return false;
  if (DATA_MODERNA.test([m.d, (m.g || []).join(" ")].join(" ")) && !/\b(?:BC|BCE|B\.C\.)\b/.test(m.d || "")) return false;
  // oggetti con papiro che non è scrittura (pane legato con strisce di papiro, sandali, corde, cesti)
  if (/\bbound with papyrus|\bpapyrus (?:strips?|sandals?|rope|cord|basket|mat)\b|\bstrips? of papyrus/i.test([m.n, m.d].join(" ")) && !/\binscri|\bwritten\b|\btext\b/i.test(m.n || "")) return false;
  const tag = (m.g || []).join(" ");
  const x = [m.n, m.d, tag].join(" ; ");
  if (!SCRITTO.test(x) || !FORTE.test(x)) return false;
  // la prova forte deve stare nel nome, oppure nella descrizione di un oggetto che non sia un recipiente, un elemento architettonico o una
  // scultura (lì «inscription» è spesso un dettaglio secondario o una negazione)
  if (/\b(?:no|without|un)[- ]?inscri|\banepigra|\bcodex[- ]style/i.test(x)) return false;
  const nome = String(m.n || "");
  if (!FORTE.test(nome) && !SCRITTO.test(nome)) {
    if (/\b(?:amphora|bowl|olla|vase|vessel|pottery|plate|jar|cup|jug|pot|sherd|capital|column|pavement|floor|plinth|bust|head|statue|statuette|figure|figurine|relief|panel|frieze|block|door|wall|staircase|tower|building|temple|house|villa|tomb|mask|mirror|urn|lid|handle|fragment|object|museum|antiquarium|museo|ceramic|ceramics|dolium|lintel|room|site|excavation|collection|church|castle|cave)\b/i.test(nome)) return false;
    if (/^[A-Z]{1,4}\d|_/.test(nome)) return false;   // sigle di scavo («SH19_US16_301»)
    // senza parole di scrittura nel nome serve una frase esplicita nella descrizione («with an inscription», «inscribed with», «bears the
    // inscription», «stamped», «legend»); «inscribed in a circle» è geometria, non scrittura
    if (!/\b(?:with|bears?|bearing|carries|has|shows?) (?:an?|the|two|three|several|its|his|her)? ?(?:\w+ )?(?:inscriptions?|legend|stamp|graffit\w*|text)\b|\binscribed (?:with|on|by|for|to)\b|\binscription (?:reads|reading|of|in|on|naming)\b|\bthe inscription\b|\bstamped\b|\bmit (?:der |einer )?(?:Inschrift|Stempel)|\bInschrift\b/i.test(String(m.d || "").slice(0, 800))) return false;
    if (/\binscribed (?:in|within) (?:a |an )?(?:circle|square|triangle|frame|medallion)/i.test(m.d || "") && !/inscription/i.test(m.d || "")) return false;
  }
  if (/\bfresco|\bwall ?painting|\bdstretch|\bdstr\.|\bportal\b|\bchurch\b|\bfa[cç]ade|\bcathedral|\bchapel\b/i.test(m.n || "") && !/inscri/i.test(m.n || "")) return false;
  if (!ANTICO.test(x)) return false;
  // moderno: decide il nome; nella descrizione solo le parole chiare (copia, calco, falso)
  // date moderne dichiarate nella descrizione («dates back to the 18th century», «from 1747», «anno 1848»)
  if (/\b(?:1[6-9]|20)th[- ]century\b|\b(?:from|of|in|anno|dated?|year) (?:the year )?1[5-9]\d\d\b|\b1[6-9]\d\d (?:AD|CE)\b/i.test(String(m.d || "").slice(0, 800)) && !/\b(?:BC|BCE|B\.C\.)\b/.test(m.d || "")) return false;
  if (MODERNO.test(m.n || "") || /\b(?:replica|reproduction|plaster cast|facsimile|forgery|fake)\b/i.test([m.d, tag].join(" "))) return false;
  if (/\bAbzeichen|Gesangsverein|\bchair\b|\bthimble|\bbadge of|\bK[öo]nig\b|\bKaiser\b(?!.*inschrift)|papyr(?:us|iform)[ -]?column|\bpapyriform|\blotus column/i.test(m.n || "")) return false;
  if (/\bsigil ?(?:of|for)\b|\bmagic|\bpentagram|\bdragon|\bfortnite|\bminecraft/i.test(x)) return false;
  return true;
}
// tipo della voce nuova
export function tipoSf(m) {
  const x = [m.n, (m.g || []).join(" ")].join(" ");
  if (/\bpapyr/i.test(x)) return { tipo: "papiro" };
  if (/\bcodex\b|\bmanuscript|\bbook ?binding|\bbinding\b|\bbook of hours|\bpsalter|\bqur.?an\b|\bkoran\b|\bbible\b|\btorah scroll|\bscroll\b/i.test(x) && !/\btablet|\bstel/i.test(x)) return { tipo: "codice" };
  const su = /\bcoin|\bdenari|\baure[ui]s?\b|\bsolid[ui]s?\b|\bsesterti|\bdrachm|\bobol\b|\bfollis|\bdirham|\bdinar/i.test(x) ? "moneta" : /\bcuneiform|\btablet/i.test(x) ? "tavoletta"
    : /\bostra[ck]/i.test(x) ? "ostrakon" : /\bstel[ae]/i.test(x) ? "stele" : /\baltar|\bara\b/i.test(x) ? "altare" : /\bmilestone|\bmiliar/i.test(x) ? "miliario"
    : /\bcipp/i.test(x) ? "cippo" : /\bsarcophag/i.test(x) ? "sarcofago" : /\bmosaic/i.test(x) ? "mosaico" : /\bseal|\bsigill/i.test(x) ? "sigillo" : /\blamp|\blucern/i.test(x) ? "lucerna"
    : /\bweight\b/i.test(x) ? "peso" : /\bring\b/i.test(x) ? "anello" : /\bstamp|\bbollo/i.test(x) ? "bollo" : /\btombstone|\bgravestone|\bepitaph|\bgrabstein|\bl[aá]pida|\blapide/i.test(x) ? "lapide"
    : /\bkudurru/i.test(x) ? "kudurru" : /\brune ?stone|\brunestone/i.test(x) ? "pietra runica" : null;
  return { tipo: "epigrafe", supporto: su };
}
export function lingueSf(m) {
  const x = [m.n, m.d, (m.g || []).join(" ")].join(" ");
  const l = [];
  if (/\blatin\b|\broman\b|\brömisch|\broman[oa]\b|\brzymsk/i.test(x)) l.push("la");
  if (/\bgreek\b|\bgriech|\bgreca?\b|\bbyzant/i.test(x)) l.push("grc");
  if (/\begypt|\bhieroglyph|\bhieratic|\bdemotic|\bpharaoh/i.test(x)) l.push("egy");
  if (/\bcoptic/i.test(x)) l.push("cop");
  if (/\bsumer/i.test(x)) l.push("sux");
  if (/\bakkad|\bbabylon|\bassyr|\bcuneiform/i.test(x) && !/\bsumer/i.test(x)) l.push("akk");
  if (/\baramaic|\bpalmyr|\bnabat/i.test(x)) l.push("arc");
  if (/\bhebrew|\btorah/i.test(x)) l.push("he");
  if (/\bphoenic|\bpunic/i.test(x)) l.push("phn");
  if (/\bsouth arabian|\bsabaean/i.test(x)) l.push("xsa");
  return [...new Set(l)];
}
// riferimenti epigrafici nella descrizione: numeri HD dell'EDH ed edizioni CIL, AE, RIB (per collegare il modello alla voce dell'EDH)
const ROMANI = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18 };
export function riferimenti(s) {
  const t = String(s || ""), out = new Set();
  for (const m of t.matchAll(/\bHD\s?0*(\d{1,6})\b/g)) out.add("hd" + m[1].padStart(6, "0"));
  for (const m of t.matchAll(/\bCIL\s+([IVX]{1,5}|\d{1,2})[\s,]+0*(\d{1,6})\b/g)) out.add(`cil-${ROMANI[m[1]] || +m[1]}-${+m[2]}`);
  for (const m of t.matchAll(/\bAE\s+(1[89]\d\d|20\d\d)[\s,]+0*(\d{1,5})\b/g)) out.add(`ae-${m[1]}-${+m[2]}`);
  for (const m of t.matchAll(/\bRIB\s+(?:I\s+)?0*(\d{1,4})\b/g)) out.add(`rib-${+m[1]}`);
  return [...out];
}
// edizione dell'EDH («CIL 13, 06667», «AE 1983, 0058», «RIB 01, 00123») -> stessa chiave
export function chiaviEdizione(ed) {
  const out = [];
  for (const m of String(ed || "").matchAll(/\bCIL\s+0*(\d{1,2}),\s*0*(\d{1,6})\b/g)) out.push(`cil-${+m[1]}-${+m[2]}`);
  for (const m of String(ed || "").matchAll(/\bAE\s+(\d{4}),\s*0*(\d{1,5})\b/g)) out.push(`ae-${m[1]}-${+m[2]}`);
  for (const m of String(ed || "").matchAll(/\bRIB\s+0*1,\s*0*(\d{1,4})\b/g)) out.push(`rib-${+m[1]}`);
  return out;
}
const miniatura = ims => { const ok = (ims || []).filter(i => i.width && i.height && i.width <= 1280).sort((a, b) => b.width - a.width); return ok[0] || null; };
export function modelloSf(r) {
  const th = miniatura((r.thumbnails || {}).images);
  return pulisci({ n: breve(r.name, 300), u: r.user && r.user.username, un: r.user && r.user.displayName, d: breve(r.description, 1500), g: (r.tags || []).map(t => t.name).slice(0, 30),
    li: r.license ? r.license.label : null, ls: r.license ? r.license.slug : null, th: th ? [th.url, th.width, th.height] : null, ar: r.isAgeRestricted ? 1 : null,
    pu: r.publishedAt ? r.publishedAt.slice(0, 10) : null });
}
async function leggiSketchfab(st, fine) {
  const p = st.parti.sketchfab = st.parti.sketchfab || {};
  // il filtro può diventare più severo: i modelli che non lo passano più escono dallo stato
  for (const k of Object.keys(st.voci)) if (k.startsWith("sf:") && !scrittoSf(st.voci[k], k.slice(3))) delete st.voci[k];
  // un giro di ricerche ogni GIORNI giorni; le ricerche fatte restano segnate («fatte»), così un account aggiunto dopo si legge al giro seguente
  if (!fresca(p) && !p.in_corso) { p.fatte = []; p.grandi = []; p.in_corso = true; }
  {
    const visti = new Map();
    const fatte = new Set(p.fatte || []);
    // ogni account: prima tutti i suoi modelli (fino a TUTTI_PAGINE pagine); se sono di più, le ricerche per parola chiave
    const grandi = new Set(p.grandi || []);
    const ricerche = Object.keys(ACCOUNT).flatMap(u => ["", ...PAROLE].map(q => [u, q]));
    for (const [u, q] of ricerche) {
      const chiave = u + "|" + q; if (fatte.has(chiave)) continue;
      if (q && !grandi.has(u)) continue;
      if (Date.now() > fine) { p.fatte = [...fatte]; p.grandi = [...grandi]; throw new TempoFinito(`sketchfab: tempo esaurito nelle ricerche (${fatte.size} fatte)`); }
      let url = `${SF}/search?type=models&user=${encodeURIComponent(u)}${q ? "&q=" + encodeURIComponent(q) : ""}&count=24`;
      const limite = q ? 20 : TUTTI_PAGINE;
      for (let pag = 0; url && pag < limite; pag++) {
        const r = await scarica(url, { timeout: 90000, accept: "application/json" });
        if (r.stato !== 200) throw new Error(`sketchfab: ricerca HTTP ${r.stato}`);
        const d = JSON.parse(r.testo);
        for (const x of d.results || []) {
          if (!x.uid || !x.user || x.user.username !== u) continue;
          const m = modelloSf(x);
          if (!m.ar && scrittoSf(m, x.uid)) visti.set(x.uid, m);
        }
        url = d.next || null;
      }
      if (!q && url) grandi.add(u);
      fatte.add(chiave);
      // i modelli trovati si salvano subito (q: oEmbed da controllare), così una ripresa non rifà le ricerche
      for (const [uid, m] of visti) { const k = "sf:" + uid; const prima = st.voci[k]; st.voci[k] = prima && !prima.q ? { ...m, e: prima.e, x: prima.x } : { ...m, q: 1 }; }
      visti.clear(); p.fatte = [...fatte]; p.grandi = [...grandi];
      if (fatte.size % 25 === 0) salvaStato(st);
    }
    p.totale = Object.keys(st.voci).filter(k => k.startsWith("sf:")).length;
    if (p.in_corso) { p.completato = new Date().toISOString(); delete p.in_corso; }
    p.fatte = [...fatte]; p.grandi = [...grandi];
    salvaStato(st);
  }
  // incorporamento consentito: oEmbed di sketchfab.com con l'iframe ufficiale
  const da = Object.keys(st.voci).filter(k => k.startsWith("sf:") && st.voci[k].q);
  for (const k of da) {
    if (Date.now() > fine) throw new TempoFinito(`sketchfab: tempo esaurito nei controlli oEmbed`);
    const uid = k.slice(3), v = st.voci[k];
    const r = await scarica(`https://sketchfab.com/oembed?url=${encodeURIComponent("https://sketchfab.com/3d-models/" + uid)}`, { timeout: 60000, accept: "application/json" });
    if (r.stato === 200 && /<iframe[^>]+\/models\/[0-9a-f]{32}\/embed/.test(JSON.parse(r.testo).html || "")) { v.e = 1; delete v.x; } else v.x = `incorporamento non consentito (oEmbed HTTP ${r.stato})`;
    delete v.q;
  }
  // inventari del Museo Egizio dei modelli dell'account del museo (per leggere le immagini anche di quegli oggetti)
  p.egizio = [...new Set(Object.entries(st.voci).filter(([k, v]) => k.startsWith("sf:") && v.u === "Museoegizio" && v.e).map(([k, v]) => chiaveInv(v.d)).filter(Boolean))].sort();
}

// ------------------------------------------------------------------------------------------------ scansione
export async function scansionaMusei({ minuti = 30, soloCache = false, parti = PARTI } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  const lavori = { egizio: f => leggiEgizio(st, f), sketchfab: f => leggiSketchfab(st, f) };
  const errori = [];
  const daFare = parti.filter(p => lavori[p]);
  for (let i = 0; i < daFare.length; i++) {
    const pt = daFare[i];
    // Sketchfab è breve: al massimo un quarto del tempo; il resto all'Egizio
    const quota = pt === "sketchfab" ? Date.now() + Math.max(0, fine - Date.now()) / 4 : fine;
    try { await lavori[pt](quota); }
    catch (e) { if (!(e instanceof TempoFinito)) errori.push(e.message); log("musei", e instanceof TempoFinito ? "" : "ERRORE", e.message); }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  const finita = pt => st.parti[pt] && st.parti[pt].completato && !Object.keys(st.voci).some(k => k.startsWith((pt === "sketchfab" ? "sf" : pt) + ":") && st.voci[k].q);
  if (PARTI.every(finita)) st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  if (errori.length) { const e = new Error(errori.join("; ")); e.stato = st; throw e; }
  return st;
}

// ------------------------------------------------------------------------------------------------ schede per il catalogo
const LIC_SF = m => m.li || "Licenza standard di Sketchfab (solo visualizzazione)";
const modello3d = (uid, m) => pulisci({ sketchfab: uid, licenza: LIC_SF(m), autore: m.un || m.u, account: m.u, url: `https://sketchfab.com/3d-models/${uid}`, titolo: m.n || null });

export function recordEgizio(id, v, m3d) {
  if (!v || !(v.p || []).length) return null;
  const dn = anniEgizio(v.dat), sc = scritturaEgizio(v);
  const lingue = sc.length ? [...new Set(sc.map(s => LINGUA_SCRITTURA[s]))] : ["egy"];
  const datazione = [v.dat, [v.per, v.din, v.reg].filter(Boolean).join(", ")].filter(Boolean).join("; ") || null;
  const r = {
    fonte: "musei", id: idEgizio(id), tipo: v.c || "epigrafe", citta: "Torino", biblioteca: "Museo Egizio",
    segnatura: v.inv || id.replace(/_/g, " "), titolo: v.t || null, datazione, secolo: secoloDa(dn, v.dat),
    lingue, manifest: `${RAW}musei-egizio/${id.toLowerCase()}.json`, pagina: `${EGIZIO}/it-IT/material/${id}`, immagini: v.p.length,
    licenza: "Museo Egizio, Torino: immagini CC0 (pubblico dominio). Dati della collezione online del museo",
  };
  const dati = pulisci({ inventario: v.inv || null, provenienza: v.pro || null, conservazione: "Museo Egizio, Torino", supporto: [v.su, v.mat].filter(Boolean).join(", ") || v.mat || null,
    materiale: v.mat || null, misure: v.dim || null, periodo: v.per || null, dinastia: v.din || null, regno: v.reg || null, acquisizione: v.acq || null,
    scrittura: sc.length ? sc.join(", ") : null, descrizione: v.d || null, licenza_metadati: "Museo Egizio (dati della collezione online; immagini CC0)" });
  if (r.tipo === "papiro") r.papiro = dati; else r.epigrafe = dati;
  if (m3d) r.modello3d = m3d;
  return r;
}
export function segnaturaSf(uid, m, museo) {
  const nome = String(m.n || "").replace(/\s+/g, " ").replace(/^["'«]+|["'»]+$/g, "").trim();
  if (!nome) return `${museo || "Sketchfab"}, modello 3D ${uid.slice(0, 8)}`;
  const n = nome.length > 110 ? nome.slice(0, 110).replace(/\s+\S*$/, "") + "…" : nome;
  return museo && !n.toLowerCase().includes(String(museo).toLowerCase()) ? `${n}, ${museo}` : n;
}
export function recordSketchfab(uid, m) {
  if (!m || !m.e || !m.th || !scrittoSf(m, uid)) return null;
  const [museo, citta] = ACCOUNT[m.u] || [m.un || m.u, null];
  const t = tipoSf(m);
  const r = {
    fonte: "musei", id: "mu-3d-" + uid, tipo: t.tipo === "codice" ? undefined : t.tipo, citta, biblioteca: museo,
    // segnatura (titolo della voce nell'elenco, dal 28 ottobre 2026): nome del modello e museo, non più «Sketchfab <uid>»
    segnatura: segnaturaSf(uid, m, museo), titolo: m.n || null, datazione: null, secolo: null, lingue: lingueSf(m),
    manifest: `${RAW}musei-3d/${uid}.json`, pagina: `https://sketchfab.com/3d-models/${uid}`, immagini: 1,
    licenza: `Modello 3D su Sketchfab di ${m.un || m.u} (${LIC_SF(m)}); immagine: anteprima del modello su Sketchfab`,
    modello3d: modello3d(uid, m),
  };
  const dati = pulisci({ supporto: t.supporto || null, conservazione: museo, descrizione: breve(m.d, 500), licenza_metadati: "Sketchfab: nome, descrizione e tag dell'autore del modello" });
  if (r.tipo === "papiro") r.papiro = dati; else if (r.tipo === "epigrafe") r.epigrafe = dati; else r.descrizione = dati.descrizione;
  if (!r.tipo) delete r.tipo;
  return r;
}
// TPOP: scrittura («hieratic», «cursive hieroglyphs», «demotic», «Greek», «Coptic») -> lingue
export const lingueTpop = s => { const x = String(s || ""), l = []; if (/hierat|hieroglyph|demotic|egypt/i.test(x)) l.push("egy"); if (/greek/i.test(x)) l.push("grc"); if (/coptic/i.test(x)) l.push("cop"); if (/arab/i.test(x)) l.push("ar"); if (/aramaic/i.test(x)) l.push("arc"); return l.length ? l : ["egy"]; };
const urlTpop = p => TPOP + encodeURI(p).replace(/%25([0-9A-F]{2})/g, "%$1");
export function recordTpop(id, v, m3d) {
  if (!v || !(v.imgs || []).length) return null;
  if (/^none/i.test(v.sc || "")) return null;   // disegni senza scrittura («none (drawing)»)
  const dn = (/\((\d+)\s*-\s*(\d+)\s*BC\)/.exec(v.din || "") || /\((\d+)\s*-\s*(\d+)\s*BC\)/.exec(v.ep || "") || []).slice(1).map(n => -n);
  const r = {
    fonte: "musei", id: "mu-tpop-" + id, tipo: "papiro", citta: "Torino", biblioteca: "Museo Egizio",
    segnatura: v.inv || `TPOP ${id}`, titolo: v.t || null, datazione: [v.ep, v.din].filter(x => x && x !== "---").join("; ") || null,
    secolo: dn.length === 2 ? secoloDa([dn[0], dn[1]], null) : null, lingue: lingueTpop(v.sc),
    manifest: `${RAW}musei-tpop/${id}.json`, pagina: `${TPOP}/it-IT/document/${id}/`, immagini: v.imgs.length,
    licenza: "Museo Egizio, Turin Papyrus Online Platform: foto CC0 (pubblico dominio); descrizioni e trascrizioni degli editori indicati nella scheda, da citare",
    papiro: pulisci({ inventario: v.inv || null, provenienza: v.pro && v.pro !== "---" ? v.pro.replace(/\s*\(\s*\)\s*$/, "") : null, conservazione: "Museo Egizio, Torino",
      scrittura: v.sc || null, genere: v.tt || null, editori: v.ed || null, licenza_metadati: "Museo Egizio, TPOP: citare gli editori e i collaboratori della scheda" }),
  };
  if (m3d) r.modello3d = m3d;
  if (!r.titolo) delete r.titolo;
  return r;
}

// collegamenti: modello -> voce che il catalogo ha già (Museo Egizio per inventario, EDH per numero HD o edizione)
export function collegamenti(st = leggiStato(), edh = leggiEdh()) {
  const egizio = new Map();
  for (const [k, v] of Object.entries(st.voci || {})) if (k.startsWith("egizio:") && v && v.inv && (v.p || []).length) { const c = chiaveInv(v.inv); if (c && !egizio.has(c)) egizio.set(c, k.slice(7)); }
  const perEd = new Map();
  for (const [hd, v] of Object.entries(edh.voci || {})) { if (!(v.f || []).length) continue; for (const c of chiaviEdizione(v.ed)) if (!perEd.has(c)) perEd.set(c, hd); perEd.set(hd.toLowerCase(), hd); }
  const out = new Map();   // uid -> { egizio: id } | { voce: id }
  for (const [k, m] of Object.entries(st.voci || {})) {
    if (!k.startsWith("sf:") || !m || !m.e) continue;
    const uid = k.slice(3);
    if (m.u === "Museoegizio") { const c = chiaveInv(m.d); if (c && egizio.has(c)) { out.set(uid, { egizio: egizio.get(c) }); continue; } }
    const hd = riferimenti([m.n, m.d].join(" ")).map(c => perEd.get(c)).find(Boolean);
    if (hd) out.set(uid, { voce: "ep-edh-" + hd.toLowerCase() });
  }
  return out;
}
// record della fonte «musei» e modelli da attaccare alle voci di altre fonti ({ id voce: modello3d })
export function recordMusei(st = leggiStato(), edh = leggiEdh(), tpop = leggiTpop()) {
  const col = collegamenti(st, edh), out = [], altrove = {};
  // papiri TPOP: inventari (un papiro della collezione online con lo stesso inventario resta solo nella voce TPOP)
  const invTpop = new Map(Object.entries(tpop.voci || {}).filter(([, v]) => (v.imgs || []).length).map(([id, v]) => [chiaveInv(v.inv), id]).filter(([k]) => k));
  const m3dTpop = new Map();
  const m3dEgizio = new Map();
  for (const [uid, c] of col) {
    const m = modello3d(uid, st.voci["sf:" + uid]);
    if (c.egizio && !m3dEgizio.has(c.egizio)) m3dEgizio.set(c.egizio, m);
    else if (c.voce && !altrove[c.voce]) altrove[c.voce] = m;
  }
  for (const [k, v] of Object.entries(st.voci || {})) {
    if (!k.startsWith("egizio:") || !v || v.q || v.x) continue;
    const id = k.slice(7), m3 = m3dEgizio.get(id) || null;
    if (!v.c && !m3) continue;
    const tp = invTpop.get(chiaveInv(v.inv));
    if (tp && (v.c === "papiro" || !v.c)) { if (m3) m3dTpop.set(tp, m3); continue; }   // senza scrittura: fuori, salvo gli oggetti con il modello 3D del museo (scelti dal museo tra gli scritti)
    const r = recordEgizio(id, v.c ? v : { ...v, c: "epigrafe", su: "oggetto iscritto (modello 3D del museo)" }, m3); if (r) out.push(r);
  }
  for (const [id, v] of Object.entries(tpop.voci || {})) { const r = recordTpop(id, v, m3dTpop.get(id) || null); if (r) out.push(r); }
  for (const [k, m] of Object.entries(st.voci || {})) {
    if (!k.startsWith("sf:") || !m || m.q || m.x || col.has(k.slice(3))) continue;
    const r = recordSketchfab(k.slice(3), m); if (r) out.push(r);
  }
  for (const r of out) if (!r.titolo) delete r.titolo;
  return { record: out, modelli: altrove };
}

// ------------------------------------------------------------------------------------------------ manifesti scritti dal catalogo (scripts/manifesti.mjs)
const lm = (s, l = "none") => ({ [l]: [String(s)] });
const coppia = (k, v) => v && (!Array.isArray(v) || v.length) ? { label: lm(k, "it"), value: lm(Array.isArray(v) ? v.join(" ; ") : v) } : null;
export function manifestiMusei(st = leggiStato(), edh = leggiEdh(), tpop = leggiTpop()) {
  const out = { "musei-egizio": {}, "musei-3d": {}, "musei-tpop": {} };
  const { record } = recordMusei(st, edh, tpop);
  for (const r of record) {
    const d = r.epigrafe || r.papiro || {};
    const meta = [coppia("Conservazione", r.biblioteca + (r.citta && !r.biblioteca.includes(r.citta) ? ", " + r.citta : "")), coppia("Inventario", d.inventario || null), coppia("Datazione", r.datazione),
      coppia("Provenienza", d.provenienza), coppia("Supporto", d.supporto), coppia("Scrittura", d.scrittura), coppia("Modello 3D", r.modello3d ? r.modello3d.url : null)];
    if (r.id.startsWith("mu-egizio-")) {
      const k = Object.keys(st.voci).find(x => x.startsWith("egizio:") && idEgizio(x.slice(7)) === r.id);
      const v = st.voci[k], id = k.slice(7).toLowerCase();
      out["musei-egizio"][id] = manifestoEpigrafe(`${RAW}musei-egizio/${id}.json`, `Museo Egizio, ${r.segnatura}: ${r.titolo || ""}`.replace(/: $/, ""), meta,
        "Museo Egizio, Torino. Immagini CC0 (pubblico dominio).", r.pagina,
        v.p.map(([h, w, hh], i) => ({ url: `${EGIZIO}/public/objects/images/${h}_full.jpg`, w, h: hh, etichetta: String(i + 1) })), "http://creativecommons.org/publicdomain/zero/1.0/");
    } else if (r.id.startsWith("mu-tpop-")) {
      const id = r.id.slice(8), v = tpop.voci[id];
      out["musei-tpop"][id] = manifestoEpigrafe(`${RAW}musei-tpop/${id}.json`, `Museo Egizio, ${r.segnatura}: ${r.titolo || ""}`.replace(/: $/, ""), meta,
        "Museo Egizio, Torino, Turin Papyrus Online Platform. Foto CC0 (pubblico dominio)." + (v.ed ? " Scheda: " + v.ed + "." : ""), r.pagina,
        v.imgs.map(([p, w, h], i) => ({ url: urlTpop(p), w, h, etichetta: String(i + 1) })), "http://creativecommons.org/publicdomain/zero/1.0/");
    } else if (r.id.startsWith("mu-3d-")) {
      const uid = r.id.slice(6), m = st.voci["sf:" + uid];
      out["musei-3d"][uid] = manifestoEpigrafe(`${RAW}musei-3d/${uid}.json`, r.titolo || uid, meta,
        `Anteprima del modello 3D di ${m.un || m.u} su Sketchfab (${LIC_SF(m)}). Il modello si apre nella linguetta «3D».`, r.pagina,
        [{ url: m.th[0], w: m.th[1], h: m.th[2], etichetta: "Anteprima del modello 3D (Sketchfab)" }], null);
    }
  }
  return out;
}
