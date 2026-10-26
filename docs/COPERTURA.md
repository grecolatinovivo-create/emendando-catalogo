# Copertura del catalogo nel mondo

Questo documento dice, nazione per nazione, che cosa c'è nel catalogo e che cosa manca.

È un censimento fatto il 26 ottobre 2026. I numeri dei codici vengono dal catalogo aggiornato il 2026-10-26.
Le biblioteche che mancano sono state cercate in rete, senza provare i siti uno per uno.
Dove un dato non è sicuro, è scritto: «non si sa», «stima», «da confermare» o «non verificato».

## Riepilogo

### Nazioni per stato

In tutto 196 nazioni: i 193 stati dell'ONU, la Città del Vaticano, la Palestina e Taiwan.

| Stato | Nazioni |
|---|---|
| agganciata | 26 |
| controllata, niente da agganciare | 51 |
| controllata, bloccata | 6 |
| in corso | 26 |
| non ancora controllata | 87 |
| **totale** | **196** |

Che cosa vuol dire ogni stato:

- **agganciata**: almeno una biblioteca della nazione è nel catalogo. A volte sono pochi codici arrivati da un'altra fonte: è scritto accanto.
- **controllata, niente da agganciare**: non risulta nessuna raccolta di codici digitalizzati. Per queste nazioni il controllo è stato fatto a tavolino in questo censimento.
- **controllata, bloccata**: le biblioteche principali sono state provate e non si possono leggere. Il motivo è scritto accanto.
- **in corso**: c'è un lavoro aperto oggi su quella nazione (Italia, Spagna, Portogallo, Austria per Vienna, Canada, America Latina e Centro America). Le righe di queste nazioni nel registro possono cambiare presto.
- **non ancora controllata**: nessuno ha ancora provato le sue biblioteche.

### Le 20 biblioteche mancanti da fare per prime

Tutte hanno priorità alta: molti manoscritti, IIIF aperto (secondo le fonti, non provato da noi), importanza per latino, greco o altre tradizioni.
Nessuna è già nel catalogo o nel registro delle biblioteche (docs/BIBLIOTECHE.md).

