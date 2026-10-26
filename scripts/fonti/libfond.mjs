// «Собрание рукописей и старопечатных книг» della Santissima Trinità-San Sergio (Свято-Троицкая Сергиева Лавра, lib-fond.ru;
// il sito stsl.ru della Lavra rimanda qui): copie digitali dei codici del Reparto manoscritti della Biblioteca Statale Russa
// (Отдел рукописей РГБ, Mosca: fondo 304 della Lavra, biblioteca dell'Accademia Teologica di Mosca, fondo 173, e le altre raccolte
// di libri manoscritti) e della biblioteca dell'Accademia Teologica di Mosca (МДА, Sergiev Posad).
// Come si legge: il sito non vieta nulla (robots.txt «Disallow:» vuoto) e non ha IIIF né elenchi per programmi: si sfogliano le
// pagine delle sezioni e dei fondi (20 codici per pagina, con segnatura, titolo, datazione e numero dei fogli), poi per ogni codice
// una volta la scheda (rubrica, datazione, note) e l'elenco delle immagini (<scheda>pages, lo stesso che chiede il visore del sito).
// Le immagini sono JPEG su img.lib-fond.ru (JPG_PREVIEW, 1200 pixel sul lato lungo; di solito due pagine affiancate per foto),
// senza CORS ma caricabili come semplici <img>: i manifesti IIIF (Presentation 2, immagini a misura fissa, senza servizio Image) li
// scrive il catalogo (scripts/manifesti.mjs, ramo «manifesti»), con le misure della prima immagine di ogni codice.
// Entrano solo i fondi di libri manoscritti (собрания рукописных книг, raccolte di monasteri e biblioteche): restano fuori gli
// archivi personali («Архив ...»: carteggi e documenti), le raccolte di autografi, i registri parrocchiali dell'Archivio centrale di
// Mosca e gli archivi di Rybinsk e di Stato degli atti antichi (documenti), e i libri a stampa (старопечатные книги).
// Il server risponde spesso con connessioni interrotte: richieste in serie, 2 secondi di pausa, tentativi con attesa crescente.
// Stato in data/libfond.json: l'elenco dei fondi e dei codici si rilegge ogni 30 giorni, schede e immagini una volta sola.
import fs from "node:fs";
import { UA, log, scaricaByte } from "../rete.mjs";

export const FILE_STATO = "data/libfond.json";
export const SITO = "https://lib-fond.ru";
export const IMG = "https://img.lib-fond.ru";
export const BASE_MANIFESTI = "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/libfond";
// sezioni lette: biblioteca e città
export const SEZIONI = {
  "lib-rgb": { biblioteca: "Biblioteca Statale Russa, Reparto manoscritti (Отдел рукописей РГБ)", citta: "Mosca" },
  "lib-mda": { biblioteca: "Accademia Teologica di Mosca, Biblioteca (Московская Духовная Академия)", citta: "Sergiev Posad" },
};
// fondi esclusi: archivi personali e di enti, autografi, raccolte di carte («Коллекция»), carte e copiari, libri a stampa, inventari e cataloghi
export const FONDO_ESCLUSO = /Архив|автограф|документ|[Гг]рамот|Коллекция|акт[ыов](?![А-яЁё])|переписк|письм|Старопечат|^Описи/;
const GIORNI = 30, PAUSA = 2000;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { fondi: {}, voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, fondi: st.fondi || {}, cursore: st.cursore || null });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

let ultima = 0;
async function testo(url) {
  let errore;
  for (let k = 0; k < 6; k++) {
    const attesa = PAUSA - (Date.now() - ultima); if (attesa > 0) await new Promise(r => setTimeout(r, attesa));
    ultima = Date.now();
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(90000) });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
      return await r.text();
    } catch (e) { errore = e; await new Promise(r => setTimeout(r, 5000 * 2 ** Math.min(k, 4))); }
  }
  throw errore;
}

