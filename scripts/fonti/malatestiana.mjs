// Biblioteca Malatestiana, Cesena: «Catalogo aperto dei manoscritti malatestiani» (catalogoaperto.malatestiana.it), con la ricerca
// e le schede su servizi.comune.cesena.fc.it/applicazioniweb/ricerca_mala/ e il visore a sfoglio su servizi.comune.cesena.fc.it/elenco-libri/.
// Nessun IIIF: il visore mostra le carte una per una come immagini JPEG (circa 1065 x 1600 pixel), che si caricano come semplici <img>
// da qualunque sito (verificato dal browser il 26 ottobre 2026). Quindi, come per la Biblioteca Nazionale di Grecia, i manifesti
// IIIF li scriviamo noi (scripts/manifesti.mjs, ramo «manifesti»), con le immagini a misura fissa e senza servizio Image.
// Nessun robots.txt (404); il sito risponde anche dal server. Elenco: le segnature della ricerca per segnatura (circa 430 codici:
// Plutei dei fondi D e S, Piana, Bessarione, Comunale, Duomo); per ogni codice la scheda (contenuto, datazione, supporto, carte) e il
// visore (numero delle pagine e proporzione); le immagini si chiamano 001r, 001v, 002r… (come nel visore della Biblioteca, quindi
// senza le guardie). Entrano i codici di cui il visore dà almeno due pagine e la prima immagine esiste.
// Stato in data/malatestiana.json: l'elenco si rilegge ogni 6 giorni, schede e visore una volta sola (i codici nuovi).
import fs from "node:fs";
import { scarica, scaricaByte, log } from "../rete.mjs";

export const FILE_STATO = "data/malatestiana.json";
export const SITO = "https://servizi.comune.cesena.fc.it";
export const RICERCA = `${SITO}/applicazioniweb/ricerca_mala/ricerca_codici.jsp`;
export const SCHEDA = `${SITO}/applicazioniweb/ricerca_mala/mostra_codice.jsp`;
export const visore = s => `${SITO}/elenco-libri/libro.jsp?saggioid=${encodeURIComponent(s)}`;
export const immagine = (s, f) => `${SITO}/elenco-libri/images?codiceId=${encodeURIComponent(s)}&img=${f}.jpg`;
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/malatestiana";
export const LICENZA = "Biblioteca Malatestiana, Cesena (Memoria del Mondo UNESCO): immagini del Catalogo aperto dei manoscritti malatestiani";
const GIORNI = 6, LARGHEZZA = 1065;

export function leggiStato() { try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; } }
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => +a - +b).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}
const ENT = { rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", egrave: "è", eacute: "é", agrave: "à", ograve: "ò", ugrave: "ù", igrave: "ì", nbsp: " ", amp: "&", quot: '"', lt: "<", gt: ">", times: "×", deg: "°" };
const testo = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&([a-z]+);/gi, (m, e) => ENT[e.toLowerCase()] ?? m).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();