| N. | Biblioteca | Nazione | Indirizzo | Manoscritti digitalizzati |
|---|---|---|---|---|
| 1 | BVMM, Bibliothèque virtuelle des manuscrits médiévaux (IRHT-CNRS) | Francia | bvmm.irht.cnrs.fr | oltre 10.000 (stima) |
| 2 | Manuscriptorium | Repubblica Ceca | www.manuscriptorium.com | decine di migliaia di documenti (stima) |
| 3 | Polona | Polonia | polona.pl | alcune migliaia |
| 4 | Parker Library on the Web | Regno Unito | parker.stanford.edu | circa 560 |
| 5 | Chester Beatty | Irlanda | viewer.cbl.ie | alcune migliaia |
| 6 | Manchester Digital Collections (John Rylands) | Regno Unito | www.digitalcollections.manchester.ac.uk | alcune migliaia |
| 7 | KBR, Biblioteca reale del Belgio | Belgio | belgica.kbr.be | alcune migliaia (stima) |
| 8 | SLUB Dresda | Germania | digital.slub-dresden.de | alcune migliaia |
| 9 | Wellcome Collection | Regno Unito | wellcomecollection.org/collections | alcune migliaia |
| 10 | Trinity College Dublin | Irlanda | digitalcollections.tcd.ie | alcune centinaia |
| 11 | Universitätsbibliothek Frankfurt am Main | Germania | sammlungen.ub.uni-frankfurt.de | alcune migliaia |
| 12 | handrit.is (Reykjavík e Copenaghen) | Islanda e Danimarca | handrit.is | alcune migliaia |
| 13 | Alvin (Uppsala, Lund e altre) | Svezia | www.alvin-portal.org | alcune migliaia |
| 14 | University of Michigan Library | Stati Uniti | quod.lib.umich.edu | oltre 1000 |
| 15 | Durham, cattedrale e università | Regno Unito | iiif.durham.ac.uk | alcune centinaia |
| 16 | National Library of Wales | Regno Unito | www.library.wales | alcune centinaia |
| 17 | Buddhist Digital Resource Center (BDRC) | Stati Uniti (testi del Tibet e dell'Himalaya) | library.bdrc.io | alcune migliaia di manoscritti |
| 18 | Universitätsbibliothek Tübingen | Germania | idb.ub.uni-tuebingen.de | alcune centinaia |
| 19 | ULB Darmstadt | Germania | tudigit.ulb.tu-darmstadt.de | oltre 1000 (stima) |
| 20 | National Library of Scotland | Regno Unito | digital.nls.uk | alcune centinaia |

Aggiornamento del 26 ottobre 2026 (Regno Unito e Irlanda, corsia `raccolta-uk.yml`): agganciate Chester Beatty (n. 5), Manchester (n. 6) e Wellcome (n. 9); Trinity College Dublin (n. 10) non si può (CAPTCHA), ma i suoi codici irlandesi entrano tramite Irish Script on Screen; Durham (n. 15) non si può (il robots.txt vieta tutto); National Library of Wales (n. 16) e National Library of Scotland (n. 20) non si possono per ora (Cloudflare; i codici gaelici della NLS entrano tramite ISOS); Parker (n. 4) non si può per ora (verifica anti-robot). Agganciate anche Cambridge Digital Library (dal server) e Irish Script on Screen (con la Royal Irish Academy). Dettagli in docs/BIBLIOTECHE.md.

Aggiornamento del 26 ottobre 2026 (America Latina, siti solo PDF): agganciati Cile (Biblioteca Nacional de Chile, 10 codici: 5 segnati in pubblico dominio da Memoria Chilena, 5 in pubblico dominio per età) e Venezuela (Biblioteca Nacional de Venezuela, 3 codici, CC BY-SA 3.0 VE). Le biblioteche pubblicano solo PDF: le pagine sono state estratte come JPEG nel ramo «immagini» del repository e i manifesti li scrive il catalogo (fonti «bnchile» e «bnv»). Brasile (Biblioteca Nacional e Brasiliana USP) resta fuori: sito irraggiungibile o ripubblicazione vietata.

Aggiornamento del 26 ottobre 2026 (Sud Italia, isole e Grecia): agganciate in Grecia l'Università di Atene (Pergamos, 39 codici, manifesti scritti dal catalogo) e il Monastero di Rousanou alle Meteore (38 codici, IIIF della Biblioteca di Kalambaka), nella corsia mondo. Nel Sud Italia e nelle isole nessuna biblioteca entra per ora: le copie digitali stanno in Internet Culturale (elenco lecito da Europeana, ma manifesti ICCU non raggiungibili) e sono nella lista della lettera di Urbino; Athos, Patmos e la Biblioteca del Parlamento ellenico pure.

Aggiornamento del 26 ottobre 2026 (Europa, corsia `raccolta-europa.yml`): agganciate dal Handschriftenportal Francoforte (1937 codici), Dresda (1633), Tubinga (273) e Darmstadt (241); handrit.is (3822 codici di Reykjavík e Copenaghen); Polona (13.945 manoscritti di biblioteche polacche); Manuscriptorium (15.169 manoscritti: Repubblica Ceca, Portogallo, Finlandia, Polonia, Romania, Spagna e altre). Nazioni passate ad «agganciata»: Danimarca, Islanda, Repubblica Ceca, Finlandia, Lituania; Svezia «controllata, bloccata» (Alvin). Non entrate (lettera di Urbino): BVMM (non raggiungibile), KBR, Alvin, University of Michigan, BDRC.

Restano fuori da questa lista perché sono già nel registro: Cambridge Digital Library (in lavorazione), British Library (bloccata), Det Kongelige Bibliotek, Koninklijke Bibliotheek, Uppsala e Biblioteka Jagiellońska (da verificare), Qatar Digital Library e National Library of Israel (bloccate).

## Come leggere le tabelle

Per ogni area ci sono due tabelle.

La prima tabella elenca le nazioni. Le colonne sono:

- **Stato**: uno dei cinque stati del riepilogo.
- **Nel catalogo**: le biblioteche della nazione già nel catalogo, con il numero dei codici. Per le nazioni con molte biblioteche ci sono le sei più grandi e il totale.
- **Provate e non entrate**: biblioteche già provate, con il motivo. Vengono dal registro delle biblioteche (docs/BIBLIOTECHE.md).
- **Biblioteche che mancano**: i nomi in breve. I dettagli sono nella seconda tabella della stessa area.

La seconda tabella dà i dettagli delle biblioteche che mancano. Le colonne sono:

- **IIIF**: «sì», «no» o «non si sa», secondo quanto risulta dalle fonti.
- **Manoscritti digitalizzati**: l'ordine di grandezza, se è noto.
- **Priorità**: alta, media o bassa. Alta vuol dire: molti manoscritti, IIIF aperto, importanza per latino, greco e altre tradizioni.

## Europa occidentale

Francia, Benelux, isole britanniche, Germania, Austria, Svizzera e piccoli stati vicini.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Francia | agganciata | Bibliothèque nationale de France, Paris: 76.280; Bibliothèque de l'Arsenal (BnF), Paris: 1.406; Montpellier Méditerranée Métropole - Médiathèque centrale Emile Zola: 978; Bibliothèque Carré d'art / Nîmes: 940; Bibliothèque nationale et universitaire de Strasbourg: 724; Bibliothèque municipale de Rouen: 639; altre 104 biblioteche: 3.228. **Totale: 84.195 codici** | Sorbona: papiri fuori (immagini non più in rete). BVMM: non raggiungibile il 26 ottobre 2026 (né dal server né dal browser), da riprovare. | BVMM, Lione, Mazarine, BIU Santé |
| Belgio | non ancora controllata | nessuna | KBR: niente IIIF (visore AJAX-ZOOM su un dominio che il robots.txt chiude a tutti; prova del 26 ottobre 2026). | Gand, Lovanio, Flandrica |
| Paesi Bassi | agganciata | Universiteitsbibliotheek Leiden: 3.586 codici | Koninklijke Bibliotheek dell'Aia: nel registro, da verificare. Leida: papiri fuori (immagini non più in rete). | Utrecht |
| Lussemburgo | non ancora controllata | nessuna | nessuna | Biblioteca nazionale (poco) |
| Monaco | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Regno Unito | agganciata | Bodleian Library, Oxford: 9.775; St John's College, Oxford: 141; Christ Church, Oxford: 72; Magdalen College, Oxford: 31; Exeter College, Oxford: 31; Jesus College, Oxford: 20; altre 18 biblioteche: 126. **Totale: 10.196 codici**. Dal 26 ottobre 2026 in lettura (corsia uk): Wellcome Collection (circa 1600), Manchester (John Rylands), Cambridge Digital Library (University Library e college), codici della NLS e della British Library tramite Irish Script on Screen | British Library: bloccata dal 2023 (riprova del 26 ottobre 2026). Parker: verifica anti-robot. Durham: robots.txt vieta tutto. National Library of Wales e National Library of Scotland: Cloudflare. International Dunhuang Programme: bloccato. Papiri della British Library e di Ossirinco: fuori. Endangered Archives Programme: da fare dal browser. | Trinity Cambridge, Edimburgo, SOAS, Lambeth, Glasgow |
| Irlanda | agganciata | Dal 26 ottobre 2026 in lettura (corsia uk): Chester Beatty, Dublino (circa 3000 oggetti da leggere, poi solo i manoscritti librari); Irish Script on Screen (circa 500 codici: Royal Irish Academy, National Library of Ireland, Trinity College Dublin, UCD, Maynooth, Cork, Galway, King's Inns, Marsh's Library e altre) | Trinity College Dublin, Digital Collections: CAPTCHA (i codici irlandesi del TCD entrano tramite ISOS). | National Library of Ireland (catalogo proprio) |
| Germania | agganciata | Bayerische Staatsbibliothek, München: 28.788; Heidelberger Papyrussammlung: 4.633; Staatsbibliothek zu Berlin: 3.296; Universitätsbibliothek Leipzig: 2.677; Universitätsbibliothek Heidelberg: 2.004; Wissenschaftliche Stadtbibliothek Mainz: 618; altre 178 biblioteche: 982. **Totale: 42.998 codici** | Wolfenbüttel, Karlsruhe, Stoccarda: sospese (server non raggiungibili). Treviri: niente IIIF. Papiri di Berlino: fuori (serve un permesso). Papiri di Colonia: in attesa di decisione. Dal 26 ottobre 2026 entrano dal Handschriftenportal (corsia europa) Francoforte (1937 codici), Dresda (1633), Tubinga (273) e Darmstadt (241, con le copie dei manifesti scritte dal catalogo): i numeri qui accanto si aggiornano al prossimo censimento. | Gottinga, Kassel, Düsseldorf, Friburgo, Würzburg, Fulda, Amburgo, Halle |
| Austria | in corso | Österreichische Nationalbibliothek, Wien: 2.708 (2.705 dalla fonte «onb», agganciata il 26 ottobre 2026, più 3 da altre fonti); Österreichisches Staatsarchiv, Wien: 1; Tiroler Landesmuseum Ferdinandeum, Innsbruck: 1; Stiftsbibliothek St. Paul im Lavanttal, St. Paul in Kärnten: 1. **Totale: 2.711 codici** | Österreichische Nationalbibliothek: elenco da ÖNB Digital e manifesti IIIF 3 di api.onb.ac.at, letti a riprese nella corsia giornaliera (3.200 candidati su 6.394 letti il 26 ottobre 2026). Papiri di Vienna: da provare. | Le vede il lavoro in corso. |
| Svizzera | agganciata | Stiftsbibliothek, St. Gallen: 956; Universitätsbibliothek, Basel: 305; Fondation Martin Bodmer, Cologny: 180; Bibliothèque cantonale jurassienne, Porrentruy: 121; Bibliothèque de Genève: 108; Stiftsbibliothek, Einsiedeln: 79; altre 78 biblioteche: 972. **Totale: 2.721 codici** | Ginevra: papiri fuori. | Nessuna di rilievo: e-codices raccoglie già le biblioteche svizzere. |
| Liechtenstein | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Francia | BVMM, Bibliothèque virtuelle des manuscrits médiévaux (IRHT-CNRS): codici delle biblioteche municipali francesi | bvmm.irht.cnrs.fr | sì (sito non raggiungibile il 26 ottobre 2026) | oltre 10.000 (stima) | alta |
| Francia | Numelyo, Bibliothèque municipale de Lyon | numelyo.bm-lyon.fr | sì | alcune centinaia | media |
| Francia | Bibliothèque Mazarine (Mazarinum) | mazarinum.bibliotheque-mazarine.fr | sì (da confermare) | alcune centinaia | media |
| Francia | BIU Santé, Medica (manoscritti di medicina) | www.biusante.parisdescartes.fr | non si sa | alcune centinaia | bassa |
| Belgio | Biblioteca dell'Università di Gand (Liber Floridus e altri) | lib.ugent.be | sì | alcune centinaia | media |
| Belgio | KU Leuven, collezioni digitali | bib.kuleuven.be | sì (da confermare) | alcune centinaia | media |
| Belgio | Flandrica (biblioteche storiche delle Fiandre, con Bruges) | www.flandrica.be | non si sa | alcune centinaia | bassa |
| Paesi Bassi | Biblioteca dell'Università di Utrecht (Salterio di Utrecht e altri) | objects.library.uu.nl | sì | alcune centinaia | media |
| Lussemburgo | Bibliothèque nationale du Luxembourg | eluxemburgensia.lu | non si sa | poche decine | bassa |
| Regno Unito | Parker Library on the Web (Corpus Christi College, Cambridge) | parker.stanford.edu | sì, ma elenco dietro verifica anti-robot (26 ottobre 2026) | circa 560 | alta |
| Regno Unito | Durham: biblioteca della cattedrale e dell'università (Durham Priory Library Recreated) | iiif.durham.ac.uk | sì, ma il robots.txt vieta tutto (26 ottobre 2026) | alcune centinaia | alta |
| Regno Unito | National Library of Wales (Peniarth, Libro nero di Carmarthen e altri) | www.library.wales | sì, ma elenco dietro Cloudflare (26 ottobre 2026) | alcune centinaia | alta |
| Regno Unito | National Library of Scotland | digital.nls.uk | sì, ma siti dietro Cloudflare e AWS WAF (26 ottobre 2026); i gaelici entrano tramite ISOS | alcune centinaia | alta |
| Regno Unito | Trinity College, Cambridge (Wren Library) | mss-cat.trin.cam.ac.uk | non si sa | oltre 1000 (stima) | media |
| Regno Unito | Università di Edimburgo (anche arabi e persiani) | collections.ed.ac.uk | sì | alcune centinaia | media |
| Regno Unito | SOAS, Università di Londra (Asia e Africa) | digital.soas.ac.uk | sì | alcune centinaia | media |
| Regno Unito | Lambeth Palace Library | www.lambethpalacelibrary.org | non si sa | poche decine | bassa |
| Regno Unito | Università di Glasgow (manoscritti Hunter) | www.gla.ac.uk/collections | non si sa | decine | bassa |
| Irlanda | Trinity College Dublin (Libro di Kells, Libro di Durrow, Libro di Armagh) | digitalcollections.tcd.ie | sì, ma il sito chiede un CAPTCHA (26 ottobre 2026); i codici irlandesi entrano tramite ISOS | alcune centinaia | alta |
| Irlanda | National Library of Ireland | catalogue.nli.ie | non si sa | alcune centinaia | bassa |
| Germania | SUB Göttingen | gdz.sub.uni-goettingen.de | sì | alcune centinaia | media |
| Germania | Universitätsbibliothek Kassel (ORKA) | orka.bibliothek.uni-kassel.de | sì | alcune centinaia | media |
| Germania | ULB Düsseldorf (codici di Essen e altri) | digital.ub.hhu.de | sì | alcune centinaia | media |
| Germania | Universitätsbibliothek Freiburg | dl.ub.uni-freiburg.de | sì | alcune centinaia | media |
| Germania | Universitätsbibliothek Würzburg (Franconica) | franconica.uni-wuerzburg.de | sì (da confermare) | alcune centinaia | media |
| Germania | Hochschul- und Landesbibliothek Fulda | fuldig.hs-fulda.de | sì | alcune centinaia | media |
| Germania | SUB Hamburg (anche orientali) | digitalisate.sub.uni-hamburg.de | sì | alcune centinaia | media |
| Germania | ULB Sachsen-Anhalt, Halle | digitale.bibliothek.uni-halle.de | sì | alcune centinaia | bassa |

## Europa meridionale

Italia, Vaticano, penisola iberica, Grecia, Cipro, Malta e piccoli stati.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Italia | in corso | Biblioteca Medicea Laurenziana, Firenze: 4.353; Veneranda Biblioteca Ambrosiana, Milano: 1.116; Biblioteca Universitaria di Bologna: 907; Biblioteca statale del Monumento nazionale di Montecassino, Montecassino (Cassino): 210; Biblioteca Nazionale Centrale di Firenze (copie su Internet Archive): 1.124; Biblioteca Malatestiana, Cesena: 353 (lettura in corso, 429 codici); Biblioteca Classense, Ravenna: 24; Biblioteca Vallicelliana, Roma: 17; Biblioteca Casanatense, Roma: 43; American Academy in Rome, Roma: 2; un'altra biblioteca: 1. **Totale: 8.150 codici** | Molte biblioteche provate il 25 e 26 ottobre 2026. Agganciate il 26 ottobre: Nazionale Centrale di Firenze, Vallicelliana, Malatestiana, Classense. Bloccate o non pronte: Internet Culturale (elenco vietato dal robots.txt), Marciana, Estense, Nazionali di Roma (teca solo in http) e Napoli (teca instabile), Padova, Riccardiana, Siena, Archiginnasio, BEIC, Trivulziana (ricerca con credenziali), Capitolare di Verona, Oliveriana, Palatina, Pavia, Genova, Phaidra di Padova, Urbino. Papiri di Ercolano e PSI: fuori. Sud Italia e isole (Grottaferrata, Cava, Girolamini, Società Napoletana di Storia Patria, Messina, Palermo, Catania, Bari, Lecce, Rossano, Cagliari, Sassari, Benevento, Montevergine), prova del 26 ottobre 2026: nessuna entra (copie solo in Internet Culturale, manifesti ICCU non raggiungibili; Messina ha un solo foglio per codice); vedi docs/BIBLIOTECHE.md, «Sud Italia e isole». | Le vede il lavoro in corso. |
| Città del Vaticano | agganciata | Biblioteca Apostolica Vaticana, Città del Vaticano: 8.882; Biblioteca Apostolica Vaticana, Vatikan: 1. **Totale: 8.883 codici** | nessuna | Nessuna: la Vaticana è dentro (lettura ancora in corso). |
| San Marino | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Malta | non ancora controllata | nessuna | nessuna | Biblioteca nazionale e archivi della cattedrale di Mdina (copie in vHMML, che è bloccato) |
| Spagna | in corso | nessuna | Biblioteca Nacional de España ed Escorial: nel registro, da verificare. | Le vede il lavoro in corso. |
| Portogallo | in corso | Dal 26 ottobre 2026 Biblioteca Nacional de Portugal, Lisbona, tramite Manuscriptorium: 5623 codici (corsia europa) | nessuna | Le vede il lavoro in corso. |
| Andorra | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Grecia | agganciata | Biblioteca Nazionale di Grecia, Atene: 765 codici; dal 26 ottobre 2026 Università di Atene (Pergamos): 39 codici; Monastero di Rousanou, Meteore (Biblioteca di Kalambaka): 38 codici | Athos (portale dietro Cloudflare; Vatopedi solo libri a stampa), Patmos (foto non pubblicate), Accademia di Atene (solo lettere e PDF), Veria (server giù), altre collezioni di SearchCulture (documenti): vedi docs/BIBLIOTECHE.md, «Grecia e monasteri greci». | Biblioteca del Parlamento (repository non pubblico), Università di Salonicco, Leimonos, Kaireios di Andros |
| Cipro | non ancora controllata | nessuna | nessuna | Fondazione culturale della Banca di Cipro, monastero di Kykkos (poco) |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Malta | National Library of Malta e Archivi della cattedrale di Mdina (copie in vHMML) | www.vhmml.org | — | alcune centinaia | bassa |
| Grecia | Biblioteca del Parlamento ellenico, manoscritti (circa 600 codici digitalizzati, repository non pubblico: lettera di Urbino) | www.hellenicparliament.gr | non si sa | alcune centinaia | bassa |
| Grecia | Biblioteca pubblica di Veria (Medusa): manifesti IIIF Iguana con CORS, CC BY 4.0; server giù il 26 ottobre 2026 | medusa.libver.gr | sì | 31 «χειρόγραφα» (molte carte sciolte) | bassa |
| Grecia | Università Aristotele di Salonicco, biblioteca digitale | digital.lib.auth.gr | non si sa | decine | bassa |
| Cipro | Fondazione culturale della Banca di Cipro; monastero di Kykkos | non trovato | non si sa | poche decine | bassa |

## Europa del Nord

Scandinavia, Islanda, Finlandia e paesi baltici.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Danimarca | agganciata | Den Arnamagnæanske Samling, Copenaghen, tramite handrit.is (dal 26 ottobre 2026; il numero si aggiorna al prossimo censimento) | Det Kongelige Bibliotek: nel registro, da verificare. | Det Kongelige Bibliotek |
| Svezia | controllata, bloccata | nessuna | Alvin (Uppsala, Lund, Linköping, Göteborg e altre): niente IIIF pubblico, immagini solo come miniature o TIFF, visore dietro una verifica anti-robot (26 ottobre 2026). Papiri di Lund: fuori. | Kungliga biblioteket |
| Norvegia | non ancora controllata | nessuna | nessuna | Nasjonalbiblioteket |
| Finlandia | agganciata | Dal 26 ottobre 2026 Fragmenta membranea della Biblioteca nazionale di Finlandia, Helsinki, tramite Manuscriptorium: 1617 frammenti di codici (corsia europa) | nessuna | nessuna di rilievo |
| Islanda | agganciata | Landsbókasafn Íslands e Stofnun Árna Magnússonar, Reykjavík, tramite handrit.is (dal 26 ottobre 2026: 3822 codici con Copenaghen; manifesti scritti dal catalogo) | Il sito handrit.is non si legge (verifica anti-robot): si usano le descrizioni TEI pubblicate su GitHub. | nessuna |
| Estonia | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Lettonia | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Lituania | agganciata | Dal 26 ottobre 2026 Biblioteca Wróblewski dell'Accademia delle scienze, Vilnius, tramite Manuscriptorium: 53 codici | Manuscriptorium: Biblioteca universitaria di Vilnius e reparto dei manoscritti della Biblioteca nazionale fuori (carte d'archivio e ritratti a stampa). | epaveldas.lt |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Svezia | Alvin: Uppsala, Lund, Linköping, Göteborg e altre (Codex Argenteus, codici greci) | www.alvin-portal.org | no (provata il 26 ottobre 2026: niente IIIF pubblico) | alcune migliaia | alta |
| Svezia | Kungliga biblioteket, Stoccolma (Codex Gigas) | www.kb.se | non si sa | decine | media |
| Norvegia | Nasjonalbiblioteket (alcune copie visibili solo dalla Norvegia) | www.nb.no | sì | alcune centinaia | media |
| Lituania | epaveldas.lt (lituano, polacco, ruteno) | www.epaveldas.lt | non si sa | alcune centinaia | bassa |

