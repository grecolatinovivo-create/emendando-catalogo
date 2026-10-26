// America Latina, siti solo PDF (decisione del 26 ottobre 2026): pochi codici librari che le biblioteche pubblicano solo come PDF,
// presi dove la licenza lo permette. Nessun IIIF presso le biblioteche: le pagine dei PDF sono state estratte una volta sola come
// JPEG (lato lungo 1030-1600 px: quello del PDF se più piccolo, qualità 80) e stanno nel ramo «immagini» del repository
// (immagini/<fonte>/<cartella>/NNNN.jpg, servite da raw.githubusercontent.com con CORS aperto, fuori da main). I manifesti IIIF
// Presentation 3 li scrive il catalogo (scripts/manifesti.mjs, ramo «manifesti») con immagini statiche, rights e requiredStatement.
// Nessuna richiesta di rete: i dati dei codici sono qui sotto, le misure delle pagine in data/latam_pdf.json
// (scritte con: node scripts/fonti/latam_pdf.mjs --misura=<copia del ramo immagini>).
//   - «bnchile»: Biblioteca Nacional de Chile (Sala Medina e fondi manoscritti). Entrano solo i codici librari che Memoria Chilena
//     segna, oggetto per oggetto, come «Patrimonio cultural común» (pubblico dominio, Ley 17.336); PDF da memoriachilena.gob.cl
//     (archivos2/pdfs/MC*.pdf). Citazione richiesta: Memoria Chilena, Biblioteca Nacional de Chile, con l'indirizzo della scheda.
//     Dal 26 ottobre 2026 entrano anche i codici librari che la biblioteca non segna come pubblico dominio ma che lo sono per età
//     (campo «eta»): opere manoscritte di autori morti da più di 70 anni, oppure anonime anteriori al 1900; le fotografie di documenti
//     bidimensionali non creano nuovi diritti. PDF da bibliotecanacionaldigital.gob.cl (colecciones/BND/00/SM/SM*.pdf) o da
//     Memoria Chilena. Fuori le carte sparse (per esempio le «Notas sobre aborígenes americanos» di Medina, SM0000782: 43 pezzi).
//   - «bnv»: Biblioteca Nacional de Venezuela, Biblioteca Digital de Venezuela César Rengifo (bibliotecadigital.bnv.gob.ve,
//     licenza del sito CC BY-SA 3.0 Venezuela); segnature dal catalogo Koha (koha.bnv.gob.ve). Le immagini estratte restano sotto
//     la stessa licenza, con attribuzione.
import fs from "node:fs";
import path from "node:path";

export const FILE_STATO = "data/latam_pdf.json";
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti";
export const BASE_IMMAGINI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/immagini/immagini";
const PDM = "http://creativecommons.org/publicdomain/mark/1.0/";
const CCBYSA_VE = "http://creativecommons.org/licenses/by-sa/3.0/ve/";

export const FONTI_LATAM = {
  bnchile: {
    biblioteca: "Biblioteca Nacional de Chile", citta: "Santiago (Cile)", sito: "https://www.bibliotecanacionaldigital.gob.cl/",
    rights: PDM, licenza: "Patrimonio cultural común (pubblico dominio, Ley 17.336), indicato nella scheda di Memoria Chilena",
    licenzaEta: "Pubblico dominio per età dell'opera; la scheda della biblioteca non lo indica",
    attribuzione: v => v.eta ? `Biblioteca Nacional de Chile, ${v.s}` : `Biblioteca Nacional de Chile. Disponible en Memoria Chilena, ${v.mc}${v.codice ? " (" + v.codice + ")" : ""}. Propiedad intelectual: Patrimonio cultural común (Ley 17.336). Immagini estratte dal PDF della Biblioteca.`,
  },
  bnv: {
    biblioteca: "Biblioteca Nacional de Venezuela", citta: "Caracas (Venezuela)", sito: "https://bibliotecadigital.bnv.gob.ve/",
    rights: CCBYSA_VE, licenza: "CC BY-SA 3.0 Venezuela (Biblioteca Digital de Venezuela César Rengifo)",
    attribuzione: () => "Biblioteca Nacional de Venezuela, Biblioteca Digital de Venezuela César Rengifo (bibliotecadigital.bnv.gob.ve). Licencia Creative Commons Atribución-CompartirIgual 3.0 Venezuela (CC BY-SA 3.0 VE). Immagini estratte dal PDF della Biblioteca, sotto la stessa licenza.",
  },
};

