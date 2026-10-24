// Gallica / Bibliothèque nationale de France: manoscritti dei fondi Latin e Nouvelles acquisitions latines.
// Interfaccia SRU di Gallica (https://gallica.bnf.fr/SRU, risposta in Dublin Core), 50 record per pagina,
// con ripresa da .cache/catalogo/stato-gallica.json e riuso della raccolta completa per 6 giorni.
// Manifesto IIIF: https://gallica.bnf.fr/iiif/ark:/12148/<id>/manifest.json
import { scarica, statoFonte, tag, log } from "../rete.mjs";

export const BASE = "https://gallica.bnf.fr/SRU";
export const QUERY = 'dc.type all "manuscrit" and (dc.source all "latin" or dc.source all "latine")';
const PAGINA = 50;

// «Bibliothèque nationale de France. Département des Manuscrits. Latin 7899» -> «Latin 7899»
export function segnaturaGallica(fonti) {
  for (const s of fonti) {
    const m = /D[ée]partement des manuscrits[.,]?\s*((?:Latin|Nouvelle acquisition latine|NAL|Smith-Lesouëf latin)\s*[0-9][0-9A-Za-z ()-]*)/i.exec(s);
    if (m) return m[1].replace(/\s+/g, " ").replace(/[ ,.;-]+$/, "").trim();
  }
  return null;
}

export function estraiGallica(rec) {
  if (!tag(rec, "dc:type").some(t => /manuscrit/i.test(t))) return null;
  const seg = segnaturaGallica(tag(rec, "dc:source")); if (!seg) return null;
  const lingue = tag(rec, "dc:language");
  if (lingue.length && !lingue.some(l => /^(lat|latin|la)$/i.test(l.trim()))) return null;
  const pagina = tag(rec, "dc:identifier").find(x => /gallica\.bnf\.fr\/ark:\/12148\//.test(x)); if (!pagina) return null;
  const ark = /ark:\/12148\/([a-z0-9]+)/i.exec(pagina)[1];
  return { fonte: "gallica", id: "bnf-" + ark, citta: "Paris", biblioteca: "Bibliothèque nationale de France", segnatura: seg,
    datazione: tag(rec, "dc:date")[0] || null, titolo: tag(rec, "dc:title").join(" ; ").slice(0, 600) || null, autori_fonte: tag(rec, "dc:creator"),
    descrizione: [...tag(rec, "dc:description"), ...tag(rec, "dc:subject")].join(" ; ").slice(0, 3000),
    manifest: `https://gallica.bnf.fr/iiif/ark:/12148/${ark}/manifest.json`, pagina: `https://gallica.bnf.fr/ark:/12148/${ark}`,
    licenza: /domaine public|public domain/i.test(tag(rec, "dc:rights").join(" ")) ? "Domaine public (Gallica, conditions d'utilisation)" : (tag(rec, "dc:rights")[0] || null) };
}

export async function raccogliGallica({ limiteMinuti = 0, soloCache = false, giorni = 6 } = {}) {
  const st = statoFonte("gallica"), ora = Date.now();
  let d = st.dati;
  if (soloCache) { if (!d || !d.completato) throw new Error("nessuna raccolta completa in cache"); return d.voci; }
  if (d && d.completato && ora - d.completato < giorni * 864e5) { log("gallica", `riuso la raccolta del ${new Date(d.completato).toISOString().slice(0, 10)}: ${d.voci.length} record`); return d.voci; }
  if (!d || d.completato || ora - d.aggiornato > 3 * 864e5) d = { iniziato: ora, aggiornato: ora, inizio: 1, voci: [] };
  else log("gallica", `riprendo dal record ${d.inizio} (${d.voci.length} già letti)`);
  const fine = limiteMinuti ? ora + limiteMinuti * 60e3 : Infinity;
  for (;;) {
    const url = `${BASE}?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(QUERY)}&startRecord=${d.inizio}&maximumRecords=${PAGINA}`;
    const r = await scarica(url, { timeout: 120000, accept: "application/xml,text/xml" });
    if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
    if (!/searchRetrieveResponse/.test(r.testo)) throw new Error("risposta non SRU (blocco o pagina di errore)");
    const recs = r.testo.match(/<srw:record>[\s\S]*?<\/srw:record>/g) || [];
    for (const rec of recs) { const v = estraiGallica(rec); if (v) d.voci.push(v); }
    const tot = +((/<srw:numberOfRecords>(\d+)/.exec(r.testo) || [])[1] || 0);
    d.inizio += PAGINA; d.aggiornato = Date.now(); d.totale = tot;
    if ((d.inizio - 1) % 1000 === 0) log("gallica", `${d.inizio - 1} su ${tot}, ${d.voci.length} codici latini`);
    if (!recs.length || d.inizio > tot) { d.completato = Date.now(); st.salva(d); break; }
    st.salva(d);
    if (Date.now() > fine) throw new Error(`raccolta incompleta (${d.inizio - 1} su ${tot}): riprenderà alla prossima esecuzione`);
  }
  // un codice può comparire con più record (volumi, riproduzioni): uno per ark
  return [...new Map(d.voci.map(v => [v.id, v])).values()];
}