// elenco: <option value="106">D.XXI.5</option> della ricerca per segnatura
export function leggiElenco(html) {
  return [...String(html).matchAll(/<option[^>]*value="(\d+)"[^>]*>([^<]*)</g)].map(m => ({ id: m[1], s: testo(m[2]) })).filter(x => x.s);
}
// scheda -> { k: id del visore («DX.21.05»), t: contenuto, d, m: supporto e carte, w: copista }
export function leggiScheda(html) {
  html = String(html);
  const k = (/<table id="([^"]+)" class="defaultTable/.exec(html) || /saggioid=([^"&]+)/.exec(html) || [])[1] || null;
  const campi = {};
  for (const m of html.matchAll(/<td class="defaultTdEtichetta">([^<]+)<\/t[hd]><td>([\s\S]*?)<\/td><\/tr>/g)) campi[testo(m[1])] = testo(m[2]);
  const i = html.indexOf("DESCRIZIONE_TESTO_CONTENUTO"), j = html.indexOf("Descrizione Esterna");
  const contenuto = i >= 0 && j > i ? [...html.slice(i, j).matchAll(/<tr class="defaultTr[^"]*">([\s\S]*?)<\/tr>/g)].map(m => testo(m[1])).filter(Boolean) : [];
  return { k, t: contenuto.join(" ; ").slice(0, 1500) || null, d: campi["Datazione"] || null, m: [campi["Supporto"], campi["Carte"] && "carte " + campi["Carte"]].filter(Boolean).join(", ") || null, w: campi["Copista"] || null };
}

export async function scansionaMalatestiana({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const r = await scarica(RICERCA, { timeout: 120000 });
    if (r.stato !== 200) throw new Error(`ricerca per segnatura: HTTP ${r.stato}`);
    const el = leggiElenco(r.testo);
    if (el.length < 100) throw new Error(`elenco troppo corto (${el.length})`);
    const voci = {};
    for (const { id, s } of el) voci[id] = st.voci[id] && st.voci[id].s === s ? st.voci[id] : { s };
    st.voci = voci; st.totale = el.length; st.elenco = st.aggiornato = new Date().toISOString(); st.completato = null;
    salvaStato(st);
    log("malatestiana", `elenco: ${el.length} codici`);
  }
  const da = Object.keys(st.voci).filter(id => st.voci[id].p == null && !st.voci[id].x);
  let letti = 0;
  for (const id of da) {
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`schede lette in parte (mancano ${da.length - letti}): riprenderà alla prossima esecuzione`); }
    const v = st.voci[id];
    letti++;
    try {
      const r = await scarica(SCHEDA, { corpo: "CODICE_ID=" + id, timeout: 120000 });
      if (r.stato !== 200) continue;
      Object.assign(v, leggiScheda(r.testo));
      if (!v.k) { v.x = "scheda senza visore"; v.p = 0; continue; }
      const w = await scarica(visore(v.k), { timeout: 120000 });
      const pagine = +((/TOTAL_PAGES\s*=\s*(\d+)/.exec(w.testo) || [])[1] || 0), rapporto = +((/pageRatio\s*=\s*([\d.]+)/.exec(w.testo) || [])[1] || 0);
      v.p = pagine; if (rapporto) v.r = rapporto;
      if (pagine < 2) { v.x = "nessuna pagina nel visore"; continue; }
      const im = await scaricaByte(immagine(v.k, "001r"), { byte: 4 });
      if (!(im.stato === 200 || im.stato === 206) || im.dati[0] !== 0xff || im.dati[1] !== 0xd8) v.x = "prima immagine assente";
    } catch (e) { /* si riprova alla prossima esecuzione */ delete v.p; }
    for (const k of Object.keys(v)) if (v[k] == null) delete v[k];
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("malatestiana", `${letti} codici letti su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  if (!Object.values(st.voci).some(v => v.p == null && !v.x)) st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  return st;
}

export const ammessaMalatestiana = v => !!v && !v.x && v.k && v.p >= 2;
// nomi delle immagini come nel visore della Biblioteca: pagina 1 -> 001r, 2 -> 001v, 3 -> 002r…
export const nomePagina = i => String(Math.ceil(i / 2)).padStart(3, "0") + (i % 2 ? "r" : "v");

export function recordMalatestiana(st = leggiStato()) {
  return Object.entries((st && st.voci) || {}).filter(([, v]) => ammessaMalatestiana(v)).map(([id, v]) => ({
    fonte: "malatestiana", id: "mala-" + v.k.toLowerCase(), citta: "Cesena", biblioteca: "Biblioteca Malatestiana",
    segnatura: v.s, datazione: v.d || null, titolo: v.t || null, descrizione: [v.m, v.w && "Copista: " + v.w].filter(Boolean).join(" ; ") || null,
    immagini: v.p, manifest: `${BASE_MANIFESTI}/${v.k}.json`, pagina: `${SITO}/applicazioniweb/ricerca_mala/mostra_codice.jsp?CODICE_ID=${id}`, licenza: LICENZA }));
}

// manifesto IIIF P2 scritto da noi: immagini JPEG a misura fissa, senza servizio Image
export function manifestoScritto(id, v) {
  if (!ammessaMalatestiana(v)) return null;
  const mid = `${BASE_MANIFESTI}/${v.k}.json`, w = LARGHEZZA, h = Math.round(LARGHEZZA / (v.r || 0.665625));
  const canvases = Array.from({ length: v.p }, (_, i) => {
    const f = nomePagina(i + 1), cid = `${mid}/canvas/${f}`;
    return { "@id": cid, "@type": "sc:Canvas", label: f, width: w, height: h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid, resource: { "@id": immagine(v.k, f), "@type": "dctypes:Image", format: "image/jpeg", width: w, height: h } }] };
  });
  const meta = [["Segnatura", "Malatestiana " + v.s], ["Datazione", v.d], ["Contenuto", v.t], ["Supporto", v.m], ["Copista", v.w]].filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: "Cesena, Biblioteca Malatestiana, " + v.s, metadata: meta,
    attribution: "Biblioteca Malatestiana, Cesena. Manifesto scritto dal catalogo di Emendando con le immagini del Catalogo aperto dei manoscritti malatestiani.",
    related: `${SITO}/applicazioniweb/ricerca_mala/mostra_codice.jsp?CODICE_ID=${id}`, sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
