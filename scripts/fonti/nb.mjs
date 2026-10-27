// Nasjonalbiblioteket, Oslo: manoscritti della Håndskriftsamlingen (codici, frammenti latini medievali «Ms.lat.fragm.», manoscritti
// orientali, manoscritti letterari e scientifici, quaderni), manoscritti musicali (Mus.ms.) e carte geografiche. Dal 27 ottobre 2026,
// corsia «nord».
// Elenco: API pubblica del catalogo (api.nb.no/catalog/v1/items, nessun robots.txt su api.nb.no; quello di www.nb.no chiede 4 secondi
// tra le richieste e si rispetta anche qui), lettura con «scroll» (searchAfter), 100 schede per pagina, solo le copie digitali
// aperte a tutti (contentClasses «public» e «jp2»: «accessAllowedFrom: EVERYWHERE»):
//   - «privatarkivmateriale» senza le lettere (title:brev escluso già nella ricerca: circa 34.000 lettere su 41.000 schede);
//   - «musikkmanuskripter» (manoscritti musicali);
//   - «kart» (carte geografiche): per ognuna si legge una volta la scheda MODS (typeOfResource manuscript="yes") per distinguere
//     le carte disegnate a mano («carta») da quelle a stampa («carta_stampa»).
// Manifesti IIIF Presentation 2 della biblioteca (api.nb.no/catalog/v1/iiif/<id>/manifest) e immagini (www.nb.no/services/image)
// con CORS aperto (verificato il 27 ottobre 2026). Licenze: per lo più CC BY-NC-ND (manoscritti), pubblico dominio (carte).
// Restano fuori (motivoNb): lettere e telegrammi rimasti, testamenti, contratti, conti, diplomi e attestati, cataloghi di manoscritti,
// ritagli e fotografie, le schede senza immagini.
// Stato in data/nb.json, a riprese (cursore { l: elenco, u: pagina seguente }, poi le schede MODS delle carte); elenco ogni 14 giorni.
import { scarica, log } from "../rete.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/nb.json";
export const API = "https://api.nb.no/catalog/v1";
const GIORNI = 14, PAUSA = 2500;   // + 1,5 secondi di rete.mjs = 4 secondi (Crawl-delay di www.nb.no)
const attendi = ms => new Promise(r => setTimeout(r, ms));
// [sigla, ricerca]
export const ELENCHI = [
  ["a", "q=*%20-title:brev&filter=mediatype:privatarkivmateriale"],
  ["m", "q=*&filter=mediatype:musikkmanuskripter"],
  ["k", "q=*&filter=mediatype:kart"],
];

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "elenco", "completato", "totale", "cursore", "nuove"]);

