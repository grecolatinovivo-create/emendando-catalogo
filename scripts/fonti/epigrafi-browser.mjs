// Epigrafi raccolte dal browser (dal 28 ottobre 2026): iscrizioni con foto di musei che dal nostro server non rispondono (o non
// rispondono più), lette da un normale Chrome a una richiesta ogni 2 secondi e portate qui come file JSON. Nel catalogo sono la fonte
// «epibrowser» (id «epb-<raccolta>-…»), con «tipo» «epigrafe» e i dati epigrafici in «epigrafe», come la fonte «epigrafi»
// (scripts/fonti/epigrafi.mjs). Nessuna richiesta in rete: questa fonte legge SOLO i file di stato in data/ (stesso schema delle
// stampe di Gallica, data/stampe-gallica.json). Esito della verifica di tutte le fonti provate dal browser in docs/EPIGRAFI.md.
//
// Raccolte (un file ciascuna):
//   getty   J. Paul Getty Museum, Los Angeles (data/epigrafi-getty.json, scripts/browser/epigrafi-getty.js): ricerca del sito
//           (www.getty.edu/art/collection/api/search; la SPARQL di data.getty.edu ora vuole un token), poi la scheda Linked Art di ogni
//           oggetto (data.getty.edu) e il suo manifesto IIIF (media.getty.edu). Entrano gli oggetti Open Content (immagini CC0) classificati
//           «Inscriptions» (AAT 300028702) o con un nome da iscrizione (stele, epitaffio, decreto, dedica, defixio). Manifesti del museo, CORS aperto.
//   yale    Yale University Art Gallery, New Haven (data/epigrafi-yale.json, scripts/browser/epigrafi-yale.js): ricerca di LUX
//           (lux.collections.yale.edu, robots.txt aperto; il sito artgallery.yale.edu vieta gli agenti AI nel robots.txt e non si usa),
//           poi la scheda Linked Art di ogni oggetto e il suo manifesto IIIF (manifests.collections.yale.edu). Entrano solo i manifesti
//           con «rights» CC0. Manifesti del museo, immagini IIIF images.collections.yale.edu, CORS aperto (verificato dal server).
// Il nostro server raggiunge i manifesti e le immagini di entrambi: il visore li apre direttamente, senza manifesti scritti da noi.
import fs from "node:fs";
import { dataItaliana, secoloDa } from "./papiri.mjs";

export const FILE_GETTY = "data/epigrafi-getty.json";
export const FILE_YALE = "data/epigrafi-yale.json";
export const RACCOLTE = { getty: FILE_GETTY, yale: FILE_YALE };

export function leggiFile(file) {
  try { const s = JSON.parse(fs.readFileSync(file, "utf8")); if (s && s.voci) return s; } catch (e) {}
  return null;
}
const pulisci = v => { for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k]; return v; };
const breve = (s, n = 300) => { s = String(s || "").replace(/\s+/g, " ").trim(); if (s.length <= n) return s || null; const p = s.slice(0, n).lastIndexOf(" "); return s.slice(0, p > 80 ? p : n) + "…"; };
const primo = (note, ...chiavi) => { for (const k of chiavi) { const x = Object.keys(note || {}).find(c => c.toLowerCase().startsWith(k.toLowerCase())); if (x && note[x].length) return note[x][0]; } return null; };
const CC0 = /publicdomain\/zero|creativecommons\.org\/publicdomain\/mark|public ?domain/i;

// anni dagli estremi Linked Art («-0323-01-01T00:00:00Z» per «ca. 323 B.C.», «0256-12-31T…»): i negativi sono gli anni avanti Cristo
const anno = s => { const m = /^(-?)(\d{1,6})-/.exec(s || ""); if (!m) return null; const n = +m[2] || 1; return m[1] ? -n : n; };
export function estremi(t0, t1) {
  const a = anno(t0), b = anno(t1);
  if (a == null || b == null || a < -3500 || b > 1600 || a > b) return null;
  return [a, b];
}