// cartella delle immagini -> dati del codice
export const CODICI = {
  bnchile: {
    SM0000699: { s: "Sala Medina, SM0000699", t: "Diario militar del General don J. M. Carrera: 1810-1814", a: ["Carrera, José Miguel, 1785-1821"], d: "1815 (copia manoscritta datata 7 settembre 1815)", l: ["spa"],
      e: "302 p., encuadernadas; 33 cm. Ms. (transcripción, escrita a mano); en páginas preliminares: Foja de servicio de don José Miguel Carrera; páginas 6-26 en blanco. PDF di Memoria Chilena MC0005279 (318 p.).",
      codice: "MC0005279", mc: "https://www.memoriachilena.gob.cl/602/w3-article-99227.html", bnd: "https://www.bibliotecanacionaldigital.gob.cl/bnd/632/w3-article-658385.html" },
    MC0005049: { s: "MC0005049 (n. sistema 97002)", t: "Catesismo político christiano dispuesto para la instrucción de la juventud de los pueblos libres de la América Meridional", a: ["Amor de la Patria, José"], d: "[1810]", l: ["spa"],
      e: "[32] páginas. [Santiago de Chile], [1810].", codice: "MC0005049", mc: "https://www.memoriachilena.gob.cl/602/w3-article-99218.html" },
    MC0069816: { s: "MC0069816 (n. sistema 96820)", t: "Nómina de los conquistadores y pobladores de las ciudades y plazas del Reyno de Chile, contenidos en la manuscrita obra del P. Miguel de Olivares desde la entrada de los españoles hasta el año de 1657", a: ["Olivares, Miguel de, 1713-1793"], d: "[1803]", l: ["spa"],
      e: "49 páginas; texto a dos columnas, por orden alfabético de apellidos, con adición de la sucesión de algunos conquistadores hasta 1803.", codice: "MC0069816", mc: "https://www.memoriachilena.gob.cl/602/w3-article-132219.html" },
    MC0067629: { s: "MC0067629 (n. sistema 83864)", t: "La inocencia en el asilo de las virtudes: segundo drama sentimental", a: ["Henríquez, Camilo, 1769-1825"], d: "[18--?]", l: ["spa"],
      e: "[21] p. Ms. (transcripción, escrita a mano). Al final: «De Dn. Camilo Henriquez - la da a la Biblioteca su amigo Manuel de Salas» (nota manuscrita de Manuel de Salas).", codice: "MC0067629", mc: "https://www.memoriachilena.gob.cl/602/w3-article-87410.html" },
    MC0000836: { s: "MC0000836 (n. sistema 919754)", t: "[Diccionario latino-hebraico]: fragmento", a: ["Vaïsse, Emilio, 1860-1935 (Omer Emeth)"], d: "1887-1889 (Roma)", l: ["lat", "heb"],
      e: "Codice di 356 hojas; Memoria Chilena ne pubblica una scelta di 20 pagine. Escrito en Roma, entre 1887-1889.", codice: "MC0000836", mc: "https://www.memoriachilena.gob.cl/602/w3-article-99525.html" },
    // pubblico dominio per età (la scheda della biblioteca non lo indica)
    SM0000449: { eta: true, s: "Sala Medina, SM0000449", t: "Antiphonarium romanum ad usum S. Conventus-Maximum Sancti Patris Nostri Augustini S. Jacobi Chilensis", a: ["Agustinos. Provincia Chilena"], d: "1595", l: ["lat"],
      e: "93 fojas: partitura coral; 56 cm. Escrito en pergamino con tinta ferrogálica roja y negra; letras iniciales iluminadas; tapas de madera con esquinas y lomo de cuero (reencuadernación posterior). Título extraído del lomo.",
      bnd: "https://www.bibliotecanacionaldigital.gob.cl/bnd/632/w3-article-335340.html" },
    SM0000729: { eta: true, s: "Sala Medina, SM0000729", t: "[Diarios de viajes], v. 1: Londres, 1824", a: ["Toro y Guzmán, Domingo José de, 1803-1887"], d: "1824", l: ["spa"],
      e: "Volumen 1 de 2; 21 x 17 cm; encuadernado en cartón marmolado, lomo de cuero. Describe principalmente su estadía en Londres en 1824 e incluye borradores de cartas a su familia.",
      bnd: "https://www.bibliotecanacionaldigital.gob.cl/bnd/632/w3-article-625350.html" },
    SM0000730: { eta: true, s: "Sala Medina, SM0000730", t: "[Diarios de viajes], v. 2: París, 1825", a: ["Toro y Guzmán, Domingo José de, 1803-1887"], d: "1825", l: ["spa"],
      e: "Volumen 2 de 2; 21 x 17 cm; encuadernado en cartón verde. Relata su estadía en París en 1825.",
      bnd: "https://www.bibliotecanacionaldigital.gob.cl/bnd/632/w3-article-625350.html" },
    SM0000873: { eta: true, s: "Sala Medina, SM0000873", t: "Apuntamientos sobre la tasa de Chile", a: ["Becerril, Bernardo"], d: "[1580?] (copia del XIX secolo)", l: ["spa"],
      e: "p. 265-271 di un volume rilegato di copie; 32 cm. Ms. (transcripción, escrita a mano), con apostillas marginales; firma: Frai Ber[nar]do Becerril. Memorial contra la «Tasa de Gamboa». «Copiado de una copia. Bib. Nac. de Madrid T. J 53. Confronté D. Barros Arana».",
      bnd: "https://www.bibliotecanacionaldigital.gob.cl/bnd/632/w3-article-662217.html" },
    MC0033189: { eta: true, s: "MC0033189 (n. sistema 97009)", t: "Arte breve para aprender con alguna facilidad la dificultosa lengua Otomi: contiene algunas reglas, la doctrina, ministración de sacramentos, un bocabulario y otras cosas curiosas", a: ["Agreda, Antonio de"], d: "[México, 1770]", l: ["spa"],
      e: "11-80 [i.e. 140] p. Texto en español, traducción paralela en otomí. Manuscrito inédito del jesuita Antonio de Agreda.", codice: "MC0033189", mc: "https://www.memoriachilena.gob.cl/602/w3-article-79543.html" },
  },
  bnv: {
    "MSV-CAW2591": { s: "MSV CAW2591", t: "Arca de Letras y Theatro Universal", a: ["Navarrete, Juan Antonio, 1749-1814"], d: "1783", l: ["spa"],
      e: "403 h.; 31 cm. Manuscrito autógrafo, encuadernado; considerado la primera enciclopedia de América (diccionario alfabético, ff. 5-252; tratados menores y segundo diccionario, ff. 253-403).",
      pagina: "https://bibliotecadigital.bnv.gob.ve/?p=2204", koha: "https://koha.bnv.gob.ve/cgi-bin/koha/opac-detail.pl?biblionumber=204661" },
    "ingr-2016-3330": { s: "Libros Raros, n. ingreso 2016-3330", t: "Primeras lecciones de cirugía dictadas por el Doctor José María Vargas en la Universidad de Caracas, tomadas y conservadas por su discípulo José María Pelgrón", a: ["Vargas, José María, 1786-1854", "Pelgrón, José María"], d: "1827", l: ["spa"],
      e: "40 p. encuadernadas: il.; 31 cm. Hológrafo; ms. restaurado.",
      pagina: "https://bibliotecadigital.bnv.gob.ve/?p=1267", koha: "https://koha.bnv.gob.ve/cgi-bin/koha/opac-detail.pl?biblionumber=498371" },
    "MSV-CCP1013": { s: "MSV CCP1013", t: "[Biografía de Simón Bolívar]", a: [], d: "[18--]", l: ["spa"],
      e: "9 p.; 19 x 15 cm. Ms. original hológrafo, encuadernado; presumiblemente escrito aún estando vivo Bolívar.",
      pagina: "https://bibliotecadigital.bnv.gob.ve/?p=13027", koha: "https://koha.bnv.gob.ve/cgi-bin/koha/opac-detail.pl?biblionumber=208905" },
  },
};