const pulito = s => String(s || "").replace(/<br\s*\/?>/gi, " ; ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&ndash;/g, "–").replace(/&laquo;/g, "«").replace(/&raquo;/g, "»")
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").replace(/^( ; )+|( ; )+$/g, "").trim();

// pagina di una sezione -> fondi [{ url, nome }]
export function fondiDa(html, sez) {
  const out = [];
  for (const m of html.matchAll(new RegExp(`<h2 class="title-link">\\s*<a href='(${SITO}/${sez}/[^'/]+/)'>([^<]+)</a>`, "g"))) out.push({ url: m[1], nome: pulito(m[2]) });
  return out;
}
// pagina di un fondo -> codici [{ url, s, t, r }] e numero delle pagine
export function codiciDa(html) {
  const out = [];
  for (const b of html.split(/<div class="card mb-2">/).slice(1)) {
    const m = /<a href='([^']+)'><strong>([^<]+)<\/strong><\/a>/.exec(b); if (!m) continue;
    const corpo = b.slice(b.indexOf("</h2>") + 5);
    const t = (/<strong>([^<]*)<\/strong>/.exec(corpo) || [])[1];
    const r = (/<br\/?>([^<]*)<\/div>/.exec(corpo) || [])[1];
    out.push({ url: m[1], s: pulito(m[2]), t: pulito(t) || null, r: pulito(r) || null });
  }
  const pagine = Math.max(1, ...[...html.matchAll(/\?page=(\d+)/g)].map(x => +x[1]));
  return { codici: out, pagine };
}
// scheda di un codice -> campi della descrizione e indirizzi degli elenchi delle immagini
export function schedaDa(html) {
  const campi = {};
  for (const m of html.matchAll(/<li><span class="list-label">([^<]+):<\/span>([\s\S]*?)<\/li>/g)) campi[pulito(m[1])] = pulito(m[2]);
  const urls = [...((/var \$manuscripturl = \[([\s\S]*?)\]/.exec(html) || [])[1] || "").matchAll(/"([^"]+)"/g)].map(x => x[1]);
  return { campi, urls };
}
// elenco delle immagini -> percorsi dei JPEG di anteprima (senza «//img.lib-fond.ru/»)
export function immaginiDa(html) {
  return [...html.matchAll(/data-preview="\/\/img\.lib-fond\.ru\/([^"]+)"/g)].map(x => x[1].replace(/&amp;/g, "&"));
}

