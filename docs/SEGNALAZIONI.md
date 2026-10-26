# Codici che non si aprono: segnalazioni dal visore

Quando nel visore di Emendando un codice non si apre e compare il messaggio d'errore («L'immagine non è arrivata…», «L'elenco delle immagini non è arrivato…»), il sito manda da solo una segnalazione anonima. Le segnalazioni si raccolgono sul sito e il workflow [segnalazioni.yml](../.github/workflows/segnalazioni.yml) di questo repository le trasforma in issue con l'etichetta **da-risolvere**. Dal catalogo non si toglie nulla: i codici segnalati si sistemano.

## Come funziona

1. **Sito** (repository privato `emendando`). In `public/assets/foto.js` (visore) e `public/assets/sinossi.js` (confronto dei codici), nel punto in cui si mostra l'errore definitivo, cioè dopo che sono fallite tutte le riserve (immagine con CORS, immagine semplice, scaricamento dal server con `/api/commenta?immagine=`), parte `POST /api/accesso/io?segnala`: una sola volta per codice e pagina in ogni sessione del browser. Prima di mandarla il browser chiede al server del sito perché l'immagine non arriva (codice HTTP, pagina HTML al posto dell'immagine, tempo scaduto) oppure perché il manifesto non si legge (HTTP, JSON non valido, CORS).
2. **Dati della segnalazione**: voce del catalogo, segnatura, biblioteca, manifesto, indirizzo richiesto, origine (manifesto o immagine), tipo di errore, codice HTTP se noto, pagina, browser e sistema in forma ridotta («iOS Safari 18»). Nessun dato personale: niente email, nome o IP; la sessione serve solo al limite di 30 segnalazioni all'ora per persona (`lib/segnalazioni.js`).
3. **Archivio sul sito**: tabella `segnalazioni` (Neon), una riga per codice, pagina e tipo di errore, con conteggio, prima e ultima volta e stato (`aperta`, `verificata`, `risolta`). Una nuova segnalazione riapre la riga. Lettura: `GET /api/accesso/io?segnalazioni` con `Authorization: Bearer <LAVORAZIONE_TOKEN>`; cambio di stato: `POST` con `{ "azione": "segna", "ids": [...], "stato": "verificata" | "risolta" | "aperta", "esito": "..." }`.
4. **Workflow** (ogni 15 minuti e a mano, `scripts/segnalazioni.mjs`): legge le segnalazioni aperte; se non ce ne sono e nessuna issue va ricontrollata, esce in pochi secondi. Per ogni codice segnalato ricontrolla dal server, con una pausa di almeno 1,5 secondi per biblioteca (di più dove il robots.txt lo chiede) e al massimo 10 minuti per giro:
   - manifesto: risposta, JSON valido, pagine con immagini, intestazione `Access-Control-Allow-Origin`;
   - immagine (quella segnalata, oppure la prima del manifesto): risposta, tipo di file vero (byte iniziali), CORS, pagina HTML anti-robot al posto dell'immagine.
5. **Classi**: **rotto** (manifesto 404 o non valido, nessuna immagine, oggetto ritirato, server che non risponde), **bloccato per i browser** (manca CORS, filtro anti-robot, accesso negato), **momentaneo** (al ricontrollo si apre). Ogni caso ha una causa tecnica precisa (`manifesto-non-trovato`, `manifesto-senza-cors`, `immagine-antirobot`, …: elenco completo con le ipotesi di soluzione in `CAUSE` dentro `scripts/segnalazioni.mjs`).
6. **Issue**: una per biblioteca e per causa, aperta o aggiornata, con l'etichetta `da-risolvere`. Contiene la causa, l'ipotesi di soluzione, la fonte del catalogo, e per ogni codice voce, segnatura, pagina, manifesto, indirizzo dell'immagine, risultato del ricontrollo, numero di segnalazioni, date e browser. In fondo c'è un blocco di dati nascosto (`<!-- segnalazioni-dati: … -->`) che il workflow rilegge: non va modificato a mano.
7. **Chiusura automatica**: le issue aperte si ricontrollano al massimo una volta all'ora. I codici che si aprono di nuovo escono dalla issue e le loro segnalazioni diventano `risolta`; quando non resta nessun codice, la issue si chiude da sola con un commento. I «momentanei» non aprono issue: la segnalazione resta registrata come `verificata` e, se il codice torna a dare errore, la riga si riapre e si ricontrolla.

## Procedura per chi risolve

1. **Dove guardare.** Le issue aperte con l'etichetta [da-risolvere](../../../issues?q=is%3Aissue+is%3Aopen+label%3Ada-risolvere). Ogni issue ha già tutto: causa, ipotesi, codici con indirizzi e risultati. Lo stato riassunto per biblioteca è qui sotto.
2. **Ricontrollare a mano** un codice, dalla cartella di questo repository:
   ```
   node scripts/segnalazioni.mjs --controlla=<manifesto> --immagine=<indirizzo dell'immagine>
   ```
   (senza `--immagine` si prova la prima immagine del manifesto). Stampa stato, tipo, CORS, pagine, classe, causa e ipotesi. Un giro completo senza scrivere nulla: `node scripts/segnalazioni.mjs --prova` (serve `SEGNALAZIONI_TOKEN` per leggere dal sito).
3. **Dove si corregge**, secondo la causa:
   - problemi della fonte (manifesto spostato, nuovo indirizzo delle immagini, manifesto vuoto): `scripts/fonti/<fonte>.mjs` e `data/<fonte>.json` di questo repository, oppure `scripts/manifesti.mjs` per i manifesti scritti dal catalogo (ramo `manifesti`); poi la raccolta della fonte (workflow della sua corsia) ricostruisce le voci;
   - manifesti senza CORS: copia del manifesto nel ramo `manifesti` (come per LoC, NLG, Malatestiana), oppure una riserva del server per i manifesti nel visore;
   - immagini dietro filtro anti-robot o negate ai browser: nel sito privato, `public/assets/foto.js` (`viaServer`, `caricaImmagine`) e `public/assets/sinossi.js` (`VIA_SERVER`), facendo passare l'host dal server del sito fin dal primo foglio; il server è `lib/trascrivi.js` (`gestisciImmagine`);
   - lettura di forme nuove di manifesto: `leggiManifesto` in `public/assets/foto.js` del sito.
   I problemi di un'intera biblioteca (CORS, Anubis, cambio di indirizzi) si risolvono nella fonte o nel visore, mai togliendo i codici dal catalogo.
4. **Come chiudere la issue.** Dopo aver pubblicato la correzione, ricontrollare a mano uno o due codici della issue, poi chiuderla con un commento che dice cosa è cambiato e in quale commit. Se la correzione è nel visore e il ricontrollo dal server dà ancora lo stesso risultato (per esempio un filtro anti-robot che resta, ma ora il visore passa dal server), va chiusa a mano: il workflow non la chiuderebbe. Se il problema è della biblioteca e non si può correggere da qui (server spento da giorni), lasciare un commento con quello che si è verificato e lasciarla aperta: si chiuderà da sola quando i codici si apriranno.
5. **Segreto.** Il workflow legge le segnalazioni con il secret `LAVORAZIONE_TOKEN` di questo repository, lo stesso valore della variabile `LAVORAZIONE_TOKEN` del sito su Vercel. Se manca, il workflow lo scrive come avviso e non legge nulla.

## Stato

<!-- stato -->
Nessuna issue aperta: tutti i codici segnalati si aprono o sono già stati sistemati.
<!-- /stato -->
