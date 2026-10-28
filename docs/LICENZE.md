# Licenze dei metadati delle fonti

Verifica del 28 ottobre 2026. Riguarda solo i **metadati** (segnature, titoli, date, lingue, descrizioni), non le immagini.
Serve a capire che cosa possiamo fare quando il catalogo esce dal repository pubblico e viene servito a pezzi dal sito
(progetto in `docs/PROTEZIONE_CATALOGO.md` del repository `emendando`).

Le fonti sono le 78 elencate in `data/catalogo/indice.json` (campo `fonti`) più i papiri e le epigrafi (dal 28 ottobre 2026).
La «fonte dell'informazione» è la pagina in cui la licenza è dichiarata; quando una pagina non c'è, la licenza è
«non dichiarata» (nessuna supposizione). Le licenze delle immagini che si vedono nelle schede del catalogo (campo `licenza`)
non contano qui, salvo dove la fonte le estende espressamente ai metadati.

Non è una consulenza legale.

## Come leggere la colonna «conseguenza»

- **si può chiudere**: metadati in CC0, pubblico dominio, uso libero, oppure licenze aperte con la sola attribuzione
  (CC BY, Licence Ouverte). Possiamo tenerli in un archivio privato e servirli a pezzi. Con le licenze di attribuzione
  va citata la fonte e non si può impedire a nessuno di riusare i dati di quella fonte presi da noi: la tutela vale per la
  nostra raccolta nel suo insieme, non per il singolo dato altrui.
- **va ridistribuita alle stesse condizioni**: licenze «condividi allo stesso modo» (CC BY-SA, ODbL). Se pubblichiamo
  quei dati, anche a pezzi, dobbiamo farlo con la stessa licenza: per quella parte la chiusura non tiene.
- **solo uso non commerciale**: licenze NC o condizioni che vietano l'uso commerciale. Chiudere si può; vendere l'accesso
  a quei dati no, e un uso dentro un servizio a pagamento va chiarito con la fonte.
- **da chiedere**: licenza non dichiarata o diritti riservati. Chiudere non viola nulla, ma il nostro stesso riuso
  (raccolta e pubblicazione) poggia solo sulle condizioni generali del sito: conviene un permesso scritto, magari con la
  lettera dell'Università di Urbino. Segnature, date e lingue sono dati di fatto non protetti dal diritto d'autore;
  il rischio vero è il diritto sui generis delle biblioteche europee sulle loro banche dati.

## Riepilogo

| Tipo di licenza dei metadati | Fonti | Conseguenza |
|---|---|---|
| CC0, pubblico dominio o uso libero dichiarato | 22 | si può chiudere |
| Aperta con attribuzione (CC BY 4.0, Licence Ouverte, condizioni della NDL) | 3 | si può chiudere (con attribuzione) |
| Condividi allo stesso modo (CC BY-SA) | 2 (Biblioteca Nacional de Venezuela, 3 codici; Epigraphic Database Heidelberg dentro la fonte `epigrafi`, 12.205 iscrizioni) | va ridistribuita alle stesse condizioni |
| Non commerciale | 3 (Cambridge Digital Library, CrossAsia, Manchester) | solo uso non commerciale |
| Diritti riservati | 5 (Vaticana, Ambrosiana, Montecassino, Vallicelliana, ISOS) | da chiedere |
| Non dichiarata | 43 | da chiedere |
| Mista | 1 (stampe antiche) | secondo la biblioteca d'origine |
| In arrivo: papiri | 1 | attribuzione per papyri.info; il resto secondo la raccolta |
| Epigrafi (mista) | 1 | EDH CC BY-SA 4.0 (resta aperta); Met e Wikidata CC0 (si può chiudere) |

Bloccano davvero la chiusura soltanto i dati in «condividi allo stesso modo»: i 3 codici della Biblioteca Nacional
de Venezuela e, dal 28 ottobre 2026, le 12.205 iscrizioni dell'Epigraphic Database Heidelberg (fonte `epigrafi`, id «ep-edh-…»,
con il testo trascritto). Si servono a parte, aperte, con la loro licenza e l'attribuzione; nel catalogo ogni voce lo dice da sola
(`epigrafe.licenza_metadati` «CC BY-SA 4.0» e `epigrafe.aperta` true). Le tre fonti non commerciali (circa 25.600
codici, quasi tutti di CrossAsia) non impediscono di chiudere, ma restano fuori da qualunque offerta a pagamento.
Manchester, inoltre, vieta nelle sue condizioni proprio l'estrazione sistematica di parti sostanziali: è la stessa tutela
che vogliamo noi, e va chiesto il permesso anche per la raccolta che già facciamo.

