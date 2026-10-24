#!/usr/bin/env node
// Catalogo dei manoscritti con testi latini classici (IIIF). Uso:
//   node scripts/raccogli.mjs [--fonti=heidelberg,ecodices,bsb,bodleian,gallica,vaticana] [--vaticana-minuti=20] [--oai-minuti=60]
//        [--bodleian-minuti=30] [--gallica-minuti=30] [--indici-minuti=20] [--minuti-totali=160] [--solo-costruisci]
// Scrive data/manoscritti.json (il catalogo) e gli stati delle scansioni a riprese: data/vaticana.json, data/bodleian.json,
// data/heidelberg-indici.json (indici dei contenuti delle miscellanee di Heidelberg, letti dai manifesti IIIF).
// --minuti-totali: tempo complessivo disponibile; la Vaticana usa al massimo quello che resta dopo le fonti OAI.
// --solo-costruisci: nessuna richiesta, si ricostruisce dalle raccolte in cache e dallo stato della Vaticana.
// Le raccolte OAI riprendono da dove si erano fermate (.cache/catalogo/stato-*.json) e si riusano per 6 giorni;
// se una fonte non risponde, restano le sue voci del catalogo precedente.
import fs from "node:fs";
import { log } from "./rete.mjs";
import { caricaAutori, riconosci } from "./riconosci.mjs";
import { raccogliHeidelberg, raccogliEcodices, raccogliBsb } from "./fonti/oai.mjs";
import { scansiona, recordVaticana } from "./fonti/vaticana.mjs";
import { scansionaBodleian, recordBodleian } from "./fonti/bodleian.mjs";
import { raccogliGallica } from "./fonti/gallica.mjs";
import { leggiIndiciHeidelberg, conIndici } from "./fonti/heidelberg-indici.mjs";

const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const FONTI = String(arg.fonti || "heidelberg,ecodices,bsb,bodleian,gallica,vaticana").split(",");
const OUT = "data/manoscritti.json";
const INIZIO = Date.now();
export const NOMI_FONTI = { heidelberg: "Heidelberg (digi.ub.uni-heidelberg.de)", ecodices: "e-codices", bsb: "Bayerische Staatsbibliothek (digitale-sammlungen.de)",
  bodleian: "Bodleian Libraries, Oxford (digital.bodleian.ox.ac.uk)", gallica: "Bibliothèque nationale de France (gallica.bnf.fr)", vaticana: "Biblioteca Apostolica Vaticana (digi.vatlib.it)" };

// i tre codici del Truculentus restano sempre nel catalogo, anche se una fonte non li ha ancora restituiti
export const TRUCULENTUS = [
  { sigla: "B", fonte: "vaticana", id: "bav-pal-lat-1615", citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana", segnatura: "Pal. lat. 1615", datazione: "10.-11. Jh.",
    titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], manifest: "https://digi.vatlib.it/iiif/MSS_Pal.lat.1615/manifest.json", pagina: "https://digi.vatlib.it/view/MSS_Pal.lat.1615", licenza: "© Biblioteca Apostolica Vaticana" },
  { sigla: "C", fonte: "heidelberg", id: "hd-cpl1613", citta: "Heidelberg", biblioteca: "Universitätsbibliothek Heidelberg", segnatura: "Cod. Pal. lat. 1613", datazione: "Ende 10. Jh.",
    titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], manifest: "https://digi.ub.uni-heidelberg.de/diglit/iiif/cpl1613/manifest.json", pagina: "https://digi.ub.uni-heidelberg.de/diglit/cpl1613", licenza: "Public Domain Mark 1.0" },
  { sigla: "D", fonte: "vaticana", id: "bav-vat-lat-3870", citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana", segnatura: "Vat. lat. 3870", datazione: "sec. XI?",
    titolo: "Comoediae (Plautus, Titus Maccius, m. 184 a.C.). Gruppi, scelte", autori_fonte: ["Plautus, Titus Maccius, m. 184 a.C."], manifest: "https://digi.vatlib.it/iiif/MSS_Vat.lat.3870/manifest.json", pagina: "https://digi.vatlib.it/view/MSS_Vat.lat.3870", licenza: "© Biblioteca Apostolica Vaticana" },
];

