// Vietnamese Nôm Preservation Foundation (lib.nomfoundation.org, ospitata da ibiblio): libri Hán-Nôm della Biblioteca nazionale del
// Vietnam (Hanoi, fondo R.) e delle biblioteche dei templi Thắng Nghiêm e Phổ Nhân, fotografati dalla Fondazione (dal 26 ottobre
// 2026, corsia «asia»). www.nomfoundation.org rimanda a questo sito; la Biblioteca nazionale del Vietnam non pubblica IIIF.
// Elenco: pagine degli argomenti di ogni collezione (`/collection/<c>/subject/<s>`, tutti i volumi in una pagina; fuori gli
// argomenti che non sono libri: stele, murali, distici, tavolette lignee, stupa), poi la scheda di ogni volume
// (`/collection/<c>/volume/<v>/`: titolo hán e quốc ngữ, segnatura, autore, data, lingua, numero delle pagine, «Print type»).
// Entrano solo i volumi manoscritti («Print type»: chép tay / viết tay / manuscript); fuori le xilografie («Khắc in») e gli stampati.
// Niente IIIF: le immagini JPEG del sito (una per doppia pagina, `/site_media/nom/<id>/large/<id>-NNN.jpg`, senza CORS) si caricano
// come semplici <img>; i manifesti IIIF (Presentation 2, immagini a misura fissa) li scrive il catalogo (scripts/manifesti.mjs, ramo
// «manifesti»), con il numero delle pagine del visore del sito (`/page/1`: «Page 1 of N») e la misura di un'immagine per volume.
// Il robots.txt vieta solo la ricerca; pausa di 1,5 secondi (rete.mjs). Stato in data/nomfoundation.json; elenco ogni 30 giorni.
import fs from "node:fs";
import { scarica, scaricaByte, log } from "../rete.mjs";
import { misuraJpeg } from "./walters.mjs";

export const FILE_STATO = "data/nomfoundation.json";
export const SITO = "https://lib.nomfoundation.org";
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti";
export const COLLEZIONI = [1, 2, 3];
const NON_LIBRI = /bia|họa|hoa|câu đối|cau doi|cuốn thư|cuon thu|hoành phi|hoanh phi|phù đồ|phu do|inscription|mural|couplet|placard|stupa/i;
export const MANOSCRITTO = /chép tay|viết tay|manuscript|hand-?written|hand ?copied|bản thảo/i;
const GIORNI = 30;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, collezioni: st.collezioni || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}
const pulisci = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&bull;/g, "•").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

