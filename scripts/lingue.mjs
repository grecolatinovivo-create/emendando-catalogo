// Lingue e secoli delle voci del catalogo.
// lingue: codici brevi (la, grc, it, ...) dai metadati della fonte (codici ISO 639 o nomi in varie lingue);
// se la fonte non dice nulla, si prova con la segnatura (Vat. gr., Clm, Cod. Pal. germ., Grec 1234) e con il titolo («(Latin)», «graece»).
// secolo: [primo, ultimo] secolo dopo Cristo ricavato dalla datazione («10.-11. Jh.», «sec. XI», «1463», «0801-0900», «9th century»).

export const NOMI_LINGUE = {
  la: "latino", grc: "greco", it: "italiano", fr: "francese", de: "tedesco", en: "inglese", es: "spagnolo", pt: "portoghese", ca: "catalano", oc: "occitano",
  nl: "nederlandese", he: "ebraico", ar: "arabo", syr: "siriaco", cop: "copto", hy: "armeno", ka: "georgiano", gez: "etiopico", fa: "persiano", tr: "turco",
  cu: "slavo ecclesiastico", ru: "russo", cs: "ceco", pl: "polacco", hu: "ungherese", sv: "svedese", da: "danese", is: "islandese e norreno", ga: "irlandese", cy: "gallese",
  zh: "cinese", ja: "giapponese", ko: "coreano", sa: "sanscrito", bo: "tibetano", ms: "malese", jv: "giavanese", xx: "altre lingue",
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
  sa: "sa", san: "sa", sanskrit: "sa", bo: "bo", tib: "bo", bod: "bo", tibetan: "bo", ms: "ms", may: "ms", msa: "ms", malay: "ms", jv: "jv", jav: "jv", javanese: "jv",
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

// segnatura e titolo -> codici (solo se la fonte non dà la lingua)
const DA_SEGNATURA = [
  [/\b(lat|latin|latini?|clm)\b|\bnouvelle acquisition latine\b|\bnal\b|\bgud\.? lat\b|\blat\.\s/i, "la"],
  [/\b(gr|graec|graecus|grec|greek|gr\.)\b|\bcod\.?\s*graec\b|\bsupplément grec\b|\bcoislin\b/i, "grc"],
  [/\b(germ|cgm|allemand|deutsch)\b/i, "de"], [/\b(ital|italien)\b/i, "it"], [/\b(gall|français|francais|nouvelle acquisition française|naf)\b/i, "fr"],
  [/\b(hebr|ebr|hébreu|hebreu)\b/i, "he"], [/\b(arab|arabe|ar)\b(?![.-]?\s*\d+\s*(r|v)\b)/i, "ar"], [/\b(syr|sir|syriaque)\b/i, "syr"], [/\b(copt|copte)\b/i, "cop"],
  [/\b(arm|arménien)\b/i, "hy"], [/\b(pers|persan)\b/i, "fa"], [/\b(turc|türk|turk)\b/i, "tr"], [/\b(slav|slave)\b/i, "cu"], [/\b(hisp|espagnol)\b/i, "es"], [/\b(et|éthiopien|aeth)\b(?=\.?\s*\d)/i, "gez"],
];
const DA_TITOLO = [
  [/\(latin\b|\bin latin\b|\blateinisch|\blatine\b|\blatinus\b/i, "la"], [/\(greek\b|\bin greek\b|\bgriechisch|\bgraece\b|\bgraecus\b|[Ͱ-Ͽἀ-῿]{4,}/, "grc"],
  [/\(hebrew\b|\bhebräisch|\bhebraice\b/i, "he"], [/\(arabic\b|\barabisch\b|\barabice\b/i, "ar"], [/\(syriac\b|\bsyrisch\b|\bsyriace\b/i, "syr"],
  [/\(middle english\b|\(old english\b|\(english\b/i, "en"], [/\(french\b|\(anglo-norman\b|\(old french\b/i, "fr"], [/\(dutch\b|\(middle dutch\b|\bmittelniederländisch/i, "nl"],
  [/\(german\b|\bmittelhochdeutsch|\bfrühneuhochdeutsch/i, "de"], [/\(italian\b|\bvolgare\b|\bin volgare\b/i, "it"],
];
export function lingueDaTesto(segnatura, titolo) {
  const out = [];
  for (const [re, c] of DA_SEGNATURA) if (re.test(segnatura || "") && !out.includes(c)) out.push(c);
  if (!out.length) for (const [re, c] of DA_TITOLO) if (re.test(titolo || "") && !out.includes(c)) out.push(c);
  return out;
}

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
    for (const m of s.matchAll(/(?<![\d.])(\d{3,4})(?![\d.]|\s*(?:\.|th|st)\s*(?:jh|cent))/g)) {
      const y = +m[1]; if (y >= 100 && y <= 2030) sec.push(Math.floor((y - 1) / 100) + 1);
    }
  }
  if (!sec.length) return null;
  return [Math.min(...sec), Math.max(...sec)];
}
