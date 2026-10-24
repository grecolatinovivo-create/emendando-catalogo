// Fonti OAI-PMH: Heidelberg (digi.ub.uni-heidelberg.de), e-codices, Bayerische Staatsbibliothek (BDR).
// Ogni estrattore restituisce un record compatto, già filtrato (solo manoscritti, lingua latina o non indicata).
import { tag, raccogliOai } from "../rete.mjs";

const LATINO = new Set(["la", "lat", "x-unknown", "und", "mul", "zxx", "mis", "", "latin", "latein"]);
const latinoPossibile = lingue => !lingue.length || lingue.some(l => LATINO.has(l.toLowerCase().trim()));
export function licenza(r) {
  const s = String(r || "");
  if (/publicdomain\/mark/i.test(s) || /public domain/i.test(s)) return "Public Domain Mark 1.0";
  const m = /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(s); if (m) return "CC " + m[1].toUpperCase() + " " + m[2];
  if (/CC-BY-NC/i.test(s)) return "CC BY-NC 4.0";
  if (/rightsstatements\.org\/vocab\/([A-Za-z-]+)/.test(s)) return s;
  return s || null;
}
// «Città, Biblioteca, Segnatura»: la segnatura può contenere virgole (Cod. Sal. VIII,12)
function luogo(s) {
  const p = s.split(", ");
  if (p.length >= 3) return { citta: p[0], biblioteca: p[1], segnatura: p.slice(2).join(", ") };
  if (p.length === 2) return { citta: null, biblioteca: p[0], segnatura: p[1] };
  return { citta: null, biblioteca: null, segnatura: s };
}

