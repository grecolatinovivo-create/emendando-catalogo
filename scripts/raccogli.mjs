#!/usr/bin/env node
// Catalogo dei manoscritti digitalizzati (IIIF) delle biblioteche agganciate: tutti i manoscritti, di ogni lingua ed epoca.
// Autori e opere riconosciuti (classici latini e greci, cristiani, medievali) sono un'informazione in più, per cercare e filtrare.
// Uso:
//   node scripts/raccogli.mjs [--fonti=heidelberg,ecodices,bsb,berlino,bodleian,gallica,laurenziana,ambrosiana,montecassino,casanatense,bub,bncf,vallicelliana,malatestiana,leiden,wolfenbuettel,bamberga,karlsruhe,stoccarda,colonia,lipsia,francoforte,dresda,tubinga,darmstadt,handrit,polona,manuscriptorium,onb,yale,penn,ds,walters,loc,nlg,ndl,kokusho,auckland,toronto,wellcome,isos,manchester,cudl,cbl,vaticana] [--vaticana-minuti=20] [--oai-minuti=60]
//        [--bodleian-minuti=30] [--gallica-minuti=30] [--laurenziana-minuti=15] [--ambrosiana-minuti=20] [--montecassino-minuti=5] [--casanatense-minuti=5] [--bub-minuti=10]
//        [--leiden-minuti=15] [--hsp-minuti=10] [--berlino-minuti=60] [--indici-minuti=20]
//        [--yale-minuti=30] [--penn-minuti=15] [--ds-minuti=15] [--walters-minuti=20] [--loc-minuti=10] [--nlg-minuti=15]
//        [--ndl-minuti=60] [--ndl-controllo-minuti=40] [--kokusho-minuti=60] [--auckland-minuti=10] [--toronto-minuti=15]
//        [--wellcome-minuti=10] [--bl-minuti=40] [--isos-minuti=20] [--manchester-minuti=30] [--cudl-minuti=30] [--cbl-minuti=60] [--parker-minuti=20] [--nlw-minuti=10] [--minuti-totali=160] [--solo-costruisci]
//        [--mdc-minuti=10] [--ub-minuti=10] [--realbiblioteca-minuti=15] [--ucm-minuti=15] [--sevilla-minuti=5] [--rah-minuti=30]
//        [--pergamos-minuti=10] [--rousanou-minuti=5] [--auc-minuti=5] [--northwestern-minuti=5] [--nbkm-minuti=20] [--libfond-minuti=60] [--bms-minuti=20]
//        [--nli-minuti=15] [--getty-minuti=15] [--harvard-minuti=10]
//        [--kbdk-minuti=30] [--uva-minuti=5] [--onb-minuti=30] [--bncf-minuti=5] [--vallicelliana-minuti=5] [--malatestiana-minuti=20] [--polona-minuti=20] [--manuscriptorium-minuti=30] [--archive-minuti=10]
//        [--crossasia-minuti=30] [--sbbasia-minuti=30] [--sbbor-minuti=30] [--nomfoundation-minuti=20]
//        [--nb-minuti=60] [--manuscripta-minuti=15] [--bnl-minuti=5] [--ija-minuti=5] [--stampe-minuti=60] [--papiri-minuti=60] [--epigrafi-minuti=60]
// Scrive il catalogo diviso per fonte (vedi costruisci.mjs): data/catalogo/indice.json, data/catalogo/indice/<fonte>-<n>.json, data/catalogo/voci/<fonte>-<n>.json,
// più data/manoscritti.json (compatibilità: solo i codici con autori classici), e gli stati delle scansioni a riprese
// (data/vaticana.json, data/bodleian.json, data/laurenziana.json, data/leiden.json, data/heidelberg-indici.json; data/<fonte>.json per le fonti del Handschriftenportal: wolfenbuettel, bamberga, karlsruhe, stoccarda, colonia, lipsia; data/yale.json, data/penn.json, data/walters.json).
// Walters: i manifesti IIIF li scriviamo noi dallo stato (data/manifesti/walters/<cartella>.json), anche con --solo-costruisci.
// --hsp-minuti: limite di ciascuna fonte del Handschriftenportal.
// --minuti-totali: tempo complessivo disponibile; la Vaticana usa al massimo quello che resta dopo le altre fonti.
// --solo-costruisci: nessuna richiesta, si ricostruisce dalle raccolte in cache e dagli stati salvati.
// Le raccolte OAI riprendono da dove si erano fermate (.cache/catalogo/stato-*.json) e si riusano per 6 giorni;
// se una fonte non risponde, restano le sue voci del catalogo precedente.
import fs from "node:fs";
import { log } from "./rete.mjs";
import { caricaAutori, riconosci } from "./riconosci.mjs";
import { deduciLingue, secoli, correggiIndigene } from "./lingue.mjs";
import { raccogliHeidelberg, raccogliEcodices, raccogliBsb, raccogliBerlino } from "./fonti/oai.mjs";
import { scansiona, recordVaticana } from "./fonti/vaticana.mjs";
import { scansionaBodleian, recordBodleian } from "./fonti/bodleian.mjs";
import { raccogliGallica } from "./fonti/gallica.mjs";
import { scansionaLaurenziana, recordLaurenziana } from "./fonti/laurenziana.mjs";
import { scansionaAmbrosiana, recordAmbrosiana } from "./fonti/ambrosiana.mjs";
import { scansionaMontecassino, recordMontecassino } from "./fonti/montecassino.mjs";
import { scansionaCasanatense, recordCasanatense } from "./fonti/casanatense.mjs";
import { scansionaBub, recordBub } from "./fonti/bub.mjs";
import { leggiIndiciHeidelberg, conIndici } from "./fonti/heidelberg-indici.mjs";
import { scansionaLeiden, recordLeiden } from "./fonti/leiden.mjs";
import { scansionaHsp, recordHsp, FONTI_HSP } from "./fonti/hsp.mjs";
import { scansionaYale, recordYale } from "./fonti/yale.mjs";
import { scansionaPenn, recordPenn } from "./fonti/penn.mjs";
import { scansionaDs, recordDs, esistentiDa } from "./fonti/ds.mjs";
import { scansionaWalters, recordWalters, scriviManifestiWalters, leggiStato as statoWalters } from "./fonti/walters.mjs";
import { scansionaLoc, recordLoc } from "./fonti/loc.mjs";
import { scansionaNlg, recordNlg } from "./fonti/nlg.mjs";
import { scansionaCudl, recordCudl } from "./fonti/cudl.mjs";
import { scansionaManchester, recordManchester } from "./fonti/manchester.mjs";
import { scansionaWellcome, recordWellcome } from "./fonti/wellcome.mjs";
import { scansionaBl, recordBl } from "./fonti/bl.mjs";
import { scansionaCbl, recordCbl } from "./fonti/cbl.mjs";
import { scansionaParker, recordParker } from "./fonti/parker.mjs";
import { scansionaNlw, recordNlw } from "./fonti/nlw.mjs";
import { scansionaIsos, recordIsos } from "./fonti/isos.mjs";
import { scansionaNdl, recordNdl } from "./fonti/ndl.mjs";
import { scansionaKokusho, recordKokusho } from "./fonti/kokusho.mjs";
import { scansionaAuckland, recordAuckland } from "./fonti/auckland.mjs";
import { recordSlv } from "./fonti/slv.mjs";
import { scansionaToronto, recordToronto } from "./fonti/toronto.mjs";
import { scansionaNorthwestern, recordNorthwestern } from "./fonti/northwestern.mjs";
import { scansionaCdm, recordCdm, FONTI_CDM } from "./fonti/cdm.mjs";
import { scansionaOmeka, recordOmeka, FONTI_OMEKA } from "./fonti/omeka.mjs";
import { scansionaSevilla, recordSevilla } from "./fonti/sevilla.mjs";
import { scansionaDigibib, recordDigibib } from "./fonti/digibib.mjs";
import { recordLatam } from "./fonti/latam_pdf.mjs";
import { scansionaPergamos, recordPergamos } from "./fonti/pergamos.mjs";
import { scansionaRousanou, recordRousanou } from "./fonti/rousanou.mjs";
import { scansionaOnb, recordOnb } from "./fonti/onb.mjs";
import { scansionaBncf, recordBncf } from "./fonti/bncf.mjs";
import { scansionaVallicelliana, recordVallicelliana } from "./fonti/vallicelliana.mjs";
import { scansionaMalatestiana, recordMalatestiana } from "./fonti/malatestiana.mjs";
import { recordClassense } from "./fonti/classense.mjs";
import { scansionaHandrit, recordHandrit } from "./fonti/handrit.mjs";
import { scansionaPolona, recordPolona } from "./fonti/polona.mjs";
import { scansionaManuscriptorium, recordManuscriptorium } from "./fonti/manuscriptorium.mjs";
import { scansionaKbdk, recordKbdk } from "./fonti/kbdk.mjs";
import { scansionaUva, recordUva } from "./fonti/uva.mjs";
import { scansionaVlaustria, recordVlaustria } from "./fonti/vlaustria.mjs";
import { scansionaElte, recordElte, segnaturaNorm } from "./fonti/elte.mjs";
import { scansionaNbkm, recordNbkm } from "./fonti/nbkm.mjs";
import { scansionaBms, recordBms } from "./fonti/bms.mjs";
import { scansionaLibfond, recordLibfond } from "./fonti/libfond.mjs";
import { scansionaArchive, recordArchive, esistentiArchive } from "./fonti/archive.mjs";
import { scansionaCrossasia, recordCrossasia } from "./fonti/crossasia.mjs";
import { scansionaSbbasia, recordSbbasia } from "./fonti/sbbasia.mjs";
import { scansionaSbbor, recordSbbor } from "./fonti/sbbor.mjs";
import { scansionaNomfoundation, recordNom } from "./fonti/nomfoundation.mjs";
import { scansionaNli, recordNli } from "./fonti/nli.mjs";
import { scansionaGetty, recordGetty } from "./fonti/getty.mjs";
import { scansionaHarvard, recordHarvard, esistentiHarvard, leggiHarvard } from "./fonti/harvard.mjs";
import { scansionaNb, recordNb } from "./fonti/nb.mjs";
import { scansionaManuscripta, recordManuscripta } from "./fonti/manuscripta.mjs";
import { scansionaBnl, recordBnl } from "./fonti/bnl.mjs";
import { scansionaIja, recordIja } from "./fonti/ija.mjs";
import { scansionaStampe, recordStampe } from "./fonti/stampe.mjs";
import { scansionaPapiri, recordPapiri, papiroDa } from "./fonti/papiri.mjs";
import { scansionaEpigrafi, recordEpigrafi } from "./fonti/epigrafi.mjs";
import { scriviRegistro, registraEsiti } from "./registro.mjs";
import { scriviCatalogo, catalogoPrecedente } from "./costruisci.mjs";
import { tipoDa } from "./carte.mjs";
import { miniatoDa } from "./miniati.mjs";
import { musicaDa } from "./musica.mjs";