export function leggiStato(file = FILE_STATO) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; } }

// misure delle pagine: [[w, h], …] in forma compatta «w×h» ripetuta con «*n»
export function espandiPagine(p) {
  const out = [];
  for (const x of p || []) { const m = /^(\d+)x(\d+)(?:\*(\d+))?$/.exec(x); if (m) for (let i = 0; i < +(m[3] || 1); i++) out.push([+m[1], +m[2]]); }
  return out;
}
function comprimiPagine(dims) {
  const out = [];
  for (const [w, h] of dims) {
    const k = `${w}x${h}`, u = out[out.length - 1];
    if (u && u.k === k) u.n++; else out.push({ k, n: 1 });
  }
  return out.map(({ k, n }) => (n > 1 ? `${k}*${n}` : k));
}

export const idCodice = (fonte, cartella) => `${fonte}-${cartella.toLowerCase()}`;
export const urlManifesto = (fonte, cartella) => `${BASE_MANIFESTI}/${fonte}/${cartella}.json`;
export const urlImmagine = (fonte, cartella, n) => `${BASE_IMMAGINI}/${fonte}/${cartella}/${String(n).padStart(4, "0")}.jpg`;
const paginaDi = (fonte, v) => (fonte === "bnchile" ? v.mc || v.bnd : v.pagina);

