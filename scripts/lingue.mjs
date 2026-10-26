// Lingue e secoli delle voci del catalogo.
// lingue: codici brevi (la, grc, it, ...) dai metadati della fonte (codici ISO 639 o nomi in varie lingue);
// se la fonte non dice nulla, si prova con la segnatura (Vat. gr., Clm, Cod. Pal. germ., Grec 1234) e con il titolo («(Latin)», «graece»).
// secolo: [primo, ultimo] secolo dopo Cristo ricavato dalla datazione («10.-11. Jh.», «sec. XI», «1463», «0801-0900», «9th century»).

export const NOMI_LINGUE = {
  la: "latino", grc: "greco", it: "italiano", fr: "francese", de: "tedesco", en: "inglese", es: "spagnolo", pt: "portoghese", ca: "catalano", oc: "occitano",
  nl: "nederlandese", he: "ebraico", ar: "arabo", syr: "siriaco", cop: "copto", hy: "armeno", ka: "georgiano", gez: "etiopico", fa: "persiano", tr: "turco",
  cu: "slavo ecclesiastico", ru: "russo", cs: "ceco", pl: "polacco", hu: "ungherese", sv: "svedese", da: "danese", is: "islandese e norreno", ga: "irlandese", cy: "gallese",
  gl: "galego", zh: "cinese", ja: "giapponese", ko: "coreano", sa: "sanscrito", bo: "tibetano", ms: "malese", jv: "giavanese",
  pi: "pali", lo: "lao", th: "thailandese", nod: "thai settentrionale (lanna)", khb: "tai lü", shn: "shan", my: "birmano", km: "khmer", vi: "vietnamita (hán-nôm)",
  mn: "mongolo", mnc: "mancese", nxq: "naxi", btk: "batak", bug: "bugi", su: "sundanese", ban: "balinese", sla: "lingue slave (alfabeto cirillico)",
  // Hawaii e lingue indigene delle Americhe (dal 26 ottobre 2026)
  haw: "hawaiano", nah: "nahuatl", myn: "lingue maya", oto: "otomí e lingue otomiane", zap: "zapoteco", mix: "mixteco", tsz: "purépecha (tarasco)",
  cai: "altre lingue indigene di Mesoamerica e America centrale", qu: "quechua", ay: "aymara", gn: "guaraní", tup: "tupi",
  sai: "altre lingue indigene del Sud America", chr: "cherokee", dak: "dakota e lakota", oji: "ojibwe", cre: "cree", moh: "mohawk",
  iro: "lingue irochesi", alg: "lingue algonchine", nai: "altre lingue indigene del Nord America",
  pit: "pittografia mesoamericana (senza testo alfabetico)",
  xx: "altre lingue",
};

