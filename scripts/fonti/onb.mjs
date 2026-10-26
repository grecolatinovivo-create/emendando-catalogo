// Österreichische Nationalbibliothek, Vienna: codici della Sammlung von Handschriften und alten Drucken digitalizzati in ÖNB Digital.
// Elenco: la ricerca di ÖNB Digital (onb.digital, nessun robots.txt), con le stesse richieste che fa la pagina
// (POST /Frontend/search_api_search, che gira la ricerca a digital.onb.ac.at/rep/discovery/public/search): tipo di supporto
// «MANUSCRIPT» (16.576 oggetti il 26 ottobre 2026: codici, ma anche lettere, autografi, carte d'archivio, musica) ristretto ai
// documenti che contengono la parola «Handschrift» (la descrizione fisica dei codici è «Handschrift; 304 Bll.»), tolte partiture
// e parti staccate («Partitur», «Stimmen»): circa 6.400 candidati.
// Poi il manifesto IIIF Presentation 3 di ogni candidato (api.onb.ac.at/iiif/presentation/v3/manifest/<id>), letto una volta:
// entrano solo i codici con segnatura «Cod. …» o «Fragm. …» e descrizione fisica «Handschrift…» (fuori lettere, autografi,
// nachlass, musica e fotografie di singole pagine «Cod. …, fol. 65v»). Manifesti e immagini (api.onb.ac.at/iiif/image/v3)
// rispondono con CORS aperto (verificato il 26 ottobre 2026). Pausa di 1,5 secondi (scripts/rete.mjs).
// Dal 26 ottobre 2026 onb.digital e api.onb.ac.at rispondono anche dal server (a differenza di iiif.onb.ac.at e di
// digital.onb.ac.at): se tornassero a chiudere le richieste dei server, l'elenco si rifà dal browser con scripts/browser/onb.js.
// Stato in data/onb.json: l'elenco si rilegge ogni 6 giorni, i manifesti una volta sola (solo i candidati nuovi).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/onb.json";
export const RICERCA = "https://onb.digital/Frontend/search_api_search";
export const API = "https://digital.onb.ac.at/rep/discovery/public/search";
export const QUERY = "Handschrift NOT Partitur NOT Stimmen";
export const manifestoOnb = id => `https://api.onb.ac.at/iiif/presentation/v3/manifest/${id}`;
const GIORNI = 6, RIGHE = 300;

export function leggiStato(file = FILE_STATO) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b, "en")).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, completato: st.completato || null, totale: st.totale || 0, ricerca: QUERY });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const testo = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&").replace(/&([a-z])uml;/gi, (m, c) => ({ a: "ä", o: "ö", u: "ü", A: "Ä", O: "Ö", U: "Ü" })[c] || m).replace(/\s+/g, " ").trim();

// una pagina della ricerca (la risposta può cominciare con avvisi PHP prima del JSON): [{ id, t, a, d }], totale
export function leggiPagina(t) {
  const i = t.indexOf('{"api_url"'); if (i < 0) return null;
  const d = JSON.parse(t.slice(i)), out = [];
  for (const parte of String(d.results_container || "").split('<div id="result_').slice(1)) {
    const id = parte.split('"')[0];
    const campi = [...parte.matchAll(/<div class="result_text_[a-z_ ]+">([\s\S]*?)<\/div>/g)].map(m => testo(m[1]));
    out.push({ id, t: campi[1] || null, a: campi[2] || null, d: campi[4] || null });
  }
  return { voci: out, totale: +String(d.results_count || "0").replace(/\D/g, "") };
}
export function corpoRicerca(da, righe = RIGHE) {
  const api = `${API}?query=${encodeURIComponent(QUERY)}&filter.mediatype=(%22MANUSCRIPT%22)&fulltext=false&sort=+&rows=${righe}&facetlimit=1&from=${da}`;
  return new URLSearchParams({ api_query: api, item_id: "", keywords: "", from: "", rows: String(righe), auto_complete: "false",
    filters_array: JSON.stringify({ keywords: "", fulltext: "false", years: { von: "", bis: "" }, sort: "+" }) }).toString();
}