// percorsi in forma compatta: { d: cartella comune, a: prefisso, z: suffisso, q: cifre, n: "40-52,54,..." } oppure { d, f: [nomi] }
export function compattaImmagini(ps) {
  if (!ps.length) return null;
  let d = ps[0].slice(0, ps[0].lastIndexOf("/") + 1);
  while (!ps.every(p => p.startsWith(d))) d = d.slice(0, d.slice(0, -1).lastIndexOf("/") + 1);
  const nomi = ps.map(p => p.slice(d.length));
  const m0 = /^(.*?)(\d+)(\.[A-Za-z]+)$/.exec(nomi[0]);
  if (m0) {
    const q = m0[2].length, re = /^(.*?)(\d+)(\.[A-Za-z]+)$/;
    const nn = nomi.map(n => re.exec(n));
    if (nn.every(m => m && m[1] === m0[1] && m[3] === m0[3] && m[2].length === q)) {
      const num = nn.map(m => +m[2]), parti = [];
      for (let i = 0; i < num.length;) { let j = i; while (j + 1 < num.length && num[j + 1] === num[j] + 1) j++; parti.push(j > i ? `${num[i]}-${num[j]}` : String(num[i])); i = j + 1; }
      return { d, a: m0[1], z: m0[3], q, n: parti.join(",") };
    }
  }
  return { d, f: nomi };
}
export function espandiImmagini(c) {
  if (!c) return [];
  if (c.f) return c.f.map(n => c.d + n);
  const out = [];
  for (const p of c.n.split(",")) { const [x, y] = p.split("-").map(Number); for (let i = x; i <= (y ?? x); i++) out.push(c.d + c.a + String(i).padStart(c.q, "0") + c.z); }
  return out;
}
export const numeroImmagini = c => (!c ? 0 : c.f ? c.f.length : c.n.split(",").reduce((s, p) => { const [x, y] = p.split("-").map(Number); return s + (y == null ? 1 : y - x + 1); }, 0));
// indirizzo dell'immagine: IRI con i caratteri cirillici in chiaro (i manifesti restano più leggeri; il browser li codifica da sé),
// codificati solo spazi e caratteri riservati
export const urlImmagine = p => IMG + "/" + p.split("/").map(x => x.replace(/[%\s#?"<>\\^`{|}]/g, c => encodeURIComponent(c))).join("/");

// misure di un JPEG dai primi byte (marcatore SOF)
function misureJpeg(b) {
  let i = 2;
  while (i + 9 < b.length && b[i] === 0xff) {
    const m = b[i + 1], l = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + l;
  }
  return null;
}

const idDa = url => url.replace(SITO + "/", "").replace(/\/$/, "").split("/").pop();

export async function scansionaLibfond({ minuti = 60, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  st.voci = st.voci || {}; st.fondi = st.fondi || {};
  // 1. elenco dei fondi e dei codici (a riprese: il cursore dice il fondo e la pagina a cui si è arrivati)
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5 || st.cursore) {
    if (!st.cursore) {
      const fondi = {};
      for (const sez of Object.keys(SEZIONI)) {
        const html = await testo(`${SITO}/${sez}/`);
        for (const f of fondiDa(html || "", sez)) fondi[f.url] = { nome: f.nome, sez, escluso: FONDO_ESCLUSO.test(f.nome) || undefined };
      }
      if (!Object.keys(fondi).length) throw new Error("nessun fondo nelle sezioni");
      st.fondi = fondi; st.cursore = { fondo: 0, pagina: 1, visti: [] };
      salvaStato(st);
    }
    const lista = Object.keys(st.fondi).filter(u => !st.fondi[u].escluso);
    while (st.cursore.fondo < lista.length) {
      if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`elenco letto in parte (fondo ${st.cursore.fondo + 1} di ${lista.length}): riprenderà alla prossima esecuzione`); }
      const u = lista[st.cursore.fondo], f = st.fondi[u];
      const html = await testo(st.cursore.pagina > 1 ? `${u.replace(/\/$/, "")}?page=${st.cursore.pagina}` : u);
      const { codici, pagine } = codiciDa(html || "");
      for (const c of codici) {
        const id = idDa(c.url);
        st.cursore.visti.push(id);
        const v = st.voci[id] || {};
        st.voci[id] = { ...v, u: c.url, z: f.sez, f: f.nome, s: c.s, t: c.t, r: c.r };
      }
      if (st.cursore.pagina >= pagine || !codici.length) { st.cursore.fondo++; st.cursore.pagina = 1; } else st.cursore.pagina++;
      if (st.cursore.pagina === 1 || st.cursore.pagina % 10 === 0) salvaStato(st);
    }
    // fuori i codici che non sono più negli elenchi
    const visti = new Set(st.cursore.visti);
    for (const id of Object.keys(st.voci)) if (!visti.has(id)) delete st.voci[id];
    st.cursore = null; st.elenco = new Date().toISOString(); st.completato = null;
    salvaStato(st);
    log("libfond", `elenco: ${Object.keys(st.voci).length} codici in ${lista.length} fondi`);
  }
  // 2. schede, immagini e misure dei codici non ancora letti
  let letti = 0;
  for (const [id, v] of Object.entries(st.voci)) {
    if (v.i !== undefined && (v.w || !v.i || v.x)) continue;
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`codici letti in parte (${letti} in questo giro): riprenderà alla prossima esecuzione`); }
    try {
      if (v.i === undefined) {
        const html = await testo(v.u);
        if (html == null) { v.i = null; v.x = "scheda non trovata"; continue; }
        const { campi, urls } = schedaDa(html);
        v.c = campi;
        const ps = [];
        for (const pu of urls.length ? urls : [v.u]) ps.push(...immaginiDa((await testo(pu + "pages")) || ""));
        v.i = compattaImmagini(ps);
      }
      if (v.i && !v.w) {
        const r = await scaricaByte(urlImmagine(espandiImmagini(v.i)[0]), { byte: 131072, timeout: 90000 });
        const mis = r.stato < 300 ? misureJpeg(r.dati) : null;
        if (mis) [v.w, v.h] = mis; else v.x = `misure non lette (HTTP ${r.stato})`;
      }
    } catch (e) { v.x = String(e.message || e).slice(0, 80); }
    if (++letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("libfond", `${letti} codici letti in questo giro`); }
  }
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("libfond", `${Object.values(st.voci).filter(ammessaLibfond).length} codici con immagini su ${Object.keys(st.voci).length}`);
  return st;
}