export function recordLatam(fonte, st = leggiStato()) {
  const cfg = FONTI_LATAM[fonte], pagine = (st && st.pagine && st.pagine[fonte]) || {};
  return Object.entries(CODICI[fonte]).filter(([c]) => espandiPagine(pagine[c]).length).map(([c, v]) => ({
    fonte, id: idCodice(fonte, c), citta: cfg.citta, biblioteca: cfg.biblioteca, segnatura: v.s, datazione: v.d, titolo: v.t, autori_fonte: v.a,
    descrizione: v.e, lingue: v.l.map(x => ({ spa: "es", lat: "la", heb: "he" })[x] || x), immagini: espandiPagine(pagine[c]).length,
    manifest: urlManifesto(fonte, c), pagina: paginaDi(fonte, v), licenza: v.eta ? cfg.licenzaEta : cfg.licenza }));
}

/* manifesto IIIF Presentation 3 con le immagini statiche del ramo «immagini» */
const lm = (s, lingua = "none") => ({ [lingua]: [String(s)] });
const coppia = (et, val) => (val && (!Array.isArray(val) || val.length) ? { label: lm(et, "it"), value: { none: Array.isArray(val) ? val.map(String) : [String(val)] } } : null);
export function manifestoLatam(fonte, cartella, dims) {
  const cfg = FONTI_LATAM[fonte], v = CODICI[fonte][cartella], id = urlManifesto(fonte, cartella);
  const items = dims.map(([w, h], i) => {
    const c = `${id}/canvas/${i + 1}`;
    return { id: c, type: "Canvas", label: lm(String(i + 1)), width: w, height: h,
      items: [{ id: `${c}/page`, type: "AnnotationPage", items: [{ id: `${c}/page/image`, type: "Annotation", motivation: "painting", target: c,
        body: { id: urlImmagine(fonte, cartella, i + 1), type: "Image", format: "image/jpeg", width: w, height: h } }] }] };
  });
  const [w0, h0] = dims[0] || [0, 0];
  const link = [...new Set([paginaDi(fonte, v), v.bnd, v.koha].filter(Boolean))];
  return { "@context": "http://iiif.io/api/presentation/3/context.json", id, type: "Manifest",
    label: lm(`${cfg.biblioteca}, ${v.s}: ${v.t}`),
    metadata: [coppia("Biblioteca", `${cfg.biblioteca}, ${cfg.citta.replace(/ \(.*\)$/, "")}`), coppia("Segnatura", v.s), coppia("Titolo", v.t), coppia("Autori", v.a),
      coppia("Datazione", v.d), coppia("Lingue", v.l), coppia("Descrizione", v.e), coppia("Licenza", v.eta ? cfg.licenzaEta : cfg.licenza),
      coppia("Nota", v.eta ? cfg.licenzaEta : null)].filter(Boolean),
    summary: lm("Manifesto scritto dal catalogo di Emendando: la biblioteca pubblica il codice solo come PDF; le pagine sono JPEG estratti dal PDF.", "it"),
    requiredStatement: { label: lm("Attribuzione", "it"), value: lm(cfg.attribuzione(v), "none") },
    rights: cfg.rights,
    provider: [{ id: cfg.sito, type: "Agent", label: lm(cfg.biblioteca), homepage: [{ id: cfg.sito, type: "Text", label: lm(cfg.biblioteca), format: "text/html" }] }],
    homepage: link.map(u => ({ id: u, type: "Text", label: lm(`${cfg.biblioteca}, ${v.s}`), format: "text/html" })),
    ...(items.length ? { thumbnail: [{ id: urlImmagine(fonte, cartella, 1), type: "Image", format: "image/jpeg", width: w0, height: h0 }] } : {}),
    items };
}