async function json(url) {
  await attendi(PAUSA);
  const r = await scarica(url, { timeout: 120000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`HTTP ${r.stato} ${url}`);
  return JSON.parse(r.testo);
}

const pulito = s => String(s ?? "").replace(/\s+/g, " ").trim();
// «Ms.fol. 1988 Brev fra …» -> ["Ms.fol. 1988", "Brev fra …"]
const SEGNATURA = /^((?:Ms|Mus|Brevs|TSarkA|Privatarkiv|Ubehandlet)(?:\.[\w°]+)*\.?\s+\d+[a-zA-Z]?(?::[\w:]+)?)\s+(.*)$/;
export function divisoNb(titolo) {
  const t = pulito(titolo), m = SEGNATURA.exec(t);
  return m ? [m[1], m[2].replace(/\s*NBdigital: DokID: \d+\.?/g, "").trim()] : [null, t];
}
// scheda dell'elenco -> voce compatta { e: elenco, t: titolo (con segnatura), d: data, n: pagine, a: autori, c: classi di contenuto }
export function compattaNb(it, elenco) {
  const m = it.metadata || {}, v = { e: elenco, t: pulito(m.title) || null, d: m.dateCreated || (m.originInfo || {}).issued || null, n: m.pageCount || 0,
    a: [].concat(m.creators || []).map(pulito).filter(Boolean), lic: (it.accessInfo || {}).license || null };
  for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
  return v;
}
const aperta = it => { const c = (it.metadata || {}).contentClasses || [], a = it.accessInfo || {}; return c.includes("public") && c.includes("jp2") && a.accessAllowedFrom === "EVERYWHERE" && a.isDigital !== false; };

export async function scansionaNb({ minuti = 60, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  st.voci = st.voci || {};
  const fine = Date.now() + minuti * 60e3;
  if (!st.cursore && (!st.elenco || Date.now() - Date.parse(st.elenco) > GIORNI * 864e5)) { st.cursore = { l: 0, u: null }; st.nuove = {}; }
  // 1. elenchi (a riprese)
  while (st.cursore) {
    if (Date.now() > fine) { st.aggiornato = new Date().toISOString(); salva(st); throw new Error(`elenco letto in parte (elenco ${st.cursore.l + 1} di ${ELENCHI.length}): riprenderà alla prossima esecuzione`); }
    const [sigla, ricerca] = ELENCHI[st.cursore.l];
    const url = st.cursore.u || `${API}/items?${ricerca}&filter=contentClasses:public&filter=contentClasses:jp2&size=100&scroll=true`;
    const j = await json(url), its = (j._embedded || {}).items || [];
    st.nuove = st.nuove || {};
    for (const it of its) if (it && it.id && aperta(it)) {
      const v = compattaNb(it, sigla), prima = st.voci[it.id];
      if (prima && prima.k) v.k = prima.k;   // tipo della carta già letto dalla scheda MODS
      st.nuove[it.id] = v;
    }
    const dopo = ((j._links || {}).next || {}).href;
    if (its.length && dopo) st.cursore.u = dopo;
    else if (st.cursore.l + 1 < ELENCHI.length) st.cursore = { l: st.cursore.l + 1, u: null };
    else {
      st.voci = st.nuove; delete st.nuove; st.cursore = null; st.totale = Object.keys(st.voci).length;
      st.elenco = new Date().toISOString();
      if (Object.values(st.voci).some(v => v.e === "k" && !v.k)) st.completato = null;
      log("nb", `elenco: ${st.totale} schede con copia digitale aperta`);
    }
    st.aggiornato = new Date().toISOString(); salva(st);
  }
  // 2. carte: manoscritta o a stampa (scheda MODS, una volta)
  const carte = Object.entries(st.voci).filter(([, v]) => v.e === "k" && !v.k);
  let lette = 0, errori = 0;
  for (const [id, v] of carte) {
    if (Date.now() > fine) break;
    try {
      await attendi(PAUSA);
      const r = await scarica(`${API}/metadata/${id}/mods`, { timeout: 120000, accept: "application/xml" });
      if (r.stato !== 200) { v.k = "x"; continue; }
      v.k = /<typeOfResource[^>]*manuscript="yes"/.test(r.testo) ? "m" : "s";
      const lingua = (/<languageTerm[^>]*type="code"[^>]*>([a-z]{3})</.exec(r.testo) || [])[1];
      if (lingua) v.l = lingua;
      lette++; errori = 0;
    } catch (e) { log("nb", id, e.message); if (++errori >= 5) break; continue; }
    if (lette % 50 === 0) { st.aggiornato = new Date().toISOString(); salva(st); log("nb", `carte: ${lette} schede MODS lette su ${carte.length}`); }
  }
  const resto = Object.values(st.voci).filter(v => v.e === "k" && !v.k).length;
  st.aggiornato = new Date().toISOString();
  if (!resto) st.completato = st.completato || st.aggiornato;
  salva(st);
  log("nb", `${recordNb(st).length} manoscritti e carte (${resto ? `mancano ${resto} schede MODS di carte` : "carte lette tutte"})`);
  if (resto) throw new Error(`carte lette in parte (mancano ${resto} schede MODS): riprenderà alla prossima esecuzione`);
  return st;
}

// motivo per cui una voce resta fuori (null = ammessa). Dei manoscritti («privatarkivmateriale») entrano solo le segnature della
// Håndskriftsamlingen («Ms.fol.», «Ms.4°», «Ms.8°», «Ms.BB», «Ms.forelesn.», «Ms.lat.fragm.» e simili); fuori lettere («Brevs.»),
// disegni e tavole («Ms.plv.»), archivi del teatro («TSarkA»), della sezione musicale («Mus.arkiv»: cataloghi e protocolli), fondi
// non ordinati e, come per Copenaghen (scripts/fonti/kbdk.mjs), lettere, diari, conti, carte d'archivio, bozze di stampa e ritagli.
const LETTERE = /\bbrev(?:e|et|ene)?\b|\bbrevkort|brevveksling|korrespondanse|\btelegram(?:mer)?\b|\bletters?\b|\blettres?\b|\bbriefe?\b|\bepistola[e]? ad\b/i;
const ARCHIVIO = /\barkiv(?:alia)?\b|\barchiv\b|etterlatte papirer|\bpapirer\b|\bdagb[øo]k(?:er)?\b|\bdagbog\b|\bregnskap|\bkassebok|\bkvittering|\bskj[øo]te\b|\btestamente?\b|\bkontrakt|\bdokumenter\b|\battest(?:er)?\b|\bvitnem[åa]l|\butnevnelse|\bdiplom(?:er)?\b|\bpass\b|\bvisittkort|\bfotografi|\bfoto\b|\bkonvolutt|\butklipp|\bavisutklipp|\bkorrektur|\bplakat(?:er)?\b|\bakvarell|\bplansjer\b|originaltegning|\btegning(?:er)?\b|\bskisse(?:r)?\b|\bmanuskriptkatalog|\bkortprotokoll|\bkatalog over\b/i;
export function motivoNb(v) {
  if (!v) return "senza dati";
  if (!v.n) return "senza immagini";
  if (v.e === "k") return v.k === "x" ? "scheda MODS non leggibile" : v.k ? null : "carta da controllare";
  const [s, t] = divisoNb(v.t);
  if (v.e === "a" && (!/^Ms\./.test(s || "") || /^Ms\.plv\./.test(s || ""))) return "lettere, disegni e archivi";
  if (LETTERE.test(t || "")) return "lettere";
  if (ARCHIVIO.test(t || "")) return "carte d'archivio, diari, conti, disegni";
  return null;
}
export const ammessaNb = v => motivoNb(v) == null;

const LINGUE = { nor: "no", nob: "no", nno: "no", dan: "da", swe: "sv", lat: "la", ger: "de", eng: "en", fre: "fr", ita: "it", ice: "is", dut: "nl", spa: "es" };
export function recordNb(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaNb(v)).map(([id, v]) => {
    const [s, t] = divisoNb(v.t);
    const d = /^\d{4}/.test(v.d || "") ? String(v.d).slice(0, 4) : null;
    return { fonte: "nb", id: "nb-" + id, citta: "Oslo", biblioteca: "Nasjonalbiblioteket", segnatura: s || t || id, datazione: d, titolo: (s ? t : t) || null,
      tipo: v.e === "k" ? (v.k === "m" ? "carta" : "carta_stampa") : null, autori_fonte: v.a || [],
      descrizione: v.e === "m" ? "Manoscritto musicale" : null, lingue: v.l && LINGUE[v.l] ? [LINGUE[v.l]] : [], immagini: v.n || null,
      manifest: `${API}/iiif/${id}/manifest`, pagina: `https://www.nb.no/items/${id}`,
      licenza: v.lic === "publicdomain" ? "Nasjonalbiblioteket (pubblico dominio)" : v.lic === "ccbyncnd" ? "Nasjonalbiblioteket, CC BY-NC-ND" : "Nasjonalbiblioteket" };
  });
}
