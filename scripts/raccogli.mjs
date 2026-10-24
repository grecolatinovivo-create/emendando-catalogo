#!/usr/bin/env node
// Catalogo dei manoscritti digitalizzati (IIIF) delle biblioteche agganciate: tutti i manoscritti, di ogni lingua ed epoca.
// Autori e opere riconosciuti (classici latini e greci, cristiani, medievali) sono un'informazione in più, per cercare e filtrare.
// Uso:
//   node scripts/raccogli.mjs [--fonti=heidelberg,ecodices,bsb,berlino,bodleian,gallica,laurenziana,leiden,wolfenbuettel,bamberga,karlsruhe,stoccarda,colonia,lipsia,vaticana] [--vaticana-minuti=20] [--oai-minuti=60]
//        [--bodleian-minuti=30] [--gallica-minuti=30] [--laurenziana-minuti=15] [--leiden-minuti=15] [--hsp-minuti=10] [--berlino-minuti=60] [--indici-minuti=20] [--minuti-totali=160] [--solo-costruisci]
// Scrive il catalogo diviso per fonte (vedi costruisci.mjs): data/catalogo/indice.json, data/catalogo/indice/<fonte>-<n>.json, data/catalogo/voci/<fonte>-<n>.json,
// più data/manoscritti.json (compatibilità: solo i codici con autori classici), e gli stati delle scansioni a riprese
// (data/vaticana.json, data/bodleian.json, data/laurenziana.json, data/leiden.json, data/heidelberg-indici.json; data/<fonte>.json per le fonti del Handschriftenportal: wolfenbuettel, bamberga, karlsruhe, stoccarda, colonia, lipsia).
// --hsp-minuti: limite di ciascuna fonte del Handschriftenportal.
// --minuti-totali: tempo complessivo disponibile; la Vaticana usa al massimo quello che resta dopo le altre fonti.
// --solo-costruisci: nessuna richiesta, si ricostruisce dalle raccolte in cache e dagli stati salvati.
// Le raccolte OAI riprendono da dove si erano fermate (.cache/catalogo/stato-*.json) e si riusano per 6 giorni;
// se una fonte non risponde, restano le sue voci del catalogo precedente.
import fs from "node:fs";
import { log } from "./rete.mjs";
import { caricaAutori, riconosci } from "./riconosci.mjs";
import { deduciLingue, secoli } from "./lingue.mjs";
import { raccogliHeidelberg, raccogliEcodices, raccogliBsb, raccogliBerlino } from "./fonti/oai.mjs";
import { scansiona, recordVaticana } from "./fonti/vaticana.mjs";
import { scansionaBodleian, recordBodleian } from "./fonti/bodleian.mjs";
import { raccogliGallica } from "./fonti/gallica.mjs";
import { scansionaLaurenziana, recordLaurenziana } from "./fonti/laurenziana.mjs";
import { leggiIndiciHeidelberg, conIndici } from "./fonti/heidelberg-indici.mjs";
import { scansionaLeiden, recordLeiden } from "./fonti/leiden.mjs";
import { scansionaHsp, recordHsp, FONTI_HSP } from "./fonti/hsp.mjs";
import { scriviRegistro, registraEsiti } from "./registro.mjs";
import { scriviCatalogo, catalogoPrecedente } from "./costruisci.mjs";

const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const FONTI = String(arg.fonti || "heidelberg,ecodices,bsb,berlino,bodleian,gallica,laurenziana,leiden,wolfenbuettel,bamberga,karlsruhe,stoccarda,colonia,lipsia,vaticana").split(",");
const INIZIO = Date.now();
export const NOMI_FONTI = { heidelberg: "Heidelberg (digi.ub.uni-heidelberg.de)", ecodices: "e-codices", bsb: "Bayerische Staatsbibliothek (digitale-sammlungen.de)", berlino: "Staatsbibliothek zu Berlin (digital.staatsbibliothek-berlin.de)",
  bodleian: "Bodleian Libraries, Oxford (digital.bodleian.ox.ac.uk)", gallica: "Bibliothèque nationale de France (gallica.bnf.fr)",
  laurenziana: "Biblioteca Medicea Laurenziana, Firenze (tecabml.contentdm.oclc.org)", leiden: "Universiteitsbibliotheek Leiden (digitalcollections.universiteitleiden.nl)",
  ...Object.fromEntries(Object.entries(FONTI_HSP).map(([f, h]) => [f, `${h.biblioteca}${h.biblioteca.includes(h.citta) ? "" : ", " + h.citta} (dati dal Handschriftenportal, handschriftenportal.de)`])),
  vaticana: "Biblioteca Apostolica Vaticana (digi.vatlib.it)" };