## Europa centrale e orientale

Polonia, Cechia, Slovacchia, Ungheria, Romania, Bulgaria, Moldavia, Ucraina, Bielorussia, Russia.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Polonia | agganciata | Jagiellonian Library, Krakow: 2 codici (pochi codici, arrivati da un'altra fonte). Dal 26 ottobre 2026 Polona: 13.945 manoscritti (Biblioteka Narodowa 7274, Biblioteka Jagiellońska 4772 e altre biblioteche polacche); dal 26 ottobre 2026 anche le biblioteche universitarie di Breslavia e Toruń tramite Manuscriptorium | Polona: fuori i documenti protetti dal diritto d'autore e quelli con licenza non aperta. | nessuna di rilievo |
| Repubblica Ceca | agganciata | Dal 26 ottobre 2026 Manuscriptorium (corsia europa): 6352 codici di biblioteche ceche (Národní knihovna, Strahov, Museo nazionale, Moravská zemská knihovna, Olomouc, Plzeň e altre) | Manuscriptorium: fuori gli stampati, le carte geografiche, le lettere e le copie di biblioteche già nel catalogo. | nessuna di rilievo |
| Slovacchia | non ancora controllata | nessuna | nessuna | Slovakiana |
| Ungheria | non ancora controllata | nessuna | nessuna | Bibliotheca Corvina Virtualis, Hungaricana |
| Romania | non ancora controllata | nessuna | nessuna | Biblioteca dell'Accademia Romena (biblioteca digitale non trovata) |
| Bulgaria | non ancora controllata | nessuna | nessuna | Biblioteca nazionale Santi Cirillo e Metodio |
| Moldavia | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Ucraina | non ancora controllata | nessuna | nessuna | Biblioteca nazionale Vernadsky |
| Bielorussia | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Russia | agganciata | National Library of Russia, St. Petersburg: 1; Museen der Stadt Jurjewetz (Юрьевец: 1. **Totale: 2 codici** (pochi codici, arrivati da un'altra fonte) | Biblioteca nazionale russa e Biblioteca statale russa: bloccate (la prima non risponde, la seconda vieta tutto nel robots.txt). | Le altre biblioteche russe (Accademia delle Scienze, Museo storico) non sono state provate: probabile lo stesso blocco. |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Slovacchia | Slovakiana | www.slovakiana.sk | non si sa | alcune centinaia | bassa |
| Ungheria | Bibliotheca Corvina Virtualis (Biblioteca nazionale Széchényi): i codici di Mattia Corvino | corvina.hu | non si sa | circa 200 (stima) | media |
| Ungheria | Hungaricana (archivi, biblioteche e musei ungheresi) | hungaricana.hu | non si sa | molti documenti, pochi codici | bassa |
| Romania | Biblioteca dell'Accademia Romena (manoscritti slavi, greci, romeni) | non trovato | non si sa | non si sa | bassa |
| Bulgaria | Biblioteca nazionale Santi Cirillo e Metodio (manoscritti slavi) | digilib.nationallibrary.bg | non si sa | alcune centinaia | media |
| Ucraina | Biblioteca nazionale Vernadsky | www.nbuv.gov.ua | non si sa | alcune centinaia | bassa |

## Balcani

Ex Jugoslavia e Albania.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Slovenia | non ancora controllata | nessuna | nessuna | dLib.si |
| Croazia | non ancora controllata | nessuna | nessuna | Biblioteca nazionale e universitaria di Zagabria |
| Bosnia ed Erzegovina | non ancora controllata | nessuna | nessuna | Biblioteca Gazi Husrev-beg |
| Serbia | non ancora controllata | nessuna | nessuna | Biblioteca nazionale di Serbia |
| Montenegro | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Macedonia del Nord | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Albania | non ancora controllata | nessuna | nessuna | Archivio centrale dello Stato (Codici di Berat): poco |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Slovenia | dLib.si, Biblioteca nazionale e universitaria | www.dlib.si | non si sa | alcune centinaia | bassa |
| Croazia | Biblioteca nazionale e universitaria di Zagabria, collezioni digitali (glagolitici, latini) | digitalna.nsk.hr | non si sa | alcune centinaia | media |
| Bosnia ed Erzegovina | Biblioteca Gazi Husrev-beg, Sarajevo (arabi, turchi, persiani; in rete solo in parte) | www.ghb.ba | non si sa | non si sa | bassa |
| Serbia | Biblioteca nazionale di Serbia, biblioteca digitale (manoscritti slavi) | digitalna.nb.rs | non si sa | alcune centinaia | media |
| Albania | Archivio centrale dello Stato (Codex Purpureus Beratinus e altri) | non trovato | non si sa | poche decine | bassa |

## Medio Oriente e Caucaso

Turchia, Caucaso, Iran, paesi arabi del Vicino Oriente e del Golfo, Israele e Palestina.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Turchia | controllata, bloccata | nessuna | Yazma Eserler Kurumu (Süleymaniye) e Università di Istanbul: non rispondono. | Nessuna in più: i fondi turchi passano da Yazma Eserler. |
| Armenia | non ancora controllata | nessuna | nessuna | Matenadaran |
| Georgia | non ancora controllata | nessuna | nessuna | Centro nazionale dei manoscritti |
| Azerbaigian | non ancora controllata | nessuna | nessuna | Istituto dei manoscritti (biblioteca digitale non trovata) |
| Iran | controllata, bloccata | nessuna | Biblioteca nazionale dell'Iran: non risponde. | Biblioteca del Parlamento (Majlis), Astan Quds Razavi |
| Iraq | non ancora controllata | nessuna | vHMML (fondi dell'Iraq): bloccato da robots.txt e condizioni d'uso. | Nessuna in più nota. |
| Siria | non ancora controllata | nessuna | vHMML (fondi della Siria): bloccato. | Nessuna in più nota. |
| Libano | agganciata | Bibliothèque Orientale de l'Université Saint-Joseph de Beyrouth: 4 codici (pochi codici, arrivati da un'altra fonte) | vHMML (fondi del Libano): bloccato. | American University of Beirut; Bibliothèque Orientale dell'Université Saint-Joseph (sito proprio) |
| Israele | agganciata | Patriarcato greco-ortodosso di Gerusalemme (microfilm della Library of Congress): 971; Patriarcato armeno di Gerusalemme (microfilm della Library of Congress): 31. **Totale: 1.002 codici** (microfilm della Library of Congress) | National Library of Israel (Ktiv): bloccata dal server, instabile dal browser. | Nessuna in più: la NLI raccoglie già quasi tutto. |
| Palestina | non ancora controllata | nessuna | nessuna | Biblioteca della moschea al-Aqsa (non trovata in rete) |
| Giordania | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Arabia Saudita | non ancora controllata | nessuna | nessuna | Università Re Saud |
| Yemen | non ancora controllata | nessuna | nessuna | Yemen Manuscript Digitization Initiative (copie a Princeton e in vHMML) |
| Oman | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Emirati Arabi Uniti | non ancora controllata | nessuna | nessuna | Centro Juma Al Majid |
| Qatar | controllata, bloccata | nessuna | Qatar Digital Library: verifica anti-robot di Cloudflare. | Nessuna in più. |
| Bahrein | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Kuwait | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Armenia | Matenadaran, Erevan (nuovo portale di tutti i manoscritti armeni annunciato per il 2026) | matenadaran.am | non si sa | il fondo ha circa 23.000 manoscritti; in rete non si sa quanti | media |
| Georgia | Centro nazionale dei manoscritti Korneli Kekelidze, Tbilisi | manuscript.ge (non verificato) | non si sa | non si sa | media |
| Azerbaigian | Istituto dei manoscritti Fuzuli, Baku | non trovato | non si sa | non si sa | bassa |
| Iran | Biblioteca del Parlamento (Majlis), Teheran | dlib.ical.ir | non si sa | alcune migliaia (stima) | media |
| Iran | Biblioteca di Astan Quds Razavi, Mashhad | non trovato | non si sa | non si sa | bassa |
| Libano | American University of Beirut, manoscritti arabi | libraries.aub.edu.lb | non si sa | alcune centinaia | media |
| Libano | Bibliothèque Orientale, Université Saint-Joseph (oggi solo 4 codici nel catalogo, arrivati da Gallica) | www.bibliothequeorientale.usj.edu.lb | non si sa | alcune centinaia | media |
| Palestina | Biblioteca della moschea al-Aqsa, Gerusalemme | non trovato | non si sa | non si sa | bassa |
| Arabia Saudita | Università Re Saud, Riad: manoscritti arabi | makhtota.ksu.edu.sa | non si sa | alcune migliaia (stima) | media |
| Yemen | Yemen Manuscript Digitization Initiative (copie a Princeton e in vHMML) | non verificato | non si sa | alcune centinaia | bassa |
| Emirati Arabi Uniti | Centro Juma Al Majid per la cultura e il patrimonio, Dubai | www.almajidcenter.org | non si sa | molte copie di manoscritti arabi; numero non noto | bassa |

## Africa settentrionale

Egitto, Maghreb e Sudan.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Egitto | agganciata | Monastero di Santa Caterina del Sinai (microfilm della Library of Congress), Sinai (Egitto): 1.668 codici (microfilm della Library of Congress) | Bibliotheca Alexandrina: non risponde dal server. | Dar al-Kutub, Biblioteca di al-Azhar |
| Libia | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Tunisia | non ancora controllata | nessuna | nessuna | Biblioteca nazionale di Tunisia (non verificata) |
| Algeria | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Marocco | non ancora controllata | nessuna | nessuna | Biblioteca nazionale del Regno del Marocco |
| Sudan | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Egitto | Dar al-Kutub, Il Cairo (Biblioteca e archivi nazionali) | non trovato: nessuna biblioteca digitale aperta nota | non si sa | il fondo ha decine di migliaia di manoscritti; in rete non si sa | media |
| Egitto | Biblioteca di al-Azhar, Il Cairo (portale dei manoscritti annunciato nel 2011, oggi non verificato) | www.azhar.eg | non si sa | non si sa | bassa |
| Marocco | Bibliothèque nationale du Royaume du Maroc, biblioteca digitale | www.bnrm.ma | non si sa | alcune migliaia (stima) | media |
| Tunisia | Bibliothèque nationale de Tunisie | www.bnt.nat.tn | non si sa | non si sa | bassa |

## Africa subsahariana

Le tradizioni manoscritte sono soprattutto arabe e in ajami (Sahel, Africa orientale) ed etiopiche. Gran parte delle copie digitali è in due raccolte: l'Endangered Archives Programme della British Library e vHMML (bloccato).

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Mauritania | non ancora controllata | nessuna | nessuna | Biblioteche di Chinguetti e Ouadane (copie in progetti EAP, da cercare) |
| Mali | non ancora controllata | nessuna | vHMML (Timbuctù, SAVAMA-DCI): bloccato. | Manoscritti di Timbuctù e di Djenné |
| Nigeria | non ancora controllata | nessuna | nessuna | Arewa House e altri fondi in progetti EAP |
| Etiopia | non ancora controllata | nessuna | vHMML (Ethiopian Manuscript Microfilm Library): bloccato. | Chiese e monasteri etiopici in progetti EAP |
| Eritrea | non ancora controllata | nessuna | nessuna | Fondi in progetti EAP (da cercare) |
| Kenya | non ancora controllata | nessuna | nessuna | Manoscritti di Lamu in progetti EAP |
| Tanzania | non ancora controllata | nessuna | nessuna | Archivi di Zanzibar in progetti EAP |
| Sudafrica | non ancora controllata | nessuna | nessuna | National Library of South Africa, collezione Grey (Città del Capo) |
| Senegal | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Gambia | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Guinea | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Guinea-Bissau | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Sierra Leone | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Costa d'Avorio | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Burkina Faso | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Ghana | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Togo | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Benin | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Niger | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Ciad | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Camerun | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Gibuti | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Somalia | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Uganda | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Mozambico | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Madagascar | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Comore | non ancora controllata | nessuna | nessuna | Possibili fondi arabi o in ajami in progetti EAP (da cercare). |
| Capo Verde | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| São Tomé e Príncipe | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Guinea Equatoriale | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Gabon | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Congo | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Repubblica Democratica del Congo | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Repubblica Centrafricana | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Angola | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Namibia | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Botswana | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Lesotho | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Eswatini | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Zambia | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Zimbabwe | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Malawi | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Ruanda | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Burundi | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Liberia | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Seychelles | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Mauritius | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |
| Sud Sudan | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). Ci sono archivi d'età coloniale, non codici. |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Mali | Manoscritti di Timbuctù (Mamma Haidara e altre biblioteche): mostra di Google Arts & Culture «Mali Magic» | artsandculture.google.com | no | alcune centinaia esposti | bassa |
| Mali | Manoscritti di Djenné e di Timbuctù nei progetti dell'Endangered Archives Programme | eap.bl.uk | non si sa | alcune migliaia (stima) | media |
| Etiopia | Chiese e monasteri etiopici nei progetti dell'Endangered Archives Programme | eap.bl.uk | non si sa | alcune migliaia (stima) | media |
| Sudafrica | National Library of South Africa, collezione di Sir George Grey (codici medievali; l'altra metà della raccolta è ad Auckland, già nel catalogo) | www.nlsa.ac.za | non si sa | poche decine | bassa |

## Asia centrale e meridionale

Asia centrale, Afghanistan, subcontinente indiano.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Kazakistan | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Uzbekistan | non ancora controllata | nessuna | nessuna | Istituto di studi orientali Al-Biruni, Tashkent (biblioteca digitale non trovata) |
| Turkmenistan | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Kirghizistan | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Tagikistan | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Afghanistan | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Pakistan | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| India | agganciata | Jatindramohan Sangrahashala, National Council of Education, Bengal (copie digitali di Penn), Kolkata: 3.279 codici (copie digitali di Penn) | nessuna | Missione nazionale per i manoscritti, IGNCA, Khuda Bakhsh, Rampur Raza, Asiatic Society, BORI |
| Nepal | non ancora controllata | nessuna | nessuna | Nepal-German Manuscript Cataloguing Project; testi nepalesi e tibetani nel BDRC |
| Bhutan | non ancora controllata | nessuna | nessuna | Testi bhutanesi nel BDRC |
| Bangladesh | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Sri Lanka | non ancora controllata | nessuna | nessuna | Manoscritti su foglia di palma in progetti EAP |
| Maldive | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| India | Missione nazionale per i manoscritti, oggi Gyan Bharatam (Kritisampada) | www.namami.gov.in | no (non risulta) | centinaia di migliaia digitalizzati; in rete pochi | media |
| India | Indira Gandhi National Centre for the Arts (IGNCA), biblioteca digitale | ignca.gov.in | non si sa | alcune migliaia | media |
| India | Khuda Bakhsh Oriental Public Library, Patna (arabi, persiani) | kblibrary.bih.nic.in | non si sa | alcune migliaia (stima) | media |
| India | Rampur Raza Library | razalibrary.gov.in | non si sa | non si sa | bassa |
| India | Asiatic Society, Calcutta | asiaticsocietykolkata.org | non si sa | non si sa | bassa |
| India | Bhandarkar Oriental Research Institute, Pune | www.bori.ac.in | non si sa | non si sa | bassa |
| Nepal | Nepal-German Manuscript Cataloguing Project (catalogo; immagini non aperte) | www.ngmcp.uni-hamburg.de | no | decine di migliaia microfilmati | bassa |
| Sri Lanka | Manoscritti su foglia di palma nei progetti dell'Endangered Archives Programme | eap.bl.uk | non si sa | alcune migliaia (stima) | bassa |
| Uzbekistan | Istituto di studi orientali Al-Biruni, Tashkent | non trovato | non si sa | non si sa | bassa |

## Asia orientale

Cina, Taiwan, Giappone, Coree, Mongolia. Taiwan non è membro dell'ONU: è contata a parte perché ha biblioteche importanti.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Cina | controllata, bloccata | nessuna | Biblioteca nazionale cinese: nessun manifesto IIIF pubblico. International Dunhuang Programme: bloccato. | I testi tibetani sono nel BDRC (Stati Uniti). |
| Taiwan | controllata, bloccata | nessuna | National Palace Museum: risponde 403 ai server. | National Central Library, libri rari |
| Giappone | agganciata | National Diet Library, Tokyo: 42.872; Università di Okayama, fondo Ikeda: 14.254; Archivi e mausolei della Casa imperiale, Tokyo: 11.400; Università Tōhoku, fondo Kanō (microfilm), Sendai: 9.710; Università Tōhoku, fondo di matematica tradizionale giapponese (wasan), Sendai: 4.920; Istituto nazionale di letteratura giapponese, Tachikawa: 4.536; altre 410 biblioteche: 94.160. **Totale: 181.852 codici** | Università di Kyoto: manifesti aperti ma elenco vietato. Waseda e Università di Tokyo: bloccate. | Nessuna in più di rilievo: Kokusho raccoglie già centinaia di biblioteche. |
| Corea del Sud | agganciata | Biblioteca nazionale di Corea, Seul (Corea del Sud): 49 codici (pochi codici, arrivati da un'altra fonte) | Biblioteca nazionale coreana e Kyujanggak: nessun IIIF pubblico, Kyujanggak non risponde. | Jangseogak (Academy of Korean Studies) |
| Corea del Nord | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta accessibile (controllo a tavolino). |
| Mongolia | non ancora controllata | nessuna | nessuna | Testi mongoli e tibetani nel BDRC |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Taiwan | National Central Library, libri rari e manoscritti | rbook.ncl.edu.tw | non si sa | alcune migliaia (stima) | media |
| Corea del Sud | Jangseogak, Academy of Korean Studies | jsg.aks.ac.kr | non si sa | alcune migliaia (stima) | media |

## Sud-est asiatico

Tradizioni su foglia di palma (Thailandia, Laos, Myanmar, Cambogia), Vietnam e mondo malese.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Myanmar | non ancora controllata | nessuna | nessuna | Fondi birmani in vHMML (bloccato) |
| Thailandia | non ancora controllata | nessuna | nessuna | Digitized Lanna Manuscripts |
| Laos | non ancora controllata | nessuna | nessuna | Digital Library of Lao Manuscripts |
| Cambogia | non ancora controllata | nessuna | nessuna | Fondo per l'edizione dei manoscritti della Cambogia (FEMC) |
| Vietnam | non ancora controllata | nessuna | nessuna | Fondazione per la conservazione del Nôm |
| Malaysia | non ancora controllata | nessuna | nessuna | Biblioteca nazionale, Centro dei manoscritti malesi |
| Singapore | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Indonesia | non ancora controllata | nessuna | nessuna | Khastara (Biblioteca nazionale), DREAMSEA |
| Brunei | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Filippine | non ancora controllata | nessuna | nessuna | Nessuna nota di rilievo. |
| Timor Est | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Thailandia | Digitized Lanna Manuscripts (Thailandia del Nord, foglia di palma) | lannamanuscripts.net | no (non risulta) | alcune migliaia | media |
| Laos | Digital Library of Lao Manuscripts | www.laomanuscripts.net | no (non risulta) | alcune migliaia | media |
| Cambogia | Fonds pour l'édition des manuscrits du Cambodge (FEMC, con l'EFEO) | non verificato | non si sa | non si sa | bassa |
| Vietnam | Fondazione per la conservazione del Nôm: libri Hán-Nôm della Biblioteca nazionale del Vietnam | www.nomfoundation.org | no (non risulta) | circa 1000-2000 volumi (stima incerta) | media |
| Malaysia | Perpustakaan Negara Malaysia, Centro dei manoscritti malesi | non verificato | non si sa | non si sa | bassa |
| Indonesia | Khastara, Biblioteca nazionale dell'Indonesia | khastara.perpusnas.go.id | non si sa | alcune migliaia | media |
| Indonesia | DREAMSEA (manoscritti del Sud-est asiatico; copie anche in vHMML) | dreamsea.co | non si sa | alcune migliaia | media |

## Americhe

Stati Uniti, Canada, America Latina e Caraibi. Canada, Messico, Centro America, Caraibi di lingua spagnola e francese e America del Sud hanno lavori aperti oggi. Ho contato fra questi anche Belize, Guyana e Suriname: se il lavoro sull'America Latina non li comprende, vanno spostati fra le nazioni non ancora controllate.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Stati Uniti | agganciata | University of Pennsylvania Libraries, Kislak Center, Philadelphia: 6.882; Princeton University Library: 3.062; Beinecke Rare Book and Manuscript Library, New Haven: 2.732; University of Pennsylvania Libraries, Philadelphia: 891; Columbia University, Rare Book & Manuscript Library, New York: 835; Harvard University, Houghton Library, Cambridge (Massachusetts): 603; altre 47 biblioteche: 3.187. **Totale: 18.192 codici** | Walters: sospesa (server del museo). Morgan: Cloudflare. Getty: connessione non verificata. Lehigh e Wellesley: manifesti chiusi. UCLA (Sinai): immagini solo per utenti registrati. vHMML: vietato. Altre istituzioni di OPenn: niente IIIF. Library of Congress: entrata solo in parte. Papiri (Berkeley, Yale, Duke, Michigan, Princeton, Columbia): in attesa di decisione. | Michigan, BDRC, Notre Dame, Stanford, Folger, Hilandar (Ohio State) |
| Canada | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Messico | in corso | nessuna | Biblioteca Nacional de México: nessun IIIF pubblico, bdmx.mx non risponde. | Le vede il lavoro in corso. |
| Guatemala | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Belize | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Honduras | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| El Salvador | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Nicaragua | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Costa Rica | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Panama | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Cuba | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Haiti | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Repubblica Dominicana | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Brasile | in corso | nessuna | Biblioteca Nacional do Brasil: 403 ai server, nessun IIIF pubblico. | Le vede il lavoro in corso. |
| Argentina | in corso | nessuna | Biblioteca Nacional Mariano Moreno: non risponde. | Le vede il lavoro in corso. |
| Cile | agganciata | Biblioteca Nacional de Chile, Santiago: 10 codici (dal 26 ottobre 2026; solo PDF: pagine estratte nel ramo «immagini», manifesti scritti dal catalogo; 5 segnati in pubblico dominio da Memoria Chilena, 5 in pubblico dominio per età) | Biblioteca Nacional Digital: senza IIIF, solo PDF. Note di Medina: fuori, sono carte sciolte. Universidad de Chile: niente codici. | Archivo Nacional, Museo Histórico Nacional |
| Perù | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Bolivia | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Colombia | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Venezuela | agganciata | Biblioteca Nacional de Venezuela, Caracas: 3 codici (dal 26 ottobre 2026; solo PDF: pagine estratte nel ramo «immagini», manifesti scritti dal catalogo; CC BY-SA 3.0 VE) | Biblioteca Digital César Rengifo: senza IIIF, solo PDF; gli altri «manuscritos» sono lettere, documenti e autografi del Novecento. | Academia Nacional de la Historia, Archivo General de la Nación |
| Ecuador | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Paraguay | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Uruguay | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Guyana | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Suriname | in corso | nessuna | nessuna | Le vede il lavoro in corso. |
| Giamaica | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Bahamas | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Barbados | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Trinidad e Tobago | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Grenada | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Saint Lucia | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Saint Vincent e Grenadine | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Antigua e Barbuda | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Dominica | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Saint Kitts e Nevis | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Stati Uniti | University of Michigan Library (manoscritti islamici, greci e medievali) | quod.lib.umich.edu | sì, ma dietro la verifica di Cloudflare anche dal browser (26 ottobre 2026) | oltre 1000 | alta |
| Stati Uniti | Buddhist Digital Resource Center (BDRC): testi tibetani, mongoli, nepalesi, bhutanesi | library.bdrc.io | sì, ma il robots.txt dei server di dati e dei manifesti vieta tutto (26 ottobre 2026) | decine di migliaia di testi (molti a stampa xilografica; i manoscritti sono alcune migliaia) | alta |
| Stati Uniti | University of Notre Dame (Marble) | marble.nd.edu | sì | alcune centinaia | media |
| Stati Uniti | Stanford Libraries | searchworks.stanford.edu | sì | alcune centinaia | media |
| Stati Uniti | Folger Shakespeare Library (manoscritti inglesi di età moderna) | collections.folger.edu | non si sa | alcune migliaia | bassa |
| Stati Uniti | Ohio State University, Hilandar Research Library (microfilm di codici slavi, anche del monastero serbo di Chilandari sull'Athos) | hrl.osu.edu | non si sa | non si sa | bassa |

## Oceania

Australia, Nuova Zelanda e isole del Pacifico.

### Nazioni

| Nazione | Stato | Nel catalogo | Provate e non entrate | Biblioteche che mancano |
|---|---|---|---|---|
| Australia | agganciata | State Library Victoria, Melbourne (Australia): 14 codici | National Library of Australia (Trove): robots.txt vieta tutto. Università di Sydney e State Library of New South Wales: 403 ai server. | Università di Melbourne (Baillieu Library) |
| Nuova Zelanda | agganciata | Auckland Libraries, Sir George Grey Special Collections, Auckland (Nuova Zelanda): 43 codici | nessuna | Dunedin Public Libraries (collezione Reed), Alexander Turnbull Library |
| Papua Nuova Guinea | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Figi | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Isole Salomone | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Vanuatu | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Samoa | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Tonga | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Kiribati | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Tuvalu | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Nauru | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Micronesia | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Isole Marshall | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |
| Palau | controllata, niente da agganciare | nessuna | nessuna | Nessuna raccolta nota di codici digitalizzati (controllo a tavolino in questo censimento). |

### Biblioteche che mancano

| Nazione | Biblioteca | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità |
|---|---|---|---|---|---|
| Australia | Università di Melbourne, Baillieu Library (codici medievali) | digitised-collections.unimelb.edu.au | non si sa | poche decine | bassa |
| Nuova Zelanda | Dunedin Public Libraries, collezione Reed (codici medievali) | www.dunedinlibraries.govt.nz | non si sa | poche decine | bassa |
| Nuova Zelanda | Alexander Turnbull Library (National Library of New Zealand) | natlib.govt.nz | non si sa | poche decine | bassa |

## Aggregatori

Gli aggregatori raccolgono i manoscritti di molte biblioteche, spesso di paesi diversi.
Un solo aggregatore può coprire molte nazioni insieme.

| Aggregatore | Indirizzo | IIIF | Manoscritti digitalizzati | Priorità | Nota |
|---|---|---|---|---|---|
| British Library, Endangered Archives Programme (EAP) | eap.bl.uk | sì: manifesti IIIF 3 e immagini con CORS aperto dal browser (prova del 26 ottobre 2026); il sito respinge i server (AWS WAF) | milioni di immagini; molte raccolte di manoscritti di Africa, Asia e Medio Oriente | media | Nel registro (Regno Unito e Irlanda): da fare dal browser, con un elenco dei fascicoli dei soli progetti di manoscritti librari. Da solo copre Mali, Etiopia, Sri Lanka, Nigeria, Kenya, Tanzania e molti altri paesi. |
| Qatar Digital Library | www.qdl.qa | sì, ma dietro la verifica anti-robot di Cloudflare | decine di migliaia di documenti; alcune migliaia di manoscritti arabi (molti della British Library) | media | Già nel registro: bloccata. Da fare dal browser, come Gallica. |
| vHMML (Hill Museum & Manuscript Library) | www.vhmml.org | sì, ma vietato dal robots.txt | circa 262.000 oggetti (Siria, Iraq, Libano, Etiopia, Mali, Malta e altri) | — | Già nel registro: non si può. |
| Biblissima+ (portale francese dei manoscritti) | portail.biblissima.fr | sì | indice dei manifesti di BnF, BVMM e molte altre biblioteche | media | Non è nel registro. Utile per trovare in un colpo i manifesti delle biblioteche francesi fuori da Gallica. |
| Manuscriptorium | www.manuscriptorium.com | sì (da confermare) | decine di migliaia di documenti (soprattutto cechi, ma anche di altri paesi) | alta | Non è nel registro. |
| Handschriftenportal | handschriftenportal.de | rimanda ai manifesti delle biblioteche | tutte le biblioteche tedesche | — | Già usato per sei biblioteche tedesche. È la strada per molte biblioteche tedesche che mancano. |
| Fragmentarium | fragmentarium.ms | sì | alcune migliaia di frammenti medievali | bassa | Non è nel registro. |

## Da dove vengono i dati

- Biblioteche e codici nel catalogo: data/catalogo/indice.json (fonti, biblioteche e righe dell'indice).
- Nazione di ogni biblioteca: data/luoghi.json. Alcune biblioteche senza luogo sono state messe a mano nella loro nazione: le collezioni private giapponesi di Kokusho in Giappone, la State Library Victoria in Australia.
- Restano senza nazione pochi codici con luogo non indicato o fittizio (per esempio «Utopia» ed «sine loco» di e-codices): non sono contati.
- Biblioteche provate e non entrate: docs/BIBLIOTECHE.md.
- Biblioteche che mancano: ricerche in rete del 26 ottobre 2026 e conoscenze generali. Nessun sito è stato provato tecnicamente.
