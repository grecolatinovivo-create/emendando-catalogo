# Papiri nel catalogo di Emendando: cosa entra e cosa no

Verifica fatta il 24 ottobre 2026. Dal 28 ottobre 2026 i papiri «Dentro» si raccolgono nella corsia «papiri» (`.github/workflows/raccolta-papiri.yml`, fonte «papiri», `scripts/fonti/papiri.mjs`): nel catalogo sono il tipo «papiro», con totale a parte («papiri» in `indice.json`), filtro «Papiri» e etichetta «Papiro» nel sito, e contano nel numero dei testimoni della home e nella mappa.

## Stato reale per fonte (28 ottobre 2026)

Numeri del catalogo ricostruito il 28 ottobre 2026, dopo le prime prove brevi della corsia; la corsia gira a ruota finché la prima lettura non è finita.
Le schede si arricchiscono con papyri.info (repository `papyri/idp.data`, dati CC BY 3.0), estratto in `data/papiri-info.json` da `scripts/papiri-info.mjs` (da rifare a mano ogni tanto, con una copia locale del repository): edizione, data, provenienza, testo letterario o documentario, numero Trismegistos, autore e opera dei letterari (DCLP), riconosciuti poi con gli autori del catalogo (Omero, Menandro e gli altri).
Entrano solo i papiri: legno, ostraka, tavolette, pergamena e carta restano fuori quando la scheda dice il materiale.

