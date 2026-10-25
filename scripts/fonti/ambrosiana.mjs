// Veneranda Biblioteca Ambrosiana, Milano: Biblioteca Digitale (manoscritti dei fondi inf., sup., S.P., Trotti, S.R., ar.).
// Elenco: le pagine della Biblioteca Digitale nel catalogo della biblioteca (ambrosiana.comperio.it/biblioteca-digitale/?start=N,
// 20 codici per pagina, circa 1400 codici); le pagine di ricerca sono vietate dal robots.txt, queste no (Crawl-delay: 1, si usa
// la pausa di 1,5 secondi). Per ogni codice si legge una volta la scheda (/opac/detail/view/ambro:catalog:<n>, permessa):
// segnatura, datazione, lingua, descrizione fisica, unità e opere («Comprende»), nomi, e l'indirizzo della copia digitale
// (digitallibrary.unicatt.it/veneranda/<id>), da cui si ricava il manifesto IIIF (Presentation 2, CORS aperto; immagini dal
// server IIIF dell'Università Cattolica, CORS aperto: prova del 25 ottobre 2026).
// Diritti: la biblioteca dichiara i contenuti protetti dal diritto d'autore e vieta di usarli per addestrare sistemi di IA
// generativa; la consultazione è libera e gratuita. Il catalogo contiene solo i riferimenti, le immagini le apre il visore.
// Lo stato è in data/ambrosiana.json: l'elenco si rilegge ogni 6 giorni, le schede una volta sola (poi solo i codici nuovi).
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/ambrosiana.json";
export const OPAC = "https://ambrosiana.comperio.it";
export const DL = "https://digitallibrary.unicatt.it/veneranda";
const PAGINA = 20, GIORNI = 6;
export const LICENZA = "© Veneranda Biblioteca Ambrosiana: consultazione libera; contenuti protetti dal diritto d'autore, vietato l'uso per addestrare sistemi di IA generativa";

