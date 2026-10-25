// University of Pennsylvania Libraries (Kislak Center, Schoenberg, CAJS e le raccolte di Filadelfia passate per Penn):
// ricerca JSON di Colenda (colenda.library.upenn.edu/catalog.json, il Blacklight delle collezioni digitali di Penn;
// il robots.txt di Colenda non pone limiti), filtrata per forma fisica (manoscritti, codici, manoscritti medievali,
// rinascimentali, sanscriti, arabi, ebraici), 100 record per pagina.
// OPenn (openn.library.upenn.edu) pubblica gli stessi codici con TEI e immagini, ma senza manifesti IIIF:
// i manifesti sono quelli del repository digitale di Penn (digitalrepository.library.upenn.edu/iiif/2/items/<uuid>/manifest, CORS aperto).
// Il nuovo sito digitalcollections.library.upenn.edu vieta nel robots.txt le ricerche con parametri: non si usa.
// Entrano i manoscritti librari di ogni data (dal 25 ottobre 2026 nessun limite cronologico): fuori lettere, ricevute, dattiloscritti
// e carte d'archivio e amministrative.
// Lo stato (cursore e record letti) è in data/penn.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";
import { lingueDa } from "../lingue.mjs";

export const FILE_STATO = "data/penn.json";
export const BASE = "https://colenda.library.upenn.edu/catalog.json";
export const FORME = ["codices (bound manuscripts)", "Manuscripts, Medieval", "Manuscripts, Renaissance", "Manuscripts, European", "Manuscripts, Sanskrit",
  "Manuscripts, Arabic", "Manuscripts, Hebrew", "Manuscripts, Persian", "Manuscripts, Greek", "Manuscripts, Latin", "manuscripts (documents)"];
const PAGINA = 100, GIORNI = 6;
// carte non librarie
const CARTE = /letters \(correspondence\)|receipts|trade cards|billheads|photographs|programs \(documents\)|clippings|postcards|invitations|telegrams|typescripts|minutes \(administrative records\)|financial records|certificates|scrapbooks/i;

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, totali: st.totali || {} });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

const uno = x => (Array.isArray(x) ? x[0] : x) || null;

// documento della ricerca -> voce compatta (null se fuori: carte d'archivio, niente manifesto)
export function compattaPenn(d) {
  if (!d || !d.uuid_ssi || !d.iiif_manifest_path_ss) return null;
  const forme = d.physical_format_ssim || [];
  const tipi = d.item_type_ssim || [];
  if (tipi.length && !tipi.includes("Text")) return null;
  if (!forme.some(f => /codices/i.test(f)) && forme.some(f => CARTE.test(f))) return null;
  // carte d'archivio: lettere e documenti in scatole e cartelle, archivi dell'università
  const luogo = uno(d.physical_location_ssim) || "";
  if (/^(Letter|Document relat|Telegram|Typescript)/i.test(uno(d.title_ssim) || "") || /\b(Box|Folder) \d/.test(luogo) || /^University Archives/.test(luogo)) return null;
  const v = { u: d.uuid_ssi, s: uno(d.physical_location_ssim), t: uno(d.title_ssim), d: (d.date_ssim || []).join(" ; ") || null,
    i: uno(d.identifier_ssim), l: d.language_ssim || [], a: [...(d.creator_ssim || []), ...(d.name_ssim || [])].slice(0, 12), r: uno(d.rights_ssim) };
  const desc = [...(d.description_tesim || []), ...(d.note_tesim || []).filter(n => !/^(Ms\. codex|Title supplied)/i.test(n))].join(" ; ").slice(0, 1500);
  if (desc) v.c = desc;
  return v;
}

