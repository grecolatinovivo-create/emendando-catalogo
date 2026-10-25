# Catalogo dei manoscritti di Emendando

Catalogo aperto di tutti i manoscritti digitalizzati (IIIF) delle biblioteche agganciate, raccolto per [Emendando](https://www.emendando.com): greci, latini di ogni epoca (classici, patristici, medievali, umanistici, liturgici, documentari), volgari, orientali.

Ogni voce indica biblioteca, città, segnatura, datazione e secolo, lingue, contenuto, il manifesto IIIF e la pagina del codice presso la biblioteca. Gli autori e le opere riconosciuti (classici latini e greci, cristiani, medievali: `data/autori.json`) sono un'informazione in più, per cercare e filtrare, con il passo dei metadati che li ha fatti riconoscere; non decidono quali codici entrano.

## File

Il catalogo è diviso per fonte, perché comprende decine (e presto centinaia) di migliaia di voci:

- `data/catalogo/indice.json`: da leggere per primo. Elenco dei pezzi dell'indice, biblioteche, lingue, categorie di autori e autori con il numero dei codici, fonti con i loro prefissi e il numero dei pezzi delle voci. Indirizzo diretto: `https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/main/data/catalogo/indice.json`
- `data/catalogo/indice/<fonte>-<n>.json`: indice leggero, una riga per codice (al massimo 20.000 righe per pezzo). Campi della riga (in `indice.json`, «campi»): id, segnatura, biblioteca (posizione nell'elenco «biblioteche»), lingue (codici separati da virgola), primo e ultimo secolo, autori riconosciuti (id), titolo breve, opere riconosciute, sigla del Truculentus.
- `data/catalogo/voci/<fonte>-<n>.json`: voci complete (circa 800 per pezzo). Il pezzo di un codice si ricava dal suo id senza leggere altro: `n = fnv1a(id) % pezzi_voci` della sua fonte (FNV-1a a 32 bit sulle unità UTF-16 dell'id; la fonte si riconosce dal prefisso dell'id, vedi «prefissi»). Gli id non cambiano mai.
- `data/manoscritti.json`: formato precedente, per compatibilità: solo i codici con autori classici (latini o greci).
- `data/autori.json`: lista curata degli autori, con categoria (classico latino, classico greco, cristiano, medievale), lingua, varianti del nome (latine, greche in alfabeto greco, italiane, francesi, tedesche, inglesi) e titoli delle opere, esclusioni dei falsi positivi.
- `data/vaticana.json`, `data/bodleian.json`, `data/laurenziana.json`, `data/leiden.json`, `data/heidelberg-indici.json` e, per il Handschriftenportal, `data/wolfenbuettel.json`, `data/bamberga.json`, `data/karlsruhe.json`, `data/stoccarda.json`, `data/colonia.json`, `data/lipsia.json`; `data/yale.json`, `data/penn.json`: stati delle raccolte a riprese (si riprende da dove ci si era fermati).
- `data/gallica.json`: raccolta di Gallica fatta dal browser (vedi sotto).
- `data/raccolte.json`: data ed esito dell'ultima raccolta di ogni fonte (per il registro).
- `docs/BIBLIOTECHE.md`: registro delle biblioteche (agganciate, da agganciare, non raggiungibili). La tabella delle biblioteche agganciate (codici totali, di cui con autori riconosciuti, lingue, avanzamento con le stime dei tempi) si rigenera a ogni raccolta; il resto si scrive a mano.
- `scripts/`: raccolta (`raccogli.mjs`), scrittura del catalogo diviso (`costruisci.mjs`), lingue e secoli (`lingue.mjs`), registro (`registro.mjs`), richieste di rete (`rete.mjs`), riconoscimento degli autori (`riconosci.mjs`), fonti (`fonti/`), raccolta di Gallica dal browser (`browser/gallica.js`).

## Fonti

Da tutte le fonti entrano tutti i manoscritti, di ogni lingua e fondo; la lingua viene dai metadati della fonte (o, se mancano, dalla segnatura e dal titolo).

- Universitätsbibliothek Heidelberg: OAI-PMH, insieme `handschriften` (codici, papiri, documenti; fuori solo le opere della collezione Prinzhorn e i registri d'ingresso).
- e-codices (Biblioteca virtuale dei manoscritti in Svizzera): OAI-PMH, insieme `all`.
- Bayerische Staatsbibliothek: OAI-PMH, insieme `cerl`, tutti i fondi (Clm, Cgm, Cod.graec., Cod.hebr., Cod.arab., Cod.gall., Cod.ital., Cod.icon. e gli altri).
- Staatsbibliothek zu Berlin: OAI-PMH (`oai.sbb.berlin`), insieme `handschriften` (circa 3500 record). La segnatura è in coda al titolo, dopo «; ». Manifesti IIIF: `content.staatsbibliothek-berlin.de/dc/<PPN>/manifest`.
- Universitätsbibliothek Heidelberg, miscellanee: per i codici latini o greci che la descrizione OAI non fa riconoscere (prima quelli descritti in modo generico, «Sammelhandschrift»), si legge il manifesto IIIF e si usano i titoli delle sezioni («structures») come indice dei contenuti. Nel catalogo la corrispondenza comincia con «indice:».
- Bodleian Libraries, Oxford: collezione IIIF «Archives and Manuscripts» (`iiif.bodleian.ox.ac.uk/iiif/collection/archive-manuscript-objects`, circa 10.600 manifesti: Bodleian e college, manoscritti occidentali, greci, orientali, papiri, moderni), cominciando da «Western Medieval Manuscripts»; di ogni manifesto si legge solo l'inizio con i metadati (Author, Title, Language, Date Statement, Contents). La lettura avanza ogni notte dal punto in cui si era fermata (circa 1000 manifesti per notte).
- Bibliothèque nationale de France (Gallica): interfaccia SRU, tutti i documenti di tipo «manuscrit» (ogni fondo della BnF, l'Arsenal e le biblioteche partner di Gallica), manifesti IIIF di Gallica. Gallica respinge le richieste che arrivano dai server (GitHub compreso), non quelle dei browser: l'elenco si raccoglie quindi da un normale browser con lo script `scripts/browser/gallica.js` e si salva in `data/gallica.json`, che la raccolta automatica usa quando la lettura diretta viene respinta. Va rifatto a mano ogni tanto per prendere i codici digitalizzati di recente. Le immagini si caricano senza problemi dal browser di chi usa il catalogo.
- Biblioteca Medicea Laurenziana, Firenze: Teca Digitale su CONTENTdm (`tecabml.contentdm.oclc.org`). L'OAI-PMH della Teca non funziona; si usa l'API `dmwebservices` (`dmQuery`, pagine di 200 record) su tutte le collezioni di manoscritti (Plutei, Acquisti e Doni, Ashburnham, San Marco, Conventi Soppressi, Edili, Gaddi, Mediceo Palatino, Amiatino, Pandette, Orientali, Documenti del Concilio; esclusi solo i cataloghi a stampa). La Teca non indica la lingua. Si leggono solo i codici (oggetti di primo livello), con autore, titolo, datazione, segnatura, diritti e l'elenco delle unità («Comprende»). Manifesti IIIF: `tecabml.contentdm.oclc.org/iiif/<collezione>:<numero>/manifest.json`. Una raccolta completa (circa 25 richieste) si riusa per 6 giorni.
- Universiteitsbibliotheek Leiden: collezioni «Manuscripts, Archives & Letters» (circa 4300 oggetti: occidentali medievali con i Vossiani latini e greci e i BPL, orientali, moderni) e «Bibliotheca Neerlandica Manuscripta» (circa 1900 manoscritti in nederlandese) di Digital Collections. Non c'è un OAI-PMH pubblico (quello di Alma risponde «Unauthorized») e l'elenco dell'API dei manifesti richiede l'accesso: si leggono le pagine dei risultati delle collezioni (`/islandora/search`, 20 codici per pagina, con segnatura, titolo, autori e datazione). Manifesti IIIF: `iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:<n>/manifest` (rimanda al nuovo catalogo). Una raccolta completa (circa 310 pagine, quasi un'ora con la pausa di 10 secondi) avanza 15 minuti per notte e si riusa per 6 giorni. Le segnature VLF/VLQ/VLO si scrivono «Voss. Lat. F./Q./O.».
- Biblioteche tedesche lette dal Handschriftenportal (`handschriftenportal.de/api/hspobjects/search`, l'API pubblica che usa il sito: filtro per biblioteca e per codici digitalizzati, 100 oggetti per richiesta), una fonte ciascuna (`scripts/fonti/hsp.mjs`, `FONTI_HSP`): Herzog August Bibliothek Wolfenbüttel, Staatsbibliothek Bamberg, Badische Landesbibliothek Karlsruhe, Württembergische Landesbibliothek Stoccarda, Erzbischöfliche Diözesan- und Dombibliothek Köln (Colonia), Universitätsbibliothek Leipzig (Lipsia). Entrano i codici digitalizzati per cui il portale indica un manifesto IIIF (per Wolfenbüttel anche quelli ricavati dall'indirizzo della copia digitale, `diglib.hab.de/mss/<sigla>/start.htm` → `iiif.hab.de/object/mss_<sigla>/manifest.json`, la stessa forma che il portale dichiara); la lingua viene dal filtro delle lingue del portale (una ricerca per lingua), quando c'è. Colonia: il portale ha solo le segnature, quindi titolo, autore e datazione si leggono una volta dal manifesto, e i codici il cui manifesto non si apre restano fuori. I server di Wolfenbüttel (`diglib.hab.de`, `iiif.hab.de`, `oai.hab.de`) e di Karlsruhe (`digital.blb-karlsruhe.de`) chiudono o respingono le richieste che arrivano dai server: le immagini si caricano dal browser di chi usa il catalogo. Limiti: Bamberga entra solo con i codici ospitati dalla BSB (gli altri sono in un visore senza IIIF), Stoccarda solo con i 3 frammenti di Corvey ospitati da Marburgo (le copie della biblioteca non hanno IIIF). Treviri non è nel portale con copie digitali: vedi `docs/BIBLIOTECHE.md`.
- Yale University Library (Beinecke e le altre biblioteche di Yale): OAI-PMH di Digital Collections (`collections.library.yale.edu/catalog/oai`, formato `oai_mods`). Gli insiemi sono solo per lingua, quindi si leggono tutti i circa 200.000 record (25 per pagina) e si tengono i manoscritti (genere «Manuscripts» o segnatura «MS»/«MSS», senza editore), fuori i papiri e le carte datate tutte dopo il 1800. La prima lettura va a riprese (15 minuti a ogni raccolta, circa una settimana) e intanto entrano i manoscritti già letti; poi, ogni 6 giorni, solo i record cambiati (`from=`). Manifesti IIIF: `collections.library.yale.edu/manifests/<oid>`, ricavati dall'identificativo e mai letti dal server (vedi sotto); CORS aperto su manifesti e immagini.
- University of Pennsylvania Libraries (Kislak Center con i codici Schoenberg, Katz Center): ricerca JSON di Colenda (`colenda.library.upenn.edu/catalog.json`, 100 record per pagina), per forma fisica (manoscritti, codici, manoscritti medievali, rinascimentali, europei, sanscriti, arabi, ebraici, persiani, greci, latini); entrano i manoscritti fino al 1800, fuori lettere, ricevute e altre carte non librarie. Manifesti IIIF del repository digitale di Penn: `digitalrepository.library.upenn.edu/iiif/2/items/<uuid>/manifest` (CORS aperto su manifesti e immagini). OPenn pubblica gli stessi codici e quelli di altre istituzioni di Filadelfia con TEI e immagini, ma senza manifesti IIIF: quelli che Penn non ha nel suo repository restano fuori. Una raccolta completa (circa 210 pagine) si riusa per 6 giorni.
- Biblioteca Apostolica Vaticana: l'elenco dei codici digitalizzati (pagina `digi.vatlib.it/mss/` con i fondi, poi `digi.vatlib.it/mss/ajax/category/<fondo>` con le segnature di ogni fondo, aggiornati ogni 7 giorni) e i manifesti IIIF (`digi.vatlib.it/iiif/MSS_<segnatura>/manifest.json`) dei soli codici non ancora letti, uno alla volta e solo nella parte iniziale con i metadati (anche la lingua). Ordine: fondi latini (Pal. lat., Reg. lat., Urb. lat., Ott. lat., Vat. lat., Barb. lat., Ross., Borg. lat.), Chig., fondi greci (Vat. gr., Pal. gr., Urb. gr., Barb. gr., Ott. gr., Reg. gr., Reg. gr. Pio II, Borg. gr.), poi tutti gli altri fondi della pagina. Con la pausa di 10 secondi chiesta dalla biblioteca i circa 31.000 codici digitalizzati richiedono circa 4 giorni con la corsia Vaticana a ruota: la stima aggiornata è nel registro.

## Rispetto dei limiti delle biblioteche

- User-agent identificativo: `Emendando catalogo (https://www.emendando.com; https://github.com/grecolatinovivo-create/emendando-catalogo)`.
- Richieste in serie, mai in parallelo, con una pausa di almeno 1,5 secondi per server e attesa crescente in caso di errore o di risposta 429.
- Handschriftenportal: il robots.txt non pone limiti; pausa di 1,5 secondi. Colonia (manifesti) e Lipsia: il robots.txt chiede 1 secondo solo ad alcuni robot; si usa la pausa di 1,5 secondi.
- Gallica: 3 secondi tra una richiesta e l'altra. Bodleian: il robots.txt di Digital Bodleian non pone limiti ai manifesti; si legge un manifesto alla volta e se ne scarica solo l'inizio.
- Leida: il robots.txt di Digital Collections chiede 10 secondi tra una richiesta e l'altra; si rispettano.
- Vaticana: il robots.txt chiede 10 secondi tra una richiesta e l'altra e vieta ricerca e schede; si rispetta la pausa di 10 secondi, si leggono solo l'elenco dei digitalizzati (le stesse richieste della pagina di un fondo) e i manifesti IIIF.
- Yale: il robots.txt di `collections.library.yale.edu` vieta ai programmi di raccolta `/manifests/`, `/pdfs/` e `/mirador/`; si legge solo l'OAI-PMH (consentito) e i manifesti li apre soltanto il browser di chi usa il catalogo. La ricerca JSON del sito è protetta da una verifica anti-robot e non si usa.
- Penn: il robots.txt di Colenda non pone limiti; quello del nuovo sito `digitalcollections.library.upenn.edu` vieta le ricerche con parametri e chiede 5 secondi di pausa, quindi non si usa per l'elenco.
- Le raccolte OAI-PMH si fanno una volta al giorno e una raccolta completa si riusa per 6 giorni.

## Fonti non incluse

- British Library: dopo l'attacco informatico del 2023 gli indirizzi IIIF (`iiif.bl.uk`, `bl.digirati.io`) rispondono «accesso negato» e il visore provvisorio dei manoscritti non offre manifesti né metadati scaricabili. Da riconsiderare quando il servizio IIIF torna disponibile.

- Österreichische Nationalbibliothek, Vienna: i server delle copie digitali (`iiif.onb.ac.at`, `digital.onb.ac.at`, `onb.digital`, `data.onb.ac.at`) chiudono le connessioni che arrivano dai server; l'OAI-PMH del catalogo (Alma) risponde, ma l'insieme dei manoscritti (HANNA) mescola lettere, lasciti e autografi (centinaia di migliaia di schede) e i manifesti non si possono verificare. Strada possibile: raccolta dal browser, come per Gallica.

- Stati Uniti (prova del 24 ottobre 2026): Harvard risponde 403 a ogni richiesta dai server; Walters Art Museum, Morgan Library e Library of Congress sono dietro la verifica anti-robot di Cloudflare; con Princeton e Getty la connessione sicura non si è potuta verificare dal nostro ambiente; le altre istituzioni di OPenn non hanno manifesti IIIF. I dettagli sono in `docs/BIBLIOTECHE.md`.

## Gallica: raccolta dal browser

Gallica respinge le richieste dei server, quindi la raccolta completa si lancia da Chrome:

1. aprire `https://gallica.bnf.fr/` in una scheda;
2. aprire la console (F12, scheda «Console»), incollare tutto il contenuto di `scripts/browser/gallica.js` e premere Invio (se Chrome lo chiede, scrivere prima «allow pasting»);
3. lasciare la scheda aperta: il titolo mostra la percentuale; una pagina di 50 schede ogni 3 secondi circa, con la stima del tempo che resta nella console;
4. alla fine Chrome scarica `gallica.json`: va copiato in `data/gallica.json` e salvato con un commit. La raccolta notturna lo usa da sola.

Se la scheda si chiude, basta riaprire Gallica e incollare di nuovo lo script: riprende da dove si era fermato (l'avanzamento resta nel browser). `EmendandoGallica.salva()` scarica subito quello che c'è; `EmendandoGallica.azzera()` cancella l'avanzamento.

## Aggiornamento

La raccolta gira su GitHub Actions divisa in quattro «corsie» parallele, una per gruppo di biblioteche (server diversi): ogni corsia ha il suo workflow, il suo orario e il suo gruppo di concurrency, così una corsia non ne blocca un'altra e due copie della stessa corsia non girano mai insieme. Dentro una corsia le richieste restano in serie con le pause di sempre: nessuna biblioteca riceve più richieste di prima.

- **Vaticana** (`.github/workflows/raccolta-vaticana.yml`): solo la Vaticana, per tutta l'esecuzione (circa 150 minuti, quasi 900 manifesti, uno ogni 10 secondi).
- **Yale** (`raccolta-yale.yml`): solo Yale, per tutta l'esecuzione finché la prima lettura non è finita; poi ogni 6 giorni solo i record cambiati.
- **Bodleian** (`raccolta-bodleian.yml`): solo la Bodleian, a riprese finché non sono letti tutti i manifesti; poi una volta al giorno (04 UTC) solo quelli nuovi.
- **Giornaliera** (`raccolta-giornaliera.yml`): tutte le altre fonti una volta al giorno alle 03 UTC, ciascuna con il suo limite: Heidelberg (con gli indici delle miscellanee, 20 minuti), e-codices, BSB (40 minuti ciascuna), Berlino (60 minuti: il server risponde lentamente), Gallica (25 minuti), Laurenziana (15 minuti), Leida (15 minuti), le biblioteche del Handschriftenportal (Wolfenbüttel, Bamberga, Karlsruhe, Stoccarda, Colonia, Lipsia: 10 minuti ciascuna) e Penn (10 minuti). Solo questa corsia usa la cache delle Actions (stati delle raccolte OAI, chiave propria).

Ruota: le corsie Vaticana, Yale e Bodleian, se un'esecuzione ha lavorato almeno 30 minuti (c'era ancora lavoro), ripartono subito da sole; quando non c'è più lavoro le esecuzioni durano pochi minuti e la ruota si ferma. L'orario di ciascuna (Vaticana e Yale ogni 3 ore, Bodleian ogni giorno) è di riserva, se un'esecuzione si interrompe. La corsia giornaliera non ha ruota.

Il lavoro comune (raccolta, prove, salvataggio, ruota) è in `.github/workflows/corsia.yml`. Salvataggio a prova di conflitto: ogni corsia mette da parte solo i propri file di stato (per esempio `data/vaticana.json`) e i propri esiti in `data/raccolte.json`, riparte dall'ultimo main, li rimette, ricostruisce il catalogo senza richieste (`--solo-costruisci`) e salva; se un'altra corsia ha salvato un attimo prima, aspetta qualche secondo a caso e rifà, fino a 8 volte. Le fonti delle altre corsie si ricostruiscono dagli stati salvati, senza richieste. I dati si salvano con un commit solo se cambiano.

Per rilanciare a mano: scheda Actions, il workflow della corsia («Raccolta: corsia Vaticana», ecc.), Run workflow. `raccolta.yml` è il vecchio nome della raccolta unica: non ha orario e passa solo la mano alla corsia Vaticana.

In locale (Node 20 o successivo, nessuna dipendenza):

```
node scripts/raccogli.mjs --fonti=heidelberg,ecodices,bsb,berlino,bodleian,gallica,laurenziana,leiden,wolfenbuettel,bamberga,karlsruhe,stoccarda,colonia,lipsia,yale,penn,vaticana --vaticana-minuti=20 --bodleian-minuti=30 --yale-minuti=30
node scripts/raccogli.mjs --solo-costruisci   # nessuna richiesta: ricostruisce dai dati già raccolti
node --test tests/catalogo.test.js
```

## Diritti

Il codice è distribuito con licenza MIT, i dati del catalogo con CC0 1.0 (vedi `LICENSE`). I metadati vengono dalle biblioteche; il catalogo contiene solo riferimenti (segnature, descrizioni brevi, indirizzi dei manifesti e delle pagine). Le immagini dei manoscritti restano delle biblioteche che le conservano e le pubblicano, con i loro diritti e le loro condizioni d'uso, indicate per ogni codice nel campo `licenza`.
