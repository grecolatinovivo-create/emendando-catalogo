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
| Epigraphic Database Heidelberg (EDH) | 12.205 | 12.205 (dati chiusi dal 2021) | nessuna richiesta: dati aperti dell'EDH in `data/epigrafi-edh.json` (scritto da `scripts/epigrafi-edh.mjs`); una foto: manifesto IIIF dell'EDH; più foto (5.653 iscrizioni): manifesto scritto dal catalogo con i servizi IIIF di heidICON | sì (heidICON e manifesti dell'EDH con CORS aperto, verificato) | CC BY-SA 4.0: va servita aperta | diritti riservati (heidICON: «In Copyright»; manifesti dell'EDH: «Rechte vorbehalten, freier Zugang»); le foto italiane «Conc. Min. BB.AA.CC.» hanno il divieto di ulteriore riproduzione |
| Wikidata con Wikimedia Commons | 735 | circa 735 (749 iscrizioni antiche con immagine, tolti i doppioni dell'EDH e del Met e i file senza licenza libera) | una interrogazione SPARQL, poi l'API di Commons (50 file per richiesta); manifesti scritti dal catalogo | sì (upload.wikimedia.org con CORS aperto, verificato) | CC0 | licenze libere di Commons, file per file (CC BY-SA, CC BY, CC0, pubblico dominio) |
| The Metropolitan Museum of Art | 15 (lettura appena iniziata) | stima 1.000-2.500 (5.506 oggetti candidati dalle ricerche; nelle prime schede lette ne entra circa una su due) | API delle collezioni (ricerca v1.1 per dipartimento, poi una scheda per oggetto); misure dai primi 64 KB di ogni JPEG; manifesti scritti dal catalogo | sì (images.metmuseum.org con CORS aperto, verificato) | CC0 (Open Access) | CC0 (Open Access) |

Totale epigrafi nel catalogo il 28 ottobre 2026: 12.955. Lingue: latino 12.338, greco 342, poi aramaico, copto, egiziano, punico, accadico, fenicio, sumerico, elamita e antico persiano (da Wikidata e dal Met).
La corsia gira a ruota finché non sono lette tutte le schede del Met, poi ogni notte alle 03:55 UTC (elenchi ogni 30 giorni).

Cosa c'è in ogni scheda («epigrafe» nella voce completa): edizione (CIL, AE e il primo rimando della bibliografia EDH), numero EDH e numero Trismegistos, luogo di ritrovamento (antico e moderno) e provincia romana, luogo di conservazione (museo o collezione, con la città per la mappa quando la scheda la dà), datazione, supporto e materiale, genere dell'iscrizione (sepolcrale, votiva, onoraria, miliario…), testo trascritto dove la licenza lo consente (EDH, CC BY-SA 4.0, al massimo 800 caratteri), licenza dei metadati («licenza_metadati»; «aperta: true» per i dati che devono restare aperti).
Le epigrafi non passano dal riconoscimento degli autori: i titoli nominano luoghi («Salonae / Solin» non è Solino).

## Tabella riassuntiva

| Fonte | Quante iscrizioni | Quante con foto | IIIF | Possiamo scrivere noi il manifesto | Strumenti (CORS) | Licenza dati / immagini | Esito |
|---|---|---|---|---|---|---|---|
| EDH (Heidelberg) | 82.450 schede nei dati (81.882 sul sito) | 12.205 con foto IIIF (43.093 schede di foto, 41.485 in heidICON) | Sì: Image API di heidICON e un manifesto per foto | Sì, per riunire più foto (i servizi IIIF sono pubblici) | Sì | CC BY-SA 4.0 / diritti riservati, riuso con il manifesto IIIF | Dentro, con strumenti |
| EDR (Epigraphic Database Roma) | 38.739 con media in Europeana (EAGLE) | da confermare | Non verificato | Non verificato | Non verificato | Europeana: «In Copyright» | Fuori per ora: il server chiude le connessioni del nostro server (https) e risponde 503 (http); da confermare dal browser |
| EAGLE ed Europeana | 223.076 iscrizioni EAGLE | 79.455 con media | Sì: manifesti Europeana con CORS aperto | Non serve | Le immagini no: puntano ai vecchi indirizzi dei partner | Metadati CC0 / 77.351 «In Copyright» | Fuori come fonte di foto: i link alle immagini dei partner sono morti (EDH 404, Ubi Erat Lupa 410, PETRAE 404, EDR 503); resta utile per i metadati. L'API vuole una chiave gratuita |
| Clauss-Slaby (EDCS) | Oltre 500.000 testi (dato noto, non verificato oggi) | Nessuna foto propria: rimanda alle foto di altre banche dati | No | No | Non applicabile | Non dichiarata | Fuori: niente foto proprie; il server risponde al nostro con una pagina di blocco |
| I.Sicily | Circa 4.000 (dato del progetto, non verificato oggi) | Molte | Server IIIF (Cantaloupe), ma pubblico solo l'anteprima larga 400 pixel; info.json e altre misure danno 404 | No: solo miniature | Sì sulle miniature | CC BY 4.0 (dati) / foto «su concessione» degli enti siciliani | Fuori per ora: foto intere non raggiungibili; robots.txt con Crawl-delay 10200 (quasi tre ore tra le richieste). I dati EpiDoc sono su GitHub (ISicily/ISicily) |
| IGCyr / GVCyr | 976 schede | Nessuna foto delle iscrizioni nelle schede (solo piante dei siti) | No | No | Non applicabile | CC BY-NC 4.0 | Fuori: niente foto |
| Inscriptions of Aphrodisias (IAph 2007) | Circa 1.500 | 1.155 con foto (conteggio di Europeana) | No | Tecnicamente sì (JPEG fissi) | No | Testi XML con licenza Creative Commons; foto senza licenza dichiarata | Fuori: licenza delle foto non dichiarata (da chiedere al King's College) |
| Inscriptions of Roman Tripolitania (IRT 2021) | Non contate | Non verificato | Non verificato | Non verificato | Non verificato | Non verificata | Fuori: robots.txt vieta tutto a tutti («Disallow: /») |
| Roman Inscriptions of Britain (RIB) | RIB I e III, più tavolette di Vindolanda e di Bath | Per lo più disegni, qualche foto | No | Tecnicamente sì | Non verificato | Testi CC BY 4.0 / foto e immagini con diritti riservati ai proprietari | Fuori: immagini con diritti riservati, niente IIIF; Crawl-delay 20 e verifica Cloudflare sulla ricerca |
| Ubi Erat Lupa | 21.032 con foto (conteggio di Europeana) | Sì | No | Tecnicamente sì | Non verificato | Foto «urheberrechtlich geschützt», uso solo con permesso | Fuori: serve il permesso |
| Arachne / iDAI.objects | Non contate | Sì | Non verificato | No | Non verificato | Foto del DAI con diritti | Fuori: il robots.txt vieta /search e /data/search |
| Trismegistos Texts | Tutti i testi (numeri TM) | No | No | No | Non applicabile | Servizi dati CC BY-SA 4.0 | Fuori: niente foto (i numeri TM li prendiamo da EDH e Wikidata) |
| PHI Greek Inscriptions | Circa 220.000 testi (dato noto, non verificato oggi) | No | No | No | Non applicabile | Non dichiarata | Fuori: solo testi; il sito risponde 403 al nostro server |
| US Epigraphy Project | Circa 5.000 (dato noto, non verificato oggi) | Non verificato | No | Non verificato | Non verificato | Non verificata | Fuori per ora: Crawl-delay 30, foto da verificare dal browser |
| Vindolanda Tablets (CSAD) | Circa 750 tavolette (dato noto, non verificato oggi) | Sì | No | Non verificato | Non verificato | Diritti riservati | Fuori: server del CSAD non raggiungibile; le tavolette sono ora anche sul sito della RIB, con diritti riservati |
| Hispania Epigraphica | Non contate | Sì | Non verificato | Non verificato | Non verificato | Non verificata | Fuori per ora: eda-bea.es risponde 403 al nostro server; da confermare dal browser |
| EDB (Epigraphic Database Bari) | 40.283 in Europeana, 4.603 con media | Sì | Non verificato | Non verificato | Non verificato | Europeana: «In Copyright» | Fuori per ora: server non raggiungibile dal nostro; da confermare dal browser |
| British Museum | Migliaia di iscrizioni | Sì | Niente IIIF pubblico | No | Non verificato | Foto CC BY-NC-SA 4.0 | Fuori per ora: 403 (Cloudflare) al nostro server; da confermare dal browser |
| J. Paul Getty Museum | Da contare | Sì | Sì, manifesti con CORS aperto | Non serve | Sì | CC0 | Candidata Dentro: il certificato di data.getty.edu non si verifica dal nostro server; la fonte «getty» del catalogo lo legge già da GitHub Actions. Da agganciare in un secondo giro |
| The Metropolitan Museum of Art | 5.506 candidati | Sì, alta risoluzione | No | Sì | Sì | CC0 | Dentro, con strumenti |
| Musei Vaticani | Non contate | Sì | No | No | Non verificato | Non verificata | Fuori per ora: 403 al nostro server |
| Louvre (collections.louvre.fr) | Non contate | Sì | No (schede JSON per opera) | Da verificare | Da verificare | Da verificare | Da fare: il robots.txt vieta solo /search/export; condizioni delle foto da leggere |
| Cleveland Museum of Art | 30 iscrizioni greche e romane con immagine (ricerca «inscription») | Sì | No | Sì | Da verificare | CC0 | Candidata Dentro, piccola |
| Yale University Art Gallery (Dura-Europos) | Non contate | Sì | Sì | Non serve | Non verificato | Non verificata | Fuori per ora: verifica Cloudflare al nostro server; da confermare dal browser |
| Harvard Art Museums | Non contate | Sì | Sì | Non serve | Non verificato | Non verificata | Fuori per ora: l'API vuole una chiave |
| Wikimedia Commons (categorie) | Decine di migliaia di foto di iscrizioni | Sì | No | Sì | Sì | Licenze libere, file per file | Dentro solo attraverso Wikidata: le categorie da sole non danno schede affidabili (luogo, edizione, datazione) |
| CIL, Archivum Corporis Electronicum (BBAW) | Non contate | Foto e calchi | Non verificato | Non verificato | Non verificato | Diritti della BBAW | Fuori per ora: da verificare |

## Fonte per fonte

### Epigraphic Database Heidelberg

Progetto della Heidelberger Akademie der Wissenschaften dal 1993 al 2021: i dati non cambiano più.
Dati aperti (CSV, EpiDoc, API) con licenza CC BY-SA 4.0, scritta sulla pagina dei dati (`https://edh.ub.uni-heidelberg.de/data`).
Usati due file: `edh_data_text.csv` (60 MB, 82.450 iscrizioni) e `edh_data_foto.csv` (22 MB, 43.093 foto). Il robots.txt non c'è (404).
Le foto sono nel server IIIF di heidICON (`heidicon.ub.uni-heidelberg.de/iiif/2/<id>`, Cantaloupe, livello 2, CORS aperto, verificato); il CSV dà già le misure di ogni foto, quindi non serve nessuna richiesta.
Ogni foto ha un manifesto IIIF pubblicato dall'EDH per il riuso (`https://edh.ub.uni-heidelberg.de/iiif/edh/F000001.manifest.json`, CORS aperto, licenza «rv-fz»: diritti riservati, accesso libero).
Nella scheda dell'oggetto heidICON la licenza è «In Copyright (InC)», titolare la Heidelberger Akademie. Il robots.txt di heidICON vieta /detail/, che non usiamo.
Le foto italiane (8.935 schede di foto) portano la dicitura «Conc. Min. BB.AA.CC. Div. riprod.»: concessione del Ministero con divieto di ulteriore riproduzione. Noi non copiamo nulla: il visore apre le foto dal server di Heidelberg; la dicitura è scritta nella licenza della scheda.
Iscrizioni con foto: 12.205 (6.552 con una foto, 5.653 con due o più; per queste il catalogo scrive un manifesto che le riunisce).
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

## Da fare

1. Dal browser: EDR, EDB, Hispania Epigraphica, British Museum, Yale University Art Gallery, Musei Vaticani (raggiungibilità, foto, licenze, CORS).
2. Getty: aggiungere le iscrizioni (classificazione AAT «inscriptions») alla corsia, con i manifesti del museo (CC0).
3. Louvre e Cleveland: leggere le condizioni delle foto e, se aperte, agganciarle.
4. Permessi da chiedere (anche con la lettera dell'Università di Urbino): Ubi Erat Lupa, Inscriptions of Aphrodisias (King's College London), RIB, I.Sicily (foto intere).
5. Europeana: chiave gratuita, se un giorno i link dei partner tornano vivi.
