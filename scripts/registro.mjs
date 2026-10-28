// Registro delle biblioteche (docs/BIBLIOTECHE.md): la parte «Agganciate» si rigenera a ogni esecuzione di raccogli.mjs,
// tra i segnaposto <!-- inizio automatico --> e <!-- fine automatico -->; il resto del documento è scritto a mano.
// Gli esiti delle raccolte vere (non quelle con --solo-costruisci) si conservano in data/raccolte.json.
import fs from "node:fs";
import path from "node:path";
import { CACHE } from "./rete.mjs";
import { daLeggere, segnaturaLeggibile } from "./fonti/vaticana.mjs";
import { NOMI_LINGUE } from "./lingue.mjs";
import { FONTI_HSP } from "./fonti/hsp.mjs";
import { ammessaYale } from "./fonti/yale.mjs";
import { motivoLeiden, contestoLeiden } from "./fonti/leiden.mjs";
import { leggiBrowser as leggiGallica, motivoGallica } from "./fonti/gallica.mjs";

export const FILE_REGISTRO = "docs/BIBLIOTECHE.md";
export const FILE_RACCOLTE = "data/raccolte.json";
export const INIZIO = "<!-- inizio automatico -->", FINE = "<!-- fine automatico -->";

// biblioteca, città e modo di aggiornamento di ogni fonte agganciata
export const BIBLIOTECHE = {
  heidelberg: { biblioteca: "Universitätsbibliothek Heidelberg", citta: "Heidelberg", come: "ogni notte, da sola" },
  ecodices: { biblioteca: "e-codices (biblioteche svizzere: San Gallo, Einsiedeln, Bodmer e altre)", citta: "Svizzera", come: "ogni notte, da sola" },
  bsb: { biblioteca: "Bayerische Staatsbibliothek", citta: "Monaco di Baviera", come: "ogni notte, da sola" },
  stampe: { biblioteca: "Stampe antiche: incunaboli e edizioni principi dei classici (Bayerische Staatsbibliothek e biblioteche bavaresi, Heidelberg, Bodleian, Cambridge, Boston Public Library e National Library of Medicine su Internet Archive, Vaticana, Gallica dal browser)", citta: "varie", come: "corsia stampe: a ruota finché la prima lettura non è finita, poi ogni notte (elenchi ogni 30 giorni)" },
  papiri: { biblioteca: "Papiri: Michigan, Yale, Duke, Princeton, Vienna (ÖNB, solo uso non commerciale), Colonia e Berkeley, con le schede di papyri.info (CC BY 3.0)", citta: "varie", come: "corsia papiri: a ruota finché la prima lettura non è finita, poi ogni notte (elenchi ogni 30 giorni)" },
  epigrafi: { biblioteca: "Epigrafi: Epigraphic Database Heidelberg (foto IIIF di heidICON, dati CC BY-SA 4.0), The Metropolitan Museum of Art (CC0) e Wikidata con Wikimedia Commons", citta: "varie", come: "corsia epigrafi: a ruota finché la prima lettura non è finita, poi ogni notte (elenchi ogni 30 giorni)" },
  berlino: { biblioteca: "Staatsbibliothek zu Berlin", citta: "Berlino", come: "ogni notte, da sola" },
  sbbor: { biblioteca: "Staatsbibliothek zu Berlin, manoscritti non europei (tibetani, mongoli, sanscriti, islamici, ebraici, cristiano-orientali, africani)", citta: "Berlino", come: "corsia asia, ogni notte (raccolta completa ogni 14 giorni)" },
  bodleian: { biblioteca: "Bodleian Libraries e college", citta: "Oxford", come: "corsia propria: a ruota finché non sono letti tutti, poi ogni notte" },
  gallica: { biblioteca: "Bibliothèque nationale de France (Gallica)", citta: "Parigi", come: "va rifatta a mano dal browser" },
  laurenziana: { biblioteca: "Biblioteca Medicea Laurenziana", citta: "Firenze", come: "ogni notte, da sola" },
  ambrosiana: { biblioteca: "Veneranda Biblioteca Ambrosiana (Biblioteca Digitale)", citta: "Milano", come: "corsia italia: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 6 giorni)" },
  montecassino: { biblioteca: "Biblioteca statale del Monumento nazionale di Montecassino (Memory of Montecassino)", citta: "Montecassino", come: "corsia italia, ogni notte (raccolta completa ogni 6 giorni; a ruota se la prima lettura non è finita)" },
  casanatense: { biblioteca: "Biblioteca Casanatense", citta: "Roma", come: "corsia italia, ogni notte (raccolta completa ogni 6 giorni; a ruota se la prima lettura non è finita)" },
  bub: { biblioteca: "Biblioteca Universitaria di Bologna (codici in Historica, Università di Bologna)", citta: "Bologna", come: "corsia italia, ogni notte (raccolta completa ogni 6 giorni; a ruota se la prima lettura non è finita)" },
  leiden: { biblioteca: "Universiteitsbibliotheek Leiden (manoscritti, con i Vossiani; Bibliotheca Neerlandica Manuscripta)", citta: "Leida", come: "ogni notte, da sola" },
  // biblioteche lette dal Handschriftenportal (Wolfenbüttel, Bamberga, Karlsruhe, Stoccarda, Colonia, Lipsia)
  ...Object.fromEntries(Object.entries(FONTI_HSP).map(([f, h]) => [f, { biblioteca: `${h.nome} (dati dal Handschriftenportal)`, citta: h.citta, come: "ogni notte, da sola" }])),
  // Handschriftenportal, corsia «europa» (dal 26 ottobre 2026)
  ...Object.fromEntries(["francoforte", "dresda", "tubinga", "darmstadt"].map(f => [f, { biblioteca: `${FONTI_HSP[f].nome} (dati dal Handschriftenportal${FONTI_HSP[f].copie ? "; copie dei manifesti scritte dal catalogo" : ""})`, citta: FONTI_HSP[f].citta, come: "corsia europa: a ruota finché la prima lettura non è finita, poi ogni notte" }])),
  handrit: { biblioteca: "handrit.is: Landsbókasafn Íslands, Stofnun Árna Magnússonar, Den Arnamagnæanske Samling (descrizioni TEI pubblicate su GitHub; manifesti scritti dal catalogo)", citta: "Reykjavík e Copenaghen", come: "corsia europa, ogni notte (descrizioni rilette ogni 14 giorni, nessuna richiesta a handrit.is)" },
  polona: { biblioteca: "Polona: Biblioteka Narodowa, Biblioteka Jagiellońska, Biblioteka Książąt Czartoryskich e altre biblioteche polacche", citta: "Polonia", come: "corsia europa: a ruota finché la prima lettura non è finita, poi ogni notte (raccolta completa ogni 6 giorni)" },
  manuscriptorium: { biblioteca: "Manuscriptorium: Národní knihovna České republiky, biblioteche universitarie di Breslavia e Toruń e altre (fuori le copie di biblioteche già nel catalogo)", citta: "Repubblica Ceca e altre", come: "corsia europa: a ruota finché la prima lettura non è finita, poi ogni notte (raccolta completa ogni 6 giorni)" },
  kbdk: { biblioteca: "Det Kongelige Bibliotek: codici, frammenti, manoscritti orientali ed ebraici (Digitale samlinger; manifesti scritti dal catalogo con le immagini IIIF della biblioteca)", citta: "Copenaghen", come: "corsia europa, ogni notte (raccolta completa ogni 14 giorni)" },
  uva: { biblioteca: "Allard Pierson, Universiteit van Amsterdam: codici (Bibliotheca Philosophica Hermetica, libri d'ore, manoscritti della Rosenthaliana e altri; fuori le lettere)", citta: "Amsterdam", come: "corsia europa, ogni notte (raccolta completa ogni 6 giorni)" },
  // Europa centrale (corsia «centro», dal 27 ottobre 2026)
  vlaustria: { biblioteca: "Universitätsbibliothek Graz (con i codici di Vorau) e Universitätsbibliothek Salzburg: manoscritti e frammenti (Visual Library)", citta: "Graz e Salisburgo", come: "corsia centro: a ruota finché la prima lettura non è finita, poi ogni notte (elenco dalle sitemap ogni 14 giorni, manifesti nuovi)" },
  elte: { biblioteca: "ELTE Egyetemi Könyvtár (Biblioteca universitaria Eötvös Loránd): codici, frammenti e manoscritti moderni (fuori le lettere e i codici già dati da Manuscriptorium)", citta: "Budapest", come: "corsia centro, ogni notte (raccolta completa ogni 14 giorni)" },
  yale: { biblioteca: "Yale University Library (Beinecke e altre biblioteche di Yale)", citta: "New Haven (Stati Uniti)", come: "corsia propria: a ruota finché la prima lettura non è finita, poi ogni 6 giorni" },
  penn: { biblioteca: "University of Pennsylvania Libraries (Kislak Center, Schoenberg, CAJS)", citta: "Filadelfia (Stati Uniti)", come: "corsia usa: a ruota finché la prima lettura non è finita, poi ogni notte (raccolta completa ogni 6 giorni)" },
  ds: { biblioteca: "Digital Scriptorium (istituzioni statunitensi: Princeton, Columbia, Harvard, Huntington, Free Library e altre; dettaglio sotto la tabella)", citta: "Stati Uniti", come: "ogni notte, da sola (raccolta completa ogni 6 giorni)" },
  // Europa del Nord e Lussemburgo (corsia «nord», dal 27 ottobre 2026)
  nb: { biblioteca: "Nasjonalbiblioteket: manoscritti (fuori le lettere), manoscritti musicali e carte geografiche con copia digitale aperta a tutti", citta: "Oslo", come: "corsia nord: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 14 giorni; scheda MODS solo delle carte nuove)" },
  manuscripta: { biblioteca: "manuscripta.se: Kungliga biblioteket, Uppsala universitetsbibliotek, Riksantikvarieämbetet, Linköping, Lund e altre biblioteche svedesi (codici e frammenti digitalizzati)", citta: "Svezia", come: "corsia nord, ogni notte (elenco ogni 14 giorni)" },
  bnl: { biblioteca: "Bibliothèque nationale du Luxembourg: manoscritti di eluxemburgensia (codici di Echternach, Codex Mariendalensis, corsi dei Gesuiti; manifesti IIIF scritti da Emendando)", citta: "Lussemburgo", come: "corsia nord, ogni notte (elenco ogni 14 giorni; pagine solo dei codici nuovi)" },
  walters: { biblioteca: "The Walters Art Museum (manifesti IIIF scritti da Emendando)", citta: "Baltimora (Stati Uniti)", come: "corsia usa: a ruota finché non sono letti tutti i codici, poi ogni notte (elenco ogni 6 giorni; misure delle immagini)" },
  loc: { biblioteca: "Library of Congress: microfilm del Monastero di Santa Caterina del Sinai e dei Patriarcati greco-ortodosso e armeno di Gerusalemme", citta: "Sinai (Egitto) e Gerusalemme", come: "corsia usa: a ruota finché la prima lettura non è finita, poi ogni notte (elenco completo ogni 6 giorni; manifesti scritti dal catalogo)" },
  cudl: { biblioteca: "Cambridge Digital Library (University Library e college)", citta: "Cambridge", come: "corsia uk: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 6 giorni)" },
  wellcome: { biblioteca: "Wellcome Collection", citta: "Londra", come: "corsia uk, ogni notte (raccolta completa ogni 6 giorni)" },
  bl: { biblioteca: "British Library (copie IIIF della Biblioteca e della Qatar Digital Library)", citta: "Londra", come: "corsia uk: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 6 giorni, schede nuove)" },
  isos: { biblioteca: "Irish Script on Screen (Royal Irish Academy, National Library of Ireland, Trinity College Dublin, National Library of Scotland e altre)", citta: "Irlanda e altre sedi", come: "corsia uk, ogni notte (elenco ogni 6 giorni)" },
  manchester: { biblioteca: "John Rylands Research Institute and Library (Manchester Digital Collections)", citta: "Manchester", come: "corsia uk: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 6 giorni)" },
  cbl: { biblioteca: "Chester Beatty", citta: "Dublino", come: "corsia uk: a ruota finché la prima lettura non è finita (un manifesto ogni 10 secondi, come chiede la biblioteca), poi ogni notte" },
  parker: { biblioteca: "Parker Library, Corpus Christi College (manifesti IIIF di Stanford)", citta: "Cambridge", come: "corsia uk, ogni notte (elenco da Biblissima ogni 14 giorni, codici nuovi; il sito parker.stanford.edu non si usa)" },
  nlw: { biblioteca: "National Library of Wales / Llyfrgell Genedlaethol Cymru", citta: "Aberystwyth", come: "corsia uk, ogni notte (elenco da Wikidata ed Europeana ogni 14 giorni, manifesti nuovi; il sito della biblioteca non si usa)" },
  nlg: { biblioteca: "Biblioteca Nazionale di Grecia", citta: "Atene", come: "ogni notte, da sola (elenco ogni 6 giorni; copie dei manifesti scritte dal catalogo)" },
  ndl: { biblioteca: "National Diet Library (国立国会図書館): manoscritti dei libri antichi giapponesi e cinesi", citta: "Tokyo (Giappone)", come: "corsia mondo: a ruota finché la prima lettura completa non è finita, poi ogni notte (solo i record cambiati ogni 6 giorni, raccolta completa ogni 30)" },
  kokusho: { biblioteca: "Kokusho Database (国書データベース) del National Institute of Japanese Literature: manoscritti di biblioteche, templi e collezioni giapponesi", citta: "Giappone", come: "corsia mondo: a ruota finché la prima lettura completa non è finita, poi ogni notte (raccolta completa ogni 14 giorni)" },
  slv: { biblioteca: "State Library Victoria", citta: "Melbourne (Australia)", come: "va fatta a mano dal browser (scripts/browser/slv.js)" },
  onb: { biblioteca: "Österreichische Nationalbibliothek (codici della Sammlung von Handschriften in ÖNB Digital)", citta: "Vienna", come: "corsia giornaliera: manifesti a riprese finché non sono letti tutti, poi solo i nuovi (elenco ogni 6 giorni); di riserva dal browser (scripts/browser/onb.js)" },
  bncf: { biblioteca: "Biblioteca Nazionale Centrale di Firenze (manoscritti pubblicati dalla Biblioteca su Internet Archive)", citta: "Firenze", come: "corsia italia, ogni notte (ricerca ogni 6 giorni)" },
  vallicelliana: { biblioteca: "Biblioteca Vallicelliana (lascito di Achille Stazio su OMNES)", citta: "Roma", come: "corsia italia, ogni notte (raccolta completa ogni 6 giorni)" },
  malatestiana: { biblioteca: "Biblioteca Malatestiana (Catalogo aperto; manifesti IIIF scritti da Emendando)", citta: "Cesena", come: "corsia italia: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 6 giorni)" },
  classense: { biblioteca: "Biblioteca Classense (Collezioni Digitali Classensi, insieme «Manoscritti»)", citta: "Ravenna", come: "va fatta a mano dal browser (scripts/browser/classense.js)" },
  auckland: { biblioteca: "Auckland Libraries, Sir George Grey Special Collections", citta: "Auckland (Nuova Zelanda)", come: "corsia mondo: a ruota finché la prima lettura completa non è finita, poi ogni notte (raccolta completa ogni 6 giorni)" },
  toronto: { biblioteca: "University of Toronto, Thomas Fisher Rare Book Library", citta: "Toronto (Canada)", come: "corsia mondo: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 6 giorni, manifesti nuovi)" },
  // Grecia (corsia «mondo», dal 26 ottobre 2026)
  pergamos: { biblioteca: "Università di Atene, Biblioteca della Facoltà di Filosofia: codici in Pergamos (manifesti IIIF scritti da Emendando)", citta: "Atene", come: "corsia mondo, ogni notte (raccolta completa ogni 14 giorni; manifesti scritti dal catalogo)" },
  rousanou: { biblioteca: "Monastero di Rousanou, Meteore (copie digitali della Biblioteca di Kalambaka)", citta: "Meteore (Grecia)", come: "corsia mondo, ogni notte (elenco da SearchCulture.gr ogni 14 giorni, manifesti nuovi)" },
  // Africa (corsia «mondo», dal 26 ottobre 2026)
  auc: { biblioteca: "American University in Cairo, Rare Books and Special Collections Library (codici arabi, persiani e copti)", citta: "Il Cairo (Egitto)", come: "corsia mondo, ogni notte (raccolta completa ogni 6 giorni)" },
  northwestern: { biblioteca: "Northwestern University Libraries, Herskovits Library of African Studies (manoscritti arabi e in ajami dell'Africa occidentale)", citta: "Evanston (Stati Uniti)", come: "corsia mondo, ogni notte (raccolta completa ogni 6 giorni)" },
  // dal 26 ottobre 2026: National Library of Israel (corsia «mondo»), Getty Museum (corsia «usa»), Harvard (elenco dal browser)
  nli: { biblioteca: "National Library of Israel (manoscritti di Ktiv; con le copie digitali della Bibliotheca Rosenthaliana di Amsterdam)", citta: "Gerusalemme", come: "corsia mondo, ogni notte (elenco da Europeana ogni 14 giorni)" },
  getty: { biblioteca: "J. Paul Getty Museum, dipartimento dei manoscritti", citta: "Los Angeles (Stati Uniti)", come: "corsia usa, ogni notte (elenco ogni 6 giorni, schede nuove)" },
  harvard: { biblioteca: "Harvard Library: Houghton Library, Harvard-Yenching Library, Islamic Heritage Project (fuori i codici già dati da Digital Scriptorium)", citta: "Cambridge (Stati Uniti)", come: "corsia usa, elenco da LibraryCloud ogni 14 giorni; se LibraryCloud respinge il server, dal browser (scripts/browser/harvard.js)" },
  // Europa orientale (corsia «est», dal 26 ottobre 2026)
  nbkm: { biblioteca: "Biblioteca Nazionale «Santi Cirillo e Metodio» (НБКМ): manoscritti slavi, greci, armeni, georgiani, ebraici, latini e musicali (manifesti IIIF scritti da Emendando)", citta: "Sofia (Bulgaria)", come: "corsia est, ogni notte (elenco ogni 14 giorni; pagine contate solo per i codici nuovi)" },
  // Balcani (corsia «balcani», dal 27 ottobre 2026)
  bms: { biblioteca: "Biblioteca della Matica srpska (Библиотека Матице српске): libri manoscritti e carte geografiche fino al 1900 (manifesti IIIF scritti da Emendando)", citta: "Novi Sad (Serbia)", come: "corsia balcani: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 14 giorni; schede e visore solo per i codici nuovi)" },
  ija: { biblioteca: "Iraqi Jewish Archive (U.S. National Archives and Records Administration): frammenti di rotoli della Torah e di Ester della comunità ebraica di Baghdad", citta: "College Park (Stati Uniti), da Baghdad", come: "corsia medioriente, ogni notte (elenco ogni 14 giorni; media solo dei candidati nuovi)" },
  libfond: { biblioteca: "Biblioteca Statale Russa, Reparto manoscritti, e biblioteca dell'Accademia Teologica di Mosca: copie digitali pubblicate dalla Trinità-San Sergio (lib-fond.ru; manifesti IIIF scritti da Emendando)", citta: "Mosca e Sergiev Posad (Russia)", come: "corsia est: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 30 giorni; schede e immagini solo dei codici nuovi)" },
  // Internet Archive (corsia «mondo», dal 26 ottobre 2026)
  archive: { biblioteca: "Internet Archive: manoscritti pubblicati da biblioteche di tutto il mondo (McGill, Columbia, BULAC, Sainte-Geneviève, Joppi di Udine, Starr di Berkeley, John Carter Brown Library, Newberry Library, Fragile Palm Leaves Foundation, biblioteche indiane e altre; dettaglio sotto la tabella)", citta: "varie", come: "corsia mondo, ogni notte (una ricerca per profilo ogni 6 giorni)" },
  // Spagna (corsia «iberia», dal 26 ottobre 2026)
  mdc: { biblioteca: "Memòria Digital de Catalunya: Biblioteca de Catalunya, Ateneu Barcelonès, Biblioteca Museu Víctor Balaguer, Biblioteca Pública Episcopal del Seminari", citta: "Barcellona e Vilanova i la Geltrú (Spagna)", come: "corsia iberia: a ruota finché la prima lettura non è finita, poi ogni notte (raccolta completa ogni 6 giorni)" },
  ub: { biblioteca: "Universitat de Barcelona, CRAI Biblioteca de Fons Antic (Biblioteca Patrimonial Digital)", citta: "Barcellona (Spagna)", come: "corsia iberia, ogni notte (raccolta completa ogni 6 giorni)" },
  realbiblioteca: { biblioteca: "Real Biblioteca (Palacio Real) e Real Biblioteca del Monasterio de El Escorial (Real Biblioteca Digital, Patrimonio Nacional)", citta: "Madrid e San Lorenzo de El Escorial (Spagna)", come: "corsia iberia, ogni notte (raccolta completa ogni 6 giorni)" },
  ucm: { biblioteca: "Universidad Complutense de Madrid, Biblioteca Histórica Marqués de Valdecilla", citta: "Madrid (Spagna)", come: "corsia iberia, ogni notte (raccolta completa ogni 6 giorni)" },
  sevilla: { biblioteca: "Biblioteca de la Universidad de Sevilla (copie digitali su Internet Archive)", citta: "Siviglia (Spagna)", come: "corsia iberia, ogni notte (raccolta completa ogni 6 giorni)" },
  rah: { biblioteca: "Real Academia de la Historia (manifesti IIIF scritti da Emendando)", citta: "Madrid (Spagna)", come: "corsia iberia: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 14 giorni; manifesti scritti dal catalogo)" },
  // America Latina, siti solo PDF (dal 26 ottobre 2026)
  bnchile: { biblioteca: "Biblioteca Nacional de Chile (codici in pubblico dominio, per Memoria Chilena o per età; immagini estratte dai PDF)", citta: "Santiago (Cile)", come: "fatta una volta a mano: PDF estratti nel ramo «immagini», manifesti scritti dal catalogo" },
  bnv: { biblioteca: "Biblioteca Nacional de Venezuela (Biblioteca Digital César Rengifo; immagini estratte dai PDF)", citta: "Caracas (Venezuela)", come: "fatta una volta a mano: PDF estratti nel ramo «immagini», manifesti scritti dal catalogo" },
  // Asia orientale e Sud-est asiatico (corsia «asia», dal 26 ottobre 2026)
  crossasia: { biblioteca: "CrossAsia (Staatsbibliothek zu Berlin): Digital Library of Lao Manuscripts (Biblioteca nazionale del Laos) e Digital Library of Northern Thai Manuscripts", citta: "Laos e Thailandia del Nord", come: "corsia asia: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 14 giorni)" },
  sbbasia: { biblioteca: "Staatsbibliothek zu Berlin: manoscritti dell'Asia orientale e del Sud-est asiatico (cinesi, naxi, mancesi, mongoli, tibetani, thai, giavanesi, malesi, bugi, batak)", citta: "Berlino", come: "corsia asia, ogni notte (raccolta OAI completa ogni 14 giorni)" },
  nomfoundation: { biblioteca: "Vietnamese Nôm Preservation Foundation: manoscritti Hán-Nôm della Biblioteca nazionale del Vietnam e dei templi Thắng Nghiêm e Phổ Nhân (manifesti IIIF scritti da Emendando)", citta: "Hanoi (Vietnam)", come: "corsia asia: a ruota finché la prima lettura non è finita, poi ogni notte (elenco ogni 30 giorni; manifesti scritti dal catalogo)" },
  vaticana: { biblioteca: "Biblioteca Apostolica Vaticana", citta: "Città del Vaticano", come: "corsia propria: a ruota, senza pause tra un'esecuzione e l'altra" },
};

