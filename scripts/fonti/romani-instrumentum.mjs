// Instrumentum romano scritto (dal 28 ottobre 2026): oggetti romani (e altomedievali) con scrittura e con almeno una foto che si apre
// nel visore di Emendando (stessa regola di papiri ed epigrafi: niente schede senza immagine). Nel catalogo sono la fonte «romani»
// (id «rom-<raccolta>-…»), con «tipo» «epigrafe» e i dati in «epigrafe»: supporto («legno (tavoletta)», «metallo (moneta)», «metallo
// (sigillo)», «piombo (defixio)»…), edizione o identificativo, luogo di ritrovamento, datazione, testo dell'iscrizione o della legenda,
// licenza dei metadati. Censimento in docs/EPIGRAFI.md (sezione «Instrumentum romano»).
//
// Raccolte (una «parte» ciascuna, in serie):
//   pas         Portable Antiquities Scheme (British Museum e Amgueddfa Cymru), ritrovamenti in Inghilterra e Galles. Il sito finds.org.uk
//               (pagine, ricerca, esportazioni JSON e CSV, immagini) risponde al nostro server con la verifica Cloudflare («Just a moment»,
//               28 ottobre 2026): non si aggira. Le stesse foto con le schede del PAS sono su Wikimedia Commons (620.669 file nella
//               categoria «Portable Antiquities Scheme», caricati dal 2012 con il permesso del PAS: per lo più CC BY-SA 4.0 «The Portable
//               Antiquities Scheme / The Trustees of the British Museum», alcune CC BY 2.0 o CC BY-SA 2.0/3.0). Si leggono con l'API di
//               Commons: ricerche CirrusSearch dentro la categoria (parole della scrittura: inscription, legend, stamp, letters, curse
//               tablet, runic…), 50 file per richiesta con il testo della pagina e le misure delle immagini, una richiesta ogni 2 secondi.
//               Entrano solo gli oggetti romani (e altomedievali) con scrittura; le monete solo con la legenda registrata, al massimo
//               QUOTA_MONETE (le foto più grandi). Una voce per scheda del PAS (FindID), con tutte le sue foto.
//   vindolanda  Tavolette di Vindolanda. Vindolanda Tablets Online (vindolanda.csad.ox.ac.uk) non è più una banca dati: la ricerca rimanda
//               a una porta chiusa (vindolanda.csad.ox.ac.uk:8084) e il sito rinvia a Roman Inscriptions of Britain; le sue condizioni
//               vietano comunque la ripubblicazione di testi e foto senza permesso (foto del British Museum); vto2.classics.ox.ac.uk non
//               si risolve. Entrano le tavolette con foto libere su Wikimedia Commons (categoria «Vindolanda tablets»), con i dati e il
//               testo dell'edizione di RIB online (romaninscriptionsofbritain.org, testi CC BY 4.0; le foto di RIB sono del British
//               Museum, con diritti riservati, e non si usano). RIB: Crawl-delay 20, rispettato. Traduzione no.
// Manifesti scritti dal catalogo (ramo «manifesti») con le immagini di upload.wikimedia.org (CORS aperto).
// Stato in data/romani.json (una voce per riga): le ricerche si rifanno ogni GIORNI giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { dataItaliana, secoloDa } from "./papiri.mjs";
import { manifestoEpigrafe } from "./epigrafi.mjs";

export const FILE_STATO = "data/romani.json";
const VERSIONE = 1, GIORNI = 30;
export const PARTI = ["vindolanda", "pas"];
export const RAW = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/";
export const QUOTA_MONETE = 20000;
const API = "https://commons.wikimedia.org/w/api.php";
const RIB = "https://romaninscriptionsofbritain.org";
export const BLOCCATE = {
  "finds.org.uk": "Portable Antiquities Scheme: pagine, API JSON/CSV e immagini dietro la verifica Cloudflare per il nostro server (28 ottobre 2026); da confermare dal browser. Le foto e le schede si leggono da Wikimedia Commons",
  "vindolanda.csad.ox.ac.uk": "Vindolanda Tablets Online: banca dati chiusa (rimanda alla porta 8084, che non risponde), condizioni che vietano la ripubblicazione senza permesso",
  "vto2.classics.ox.ac.uk": "Vindolanda Tablets Online II: il nome non si risolve (28 ottobre 2026)",
};

// pause proprie, oltre a quelle di scripts/rete.mjs: una richiesta ogni 2 secondi a Commons, Crawl-delay 20 di RIB
const PAUSA = { "commons.wikimedia.org": 2000, "romaninscriptionsofbritain.org": 20000 };
const ultima = new Map();
async function pausa(url) {
  const h = new URL(url).hostname, p = PAUSA[h] || 2000, t = ultima.get(h) || 0;
  if (Date.now() - t < p) await new Promise(r => setTimeout(r, p - (Date.now() - t)));
  ultima.set(h, Date.now());
}