// scheda del volume -> campi { t, tq, cod, seg, a, src, k, ed, luogo, d, c, n, lin, ty, dim, pg, pt, img }
export function schedaNom(html) {
  const v = {}, campi = {};
  for (const m of html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)) { const k = pulisci(m[1]).toLowerCase().replace(/\s+/g, " "); if (k && !campi[k]) campi[k] = pulisci(m[2]); }
  const h1 = [...html.matchAll(/<h1>([\s\S]*?)<\/h1>/g)].map(m => pulisci(m[1])), h2 = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map(m => pulisci(m[1]));
  const img = /src="\/site_media\/nom\/([^/"]+)\/jpeg\/([^"]+?)-001\.jpg"/.exec(html);
  if (h1[0]) v.t = h1[0]; if (h1[1]) v.tq = h1[1];
  if (h2[0]) v.cod = h2[0]; if (h2[1] && h2[1] !== "-") v.seg = h2[1];
  const c = k => (campi[k] && campi[k] !== "-" ? campi[k] : null);
  if (c("creator")) v.a = c("creator"); if (c("source")) v.src = c("source"); if (c("subject")) v.k = c("subject");
  if (c("publisher")) v.ed = c("publisher"); if (c("place")) v.luogo = c("place"); if (c("date")) v.d = c("date");
  const desc = [c("description"), c("notes")].filter(Boolean).join(" ; ").slice(0, 800); if (desc) v.c = desc;
  if (c("language")) v.lin = c("language"); if (c("type")) v.ty = c("type"); if (c("size")) v.dim = c("size");
  if (c("pages")) v.pg = c("pages"); if (c("print type")) v.pt = c("print type");
  if (img) v.img = img[1];
  return v;
}

export async function scansionaNomfoundation({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  st.voci = st.voci || {}; st.collezioni = st.collezioni || {};
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  // 1) elenco dei volumi (argomenti di ogni collezione), ogni 30 giorni
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const nuove = {};
    for (const c of COLLEZIONI) {
      const r = await scarica(`${SITO}/collection/${c}/`, { timeout: 120000 });
      if (r.stato !== 200) throw new Error(`collezione ${c}: HTTP ${r.stato}`);
      const nome = pulisci((/<h1>([\s\S]*?)<\/h1>/.exec(r.testo) || [])[1] || "") || String(c);
      st.collezioni[c] = nome;
      for (const m of r.testo.matchAll(/href="subject\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        if (NON_LIBRI.test(pulisci(m[2]))) continue;
        const s = await scarica(`${SITO}/collection/${c}/subject/${m[1]}`, { timeout: 180000 });
        if (s.stato !== 200) throw new Error(`collezione ${c}, argomento ${m[1]}: HTTP ${s.stato}`);
        for (const x of s.testo.matchAll(/href="\/collection\/(\d+)\/volume\/(\d+)"/g)) nuove[`${x[1]}-${x[2]}`] = true;
      }
    }
    const vecchie = st.voci;
    st.voci = Object.fromEntries(Object.keys(nuove).map(k => [k, vecchie[k] || {}]));
    st.elenco = st.aggiornato = new Date().toISOString();
    if (Object.values(st.voci).some(v => !v.cod && !v.x)) st.completato = null;
    salvaStato(st);
    log("nomfoundation", `elenco: ${Object.keys(st.voci).length} volumi`);
  }
  // 2) schede dei volumi non ancora lette; 3) per i manoscritti, numero delle pagine del visore e misura di un'immagine
  let letti = 0;
  for (const k of Object.keys(st.voci)) {
    const v = st.voci[k];
    const daScheda = !v.cod && !v.x, daPagine = v.cod && MANOSCRITTO.test(v.pt || "") && v.img && !v.n && !v.x;
    if (!daScheda && !daPagine) continue;
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`schede lette in parte (${letti} in questa esecuzione): riprenderà alla prossima`); }
    const [c, vol] = k.split("-");
    try {
      if (daScheda) {
        const r = await scarica(`${SITO}/collection/${c}/volume/${vol}/`, { timeout: 120000, tentativi: 2 });
        if (r.stato !== 200) { v.x = `HTTP ${r.stato}`; continue; }
        Object.assign(v, schedaNom(r.testo)); if (!v.cod) v.x = "scheda senza segnatura";
        letti++;
      }
      if (v.cod && MANOSCRITTO.test(v.pt || "") && v.img && !v.n) {
        const p = await scarica(`${SITO}/collection/${c}/volume/${vol}/page/1`, { timeout: 120000, tentativi: 2 });
        const n = p.stato === 200 ? /Page\s+1\s+of\s+(\d+)/.exec(p.testo) : null;
        if (!n) { v.x = `visore: HTTP ${p.stato}`; continue; }
        const b = await scaricaByte(`${SITO}/site_media/nom/${v.img}/large/${v.img}-${String(Math.min(2, +n[1])).padStart(3, "0")}.jpg`, { byte: 16384, tentativi: 2 });
        const m = b.stato === 200 || b.stato === 206 ? misuraJpeg(b.dati) : null;
        if (!m) { v.x = `immagine: HTTP ${b.stato}`; continue; }
        v.n = +n[1]; v.w = m.w; v.h = m.h;
      }
    } catch (e) { v.x = e.message.slice(0, 60); }
    if (letti % 25 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); }
  }
  st.aggiornato = new Date().toISOString(); st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  log("nomfoundation", `schede lette: ${letti}; manoscritti: ${Object.values(st.voci).filter(ammessaNom).length} su ${Object.keys(st.voci).length} volumi`);
  return st;
}

