// handrit.is: manoscritti islandesi e norreni di Reykjavík (Landsbókasafn Íslands – Háskólabókasafn, Stofnun Árna Magnússonar)
// e di Copenaghen (Den Arnamagnæanske Samling, Københavns Universitet), più pochi codici di altre biblioteche.
// Il sito (handrit.is) chiede 30 secondi tra una richiesta e l'altra (robots.txt) e mette la ricerca e le schede dietro una
// verifica anti-robot: non si legge MAI il sito. Le descrizioni TEI di tutti i codici sono pubblicate dal progetto su GitHub
// (github.com/Handrit/Manuscripts), con l'elenco delle immagini di ogni codice (<facsimile>, xml:base
// https://myndir.handrit.is/file/Handrit.is/): da lì si leggono metadati e pagine, con un clone del repository (una volta ogni 14 giorni).
// Le immagini (variante SECONDARY_DISPLAY, JPEG di circa 2500-3500 pixel; le altre varianti sono PDF o miniature) si aprono
// con CORS aperto (Access-Control-Allow-Origin: *, prova del 26 ottobre 2026). handrit.is non pubblica manifesti IIIF:
// li scrive il catalogo (scripts/manifesti.mjs, ramo «manifesti»), con le immagini a misura fissa e senza servizio Image
// (gli strumenti del visore che ne hanno bisogno non funzionano per questi codici).
// Entrano i codici digitalizzati di ogni data; restano fuori i diplomi e le carte d'archivio (collezioni AM Dipl., Lbs Dipl.,
// JS Dipl., Alþingismál, Þjóðskjalasafn), le lettere sciolte e i codici di biblioteche già nel catalogo per altre vie (BSB).
// Lo stato compatto è in data/handrit.json.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { log, CACHE } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/handrit.json";
export const REPO = "https://github.com/Handrit/Manuscripts";
export const IMMAGINI = "https://myndir.handrit.is/file/Handrit.is/";
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/handrit";
const GIORNI = 14;

// collezioni fuori: diplomi e carte d'archivio; codici già nel catalogo (BSB)
const COLLEZIONI_FUORI = /Dipl|^Althingismal$|^BSB$|^JR$/;
const ARCHIVI = /Skjalasafn|Þjóðskjalasafn|Bayerische Staatsbibliothek|John Rylands/;
// classi dei testi che da sole indicano carte d'archivio o lettere (fornbréf, sendibréf, skjöl)
const CLASSI_ARCHIVIO = new Set(["fornb", "sendbr", "vitn", "skjol", "bref"]);

// biblioteca e città dalla cartella del repository (nome dell'istituzione) e dal <msIdentifier>
export const ISTITUZIONI = {
  "Landsbókasafn Íslands - Háskólabókasafn": ["Landsbókasafn Íslands – Háskólabókasafn", "Reykjavík"],
  "Den Arnamagnæanske Samling": ["Den Arnamagnæanske Samling, Københavns Universitet", "Copenaghen"],
  "Stofnun Árna Magnússonar": ["Stofnun Árna Magnússonar í íslenskum fræðum", "Reykjavík"],
  "Kungliga biblioteket": ["Kungliga biblioteket", "Stoccolma"],
  "Náttúrufræðistofnun": ["Náttúrufræðistofnun Íslands", "Garðabær"],
  "Þjóðminjasafn Íslands": ["Þjóðminjasafn Íslands", "Reykjavík"],
  "Royal Irish Academy": ["Royal Irish Academy", "Dublino"],
};

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, commit: st.commit || null, totale: st.totale || 0, fuori: st.fuori || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const pulito = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const primo = (t, re) => { const m = re.exec(t); return m ? pulito(m[1]) : null; };

