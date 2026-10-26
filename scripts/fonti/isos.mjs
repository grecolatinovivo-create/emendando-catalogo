// Irish Script on Screen (ISOS, www.isos.dias.ie), Dublin Institute for Advanced Studies: manoscritti irlandesi della Royal Irish
// Academy, della National Library of Ireland, del Trinity College Dublin, di UCD, Maynooth, Cork, Galway, King's Inns, Marsh's
// Library, della National Library of Scotland, della British Library, della KBR e di altre istituzioni. Nessun robots.txt.
// Elenco: le pagine delle collezioni (/collection/<sigla>.html, collegate dalla pagina iniziale), con segnatura e riassunto della
// scheda di catalogo; manifesto IIIF di ogni codice: /static/manifests/<nome>.json (CORS aperto; immagini su iiif.isos.dias.ie,
// CORS aperto). Del manifesto si legge una volta l'inizio, per verificarlo e prendere il titolare dei diritti.
// Stato in data/isos.json: elenco ogni 6 giorni (circa 35 pagine), ogni manifesto una volta sola.
import { scarica, log, decodifica } from "../rete.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/isos.json";
export const SITO = "https://www.isos.dias.ie";
const GIORNI = 6;
// città delle collezioni (per la mappa); quelle non elencate restano senza luogo
export const CITTA = { aihs: "New York", aus1: "Melbourne (Australia)", aus3: "Melbourne (Australia)", bl: "Londra", clon: "Castlerea", cnr: "Waterford",
  dias: "Dublino", edmundsbury: "Bury St Edmunds", eoin: "Waterford", farmleigh: "Dublino", jesuit: "Dublino", kilkenny: "Kilkenny", kings: "Dublino", marsh: "Dublino",
  mma: "Cappoquin", nli: "Dublino", nls: "Edimburgo", nuim: "Maynooth", rennes: "Rennes", ria: "Dublino", rlb: "Bruxelles", rld: "Copenaghen", sjc: "Cambridge",
  spd: "Dublino", tcd: "Dublino", ucc: "Cork", ucd: "Dublino", ucg: "Galway", waterford: "Waterford" };

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale"]);

// pagina di una collezione -> { istituzione, codici: [{ p: percorso, s: segnatura, h: [righe della scheda], d: riassunto }] }
export function codiciCollezione(html) {
  const istituzione = decodifica((/<title>\s*Irish Script on Screen\s*-\s*([^<]+)<\/title>/.exec(html) || [])[1] || "") || null;
  const codici = [];
  const re = /<div class="card longcard cardmanuscript"[^>]*>[\s\S]*?<div class="cardtext"><a href="https:\/\/www\.isos\.dias\.ie\/([^"]+?)\.html">([\s\S]*?)<\/a><\/div>[\s\S]*?<div class="cardpopup">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    const h = [...m[3].matchAll(/<h5>([\s\S]*?)<\/h5>/g)].map(x => decodifica(x[1])).filter(Boolean);
    const d = decodifica((/<p>([\s\S]*?)<\/p>/.exec(m[3]) || [])[1] || "").replace(/…$/, "").trim();
    codici.push({ p: m[1], s: decodifica(m[2]), h, d: d.slice(0, 600) || null });
  }
  return { istituzione, codici };
}

export const manifestoIsos = p => `${SITO}/static/manifests/${p.split("/").pop()}.json`;

// datazione dal riassunto del catalogo («15th cent.», «16th and 18th cent.», «A.D. 1563», «1838»)
export function datazioneIsos(d) {
  // solo l'inizio del riassunto (la datazione apre la scheda del catalogo; più avanti ci sono le date della bibliografia)
  const s = String(d || "").slice(0, 80);
  const sec = /\b\d{1,2}(?:st|nd|rd|th)?(?:\s*(?:-|–|and|or|to)\s*\d{1,2})?(?:st|nd|rd|th)\s+cent/i.exec(s);
  if (sec) return sec[0];
  const anno = /^(?:A\.\s*D\.\s*|c\.\s*|ca\.\s*)?(1[0-8][0-9]{2}|[6-9][0-9]{2})\b/.exec(s.trim());
  return anno ? anno[1] : null;
}

export async function scansionaIsos({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const home = await scarica(`${SITO}/`, { timeout: 120000 });
    if (home.stato !== 200) throw new Error(`pagina iniziale: HTTP ${home.stato}`);
    const sigle = [...new Set([...home.testo.matchAll(/\/collection\/([a-z0-9]+)\.html/g)].map(m => m[1]))];
    let n = 0;
    for (const c of sigle) {
      const r = await scarica(`${SITO}/collection/${c}.html`, { timeout: 120000 });
      if (r.stato !== 200) { log("isos", `collezione ${c}: HTTP ${r.stato}`); continue; }
      const { istituzione, codici } = codiciCollezione(r.testo);
      for (const x of codici) {
        n++;
        const prima = st.voci[x.p];
        st.voci[x.p] = { ...(prima && !prima.q ? { r: prima.r } : { q: 1 }), k: c, i: istituzione, s: x.s, h: x.h, d: x.d };
        if (prima === 0) st.voci[x.p] = 0;
      }
    }
    st.totale = n; st.elenco = st.aggiornato = new Date().toISOString();
    salva(st);
    log("isos", `elenco: ${n} codici in ${sigle.length} collezioni`);
  }
  const da = Object.keys(st.voci).filter(p => st.voci[p] && st.voci[p].q);
  for (const p of da) {
    if (Date.now() > fine) break;
    let r; try { r = await scarica(manifestoIsos(p), { range: 8192, timeout: 120000, tentativi: 3 }); } catch (e) { log("isos", p, e.message); continue; }
    const v = st.voci[p];
    if ((r.stato !== 200 && r.stato !== 206) || !/"@type"\s*:\s*"sc:Manifest"/.test(r.testo)) { st.voci[p] = 0; continue; }
    delete v.q;
    v.r = ((/"attribution"\s*:\s*"([^"]*)"/.exec(r.testo) || [])[1] || "").trim() || null;
  }
  st.aggiornato = new Date().toISOString();
  const resto = Object.values(st.voci).filter(v => v && v.q).length;
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  if (resto) throw new Error(`manifesti letti in parte (mancano ${resto}): riprenderà alla prossima esecuzione`);
  return st;
}

export function recordIsos(st = leggiStato()) {
  const out = [];
  for (const [p, v] of Object.entries(st.voci || {})) {
    if (!v || v.q) continue;
    const titolo = (v.h || []).filter(x => !/^(Catalogue|©|\d+$)/i.test(x) && x !== v.s).join(" ; ") || null;
    out.push({ fonte: "isos", id: "isos-" + p.toLowerCase().replace(/[^a-z0-9]+/g, "-"), citta: CITTA[v.k] || null,
      biblioteca: v.i || "Irish Script on Screen", segnatura: v.s || p.split("/").pop().replace(/_/g, " "), datazione: datazioneIsos(v.d), titolo, descrizione: v.d || null,
      lingue: [], manifest: manifestoIsos(p), pagina: `${SITO}/${encodeURI(p)}.html`, licenza: `${v.r || "Irish Script on Screen"} (immagini: condizioni di ISOS, ${SITO}/copyright.html)` });
  }
  return out;
}