const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const FONTI = String(arg.fonti || "heidelberg,ecodices,bsb,berlino,bodleian,gallica,laurenziana,ambrosiana,montecassino,casanatense,bub,bncf,vallicelliana,malatestiana,leiden,wolfenbuettel,bamberga,karlsruhe,stoccarda,colonia,lipsia,francoforte,dresda,tubinga,darmstadt,handrit,polona,manuscriptorium,kbdk,uva,onb,yale,penn,ds,walters,loc,nlg,ndl,kokusho,auckland,toronto,wellcome,bl,isos,manchester,cudl,cbl,parker,nlw,mdc,ub,realbiblioteca,ucm,sevilla,rah,bnchile,bnv,pergamos,rousanou,auc,northwestern,nli,getty,harvard,nbkm,libfond,bms,archive,crossasia,sbbasia,sbbor,nomfoundation,stampe,papiri,epigrafi,vaticana").split(",");
const INIZIO = Date.now();
export const NOMI_FONTI = { heidelberg: "Heidelberg (digi.ub.uni-heidelberg.de)", ecodices: "e-codices", bsb: "Bayerische Staatsbibliothek (digitale-sammlungen.de)", berlino: "Staatsbibliothek zu Berlin (digital.staatsbibliothek-berlin.de)",
  bodleian: "Bodleian Libraries, Oxford (digital.bodleian.ox.ac.uk)", gallica: "Bibliothèque nationale de France (gallica.bnf.fr)",
  laurenziana: "Biblioteca Medicea Laurenziana, Firenze (tecabml.contentdm.oclc.org)",
  ambrosiana: "Veneranda Biblioteca Ambrosiana, Milano (ambrosiana.comperio.it; copie digitali digitallibrary.unicatt.it)",
  montecassino: "Biblioteca statale del Monumento nazionale di Montecassino (omnes.dbseret.com/montecassino)",
  casanatense: "Biblioteca Casanatense, Roma (casanatense.contentdm.oclc.org)",
  bub: "Biblioteca Universitaria di Bologna (historica.unibo.it)",
  bncf: "Biblioteca Nazionale Centrale di Firenze (manoscritti pubblicati dalla Biblioteca su Internet Archive, archive.org)",
  vallicelliana: "Biblioteca Vallicelliana, Roma (omnes.dbseret.com/vallicelliana)",
  malatestiana: "Biblioteca Malatestiana, Cesena (Catalogo aperto dei manoscritti malatestiani; manifesti scritti dal catalogo)",
  classense: "Biblioteca Classense, Ravenna (www.cdc.classense.ra.it; elenco raccolto dal browser)",
  onb: "Österreichische Nationalbibliothek, Vienna (onb.digital; manifesti api.onb.ac.at)",
  leiden: "Universiteitsbibliotheek Leiden (digitalcollections.universiteitleiden.nl)",
  ...Object.fromEntries(Object.entries(FONTI_HSP).map(([f, h]) => [f, `${h.biblioteca}${h.biblioteca.includes(h.citta) ? "" : ", " + h.citta} (dati dal Handschriftenportal, handschriftenportal.de)`])),
  yale: "Yale University Library, Beinecke e altre (collections.library.yale.edu)", penn: "University of Pennsylvania Libraries (colenda.library.upenn.edu)",
  ds: "Digital Scriptorium: istituzioni statunitensi (search.digital-scriptorium.org)",
  walters: "Walters Art Museum, Baltimore (thedigitalwalters.org; manifesti IIIF scritti da Emendando)",
  loc: "Library of Congress: microfilm del Sinai e dei Patriarcati di Gerusalemme (loc.gov; manifesti scritti dal catalogo)",
  cudl: "Cambridge Digital Library: University Library e college (cudl.lib.cam.ac.uk)",
  wellcome: "Wellcome Collection, Londra (api.wellcomecollection.org)",
  bl: "British Library, Londra (catalogo searcharchives.bl.uk; manifesti bl.digirati.io e, per i codici orientali e scientifici, Qatar Digital Library)",
  isos: "Irish Script on Screen: Royal Irish Academy, National Library of Ireland, Trinity College Dublin e altre (isos.dias.ie)",
  manchester: "John Rylands Research Institute and Library, Manchester (digitalcollections.manchester.ac.uk)",
  cbl: "Chester Beatty, Dublino (viewer.cbl.ie)",
  parker: "Parker Library, Corpus Christi College, Cambridge (manifesti di Stanford, dms-data.stanford.edu; elenco da Biblissima)",
  nlw: "National Library of Wales, Aberystwyth (iiif.llyfrgell.cymru; elenco da Wikidata ed Europeana)",
  nlg: "Biblioteca Nazionale di Grecia, Atene (digitalcollections.nlg.gr; copie dei manifesti scritte dal catalogo)",
  ndl: "National Diet Library, Tokyo (dl.ndl.go.jp)", kokusho: "Kokusho Database, National Institute of Japanese Literature (kokusho.nijl.ac.jp)",
  auckland: "Auckland Libraries, Sir George Grey Special Collections (kura.aucklandlibraries.govt.nz)",
  slv: "State Library Victoria, Melbourne (find.slv.vic.gov.au; elenco raccolto dal browser)",
  toronto: "University of Toronto, Thomas Fisher Rare Book Library (collections.library.utoronto.ca)",
  // Spagna (corsia «iberia»)
  mdc: "Memòria Digital de Catalunya: Biblioteca de Catalunya, Ateneu Barcelonès, Biblioteca Museu Víctor Balaguer, Biblioteca Pública Episcopal de Barcelona (mdc.csuc.cat)",
  ub: "Universitat de Barcelona, Biblioteca Patrimonial Digital (bipadi.ub.edu)",
  realbiblioteca: "Real Biblioteca (Palacio Real, Madrid) e Real Biblioteca del Monasterio de El Escorial (rbdigital.realbiblioteca.es, Patrimonio Nacional)",
  ucm: "Universidad Complutense de Madrid, Biblioteca Histórica (patrimoniodigital.ucm.es)",
  sevilla: "Biblioteca de la Universidad de Sevilla (copie digitali su Internet Archive)",
  rah: "Real Academia de la Historia, Madrid (bibliotecadigital.rah.es; manifesti scritti dal catalogo)",
  // America Latina, siti solo PDF: pagine estratte dai PDF (ramo «immagini»), manifesti scritti dal catalogo
  bnchile: "Biblioteca Nacional de Chile, Santiago (memoriachilena.gob.cl; codici in pubblico dominio, immagini estratte dai PDF)",
  bnv: "Biblioteca Nacional de Venezuela, Caracas (bibliotecadigital.bnv.gob.ve; CC BY-SA 3.0 VE, immagini estratte dai PDF)",
  // Grecia (corsia «mondo», dal 26 ottobre 2026)
  pergamos: "Università di Atene, Biblioteca della Facoltà di Filosofia (pergamos.lib.uoa.gr; manifesti scritti dal catalogo)",
  rousanou: "Monastero di Rousanou, Meteore (copie digitali della Biblioteca di Kalambaka, opac.kalambakalibrary.org; elenco da searchculture.gr)",
  // Africa (corsia «mondo», dal 26 ottobre 2026)
  auc: "American University in Cairo, Rare Books and Special Collections Library (digitalcollections.aucegypt.edu)",
  northwestern: "Northwestern University Libraries, Herskovits Library of African Studies, Evanston: manoscritti arabi e in ajami dell'Africa occidentale (api.dc.library.northwestern.edu)",
  // dal 26 ottobre 2026: National Library of Israel (corsia «mondo»), Getty Museum (corsia «usa»), Harvard (elenco dal browser)
  nli: "National Library of Israel, Gerusalemme: manoscritti di Ktiv (elenco da Europeana; manifesti iiif.nli.org.il)",
  getty: "J. Paul Getty Museum, Los Angeles: manoscritti (data.getty.edu; manifesti media.getty.edu)",
  harvard: "Harvard Library: Houghton, Harvard-Yenching, Islamic Heritage Project (LibraryCloud, elenco raccolto dal browser; manifesti nrs.lib.harvard.edu)",
  // Europa orientale (corsia «est», dal 26 ottobre 2026)
  nbkm: "Biblioteca Nazionale «Santi Cirillo e Metodio», Sofia: manoscritti slavi, greci e orientali (digilib.nationallibrary.bg; manifesti scritti dal catalogo)",
  bms: "Biblioteca della Matica srpska, Novi Sad: libri manoscritti e carte geografiche (digital.bms.rs; manifesti scritti dal catalogo)",
  libfond: "Biblioteca Statale Russa (Reparto manoscritti) e Accademia Teologica di Mosca: copie digitali della Trinità-San Sergio (lib-fond.ru; manifesti scritti dal catalogo)",
  // Europa (corsia «europa», dal 26 ottobre 2026)
  handrit: "handrit.is: Reykjavík e Copenaghen (descrizioni TEI da github.com/Handrit/Manuscripts; manifesti scritti dal catalogo)",
  polona: "Polona: Biblioteka Narodowa e altre biblioteche polacche (polona.pl)",
  manuscriptorium: "Manuscriptorium: Národní knihovna České republiky e altre biblioteche (manuscriptorium.com)",
  kbdk: "Det Kongelige Bibliotek, Copenaghen (digitalesamlinger.kb.dk; manifesti scritti dal catalogo con le immagini IIIF della biblioteca)",
  uva: "Allard Pierson, Universiteit van Amsterdam (uvaerfgoed.nl)",
  // Europa centrale (corsia «centro», dal 27 ottobre 2026): Graz e Salisburgo (Visual Library), ELTE Budapest (DSpace)
  vlaustria: "Universitätsbibliothek Graz e Universitätsbibliothek Salzburg (unipub.uni-graz.at, eplus.uni-salzburg.at; elenco dalle sitemap, manifesti IIIF delle biblioteche)",
  elte: "ELTE Egyetemi Könyvtár, Budapest: codici, frammenti e manoscritti (edit.elte.hu; manifesti IIIF della biblioteca)",
  // Internet Archive (corsia «mondo», dal 26 ottobre 2026): manoscritti pubblicati da altre biblioteche (Firenze e Siviglia restano fonti a parte)
  archive: "Internet Archive (archive.org): manoscritti pubblicati da biblioteche di tutto il mondo (McGill, Columbia, BULAC, Sainte-Geneviève, Joppi di Udine, Starr di Berkeley, John Carter Brown Library, Newberry Library, Fragile Palm Leaves Foundation, biblioteche indiane e altre)",
  // Asia orientale e Sud-est asiatico (corsia «asia», dal 26 ottobre 2026)
  crossasia: "CrossAsia, Staatsbibliothek zu Berlin: Digital Library of Lao Manuscripts e Digital Library of Northern Thai Manuscripts (iiif.crossasia.org)",
  sbbasia: "Staatsbibliothek zu Berlin: manoscritti dell'Asia orientale e del Sud-est asiatico (oai.sbb.berlin)",
  // Berlino, manoscritti non europei degli altri insiemi (corsia «asia», dal 26 ottobre 2026): tibetani e mongoli, sanscriti, islamici, ebraici, cristiano-orientali, africani
  sbbor: "Staatsbibliothek zu Berlin: manoscritti non europei (tibetani, mongoli, sanscriti, islamici, ebraici, cristiano-orientali, africani; oai.sbb.berlin)",
  nomfoundation: "Vietnamese Nôm Preservation Foundation: Biblioteca nazionale del Vietnam e templi Thắng Nghiêm e Phổ Nhân (lib.nomfoundation.org; manifesti scritti dal catalogo)",
  // Europa del Nord e Lussemburgo (corsia «nord», dal 27 ottobre 2026)
  nb: "Nasjonalbiblioteket, Oslo: manoscritti, manoscritti musicali e carte geografiche (api.nb.no; manifesti IIIF della biblioteca)",
  manuscripta: "manuscripta.se: Kungliga biblioteket, Uppsala universitetsbibliotek e altre biblioteche svedesi (manifesti IIIF di manuscripta.se)",
  bnl: "Bibliothèque nationale du Luxembourg (eluxemburgensia.lu; manifesti scritti dal catalogo con le immagini IIIF della biblioteca)",
  // Vicino Oriente e Golfo (corsia «medioriente», dal 27 ottobre 2026)
  ija: "Iraqi Jewish Archive: frammenti di rotoli della Torah e di Ester della comunità ebraica di Baghdad (ijarchive.org, U.S. National Archives; manifesti IIIF del sito)",
  // stampe antiche (corsia «stampe», dal 27 ottobre 2026): incunaboli e edizioni principi dei classici (scripts/fonti/stampe.mjs)
  stampe: "Stampe antiche: incunaboli e edizioni principi dei classici (Bayerische Staatsbibliothek e biblioteche bavaresi, Heidelberg, Bodleian, Cambridge, Boston Public Library e National Library of Medicine su Internet Archive, Vaticana, Gallica dal browser)",
  // papiri (corsia «papiri», dal 28 ottobre 2026): raccolte che si aprono nel visore (scripts/fonti/papiri.mjs, docs/PAPIRI.md)
  papiri: "Papiri: Michigan, Yale, Duke, Princeton, Vienna (ÖNB), Colonia e Berkeley, con le schede di papyri.info",
  // epigrafi (corsia «epigrafi», dal 28 ottobre 2026): iscrizioni con foto che si aprono nel visore (scripts/fonti/epigrafi.mjs, docs/EPIGRAFI.md)
  epigrafi: "Epigrafi: Epigraphic Database Heidelberg (foto IIIF di heidICON), The Metropolitan Museum of Art e Wikidata con Wikimedia Commons",
  vaticana: "Biblioteca Apostolica Vaticana (digi.vatlib.it)" };

