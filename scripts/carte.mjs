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
// stampa vera (per «carta_stampa»): incisione, litografia, xilografia, carta stampata; non le riproduzioni (fotografie, facsimili, manifesti)
export const STAMPA_VERA = /\b(?:engrav(?:ed|ing|ings)|gravée?s?|gravure|grav[ée] par|grabad[oa]s?|incis[ae]|incisione|incisioni|intagliat[ao]|lithograph(?:ed|s|ie)?|litografi[ae]|litografat[ao]|chromolithograph\w*|kupferstich\w*|stahlstich\w*|holzschnitt\w*|woodcuts?|wood engraving|printed|imprim[ée]e?s?|gedruckt\w*|stampat[ae]|impres[oa]|maps in books|sculps(?:it|\.)|fecit et sculp\w*)\b/i;
export const RIPRODUZIONE = /\b(?:facsimile|fac-simil[ée]|reproductions?|photograph\w*|photocop\w*|photolithograph\w*|photo|posters?|printed waste|printed (?:book|text)s?|microfilm\w*|incunabula|papers|blueprints?)\b/i;
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

/* tipo di una voce già ammessa dalla sua fonte: "carta" se titolo, generi o descrizione dicono carta e niente dice stampa;
   "carta_stampa" (dal 26 ottobre 2026) se dicono carta e la stampa è detta esplicitamente (incisione, litografia, «printed»);
   altrimenti null (codice). r: { titolo, descrizione, generi, tecnica } */
