// Codici musicali (dal 26 ottobre 2026): «musica: true» nella voce e una colonna in fondo alle righe dell'indice (dopo quella dei
// miniati). Entrano i libri di canto con notazione (neumi, graduali, antifonari, tropari, kyriali, innari, processionali), la
// polifonia, le intavolature, le partiture e i libri di parti manoscritti, i trattati di teoria musicale, la musica bizantina e
// orientale notata. Si riconoscono SOLO dai metadati già salvati (titolo, descrizione, generi, tecnica, indice, segnatura).
// Fuori le voci in cui la notazione è negata («without notation», «sans notation», righi vuoti) e le carte geografiche.
import { re } from "./miniati.mjs";

const testo = x => [].concat(x ?? []).filter(Boolean).join(" ; ");

const NEGATI = re([
  String.raw`\b(?:no|not|without|lacks?|lacking|sans|aucune|pas de|ohne|keine?|sin|senza|non)\s+(?:\w+[\s,]+){0,2}?(?:musical |musicale |neumatic |neumatique )?(?:notation|neumes?|neumen|noten|notazione|notación|music|musique|musica|notes de musique)\b`,
  String.raw`\bun(?:notated|neumed)\b|\bnon not[ée]s?\b`,
  String.raw`\b(?:empty|blank|unfilled|vides?|leere|vuoti) (?:staves|staffs|portées|notenlinien|righi|pentagrammi)\b|\b(?:staves|portées|notenlinien|righi) (?:left )?(?:empty|blank|vides?|leer|vuoti)\b|\bnotation (?:was )?never (?:added|entered)\b`,
  // musica solo nella legatura (coperta o guardie ricavate da un libro di canto): il codice non è musicale
  String.raw`\b(?:cover|binding|wrapper|pastedowns?|flyleaf|flyleaves|guards?|einband\w*|reliure|couverture|legatura|coperta|guardie)\b[^.;|]{0,80}(?:musical notes|notation|neumes|neumen|noten|notazione|antiphon\w*|gradual\w*|service book)`,
  // omonimi: Madrigal de las Altas Torres; «pieza de musica» (teatro), non trattato
  String.raw`\b(?:de|en|villa de|cortes de|ordenamiento de) madrigal\b`,
  String.raw`\bmadrigal de las altas torres\b`,
  // bibliografia: titoli di studi («Bibliogr.: The Milan Partbooks ...»)
  String.raw`\bBibliogr(?:afia|aphy|aphie|af[ií]a|\.)\s*:[^|]*`,
  // guardie e fogli di riuso
  String.raw`\b(?:fogli di guardia|carte di guardia|guard ?leaves|feuillets de garde|vorsatzbl\w*)\b[^.;|]{0,80}(?:notation|neumes|neumen|noten|notazione|neumatica)`,
  String.raw`\bpiezas? (?:\w+ )?de m[uú]sica\b|\b(?:pieza|piezas|papel|papeles|obra|maestro|profesor|escuela|academia|teatro|instrumentos?|compañía|director|capilla) de m[uú]sica\b`,
  // notazione prevista e mai scritta; cataloghi di raccolte musicali
  String.raw`\b(?:espacios? para|space (?:left )?for|spazio per|place pour|platz für)\s+(?:\w+\s+){0,2}?(?:la |the |le |die )?(?:notaci[oó]n|notation|notazione|neumes|neumen|noten|music|m[uú]sica)\b[^.;|]*`,
  String.raw`\b(?:katalog|catalog|catalogue|verzeichnis|inventar|inventaire|inventory|index|catálogo|catalogo)\b[^;|]{0,80}(?:musikalien\w*|music\w*|musique|m[uú]sica\w*)`,
  // «Mus.» del Museo Ashmolean (Bodleian «MS. e Mus.»): non musica
  String.raw`\be Mus\.`,
], "gi");

