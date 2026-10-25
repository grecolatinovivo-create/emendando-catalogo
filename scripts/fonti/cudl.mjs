// Cambridge Digital Library (cudl.lib.cam.ac.uk): Cambridge University Library e college (greci, latini, orientali, ebraici...).
// Manifesti IIIF (cudl.lib.cam.ac.uk/iiif/<id>) e immagini (images.lib.cam.ac.uk) aperti con CORS *, ma le pagine dell'elenco
// rispondono 403 ai server: l'elenco si raccoglie dal browser con scripts/browser/cudl.js e si salva in data/cudl.json
// (come per Gallica). Senza quel file la fonte resta vuota. Fuori le carte non librarie; nessun limite di data (dal 25 ottobre 2026).
// Immagini: zoom © University Library; le immagini scaricabili sono CC BY-NC 4.0; metadati CC BY-NC-ND 4.0.
import fs from "node:fs";
import { lingueDa } from "../lingue.mjs";

export const FILE_DATI = "data/cudl.json";
export const LICENZA = "Cambridge University Library: immagini scaricabili CC BY-NC 4.0 (zoom © University Library); metadati CC BY-NC-ND 4.0";
const CARTE = /\b(letters?|correspondence|papers|photograph|map|notebook|diary|printed book|archive|typescripts?)\b/i;

export function leggiDati() { try { return JSON.parse(fs.readFileSync(FILE_DATI, "utf8")); } catch (e) { return null; } }

// «Cambridge, University Library, MS Nn.2.41» -> { biblioteca: «Cambridge University Library», segnatura: «MS Nn.2.41» }
export function dividiCudl(s, p) {
  const t = String(s || "").replace(/^Cambridge,\s*/, "");
  const m = /^(.*?(?:Library|College|Museum|Institute)[^,]*),\s*(.+)$/.exec(t);
  let biblioteca = m ? m[1] : p || "Cambridge University Library", segnatura = m ? m[2] : t || null;
  if (/^University Library$/.test(biblioteca)) biblioteca = "Cambridge University Library";
  return { biblioteca, segnatura };
}

export function recordCudl(d = leggiDati()) {
  if (!d || !d.voci) return [];
  const out = [];
  for (const [id, v] of Object.entries(d.voci)) {
    if (!v) continue;
    if (CARTE.test([v.f, v.t].filter(Boolean).join(" ")) && !/codex|manuscript/i.test(v.f || "")) continue;
    const { biblioteca, segnatura } = dividiCudl(v.s, v.p);
    out.push({ fonte: "cudl", id: "cudl-" + id.toLowerCase(), citta: "Cambridge", biblioteca, segnatura: segnatura || id,
      datazione: v.d || (v.a0 ? (v.a1 && v.a1 !== v.a0 ? `${v.a0}-${v.a1}` : String(v.a0)) : null),
      titolo: [v.t, v.u].filter(Boolean).join(" ; ") || null, autori_fonte: v.au || [], lingue: lingueDa([...(v.l || []), ...(v.l && v.l.length ? [] : v.x || [])]),
      manifest: `https://cudl.lib.cam.ac.uk/iiif/${id}`, pagina: `https://cudl.lib.cam.ac.uk/view/${id}`, licenza: LICENZA });
  }
  return out;
}