const leggi = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
const giorno = t => (t ? new Date(t).toISOString().slice(0, 10) : null);
const num = n => Number(n || 0).toLocaleString("it-IT");
// tempo che manca, in parole semplici: ore fino a due giorni, poi giorni
export const durata = ore => (ore <= 48 ? `circa ${Math.max(1, Math.ceil(ore))} ${Math.ceil(ore) <= 1 ? "ora" : "ore"}` : `circa ${Math.ceil(ore / 24)} giorni`);
// ritmi delle corsie a ruota (circa 150 minuti di lavoro ogni 165 minuti circa): Vaticana un manifesto ogni 10 secondi,
// Yale una pagina OAI ogni 5 secondi circa, Bodleian un manifesto ogni 2,7 secondi circa
export const ORARI = { vaticana: 330, yale: 640, bodleian: 1200 };   // al netto delle pause tra un'esecuzione e l'altra, per ora

// fonti con un elenco e poi un manifesto (o una pagina) da leggere per codice: q = ancora da leggere, 0 = non leggibile
function manifestiLetti(file, nome, secondi) {
  const s = leggi(file); if (!s) return { testo: "non ancora cominciata" };
  const vs = Object.values(s.voci || {}), resto = vs.filter(v => v && v.q).length;
  if (resto) return { testo: `${num(vs.length - resto)} ${nome} letti su ${num(vs.length)}; a riprese, a ruota: mancano ${durata(resto * secondi / 3600 * 1.15)}`, data: s.aggiornato };
  return { testo: `${nome} letti tutti (${num(vs.length)})`, data: s.completato || s.aggiornato };
}

