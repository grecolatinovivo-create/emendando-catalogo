// Biblioteca della Matica srpska (Библиотека Матице српске, БМС), Novi Sad: biblioteca digitale «Дигитална БМС» (digital.bms.rs/ebiblioteka).
// Entrano i libri manoscritti (collezione «Рукописне књиге», 173 codici, e le altre schede con «Врста грађе: Рукописна»: codici
// cirillici dal XIII secolo, il più antico è l'Apostolo della Matica, poi libri liturgici, sbornici, grammatiche e opere del XVIII-XIX
// secolo) e, come tipo a parte, le carte geografiche, gli atlanti e le piante di città fino al 1900 (collezioni «Атласи»,
// «Географске карте», «Планови града»: a stampa, salvo quelle segnate «Рукописна»). Restano fuori stampati, periodici, fotografie,
// manifesti, documenti e le carte del Novecento.
// Come si legge: il sito non ha robots.txt (404) né IIIF. L'elenco viene dalle pagine dei risultati del sito (20 schede per pagina,
// /publications/index/string:2/tags:collectionType/page:N per i manoscritti, /publications/index/collection:<n>/page:N per le carte);
// di ogni scheda si legge una volta la pagina della scheda (/publications/view/<id>: titolo, autore, anno, segnatura, lingua, descrizione
// del catalogo a stampa) e lo script del visore della biblioteca (pageFlip/reader/BookReaderJSFalconTech.js.php?type=publications&id=<id>,
// il BookReader di Internet Archive), che dà il numero delle immagini e le misure di ciascuna. Le immagini sono JPEG di circa 1400 px
// (/ebiblioteka/pageFlip/publications/<id>/000001.jpg, ...), servite in https senza controllo del referer: si caricano come <img>.
// I manifesti IIIF (Presentation 2, immagini a misura fissa, senza servizio Image) li scrive il catalogo (scripts/manifesti.mjs, ramo
// «manifesti»), come per la Biblioteca Nazionale di Bulgaria.
// Condizioni: la biblioteca pubblica la Дигитална БМС «sulla rete pubblica Internet» (pagina «О Дигиталној БМС»); per alcune schede
// avverte che la pubblicazione completa è consultabile solo in sede: i codici in rete solo in parte (immagini molto meno delle carte
// dichiarate nella descrizione) restano fuori.
// Stato in data/bms.json: l'elenco si rilegge ogni 14 giorni, schede e visore una volta sola per codice. Pausa di 1,5 secondi (rete.mjs).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/bms.json";
export const SITO = "https://digital.bms.rs/ebiblioteka";
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/bms";
export const LICENZA = "Библиотека Матице српске, Дигитална БМС (copie digitali pubblicate in rete dalla biblioteca)";
// elenchi letti: manoscritti (tipo di collezione 2, «Рукописна») e collezioni cartografiche
export const ELENCHI = { "string:2/tags:collectionType": "manoscritti", "collection:21": "atlanti", "collection:24": "carte", "collection:28": "piante" };
const GIORNI = 14;
export const immagineBms = (id, i) => `${SITO}/pageFlip/publications/${id}/${String(i + 1).padStart(6, "0")}.jpg`;
export const paginaBms = id => `${SITO}/publications/view/${id}`;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const entita = s => String(s || "").replace(/&nbsp;?/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&");
const pulito = s => entita(String(s || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// pagina dei risultati -> [id], numero totale delle schede
export function idElenco(html) {
  const ids = [...new Set([...html.matchAll(/publications\/view\/(\d+)/g)].map(m => m[1]))];
  const tot = +((/Укупно пронађено резултата:\s*(\d+)/.exec(html) || [])[1] || 0);
  return { ids, tot };
}

// pagina della scheda -> campi
export function schedaBms(html) {
  const campo = nome => {
    const m = new RegExp(`<p>\\s*${nome}:\\s*(?:</dt>)?([\\s\\S]*?)</p>`).exec(html);
    return m ? pulito(m[1]) || null : null;
  };
  const tipo = (/tags:collectionType"[^>]*>([^<]*)</.exec(html) || [])[1];
  const collezioni = [...html.matchAll(/tags:collection"[^>]*>([^<]*)</g)].map(m => pulito(m[1])).filter(Boolean);
  const nota = (/<div class="view-note">([\s\S]*?)<\/div>/.exec(html) || [])[1] || "";
  const v = {
    t: pulito((/class="page-title"[^>]*>([\s\S]*?)<\/a>/.exec(html) || [])[1]) || null,
    a: pulito((/class="page-author"[^>]*>([\s\S]*?)<\/a>/.exec(html) || [])[1]) || null,
    y: campo("Година"), s: campo("Сигнатура"), l: campo("Језик"), r: tipo ? pulito(tipo) : null,
    k: [...new Set(collezioni)].join("; ") || null,
    c: pulito(nota.replace(/Напомена:[^<]*/g, "")).slice(0, 1500) || null,
    o: /доступна само у просторијама/.test(nota) ? 1 : null,
  };
  for (const x of Object.keys(v)) if (v[x] == null || v[x] === "") delete v[x];
  return v;
}

// script del visore -> numero delle immagini e misure (larghezze; altezza unica se uguale per tutte)
export function visoreBms(js) {
  const n = +((/br\.numLeafs\s*=\s*(\d+)/.exec(js) || [])[1] || 0);
  if (!n) return { n: 0 };
  const lista = nome => ((new RegExp(`br\\.${nome}\\s*=\\s*'([0-9,\\s]*)'`).exec(js) || [])[1] || "").split(",").map(x => +x.trim()).filter(x => x > 0);
  let w = lista("kavecanImagesWidth"), h = lista("kavecanImagesHeight");
  const fissa = re => +((re.exec(js) || [])[1] || 0);
  const w0 = fissa(/getPageWidth\s*=\s*function[^{]*\{\s*return\s+(\d+)/), h0 = fissa(/getPageHeight\s*=\s*function[^{]*\{\s*return\s+(\d+)/);
  if (w.length !== n) w = Array(n).fill(w0 || 1000);
  if (h.length !== n) h = Array(n).fill(h0 || 1400);
  const v = { n, w };
  v.h = h.every(x => x === h[0]) ? h[0] : h;
  return v;
}

// carte dichiarate nella descrizione («82 стране», «215 листова», «Л. 1-73»): pagine attese, o null
export function pagineAttese(c) {
  const s = String(c || "");
  const p = /(\d+)\s*(?:стран|стр\.|pages|S\.)/i.exec(s); if (p) return +p[1];
  const l = /(\d+)\s*(?:листов|лист\.|л\.|fol)/i.exec(s); if (l) return 2 * +l[1];
  return null;
}

export async function scansionaBms({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const voci = {};
    for (const [chiave, gruppo] of Object.entries(ELENCHI)) {
      let tot = 0;
      const visti = new Set();
      for (let p = 1; p <= 100; p++) {
        const r = await scarica(`${SITO}/publications/index/${chiave}${p > 1 ? `/page:${p}/` : ""}`, { timeout: 120000, accept: "text/html" });
        if (r.stato !== 200) throw new Error(`elenco ${chiave}, pagina ${p}: HTTP ${r.stato}`);
        const e = idElenco(r.testo); tot = e.tot || tot;
        const prima = visti.size;
        for (const id of e.ids) { visti.add(id); if (!voci[id]) voci[id] = { ...((st.voci || {})[id] || {}), g: gruppo }; }
        if (!e.ids.length || visti.size === prima || p * 20 >= tot) break;
      }
      log("bms", `elenco ${gruppo}: ${tot} schede`);
    }
    if (Object.keys(voci).length < 100) throw new Error(`elenco troppo corto (${Object.keys(voci).length} schede)`);
    st.voci = voci; st.elenco = new Date().toISOString(); st.completato = null;
    salvaStato(st);
  }
  let letti = 0;
  for (const [id, v] of Object.entries(st.voci)) {
    if (v.n != null || v.x) continue;
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`schede lette in parte (${letti} in questo giro): riprenderà alla prossima esecuzione`); }
    const r = await scarica(paginaBms(id), { timeout: 120000, accept: "text/html" });
    if (r.stato !== 200) { v.x = `scheda: HTTP ${r.stato}`; continue; }
    Object.assign(v, schedaBms(r.testo));
    const j = await scarica(`${SITO}/pageFlip/reader/BookReaderJSFalconTech.js.php?type=publications&id=${id}&m=2`, { timeout: 120000 });
    if (j.stato !== 200) { v.x = `visore: HTTP ${j.stato}`; continue; }
    Object.assign(v, visoreBms(j.testo));
    letti++;
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("bms", `${letti} schede lette`); }
  }
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("bms", `${Object.values(st.voci).filter(ammessaBms).length} entrano su ${Object.keys(st.voci).length} schede`);
  return st;
}

const CARTE = new Set(["atlanti", "carte", "piante"]);
const anno = v => +((/\b(1[0-9]{3})\b/.exec(v.y || "") || [])[1] || 0);
// carte dei secoli passati: fino al 1900 (le carte del Novecento sono stampati moderni)
export const cartaBms = v => CARTE.has(v.g) || /Атлас|Географске карте|Планови града/.test(v.k || "");
// fuori: carte sciolte d'archivio (lettere, diplomi, privilegi), codici in rete solo in parte, carte del Novecento
const NON_LIBRARI = /^(?:Писмо|Писма|Диплома|Повеља|Привилегија|Уговор|Тестамент|Сведоџба|Сведочанство|Решење|Молба|Извештај)\b/i;
export function ammessaBms(v) {
  if (!v || !v.n || v.x) return false;
  if (cartaBms(v)) return v.r === "Рукописна" || (anno(v) > 0 && anno(v) <= 1900);
  if (v.r !== "Рукописна" || NON_LIBRARI.test(v.t || "")) return false;
  // schede «Рукописна» fuori dalla collezione dei libri manoscritti (musica, qualche scheda segnata male): solo fino al 1900 e non le
  // edizioni moderne della biblioteca
  if (!/Рукописне књиге/.test(v.k || "") && (!(anno(v) > 0 && anno(v) <= 1900) || /Издања БМС|Књиге после 1867/.test(v.k || ""))) return false;
  const att = pagineAttese(v.c);
  return !(att && att >= 16 && v.n < att / 2);
}
export function tipoBms(v) { return cartaBms(v) ? (v.r === "Рукописна" ? "carta" : "carta_stampa") : null; }

// lingue dal campo «Језик» (nomi serbi)
export function lingueBms(l) {
  const out = new Set();
  for (const x of String(l || "").toLowerCase().split(/[,;/]|\sи\s/).map(s => s.trim()).filter(Boolean)) {
    if (/словенск/.test(x)) out.add("cu");
    else if (/^руск/.test(x)) out.add("ru");
    else if (/латин/.test(x)) out.add("la");
    else if (/грч/.test(x)) out.add("grc");
    else if (/немач/.test(x)) out.add("de");
    else if (/мађар/.test(x)) out.add("hu");
    else if (/франц/.test(x)) out.add("fr");
    else if (/италиј/.test(x)) out.add("it");
    else if (/српск|хрват|бугар|македон|словач|чешк|пољск|украј/.test(x)) out.add("sla");
  }
  return [...out];
}

// «XVIII век», «18. век», «XV и XVII век», «почетак 19. века» -> «sec. XVIII», «sec. XV-XVII», «sec. XIX (inizio)»; gli anni restano come sono
const ROMANI = n => [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((o, [v, r]) => { while (n >= v) { o += r; n -= v; } return o; }, "");
export function datazioneBms(y) {
  if (!y || !/век|века|в\./.test(y)) return y || null;
  const parte = /почетак|почетком/.test(y) ? " (inizio)" : /крај|краја/.test(y) ? " (fine)" : /половин/.test(y) ? " (metà)" : "";
  const sec = y.replace(/почетак|почетком|крај|краја|половина|половине|друга|прва/g, "").replace(/\s*(?:века|век|в\.)\s*/g, " ")
    .replace(/\b(\d{1,2})\.?(?=\s|$|[-–\/])/g, (_, n) => ROMANI(+n)).replace(/\s+(?:и|или)\s+/g, "-").replace(/\s*([-–\/])\s*/g, "$1").replace(/\s+/g, " ").trim();
  return /^[IVXL]+(?:[-\/][IVXL]+)*$/.test(sec) ? `sec. ${sec}${parte}` : y;
}

export function recordBms(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaBms(v)).map(([id, v]) => {
    const tipo = tipoBms(v);
    return {
      fonte: "bms", id: "bms-" + id, citta: "Novi Sad", biblioteca: "Biblioteca della Matica srpska (Библиотека Матице српске)",
      segnatura: v.s ? `БМС ${v.s}` : `БМС, Дигитална БМС ${id}`, datazione: datazioneBms(v.y), titolo: v.t || null, autori_fonte: v.a ? [v.a] : [],
      descrizione: [v.c, v.k].filter(Boolean).join(" ; ") || null, lingue: lingueBms(v.l), immagini: v.n,
      ...(tipo ? { tipo } : {}),
      manifest: `${BASE_MANIFESTI}/${id}.json`, pagina: paginaBms(id), licenza: LICENZA,
    };
  });
}

// manifesto IIIF Presentation 2 scritto dal catalogo: JPEG del visore della biblioteca, misure di ciascuna immagine
export function manifestoScritto(id, v) {
  const mid = `${BASE_MANIFESTI}/${id}.json`;
  const canvases = Array.from({ length: v.n }, (_, i) => {
    const w = (v.w || [])[i] || 1000, h = Array.isArray(v.h) ? v.h[i] || 1400 : v.h || 1400;
    // id del canvas corto (cartella delle immagini con il numero d'ordine): i manifesti restano leggeri
    const cid = `${SITO}/pageFlip/publications/${id}#${i + 1}`;
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: w, height: h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid, resource: { "@id": immagineBms(id, i), "@type": "dctypes:Image", format: "image/jpeg", width: w, height: h } }] };
  });
  const meta = [["Segnatura", v.s], ["Titolo", v.t], ["Autore", v.a], ["Anno", v.y], ["Lingua", v.l], ["Collezione", v.k], ["Descrizione", v.c]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s && `БМС ${v.s}`, v.t].filter(Boolean).join(": ") || `БМС ${id}`, metadata: meta,
    attribution: "Библиотека Матице српске, Нови Сад (Дигитална БМС). Manifesto scritto dal catalogo di Emendando con le immagini della biblioteca digitale.",
    related: paginaBms(id),
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
