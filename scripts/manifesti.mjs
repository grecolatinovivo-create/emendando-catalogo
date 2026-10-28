#!/usr/bin/env node
// Manifesti IIIF scritti dal catalogo, per le fonti i cui manifesti non si aprono dentro il sito:
//   - Library of Congress (microfilm del Sinai e di Gerusalemme): manifesti di loc.gov bloccati, immagini di tile.loc.gov aperte
//     (CORS *): manifesti P2 con il servizio Image di tile.loc.gov (scripts/fonti/loc.mjs);
//   - Real Academia de la Historia (DIGIBIB, scripts/fonti/digibib.mjs): niente IIIF, immagini JPEG caricabili come <img>: manifesti P2
//     con le immagini a misura fissa (misure di un'immagine per codice);
//   - Biblioteca Nazionale di Grecia: manifesti e info.json senza CORS, immagini caricabili come <img>: copie P2 con immagini
//     a misura fissa, senza servizio Image (scripts/fonti/nlg.mjs);
//   - Università di Atene, Pergamos (scripts/fonti/pergamos.mjs): niente IIIF, immagini JPEG con CORS aperto: manifesti P2 a misura fissa;
//   - America Latina, siti solo PDF (scripts/fonti/latam_pdf.mjs): manifesti P3 con le pagine estratte dai PDF nel ramo «immagini»;
//   - Biblioteca Malatestiana (Cesena): nessun IIIF, carte del visore caricabili come <img>: manifesti P2 con immagini a misura
//     fissa, senza servizio Image (scripts/fonti/malatestiana.mjs);
//   - handrit.is: nessun manifesto IIIF presso il sito, immagini JPEG aperte (CORS *): manifesti P2 con immagini a misura fissa
//     dalle descrizioni TEI (scripts/fonti/handrit.mjs);
//   - Fondazione per la conservazione del Nôm (Vietnam, scripts/fonti/nomfoundation.mjs): niente IIIF, immagini JPEG caricabili come <img>:
//     manifesti P2 a misura fissa (misura di un'immagine per volume);
//   - Darmstadt (TUdigit, dal Handschriftenportal): manifesti con immagini in http e servizio Image che non risponde: copie P2
//     con le immagini https a misura fissa (scripts/fonti/hsp.mjs, manifestoCopiaHsp);
//   - Det Kgl. Bibliotek, Copenaghen: nessun manifesto IIIF presso la biblioteca, immagini IIIF Image 2 aperte (kb-images.kb.dk, CORS *):
//     manifesti P2 con il servizio Image della biblioteca (scripts/fonti/kbdk.mjs);
//   - Bibliothèque nationale du Luxembourg (scripts/fonti/bnl.mjs): nessun manifesto IIIF presso la biblioteca, immagini IIIF Image 2
//     aperte (iiif.eluxemburgensia.lu, CORS *): manifesti P2 con il servizio Image della biblioteca e le misure di ogni pagina;
//   - Biblioteca Nazionale di Bulgaria (scripts/fonti/nbkm.mjs): niente IIIF, JPEG della biblioteca digitale caricabili come <img>:
//     manifesti P2 a misura fissa;
//   - lib-fond.ru (scripts/fonti/libfond.mjs): niente IIIF, JPEG di anteprima caricabili come <img>: manifesti P2 a misura fissa;
//   - papiri di Duke (GIF a 150 dpi) e di Colonia (JPEG originali, senza IIIF né CORS): manifesti P3 con le misure di ogni immagine
//     (scripts/fonti/papiri.mjs, manifestiPapiri);
//   - epigrafi (dal 28 ottobre 2026): EDH con più foto, Met e Wikidata (scripts/fonti/epigrafi.mjs, manifestiEpigrafi);
//   - Biblioteca della Matica srpska, Novi Sad (scripts/fonti/bms.mjs): niente IIIF, JPEG del visore caricabili come <img>: manifesti P2
//     con le misure di ciascuna immagine;
// Nessuna richiesta di rete: si scrivono dagli stati delle raccolte (data/loc.json, data/nlg.json, data/malatestiana.json, data/handrit.json, data/darmstadt.json e gli altri).
// I manifesti stanno nel ramo «manifesti» del repository, non in main (circa 400 MB di JSON): il workflow manifesti.yml
// li rigenera ogni giorno in una copia di quel ramo e salva solo se cambiano.
// Uso: node scripts/manifesti.mjs [--dir=<cartella radice della copia del ramo manifesti>]   (scrive <dir>/data/manifesti/<fonte>/<id>.json)
import fs from "node:fs";
import path from "node:path";
import * as loc from "./fonti/loc.mjs";
import * as nlg from "./fonti/nlg.mjs";
import * as digibib from "./fonti/digibib.mjs";
import * as latam from "./fonti/latam_pdf.mjs";
import * as pergamos from "./fonti/pergamos.mjs";
import * as malatestiana from "./fonti/malatestiana.mjs";
import * as handrit from "./fonti/handrit.mjs";
import * as hsp from "./fonti/hsp.mjs";
import * as nom from "./fonti/nomfoundation.mjs";
import * as kbdk from "./fonti/kbdk.mjs";
import * as bnl from "./fonti/bnl.mjs";
import * as nbkm from "./fonti/nbkm.mjs";
import * as libfond from "./fonti/libfond.mjs";
import * as bms from "./fonti/bms.mjs";
import * as papiri from "./fonti/papiri.mjs";
import * as epigrafi from "./fonti/epigrafi.mjs";

