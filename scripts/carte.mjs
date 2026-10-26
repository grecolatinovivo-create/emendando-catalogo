// Carte geografiche manoscritte (dal 26 ottobre 2026): categoria a parte del catalogo, «tipo: "carta"» nella voce e «tipo» in fondo
// alle righe dell'indice. Entrano carte nautiche e portolani, mappamondi, carte regionali, piante di città e di edifici, carte catastali
// e di confine, di ogni epoca, purché disegnate a mano; gli atlanti e i portolani manoscritti rilegati sono carte anche loro.
// Le carte a stampa (incisioni, litografie, carte stampate) restano fuori. Nel dubbio, fuori (o, per le voci già nel catalogo come
// codici, restano codici).
//
// Qui solo il riconoscimento dai metadati; ogni fonte decide quali schede prima scartate come «carte» far rientrare
// (motivoYale, motivoGallica, ammessaOmeka, motivoCudl), e voce() in raccogli.mjs segna il tipo di tutte le voci.

// titolo che descrive una carta (inizio del titolo, dopo parentesi quadre, virgolette o «Untitled»)
const INIZIO = String.raw`^\s*[\["«“'(]*\s*(?:untitled\s+|sans titre\s+|\(?[A-Z &]+\)\s*(?:\[anon\.?\]\s*)?\[?)?`;
const LUOGHI_MINUSCOLI = String.raw`(?:la |l'|le |les |el |los |las |il |lo |gli |the )?(?:ville|cit[ée]|place|forteresse|fort|port|rade|baie|c[ôo]te|isle|[îi]le|ch[âa]teau|camp|bataille|si[èe]ge|attaque|environs|terrain|ferme|maison|[ée]glise|abbaye|jardin|parc|cours|rivi[èe]re|canal|route|chemin|paroisse|seigneurie|fief|terre|terres|domaine|town|city|harbou?r|bay|river|estate|manor|parish|church|castle|battle|ground|house|garden|road|island|coast|ciudad|villa|puerto|bah[íi]a|r[íi]o|castillo|plaza|fuerte|costa|isla|iglesia|convento|monasterio|casa|palacio|citt[àa]|fortezza|porto|isola|castello|chiesa|feudo|territorio|tenuta|podere|palazzo|monastero|giardino|strada|fiume|fabbrica|edificio|establecimiento|colegio)\b`;
const TITOLO_INIZIO = new RegExp(INIZIO + String.raw`(?:` + [
  // carte, mappe, piante, atlanti
  String.raw`(?:manuscript |hand[- ]drawn |sketch(?:ed)? |military |estate |route |road )?maps?\s+(?:of|showing|shewing|from)\b`,
  String.raw`(?:sketch(?:ed)? |manuscript )?maps?\b\s*[:;.,\]]`,
  String.raw`(?:general |ground |floor |site |sketch |block |estate )?plans?\s+(?:of|showing|for)\s`,
  String.raw`(?:upper |lower |first |second |ground |different )?(?:floor )?plan of\b`,
  String.raw`plans?\s+(?:g[ée]n[ée]ral|g[ée]om[ée]trique|topographique|cadastral|figuratif|visuel|terrier|de masse)\b`,
  String.raw`plans?\s+(?:de la |de l'|du |des |de |d')\s*` + LUOGHI_MINUSCOLI,
  String.raw`plan(?:o|os)\s+(?:general |topogr[áa]fico |geogr[áa]fico |de la |del |de los |de las |de |y )?(?:` + LUOGHI_MINUSCOLI + "|perfil|elevaci|memoria|situaci)",
  String.raw`(?:pianta|piante) (?:topografica|della|del|dello|di)\b`,
  String.raw`(?:mappa (?:di|del|della|dello|dei|delle|topografica|geografica)|mapa (?:de|del|topogr)|mapas de|mappemonde|mapamundi|mappa ?mundi|planisf[eè]r[eoi]|planisph[eè]re|planisphere)\b`,
  String.raw`cartes?\s+(?:de la |de l'|du |des |de |d')\s*` + LUOGHI_MINUSCOLI,
  String.raw`cartes?\s+(?:g[ée]n[ée]rale|particuli[èe]re|topographique|g[ée]ographique|marine|nautique|hydrographique|r[ée]duite|itin[ée]raire|militaire|chorographique)\b`,
  String.raw`carta\s+(?:geografica|topografica|corografica|nautica|idrografica|militare|marina|n[áa]utica|geogr[áa]fica|topogr[áa]fica|de marear|esferica|esf[ée]rica|hidrogr[áa]fica|del (?:mare|golfo|regno|ducato|territorio|contado|lago|fiume|mar)\b|della (?:provincia|diocesi|riviera|costa|valle|repubblica|toscana|lombardia|sicilia|sardegna|corsica|grecia|terra)\b)`,
  String.raw`(?:land|see|welt|grenz|forst|flur|post|stra[ßs]en)karte\b`,
  String.raw`(?:grundriss|grundri[ßs]|lageplan|situationsplan|kataster)\b`,
  String.raw`(?:kaart|plattegrond|caerte)\b`,
  String.raw`(?:portolan|portulan|portolano|portolani|portulano|isolario)\w*`,
  String.raw`(?:nautical|sea|manuscript|marine) charts?\b`,
  String.raw`(?:world|town|city|estate|county|military|road) maps?\b`,
  String.raw`(?:ptolemaic |manuscript |portolan |nautical |general |military )?atlas\b`,
  String.raw`(?:cabreo|cabrei)\b`,
  String.raw`recueil de (?:cartes|plans)\b`,
].join("|") + ")", "i");
// le stesse parole seguite da un nome proprio (maiuscola: per questo senza «i»): «Plan de Strasbourg», «PLAN DE LA VILLE», «Karte von Bayern»
const TITOLO_NOME = new RegExp(INIZIO + String.raw`(?:[Pp]lans?|PLANS?|[Pp]lan[oa]s?|PLANOS?|[Cc]artes?|CARTES?|[Kk]arte|KARTE|[Pp]ianta|PIANTA|[Mm]apa|MAPA|[Mm]ap|MAP)\s*(?:\/\/\s*)?(?:de la |de l'|du |des |de |d'|of |von |vom |der |des |del |della |di |de los |de las |DE LA |DE L'|DU |DES |DE |D'|OF |VON |DER |DEL |DELLA |DI )?\s*(?:\/\/\s*)?[A-ZÀ-ÝÁÉÍÓÚÑ]`);
// in qualunque punto del titolo proprio (prima di « ; »): segnali forti
const TITOLO_OVUNQUE = /\b(?:portolan(?:o|i|e|s)?|portulan(?:o|e|s)?|isolario|portolan charts?|nautical charts?|sea charts?|mappa ?mundi|mappemonde|mapamundi|world map|weltkarte|planisph[eè]re|planisfero|seekarten?|carta nautica|carta n[áa]utica|cartes? marines?|cartographic material|manuscript maps?|map of the world|maps? of (?:the )?(?:[A-Z][\w'-]+)|plans? of the (?:town|city|fort|harbou?r|estate|manor|parish|church|castle|camp|siege|battle)|atlas (?:of|de|del|van|von)\s+[A-Z]|hovenden maps|estate maps?)/i;
// testi che citano una carta (cronache, trattati, raccolte miscellanee) restano codici
const TESTUALE = /\b(?:chroniques?|chronicles?|chronica|summa|trait[ée]s?|treatises?|m[ée]moires?|memorias?|roman|histoire|historia|liber|commentar\w*|etc\.?)\b/i;
// non carte: lettere e cartoline («Karte von X an Y», «Carte de X à Y», catalano «Cartes de X a Y»), materiali di studio, liste di carte,
// carte celesti, piani di studio e di guerra, manifesti
const NON_CARTA = /\b(?:postkarte|postcard|carte postale|cartes? de visite|carte de correspondance|cartes? à jouer|playing cards?|atlas linguisti\w*|atlas ethnograph\w*|atlas de pal[ée]ograph\w*|atlas fm|list of the books|catalogue des cartes|catalogue of (?:the )?maps|inventaire|index (?:des|of)|table des|walter map|gautier map|c[ée]lestes?|celestial|himmels\w*|sternkarte|star (?:map|chart)s?|plans? d'[ée]tudes?|plan de (?:guerre|campagne|r[ée]forme|conduite|estudios|enseñar|ense[ñn]anza)|poster|spirituelle|manuscrit autographe|autographe|g[ée]n[ée]rale de (?:toutes )?les troupes)\b|\bkarte von [^:;]+ an\b|^\s*\[?(?:lettre|letter|brief|carta (?:de|del|al|a)\s+(?:d\.|don|doña|dr|el|la|los|su|un|una|fray|padre|p\.)|carta (?:de|a) [A-Z])|^\s*\[?cartes? (?:de|d')\s*[^;:]{0,80}?\s(?:à|a|al|adress[ée]e?s?)\s+(?:[A-Z]|l[ae]? |l'|mon |son |sa |un |une |monsieur|madame)/i;
// a stampa (nel titolo, nel tipo o nella tecnica): incisioni, litografie, carte stampate
export const STAMPATA = /\b(?:engrav(?:ed|ing|ings)|gravée?s?|gravure|grav[ée] par|grabad[oa]s?|incis[ae]|incisione|incisioni|intagliat[ao]|lithograph\w*|litograf\w*|lithographi\w*|chromolithograph\w*|kupferstich\w*|stahlstich\w*|holzschnitt\w*|woodcuts?|wood engraving|printed|imprim[ée]e?s?|impres[oa]s?\b|gedruckt\w*|stampat[ae]|stampa\b|druck\b|photolithograph\w*|facsimile|fac-simil[ée]|reproduction|photograph\w*|photocop\w*|impreso|posters?|hand[- ]colou?r(?:ing|ed)|maps in books|printed waste|sculps(?:it|\.)|inc(?:idit|\.)(?=\s*$|\s*[\].,;])|fecit et sculp\w*)\b/i;
// tecnica o tipo che dicono «disegnata a mano»
export const MANOSCRITTA = /\b(?:manuscript|manuscrit[ea]?s?|manoscritt[ao]|manuscrit[oa]s?|handschrift\w*|handgezeichnet\w*|hand[- ]drawn|dessin(?:é|ée|ées)?|dessinée? par|aquarell\w*|watercolou?rs?|acuarela\w*|acquerell\w*|lavis|aguada|ink\b|pen and ink|encre|tinta|inchiostro|tusche|federzeichnung|feder|à la plume|a pluma|a penna|pencil|crayon|l[áa]piz|matita|ms\.|mss\.|calque|tracing|gezeichnet|getekend|geteekend|teekening|tekening)\b/i;

const testo = x => [].concat(x ?? []).filter(Boolean).join(" ; ");

// il titolo (o il genere) descrive una carta?
export function titoloCarta(titolo) {
  const t = String(titolo || "").replace(/\s+/g, " ").replace(/\/\//g, " ").trim();
  if (!t || NON_CARTA.test(t)) return false;
  if (TITOLO_INIZIO.test(t) || TITOLO_NOME.test(t)) return true;
  const t1 = t.split(" ; ")[0];
  return t1.length <= 160 && TITOLO_OVUNQUE.test(t1) && !TESTUALE.test(t1);
}
export const GENERI_CARTA = /\b(?:manuscript maps?|maps, manuscript|portolan charts?|portolanos?|nautical charts?|world maps|maps|cartographic|cartes?|carte g[ée]ographique|mapas?(?: y planos)?|planos?|plans?|karten?|landkarten?|atlases|atlas)\b/i;

/* tipo di una voce già ammessa come manoscritto dalla sua fonte: "carta" se titolo, generi o descrizione dicono carta
   e niente dice stampa; altrimenti null (codice). r: { titolo, descrizione, generi, tecnica } */
export function tipoDa(r) {
  if (!r) return null;
  if (r.tipo) return r.tipo;
  if (/photogr|facsim/i.test(r.segnatura || "")) return null;
  const t = String(r.titolo || "");
  const cartografico = titoloCarta(t) || /\bcartographic material\b/i.test(testo(r.descrizione).slice(0, 300) + " " + testo(r.generi));
  if (!cartografico) return null;
  if (STAMPATA.test(t) || STAMPATA.test(testo(r.generi)) || STAMPATA.test(testo(r.tecnica))) return null;
  return "carta";
}

/* scheda prima scartata come carta: rientra solo se è una carta (titolo o generi), disegnata a mano (tecnica, tipo, generi o
   descrizione) e niente dice stampa. testi: { titolo, generi, tecnica, descrizione } */
export function cartaManoscritta({ titolo, generi, tecnica, descrizione } = {}) {
  // «Manuscript waste (Binding)»: frammenti di codici usati nella legatura, non la tecnica della carta
  const t = String(titolo || ""), g = testo(generi).replace(/\b(?:manuscript|printed) waste\b[^;|,]*/gi, " "), k = testo(tecnica), d = testo(descrizione);
  if (NON_CARTA.test(t)) return false;
  if (!(titoloCarta(t) || GENERI_CARTA.test(g))) return false;
  if (STAMPATA.test(t) || STAMPATA.test(g) || STAMPATA.test(k)) return false;
  // la descrizione dice stampa solo con formule esplicite (una carta manoscritta può citare una carta a stampa)
  if (/\b(?:gravée? par|engraved by|grabad[oa] por|incis[ao] da|lithographed|imprim[ée]e? (?:à|chez|par)|printed (?:by|for|at|in))\b/i.test(d)) return false;
  return MANOSCRITTA.test(t) || MANOSCRITTA.test(g) || MANOSCRITTA.test(k) || /\b(?:manuscript maps?|maps, manuscript|portolan charts?)\b/i.test(g) || /\bportolan|portulan|portolano/i.test(t);
}
