# Biblioteche del catalogo

Questo documento dice quali biblioteche sono nel catalogo e a che punto siamo.

## Agganciate

Queste biblioteche sono già nel catalogo.
La tabella qui sotto si aggiorna da sola a ogni raccolta.

Come leggere le colonne:

- **Codici totali**: tutti i manoscritti digitalizzati della biblioteca letti finora, di ogni lingua ed epoca.
- **Di cui con autori riconosciuti**: quelli in cui si riconosce almeno un autore della lista (classici latini e greci, cristiani, medievali).
- **Lingue**: le tre lingue più frequenti, con il numero dei codici («non indicata»: la biblioteca non la dice e la segnatura non basta).
- **Avanzamento della lettura**: quante schede della biblioteca abbiamo già letto e, per le fonti lette a riprese, quanto manca.
- **Come si aggiorna**: se la raccolta parte da sola oppure va rifatta a mano dal browser.
- **Ultimo aggiornamento**: il giorno dell'ultima raccolta riuscita.
- **Ultima raccolta**: com'è andata l'ultima volta.

<!-- inizio automatico -->
Codici nel catalogo, in tutto: **57.688**, di cui **8834** con almeno un autore riconosciuto.

| Biblioteca | Città | Codici totali | Di cui con autori riconosciuti | Lingue | Avanzamento della lettura | Come si aggiorna | Ultimo aggiornamento | Ultima raccolta |
|---|---|---|---|---|---|---|---|---|
| Universitätsbibliothek Heidelberg | Heidelberg | 7781 | 320 | greco 3359, tedesco 1472, copto 1368, altre 1978 | indici 801 | ogni notte, da sola | 2026-10-24 | — |
| e-codices (biblioteche svizzere: San Gallo, Einsiedeln, Bodmer e altre) | Svizzera | 2745 | 1032 | latino 2043, tedesco 674, francese 235, altre 417 | schede lette tutte ogni 6 giorni | ogni notte, da sola | — | — |
| Bayerische Staatsbibliothek | Monaco di Baviera | 28.785 | 2214 | tedesco 11.319, latino 8472, non indicata 5804, altre 4411 | schede lette tutte ogni 6 giorni | ogni notte, da sola | — | — |
| Staatsbibliothek zu Berlin | Berlino | 3296 | 269 | tedesco 1597, non indicata 734, latino 714, altre 390 | schede lette tutte ogni 6 giorni | ogni notte, da sola | 2026-10-24 | riuscita |
| Bodleian Libraries e college | Oxford | 200 | 97 | latino 195, inglese 15, francese 8, altre 15 | 588 schede lette su 3367; a riprese, ogni notte: mancano circa 3 notti | ogni notte, da sola | 2026-10-24 | — |
| Bibliothèque nationale de France (Gallica) | Parigi | 1892 | 1600 | latino 1892 | solo i fondi latini (raccolta dal browser del 2026-10-24): per avere tutti i manoscritti va lanciato scripts/browser/gallica.js | va rifatta a mano dal browser (ultima raccolta: 2026-10-24) | 2026-10-24 | — |
| Biblioteca Medicea Laurenziana | Firenze | 4353 | 2206 | non indicata 3614, latino 725, italiano 5, altre 9 | schede lette tutte (4353 codici) | ogni notte, da sola | 2026-10-24 | — |
| Universiteitsbibliotheek Leiden (manoscritti, con i Vossiani; Bibliotheca Neerlandica Manuscripta) | Leida | 6226 | 751 | non indicata 2889, nederlandese 2337, latino 634, altre 366 | schede lette tutte (6226 codici) | ogni notte, da sola | 2026-10-24 | riuscita |
| Herzog August Bibliothek (dati dal Handschriftenportal) | Wolfenbüttel | 1531 | 141 | non indicata 1334, latino 96, tedesco 76, altre 25 | codici digitalizzati letti tutti (1531 su 1534) | ogni notte, da sola | 2026-10-24 | riuscita |
| Biblioteca Apostolica Vaticana | Città del Vaticano | 879 | 204 | latino 876, francese 2, italiano 1 | 879 codici letti; fondo in corso: Urb. lat. (dal n. 472), tratto 6 di 40; restano circa 48.912 segnature da provare, cioè circa 8 giorni (un manifesto ogni 10 secondi, come chiede la biblioteca) | ogni 3 ore, da sola | 2026-10-24 | riuscita |
<!-- fine automatico -->