// i tre codici del Truculentus restano sempre nel catalogo, anche se una fonte non li ha ancora restituiti
export const TRUCULENTUS = [
  { sigla: "B", fonte: "vaticana", id: "bav-pal-lat-1615", citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana", segnatura: "Pal. lat. 1615", datazione: "10.-11. Jh.",
    titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], lingue: ["la"], manifest: "https://digi.vatlib.it/iiif/MSS_Pal.lat.1615/manifest.json", pagina: "https://digi.vatlib.it/view/MSS_Pal.lat.1615", licenza: "© Biblioteca Apostolica Vaticana" },
  { sigla: "C", fonte: "heidelberg", id: "hd-cpl1613", citta: "Heidelberg", biblioteca: "Universitätsbibliothek Heidelberg", segnatura: "Cod. Pal. lat. 1613", datazione: "Ende 10. Jh.",
    titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], lingue: ["la"], manifest: "https://digi.ub.uni-heidelberg.de/diglit/iiif/cpl1613/manifest.json", pagina: "https://digi.ub.uni-heidelberg.de/diglit/cpl1613", licenza: "Public Domain Mark 1.0" },
  { sigla: "D", fonte: "vaticana", id: "bav-vat-lat-3870", citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana", segnatura: "Vat. lat. 3870", datazione: "sec. XI?",
    titolo: "Comoediae (Plautus, Titus Maccius, m. 184 a.C.). Gruppi, scelte", autori_fonte: ["Plautus, Titus Maccius, m. 184 a.C."], lingue: ["la"], manifest: "https://digi.vatlib.it/iiif/MSS_Vat.lat.3870/manifest.json", pagina: "https://digi.vatlib.it/view/MSS_Vat.lat.3870", licenza: "© Biblioteca Apostolica Vaticana" },
];