export function campiDi(r) {
  return [
    { campo: "autore", testo: (r.autori_fonte || []).join(" ; "), forte: true },
    { campo: "titolo", testo: r.titolo, forte: true },
    // titoli delle sezioni del codice (indice dei contenuti delle miscellanee): come le descrizioni, servono nome e opera
    // insieme (nelle miscellanee ricorrono omonimi: «Donatus ep.», «Iuvenalis episcopus»)
    { campo: "indice", testo: r.indice, forte: false },
    { campo: "collaboratori", testo: (r.collaboratori || []).join(" ; "), forte: false },
    { campo: "descrizione", testo: r.descrizione, forte: false },
  ];
}

// record compatto della fonte -> voce del catalogo (null se nessun autore della lista e non è un codice del Truculentus)
export function voce(r, AUTORI, sigle = new Map(TRUCULENTUS.map(t => [t.manifest, t.sigla]))) {
  const autori = riconosci(campiDi(r), AUTORI);
  const sigla = sigle.get(r.manifest) || null;
  if (!autori.length && !sigla) return null;
  const v = { id: r.id, fonte: r.fonte, biblioteca: r.biblioteca || null, citta: r.citta || null, segnatura: r.segnatura, datazione: r.datazione || null,
    titolo: (r.titolo || "").slice(0, 400) || null, autori, manifest: r.manifest, pagina: r.pagina || null, licenza: r.licenza || null, immagini: r.immagini ?? null };
  if (r.anteprima) v.anteprima = r.anteprima;
  if (sigla) v.truculentus = sigla;
  return v;
}

function unisciBsb(rs) {
  // la BSB descrive ogni opera di un codice con un record, e ogni record cita anche i volumi digitalizzati del catalogo
  // a stampa: un identificativo citato da molte segnature è un catalogo, non il codice. Si riunisce per segnatura.
  const quante = new Map();
  for (const r of rs) for (const u of r.digitalizzati || [r.id.replace(/^bsb-/, "")]) { if (!quante.has(u)) quante.set(u, new Set()); quante.get(u).add(r.segnatura); }
  const m = new Map();
  for (const r0 of rs) {
    const cand = (r0.digitalizzati || [r0.id.replace(/^bsb-/, "")]).filter(u => quante.get(u).size <= 2);
    if (!cand.length) continue;
    const bsb = cand[cand.length - 1];
    const r = { ...r0, id: "bsb-" + bsb, manifest: `https://api.digitale-sammlungen.de/iiif/presentation/v2/${bsb}/manifest`, pagina: `https://www.digitale-sammlungen.de/view/${bsb}` };
    delete r.digitalizzati;
    const x = m.get(r.segnatura);
    if (!x) { m.set(r.segnatura, r); continue; }
    if (x.titolo !== r.titolo) x.titolo = [x.titolo, r.titolo].filter(Boolean).join(" ; ");
    x.autori_fonte = [...new Set([...(x.autori_fonte || []), ...(r.autori_fonte || [])])];
    x.collaboratori = [...new Set([...(x.collaboratori || []), ...(r.collaboratori || [])])];
    if (r.descrizione && !(x.descrizione || "").includes(r.descrizione)) x.descrizione = [x.descrizione, r.descrizione].filter(Boolean).join(" ; ").slice(0, 4000);
    if (!x.datazione) x.datazione = r.datazione;
  }
  return [...m.values()];
}

const naturale = (a, b) => String(a).localeCompare(String(b), "it", { numeric: true, sensitivity: "base" });

