// Codici miniati e illustrati (dal 26 ottobre 2026): «miniato: true» nella voce e una colonna in fondo alle righe dell'indice
// (dopo «tipo»). Entrano i codici con miniature, iniziali istoriate o decorate, disegni o illustrazioni, riconosciuti SOLO dai
// metadati già salvati (titolo, descrizione, generi e soggetti, tecnica, indice dei contenuti): nessuna nuova raccolta.
// Restano fuori le voci in cui l'indicatore è negato («no illuminations», «sans décor», «aucune enluminure»), i nomi propri
// (San Miniato, Gregorio l'Illuminatore), i libri «in miniatura» (formato piccolo) e le carte geografiche (manoscritte e a stampa),
// che hanno il loro tipo.
// Per le fonti con metadati poveri (solo titolo e segnatura) il riconoscimento è per forza parziale.

// confine di parola anche per le lettere accentate (\b di JavaScript conosce solo l'ASCII): «\b» davanti a una lettera o a un
// gruppo «(?:» è un inizio di parola, altrimenti (davanti a «[», «(?=», «(?!», «\s», fine del ramo) una fine
const INIZIO_P = String.raw`(?<![\p{L}\p{N}])`, FINE_P = String.raw`(?![\p{L}\p{N}])`;
export const re = (parti, flag) => new RegExp(parti.join("|").replace(/\\b(?=\p{L}|\(\?:)/gu, INIZIO_P).replace(/\\b/g, FINE_P), flag + "u");
const testo = x => [].concat(x ?? []).filter(Boolean).join(" ; ");

// negazioni e usi generici: si tolgono dal testo prima di cercare gli indicatori
const NEGATI = re([
  String.raw`\b(?:no|not|without|nor|lacks?|lacking|devoid of|absence of|never)\s+(?:\w+[\s,]+){0,3}?(?:illuminat\w*|decorat\w*|miniatur\w*|illustrat\w*|drawings?|initials?|ornament\w*)`,
  String.raw`\bun(?:decorated|illuminated|illustrated|adorned)\b`,
  String.raw`\b(?:sans|aucune?s?|pas d[e'])\s*(?:\w+\s+){0,2}?(?:d[ée]cor\w*|enlumin\w*|miniatur\w*|peintures?|illustrations?|ornements?|initiales? orn[ée]es?)`,
  String.raw`\b(?:ohne|keine?n?)\s+(?:\w+\s+){0,2}?(?:buchschmuck|miniatur\w*|illustration\w*|initialen|zeichnung\w*|ausstattung)`,
  String.raw`\b(?:sin|ning[uú]n[ao]?)\s+(?:\w+\s+){0,2}?(?:miniatur\w*|iluminaci\w*|decoraci\w*|ilustraci\w*|dibujos?)`,
  String.raw`\b(?:senza|nessuna?|privo di|priva di)\s+(?:\w+\s+){0,2}?(?:miniatur\w*|decorazion\w*|illustrazion\w*|disegni|iniziali)`,
  String.raw`\bnon (?:miniat|decorat|illustrat)\w*`,
  // decorazione prevista e mai eseguita: spazi lasciati, lettere guida, iniziali mancanti
  String.raw`\b(?:missing|unexecuted|unfinished|not executed|never (?:executed|added)|spaces?(?: left)?(?: blank)?(?: for| reserved for)|guide letters for|reserved for|left for|previst[oa]s? para|reservad[oa]s? para|riservat[ie] (?:a|per|alle?)|lasciat[ie](?: in bianco)? per|réservée?s? (?:pour|aux?)|vides? pour|attente d['e]|pour recevoir)\s+(?:[\w.]+[\s,]+){0,3}?(?:miniatur|initial|inizial|inicial|illuminat|decorat|enlumin)\w*`,
  // bibliografia: titoli di repertori («Bibliogr.: ... La miniatura a Padova», «'The Glazier Collection of Illuminated Manuscripts'»)
  String.raw`\bBibliogr(?:afia|aphy|aphie|af[ií]a|\.)\s*:[^|]*`,
  String.raw`['‘“][^'’”|]{0,150}?(?:illuminat|enlumin|miniatur|buchmalerei|decorated|illustrat)[^'’”|]{0,150}['’”]`,
  String.raw`\bLes Enluminures\b`,
  // inventari e testi sulla pittura, non illustrati
  String.raw`\b(?:libri|stampe|quadri|medaglie|gemälde|porzellane|möbel|livres|tableaux|estampes|books|prints|pictures|cuadros|estampas|libros),? (?:\w+, ){0,2}(?:disegni|zeichnungen|dessins|drawings|dibujos)\b`,
  String.raw`\b(?:interpretation|description|explications?|catalogue|list|inventory|inventaire|beschreibung|verzeichnis) (?:of|de|des|der) (?:the |la |les )?(?:\w+ )?(?:paintings|peintures|gemälde|miniatures|zeichnungen|drawings|dessins)\b`,
  String.raw`\b(?:della|de la|sur la|on|traité de(?: la)?|trattato della|tratado de la|von der) miniatur[ae]?\b`,
  String.raw`\b(?:para|a|de|en|por) la ilustraci[oó]n\b|\bilustraci[oó]n (?:a|al|sobre|de este|de esta)\b`,
  // periodici illustrati a stampa
  String.raw`\billustrierte (?:zeitung|zeitschrift|blätter|welt)\b|\billustrated (?:london news|newspaper|magazine|weekly|journal)\b|\bjournal illustré\b`,
  // usi figurati
  String.raw`\billuminat(?:ed|es|ing) (?:elements|aspects|the (?:life|history|world|role|lives)|our|many|how|his|her|their)\b`,
  // formato piccolo, non pittura
  String.raw`\bminiature\s+(?:books?|codex|codices|qur'?[aā]n|koran|format|size|edition|copy|scrolls?|bibles?)\b`,
  String.raw`\bin miniatura\b`,
  // nomi propri e usi figurati
  String.raw`\b(?:San|S\.|Santo|S\. ?Maria a|da|di|de) Miniato\b`,
  String.raw`\b(?:the |l'|il |el |der )?(?:Illuminator|Illuminateur|Illuminatore|Iluminador|Erleuchter)\b`,
  String.raw`\billuminat(?:i|us|io|ionis|ivus|ive)\b`,
  // citazioni di miniature altrui (repertori, raccolte di riproduzioni)
  String.raw`\bminiatures? (?:de|des|from|of) (?:manuscrits|manuscripts|codici|handschriften)\b`,
  String.raw`\b(?:reproductions?|photographs?|photos?|facsimiles?|copies) (?:of|de|d'|des) (?:\w+\s+){0,2}?(?:miniatures?|enluminures?|illuminations?)`,
], "gi");

// indicatori (minuscole e maiuscole)
const SEGNI = re([
  // miniature e miniatori
  String.raw`\bminiatur(?:e|es|a|as|e|en|ed|ists?|maler\w*|malerei)\b`, String.raw`\bminiaturowan\w*|\bminiatury\b`,
  String.raw`\billuminat(?:ed|ion|ions)\b`, String.raw`\billuminations? of books\b`, String.raw`\bil·lumin\w*`,
  String.raw`\benlumin(?:é|ée|és|ées|ure|ures|eur|eurs)\b`, String.raw`\bmanuscrits? (?:à|a) peintures\b`,
  String.raw`\biluminad[oa]s?\b|\biluminaci[oó]n(?:es)?\b|\bminiad[oa]s?\b|\biluminowan\w*|\biluminac[ei]\b|\biluminovan\w*|\bverlucht\w*|\bverluchting\w*`,
  String.raw`\bbuchmalerei\w*|\bbuchschmuck\b|\bdeckfarben\w*`,
  // iniziali istoriate o decorate
  String.raw`\bhistoriated\b|\bhistori[ée]es?\b|\bistoriat[ae]\b|\bhistoriad[ao]s?\b`,
  String.raw`\b(?:decorated|painted|illuminated|gilt|ornamental|ornate|zoomorphic|anthropomorphic|inhabited) initials?\b`,
  String.raw`\binitiales? (?:orn[ée]es?|peintes?|enlumin[ée]es?|historiées?|à (?:antennes|personnages|décor))\b|\blettres? (?:orn[ée]es?|historiées?|peintes?|enlumin[ée]es?)\b`,
  String.raw`\biniziali (?:miniate|decorate|istoriate|ornate|figurate|dipinte)\b|\bletter[ae] (?:miniata|istoriata|ornata)\b`,
  String.raw`\b(?:zier|deckfarben|bild|figuren)initial\w*`, String.raw`\biniciales? (?:decoradas?|historiadas?|miniadas?|iluminadas?)\b`,
  // disegni e illustrazioni
  String.raw`\b(?:with|and|containing|includes?|including) (?:\w+\s+){0,3}?(?:drawings|illustrations|paintings|pictures)\b`,
  String.raw`\b(?:pen|ink|pen[- ]and[- ]ink|coloured|colored|marginal|tinted|outline|watercolou?r) drawings?\b`,
  String.raw`\billustrat(?:ed|ions?)\b`, String.raw`\billustré(?:e|es|s)?\b`, String.raw`\billustrazion[ei]\b|\billustrat[oaie] (?:da|con|a penna)\b`,
  String.raw`\bilustraci[oó]n(?:es)?\b|\bilustrad[oa]s?\b|\bilustracj\w*|\bilustrac[ei]\b`,
  String.raw`\billustration(?:en)?\b|\billustriert\w*|\bfederzeichnung\w*|\b(?:kolorierte|lavierte|farbige) (?:feder)?zeichnung\w*|\bzeichnungen\b|\bbilderhandschrift\w*`,
  String.raw`\bdessins? (?:à la plume|au trait|en couleurs?|coloriés?|aquarellés?|à l'encre)\b|\b(?:avec|et) (?:\w+\s+){0,2}?dessins\b|\bdisegni\b|\bdibujos\b|\bdessins\b`,
  String.raw`\bpaintings\b|\b(?:cum|with) picturis\b|\bpicturis (?:et|ac)\b|\bpeintures?\b(?= (?:à|en|de pleine|en grisaille|sur fond))|\bgrisaille\b`,
], "i");
// «miniato» e affini solo in minuscolo (le maiuscole sono quasi sempre San Miniato o cognomi); «con miniat.»
const SEGNI_MINUSCOLI = re([String.raw`\bminiat[oaie]\b|\bminiat\.|\bminiatura\b`], "");
// giapponese e cinese: rotoli dipinti, libri illustrati, album di pitture, colori
const SEGNI_CJK = /絵巻|繪巻|絵卷|繪卷|絵入|繪入|彩色|挿絵|插繪|挿畫|画帖|畫帖|図巻|圖巻|圖卷|絵詞|繪詞|奈良絵本|画巻|畫卷/;
const EHON = /絵本|繪本/; // solo se manoscritto
const MANOSCRITTO_CJK = /書写資料|写本|寫本|自筆|稿本|手稿|鈔本|抄本/;
const STAMPATO_CJK = /刊本|版本|木版|整版|色刷|彩色刷|錦絵|摺物/;

const RADICI = /miniat|illumin|enlumin|il·lumin|ilumin|miniad|verlucht|buchmal|buchschmuck|deckfarb|histori|istoriat|initial|inicial|iniziali|lettr|letter|drawing|illustr|ilustr|zeichnung|dessin|disegni|dibujo|painting|peintur|pictures|grisaille|絵|繪|彩色|挿|插|画|畫|図巻|圖巻|圖卷/i;

/* la voce è un codice miniato o illustrato? r: { titolo, descrizione, generi, tecnica, indice, tipo } */
export function miniatoDa(r) {
  if (!r || /^carta/.test(r.tipo || "")) return false;
  const grezzo = [r.titolo, testo(r.descrizione), testo(r.generi), testo(r.tecnica), testo(r.indice)].filter(Boolean).join(" | ");
  if (!grezzo) return false;
  // filtro veloce (le espressioni complete sono lente su 400.000 voci): senza nessuna di queste radici non c'è niente da cercare
  if (!RADICI.test(grezzo)) return false;
  const t = grezzo.replace(NEGATI, " ");
  if (SEGNI.test(t) || SEGNI_MINUSCOLI.test(t)) return true;
  if (SEGNI_CJK.test(t) && !/彩色刷|色刷|錦絵/.test(t)) return true;
  return EHON.test(t) && MANOSCRITTO_CJK.test(t) && !STAMPATO_CJK.test(t);
}

// per le verifiche a mano: il tratto di testo che ha fatto scattare il riconoscimento (o null)
export function perche(r) {
  if (!miniatoDa(r)) return null;
  const grezzo = [r.titolo, testo(r.descrizione), testo(r.generi), testo(r.tecnica), testo(r.indice)].filter(Boolean).join(" | ").replace(NEGATI, " ");
  for (const x of [SEGNI, typeof SEGNI_MINUSCOLI !== "undefined" ? SEGNI_MINUSCOLI : null, SEGNI_CJK, typeof EHON !== "undefined" ? EHON : null]) {
    const m = x && grezzo.match(x); if (m) return grezzo.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
  }
  return "segnatura: " + r.segnatura;
}