| Fonte | Nel catalogo il 28 ottobre 2026 | Attesi a lettura finita | Come | Strumenti di inchiostro | Licenza |
|---|---|---|---|---|---|
| Michigan | 2957 | circa 2960 (3863 schede con immagini, tolti ostraka e tavolette di legno) | manifesti di quod.lib.umich.edu dalle schede APIS, nessuna richiesta | sì (CORS aperto, verificato il 28 ottobre 2026) | pubblico dominio («No Copyright») |
| Berkeley (Tebtunis) | 1499 (elenco in corso) | circa 11.000 | OAI-PMH, insieme «apis», 5 secondi tra le richieste | sì (manifesto con CORS aperto) | uso libero del materiale di pubblico dominio |
| Yale (Beinecke) | 45 (in corso) | circa 6300 | handle delle schede APIS risolto con l'API del Handle System; il manifesto lo apre solo il browser di chi legge | sì | accesso pubblico |
| Duke | 43 (in corso) | circa 1650 | misure delle GIF a 150 dpi, manifesti scritti dal catalogo (ramo «manifesti») | sì (immagini piccole) | solo ricerca e didattica |
| Vienna (ÖNB) | 69 (in corso) | da contare: 27.518 oggetti «P.Vindob.» in ÖNB Digital, entrano quelli di materiale «Papyrus» (i primi 69 letti lo sono tutti) | ricerca di ÖNB Digital, poi un manifesto IIIF per oggetto | sì (CORS aperto, verificato il 28 ottobre 2026) | solo uso non commerciale (scritto nella scheda) |
| Colonia | 0 (in corso) | circa 1000 (1071 indirizzi dall'elenco) | pagine delle pubblicazioni e link di papyri.info, poi la pagina di ogni oggetto (5 secondi tra le richieste); manifesti scritti dal catalogo | no: le immagini si vedono, ma il server non manda il CORS (le copie sui nostri server non sono fatte) | CC BY 4.0 |
| Princeton | 0 (in corso) | circa 510 | schede JSON della mostra (dpul.princeton.edu, 10 secondi tra le richieste) con l'indirizzo del manifesto di figgy | sì (manifesto e immagini con CORS aperto, verificato il 28 ottobre 2026) | «No Known Copyright» |
| Heidelberg | 4629 (già nel catalogo, ora tipo «papiro») | | fonte «heidelberg», nessun doppione | sì | pubblicazione solo con permesso |
| Bayerische Staatsbibliothek | 93 (già nel catalogo, segnature «Pap.», ora tipo «papiro») | | fonte «bsb» | sì | condizioni del MDZ |

Totale papiri nel catalogo il 28 ottobre 2026: 9335 (4613 della fonte «papiri», 4629 di Heidelberg, 93 della BSB).

Colonia: l'elenco completo della collezione (`/uebersicht`, con gli inediti, circa 4500 oggetti) è vietato dal robots.txt: entrano solo gli oggetti delle pubblicazioni e quelli collegati da papyri.info.
Berkeley: alle 07:20 UTC del 28 ottobre 2026 il server rispondeva 504 anche dal browser; alle 07:45 è tornato e l'elenco è partito.
Princeton: dal nostro server di prova le richieste di Node ricevevano 503, quelle di curl 200; la corsia su GitHub lo dirà.

Regola usata: entra solo il papiro che si apre dentro il sito, con l'immagine nel nostro visore.

Niente schede che mandano l'utente su un altro sito.

Due esiti:

- **Dentro**: l'immagine si apre nel nostro visore. Si indica anche se funzionano gli strumenti di inchiostro.
- **Fuori**: non si può, per il motivo scritto.

Gli strumenti di inchiostro funzionano solo se il server delle immagini manda l'intestazione «Access-Control-Allow-Origin» (CORS).
Senza CORS l'immagine si vede, ma il browser non lascia leggere i pixel.
In quel caso gli strumenti funzionano solo se la licenza ci permette di copiare le immagini sui nostri server.

«Da confermare dal browser» vuol dire: le richieste dai server sono state respinte (blocco anti-robot o certificato), quindi la prova va ripetuta da un normale browser.

## Tabella riassuntiva

| Fonte | Quanti papiri | Immagini | IIIF | Possiamo scrivere noi il IIIF | Strumenti inchiostro (CORS) | Licenza | Esito |
|---|---|---|---|---|---|---|---|
| papyri.info (DDbDP, HGV, DCLP, APIS) | 68.022 schede HGV, 14.847 letterari DCLP, 38.530 schede APIS | Proprie no: le sue immagini sono state tolte (errore 410) | No | Non serve: è la fonte delle schede | Non applicabile | Dati CC BY 3.0 | Fuori come fonte di immagini. Usarla per le schede delle altre raccolte |
| Trismegistos e LDAB | Tutti i papiri (numeri TM) | No | No | No | Non applicabile | Sito in abbonamento dal 2020; servizi dati CC BY-SA 4.0 | Fuori: niente immagini, ricerca in abbonamento |
| Michigan (APIS) | 9388 schede; 3863 con immagini | Sì, fino a 4586 × 7022 | Sì, manifesti | Non serve | Da confermare dal browser | Pubblico dominio («No Copyright») | Dentro (strumenti da confermare dal browser) |
| Berkeley (Tebtunis, APIS) | 11.122 schede | Sì, alta risoluzione | Sì, manifesti e Image API | Non serve | Sì | Uso libero del materiale di pubblico dominio | Dentro, con strumenti |
| Duke | 1785 schede; 1750 con immagini | Sì, ma piccole (GIF a 150 dpi) | No | Sì, indirizzi fissi | Sì | Solo ricerca e didattica | Dentro, con strumenti (immagini piccole) |
| Yale (Beinecke) | 6911 schede; 6326 con immagini | Sì, alta risoluzione | Sì, manifesti e Image API | Non serve | Sì | Accesso pubblico (da rileggere caso per caso) | Dentro, con strumenti |
| Columbia | 5780 schede | No: i vecchi indirizzi danno errore | No | No | Non applicabile | Non applicabile | Fuori: immagini non più online |
| Princeton | Circa 600 | Sì | Sì (server iiif-cloud) | Non serve | Da confermare dal browser | Da confermare dal browser | Dentro (da confermare dal browser) |
| Oxyrhynchus (Oxford, P.Oxy.) | 3806 voci online | Sì | No | Sì, tecnicamente | No (sul file finale) | «In Copyright», riproduzione a pagamento (EES) | Fuori: diritti riservati, serve permesso EES |
| PSI Firenze (PSIonline) | Circa 2200 testi con immagine | Sì, buona risoluzione | No | Sì, indirizzi fissi | No | «Vietata ogni ulteriore riproduzione» | Fuori: riproduzione vietata senza permesso scritto |
| Berlino (BerlPap) | Circa 9400 schede | Sì, 600 dpi | No (solo METS per il DFG-Viewer) | Sì, indirizzi fissi | No | Solo studio, non pubblicare | Fuori: vietato ripubblicare, serve permesso |
| Vienna (ÖNB) | Almeno 4800 testi con immagine | Sì | Sì | Non serve | Da confermare dal browser | Uso non commerciale | Dentro (da confermare dal browser; licenza non commerciale) |
| Heidelberg | Circa 4680, già nel catalogo | Sì, ma piccole (per esempio 274 × 520) | Sì | Non serve | Sì | Pubblicazione solo con permesso | Dentro, con strumenti (già dentro) |
| Colonia (Kölner Papyri) | 4485 oggetti | Sì, alta risoluzione | Solo Image API, senza manifesti | Sì | No, ma la licenza permette la copia | CC BY 4.0 | Dentro, con strumenti se copiamo le immagini |
| Ercolano (Napoli, Chartes) | Circa 1800 rotoli (stima, non verificata) | Poche foto piccole | No | Tecnicamente sì | No | «All Rights Reserved» | Fuori: diritti riservati, immagini piccole |
| British Library | Circa 2600 testi con link | Non raggiungibili | Spento dal 2023 | No | Non applicabile | Non applicabile | Fuori: servizio immagini ancora spento |
| Leiden (Istituto papirologico) | 199 schede | No: erano su papyri.info, tolte | No | No | Non applicabile | Non applicabile | Fuori: immagini non più online |
| Strasburgo (BNU) | Non verificato | Non verificato | Forse (Numistral) | Non verificato | Da confermare dal browser | Non verificata | Fuori per ora: server blocca, da riprovare |
| Ginevra | Circa 220 testi con link | Non verificabile | Non verificato | Non verificato | Non verificato | Non verificata | Fuori per ora: blocco anti-robot, da riprovare |
| Cairo | Non verificato | Nessuna raccolta online trovata | No | No | Non applicabile | Non applicabile | Fuori: nessuna immagine online trovata |
| Sorbona (Institut de papyrologie) | Circa 300 testi con link | No: i vecchi link portano alla home | No | No | Non applicabile | Non applicabile | Fuori: immagini non più online |
| Würzburg | Non verificato | Nessuna raccolta raggiungibile | No | No | Non applicabile | Non applicabile | Fuori: server in errore |
| Graz | Non verificato | Nessuna raccolta trovata | No | No | Non applicabile | Non applicabile | Fuori: vecchio catalogo sparito |
| Lund | 829 schede | Poche, su Alvin (blocco anti-robot) | Non verificato | Non verificato | Non verificato | Non verificata | Fuori per ora: immagini sparite o bloccate |
| Copenaghen | Non verificato | No: i vecchi link danno errore 404 | No | No | Non applicabile | Non applicabile | Fuori: immagini non più online |

## Fonte per fonte

### papyri.info (DDbDP, HGV, APIS, DCLP)

I dati si scaricano tutti insieme dal repository GitHub `papyri/idp.data`.
Si scarica senza problemi con git (per la verifica solo le cartelle delle schede).
Contenuto: 38.530 schede APIS (28 raccolte), 14.847 schede DCLP (papiri letterari), 68.022 schede HGV (papiri documentari, 66.642 testi diversi).
Le schede DCLP hanno quasi sempre il numero LDAB (14.745) e l'autore (per esempio Omero 1761, Euripide 214, Demostene 204, Menandro 174): bastano per riconoscere i papiri letterari e gli autori, senza Trismegistos.
Licenza dei dati: CC BY 3.0 (scritto nel README del repository).
Le schede contengono i link alle immagini delle raccolte (36.115 schede HGV e 1701 schede DCLP ne hanno almeno uno).
Le immagini ospitate da papyri.info stesso non ci sono più: l'indirizzo `https://papyri.info/images/14/berenike.apis.122.f.0.600` e `https://papyri.info/images/fb/AP01122a` rispondono «410, eliminato».
Le pagine del sito sono dietro un controllo anti-robot (Anubis): le richieste dai server ricevono solo la pagina di verifica.
Nessun IIIF (`https://papyri.info/iiif` dà 404).
robots.txt: vieta solo `/editor/`.
Fonti: `https://github.com/papyri/idp.data`, `https://raw.githubusercontent.com/papyri/idp.data/master/README.md`, `https://papyri.info/robots.txt`.

Nota in più: Oslo (dentro APIS, 150 schede con immagini) ha immagini a buona risoluzione con CORS aperto (`https://ub-media.uio.no/OPES/jpg/469r.jpg`, 2,4 MB). Licenza non verificata.

### Trismegistos e LDAB

Le richieste dai server non raggiungono il sito: `https://www.trismegistos.org/`, `/ldab/` e `/robots.txt` chiudono la connessione.
Dal 2020 Trismegistos è in abbonamento: molte ricerche sono solo per le istituzioni che pagano (Wikipedia).
La pagina dei servizi dati dice che i dati aperti sono CC BY-SA 4.0, ma offre solo strumenti di confronto tra numeri e luoghi, non un archivio scaricabile dei testi.
Non ha immagini.
Per riconoscere i papiri letterari basta DCLP, che contiene già numero TM, numero LDAB, autore e opera.
Fonti: `https://trismegistos.org/dataservices`, `https://en.wikipedia.org/wiki/Trismegistos`.

### Michigan

Alle richieste dai server il sito `quod.lib.umich.edu` risponde con il blocco anti-robot di Cloudflare (errore 403).
Provati: `http://images.umdl.umich.edu/a/apis/thumb/3/4/r/w34r.jpg` e `...getimage-idx?cc=apis&entryid=X-5385&viewid=W34R.TIF&quality=medium` (vanno su quod, poi 403).
Letta da un browser la scheda `https://quod.lib.umich.edu/a/apis/x-9818/3380R.TIF`: ha il manifesto IIIF `https://quod.lib.umich.edu/cgi/i/image/api/manifest/apis:9818`, immagini fino a 4586 × 7022, metadati completi (inventario, data, provenienza, genere, lingua).
Licenza: «No Copyright», uso libero anche commerciale.
Nel repository di papyri.info: 9388 schede Michigan, 3863 con immagini.
Il CORS va provato da un browser.

### Berkeley (Tebtunis)

Tutto raggiungibile.
OAI-PMH: `https://digicoll.lib.berkeley.edu/oai2d`, insieme `apis` con 11.122 schede.
Manifesti IIIF: `https://digicoll.lib.berkeley.edu/record/<numero>/export/iiif_manifest`.
Provati: record 231426 (P.Tebt. III 819, immagine 1808 × 4511) e record 230942. Manifesto, info.json e immagine con CORS aperto (`*`).
Controllate 15 schede prese a caso: tutte con immagini.
Metadati: inventario, numero APIS, data, misure, pubblicazione, descrizione paleografica.
Licenza: uso libero del materiale di pubblico dominio.
robots.txt: 5 secondi tra le richieste; chiede di non leggere le esportazioni in massa (si usa l'OAI-PMH, il manifesto lo apre il browser di chi legge).

### Duke

Raggiungibile, CORS aperto (`*`).
Provati: `https://library.duke.edu/papyrus/images/72dpi/141-at72.gif`, `https://library.duke.edu/papyrus/images/150dpi/1366v-at150.gif` (150 × 432 pixel), scheda `https://library.duke.edu/papyrus/records/822.html`.
Immagini piccole: GIF a 72 e 150 dpi degli anni Novanta. Nessun IIIF.
Gli indirizzi sono fissi (`/papyrus/images/150dpi/<inventario>-at150.gif`): il manifesto lo possiamo scrivere noi.
Nel repository di papyri.info: 1785 schede, 1750 con immagini.
Condizioni: «solo per ricerca e didattica»; per riprodurre serve permesso. Quindi collegamento diretto sì, copia sui nostri server no.

### Yale (Beinecke)

Raggiungibile.
Il link nelle schede APIS (`http://hdl.handle.net/10079/digcoll/2767231`) porta al numero dell'oggetto (33176873).
Manifesto IIIF: `https://collections.library.yale.edu/manifests/<numero>`.
Provati: 33176873 (immagine 5732 × 4858) e 33171790. Manifesto, info.json e immagine con CORS aperto (`*`).
Metadati nel manifesto: data, descrizione, lingua, inventario. C'è anche un OAI-PMH (`https://collections.library.yale.edu/catalog/oai`).
Nel repository di papyri.info: 6911 schede, 6326 con immagini.
Accesso «Public». La licenza precisa non è scritta nel manifesto: va riletta.
robots.txt: vieta ai programmi di raccolta la cartella dei manifesti. Quindi la raccolta usa le schede APIS e l'OAI-PMH; il manifesto lo apre solo il browser di chi legge.
La pagina di ricerca risponde alle richieste dai server con un blocco (202).

### Columbia

Le immagini non sono più online.
Provati: `http://wwwapp.cc.columbia.edu/ldpd/app/apis/item?mode=item&key=columbia.apis.p123` (404) e `http://www.columbia.edu/cgi-bin/dlo?obj=princeton.apis.p564` (403).
Le immagini ospitate da papyri.info sono state tolte (410).
La biblioteca digitale `https://dlc.library.columbia.edu` non trova nessun papiro.
Nel repository di papyri.info: 5780 schede.

### Princeton

Le richieste dai server non riescono a verificare il certificato di `dpul.princeton.edu` e `figgy.princeton.edu`.
Da un browser: la raccolta `https://dpul.princeton.edu/papyri` ha circa 600 oggetti (537 in greco) e immagini IIIF su `iiif-cloud.princeton.edu`.
Le singole schede vietano la lettura ai robot.
Licenza e CORS: da provare dal browser.

### Oxyrhynchus (Oxford)

Il catalogo nuovo è su Figshare (`portal.sds.ox.ac.uk`, gruppo 35280). La pagina blocca le richieste dai server, ma l'API di Figshare risponde.
Conteggio con l'API: 3806 voci.
Provati: voce 21133414 (P.Oxy. XVI 1967, immagine di 120 KB) e una voce di P.Oxy. LXVI 4531 (immagini fino a 4 MB).
Metadati: genere, provenienza, data, materiale, lingua, editore.
Licenza: «In Copyright», riproduzioni a pagamento presso la Egypt Exploration Society.
Il file finale (su Amazon S3) non manda il CORS.
Fonti: `https://api.figshare.com/v2/articles/21133414`, `https://api.figshare.com/v2/articles?group=35280`.

### PSI Firenze (PSIonline)

Raggiungibile, robots.txt senza limiti.
Provati: `https://psi-online.it/documents/psi;6;589` (immagine `https://psi-online.it/images/orig/PSI%20VI%20589%20r.jpg`, 680 KB) e `https://psi-online.it/documents/psi;7;863` (tre immagini).
Metadati ottimi: inventario, tipologia, provenienza, datazione, contenuto, numero Trismegistos.
Indirizzi fissi, ma nessun CORS e nessun IIIF.
La pagina dei diritti (`https://psi-online.it/rightpermission`) dice per Laurenziana, Istituto Vitelli, Padova e Praga: «è vietata ogni ulteriore riproduzione con qualsiasi mezzo». Serve un permesso scritto dei direttori.
Testi PSI con immagine collegati da papyri.info: circa 2200.

### Berlino (BerlPap)

Raggiungibile.
Provati: `https://berlpap.smb.museum/00965/` (immagine `https://berlpap.smb.museum/Original/P_01651_S1_001.jpg`, 600 dpi) e `https://berlpap.smb.museum/01211/`.
Metadati: titolo, datazione, provenienza, pubblicazione. Ogni scheda ha un file METS per il DFG-Viewer (`?xml=tei`), non un manifesto IIIF.
Indirizzi fissi: il manifesto lo potremmo scrivere noi. Nessun CORS.
La mappa del sito elenca circa 9400 schede.
Condizioni (`https://berlpap.smb.museum/nutzungshinweise/`): immagini solo per lo studio, «non devono essere pubblicate»; per l'uso commerciale serve BPK.

### Vienna (ÖNB)

Le richieste dai server non entrano: `https://data.onb.ac.at/rec/RZ00005797` chiude la connessione (lo stesso già annotato nel registro delle biblioteche).
Da un browser (`https://iiif.onb.ac.at/api/`): esistono manifesti IIIF e Image API anche per i papiri; licenza «No Copyright, solo uso non commerciale».
Testi viennesi con immagine collegati da papyri.info: circa 4800 (la raccolta è molto più grande).
Da provare dal browser: indirizzo del manifesto per un papiro e CORS.
La licenza è solo per uso non commerciale.

### Heidelberg

È già nel catalogo, dalla raccolta OAI della biblioteca: circa 4680 papiri e ostraca (3175 greci, 1331 copti, gli altri demotici, latini, pahlavi, ebraici). Altri 92 papiri sono già dentro dalla Bayerische Staatsbibliothek.
Provati: manifesti di `p_g_6` e `p_g_1191`, CORS aperto (`*`).
Le immagini pubbliche sono piccole: per esempio 274 × 520 pixel.
Per pubblicare serve il permesso dell'Istituto di papirologia.

### Colonia (Kölner Papyri)

Raggiungibile.
Provati: `https://papyri.uni-koeln.de/stueck/tm2482` (immagine 1761 × 5375) e `https://papyri.uni-koeln.de/stueck/tm2837`.
Ogni immagine ha un servizio IIIF Image API (per esempio `https://papyri.uni-koeln.de/stueck/tm2482/iiif/00023/P.inv.%2000023r.jpg.ttif/info.json`), ma non c'è il manifesto: lo scriviamo noi leggendo la scheda.
Nessun CORS.
Licenza CC BY 4.0: possiamo copiare le immagini sui nostri server, e così gli strumenti funzionano.
4485 oggetti; scheda scaricabile in EpiDoc (`?format=epidoc`).
robots.txt: 5 secondi tra le richieste.

### Ercolano (Napoli)

Il catalogo Chartes (`https://www.chartes.it`) è del CISPE: «All Rights Reserved».
Provata `https://www.chartes.it/images/photo/PHerc%201558-Cornice%203-09702-1000nmS40%7BOGU%7D.jpg`: immagine piccola (62 KB), nessun CORS.
La Biblioteca Nazionale di Napoli ha un Image API con CORS aperto (`https://dl.bnnonline.it/iiif-imgsrv/1503/.../info.json`, 3360 × 4778), ma le immagini collegate sono i disegni ottocenteschi, non le foto dei papiri. Il suo robots.txt vieta quasi tutto.
Il progetto di Würzburg pubblica le tavole a stampa dei Volumina Herculanensia (`https://www.epikur-wuerzburg.de/vh2/VH2_08_101.jpg`): anche queste sono riproduzioni a stampa, non foto, e senza CORS.

### British Library

Ancora fuori.
`https://iiif.bl.uk/` risponde 403; `https://access.bl.uk/item/viewer/ark:/81055/vdc_100147475527.0x000001` viene respinto (502); il vecchio link delle schede porta alla pagina generica delle collezioni.
Testi della British Library collegati da papyri.info: circa 2600.

### Leiden

Le 199 schede dell'Istituto papirologico avevano le immagini su papyri.info: tolte (410).
Leiden Digital Collections non dà immagini di papiri e nel nostro catalogo di Leida ci sono solo due papiri arabi.

### Strasburgo

Le copie digitali della BNU stanno su Numistral, che respinge le richieste dai server come Gallica.
Non si è potuto verificare se i papiri sono digitalizzati. Da riprovare dal browser.

### Ginevra

`https://archives.bge-geneve.ch/ark:/17786/vtaeb4a5e9ae3407770` risponde con il blocco anti-robot (Anubis).
Il vecchio visore `http://www.ville-ge.ch/musinfo/imageZoom/?iip=bgeiip/papyrus/pgen406-ri.ptif` risponde 503.
Da riprovare dal browser. I papiri Bodmer di Ginevra non sono in e-codices come papiri (nel catalogo c'è solo un frammento latino).

### Cairo

Nessuna raccolta online di immagini trovata.
Le schede di papyri.info citano i papiri del Museo Egizio solo con il numero d'inventario.

### Sorbona

I 464 link alle foto (per esempio `http://www.papyrologie.paris-sorbonne.fr/photos/PSorbiii/Sorb111.jpg`) portano alla home del nuovo sito, che poi chiude la connessione.
Le immagini su Nakala collegate da papyri.info sono quasi tutte ostraca di Mons Claudianus (IFAO), non papiri della Sorbona; e Nakala respinge le richieste dai server.

### Würzburg

`http://papyri-wuerzburg.dl.uni-leipzig.de/` risponde con errore 500.
Il Papyrusportal (`https://papyri.uni-leipzig.de`) chiede una prova anti-robot.

### Graz

Il vecchio catalogo `http://sosa2.uni-graz.at` non esiste più (indirizzo non trovato). Nessuna raccolta online trovata.

### Lund

Le immagini APIS erano su papyri.info: tolte (410).
Alcune schede rimandano ad Alvin (`http://urn.kb.se/resolve?urn=urn:nbn:se:alvin:portal:record-265465`), che blocca le richieste dai server (Anubis). Da riprovare dal browser.

### Copenaghen

Provato `http://www.hum.ku.dk/cni/papcoll/pc51.jpg`: errore 404. Nessuna raccolta nuova trovata.

## Stima totale

Questi numeri contano i papiri (o le schede) con immagine.

**Dentro, con strumenti di inchiostro: circa 28.300.**

- Berkeley: circa 11.100
- Yale: circa 6300
- Heidelberg: circa 4680 (già nel catalogo)
- Colonia: circa 4500 (solo se copiamo le immagini sui nostri server)
- Duke: circa 1750 (immagini piccole)

**Dentro, ma strumenti da confermare dal browser: circa 9300.**

- Michigan: circa 3900 (licenza libera, manifesti pronti)
- Vienna: almeno 4800 (licenza non commerciale)
- Princeton: circa 600

**Fuori: almeno 27.000.**

- Berlino: circa 9400 (vietato ripubblicare)
- Oxyrhynchus: 3806 (diritti riservati)
- British Library: circa 2600 (servizio spento)
- PSI Firenze: circa 2200 (riproduzione vietata)
- Ercolano: circa 1800 rotoli (diritti riservati; numero stimato)
- Columbia: 5780 schede (immagini non più online)
- Lund, Sorbona, Ginevra, Leiden: circa 1600 (immagini sparite o bloccate)
- Strasburgo, Cairo, Würzburg, Graz, Copenaghen: numero non verificabile

Per Berlino, PSI e Oxyrhynchus la tecnica funzionerebbe: manca solo il permesso. Con un permesso scritto potrebbero entrare.
