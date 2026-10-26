// Det Kgl. Bibliotek (Biblioteca reale danese), Copenaghen: manoscritti digitalizzati in «Digitale samlinger» (digitalesamlinger.kb.dk,
// già www5.kb.dk/manus, Blacklight). Il robots.txt non vieta nulla; nessun crawl-delay (si tiene la pausa di sempre, 1,5 secondi).
// Le pagine dei risultati si leggono in JSON (?format=json&per_page=50): ogni scheda dà segnatura, titolo, autori, datazione, lingue,
// descrizione fisica, diritti e l'elenco delle immagini (content_metadata_image_iiif_info_ssm: info.json del server IIIF Image 2
// kb-images.kb.dk, livello 2, CORS aperto, verificato il 26 ottobre 2026), più la descrizione MODS con le misure della prima immagine.
// La biblioteca NON pubblica manifesti IIIF: li scrive il catalogo (scripts/manifesti.mjs, ramo «manifesti»), Presentation 2 con il
// servizio Image della biblioteca (misure della prima immagine per tutte le pagine; il visore legge quelle vere da info.json).
// Si leggono le collezioni di codici dei «Vesterlandske håndskrifter» (GKS, NKS, Thott non digitalizzato a parte, Additamenta,
// Accessionssamlingen, Kall, Rostgaard, Uldall, E don. var., Fabricius, Ledreborg, Portman, Palsbo, NBD, Fragmentsamlingen con circa
// 3300 frammenti medievali), i manoscritti orientali e quelli ebraici (Judaistisk Samling, David Simonsens Håndskrifter).
// Restano fuori gli archivi personali (Kierkegaard, Brandes, Blixen, Ørsted, Knud Rasmussen, Collin, J. P. Jacobsen nella
// Marx-Nielsens Samling), la raccolta di autografi, le lettere («Breve»), le fotografie (Ms. phot.), la Folkemindesamlingen
// (canti popolari, manoscritti e stampe insieme) e, dentro le collezioni lette, lettere, diari, conti, archivi, bozze di stampa,
// esemplari a stampa annotati e stampe popolari cinesi (motivoKbdk).
// Stato in data/kbdk.json, a riprese (cursore { c: collezione, p: pagina }); una lettura completa si riusa per 14 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/kbdk.json";
export const SITO = "https://digitalesamlinger.kb.dk";
export const IMMAGINI = "https://kb-images.kb.dk/";
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/kbdk";
const GIORNI = 14, PER_PAGINA = 50, VERSIONE = 1;

// [percorso del soggetto, nome della collezione]
export const COLLEZIONI = [
  ["manus/vmanus/2011/dec/ha/subject6603", "GKS (Gammel Kongelig Samling)"],
  ["manus/vmanus/2011/dec/ha/subject1093", "NKS (Ny Kongelig Samling)"],
  ["manus/vmanus/2011/dec/ha/subject1092", "Additamenta"],
  ["manus/vmanus/2011/dec/ha/subject1094", "Accessionssamlingen"],
  ["manus/vmanus/2011/dec/ha/subject6595", "Kallske Samling"],
  ["manus/vmanus/2011/dec/ha/subject1132", "Rostgaard"],
  ["manus/vmanus/2011/dec/ha/subject1141", "Uldall"],
  ["manus/vmanus/2011/dec/ha/subject1522", "E donatione variorum"],
  ["manus/vmanus/2011/dec/ha/subject1524", "Fabricius"],
  ["manus/vmanus/2011/dec/ha/subject1664", "Ledreborg"],
  ["manus/vmanus/2011/dec/ha/subject10524", "Portmans Samling"],
  ["manus/vmanus/2011/dec/ha/subject31121", "Palsbo"],
  ["manus/vmanus/2011/dec/ha/subject53454", "NBD 3. rk."],
  ["manus/vmanus/2011/dec/ha/subject5268", "Fragmentsamlingen"],
  ["manus/ortsam/2009/okt/orientalia/subject637", "Orientalsk Samling: Håndskrifter"],
  ["manus/judsam/2010/maj/jsmss/subject748", "Judaistisk Samling: Håndskrifter"],
  ["manus/judsam/2009/sep/dsh/subject315", "David Simonsens Håndskrifter"],
];

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ versione: st.versione || null, aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore ?? null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