// lingue: solo quando la scheda le nomina (titolo, descrizione, iscrizione); «Greek» come cultura vale greco
export function lingueDa(testo, culture = []) {
  const t = String(testo || ""), l = [];
  if (/\b(?:greek|in greek|graec)/i.test(t)) l.push("grc");
  if (/\blatin\b/i.test(t)) l.push("la");
  if (/\b(?:aramaic|palmyrene|hatran|syriac)\b/i.test(t)) l.push("arc");
  if (/\betruscan\b/i.test(t)) l.push("ett");
  if (/\b(?:hieroglyph|demotic|hieratic)/i.test(t)) l.push("egy");
  if (/\b(?:phoenician)\b/i.test(t)) l.push("phn");
  if (/\b(?:punic|neo-punic)\b/i.test(t)) l.push("xpu");
  if (/\bcuneiform\b/i.test(t)) l.push("akk");
  if (/\bcoptic\b/i.test(t)) l.push("cop");
  if (!l.length && culture.some(c => /^Greek/i.test(c || ""))) l.push("grc");
  if (!l.length && culture.some(c => /\bcoptic\b/i.test(c || ""))) l.push("cop");
  // Egitto faraonico (Antico, Medio e Nuovo Regno, dinastie, Epoca tarda): egiziano
  if (!l.length && culture.some(c => /^Egyptian\b/i.test(c || "") && /Kingdom|Dynasty|Late Period|Intermediate|Ptolem/i.test(c || ""))) l.push("egy");
  return l;
}

// ------------------------------------------------------------------------------------------------ Getty
// fuori i testi su lino, papiro o pergamena (bende di mummia, Libro dei morti, manoscritti: non sono iscrizioni) e le schede «Part»
// (pezzi di un insieme che ha già la sua scheda)
const NON_ISCRIZIONE = /\b(mummy|wrappings?|papyrus|book of the dead|manuscript|leaf from)\b/i;
export function recordGetty(id, v) {
  if (!v || !v.tieni || !v.m || !(v.ni > 0) || !v.cc0 || (v.mr && !CC0.test(v.mr))) return null;
  if (NON_ISCRIZIONE.test(v.n || "") || (v.cl || []).some(c => /object-record-structure-part/.test(c))) return null;
  // fuori le imitazioni moderne e i papiri (tipo d'oggetto «Papyrus»: sono della fonte «papiri»)
  if (/\b(imitation|forgery|modern copy)\b/i.test(v.n || "") || /\b(1[6-9]th|20th|21st) century\b/i.test(v.d || "") || /papyrus/i.test(primo(v.note, "Object/Work Type") || "")) return null;
  // fuori fotografie, stampe e stereografie (le ricerche per «dedication» ne portano dentro molte)
  if (/\b(print|stereograph|negative|photograph)\b/i.test(primo(v.note, "Object/Work Type") || "") || /\b1[89]\d\d\b/.test(v.d || "")) return null;
  const note = v.note || {};
  const desc = primo(note, "Description");
  const iscr = primo(note, "Inscription", "Marks");
  const dn = estremi(v.t0, v.t1);
  const cu = (v.cu || []).filter(Boolean);
  return {
    fonte: "epibrowser", id: "epb-getty-" + id.toLowerCase(), tipo: "epigrafe", citta: "Los Angeles", biblioteca: "J. Paul Getty Museum",
    segnatura: v.a || "Getty " + id, titolo: v.n || null, datazione: v.d || dataItaliana(dn), secolo: secoloDa(dn, v.d),
    lingue: lingueDa([v.n, desc, iscr].join(" "), cu), manifest: v.m, pagina: v.s ? "https://www.getty.edu/art/collection" + v.s : `https://www.getty.edu/art/collection/object/${id}`,
    immagini: v.ni,
    licenza: "J. Paul Getty Museum, Open Content Program: immagini in pubblico dominio (CC0); testi delle schede © J. Paul Getty Trust, CC BY 4.0",
    descrizione: breve(desc, 600),
    epigrafe: pulisci({ provenienza: primo(note, "Creation Place", "Find Spot", "Place") || (v.luogo || []).join(", ") || null, conservazione: "J. Paul Getty Museum, Los Angeles",
      supporto: primo(note, "Materials Description") || (v.mat || []).join(", ") || null, genere: primo(note, "Object/Work Type") || null, cultura: cu.join(", ") || null,
      misure: primo(note, "Dimensions Description") || null, testo: iscr ? breve(iscr, 800) : null, getty: id, licenza_metadati: "CC BY 4.0 (testi delle schede del Getty)" }),
  };
}

