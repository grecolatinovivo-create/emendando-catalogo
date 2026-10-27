// Biblioteche universitarie austriache su Visual Library (semantics/ExLibris, consorzio OBV): Universitätsbibliothek Graz
// (unipub.uni-graz.at: manoscritti «obvugrscript», frammenti «obvugrfragms», ricettari manoscritti «obvugrdomus_ms», codici di Vorau
// «obvugrvorau») e Universitätsbibliothek Salzburg (eplus.uni-salzburg.at: manoscritti «usbhandschriften» e codici con segnatura
// «UBS M» della biblioteca dei Cappuccini, «usbkapuziner»).
// Prova del 27 ottobre 2026. Il robots.txt (uguale per tutti i siti Visual Library austriaci) vieta per «*» solo ricerca, OAI,
// faccette, «/id/», «/document/» e i visori zoom e thumbview di ogni collezione, più alcune collezioni intere (non queste); non chiede
// pause. Le schede «titleinfo» sono dietro una verifica anti-robot (prova di lavoro in JavaScript): non si leggono.
// Elenco: le sitemap pubblicate dai siti (sitemap.xml, citate nel robots.txt), con gli identificativi «titleinfo» di ogni collezione.
// Dati: il manifesto IIIF Presentation 2 di ogni codice (/i3f/v20/<id>/manifest, non vietato; CORS aperto, immagini dal servizio
// IIIF Image /i3f/v20/<id immagine> con CORS aperto), che porta etichetta (segnatura), metadati e numero delle pagine.
// Fuori: a Salisburgo le schede con una o due carte («Inhaltsangabe»: scansione della sola descrizione, non del codice) e, tra i
// Cappuccini, ciò che non ha la segnatura «UBS M» (libri a stampa, incisioni); dovunque lettere e oggetti senza immagini.
// NB: «obvugrhs» a Graz sono le tesi (Hochschulschriften), non i manoscritti.
// Stato in data/vlaustria.json: elenco dalle sitemap ogni 14 giorni, poi un manifesto per voce nuova, a riprese.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/vlaustria.json";
const GIORNI = 14;

// prefisso dell'id -> sito, collezioni lette, biblioteca, città, licenza
export const SITI = {
  ubgraz: { host: "https://unipub.uni-graz.at", collezioni: ["obvugrscript", "obvugrfragms", "obvugrdomus_ms", "obvugrvorau"],
    biblioteca: "Universitätsbibliothek Graz", citta: "Graz" },
  ubsbg: { host: "https://eplus.uni-salzburg.at", collezioni: ["usbhandschriften", "usbkapuziner"],
    biblioteca: "Universitätsbibliothek Salzburg", citta: "Salisburgo" },
};

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, elenco: st.elenco || null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

// identificativi delle collezioni lette, dalle sitemap del sito: {id: collezione}
async function elencoSitemap(sito) {
  const r = await scarica(sito.host + "/sitemap.xml", { timeout: 120000 });
  if (r.stato !== 200) throw new Error(`sitemap ${sito.host}: HTTP ${r.stato}`);
  const parti = [...r.testo.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).filter(u => /sitemap-\d+\.xml$/.test(u));
  if (!parti.length) throw new Error(`sitemap ${sito.host}: nessuna parte`);
  const ids = {}, re = new RegExp(`/(${sito.collezioni.join("|")})/content/titleinfo/(\\d+)<`, "g");
  for (const u of parti) {
    const p = await scarica(u, { timeout: 180000 });
    if (p.stato !== 200) throw new Error(`${u}: HTTP ${p.stato}`);
    for (const m of p.testo.matchAll(re)) ids[m[2]] = m[1];
  }
  return ids;
}

const pulito = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
// manifesto -> voce compatta {c, s (etichetta), t (titolo), d (datazione), l (lingue), a (autori), u (consistenza), m (materiale), n (pagine)}
export function compattaVl(c, j) {
  const md = {};
  for (const x of j.metadata || []) { const k = pulito(x.label), v = pulito(Array.isArray(x.value) ? x.value.map(y => y["@value"] ?? y).join(" ; ") : x.value); if (k && v) (md[k] = md[k] || []).push(v); }
  const primo = (...k) => { for (const x of k) if (md[x]) return md[x][0]; return null; };
  let t = primo("Titel : Signatur", "Titel");
  if (t && t.includes(" : ")) t = t.slice(t.indexOf(" : ") + 3);
  const v = { c, s: pulito(j.label) || null, t: t ? t.slice(0, 400) : null, d: primo("Entstehungsort, -zeit", "Entstehung", "Erschienen"),
    l: (md.Sprache || []).flatMap(x => x.split(/\s*;\s*/)).filter(Boolean), a: [...new Set([...(md["Verfasser/ Verfasserin"] || []), ...(md.Verfasser || [])])].slice(0, 10),
    u: primo("Umfang/Format", "Umfang"), m: primo("Material/Technik", "Material"), n: ((j.sequences || [])[0] || {}).canvases?.length || 0 };
  for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}