// manifesto della copia digitale: l'id (16 cifre esadecimali) diviso a coppie, come fa il visore della biblioteca
export const manifestoAmbrosiana = id => `${DL}/data/public/manifests/${String(id).match(/../g).join("/")}/${id}.json`;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => +a - +b).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, elenco: st.elenco || null, cursore: st.cursore ?? null, nuovo: st.nuovo || null, totale: st.totale || 0 });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const testo = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// pagina della Biblioteca Digitale -> { codici: [{ k, s, tipo }], ultimo: start dell'ultima pagina indicata }
export function estraiElencoAmbrosiana(html) {
  const codici = [];
  for (const b of String(html).split(/<div id="man_\d+"/).slice(1)) {
    const k = (/data-manid="ambro:catalog:(\d+)"/.exec(b) || [])[1];
    if (!k || codici.some(c => c.k === k)) continue;
    const s = testo((/<img[^>]*\balt="([^"]*)"/.exec(b) || [])[1]) || null;
    const tipo = testo((/class="doc-type-label[^"]*">([\s\S]*?)<\/span>/.exec(b) || [])[1]) || null;
    codici.push({ k, s, tipo });
  }
  const ultimo = Math.max(0, ...[...String(html).matchAll(/biblioteca-digitale\/\?start=(\d+)/g)].map(m => +m[1]));
  return { codici, ultimo };
}

// scheda del catalogo -> campi compatti della voce
export function estraiSchedaAmbrosiana(html) {
  html = String(html);
  const campo = nome => testo((new RegExp(`<strong>${nome}:<\\/strong>([\\s\\S]*?)(?:<\\/p>|<strong>|<\\/div>)`).exec(html) || [])[1]).replace(/\(\s*lingua del testo[^)]*\)/g, "").trim() || null;
  const v = {};
  const s = testo((/<meta property="og:title" content="([^"]*)"/.exec(html) || [])[1]); if (s) v.s = s;
  const tipo = testo((/class="doc-type-label[^"]*">([\s\S]*?)<\/span>/.exec(html) || [])[1]); if (tipo) v.tipo = tipo;
  const autore = testo((/<h4 class="main-author"[^>]*>([\s\S]*?)<\/h4>/.exec(html) || [])[1]); if (autore) v.a = [autore];
  const d = campo("Data"); if (d) v.d = d;
  const f = campo("Descrizione fisica"); if (f) v.f = f.slice(0, 300);
  const lingue = campo("Lingua"); if (lingue) v.l = lingue.split(/\s{2,}|;|,(?![^(]*\))/).map(x => x.trim()).filter(x => x && !/^(multilingue|non definit|non applicabile)/i.test(x));
  // unità e opere comprese: «Autore. Titolo ; 1»
  const sub = (/<ul class="sublev"[^>]*>([\s\S]*?)<\/ul>/.exec(html) || [])[1];
  if (sub) { const c = [...sub.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => testo(m[1]).replace(/\s*;\s*\d+\s*$/, "")).filter(Boolean); if (c.length) v.c = c.join(" | ").slice(0, 3000); }
  const nota = (/<div class="notes"><strong>Nota:<\/strong>([\s\S]*?)<\/div>/.exec(html) || [])[1]; if (nota) v.n = testo(nota).slice(0, 600);
  const nomi = [...html.matchAll(/var text = "([^"]*)"/g)].map(m => testo(m[1])).filter(Boolean); if (nomi.length) v.k = [...new Set(nomi)].slice(0, 30);
  v.u = [...new Set([...html.matchAll(/digitallibrary\.unicatt\.it\/veneranda\/([0-9a-f]{16})\b/g)].map(m => m[1]))];
  return v;
}

/* raccolta: elenco (ogni 6 giorni, a riprese con un cursore), poi le schede dei codici non ancora lette, finché c'è tempo */
export async function scansionaAmbrosiana({ minuti = 20, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5 || st.cursore != null) {
    if (st.cursore == null) { st.cursore = 0; st.nuovo = {}; }
    else log("ambrosiana", `riprendo l'elenco da ${st.cursore}`);
    for (;;) {
      if (Date.now() > fine) { salvaStato(st); throw new Error(`elenco incompleto (fino a ${st.cursore}): riprenderà alla prossima esecuzione`); }
      const r = await scarica(`${OPAC}/biblioteca-digitale/?start=${st.cursore}`, { timeout: 120000 });
      if (r.stato !== 200) throw new Error(`elenco: HTTP ${r.stato}`);
      const { codici, ultimo } = estraiElencoAmbrosiana(r.testo);
      for (const c of codici) st.nuovo[c.k] = { s: c.s, tipo: c.tipo };
      st.totale = Math.max(st.totale || 0, ultimo + PAGINA);
      st.cursore += PAGINA; st.aggiornato = new Date().toISOString();
      if (!codici.length || st.cursore > ultimo) break;
      salvaStato(st);
    }
    // le schede già lette restano; i codici usciti dall'elenco si tolgono
    const voci = {};
    for (const [k, c] of Object.entries(st.nuovo)) voci[k] = st.voci[k] && st.voci[k].u ? { ...st.voci[k], s: st.voci[k].s || c.s } : { s: c.s, tipo: c.tipo };
    st.voci = voci; st.totale = Object.keys(voci).length; st.elenco = st.aggiornato; st.cursore = null; delete st.nuovo;
    salvaStato(st);
    log("ambrosiana", `elenco: ${st.totale} codici`);
  }
  const da = Object.keys(st.voci).filter(k => !st.voci[k].u && !st.voci[k].x);
  let letti = 0;
  for (const k of da) {
    if (Date.now() > fine) { salvaStato(st); throw new Error(`schede lette in parte (${Object.keys(st.voci).length - da.length + letti} su ${Object.keys(st.voci).length}): riprenderà alla prossima esecuzione`); }
    const v = st.voci[k];
    let r; try { r = await scarica(`${OPAC}/opac/detail/view/ambro:catalog:${k}`, { timeout: 120000, tentativi: 3 }); } catch (e) { v.x = e.message.slice(0, 80); continue; }
    if (r.stato !== 200) { v.x = `HTTP ${r.stato}`; continue; }
    Object.assign(v, estraiSchedaAmbrosiana(r.testo));
    if (!v.u.length) { delete v.u; v.x = "nessuna copia digitale nella scheda"; }
    letti++;
    if (letti % 20 === 0) { st.aggiornato = new Date().toISOString(); salvaStato(st); log("ambrosiana", `${letti} schede lette su ${da.length}`); }
  }
  st.aggiornato = new Date().toISOString();
  salvaStato(st);
  return st;
}

// voci del catalogo: una per copia digitale; solo i manoscritti (l'etichetta del catalogo è «Manoscritti antichi»)
export function recordAmbrosiana(st = leggiStato()) {
  const out = [], visti = new Set();
  for (const [k, v] of Object.entries((st && st.voci) || {})) {
    if (!v || !v.u || !v.u.length) continue;
    if (v.tipo && !/manoscritt/i.test(v.tipo)) continue;
    for (const u of v.u) {
      if (visti.has(u)) continue;
      visti.add(u);
      const lingue = lingueDa(v.l || []).filter(c => c !== "xx");
      out.push({ fonte: "ambrosiana", id: `amb-${u}`, citta: "Milano", biblioteca: "Veneranda Biblioteca Ambrosiana", segnatura: v.s || `ambro:catalog:${k}`,
        datazione: v.d || null, titolo: (v.c || "").split(" | ").filter(x => x && !/unit[àa] codicologica/i.test(x)).slice(0, 4).join(" ; ") || null, autori_fonte: v.a || [], collaboratori: v.k || [],
        descrizione: [v.f, v.c, v.n].filter(Boolean).join(" ; ").slice(0, 4000) || null, lingue,
        manifest: manifestoAmbrosiana(u), pagina: `${OPAC}/opac/detail/view/ambro:catalog:${k}`, licenza: LICENZA });
    }
  }
  return out;
}