export const ammessaNom = v => !!(v && v.cod && MANOSCRITTO.test(v.pt || "") && v.n && v.w && v.img);

function bibliotecaNom(k, v) {
  if (k.startsWith("1-") || /National Library/i.test(v.src || "")) return { biblioteca: "Thư viện Quốc gia Việt Nam (Biblioteca nazionale del Vietnam)", citta: "Hanoi (Vietnam)" };
  if (k.startsWith("2-")) return { biblioteca: "Chùa Thắng Nghiêm (biblioteca del tempio)", citta: "Hanoi (Vietnam)" };
  return { biblioteca: "Chùa Phổ Nhân (biblioteca del tempio)", citta: "Hanoi (Vietnam)" };
}
const lingueNom = v => { const l = v.lin || "", nom = /nôm|nom\b|quốc ngữ|quoc ngu/i.test(l), han = /hán|han\b|chinese/i.test(l); return nom && han ? ["vi", "zh"] : han ? ["zh"] : ["vi"]; };

export function recordNom(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaNom(v)).map(([k, v]) => ({
    fonte: "nomfoundation", id: "vnpf-" + v.img.toLowerCase(), ...bibliotecaNom(k, v), segnatura: v.seg ? `${v.seg} (${v.cod})` : v.cod,
    datazione: v.d && !/^\[?n\.\s?d\.?\]?$/i.test(v.d) ? v.d : null, titolo: [v.t, v.tq].filter(Boolean).join(" ; "), autori_fonte: v.a && !/^anonymous|khuyết danh/i.test(v.a) ? [v.a] : [],
    descrizione: [v.k, v.c, v.lin, v.dim, v.pt].filter(Boolean).join(" ; ").slice(0, 2000) || null, lingue: lingueNom(v), immagini: v.n,
    manifest: `${BASE_MANIFESTI}/nomfoundation/${v.img.toLowerCase()}.json`, pagina: `${SITO}/collection/${k.split("-")[0]}/volume/${k.split("-")[1]}/`,
    licenza: "Vietnamese Nôm Preservation Foundation e biblioteca proprietaria: per l'uso delle immagini rivolgersi a info@nomfoundation.org" }));
}

// manifesto scritto dal catalogo: immagini JPEG grandi del sito (una per doppia pagina), a misura fissa, senza servizio Image
export function manifestoScritto(k, v) {
  const nome = v.img.toLowerCase(), mid = `${BASE_MANIFESTI}/nomfoundation/${nome}.json`;
  const canvases = Array.from({ length: v.n }, (_, i) => {
    const num = String(i + 1).padStart(3, "0"), cid = `${SITO}/collection/${k.split("-")[0]}/volume/${k.split("-")[1]}/page/${i + 1}`;
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: v.w, height: v.h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid,
        resource: { "@id": `${SITO}/site_media/nom/${v.img}/large/${v.img}-${num}.jpg`, "@type": "dctypes:Image", format: "image/jpeg", width: v.w, height: v.h } }] };
  });
  const meta = [["Segnatura", v.seg ? `${v.seg} (${v.cod})` : v.cod], ["Titolo (quốc ngữ)", v.tq], ["Autore", v.a], ["Datazione", v.d], ["Lingua", v.lin], ["Misure", v.dim], ["Tipo", v.pt]]
    .filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.t, v.tq].filter(Boolean).join(" | ") || v.cod, metadata: meta,
    attribution: "Vietnamese Nôm Preservation Foundation (lib.nomfoundation.org). Manifesto scritto dal catalogo di Emendando con le immagini del sito (misure di un'immagine per volume).",
    related: `${SITO}/collection/${k.split("-")[0]}/volume/${k.split("-")[1]}/`,
    sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