const urlManifesto = (pre, id) => `${SITI[pre].host}/i3f/v20/${id}/manifest`;

export async function scansionaVlaustria({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  // 1. elenco dalle sitemap (ogni 14 giorni): voci nuove senza dati; quelle sparite dalle sitemap si tolgono
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const visti = new Set(); st.totali = {};
    for (const [pre, sito] of Object.entries(SITI)) {
      const ids = await elencoSitemap(sito);
      st.totali[pre] = Object.keys(ids).length;
      for (const [id, c] of Object.entries(ids)) { const k = `${pre}-${id}`; visti.add(k); if (!st.voci[k]) st.voci[k] = { c }; }
      log("vlaustria", `${sito.biblioteca}: ${Object.keys(ids).length} schede nelle sitemap`);
    }
    for (const k of Object.keys(st.voci)) if (!visti.has(k)) delete st.voci[k];
    st.elenco = new Date().toISOString(); st.completato = null;
    st.aggiornato = new Date().toISOString(); salvaStato(st);
  }
  // 2. un manifesto per voce non ancora letta
  const daLeggere = Object.keys(st.voci).filter(k => st.voci[k].n == null && !st.voci[k].x);
  let lette = 0;
  for (const k of daLeggere) {
    if (Date.now() > fine) break;
    const [pre, id] = k.split("-"), c = st.voci[k].c;
    try {
      const r = await scarica(urlManifesto(pre, id), { timeout: 120000, accept: "application/json" });
      if (r.stato !== 200) st.voci[k] = { c, x: "HTTP " + r.stato };
      else st.voci[k] = compattaVl(c, JSON.parse(r.testo));
    } catch (e) { st.voci[k] = { c, x: String(e.message || e).slice(0, 80) }; }
    if (++lette % 25 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("vlaustria", `${lette} manifesti letti su ${daLeggere.length}`); }
  }
  const resto = Object.values(st.voci).filter(v => v.n == null && !v.x).length;
  if (!resto) st.completato = st.completato || new Date().toISOString();
  st.aggiornato = new Date().toISOString(); salvaStato(st);
  log("vlaustria", `${lette} manifesti letti; ${resto} ancora da leggere`);
  return st;
}

// motivo per cui una voce resta fuori (null = ammessa)
export function motivoVl(k, v) {
  if (!v || v.n == null) return v && v.x ? "manifesto non leggibile" : "non ancora letta";
  if (!v.n) return "senza immagini";
  if (/\bbrief(e|wechsel)?\b|\bkorrespondenz\b/i.test(v.t || "")) return "lettere";
  if (v.c === "usbkapuziner" && !/^UBS M\b/.test(v.s || "")) return "non manoscritto (libri a stampa, incisioni)";
  if (k.startsWith("ubsbg-") && v.n < 10) return "solo la descrizione digitalizzata";
  return null;
}
export const ammessaVl = (k, v) => motivoVl(k, v) == null;

export function recordVlaustria(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([k, v]) => ammessaVl(k, v)).map(([k, v]) => {
    const [pre, id] = k.split("-"), sito = SITI[pre];
    const vorau = v.c === "obvugrvorau" || /^Vorau\b/.test(v.s || "");
    // «Graz, Universitätsbibliothek Ms 0969» -> «Ms 0969»; «UBS M I 515» -> «M I 515»; «Vorau, StAV Ms. 273» -> «Ms. 273»
    const segnatura = String(v.s || id).replace(/^Graz,\s*Universitätsbibliothek\s+/i, "").replace(/^UBS\s+/, "").replace(/^Vorau,\s*(?:StAV\s+)?/, "");
    return { fonte: "vlaustria", id: k, citta: vorau ? "Vorau" : sito.citta, biblioteca: vorau ? "Stiftsbibliothek Vorau (copia digitale dell'Universitätsbibliothek Graz)" : sito.biblioteca,
      segnatura, datazione: v.d || null, titolo: v.t || null, autori_fonte: v.a || [], lingue: lingueDa(v.l || []).filter(x => x !== "xx"),
      descrizione: [v.c === "obvugrfragms" ? "Frammento" : null, v.u, v.m].filter(Boolean).join(" ; ") || null, immagini: v.n || null,
      manifest: urlManifesto(pre, id), pagina: `${sito.host}/${v.c}/content/titleinfo/${id}`,
      licenza: pre === "ubsbg" ? "Universitätsbibliothek Salzburg, CC BY-NC-SA 4.0" : "Universitätsbibliothek Graz" };
  });
}