// manifesto IIIF 3 -> scheda compatta { s, t, d, l, u, a, c, n } oppure { x: motivo }
const val = v => { if (!v) return []; const k = v.en ? "en" : v.de ? "de" : Object.keys(v)[0]; return (v[k] || []).map(testo).filter(Boolean); };
export function schedaDaManifesto(m) {
  const meta = {};
  for (const x of m.metadata || []) { const k = (x.label && (x.label.de || x.label.en || Object.values(x.label)[0]) || [])[0]; if (k) meta[k] = x.value; }
  const de = k => { const v = meta[k]; if (!v) return []; return (v.de || v.none || v.en || Object.values(v)[0] || []).map(testo).filter(Boolean); };
  const s = (de("Signatur")[0] || "").replace(/\s+(HAN|MUS|PAP|KAR)\s+[A-Z]+$/, "").trim();
  const u = de("Umfang").join(" ; "), n = (m.items || []).length;
  if (!/^(Cod\.|Fragm\.)\s/.test(s)) return { x: "segnatura " + (s.split(/[\s.]/)[0] || "assente"), s: s || undefined };
  if (!/^Handschrift/i.test(u)) return { x: "non è un codice (" + (u.slice(0, 40) || "senza descrizione fisica") + ")", s };
  if (!n) return { x: "manifesto senza pagine", s };
  return { s, t: de("Titel").join(" ; ") || val(m.label)[0] || null, d: de("Jahr/Datierung")[0] || null, l: val(meta["Sprachen"]), u: u.slice(0, 300),
    a: de("Person").map(p => p.replace(/\s*--\s*\(GND:.*$/, "").replace(/\s*\[[^\]]*\]\s*$/, "")).slice(0, 10), c: de("Weitere Informationen").join(" ; ").slice(0, 1500) || null, n };
}

/* raccolta: elenco (ogni 6 giorni), poi i manifesti dei candidati non ancora letti, finché c'è tempo */
export async function scansionaOnb({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5) {
    const nuove = {};
    let totale = null;
    for (let da = 0; totale == null || da < totale; da += RIGHE) {
      if (Date.now() > fine) throw new Error("elenco incompleto: riprenderà alla prossima esecuzione");
      const r = await scarica(RICERCA, { corpo: corpoRicerca(da), timeout: 180000 });
      const p = r.stato === 200 ? leggiPagina(r.testo) : null;
      if (!p) throw new Error(`ricerca di ÖNB Digital non leggibile (HTTP ${r.stato}, da ${da})`);
      totale = p.totale;
      for (const v of p.voci) { const prima = st.voci[v.id]; nuove[v.id] = prima && (prima.s || prima.x) ? { ...prima, e: { t: v.t, a: v.a, d: v.d } } : { e: { t: v.t, a: v.a, d: v.d } }; }
      if (!p.voci.length) break;
    }
    if (Object.keys(nuove).length < 0.9 * totale) throw new Error(`elenco incompleto (${Object.keys(nuove).length} su ${totale})`);
    st.voci = nuove; st.totale = totale; st.elenco = st.aggiornato = new Date().toISOString();
    salvaStato(st);
    log("onb", `elenco: ${Object.keys(nuove).length} candidati`);
  }
  const da = Object.keys(st.voci).filter(id => !st.voci[id].s && !st.voci[id].x);
  let letti = 0;
  for (const id of da) {
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salvaStato(st); throw new Error(`manifesti letti in parte (mancano ${da.length - letti} su ${Object.keys(st.voci).length}): riprenderà alla prossima esecuzione`); }
    const v = st.voci[id];
    let r; try { r = await scarica(manifestoOnb(id), { timeout: 120000, accept: "application/json", tentativi: 2 }); } catch (e) { letti++; continue; }   // si riprova alla prossima
    letti++;
    if (r.stato !== 200) { if (r.stato === 404 || r.stato === 410) st.voci[id] = { e: v.e, x: `HTTP ${r.stato}` }; continue; }
    let sch; try { sch = schedaDaManifesto(JSON.parse(r.testo)); } catch (e) { sch = { x: "manifesto non leggibile" }; }
    st.voci[id] = { ...sch, e: v.e };
    if (letti % 50 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("onb", `${letti} manifesti letti su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  if (!Object.values(st.voci).some(v => !v.s && !v.x)) st.completato = st.completato || st.aggiornato;
  salvaStato(st);
  return st;
}

// «Jahr/Datierung» dell'ÖNB: un secolo è scritto col suo primo anno («1500» per «16. Jh.»: Cod. 7447, viaggi del 1560-1569,
// ha «1500»). Un anno tondo da solo diventa quindi il secolo che comincia lì.
const ROMANI = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
export function datazioneOnb(d) {
  const m = /^\s*0?(\d{1,2})00\s*$/.exec(String(d || ""));
  return m ? `sec. ${ROMANI[+m[1] + 1]} (ÖNB: ${String(d).trim()})` : d || null;
}

export function recordOnb(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v && v.s && !v.x).map(([id, v]) => ({
    fonte: "onb", id: "onb-" + id.toLowerCase(), citta: "Vienna", biblioteca: "Österreichische Nationalbibliothek",
    segnatura: v.s, datazione: datazioneOnb(v.d) || (v.e && v.e.d) || null, titolo: v.t || (v.e && v.e.t) || null, autori_fonte: v.a || [],
    descrizione: [v.u, v.c].filter(Boolean).join(" ; ") || null, lingue: lingueDa(v.l || []), immagini: v.n || null,
    manifest: manifestoOnb(id), pagina: `https://data.onb.ac.at/rep/${id}`, licenza: "condizioni d'uso della Österreichische Nationalbibliothek" }));
}