const SEGNI = re([
  // notazione
  String.raw`\bneum(?:e|es|en|ed|i|atic|atique|atica|atico|atischen?|ierte?n?|iert)\b`,
  String.raw`\b(?:musical|music|musik|musique|musicale|musical|nota) ?notation\b|\bnotation (?:musicale|music|neumatique|en neumes|carrée|carree|aquitaine|messine|lorraine|bretonne|française|sangallienne|byzantine|mensurale?|ekphonetic|ecphonetic|alphabétique|in neumes|on (?:a )?(?:staff|staves|lines))\b`,
  String.raw`\bnotazione (?:musicale|neumatica|quadrata|mensurale|gotica|beneventana|adiastematica|diastematica)\b|\bnotación (?:musical|neumática|cuadrada|mensural|aquitana)\b|\bnotacja muzyczna\b|\bnotace\b`,
  String.raw`\b(?:square|mensural|gothic|hufnagel|ekphonetic|ecphonetic|byzantine|staff|stave|aquitanian|beneventan|messine|st\.? gall|metz|diastematic|adiastematic) notation\b|\b(?:musik|choral|hufnagel|gotische |quadrat|mensural)notation\b|\bnotenschrift\b|\bchoralnoten\b|\bnotes? de musique\b`,
  String.raw`\b(?:with|and|including) (?:\w+\s+){0,2}?(?:music|musical notes|musical notation|neumes|notation)\b|\bmit (?:\w+\s+){0,1}?(?:noten|neumen|melodien|notation)\b|\bcon (?:\w+\s+){0,1}?(?:notazione|neumi|musica)\b|\bcon notación\b|\bavec (?:\w+\s+){0,1}?(?:notation|neumes|musique notée)\b`,
  String.raw`\bnotated\b|\b(?:bréviaire|missel|graduel|antiphonaire|processionnal|psautier|hymnaire|rituel|office|offices|livre|kyriale|prosaire|tropaire|lectionnaire)s? notés?\b|\bmusique notée\b`,
  // libri di canto
  String.raw`\bantipho?na(?:r|ry|ries|rium|ria|rius|le|l|ire|ires|rio|rios|rij|re)\b|\bantifonari[oe]?\b|\bantifon[aá]ri[oa]s?\b|\bantyfonarz\w*|\bantifonál\w*|\bantiphonál\w*`,
  String.raw`\bgradua(?:le|lia|lis)\b|\bgraduel(?:s)?\b|\bgraduál\w*|\bgraduał\w*|\bgradual(?:es)?\b(?! (?:decline|change|increase|growth|development|transition|process|loss|shift|introduction|replacement|disappearance|abandonment))`,
  String.raw`\bkyrial(?:e|is|ia)\b|\btropar(?:ium|io|y|ies)\b|\btroper\b|\btropaire\b|\bsequenti(?:ar|ar(?:ium|y|ies)|onale)\b|\bprosa(?:rium|ire)\b|\bcantatori(?:um|o)\b`,
  String.raw`\bhymna(?:r|rium|rius|ry|ries|ire|rio)\b|\binnari[oa]\b|\bhimnari[oa]\b|\bprocession(?:al|ale|ali|ar|arium|nal|nale|nals|ario)\b|\bcantional(?:e)?\b|\bkancjonał\w*|\bkantional\w*|\bcantorinus\b|\bliber usualis\b|\bresponsoria(?:le|l)\b|\bvesperale\b|\bpsalterium (?:cum notis|notatum)\b`,
  // polifonia, intavolature, partiture, parti
  String.raw`\bpolyphon\w*|\bpolifoni\w*|\bmehrstimmig\w*|\bwielogłos\w*|\bmotet(?:s|ten|ti|es)?\b|\bmottett[io]\b|\bmadrigal\w*|\bchoir ?books?\b|\bchorb(?:uch|ücher)\b|\blibro de coro\b|\bcorali?\b(?= (?:miniat|liturgic|del|della|di|membranac))`,
  String.raw`\btablatur\w*|\btablature\w*|\bintavolatur\w*|\btabulatur\w*|\bcifra para\b|\borgelbuch\b|\borgan books?\b|\bliber organi\b`,
  String.raw`\bpartitur(?:a|e|en)?\b|\bpartytur\w*|\bpartition(?:s)? (?:d'orchestre|musicale|pour|chant|réduite)\b|\b(?:full|vocal|piano|orchestral|manuscript|conducting|short) scores?\b|\bmusical scores?\b|\bscores? \(music\)|\bscore and parts\b`,
  String.raw`\bpart[- ]?books?\b|\bstimmb(?:uch|ücher)\b|\bstimmen\b(?= ?[;,.)]| (?:zu|für|der|des))|\blibri? (?:di|delle) parti\b`,
  // manoscritti musicali in genere (non i canzonieri, Liederbücher e songbooks: spesso solo testi)
  String.raw`\bmusikhandschrift\w*|\bmusikalien\w*|\bmusic manuscripts?\b|\bmanuscript music\b|\bmusic -- manuscripts\b|\bmusique -- manuscrits\b|\bmanuscrits musicaux\b|\bmusique manuscrite\b|\brękopisy muzyczne\b|\bmuzyka (?:wokalna|instrumentalna|religijna|kościelna|świecka|polska|niemiecka|włoska)\b|\bhudebnin\w*|\bhudební rukopis\w*|\bmanoscritti musicali\b|\bmanuscritos musicales\b`,
  // teoria musicale
  String.raw`\b(?:tractatus|liber|ars|summa|opusculum|regulae?|traité|trattato|tratado|treatise|traktat) (?:\w+\s+){0,2}?(?:de )?musica[el]?\b|\bde (?:institutione |harmonica )?musica\b|\bmusica (?:enchiriadis|theorica|practica|plana|mensurabilis|speculativa|disciplina)\b|\bscolica enchiriadis\b|\bmicrologus\b(?= (?:de|guidonis|guido))|\bguido(?:nis)? aretin\w*|\bars cantus\b|\bcantus mensurabilis\b|\bmusiktraktat\w*|\bmusiktheori\w*|\bmusic theory\b|\bmusical theory\b|\bteoria musicale\b|\bthéorie musicale\b|\btraité de musique\b`,
  // musica bizantina e orientale
  String.raw`\bsticherar\w*|\bheirmolog\w*|\birmolog\w*|\bkontakar\w*|\basmatikon\b|\bpsaltikon\b|\banastasimatar\w*|\bpapadik\w*|\bkalophon\w*|\bmathemataria\b|\bznamenny\b`,
], "i");
// segnature delle sezioni musicali: «Mus.ms.», «Mus. Hs.», «Mus.123», Christ Church «Mus», Bodleian «MS. Mus.»
const SEGNATURA = /(?:^|\s|\()(?:Mus\.?\s?(?:ms|Ms|MS|Hs|Hss|Sch|[a-z]\.|\d|[IVX]+\.)|MS\.? Mus\.|MS Mus\b|Christ Church Mus\b|Mus\. ?pr\.)/;
// giapponese e cinese: notazioni musicali, shōmyō, gagaku, koto e qin
const SEGNI_CJK = /楽譜|樂譜|箏譜|琴譜|笛譜|笙譜|篳篥譜|琵琶譜|神楽譜|雅楽|雅樂|工尺譜|減字譜|曲譜|聲明|声明(?!書|文)|博士付|墨譜/;

// filtro veloce: senza nessuna di queste radici non c'è niente da cercare
const RADICI = /neum|notat|nota[cz]|notenschrift|choralnot|notes? de musique|music|musik|musique|musica|muzyk|hudeb|noten|melodien|neumi|antiph|antif|antyf|gradua|kyrial|tropa|troper|sequen|prosa|cantator|hymna|innari|himnari|process|cantional|kancjona|kantional|cantorinus|usualis|responsori|vesperal|psalterium|polyph|polifon|mehrstimm|wieloglos|wielogłos|motet|mottett|madrigal|choir|chorb|coro|corali|tablat|intavol|tabulat|cifra|orgel|organ|partit|partyt|score|part.?book|stimm|libri? d|liederb|liederh|songbook|traktat|micrologus|guido|cantus|sticher|heirmol|irmol|kontak|asmatik|psaltik|anastasim|papadik|kalophon|mathemat|znamenn|譜|声明|聲明|雅楽|雅樂|催馬楽|博士付/i;

/* la voce è un codice musicale? r: { titolo, descrizione, generi, tecnica, indice, segnatura, tipo } */
export function musicaDa(r) {
  if (!r || /^carta/.test(r.tipo || "")) return false;
  const seg = String(r.segnatura || "");
  if (SEGNATURA.test(seg) && !/\be Mus\./.test(seg)) return true;
  const grezzo = [r.titolo, testo(r.descrizione), testo(r.generi), testo(r.tecnica), testo(r.indice)].filter(Boolean).join(" | ");
  if (!grezzo) return false;
  if (!RADICI.test(grezzo)) return false;
  const t = grezzo.replace(NEGATI, " ");
  return SEGNI.test(t) || SEGNI_CJK.test(t);
}

// per le verifiche a mano: il tratto di testo che ha fatto scattare il riconoscimento (o null)
export function perche(r) {
  if (!musicaDa(r)) return null;
  const grezzo = [r.titolo, testo(r.descrizione), testo(r.generi), testo(r.tecnica), testo(r.indice)].filter(Boolean).join(" | ").replace(NEGATI, " ");
  for (const x of [SEGNI, typeof SEGNI_MINUSCOLI !== "undefined" ? SEGNI_MINUSCOLI : null, SEGNI_CJK, typeof EHON !== "undefined" ? EHON : null]) {
    const m = x && grezzo.match(x); if (m) return grezzo.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
  }
  return "segnatura: " + r.segnatura;
}