## Tabella

| Fonte (id) | Licenza dei metadati | Fonte dell'informazione | Conseguenza |
|---|---|---|---|
| Universitätsbibliothek Heidelberg (`heidelberg`) | CC0 (dati di catalogo della biblioteca) | https://www.ub.uni-heidelberg.de/helios/kataloge/lod.html | si può chiudere |
| e-codices (`ecodices`) | metadati dell'interfaccia OAI liberi e senza diritto d'autore; le descrizioni scientifiche hanno una licenza CC con citazione e alcune limiti propri | https://e-codices.unifr.ch/en/about/terms | si può chiudere (noi leggiamo l'OAI) |
| Bayerische Staatsbibliothek (`bsb`) | CC0 (dati del catalogo collettivo B3Kat, di cui fa parte la BSB) | https://www.bib-bvb.de/en/web/b3kat/open-data | si può chiudere |
| Staatsbibliothek zu Berlin (`berlino`) | CC0 («stellt ihre Metadaten unter der Lizenz CC0 frei zur Verfügung») | https://lab.sbb.berlin/bibliographic-data-from-stabikat/?lang=en | si può chiudere |
| Bodleian Libraries (`bodleian`) | non dichiarata (le condizioni di Digital Bodleian parlano delle immagini, CC BY-NC 4.0) | https://digital.bodleian.ox.ac.uk/terms/ | da chiedere |
| Bibliothèque nationale de France, Gallica (`gallica`) | Licence Ouverte di Etalab: riuso libero con menzione della fonte e della data | https://www.bnf.fr/fr/conditions-de-reutilisations-des-donnees-de-la-bnf | si può chiudere (con attribuzione) |
| Biblioteca Medicea Laurenziana (`laurenziana`) | non dichiarata (il campo diritti delle schede, «CC BY-NC-SA», riguarda le riproduzioni) | schede della Teca digitale (tecabml.contentdm.oclc.org) | da chiedere |
| Veneranda Biblioteca Ambrosiana (`ambrosiana`) | riservata: contenuti protetti, vietato l'uso per addestrare sistemi di IA | condizioni del sito ambrosiana.comperio.it (riportate in `scripts/fonti/ambrosiana.mjs`) | da chiedere |
| Montecassino (`montecassino`) | riservata (piattaforma OMNES © DB Seret) | omnes.dbseret.com/montecassino | da chiedere |
| Biblioteca Casanatense (`casanatense`) | non dichiarata | casanatense.contentdm.oclc.org | da chiedere |
| Biblioteca Universitaria di Bologna (`bub`) | non dichiarata (licenza indicata per le immagini, per lo più CC BY-NC-ND 4.0) | historica.unibo.it | da chiedere |
| Biblioteca Nazionale Centrale di Firenze (`bncf`) | non dichiarata (per le riproduzioni: uso non commerciale, art. 108 del Codice dei beni culturali) | oggetti «BNCF - Manuscripts» su archive.org | da chiedere |
| Biblioteca Vallicelliana (`vallicelliana`) | riservata (piattaforma OMNES © DB Seret) | omnes.dbseret.com/vallicelliana | da chiedere |
| Biblioteca Malatestiana (`malatestiana`) | non dichiarata | https://catalogoaperto.malatestiana.it/ | da chiedere |
| Biblioteca Classense (`classense`) | non dichiarata (i manifesti dicono «copyright non valutato») | www.cdc.classense.ra.it | da chiedere |
| Universiteitsbibliotheek Leiden (`leiden`) | non dichiarata (immagini in pubblico dominio o CC BY) | digitalcollections.universiteitleiden.nl | da chiedere |
| Staatsbibliothek Bamberg (`bamberga`) | non dichiarata dall'API del Handschriftenportal (le licenze sono indicate solo sulle singole descrizioni) | https://cms.handschriftenportal.de/release-notes/ | da chiedere |
| Dombibliothek Köln (`colonia`) | come Bamberga | come sopra | da chiedere |
| Universitätsbibliothek Leipzig (`lipsia`) | come Bamberga | come sopra | da chiedere |
| Universitätsbibliothek Frankfurt (`francoforte`) | come Bamberga | come sopra | da chiedere |
| SLUB Dresden (`dresda`) | come Bamberga | come sopra | da chiedere |
| Universitätsbibliothek Tübingen (`tubinga`) | come Bamberga | come sopra | da chiedere |
| ULB Darmstadt (`darmstadt`) | come Bamberga | come sopra | da chiedere |
| Österreichische Nationalbibliothek (`onb`) | non dichiarata per i metadati del catalogo (ONB Labs pubblica alcuni insiemi aperti, non questo) | https://labs.onb.ac.at/de/datasets/catalogue/ | da chiedere |
| Yale University Library (`yale`) | CC0 (ODC-BY per i record presi da WorldCat) | https://guides.library.yale.edu/open-metadata-service | si può chiudere |
| University of Pennsylvania (`penn`) | CC0 per i metadati creati da Penn (ODC-BY per quelli di OCLC); descrizioni di OPenn in CC BY 4.0 | https://www.library.upenn.edu/about/policies/open-metadata e https://openn.library.upenn.edu/ReadMe.html | si può chiudere |
| Digital Scriptorium (`ds`) | CC BY 4.0 | README di https://github.com/DigitalScriptorium/ds-data | si può chiudere (con attribuzione) |
| Harvard Library (`harvard`) | CC0 | https://library.harvard.edu/services-tools/harvard-library-apis-datasets | si può chiudere |
| Library of Congress (`loc`) | pubblico dominio: opere del governo federale degli Stati Uniti (17 U.S.C. § 105) | legge statunitense; condizioni in https://www.loc.gov/legal/ | si può chiudere |
| Biblioteca Nazionale di Grecia (`nlg`) | CC0 («τα μεταδεδομένα ... διατίθενται με τη δήλωση CC0») | https://digitalcollections.nlg.gr/nlg-repo/dl/el/terms.html | si può chiudere |
| Wellcome Collection (`wellcome`) | CC0 per i dati creati da Wellcome | https://developers.wellcomecollection.org/docs/catalogue | si può chiudere |
| British Library (`bl`) | CC0, licenza predefinita dei metadati aperti (la parte della Qatar Digital Library non verificata) | https://www.bl.uk/about/governance/policies/sharing-british-library-open-metadata-with-our-communities | si può chiudere |
| Irish Script on Screen (`isos`) | riservata: diritti sul testo del Dublin Institute for Advanced Studies, uso con citazione | https://www.isos.dias.ie/copyright.html | da chiedere |
| Manchester Digital Collections (`manchester`) | riservata: vietati l'uso commerciale e l'estrazione sistematica di parti sostanziali | https://www.digitalcollections.manchester.ac.uk/terms/ | solo uso non commerciale (e permesso da chiedere) |
| Cambridge Digital Library (`cudl`) | CC BY-NC 3.0 o 4.0 («This metadata is licensed under ...», nei manifesti) | manifesti di cudl.lib.cam.ac.uk/iiif/ | solo uso non commerciale |
| Chester Beatty (`cbl`) | non dichiarata (immagini CC BY 4.0) | https://chesterbeatty.ie/about/copyright-2/ | da chiedere |
| Parker Library (`parker`) | non dichiarata | manifesti di Stanford | da chiedere |
| National Library of Wales (`nlw`) | CC0 per le copie in Wikidata ed Europeana da cui leggiamo l'elenco; la biblioteca vuole metadati aperti ma non nomina la licenza | https://www.wikidata.org/wiki/Wikidata:Licensing e https://www.library.wales/copyright/intellectual-property-rights-policy | si può chiudere |
| National Diet Library (`ndl`) | uso libero e gratuito, anche commerciale, senza richiesta, con l'indicazione della fonte | https://www.ndl.go.jp/jp/data/data_service/quickguide/index.html e https://www.ndl.go.jp/jp/help/data.html | si può chiudere (con attribuzione) |
| Kokusho Database, NIJL (`kokusho`) | dati bibliografici creati dal NIJL ad uso libero; quelli di altri secondo la scheda | https://kokusho.nijl.ac.jp/page/terms.html | si può chiudere (controllare i dati di terzi) |
| handrit.is (`handrit`) | non dichiarata (né sul sito né nel repository GitHub delle descrizioni) | https://handrit.is/about?lang=en e https://github.com/Handrit/Manuscripts | da chiedere |
| Polona (`polona`) | non dichiarata (la Biblioteka Narodowa dice che i metadati sono pubblicati in rete, senza licenza) | https://www.bn.org.pl/uslugi/centrum-kompetencji/udostepnianie-zbiorow-cyfrowych/ | da chiedere |
| Manuscriptorium (`manuscriptorium`) | non dichiarata (le licenze delle schede e dei manifesti, CC BY-NC-SA e CC BY-NC 4.0, riguardano le riproduzioni) | manuscriptorium.com | da chiedere |
| Det Kongelige Bibliotek (`kbdk`) | CC0 («Metadata: This comes to you as CC0 1.0 Universal») | README di https://github.com/kb-dk/access-digital-objects | si può chiudere |
| Allard Pierson, Universiteit van Amsterdam (`uva`) | ODC PDDL per i metadati delle collezioni della Biblioteca UvA (ODC-BY per quelli di WorldCat) | https://uba.uva.nl/en/support/open-data/licences/licences.html | si può chiudere |
| Graz e Salisburgo (`vlaustria`) | non dichiarata | unipub.uni-graz.at, eplus.uni-salzburg.at | da chiedere |
| ELTE Budapest (`elte`) | non dichiarata | edit.elte.hu | da chiedere |
| State Library Victoria (`slv`) | non dichiarata | find.slv.vic.gov.au | da chiedere |
| Auckland Libraries (`auckland`) | non dichiarata | kura.aucklandlibraries.govt.nz | da chiedere |
| University of Toronto, Fisher (`toronto`) | non dichiarata | collections.library.utoronto.ca | da chiedere |
| Memòria Digital de Catalunya (`mdc`) | non dichiarata (le schede permettono la copia per studio con citazione) | mdc.csuc.cat | da chiedere |
| Universitat de Barcelona (`ub`) | non dichiarata (immagini in pubblico dominio) | bipadi.ub.edu | da chiedere |
| American University in Cairo (`auc`) | non dichiarata | digitalcollections.aucegypt.edu | da chiedere |
| Real Biblioteca ed El Escorial (`realbiblioteca`) | non dichiarata | rbdigital.realbiblioteca.es | da chiedere |
| Universidad Complutense (`ucm`) | non dichiarata (immagini CC BY 4.0) | https://biblioguias.ucm.es/pdc/informacion_practica | da chiedere |
| Universidad de Sevilla (`sevilla`) | non dichiarata (copie su Internet Archive) | archive.org | da chiedere |
| Real Academia de la Historia (`rah`) | non dichiarata | bibliotecadigital.rah.es | da chiedere |
| Biblioteca Nacional de Chile (`bnchile`) | non dichiarata | memoriachilena.gob.cl | da chiedere |
| Biblioteca Nacional de Venezuela (`bnv`) | CC BY-SA 3.0 Venezuela (licenza del sito) | bibliotecadigital.bnv.gob.ve (riportata in `scripts/fonti/latam_pdf.mjs`) | va ridistribuita alle stesse condizioni |
| Università di Atene, Pergamos (`pergamos`) | non dichiarata (immagini CC BY-NC 4.0) | pergamos.lib.uoa.gr | da chiedere |
| Monastero di Rousanou (`rousanou`) | CC0 per i metadati mostrati da SearchCulture.gr, da cui leggiamo l'elenco | https://www.searchculture.gr/aggregator/portal/license?language=en | si può chiudere |
| Northwestern University (`northwestern`) | non dichiarata | api.dc.library.northwestern.edu | da chiedere |
| National Library of Israel (`nli`) | CC0 per i metadati pubblicati in Europeana, da cui leggiamo l'elenco; Ktiv non dichiara una licenza per le schede | https://creativecommons.org/2011/09/22/europeana-adopts-new-data-exchange-agreement-all-metadata-to-be-published-under-cc0/ e https://www.nli.org.il/en/discover/manuscripts/hebrew-manuscripts/faq | si può chiudere (per la parte presa da Europeana) |
| J. Paul Getty Museum (`getty`) | CC0, salvo descrizioni e biografie con diritti di terzi | https://data.getty.edu/museum/collection/docs/ | si può chiudere |
| Biblioteca Nazionale di Sofia (`nbkm`) | non dichiarata | digilib.nationallibrary.bg | da chiedere |
| Matica srpska (`bms`) | non dichiarata | digital.bms.rs | da chiedere |
| Biblioteca Statale Russa, lib-fond.ru (`libfond`) | non dichiarata | lib-fond.ru | da chiedere |
| Internet Archive (`archive`) | non dichiarata (i metadati li scrive chi carica; nessuna licenza generale) | https://archive.org/developers/metadata-schema/ | da chiedere |
| CrossAsia, manoscritti del Laos e della Thailandia del Nord (`crossasia`) | CC BY-NC 4.0 («Images and metadata are made available ... (CC BY-NC 4.0)») | https://iiif.crossasia.org/s/dllm/manifests/21566 | solo uso non commerciale |
| Staatsbibliothek zu Berlin, Asia orientale (`sbbasia`) | CC0 (come `berlino`) | https://lab.sbb.berlin/bibliographic-data-from-stabikat/?lang=en | si può chiudere |
| Staatsbibliothek zu Berlin, manoscritti non europei (`sbbor`) | CC0 (come `berlino`) | come sopra | si può chiudere |
| Vietnamese Nôm Preservation Foundation (`nomfoundation`) | non dichiarata | lib.nomfoundation.org | da chiedere |
| Nasjonalbiblioteket (`nb`) | CC0 per i record bibliografici della biblioteca | https://doc.aja.bs.no/hente/bibliografiske-data/mlnb.html | si può chiudere |
| manuscripta.se (`manuscripta`) | non dichiarata (immagini in pubblico dominio) | manuscripta.se | da chiedere |
| Bibliothèque nationale du Luxembourg (`bnl`) | non dichiarata | eluxemburgensia.lu | da chiedere |
| Iraqi Jewish Archive, NARA (`ija`) | pubblico dominio: opere del governo federale degli Stati Uniti (17 U.S.C. § 105) | legge statunitense | si può chiudere |
| Stampe antiche (`stampe`) | mista: BSB e Heidelberg CC0, Gallica Licence Ouverte, Cambridge CC BY-NC, Bodleian e Internet Archive non dichiarata, Vaticana riservata | righe delle singole biblioteche in questa tabella | secondo la biblioteca d'origine |
| Epigrafi (`epigrafi`): Epigraphic Database Heidelberg (id «ep-edh-…») | CC BY-SA 4.0, anche per i testi trascritti («all data of the Open Data Repository ... can be reused under the CC BY-SA 4.0 licence») | https://edh.ub.uni-heidelberg.de/data | va ridistribuita alle stesse condizioni: resta fuori dal blocco chiuso, come i codici del Venezuela |
| Epigrafi (`epigrafi`): The Metropolitan Museum of Art (id «ep-met-…») | CC0 (Open Access: dati e immagini in pubblico dominio) | https://metmuseum.github.io/ e https://www.metmuseum.org/policies/image-resources | si può chiudere |
| Epigrafi (`epigrafi`): Wikidata (id «ep-wd-…») | CC0 (le immagini di Wikimedia Commons hanno la licenza di ogni file, scritta nella scheda) | https://www.wikidata.org/wiki/Wikidata:Licensing | si può chiudere |
| Biblioteca Apostolica Vaticana (`vaticana`) | riservata («Neither the text nor the images may be reproduced, in any form, without the authorisation of the Vatican Library») | https://digi.vatlib.it/ | da chiedere |
| Papiri (`papiri`, in arrivo) | schede di papyri.info: CC BY 3.0; manifesti e schede delle raccolte (Michigan, Duke, Yale, Princeton, Vienna, Colonia, Berkeley) secondo ciascuna | README di https://github.com/papyri/idp.data | si può chiudere con attribuzione per papyri.info; la licenza 3.0 vieta di imporre condizioni o misure tecniche che limitino chi riceve quelle schede |

## Cose da fare dopo questa verifica

1. Lettera di permesso (anche con l'Università di Urbino) alle fonti «da chiedere» con più codici:
   Vaticana, Manuscriptorium, Polona, lib-fond.ru, Internet Archive, Bodleian, ONB, Laurenziana e le biblioteche del
   Handschriftenportal.
2. Manchester: chiedere il permesso esplicito, perché le condizioni vietano l'estrazione sistematica.
3. Nelle condizioni d'uso del sito: elenco delle fonti con licenza di attribuzione (Digital Scriptorium, Gallica, NDL,
   papyri.info) e richiamo a questo documento.
4. Rifare la verifica quando entra una fonte nuova: aggiungere una riga a questa tabella.