// «Kislak Center for Special Collections, Rare Books and Manuscripts, Manuscripts, Ms. Codex 1058»
//   -> { biblioteca: «University of Pennsylvania Libraries, Kislak Center», segnatura: «Ms. Codex 1058» }
export function dividiPenn(s) {
  if (/Jatindramohan/.test(s || "")) return { biblioteca: "Jatindramohan Sangrahashala, National Council of Education, Bengal (copie digitali di Penn)", segnatura: null, citta: "Kolkata" };
  const p = String(s || "").split(", ");
  const i = /\d/.test(p[0]) ? -1 : p.findIndex((x, k) => k > 0 && /\d/.test(x));
  let biblioteca = i > 0 ? p[0] : "University of Pennsylvania Libraries", segnatura = i > 0 ? p.slice(i).join(", ") : String(s || "");
  if (/^Kislak Center/.test(biblioteca)) biblioteca = "University of Pennsylvania Libraries, Kislak Center";
  else if (/Katz Center/.test(biblioteca)) biblioteca = "University of Pennsylvania, Library at the Katz Center (CAJS)";
  if (segnatura.length > 120 || !segnatura) segnatura = null;
  return { biblioteca, segnatura };
}

/* raccolta a riprese: cursore = { f: indice della forma, p: pagina }; stato salvato dopo ogni pagina */
export async function scansionaPenn({ minuti = 15, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now();
  if (st.completato && !st.cursore && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("penn", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} codici`); return st; }
  if (!st.cursore) st.cursore = { f: 0, p: 1, voci: {} };
  else log("penn", `riprendo da «${FORME[st.cursore.f]}», pagina ${st.cursore.p}`);
  st.cursore.voci = st.cursore.voci || {}; st.totali = st.totali || {};
  const fine = ora + minuti * 60e3;
  for (; st.cursore.f < FORME.length; st.cursore.f++, st.cursore.p = 1) {
    const forma = FORME[st.cursore.f];
    for (;;) {
      if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta («${forma}», pagina ${st.cursore.p}): riprenderà alla prossima esecuzione`); }
      const url = `${BASE}?f%5Bphysical_format_sim%5D%5B%5D=${encodeURIComponent(forma)}&per_page=${PAGINA}&page=${st.cursore.p}&sort=${encodeURIComponent("id asc")}`;
      const r = await scarica(url, { timeout: 120000, accept: "application/json" });
      if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
      const d = JSON.parse(r.testo).response || {}, docs = d.docs || [];
      st.totali[forma] = d.pages ? d.pages.total_count : docs.length;
      for (const x of docs) { const v = compattaPenn(x); if (v) st.cursore.voci[x.id] = v; }
      st.aggiornato = new Date().toISOString();
      salvaStato(st);
      if (!d.pages || d.pages["last_page?"] || !docs.length) break;
      st.cursore.p++;
    }
    log("penn", `${forma}: ${st.totali[forma]} record`);
  }
  st.voci = st.cursore.voci; delete st.cursore;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("penn", `fine: ${Object.keys(st.voci).length} codici`);
  return st;
}

export function licenzaPenn(r) {
  if (!r) return null;
  if (/NoC-US/.test(r)) return "No Copyright - United States (rightsstatements.org)";
  if (/publicdomain\/mark/.test(r)) return "Public Domain Mark 1.0";
  const m = /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(r); if (m) return "CC " + m[1].toUpperCase() + " " + m[2];
  return r;
}

export function recordPenn(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => v).map(([id, v]) => {
    const { biblioteca, segnatura, citta } = dividiPenn(v.s);
    return { fonte: "penn", id: "upenn-" + id.replace(/^81431-/, ""), citta: citta || "Philadelphia", biblioteca, segnatura: segnatura || v.i || v.t || id, datazione: v.d, titolo: v.t,
      autori_fonte: v.a || [], descrizione: v.c || null, lingue: lingueDa(v.l || []),
      manifest: `https://digitalrepository.library.upenn.edu/iiif/2/items/${v.u}/manifest`, pagina: `https://digitalcollections.library.upenn.edu/items/${v.u}`, licenza: licenzaPenn(v.r) };
  });
}