// i tre codici del Truculentus restano sempre nel catalogo, anche se una fonte non li ha ancora restituiti
export const TRUCULENTUS = [
  { sigla: "B", fonte: "vaticana", id: "bav-pal-lat-1615", citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana", segnatura: "Pal. lat. 1615", datazione: "10.-11. Jh.",
    titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], lingue: ["la"], manifest: "https://digi.vatlib.it/iiif/MSS_Pal.lat.1615/manifest.json", pagina: "https://digi.vatlib.it/view/MSS_Pal.lat.1615", licenza: "© Biblioteca Apostolica Vaticana" },
  { sigla: "C", fonte: "heidelberg", id: "hd-cpl1613", citta: "Heidelberg", biblioteca: "Universitätsbibliothek Heidelberg", segnatura: "Cod. Pal. lat. 1613", datazione: "Ende 10. Jh.",
    titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], lingue: ["la"], manifest: "https://digi.ub.uni-heidelberg.de/diglit/iiif/cpl1613/manifest.json", pagina: "https://digi.ub.uni-heidelberg.de/diglit/cpl1613", licenza: "Public Domain Mark 1.0" },
  { sigla: "D", fonte: "vaticana", id: "bav-vat-lat-3870", citta: "Città del Vaticano", biblioteca: "Biblioteca Apostolica Vaticana", segnatura: "Vat. lat. 3870", datazione: "sec. XI?",
    titolo: "Comoediae (Plautus, Titus Maccius, m. 184 a.C.). Gruppi, scelte", autori_fonte: ["Plautus, Titus Maccius, m. 184 a.C."], lingue: ["la"], manifest: "https://digi.vatlib.it/iiif/MSS_Vat.lat.3870/manifest.json", pagina: "https://digi.vatlib.it/view/MSS_Vat.lat.3870", licenza: "© Biblioteca Apostolica Vaticana" },
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