export function voci(st = leggiStato()) {
  const out = {};
  for (const fonte of Object.keys(FONTI_LATAM)) {
    out[fonte] = {};
    for (const c of Object.keys(CODICI[fonte])) { const d = espandiPagine(((st && st.pagine) || {})[fonte]?.[c]); if (d.length) out[fonte][c] = d; }
  }
  return out;
}

/* misure delle pagine dalle intestazioni dei JPEG di una copia del ramo «immagini» */
function misuraJpeg(b) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
export function misura(dir) {
  const pagine = {};
  for (const fonte of Object.keys(FONTI_LATAM)) {
    pagine[fonte] = {};
    for (const c of Object.keys(CODICI[fonte])) {
      const d = path.join(dir, "immagini", fonte, c); let f = [];
      try { f = fs.readdirSync(d).filter(x => /^\d{4}\.jpg$/.test(x)).sort(); } catch (e) { continue; }
      pagine[fonte][c] = comprimiPagine(f.map(x => misuraJpeg(fs.readFileSync(path.join(d, x)))));
    }
  }
  return pagine;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
  if (arg.misura) {
    const pagine = misura(arg.misura);
    // un codice per riga
    const righe = Object.entries(pagine).map(([f, x]) => `  ${JSON.stringify(f)}: {\n` + Object.entries(x).map(([c, p]) => `   ${JSON.stringify(c)}: ${JSON.stringify(p)}`).join(",\n") + "\n  }");
    fs.writeFileSync(FILE_STATO, `{\n "aggiornato": ${JSON.stringify(new Date().toISOString())},\n "pagine": {\n${righe.join(",\n")}\n }\n}\n`);
    for (const [f, x] of Object.entries(pagine)) console.error(`${f}: ${Object.entries(x).map(([c, p]) => `${c} ${espandiPagine(p).length}`).join(", ")}`);
  }
}