// codici ISO 639-1/2/3 e nomi (latino, italiano, inglese, tedesco, francese) -> codice breve
const CODICI = {
  la: "la", lat: "la", latin: "la", latein: "la", latino: "la", latine: "la", lateinisch: "la", latina: "la",
  grc: "grc", gre: "grc", gr: "grc", el: "grc", ell: "grc", gkm: "grc", greek: "grc", griechisch: "grc", grec: "grc", greco: "grc", grecque: "grc", graece: "grc", graecus: "grc",
  it: "it", ita: "it", italian: "it", italienisch: "it", italien: "it", italiano: "it", italienne: "it",
  fr: "fr", fre: "fr", fra: "fr", fro: "fr", frm: "fr", french: "fr", franzosisch: "fr", francais: "fr", francaise: "fr", francese: "fr", "anglo-norman": "fr", xno: "fr",
  de: "de", ger: "de", deu: "de", gmh: "de", goh: "de", gml: "de", nds: "de", german: "de", deutsch: "de", allemand: "de", tedesco: "de",
  en: "en", eng: "en", enm: "en", ang: "en", english: "en", englisch: "en", anglais: "en", inglese: "en",
  es: "es", spa: "es", spanish: "es", castilian: "es", spanisch: "es", espagnol: "es", spagnolo: "es",
  pt: "pt", por: "pt", portuguese: "pt", ca: "ca", cat: "ca", catalan: "ca", oc: "oc", oci: "oc", pro: "oc", occitan: "oc", provencal: "oc",
  nl: "nl", dut: "nl", nld: "nl", dum: "nl", dutch: "nl", niederlandisch: "nl", neerlandais: "nl",
  he: "he", heb: "he", hbo: "he", hebrew: "he", hebraisch: "he", hebreu: "he", ebraico: "he",
  ar: "ar", ara: "ar", arabic: "ar", arabisch: "ar", arabe: "ar", arabo: "ar",
  syr: "syr", syc: "syr", syriac: "syr", syrisch: "syr", syriaque: "syr", siriaco: "syr",
  cop: "cop", coptic: "cop", koptisch: "cop", copte: "cop", copto: "cop",
  hy: "hy", arm: "hy", hye: "hy", xcl: "hy", armenian: "hy", armenisch: "hy", armenien: "hy", armeno: "hy",
  ka: "ka", geo: "ka", kat: "ka", georgian: "ka", georgisch: "ka",
  gez: "gez", eth: "gez", ethiopic: "gez", geez: "gez", amh: "gez", amharic: "gez", athiopisch: "gez", ethiopien: "gez",
  fa: "fa", per: "fa", fas: "fa", persian: "fa", persisch: "fa", persan: "fa", persiano: "fa",
  tr: "tr", tur: "tr", ota: "tr", turkish: "tr", turkisch: "tr", turc: "tr", turco: "tr",
  cu: "cu", chu: "cu", "church slavonic": "cu", slavonic: "cu", kirchenslavisch: "cu", ru: "ru", rus: "ru", russian: "ru",
  cs: "cs", cze: "cs", ces: "cs", czech: "cs", tschechisch: "cs", pl: "pl", pol: "pl", polish: "pl", polnisch: "pl", hu: "hu", hun: "hu", hungarian: "hu", ungarisch: "hu",
  sv: "sv", swe: "sv", swedish: "sv", da: "da", dan: "da", danish: "da", is: "is", ice: "is", isl: "is", non: "is", icelandic: "is", "old norse": "is", norse: "is",
  ga: "ga", gle: "ga", sga: "ga", mga: "ga", irish: "ga", cy: "cy", wel: "cy", cym: "cy", welsh: "cy",
  zh: "zh", chi: "zh", zho: "zh", chinese: "zh", ja: "ja", jpn: "ja", japanese: "ja", ko: "ko", kor: "ko", korean: "ko",
  // nomi spagnoli, catalani, portoghesi e galeghi (biblioteche della penisola iberica)
  espanol: "es", castellano: "es", castella: "es", castelhano: "es", espanhol: "es", aljamiado: "es", llati: "la", griego: "grc", grego: "grc", hebreo: "he", hebraico: "he",
  frances: "fr", italia: "it", aleman: "de", alemany: "de", alemao: "de", ingles: "en", angles: "en", portugues: "pt", catala: "ca", valenciano: "ca", valencia: "ca",
  gl: "gl", glg: "gl", gallego: "gl", galego: "gl", galec: "gl", occita: "oc",
  sa: "sa", san: "sa", sanskrit: "sa", bo: "bo", tib: "bo", bod: "bo", tibetan: "bo", ms: "ms", may: "ms", msa: "ms", malay: "ms", jv: "jv", jav: "jv", javanese: "jv",
  // Asia orientale e Sud-est asiatico (dal 26 ottobre 2026)
  pi: "pi", pli: "pi", pali: "pi", lo: "lo", lao: "lo", th: "th", tha: "th", thai: "th", siamese: "th", nod: "nod", "lan na": "nod", lanna: "nod", "northern thai": "nod", yuan: "nod", "tai yuan": "nod",
  khb: "khb", "tai lue": "khb", "tai lu": "khb", lue: "khb", shn: "shn", shan: "shn", "tai yai": "shn", my: "my", bur: "my", mya: "my", burmese: "my", myanmar: "my", birmano: "my",
  km: "km", khm: "km", khmer: "km", cambodian: "km", vi: "vi", vie: "vi", vietnamese: "vi", vietnamita: "vi", nom: "vi", "han nom": "vi", "chu nom": "vi",
  mn: "mn", khk: "mn", mongolian: "mn", mongolisch: "mn", mnc: "mnc", manchu: "mnc", mandschu: "mnc", mandschurisch: "mnc", nxq: "nxq", naxi: "nxq", nakhi: "nxq",
  btk: "btk", batak: "btk", bug: "bug", buginese: "bug", bugis: "bug", su: "su", sun: "su", sundanese: "su", ban: "ban", balinese: "ban",
  // Hawaii e Americhe (dal 26 ottobre 2026): codici ISO 639-2/3 delle schede (Gallica, Internet Archive, Penn, Yale, Newberry) e nomi;
  // le lingue maya hanno un codice solo («myn»), come le irochesi e le algonchine (tranne ojibwe e cree, che hanno il loro)
  haw: "haw", hawaiian: "haw", hawaiano: "haw", hawaien: "haw", "olelo hawaii": "haw",
  nah: "nah", nci: "nah", nhn: "nah", nhe: "nah", azz: "nah", ngu: "nah", nahuatl: "nah", "nahuatl languages": "nah", "classical nahuatl": "nah", aztec: "nah", nahua: "nah",
  mexicano: "nah", "lengua mexicana": "nah", "idioma mexicano": "nah", mexicain: "nah", "langue mexicaine": "nah", nahuatle: "nah",
  myn: "myn", yua: "myn", quc: "myn", cak: "myn", tzj: "myn", tzh: "myn", tzo: "myn", kek: "myn", mam: "myn", poc: "myn", poh: "myn", ixl: "myn", hus: "myn", chf: "myn",
  cac: "myn", jac: "myn", toj: "myn", ttc: "myn", usp: "myn", acr: "myn", mop: "myn", itz: "myn", lac: "myn", caa: "myn", ctu: "myn", huastec: "myn", huasteco: "myn",
  maya: "myn", mayan: "myn", "mayan languages": "myn", "maya language": "myn", yucatec: "myn", yucateco: "myn", "yucatec maya": "myn", quiche: "myn", kiche: "myn", "k iche": "myn",
  cakchiquel: "myn", cakchikel: "myn", kaqchikel: "myn", tzotzil: "myn", tzeltal: "myn", kekchi: "myn", "q eqchi": "myn", pokomchi: "myn", tzutujil: "myn", tzutuhil: "myn",
  oto: "oto", ote: "oto", otq: "oto", otomi: "oto", otomian: "oto", "otomian languages": "oto", mazahua: "oto", matlatzinca: "oto", matlaltzinga: "oto",
  zap: "zap", zapotec: "zap", zapoteco: "zap", zapoteca: "zap", mix: "mix", mixtec: "mix", mixteco: "mix", mixteca: "mix",
  tsz: "tsz", pua: "tsz", tarasco: "tsz", tarascan: "tsz", tarasca: "tsz", purepecha: "tsz", "lengua de michoacan": "tsz",
  cai: "cai", "central american indian languages": "cai", "central american indian": "cai", totonac: "cai", totonaco: "cai", zoq: "cai", zoque: "cai", cip: "cai", mixe: "cai",
  chinantec: "cai", chinanteco: "cai", huichol: "cai", cora: "cai", tepehuan: "cai", opata: "cai", yaqui: "cai", "uto-aztecan languages": "cai",
  qu: "qu", que: "qu", quz: "qu", qub: "qu", quechua: "qu", quichua: "qu", kichwa: "qu", runasimi: "qu", ay: "ay", aym: "ay", aymara: "ay",
  gn: "gn", grn: "gn", gug: "gn", guarani: "gn", tup: "tup", tpn: "tup", tpw: "tup", tupi: "tup", tupinamba: "tup", "lingua geral": "tup",
  sai: "sai", "south american indian languages": "sai", "south american indian": "sai", arn: "sai", mapudungun: "sai", araucanian: "sai", mapuche: "sai",
  chiquito: "sai", chiquitano: "sai", cax: "sai", yuz: "sai", kiriri: "sai", moxo: "sai",
  chr: "chr", cherokee: "chr", dak: "dak", lkt: "dak", dakota: "dak", lakota: "dak", sioux: "dak", "siouan languages": "dak", sio: "dak",
  oji: "oji", oj: "oji", ciw: "oji", otw: "oji", ojibwe: "oji", ojibwa: "oji", ojibway: "oji", chippewa: "oji", ottawa: "oji", odawa: "oji", "algonquin": "oji",
  cre: "cre", cr: "cre", crk: "cre", cree: "cre", moh: "moh", mohawk: "moh",
  iro: "iro", iroquoian: "iro", "iroquoian languages": "iro", huron: "iro", wyandot: "iro", wya: "iro", onondaga: "iro", ono: "iro", seneca: "iro", see: "iro", oneida: "iro", cayuga: "iro", tuscarora: "iro",
  alg: "alg", algonquian: "alg", "algonquian languages": "alg", abenaki: "alg", abnaki: "alg", abe: "alg", aaq: "alg", massachusett: "alg", wampanoag: "alg", wam: "alg", natick: "alg",
  del: "alg", delaware: "alg", lenape: "alg", munsee: "alg", mic: "alg", micmac: "alg", "mi kmaq": "alg", shawnee: "alg", menominee: "alg", potawatomi: "alg", "fox": "alg", "illinois": "alg", blackfoot: "alg", cheyenne: "alg", arapaho: "alg",
  nai: "nai", "north american indian languages": "nai", "north american indian": "nai", nav: "nai", navajo: "nai", navaho: "nai", apache: "nai", mus: "nai", creek: "nai", muskogee: "nai",
  cho: "nai", choctaw: "nai", chickasaw: "nai", chn: "nai", chinook: "nai", esk: "nai", iku: "nai", ike: "nai", eskimo: "nai", inuit: "nai", inuktitut: "nai", aleut: "nai", ale: "nai",
  sal: "nai", salish: "nai", kalispel: "nai", hai: "nai", haida: "nai", tli: "nai", tlingit: "nai", hop: "nai", hopi: "nai", zun: "nai", zuni: "nai",
};
const NULLI = new Set(["", "und", "mul", "zxx", "mis", "x-unknown", "unknown", "unbekannt", "multiple languages", "mehrsprachig", "non indicata", "n/a", "unbestimmt", "sans contenu linguistique",
  "ancient", "modern", "medieval", "classical", "old", "middle", "early modern", "to", "late", "byzantine"]);