// ------------------------------------------------------------------------------------------------ stato
export function leggiStato(file = FILE_STATO) {
  try { const s = JSON.parse(fs.readFileSync(file, "utf8")); if (s.versione === VERSIONE) return s; } catch (e) {}
  return { versione: VERSIONE, parti: {}, voci: {} };
}
export function salvaStato(st, file = FILE_STATO) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: VERSIONE, aggiornato: st.aggiornato || null, completato: st.completato || null, parti: st.parti || {} });
  fs.writeFileSync(file + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(file + ".tmp", file);
}
const pulisci = v => { for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k]; return v; };
const fresca = p => p && p.completato && Date.now() - Date.parse(p.completato) < GIORNI * 864e5;
class TempoFinito extends Error {}
const breve = (s, n = 200) => { s = String(s || "").replace(/\s+/g, " ").trim(); if (s.length <= n) return s || null; const p = s.slice(0, n).lastIndexOf(" "); return s.slice(0, p > 80 ? p : n) + "…"; };
export const testo = s => String(s ?? "").replace(/<br\s*\/?>/gi, " ").replace(/<\/p>\s*<p>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// ------------------------------------------------------------------------------------------------ Commons
// richiesta all'API di Commons (POST, come scripts/fonti/epigrafi.mjs), con maxlag e i nuovi tentativi quando la ricerca è «troppo occupata»
async function commons(param, fine) {
  for (let k = 0; k < 8; k++) {
    if (fine && Date.now() > fine) throw new TempoFinito("commons: tempo esaurito");
    await pausa(API);
    const r = await scarica(API, { corpo: new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...param }).toString(), accept: "application/json", timeout: 120000 });
    if (r.stato !== 200 || !/^\s*\{/.test(r.testo)) { log("romani", `commons: HTTP ${r.stato}, nuovo tentativo`); await new Promise(f => setTimeout(f, 30000 * (k + 1))); continue; }
    const d = JSON.parse(r.testo);
    if (d.error) {
      if (/too-busy|maxlag|ratelimited|internal_api_error/i.test(d.error.code || "")) { log("romani", `commons: ${d.error.code}, nuovo tentativo`); await new Promise(f => setTimeout(f, 30000 * (k + 1))); continue; }
      throw new Error(`commons: ${d.error.code} ${d.error.info || ""}`);
    }
    return d;
  }
  throw new Error("commons: troppi tentativi falliti");
}
const LIC_LIBERE = /^(?:CC0|Public domain|PD|CC BY(?:-SA)? \d|CC-BY|CC BY-SA|GFDL|Attribution|FAL|No restrictions)/i;
const senzaUtm = u => String(u || "").replace(/\?utm_[^#]*$/, "");
// imageinfo di una pagina di Commons -> [nome, url, larghezza, altezza, licenza, autore] (la miniatura larga al massimo 3000 pixel, o l'originale)
export function immagineCommons(pg) {
  const ii = (pg.imageinfo || [])[0]; if (!ii) return null;
  if (!/^image\/(jpeg|png|gif|webp)$/.test(ii.mime || "")) return null;
  const em = ii.extmetadata || {}, val = k => breve(testo((em[k] || {}).value || ""), 120);
  const lic = val("LicenseShortName") || val("UsageTerms");
  if (!LIC_LIBERE.test(lic || "")) return null;
  const mini = ii.thumburl && ii.thumbwidth && ii.thumbwidth < ii.width;
  return [pg.title.replace(/^File:/, ""), senzaUtm(mini ? ii.thumburl : ii.url), mini ? ii.thumbwidth : ii.width, mini ? ii.thumbheight : ii.height, lic, val("Artist")];
}

// ------------------------------------------------------------------------------------------------ PAS: lettura delle pagine di Commons
// campo di un modello {{photograph|…}} o {{Information|…}} (valore fino al campo successivo)
function campo(w, nome) {
  const m = new RegExp(`\\n\\s*\\|\\s*${nome}\\s*=([\\s\\S]*?)(?=\\n\\s*\\|\\s*[A-Za-z _]+\\s*=|\\n\\}\\})`, "i").exec(w);
  return m ? m[1].trim() : null;
}
// {{en|1=…}} -> testo semplice; i capoversi diventano fine di frase («. »), gli <span> non separano le parole («Obverse l</span><span>egend»)
const descrizioneDa = s => testo(String(s || "").replace(/^\{\{en\|(?:1=)?/i, "").replace(/\}\}\s*$/, "").replace(/<\/?span[^>]*>/gi, "")
  .replace(/<\/p>|<p>|<br\s*\/?>|\n\s*\n/gi, " ¶ ").replace(/\{\{[^{}]*\}\}/g, " ").replace(/\[https?:\S+\s([^\]]*)\]/g, "$1").replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1").replace(/''+/g, ""))
  .replace(/([.:;!?])?\s*(?:¶\s*)+/g, (m, p) => (p ? p + " " : ". ")).replace(/^\.\s*|\s*\.\s*$/g, "").trim();
const PERIODO = { "ROMAN": "R", "EARLY MEDIEVAL": "A", "EARLY-MEDIEVAL": "A" };
// anni: {{between|43|410}}, «Suggested date: Roman, 43-410», «c. 1200 - 1350», «AD 119 - 122»
export function anniDa(dataCampo, desc) {
  const b = /\{\{between\|(-?\d{1,4})\|(-?\d{1,4})/i.exec(dataCampo || ""); if (b) return [+b[1], +b[2]];
  const y = /^\s*(-?\d{3,4})(?:-\d\d(?:-\d\d)?)?\s*$/.exec(dataCampo || "");
  // una data sola nel campo è di solito la data della foto (schede caricate da Flickr): non conta
  const s = /(?:suggested )?date:?\s*(?:roman|early[ -]medieval|anglo-saxon)?[,:\s-]*(?:c\.\s*)?(?:AD\s*)?(\d{1,4})\s*(?:-|–|to)\s*(?:c\.\s*)?(?:AD\s*)?(\d{1,4})/i.exec(desc || "");
  if (s && +s[1] <= +s[2]) return [+s[1], +s[2]];
  const ad = /\bAD\s*(\d{1,4})\s*(?:-|–|to)\s*(?:AD\s*)?(\d{1,4})\b/.exec(desc || "");
  if (ad && +ad[1] <= +ad[2]) return [+ad[1], +ad[2]];
  // anni avanti Cristo (denari repubblicani): «118 BC», «115-114 BC»
  const bc = /\b(\d{1,3})(?:\s*(?:-|–)\s*(\d{1,3}))?\s*BC\b/.exec(desc || "");
  if (bc && (!bc[2] || +bc[2] <= +bc[1])) return [-bc[1], -(bc[2] || bc[1])];
  return null;
}
// periodo: R romano, A altomedievale, null altro (preistorico, medievale, moderno o non deciso)
export function periodoDa(dataCampo, titolo, desc, dn) {
  const p = PERIODO[String(dataCampo || "").trim().toUpperCase()];
  if (p) return p;
  if (dn) {
    if (dn[0] >= -300 && dn[1] <= 450 && dn[0] <= dn[1]) return /\biron age\b/i.test(titolo || "") ? null : "R";
    if (dn[0] >= 400 && dn[1] <= 1100) return "A";
    return null;
  }
  const t = `${titolo || ""} ${String(desc || "").slice(0, 300)}`;
  if (/\bearly[- ]medieval\b|\banglo-saxon\b|\bviking\b|\bsceat/i.test(t)) return /\b1[1-5]\d\d\b/.test(t) ? null : "A";
  if (/\bpost[- ]medieval\b|\bmedieval\b|\bmodern\b|\biron age\b|\bbronze age\b/i.test(titolo || "")) return null;
  if (/\broman(?:o-british)?\b/i.test(t)) return "R";
  return null;
}
// tipo dell'oggetto (dal titolo, poi dall'inizio della descrizione): [oggetto in italiano, è moneta]
const TIPI = [
  [/\bcurse[- ]tablet|\bdefixio/i, "defixio"], [/\bseal[- ]?box/i, "scatola per sigillo"], [/\blead seal(?:ing)?\b|\bsealing\b/i, "sigillo"],
  [/\bseal[- ]?matrix|\bsignet|\bseal\b/i, "sigillo"], [/\bwriting[- ]tablet|\bwax[- ]tablet/i, "tavoletta"], [/\bstylus|\bstyli\b/i, "stilo"],
  [/\bcoins?\b|\bnumm[iu]s?\b|\bdenari|\bsesterti|\bdupondi|\bradiate\b|\bantoninian|\bsiliqu|\baure[iu]s?\b|\bsolid[iu]s?\b|\bfollis|\bfolles\b|\bquinari|\btremiss|\bthrymsa|\bsceatt?a?s?\b|\bpenn(?:y|ies)\b|\bstycas?\b|\bminimi?\b|\bstater\b|\bAE\s?[1-4]\b|\bhalfpenny\b/i, "moneta"],
  [/\b(?:finger[- ])?rings?\b|\bintaglio/i, "anello"], [/\bweights?\b|\bsteelyard/i, "peso"], [/\blamps?\b/i, "lucerna"], [/\bbrooch|\bfibula/i, "fibula"],
  [/\bingot|\bpig\b/i, "lingotto"], [/\bspoon/i, "cucchiaio"], [/\bspindle[- ]?whorl/i, "fusarola"], [/\bstrap[- ]?end|\bbelt|\bbuckle/i, "guarnizione di cintura"],
  [/\bplaque|\bvotive|\bleaf\b|\blamina|\bplate\b/i, "laminetta"], [/\bmount\b|\bmounts\b|\bstud\b/i, "applique"], [/\bpendant|\bamulet|\bbracelet|\bnecklace|\bjewel/i, "gioiello"],
  [/\bsamian|\bpottery|\bvessel|\bsherd|\bmortari|\bamphora|\bflagon|\bbowl|\bcup\b|\bjug\b|\bpot\b|\bdish\b|\bplatter/i, "vaso"], [/\btile\b|\bbrick/i, "laterizio"],
  [/\bknife|\bsword|\bdagger|\bspear|\bscabbard|\bhelmet|\barmou?r/i, "arma"], [/\bkey\b|\block\b|\bpadlock/i, "chiave o serratura"], [/\bfigurine|\bstatuette/i, "statuetta"],
  [/\baltar|\bstone\b|\btombstone|\bslab/i, "pietra"], [/\btoken|\bjetton|\bcounter/i, "gettone"],
];
export function tipoDa(titolo, desc) {
  const t = String(titolo || "");
  for (const [re, o] of TIPI) if (re.test(t)) return o;
  const d = String(desc || "").split(/[.;]/)[0];
  for (const [re, o] of TIPI) if (o !== "peso" && re.test(d)) return o;   // «Weight: 2.84gm» compare in quasi tutte le descrizioni
  return "oggetto";
}
const MATERIALI = [[/\blead\b|\bpewter/i, "piombo"], [/\bgold\b/i, "oro"], [/\bsilver/i, "argento"], [/\bcopper[- ]alloy|\bbronze|\bbrass|\bcopper\b|\borichalcum/i, "lega di rame"],
  [/\biron\b/i, "ferro"], [/\bsamian|\bceramic|\bpottery|\bclay\b|\bterracotta|\bfired/i, "ceramica"], [/\bglass\b/i, "vetro"], [/\bbone\b|\bivory|\bantler/i, "osso"],
  [/\bjet\b|\bshale\b|\bstone\b|\blimestone|\bsandstone|\bgemstone|\bcarnelian|\bjasper|\bintaglio/i, "pietra"], [/\bwood(?:en)?\b/i, "legno"]];
export const materialeDa = (titolo, desc) => { const t = `${titolo || ""} ${String(desc || "").slice(0, 200)}`; for (const [re, m] of MATERIALI) if (re.test(t)) return m; return null; };
// supporto per la scheda: «metallo (moneta)», «piombo (defixio)», «ceramica (vaso)»…
export function supportoDa(oggetto, materiale) {
  const m = materiale === "piombo" ? "piombo" : /^(?:oro|argento|lega di rame|ferro)$/.test(materiale || "") ? "metallo" : materiale
    || (/^(?:moneta|sigillo|scatola per sigillo|anello|peso|fibula|laminetta|applique|guarnizione di cintura|cucchiaio|lingotto|chiave o serratura|arma)$/.test(oggetto) ? "metallo"
      : oggetto === "defixio" ? "piombo" : oggetto === "lucerna" ? "ceramica" : oggetto === "laterizio" ? "laterizio" : oggetto === "tavoletta" ? "legno" : null);
  return m ? (m === "laterizio" ? "laterizio (bollo)" : `${m} (${oggetto})`) : oggetto;
}
// legenda delle monete: «Obverse inscription: …», «Obv Insc: …», «Reverse legend: …», «Inscription: …», «inscription behind: SALVTIS»,
// «the reverse legend P M TR P COS III», «DOMINOR NOSTROR CAESS reverse type», «the legend VOT/ V»
const VUOTA = /^(?:not applicable|n\/?a|none|no inscription|illegible|unclear|uncertain|not recorded|unknown|not visible|worn|-+|\?+)\b/i;
const lettere = s => (String(s || "").match(/[A-Z]/g) || []).length;
const SIGLE = /^(?:RIC|RRC|RIB|AD|BC|CE|BCE|PAS|SF|AE[1-4]?|HCRI|LRBC|BMC|ABC|CCI|SCBI|NB)$/;
// prende la legenda dall'inizio del testo: parole maiuscole, segni e lacune, fino alla prima parola in minuscolo (fuori da parentesi)
export function tagliaLegenda(s) {
  const out = [];
  for (const tok of String(s || "").replace(/^\s*["“'‘]/, "").split(/\s+/)) {
    if (!tok) continue;
    const nucleo = tok.replace(/[^A-Za-z]/g, "");
    if (/^\(.*\)[.,;:]?$/.test(tok) || /^\((?:ligate|retrograde|sic|ligated)\)/i.test(tok)) { out.push(tok); continue; }
    if (/[a-z]{3,}/.test(nucleo) || /^[A-Z][a-z]{2,}/.test(nucleo)) break;
    if (/^[A-Za-z]{1,3}:$/.test(tok) || /\d(?:mm|g|gm|gms)\b/.test(tok) || /^[-–]$/.test(tok)) break;   // «D: 20.17mm», « - Head of Roma»
    out.push(tok);
    if (/[.;]$/.test(tok) && !/^[A-Z]\.$/.test(tok)) break;
  }
  const v = out.join(" ").replace(/["”'’]?[.,;:\-–]*$/, "").trim();
  const parole = v.split(/[^A-Z]+/).filter(w => w.length >= 2 && !SIGLE.test(w));
  return lettere(v) >= 3 && parole.length && !VUOTA.test(v) ? v : null;
}
export function legendaDa(desc) {
  const d = String(desc || ""), out = [];
  for (const m of d.matchAll(/\b(obverse|reverse|obv|rev)\.?\s*(?:inscription|legend|insc|inscr)s?\.?\s*(?:reads?|reading)?\s*[:\-–]?\s*/gi)) {
    const v = tagliaLegenda(d.slice(m.index + m[0].length, m.index + m[0].length + 160));
    if (v) out.push([m[1].toLowerCase()[0] === "o" ? "D/" : "R/", v]);
  }
  if (!out.length) {
    for (const m of d.matchAll(/\b(?:inscription|legend)s?\b(?:\s+(?:around|behind|above|below|in exergue|reads?|reading|of)\b)?\s*:?\s*/gi)) {
      const v = tagliaLegenda(d.slice(m.index + m[0].length, m.index + m[0].length + 160)); if (v) out.push(["", v]);
    }
    for (const m of d.matchAll(/((?:[A-Z\[\]\/·•.+]{1,}\s){1,8})reverse type\b/g)) { const v = tagliaLegenda(m[1]); if (v) out.push(["R/", v]); }
  }
  const visti = new Set();
  return out.length ? out.filter(([l, v]) => !visti.has(l + v) && visti.add(l + v)).map(([l, v]) => (l ? l + " " : "") + v).join(" ; ").slice(0, 300) : null;
}
// iscrizione degli altri oggetti: «Inscribed "DEO TOTA"», «Inscription reads +S'SIBIL' FIL' hENR'», «stamp reads …», «inscription: …»
export function iscrizioneDa(desc) {
  const d = String(desc || "");
  const pats = [/\binscribed\s+(?:with\s+)?["“']([^"”']{2,100})["”']/i, /\b(?:reads?|reading)\s*:?\s*["“']([^"”']{2,120})["”']/i,
    /\binscri(?:bed|ption)\b(?:(?!translat|mean)[^.:"“]){0,40}?(?:reads?|reading|:)\s*["“']?([^"”<\n;]{2,140}?)["”']?(?=\s*(?:\(|,\s*(?:with|between|on|in)\b|\.\s|;|$))/i,
    /\bstamp(?:ed)?\b[^.:"“]{0,40}?(?:reads?|reading|:)\s*["“']?([^"”<\n;.]{2,100})/i, /\b(?:letters?|lettering)\s+["“']([^"”']{2,100})["”']/i];
  // le prime due forme sono tra virgolette; nelle altre il testo deve avere lettere maiuscole o rune (non una frase di commento)
  for (const [i, re] of pats.entries()) {
    const m = re.exec(d); if (!m || VUOTA.test(m[1].trim())) continue;
    if (i < 2 ? /[A-Za-z\u16A0-\u16FF]/.test(m[1]) : /[A-Z]{2,}|[\u16A0-\u16FF]/.test(m[1])) return m[1].trim().slice(0, 300);
  }
  return null;
}
// scrittura sull'oggetto (non monete): parole della scrittura, senza le negazioni
const SCRITTO = /\binscri(?:bed|ption|ptions)\b|\blegend\b|\blettering\b|\bletters?\b(?![- ]like)|\bgraffit[oi]\b|\brun(?:ic|es)\b|\bcurse[- ]tablet|\bdefixio|\bmaker'?s?\s+(?:mark|stamp|name)|\bname[- ]stamp|\bpotter'?s?\s+stamp|\bstamp(?:ed)?\b[^.]{0,40}\b(?:reads?|reading|name|letters?|inscription)\b|\b(?:reads?|reading)\s*:?\s*["“']|\bVTERE\b|\bFELIX\b|\bSPQR\b|\bTOT\b|\bDEO\b/i;
const NEGATO = /\b(?:no|without|lacks?|lacking|nor)\s+(?:visible\s+|surviving\s+|legible\s+|trace of\s+(?:an?\s+)?)?(?:inscriptions?|legend|letters|lettering)\b|\buninscribed\b|\binscription\s*:\s*(?:not applicable|none)\b/i;
export function scritto(oggetto, desc, titolo) {
  if (oggetto === "defixio") return true;
  const d = `${titolo || ""} . ${desc || ""}`;
  if (!SCRITTO.test(d)) return false;
  // tutte le occorrenze negate: niente scrittura
  const pos = d.replace(new RegExp(NEGATO.source, "gi"), " ");
  return SCRITTO.test(pos);
}
// contee (scripts/luoghi/contee-gb.json): nome della contea dai suoi alias; nelle schede caricate da Flickr la contea si cerca nel testo («found at Hockliffe, Bedfordshire»)
const contee = (() => { try { return JSON.parse(fs.readFileSync("scripts/luoghi/contee-gb.json", "utf8")).contee; } catch (e) { return {}; } })();
const nomeContea = new Map(Object.values(contee).flatMap(c => c.alias.map(a => [a.toLowerCase(), c.nome])));
const RE_CONTEA = (() => { const a = [...nomeContea.keys()].filter(x => x.length > 3).sort((x, y) => y.length - x.length).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return a.length ? new RegExp(`(?:found|discovered|from|near|at|in)\\b[^.]{0,60}?\\b(${a.join("|")})\\b`, "i") : null; })();
export const conteaNelTesto = d => { const m = RE_CONTEA && RE_CONTEA.exec(String(d || "")); return m ? nomeContea.get(m[1].toLowerCase()) : null; };
// pagina di Commons di un file del PAS -> dati della scheda (o null se non è del PAS)
export function schedaPas(titoloFile, w) {
  w = String(w || "");
  if (/licen[cs]e conflict/i.test(w)) return null;
  const tit = testo(campo(w, "title") || titoloFile.replace(/^File:/, "").replace(/\.[a-z]{3,4}$/i, "").replace(/\s*\(FindID \d+\)\s*/i, " "));
  const descr = descrizioneDa(campo(w, "description") || campo(w, "Description") || "");
  const dataCampo = campo(w, "date") || campo(w, "Date") || "";
  const acc = campo(w, "accession number") || "";
  const fid = (/FindID:?\s*(\d+)/i.exec(acc) || /\(FindID (\d+)\)/i.exec(titoloFile) || /finds\.org\.uk\/database\/artefacts\/record\/id\/(\d+)/.exec(w) || [])[1] || null;
  const pid = (/Old ref:\s*([A-Z0-9]{2,8}-[0-9A-F]{5,6})\b/.exec(acc) || /\b((?:[A-Z]{2,6}\d?)-[0-9A-F]{6})\b/.exec(`${titoloFile} ${descr}`) || [])[1] || null;
  if (!fid && !pid) return null;
  const luogo = campo(w, "depicted place") || "";
  const contea = (/\(County of findspot\)\s*([^<\n|{}]+)/i.exec(luogo) || [])[1] || conteaNelTesto(descr) || null;
  const fot = testo(campo(w, "photographer") || "").replace(/,\s*\d{4}-\d\d-\d\d.*$/, "") || null;
  const tit2 = tit.replace(/^[A-Z]{2,6}-[0-9A-F]{6}\s+/, "").replace(/^Unknown:\s*/i, "").replace(/^'(.*)'$/, "$1");
  return pulisci({ fid, pid, t: tit2, d: descr, dc: testo(dataCampo.replace(/\{\{(?!between)[^{}]*\}\}/gi, "")) || (/\{\{between/i.test(dataCampo) ? dataCampo : null), c: contea ? contea.trim() : null, ph: fot });
}
// dati della scheda -> voce compatta dello stato (o { x: motivo })
export function vocePas(s) {
  const dn = anniDa(s.dc, s.d), per = periodoDa(s.dc, s.t, s.d, dn);
  if (!per) return { x: "periodo" };
  const oggetto = tipoDa(s.t, s.d), mon = oggetto === "moneta";
  const tx = mon ? legendaDa(s.d) : iscrizioneDa(s.d);
  if (mon ? !tx : !scritto(oggetto, s.d, s.t)) return { x: mon ? "moneta senza legenda registrata" : "senza scrittura" };
  return pulisci({ pid: s.pid, t: breve(s.t, 160), d: breve(s.d, 400), per, dn, o: oggetto, m: materialeDa(s.t, s.d), tx, c: s.c, ph: s.ph });
}

// ricerche dentro la categoria del PAS (ciascuna sotto i 10.000 risultati che CirrusSearch lascia sfogliare)
const CAT = 'incategory:"Portable_Antiquities_Scheme" ';
export const RICERCHE_PAS = ["insource:inscription insource:ROMAN", "insource:inscription Roman", "insource:inscribed Roman", "insource:legend Roman", "insource:lettering Roman",
  "insource:letters Roman", "insource:stamp Roman", "insource:stamped Roman", "insource:reads Roman", "insource:reading Roman", "insource:graffito", "insource:graffiti Roman",
  'insource:"curse tablet"', "insource:defixio", 'insource:"maker\'s stamp"', 'insource:"name stamp"', "insource:VTERE", 'insource:"seal box" insource:letters',
  'insource:inscription "early medieval"', 'insource:legend "early medieval"', "insource:inscription Anglo-Saxon", "insource:runic", "insource:runes",
  'insource:"EARLY MEDIEVAL" insource:inscription', 'insource:"Obverse inscription" Roman', 'insource:"Reverse inscription" Roman'].map(q => CAT + q);

async function leggiPas(st, fine) {
  const p = st.parti.pas = st.parti.pas || {};
  if (fresca(p)) return;
  if (p.completato || p.q == null) { p.q = 0; p.o = 0; p.completato = null; p.visti = []; p.scarti = {}; p.oltre = []; }
  const visti = new Set(p.visti || []);
  // file letti in questo giro: chiave del file -> scheda; le voci si riuniscono per FindID
  for (; p.q < RICERCHE_PAS.length; p.q++, p.o = 0) {
    for (;;) {
      if (Date.now() > fine) { p.visti = [...visti]; salvaStato(st); throw new TempoFinito(`pas: ricerca ${p.q + 1} di ${RICERCHE_PAS.length} ferma a ${p.o}`); }
      const d = await commons({ action: "query", generator: "search", gsrnamespace: "6", gsrlimit: "50", gsroffset: String(p.o), gsrsearch: RICERCHE_PAS[p.q], gsrinfo: "totalhits",
        prop: "revisions|imageinfo", rvprop: "content", rvslots: "main", iiprop: "size|url|mime|extmetadata", iiurlwidth: "3000", iiextmetadatafilter: "LicenseShortName|Artist|UsageTerms" }, fine);
      const tot = ((d.query || {}).searchinfo || {}).totalhits;
      if (p.o === 0 && tot > 10000 && !p.oltre.includes(p.q)) { p.oltre.push(p.q); log("romani", `pas: la ricerca «${RICERCHE_PAS[p.q]}» ha ${tot} risultati, se ne leggono 10.000`); }
      for (const pg of ((d.query || {}).pages || [])) {
        if (visti.has(pg.title)) continue;
        visti.add(pg.title);
        const w = (((pg.revisions || [])[0] || {}).slots || {}).main?.content || "";
        const s = schedaPas(pg.title, w); if (!s) { p.scarti["non del PAS o licenza in conflitto"] = (p.scarti["non del PAS o licenza in conflitto"] || 0) + 1; continue; }
        const img = immagineCommons(pg); if (!img) { p.scarti["immagine senza licenza libera"] = (p.scarti["immagine senza licenza libera"] || 0) + 1; continue; }
        const v = vocePas(s);
        if (v.x) { p.scarti[v.x] = (p.scarti[v.x] || 0) + 1; continue; }
        const k = "pas:" + (s.fid || s.pid);
        const prima = st.voci[k];
        if (prima && prima.giro === p.inizio) { if (!prima.f.some(f => f[0] === img[0])) prima.f.push(img); if (!prima.tx && v.tx) prima.tx = v.tx; }
        else st.voci[k] = { ...v, f: [img], giro: p.inizio || null };
      }
      const cont = (d.continue || {}).gsroffset;
      if (cont == null || cont >= 10000) break;
      p.o = cont;
      if (p.o % 1000 === 0) { st.aggiornato = new Date().toISOString(); p.visti = [...visti]; salvaStato(st); log("romani", `pas: ricerca ${p.q + 1}, ${p.o} file`); }
    }
    st.aggiornato = new Date().toISOString(); p.visti = [...visti]; salvaStato(st);
  }
  // giro finito: fuori le voci non ritrovate (solo se il giro ha letto qualcosa)
  const giro = p.inizio || null, nuove = Object.keys(st.voci).filter(k => k.startsWith("pas:") && st.voci[k].giro === giro);
  if (nuove.length) for (const k of Object.keys(st.voci)) if (k.startsWith("pas:") && st.voci[k].giro !== giro) delete st.voci[k];
  p.totale = nuove.length; p.file = visti.size; p.visti = null; p.q = null; p.o = null; p.completato = new Date().toISOString(); p.inizio = null;
}

// ------------------------------------------------------------------------------------------------ Vindolanda (Commons + RIB)
// pagina di RIB online di una tavoletta -> dati e testo dell'edizione (CC BY 4.0)
export function schedaRib(h) {
  const dd = {};
  for (const m of String(h).matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)) { const k = testo(m[1]).replace(/\s*\?$/, ""); if (!(k in dd)) dd[k] = testo(m[2]); }
  const t = testo((/<h1>([\s\S]*?)<\/h1>/.exec(h) || [])[1] || "");
  const ed = (/<div class="interpretive" id="edition-interpretive"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="(?:diplomatic|continuous)"|<\/section>)/.exec(h) || [])[1] || "";
  const tx = ed ? testo(ed.replace(/<div class="textpartnumber"[^>]*>([\s\S]*?)<\/div>/g, " [$1] ").replace(/<br[^>]*>/g, " / ")).replace(/(?:\s*\/\s*)+/g, " / ").replace(/^\s*\/\s*|\s*\/\s*$/g, "") : null;
  return pulisci({ t: t || null, ty: dd["Type of object"] || null, ma: dd.Material || null, dim: dd.Dimensions ? dd.Dimensions.replace(/^Unless[\s\S]*?\.\s*/, "") : null, sito: dd.Site || null,
    luogo: dd["Modern location"] || null, ist: dd["Institution/acc. #"] || null, data: dd.Date || null, cat: (dd["Tablet Category"] || dd["Text type"] || "").replace(/\s*\|\s*$/, "") || null, tx: tx ? breve(tx, 1500) : null });
}
async function leggiVindolanda(st, fine) {
  const p = st.parti.vindolanda = st.parti.vindolanda || {};
  if (fresca(p)) return;
  const nums = new Map(), add = (n, f) => { if (!nums.has(n)) nums.set(n, new Set()); if (f) nums.get(n).add(f); };
  const d = await commons({ action: "query", list: "categorymembers", cmtitle: "Category:Vindolanda tablets", cmlimit: "500", cmtype: "subcat|file" }, fine);
  for (const m of (d.query || {}).categorymembers || []) {
    const n = (/^Category:Vindolanda tablet (\d+)$/i.exec(m.title) || [])[1];
    if (n) {
      const c = await commons({ action: "query", list: "categorymembers", cmtitle: m.title, cmlimit: "500", cmtype: "file" }, fine);
      add(n); for (const f of (c.query || {}).categorymembers || []) add(n, f.title);
    } else { const nf = (/^File:Vindolanda tablet (\d+)\b/i.exec(m.title) || [])[1]; if (nf) add(nf, m.title); }
  }
  const tutti = [...new Set([...nums.values()].flatMap(s => [...s]))];
  const info = new Map();
  for (let i = 0; i < tutti.length; i += 50) {
    const r = await commons({ action: "query", titles: tutti.slice(i, i + 50).join("|"), prop: "imageinfo", iiprop: "size|url|mime|extmetadata", iiurlwidth: "3000", iiextmetadatafilter: "LicenseShortName|Artist|UsageTerms" }, fine);
    for (const pg of (r.query || {}).pages || []) { const im = immagineCommons(pg); if (im) info.set(pg.title, im); }
  }
  for (const [n, fs_] of nums) {
    const f = [...fs_].map(x => info.get(x)).filter(Boolean);
    const k = "vindolanda:" + n;
    if (!f.length) { delete st.voci[k]; continue; }
    const prima = st.voci[k] || {};
    let rib = prima.rib;
    if (!rib || !fresca(p)) {
      if (Date.now() > fine) throw new TempoFinito("vindolanda: tempo esaurito");
      await pausa(RIB);
      const r = await scarica(`${RIB}/inscriptions/TabVindol${n}`, { timeout: 90000 });
      rib = r.stato === 200 ? schedaRib(r.testo) : prima.rib || null;
    }
    st.voci[k] = pulisci({ f, rib });
  }
  for (const k of Object.keys(st.voci)) if (k.startsWith("vindolanda:") && !nums.has(k.slice(11))) delete st.voci[k];
  p.totale = Object.keys(st.voci).filter(k => k.startsWith("vindolanda:")).length; p.completato = new Date().toISOString();
}

// ------------------------------------------------------------------------------------------------ raccolta
export async function scansionaRomani({ minuti = 60, soloCache = false, parti = PARTI } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3, errori = [];
  const lettori = { vindolanda: leggiVindolanda, pas: leggiPas };
  const pas = st.parti.pas = st.parti.pas || {};
  if (!fresca(pas) && !pas.inizio) pas.inizio = new Date().toISOString();
  for (const parte of parti) {
    if (Date.now() > fine) { errori.push(`${parte}: tempo esaurito`); break; }
    try { await lettori[parte](st, fine); log("romani", `${parte}: fatto`); }
    catch (e) { errori.push(e.message); log("romani", e instanceof TempoFinito ? "" : "ERRORE", e.message); }
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  if (!errori.length && PARTI.every(x => st.parti[x] && st.parti[x].completato)) st.completato = new Date().toISOString();
  else if (st.completato && PARTI.some(x => !st.parti[x] || !st.parti[x].completato)) st.completato = null;
  salvaStato(st);
  return st;
}

// ------------------------------------------------------------------------------------------------ voci del catalogo
export const LICENZA_PAS = "Portable Antiquities Scheme / The Trustees of the British Museum";
const repubblicana = v => /\brepublican\b/i.test(`${v.t || ""} ${v.d || ""}`);
const dataPeriodo = v => v.dn ? dataItaliana(v.dn) : v.per === "R" ? (repubblicana(v) ? "età romana repubblicana" : "età romana (43-410 d.C.)") : "alto medioevo (410-1066 d.C.)";
const secoloPeriodo = v => v.dn ? secoloDa(v.dn, null) : v.per === "R" ? (repubblicana(v) ? null : [1, 5]) : [5, 11];
const GENERI = { moneta: "legenda monetale", defixio: "defixio", sigillo: "sigillo", "scatola per sigillo": "scatola per sigillo", laterizio: "bollo laterizio", vaso: "bollo o graffito su ceramica",
  anello: "iscrizione su anello", peso: "peso iscritto", lucerna: "lucerna con marchio", fibula: "fibula con iscrizione" };
export function recordPas(key, v) {
  if (!v || v.x || !(v.f || []).length) return null;
  const fid = /^\d+$/.test(key) ? key : null, lid = key.toLowerCase();
  const contea = v.c ? nomeContea.get(v.c.toLowerCase()) || v.c : null;
  const lic = [...new Set(v.f.map(f => f[4]))];
  return {
    fonte: "romani", id: "rom-pas-" + lid, tipo: "epigrafe", citta: contea,
    biblioteca: contea ? `Portable Antiquities Scheme (British Museum), contea di ritrovamento: ${contea}` : "Portable Antiquities Scheme (British Museum), contea di ritrovamento non indicata",
    segnatura: v.pid ? `PAS ${v.pid}` : `PAS FindID ${key}`, titolo: v.t || null, datazione: dataPeriodo(v), secolo: secoloPeriodo(v),
    lingue: v.per === "R" || v.o === "moneta" ? ["la"] : [], manifest: `${RAW}romani-pas/${lid}.json`,
    pagina: fid ? `https://finds.org.uk/database/artefacts/record/id/${fid}` : v.f[0] && `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(v.f[0][0].replace(/ /g, "_"))}`, immagini: v.f.length,
    licenza: `Foto e scheda: ${LICENZA_PAS}, su Wikimedia Commons (${lic.join(", ")}); manifesto IIIF di Emendando`,
    epigrafe: pulisci({ pas: v.pid || null, pas_findid: fid ? +fid : null, supporto: supportoDa(v.o, v.m), oggetto: v.o, materiale: v.m || null, genere: GENERI[v.o] || "iscrizione su instrumentum",
      periodo: v.per === "R" ? "romano" : "altomedievale", provenienza: contea ? `contea di ritrovamento: ${contea} (Inghilterra e Galles)` : null, testo: v.tx || null, descrizione: v.d || null,
      fotografo: v.ph || null, licenza_metadati: "CC BY-SA 4.0 (schede del PAS su Wikimedia Commons)", aperta: true }),
  };
}
const CITTA_MUSEO = [[/British Museum/i, "Londra", "British Museum"], [/Vindolanda|Chesterholm/i, "Northumberland", "Vindolanda Museum (Chesterholm)"]];
export function recordVindolanda(n, v) {
  if (!v || !(v.f || []).length) return null;
  const r = v.rib || {}, dove = `${r.luogo || ""} ${r.ist || ""}`;
  const cm = CITTA_MUSEO.find(([re]) => re.test(dove));
  const acc = (/British Museum\s*:\s*([\d,.]+)/.exec(r.ist || "") || [])[1];
  const dn = (/(\d{2,3})\s*-\s*(\d{2,3})/.exec(r.data || "") || []).slice(1).map(Number);
  return {
    fonte: "romani", id: "rom-vindol-" + n, tipo: "epigrafe", citta: cm ? cm[1] : null, biblioteca: cm ? cm[2] : "Luogo di conservazione non indicato (RIB)",
    segnatura: `Tab. Vindol. ${n}` + (acc ? ` (British Museum ${acc})` : ""), titolo: r.t ? r.t.replace(/^Tab\.\s?Vindol\.\s*\d+\.\s*/, "") : `Tavoletta di Vindolanda ${n}`,
    datazione: dn.length === 2 ? dataItaliana(dn) : r.data || "età romana (fine I - inizio II secolo d.C.)", secolo: dn.length === 2 ? secoloDa(dn, null) : [1, 2], lingue: ["la"],
    manifest: `${RAW}romani-vindolanda/${n}.json`, pagina: `${RIB}/inscriptions/TabVindol${n}`, immagini: v.f.length,
    licenza: `Foto: Wikimedia Commons (${[...new Set(v.f.map(f => f[4]))].join(", ")}). Dati e testo: Roman Inscriptions of Britain online, CC BY 4.0. Manifesto IIIF di Emendando`,
    epigrafe: pulisci({ edizione: `Tab. Vindol. ${n}`, rib: `TabVindol${n}`, supporto: /wax|stylus/i.test(r.ty || "") ? "legno (tavoletta cerata)" : "legno (tavoletta)", oggetto: r.ty || null,
      provenienza: r.sito ? `${r.sito} (Northumberland)` : "Vindolanda (Northumberland)", conservazione: r.luogo || null, misure: r.dim || null, genere: r.cat || null, testo: r.tx || null,
      licenza_metadati: "Roman Inscriptions of Britain online, CC BY 4.0", aperta: true }),
  };
}
// tavolette che il catalogo ha già dalla fonte «epigrafi» (Wikidata con il numero RIB): restano a quella fonte
function ribGia() { try { return new Set(Object.values(JSON.parse(fs.readFileSync("data/epigrafi.json", "utf8")).voci || {}).map(v => v && v.rib).filter(Boolean)); } catch (e) { return new Set(); } }
// monete: al massimo QUOTA_MONETE, quelle con le foto più grandi
const area = v => Math.max(...v.f.map(f => (f[2] || 0) * (f[3] || 0)));
export function vociScelte(st = leggiStato(), gia = ribGia()) {
  const pas = Object.entries(st.voci || {}).filter(([k, v]) => k.startsWith("pas:") && v && !v.x && (v.f || []).length);
  const monete = pas.filter(([, v]) => v.o === "moneta").sort(([, a], [, b]) => area(b) - area(a));
  const fuori = new Set(monete.slice(QUOTA_MONETE).map(([k]) => k));
  const vin = Object.entries(st.voci || {}).filter(([k, v]) => k.startsWith("vindolanda:") && v && (v.f || []).length && !gia.has("TabVindol" + k.slice(11)));
  return { pas: pas.filter(([k]) => !fuori.has(k)), vindolanda: vin, moneteFuori: fuori.size, moneteTotali: monete.length };
}
export function recordRomani(st = leggiStato()) {
  const s = vociScelte(st), out = [];
  for (const [k, v] of s.pas) { const r = recordPas(k.slice(4), v); if (r) out.push(r); }
  for (const [k, v] of s.vindolanda) { const r = recordVindolanda(k.slice(11), v); if (r) out.push(r); }
  for (const r of out) for (const c of Object.keys(r)) if (r[c] == null || r[c] === undefined) delete r[c];
  return out;
}

// ------------------------------------------------------------------------------------------------ manifesti scritti dal catalogo (scripts/manifesti.mjs)
const lm = (s, l = "none") => ({ [l]: [String(s)] });
const coppia = (k, v) => (v ? { label: lm(k, "it"), value: lm(v) } : null);
const immagini = f => f.map(([nome, u, w, h, lic, aut]) => ({ url: u, w, h, etichetta: [aut, lic].filter(Boolean).join(", ") || nome, formato: /\.png$/i.test(u) ? "image/png" : /\.gif$/i.test(u) ? "image/gif" : "image/jpeg" }));
export function manifestiRomani(st = leggiStato()) {
  const out = { "romani-pas": {}, "romani-vindolanda": {} }, s = vociScelte(st);
  for (const [k, v] of s.pas) {
    const r = recordPas(k.slice(4), v); if (!r) continue;
    const e = r.epigrafe, lid = k.slice(4).toLowerCase();
    out["romani-pas"][lid] = manifestoEpigrafe(r.manifest, `${r.segnatura}: ${r.titolo || e.oggetto}`,
      [coppia("Oggetto", e.oggetto), coppia("Supporto", e.supporto), coppia("Datazione", r.datazione), coppia("Provenienza", e.provenienza), coppia("Iscrizione o legenda", e.testo),
        coppia("Descrizione", e.descrizione), coppia("Identificativo PAS", e.pas), coppia("FindID", e.pas_findid ? String(e.pas_findid) : null)],
      `${LICENZA_PAS} (Portable Antiquities Scheme, finds.org.uk). Foto: ${[...new Set(v.f.map(f => [f[5], f[4]].filter(Boolean).join(", ")))].join(" ; ")}, da Wikimedia Commons. Manifesto scritto da Emendando.`,
      r.pagina, immagini(v.f), null);
  }
  for (const [k, v] of s.vindolanda) {
    const r = recordVindolanda(k.slice(11), v); if (!r) continue;
    const e = r.epigrafe;
    out["romani-vindolanda"][k.slice(11)] = manifestoEpigrafe(r.manifest, `${e.edizione}: ${r.titolo}`,
      [coppia("Edizione", e.edizione), coppia("Supporto", e.supporto), coppia("Datazione", r.datazione), coppia("Provenienza", e.provenienza), coppia("Conservazione", e.conservazione),
        coppia("Testo (RIB online, CC BY 4.0)", e.testo)],
      `Foto: ${[...new Set(v.f.map(f => [f[5], f[4]].filter(Boolean).join(", ")))].join(" ; ")}, da Wikimedia Commons. Dati e testo: Roman Inscriptions of Britain online (CC BY 4.0). Manifesto scritto da Emendando.`,
      r.pagina, immagini(v.f), null);
  }
  return out;
}
