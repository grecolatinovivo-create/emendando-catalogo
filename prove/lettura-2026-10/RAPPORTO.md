# Prova di lettura automatica dei codici latini «sospetti» (ottobre 2026), terza versione

Kraken (modello CATMuS Medieval) ha riletto circa 10 pagine di ciascuno dei 3 codici latini della prova (gli stessi delle versioni precedenti, `codici.json`) e questa volta le letture complete sono state conservate. Il confronto tollerante verso le abbreviazioni della seconda versione è stato applicato a **tutte le pagine lette**, non più ai soli estratti: 11 pagine, divise in 190 finestre di 25 parole.

## In breve

| | prima versione | seconda versione | terza: metodo vecchio sulle nuove letture | **terza versione** |
|---|---:|---:|---:|---:|
| identificati | 61 | 77 | 0 | **0** |
| misti (alcune pagine note, altre no) | 42 | 41 | 0 | **0** |
| sospetti | 288 | 273 | 1 | **1** |
| incerti | 2 | 2 | 0 | **0** |
| non leggibili | 51 | 51 | 1 | **1** |
| in volgare | 19 | 19 | 1 | **1** |
| errori di rete o di manifesto | 32 | 32 | 0 | **0** |
| codici letti | 495 | 495 | 3 | **3** |

La colonna «metodo vecchio sulle nuove letture» separa i due effetti: quanto cambia perché la lettura automatica è stata rifatta, e quanto perché il confronto è migliore.

- Identificati dal confronto nuovo e non dal metodo vecchio sulle stesse letture: **0**.
- Codici che restano sospetti o misti con una corrispondenza parziale forte (di solito una citazione biblica o patristica dentro un commento o una predica): **1**.
- Finestre identificate: 1 su 190. Pagine: non leggibile 9, vuota 4, sospetta 2, altra lingua 1 (in tutto 16).

## Con che cosa sono stati identificati (identificati e misti)


## Sospetti residui, ordinati per interesse

Interesse come nelle versioni precedenti: qualità della lettura × quantità di testo × pagine senza corrispondenza, con un vantaggio per palinsesti, maculature, testi dichiarati non identificati e codici fino al XII secolo, e uno svantaggio per i codici il cui titolo nel catalogo nomina già autore o opera. Gli estratti sono la lettura automatica grezza (abbreviazioni non sciolte, errori della macchina), al massimo tre righe. «Miglior affinità» è la corrispondenza più forte trovata su tutte le pagine non identificate del codice: un indizio, non un'identificazione.

### 1. LJS 395 (University of Pennsylvania Libraries, Kislak Center, Philadelphia)

- Titolo nel catalogo: Manuscript pastedowns from De proprietatibus rerum, 1200s; datazione: 1200
- Scelto perché: maculatura o frammento di legatura. Esito: sospetto (2 pagine sospette su 2 leggibili)
- Pagina 1 ([Front pastedown, Side 1]): confidenza 0.97, parole latine 78%
- **Corrispondenza parziale forte** (citazione o testo affine, da verificare): The Latin Library: isidore/11 (Isidore: Etymologiae XI) (11 parole allineate, 6 piene)
- Manifesto: https://digitalrepository.library.upenn.edu/iiif/2/items/07befb3a-87e8-4d66-a581-e2ea3c75577f/manifest (pagina 1)
- Immagine: https://iiif-images.library.upenn.edu/iiif/2/7c637eab-9bd3-4998-a29a-1368a3d990a5/full/!2000,3200/0/default.jpg
- Estratto: «cela ⁊ coniuẽs fuit tenuis. ⁊ ħ pp̃ sb̾̃ti / litatẽ ip̃iꝰ auditus. Debl̾itatur autẽ / auditus temporib hũide cõplexiõis»

## Come è stato fatto il confronto

Il metodo è quello della seconda versione (`scripts/prova-lettura/riconfronta.py`): ogni parola letta diventa una forma con le lettere sicure (ꝑ = p…r, ꝓ = pro, ꝰ = s, ꝯ = c, lettere soprascritte come lettere, un piccolo lessico per le sigle isolate: ⁊ et, ẽ est, ñ non, ꝙ quod...); una parola abbreviata corrisponde a una parola del testo noto se ha la stessa iniziale e le sue lettere vi compaiono nello stesso ordine; i candidati si cercano con le iniziali di cinque parole di fila e si verificano con un allineamento locale parola per parola.