/* elenco delle immagini, compresso: «http://kb-images.kb.dk/DAMJP2/DAM/OnlineMasterArkiv/0000/436/285/99123561960505763_0001/info.json»
   -> cartella 436285, codice 99123561960505763, pagina 1. Le pagine consecutive (cartella e numero che crescono insieme) diventano
   una sequenza «cartella:codice:pagina:quante»; con l'altro schema della biblioteca («…/gks-2_18/gks-2_18_0001») le pagine consecutive
   diventano «~percorso_:pagina:quante»; ciò che non segue nessuno dei due resta com'è, preceduto da «=». */
const RE_IMG = /^DAMJP2\/DAM\/OnlineMasterArkiv\/(\d{4})\/(\d{3})\/(\d{3})\/([^/]+)_(\d{4})$/;
export function comprimiImmagini(urls) {
  const out = [];
  let run = null;
  for (const u of urls || []) {
    const p = String(u).replace(/^https?:\/\/kb-images\.kb\.dk\//, "").replace(/\/info\.json$/, "");
    const m = RE_IMG.exec(p);
    if (!m) {
      const q = /^(.*_)(\d{4})$/.exec(p);
      if (q && run && run[0] === "~" && run[1] === q[1] && run[2] + run[3] === +q[2]) { run[3]++; continue; }
      if (run) out.push(run.join(":"));
      if (q && !q[1].includes(":")) { run = ["~", q[1], +q[2], 1]; continue; }
      run = null; out.push("=" + p); continue;
    }
    const cart = +(m[1] + m[2] + m[3]), cod = m[4], n = +m[5];
    if (run && run[0] !== "~" && run[1] === cod && run[0] + run[3] === cart && run[2] + run[3] === n) { run[3]++; continue; }
    if (run) out.push(run.join(":"));
    run = [cart, cod, n, 1];
  }
  if (run) out.push(run.join(":"));
  return out.map(x => (x.startsWith("~:") ? "~" + x.slice(2) : x));
}
const z = (n, k) => String(n).padStart(k, "0");
export function espandiImmagini(i) {
  const out = [];
  for (const x of i || []) {
    if (x.startsWith("=")) { out.push(IMMAGINI + x.slice(1)); continue; }
    if (x.startsWith("~")) { const [pre, n, k] = x.slice(1).split(":"); for (let j = 0; j < +k; j++) out.push(IMMAGINI + pre + z(+n + j, 4)); continue; }
    const [c, cod, n, k] = x.split(":");
    for (let j = 0; j < +k; j++) {
      const cart = z(+c + j, 10);
      out.push(`${IMMAGINI}DAMJP2/DAM/OnlineMasterArkiv/${cart.slice(0, 4)}/${cart.slice(4, 7)}/${cart.slice(7)}/${cod}_${z(+n + j, 4)}`);
    }
  }
  return out;
}
export const numeroImmagini = v => (v.i || []).reduce((a, x) => a + (x.startsWith("=") ? 1 : x.startsWith("~") ? +x.split(":")[2] : +x.split(":")[3]), 0);

// «undefined»: datazione mancante scritta così da Digitale samlinger
const pulito = s => { const x = String(s || "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); return x === "undefined" ? "" : x; };
const primo = a => [].concat(a || []).map(pulito).find(Boolean) || null;
// scheda Blacklight -> voce compatta { s, t, a, d, l, f, n (note), r (diritti), k (collezione), w, h, i (immagini compresse) }
export function compattaKbdk(d, collezione) {
  const titoli = [].concat(d.title_tdsim || []).map(pulito).filter(Boolean);
  const mods = String(d.processed_mods_ts || d.mods_ts || "");
  const w = +((/imageWidth>(\d+)</.exec(mods) || [])[1] || 0), h = +((/imageHeight>(\d+)</.exec(mods) || [])[1] || 0);
  const v = { s: primo(d.shelf_mark_tdsim), t: titoli.length ? titoli.join(" : ") : pulito(d.full_title_tsi) || null,
    a: [...new Set([].concat(d.creator_display_tsim || [], d.author_tsim || []).map(pulito).filter(Boolean))],
    d: primo(d.readable_dat_string_tsim) || pulito(d.pub_dat_display_tsi) || null, l: [].concat(d.language_tsim || []).map(pulito).filter(Boolean),
    f: [].concat(d.format_tsim || []).map(pulito).filter(Boolean).join("; ") || null,
    n: [].concat(d.description_tsim || []).map(pulito).filter(Boolean).join(" ; ").slice(0, 1500) || null,
    r: primo(d.rights_tsim), k: collezione, u: String(d.id || "").replace(/^\//, "").replace(/\/[^/]*$/, "") || null, w: w || null, h: h || null, i: comprimiImmagini(d.content_metadata_image_iiif_info_ssm) };
  for (const x of Object.keys(v)) if (v[x] == null || (Array.isArray(v[x]) && !v[x].length)) delete v[x];
  return v;
}

export async function scansionaKbdk({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  if (st.versione !== VERSIONE) { st.versione = VERSIONE; st.completato = null; st.cursore = null; }
  if (st.completato && st.cursore == null && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("kbdk", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci || {}).length} schede`); return st; }
  st.voci = st.voci || {}; st.totali = st.totali || {};
  if (st.cursore == null || typeof st.cursore !== "object") st.cursore = { c: 0, p: 1 }; else log("kbdk", `riprendo da ${COLLEZIONI[st.cursore.c][1]}, pagina ${st.cursore.p}`);
  const fine = ora + minuti * 60e3;
  while (st.cursore.c < COLLEZIONI.length) {
    const [percorso, nome] = COLLEZIONI[st.cursore.c];
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${nome}, pagina ${st.cursore.p}): riprenderà alla prossima esecuzione`); }
    const r = await scarica(`${SITO}/${percorso}/en/?format=json&per_page=${PER_PAGINA}&page=${st.cursore.p}&sort=cobject_title_ssi+asc%2C+score+desc%2C+cobject_random_number_dbsi+desc`, { timeout: 180000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato} (${nome}, pagina ${st.cursore.p})`);
    const j = JSON.parse(r.testo).response, docs = j.docs || [];
    st.totali[nome] = (j.pages && j.pages.total_count) || 0;
    for (const d of docs) if (d && d.id) st.voci[String(d.id).split("/").pop()] = compattaKbdk(d, nome);
    st.aggiornato = new Date().toISOString();
    if (!docs.length || (j.pages && j.pages["last_page?"])) { log("kbdk", `${nome}: fine (${st.totali[nome]})`); st.cursore = { c: st.cursore.c + 1, p: 1 }; }
    else st.cursore.p++;
    salvaStato(st);
  }
  st.cursore = null; st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("kbdk", `fine: ${Object.keys(st.voci).length} schede`);
  return st;
}

/* filtro dei manoscritti librari */
const LETTERE = /\bbrev(?:e|et|ene)?\b|\bbrevkort|brevveksling|korrespondance|\bletters?\b|\bbrief(?:e|wechsel)?\b|\bepistola[e]? ad\b/i;
const ARCHIVIO = /\barkiv\b|\barchiv\b|efterladte papirer|\bpapirer\b|\bdagb[øo]g(?:er)?\b|\bkasseb[øo]g(?:er)?\b|\bregnskab|\bindberetning|\bpersonalia\b|\btryksager\b|\bkorrektur|\budklip\b|\bkvittering|\bsk[øo]de\b|\btestamente\b|\bdokumenter\b|\baktstykker\b|\bstambog|\bfotografi|\btrykt eksemplar\b|\btrykmanuskript\b|nianhua|年畫/i;
// codici già nel catalogo per altra via: NKS 261 b 4° (leggi irlandesi) è in Irish Script on Screen (fonte «isos»)
const GIA = new Set(["NKS 261 b kvart"]);
// motivo per cui una voce resta fuori (null = ammessa)
export function motivoKbdk(v) {
  if (!v || !numeroImmagini(v)) return "senza immagini";
  if (GIA.has(v.s)) return "già nel catalogo per altra via";
  const t = [v.t, v.f].filter(Boolean).join(" ; ");
  if (LETTERE.test(t)) return "lettere";
  if (ARCHIVIO.test(t)) return "carte d'archivio, diari, conti, stampati annotati";
  return null;
}
export const ammessaKbdk = v => motivoKbdk(v) == null;

// lingue in danese («Latin», «Fransk», «Græsk») o codici («he», «arc-Hebr», «xct-tibt») -> codici del catalogo
const DANSK = { dansk: "da", latin: "la", latinsk: "la", fransk: "fr", tysk: "de", middelhøjtysk: "de", nedertysk: "de", plattysk: "de", græsk: "grc", islandsk: "is", oldnordisk: "is", norrønt: "is",
  spansk: "es", irsk: "ga", italiensk: "it", engelsk: "en", svensk: "sv", hollandsk: "nl", nederlandsk: "nl", flamsk: "nl", hebraisk: "he", arabisk: "ar", persisk: "fa", tyrkisk: "tr", russisk: "ru",
  polsk: "pl", kirkeslavisk: "cu", armensk: "hy", syrisk: "syr", koptisk: "cop", etiopisk: "gez", sanskrit: "sa", tibetansk: "bo", xct: "bo", portugisisk: "pt", walisisk: "cy", kinesisk: "zh", japansk: "ja",
  ukendt: null, "": null };
export function lingueKbdk(l) {
  const out = [];
  for (const x of [].concat(l || [])) for (const p of String(x).toLowerCase().split(/[,;/]| og | and |\s+/)) {
    const s = p.replace(/-[a-z]{4}$/, "").trim(); if (!s) continue;
    const c = s in DANSK ? DANSK[s] : (lingueDa([s])[0] || null);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

export const paginaKbdk = (id, v) => `${SITO}/${v.u || (COLLEZIONI.find(c => c[1] === v.k) || COLLEZIONI[0])[0].replace(/\/subject\d+$/, "")}/${id}/en/`;
// carte geografiche manoscritte (titoli danesi: «Kort over…», «Kortskitser…»): categoria a parte (scripts/carte.mjs)
const CARTA = /^(?:Kort(?:skitse[r]?)?|Landkort|Søkort|Kaart|Grundrids|Plan) (?:over|af|fra)\b/i;
const SEDE = { "Orientalsk Samling: Håndskrifter": "Orientalsk Samling", "Judaistisk Samling: Håndskrifter": "Judaistisk Samling", "David Simonsens Håndskrifter": "Judaistisk Samling" };
export function recordKbdk(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaKbdk(v)).map(([id, v]) => ({
    fonte: "kbdk", id: "kbdk-" + id.replace(/^object/, ""), citta: "Copenaghen", biblioteca: "Det Kongelige Bibliotek",
    segnatura: v.s || id, datazione: (v.d !== "undefined" && v.d) || null, tipo: CARTA.test(v.t || "") ? "carta" : null, titolo: v.t || null, autori_fonte: v.a || [], lingue: lingueKbdk(v.l),
    descrizione: [v.f, v.n, SEDE[v.k] || v.k].filter(Boolean).join(" ; ") || null, immagini: numeroImmagini(v),
    manifest: `${BASE_MANIFESTI}/${id}.json`, pagina: paginaKbdk(id, v),
    licenza: v.r ? `Det Kgl. Bibliotek: ${v.r}` : "Det Kgl. Bibliotek" }));
}

// manifesto IIIF Presentation 2 scritto dal catalogo, con il servizio Image 2 della biblioteca (kb-images.kb.dk)
export function manifestoScritto(id, v) {
  const mid = `${BASE_MANIFESTI}/${id}.json`, w = v.w || 2000, h = v.h || 3000;
  const canvases = espandiImmagini(v.i).map((svc, k) => ({ "@id": svc, "@type": "sc:Canvas", label: String(k + 1), width: w, height: h,
    images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: svc,
      resource: { "@id": `${svc}/full/full/0/default.jpg`, "@type": "dctypes:Image", format: "image/jpeg",
        service: { "@context": "http://iiif.io/api/image/2/context.json", "@id": svc, profile: "http://iiif.io/api/image/2/level2.json" } } }] }));
  const meta = [["Segnatura", v.s], ["Titolo", v.t], ["Autori", (v.a || []).join(", ")], ["Datazione", v.d], ["Lingue", (v.l || []).join(", ")], ["Descrizione fisica", v.f], ["Note", v.n], ["Collezione", v.k], ["Diritti", v.r]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s, v.t].filter(Boolean).join(" : ").slice(0, 300) || id, metadata: meta,
    attribution: `Det Kgl. Bibliotek, København${v.r ? " (" + v.r + ")" : ""}. Manifesto scritto dal catalogo di Emendando con le immagini IIIF della biblioteca (kb-images.kb.dk).`,
    related: paginaKbdk(id, v),
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
