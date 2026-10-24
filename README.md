# Catalogo dei manoscritti di Emendando

Catalogo aperto dei manoscritti digitalizzati (IIIF) che contengono testi latini classici e tardoantichi, raccolto per [Emendando](https://www.emendando.com).

Ogni voce indica biblioteca, città, segnatura, datazione, contenuto, autori e opere riconosciuti (con il passo dei metadati che li ha fatti riconoscere), il manifesto IIIF e la pagina del codice presso la biblioteca.

## File

- `data/manoscritti.json`: il catalogo. Indirizzo diretto: `https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/main/data/manoscritti.json`
- `data/autori.json`: lista curata degli autori latini, con varianti del nome e titoli delle opere. Entrano nel catalogo solo i codici con almeno un autore della lista.
- `data/vaticana.json`: stato e cursore della scansione della Biblioteca Apostolica Vaticana.
- `scripts/`: raccolta (`raccogli.mjs`), richieste di rete (`rete.mjs`), riconoscimento degli autori (`riconosci.mjs`), fonti (`fonti/`).

## Fonti

- Universitätsbibliothek Heidelberg: OAI-PMH, insieme `handschriften`.
- e-codices (Biblioteca virtuale dei manoscritti in Svizzera): OAI-PMH, insieme `all`.
- Bayerische Staatsbibliothek: OAI-PMH, insieme `cerl`, solo segnature Clm.
- Biblioteca Apostolica Vaticana: solo i manifesti IIIF (`digi.vatlib.it/iiif/MSS_<segnatura>/manifest.json`), letti uno alla volta e solo nella parte iniziale con i metadati.

## Rispetto dei limiti delle biblioteche

- User-agent identificativo: `Emendando catalogo (https://www.emendando.com; https://github.com/grecolatinovivo-create/emendando-catalogo)`.
- Richieste in serie, mai in parallelo, con una pausa di almeno 1,5 secondi per server e attesa crescente in caso di errore o di risposta 429.
- Vaticana: il robots.txt chiede 10 secondi tra una richiesta e l'altra e vieta ricerca e schede; si rispetta la pausa di 10 secondi e si leggono solo i manifesti IIIF.
- Le raccolte OAI-PMH si fanno una volta al giorno e una raccolta completa si riusa per 6 giorni.

## Aggiornamento

GitHub Actions (`.github/workflows/raccolta.yml`) ogni 3 ore: la Vaticana avanza ogni volta dal punto in cui si era fermata (circa 160 minuti, quasi 1000 manifesti per esecuzione); Heidelberg, e-codices e BSB solo nell'esecuzione delle 03 UTC. I dati si salvano con un commit solo se cambiano. Due raccolte non girano mai insieme.

Per rilanciare a mano: scheda Actions, «Raccolta del catalogo», Run workflow (si possono scegliere fonti e minuti per la Vaticana).

In locale (Node 20 o successivo, nessuna dipendenza):

```
node scripts/raccogli.mjs --fonti=heidelberg,ecodices,bsb,vaticana --vaticana-minuti=20
node scripts/raccogli.mjs --solo-costruisci   # nessuna richiesta: ricostruisce dai dati già raccolti
node --test tests/catalogo.test.js
```

## Diritti

Il codice è distribuito con licenza MIT, i dati del catalogo con CC0 1.0 (vedi `LICENSE`). I metadati vengono dalle biblioteche; il catalogo contiene solo riferimenti (segnature, descrizioni brevi, indirizzi dei manifesti e delle pagine). Le immagini dei manoscritti restano delle biblioteche che le conservano e le pubblicano, con i loro diritti e le loro condizioni d'uso, indicate per ogni codice nel campo `licenza`.