async function main() {
  const AUTORI = caricaAutori();
  let prima = { manoscritti: [] }; try { prima = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) {}
  const perFonte = {}, esito = {};
  // minuti per una fonte: il suo limite, ridotto a quanto resta del tempo complessivo (6 minuti restano per costruire e salvare)
  const tempo = cap => {
    if (!arg["minuti-totali"]) return cap;
    const resto = +arg["minuti-totali"] - (Date.now() - INIZIO) / 60e3 - 6;
    if (resto <= 1 && !arg["solo-costruisci"]) throw new Error("tempo complessivo esaurito: fonte rimandata alla prossima esecuzione");
    return Math.min(cap || Infinity, resto);
  };
  const oai = () => ({ limiteMinuti: tempo(+arg["oai-minuti"] || 0), soloCache: !!arg["solo-costruisci"] });
  const lavori = {
    heidelberg: async () => {
      const rs = await raccogliHeidelberg(oai());
      let minuti = 0; try { minuti = arg["solo-costruisci"] ? 0 : tempo(+(arg["indici-minuti"] ?? 20)); } catch (e) {}
      if (!arg["solo-costruisci"] && minuti > 0) {
        try { await leggiIndiciHeidelberg(rs, r => riconosci(campiDi(r), AUTORI).length > 0, { minuti }); }
        catch (e) { log("heidelberg-indici", "ERRORE", e.message); }
      }
      return conIndici(rs);
    },
    ecodices: () => raccogliEcodices(oai()),
    bsb: async () => unisciBsb(await raccogliBsb(oai())),
    bodleian: async () => recordBodleian(await scansionaBodleian({ minuti: tempo(+(arg["bodleian-minuti"] ?? 30)), soloCache: !!arg["solo-costruisci"] })),
    gallica: () => raccogliGallica({ limiteMinuti: tempo(+(arg["gallica-minuti"] ?? 30)), soloCache: !!arg["solo-costruisci"] }),
    vaticana: async () => {
      let minuti = +(arg["vaticana-minuti"] ?? 20);
      // con un tempo complessivo si lasciano 6 minuti per costruire il catalogo, provarlo e salvarlo
      if (arg["minuti-totali"]) minuti = Math.max(0, Math.min(minuti, +arg["minuti-totali"] - (Date.now() - INIZIO) / 60e3 - 6));
      if (!arg["solo-costruisci"] && minuti > 0) await scansiona({ minuti, extra: ["Pal.lat.1615", "Vat.lat.3870"] });
      return recordVaticana();
    },
  };
  for (const f of Object.keys(lavori)) {
    if (!FONTI.includes(f)) { esito[f] = "precedente"; continue; }
    try { perFonte[f] = await lavori[f](); esito[f] = "ok"; log(f, `${perFonte[f].length} record candidati`); }
    catch (e) { esito[f] = "errore: " + e.message; log(f, "ERRORE", e.message, "(restano le voci precedenti)"); }
  }
  const sigle = new Map(TRUCULENTUS.map(t => [t.manifest, t.sigla]));
  const voci = new Map();
  for (const f of Object.keys(lavori)) {
    if (perFonte[f]) { for (const r of perFonte[f]) { const v = voce(r, AUTORI, sigle); if (v) voci.set(v.id, v); } }
    else for (const v of prima.manoscritti.filter(x => x.fonte === f)) voci.set(v.id, v);
  }
  for (const t of TRUCULENTUS) if (![...voci.values()].some(v => v.manifest === t.manifest)) voci.set(t.id, voce(t, AUTORI, sigle));
  const manoscritti = [...voci.values()].sort((a, b) => naturale(a.biblioteca, b.biblioteca) || naturale(a.segnatura, b.segnatura));
  const conteggio = {}; for (const v of manoscritti) conteggio[v.fonte] = (conteggio[v.fonte] || 0) + 1;
  const daIndice = manoscritti.filter(v => v.autori.some(a => a.corrispondenza.startsWith("indice:"))).length;
  log(`riconosciuti grazie all'indice dei contenuti: ${daIndice}`);
  const dati = { aggiornato: new Date().toISOString(), fonti: Object.fromEntries(Object.keys(lavori).map(f => [f, { nome: NOMI_FONTI[f], codici: conteggio[f] || 0, esito: esito[f] }])),
    totale: manoscritti.length, manoscritti };
  // se il contenuto non cambia, la data resta quella di prima (niente commit settimanali vuoti)
  const senzaData = d => JSON.stringify({ ...d, aggiornato: null, fonti: Object.fromEntries(Object.entries(d.fonti || {}).map(([k, v]) => [k, { ...v, esito: null }])) });
  if (prima.manoscritti.length && senzaData(prima) === senzaData(dati)) { log("catalogo invariato:", manoscritti.length, "codici"); return; }
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(dati, null, 1) + "\n");
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  log(`catalogo scritto: ${manoscritti.length} codici (${Object.entries(conteggio).map(([k, n]) => k + " " + n).join(", ")}), ${kb} KB`);
  if (kb > 4096) log("ATTENZIONE: il catalogo supera 4 MB: conviene dividerlo in indice leggero e dettagli");
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
