// Internet Archive (archive.org): i manoscritti librari che le biblioteche stesse (o progetti che ne riproducono i fondi) pubblicano
// su Internet Archive, oltre a Firenze (fonte «bncf») e Siviglia (fonte «sevilla»), che restano fonti a parte e qui non si rileggono.
// Ricerca aperta di Internet Archive (services/search/v1/scrape, consentita dal robots.txt, che vieta solo /control/ e /report/),
// una o due richieste per profilo, almeno 1,5 secondi tra una richiesta e l'altra (rete.mjs). Manifesti IIIF Presentation 3 di
// Internet Archive (iiif.archive.org/iiif/3/<id>/manifest.json) e immagini IIIF con CORS aperto (verificato il 26 ottobre 2026,
// anche per gli oggetti «stream_only»); entrano solo gli oggetti con le immagini delle pagine (JP2), quindi con un manifesto vero.
//
// Ogni «profilo» è un caricatore istituzionale o una collezione con metadati affidabili, con il suo filtro (PROFILI, sotto).
// Le ricerche generiche («subject:manuscripts», «title:codex»: circa 190.000 oggetti il 26 ottobre 2026) danno quasi solo libri a
// stampa, edizioni e cataloghi DI manoscritti, microfilm, documenti governativi: non si usano. Fuori, sempre:
//  - libri a stampa, litografie, xilografie, facsimili, microfilm, dattiloscritti, edizioni e cataloghi di manoscritti;
//  - lettere sciolte, carteggi, documenti d'archivio (atti, ricevute, contratti, petizioni, diplomi, ketubbot, firmani), fotografie;
//  - fogli singoli e frammenti (fogli di calligrafia, miniature staccate, foglie di Otto Ege), oggetti con meno di 6 immagini;
//  - la Digital Scriptorium «legacy» (ds-legacy-data, ds-images: poche immagini scelte per codice) e i codici di Penn su OPenn,
//    che il catalogo ha già dalle fonti «ds» e «penn»; i codici della Jagellonica (collezione «polishpdbooks»), che il catalogo
//    ha già da Polona con la segnatura vera (su Internet Archive c'è solo l'identificativo della biblioteca digitale);
//  - i doppioni dei codici che il catalogo ha già da altre fonti (stesso oggetto di Internet Archive o stessa segnatura nella
//    stessa biblioteca: recordArchive, «esistenti»).
// Nel dubbio, fuori. Le carte geografiche disegnate a mano entrano con «tipo: "carta"» (scripts/carte.mjs).
// Stato in data/archive.json (voci compatte per identificativo di Internet Archive); la ricerca si rifà ogni 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { cartaManoscritta } from "../carte.mjs";

export const FILE_STATO = "data/archive.json";
const GIORNI = 6;
const CAMPI = ["identifier", "mediatype", "collection", "title", "date", "subject", "description", "note", "language", "creator", "imagecount", "contributor", "source", "type", "format", "associated-names", "call_number"];
export const manifestoIa = id => `https://iiif.archive.org/iiif/3/${encodeURIComponent(id)}/manifest.json`;

