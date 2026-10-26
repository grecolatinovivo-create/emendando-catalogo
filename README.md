# Ramo «immagini» del catalogo di Emendando

Questo ramo contiene solo immagini, separate da `main` perché `main` non si appesantisca. Sono le pagine dei codici che le biblioteche pubblicano solo in PDF, senza IIIF: le pagine sono state estratte dai PDF una sola volta (JPEG, lato lungo da 1030 a 1600 pixel, quello del PDF quando è più piccolo, qualità 80) e sono servite da raw.githubusercontent.com, che ha CORS aperto. I manifesti IIIF Presentation 3 che le usano sono scritti dal catalogo (`scripts/fonti/latam_pdf.mjs` in `main`) e stanno nel ramo `manifesti`.

Percorso: `immagini/<fonte>/<cartella>/NNNN.jpg`, una immagine per pagina del PDF, nell'ordine del PDF.

Estrazione del 26 ottobre 2026. Entrano solo codici librari (niente lettere, documenti o carte d'archivio) e solo dove la licenza lo permette.

## Biblioteca Nacional de Chile (`immagini/bnchile/`)

Licenza: pubblico dominio. Ogni codice è segnato, nella sua scheda di Memoria Chilena, con «Propiedad intelectual: Patrimonio cultural común» (Ley 17.336: «puede ser utilizado y reproducido libremente», rispettando paternità e integrità dell'opera). Nei manifesti: `rights` Public Domain Mark 1.0.

Citazione richiesta: «Biblioteca Nacional de Chile. Disponible en Memoria Chilena», con l'indirizzo della scheda e il codice MC.

| Cartella | Segnatura | Titolo | Data | Scheda (citazione) |
|---|---|---|---|---|
| SM0000699 | Sala Medina, SM0000699 (PDF MC0005279) | Diario militar del General don J. M. Carrera: 1810-1814 | 1815 | https://www.memoriachilena.gob.cl/602/w3-article-99227.html |
| MC0005049 | MC0005049 (n. sistema 97002) | Catesismo político christiano dispuesto para la instrucción de la juventud de los pueblos libres de la América Meridional | [1810] | https://www.memoriachilena.gob.cl/602/w3-article-99218.html |
| MC0069816 | MC0069816 (n. sistema 96820) | Nómina de los conquistadores y pobladores de las ciudades y plazas del Reyno de Chile (dall'opera di Miguel de Olivares) | [1803] | https://www.memoriachilena.gob.cl/602/w3-article-132219.html |
| MC0067629 | MC0067629 (n. sistema 83864) | Camilo Henríquez, La inocencia en el asilo de las virtudes: segundo drama sentimental | [18--?] | https://www.memoriachilena.gob.cl/602/w3-article-87410.html |
| MC0000836 | MC0000836 (n. sistema 919754) | Emilio Vaïsse, [Diccionario latino-hebraico] (scelta di 20 pagine) | 1887-1889 | https://www.memoriachilena.gob.cl/602/w3-article-99525.html |

## Biblioteca Nacional de Venezuela (`immagini/bnv/`)

Licenza: Creative Commons Atribución-CompartirIgual 3.0 Venezuela (CC BY-SA 3.0 VE), licenza della Biblioteca Digital de Venezuela César Rengifo (https://creativecommons.org/licenses/by-sa/3.0/ve/). Le immagini estratte restano sotto la stessa licenza.

Attribuzione richiesta: «Biblioteca Nacional de Venezuela, Biblioteca Digital de Venezuela César Rengifo (bibliotecadigital.bnv.gob.ve). CC BY-SA 3.0 VE».

| Cartella | Segnatura | Titolo | Data | Scheda |
|---|---|---|---|---|
| MSV-CAW2591 | MSV CAW2591 | Juan Antonio Navarrete, Arca de Letras y Theatro Universal | 1783 | https://bibliotecadigital.bnv.gob.ve/?p=2204 |
| ingr-2016-3330 | Libros Raros, n. ingreso 2016-3330 | Primeras lecciones de cirugía dictadas por el Doctor José María Vargas en la Universidad de Caracas | 1827 | https://bibliotecadigital.bnv.gob.ve/?p=1267 |
| MSV-CCP1013 | MSV CCP1013 | [Biografía de Simón Bolívar] | [18--] | https://bibliotecadigital.bnv.gob.ve/?p=13027 |