const semplice = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z -]+/g, " ").replace(/\s+/g, " ").trim();

// valori di lingua della fonte («lat», «Latin», «Greek, Ancient (to 1453)», «Middle English») -> codici, senza doppioni
export function lingueDa(valori) {
  const out = [];
  for (const v0 of [].concat(valori || [])) {
    for (const parte of String(v0 || "").split(/[;,/|]| and | und | et /)) {
      const s = semplice(parte); if (NULLI.has(s)) continue;
      let c = CODICI[s];
      if (!c) { for (const w of s.split(" ")) { if (CODICI[w] && w.length > 3) { c = CODICI[w]; break; } } }   // «middle english», «ancient greek»
      if (!c && s.length > 1) c = "xx";
      if (c && !out.includes(c)) out.push(c);
    }
  }
  return out;
}

// ------------------------------------------------------------------ Hawaii e lingue indigene delle Americhe (dal 26 ottobre 2026)
// Molte schede danno per queste lingue solo «altre lingue» (codici di famiglia, nomi non riconosciuti) o nessuna lingua: se il
// titolo nomina la lingua in modo esplicito («en lengua otomi», «Vocabulario … cakchiquel», «in Nahuatl», «Codex maya»), quella
// lingua prende il posto di «altre lingue». Le parole ambigue («maya», «cree», «huron») contano solo dentro formule nette.
const INDIGENE = [
  ["nah", /\bnahuatl\b|\bnahoa\b|\b(?:lengua|idioma|lingua|langue) mexican[ao]e?\b|\ben (?:lengua |idioma )?mexicano\b|\bmexicanos?\b(?= y castellan)|\bmejicano\b|\bsermones mexicanos\b|\bcatecismos mexicanos\b/],
  ["myn", /\b(?:lengua|idioma|langue|ydioma) (?:de )?(?:maya|yucatec[ao]|quiche|kiche|cakchiquel|tzotzil|tzeltal|tzendal|mam|pokomchi|kekchi)\b|\bmaya[- ](?:espanol|dtan|hispano|language|handschrift)|\bmayahandschrift\b|\b(?:codex|codice|code) (?:maya|peresianus|tro|cortesianus)\b|\bmaya (?:codex|manuscript)\b|\bcakchi ?(?:quel|kel|q)|\bkaqchikel\b|\bquiche\b|\byucatec[ao]?\b|\bmayan languages?\b|\bchilam balam\b|\bpopol vuh\b/],
  ["oto", /\botomi\b|\bmatlatzinca\b|\bmatlaltzinga\b|\bmazahua\b/],
  ["zap", /\bzapotec[ao]?\b|\bzaapotec/],
  ["mix", /\bmixtec[ao]?\b/],
  ["tsz", /\btarasc[ao]\b|\b(?:lengua|idiomas?|ydiomas?) de mich[uo]acan\b|\bpurepecha\b/],
  ["cai", /\b(?:lengua|idioma) (?:cora|tepeguana|tepehuana|opata|teguima|zoque|coque|totonaca|chinanteca|mixe|huichola?|chiapaneca|pima|tarahumara|mayo|yaqui|hyaqui)\b|\bchinantec\b|\bhispano-hyaqui\b/],
  ["qu", /\bquechua\b|\bquichua\b|\blengua general (?:de los indios )?del peru\b/],
  ["ay", /\baymara\b/],
  ["gn", /\bguarani(?:es|s)?\b/],
  ["sai", /\blengua chiquita\b|\bmapudungun\b|\baraucan[ao]?\b|\bkiriri\b|\blengua moxa\b/],
  ["chr", /\bcherokee\b/],
  ["oji", /\bojibw\w*|\bchippewa\b|\bodawa\b|\botaoak|\botchipwe/],
  ["cre", /\bcree (?:language|indians|syllabic|hymns?)\b|\b(?:langue|language) (?:des )?cris?\b/],
  ["dak", /\blakota\b|\bdakota (?:language|grammar|dictionary|hymns?|bible)\b/],
  ["moh", /\bmohawk\b/],
  ["iro", /\bhuron\b(?! lake)|\biroquois\b|\bonondaga\b|\bonontagu/],
  ["alg", /\babenak\w*|\babnaki\b|\bmicmac\b|\bmi'?kmaq\b|\blenape\b|\bdelaware (?:language|indians)\b|\balgonqui\w*|\bmassachusett? (?:language|indians)\b/],
  ["haw", /\bhawaiian (?:language|manuscript|genealog\w*|chants?|meles?)\b|\bhawaiano\b|\bolelo hawaii\b|\bin hawaiian\b/],
];
export function lingueIndigeneDaTitolo(titolo) {
  const t = String(titolo || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ʻ‘’]/g, "'").toLowerCase();
  return INDIGENE.filter(([, re]) => re.test(t)).map(([c]) => c);
}
// codici pittografici e geroglifici mesoamericani che la biblioteca descrive con la lingua del commento o con una lingua sbagliata
// (la Vaticana dà «latino» a tutti i Vat. lat.): segnatura esatta, biblioteca -> lingue
const LINGUE_CODICI = [
  [/Vaticana/, "Vat. lat. 3738", ["pit", "it"]],        // Codex Ríos (Vaticanus A): pittografia con commento italiano
  [/Vaticana/, "Vat. lat. 3773", ["pit"]],              // Codex Vaticanus B
  [/Vaticana/, "Borg. mess. 1", ["pit"]],               // Codex Borgia
  [/Vaticana/, "Borg. mess. 2", ["pit"]],
  [/Dresden/, "Mscr.Dresd.R.310", ["myn"]],             // Codex Dresdensis (scrittura maya)
  [/Biblioth[eè]que nationale/, "Mexicain 386", ["myn"]], // Codex Peresianus
  [/Bodleian/, "MS. Laud Misc. 678", ["pit"]],          // Codex Laud
  [/Bodleian/, "MS. Mex. d. 1", ["pit"]],               // Codex Bodley
  [/Bodleian/, "MS. Arch. Selden. A. 2", ["pit"]],      // Codex Selden
];
// lingue di una voce corrette per le lingue indigene: codici noti, poi il titolo al posto di «altre lingue» (o se non c'è lingua)
export function correggiIndigene(v) {
  const fisso = LINGUE_CODICI.find(([b, s]) => s === v.segnatura && b.test(v.biblioteca || ""));
  if (fisso) return { lingue: fisso[2], dedotta: false };
  const lingue = v.lingue || [];
  if (lingue.length && !lingue.includes("xx")) return null;
  const ind = lingueIndigeneDaTitolo(v.titolo).filter(c => !lingue.includes(c));
  if (!ind.length) return null;
  return { lingue: [...new Set([...ind, ...lingue.filter(l => l !== "xx")])], dedotta: !lingue.length || !!v.lingua_dedotta };
}