export function tipoDa(r) {
  if (!r) return null;
  if (r.tipo) return r.tipo;
  if (/photogr|facsim/i.test(r.segnatura || "")) return null;
  const t = String(r.titolo || "");
  const cartografico = titoloCarta(t) || /\bcartographic material\b/i.test(testo(r.descrizione).slice(0, 300) + " " + testo(r.generi));
  if (!cartografico) return null;
  if (STAMPATA.test(t) || STAMPATA.test(testo(r.generi)) || STAMPATA.test(testo(r.tecnica))) {
    const tutto = [t, testo(r.generi), testo(r.tecnica)].join(" ; ");
    return STAMPA_VERA.test(tutto) && !RIPRODUZIONE.test(tutto) && !NON_CARTA.test(t) ? "carta_stampa" : null;
  }
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

/* carta a stampa (dal 26 ottobre 2026, «tipo: "carta_stampa"»): scheda già nei dati salvati della fonte che prima restava fuori
   perché stampata; entra se titolo o generi dicono carta e titolo, generi, tecnica o descrizione dicono esplicitamente stampa
   (incisione, litografia, «printed»), mai le riproduzioni (fotografie, facsimili). Nessuna raccolta nuova di stampati. */
export function cartaStampata({ titolo, generi, tecnica, descrizione } = {}) {
  const t = String(titolo || ""), g = testo(generi).replace(/\b(?:manuscript|printed) waste\b[^;|,]*/gi, " "), k = testo(tecnica), d = testo(descrizione);
  if (NON_CARTA.test(t)) return false;
  if (!(titoloCarta(t) || GENERI_CARTA.test(g))) return false;
  const tutto = [t, g, k].join(" ; ");
  if (RIPRODUZIONE.test(tutto)) return false;
  // nel dubbio non è stampa: titolo o tecnica che dicono «disegnata a mano», o genere «manuscript maps»
  if (MANOSCRITTA.test(t) || MANOSCRITTA.test(k) || /\b(?:manuscript maps?|maps, manuscript)\b/i.test(g)) return false;
  return STAMPA_VERA.test(tutto) || /\b(?:gravée? par|engraved by|grabad[oa] por|incis[ao] da|lithographed|imprim[ée]e? (?:à|chez|par)|printed (?:by|for|at|in))\b/i.test(d);
}
// tipo cartografico di una scheda: "carta" (manoscritta), "carta_stampa" o null
export const tipoCarta = x => cartaManoscritta(x) ? "carta" : cartaStampata(x) ? "carta_stampa" : null;

/* carte giapponesi (Kokusho, NDL; dal 26 ottobre 2026). Le due fonti tengono già solo i manoscritti (Kokusho: filtro «写» della
   ricerca, i «刊» restano fuori; NDL: materialType «Manuscript» o editore «写…»), quindi una carta riconosciuta lì è manoscritta,
   salvo la datazione NDL che dice stampa («刊», «版»: carta_stampa; «刊写入交», misto: carta). Riconoscimento dal titolo:
   絵図/繪圖, 地図/地圖, 輿地, 海図, 測量図, 道中図, 城下図, 名所図, 縄張図, 分間図, 国図; oppure 図 in fondo dopo un nome di
   luogo (城, 国, 郡, 村, 町, 宿, 港, 浦, 島, 川, 道, 屋敷, 境内, 全図…); per NDL anche la classificazione «地図・絵図».
   Fuori le illustrazioni non geografiche (図会, 図譜, 図説, 図鑑, 系図, 本草, 花鳥, 曼荼羅, 山水, 図巻 di pittura) e i titoli in cui
   la carta è un oggetto, un abito, un rito o un documento d'archivio (装束, 調度, 太刀, 料理, 儀式と行列, 船, 和算の問題, 遊戯, 目録, 書付, 帳…). Nel dubbio, codice. */
const G = "[図圖]";
const JA_FORTE = new RegExp(String.raw`[絵繪]${G}|地${G}|輿地|海${G}|海岸${G}|測量${G}|道中${G}|城下${G}|名所${G}(?![會会絵繪])|[縄繩]張${G}|分間${G}|[国國]${G}`);
const JA_FINE = new RegExp(String.raw`(?:城|[国國]|郡|村|町|宿|湊|港|津|浦|[島嶋]|川|河|沼|湖|[浜濱]|道|境|領|陣屋|屋敷|御殿|境内|境內|堀|堤|橋|台場|臺場|砲[臺台]|新田|曲輪|丸|[総總]|全)之?${G}面?$`);
const JA_NO = new RegExp(String.raw`${G}[會会譜説說鑑考解式彙抄録錄]|系${G}|本草|花鳥|曼[荼陀]羅|山水|[畫画]${G}|備立|陣立|目[録錄]|[装裝]束|調度|太刀|刀脇|馬具|馬之|料理|生花|[楽樂][焼燒]|犬追物|追鳥狩|舞[臺台]|座敷飾|規矩|鳥羽[絵繪]|書付|口上書|帳|一件|書類|願|凡例|附記|記$|日記|紀行|天文|星${G}|人物|肖像|繃縛|医|醫|八線|採製|式|渡御|御名代|祭|行列|遷宮|[即卽]位|崩御|葬|御幸|行幸|饗|膳|船(?!道|路)|舟|艦|${G}[志要]|算|答|問|術|[讀読]|投扇|[双雙]六|遊|井田|${G}[枢樞携附]|書|障子|襖|屏風|鞠|蟇目|射|弓|産所|社[參参]|[參参]詣|躰|胴丸|御旗|口訣|物語|悟道|原稿`);
const JA_LUOGO = /[国國郡村町城宿湊港津浦島嶋川河沼湖浜濱領境堀堤橋田畑山寺社宮院坂谷原野崎岬峠関關道筋通]|屋敷|御殿|陣屋|新田|境内|江戸|京都|大坂|大阪|長崎|日光|蝦夷/;
const JA_ROTOLO = new RegExp(String.raw`${G}[巻卷]`), JA_ROTOLO_OK = /道中|川通|見取|海岸|街道|沿岸|海路|航路/;
export function cartaGiapponese(titolo, classe = "") {
  const t = String(titolo || "").trim();
  const t0 = t.replace(/[（(［\[【〔].*$/, "").replace(/[\s.．、]*(?:[0-9０-９一二三四五六七八九十]+\s*[巻卷冊帖枚])?[\s.．、]*$/, "").trim();
  if (!(JA_FORTE.test(t) || JA_FINE.test(t0) || /地図・絵図/.test(classe))) return false;
  if (JA_NO.test(t)) return false;
  if (JA_ROTOLO.test(t) && !JA_ROTOLO_OK.test(t)) return false;
  // «…絵図» senza altro segnale: serve un nome di luogo breve («伏見繪圖») o una parola di luogo nel titolo
  if (!/地図・絵図/.test(classe) && !JA_FINE.test(t0) && !new RegExp(String.raw`地${G}|輿地|海${G}|海岸${G}|測量${G}|道中${G}|城下${G}|名所${G}|[縄繩]張${G}|分間${G}|[国國]${G}`).test(t)) {
    const prima = (/^(.*?)[絵繪]${G}/.exec(t0) || [null, t0])[1].replace(/^[［\[〔(（]+/, "");
    if (prima.length > 4 && !JA_LUOGO.test(t)) return false;
  }
  return true;
}
