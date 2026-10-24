# Catalogo dei manoscritti di Emendando

Catalogo aperto dei manoscritti digitalizzati (IIIF) che contengono testi latini classici e tardoantichi, raccolto per [Emendando](https://www.emendando.com).

Ogni voce indica biblioteca, città, segnatura, datazione, contenuto, autori e opere riconosciuti (con il passo dei metadati che li ha fatti riconoscere), il manifesto IIIF e la pagina del codice presso la biblioteca.

## File

- `data/manoscritti.json`: il catalogo. Indirizzo diretto: `https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/main/data/manoscritti.json`
- `data/autori.json`: lista curata degli autori latini, con varianti del nome e titoli delle opere. Entrano nel catalogo solo i codici con almeno un autore della lista.
- `data/vaticana.json`: stato e cursore della scansione della Biblioteca Apostolica Vaticana.
- `data/bodleian.json`: stato della scansione dei manifesti della Bodleian (metadati dei codici latini già letti).
- `data/heidelberg-indici.json`: indici dei contenuti delle miscellanee di Heidelberg (titoli delle sezioni dei manifesti IIIF).
- `scripts/`: raccolta (`raccogli.mjs`), richieste di rete (`rete.mjs`), riconoscimento degli autori (`riconosci.mjs`), fonti (`fonti/`).

## Fonti

- Universitätsbibliothek Heidelberg: OAI-PMH, insieme `handschriften`.
- e-codices (Biblioteca virtuale dei manoscritti in Svizzera): OAI-PMH, insieme `all`.
- Bayerische Staatsbibliothek: OAI-PMH, insieme `cerl`, solo segnature Clm.
- Universitätsbibliothek Heidelberg, miscellanee: per i codici latini che la descrizione OAI non fa riconoscere (prima quelli descritti in modo generico, «Sammelhandschrift»), si legge il manifesto IIIF e si usano i titoli delle sezioni («structures») come indice dei contenuti. Nel catalogo la corrispondenza comincia con «indice:».
- Bodleian Libraries, Oxford: collezione IIIF «Western Medieval Manuscripts» (`iiif.bodleian.ox.ac.uk/iiif/collection/western-medieval-manuscripts`, Bodleian e college); di ogni manifesto si legge solo l'inizio con i metadati (Author, Title, Language, Date Statement, Contents). La lettura avanza ogni giorno dal punto in cui si era fermata.
- Bibliothèque nationale de France (Gallica): interfaccia SRU, manoscritti dei fondi Latin e Nouvelles acquisitions latines, manifesti IIIF di Gallica. Gallica è protetta da Cloudflare: se la richiesta viene respinta, la fonte risulta in errore e restano le voci precedenti.
- Biblioteca Apostolica Vaticana: solo i manifesti IIIF (`digi.vatlib.it/iiif/MSS_<segnatura>/manifest.json`), letti uno alla volta e solo nella parte iniziale con i metadati.

## Rispetto dei limiti delle biblioteche

- User-agent identificativo: `Emendando catalogo (https://www.emendando.com; https://github.com/grecolatinovivo-create/emendando-catalogo)`.
- Richieste in serie, mai in parallelo, con una pausa di almeno 1,5 secondi per server e attesa crescente in caso di errore o di risposta 429.
- Gallica: 3 secondi tra una richiesta e l'altra. Bodleian: il robots.txt di Digital Bodleian non pone limiti ai manifesti; si legge un manifesto alla volta e se ne scarica solo l'inizio.
- Vaticana: il robots.txt chiede 10 secondi tra una richiesta e l'altra e vieta ricerca e schede; si rispetta la pausa di 10 secondi e si leggono solo i manifesti IIIF.
- Le raccolte OAI-PMH si fanno una volta al giorno e una raccolta completa si riusa per 6 giorni.

## Fonti non incluse

- Biblioteca Medicea Laurenziana (Teca digitale, `tecadigitale.bmlonline.it`): non espone un elenco dei manifesti IIIF né un'interfaccia OAI documentata, e dall'ambiente di raccolta non è raggiungibile; i suoi manifesti circolano tramite Biblissima, anch'essa non raggiungibile. Da riconsiderare se la Teca pubblica un elenco stabile.
- British Library: dopo l'attacco informatico del 2023 gli indirizzi IIIF (`iiif.bl.uk`, `bl.digirati.io`) rispondono «accesso negato» e il visore provvisorio dei manoscritti non offre manifesti né metadati scaricabili. Da riconsiderare quando il servizio IIIF torna disponibile.

## Aggiornamento

GitHub Actions (`.github/workflows/raccolta.yml`) ogni 3 ore: la Vaticana avanza ogni volta dal punto in cui si era fermata (circa 160 minuti, quasi 1000 manifesti per esecuzione); Heidelberg (con gli indici delle miscellanee, 20 minuti), e-codices, BSB (40 minuti ciascuna), Bodleian (45 minuti) e Gallica (25 minuti) solo nell'esecuzione delle 03 UTC; la Vaticana usa il tempo che resta. I dati si salvano con un commit solo se cambiano. Due raccolte non girano mai insieme.

Per rilanciare a mano: scheda Actions, «Raccolta del catalogo», Run workflow (si possono scegliere fonti e minuti per la Vaticana).

In locale (Node 20 o successivo, nessuna dipendenza):

```
node scripts/raccogli.mjs --fonti=heidelberg,ecodices,bsb,bodleian,gallica,vaticana --vaticana-minuti=20 --bodleian-minuti=30
node scripts/raccogli.mjs --solo-costruisci   # nessuna richiesta: ricostruisce dai dati già raccolti
node --test tests/catalogo.test.js
```

## Diritti

Il codice è distribuito con licenza MIT, i dati del catalogo con CC0 1.0 (vedi `LICENSE`). I metadati vengono dalle biblioteche; il catalogo contiene solo riferimenti (segnature, descrizioni brevi, indirizzi dei manifesti e delle pagine). Le immagini dei manoscritti restano delle biblioteche che le conservano e le pubblicano, con i loro diritti e le loro condizioni d'uso, indicate per ogni codice nel campo `licenza`.
