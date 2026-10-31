// Riconoscimento prudente di autori e opere (classici latini e greci, cristiani, medievali) nei metadati dei manoscritti.
// Il riconoscimento è un'informazione in più sul codice (per cercare e filtrare), non decide chi entra nel catalogo.
// Regole (data/autori.json):
//  - un nome «forte» basta nei campi forti (titolo, autore); un nome «debole» vale solo con un'opera dell'autore;
//  - un'opera «distintiva» basta da sola nei campi forti; le altre valgono solo insieme al nome;
//  - nei campi deboli (descrizioni lunghe) servono sempre nome e opera insieme;
//  - non contano: i santi omonimi (s., sanctus, hl., saint...; tranne per gli autori «santi»: Agostino, Girolamo...), le frasi di «escludi»,
//    l'autore o l'opera commentati («commentum in Vergilium», «Kommentar zu Ovid»: il testo è il commento, non l'autore).
//  - scritture senza spazi (cinese, giapponese, coreano): le forme del campo «cjk» (nomi traslitterati, titoli di traduzioni:
//    «伊曽保物語», «幾何原本») si cercano come sottostringhe, solo nei campi forti che contengono quelle scritture.
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const SANTI = new Set(["s", "st", "ss", "sanctus", "sancti", "sancto", "sanctum", "sancte", "hl", "heilige", "heiligen", "heiliger", "saint", "sainte", "san", "santo", "beatus", "beati", "b"]);
const COMMENTO = new Set(["commentum", "commenta", "commentarius", "commentarii", "commentaria", "commentariorum", "commentariis", "commentarium", "commento", "commenti", "kommentar", "kommentare", "commentary", "commentaries", "commentaire", "commentaires",
  "glossae", "glosae", "glossa", "glosa", "glossen", "glosse", "glossulae", "scholia", "scolia", "expositio", "accessus", "lectura", "notae", "annotationes", "interpretatio", "enarratio", "tractatus", "quaestiones",
  "enarrationes", "expositiones", "sermones", "sermo", "predigten", "homiliae", "homeliae", "homilia", "omelie", "postilla", "postillae", "catena", "catenae", "σχολια", "υπομνημα", "εξηγησισ", "ερμηνεια"]);
const PREP = new Set(["in", "super", "ad", "on", "zu", "zum", "zur", "sur", "a", "al", "all", "alla", "allo", "agli", "alle", "to", "de", "di", "uber"]);

// minuscole, senza accenti né spiriti né punteggiatura, u per v e i per j, sigma finale come sigma; lettere latine, greche, cirilliche e arabe (dal 31 ottobre 2026);
// restituisce anche la mappa verso il testo originale
const CAR = new Map();
function carattere(ch) {
  let c = CAR.get(ch);
  if (c === undefined) {
    c = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/æ/g, "ae").replace(/œ/g, "oe").replace(/ß/g, "ss").replace(/ς/g, "σ").replace(/v/g, "u").replace(/j/g, "i");
    c = [...c].map(x => (/[a-z0-9\u03b1-\u03c9\u0430-\u044f\u0451\u0621-\u064a]/.test(x) ? x : " ")).join("");
    CAR.set(ch, c);
  }
  return c;
}
export function normalizza(s) {
  s = String(s || "");
  let t = "", mappa = [], spazio = true;
  for (let i = 0; i < s.length; i++) {
    for (const ch of carattere(s[i])) {
      if (ch !== " ") { t += ch; mappa.push(i); spazio = false; }
      else if (!spazio) { t += " "; mappa.push(i); spazio = true; }
    }
  }
  if (t.endsWith(" ")) { t = t.slice(0, -1); mappa.pop(); }
  return { t, mappa };
}
const n = s => normalizza(s).t;

export function caricaAutori(file) {
  const f = file || fileURLToPath(new URL("../data/autori.json", import.meta.url));
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  const autori = d.autori.map(a => ({
    id: a.id, nome: a.nome, latino: a.latino, categoria: a.categoria || "classico-latino", lingua: a.lingua || "la", santi: !!a.santi, pseudo: !!a.pseudo,
    nomi: [...new Set((a.nomi || []).map(n))].filter(Boolean),
    deboli: [...new Set((a.deboli || []).map(n))].filter(Boolean),
    escludi: (a.escludi || []).map(n).filter(Boolean),
    opere: (a.opere || []).map(o => ({ t: o.t, d: !!o.d, v: [...new Set(o.v.map(n))].filter(Boolean) })),
    cjk: (a.cjk || []).map(x => (typeof x === "string" ? { v: x, t: null } : { v: x.v, t: x.t || null })).filter(x => x.v && x.v.length >= 2),
  }));
  // indice per parola: un autore si esamina solo se nel record c'è la prima parola di un suo nome o di una sua opera
  const perParola = new Map();
  for (const a of autori) for (const v of [...a.nomi, ...a.deboli, ...a.opere.flatMap(o => o.v)]) {
    const p = v.split(" ")[0]; if (!perParola.has(p)) perParola.set(p, new Set()); perParola.get(p).add(a);
  }
  autori.perParola = perParola;
  autori.conCjk = autori.filter(a => a.cjk.length);
  return autori;
}

// posizioni (inizio, fine) di una frase normalizzata nel testo normalizzato, a parole intere
function trova(t, frase) {
  const out = [], T = " " + t + " ", F = " " + frase + " ";
  let i = T.indexOf(F);
  while (i >= 0) { out.push([i, i + frase.length]); i = T.indexOf(F, i + 1); }
  return out;
}
const paroleprima = (t, ini, k) => t.slice(0, ini).trim().split(" ").filter(Boolean).slice(-k);