// una descrizione TEI -> { id, v } oppure { id, fuori: motivo } (null se non è un codice digitalizzato)
export function estraiHandrit(t, cartella = "") {
  const id = (/<msDesc[^>]*xml:id="([^"]+)"/.exec(t) || [])[1];
  if (!id) return null;
  const base = id.replace(/-(da|en|is)$/, "");
  const fac = /<facsimile[^>]*>([\s\S]*?)<\/facsimile>/.exec(t);
  const xmlBase = fac && (/<facsimile[^>]*xml:base="([^"]+)"/.exec(t) || [])[1];
  if (!fac || xmlBase !== IMMAGINI) return null;
  // pagine: numero dell'immagine, misure (della variante SECONDARY_DISPLAY se indicate, altrimenti della miniatura)
  const pagine = []; let pref = null;
  for (const s of fac[1].match(/<surface[\s\S]*?<\/surface>/g) || []) {
    const g = /<graphic[^>]*url="([^"]+)\/(\d+)\/SECONDARY_DISPLAY"([^>]*)>/.exec(s); if (!g) continue;
    if (pref == null) pref = g[1]; else if (pref !== g[1]) continue;
    const dim = a => [+((/width="(\d+)/.exec(a) || [])[1] || 0), +((/height="(\d+)/.exec(a) || [])[1] || 0)];
    let [w, h] = dim(g[3]);
    if (!w || !h) { const th = /<graphic[^>]*\/THUMBNAIL"([^>]*)>/.exec(s); const [tw, thh] = th ? dim(th[1]) : [0, 0]; if (tw && thh) { h = Math.round(3500 * Math.max(thh / tw, 0.5)); w = Math.round(h * tw / thh); } }
    pagine.push([+g[2], w || 2500, h || 3500]);
  }
  if (!pagine.length) return null;
  const collezione = (/<collection[^>]*key="([^"]+)"/.exec(t) || [])[1] || "";
  const repository = primo(t, /<repository>([\s\S]*?)<\/repository>/) || "";
  const classi = [...new Set([...t.matchAll(/<msItem[^>]*class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)))];
  const forma = (/<objectDesc[^>]*form="([^"]+)"/.exec(t) || [])[1] || null;
  if (COLLEZIONI_FUORI.test(collezione)) return { id: base, fuori: "diplomi, carte d'archivio o codici già nel catalogo (" + collezione + ")" };
  if (ARCHIVI.test(repository) || ARCHIVI.test(cartella)) return { id: base, fuori: "archivio (" + (repository || cartella) + ")" };
  if (forma !== "codex" && classi.length && classi.every(c => CLASSI_ARCHIVIO.has(c))) return { id: base, fuori: "lettere o carte d'archivio" };
  const titoli = [...t.matchAll(/<title[^>]*type="(?:uniform|supplied|main)"[^>]*>([\s\S]*?)<\/title>/g)].map(m => pulito(m[1])).filter(Boolean);
  const somm = primo(t, /<summary>([\s\S]*?)<\/summary>/);
  const titolo = [...new Set(titoli.filter(x => x !== primo(t, /<idno>([\s\S]*?)<\/idno>/)))].slice(0, 12).join(" ; ");
  const od = /<origDate([^>]*)>([\s\S]*?)<\/origDate>/.exec(t);
  let datazione = od ? pulito(od[2]) : null;
  if (od) { const nb = (/notBefore="(\d{3,4})/.exec(od[1]) || [])[1], na = (/notAfter="(\d{3,4})/.exec(od[1]) || [])[1], w = (/when="(\d{3,4})/.exec(od[1]) || [])[1];
    const anni = w || (nb && na ? (nb === na ? nb : `${nb}-${na}`) : nb || na); if (anni && !/\d{3,4}/.test(datazione || "")) datazione = [datazione, anni].filter(Boolean).join(" "); else if (anni && !datazione) datazione = anni; }
  const lingue = [...new Set([...t.matchAll(/<textLang[^>]*mainLang="([^"]+)"/g)].map(m => m[1]))];
  const autori = [...new Set([...t.matchAll(/<author[^>]*>([\s\S]*?)<\/author>/g)].map(m => pulito(m[1])).filter(Boolean))].slice(0, 10);
  // numerazione delle immagini: «a» (prima), «n» (quante) se in sequenza, altrimenti l'elenco; misure in coppie
  const seq = pagine.every((p, i) => p[0] === pagine[0][0] + i);
  const v = { s: primo(t, /<msIdentifier>[\s\S]*?<idno>([\s\S]*?)<\/idno>/), t: titolo || somm || null, d: datazione, l: lingue, a: autori, c: cartella || null, r: repository || null,
    k: collezione || null, u: pref, q: pagine.length };
  // misure: una coppia sola se tutte le pagine sono uguali, altrimenti una coppia per pagina (larghezza e altezza arrotondate a 10 pixel)
  const mm = pagine.flatMap(p => [Math.round(p[1] / 10) * 10, Math.round(p[2] / 10) * 10]);
  v.m = mm.every((x, i) => x === mm[i % 2]) ? mm.slice(0, 2) : mm;
  if (seq) { v.a0 = pagine[0][0]; } else v.n = pagine.map(p => p[0]);
  if (somm && v.t !== somm) v.c2 = somm.slice(0, 1500);
  if (!v.a.length) delete v.a;
  return { id: base, v };
}

// clone (o aggiornamento) del repository delle descrizioni, in .cache: nessuna richiesta a handrit.is
function cloneRepository(dir) {
  if (fs.existsSync(path.join(dir, ".git"))) {
    execFileSync("git", ["-C", dir, "fetch", "-q", "--depth", "1", "origin", "HEAD"], { stdio: "inherit" });
    execFileSync("git", ["-C", dir, "reset", "-q", "--hard", "FETCH_HEAD"], { stdio: "inherit" });
  } else {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    execFileSync("git", ["clone", "-q", "--depth", "1", REPO, dir], { stdio: "inherit" });
  }
  return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"]).toString().trim();
}

function* fileXml(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* fileXml(p); else if (e.name.endsWith(".xml")) yield p;
  }
}

/* raccolta: ogni 14 giorni si aggiorna il clone del repository e si rileggono tutte le descrizioni (pochi secondi, nessuna richiesta
   alla biblioteca). opz.dir: cartella di un clone già presente (per le prove in locale) */
export async function scansionaHandrit({ soloCache = false, dir = null } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (!dir && st.completato && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("handrit", `riuso la lettura del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const cartella = dir || path.join(CACHE, "handrit");
  const commit = dir ? null : cloneRepository(cartella);
  const radice = path.join(cartella, "Manuscripts");
  const voci = {}, fuori = {}, lingua = {};
  let totale = 0;
  for (const f of fileXml(radice)) {
    const t = fs.readFileSync(f, "utf8");
    const ist = path.relative(radice, f).split(path.sep)[0];
    const x = estraiHandrit(t, ist); if (!x) continue;
    // una descrizione per codice: si preferisce quella in inglese, poi quella in islandese
    const lang = (/-(da|en|is)\.xml$/.exec(f) || [])[1] || "";
    const pr = { en: 3, is: 2, da: 1 }[lang] || 0;
    if (lingua[x.id] != null && lingua[x.id] >= pr) continue;
    lingua[x.id] = pr;
    if (x.fuori) { fuori[x.id] = x.fuori; delete voci[x.id]; } else { voci[x.id] = x.v; delete fuori[x.id]; }
  }
  totale = Object.keys(voci).length + Object.keys(fuori).length;
  const motivi = {}; for (const m of Object.values(fuori)) { const k = m.replace(/ \(.*/, ""); motivi[k] = (motivi[k] || 0) + 1; }
  Object.assign(st, { voci, fuori: motivi, totale, commit: commit || st.commit, aggiornato: new Date().toISOString() });
  st.completato = st.aggiornato;
  salvaStato(st);
  log("handrit", `${Object.keys(voci).length} codici digitalizzati (fuori ${Object.keys(fuori).length}: ${JSON.stringify(motivi)})`);
  return st;
}

export const numeroPagine = v => (v && v.q) || 0;
export const LICENZA = "handrit.is: immagini delle biblioteche proprietarie (Landsbókasafn Íslands, Stofnun Árna Magnússonar, Den Arnamagnæanske Samling), condizioni d'uso di handrit.is";

export function recordHandrit(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => numeroPagine(v)).map(([id, v]) => {
    const [biblioteca, citta] = ISTITUZIONI[v.c] || [v.r || v.c || "handrit.is", null];
    return { fonte: "handrit", id: "hdr-" + id.toLowerCase(), citta, biblioteca, segnatura: v.s || id, datazione: v.d || null, titolo: v.t || null,
      autori_fonte: v.a || [], descrizione: v.c2 || null, lingue: lingueDa(v.l || []), immagini: numeroPagine(v),
      manifest: `${BASE_MANIFESTI}/${id}.json`, pagina: `https://handrit.is/manuscript/view/is/${id}`, licenza: LICENZA };
  });
}

// manifesto IIIF scritto dal catalogo: immagini JPEG a misura fissa da myndir.handrit.is
export function manifestoScritto(id, v) {
  const mid = `${BASE_MANIFESTI}/${id}.json`, k = numeroPagine(v);
  const canvases = Array.from({ length: k }, (_, i) => {
    const j = v.m.length === 2 ? 0 : i, n = v.n ? v.n[i] : (v.a0 || 0) + i, w = v.m[2 * j], h = v.m[2 * j + 1], img = `${IMMAGINI}${v.u}/${n}/SECONDARY_DISPLAY`;
    // id del canvas: l'indirizzo dell'immagine senza la variante (più corto dell'indirizzo del manifesto: i manifesti restano piccoli)
    const cid = `${IMMAGINI}${v.u}/${n}`;
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: w, height: h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid, resource: { "@id": img, "@type": "dctypes:Image", format: "image/jpeg" } }] };
  });
  const [biblioteca] = ISTITUZIONI[v.c] || [v.r || v.c || "handrit.is"];
  const meta = [["Segnatura", v.s], ["Biblioteca", biblioteca], ["Datazione", v.d], ["Contenuto", v.t]].filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s, v.t].filter(Boolean).join(" : ").slice(0, 300) || id, metadata: meta,
    attribution: `${biblioteca}, tramite handrit.is. Manifesto scritto dal catalogo di Emendando dalla descrizione TEI pubblicata da handrit.is (github.com/Handrit/Manuscripts).`,
    related: `https://handrit.is/manuscript/view/is/${id}`,
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