// avanzamento della lettura, in parole semplici, dagli stati delle raccolte
export const AVANZAMENTO = {
  heidelberg: (det = {}) => {
    const c = leggi(path.join(CACHE, "stato-heidelberg.json")), i = leggi("data/heidelberg-indici.json");
    // senza la cache delle raccolte OAI (corsie diverse dalla giornaliera) resta il testo precedente
    if (!c) return { testo: null };
    const parti = [];
    if (c && c.versione === 2) parti.push(c.completato ? `schede lette tutte (${num(c.voci.length)})` : `schede: ${num(c.pagine)} pagine lette, in corso`);
    else if (c) parti.push("raccolta da rifare con tutti i manoscritti (alla prossima notte)");
    if (i) parti.push(`indici ${num(Object.keys(i.voci || {}).length)}${det.candidati ? " su " + num(det.candidati) : ""}`);
    return { testo: parti.join("; ") || "schede lette ogni 6 giorni", data: (i && i.aggiornato) || (c && c.aggiornato) };
  },
  ecodices: () => oai("ecodices"),
  bsb: () => oai("bsb"),
  berlino: () => oai("berlino"),
  sbbor: () => {
    const s = leggi("data/sbbor.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.token) return { testo: `in corso: ${num(s.pagine * 10)} schede OAI lette su ${num(s.totale)}, a ruota (corsia asia)`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} schede; fuori documenti e lettere, l'Asia orientale e il Sud-est asiatico (fonte «sbbasia») e i codici già nella fonte «berlino»)`, data: s.completato || s.aggiornato };
  },
  bodleian: () => {
    const s = leggi("data/bodleian.json"); if (!s) return { testo: "non ancora cominciata" };
    const letti = Object.keys(s.voci || {}).length, resto = Math.max(0, (s.totale_collezione || 0) - letti);
    return { testo: `${num(letti)} schede lette su ${num(s.totale_collezione)}${resto ? `; a riprese, a ruota: mancano ${durata(resto / ORARI.bodleian)}` : ""}`, data: s.aggiornato };
  },
  gallica: () => {
    // parti data/gallica-<n>.json (e data/gallica.json se c'è): schede raccolte dal browser, poi il filtro dei manoscritti librari
    const s = leggiGallica(); if (!s.parti) return { testo: "nessuna raccolta dal browser" };
    if (!s.record.length) return { testo: `solo i fondi latini (raccolta dal browser del ${giorno(s.raccolto)}): per avere tutti i manoscritti va lanciato scripts/browser/gallica.js`, data: s.raccolto };
    const sc = {}; let n = 0;
    for (const o of s.record) { const m = motivoGallica(o); if (m) sc[m] = (sc[m] || 0) + 1; else n++; }
    const fuori = Object.values(sc).reduce((a, b) => a + b, 0), principali = Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m, k]) => `${m} ${num(k)}`).join(", ");
    return { testo: `${num(s.record.length)} schede raccolte dal browser il ${giorno(s.raccolto)} (${s.completa ? "raccolta completa" : "raccolta non completa"}, ${s.parti} file); ` +
      `${num(n)} manoscritti librari; fuori ${num(fuori)} schede (${principali}, altre ${num(fuori - Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 4).reduce((a, [, k]) => a + k, 0))})`, data: s.raccolto };
  },
  laurenziana: () => {
    const s = leggi("data/laurenziana.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso: collezione ${s.cursore.collezione}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} codici)`, data: s.aggiornato };
  },
  ambrosiana: () => {
    const s = leggi("data/ambrosiana.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), conCopia = vs.filter(v => v.u && v.u.length).length, daLeggere = vs.filter(v => !v.u && !v.x).length;
    if (s.cursore != null) return { testo: `in corso: elenco della Biblioteca Digitale letto fino al codice ${num(s.cursore)} di circa ${num(s.totale)}`, data: s.aggiornato };
    if (daLeggere) return { testo: `in corso: ${num(vs.length - daLeggere)} schede lette su ${num(vs.length)} codici della Biblioteca Digitale (circa ${Math.max(1, Math.ceil(daLeggere * 1.6 / 60))} minuti di lettura ancora); ${num(conCopia)} con la copia digitale`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(vs.length)} codici della Biblioteca Digitale; ${num(conCopia)} con la copia digitale)`, data: s.elenco || s.aggiornato };
  },
  montecassino: () => {
    const s = leggi("data/montecassino.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} codici su ${num(s.totale)} schede di tipo «Manoscritto»; fuori le pergamene d'archivio)`, data: s.completato || s.aggiornato };
  },
  casanatense: () => {
    const s = leggi("data/casanatense.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} codici della collezione Manoscritti)`, data: s.completato || s.aggiornato };
  },
  bub: () => {
    const s = leggi("data/bub.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} codici su ${num(s.totale)} di tipo «codices» in Historica)`, data: s.completato || s.aggiornato };
  },
  leiden: () => {
    const s = leggi("data/leiden.json"); if (!s) return { testo: "non ancora cominciata" };
    // solo i manoscritti librari che passano il filtro (fuori schede BNM, lettere, archivi, parti doppie; nessun limite di data)
    const ctx = contestoLeiden(s.voci), tutte = Object.values(s.voci || {}), n = tutte.filter(v => motivoLeiden(v, ctx) == null).length;
    if (s.cursore != null) return { testo: `in corso: ${num(n)} codici su ${num(tutte.length)} schede lette (collezione ${(s.cursore.c ?? 0) + 1} di 2, pagina ${(s.cursore.p ?? 0) + 1})`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(tutte.length)}); ${num(n)} manoscritti librari`, data: s.aggiornato };
  },
  yale: () => {
    const s = leggi("data/yale.json"); if (!s) return { testo: "non ancora cominciata" };
    // solo i manoscritti librari che passano il filtro (fuori archivi, lettere, fotografie e dattiloscritti; nessun limite di data)
    const n = Object.values(s.voci || {}).filter(ammessaYale).length, pagine = Math.ceil((s.totale || 0) / 25);
    const pagina = Math.max(s.pagine || 0, s.sospeso ? +(/:(\d+)$/.exec(s.sospeso) || [0, 0])[1] / 25 : 0);
    if (s.coda && s.coda.length && !s.completato) {
      const ore = Math.max(0, pagine - pagina) / ORARI.yale;
      const fase = s.coda[0] ? `lingue antiche e medievali (insiemi rimasti: ${s.coda.length - 1}), poi tutti i record` : `tutti i record, ${num(pagina)} pagine su circa ${num(pagine)}`;
      return { testo: `prima lettura in corso: ${fase} (${num(n)} manoscritti finora); mancano ${durata(ore)}`, data: s.aggiornato };
    }
    if (s.coda && s.coda.length) return { testo: `aggiornamento in corso (${num(n)} manoscritti)`, data: s.aggiornato };
    return { testo: `record letti tutti (${num(n)} manoscritti); poi solo i record cambiati, ogni 6 giorni`, data: s.completato || s.aggiornato };
  },
  penn: () => {
    const s = leggi("data/penn.json"); if (!s) return { testo: "non ancora cominciata" };
    if (!s.cursore && !s.completato) return { testo: "lettura completa da rifare: riparte a ruota (corsia usa)", data: s.aggiornato };
    if (s.cursore) return { testo: `in corso: forma ${(s.cursore.f ?? 0) + 1}, pagina ${s.cursore.p}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} manoscritti)`, data: s.aggiornato };
  },
  ds: () => {
    const s = leggi("data/ds.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length;
    if (s.cursore) return { testo: `in corso: ${s.cursore.fase}${s.cursore.fase === "elenco" ? ", pagina " + s.cursore.p : ""}`, data: s.aggiornato };
    return { testo: `schede con immagini lette tutte (${num(n)} con manifesto su ${num(s.totale)}); fuori i doppioni di Penn e Yale e i domini non verificati`, data: s.completato || s.aggiornato };
  },
  walters: () => {
    const s = leggi("data/walters.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), n = vs.length, imm = vs.flatMap(v => v.p || []), mis = imm.filter(x => x[4] !== 0).length;
    const ore = (imm.length - mis) * 15 / 3600, giorni = Math.ceil(ore);   // circa 15 secondi per misura, 60 minuti per notte
    const misure = `misure delle immagini: ${num(mis)} su ${num(imm.length)} vere${imm.length > mis ? `, le altre stimate dal tipo di pagina (mancano circa ${num(giorni)} notti)` : ""}`;
    // circa 100 secondi per codice (descrizione e una misura): circa 36 codici all'ora, 60 minuti per giro della corsia usa a ruota
    if (n < (s.totale || 0)) return { testo: `in corso, a ruota: ${num(n)} codici letti su ${num(s.totale)} (mancano ${durata((s.totale - n) / 36 * 1.1)}); ${misure}`, data: s.aggiornato };
    return { testo: `codici letti tutti (${num(n)}); ${misure}`, data: s.aggiornato };
  },
  loc: () => {
    const s = leggi("data/loc.json"); if (!s) return { testo: "non ancora cominciata" };
    if (!s.cursore && !s.completato) return { testo: "lettura completa da rifare: riparte a ruota (corsia usa)", data: s.aggiornato };
    const n = Object.keys(s.voci || {}).length, tot = Object.values(s.totali || {}).reduce((a, b) => a + b, 0);
    if (s.cursore) return { testo: `in corso: ${s.cursore.c ? "Gerusalemme" : "Sinai"}, pagina ${s.cursore.p}`, data: s.aggiornato };
    return { testo: `item letti tutti (${num(n)} codici su ${num(tot)} item delle due collezioni; fuori firmani, rotoli, cataloghi moderni)`, data: s.completato || s.aggiornato };
  },
  cudl: () => manifestiLetti("data/cudl.json", "manifesti", 1.6),
  manchester: () => manifestiLetti("data/manchester.json", "manifesti", 1.6),
  cbl: () => manifestiLetti("data/cbl.json", "manifesti", 10.5),
  parker: () => manifestiLetti("data/parker.json", "codici", 3.2),
  nlw: () => manifestiLetti("data/nlw.json", "manifesti", 1.6),
  isos: () => manifestiLetti("data/isos.json", "codici", 1.6),
  wellcome: () => {
    const s = leggi("data/wellcome.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso: ricerca ${s.cursore.r + 1} di 2, pagina ${s.cursore.p}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} manoscritti con copia digitale aperta)`, data: s.completato || s.aggiornato };
  },
  bl: () => {
    const s = leggi("data/bl.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), lette = vs.filter(v => v.y).length;
    if (!s.completato) return { testo: `in corso, a ruota: ${num(lette)} schede lette su ${num(vs.length)} (fuori India Office Records, charters, papiri)`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(lette)} su ${num(vs.length)} con copia digitale nel nuovo IIIF o nella Qatar Digital Library; fuori India Office Records, charters, papiri, lettere)`, data: s.completato };
  },
  nlg: () => {
    const s = leggi("data/nlg.json"); if (!s) return { testo: "non ancora cominciata" };
    const v = Object.values(s.voci || {}), letti = v.filter(x => x.p).length, err = v.filter(x => x.x).length;
    return { testo: `${num(letti)} manifesti letti su ${num(v.length)} manoscritti${err ? `; ${num(err)} con il manifesto non leggibile` : ""}${letti + err < v.length ? "; gli altri alla prossima" : ""}`, data: s.aggiornato };
  },
  ndl: () => {
    const s = leggi("data/ndl.json"); if (!s) return { testo: "non ancora cominciata" };
    if (!s.cursore && !s.completato) return { testo: "lettura completa da rifare: riparte a ruota (corsia mondo)", data: s.aggiornato };
    const n = Object.keys(s.voci || {}).length;
    if (s.cursore) return { testo: `in corso: ${num(s.letti)} record letti${s.cursore.completa && s.totale ? " su " + num(s.totale) : " (record cambiati)"}; ${num(n)} manoscritti finora`, data: s.aggiornato };
    const vv = Object.values(s.voci || {}), ok = vv.filter(v => v.m === "ok").length, ng = vv.filter(v => v.m === "ng").length;
    const ctl = ok + ng < n ? `; manifesti controllati ${num(ok + ng)} su ${num(n)} (${num(ng)} non pubblici, fuori; il controllo continua a riprese)` : `; manifesti controllati tutti (${num(ng)} non pubblici, fuori)`;
    return { testo: `record letti tutti (${num(s.totale)} libri antichi digitalizzati; ${num(n)} manoscritti; fuori i libri a stampa)${ctl}`, data: s.completato || s.aggiornato };
  },
  kokusho: () => {
    const s = leggi("data/kokusho.json"); if (!s) return { testo: "non ancora cominciata" };
    if (!s.cursore && !s.completato) return { testo: "lettura completa da rifare: riparte a ruota (corsia mondo)", data: s.aggiornato };
    const n = Object.keys(s.voci || {}).length;
    if (s.cursore) return { testo: `in corso: pagina ${num(s.cursore.p)} di ${num(s.pagine)} (${num(n)} manoscritti finora)`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(s.totale)} manoscritti con immagini; ${num(n)} con immagini proprie; fuori i libri a stampa e la NDL)`, data: s.completato || s.aggiornato };
  },
  slv: () => {
    const s = leggi("data/slv.json"); if (!s) return { testo: "elenco non ancora raccolto: va lanciato scripts/browser/slv.js dal browser" };
    return { testo: `${num(Object.keys(s.voci || {}).length)} oggetti digitali raccolti dal browser il ${giorno(s.raccolto)} (ricerche: ${(s.ricerche || []).length})`, data: s.raccolto };
  },
  onb: () => {
    const s = leggi("data/onb.json"); if (!s) return { testo: "non ancora cominciata" };
    const v = Object.values(s.voci || {}), letti = v.filter(x => x.s || x.x).length, codici = v.filter(x => x.s && !x.x).length;
    return { testo: `${num(letti)} manifesti letti su ${num(v.length)} candidati (${num(codici)} codici; fuori lettere, autografi, musica, fotografie di singole carte)${letti < v.length ? "; gli altri alle prossime esecuzioni" : ""}`, data: s.completato || s.aggiornato };
  },
  bncf: () => {
    const s = leggi("data/bncf.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `${num(Object.keys(s.voci || {}).length)} oggetti «BNCF - Manuscripts» su Internet Archive (fuori lettere sciolte, carte nautiche, disegni, inventari)`, data: s.completato || s.aggiornato };
  },
  vallicelliana: () => {
    const s = leggi("data/vallicelliana.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `${num(Object.keys(s.voci || {}).length)} volumi su OMNES (fuori i libri a stampa)`, data: s.completato || s.aggiornato };
  },
  malatestiana: () => {
    const s = leggi("data/malatestiana.json"); if (!s) return { testo: "non ancora cominciata" };
    const v = Object.values(s.voci || {}), letti = v.filter(x => x.p != null || x.x).length;
    return { testo: `${num(letti)} schede lette su ${num(v.length)} codici${letti < v.length ? "; le altre alle prossime esecuzioni" : ""}`, data: s.completato || s.aggiornato };
  },
  classense: () => {
    const s = leggi("data/classense.json"); if (!s) return { testo: "elenco non ancora raccolto: va lanciato scripts/browser/classense.js dal browser" };
    return { testo: `${num(Object.keys(s.voci || {}).length)} schede dell'insieme «Manoscritti» raccolte dal browser il ${giorno(s.raccolto)}`, data: s.raccolto };
  },
  auckland: () => {
    const s = leggi("data/auckland.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso, a ruota: record ${num(s.cursore.inizio)} di ${num(s.totale)}`, data: s.aggiornato };
    if (!s.cursore && !s.completato) return { testo: "lettura completa da rifare: riparte a ruota (corsia mondo)", data: s.aggiornato };
    return { testo: `oggetti letti tutti (${num(s.totale)}; ${num(Object.keys(s.voci || {}).length)} codici: medievali e orientali, fuori lettere e carte d'archivio)`, data: s.completato || s.aggiornato };
  },
  toronto: () => {
    const s = leggi("data/toronto.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), letti = vs.filter(v => v.n).length;
    if (!s.completato) return { testo: `in corso, a ruota: ${num(letti)} manifesti letti su ${num(vs.length)}`, data: s.aggiornato };
    return { testo: `manifesti letti tutti (${num(letti)} su ${num(vs.length)} delle collezioni IIIF «Manuscripts» e «Manuscript Fragments»; fuori lettere, diari e carte d'archivio)`, data: s.completato };
  },
  pergamos: () => {
    const s = leggi("data/pergamos.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {});
    return { testo: `codici letti tutti (${num(vs.length)} nella collezione; ${num(vs.filter(v => v.p).length)} con immagini)`, data: s.completato || s.aggiornato };
  },
  rousanou: () => {
    const s = leggi("data/rousanou.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), letti = vs.filter(v => v.n).length, err = vs.filter(v => v.x).length;
    return { testo: `${num(letti)} manifesti letti su ${num(vs.length)} codici${err ? `; ${num(err)} con il manifesto non leggibile` : ""}`, data: s.aggiornato };
  },
  libfond: () => {
    const s = leggi("data/libfond.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), letti = vs.filter(v => v.i !== undefined).length, con = vs.filter(v => v.i && v.w).length;
    const fondi = Object.values(s.fondi || {}), presi = fondi.filter(f => !f.escluso).length;
    if (s.cursore) return { testo: `in corso, a ruota: elenco al fondo ${num(s.cursore.fondo + 1)} di ${num(presi)} (${num(vs.length)} codici finora)`, data: s.aggiornato };
    if (!s.completato) return { testo: `in corso, a ruota: schede e immagini lette per ${num(letti)} codici su ${num(vs.length)}`, data: s.aggiornato };
    return { testo: `codici letti tutti (${num(vs.length)} in ${num(presi)} fondi di libri manoscritti su ${num(fondi.length)}; ${num(con)} con immagini; fuori archivi, autografi, carte e stampati)`, data: s.completato };
  },
  ija: () => {
    const s = leggi("data/ija.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {});
    if (!s.completato) return { testo: `in corso: media letti per ${num(vs.filter(v => v.i != null || v.x).length)} candidati su ${num(vs.length)}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(s.totale || 0)} oggetti; ${num(vs.length)} manoscritti candidati; entrano quelli con la copia intera nelle immagini IIIF, fuori i libri con la copia intera solo in PDF)`, data: s.completato };
  },
  bms: () => {
    const s = leggi("data/bms.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), letti = vs.filter(v => v.n != null || v.x).length;
    if (!s.completato) return { testo: `in corso, a ruota: schede lette ${num(letti)} su ${num(vs.length)}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(vs.length)} tra manoscritti e carte; ${num(vs.filter(v => v.n).length)} con immagini)`, data: s.completato };
  },
  nbkm: () => {
    const s = leggi("data/nbkm.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), letti = vs.filter(v => v.n != null).length, con = vs.filter(v => v.n && v.w).length;
    if (!s.completato) return { testo: `in corso, a ruota: pagine contate per ${num(letti)} codici su ${num(vs.length)}`, data: s.aggiornato };
    return { testo: `codici letti tutti (${num(vs.length)} nelle cinque collezioni; ${num(con)} con immagini)`, data: s.completato };
  },
  ...Object.fromEntries(Object.keys(FONTI_HSP).map(f => [f, () => { const a = aRiprese(`data/${f}.json`, 1); return { ...a, testo: a.testo.replace("schede lette tutte", "codici digitalizzati letti tutti") }; }])),
  nli: () => {
    const s = leggi("data/nli.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.fase) return { testo: `in corso, a ruota (corsia mondo): fase ${s.fase}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} manoscritti con immagini su ${num(s.totale)} in Europeana; fuori ketubbot, lettere, documenti, registri e i codici di Lipsia)`, data: s.completato || s.aggiornato };
  },
  getty: () => {
    const s = leggi("data/getty.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), letti = vs.filter(v => !v.q).length;
    if (!s.completato) return { testo: `in corso: ${num(letti)} schede lette su ${num(vs.length)}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(vs.length)} manoscritti «whole» del Museo; spesso solo le pagine miniate)`, data: s.completato };
  },
  harvard: () => {
    const s = leggi("data/harvard.json"); if (!s) return { testo: "elenco non ancora raccolto: va lanciato scripts/browser/harvard.js dal browser" };
    return { testo: `${num(Object.keys(s.voci || {}).length)} schede di LibraryCloud raccolte dal browser il ${giorno(s.raccolto)} (entrano solo i manoscritti librari non già in Digital Scriptorium)`, data: s.raccolto };
  },
  archive: () => {
    const s = leggi("data/archive.json"); if (!s) return { testo: "non ancora cominciata" };
    const p = s.profili || {};
    return { testo: `${num(Object.keys(s.voci || {}).length)} oggetti letti da ${num(Object.keys(p).length)} biblioteche o collezioni (entrano solo i manoscritti librari: fuori stampati, facsimili, lettere, documenti, fogli singoli e doppioni)`, data: s.completato || s.aggiornato };
  },
  // Spagna (corsia «iberia»)
  ...Object.fromEntries(["mdc", "ub", "realbiblioteca", "ucm", "sevilla", "auc", "northwestern"].map(f => [f, () => {
    const s = leggi(`data/${f}.json`); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso, a ruota (corsia ${["auc", "northwestern"].includes(f) ? "mondo" : "iberia"})`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} schede; entrano solo i manoscritti librari)`, data: s.completato || s.aggiornato };
  }])),
  rah: () => {
    const s = leggi("data/rah.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), mis = vs.filter(v => v && v.w).length;
    if (s.token || !s.elenco) return { testo: `in corso: ${num(s.letti)} schede OAI lette su ${num(s.totale)}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(s.totale)} schede OAI, quasi tutte documenti e lettere; ${num(vs.length)} codici); misure delle immagini prese per ${num(mis)} codici`, data: s.completato || s.aggiornato };
  },
  // America Latina, siti solo PDF: pagine estratte una volta, misure in data/latam_pdf.json
  ...Object.fromEntries(["bnchile", "bnv"].map(f => [f, () => {
    const s = leggi("data/latam_pdf.json"); if (!s || !s.pagine || !s.pagine[f]) return { testo: "immagini non ancora estratte" };
    return { testo: `${num(Object.keys(s.pagine[f]).length)} codici librari estratti dai PDF della biblioteca (pagine nel ramo «immagini»)`, data: s.aggiornato };
  }])),
  handrit: () => {
    const s = leggi("data/handrit.json"); if (!s) return { testo: "non ancora cominciata" };
    const fuori = Object.values(s.fuori || {}).reduce((a, b) => a + b, 0);
    return { testo: `descrizioni lette tutte (${num(s.totale)} codici digitalizzati; ${num(Object.keys(s.voci || {}).length)} manoscritti librari, fuori ${num(fuori)} diplomi e carte d'archivio)`, data: s.completato || s.aggiornato };
  },
  polona: () => {
    const s = leggi("data/polona.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso: biblioteca ${s.cursore.b + 1} di ${(s.biblioteche || []).length} (${num(Object.keys(s.nuove || {}).length)} schede finora su ${num(s.totale)})`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} manoscritti senza diritti d'autore; entrano quelli in pubblico dominio o con licenza aperta, fuori lettere e documenti)`, data: s.completato || s.aggiornato };
  },
  manuscriptorium: () => {
    const s = leggi("data/manuscriptorium.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore != null) return { testo: `in corso: ${num(s.cursore)} schede lette su ${num(s.totale)}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} con copia digitale, senza editore né soggetto di stampato; fuori le copie di biblioteche già nel catalogo, carte geografiche, lettere e stampati riconoscibili dalla segnatura)`, data: s.completato || s.aggiornato };
  },
  kbdk: () => {
    const s = leggi("data/kbdk.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length;
    if (s.cursore) return { testo: `in corso: ${num(n)} schede lette finora`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(n)} nelle collezioni di codici, frammenti, manoscritti orientali ed ebraici; entrano solo i manoscritti librari, fuori lettere, diari, conti e carte d'archivio)`, data: s.completato || s.aggiornato };
  },
  nb: () => {
    const s = leggi("data/nb.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), carte = vs.filter(v => v.e === "k"), lette = carte.filter(v => v.k).length;
    if (s.cursore) return { testo: `in corso, a ruota: elenco ${s.cursore.l + 1} di 3 (${num(Object.keys(s.nuove || {}).length)} schede finora)`, data: s.aggiornato };
    if (lette < carte.length) return { testo: `in corso, a ruota: ${num(vs.length)} schede in elenco; schede MODS delle carte lette ${num(lette)} su ${num(carte.length)}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(vs.length)} con copia digitale aperta: manoscritti senza le lettere, manoscritti musicali, ${num(carte.length)} carte; fuori lettere, telegrammi, testamenti e altri documenti)`, data: s.completato || s.aggiornato };
  },
  manuscripta: () => {
    const s = leggi("data/manuscripta.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} codici e frammenti digitalizzati, anche in parte)`, data: s.completato || s.aggiornato };
  },
  bnl: () => {
    const s = leggi("data/bnl.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), con = vs.filter(v => v.p).length;
    if (!s.completato) return { testo: `in corso: pagine lette per ${num(con)} manoscritti su ${num(vs.length)}`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(vs.length)} manoscritti, ${num(con)} con le pagine)`, data: s.completato };
  },
  crossasia: () => {
    const s = leggi("data/crossasia.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length, t = Object.values(s.totali || {}).reduce((a, b) => a + b, 0);
    if (s.cursore) return { testo: `in corso, a ruota: ${num(n)} manoscritti letti${t ? " su circa " + num(t) : ""} (sito ${s.cursore.s + 1} di 2, pagina ${num(s.cursore.p)})`, data: s.aggiornato };
    return { testo: `elenchi letti tutti (${num(n)} manoscritti: Laos ${num((s.totali || {}).dllm)}, Thailandia del Nord ${num((s.totali || {}).lanna)})`, data: s.completato || s.aggiornato };
  },
  sbbasia: () => {
    const s = leggi("data/sbbasia.json"); if (!s) return { testo: "non ancora cominciata" };
    if (s.cursore) return { testo: `in corso: insieme ${s.cursore.i + 1} di 2`, data: s.aggiornato };
    return { testo: `record letti tutti (${num(Object.keys(s.voci || {}).length)} manoscritti negli insiemi «ostasiatische» e «suedostasiatische Handschriften»; fuori le cartelle di catalogazione «Pustaka»)`, data: s.completato || s.aggiornato };
  },
  nomfoundation: () => {
    const s = leggi("data/nomfoundation.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), lette = vs.filter(v => v.cod || v.x).length, mss = vs.filter(v => v.n && v.w).length;
    if (lette < vs.length) return { testo: `in corso, a ruota: ${num(lette)} schede lette su ${num(vs.length)} volumi (${num(mss)} manoscritti finora)`, data: s.aggiornato };
    return { testo: `schede lette tutte (${num(vs.length)} volumi; ${num(mss)} manoscritti, fuori le xilografie)`, data: s.completato || s.aggiornato };
  },
  uva: () => {
    const s = leggi("data/uva.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} oggetti «Manuscript» che non sono lettere; fuori anche le tesi a stampa e i cataloghi)`, data: s.completato || s.aggiornato };
  },
  vlaustria: () => {
    const s = leggi("data/vlaustria.json"); if (!s) return { testo: "non ancora cominciata" };
    const vs = Object.values(s.voci || {}), letti = vs.filter(v => v.n != null || v.x).length;
    if (!s.completato) return { testo: `in corso, a ruota: ${num(letti)} manifesti letti su ${num(vs.length)} schede delle collezioni di manoscritti`, data: s.aggiornato };
    return { testo: `manifesti letti tutti (${num(vs.length)} schede delle collezioni di manoscritti; entrano i codici con immagini, fuori a Salisburgo le sole descrizioni e i libri a stampa dei Cappuccini)`, data: s.completato };
  },
  elte: () => {
    const s = leggi("data/elte.json"); if (!s) return { testo: "non ancora cominciata" };
    return { testo: `schede lette tutte (${num(Object.keys(s.voci || {}).length)} nelle collezioni «Kódexek», «Kódextöredékek» e manoscritti moderni)`, data: s.completato || s.aggiornato };
  },
  vaticana: () => {
    const s = leggi("data/vaticana.json"); if (!s) return { testo: "non ancora cominciata" };
    const n = Object.keys(s.voci || {}).length;
    if (!s.elenco || !s.elenco.totale) return { testo: `${num(n)} codici letti; elenco dei codici digitalizzati non ancora scaricato`, data: s.aggiornato };
    const g = stimaVaticana(s);
    if (!g.manifesti) return { testo: `codici digitalizzati letti tutti (${num(n)} su ${num(s.elenco.totale)})`, data: s.aggiornato };
    return { testo: `${num(n)} codici letti su ${num(s.elenco.totale)} digitalizzati; ${g.fondo ? "fondo in corso: " + segnaturaLeggibile(g.fondo + ".").trim() + "; " : ""}` +
      `restano circa ${num(g.manifesti)} manifesti da leggere, cioè ${durata(g.ore)} (un manifesto ogni 10 secondi, come chiede la biblioteca)`, data: s.aggiornato };
  },
};

// Vaticana: codici digitalizzati ancora da leggere (dall'elenco della biblioteca) e tempo che serve, a circa 330 manifesti
// all'ora (corsia propria a ruota: circa 7900 al giorno)
export function stimaVaticana(s) {
  const d = daLeggere(s), p = d.segnature[0];
  return { manifesti: d.totale, ore: d.totale / ORARI.vaticana, giorni: Math.ceil(d.totale / ORARI.vaticana / 24), fondo: p ? Object.keys(s.elenco.fondi).filter(f => p.startsWith(f + ".")).sort((a, b) => b.length - a.length)[0] : null };
}

// fonti lette a pagine con stato in data/<fonte>.json: { totale, cursore (pagina), completato, voci }
function aRiprese(file, perPagina) {
  const s = leggi(file); if (!s) return { testo: "non ancora cominciata" };
  const n = Object.keys(s.voci || {}).length;
  if (s.cursore != null) return { testo: `in corso: ${num(Math.min(s.cursore * perPagina, s.totale || 0) || n)} schede lette su ${num(s.totale)}`, data: s.aggiornato };
  return { testo: `schede lette tutte (${num(n)} su ${num(s.totale)})`, data: s.aggiornato };
}

function oai(fonte) {
  const c = leggi(path.join(CACHE, `stato-${fonte}.json`));
  // senza la cache delle raccolte OAI (corsie diverse dalla giornaliera) resta il testo precedente
  if (!c) return { testo: null };
  if (c.versione !== 2) return { testo: "raccolta da rifare con tutti i manoscritti (alla prossima notte)", data: c.aggiornato };
  return { testo: c.completato ? `schede lette tutte (${num(c.voci.length)} schede)` : `in corso: ${num(c.pagine)} pagine lette`, data: c.aggiornato };
}

// esiti delle raccolte vere: { fonte: { quando, esito, ultimo_ok } }
export function registraEsiti(esito) {
  const r = leggi(FILE_RACCOLTE) || {};
  const ora = new Date().toISOString();
  for (const [f, e] of Object.entries(esito)) {
    if (e === "precedente") continue;
    r[f] = { quando: ora, esito: e, ultimo_ok: e === "ok" ? ora : (r[f] && r[f].ultimo_ok) || null };
  }
  fs.mkdirSync(path.dirname(FILE_RACCOLTE), { recursive: true });
  fs.writeFileSync(FILE_RACCOLTE, JSON.stringify(Object.fromEntries(Object.entries(r).sort()), null, 1) + "\n");
  return r;
}

// esito in parole semplici
export function esitoLeggibile(e) {
  if (!e) return "—";
  if (e.esito === "ok") return "riuscita";
  if (/incomplet|riprender/i.test(e.esito)) return "in corso, riprende alla prossima";
  if (/tempo complessivo esaurito/.test(e.esito)) return "rimandata alla prossima";
  return "non riuscita: " + e.esito.replace(/^errore:\s*/, "").slice(0, 120);
}

// lingue di una fonte: le tre più frequenti, con il numero di codici
function lingueTesto(lf = {}) {
  const arr = Object.entries(lf).sort((a, b) => b[1] - a[1]);
  if (!arr.length) return "—";
  const nome = k => (k === "?" ? "non indicata" : NOMI_LINGUE[k] || k);
  const testa = arr.slice(0, 3).map(([k, n]) => `${nome(k)} ${num(n)}`).join(", ");
  return arr.length > 3 ? `${testa}, altre ${num(arr.slice(3).reduce((x, y) => x + y[1], 0))}` : testa;
}

// tabella delle fonti agganciate (testo tra i segnaposto)
// celle della tabella già scritta, per biblioteca (per tenere l'avanzamento quando lo stato non è disponibile)
export function righePrecedenti(doc = "") {
  const m = {};
  for (const r of doc.split("\n")) if (/^Digital Scriptorium, codici per istituzione/.test(r)) m.__ds = r;
  for (const r of doc.split("\n")) if (/^Internet Archive, codici per istituzione/.test(r)) m.__ia = r;
  for (const r of doc.split("\n")) if (/^\| /.test(r) && !/^\| (Biblioteca|---)/.test(r)) { const c = r.split(" | "); c[0] = c[0].replace(/^\| /, ""); m[c[0]] = c; }
  return m;
}

export function tabella({ fonti, conteggio = {}, conAutori = {}, lingue = {}, dettagli = {}, precedenti = {} } = {}) {
  const r = leggi(FILE_RACCOLTE) || {};
  const righe = [
    "| Biblioteca | Città | Codici totali | Di cui con autori riconosciuti | Lingue | Avanzamento della lettura | Come si aggiorna | Ultimo aggiornamento | Ultima raccolta |",
    "|---|---|---|---|---|---|---|---|---|",
  ];
  let tot = 0, totA = 0;
  for (const f of fonti) {
    const b = BIBLIOTECHE[f] || { biblioteca: f, citta: "", come: "ogni notte, da sola" };
    const a = (AVANZAMENTO[f] || (() => ({ testo: "" })))(dettagli[f] || {});
    if (a.testo == null) a.testo = (precedenti[b.biblioteca] || [])[5] || "schede lette ogni 6 giorni";
    let come = b.come;
    if (f === "gallica") { const g = leggiGallica(); if (g.raccolto) come += ` (ultima raccolta: ${giorno(g.raccolto)})`; }
    const e = r[f];
    const data = giorno((e && e.ultimo_ok) || a.data) || "—";
    tot += conteggio[f] || 0; totA += conAutori[f] || 0;
    righe.push(`| ${b.biblioteca} | ${b.citta} | ${num(conteggio[f])} | ${num(conAutori[f])} | ${lingueTesto(lingue[f])} | ${a.testo} | ${come} | ${data} | ${esitoLeggibile(e)} |`);
  }
  const dopo = [];
  const ds = dettagli.ds && dettagli.ds.perIstituzione;
  if (ds && Object.keys(ds).length) {
    const sc = dettagli.ds.scarti || {};
    dopo.push("", `Digital Scriptorium, codici per istituzione: ${Object.entries(ds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${num(n)}`).join("; ")}` +
      `${sc.doppioni ? `. Lasciati alle fonti Penn e Yale (doppioni): ${num(sc.doppioni)}` : ""}${sc.dominio ? `. Fuori per manifesto non raggiungibile o da verificare: ${num(sc.dominio)}` : ""}.`);
  } else if (precedenti.__ds) dopo.push("", precedenti.__ds);
  const ia = dettagli.archive && dettagli.archive.perIstituzione;
  if (ia && Object.keys(ia).length) {
    const sc = dettagli.archive.scarti || {}, doppi = Object.entries(sc).filter(([k]) => /^già nel catalogo/.test(k)).reduce((x, [, n]) => x + n, 0);
    dopo.push("", `Internet Archive, codici per istituzione: ${Object.entries(ia).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${num(n)}`).join("; ")}` +
      `${doppi ? `. Lasciati alle altre fonti (doppioni): ${num(doppi)}` : ""}.`);
  } else if (precedenti.__ia) dopo.push("", precedenti.__ia);
  return [`Codici nel catalogo, in tutto: **${num(tot)}**, di cui **${num(totA)}** con almeno un autore riconosciuto.`, "", ...righe, ...dopo].join("\n");
}

export function scriviRegistro(opz) {
  let doc = ""; try { doc = fs.readFileSync(FILE_REGISTRO, "utf8"); } catch (e) {}
  if (!doc.includes(INIZIO) || !doc.includes(FINE)) doc = `# Biblioteche del catalogo\n\n## Agganciate\n\n${INIZIO}\n${FINE}\n` + (doc ? "\n" + doc : "");
  const vecchia = doc.slice(doc.indexOf(INIZIO), doc.indexOf(FINE));
  const nuovo = doc.slice(0, doc.indexOf(INIZIO) + INIZIO.length) + "\n" + tabella({ ...opz, precedenti: righePrecedenti(vecchia) }) + "\n" + doc.slice(doc.indexOf(FINE));
  if (nuovo !== doc) { fs.mkdirSync(path.dirname(FILE_REGISTRO), { recursive: true }); fs.writeFileSync(FILE_REGISTRO, nuovo); return true; }
  return false;
}