export function campiDi(r) {
  return [
    { campo: "autore", testo: (r.autori_fonte || []).join(" ; "), forte: true },
    { campo: "titolo", testo: r.titolo, forte: true },
    // titoli delle sezioni del codice (indice dei contenuti delle miscellanee): come le descrizioni, servono nome e opera
    // insieme (nelle miscellanee ricorrono omonimi: «Donatus ep.», «Iuvenalis episcopus»)
    { campo: "indice", testo: r.indice, forte: false },
    { campo: "collaboratori", testo: (r.collaboratori || []).join(" ; "), forte: false },
    { campo: "descrizione", testo: r.descrizione, forte: false },
  ];
}

// record compatto della fonte -> voce del catalogo (tutti i manoscritti; null solo se mancano identificativo o manifesto).
// lingue: quelle della fonte, altrimenti dedotte (scripts/lingue.mjs, deduciLingue); [] se non si sa. secolo: [primo, ultimo] dalla datazione.
export function voce(r, AUTORI, sigle = new Map(TRUCULENTUS.map(t => [t.manifest, t.sigla]))) {
  if (!r || !r.id || !r.manifest) return null;
  // epigrafi (dal 28 ottobre 2026): niente riconoscimento degli autori (i titoli nominano luoghi: «Salonae / Solin» non è Solino)
  const autori = r.tipo === "epigrafe" ? [] : riconosci(campiDi(r), AUTORI);
  const sigla = sigle.get(r.manifest) || null;
  // lingue dichiarate dalla fonte; se mancano, dedotte da fondo, segnatura o titolo (lingua_dedotta: true); se incerte, nessuna
  const dichiarate = r.lingue && r.lingue.length ? r.lingue : null;
  const lingue = dichiarate || deduciLingue(r.segnatura, r.titolo, autori);
  const v = { id: r.id, fonte: r.fonte, biblioteca: r.biblioteca || null, citta: r.citta || null, segnatura: r.segnatura || r.id, datazione: r.datazione || null,
    secolo: r.secolo !== undefined ? r.secolo : secoli(r.datazione), lingue, lingua_dedotta: !dichiarate && lingue.length > 0, titolo: (r.titolo || "").slice(0, 400) || null, autori, manifest: r.manifest, pagina: r.pagina || null, licenza: r.licenza || null, immagini: r.immagini ?? null };
  // lingue indigene delle Americhe e hawaiano (dal 26 ottobre 2026): codici pittografici noti, poi il titolo al posto di «altre lingue»
  const ind = correggiIndigene(v);
  if (ind) { v.lingue = ind.lingue; v.lingua_dedotta = ind.dedotta; }
  if (r.anteprima) v.anteprima = r.anteprima;
  // stampe antiche (dal 27 ottobre 2026): luogo e tipografo, contrassegno dell'edizione principe
  if (r.stampa && Object.keys(r.stampa).length) v.stampa = r.stampa;
  if (r.editio_princeps) v.editio_princeps = r.editio_princeps;
  // papiri (dal 28 ottobre 2026): edizione, provenienza, letterario o documentario, numero Trismegistos, materiale
  if (r.papiro && Object.keys(r.papiro).length) v.papiro = r.papiro;
  // epigrafi (dal 28 ottobre 2026): edizione, numeri EDH e Trismegistos, provenienza, conservazione, supporto, genere, testo, licenza dei metadati
  if (r.epigrafe && Object.keys(r.epigrafe).length) v.epigrafe = r.epigrafe;
  if (sigla) v.truculentus = sigla;
  // carte geografiche manoscritte (dal 26 ottobre 2026): categoria a parte, «tipo: "carta"»; i codici restano senza campo (scripts/carte.mjs)
  // papiri già nel catalogo da altre fonti (Heidelberger Papyrussammlung, «Pap.» della BSB): tipo «papiro» (scripts/fonti/papiri.mjs)
  const tipo = tipoDa({ tipo: r.tipo || papiroDa({ fonte: r.fonte, biblioteca: r.biblioteca, segnatura: v.segnatura }), titolo: r.titolo, descrizione: r.descrizione, generi: r.generi, tecnica: r.tecnica, segnatura: v.segnatura });
  if (tipo) v.tipo = tipo;
  // codici miniati e illustrati, codici musicali (dal 26 ottobre 2026): solo dai metadati salvati (scripts/miniati.mjs, scripts/musica.mjs)
  const dati = { tipo: v.tipo, titolo: r.titolo, descrizione: r.descrizione, generi: r.generi, tecnica: r.tecnica, indice: r.indice, segnatura: v.segnatura };
  // (le epigrafi no: rilievi e decorazioni del monumento non sono miniature)
  if (v.tipo !== "epigrafe" && miniatoDa(dati)) v.miniato = true;
  if (v.tipo !== "epigrafe" && musicaDa(dati)) v.musica = true;
  return v;
}

function unisciBsb(rs) {
  // la BSB descrive ogni opera di un codice con un record, e ogni record cita anche i volumi digitalizzati del catalogo
  // a stampa: un identificativo citato da molte segnature è un catalogo, non il codice. Si riunisce per segnatura.
  const quante = new Map();
  for (const r of rs) for (const u of r.digitalizzati || [r.id.replace(/^bsb-/, "")]) { if (!quante.has(u)) quante.set(u, new Set()); quante.get(u).add(r.segnatura); }
  const m = new Map();
  for (const r0 of rs) {
    const cand = (r0.digitalizzati || [r0.id.replace(/^bsb-/, "")]).filter(u => quante.get(u).size <= 2);
    if (!cand.length) continue;
    const bsb = cand[cand.length - 1];
    const r = { ...r0, id: "bsb-" + bsb, manifest: `https://api.digitale-sammlungen.de/iiif/presentation/v2/${bsb}/manifest`, pagina: `https://www.digitale-sammlungen.de/view/${bsb}` };
    delete r.digitalizzati;
    const x = m.get(r.segnatura);
    if (!x) { m.set(r.segnatura, r); continue; }
    if (x.titolo !== r.titolo) x.titolo = [x.titolo, r.titolo].filter(Boolean).join(" ; ");
    x.autori_fonte = [...new Set([...(x.autori_fonte || []), ...(r.autori_fonte || [])])];
    x.collaboratori = [...new Set([...(x.collaboratori || []), ...(r.collaboratori || [])])];
    if (r.descrizione && !(x.descrizione || "").includes(r.descrizione)) x.descrizione = [x.descrizione, r.descrizione].filter(Boolean).join(" ; ").slice(0, 4000);
    if (!x.datazione) x.datazione = r.datazione;
  }
  return [...m.values()];
}