// ------------------------------------------------------------------------------------------------ Yale University Art Gallery
const TITOLO_YALE = /inscri|stel[ae]\b|epitaph|graffit|dipint|depint|ostra[ck]|altar|tablet|tabula|dedicat|epigra/i;
const idYale = v => (/\/yuag\/obj\/(\d+)/.exec(v.man || "") || [])[1] || null;
export function recordYale(lux, v) {
  if (!v || !v.tieni || !v.man || !(v.ni > 0) || !CC0.test(v.mr || "")) return null;
  const n = idYale(v); if (!n) return null;
  const note = v.note || {};
  // solo il dipartimento «Ancient Art» (fuori stampe, disegni, arte asiatica e delle Americhe), niente acquerelli, calchi, falsi moderni;
  // entra se il nome parla di iscrizione (o di stele, altare, ostrakon, graffito, dipinto, tavoletta, dedica) oppure se la scheda ha
  // una nota «Inscriptions» che non dica «no inscription»
  const dip = ((v.md || []).find(x => x[0] === "Department") || [])[1] || "";
  if (dip !== "Ancient Art" || /\b(watercolou?r|plaster cast|forgery|modern)\b/i.test(v.n || "")) return null;
  const nota = (note.Inscriptions || [])[0] || "";
  if (!(TITOLO_YALE.test(v.n || "") || (nota && !/^\s*(no inscription|none\b|not inscribed)/i.test(nota)))) return null;
  const acc = ((v.ids || []).find(x => /Accession Number/i.test(x[0])) || [])[1] || null;
  const dn = estremi(v.t0, v.t1);
  const desc = primo(note, "Description"), iscr = primo(note, "Inscription", "Marks"), cult = primo(note, "Culture"), per = primo(note, "Period");
  const prov = primo(note, "Provenance");
  return {
    fonte: "epibrowser", id: "epb-yale-" + n, tipo: "epigrafe", citta: "New Haven", biblioteca: "Yale University Art Gallery",
    segnatura: acc || "YUAG " + n, titolo: v.n || null, datazione: v.td || dataItaliana(dn), secolo: secoloDa(dn, v.td),
    lingue: lingueDa([v.n, iscr, (v.cls || []).join(" ")].join(" "), [[cult, per].filter(Boolean).join(", ")]), manifest: v.man,
    pagina: v.pag || `https://artgallery.yale.edu/collections/objects/${n}`, immagini: v.ni,
    licenza: "Yale University Art Gallery: dati in pubblico dominio; immagine CC0 (dichiarata nel manifesto IIIF)",
    descrizione: desc && !/^YUAG \d+/.test(desc) ? breve(desc, 600) : null,
    epigrafe: pulisci({ provenienza: prov ? breve(prov.split(/\s{2,}|;/)[0], 300) : (v.luogo || []).join(", ") || null, conservazione: "Yale University Art Gallery, New Haven",
      supporto: primo(note, "Medium") ? breve(primo(note, "Medium"), 200) : (v.mat || []).join(", ") || null, cultura: [cult, per].filter(Boolean).join(", ") || null,
      misure: primo(note, "Dimensions") || null, testo: iscr ? breve(iscr, 800) : null, lux, licenza_metadati: "CC0" }),
  };
}

// tutte le voci delle raccolte dal browser; «esistenti»: manifesti già nel catalogo da altre fonti (restano a quelle)
export function recordEpigrafiBrowser({ esistenti = new Set(), file = RACCOLTE } = {}) {
  const out = [];
  const g = leggiFile(file.getty);
  if (g) for (const [id, v] of Object.entries(g.voci)) { const r = recordGetty(id, v); if (r) out.push(r); }
  const y = leggiFile(file.yale);
  if (y) for (const [id, v] of Object.entries(y.voci)) { const r = recordYale(id.replace(/^.*\/object\//, ""), v); if (r) out.push(r); }
  const visti = new Set();
  return out.filter(r => { if (esistenti.has(r.manifest) || visti.has(r.manifest)) return false; visti.add(r.manifest); if (!r.titolo) delete r.titolo; if (!r.descrizione) delete r.descrizione; return true; });
}

// riassunto per il registro delle biblioteche
export function statoEpigrafiBrowser(file = RACCOLTE) {
  return Object.fromEntries(Object.entries(file).map(([k, f]) => { const s = leggiFile(f); return [k, s ? { raccolto: s.raccolto || null, voci: Object.keys(s.voci).length, letti: s.letti || null } : null]; }));
}