- **Su tutte le pagine**: ogni pagina leggibile (anche quelle che il metodo vecchio chiamava «non leggibili» per le troppe abbreviazioni) è divisa in finestre di 25 parole, la lunghezza dei passi della taratura.
- Una finestra è identificata con le soglie della seconda versione: almeno 8 parole lette allineate, 5 parole piene distinte in comune, metà della regione coperta, punteggio di almeno 12.0 (il massimo ottenuto dal caso è 8.45) e almeno il 40% delle parole della finestra allineate.
- Una pagina è identificata se lo è almeno un quarto delle sue finestre; altrimenti le finestre identificate sono una citazione dentro un altro testo e la pagina resta com'era. Una pagina già identificata dal metodo vecchio resta identificata. L'esito del codice segue le regole di sempre (identificato se le pagine note sono almeno quante le sospette, misto se sono meno).
- Taratura (seconda versione, passi di 25 parole abbreviati e sporcati come una lettura CATMuS): ritrovati 209 su 209; falsi positivi sui passi rimescolati 0 su 209 e sugli estratti reali rimescolati 0 su 333.
- Corpora: Vulgata 0.7 M parole, Perseus 7.1 M parole, CSEL 6.0 M parole, Patrologia Latina 22.5 M parole, The Latin Library 13.3 M parole, Divinum Officium 1.1 M parole (licenze come nella seconda versione: Vulgata pubblico dominio; Perseus, CSEL e Patrologia Latina di OpenGreekAndLatin CC BY-SA 4.0; The Latin Library nella copia CLTK, Public Domain Mark; Divinum Officium, MIT).

## Limiti

- Mancano ancora la scolastica, la medicina, l'astronomia e il computo, quasi tutto il diritto canonico, le prediche e i commenti biblici dopo il IX secolo: molti sospetti residui sono di questo tipo.
- La lettura automatica è buona sulle minuscole librarie ordinate, debole su corsive, glosse fitte, notazione musicale, pagine rovinate e palinsesti; la confidenza di Kraken è alta anche su letture sbagliate.
- La lettura è stata rifatta: le pagine scelte e i risultati della macchina possono differire un poco da quelli della prima esecuzione (si vede nella colonna «metodo vecchio sulle nuove letture»).

## Letture complete

Le letture complete non sono nel repository: restano negli artefatti `letture-*` dell'esecuzione 40294442512 fino al 24/01/2027 circa (90 giorni). Per rifare solo il confronto senza rileggere le immagini: workflow «Prova di lettura (Kraken)» con `da_run` = 40294442512.

## File

- `codici.json`: i 500 codici scelti, con il motivo della scelta.
- `risultati-codici.csv`: esito per codice (terza versione; `esito_metodo_vecchio` è il metodo della prima versione sulle stesse letture).
- `pagine.csv`: misure per pagina (stato con il metodo vecchio in `stato_prima`, finestre, finestre identificate, fonte, citazioni).
- `sospetti.json`: i sospetti e misti residui, con l'estratto breve e la miglior affinità trovata.
- `riepilogo.json`: i numeri di questo rapporto, con quelli delle versioni precedenti e la taratura.

Esecuzione: https://github.com/grecolatinovivo-create/emendando-catalogo/actions/runs/40294442512. Nessuna trascrizione completa è pubblicata.

## Versioni precedenti

La **prima versione** (esecuzione 40275860301) confrontava le pagine intere con il metodo dei 6-grammi delle prime due lettere sui corpora Vulgata, Perseus, CSEL e Patrologia Latina voll. 3-85: 495 codici letti; identificati 61, misti 42, sospetti 288, incerti 2, non leggibili 51, in volgare 19, errori 32; identificati quasi tutti sulla Vulgata. Le sue letture complete furono cancellate a fine esecuzione. La **seconda versione** applicò il confronto tollerante verso le abbreviazioni, con in più The Latin Library e Divinum Officium, ai soli estratti dei sospetti (circa 24 parole per codice): identificati 77, misti 41, sospetti 273 (nuove identificazioni soprattutto nel Corpus iuris civilis e nelle Decretali). Questa terza versione rilegge le immagini degli stessi codici e applica quel confronto a tutte le pagine.