// record compatto della fonte -> voce del catalogo (tutti i manoscritti; null solo se mancano identificativo o manifesto).
// lingue: quelle della fonte, altrimenti dedotte (scripts/lingue.mjs, deduciLingue); [] se non si sa. secolo: [primo, ultimo] dalla datazione.
export function voce(r, AUTORI, sigle = new Map(TRUCULENTUS.map(t => [t.manifest, t.sigla]))) {
  if (!r || !r.id || !r.manifest) return null;
  const autori = riconosci(campiDi(r), AUTORI);
  const sigla = sigle.get(r.manifest) || null;
  // lingue dichiarate dalla fonte; se mancano, dedotte da fondo, segnatura o titolo (lingua_dedotta: true); se incerte, nessuna
  const dichiarate = r.lingue && r.lingue.length ? r.lingue : null;
  const lingue = dichiarate || deduciLingue(r.segnatura, r.titolo, autori);
  const v = { id: r.id, fonte: r.fonte, biblioteca: r.biblioteca || null, citta: r.citta || null, segnatura: r.segnatura || r.id, datazione: r.datazione || null,
    secolo: secoli(r.datazione), lingue, lingua_dedotta: !dichiarate && lingue.length > 0, titolo: (r.titolo || "").slice(0, 400) || null, autori, manifest: r.manifest, pagina: r.pagina || null, licenza: r.licenza || null, immagini: r.immagini ?? null };
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
  const prima = catalogoPrecedente();
  const perFonte = {}, esito = {}, dettagli = {};
  // minuti per una fonte: il suo limite, ridotto a quanto resta del tempo complessivo (10 minuti restano per costruire, provare e salvare)
  const tempo = cap => {
    if (!arg["minuti-totali"]) return cap;
    const resto = +arg["minuti-totali"] - (Date.now() - INIZIO) / 60e3 - 10;
    if (resto <= 1 && !arg["solo-costruisci"]) throw new Error("tempo complessivo esaurito: fonte rimandata alla prossima esecuzione");
    return Math.min(cap || Infinity, resto);
  };
  // fonti non interrogate in questa esecuzione: si ricostruiscono senza richieste dagli stati salvati (cache o data/*.json), così il riconoscimento
  // degli autori è sempre quello di data/autori.json; se lo stato non c'è, restano le voci del catalogo precedente
  const sc = f => !!arg["solo-costruisci"] || !FONTI.includes(f);
  const min = (f, m) => (sc(f) ? 0 : tempo(m));
  const oai = f => ({ limiteMinuti: min(f, +arg["oai-minuti"] || 0), soloCache: sc(f) });
  // indici delle miscellanee di Heidelberg: solo per i codici latini (o di lingua non indicata) che la scheda non fa riconoscere; non per i papiri
  const daIndice = r => !/Papyrussammlung/.test(r.biblioteca || "") && (!(r.lingue || []).length || r.lingue.includes("la")) && !riconosci(campiDi(r), AUTORI).length;
  const lavori = {
    heidelberg: async () => {
      const rs = await raccogliHeidelberg(oai("heidelberg"));
      dettagli.heidelberg = { candidati: rs.filter(daIndice).length };
      let minuti = 0; try { minuti = min("heidelberg", +(arg["indici-minuti"] ?? 20)); } catch (e) {}
      if (minuti > 0) {
        try { await leggiIndiciHeidelberg(rs, r => !daIndice(r), { minuti }); }
        catch (e) { log("heidelberg-indici", "ERRORE", e.message); }
      }
      return conIndici(rs);
    },
    ecodices: () => raccogliEcodices(oai("ecodices")),
    bsb: async () => unisciBsb(await raccogliBsb(oai("bsb"))),
    // Berlino risponde lentamente (circa 35 secondi per pagina, 71 pagine): ha un limite suo, così finisce in una sola esecuzione
    berlino: () => raccogliBerlino({ limiteMinuti: min("berlino", +(arg["berlino-minuti"] ?? arg["oai-minuti"] ?? 0)), soloCache: sc("berlino") }),
    bodleian: async () => recordBodleian(await scansionaBodleian({ minuti: min("bodleian", +(arg["bodleian-minuti"] ?? 30)), soloCache: sc("bodleian") })),
    gallica: () => raccogliGallica({ limiteMinuti: min("gallica", +(arg["gallica-minuti"] ?? 30)), soloCache: sc("gallica") }),
    laurenziana: async () => recordLaurenziana(await scansionaLaurenziana({ minuti: min("laurenziana", +(arg["laurenziana-minuti"] ?? 15)), soloCache: sc("laurenziana") })),
    leiden: async () => recordLeiden(await scansionaLeiden({ minuti: min("leiden", +(arg["leiden-minuti"] ?? 15)), soloCache: sc("leiden") })),
    // biblioteche lette dal Handschriftenportal: una fonte ciascuna, con il suo stato in data/<fonte>.json
    ...Object.fromEntries(Object.keys(FONTI_HSP).map(f => [f, async () => recordHsp(f, await scansionaHsp({ fonte: f, minuti: min(f, +(arg["hsp-minuti"] ?? 10)), soloCache: sc(f) }))])),
    vaticana: async () => {
      let minuti = +(arg["vaticana-minuti"] ?? 20);
      // con un tempo complessivo si lasciano 10 minuti per costruire il catalogo, provarlo e salvarlo
      if (arg["minuti-totali"]) minuti = Math.max(0, Math.min(minuti, +arg["minuti-totali"] - (Date.now() - INIZIO) / 60e3 - 10));
      if (!sc("vaticana") && minuti > 0) await scansiona({ minuti, extra: ["Pal.lat.1615", "Vat.lat.3870"] });
      return recordVaticana();
    },
  };
  for (const f of Object.keys(lavori)) {
    try {
      const rs = await lavori[f]();
      // una fonte senza stato salvato (prima raccolta mai fatta) non cancella le voci precedenti
      if (sc(f) && !rs.length) throw new Error("nessun dato salvato");
      perFonte[f] = rs; esito[f] = FONTI.includes(f) ? "ok" : "precedente"; log(f, `${rs.length} record${FONTI.includes(f) ? "" : " (dagli stati salvati)"}`);
    }
    catch (e) { esito[f] = FONTI.includes(f) ? "errore: " + e.message : "precedente"; log(f, FONTI.includes(f) ? "ERRORE" : "nessuno stato salvato:", e.message, "(restano le voci precedenti)"); }
  }
  const sigle = new Map(TRUCULENTUS.map(t => [t.manifest, t.sigla]));
  const voci = new Map();
  const t0 = Date.now();
  // Fonti sospese: entra nel catalogo solo ciò che si apre dentro il sito. Per queste i manifesti o le immagini
  // non si aprono nemmeno da un browser normale (verificato il 24 ottobre 2026): restano raccolte negli stati
  // ma non entrano nel catalogo finché non tornano raggiungibili.
  const SOSPESE = { wolfenbuettel: "server iiif.hab.de non raggiungibile", karlsruhe: "digital.blb-karlsruhe.de risponde 403", stoccarda: "manifesti di Marburgo non raggiungibili" };
  for (const f of Object.keys(SOSPESE)) if (f in lavori) { esito[f] = "sospesa: " + SOSPESE[f]; log(f, "sospesa:", SOSPESE[f]); }
  for (const f of Object.keys(lavori)) {
    if (SOSPESE[f]) continue;
    if (perFonte[f]) { for (const r of perFonte[f]) { const v = voce(r, AUTORI, sigle); if (v) voci.set(v.id, v); } }
    else for (const v of prima.filter(x => x.fonte === f)) {
      // voci precedenti senza lingua: si prova la deduzione
      if (!v.lingue.length) { v.lingue = deduciLingue(v.segnatura, v.titolo, v.autori); v.lingua_dedotta = v.lingue.length > 0; }
      voci.set(v.id, v);
    }
  }
  for (const t of TRUCULENTUS) if (![...voci.values()].some(v => v.manifest === t.manifest)) voci.set(t.id, voce(t, AUTORI, sigle));
  log(`riconoscimento: ${voci.size} codici in ${Math.round((Date.now() - t0) / 1000)} secondi`);
  const manoscritti = [...voci.values()].sort((a, b) => naturale(a.biblioteca, b.biblioteca) || naturale(a.segnatura, b.segnatura) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const daIndici = manoscritti.filter(v => v.autori.some(a => a.corrispondenza.startsWith("indice:"))).length;
  log(`riconosciuti grazie all'indice dei contenuti: ${daIndici}`);
  const nomiFonti = Object.fromEntries(Object.keys(lavori).map(f => [f, NOMI_FONTI[f]]));
  const ris = scriviCatalogo(manoscritti, { fonti: Object.keys(lavori), nomi: nomiFonti, esito, autori: AUTORI });
  // registro delle biblioteche (docs/BIBLIOTECHE.md): esiti delle raccolte vere e tabella delle fonti agganciate
  if (!arg["solo-costruisci"]) registraEsiti(Object.fromEntries(Object.keys(lavori).map(f => [f, esito[f]])));
  if (scriviRegistro({ fonti: Object.keys(lavori), conteggio: ris.conteggio, conAutori: ris.conAutori, lingue: ris.lingue, dettagli })) log("registro delle biblioteche aggiornato");
  log(ris.cambiato ? `catalogo scritto: ${manoscritti.length} codici (${Object.entries(ris.conteggio).map(([k, n]) => k + " " + n).join(", ")}), ${ris.kb} KB in ${ris.file} file`
    : `catalogo invariato: ${manoscritti.length} codici`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
