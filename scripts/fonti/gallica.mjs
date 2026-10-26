// Gallica / Bibliothèque nationale de France (e biblioteche partner di Gallica): tutti i manoscritti librari, di ogni fondo, epoca e lingua.
// Interfaccia SRU di Gallica (https://gallica.bnf.fr/SRU, risposta in Dublin Core), 50 record per pagina.
// Manifesto IIIF: https://gallica.bnf.fr/iiif/ark:/12148/<id>/manifest.json
//
// Gallica respinge le richieste dai server (GitHub compreso): la raccolta si fa dal browser con scripts/browser/gallica.js,
// che la scarica in parti sotto i 50 MB (GitHub rifiuta i file oltre 100 MB): data/gallica-1.json, data/gallica-2.json ... gallica-N.json
// (formato 2: { formato: 2, raccolto, query, totale, completa, parte, parti, record: [scheda, ...] }). Si legge anche data/gallica.json, se c'è
// (raccolta in un file solo, formato 2; oppure formato 1, la raccolta del 2026-10-24 dei soli fondi latini, con «voci» già nel formato del catalogo).
// Se la lettura diretta fallisce si usano questi dati.
//
// La query («manuscrit» in dc:type) prende anche carte d'archivio, lettere, autografi, fotografie, disegni, monete, schedari e stampe:
// in costruzione (recordGallica) un filtro tiene solo i manoscritti librari, di ogni data (motivoGallica, sul modello di motivoLeiden).
import fs from "node:fs";
import path from "node:path";
import { scarica, statoFonte, tag, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { caricaAutori, riconosci } from "../riconosci.mjs";
import { cartaManoscritta, titoloCarta, STAMPATA } from "../carte.mjs";

export const CARTELLA_BROWSER = "data";
export const RACCOLTA_BROWSER = "data/gallica.json";
export const BASE = "https://gallica.bnf.fr/SRU";
// tutti i documenti di tipo «manuscrit» (anche delle biblioteche partner); la stessa interrogazione è in scripts/browser/gallica.js
export const QUERY = 'dc.type all "manuscrit"';
const PAGINA = 50;
const VERSIONE = 2;

// file della raccolta dal browser: le parti data/gallica-<n>.json in ordine, poi data/gallica.json se c'è
export function fileBrowser(cartella = CARTELLA_BROWSER) {
  let nomi = []; try { nomi = fs.readdirSync(cartella); } catch (e) {}
  // gallica-<n>.json: manoscritti; gallica-carte-<n>.json: carte geografiche manoscritte (raccolta del browser in modalità «carte»)
  const parti = nomi.map(n => /^gallica-(carte-)?(\d+)\.json$/.exec(n)).filter(Boolean).sort((a, b) => (a[1] ? 1 : 0) - (b[1] ? 1 : 0) || a[2] - b[2]).map(m => path.join(cartella, m[0]));
  if (nomi.includes("gallica.json")) parti.push(path.join(cartella, "gallica.json"));
  return parti;
}

// raccolta dal browser, unita: { raccolto, totale, completa, schede_lette, parti, record (formato 2, uno per ark), voci (formato 1) }
// (letta una volta sola per esecuzione: la usano la raccolta e il registro delle biblioteche)
const giaLette = new Map();
export function leggiBrowser(cartella = CARTELLA_BROWSER) {
  const chiave = cartella + "|" + fileBrowser(cartella).map(f => { try { return f + ":" + fs.statSync(f).mtimeMs; } catch (e) { return f; } }).join(",");
  if (!giaLette.has(chiave)) giaLette.set(chiave, leggiBrowserDaFile(cartella));
  return giaLette.get(chiave);
}
function leggiBrowserDaFile(cartella) {
  const out = { raccolto: null, totale: null, completa: false, schede_lette: 0, parti: 0, record: [], voci: [] };
  const visti = new Set();
  for (const f of fileBrowser(cartella)) {
    let d = null; try { d = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { log("gallica", `${f} non leggibile: ${e.message}`); continue; }
    if (!d) continue;
    out.parti++;
    if (!out.raccolto || String(d.raccolto || "") > out.raccolto) out.raccolto = d.raccolto || out.raccolto;
    if (Array.isArray(d.record)) {
      out.totale = Math.max(out.totale || 0, d.totale || 0) || null; out.completa = out.completa || !!d.completa;
      out.schede_lette = Math.max(out.schede_lette, d.schede_lette || 0);
      for (const o of d.record) if (o && o.k && !visti.has(o.k)) { visti.add(o.k); out.record.push(o); }
    } else if (Array.isArray(d.voci)) out.voci.push(...d.voci);
  }
  return out;
}

function daBrowser(motivo) {
  const d = leggiBrowser();
  if (d.record.length) {
    log("gallica", `${motivo}: uso la raccolta fatta dal browser il ${String(d.raccolto || "").slice(0, 10)} (${d.parti} file, ${d.record.length} schede)`);
    const scarti = {}, rs = d.record.map(o => recordGallica(o, scarti)).filter(Boolean);
    log("gallica", `${rs.length} manoscritti librari; fuori: ${Object.entries(scarti).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join("; ")}`);
    // le voci del formato 1 servono solo per i codici che le schede non hanno
    const ids = new Set(rs.map(r => r.id));
    return unici([...rs, ...d.voci.filter(v => !ids.has(v.id))]);
  }
  if (d.voci.length) {
    log("gallica", `${motivo}: uso la raccolta (formato 1) fatta dal browser il ${String(d.raccolto || "").slice(0, 10)} (${d.voci.length} codici)`);
    return unici(d.voci);
  }
  throw new Error(motivo);
}
const unici = rs => [...new Map(rs.map(v => [v.id, v])).values()];

// «Bibliothèque nationale de France. Département des Manuscrits. Latin 7899» -> «Latin 7899» (qualunque fondo: Grec 2934, Français 2, Arabe 1, NAL 1132...)
export function segnaturaGallica(fonti) {
  for (const s of [].concat(fonti || [])) {
    const m = /D[ée]partement des manuscrits[.,]?\s*(.+)$/i.exec(s);
    if (m && /\d/.test(m[1])) return m[1].replace(/\s+/g, " ").replace(/[ ,.;-]+$/, "").trim();
  }
  return null;
}

// fonte (dc:source) -> { biblioteca, citta, segnatura }
export function luogoGallica(fonti) {
  const seg = segnaturaGallica(fonti);
  if (seg) return { biblioteca: "Bibliothèque nationale de France", citta: "Paris", segnatura: seg };
  for (const s0 of [].concat(fonti || [])) {
    const s = String(s0 || "").replace(/\s+/g, " ").trim(); if (!s || !/\d/.test(s)) continue;
    // «Bibliothèque nationale de France. Bibliothèque de l'Arsenal. Ms-5070», «Bibliothèque municipale de Tours, Ms. 924»
    // parti separate da «, » o da «. » seguito da maiuscola; la segnatura è l'ultima parte con un numero
    // (unita alla precedente se è solo un numero o se la precedente è un'abbreviazione come «Ms», «Cod», «Latin»)
    const parti = s.split(/\.\s+(?=[A-ZÀ-Ý])|,\s+/).map(x => x.trim()).filter(Boolean);
    let k = parti.length - 1; while (k > 0 && !/\d/.test(parti[k])) k--;
    let i = k;
    if (i > 0 && (/^[\d\s()a-z-]+$/i.test(parti[k]) && /^\d/.test(parti[k]) || /^(ms|mss|cod|codex|fonds?|latin|grec|fr|nal|naf)$/i.test(parti[k - 1]))) i--;
    // biblioteca partner se ricavabile dalla fonte, altrimenti la BnF (anche per «Ms. 151» senza nome di biblioteca)
    const biblioteca0 = parti.slice(0, i).filter(x => !/^d[ée]partement/i.test(x)).join(", ");
    const nazionale = !biblioteca0 || /biblioth[èe]que nationale de france/i.test(biblioteca0);
    const arsenal = /arsenal/i.test(s);
    const biblioteca = arsenal ? "Bibliothèque de l'Arsenal (BnF)" : nazionale ? "Bibliothèque nationale de France" : biblioteca0;
    const citta = nazionale || arsenal ? "Paris" : ((/\b(?:de|d')\s*([A-ZÀ-Ý][\w'À-ÿ-]+(?:[- ][A-ZÀ-Ý][\w'À-ÿ-]+)*)\s*$/.exec(biblioteca) || [])[1] || null);
    return { biblioteca, citta, segnatura: parti.slice(i, k + 1).join(" ") };
  }
  return null;
}

// record SRU (Dublin Core) -> scheda compatta (lo stesso formato che produce scripts/browser/gallica.js)
export function compattaGallica(rec) {
  const pagina = tag(rec, "dc:identifier").find(x => /gallica\.bnf\.fr\/ark:\/12148\//.test(x)); if (!pagina) return null;
  const k = /ark:\/12148\/([a-z0-9]+)/i.exec(pagina)[1];
  return { k, y: tag(rec, "dc:type"), t: tag(rec, "dc:title").join(" ; ").slice(0, 600), c: tag(rec, "dc:creator"), d: tag(rec, "dc:date")[0] || null,
    s: tag(rec, "dc:source"), l: tag(rec, "dc:language"), f: tag(rec, "dc:format").join(" ; ").slice(0, 300), x: [...tag(rec, "dc:description"), ...tag(rec, "dc:subject")].join(" ; ").slice(0, 1500),
    r: tag(rec, "dc:rights").join(" ") };
}

// scheda più leggera per i file della raccolta (la stessa funzione è in scripts/browser/gallica.js): via dalla descrizione le note
// ripetute in ogni scheda («Numérisation effectuée à partir d'un document original», «Appartient à l'ensemble documentaire»),
// diritti abbreviati («dp» = domaine public) e niente campi vuoti
export function snellisci(o) {
  const x = String(o.x || "").split(" ; ").filter(p => !/^\s*(?:Num[ée]risation effectu[ée]e|Appartient [àa] l.ensemble documentaire)/i.test(p)).join(" ; ");
  const out = { ...o, x, r: /domaine public|public domain/i.test(o.r || "") ? "dp" : o.r };
  for (const [k, v] of Object.entries(out)) if (v == null || v === "" || (Array.isArray(v) && !v.length)) delete out[k];
  return out;
}

/* filtro dei manoscritti librari (ogni epoca e lingua, nessun limite di data) */
// tipi (dc:type) che non sono manoscritti librari, anche quando accanto c'è «manuscrit»
const TIPO_ARCHIVIO = /archival material|document d'archives/i;
const TIPO_MANOSCRITTO = /^(?:manuscript|manuscrit|texte manuscrit)$/i;
const TIPO_FUORI = [
  [/texte imprim|monographie imprim|imprimé/i, "libri a stampa"],
  [/^carte$|cartographi/i, "carte geografiche"],
  [/musique imprim|partition/i, "spartiti a stampa"],
  [/photographi|estampe|image anim|^objet$|costume|collage|affiche/i, "fotografie, disegni, stampe e oggetti"],
];
// fondi e reparti fatti di carte d'archivio, documenti, schedari e oggetti (non di codici)
const ARCHIVI = [
  // archivi interni della BnF (registri, inventari, carnet di cotazione) e reparti senza codici
  [/Mission pour la gestion de la production documentaire|Archives du cabinet des m[ée]dailles/i, "carte d'archivio"],
  [/D[ée]partement (?:des )?Monnaies|d[ée]partement Monnaies/i, "monete, oggetti e registri del Cabinet des médailles"],
  [/D[ée]partement Son, vid[ée]o/i, "registri e carte d'archivio"],
  // Estampes et photographie (trascrizioni di articoli della collezione Deloynes, note) e Réserve des livres rares (pezzi di raccolte a stampa, come Thoisy)
  [/d[ée]partement Estampes|D[ée]partement des Estampes|R[ée]serve des livres rares|YA3-27|\bIMPR\b/i, "pezzi di raccolte di stampe e di libri a stampa"],
  // Arts du spectacle e Cartes et plans: maquette, costumi, archivi
  [/\bMAQ-|\bCOS-|\bGE ARCHIVES\b/, "fotografie, disegni, stampe e oggetti"],
  [/Inscriptions du N[ée]pal/i, "fotografie, disegni, stampe e oggetti"],
  // lettere autografe (LAS, NLA, NLAS) e fasci d'archivio (liasses)
  [/\((?:N?LAS?)\b|(?:^|[\s,.])(?:N?LAS[\s-]|NLA-|LA-)/, "lettere e autografi"],
  [/\bLiasses?\b/i, "carte d'archivio"],
  [/Carr[ée]s de d'Hozier|Cabinet d'Hozier|Nouveau d'Hozier|Dossiers bleus|Pi[èe]ces originales/i, "carte d'archivio"],
  // istituzioni d'archivio partner di Gallica
  [/^(?:Archives |National Archives|Biblioth[èe]que et Archives Canada|Minist[èe]re des Affaires [ée]trang[èe]res\.?$)/i, "carte d'archivio"],
  // Département des Manuscrits: raccolte di atti, titoli, pezzi originali, minute, carte di famiglia e schedari
  [/D[ée]partement des manuscrits[.,]?\s*(?:FM\d*\b|Fichier\b|Chapp[ée]e|Clairambault|PO\b|Pi[èe]ces originales|Dossiers bleus|Carr[ée]s d'Hozier|Cabinet d'Hozier|Nouveau d'Hozier|Ch[ée]rin|Joly de Fleury|Archives (?:modernes|Ancien R[ée]gime)|M[ée]langes de Colbert|Cinq cents de Colbert|Moreau|Br[ée]quigny|Languedoc|Doat|P[ée]rigord|Vexin|Lorraine|Bourgogne|Champagne|Picardie|Touraine|Joursanvault|Thoisy)/i, "carte d'archivio"],
];
const LETTERE = /(?:^|[.;:\]] )\s*\[?(?:(?:\d+ |une |fragment d'une |minutes? d'une |copie d'une )?lettre (?:autographe|originale|sign[ée]e|de |d'|à |a |au |aux |du |des |adress[ée]e|en |relative)|lettres (?:autographes|originales|sign[ée]es|à |a |au |aux |adress[ée]es|en |relatives)|\d+ lettres?\b|lettre\]?\s*$|billets? (?:autographes?|de |à )|signature autographe|cartes? (?:postales?|de visite)|correspondances?\b|correspondants\b|autographes\b|minute de la r[ée]ponse|r[ée]ponse (?:à|a) (?:cette|la|une) lettre)|\bletters? (?:from|to)\b/i;
const DOCUMENTI = /(?:^|[.;:\]] )\s*[«"]?\s*\[?(?:acte|actes|charte|chartes|contrat|quittances?|brevet|passeport|proc[èe]s-verbal|proc[èe]s-verbaux|certificat|diplôme|diplome|ordonnance|ordre d'ex[ée]cution|requ[êe]te|reçu|re[çc]us|facture|bail|vente faite|accord entre|donation|testament|titres? originaux|minutes? (?:originales|de lettres)|pi[èe]ces? (?:originales|relatives|diverses)|registres? (?:de d[ée]p[ôo]t|d'entr[ée]es|des entr[ée]es|de cotation|annuels)|dossiers?|demandes? d'autorisation|autorisation|laissez-passer|menus?|faire-part|invitation|affiche|tract|coupures? de presse|recueil\. articles|arr[êe]ts?|registres?|inventaires?|archives|ensemble documentaire|comptes?|comptabilit[ée])\b/i;
const MODERNO = /\b(?:tapuscrits?|dactylographi\w*|photographies?|photogrammes?|sc[ée]nario|maquettes? de costumes?|monnaie\b|m[ée]daille\b|jeton\b|fiches?\b|fichier\b|estampages?\b)/i;
// lettere al plurale («Lettres de Théophile Silvestre»): fuori solo fuori dai fondi di codici della BnF, dove sono epistolari («Lettres de s. Bernard»)
const EPISTOLARIO = /(?:^|[.;:\]] )\s*\[?lettres (?:de |d')/i;
// «Lettres de Juliette Drouet à Victor Hugo»: carteggio anche nei fondi della BnF
const CARTEGGIO = /(?:^|[.;:\]] )\s*\[?lettres (?:de |d')[^.;]{1,80}? (?:à|au|aux) /i;
const DM = /D[ée]partement des manuscrits/i;
// Epistolari d'autore copiati in codici: un titolo da lettera ENTRA se (a) il catalogo riconosce un autore (classici, patristici...),
// (b) è in un fondo di codici della BnF, (c) è datato prima del 1600, (d) indica una raccolta (epistolae, epistolarium; «Lettres de X»
// al plurale con un autore antico o medievale). Restano sempre fuori le lettere singole autografe e le raccolte di autografi.
const FONDI_CODICI = /D[ée]partement des manuscrits[.,]?\s*(?:Latin|Nouvelle acquisition latine|NAL|Grec|Suppl[ée]ment (?:grec|turc|persan)|Coislin|Fran[çc]ais|Italien|Espagnol|Portugais|Allemand|Anglais|N[ée]erlandais|Slave|H[ée]breu|Samaritain|Syriaque|Arabe|Persan|Turc|Arm[ée]nien|G[ée]orgien|Copte|[ÉE]thiopien|Sanscrit|Chinois|Japonais|Cor[ée]en|Celtique et basque)\s+\d/i;
const AUTOGRAFO = /autographe|\bune lettre\b|\b\d+ lettres?\b|signature|cartes? (?:postales?|de visite)|billets?\b/i;
const RACCOLTA = /\bepist(?:o|u)l(?:ae|arum|arium|as)\b|\bepistolari/i;
let AUTORI = null;
const autoreRiconosciuto = o => {
  try { AUTORI = AUTORI || caricaAutori(); } catch (e) { return false; }
  // solo autore e titolo proprio: nelle descrizioni delle carte moderne si citano spesso autori antichi
  return riconosci([{ campo: "autore", testo: [].concat(o.c || []).join(" ; "), forte: true }, { campo: "titolo", testo: String(o.t || "").split(" ; ")[0], forte: true }], AUTORI).length > 0;
};
// anni degli autori (dc:creator: «Sénèque (0004?-0065)»): il primo, se c'è
const annoAutore = o => Math.min(...[].concat(o.c || []).flatMap(c => [...String(c).matchAll(/\((\d{3,4})\??-/g)].map(m => +m[1])), 9999);
// primo anno della datazione: «1401-1500» -> 1401, «0901-1000» -> 901, «176?» e «184» -> 1760 e 1840, «17..-18..» -> 1700; 9999 se non c'è
export function primoAnno(d) {
  const m = /(\d{3,4})([?.x]*)/i.exec(String(d || ""));
  if (!m) return 9999;
  return m[1].length === 3 ? +m[1] * 10 : +m[1];   // Gallica scrive gli anni a 4 cifre («0901»): 3 cifre sono un decennio («184.»)
}
export function epistolarioCodice(o, t1, s, anno) {
  if (AUTOGRAFO.test(t1)) return false;
  if (FONDI_CODICI.test(s) && anno < 1800) return true;                       // (b) (non i carteggi moderni: «Lettres de Mary Robinson», Anglais 243)
  if (anno < 1600) return true;                                               // (c)
  if (RACCOLTA.test(o.t || "") || RACCOLTA.test(o.x || "")) return true;      // (d) epistolae, epistolarium
  if (EPISTOLARIO.test(t1) && !CARTEGGIO.test(t1) && annoAutore(o) < 1500) return true;   // (d) «Lettres de X», autore antico o medievale
  // (a) non per le carte moderne (datate dal 1800 o senza data, NAF): «Ollivier, Démosthène», «Horace de Montègre» sono omonimi
  // e non per una lettera singola («Lettre de M. Leoni à la comtesse d'Albany»)
  return anno < 1800 && !/(?:^|[.;:\]] )\s*\[?lettre\b/i.test(t1) && !/\bNAF\b|nouvelles acquisitions fran/i.test(s) && autoreRiconosciuto(o);
}
const GIORNO = /^(?:\d{8}|\d{4}-\d{2}-\d{2})$/;   // data al giorno («18701003», «1834-06-24»): lettere e atti, non codici

// carta geografica manoscritta (dal 26 ottobre 2026, categoria a parte): tipo «carte» o reparto Cartes et plans o titolo da carta,
// disegnata a mano (tipo «manuscrit», formato «ms.», tecnica «dessin», «aquarelle», «encre», «plume», «lavis») e niente che dica stampa;
// fuori gli inventari e i registri del reparto (GE ARCHIVES) e i fogli di un volume
export function cartaGallica(o) {
  if (!o || !o.k) return false;
  const y = [].concat(o.y || []), s = [].concat(o.s || []).join(" ; "), t = o.t || "";
  if (/\bGE ARCHIVES\b|\bMAQ-|\bCOS-|\(?N?LAS?\b|\bLA-/.test(s) || /,\s*f(?:ol)?\.\s*\d/.test(s)) return false;
  // fogli sciolti del reparto Cartes et plans (serie GE A, B, C, D, SH): anche bornages, piani d'attacco e di assedio, scandagli
  const fogliCP = /Cartes et plans, GE (?:[ABCD]|SH)\b/i.test(s) && /^\W*(?:bornage|attaque|si[èe]ge|sondes|plan)\b/i.test(t);
  if (!titoloCarta(t) && !fogliCP && !y.some(x => /^carte|cartograph/i.test(x))) return false;
  if (fogliCP && y.some(x => /^manuscrit$/i.test(x))) return !STAMPATA.test(t);
  return cartaManoscritta({ titolo: t, generi: y, tecnica: o.f, descrizione: o.x });
}

// motivo per cui una scheda resta fuori (null = ammessa)
export function motivoGallica(o) {
  if (!o || !o.k) return "senza copia digitale Gallica (ark)";
  const y = [].concat(o.y || []), s = [].concat(o.s || []).join(" ; "), t = o.t || "";
  if (y.some(x => TIPO_ARCHIVIO.test(x))) return "carte d'archivio";
  if (cartaGallica(o) && luogoGallica(o.s)) return null;
  if (y.length && !y.some(x => TIPO_MANOSCRITTO.test(x))) {
    for (const [re, m] of TIPO_FUORI) if (y.some(x => re.test(x))) return m;
    return "non indicata come manoscritto (lettere, carte e dattiloscritti moderni)";
  }
  for (const [re, m] of TIPO_FUORI) if (y.some(x => re.test(x))) return m;
  for (const [re, m] of ARCHIVI) if (re.test(s)) return m;
  if (/^\[?Monnaie\b/i.test(t)) return "monete, oggetti e registri del Cabinet des médailles";
  // titolo proprio (prima di « ; »: dopo vengono i contenuti dei codici miscellanei); «Lettres de s. Bernard» è un epistolario, non una lettera
  const t1 = t.split(" ; ")[0];
  const anno = primoAnno(o.d);
  // titolo da lettera: fuori, salvo gli epistolari d'autore copiati in codici (epistolarioCodice)
  if ((LETTERE.test(t1) || CARTEGGIO.test(t1) || EPISTOLARIO.test(t1) && !DM.test(s)) && !epistolarioCodice(o, t1, s, anno)) return "lettere e autografi";
  if (DOCUMENTI.test(t1)) return "documenti e carte d'archivio";
  if (MODERNO.test(t1)) return "fotografie, disegni, stampe e oggetti";
  // (nei fondi di codici della BnF la data al giorno è quella del colophon: «Liber regalis», Latin 6914, 12 gennaio 1485)
  if (GIORNO.test(String(o.d || "").trim()) && !DM.test(s)) return "lettere e documenti (datati al giorno)";
  // un foglio di un volume («NAF 13355, f. 42»): disegno o pezzo singolo, non il codice
  if (/,\s*f(?:ol)?\.\s*\d/.test(s)) return "fogli singoli (disegni e pezzi di un volume)";
  if (y.some(x => /^dessin$/i.test(x)) && !y.some(x => /texte manuscrit/i.test(x)) && !/carnet|album|recueil|livre|cahier/i.test(t)) return "fotografie, disegni, stampe e oggetti";
  if (!luogoGallica(o.s)) return "senza segnatura";
  return null;
}

// scheda compatta -> record del catalogo (null se non è un manoscritto librario: vedi motivoGallica; scarti conta i motivi)
export function recordGallica(o, scarti = null) {
  const m = motivoGallica(o);
  if (m) { if (scarti) scarti[m] = (scarti[m] || 0) + 1; return null; }
  const L = luogoGallica(o.s);
  return { fonte: "gallica", id: "bnf-" + o.k, ...L, datazione: o.d || null, titolo: o.t || null, autori_fonte: o.c || [], lingue: lingueDa(o.l || []),
    generi: o.y || [], tecnica: o.f || null, ...(cartaGallica(o) ? { tipo: "carta" } : {}),
    descrizione: o.x || null, manifest: `https://gallica.bnf.fr/iiif/ark:/12148/${o.k}/manifest.json`, pagina: `https://gallica.bnf.fr/ark:/12148/${o.k}`,
    licenza: /domaine public|public domain|^dp$/i.test(o.r || "") ? "Domaine public (Gallica, conditions d'utilisation)" : ((o.r || "").slice(0, 200) || null) };
}

export const estraiGallica = rec => recordGallica(compattaGallica(rec));

export async function raccogliGallica(opz = {}) {
  try { return await raccogliDiretta(opz); }
  catch (e) { return daBrowser(e.message); }
}

async function raccogliDiretta({ limiteMinuti = 0, soloCache = false, giorni = 6 } = {}) {
  const st = statoFonte("gallica"), ora = Date.now();
  let d = st.dati;
  if (d && d.versione !== VERSIONE) d = null;
  if (soloCache) { if (!d || !d.completato) throw new Error("nessuna raccolta completa in cache"); return d.voci; }
  if (d && d.completato && ora - d.completato < giorni * 864e5) { log("gallica", `riuso la raccolta del ${new Date(d.completato).toISOString().slice(0, 10)}: ${d.voci.length} record`); return d.voci; }
  if (!d || d.completato || ora - d.aggiornato > 3 * 864e5) d = { versione: VERSIONE, iniziato: ora, aggiornato: ora, inizio: 1, voci: [] };
  else log("gallica", `riprendo dal record ${d.inizio} (${d.voci.length} già letti)`);
  const fine = limiteMinuti ? ora + limiteMinuti * 60e3 : Infinity;
  for (;;) {
    const url = `${BASE}?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(QUERY)}&startRecord=${d.inizio}&maximumRecords=${PAGINA}`;
    const r = await scarica(url, { timeout: 120000, accept: "application/xml,text/xml" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    if (!/searchRetrieveResponse/.test(r.testo)) throw new Error("risposta non SRU (blocco o pagina di errore)");
    const recs = r.testo.match(/<srw:record>[\s\S]*?<\/srw:record>/g) || [];
    for (const rec of recs) { const v = estraiGallica(rec); if (v) d.voci.push(v); }
    const tot = +((/<srw:numberOfRecords>(\d+)/.exec(r.testo) || [])[1] || 0);
    d.inizio += PAGINA; d.aggiornato = Date.now(); d.totale = tot;
    if ((d.inizio - 1) % 1000 === 0) log("gallica", `${d.inizio - 1} su ${tot}, ${d.voci.length} manoscritti`);
    if (!recs.length || d.inizio > tot) { d.completato = Date.now(); st.salva(d); break; }
    st.salva(d);
    if (Date.now() > fine) throw new Error(`raccolta incompleta (${d.inizio - 1} su ${tot}): riprenderà alla prossima esecuzione`);
  }
  // un codice può comparire con più record (volumi, riproduzioni): uno per ark
  return unici(d.voci);
}