const naturale = (a, b) => String(a).localeCompare(String(b), "it", { numeric: true, sensitivity: "base" });

async function main() {
  const AUTORI = caricaAutori();
  const prima = catalogoPrecedente();
  const perFonte = {}, esito = {}, dettagli = {};
  // minuti per una fonte: il suo limite, ridotto a quanto resta del tempo complessivo (10 minuti restano per costruire, provare e salvare)
  const tempo = cap => {
    if (!arg["minuti-totali"]) return cap;
    const resto = +arg["minuti-totali"] - (Date.now() - INIZIO) / 60e3 - 10;
    if (resto <= 1 && !arg["solo-costruisci"]) throw new Error("tempo complessivo esaurito: fonte rimandata alla prossima esecuzione");
    return Math.min(cap || Infinity, resto);
  };
  // fonti non interrogate in questa esecuzione: si ricostruiscono senza richieste dagli stati salvati (cache o data/*.json), così il riconoscimento
  // degli autori è sempre quello di data/autori.json; se lo stato non c'è, restano le voci del catalogo precedente
  const sc = f => !!arg["solo-costruisci"] || !FONTI.includes(f);
  const min = (f, m) => (sc(f) ? 0 : tempo(m));
  const oai = f => ({ limiteMinuti: min(f, +arg["oai-minuti"] || 0), soloCache: sc(f) });
  // indici delle miscellanee di Heidelberg: solo per i codici latini (o di lingua non indicata) che la scheda non fa riconoscere; non per i papiri
  const daIndice = r => !/Papyrussammlung/.test(r.biblioteca || "") && (!(r.lingue || []).length || r.lingue.includes("la")) && !riconosci(campiDi(r), AUTORI).length;
  const lavori = {
    heidelberg: async () => {
      const rs = await raccogliHeidelberg(oai("heidelberg"));
      dettagli.heidelberg = { candidati: rs.filter(daIndice).length };
      let minuti = 0; try { minuti = min("heidelberg", +(arg["indici-minuti"] ?? 20)); } catch (e) {}
      if (minuti > 0) {
        try { await leggiIndiciHeidelberg(rs, r => !daIndice(r), { minuti }); }
        catch (e) { log("heidelberg-indici", "ERRORE", e.message); }
      }
      return conIndici(rs);
    },
    ecodices: () => raccogliEcodices(oai("ecodices")),
    bsb: async () => unisciBsb(await raccogliBsb(oai("bsb"))),
    // Berlino risponde lentamente (circa 35 secondi per pagina, 71 pagine): ha un limite suo, così finisce in una sola esecuzione
    berlino: () => raccogliBerlino({ limiteMinuti: min("berlino", +(arg["berlino-minuti"] ?? arg["oai-minuti"] ?? 0)), soloCache: sc("berlino") }),
    bodleian: async () => recordBodleian(await scansionaBodleian({ minuti: min("bodleian", +(arg["bodleian-minuti"] ?? 30)), soloCache: sc("bodleian") })),
    gallica: () => raccogliGallica({ limiteMinuti: min("gallica", +(arg["gallica-minuti"] ?? 30)), soloCache: sc("gallica") }),
    laurenziana: async () => recordLaurenziana(await scansionaLaurenziana({ minuti: min("laurenziana", +(arg["laurenziana-minuti"] ?? 15)), soloCache: sc("laurenziana") })),
    // biblioteche italiane (corsia «italia»)
    ambrosiana: async () => recordAmbrosiana(await scansionaAmbrosiana({ minuti: min("ambrosiana", +(arg["ambrosiana-minuti"] ?? 20)), soloCache: sc("ambrosiana") })),
    montecassino: async () => recordMontecassino(await scansionaMontecassino({ minuti: min("montecassino", +(arg["montecassino-minuti"] ?? 5)), soloCache: sc("montecassino") })),
    casanatense: async () => recordCasanatense(await scansionaCasanatense({ minuti: min("casanatense", +(arg["casanatense-minuti"] ?? 5)), soloCache: sc("casanatense") })),
    bub: async () => recordBub(await scansionaBub({ minuti: min("bub", +(arg["bub-minuti"] ?? 10)), soloCache: sc("bub") })),
    // Firenze (copie della Biblioteca su Internet Archive), Vallicelliana (OMNES), Malatestiana (manifesti scritti dal catalogo)
    bncf: async () => recordBncf(await scansionaBncf({ minuti: min("bncf", +(arg["bncf-minuti"] ?? 5)), soloCache: sc("bncf") })),
    vallicelliana: async () => recordVallicelliana(await scansionaVallicelliana({ minuti: min("vallicelliana", +(arg["vallicelliana-minuti"] ?? 5)), soloCache: sc("vallicelliana") })),
    malatestiana: async () => recordMalatestiana(await scansionaMalatestiana({ minuti: min("malatestiana", +(arg["malatestiana-minuti"] ?? 20)), soloCache: sc("malatestiana") })),
    // Classense: nessuna richiesta, l'elenco viene dal browser (scripts/browser/classense.js -> data/classense.json)
    classense: async () => recordClassense(),
    leiden: async () => recordLeiden(await scansionaLeiden({ minuti: min("leiden", +(arg["leiden-minuti"] ?? 15)), soloCache: sc("leiden") })),
    // biblioteche lette dal Handschriftenportal: una fonte ciascuna, con il suo stato in data/<fonte>.json
    ...Object.fromEntries(Object.keys(FONTI_HSP).map(f => [f, async () => recordHsp(f, await scansionaHsp({ fonte: f, minuti: min(f, +(arg["hsp-minuti"] ?? 10)), soloCache: sc(f) }))])),
    // Österreichische Nationalbibliothek: elenco da ÖNB Digital, poi un manifesto per candidato (a riprese)
    onb: async () => recordOnb(await scansionaOnb({ minuti: min("onb", +(arg["onb-minuti"] ?? 30)), soloCache: sc("onb") })),
    yale: async () => recordYale(await scansionaYale({ minuti: min("yale", +(arg["yale-minuti"] ?? 30)), soloCache: sc("yale") })),
    penn: async () => recordPenn(await scansionaPenn({ minuti: min("penn", +(arg["penn-minuti"] ?? 15)), soloCache: sc("penn") })),
    // Digital Scriptorium: la biblioteca è quella vera; i codici che Penn e Yale danno già restano a quelle fonti
    ds: async () => {
      const st = await scansionaDs({ minuti: min("ds", +(arg["ds-minuti"] ?? 15)), soloCache: sc("ds") });
      const gia = ["penn", "yale"].flatMap(f => perFonte[f] || prima.filter(v => v.fonte === f));
      const scarti = {}, rs = recordDs(st, { esistenti: esistentiDa(gia), scarti });
      const per = {}; for (const r of rs) per[r.biblioteca] = (per[r.biblioteca] || 0) + 1;
      dettagli.ds = { scarti, perIstituzione: per };
      return rs;
    },
    // Harvard: LibraryCloud dal server (corsia «usa»); se risponde 403 resta l'elenco raccolto dal browser (scripts/browser/harvard.js
    // -> data/harvard.json); i codici che
    // Digital Scriptorium dà già (stesso manifesto o stessa segnatura della Houghton) restano alla fonte «ds»
    harvard: async () => {
      let st, errore = null;
      try { st = await scansionaHarvard({ minuti: min("harvard", +(arg["harvard-minuti"] ?? 10)), soloCache: sc("harvard") }); }
      catch (e) { errore = e; st = leggiHarvard(); log("harvard", e.message); }
      if (!st || !st.voci || !Object.keys(st.voci).length) throw errore || new Error("nessun elenco");
      const gia = perFonte.ds || prima.filter(v => v.fonte === "ds");
      const scarti = {}, rs = recordHarvard(st, { esistenti: esistentiHarvard(gia), scarti });
      dettagli.harvard = { scarti };
      return rs;
    },
    // Walters: niente IIIF presso il museo; i manifesti si scrivono dallo stato (anche quando la fonte è sospesa)
    walters: async () => {
      let st, errore = null;
      try { st = await scansionaWalters({ minuti: min("walters", +(arg["walters-minuti"] ?? 20)), soloCache: sc("walters") }); }
      catch (e) { errore = e; }
      const m = scriviManifestiWalters(st || statoWalters());
      log("walters", `manifesti IIIF: ${m.manifesti} (${m.cambiati} cambiati)`);
      if (errore) throw errore;
      return recordWalters(st);
    },
    // Library of Congress e Biblioteca Nazionale di Grecia: i manifesti li scrive il catalogo (scripts/manifesti.mjs, ramo «manifesti»)
    loc: async () => recordLoc(await scansionaLoc({ minuti: min("loc", +(arg["loc-minuti"] ?? 10)), soloCache: sc("loc") })),
    nlg: async () => recordNlg(await scansionaNlg({ minuti: min("nlg", +(arg["nlg-minuti"] ?? 15)), soloCache: sc("nlg") })),
    // Regno Unito e Irlanda (corsia «uk»): Wellcome, Irish Script on Screen, Manchester, Cambridge, Chester Beatty
    wellcome: async () => recordWellcome(await scansionaWellcome({ minuti: min("wellcome", +(arg["wellcome-minuti"] ?? 10)), soloCache: sc("wellcome") })),
    // British Library (dal 26 ottobre 2026): nuovo servizio IIIF (bl.digirati.io) e copie nella Qatar Digital Library, elenco dal catalogo
    bl: async () => recordBl(await scansionaBl({ minuti: min("bl", +(arg["bl-minuti"] ?? 40)), soloCache: sc("bl") })),
    // i codici della British Library che la fonte «bl» dà già (stessa segnatura) restano a quella fonte
    isos: async () => {
      const rs = recordIsos(await scansionaIsos({ minuti: min("isos", +(arg["isos-minuti"] ?? 20)), soloCache: sc("isos") }));
      const bl = new Set((perFonte.bl || prima.filter(v => v.fonte === "bl")).map(v => String(v.segnatura).toLowerCase()));
      return rs.filter(r => !(/British Library/i.test(r.biblioteca || "") && bl.has(String(r.segnatura).toLowerCase())));
    },
    manchester: async () => recordManchester(await scansionaManchester({ minuti: min("manchester", +(arg["manchester-minuti"] ?? 30)), soloCache: sc("manchester") })),
    // Cambridge: dal 26 ottobre 2026 dal server, con le collezioni IIIF (/iiif/collection/<slug>)
    cudl: async () => recordCudl(await scansionaCudl({ minuti: min("cudl", +(arg["cudl-minuti"] ?? 30)), soloCache: sc("cudl") })),
    cbl: async () => recordCbl(await scansionaCbl({ minuti: min("cbl", +(arg["cbl-minuti"] ?? 60)), soloCache: sc("cbl") })),
    // Parker e National Library of Wales (dal 26 ottobre 2026): elenchi dei siti delle biblioteche dietro verifiche anti-robot, non usati;
    // gli identificativi dei manifesti vengono da fonti pubbliche di altri enti (Biblissima; Wikidata ed Europeana)
    parker: async () => recordParker(await scansionaParker({ minuti: min("parker", +(arg["parker-minuti"] ?? 20)), soloCache: sc("parker") })),
    nlw: async () => recordNlw(await scansionaNlw({ minuti: min("nlw", +(arg["nlw-minuti"] ?? 10)), soloCache: sc("nlw") })),
    // Asia orientale e Oceania (corsia «mondo»): National Diet Library, Kokusho (NIJL), Auckland
    ndl: async () => recordNdl(await scansionaNdl({ minuti: min("ndl", +(arg["ndl-minuti"] ?? 60)), controlloMinuti: min("ndl", +(arg["ndl-controllo-minuti"] ?? 40)), soloCache: sc("ndl") })),
    kokusho: async () => recordKokusho(await scansionaKokusho({ minuti: min("kokusho", +(arg["kokusho-minuti"] ?? 60)), soloCache: sc("kokusho") })),
    // Europa (corsia «europa», dal 26 ottobre 2026): handrit.is (nessuna richiesta al sito: descrizioni TEI da GitHub), Polona, Manuscriptorium
    handrit: async () => recordHandrit(await scansionaHandrit({ soloCache: sc("handrit") })),
    polona: async () => recordPolona(await scansionaPolona({ minuti: min("polona", +(arg["polona-minuti"] ?? 20)), soloCache: sc("polona") })),
    manuscriptorium: async () => recordManuscriptorium(await scansionaManuscriptorium({ minuti: min("manuscriptorium", +(arg["manuscriptorium-minuti"] ?? 30)), soloCache: sc("manuscriptorium") })),
    // Copenaghen (Det Kgl. Bibliotek, manifesti scritti dal catalogo) e Amsterdam (Allard Pierson), dal 26 ottobre 2026
    kbdk: async () => recordKbdk(await scansionaKbdk({ minuti: min("kbdk", +(arg["kbdk-minuti"] ?? 30)), soloCache: sc("kbdk") })),
    uva: async () => recordUva(await scansionaUva({ minuti: min("uva", +(arg["uva-minuti"] ?? 5)), soloCache: sc("uva") })),
    // Europa centrale (corsia «centro», dal 27 ottobre 2026): Graz e Salisburgo (sitemap e manifesti di Visual Library), ELTE Budapest (API di EDIT);
    // i codici dell'ELTE che Manuscriptorium dà già (stessa segnatura nella stessa biblioteca) restano a quella fonte
    vlaustria: async () => recordVlaustria(await scansionaVlaustria({ minuti: min("vlaustria", +(arg["vlaustria-minuti"] ?? 30)), soloCache: sc("vlaustria") })),
    elte: async () => {
      const rs = recordElte(await scansionaElte({ minuti: min("elte", +(arg["elte-minuti"] ?? 5)), soloCache: sc("elte") }));
      const mns = (perFonte.manuscriptorium || prima.filter(v => v.fonte === "manuscriptorium")).filter(v => v.citta === "Budapest" && /University Library Budapest|Department of Manuscripts and Rare Books/.test(v.biblioteca || ""));
      const gia = new Set(mns.map(v => segnaturaNorm(v.segnatura)));
      return rs.filter(r => !gia.has(segnaturaNorm(r.segnatura)));
    },
    // State Library Victoria: nessuna richiesta, l'elenco viene dal browser (scripts/browser/slv.js -> data/slv.json)
    slv: async () => recordSlv(),
    auckland: async () => recordAuckland(await scansionaAuckland({ minuti: min("auckland", +(arg["auckland-minuti"] ?? 10)), soloCache: sc("auckland") })),
    // Canada (corsia «mondo»): University of Toronto, Thomas Fisher Rare Book Library (collezioni IIIF pubbliche)
    toronto: async () => recordToronto(await scansionaToronto({ minuti: min("toronto", +(arg["toronto-minuti"] ?? 15)), soloCache: sc("toronto") })),
    // Spagna (corsia «iberia»): CONTENTdm della Catalogna, Omeka S (Real Biblioteca ed El Escorial, Complutense), Siviglia su Internet Archive, RAH (DIGIBIB)
    ...Object.fromEntries(Object.keys(FONTI_CDM).map(f => [f, async () => recordCdm(f, await scansionaCdm({ fonte: f, minuti: min(f, +(arg[f + "-minuti"] ?? 10)), soloCache: sc(f) }))])),
    ...Object.fromEntries(Object.keys(FONTI_OMEKA).map(f => [f, async () => recordOmeka(f, await scansionaOmeka({ fonte: f, minuti: min(f, +(arg[f + "-minuti"] ?? 15)), soloCache: sc(f) }))])),
    sevilla: async () => recordSevilla(await scansionaSevilla({ minuti: min("sevilla", +(arg["sevilla-minuti"] ?? 5)), soloCache: sc("sevilla") })),
    rah: async () => recordDigibib("rah", await scansionaDigibib({ fonte: "rah", minuti: min("rah", +(arg["rah-minuti"] ?? 30)), soloCache: sc("rah") })),
    // America Latina, siti solo PDF: nessuna richiesta, i dati sono in scripts/fonti/latam_pdf.mjs e data/latam_pdf.json
    bnchile: async () => recordLatam("bnchile"),
    bnv: async () => recordLatam("bnv"),
    // Grecia (corsia «mondo»): Università di Atene (Pergamos, manifesti scritti dal catalogo) e Monastero di Rousanou alle Meteore (IIIF di Kalambaka)
    pergamos: async () => recordPergamos(await scansionaPergamos({ minuti: min("pergamos", +(arg["pergamos-minuti"] ?? 10)), soloCache: sc("pergamos") })),
    rousanou: async () => recordRousanou(await scansionaRousanou({ minuti: min("rousanou", +(arg["rousanou-minuti"] ?? 5)), soloCache: sc("rousanou") })),
    // Africa (corsia «mondo»): American University in Cairo (CONTENTdm, in FONTI_CDM qui sopra) e Northwestern (Herskovits Library)
    northwestern: async () => recordNorthwestern(await scansionaNorthwestern({ minuti: min("northwestern", +(arg["northwestern-minuti"] ?? 5)), soloCache: sc("northwestern") })),
    // National Library of Israel (corsia «mondo»): elenco da Europeana; i manifesti già nel catalogo (codici ebraici di Lipsia) restano a quelle fonti
    nli: async () => {
      const rs = recordNli(await scansionaNli({ minuti: min("nli", +(arg["nli-minuti"] ?? 15)), soloCache: sc("nli") }));
      const gia = new Set(Object.keys(perFonte).filter(f => f !== "nli").flatMap(f => perFonte[f].map(r => r.manifest)));
      for (const v of prima) if (v.fonte !== "nli" && !perFonte[v.fonte]) gia.add(v.manifest);
      return rs.filter(r => !gia.has(r.manifest));
    },
    // J. Paul Getty Museum (corsia «usa»): SPARQL e schede Linked Art di data.getty.edu
    getty: async () => recordGetty(await scansionaGetty({ minuti: min("getty", +(arg["getty-minuti"] ?? 15)), soloCache: sc("getty") })),
    // Europa orientale (corsia «est»): Biblioteca Nazionale di Bulgaria (JPEG della biblioteca, manifesti scritti dal catalogo)
    nbkm: async () => recordNbkm(await scansionaNbkm({ minuti: min("nbkm", +(arg["nbkm-minuti"] ?? 20)), soloCache: sc("nbkm") })),
    // Balcani (corsia «balcani», dal 27 ottobre 2026): Biblioteca della Matica srpska (JPEG del visore della biblioteca, manifesti scritti dal catalogo)
    bms: async () => recordBms(await scansionaBms({ minuti: min("bms", +(arg["bms-minuti"] ?? 20)), soloCache: sc("bms") })),
    // Russia (corsia «est»): codici della Biblioteca Statale Russa e dell'Accademia Teologica di Mosca pubblicati da lib-fond.ru
    libfond: async () => recordLibfond(await scansionaLibfond({ minuti: min("libfond", +(arg["libfond-minuti"] ?? 60)), soloCache: sc("libfond") })),
    // Internet Archive: tutte le altre biblioteche che vi pubblicano manoscritti (profili in scripts/fonti/archive.mjs); i codici che il
    // catalogo ha già da altre fonti (stesso oggetto di Internet Archive o stessa segnatura nella stessa biblioteca) restano a quelle fonti
    archive: async () => {
      const st = await scansionaArchive({ minuti: min("archive", +(arg["archive-minuti"] ?? 10)), soloCache: sc("archive") });
      const altre = Object.keys(perFonte).filter(f => f !== "archive");
      const gia = [...altre.flatMap(f => perFonte[f]), ...prima.filter(v => v.fonte !== "archive" && !altre.includes(v.fonte))];
      const scarti = {}, rs = recordArchive(st, { esistenti: esistentiArchive(gia), scarti });
      const per = {}; for (const r of rs) per[r.biblioteca] = (per[r.biblioteca] || 0) + 1;
      dettagli.archive = { scarti, perIstituzione: per };
      return rs;
    },
    // Asia orientale e Sud-est asiatico (corsia «asia»): CrossAsia (Laos e Thailandia del Nord), Berlino (insiemi dell'Asia orientale e
    // del Sud-est asiatico, stessi id della fonte «berlino»), Fondazione per la conservazione del Nôm (manifesti scritti dal catalogo)
    crossasia: async () => recordCrossasia(await scansionaCrossasia({ minuti: min("crossasia", +(arg["crossasia-minuti"] ?? 30)), soloCache: sc("crossasia") })),
    sbbasia: async () => recordSbbasia(await scansionaSbbasia({ minuti: min("sbbasia", +(arg["sbbasia-minuti"] ?? 30)), soloCache: sc("sbbasia") })),
    // Berlino, manoscritti non europei (corsia «asia»): fuori i codici che le fonti «berlino» e «sbbasia» hanno già (stesso PPN)
    sbbor: async () => {
      const st = await scansionaSbbor({ minuti: min("sbbor", +(arg["sbbor-minuti"] ?? 30)), soloCache: sc("sbbor") });
      const gia = new Set(["berlino", "sbbasia"].flatMap(f => (perFonte[f] || prima.filter(v => v.fonte === f)).map(v => v.id)));
      return recordSbbor(st, { esistenti: gia });
    },
    nomfoundation: async () => recordNom(await scansionaNomfoundation({ minuti: min("nomfoundation", +(arg["nomfoundation-minuti"] ?? 20)), soloCache: sc("nomfoundation") })),
    // Europa del Nord e Lussemburgo (corsia «nord», dal 27 ottobre 2026): Nasjonalbiblioteket (API del catalogo), manuscripta.se (Svezia),
    // Bibliothèque nationale du Luxembourg (API del visore, manifesti scritti dal catalogo)
    nb: async () => recordNb(await scansionaNb({ minuti: min("nb", +(arg["nb-minuti"] ?? 60)), soloCache: sc("nb") })),
    manuscripta: async () => recordManuscripta(await scansionaManuscripta({ minuti: min("manuscripta", +(arg["manuscripta-minuti"] ?? 15)), soloCache: sc("manuscripta") })),
    bnl: async () => recordBnl(await scansionaBnl({ minuti: min("bnl", +(arg["bnl-minuti"] ?? 5)), soloCache: sc("bnl") })),
    // Vicino Oriente e Golfo (corsia «medioriente», dal 27 ottobre 2026): Iraqi Jewish Archive (Omeka S, manifesti IIIF del sito)
    ija: async () => recordIja(await scansionaIja({ minuti: min("ija", +(arg["ija-minuti"] ?? 5)), soloCache: sc("ija") })),
    // stampe antiche (corsia «stampe», dal 27 ottobre 2026): incunaboli e edizioni principi; stato in data/stampe.json. Le copie che il
    // catalogo ha già da altre fonti (stesso manifesto) restano a quelle fonti
    stampe: async () => {
      let st;
      try { st = await scansionaStampe({ minuti: min("stampe", +(arg["stampe-minuti"] ?? 60)), soloCache: sc("stampe") }); }
      catch (e) { if (!e.stato) throw e; log("stampe", e.message); st = e.stato; }
      const gia = new Set(Object.keys(perFonte).filter(f => f !== "stampe").flatMap(f => perFonte[f].map(r => r.manifest)));
      for (const v of prima) if (v.fonte !== "stampe" && !perFonte[v.fonte]) gia.add(v.manifest);
      const rs = recordStampe(st).filter(r => !gia.has(r.manifest));
      dettagli.stampe = { incunaboli: rs.filter(r => r.tipo === "incunabolo").length, edizioni_principi: rs.filter(r => r.editio_princeps).length };
      return rs;
    },
    // papiri (corsia «papiri», dal 28 ottobre 2026): stato in data/papiri.json, schede di papyri.info in data/papiri-info.json. I papiri che il
    // catalogo ha già da altre fonti (stesso manifesto) restano a quelle fonti
    papiri: async () => {
      let st;
      try { st = await scansionaPapiri({ minuti: min("papiri", +(arg["papiri-minuti"] ?? 60)), soloCache: sc("papiri") }); }
      catch (e) { if (!e.stato) throw e; log("papiri", e.message); st = e.stato; }
      const gia = new Set(Object.keys(perFonte).filter(f => f !== "papiri").flatMap(f => perFonte[f].map(r => r.manifest)));
      for (const v of prima) if (v.fonte !== "papiri" && !perFonte[v.fonte]) gia.add(v.manifest);
      const rs = recordPapiri(st).filter(r => !gia.has(r.manifest));
      const per = {}; for (const r of rs) { const k = r.id.split("-")[1]; per[k] = (per[k] || 0) + 1; }
      dettagli.papiri = { perRaccolta: per, letterari: rs.filter(r => r.papiro && r.papiro.genere === "letterario").length };
      return rs;
    },
    // epigrafi (corsia «epigrafi», dal 28 ottobre 2026): stato in data/epigrafi.json, iscrizioni dell'EDH in data/epigrafi-edh.json
    // (scripts/epigrafi-edh.mjs). Le iscrizioni che il catalogo ha già da altre fonti (stesso manifesto) restano a quelle fonti
    epigrafi: async () => {
      let st;
      try { st = await scansionaEpigrafi({ minuti: min("epigrafi", +(arg["epigrafi-minuti"] ?? 60)), soloCache: sc("epigrafi") }); }
      catch (e) { if (!e.stato) throw e; log("epigrafi", e.message); st = e.stato; }
      const gia = new Set(Object.keys(perFonte).filter(f => f !== "epigrafi").flatMap(f => perFonte[f].map(r => r.manifest)));
      for (const v of prima) if (v.fonte !== "epigrafi" && !perFonte[v.fonte]) gia.add(v.manifest);
      const rs = recordEpigrafi(st).filter(r => !gia.has(r.manifest));
      const per = {}; for (const r of rs) { const k = r.id.split("-")[1]; per[k] = (per[k] || 0) + 1; }
      dettagli.epigrafi = { perRaccolta: per, conTesto: rs.filter(r => r.epigrafe && r.epigrafe.testo).length };
      return rs;
    },
    vaticana: async () => {
      let minuti = +(arg["vaticana-minuti"] ?? 20);
      // con un tempo complessivo si lasciano 10 minuti per costruire il catalogo, provarlo e salvarlo
      if (arg["minuti-totali"]) minuti = Math.max(0, Math.min(minuti, +arg["minuti-totali"] - (Date.now() - INIZIO) / 60e3 - 10));
      if (!sc("vaticana") && minuti > 0) await scansiona({ minuti, extra: ["Pal.lat.1615", "Vat.lat.3870"] });
      return recordVaticana();
    },
  };
  for (const f of Object.keys(lavori)) {
    try {
      const rs = await lavori[f]();
      // una fonte senza stato salvato (prima raccolta mai fatta) non cancella le voci precedenti
      if (sc(f) && !rs.length) throw new Error("nessun dato salvato");
      perFonte[f] = rs; esito[f] = FONTI.includes(f) ? "ok" : "precedente"; log(f, `${rs.length} record${FONTI.includes(f) ? "" : " (dagli stati salvati)"}`);
    }
    catch (e) { esito[f] = FONTI.includes(f) ? "errore: " + e.message : "precedente"; log(f, FONTI.includes(f) ? "ERRORE" : "nessuno stato salvato:", e.message, "(restano le voci precedenti)"); }
  }
  // ricostruzione senza richieste (salvataggio delle corsie): l'esito di ogni fonte è quello dell'ultima raccolta vera
  // (data/raccolte.json), non quello della ricostruzione (una corsia senza la cache OAI ricostruisce quelle fonti dal catalogo precedente)
  if (arg["solo-costruisci"]) {
    let raccolte = {}; try { raccolte = JSON.parse(fs.readFileSync("data/raccolte.json", "utf8")); } catch (e) {}
    for (const f of Object.keys(lavori)) if (raccolte[f] && raccolte[f].esito) esito[f] = raccolte[f].esito;
  }
  const sigle = new Map(TRUCULENTUS.map(t => [t.manifest, t.sigla]));
  const voci = new Map();
  const t0 = Date.now();
  // Fonti sospese: entra nel catalogo solo ciò che si apre dentro il sito. Per queste i manifesti o le immagini
  // non si aprono nemmeno da un browser normale (verificato il 24 ottobre 2026): restano raccolte negli stati
  // ma non entrano nel catalogo finché non tornano raggiungibili.
  const SOSPESE = { wolfenbuettel: "server iiif.hab.de non raggiungibile", karlsruhe: "digital.blb-karlsruhe.de risponde 403", stoccarda: "manifesti di Marburgo non raggiungibili", walters: "le immagini di thedigitalwalters.org non si caricano nemmeno dal browser (errore 522 del server del museo, 25 ottobre 2026)" };
  for (const f of Object.keys(SOSPESE)) if (f in lavori) { esito[f] = "sospesa: " + SOSPESE[f]; log(f, "sospesa:", SOSPESE[f]); }
  for (const f of Object.keys(lavori)) {
    if (SOSPESE[f]) continue;
    if (perFonte[f]) { for (const r of perFonte[f]) { const v = voce(r, AUTORI, sigle); if (v) voci.set(v.id, v); } }
    else for (const v of prima.filter(x => x.fonte === f)) {
      // voci precedenti senza lingua: si prova la deduzione
      if (!v.lingue.length) { v.lingue = deduciLingue(v.segnatura, v.titolo, v.autori); v.lingua_dedotta = v.lingue.length > 0; }
      { const ind = correggiIndigene(v); if (ind) { v.lingue = ind.lingue; v.lingua_dedotta = ind.dedotta; } }
      // tipo: quello già deciso dalla fonte, altrimenti dal titolo
      if (!v.tipo) { const tipo = papiroDa(v) || tipoDa(v); if (tipo) v.tipo = tipo; }
      // miniati e musica: quelli già decisi, altrimenti da titolo e segnatura (le carte non lo sono mai)
      if (/^carta/.test(v.tipo || "")) { delete v.miniato; delete v.musica; }
      else { if (!v.miniato && miniatoDa(v)) v.miniato = true; if (!v.musica && musicaDa(v)) v.musica = true; }
      voci.set(v.id, v);
    }
  }
  for (const t of TRUCULENTUS) if (![...voci.values()].some(v => v.manifest === t.manifest)) voci.set(t.id, voce(t, AUTORI, sigle));
  log(`riconoscimento: ${voci.size} codici in ${Math.round((Date.now() - t0) / 1000)} secondi`);
  const manoscritti = [...voci.values()].sort((a, b) => naturale(a.biblioteca, b.biblioteca) || naturale(a.segnatura, b.segnatura) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const daIndici = manoscritti.filter(v => v.autori.some(a => a.corrispondenza.startsWith("indice:"))).length;
  log(`riconosciuti grazie all'indice dei contenuti: ${daIndici}`);
  const nomiFonti = Object.fromEntries(Object.keys(lavori).map(f => [f, NOMI_FONTI[f]]));
  const ris = scriviCatalogo(manoscritti, { fonti: Object.keys(lavori), nomi: nomiFonti, esito, autori: AUTORI });
  // registro delle biblioteche (docs/BIBLIOTECHE.md): esiti delle raccolte vere e tabella delle fonti agganciate
  if (!arg["solo-costruisci"]) registraEsiti(Object.fromEntries(Object.keys(lavori).map(f => [f, esito[f]])));
  if (scriviRegistro({ fonti: Object.keys(lavori), conteggio: ris.conteggio, conAutori: ris.conAutori, lingue: ris.lingue, dettagli })) log("registro delle biblioteche aggiornato");
  log(ris.cambiato ? `catalogo scritto: ${manoscritti.length} codici (${Object.entries(ris.conteggio).map(([k, n]) => k + " " + n).join(", ")}), ${ris.kb} KB in ${ris.file} file`
    : `catalogo invariato: ${manoscritti.length} codici`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