San Gallo, Einsiedeln e la Fondation Bodmer (Cologny) sono già dentro: arrivano dalla riga e-codices.

Tempi delle fonti lette a riprese:

- **Biblioteca Apostolica Vaticana**: la lettura è lunga. La biblioteca chiede 10 secondi tra una richiesta e l'altra, e ogni segnatura va provata una per una (circa 50.000 tra fondi latini, greci e orientali). Con una raccolta ogni 3 ore servono più o meno 8 giorni. L'ordine: prima i fondi latini già in corso, poi i greci, poi gli altri. La stima aggiornata è nella tabella.
- **Bodleian**: circa 10.600 manifesti, circa 1000 per notte: una decina di notti.
- **Leida**: circa 310 pagine dei risultati con 10 secondi di pausa; 15 minuti per notte: 4 o 5 notti per la prima raccolta completa.
- **Gallica**: la raccolta di tutti i manoscritti si fa dal browser con `scripts/browser/gallica.js` (vedi il README) e dura qualche ora; finché non si rifà, nel catalogo ci sono solo i codici dei fondi latini raccolti il 24 ottobre 2026.

## Da agganciare

Queste biblioteche non sono ancora nel catalogo.

Significato della colonna «Stato»:

- **da verificare**: non abbiamo ancora controllato come leggere i loro dati.
- **in lavorazione**: ci stiamo lavorando adesso.
- **agganciata**: è passata nella tabella in alto.
- **non si può**: c'è un motivo preciso, scritto accanto.

| Biblioteca | Città | Stato | Note |
|---|---|---|---|
| Biblioteca Ambrosiana | Milano | da verificare | |
| Biblioteca Nazionale Marciana | Venezia | da verificare | |
| Cambridge University Library e Parker Library | Cambridge | da verificare | |
| Staatsbibliothek Bamberg | Bamberga | da verificare | Possibile via Handschriftenportal (come Wolfenbüttel). |
| Badische Landesbibliothek | Karlsruhe | da verificare | Possibile via Handschriftenportal (come Wolfenbüttel). |
| Württembergische Landesbibliothek | Stoccarda | da verificare | Possibile via Handschriftenportal (come Wolfenbüttel). |
| Dombibliothek e biblioteche di Colonia (CEEC) | Colonia | da verificare | Possibile via Handschriftenportal (come Wolfenbüttel). |
| Stadtbibliothek Trier | Treviri | da verificare | Possibile via Handschriftenportal (come Wolfenbüttel). |
| Universitätsbibliothek Leipzig | Lipsia | da verificare | Possibile via Handschriftenportal (come Wolfenbüttel). |
| Biblioteca Nacional de España (BNE) | Madrid | da verificare | |
| Real Biblioteca del Monasterio de El Escorial | El Escorial | da verificare | |
| Det Kongelige Bibliotek | Copenaghen | da verificare | |
| Koninklijke Bibliotheek (KB) | L'Aia | da verificare | |
| Uppsala universitetsbibliotek | Uppsala | da verificare | |
| Biblioteka Jagiellońska | Cracovia | da verificare | |

### Fuori dall'Europa

Si agganciano dopo aver completato le biblioteche europee. L'ordine della tabella è l'ordine di priorità.

| Biblioteca | Città | Stato | Note |
|---|---|---|---|
| Harvard (Houghton Library) | Cambridge, Massachusetts (Stati Uniti) | da verificare | |
| Yale (Beinecke Library) | New Haven (Stati Uniti) | da verificare | |
| Walters Art Museum | Baltimora (Stati Uniti) | da verificare | |
| Princeton University Library | Princeton (Stati Uniti) | da verificare | |
| University of Pennsylvania (OPenn) | Filadelfia (Stati Uniti) | da verificare | |
| Morgan Library & Museum | New York (Stati Uniti) | da verificare | |
| Library of Congress | Washington (Stati Uniti) | da verificare | |
| Getty Research Institute e Getty Museum | Los Angeles (Stati Uniti) | da verificare | |
| Monastero di Santa Caterina del Sinai | Sinai (Egitto) | da verificare | Sinai Library Digitization Project con la UCLA; Sinai Palimpsests. |
| Hill Museum & Manuscript Library (vHMML) | Collegeville (Stati Uniti), fondi di Siria, Iraq, Libano, Etiopia, Mali (Timbuctù) | da verificare | Manoscritti siriaci, arabi, armeni, etiopici. |
| Qatar Digital Library | Doha (Qatar) | da verificare | |
| National Diet Library | Tokyo (Giappone) | da verificare | |
| Biblioteca nazionale cinese | Pechino (Cina) | da verificare | |
| Biblioteca nazionale coreana | Seul (Corea del Sud) | da verificare | |
| Biblioteca nazionale russa (RNB) e biblioteche di Mosca | San Pietroburgo, Mosca (Russia) | da verificare | Accesso dall'estero difficile. |

