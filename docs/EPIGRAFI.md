# Epigrafi nel catalogo di Emendando: cosa entra e cosa no

Verifica fatta il 28 ottobre 2026 dal nostro server di prova. Dal 28 ottobre 2026 le epigrafi «Dentro» si raccolgono nella corsia «epigrafi» (`.github/workflows/raccolta-epigrafi.yml`, fonte «epigrafi», `scripts/fonti/epigrafi.mjs`): nel catalogo sono il tipo «epigrafe», con totale a parte («epigrafi» in `indice.json`) e i dati epigrafici nella voce completa, in «epigrafe».

Regola, la stessa dei papiri: entra solo l'epigrafe con almeno una foto che si apre nel nostro visore, con il manifesto IIIF della fonte oppure con un manifesto scritto da noi, se la licenza delle immagini lo consente.
Niente schede senza immagine e niente schede che mandano l'utente su un altro sito.

Due esiti:

- **Dentro**: la foto si apre nel nostro visore. Si indica anche se funzionano gli strumenti (contrasto, inchiostri, luce radente virtuale).
- **Fuori**: non si può, per il motivo scritto.

Gli strumenti lavorano sui pixel, quindi funzionano solo se il server delle immagini manda l'intestazione «Access-Control-Allow-Origin» (CORS).
Senza CORS la foto si vede, ma il browser non lascia leggere i pixel.

«Da confermare dal browser» vuol dire: il sito ha respinto o chiuso le richieste del nostro server (blocco anti-robot, connessione chiusa, certificato), ma il robots.txt e le condizioni non le vietano; la prova va ripetuta da un normale browser.

## Stato reale per fonte (28 ottobre 2026)