// ------------------------------------------------------------------ lingua dedotta (quando la fonte non la dà)
// 1) dal fondo o dalla segnatura (Clm, Cgm, Cod.graec., Vat. gr., Cod. Pal. germ., Grec 2934, Voss. Lat., BPG ...);
// 2) dal titolo: segni espliciti («(Latin)», «graece»), poi l'alfabeto (greco, ebraico, arabo, siriaco, cirillico, cinese, giapponese,
//    coreano, armeno, georgiano, etiopico), poi per l'alfabeto latino parole frequenti, solo se il segnale è netto.
// Ciò che resta incerto resta senza lingua («non indicata»).
const FONDI = {
  la: ["lat", "latin", "latine", "latini", "latina", "latino", "clm", "vlf", "vlq", "vlo", "vlm"],   // BPL di Leida = «Bibliotheca Publica Latina», non la lingua
  grc: ["gr", "graec", "graeca", "graecus", "grec", "grecque", "greek", "griech", "bpg", "vgf", "vgq", "vgo", "vgm", "coislin", "barocci", "barocc"],
  de: ["germ", "cgm", "allemand", "deutsch"], fr: ["gall", "francais", "francaise", "naf"], it: ["ital", "italien", "italienne"],
  es: ["hisp", "espagnol", "espagnole"], en: ["angl", "anglais", "engl"], nl: ["neerl", "neerlandais", "ltk", "bnm"], pt: ["portugais", "lusit"],
  he: ["hebr", "ebr", "hebreu", "neofiti"], ar: ["arab", "arabe"], syr: ["syr", "sir", "syriaque", "syriac"], cop: ["copt", "copte"],
  hy: ["arm", "armen", "armenien", "armenienne"], ka: ["georg", "georgien"], gez: ["aethiop", "ethiop", "ethiopien"], fa: ["pers", "persan"],
  tr: ["turc", "turk"], cu: ["slav", "slave"], zh: ["sinica", "chin", "chinois"], ja: ["jap", "japon", "japonais"], ko: ["kor", "coreen"],
  sa: ["sanscr", "sansk", "sanscrit", "skt"], bo: ["tibet", "tibetain"], ms: ["malay", "malais", "indon"],
};
const TOKEN_FONDO = new Map(Object.entries(FONDI).flatMap(([c, ts]) => ts.map(t => [t, c])));
export function lingueDaSegnatura(seg) {
  const toks = String(seg || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const out = [];
  toks.forEach((t, i) => {
    let c = TOKEN_FONDO.get(t);
    // abbreviazioni brevi solo dopo un fondo noto: «Vat. ar.», «Borg. et.», «Vat. et.»
    // («sin» solo nei fondi della BSB: nei Plutei della Laurenziana è «sinistra»)
    if (!c && i > 0 && /^(vat|borg|barb|reg|ross|ott|urb|pal|cod)$/.test(toks[i - 1])) c = { ar: "ar", et: "gez" }[t];
    if (!c && i > 0 && toks[i - 1] === "cod" && t === "sin") c = "zh";
    if (c && !out.includes(c)) out.push(c);
  });
  return out.length === 1 ? out : out.length > 1 && out.includes("la") && out.length === 2 && out.includes("grc") ? out : out.slice(0, 1);
}

const SEGNI = [
  [/\bin arabic\b/i, "ar"], [/\bin hebrew\b/i, "he"], [/\bin syriac\b/i, "syr"], [/\bin persian\b/i, "fa"], [/\bin (?:ottoman )?turkish\b/i, "tr"], [/\bin malay\b/i, "ms"], [/\bin javanese\b/i, "jv"],
  [/\(latin\b|\bin latin\b|\blateinisch|\blatine\b|\bin latino\b/i, "la"], [/\(greek\b|\bin greek\b|\bgriechisch|\bgraece\b/i, "grc"],
  [/\(hebrew\b|\bhebräisch|\bhebraice\b/i, "he"], [/\(arabic\b|\barabisch\b|\barabice\b/i, "ar"], [/\(syriac\b|\bsyrisch\b|\bsyriace\b/i, "syr"],
  [/\((?:middle |old )?english\b/i, "en"], [/\((?:old |middle )?french\b|\(anglo-norman\b/i, "fr"], [/\((?:middle )?dutch\b|\bmittelniederländisch/i, "nl"],
  [/\((?:middle high )?german\b|\bmittelhochdeutsch|\bfrühneuhochdeutsch/i, "de"], [/\(italian\b|\bin volgare\b/i, "it"],
];
const ALFABETI = [
  ["grc", /[Ͱ-Ͽἀ-῿]/g], ["he", /[֐-׿]/g], ["ar", /[؀-ۿݐ-ݿ]/g], ["syr", /[܀-ݏ]/g],
  ["sla", /[Ѐ-ӿ]/g], ["ja", /[぀-ヿ]/g], ["zh", /[一-鿿]/g], ["ko", /[가-힯]/g], ["hy", /[԰-֏]/g],
  ["ka", /[Ⴀ-ჿ]/g], ["gez", /[ሀ-፿]/g],
];
// parole frequenti; non contano le parole tipiche delle schede di catalogo («and other texts», «u.a.», «Sammelhandschrift»)
const PAROLE = {
  la: "et in ad cum est quod qui quae sive seu super ex per sancti sancta beati liber libri libellus epistola epistolae epistula epistulae sermo sermones vita opera ac ab non sunt eius secundum contra incipit explicit domini dei",
  it: "il lo gli della delle dello degli dei che per con nel nella alla sono libro trattato storia lettera lettere opere vita del",
  fr: "le les des du une sur dans est sont livre traite histoire lettres oeuvres vie roy roi",
  de: "der die das und von mit zu im des dem den ein eine einer uber aus auf ist nicht buch",
  es: "el los las del por con una libro historia vida cartas que",
  nl: "het een van ende boec boek ofte",
};
// (niente inglese: è la lingua delle schede di catalogo di Leida e Oxford, non dei testi)
const PAROLA = new Map(); for (const [c, s] of Object.entries(PAROLE)) for (const w of s.split(" ")) { if (!PAROLA.has(w)) PAROLA.set(w, []); PAROLA.get(w).push(c); }
const SCHEDA = /,?\s*and other text\(s\)|\[?u\.\s?a\.\]?|\bsammelhandschrift\b|\bcomposite manuscript\b|\bfragment(?:e|s)?\b/gi;
export function lingueDaTitolo(titolo) {
  const t = String(titolo || "");
  for (const [re, c] of SEGNI) if (re.test(t)) return [c];
  // alfabeti non latini: almeno 3 lettere e più della metà delle lettere del titolo
  const lettere = (t.match(/\p{L}/gu) || []).length;
  for (const [c, re] of ALFABETI) { const n = (t.match(re) || []).length; if (n >= 3 && n > lettere / 2) return [c === "zh" && /[぀-ヿ]/.test(t) ? "ja" : c]; }
  // alfabeto latino: almeno 2 parole della lingua, nessun'altra lingua con più della metà dei suoi segnali
  const parole = t.replace(SCHEDA, " ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const conti = {};
  for (const w of parole) for (const c of PAROLA.get(w) || []) conti[c] = (conti[c] || 0) + 1;
  const ord = Object.entries(conti).sort((a, b) => b[1] - a[1]);
  if (ord.length && ord[0][1] >= 2 && (!ord[1] || ord[1][1] * 2 < ord[0][1])) return [ord[0][0]];
  return [];
}

// lingue dedotte per un codice senza lingua dichiarata; autori: riconosciuti (se il titolo è un titolo latino di catalogo
// per un autore greco, come nelle schede del Bandini, la lingua resta incerta)
export function deduciLingue(segnatura, titolo, autori = []) {
  const s = lingueDaSegnatura(segnatura); if (s.length) return s;
  // manoscritti musicali (Mus.ms. della BSB): titoli di brani, le parole non dicono la lingua
  if (/^Mus\b/i.test(String(segnatura || ""))) { const t = lingueDaTitolo(String(titolo || "").replace(/[A-Za-z]/g, "")); return t; }
  const t = lingueDaTitolo(titolo);
  if (t[0] === "la" && autori.length && autori.every(a => a.categoria === "classico-greco" || a.lingua === "grc")) return [];
  return t;
}
// compatibilità
export const lingueDaTesto = (segnatura, titolo) => deduciLingue(segnatura, titolo);

// --------------------------------------------------------------- secoli
const ROMANI = { i: 1, v: 5, x: 10, l: 50, c: 100 };
function romano(s) {
  s = s.toLowerCase(); let n = 0;
  for (let i = 0; i < s.length; i++) { const a = ROMANI[s[i]], b = ROMANI[s[i + 1]] || 0; if (!a) return 0; n += a < b ? -a : a; }
  return n;
}
// datazione libera -> [primo secolo, ultimo secolo] (d.C., da 1 a 21) oppure null
export function secoli(datazione) {
  const s = String(datazione || "");
  if (!s.trim()) return null;
  const sec = [];
  // «10.-11. Jh.», «9th century», «9th-10th c.», «XIe siècle», «sec. XI», «s. IX-X», «saec. XII»
  const conSecolo = /jh\b|jahrhundert|century|cent\b|siècle|siecle|\bsec\b|\bsecolo|\bsaec|\bs\.\s*[ivx]|\bsæc|\bsieclo/i.test(s);
  if (conSecolo) {
    for (const m of s.matchAll(/\b(\d{1,2})\s*(?:\.|th|st|nd|rd|e|er|eme|ème)(?=[\s\-–/.,)]|$)/gi)) { const n = +m[1]; if (n >= 1 && n <= 21) sec.push(n); }
    for (const m of s.matchAll(/\b([IVXL]{1,6})(?:e|er|eme|ème)?\b/g)) { const n = romano(m[1]); if (n >= 1 && n <= 21) sec.push(n); }
  }
  // anni: «1463», «0801-0900», «ca. 825», «1401-1500» (fine secolo: 1500 è nel XV)
  if (!sec.length) {
    // anni dell'egira («935 AH / 1529 CE») esclusi: conta l'anno dell'era cristiana
    for (const m of s.matchAll(/(?<![\d.])(\d{3,4})(?![\d.]|\s*(?:\.|th|st)\s*(?:jh|cent)|\s*A\.?H\.?(?![a-z]))/gi)) {
      const y = +m[1]; if (y >= 100 && y <= 2030) sec.push(Math.floor((y - 1) / 100) + 1);
    }
  }
  if (!sec.length) return null;
  return [Math.min(...sec), Math.max(...sec)];
}
