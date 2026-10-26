// Wellcome Collection, Londra: API pubblica del catalogo (api.wellcomecollection.org/catalogue/v2/works, JSON, nessun robots.txt;
// metadati CC BY 4.0). Si leggono solo i manoscritti con copia digitale («availabilities=online»):
//  - tipo «b» (Manuscripts): codici occidentali (MS.<n>), orientali (sanscriti, singalesi, tibetani, persiani...), ricettari;
//  - tipo «h» (Archives and manuscripts), solo le schede di primo livello (senza «partOf») il cui titolo è una segnatura di codice
//    («MS Arabic 177», «MS Hebrew A21», «MS.MSL.52», «MS.144», «MS Ethiopian 5»...): i codici arabi, ebraici, greci, latini,
//    etiopici, malesi, giapponesi catalogati nel sistema d'archivio; le loro parti (opere, fascicoli) non sono voci a sé.
// Manifesto IIIF: quello indicato dalla scheda (iiif.wellcomecollection.org/presentation/v2/<b-number>), CORS aperto su manifesti
// e immagini (prova del 26 ottobre 2026); mai letto dal server (il robots.txt di iiif.wellcomecollection.org chiede 30 secondi).
// Entrano solo le copie ad accesso aperto («open»), con la licenza della scheda. Fuori lettere, carte d'archivio, effimeri.
// Stato in data/wellcome.json: raccolta completa (circa 45 pagine da 100 schede) ogni 6 giorni.
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";
import { leggiJson, salvaJson } from "./cudl-piattaforma.mjs";

export const FILE_STATO = "data/wellcome.json";
export const API = "https://api.wellcomecollection.org/catalogue/v2/works";
const GIORNI = 6;
const INCLUDE = "items,languages,production,contributors,genres,partOf,notes";
export const RICERCHE = [
  { nome: "b", parametri: { workType: "b", availabilities: "online" } },
  { nome: "h", parametri: { workType: "h", availabilities: "online", query: "MS" } },
];
// titolo di una scheda d'archivio di primo livello che è la segnatura di un codice
export const SEGNATURA_CODICE = /^(Greek\s+)?MSS?(\.|\s)?\s*(MSL\.\s*)?([A-Z][a-z]+\s+)?[A-Z]?\d+[a-z]?$/;

export const leggiStato = () => leggiJson(FILE_STATO, { voci: {} });
const salva = st => salvaJson(FILE_STATO, st, ["aggiornato", "completato", "cursore", "totali"]);
const pulito = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\[\/?i\]/g, "").replace(/\s+/g, " ").trim();

// scheda della API -> voce compatta (null se non entra: senza copia IIIF aperta, parte d'archivio...)
export function compattaWellcome(w, ricerca) {
  if (!w || !w.id) return null;
  if (ricerca === "h" && ((w.partOf || []).length || !SEGNATURA_CODICE.test(pulito(w.title)))) return null;
  let m = null, r = null, scaffale = null;
  for (const it of w.items || []) for (const l of it.locations || []) {
    if (l.type === "PhysicalLocation" && l.shelfmark && !scaffale) scaffale = l.shelfmark;
    if (l.locationType && l.locationType.id === "iiif-presentation" && !m) {
      const aperto = (l.accessConditions || []).every(a => !a.status || a.status.id === "open");
      if (aperto) { m = l.url; r = l.license ? l.license.label : null; }
    }
  }
  if (!m) return null;
  const g = (w.genres || []).map(x => x.label);
  const v = { s: ricerca === "h" ? pulito(w.title) : (scaffale || w.referenceNumber || null), t: ricerca === "h" ? null : pulito(w.title).slice(0, 400),
    d: (w.production || []).map(p => p.dates && p.dates[0] ? p.dates[0].label : p.label).filter(Boolean)[0] || null,
    l: (w.languages || []).map(x => x.label), a: (w.contributors || []).map(c => c.agent && c.agent.label).filter(Boolean).slice(0, 8),
    c: pulito(w.description).slice(0, 1200) || null, m, r, g: g.slice(0, 4), y: ricerca };
  if (ricerca === "h" && w.description) v.t = pulito(w.description).slice(0, 200);
  return v;
}

const NON_LIBRARI = /\b(letters?|correspondence|papers|photographs?|deeds?|receipts?|certificates?|ephemera|archives?)\b/i;
export function motivoWellcome(v) {
  if (!v || !v.m) return "senza copia digitale aperta";
  if ((v.g || []).some(g => /^(Archives|Ephemera|Photographs|Letters)/i.test(g))) return "carte d'archivio";
  if (v.y === "b" && NON_LIBRARI.test(v.t || "") && !/\b(book|recipes?|receipts? book|commonplace)\b/i.test(v.t || "")) return "carte non librarie";
  return null;
}

export async function scansionaWellcome({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  if (st.completato && !st.cursore && Date.now() - Date.parse(st.completato) < GIORNI * 864e5) { log("wellcome", `riuso la raccolta del ${st.completato.slice(0, 10)}`); return st; }
  const fine = Date.now() + minuti * 60e3;
  if (!st.cursore) st.cursore = { r: 0, p: 1, voci: {} };
  st.totali = st.totali || {};
  for (; st.cursore.r < RICERCHE.length; st.cursore.r++, st.cursore.p = 1) {
    const R = RICERCHE[st.cursore.r];
    for (;;) {
      if (Date.now() > fine) { salva(st); throw new Error(`raccolta incompleta (ricerca ${R.nome}, pagina ${st.cursore.p}): riprenderà alla prossima esecuzione`); }
      const q = new URLSearchParams({ ...R.parametri, include: INCLUDE, pageSize: "100", page: String(st.cursore.p) });
      const r = await scarica(`${API}?${q}`, { timeout: 120000, accept: "application/json" });
      if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
      const d = JSON.parse(r.testo);
      st.totali[R.nome] = d.totalResults;
      for (const w of d.results || []) { const v = compattaWellcome(w, R.nome); if (v && !st.cursore.voci[w.id]) st.cursore.voci[w.id] = v; }
      st.aggiornato = new Date().toISOString(); salva(st);
      if (!d.nextPage || st.cursore.p >= (d.totalPages || 0)) break;
      st.cursore.p++;
    }
  }
  st.voci = st.cursore.voci; st.cursore = null;
  st.completato = st.aggiornato = new Date().toISOString();
  salva(st);
  log("wellcome", `fine: ${Object.keys(st.voci).length} codici con copia digitale aperta`);
  return st;
}

export function recordWellcome(st = leggiStato()) {
  const out = [];
  for (const [id, v] of Object.entries(st.voci || {})) {
    if (motivoWellcome(v)) continue;
    out.push({ fonte: "wellcome", id: "wel-" + id, citta: "Londra", biblioteca: "Wellcome Collection", segnatura: v.s || id, datazione: v.d || null,
      titolo: v.t || null, autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []), manifest: v.m,
      pagina: `https://wellcomecollection.org/works/${id}`, licenza: v.r ? `Wellcome Collection, ${v.r}` : "Wellcome Collection (condizioni della scheda)" });
  }
  return out;
}
