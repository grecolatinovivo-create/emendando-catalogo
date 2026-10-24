// Richieste rispettose verso i server delle biblioteche: in serie, con pausa minima per dominio,
// user-agent identificativo, nuovi tentativi con attesa crescente, cache su disco.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const UA = "Emendando catalogo (https://www.emendando.com; https://github.com/grecolatinovivo-create/emendando-catalogo)";
export const CACHE = process.env.CATALOGO_CACHE || path.resolve(".cache/catalogo");
const PAUSA = { "digi.vatlib.it": 10000 };          // Crawl-delay: 10 nel robots.txt della Vaticana
const PAUSA_BASE = +process.env.CATALOGO_PAUSA_MS || 1500;
const ultimo = new Map();
const attendi = ms => new Promise(r => setTimeout(r, ms));

export function log(...a) { if (!process.env.CATALOGO_SILENZIO) console.error(new Date().toISOString().slice(11, 19), ...a); }

async function turno(host) {
  const p = PAUSA[host] ?? PAUSA_BASE, t = ultimo.get(host) || 0, ora = Date.now();
  if (ora - t < p) await attendi(p - (ora - t));
  ultimo.set(host, Date.now());
}

/* scarica un testo. opz: {range: byte massimi letti (Range), cache: giorni di validità (0 = nessuna), tentativi}
   restituisce {stato, testo}; 404 e 410 non sono errori (stato nel risultato) */
export async function scarica(url, opz = {}) {
  const giorni = opz.cache ?? 0, file = path.join(CACHE, "http", crypto.createHash("sha1").update(url + "|" + (opz.range || "")).digest("hex") + ".json");
  if (giorni > 0) {
    try { const c = JSON.parse(fs.readFileSync(file, "utf8")); if (Date.now() - c.quando < giorni * 864e5) return c; } catch (e) {}
  }
  const host = new URL(url).hostname, tentativi = opz.tentativi ?? 4;
  let errore;
  for (let k = 0; k < tentativi; k++) {
    await turno(host);
    try {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), opz.timeout || 90000);
      const h = { "user-agent": UA, accept: opz.accept || "*/*" };
      if (opz.range) h.range = `bytes=0-${opz.range - 1}`;
      const r = await fetch(url, { headers: h, signal: ctl.signal, redirect: "follow" });
      let testo = "";
      if (opz.range && r.body) {
        // lettura parziale: ci si ferma appena si ha abbastanza (anche se il server ignora Range)
        const rd = r.body.getReader(), dec = new TextDecoder();
        while (testo.length < opz.range) { const { done, value } = await rd.read(); if (done) break; testo += dec.decode(value, { stream: true }); if (opz.basta && opz.basta(testo)) break; }
        try { await rd.cancel(); } catch (e) {}
      } else testo = await r.text();
      clearTimeout(timer);
      if (r.status === 429 || r.status >= 500) { errore = new Error(`HTTP ${r.status} ${url}`); await attendi(5000 * 2 ** k); continue; }
      const ris = { stato: r.status, testo: r.ok || r.status === 206 ? testo : "", quando: Date.now() };
      if (giorni > 0 && (r.ok || r.status === 206 || r.status === 404)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(ris)); }
      return ris;
    } catch (e) { errore = e; await attendi(5000 * 2 ** k); }
  }
  throw errore;
}

// stato di ripresa di una fonte (.cache/catalogo/stato-<fonte>.json)
export function statoFonte(fonte) {
  const f = path.join(CACHE, `stato-${fonte}.json`);
  let s = null; try { s = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) {}
  return { dati: s, salva(d) { fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(f + ".tmp", JSON.stringify(d)); fs.renameSync(f + ".tmp", f); } };
}

// utilità XML minime per l'OAI-PMH (oai_dc è piatto: niente parser esterni)
export const decodifica = s => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export function tag(xml, nome) {
  const re = new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, "g"); const out = []; let m;
  while ((m = re.exec(xml))) out.push(decodifica(m[1]));
  return out;
}
export const records = xml => xml.match(/<record>[\s\S]*?<\/record>/g) || [];
export function token(xml) { const m = /<resumptionToken[^>]*>([^<]+)<\/resumptionToken>/.exec(xml); return m ? m[1].trim() : null; }
export function totale(xml) { const m = /completeListSize="(\d+)"/.exec(xml); return m ? +m[1] : null; }

/* raccolta OAI-PMH con ripresa: salva lo stato dopo ogni pagina; se completata da meno di `giorni`, riusa i record.
   estrai(recordXml) -> oggetto o null */
export async function raccogliOai({ fonte, base, set, prefisso = "oai_dc", estrai, giorni = 6, limiteMinuti = 0, soloCache = false }) {
  const st = statoFonte(fonte), ora = Date.now();
  let d = st.dati;
  if (soloCache) { if (!d || !d.completato) throw new Error("nessuna raccolta completa in cache"); return d.voci; }
  if (d && d.completato && ora - d.completato < giorni * 864e5) { log(fonte, `riuso la raccolta del ${new Date(d.completato).toISOString().slice(0, 10)}: ${d.voci.length} record`); return d.voci; }
  if (!d || d.completato || !d.token || ora - d.aggiornato > 20 * 3600e3) d = { iniziato: ora, aggiornato: ora, token: null, pagine: 0, voci: [] };
  else log(fonte, `riprendo dalla pagina ${d.pagine + 1} (${d.voci.length} record già letti)`);
  const fine = limiteMinuti ? ora + limiteMinuti * 60e3 : Infinity;
  for (;;) {
    const url = d.token ? `${base}?verb=ListRecords&resumptionToken=${encodeURIComponent(d.token)}` : `${base}?verb=ListRecords&metadataPrefix=${prefisso}&set=${encodeURIComponent(set)}`;
    const r = await scarica(url, { timeout: 180000 });
    if (r.stato !== 200) throw new Error(`${fonte}: HTTP ${r.stato}`);
    if (/<error code="badResumptionToken"/.test(r.testo)) { log(fonte, "token scaduto: ricomincio"); d = { iniziato: Date.now(), aggiornato: Date.now(), token: null, pagine: 0, voci: [] }; continue; }
    for (const rec of records(r.testo)) { if (/status="deleted"/.test(rec)) continue; const v = estrai(rec); if (v) d.voci.push(v); }
    d.pagine++; d.token = token(r.testo); d.aggiornato = Date.now();
    if (d.pagine % 10 === 0) log(fonte, `pagina ${d.pagine}${totale(r.testo) ? " su circa " + Math.ceil(totale(r.testo) / Math.max(1, records(r.testo).length)) : ""}, ${d.voci.length} record utili`);
    if (!d.token) { d.completato = Date.now(); st.salva(d); break; }
    st.salva(d);
    // raccolta incompleta: si segnala come errore, così restano le voci del catalogo precedente
    if (Date.now() > fine) { log(fonte, "tempo esaurito: la raccolta riprenderà dalla pagina", d.pagine + 1); throw new Error(`raccolta incompleta (${d.pagine} pagine): riprenderà alla prossima esecuzione`); }
  }
  return d.voci;
}
