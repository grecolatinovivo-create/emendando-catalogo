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
Codici nel catalogo, in tutto: **56.874**, di cui **8692** con almeno un autore riconosciuto.

| Biblioteca | Città | Codici totali | Di cui con autori riconosciuti | Lingue | Avanzamento della lettura | Come si aggiorna | Ultimo aggiornamento | Ultima raccolta |
|---|---|---|---|---|---|---|---|---|
| Universitätsbibliothek Heidelberg | Heidelberg | 7781 | 320 | greco 3359, tedesco 1472, copto 1368, altre 1978 | schede lette tutte (7781); indici 801 su 1238 | ogni notte, da sola | 2026-10-24 | — |
| e-codices (biblioteche svizzere: San Gallo, Einsiedeln, Bodmer e altre) | Svizzera | 2745 | 1032 | latino 2043, tedesco 674, francese 235, altre 417 | schede lette tutte (2745 schede) | ogni notte, da sola | 2026-10-24 | — |
| Bayerische Staatsbibliothek | Monaco di Baviera | 28.785 | 2214 | tedesco 11.319, latino 8472, non indicata 5804, altre 4411 | schede lette tutte (29.752 schede) | ogni notte, da sola | 2026-10-24 | — |
| Staatsbibliothek zu Berlin | Berlino | 3296 | 269 | tedesco 1597, non indicata 734, latino 714, altre 390 | schede lette tutte (3296 schede) | ogni notte, da sola | 2026-10-24 | riuscita |
| Bodleian Libraries e college | Oxford | 200 | 97 | latino 195, inglese 15, francese 8, altre 15 | 588 schede lette su 3367; a riprese, ogni notte: mancano circa 3 notti | ogni notte, da sola | 2026-10-24 | — |
| Bibliothèque nationale de France (Gallica) | Parigi | 1892 | 1600 | latino 1892 | solo i fondi latini (raccolta dal browser del 2026-10-24): per avere tutti i manoscritti va lanciato scripts/browser/gallica.js | va rifatta a mano dal browser (ultima raccolta: 2026-10-24) | 2026-10-24 | — |
| Biblioteca Medicea Laurenziana | Firenze | 4353 | 2206 | non indicata 3614, latino 725, italiano 5, altre 9 | schede lette tutte (4353 codici) | ogni notte, da sola | 2026-10-24 | — |
| Universiteitsbibliotheek Leiden (manoscritti, con i Vossiani; Bibliotheca Neerlandica Manuscripta) | Leida | 6226 | 751 | non indicata 2889, nederlandese 2337, latino 634, altre 366 | schede lette tutte (6226 codici) | ogni notte, da sola | 2026-10-24 | riuscita |
| Herzog August Bibliothek (dati dal Handschriftenportal) | Wolfenbüttel | 1531 | 141 | non indicata 1334, latino 96, tedesco 76, altre 25 | codici digitalizzati letti tutti (1531 su 1534) | ogni notte, da sola | 2026-10-24 | riuscita |
| Biblioteca Apostolica Vaticana | Città del Vaticano | 65 | 62 | latino 65 | 65 codici letti; fondo in corso: Pal. lat. (dal n. 1536), tratto 4 di 40; restano circa 50.246 segnature da provare, cioè circa 8 giorni (un manifesto ogni 10 secondi, come chiede la biblioteca) | ogni 3 ore, da sola | 2026-10-24 | — |
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
| Harvard (Houghton Library) | Cambridge, Massachusetts | da verificare | |
| Yale (Beinecke Library) | New Haven | da verificare | |
| Walters Art Museum | Baltimora | da verificare | |
| Princeton University Library | Princeton | da verificare | |
| Det Kongelige Bibliotek | Copenaghen | da verificare | |
| Koninklijke Bibliotheek (KB) | L'Aia | da verificare | |
| Uppsala universitetsbibliotek | Uppsala | da verificare | |
| Biblioteka Jagiellońska | Cracovia | da verificare | |

## Non raggiungibili

| Biblioteca | Città | Stato | Perché |
|---|---|---|---|
| Österreichische Nationalbibliothek (ÖNB) | Vienna | non si può (per ora) | I server delle copie digitali (iiif.onb.ac.at, digital.onb.ac.at, onb.digital, data.onb.ac.at) chiudono la connessione quando la richiesta arriva da un server (prova di ottobre 2026), come Gallica. Anche manuscripta.at risponde «accesso negato». Il catalogo (OAI-PMH di Alma) risponde, ma non ha un insieme dei soli manoscritti medievali: l'insieme dei manoscritti (HANNA) mescola lettere, lasciti e autografi, centinaia di migliaia di schede, e l'indirizzo del manifesto IIIF non si può controllare. Strada possibile: raccolta dal browser, come per Gallica. |
| British Library | Londra | non si può | Dopo l'attacco informatico del 2023 i dati IIIF rispondono «accesso negato», anche dal browser (prova di ottobre 2026). Si riprova quando il servizio torna. |