// ------------------------------------------------------------------------------------------------ filtri comuni
const lista = x => (x == null ? [] : Array.isArray(x) ? x : [x]).map(s => String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
const unoDi = x => lista(x).join(" ; ");
// data di Internet Archive: «2025-08-18» (giorno pieno, dal 1990 in poi) è la data del caricamento, non quella del codice
const annoVero = d => (/^(?:199|20[0-9])\d-\d\d-\d\d/.test(String(d || "")) && !/-01-01/.test(String(d)) ? null : anno(d));
const anno = d => { const m = /\b(1[0-9]{3}|20[0-9]{2}|[5-9][0-9]{2})\b/.exec(String(d || "")); return m ? +m[1] : null; };
// stampa e riproduzioni (nel titolo, nel tipo o nelle note fisiche)
const STAMPA = /\b(?:lithograph\w*|litograf\w*|lithographi\w*|xylograph\w*|woodblock|wood-block|block[- ]print\w*|movable type|printed|imprim[ée]e?s?|stampat[oaie]|gedruckt|druck|facsimil\w*|fac-simil\w*|microform|microfilm|microfiche|typescript|dattiloscritt\w*|tapuscrit|photocop\w*|photograph\w*|reprint\w*|edited by|edizione|[ée]dition|ausgabe|catalog(?:ue|us)?\b|catalogo|inventaire|inventario|inwentarz|verzeichnis|press\b|publication)/i;
// lettere, carteggi e documenti d'archivio (titolo)
const DOCUMENTO = /^\s*[\[«"“(]*\s*(?:copy of (?:a )?|extract from |draft of (?:a )?|autograph )?(?:letters?|lettre|lettres|lettera|lettere|brief|briefe|carta (?:de|a|al)\b|cartas|correspondence|correspondance|corrispondenza|carteggio|epistolario|telegram|receipt|re[çc]u|ricevuta|deed|indenture|lease|petition|p[ée]tition|ketubb?ah|firman|ferman|berat|diploma|dipl[ôo]me|certificat\w*|passport|passeport|contract|contrat|contratto|charter|testament\w*|will of|atto|acte|actes|quittance|bill of|invoice|account of|accounts|pay ?roll|muster|commission|warrant|license|licence|patent|lettres patentes|brevet|proc[eè]s|sentenza|sentence|decree|d[ée]cret|ordonnance|bando|pergamena|pergamene|portrait|photograph|photo)\b/i;
// nella descrizione fisica (all'inizio di una nota): fogli singoli e frammenti; ovunque: miniature e fogli staccati
const FOGLIO = /^(?:1 sheet|[1-4] sheets|1 leaf\b|1 f\.|[1-4] (?:feuillets?|ff\.|leaves)\b|single (?:page|leaf|sheet)|leaf from|leaves from|fragments?\b|1 painting|1 folder)/i;
const FOGLIO_OVUNQUE = /\b(?:manuscript painting|manuscript of painting|detached leaf|single leaf|single page from)\b/i;
// stampa nella descrizione: solo formule nette (le descrizioni dei manoscritti citano edizioni e cataloghi, e i fogli di palma
// hanno involucri di cotone «printed»)
const STAMPA_DESC = /\b(?:lithograph(?:ed|s)?|lithographie|litografi[ac]\w*|xylograph\w*|woodblock|wood-block|block[- ]printed|movable type|microform|microfilm|microfiche|typescript|tapuscrit|dattiloscritt\w*|photocop\w*|photocoph\w*|texte imprimé|printed for|university press|facsimiles?|fac-similés?)\b/i;
const STAMPA_NOTA = /^(?:printed|imprimé|reprint|reprinted|edition|[ée]dition|facsimile|photograph)/i;

// ------------------------------------------------------------------------------------------------ profili
/* Ogni profilo: q (ricerca di Internet Archive), biblioteca, citta e:
   ammessa(v): true se la voce compatta è un manoscritto librario (dopo i filtri comuni); segnatura(id, v); titolo(v) facoltativo;
   tipo(v) facoltativo («carta»). Le chiavi della voce compatta: t titolo, d data, l lingue, a autori, s soggetti, c descrizione e
   note (testo), y tipo, o fonte, k chi ha contribuito, n immagini, j 1 se ci sono le immagini delle pagine, g altri nomi. */
const ha = (v, re) => re.test([v.t, v.c, v.s, v.y].filter(Boolean).join(" ; "));
const elementi = v => String(v.c || "").split(" ; ");
const titoloSenza = (t, re) => String(t || "").replace(re, "").replace(/\s+/g, " ").replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, "").trim() || null;

export const PROFILI = {
  // McGill University Library (Montréal): manoscritti islamici, persiani, indiani, europei della Rare Books and Special Collections
  // e della Osler Library. La scheda ha tra le note «Manuscript» (o «Ms. codex»): così si riconoscono tra i libri a stampa.
  mcgill: {
    q: 'collection:mcgilluniversity AND (subject:manuscripts OR description:manuscript OR note:manuscript)',
    biblioteca: "McGill University Library, Rare Books and Special Collections", citta: "Montréal",
    ammessa: v => elementi(v).some(e => /^(?:Ms\. codex|Manuscript(?:,| on| in| written|\.|$)|Manuscrit\b|Holograph)/i.test(e)) && !/facsimil|lithograph|calligraphy -- specimens|calligraphy project|\bin box\b|\bprescriptions\b|\bforms\b|\bfonds\b|\bpapers\b|\bletters\b/i.test(`${v.s} ${v.c} ${v.t}`),
    segnatura: id => {
      const s = id.replace(/^McGillLibrary-/, "").replace(/-\d+$/, "").replace(/^(?:rbsc_|osl_|isl_|rbsc-)+/i, "").replace(/^(?:isl_|islam-)/i, "");
      return s.replace(/[-_]+/g, " ").replace(/\bms\b/gi, "MS").replace(/\brbd\b/gi, "RBD").replace(/\bbw\b/gi, "BW").replace(/\b0+(\d)/g, "$1").trim();
    },
  },
  // Columbia University, Rare Book & Manuscript Library (New York): manoscritti ebraici e del mondo islamico (progetto CLIR), e i
  // pochi altri codici che la biblioteca ha messo su Internet Archive con la scheda «Manuscripts, …».
  columbia: {
    q: 'collection:culhebrewmss OR collection:muslim-world-manuscripts OR (collection:ColumbiaUniversityLibraries AND identifier:ldpd_* AND (subject:manuscripts OR language:*handwritten*))',
    biblioteca: "Columbia University, Rare Book & Manuscript Library", citta: "New York",
    ammessa: v => (annoVero(v.d) == null || annoVero(v.d) < 1900) && !/\bketubb?ah\b|amulet|\bscrolls?\b|forgery|\bletters\b|papyri|register|matricula|by-?laws|case ?book|minutes|\[electronic resource\]/i.test(`${v.t} ${v.s}`)
      && ((v.l || []).some(l => /handwritten/i.test(l)) || /(?::|\[)\s*manuscript\b/i.test(v.t || "") || elementi(v).some(e => /^(?:Manuscript|Ms\.)/i.test(e.trim()))
        || (/culhebrewmss|muslim-world-manuscripts/.test(v.z || "") && /\b\d+ (?:foliated |paginated |unfoliated |unnumbered )?(?:leaves|fol\.)/i.test(v.c || ""))),
    segnatura: id => "ldpd " + id.replace(/^ldpd_/, "").replace(/_000$/, ""),
  },
  // OPenn (Penn Libraries) per le altre biblioteche di Filadelfia e dintorni: Free Library of Philadelphia, Haverford, Bryn Mawr…
  // (i codici di Penn, «Kislak Center» e «Rare Book & Manuscript Library», sono già della fonte «penn»). La descrizione comincia
  // con «Istituzione, Dipartimento, Segnatura. Data.».
  openn: {
    q: '(collection:openn OR collection:mss-muslim-world) AND NOT identifier:ldpd_*',
    biblioteca: null,
    ammessa: v => !!v.ist && !/Kislak Center|University of Pennsylvania|^Rare Book & Manuscript Library/i.test(v.ist) && /Codices|Manuscripts|codex/i.test(`${v.s} ${v.c}`),
    segnatura: (id, v) => v.seg || id,
  },
  // C. V. Starr East Asian Library, University of California, Berkeley: manoscritti coreani (fondo Asami) e cinesi
  starr: {
    q: 'collection:starr AND (description:manuscript OR subject:"Manuscripts")',
    biblioteca: "University of California, Berkeley, C. V. Starr East Asian Library", citta: "Berkeley",
    ammessa: v => elementi(v).some(e => /^(?:Manuscri?pt|Manuscprit|MS\b)/i.test(e)) && !/woodblock|wood-block|block print|printed|movable|type\b|xylograph|rubbing/i.test(v.c || ""),
    segnatura: id => id,
  },
  // Biblioteca Civica «Vincenzo Joppi» di Udine (Teche Udine): Fondo Principale e Fondo Joppi. Fuori carteggi, pergamene e atti sciolti.
  udine: {
    q: 'collection:teche-udine',
    biblioteca: "Biblioteca Civica «Vincenzo Joppi», Udine", citta: "Udine",
    ammessa: v => /Manoscritti/i.test(v.s || "") && !/Corrispondenza|Pergamene|Fotografi|Stampe|Disegni|Mappe|Archivi/i.test(v.s || "") && !UDINE_FUORI.test(contenutoUdine(v).slice(0, 200)),
    segnatura: id => { const m = /^([PJ])_MSS_0*(\d+)(?:_([A-Z0-9]+))?/i.exec(id); return m ? `${m[1].toUpperCase() === "P" ? "Fondo Principale" : "Fondo Joppi"} ${m[2]}${m[3] ? " " + m[3] : ""}` : id; },
    titolo: v => contenutoUdine(v).slice(0, 300) || null,
  },
  // Government Oriental Manuscripts Library and Research Centre, Chennai: manoscritti telugu su foglia di palma e su carta
  // (copie della Tamil Digital Library, caricate su Internet Archive)
  goml: {
    q: 'collection:telugu-palm-leaf',
    biblioteca: "Government Oriental Manuscripts Library and Research Centre, Chennai", citta: "Chennai",
    // gli oggetti «Telugu_…» (metà circa) non hanno un manifesto IIIF che si apra (errore 500 di iiif.archive.org, 26 ottobre 2026)
    ammessa: (v, id) => !/^Telugu_/i.test(id) && /manuscript/i.test(v.s || "") && /Oriental Manuscripts Library/i.test(v.c || ""),
    segnatura: id => id.replace(/_+/g, " ").toUpperCase().trim(),
  },
  // Kavikulaguru Kalidas Sanskrit University, Ramtek (Jnanayogi Dr. Shrikant Jichkar Knowledge Resource Center): manoscritti sanscriti
  kksu: {
    q: 'collection:kksu-ramtek-lib AND subject:"Sanskrit Manuscripts"',
    biblioteca: "Kavikulaguru Kalidas Sanskrit University, Ramtek (Jnanayogi Dr. Shrikant Jichkar Knowledge Resource Center)", citta: "Ramtek",
    ammessa: v => /^M[\s-]?\d+/i.test(v.t || ""),
    segnatura: (id, v) => { const m = /^M[\s-]?(\d+)/i.exec(v.t || ""); return m ? "M " + m[1] : id; },
    titolo: v => titoloSenza(v.t, /^M[\s-]?\d+\s*|\s*Kavikul\w* Kalidas Sanskrit University.*$/gi),
  },
  // Gurukul Kangri, Haridwar: manoscritti numerati («MSS No.»; il resto della collezione sono libri a stampa)
  gurukul: {
    q: 'collection:gurukul-kangri-university AND title:"MSS No"',
    biblioteca: "Gurukul Kangri (Deemed to be University), Haridwar", citta: "Haridwar",
    ammessa: v => /\bMSS No\.?\s*\d+/i.test(v.t || ""),
    segnatura: (id, v) => { const m = /\bMSS No\.?\s*(\d+)/i.exec(v.t || ""); return m ? "MSS No. " + m[1] : id; },
    titolo: v => titoloSenza(v.t, /\s*Gurukul Kangri Collection.*$/i),
  },
  // Bibliothèque universitaire des langues et civilisations (BULAC), Parigi: manoscritti arabi, persiani, turchi e altri
  bulac: {
    q: 'collection:bulac AND (type:Manuscrit OR subject:manuscrits)',
    // nome e città come nelle altre fonti del catalogo, così la biblioteca resta una sola
    biblioteca: "Bibliothèque universitaire des langues et civilisations (BULAC)", citta: null,
    ammessa: (v, id) => /^(?:MS\.|JAPAF|JAPNF)/i.test(id || "") && !/\bfragments?\b|\bfeuillets (?:de|d'|isolés|épars)/i.test(String(v.c || "").slice(0, 250)) && /Manuscrit/i.test(`${v.y} ${v.s}`) && !/\b(?:Documents? divers|Correspondance|Lettres?)\b|وثائق|رسائل/i.test(`${v.t} ${String(v.c || "").slice(0, 120)}`) && !/^\s*(?:Lettre|Lettres|Firman|Acte|Diplôme|Brevet|Passeport|Certificat|Contrat|Pièces?|Document|Quittance|Titre|Requête|Carte\b|Plan\b|Ordre)/i.test(v.t || "") && !/\b(?:[1-4] feuillets?|1 f\.)/i.test(v.f || ""),
    segnatura: id => id.replace(/^MS\./, "MS ").replace(/\./g, " ").replace(/\s+/g, " ").trim(),
  },
  // Bibliothèque Sainte-Geneviève, Parigi: manoscritti (fuori lettere, carteggi e carte sciolte)
  bsg: {
    q: 'collection:bibliothequesaintegenevievemanuscrit',
    biblioteca: "Bibliothèque interuniversitaire Sainte-Geneviève, Paris", citta: "Paris",
    ammessa: v => !/^\s*[«"]?\s*(?:Lettres?|Correspondance|Papiers|Billet|Carte de visite|Dessins?|Portraits?|Photographies?)/i.test(v.t || "") && !/Correspondance|Lettres? \(genre\)/i.test(v.s || "") && !/\(f\.\s*\d|feuillets? détachés|\bf\. détachés/i.test(v.c || "") && !/Dezos de La Roquette/i.test(v.s || "") && !/\b[1-4] (?:feuillets?|f\.)(?:\s|$)/i.test(v.c || "") && !!coteBsg(v),
    segnatura: (id, v) => coteBsg(v) || id,
  },
  // Smithsonian Libraries (Dibner Library e altre): volumi manoscritti, «[manuscript]» nel titolo
  smithsonian: {
    q: 'collection:smithsonian AND title:"[manuscript]"',
    biblioteca: "Smithsonian Libraries, Washington", citta: "Washington",
    ammessa: v => /\[manuscript\]/i.test(v.t || "") && !/typescript|mimeograph/i.test(v.c || "") && !/\b(?:diary|diaries|journals?|papers|scrapbook|album|notebooks?|log ?book|letter ?book)\b/i.test(v.t || ""),
    segnatura: id => id,
    titolo: v => titoloSenza(v.t, /\s*\[manuscript\]\s*/gi),
  },
  // Boston Public Library: codici medievali e moderni («Ms. codex»; le lettere del fondo antischiavista restano fuori)
  bpl: {
    q: 'collection:bostonpubliclibrary AND (collection:bplmedmss OR description:"Ms. codex")',
    biblioteca: "Boston Public Library", citta: "Boston",
    ammessa: v => /Ms\. codex|bplmedmss|Manuscripts, (?:Medieval|Latin)/i.test(`${v.c} ${v.s} ${v.g || ""}`),
    segnatura: (id, v) => { const m = /\((MS [^)]+?)\)/.exec(v.c || ""); return m ? m[1].replace(/\.\s*/g, ". ").replace(/\s+/g, " ").trim() : id; },
    titolo: v => titoloSenza(v.t, /^\[|\]$|\s*\[manuscript\]\s*/gi),
  },
  // Fragile Palm Leaves Foundation (Nonthaburi, Thailandia), manoscritti su foglia di palma birmani, thai, mon e pali, pubblicati
  // dal Buddhist Digital Resource Center
  fpl: {
    q: 'collection:bdrc-fplmanuscripts',
    biblioteca: "Fragile Palm Leaves Foundation, Nonthaburi (copie del Buddhist Digital Resource Center)", citta: "Nonthaburi",
    ammessa: () => true,
    segnatura: id => id.replace(/^bdrc-/, ""),
    titolo: v => (/^bdrc-/i.test(v.t || "") ? null : v.t),
  },
  // Biblioteca Federiciana di Fano: carte e piante disegnate a mano (inchiostro, acquerello); le stampe restano fuori
  fano: {
    q: 'collection:bibliotecafedericianafano AND subject:"Maps and cartography"',
    biblioteca: "Biblioteca Comunale Federiciana, Fano", citta: "Fano",
    ammessa: v => /\b(?:pianta|piante|mappa|mappe|carta|topografi\w*|catast\w*|strada|strade|corso del|porto|territorio|delineazione|confini)\b/i.test(v.t || "") && /\b(?:inchiostro|acquerell\w*|matita|penna|china)\b/i.test(v.c || "") && !/\b(?:stampa|incision\w*|incis[oa]|litograf\w*|acquaforte|bulino)\b/i.test(`${v.t} ${v.c}`),
    segnatura: id => id.replace(/^BifDS-/, "Disegni e stampe ").replace(/_/g, " "),
    tipo: () => "carta", carta: true, media: "(texts OR image)",
  },
  // John Carter Brown Library, Providence (dal 26 ottobre 2026): la biblioteca pubblica su Internet Archive soprattutto libri a stampa,
  // ma anche i suoi codici (fondi «Codex Ind», «Codex Sp», «Codex Eng»…), tra cui i manoscritti in lingue indigene delle Americhe
  // (Tovar Codex, Diccionario de Motul, catechismi testeriani, arti e vocabolari di nahuatl, maya, otomí, zapoteco, purépecha,
  // guaraní, huron, algonchino). Si riconoscono dalla nota «Ms. codex» (o «Manuscript ; …») della scheda; fuori le carte
  // d'archivio (atti, conti, registri, inventari, copialettere, provvedimenti, ordini militari). Segnatura dal campo «call_number».
  jcb: {
    q: 'collection:JohnCarterBrownLibrary AND (description:"Ms. codex" OR description:manuscript OR title:manuscript)',
    biblioteca: "John Carter Brown Library", citta: "Providence",
    ammessa: (v, id) => elementi(v).some(e => /^\s*(?:Ms\. codex|Manuscript codex|Manuscript(?: ;|,| on| in|\.|$))/i.test(e)) && !JCB_FUORI.test(v.t || "") && !/_\d+$/.test(id || "") && !/^RLC\b/i.test(v.cn || ""),
    // la segnatura dalla scheda («Codex Ind 2», «1-SIZE Codex Sp 5»); se c'è solo il numero del record del catalogo di Brown
    // («b5694800»), la segnatura «Codex …» citata nella descrizione, altrimenti quel numero
    segnatura: (id, v) => {
      const cn = String(v.cn || "").replace(/\s+/g, " ").trim();
      if (cn && !/^b\d+$/i.test(cn)) return cn.replace(/\bcodex\s+([a-z]+)/i, (m, f) => "Codex " + f[0].toUpperCase() + f.slice(1).toLowerCase());
      const m = /\b((?:\d-SIZE )?Codex (?:Ind|Sp|Fr|Eng|Port|Lat|It|Du|Ger)\.? ?\d+[A-Za-z]?)/.exec(v.c || "");
      return m ? m[1] : cn ? `record ${cn}` : id;
    },
    titolo: v => titoloSenza(v.t, /^\[|\]$/g),
  },
  // Newberry Library, Chicago (dal 26 ottobre 2026): dal 2026 la biblioteca carica su Internet Archive i suoi manoscritti (Edward E.
  // Ayer Manuscript Collection, con i codici in nahuatl, otomí, zapoteco, purépecha, kaqchikel e opata; Case MS e Wing MS); il
  // campo «call_number» dà la segnatura vera (VAULT Ayer MS 1478). Fuori le carte moderne («Modern MS», «Midwest MS», «Dance MS»),
  // diari personali, lettere, trattati, testamenti, verbali, fascicoli d'ufficio, trascrizioni e fotoriproduzioni. I codici che
  // Digital Scriptorium dà già (stessa segnatura) restano alla fonte «ds».
  newberry: {
    q: 'collection:newberry AND (call_number:"Ayer MS" OR call_number:"Case MS" OR call_number:"Wing MS" OR identifier:ayer_ms_* OR identifier:case_ms_*)',
    biblioteca: "Newberry Library", citta: "Chicago",
    ammessa: v => /\b(?:Ayer|Case|Wing|Greenlee)\s+(?:Case\s+|Wing\s+)?MS\b/i.test(v.cn || "") && !/\b(?:Modern|Midwest|Dance)\s+MS\b/i.test(v.cn || "") && !NEWBERRY_FUORI.test(`${v.t} ; ${String(v.c || "").slice(0, 200)}`),
    segnatura: (id, v) => String(v.cn || id).replace(/^\s*(?:VAULT\s+|artifacts cage\s+)?(?:(?:box|folio|oversize|slipcase)\s+)*/i, "").replace(/\s+/g, " ").trim(),
  },
};
// John Carter Brown: carte d'archivio e amministrative (titolo)
// (fuori anche i codici «RLC.Ms.» della Redwood Library di Newport, che la biblioteca ha caricato insieme ai suoi)
const JCB_FUORI = /^\s*\[?Ex(?:mo|celent[ií]simo)\.? se[ñn]or|\b(?:inventory|ledger|padr[oó]n|proclama|account ?books?|accounts?\b|deeds?|oath|invoices?|bought of|records|federal direct tax|tax\b|orderly book|order ?book|memorandum|day ?book|copiador|copia de cartas|provisi[oó]n|obligaci[oó]n|diligencias|expediente|notaires|ley sancionad\w*|reglam\w*|agreement|indenture|letters?\b|cartas?\b|petition|minutes)\b/i;
// Newberry: carte d'archivio, lettere, diari personali, riproduzioni (titolo e inizio della descrizione)
const NEWBERRY_FUORI = /\b(?:diary|diaries|files|letters?|correspondence|treaty|treaties|will of|copy of the will|copia testamenti|last will|minutes|transcripts?|photostats?|photographic reproduction|errata|research (?:and personal )?papers|papers\b|original leaves|bulletin|pow-wow|autograph letter|se asientan|capione|campione de)\b/i;

// Udine: la descrizione è «Biblioteca Civica … Inventario dei manoscritti del Fondo … <numero> <contenuto>»
function contenutoUdine(v) {
  const c = String(v.c || "").replace(/^.*?Inventario dei manoscritti del Fondo \w+\s*/i, "").replace(/^\d+\s*(?:[A-Z]{1,4}\b\s*)?/, "");
  return c.replace(/\s+/g, " ").trim();
}
const UDINE_FUORI = /\b(?:autograph\w*|autograf\w*|deliberazion\w*|camerar\w*|libro d'oro|rescritt\w*|fraterna|confraternit\w*|verbali|partite|meteorologic\w*|sono \d+ (?:volumi|serie|cartolari|buste|registri|quaderni)|atti|atto|registr[oi]|conti|rendicont\w*|amministrativ\w*|finanziar\w*|catastic\w*|catasto|estimo|entrate|spese|vendite|affitti|livelli|decreti|terminazioni|proclami|sentenz\w*|suppliche|memoriali|avvis[oi]|notai[oe]?|notarili|famiglia|famiglie|genealogi\w*|alber[oi] genealogic\w*|privilegi|lettere|lettera|carteggio|corrispondenza|epistolario|pergamen[ae]|atti (?:dei|del|della|delle|notarili)|rogiti|protocolli|ducali|testamento|testamenti|documenti|documenta|carte sciolte|carte varie|fogli sciolti|fogli volanti|ricevute|scritture|istrumenti|instrumenti|investitur\w+|processo|processi|fascicol[oi]|fascio|cartolar[ei]|pezzi|stamp[ae]|fotografi\w*|disegni|mappa|mappe|catalogo|elenco|inventario)\b/i;
// Sainte-Geneviève: «Cote du document : Ms. 1458» (con i volumi: «Ms. 3602 (2)»)
function coteBsg(v) { const m = /Cote du document\s*:\s*(Ms\.?\s*\d+[A-Za-z]?(?:\s*\(\d+\))?)/i.exec(v.c || ""); return m ? m[1].replace(/\s+/g, " ").trim() : null; }

// OPenn: «Free Library of Philadelphia, Rare Book Department, Lewis O 46. 1765. …» -> istituzione e segnatura
const ISTITUZIONI_OPENN = ["Free Library of Philadelphia", "Haverford College", "Bryn Mawr College", "Swarthmore College", "Lehigh University", "Library Company of Philadelphia", "College of Physicians of Philadelphia", "Science History Institute", "Philadelphia Museum of Art", "Lafayette College", "Temple University", "Rosenbach", "Drexel University", "La Salle University", "Villanova University", "Penn State", "American Philosophical Society", "Historical Society of Pennsylvania", "Curtis Institute", "Union League", "Princeton Theological Seminary", "Kislak Center", "University of Pennsylvania", "Rare Book & Manuscript Library"];
export function istituzioneOpenn(c) {
  const testo = String(c || "").trim();
  const ist = ISTITUZIONI_OPENN.find(i => testo.startsWith(i));
  if (!ist) return {};
  const parti = testo.slice(0, 300).split(/\.\s/)[0].split(/,\s*/);
  return { ist, seg: parti.length > 1 ? parti[parti.length - 1].trim() : null };
}

// ------------------------------------------------------------------------------------------------ stato e raccolta
export function leggiStato(file = FILE_STATO) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { voci: {} }; } }
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, totale: st.totale || 0, profili: st.profili || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// documento della ricerca -> voce compatta (p: profilo)
export function compattaIa(d, p) {
  const formati = lista(d.format), file = formati.filter(f => /^(?:Single Page (?:Processed|Original) JP2 (?:ZIP|Tar)|JPEG|Image Container PDF|Text PDF|Additional Text PDF)$/i.test(f));
  const fisico = formati.filter(f => f.length > 30 || /feuillet|leaves|pages|papier|paper/i.test(f) && !/^(?:Archive BitTorrent|Metadata|DjVuTXT|Djvu XML|Item Tile|chOCR|hOCR)$/i.test(f));
  const desc = [...lista(d.description), ...lista(d.note)].filter((x, i, a) => a.indexOf(x) === i);
  const v = { p, t: lista(d.title)[0] || null, d: lista(d.date)[0] || null, l: lista(d.language), a: lista(d.creator).slice(0, 6), s: lista(d.subject).join(" ; ").slice(0, 600) || null,
    c: desc.join(" ; ").slice(0, 900) || null, f: fisico.join(" ; ").slice(0, 300) || null, y: unoDi(d.type) || null, o: unoDi(d.source).slice(0, 200) || null, k: lista(d.contributor)[0] || null,
    z: lista(d.collection).filter(c => !/^fav-/.test(c)).slice(0, 8).join(" ") || null, n: +d.imagecount || null, j: formati.some(f => /JP2/i.test(f)) || (d.mediatype === "image" && formati.includes("JPEG")) ? 1 : (file.length ? 0 : null), g: unoDi(d["associated-names"]).slice(0, 200) || null, cn: unoDi(d.call_number).slice(0, 120) || null };
  if (p === "openn") Object.assign(v, istituzioneOpenn(v.c));
  for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

async function cerca(q, minuti) {
  const fine = Date.now() + minuti * 60e3, docs = [];
  let cursore = null;
  for (;;) {
    if (Date.now() > fine) throw new Error("tempo esaurito durante la ricerca");
    const p = new URLSearchParams({ q, fields: CAMPI.join(","), count: "5000" });
    if (cursore) p.set("cursor", cursore);
    const r = await scarica(`https://archive.org/services/search/v1/scrape?${p}`, { timeout: 180000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`ricerca di Internet Archive: HTTP ${r.stato}`);
    const j = JSON.parse(r.testo);
    docs.push(...(j.items || []));
    cursore = j.cursor || null;
    if (!cursore) return docs;
  }
}

// oggetti che altre fonti leggono già da Internet Archive (o che il catalogo non vuole): esclusi dalle ricerche
const ESCLUSI = " AND NOT collection:BNCF AND NOT collection:bibliotecauniversitariadesevilla AND NOT collection:ds-legacy-data AND NOT collection:ds-images";

export async function scansionaArchive({ minuti = 10, soloCache = false, profili = Object.keys(PROFILI), forza = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (!forza && st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5 && profili.every(p => st.profili && st.profili[p])) {
    log("archive", `riuso la ricerca del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} oggetti`); return st;
  }
  const fine = Date.now() + minuti * 60e3;
  st.profili = st.profili || {};
  // una ricerca completa rifà da capo: le voci dei profili riletti si sostituiscono
  for (const p of profili) {
    const resto = (fine - Date.now()) / 60e3;
    if (resto <= 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`raccolta incompleta (profilo ${p}): riprenderà alla prossima esecuzione`); }
    const docs = await cerca(`(${PROFILI[p].q})${ESCLUSI} AND mediatype:${PROFILI[p].media || "texts"}`, resto);
    for (const [id, v] of Object.entries(st.voci)) if (v.p === p) delete st.voci[id];
    let n = 0;
    for (const d of docs) { if (!d.identifier || st.voci[d.identifier]) continue; st.voci[d.identifier] = compattaIa(d, p); n++; }
    st.profili[p] = { oggetti: n, letto: new Date().toISOString() };
    log("archive", `${p}: ${n} oggetti`);
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  for (const p of Object.keys(st.profili)) if (!PROFILI[p]) { delete st.profili[p]; for (const [id, v] of Object.entries(st.voci)) if (v.p === p) delete st.voci[id]; }
  st.totale = Object.keys(st.voci).length; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  return st;
}

// ------------------------------------------------------------------------------------------------ voci del catalogo
// motivo per cui un oggetto resta fuori (null = entra)
export function motivoArchive(id, v) {
  const P = PROFILI[v.p];
  if (!P) return "profilo sconosciuto";
  if (!v.j) return "senza immagini delle pagine";
  if (P.carta) return P.ammessa(v, id) && cartaManoscritta({ titolo: v.t, generi: "maps", tecnica: v.c, descrizione: v.c }) !== false ? null : "non è una carta disegnata a mano";
  if (v.n != null && v.n < 6) return "meno di 6 immagini";
  if (annoVero(v.d) >= 1950) return "moderno";
  if (STAMPA.test(v.t || "") || STAMPA.test(v.y || "") || STAMPA.test(v.f || "")) return "stampa o riproduzione (titolo o tipo)";
  const note = [...elementi(v), ...String(v.f || "").split(" ; ")].map(e => e.trim());
  if (STAMPA_DESC.test(String(v.c || "").replace(/Benchmark for Faithful Digital Reproductions[^;]*|Electronic reproduction[^;]*|(?:Penn Libraries|Columbia University) Catalog: go to \w+/g, "")) || note.some(e => STAMPA_NOTA.test(e))) return "stampa o riproduzione (descrizione)";
  if (/\b(?:Facsimiles|Catalogs|Catalogues|Bibliography|Exhibitions|Early printed books|Incunabula|Periodicals)\b/i.test(v.s || "")) return "stampa o catalogo (soggetto)";
  if (DOCUMENTO.test(v.t || "") || DOCUMENTO.test(P.titolo ? P.titolo(v) || "" : "")) return "lettera o documento";
  if (note.some(e => FOGLIO.test(e)) || FOGLIO_OVUNQUE.test(v.c || "") || /^\s*\[?(?:fragments?|leaf|leaves|folio|feuillet)\b/i.test(v.t || "")) return "foglio singolo o frammento";
  if (!P.ammessa(v, id)) return "non riconosciuto come manoscritto librario";
  return null;
}

// («VAULT», «box», «folio», «oversize» sono collocazioni della Newberry, non parti della segnatura)
const normSeg = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\b(?:ms|mss|cod|codex|manuscript|vault|box|folio|oversize|slipcase)\b\.?/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\b0+(\d)/g, "$1").trim();
const normBib = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, " ").trim();

/* esistenti (voci delle altre fonti) -> { ids: Set degli identificativi di Internet Archive già nel catalogo, segnature: [[biblioteca normalizzata, Set di segnature]] } */
export function esistentiArchive(voci) {
  const ids = new Set(), per = new Map();
  for (const v of voci) {
    if (v.fonte === "archive") continue;
    for (const u of [v.manifest, v.pagina]) { const m = /archive\.org\/(?:iiif\/(?:3\/)?|details\/)(?:images_)?([^/?#]+)/.exec(u || ""); if (m) ids.add(decodeURIComponent(m[1])); }
    const b = normBib(v.biblioteca); if (!b) continue;
    if (!per.has(b)) per.set(b, new Set());
    per.get(b).add(normSeg(v.segnatura));
  }
  return { ids, segnature: [...per] };
}
// parole che identificano la stessa biblioteca nel catalogo (per i doppioni per segnatura)
const STESSA = { "McGill University": /mcgill/, "Columbia University": /columbia/, "Free Library of Philadelphia": /free library of philadelphia/, "Haverford College": /haverford/,
  "Bryn Mawr College": /bryn mawr/, "Boston Public Library": /boston public library/, "Starr East Asian": /berkeley/, "Sainte-Genevi": /sainte genevieve/, "BULAC": /langues et civilisations|bulac/,
  "Jagiello": /jagiell/, "Smithsonian": /smithsonian/, "Joppi": /joppi|udine/, "Federiciana": /federiciana/, "Newberry": /newberry/, "John Carter Brown": /john carter brown/ };

export function recordArchive(st = leggiStato(), { esistenti = { ids: new Set(), segnature: [] }, scarti } = {}) {
  const out = [];
  const conta = (k) => { if (scarti) scarti[k] = (scarti[k] || 0) + 1; };
  for (const [id, v] of Object.entries((st && st.voci) || {})) {
    const motivo = motivoArchive(id, v);
    if (motivo) { conta(motivo); continue; }
    if (esistenti.ids.has(id)) { conta("già nel catalogo (stesso oggetto)"); continue; }
    const P = PROFILI[v.p];
    const biblioteca = P.biblioteca || v.ist, segnatura = P.segnatura(id, v) || id;
    const chiave = Object.keys(STESSA).find(k => biblioteca.includes(k));
    if (chiave) {
      const ns = normSeg(segnatura);
      if (ns && esistenti.segnature.some(([b, set]) => STESSA[chiave].test(b) && set.has(ns))) { conta("già nel catalogo (stessa segnatura)"); continue; }
    }
    const r = { fonte: "archive", id: "ia-" + id.toLowerCase().replace(/[^a-z0-9.-]+/g, "-"), citta: P.citta === undefined ? cittaOpenn(v.ist) : P.citta, biblioteca, segnatura,
      datazione: datazioneIa(v),
      titolo: (P.titolo ? P.titolo(v) : v.t) || null, autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueIa(v), immagini: v.n || null,
      manifest: manifestoIa(id), pagina: `https://archive.org/details/${id}`, licenza: "Internet Archive: condizioni d'uso della biblioteca che ha pubblicato l'oggetto" };
    if (P.tipo) r.tipo = P.tipo(v);
    out.push(r);
  }
  return out;
}
// lingue: quelle della scheda. Fragile Palm Leaves Foundation: testi pali e birmani (il BDRC scrive spesso «tib» o «und»), quindi
// «altre lingue»; Ramtek: manoscritti sanscriti (soggetto «Sanskrit Manuscripts», la scheda non ha la lingua); Gurukul Kangri: dal titolo
function lingueIa(v) {
  const l = (v.l || []).map(x => String(x).replace(/-handwritten$/i, ""));
  if (v.p === "fpl") return ["xx"];
  if (v.p === "kksu") return ["sa"];
  if (v.p === "gurukul") return /\bSanskrit\b/i.test(v.t || "") ? ["sa"] : [];
  return lingueDa(l.filter(x => !/^(?:und|mul|zxx|unknown)$/i.test(x)));
}
// datazione: la data di Internet Archive, se non è quella del caricamento; gli anni tra 900 e 1350 dei manoscritti in arabo, persiano,
// turco o urdu di McGill sono dell'Egira (la scheda non lo dice: «1231» = 1815-1816), e allora la datazione resta vuota
function datazioneIa(v) {
  const a = annoVero(v.d);
  if (a == null) return null;
  if (v.p === "mcgill" && a >= 900 && a <= 1350 && (v.l || []).some(l => /arab|ara|pers|per|fa|turk|tur|ota|urd/i.test(l))) return null;
  return String(v.d).replace(/-01-01(?:T.*)?$|T\d.*$/, "");
}
function cittaOpenn(ist) {
  if (/Haverford/.test(ist || "")) return "Haverford"; if (/Bryn Mawr/.test(ist || "")) return "Bryn Mawr"; if (/Swarthmore/.test(ist || "")) return "Swarthmore";
  if (/Lehigh/.test(ist || "")) return "Bethlehem"; if (/Lafayette/.test(ist || "")) return "Easton"; if (/Princeton/.test(ist || "")) return "Princeton";
  return "Filadelfia";
}