// fuori i libri a stampa (старопечатные книги, издания) e i documenti sciolti, anche dentro i fondi di libri manoscritti
export const NON_MANOSCRITTO = /старопечат|печатн|издани|типограф/i;
// carte d'archivio rilegate nei fondi di libri (carteggi, atti di cause, suppliche, contratti): fuori
export const DOCUMENTO = /Переписк|[Пп]исьм|[Пп]исем|[Чч]елобитн|(?<![А-яЁё])[Дд]ел[оа](?![А-яЁё])|[Тт]яжебн|[Уу]каз(?![А-яЁё])|[Гг]рамот|[Кк]упч|[Рр]асписк|[Оо]тписк|Объявлени|Записка(?![А-яЁё])|[Вв]едомост|[Кк]абал|[Зз]акладн|[Дд]оговор|[Пп]рошени/;
export function ammessaLibfond(v) {
  if (!v || !v.i || !v.w) return false;
  const rub = (v.c && (v.c["Рубрика"] || "")) || "";
  if (NON_MANOSCRITTO.test(rub) || NON_MANOSCRITTO.test(v.t || "") || DOCUMENTO.test(v.t || "")) return false;
  // parti numerate di un'unità («№135.55») senza datazione né numero di fogli: carte sciolte di un fascicolo
  if (/№\s*\d+[а-я]?\.\d+/.test(v.s || "") && !v.r && !(v.c && v.c["Кол-во листов"])) return false;
  return true;
}
// lingua: slavo ecclesiastico salvo indicazioni nelle note o nel titolo (greco, latino; russo per i testi moderni non ecclesiastici)
export function lingueLibfond(v) {
  const s = [v.t, v.c && v.c["Примечания"], v.c && v.c["Язык"], v.f].filter(Boolean).join(" ");
  const out = [];
  if (/греческ/i.test(s)) out.push("grc");
  if (/латинск/i.test(s)) out.push("la");
  if (/грузинск/i.test(s)) out.push("ka");
  if (/армянск/i.test(s)) out.push("hy");
  if (/арабск/i.test(s)) out.push("ar");
  if (!out.length || /славянск|церковнослав/i.test(s)) out.unshift("cu");
  return [...new Set(out)];
}
export function recordLibfond(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaLibfond(v)).map(([id, v]) => {
    const z = SEZIONI[v.z] || SEZIONI["lib-rgb"], c = v.c || {};
    const resto = Object.entries(c).filter(([k]) => !["Дата", "Примечания"].includes(k)).map(([k, x]) => `${k}: ${x}`);
    return { fonte: "libfond", id: "libfond-" + id, citta: z.citta, biblioteca: z.biblioteca,
      segnatura: v.s || id, datazione: c["Дата"] || (v.r ? v.r.replace(/,\s*\d+\s*л\.?$/, "") : null), titolo: v.t || null,
      descrizione: [v.f, ...resto, c["Примечания"]].filter(Boolean).join(" ; ").slice(0, 3000) || null, lingue: lingueLibfond(v), immagini: numeroImmagini(v.i),
      manifest: `${BASE_MANIFESTI}/${id}.json`, pagina: v.u, licenza: "Свято-Троицкая Сергиева Лавра, «Собрание рукописей и старопечатных книг» (lib-fond.ru), per il Reparto manoscritti della Biblioteca Statale Russa e l'Accademia Teologica di Mosca: uso di studio" };
  });
}

// manifesto IIIF Presentation 2 scritto dal catalogo: JPEG di anteprima del sito a misura fissa (misure della prima immagine)
export function manifestoScritto(id, v) {
  const mid = `${BASE_MANIFESTI}/${id}.json`;
  // manifesti leggeri (sono migliaia, con centinaia di immagini ciascuno): id del canvas = scheda del sito con il numero
  // dell'immagine, niente misure ripetute nell'immagine
  const canvases = espandiImmagini(v.i).map((p, i) => {
    const cid = `${v.u}#${i + 1}`;
    return { "@id": cid, "@type": "sc:Canvas", label: String(i + 1), width: v.w, height: v.h,
      images: [{ "@type": "oa:Annotation", motivation: "sc:painting", on: cid, resource: { "@id": urlImmagine(p), "@type": "dctypes:Image", format: "image/jpeg" } }] };
  });
  const c = v.c || {};
  const meta = [["Segnatura", v.s], ["Titolo", v.t], ["Fondo", v.f], ...Object.entries(c)].filter(([, x]) => x).map(([label, value]) => ({ label, value }));
  return { "@context": "http://iiif.io/api/presentation/2/context.json", "@id": mid, "@type": "sc:Manifest", label: [v.s, v.t].filter(Boolean).join(". ") || id, metadata: meta,
    attribution: `${(SEZIONI[v.z] || SEZIONI["lib-rgb"]).biblioteca}; copie digitali pubblicate dalla Свято-Троицкая Сергиева Лавра (lib-fond.ru). Manifesto scritto dal catalogo di Emendando con le immagini del sito.`,
    related: v.u, sequences: [{ "@id": `${mid}/s0`, "@type": "sc:Sequence", canvases }] };
}