// santi omonimi e opere spurie («Ps.-Ausonius», «Pseudo-Boethius»)
function santo(t, ini, a = {}) {
  const p = paroleprima(t, ini, 1); if (!p.length) return false;
  if (p[0] === "ps" || p[0] === "pseudo") return !a.pseudo;
  return SANTI.has(p[0]) && !a.santi;
}
// l'autore è l'oggetto del commento: «commentum in Vergilium», «glosae super Boethium», «commentary on Ovid»
function autoreCommentato(t, ini) {
  const p = paroleprima(t, ini, 5);
  let k = -1; p.forEach((w, i) => { if (COMMENTO.has(w)) k = i; });
  if (k < 0) return false;
  return p.slice(k + 1).some(w => PREP.has(w));
}
// l'opera è commentata se poco prima c'è una parola di commento («commentum Aeneidos», «accessus ad Ovidii Metamorphoses»)
function operaCommentata(t, ini) { return paroleprima(t, ini, 4).some(w => COMMENTO.has(w)); }

// cinese (hanzi/kanji), kana, hangul
const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

function sovrapposta(span, esclusi) { return esclusi.some(([a, b]) => span[0] < b && span[1] > a); }

function estratto(orig, norm, span) {
  const a = norm.mappa[span[0]], b = norm.mappa[span[1] - 1] + 1;
  if (orig.length <= 90) return orig.trim();
  const ini = Math.max(0, a - 30), fine = Math.min(orig.length, b + 30);
  return (ini > 0 ? "…" : "") + orig.slice(ini, fine).trim() + (fine < orig.length ? "…" : "");
}

function estrattoCjk(orig, forma) {
  if (orig.length <= 90) return orig.trim();
  const a = orig.indexOf(forma), ini = Math.max(0, a - 30), fine = Math.min(orig.length, a + forma.length + 30);
  return (ini > 0 ? "…" : "") + orig.slice(ini, fine).trim() + (fine < orig.length ? "…" : "");
}

/* campi: [{campo:"titolo", testo:"...", forte:true}]
   restituisce [{id, autore, latino, categoria, opere:[...], corrispondenza:"titolo: «...»"}] */
export function riconosci(campi, AUTORI) {
  const C = campi.filter(c => c && c.testo).map(c => ({ ...c, norm: normalizza(c.testo) }));
  const ris = [];
  let candidati = AUTORI;
  if (AUTORI.perParola) {
    const s = new Set();
    for (const c of C) for (const w of c.norm.t.split(" ")) { const x = AUTORI.perParola.get(w); if (x) for (const a of x) s.add(a); }
    // forme «cjk»: per sottostringa, nei campi forti con caratteri cinesi, giapponesi o coreani
    const cjk = C.filter(c => c.forte && CJK.test(c.testo));
    if (cjk.length) for (const a of AUTORI.conCjk || AUTORI.filter(a => a.cjk && a.cjk.length)) if (a.cjk.some(x => cjk.some(c => c.testo.includes(x.v)))) s.add(a);
    candidati = AUTORI.filter(a => s.has(a));
  }
  const campiCjk = C.filter(c => c.forte && CJK.test(c.testo));
  for (const a of candidati) {
    const colpi = { forte: [], debole: [], deboleNome: [], operaD: [], opera: new Map() };
    for (const c of C) {
      const t = c.norm.t;
      const esclusi = a.escludi.flatMap(e => trova(t, e));
      const valido = s => !sovrapposta(s, esclusi) && !santo(t, s[0], a) && !autoreCommentato(t, s[0]);
      for (const v of a.nomi) for (const s of trova(t, v)) if (valido(s)) (c.forte ? colpi.forte : colpi.deboleNome).push({ c, s });
      for (const v of a.deboli) for (const s of trova(t, v)) if (valido(s)) colpi.deboleNome.push({ c, s, debole: true });
      for (const o of a.opere) for (const v of o.v) for (const s of trova(t, v)) {
        if (sovrapposta(s, esclusi) || operaCommentata(t, s[0])) continue;
        if (!colpi.opera.has(o.t)) colpi.opera.set(o.t, []);
        colpi.opera.get(o.t).push({ c, s });
        if (o.d && c.forte) colpi.operaD.push({ c, s, o });
      }
    }
    // forme «cjk» (sottostringhe): un nome o un titolo di traduzione basta da solo nei campi forti
    let scattoCjk = null;
    for (const c of campiCjk) for (const x of a.cjk || []) {
      if (!c.testo.includes(x.v)) continue;
      if (x.t && !colpi.opera.has(x.t)) colpi.opera.set(x.t, []);
      if (!scattoCjk) scattoCjk = { c, x };
    }
    const conOpera = colpi.opera.size > 0;
    let scatto = colpi.forte[0] || colpi.operaD[0] || null;
    if (!scatto && conOpera) scatto = colpi.deboleNome.find(x => x.c.forte) || colpi.deboleNome[0] || null;
    if (!scatto && !scattoCjk) continue;
    ris.push({ id: a.id, autore: a.nome, latino: a.latino, categoria: a.categoria, opere: [...colpi.opera.keys()],
      corrispondenza: scatto ? `${scatto.c.campo}: «${estratto(scatto.c.testo, scatto.c.norm, scatto.s)}»` : `${scattoCjk.c.campo}: «${estrattoCjk(scattoCjk.c.testo, scattoCjk.x.v)}»` });
  }
  return ris;
}

export function etichetta(r) { return r.opere.length ? `${r.autore}, ${r.opere.join(", ")}` : r.autore; }
