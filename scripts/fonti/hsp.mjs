// Handschriftenportal (handschriftenportal.de), il portale nazionale tedesco dei manoscritti: API di ricerca pubblica
// (/api/hspobjects/search, quella che usa il sito), filtrata per biblioteca e per codici digitalizzati.
// Una fonte per biblioteca (FONTI_HSP): metadati dal portale, manifesti IIIF indicati dal portale (o ricavati dall'indirizzo
// della copia digitale, per Wolfenbüttel), immagini caricate dal browser di chi usa il catalogo.
// Entrano solo i codici con un manifesto IIIF: le copie digitali senza manifesto (visori METS, pagine di DigiTool) restano fuori.
// Il robots.txt del portale non pone limiti; 100 oggetti per richiesta, pausa di 1,5 secondi (rete.mjs).
// Lo stato (cursore, codici letti, lingue nel campo g) è in data/<fonte>.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { compattaPagine, espandiPagine } from "./nlg.mjs";

export const API = "https://handschriftenportal.de/api/hspobjects/search";

// fonti lette dal portale: nome della biblioteca nel filtro «repository-facet» del portale, prefisso degli id
// (Wolfenbüttel tiene «wol», le tre lettere iniziali della fonte, per non cambiare gli id già pubblicati), città, nome per il catalogo
export const FONTI_HSP = {
  wolfenbuettel: { biblioteca: "Herzog August Bibliothek Wolfenbüttel", prefisso: "wol", citta: "Wolfenbüttel", nome: "Herzog August Bibliothek" },
  bamberga: { biblioteca: "Staatsbibliothek Bamberg", prefisso: "bam", citta: "Bamberga", nome: "Staatsbibliothek Bamberg" },
  karlsruhe: { biblioteca: "Badische Landesbibliothek", prefisso: "blb", citta: "Karlsruhe", nome: "Badische Landesbibliothek" },
  stoccarda: { biblioteca: "Württembergische Landesbibliothek", prefisso: "wlb", citta: "Stoccarda", nome: "Württembergische Landesbibliothek" },
  // a Colonia il portale ha solo le segnature: titolo, autore e datazione si leggono dall'inizio del manifesto (manifesti: true)
  colonia: { biblioteca: "Erzbischöfliche Diözesan- und Dombibliothek Köln mit Bibliothek St. Albertus Magnus", prefisso: "ceec", citta: "Colonia", nome: "Erzbischöfliche Diözesan- und Dombibliothek", manifesti: true },
  lipsia: { biblioteca: "Universitätsbibliothek Leipzig", prefisso: "ubl", citta: "Lipsia", nome: "Universitätsbibliothek Leipzig" },
  // dal 26 ottobre 2026 (corsia «europa»): Francoforte, Dresda, Tubinga e Darmstadt sono nel portale con le copie digitali:
  // nessuna fonte propria, si leggono da qui come le altre
  francoforte: { biblioteca: "Universitätsbibliothek Johann Christian Senckenberg", prefisso: "ubf", citta: "Francoforte sul Meno", nome: "Universitätsbibliothek Johann Christian Senckenberg" },
  dresda: { biblioteca: "Sächsische Landesbibliothek – Staats- und Universitätsbibliothek Dresden", prefisso: "slub", citta: "Dresda", nome: "Sächsische Landesbibliothek – Staats- und Universitätsbibliothek (SLUB)" },
  tubinga: { biblioteca: "Universitätsbibliothek Tübingen", prefisso: "ubt", citta: "Tubinga", nome: "Universitätsbibliothek Tübingen" },
  // Darmstadt: il portale non indica il manifesto; quello di TUdigit (/iiif/<sigla>-manifest.json) si apre con CORS, ma le immagini
  // vi sono indicate in http e il servizio Image non risponde: si legge una volta il manifesto di ogni codice (pagine e misure, campo pg)
  // e il catalogo ne scrive una copia con le immagini https a misura fissa (copie: true; scripts/manifesti.mjs, ramo «manifesti»)
  darmstadt: { biblioteca: "Universitäts- und Landesbibliothek Darmstadt", prefisso: "ulbd", citta: "Darmstadt", nome: "Universitäts- und Landesbibliothek Darmstadt", copie: true },
};
// lingue del portale (filtro «language-facet», valori di norma GND del portale) -> codici del catalogo (scripts/lingue.mjs).
// Ricavate da un campione di codici per ciascun valore; i valori incerti (sorabo, aramaico, polabo, serbocroato e altri rari) restano fuori.
export const LINGUE_HSP = {
  "NORM-c9089f3c-9ada-3018-af6f-fb1ee8d6501c": "la", "NORM-5f02f088-9301-3d7b-a1ac-972c11bf3e7d": "de", "NORM-82a9e4d2-6595-387a-b6e4-42391d8c5bba": "fr",
  "NORM-124c5435-5f39-3f0d-9b0f-653d105340b3": "grc", "NORM-0d149b90-e739-3297-b01c-90191ae775f0": "it", "NORM-1a13105b-7e4e-35fb-ae7c-9515ac06aa48": "nl",
  "NORM-6f96cfdf-e5cc-3627-8adf-24b41725caa4": "he", "NORM-9cfefed8-fb94-37ba-a5cd-519d7d2bb5d7": "en", "NORM-12470fe4-06d4-3017-996e-ab37dd65fc14": "es",
  "NORM-a4dbfd6a-ef3b-3045-be61-aa0146debdf8": "cu", "NORM-95cc64dd-2825-39df-93ec-4ad683ecf339": "cs", "NORM-89484b14-b36a-3d53-a942-6a3d944d2983": "ru",
  "NORM-28840420-4e3d-3522-a930-8317344a285d": "pl", "NORM-c582dec9-43ff-3b74-baa0-691df291cea6": "ar", "NORM-74354112-1c12-3113-af80-7d1582c74bea": "sv",
  "NORM-e7d707a2-6e7f-3b6f-b52c-489c60e429b1": "tr", "NORM-5ca2aa84-5c8c-35ac-a6b0-16841f100d82": "da", "NORM-3ab67158-8c22-3448-9378-a52b9b542d31": "zh",
  "NORM-a2a551a6-458a-3de2-a446-cc76d639a9e9": "is", "NORM-fc9fdf08-4e29-3f26-a270-390dc49061a2": "pt", "NORM-fe3838c7-c11a-3406-9d95-6566e17360d5": "fa",
  "NORM-5435c69e-d3bc-35b2-a4d5-80e393e373d3": "ca",
};
export const TUDIGIT = "https://tudigit.ulb.tu-darmstadt.de";
export const BASE_COPIE = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti";
export const prefissoHsp = fonte => (FONTI_HSP[fonte] && FONTI_HSP[fonte].prefisso) || fonte.slice(0, 3);
const RIGHE = 100, GIORNI = 6;