### Papiri (in attesa di decisione)

Per ora si aspetta: nessuna raccolta apposta di papiri. La scelta in attesa è tra entrare solo con le raccolte a licenza libera (circa 30.000 papiri) oppure con tutte quelle possibili. Per Berlino, PSI e Ossirinco servirebbe un permesso scritto. I papiri di Heidelberg sono già nel catalogo perché arrivano con la raccolta OAI della biblioteca. I dettagli della verifica (immagini, IIIF, CORS, licenze) sono in [PAPIRI.md](PAPIRI.md).

| Raccolta | Papiri con immagine | Stato | Note |
|---|---|---|---|
| Berkeley (Tebtunis) | circa 11.100 | dentro con strumenti | IIIF e CORS aperti, uso libero. |
| Yale (Beinecke) | circa 6300 | dentro con strumenti | IIIF e CORS aperti; licenza da rileggere caso per caso. |
| Heidelberg | circa 4700 | dentro con strumenti | Già nel catalogo; immagini pubbliche piccole; per pubblicare serve il permesso dell'Istituto di papirologia. |
| Colonia (Kölner Papyri) | circa 4500 | dentro con strumenti | Solo con la copia delle immagini sui nostri server (CC BY 4.0, niente CORS). |
| Duke | circa 1750 | dentro con strumenti | Immagini piccole; solo ricerca e didattica. |
| Michigan (APIS) | circa 3900 | da provare dal browser | Pubblico dominio, manifesti IIIF pronti; CORS da provare. |
| Vienna (ÖNB) | circa 4800 | da provare dal browser | Solo uso non commerciale. |
| Princeton | circa 600 | da provare dal browser | IIIF; licenza e CORS da provare. |
| Berlino (BerlPap) | circa 9400 | fuori | Vietato ripubblicare: serve un permesso scritto. |
| Ossirinco (Oxford, P.Oxy.) | circa 3800 | fuori | Diritti riservati (Egypt Exploration Society): serve un permesso scritto. |
| PSI Firenze (PSIonline) | circa 2200 | fuori | Riproduzione vietata senza permesso scritto. |
| Ercolano (Napoli) | circa 1800 rotoli | fuori | Diritti riservati, immagini piccole. |
| British Library | circa 2600 | fuori | Servizio delle immagini spento dal 2023. |
| Columbia, Leida, Lund, Sorbona, Ginevra | circa 7400 | fuori | Immagini non più online o bloccate. |

## Non raggiungibili

| Biblioteca | Città | Stato | Perché |
|---|---|---|---|
| Österreichische Nationalbibliothek (ÖNB) | Vienna | non si può (per ora) | I server delle copie digitali (iiif.onb.ac.at, digital.onb.ac.at, onb.digital, data.onb.ac.at) chiudono la connessione quando la richiesta arriva da un server (prova di ottobre 2026), come Gallica. Anche manuscripta.at risponde «accesso negato». Il catalogo (OAI-PMH di Alma) risponde, ma non ha un insieme dei soli manoscritti medievali: l'insieme dei manoscritti (HANNA) mescola lettere, lasciti e autografi, centinaia di migliaia di schede, e l'indirizzo del manifesto IIIF non si può controllare. Strada possibile: raccolta dal browser, come per Gallica. |
| British Library | Londra | non si può | Dopo l'attacco informatico del 2023 i dati IIIF rispondono «accesso negato», anche dal browser (prova di ottobre 2026). Si riprova quando il servizio torna. |