// scrive i manifesti che mancano o sono cambiati e toglie quelli dei codici usciti (solo se lo stato ha voci)
export function scriviManifesti(voci, cartella, scrivi) {
  fs.mkdirSync(cartella, { recursive: true });
  const nomi = new Set();
  let scritti = 0, tolti = 0;
  for (const [id, v] of Object.entries(voci)) {
    const m = scrivi(id, v); if (!m) continue;
    const f = path.join(cartella, id + ".json"); nomi.add(id + ".json");
    const testo = JSON.stringify(m) + "\n";
    let prima = null; try { prima = fs.readFileSync(f, "utf8"); } catch (e) {}
    if (prima !== testo) { fs.writeFileSync(f, testo); scritti++; }
  }
  if (nomi.size) for (const f of fs.readdirSync(cartella)) if (f.endsWith(".json") && !nomi.has(f)) { fs.unlinkSync(path.join(cartella, f)); tolti++; }
  return { scritti, tolti, totale: nomi.size };
}

export function scriviTutti(dir = ".") {
  const l = loc.leggiStato(), n = nlg.leggiStato(), ml = malatestiana.leggiStato();
  // Malatestiana: un file per codice, col nome del visore («DX.21.05.json»)
  const vociMl = Object.fromEntries(Object.entries(ml.voci || {}).filter(([, v]) => malatestiana.ammessaMalatestiana(v)).map(([id, v]) => [v.k, { id, v }]));
  return {
    loc: scriviManifesti(l.voci || {}, path.join(dir, "data/manifesti/loc"), (id, v) => (v ? loc.manifestoScritto(id, v) : null)),
    nlg: scriviManifesti(n.voci || {}, path.join(dir, "data/manifesti/nlg"), (id, v) => (v && nlg.numeroPagine(v.p) ? nlg.manifestoScritto(id, v) : null)),
    // Real Academia de la Historia (DIGIBIB): immagini JPEG della biblioteca a misura fissa
    ...Object.fromEntries(Object.keys(digibib.FONTI_DIGIBIB).map(f => [f, scriviManifesti(digibib.leggiStato(f).voci || {}, path.join(dir, "data/manifesti/" + f),
      (id, v) => (digibib.ammessaDigibib(f, v) && v.w ? digibib.manifestoScritto(f, id, v) : null))])),
    // Università di Atene (Pergamos): immagini JPEG del repository a misura fissa
    pergamos: scriviManifesti(pergamos.leggiStato().voci || {}, path.join(dir, "data/manifesti/pergamos"), (id, v) => (pergamos.ammessaPergamos(v) ? pergamos.manifestoScritto(id, v) : null)),
    // America Latina, siti solo PDF (Biblioteca Nacional de Chile, Biblioteca Nacional de Venezuela): manifesti P3 con le immagini
    // estratte dai PDF e salvate nel ramo «immagini»
    ...Object.fromEntries(Object.entries(latam.voci()).map(([f, vs]) => [f, scriviManifesti(vs, path.join(dir, "data/manifesti/" + f),
      (c, dims) => latam.manifestoLatam(f, c, dims))])),
    malatestiana: scriviManifesti(vociMl, path.join(dir, "data/manifesti/malatestiana"), (k, x) => malatestiana.manifestoScritto(x.id, x.v)),
    // Biblioteca Nazionale di Bulgaria: JPEG della biblioteca digitale a misura fissa (misure della prima immagine)
    nbkm: scriviManifesti(nbkm.leggiStato().voci || {}, path.join(dir, "data/manifesti/nbkm"), (id, v) => (nbkm.ammessaNbkm(v) ? nbkm.manifestoScritto(id, v) : null)),
    // lib-fond.ru (Biblioteca Statale Russa, Accademia Teologica di Mosca): JPEG di anteprima del sito a misura fissa
    libfond: scriviManifesti(libfond.leggiStato().voci || {}, path.join(dir, "data/manifesti/libfond"), (id, v) => (libfond.ammessaLibfond(v) ? libfond.manifestoScritto(id, v) : null)),
    // Biblioteca della Matica srpska (Novi Sad): JPEG del visore della biblioteca, misure di ciascuna immagine
    bms: scriviManifesti(bms.leggiStato().voci || {}, path.join(dir, "data/manifesti/bms"), (id, v) => (bms.ammessaBms(v) ? bms.manifestoScritto(id, v) : null)),
    // papiri (dal 28 ottobre 2026): Duke (GIF a 150 dpi, CORS aperto) e Colonia (JPEG originali, senza CORS), con le misure di ogni immagine
    ...Object.fromEntries(Object.entries(papiri.manifestiPapiri()).map(([f, vs]) => [f, scriviManifesti(vs, path.join(dir, "data/manifesti", f), (id, m) => m)])),
    // epigrafi (dal 28 ottobre 2026): EDH con più foto (servizi IIIF di heidICON), Met (JPEG del museo, CC0), Wikidata (immagini di Wikimedia Commons)
    ...Object.fromEntries(Object.entries(epigrafi.manifestiEpigrafi()).map(([f, vs]) => [f, scriviManifesti(vs, path.join(dir, "data/manifesti", f), (id, m) => m)])),
    handrit: scriviManifesti(handrit.leggiStato().voci || {}, path.join(dir, "data/manifesti/handrit"), (id, v) => (v && handrit.numeroPagine(v) ? handrit.manifestoScritto(id, v) : null)),
    // Fondazione per la conservazione del Nôm (Vietnam): immagini JPEG del sito a misura fissa; un file per volume, col nome dell'identificativo («nlvnpf-0106.json»)
    nomfoundation: scriviManifesti(Object.fromEntries(Object.entries(nom.leggiStato().voci || {}).filter(([, v]) => nom.ammessaNom(v)).map(([k, v]) => [v.img.toLowerCase(), { k, v }])),
      path.join(dir, "data/manifesti/nomfoundation"), (id, x) => nom.manifestoScritto(x.k, x.v)),
    // Det Kgl. Bibliotek: servizio Image della biblioteca, misure della prima immagine
    kbdk: scriviManifesti(kbdk.leggiStato().voci || {}, path.join(dir, "data/manifesti/kbdk"), (id, v) => (kbdk.ammessaKbdk(v) ? kbdk.manifestoScritto(id, v) : null)),
    // Bibliothèque nationale du Luxembourg: servizio IIIF Image della biblioteca, misure di ogni pagina
    bnl: scriviManifesti(bnl.leggiStato().voci || {}, path.join(dir, "data/manifesti/bnl"), (id, v) => (bnl.ammessaBnl(v) ? bnl.manifestoScritto(id, v) : null)),
    // Handschriftenportal, fonti con le copie dei manifesti (Darmstadt): un file per codice, con il nome della sigla del portale senza «HSP-»
    ...Object.fromEntries(Object.keys(hsp.FONTI_HSP).filter(hsp.copieHsp).map(f => [f, scriviManifesti(
      Object.fromEntries(Object.entries(hsp.leggiStato(f).voci || {}).map(([k, v]) => [k.replace(/^HSP-/, ""), v])),
      path.join(dir, "data/manifesti", f), (id, v) => (v && v.pg && !v.e ? hsp.manifestoCopiaHsp(f, id, v) : null))])),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
  const r = scriviTutti(arg.dir || ".");
  for (const [f, x] of Object.entries(r)) console.error(`${f}: ${x.totale} manifesti, ${x.scritti} scritti, ${x.tolti} tolti`);
}