export function leggiStato(fonte) {
  try { return JSON.parse(fs.readFileSync(`data/${fonte}.json`, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(fonte, st) {
  const f = `data/${fonte}.json`;
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore ?? null, totale: st.totale || null, lingue: st.lingue || null });
  fs.writeFileSync(f + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(f + ".tmp", f);
}

// «https://diglib.hab.de/mss/70-gud-lat/start.htm» -> «https://iiif.hab.de/object/mss_70-gud-lat/manifest.json»
// (la forma che il portale indica per i codici di Wolfenbüttel con manifesto dichiarato)
export function manifestoDa(d) {
  if (d["manifest-url-display"]) return d["manifest-url-display"];
  const m = /^https?:\/\/diglib\.hab\.de\/mss\/([^/]+)\/start\.htm/.exec(d["external-url-display"] || "");
  if (m) return `https://iiif.hab.de/object/mss_${m[1]}/manifest.json`;
  // Darmstadt (TUdigit): «https://tudigit.ulb.tu-darmstadt.de/show/Hs-1215» -> «https://tudigit.ulb.tu-darmstadt.de/iiif/Hs-1215-manifest.json»
  const t = /^https?:\/\/tudigit\.ulb\.tu-darmstadt\.de\/show\/([^/?#]+)\/?$/.exec(d["external-url-display"] || "");
  return t ? `${TUDIGIT}/iiif/${t[1]}-manifest.json` : null;
}

// oggetto della risposta -> voce compatta { s, t, d, l, c, m, p } (null se non c'è un manifesto)
export function compattaHsp(x) {
  const o = x.hspObject || {}, dig = (x.hspDigitizeds || []).filter(d => manifestoDa(d));
  // preferito: un manifesto dichiarato dal portale, poi la prima copia digitale di manoscritto
  const d = dig.find(d => d["manifest-url-display"]) || dig[0];
  if (!d) return null;
  const titoli = [...new Set([o["title-display"], ...(x.hspDescriptions || []).map(y => y["title-display"])].filter(Boolean))];
  return { s: o["idno-display"] || null, t: titoli.join(" ; ").slice(0, 1500) || null, d: (o["orig-date-lang-display"] || []).join(" ; ") || null,
    l: o["settlement-display"] || null, c: o["repository-display"] || null, m: manifestoDa(d), p: d["external-url-display"] || o["persistent-url-display"] || null };
}

/* raccolta a riprese: cursore = posizione del prossimo oggetto; stato salvato dopo ogni pagina.
   Poi le lingue: la risposta della ricerca non le contiene, quindi si rifà la ricerca con il filtro di ciascuna lingua
   presente nella biblioteca (LINGUE_HSP) e si segna la lingua sui codici restituiti (campo g dello stato). */
export async function scansionaHsp({ fonte, biblioteca = FONTI_HSP[fonte] && FONTI_HSP[fonte].biblioteca, minuti = 10, soloCache = false }) {
  if (!biblioteca) throw new Error(`biblioteca del Handschriftenportal non indicata per ${fonte}`);
  const st = leggiStato(fonte);
  if (soloCache) return st;
  const ora = Date.now(), fine = ora + minuti * 60e3;
  const recente = st.completato && st.cursore == null && ora - Date.parse(st.completato) < GIORNI * 864e5;
  const copie = !!(FONTI_HSP[fonte] && FONTI_HSP[fonte].copie), manifesti = copie || !!(FONTI_HSP[fonte] && FONTI_HSP[fonte].manifesti);
  // codici di cui leggere il manifesto: a Colonia quelli senza titolo nel portale; per le fonti con le copie (Darmstadt) tutti, una volta
  const daLeggere = () => Object.values(st.voci).filter(v => v.x == null && (copie || !v.t));
  if (recente && st.lingue && st.lingue >= st.completato && !(manifesti && daLeggere().length)) { log(fonte, `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  const cerca = async (filtro, start, righe = RIGHE) => {
    const fq = encodeURIComponent(JSON.stringify({ "repository-facet": [biblioteca], "digitized-object-facet": ["true"], ...filtro }));
    const r = await scarica(`${API}?q=*&start=${start}&rows=${righe}&sort=score-desc&fq=${fq}&hl=false&isExtended=false`, { timeout: 120000, accept: "application/json" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    return JSON.parse(r.testo);
  };
  if (!recente) {
    if (st.cursore == null) st.cursore = 0; else log(fonte, `riprendo dall'oggetto ${st.cursore}`);
    for (;;) {
      if (Date.now() > fine) { salvaStato(fonte, st); throw new Error(`raccolta incompleta (oggetto ${st.cursore}): riprenderà alla prossima esecuzione`); }
      const d = await cerca({}, st.cursore), pl = d.payload || [];
      st.totale = d.metadata && d.metadata.numFound;
      // si conservano le lingue (g) e i dati letti dai manifesti (x, a, tm, dm) della raccolta precedente; i manifesti che non si
      // aprivano (e) si riprovano
      for (const x of pl) { const v = compattaHsp(x); if (v) { const p = st.voci[x.hspObject.id] || {}; st.voci[x.hspObject.id] = { ...v, ...Object.fromEntries(["g", "x", "a", "tm", "dm", "pg"].filter(k => p[k] != null && !(k === "x" && p.e)).map(k => [k, p[k]])) }; } }
      st.cursore += RIGHE; st.aggiornato = new Date().toISOString();
      salvaStato(fonte, st);
      if (!pl.length || st.cursore >= (st.totale || 0)) break;
    }
    st.cursore = null; st.completato = st.aggiornato = new Date().toISOString();
    salvaStato(fonte, st);
    log(fonte, `fine: ${Object.keys(st.voci).length} codici digitalizzati su ${st.totale}`);
  }
  // dati dai manifesti (solo le fonti con manifesti: true, solo i codici senza titolo nel portale, una volta sola)
  if (manifesti) {
    const da = daLeggere();
    if (da.length) log(fonte, `manifesti da leggere: ${da.length}`);
    let n = 0;
    for (const v of da) {
      if (Date.now() > fine) { salvaStato(fonte, st); throw new Error(`manifesti incompleti (ne restano ${da.length - n}): riprenderanno alla prossima esecuzione`); }
      // manifesto intero: a Colonia i metadati sono in fondo, dopo le pagine (circa 200 KB)
      let r = null; try { r = await scarica(v.m, { timeout: 90000, accept: "application/json", tentativi: 2 }); } catch (e) { log(fonte, "manifesto che non si apre:", v.m, e.message); }
      const md = r && r.stato === 200 ? metadatiManifesto(r.testo) : null;
      // copie (Darmstadt): pagine e misure dal manifesto; senza pagine leggibili il codice resta fuori
      const pg = md && copie ? pagineTudigit(r.testo) : null;
      // un manifesto che non si apre (errore o risposta che non è un manifesto) tiene il codice fuori dal catalogo
      const ok = md && (!copie || pg);
      v.x = ok ? 1 : 0; if (ok) delete v.e; else v.e = 1;
      if (pg) v.pg = pg;
      if (md) { if (md.t) v.tm = md.t; if (md.a.length) v.a = md.a; if (md.d) v.dm = md.d; }
      if (++n % 25 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(fonte, st); }
    }
    st.aggiornato = new Date().toISOString(); salvaStato(fonte, st);
  }
  // lingue: tutte in una volta (poche decine di richieste); se il tempo finisce, si rifanno alla prossima esecuzione
  if (recente && st.lingue && st.lingue >= st.completato) return st;
  const presenti = Object.entries((await cerca({}, 0, 0)).metadata.facets["language-facet"] || {}).filter(([k, n]) => n > 0 && LINGUE_HSP[k]).map(([k]) => k);
  const lingue = {};
  for (const k of presenti) {
    for (let start = 0, tot = 1; start < tot; start += RIGHE) {
      if (Date.now() > fine) throw new Error("lingue incomplete: riprenderanno alla prossima esecuzione");
      const d = await cerca({ "language-facet": [k] }, start);
      tot = d.metadata.numFound;
      for (const x of d.payload || []) (lingue[x.hspObject.id] ||= []).push(LINGUE_HSP[k]);
      if (!(d.payload || []).length) break;
    }
  }
  for (const [id, v] of Object.entries(st.voci)) { if (lingue[id]) v.g = [...new Set(lingue[id])]; else delete v.g; }
  st.lingue = new Date().toISOString();
  salvaStato(fonte, st);
  log(fonte, `lingue: ${Object.values(st.voci).filter(v => v.g).length} codici con la lingua indicata dal portale`);
  return st;
}

// metadati di un manifesto IIIF 2 (intero, o solo l'inizio fino a "sequences"): titolo (senza la segnatura tra parentesi in fondo), autori, datazione
const testoIiif = v => [].concat(v ?? []).map(y => typeof y === "string" ? y : y && (y["@value"] || "")).join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
export function metadatiManifesto(t) {
  let m = null;
  try { m = JSON.parse(t); } catch (e) { const i = t.indexOf('"sequences"'); try { m = JSON.parse(t.slice(0, i).replace(/,\s*$/, "") + "}"); } catch (e2) { return null; } }
  const md = {}; for (const x of m.metadata || []) { const k = testoIiif(x.label).toLowerCase(); (md[k] = md[k] || []).push(testoIiif(x.value)); }
  const uno = (...k) => k.map(x => (md[x] || [])[0]).find(Boolean) || null;
  const titolo = (uno("titel", "title") || testoIiif(m.label) || "").replace(/\s*\([^()]*\)\s*$/, "").replace(/\s+:/g, ":").trim() || null;
  return { t: titolo, a: [...(md.verfasser || []), ...(md.author || [])].filter(Boolean), d: uno("entstehung", "datierung", "date") };
}

// fuori i codici il cui manifesto non si è aperto (e). Un manifesto entra una volta sola (più schede del portale possono rimandare alla stessa copia digitale): resta la prima in ordine di id
export function recordHsp(fonte, st = leggiStato(fonte)) {
  const visti = new Set();
  return Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b)).filter(([, v]) => !v.e && (!copieHsp(fonte) || v.pg) && !visti.has(v.m) && visti.add(v.m)).map(([id, v]) => ({
    fonte, id: prefissoHsp(fonte) + "-" + id.replace(/^HSP-/, ""), citta: v.l, biblioteca: v.c, segnatura: v.s || id, datazione: v.d || v.dm || null, titolo: v.t || v.tm || null, autori_fonte: v.a || [], lingue: v.g || [],
    manifest: copieHsp(fonte) ? `${BASE_COPIE}/${fonte}/${id.replace(/^HSP-/, "")}.json` : v.m, pagina: v.p, licenza: v.c ? `${v.c}: condizioni d'uso nel manifesto` : null }));
}

export const copieHsp = fonte => !!(FONTI_HSP[fonte] && FONTI_HSP[fonte].copie);

// TUdigit (Darmstadt): pagine del manifesto [file, larghezza, altezza]; file = parte dell'indirizzo dell'immagine dopo /image/,
// in forma compatta (scripts/fonti/nlg.mjs, compattaPagine). Le immagini sono indicate in http: nella copia si usano in https.
export function pagineTudigit(testo) {
  let m; try { m = JSON.parse(testo); } catch (e) { return null; }
  const out = [];
  for (const c of ((m.sequences || [])[0] || {}).canvases || []) {
    const r = ((c.images || [])[0] || {}).resource || {};
    const x = /^https?:\/\/tudigit\.ulb\.tu-darmstadt\.de\/image\/(.+\.jpg)$/.exec(r["@id"] || "");
    if (!x) return null;
    out.push([x[1], r.width || c.width || 0, r.height || c.height || 0]);
  }
  return out.length ? compattaPagine(out) : null;
}

// copia del manifesto di un codice di Darmstadt: immagini https a misura fissa (la più grande che TUdigit pubblica), senza servizio Image
export function manifestoCopiaHsp(fonte, id, v) {
  const sigla = id.replace(/^HSP-/, ""), mid = `${BASE_COPIE}/${fonte}/${sigla}.json`, h = FONTI_HSP[fonte] || {};
  const canvases = espandiPagine(v.pg).map(([f, w, hh], i) => {
    const img = `${TUDIGIT}/image/${f}`;
    return { "@id": `${mid}/c${i + 1}`, "@type": "sc:Canvas", label: String(i + 1), width: w || 1000, height: hh || 1400,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: `${mid}/c${i + 1}`,
        resource: { "@id": img, "@type": "dctypes:Image", format: "image/jpeg", width: w || undefined, height: hh || undefined } }] };
  });
  const meta = [["Segnatura", v.s], ["Datazione", v.d || v.dm], ["Titolo", v.t || v.tm]].filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s, v.t || v.tm].filter(Boolean).join(" : ") || sigla, metadata: meta,
    attribution: `${h.nome || h.biblioteca}. Copia del manifesto della biblioteca scritta dal catalogo di Emendando, con le immagini della biblioteca a misura fissa.`,
    license: "https://creativecommons.org/publicdomain/zero/1.0/", related: v.p, seeAlso: v.m,
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