// ---------------------------------------------------------------- Heidelberg
export function estraiHeidelberg(rec) {
  const tipo = tag(rec, "dc:type"); if (!tipo.some(t => /manuscript/i.test(t))) return null;
  if (!latinoPossibile(tag(rec, "dc:language"))) return null;
  const tit = tag(rec, "dc:title")[0] || "";
  const i = tit.indexOf(": "), sx = i > 0 ? tit.slice(0, i) : tit, contenuto = i > 0 ? tit.slice(i + 2) : "";
  if (/Papyrussammlung|Ostraka|Briefe? |Brief von|Postkarte|Urk\.|Urkunde|Universitätsarchiv|Prinzhorn|Kathmandu|Erwerbungsb/i.test(sx)) return null;
  const id = tag(rec, "dc:identifier").find(x => /\/diglit\//.test(x)); if (!id) return null;
  const slug = id.split("/diglit/")[1].replace(/\/.*/, "");
  const man = tag(rec, "dc:hasFormat").find(x => /iiif.*manifest/.test(x)) || `https://digi.ub.uni-heidelberg.de/diglit/iiif/${slug}/manifest.json`;
  const L = luogo(sx);
  if (!L.citta && /Mainz/.test(L.biblioteca || "")) L.citta = "Mainz";
  return { fonte: "heidelberg", id: "hd-" + slug, ...L, datazione: tag(rec, "dc:date")[0] || null, titolo: contenuto || null,
    autori_fonte: tag(rec, "dc:creator"), manifest: man, pagina: id, licenza: licenza(tag(rec, "dc:rights")[0]) };
}
export const raccogliHeidelberg = (o = {}) => raccogliOai({ fonte: "heidelberg", base: "https://digi.ub.uni-heidelberg.de/cgi-bin/digioai.cgi", set: "handschriften", estrai: estraiHeidelberg, ...o });

// ---------------------------------------------------------------- e-codices
export function estraiEcodices(rec) {
  if (!tag(rec, "dc:type").some(t => /manuscript/i.test(t))) return null;
  if (!latinoPossibile(tag(rec, "dc:language"))) return null;
  const tit = tag(rec, "dc:title")[0] || "";
  const ids = tag(rec, "dc:identifier");
  const pagina = ids.find(x => /^https?:\/\/(www\.)?e-codices/.test(x)) || null;
  const m = pagina && /\/one\/([^/]+)\/([^/?#]+)/.exec(pagina); if (!m) return null;
  const sigla = `${m[1]}-${m[2]}`;
  const rel = tag(rec, "dc:relation").find(x => /IIIF Manifest:/i.test(x));
  const man = rel ? rel.replace(/^.*IIIF Manifest:\s*/i, "").trim() : `https://www.e-codices.unifr.ch/metadata/iiif/${sigla}/manifest.json`;
  const i = tit.indexOf(" : "), sx = i > 0 ? tit.slice(0, i) : tit;
  const L = luogo(ids.find(x => !/^(doi:|https?:)/.test(x)) || sx);
  const desc = tag(rec, "dc:description").filter(d => !/^Online Since/i.test(d));
  return { fonte: "ecodices", id: "ec-" + sigla, ...L, datazione: (tag(rec, "dc:date")[0] || "").split(" :: ")[0] || null,
    titolo: i > 0 ? tit.slice(i + 3) : null, autori_fonte: tag(rec, "dc:creator"), descrizione: desc.join(" ").slice(0, 3000),
    manifest: man.replace(/^https:\/\/e-codices\.ch\//, "https://www.e-codices.unifr.ch/"), pagina,
    licenza: licenza(tag(rec, "dc:rights").find(r => /^Images:/i.test(r)) || ""), anteprima: tag(rec, "dc:preview_page")[0] || null };
}
export const raccogliEcodices = (o = {}) => raccogliOai({ fonte: "ecodices", base: "https://www.e-codices.unifr.ch/oai/oai.php", set: "all", estrai: estraiEcodices, ...o });

// ---------------------------------------------------------------- Bayerische Staatsbibliothek (Bavarian Digital Repository, set cerl = manoscritti)
export function estraiBsb(rec) {
  const desc = tag(rec, "dc:description");
  const ex = desc.find(d => /Exemplar mit der Signatur:/.test(d));
  const seg = ex ? ex.replace(/^.*Exemplar mit der Signatur:\s*/, "").replace(/^.*?--\s*/, "").trim() : null;
  if (!seg || !/^Clm\s/.test(seg)) return null;                 // solo Codices latini monacenses
  if (!latinoPossibile(tag(rec, "dc:language"))) return null;
  // un record può citare più digitalizzati: il codice e i volumi a stampa del catalogo che lo descrivono;
  // la scelta si fa dopo la raccolta (unisciBsb), scartando gli identificativi comuni a molte segnature
  const urn = [...new Set(tag(rec, "dc:identifier").map(x => (/(bsb\d{8})/.exec(x) || [])[1]).filter(Boolean))]; if (!urn.length) return null;
  const bsb = urn[0];
  const tit = tag(rec, "dc:title")[0] || "";
  const titolo = tit.replace(/\s+-\s+BSB\s+[^:]+/, "").replace(/\s+:\s+/, ": ").trim();
  return { fonte: "bsb", id: "bsb-" + bsb, citta: "München", biblioteca: "Bayerische Staatsbibliothek", segnatura: seg.replace(/#.*/, ""),
    datazione: tag(rec, "dc:date")[0] || null, titolo: titolo || null,
    autori_fonte: tag(rec, "dc:creator"), collaboratori: tag(rec, "dc:contributor"),
    descrizione: [...desc.filter(d => d !== ex && !/^Volltext|^BSB-Provenienz|^Altsignatur/i.test(d)), ...tag(rec, "dc:subject")].join(" ; ").slice(0, 3000),
    manifest: `https://api.digitale-sammlungen.de/iiif/presentation/v2/${bsb}/manifest`, pagina: `https://www.digitale-sammlungen.de/view/${bsb}`,
    licenza: licenza(tag(rec, "dc:rights")[0]), digitalizzati: urn };
}
export const raccogliBsb = (o = {}) => raccogliOai({ fonte: "bsb", base: "https://bdr.oai.bsb-muenchen.de/OAIHandler", set: "cerl", estrai: estraiBsb, ...o });