| Fonte | Nel catalogo il 28 ottobre 2026 | Attese a lettura finita | Come | Strumenti (CORS) | Licenza dei metadati | Licenza delle foto |
|---|---|---|---|---|---|---|
| Epigraphic Database Heidelberg (EDH) | 12.205 | 12.205 (dati chiusi dal 2021) | nessuna richiesta: dati aperti dell'EDH in `data/epigrafi-edh.json` (scritto da `scripts/epigrafi-edh.mjs`); manifesti scritti dal catalogo con i servizi IIIF di heidICON per tutte le 12.205 iscrizioni (dal 28 ottobre 2026: i manifesti dell'EDH sono dietro il controllo anti-robot Anubis e nei browser non si aprono, quindi non si usano) | sì (heidICON con CORS aperto, verificato) | CC BY-SA 4.0: va servita aperta | diritti riservati (heidICON: «In Copyright»; manifesti dell'EDH: «Rechte vorbehalten, freier Zugang»); le foto italiane «Conc. Min. BB.AA.CC.» hanno il divieto di ulteriore riproduzione |
| Wikidata con Wikimedia Commons | 735 | circa 735 (749 iscrizioni antiche con immagine, tolti i doppioni dell'EDH e del Met e i file senza licenza libera) | una interrogazione SPARQL, poi l'API di Commons (50 file per richiesta); manifesti scritti dal catalogo | sì (upload.wikimedia.org con CORS aperto, verificato) | CC0 | licenze libere di Commons, file per file (CC BY-SA, CC BY, CC0, pubblico dominio) |
| The Metropolitan Museum of Art | 15 (lettura appena iniziata) | stima 1.000-2.500 (5.506 oggetti candidati dalle ricerche; nelle prime schede lette ne entra circa una su due) | API delle collezioni (ricerca v1.1 per dipartimento, poi una scheda per oggetto); misure dai primi 64 KB di ogni JPEG; manifesti scritti dal catalogo | sì (images.metmuseum.org con CORS aperto, verificato) | CC0 (Open Access) | CC0 (Open Access) |
| J. Paul Getty Museum (fonte «epibrowser», dal browser) | 82 | 82 (lettura fatta una volta, si rifà a mano) | ricerca del sito e schede Linked Art lette dal browser (`scripts/browser/epigrafi-getty.js` → `data/epigrafi-getty.json`); manifesti IIIF del museo | sì (media.getty.edu con CORS aperto) | CC BY 4.0 (testi delle schede) | CC0 (Open Content Program) |
| Yale University Art Gallery (fonte «epibrowser», dal browser) | 207 | 207 (lettura fatta una volta, si rifà a mano) | ricerca di LUX e schede Linked Art lette dal browser (`scripts/browser/epigrafi-yale.js` → `data/epigrafi-yale.json`); manifesti IIIF del museo | sì (manifests e images.collections.yale.edu con CORS aperto, verificato dal server) | CC0 | CC0 (solo i manifesti che lo dichiarano) |
| Museo Egizio, collezione online (fonte «musei») | 0 (lettura appena avviata) | circa 700 (fra 500 e 1.000; 5.483 oggetti nella sitemap) | sitemap, poi una scheda per oggetto a una richiesta ogni 1,5 secondi; misure dai primi 64 KB di ogni JPEG; manifesti scritti dal catalogo | sì (CORS aperto, verificato) | non dichiarata | CC0 |
| Museo Egizio, Turin Papyrus Online Platform, parte pubblica (fonte «musei», tipo «papiro») | 128 papiri | 128 (131 pubblici, 3 disegni senza scrittura) | letta dal browser, file `data/musei-tpop.json` | sì (CORS aperto, verificato) | foto CC0, schede degli editori da citare | CC0 |
| Modelli 3D di Sketchfab (fonte «musei») | 871 | più di 871: continuano le ricerche negli account grandi | API pubblica di ricerca e oEmbed; anteprima come immagine | sì (`media.sketchfab.com` con CORS aperto) | descrizioni degli autori | licenza di ogni modello, solo incorporato |

Totale epigrafi nel catalogo il 28 ottobre 2026: 12.955 dalla fonte «epigrafi», 870 dalla fonte «musei» (modelli 3D) e 289 dalla fonte «epibrowser» (Getty 82, Yale University Art Gallery 207, raccolte dal browser), 14.114 in tutto. Lingue: latino 12.438, greco 479, poi aramaico, copto, egiziano, punico, accadico, fenicio, sumerico, elamita e antico persiano (da Wikidata e dal Met).
La corsia gira a ruota finché non sono lette tutte le schede del Met, poi ogni notte alle 03:55 UTC (elenchi ogni 30 giorni).

Cosa c'è in ogni scheda («epigrafe» nella voce completa): edizione (CIL, AE e il primo rimando della bibliografia EDH), numero EDH e numero Trismegistos, luogo di ritrovamento (antico e moderno) e provincia romana, luogo di conservazione (museo o collezione, con la città per la mappa quando la scheda la dà), datazione, supporto e materiale, genere dell'iscrizione (sepolcrale, votiva, onoraria, miliario…), testo trascritto dove la licenza lo consente (EDH, CC BY-SA 4.0, al massimo 800 caratteri), licenza dei metadati («licenza_metadati»; «aperta: true» per i dati che devono restare aperti).
Le epigrafi non passano dal riconoscimento degli autori: i titoli nominano luoghi («Salonae / Solin» non è Solino).

## Tabella riassuntiva

| Fonte | Quante iscrizioni | Quante con foto | IIIF | Possiamo scrivere noi il manifesto | Strumenti (CORS) | Licenza dati / immagini | Esito |
|---|---|---|---|---|---|---|---|
| EDH (Heidelberg) | 82.450 schede nei dati (81.882 sul sito) | 12.205 con foto IIIF (43.093 schede di foto, 41.485 in heidICON) | Sì: Image API di heidICON e un manifesto per foto | Sì, per riunire più foto (i servizi IIIF sono pubblici) | Sì | CC BY-SA 4.0 / diritti riservati, riuso con il manifesto IIIF | Dentro, con strumenti |
| EDR (Epigraphic Database Roma) | 38.739 con media in Europeana (EAGLE) | non verificabile | Non verificato | Non verificato | Non verificato | Europeana: «In Copyright»; EpiDoc su Zenodo CC BY 4.0 (senza foto) | Bloccata: il sito non risponde nemmeno dal browser (28 ottobre 2026, http e https, con e senza www); i dati EpiDoc sono su Zenodo (10.5281/zenodo.18468635, CC BY 4.0), le foto restano su edr-edr.it |
| EAGLE ed Europeana | 223.076 iscrizioni EAGLE | 79.455 con media | Sì: manifesti Europeana con CORS aperto | Non serve | Le immagini no: puntano ai vecchi indirizzi dei partner | Metadati CC0 / 77.351 «In Copyright» | Fuori come fonte di foto: i link alle immagini dei partner sono morti (EDH 404, Ubi Erat Lupa 410, PETRAE 404, EDR 503); resta utile per i metadati. L'API vuole una chiave gratuita |
| Clauss-Slaby (EDCS) | Oltre 500.000 testi (dato noto, non verificato oggi) | Nessuna foto propria: rimanda alle foto di altre banche dati | No | No | Non applicabile | Non dichiarata | Fuori: niente foto proprie; il server risponde al nostro con una pagina di blocco |
| I.Sicily | Circa 4.000 (dato del progetto, non verificato oggi) | Molte | Server IIIF (Cantaloupe), ma pubblico solo l'anteprima larga 400 pixel; info.json e altre misure danno 404 | No: solo miniature | Sì sulle miniature | CC BY 4.0 (dati) / foto «su concessione» degli enti siciliani | Fuori per ora: foto intere non raggiungibili; robots.txt con Crawl-delay 10200 (quasi tre ore tra le richieste). I dati EpiDoc sono su GitHub (ISicily/ISicily) |
| IGCyr / GVCyr | 976 schede | Nessuna foto delle iscrizioni nelle schede (solo piante dei siti) | No | No | Non applicabile | CC BY-NC 4.0 | Fuori: niente foto |
| Inscriptions of Aphrodisias (IAph 2007) | Circa 1.500 | 1.155 con foto (conteggio di Europeana) | No | Tecnicamente sì (JPEG fissi) | No | Testi XML CC BY 2.0 UK (il simbolo sta accanto al link EpiDoc di ogni scheda); foto senza licenza dichiarata | Da chiedere con permesso: verificato dal browser, nessuna licenza per le foto né nella scheda né nelle pagine dell'introduzione (King's College London) |
| Inscriptions of Roman Tripolitania (IRT 2021) | Non contate | Non verificato | Non verificato | Non verificato | Non verificato | Non verificata | Fuori: robots.txt vieta tutto a tutti («Disallow: /») |
| Roman Inscriptions of Britain (RIB) | RIB I e III, più tavolette di Vindolanda e di Bath | Per lo più disegni, qualche foto | No | Tecnicamente sì | Non verificato | Testi CC BY 4.0 / foto e immagini con diritti riservati ai proprietari | Fuori: immagini con diritti riservati, niente IIIF; Crawl-delay 20 e verifica Cloudflare sulla ricerca |
| Ubi Erat Lupa | 21.032 con foto (conteggio di Europeana) | Sì | No | Tecnicamente sì | Non verificato | Foto «urheberrechtlich geschützt», uso solo con permesso | Fuori: serve il permesso |
| Arachne / iDAI.objects | Non contate | Sì | Non verificato | No | Non verificato | Foto del DAI con diritti | Fuori: il robots.txt vieta /search e /data/search |
| Trismegistos Texts | Tutti i testi (numeri TM) | No | No | No | Non applicabile | Servizi dati CC BY-SA 4.0 | Fuori: niente foto (i numeri TM li prendiamo da EDH e Wikidata) |
| PHI Greek Inscriptions | Circa 220.000 testi (dato noto, non verificato oggi) | No | No | No | Non applicabile | Non dichiarata | Fuori: solo testi; il sito risponde 403 al nostro server |
| US Epigraphy Project | Circa 5.000 (dato noto, non verificato oggi) | Non verificato | No | Non verificato | Non verificato | Non verificata | Fuori per ora: Crawl-delay 30, foto da verificare dal browser |
| Vindolanda Tablets (CSAD) | Circa 750 tavolette (dato noto, non verificato oggi) | Sì | No | Non verificato | Non verificato | Diritti riservati | Fuori: server del CSAD non raggiungibile; le tavolette sono ora anche sul sito della RIB, con diritti riservati |
| Hispania Epigraphica | Non contate | Sì | Non verificato | Non verificato | Non verificato | Non verificata | Bloccata: eda-bea.es mostra il blocco Cloudflare («Sorry, you have been blocked») anche nel browser (28 ottobre 2026); il robots.txt vieta /search/ |
| EDB (Epigraphic Database Bari) | 42.333 schede (sito), 11.636 immagini | Sì (foto dell'archivio della Pontificia Commissione di Archeologia Sacra) | No | No | Non verificato | Dati CC BY-SA 4.0; sito e foto «All rights reserved» | Da chiedere con permesso: le foto sono della PCAS, con diritti riservati; i dati si possono riusare (CC BY-SA 4.0) ma senza foto non entrano |
| British Museum | Migliaia di iscrizioni | Sì | Niente IIIF pubblico | No | Non verificato | Contenuti CC BY-NC-SA 4.0 dove segnati (escluso il sito di un'organizzazione commerciale) | Da chiedere con permesso: dal browser il sito risponde (niente verifica), ma le condizioni chiedono il permesso per il text and data mining (permissions@britishmuseum.org); robots.txt con Crawl-delay 20 e «ai-train=no» |
| J. Paul Getty Museum | 82 iscrizioni (classificate «Inscriptions» o con nome da iscrizione) | Sì | Sì, manifesti del museo con CORS aperto | Non serve | Sì | CC0 per le immagini, testi CC BY 4.0 | Dentro (fonte «epibrowser», raccolta dal browser il 28 ottobre 2026): la SPARQL di data.getty.edu ora risponde 401 «Wrong Authorization Token»; usate la ricerca del sito e le schede Linked Art |
| The Metropolitan Museum of Art | 5.506 candidati | Sì, alta risoluzione | No | Sì | Sì | CC0 | Dentro, con strumenti |
| Musei Vaticani | Non contate | Sì | No | No | Non verificato | Non verificata | Bloccata: catalogo.museivaticani.va mostra la verifica di sicurezza Cloudflare anche nel browser (28 ottobre 2026) |
| Louvre (collections.louvre.fr) | Non contate | Sì | No (schede JSON per opera) | Tecnicamente sì | Da verificare | Testi Licence Ouverte Etalab; foto gratuite solo per gli usi museali, didattici e scientifici elencati nelle condizioni, a pagamento gli altri | Da chiedere con permesso: le condizioni (art. 4.1.1.2) ammettono le «pubblicazioni digitali scientifiche e didattiche» con credito e link, ma non dicono nulla di un visore che apre le foto dal loro server; GLV è una società |
| Cleveland Museum of Art | 30 iscrizioni greche e romane con immagine (ricerca «inscription») | Sì | No | Sì | Da verificare | CC0 | Candidata Dentro, piccola |
| Yale University Art Gallery (Dura-Europos) | 207 iscrizioni | Sì | Sì, manifesti del museo (manifests.collections.yale.edu) | Non serve | Sì | Dati in pubblico dominio; immagini CC0 dove il manifesto lo dice | Dentro (fonte «epibrowser», raccolta dal browser il 28 ottobre 2026) attraverso LUX: il robots.txt di artgallery.yale.edu vieta gli agenti AI («Claude-User», «Disallow: /») e non si usa; quello di LUX vieta solo /view/results/ |
| Harvard Art Museums | Non contate | Sì | Sì | Non serve | Non verificato | Non verificata | Fuori per ora: l'API vuole una chiave |
| Wikimedia Commons (categorie) | Decine di migliaia di foto di iscrizioni | Sì | No | Sì | Sì | Licenze libere, file per file | Dentro solo attraverso Wikidata: le categorie da sole non danno schede affidabili (luogo, edizione, datazione) |
| CIL, Archivum Corporis Electronicum (BBAW) | Non contate | Foto e calchi | Non verificato | Non verificato | Non verificato | Diritti della BBAW | Fuori per ora: da verificare |

## Fonte per fonte

### Epigraphic Database Heidelberg

Progetto della Heidelberger Akademie der Wissenschaften dal 1993 al 2021: i dati non cambiano più.
Dati aperti (CSV, EpiDoc, API) con licenza CC BY-SA 4.0, scritta sulla pagina dei dati (`https://edh.ub.uni-heidelberg.de/data`).
Usati due file: `edh_data_text.csv` (60 MB, 82.450 iscrizioni) e `edh_data_foto.csv` (22 MB, 43.093 foto). Il robots.txt non c'è (404).
Le foto sono nel server IIIF di heidICON (`heidicon.ub.uni-heidelberg.de/iiif/2/<id>`, Cantaloupe, livello 2, CORS aperto, verificato); il CSV dà già le misure di ogni foto, quindi non serve nessuna richiesta.
Ogni foto ha un manifesto IIIF pubblicato dall'EDH per il riuso (`https://edh.ub.uni-heidelberg.de/iiif/edh/F000001.manifest.json`, licenza «rv-fz»: diritti riservati, accesso libero). Dal 28 ottobre 2026 quei manifesti sono dietro un controllo anti-robot (Anubis) e nei browser non si aprono: non si usano e non si aggirano. Il catalogo scrive il proprio manifesto per ogni iscrizione (ramo «manifesti», `data/manifesti/epigrafi-edh/<hd>.json`) con i servizi IIIF di heidICON, che restano aperti.
Nella scheda dell'oggetto heidICON la licenza è «In Copyright (InC)», titolare la Heidelberger Akademie. Il robots.txt di heidICON vieta /detail/, che non usiamo.
Le foto italiane (8.935 schede di foto) portano la dicitura «Conc. Min. BB.AA.CC. Div. riprod.»: concessione del Ministero con divieto di ulteriore riproduzione. Noi non copiamo nulla: il visore apre le foto dal server di Heidelberg; la dicitura è scritta nella licenza della scheda.
Iscrizioni con foto: 12.205 (6.552 con una foto, 5.653 con due o più; per tutte il catalogo scrive un manifesto, che per le seconde riunisce le foto).
Attenzione per il visore: l'info.json di heidICON dichiara il proprio indirizzo in http (non https).

### Wikidata e Wikimedia Commons

Wikidata: 3.931 iscrizioni (Q1640824 e sottoclassi) con immagine (P18). Molte sono pietre runiche e lapidi moderne; entrano solo le antiche: lingua antica, numero di una banca dati epigrafica (EDH, EDCS, EDR, Trismegistos, PHI, RIB) oppure data prima del 700. Sono 749.
Metadati CC0. Le immagini sono su Wikimedia Commons, con la licenza di ogni file (presa dall'API di Commons): entrano solo i file con licenza libera; si usa la miniatura di Commons larga al massimo 3000 pixel.
Doppioni: un'iscrizione con lo stesso numero EDH o lo stesso oggetto del Met resta all'EDH o al Met.

### The Metropolitan Museum of Art

API delle collezioni senza chiave (`collectionapi.metmuseum.org`); la ricerca v1 è stata ritirata il 1° ottobre 2026, si usa la v1.1 (paginata).
Ricerche: arte greca e romana («inscription», «inscribed», «stele», «epitaph»), Vicino Oriente antico («inscription», «cuneiform»), arte egizia («stela», «inscription»), arte medievale («inscription»): 5.506 oggetti candidati.
Entrano solo gli oggetti Open Access (pubblico dominio, CC0) con immagine e con nome o titolo da iscrizione (iscrizione, stele, epitaffio, decreto, cippo, miliario, kudurru, tavoletta cuneiforme…); fuori vasi, gemme, monete, lucerne, sigilli, gioielli.
Niente IIIF: il catalogo scrive i manifesti con le immagini originali di `images.metmuseum.org` (CORS aperto), misure lette dai primi 64 KB di ogni JPEG; al massimo 8 foto per oggetto.

### EDR (Epigraphic Database Roma)

Dal nostro server `www.edr-edr.it` chiude la connessione in https e risponde 503 in http, anche per il robots.txt.
In Europeana (EAGLE) EDR ha 71.826 iscrizioni, 38.739 con media; i link alle foto (`edr-edr.it/foto_epigrafi/immagini_uso/…`) rispondono 503. Diritti delle foto in Europeana: «In Copyright».
Da confermare dal browser: se il sito risponde, vanno lette le condizioni delle foto (molte sono su concessione del Ministero).

### EAGLE ed Europeana

Europeana (fornitore «EAGLE») ha 223.076 iscrizioni; 79.455 con media: EDR 38.739, Ubi Erat Lupa 21.032, EDH 7.876, EDB 4.603, PETRAE 1.989, Last Statues of Antiquity 1.293, Aphrodisias 1.155, Pola 972, Monumenta Asia Minoris Antiquae 758, Cluj 558, ELTE 253, Lubiana 224, Israel Museum 3.
I manifesti IIIF di Europeana rispondono con CORS aperto, ma le immagini puntano agli indirizzi dei partner del 2014: provati EDH (404), Ubi Erat Lupa (410), PETRAE (404), EDR (503); risponde solo Aphrodisias (senza CORS).
Diritti: 77.351 «In Copyright», 1.293 CC BY-NC-SA 4.0, 558 CC BY-SA 3.0, 253 CC0. I metadati di Europeana sono CC0.
La prova è fatta con la chiave dimostrativa pubblica dell'API; per usarla davvero serve una chiave gratuita (registrazione su Europeana).

### I.Sicily

Dati EpiDoc con licenza CC BY 4.0 (sito `sicily.classics.ox.ac.uk` e repository GitHub `ISicily/ISicily`).
Le foto sono in un server IIIF (Cantaloupe, CORS aperto), ma dall'esterno risponde solo la miniatura larga 400 pixel (`/image/<ISic>/<file>.tif/full/400,/0/default.jpg`); info.json e misure più grandi danno 404.
Le foto sono «con il permesso dell'Assessorato Regionale dei Beni Culturali», non con la licenza dei dati.
Il robots.txt chiede 10.200 secondi tra le richieste.

### Inscriptions of Aphrodisias, Tripolitania, Cirenaica

IAph 2007 (`insaph.kcl.ac.uk`): JPEG a piena risoluzione raggiungibili, senza CORS e senza IIIF; la licenza Creative Commons della prefazione vale per i file XML, le foto non hanno licenza dichiarata.
IRT 2021 (`irt2021.inslib.kcl.ac.uk`): robots.txt «Disallow: /» per tutti.
IGCyr / GVCyr (`igcyr.unibo.it`): 976 schede, CC BY-NC 4.0; l'archivio su AMS Acta (3,5 MB) ha solo i testi.

### Roman Inscriptions of Britain

Condizioni d'uso: testi e TEI con licenza CC BY 4.0; «il copyright delle fotografie e delle immagini resta ai rispettivi proprietari».
Crawl-delay 20; la ricerca usa la verifica Cloudflare Turnstile. Le immagini sono per lo più i disegni dei volumi RIB.

### Ubi Erat Lupa

`lupa.at`, robots.txt aperto, ma ogni scheda dice: «Diese Bilder sind urheberrechtlich geschützt und dürfen nicht ohne Zustimmung des Rechteinhabers verwendet werden». Niente IIIF.

### Altre

Arachne: il robots.txt vieta `/search` e `/data/search` (le API di ricerca).
Trismegistos (`www.trismegistos.org`), Vindolanda (`vindolanda.csad.ox.ac.uk`), EDB (`www.edb.uniba.it`) e IIP (`iip.brown.edu`): connessione chiusa o rifiutata dal nostro server.
EDCS (`db.edcs.eu`): pagina di blocco al nostro server.
PHI (`inscriptions.packhum.org`): 403.
British Museum, Musei Vaticani, Yale University Art Gallery: 403 o verifica Cloudflare.
Harvard Art Museums: API con chiave (401 senza).

## Verifica dal browser di Giampiero (28 ottobre 2026)

Prove fatte da un normale Chrome, a una richiesta ogni 2 secondi o più, sulle fonti che dal nostro server non rispondono. Regola: se anche nel browser c'è una verifica anti-robot (Cloudflare, CAPTCHA, Anubis), o se robots.txt o condizioni vietano la raccolta automatica, ci si ferma e si annota. Nessuna immagine scaricata.

Entrate (fonte «epibrowser», `scripts/fonti/epigrafi-browser.mjs`, id «epb-getty-…» e «epb-yale-…»; la fonte legge solo i file in data/ e non fa richieste):

- **J. Paul Getty Museum**: 82 iscrizioni (37 greche, 5 latine, le altre egiziane, aramaiche o senza lingua dichiarata). Il robots.txt di getty.edu vieta solo /cgi-bin e poco altro; data.getty.edu non ha robots.txt. La SPARQL di data.getty.edu ora risponde 401 («Wrong Authorization Token») anche dal browser: si usa la ricerca del sito (`/art/collection/api/search`, filtro per tipo d'oggetto «Inscription», «Stele», «Altar», «Plaque» e ricerche per parola), poi la scheda Linked Art e il manifesto IIIF di ogni oggetto. Entrano solo gli oggetti Open Content (immagini CC0), classificati «Inscriptions» (AAT 300028702) o con un nome da iscrizione; fuori bende di mummia, papiri e schede «Part». Candidati 1.319, schede lette 642.
- **Yale University Art Gallery**: 207 iscrizioni (55 greche, 3 latine, molte da Dura-Europos, anche aramaiche e palmirene). Il sito del museo (artgallery.yale.edu) vieta nel robots.txt gli agenti AI («Claude-User» e simili): non si usa. Si passa da LUX (lux.collections.yale.edu, il catalogo comune di Yale; robots.txt aperto salvo /view/results/), la cui API risponde al browser ma non al nostro server (403 di CloudFront). Manifesti e immagini IIIF del museo rispondono anche al nostro server, con CORS aperto. Entrano solo i manifesti con «rights» CC0. Candidati 543 (tolte le ricerche «dipinto», «dedication» e «altar» da sole: quasi solo dipinti e dediche di donatori), schede lette 320.

Bloccate:

- **Hispania Epigraphica** (eda-bea.es): blocco Cloudflare anche nel browser («Sorry, you have been blocked»).
- **Musei Vaticani** (catalogo.museivaticani.va): verifica di sicurezza Cloudflare anche nel browser, già sul robots.txt.
- **EDR** (edr-edr.it): il sito non risponde nemmeno dal browser (pagina d'errore in http e https, con e senza www). I dati EpiDoc dell'EDR sono su Zenodo (10.5281/zenodo.18468635, versione 12 del 2026, CC BY 4.0, 268 MB), senza foto: le foto restano sul sito, che non risponde.
- **IG, Berlin-Brandenburgische Akademie** (ig.bbaw.de): la sezione «Abklatsche» è solo l'elenco dei calchi conservati, senza immagini in rete.
- **Attic Inscriptions Online**: robots.txt aperto, ma le foto sono quasi tutte link ad altri siti (musei, Krateros di Princeton) e la licenza non è dichiarata.
- **Museo Epigrafico di Atene**: nessun catalogo in rete con foto trovato.

Da chiedere con permesso:

- **British Museum**: dal browser il sito risponde senza verifiche; robots.txt con «Crawl-delay: 20», «Content-Signal: search=yes, ai-train=no, use=reference» e «Disallow: /» per ClaudeBot, Claude-Web e anthropic-ai. Le condizioni («Copyright and permissions») dicono che per il text and data mining serve il permesso (permissions@britishmuseum.org); la CC BY-NC-SA 4.0 dei contenuti segnati esclude il sito di un'organizzazione commerciale.
- **Inscriptions of Aphrodisias** (insaph.kcl.ac.uk): robots.txt assente; la CC BY 2.0 UK di ogni scheda sta accanto al link EpiDoc (vale per gli XML); per le foto nessuna licenza, né nella scheda né nell'introduzione. Da chiedere al King's College London.
- **EDB, Epigraphic Database Bari** (www.edb.uniba.it): robots.txt aperto; 42.333 schede e 11.636 immagini. Dati CC BY-SA 4.0 («The data related to the epigraphs are released under the CC-by-SA 4.0 license»), ma il sito è «All rights reserved» e le foto vengono dall'archivio della Pontificia Commissione di Archeologia Sacra: senza permesso non entrano. Iscrizioni cristiane di Roma, latine e greche.
- **Louvre** (collections.louvre.fr): testi delle schede in Licence Ouverte Etalab (aperti); foto gratuite solo per gli usi elencati (museali, didattici, scientifici, comprese le «pubblicazioni digitali scientifiche e didattiche» con credito e link), a pagamento gli altri. Molte iscrizioni greche: vale la pena chiedere se il visore di Emendando rientra.

Nuovo conteggio delle epigrafi nel catalogo (indice del 28 ottobre 2026, dopo `node scripts/raccogli.mjs --solo-costruisci`): 14.114; greche 479, latine 12.438.

## RTI e 3D

Servono dopo, per il visore RTI. Verifica del 28 ottobre 2026: nessuna grande banca dati epigrafica pubblica file RTI con licenza aperta; i modelli 3D aperti sono molti, sparsi su Sketchfab.

### RTI (Reflectance Transformation Imaging)

| Raccolta | Cosa | Numeri | Formato | Licenza | Note |
|---|---|---|---|---|---|
| IEEE DataPort, «RTI files of the inscription Hymn of Palaikastron» | calco dell'Inno dei Cureti (Museo di Heraklion) | 1 iscrizione, 32 foto | foto della cupola e file .ptm | CC BY 4.0 | buon caso di prova per il visore |
| Universität Münster, datastore (per esempio «VAT 18274 - RTI dataset») | tavolette cuneiformi del Vorderasiatisches Museum | alcuni insiemi | foto RTI e file derivati | da leggere per ogni insieme | `datastore.uni-muenster.de` |
| Ashmolean Latin Inscriptions Project (AshLI, Warwick e Oxford) | iscrizioni latine dell'Ashmolean, studiate anche con RTI | il pacchetto pubblico (Zenodo 10.5281/zenodo.3634973) ha solo EpiDoc XML | .xml | Creative Commons (versione non indicata) | i file RTI non sono pubblicati |
| Freer e Sackler (Smithsonian), Squeeze Imaging Project | calchi di Ernst Herzfeld (Vicino Oriente) | 393 calchi | immagini e modelli dei calchi | condizioni Smithsonian | `archive.asia.si.edu/research/squeezeproject` |
| InscriptiFact (West Semitic Research, USC) | la raccolta RTI più grande di iscrizioni del Vicino Oriente | migliaia | RTI e PTM nel loro programma | uso con registrazione | sito non raggiungibile dal nostro server |
| CDLI (Cuneiform Digital Library Initiative) | foto di tavolette cuneiformi, alcune con RTI | centinaia di migliaia di foto | JPEG e alcuni RTI | per lo più uso non commerciale | `cdli.mpiwg-berlin.mpg.de` risponde |
| E-stampages (calchi epigrafici di Delfi e altri siti) | calchi in 3D e immagini | non contati | modelli 3D | da verificare | sito non raggiungibile dal nostro server |

### 3D (Sketchfab e musei)

Ricerche sull'API pubblica di Sketchfab (24 risultati per pagina; «24» vuol dire che ci sono altre pagine):

| Ricerca | CC0 | CC BY | CC BY-SA | CC BY-NC | CC BY-NC-SA |
|---|---|---|---|---|---|
| «latin inscription» | 5 | 24 e oltre | 1 | 24 e oltre | 12 |
| «greek inscription» | 4 | 24 e oltre | 2 | 24 e oltre | 16 |
| «inscription» | 24 e oltre | 24 e oltre | 21 | 24 e oltre | 24 e oltre |
| «epigraph» | 1 | 24 e oltre | 0 | 24 e oltre | 4 |
| «funerary stele» | 1 | 24 e oltre | 0 | 20 | 14 |
| «cuneiform» | 4 | 24 e oltre | 0 | 11 | 11 |

Autori con più modelli di iscrizioni: British Museum (CC BY-NC-SA 4.0: Rosetta Stone, decreti ateniesi, blocchi iscritti, tavolette cuneiformi), Global Digital Heritage (CC BY-NC: iscrizioni romane e islamiche di Spagna), tdr125 (CC BY: epigrafi romane di Tarragona), Fitzwilliam Museum (CC BY), MKG Hamburg e Wirtualne Muzea Małopolski (CC0), Harvard Museum of the Ancient Near East (CC BY, tavolette cuneiformi), John Rylands Library (CC BY-NC).
Formati: glTF o OBJ scaricabili quando l'autore lo permette; la visione nella pagina passa dal visore di Sketchfab.
Smithsonian 3D (CC0): `3d.si.edu` risponde 403 al nostro server.
Per il visore RTI di Emendando, la «luce radente virtuale» può già lavorare sulle foto normali; i file RTI veri (PTM, RTI, Relight) sono pochi e sparsi: conviene partire dal caso di Palaikastron (CC BY 4.0) e dagli insiemi di Münster.

## Museo Egizio di Torino (fonte «musei», dal 28 ottobre 2026)

Verifica del 28 ottobre 2026 dal nostro server (collezione online) e dal browser di Giampiero (piattaforma dei papiri).

**Collezione online** (`collezioni.museoegizio.it`): 5.483 oggetti nella sitemap (il sito ne dichiara «oltre 4.000» consultabili; alcune schede della sitemap sono vuote). Il robots.txt vieta solo `/xml/`, `/js/`, `/libs/` e `/Error.aspx` e non dichiara un Crawl-delay: si legge la sitemap, poi la scheda italiana di ogni oggetto, una volta sola, a una richiesta ogni 1,5 secondi (circa due ore e mezza per la prima lettura, divisa fra più giri della corsia). Le immagini sono dichiarate dal museo «liberamente scaricabili e riutilizzabili con licenza Creative Commons CC0» (nella pagina e in ogni foto); i JPEG interi (`/public/objects/images/<id>_full.jpg`, fino a circa 6.000 pixel) hanno CORS aperto: si vedono nel visore e funzionano gli strumenti. Niente IIIF: il catalogo scrive i manifesti (ramo «manifesti», `data/manifesti/musei-egizio/<id>.json`) con le misure lette dai primi 64 KB di ogni JPEG.

Entrano solo gli oggetti con scrittura, decisi dal titolo e dalla descrizione del museo (in dubbio fuori):
papiri (tipo «papiro»), poi come tipo «epigrafe» con il supporto: stele, ostraka, tavolette, etichette di mummia, coni funerari, e sarcofagi, ushabti, statue, vasi canopi, tavole d'offerta, scarabei, sigilli, amuleti ed elementi architettonici solo quando la descrizione parla di iscrizione, geroglifici, ieratico, demotico, cartigli, formula d'offerta o Libro dei Morti, oppure il titolo porta il nome di una persona («Ushabti di Pakep», «Statua di Amenhotep II»: il nome viene dall'iscrizione; i nomi di divinità non contano). Fuori gli amuleti e le statuette di divinità senza testo, i sarcofagi di animali, la ceramica.
Ogni voce ha inventario (Cat., S., Suppl., Provv.), materiale, misure, datazione con periodo, dinastia e regno, provenienza, acquisizione, scrittura (geroglifico, ieratico, demotico, copto, greco, quando la scheda lo dice; lingua «egiziano» se non lo dice), una descrizione breve. Luogo per la mappa: Museo Egizio, Torino.
Stato il 28 ottobre 2026: la corsia «musei» (`.github/workflows/raccolta-musei.yml`) è avviata; nel catalogo non c'è ancora nessun oggetto della collezione online. Attesi, da un campione di 45 schede lette dal server (6 entrano, 2 papiri senza foto restano fuori): circa 700 oggetti, fra 500 e 1.000, quasi tutti «epigrafe» più alcune decine di papiri.

**Piattaforma dei papiri** (`collezionepapiri.museoegizio.it`, Turin Papyrus Online Platform, TPOP): il nostro server non la raggiunge; verificata dal browser. Il robots.txt è lo stesso della collezione (vieta solo `/xml/`, `/js/`, `/libs/`, `/Error.aspx`). La pagina «Politica di accesso e utilizzo» dice che le foto si possono usare con licenza CC0; descrizioni, trascrizioni e traduzioni sono degli editori indicati nella scheda, da citare. Il database completo (più di 12.000 papiri e frammenti) chiede la registrazione: non lo usiamo (non si creano account). Il vecchio `papyri.museoegizio.it`, dove sta il login, è vietato dal suo robots.txt e non si tocca.
Senza registrazione sono pubblici 131 papiri: letti dal browser il 28 ottobre 2026 a una richiesta ogni 1,2 secondi (scheda e primi 64 KB di ogni foto) e salvati in `data/musei-tpop.json`. Le foto (`/media/<id>/[…](1).jpg`, JPEG interi fino a circa 6.000 pixel) hanno CORS aperto. Entrano 128 papiri (3 sono disegni senza scrittura): 210 foto; ieratico, geroglifico corsivo, demotico, greco (6), aramaico (1) e copto (1). Id «mu-tpop-<numero del documento>», manifesti scritti dal catalogo (`data/manifesti/musei-tpop/<n>.json`). Un papiro che compare anche nella collezione online (stesso inventario) resta solo nella voce TPOP, che ha le schede degli editori.
La lettura non si ripete da sola: per aggiornarla si rifà dal browser (stesso metodo) e si sostituisce il file.

## Modelli 3D (Sketchfab, fonte «musei», dal 28 ottobre 2026)

Verifica e prima raccolta del 28 ottobre 2026 dal nostro server. L'API pubblica di ricerca (`api.sketchfab.com/v3/search`) non è vietata dal robots.txt di sketchfab.com (vieta solo `/admin*`, `/i/*` e `/models/*/ar-redirect`); si legge a una richiesta ogni 1,5 secondi.

Come si raccoglie (`scripts/fonti/musei.mjs`, parte «sketchfab»):

1. Solo account seri: 49 account di musei, università e progetti (British Museum, Global Digital Heritage, noe-3d.at e Landessammlungen Niederösterreich, Wirtualne Muzea Małopolski, Harvard Museum of the Ancient Near East, Fitzwilliam, MAA Cambridge, Museu Nacional Arqueològic de Tarragona, MicroPasts, Smithsonian, Minneapolis Institute of Art, CNR ISPC, Museo Egizio, Egypt Centre di Swansea, Kelsey Museum, British Library, John Rylands Library, MKG Hamburg, National Museums Scotland, MANN, Historic England e altri; elenco in `ACCOUNT`). Di ogni account si leggono tutti i modelli (fino a 40 pagine); per gli account più grandi si cerca per 33 parole chiave (iscrizione, stele, altare, cippo, miliario, tavoletta, cuneiforme, ostrakon, papiro, sigillo, bollo, lucerna, peso, moneta, legenda, sarcofago, mosaico, codice, legatura, rotolo, geroglifici, rune, ogham, nelle lingue dei musei).
2. Entra solo un oggetto scritto antico o medievale, deciso da nome, descrizione e tag, con tre prove insieme: una parola di oggetto scritto, una parola di antichità o di medioevo, e una prova forte di scrittura (iscrizione, epigrafe, cuneiforme, geroglifici, ostrakon, papiro, bollo, legenda…) nel nome oppure, per un oggetto il cui nome non dice nulla, una frase esplicita nella descrizione («with an inscription», «inscribed with», «bears the inscription», «mit Inschrift»). Fuori: copie, calchi, ricostruzioni, oggetti moderni (date dal Cinquecento in poi nel nome o nella descrizione), recipienti, sculture ed elementi architettonici senza testo dichiarato, affreschi, colonne a papiro, modelli con limite d'età. In dubbio fuori.
3. Entra solo un modello pubblico il cui incorporamento è consentito: si controlla l'oEmbed di sketchfab.com, che deve restituire l'iframe ufficiale `https://sketchfab.com/models/<uid>/embed`.
4. Collegamento: se il modello è lo stesso oggetto di una voce che il catalogo ha già, non fa una voce nuova ma aggiunge `modello3d` a quella voce: Museo Egizio per inventario (i modelli dell'account del museo scrivono «Inv. no.: Cat. 1656», «C.1587», «S.13115»), EDH per numero HD o per edizione CIL, AE, RIB scritta nella descrizione. Altrimenti è una voce nuova («mu-3d-<uid>», tipo «epigrafe» con il supporto, «papiro», oppure codice per legature e manoscritti), con l'anteprima del modello (JPEG di `media.sketchfab.com`, CORS aperto, fino a 1280 pixel) come unica immagine del manifesto scritto dal catalogo (`data/manifesti/musei-3d/<uid>.json`).

Stato reale il 28 ottobre 2026 (prima parte della lettura: tutti i modelli dei primi account, le ricerche degli account grandi continuano nella corsia «musei»):

| Account | Modelli nel catalogo |
|---|---|
| Harvard Museum of the Ancient Near East | 650 (tavolette cuneiformi) |
| Global Digital Heritage | 97 (iscrizioni romane di Spagna, Bosnia, Montenegro e Italia, iscrizioni preislamiche di Mleiha, iscrizioni medievali di Sigüenza) |
| The Egypt Centre, Swansea | 29 |
| noe-3d.at e Landessammlungen Niederösterreich | 24 (Carnuntum: lapidi, bolli laterizi, lucerne, monete) |
| The British Museum | 19 (Stele di Rosetta, decreti ateniesi, tavolette, stele) |
| Museo Egizio | 17 (si collegano alle voci dell'Egizio quando la collezione online sarà letta) |
| Wirtualne Muzea Małopolski | 12 (ostraka greci, sigilli) |
| Kelsey Museum | 8 |
| Museu Nacional Arqueològic de Tarragona | 5 |
| Fitzwilliam Museum | 4 |
| Minneapolis Institute of Art | 3 |
| British Library | 2 |
| MAA Cambridge | 1 |
| **Totale** | **871** |

Tipi: 870 «epigrafe» (635 tavolette, 33 stele, 29 ostraka, 12 lapidi, 8 altari, 7 sigilli, 6 monete, 4 anelli, 3 lucerne, 2 bolli, 2 cippi, 2 miliari, 2 pesi, 1 mosaico, 124 altri oggetti iscritti) e 1 «papiro».
Licenze dei modelli: 656 con la licenza standard di Sketchfab (si vedono solo incorporati), 94 CC BY-NC, 90 CC BY, 18 CC BY-NC-SA, 10 CC0, 1 CC BY-NC-ND, 2 «Standard». Tutti i 871 hanno l'incorporamento consentito (oEmbed verificato).
Collegati a voci già nel catalogo: 0 il 28 ottobre 2026 (i 17 modelli del Museo Egizio si collegano appena la corsia avrà letto le schede del museo; nessuna descrizione dei modelli raccolti cita un numero HD o un'edizione dell'EDH).
Il catalogo non copia i modelli: si vedono soltanto nel visualizzatore ufficiale di Sketchfab, con autore, licenza e link.

### Specifica per il sito: linguetta «3D»

Quando una voce ha il campo `modello3d` (voce completa, in `data/catalogo/voci/<fonte>-<pezzo>.json`), la scheda e il visore mostrano una linguetta «3D» accanto alle immagini.

Il campo è fatto così: `modello3d: { sketchfab: "<uid>", licenza: "<licenza>", autore: "<nome dell'autore o del museo>", account: "<username su Sketchfab>", url: "https://sketchfab.com/3d-models/<uid>", titolo: "<nome del modello>" }`.
Può stare su una voce della fonte «musei» (oggetto nuovo, che come immagine ha solo l'anteprima del modello) oppure su una voce di un'altra fonte (per esempio un'iscrizione dell'EDH): in quel caso il visore apre le foto come sempre e la linguetta «3D» aggiunge il modello.

Cosa mostra la linguetta:

1. Il visualizzatore ufficiale di Sketchfab incorporato, e nient'altro al suo posto: `<iframe src="https://sketchfab.com/models/<uid>/embed" title="<titolo>" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen loading="lazy">`. Niente download del modello e niente visore nostro: il modello resta su Sketchfab.
2. Sotto l'iframe, sempre visibile, la riga di attribuzione che Sketchfab chiede per gli incorporamenti: il nome del modello con il link alla sua pagina (`url`), l'autore con il link al suo profilo (`https://sketchfab.com/<account>`), la licenza (`licenza`) e «su Sketchfab» con il link a `https://sketchfab.com`. Per le licenze Creative Commons il nome della licenza porta alla sua pagina.
3. L'iframe si carica solo quando si apre la linguetta (non con la scheda), perché il visualizzatore è pesante.
4. Dal 28 ottobre 2026 nell'indice leggero non c'è un campo per il 3D: la linguetta si decide dalla voce completa. Se servirà un filtro «con modello 3D» nella ricerca, si aggiunge una colonna in fondo a `campi`.

Le voci nuove create da un modello hanno come immagine del manifesto l'anteprima di Sketchfab (`media.sketchfab.com`, CORS aperto): per loro conviene aprire la scheda direttamente sulla linguetta «3D».

## Da fare

1. Fatto il 28 ottobre 2026 (sezione «Verifica dal browser di Giampiero»): entrate Getty e Yale University Art Gallery; bloccate EDR, Hispania Epigraphica, Musei Vaticani; da chiedere British Museum, EDB, Aphrodisias, Louvre. Le raccolte Getty e Yale si rifanno a mano dal browser (`scripts/browser/epigrafi-getty.js`, `scripts/browser/epigrafi-yale.js`).
2. Getty: aggiungere le iscrizioni (classificazione AAT «inscriptions») alla corsia, con i manifesti del museo (CC0).
3. Louvre e Cleveland: leggere le condizioni delle foto e, se aperte, agganciarle.
4. Permessi da chiedere (anche con la lettera dell'Università di Urbino): Ubi Erat Lupa, Inscriptions of Aphrodisias (King's College London), RIB, I.Sicily (foto intere).
5. Europeana: chiave gratuita, se un giorno i link dei partner tornano vivi.

## Giappone e Asia orientale

Verifica del 28 ottobre 2026, dal server (mai dal browser in questo giro). Fonte del catalogo «giappone» (`scripts/fonti/giappone-scritture.mjs`, id «giap-…»), corsia `raccolta-giappone-scritture.yml`, stato in `data/giappone.json`. Le voci hanno «tipo» «epigrafe»; il supporto dice di che cosa si tratta: «legno (mokkan)» per le tavolette di legno scritte, «calco (takuhon)» per i calchi su carta delle iscrizioni. Lingue: «giapponese antico» (codice `ojp`) per le tavolette fino all'800, «giapponese» dopo; «cinese classico» (`lzh`) è pronto per i takuhon cinesi.

| Fonte | Quante | Con foto | IIIF | Manifesto scritto da noi | Strumenti (CORS) | Licenza | Esito |
|---|---|---|---|---|---|---|---|
| 木簡庫 Mokkanko, Nabunken (mokkanko.nabunken.go.jp) | 36.953 tavolette nella ricerca «文化財研究所» (circa 53.000 in tutto il database, di tutti gli enti) | 293 su 326 lette il 28 ottobre (90%): stima circa 33.000 | No | Sì: le condizioni lo consentono | No (foto senza CORS: si vedono, l'inchiostro no) | Tavolette scavate da Nabunken: riuso libero, anche commerciale, senza richiesta, con citazione («出典：木簡庫（URL）»); le altre secondo l'ente che ha scavato | Dentro (solo «調査主体» Nabunken). Foto in bianco e nero, da 384 a circa 1.500 pixel di altezza. Testo (釈文), sito, scavo, strato, datazione, misure, legno, forma, genere, DOI. Lettura a ruota: circa 15 ore di richieste (una pagina ogni 1,5 secondi) |
| ColBase, musei nazionali e Nabunken (colbase.nich.go.jp) | Non contate | Sì, alta risoluzione (anche dei mokkan) | Non verificato | Non verificato | Non verificato | Condizioni di ColBase da leggere | Da confermare dal browser: nessuna API pubblica documentata (il sito usa un'API interna che non usiamo) |
| Japan Search (jpsearch.go.jp) | Aggregatore nazionale | Sì | Sì | Non serve | Non verificato | Licenza per voce | Fuori dal server: il robots.txt vieta ai programmi le API di ricerca (/api/item/search/jps-cross) e lo SPARQL (/rdf/). Da confermare dal browser |
| National Diet Library (dl.ndl.go.jp, ricerca con NDL Search) | 13 candidati (titolo con 拓本 o 搨本, copie digitali, fuori i libri «図書») | 6 aperti in Internet (32 immagini) | Sì | Non serve | Sì | NDL; metadati di NDL Search CC BY 4.0 | Dentro: 6. Fuori 5 copie solo in biblioteca (manifesto 404) e 2 libri che non sono calchi. I 126 volumi del «医家墓碑拓本集» sono solo in biblioteca |
| Università Waseda, 古典籍総合データベース | 24 takuhon (dalla ricerca di NDL Search) | Sì (dal catalogo) | Sì | Non serve | Non verificato | Condizioni della biblioteca | In attesa: il 28 ottobre il sito risponde «Site Maintenance» (503); la corsia riprova a ogni giro |
| Shōsōin (正倉院) | Mokkan e iscrizioni tramandati | Sì | No | No | Non applicabile | Uso riservato | Fuori: niente IIIF, foto con diritti riservati |
| Università di Kyoto, Istituto di studi umanistici (石刻拓本資料) | Migliaia di calchi cinesi | Sì | No (DjVu) | No | Non applicabile | «Tutto protetto dalla legge giapponese sul diritto d'autore» | Fuori |
| Università di Kyoto, Rare Materials Digital Archive | Non contate | Sì | Sì | Non serve | Non verificato | Da leggere | Da confermare dal browser: il robots.txt vieta la ricerca (/search/) |
| Altri archivi universitari giapponesi (KUDA, i-repository, Ryukoku, ADEAC) | Pochi takuhon ciascuno (3-4) | Sì | Non verificato | Non verificato | Non verificato | Non verificata | Annotati, non agganciati (troppo piccoli per ora) |
| Harvard (calchi cinesi della Harvard-Yenching e della Fine Arts Library) | Non contate | Sì | Sì | Non serve | Sì (manifesti di Harvard) | Da leggere | Da confermare dal browser: LibraryCloud risponde 403 al nostro server |
| Biblioteca nazionale cinese (碑帖菁华) | Decine di migliaia | Sì | No | No | Non applicabile | Non dichiarata | Fuori: niente IIIF né licenza aperta |
| Corea, 한국금석문 종합영상정보시스템 e Museo nazionale | Migliaia di calchi | Sì | No | Non verificato | Non verificato | Museo nazionale: in parte KOGL tipo 1 | Fuori per ora: niente IIIF; da riprendere dal browser |

Cosa serve nel sito: un'etichetta per il supporto «legno (mokkan)» e una per «calco (takuhon)»; per i mokkan conviene mostrare il testo (「本文」) in verticale e il campo «edizione» (per esempio «藤原宮3-1153»), il DOI di Mokkanko e il rimando obbligatorio alla fonte («出典：木簡庫»).
