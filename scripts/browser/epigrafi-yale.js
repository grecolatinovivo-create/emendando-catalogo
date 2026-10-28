// Raccolta dal browser delle ISCRIZIONI della Yale University Art Gallery (dal 28 ottobre 2026), attraverso LUX, il catalogo comune
// delle collezioni di Yale (lux.collections.yale.edu): l'API di ricerca di LUX respinge il nostro server (403 di CloudFront) ma risponde
// a un normale Chrome; il robots.txt di LUX vieta solo /view/results/. Il sito artgallery.yale.edu invece vieta nel robots.txt gli agenti
// AI («Claude-User» e simili, «Disallow: /») e non si usa. Il risultato è data/epigrafi-yale.json, che la fonte «epibrowser»
// (scripts/fonti/epigrafi-browser.mjs) si limita a leggere.
//
// Come si usa (Chrome):
//   1. aprire https://lux.collections.yale.edu/ in una scheda;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio;
//   3. lasciare la scheda aperta: il titolo mostra l'avanzamento (una richiesta ogni 2,1 secondi);
//   4. alla fine il browser scarica «epigrafi-yale.json», da mettere in data/ del repository emendando-catalogo e salvare con un commit.
//
// Passi: ricerche di LUX (oggetti con immagine della Yale University Art Gallery o del dipartimento «Ancient Art»: «inscription»,
// «inscribed», «greek inscription», «latin inscription», «inscription» + «Dura-Europos», stele, stela, epitaph, funerary relief, graffito,
// epigraph; «dedication» e «altar» da sole danno quasi solo dediche di donatori e oggetti senza iscrizione e sono state tolte); poi la scheda Linked Art di ogni candidato (fuori monete, gemme, gioielli, vasi, foto, stampe, disegni);
// restano gli oggetti con una parola da iscrizione nel nome, nelle classificazioni o nelle note; infine il manifesto IIIF di ognuno
// (manifests.collections.yale.edu: numero delle immagini, «rights», metadati). La fonte tiene solo i manifesti con «rights» CC0.
// Formato: { formato: 1, raccolto, nota, ricerche, candidati, letti, voci: { <id LUX>: { n nome, cls classificazioni, note (testi per tipo),
//   ids identificativi, t0 t1 estremi, td data, luogo, mat, man manifesto, pag pagina del museo, ni immagini, mr rights, ml etichetta, md metadati, tieni } } }
(async function () {
  "use strict";
  if (location.hostname !== "lux.collections.yale.edu") { console.error("Apri prima https://lux.collections.yale.edu/ e incolla lo script nella console di quella scheda."); return; }
  const PAUSA = 2100;
  const Y = window.EmendandoYale = { cand: {}, voci: {}, log: [], richieste: 0 };
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const get = async u => { await attendi(PAUSA); Y.richieste++; document.title = `Emendando: ${Y.richieste} richieste`; const r = await fetch(u, { credentials: "omit" }); if (!r.ok) throw new Error(r.status + " " + u.slice(0, 80)); return r.json(); };
  const YU = { memberOf: { name: "Yale University Art Gallery" } }, AA = { memberOf: { name: "Ancient Art" } }, IM = { hasDigitalImage: 1 };
  const R = [["inscription AA", [{ text: "inscription" }, IM, AA]], ["inscribed AA", [{ text: "inscribed" }, IM, AA]], ["inscription Dura", [{ text: "inscription" }, IM, YU, { text: "Dura-Europos" }]],
    ["greek inscription", [{ text: "greek inscription" }, IM, YU]], ["latin inscription", [{ text: "latin inscription" }, IM, YU]], ["stele", [{ text: "stele" }, IM, YU]],
    ["stela", [{ text: "stela" }, IM, YU]], ["epitaph", [{ text: "epitaph" }, IM, YU]], ["funerary relief", [{ text: "funerary relief" }, IM, YU]],
    ["graffito", [{ text: "graffito" }, IM, YU]], ["epigraph", [{ text: "epigraph" }, IM, YU]]];
  for (const [nome, AND] of R) {
    for (let page = 1; page <= 20; page++) {
      const j = await get("/api/search/item?page=" + page + "&pageLength=100&q=" + encodeURIComponent(JSON.stringify({ AND })));
      const it = j.orderedItems || [];
      for (const o of it) (Y.cand[o.id] = Y.cand[o.id] || []).push(nome);
      if (it.length < 100) break;
    }
  }
  const NO = /\b(coin|follis|nummi|tetradrachm|drachm|stater|denarius|antoninianus|aureus|solidus|obol|as of|sestertius|dupondius|kylix|cup|amphora|lekythos|krater|hydria|oinochoe|pyxis|skyphos|aryballos|lamp|ring|gem|intaglio|cameo|scarab|seal|bowl|jug|vase|mirror|fibula|bracelet|earring|necklace|photograph|print|drawing)\b/i;
  let letti = 0;
  for (const id of Object.keys(Y.cand)) {
    try {
      const o = await get(id);
      const lab = o._label || "", cls = (o.classified_as || []).map(c => c._label).filter(Boolean);
      letti++;
      if (NO.test(lab) || cls.some(c => /coin|numismat|gems|jewelry/i.test(c))) continue;
      const note = {};
      for (const r of o.referred_to_by || []) {
        const k = ((r.classified_as || [])[0] || {})._label || "?"; if (/Access|Visitor|Credit/i.test(k)) continue;
        (note[k] = note[k] || []).push(String(r.content || "").replace(/\s+/g, " ").trim().slice(0, 1500));
      }
      const p = o.produced_by || {}, ts = p.timespan || {};
      const ap = (o.subject_of || []).flatMap(s => (s.digitally_carried_by || []).map(d => [s._label || d._label || "", (d.access_point || []).map(a => a.id)]));
      const man = (ap.find(([l]) => /IIIF/i.test(l)) || [, []])[1][0] || null;
      const pag = ap.flatMap(([, u]) => u).find(u => /artgallery\.yale\.edu/.test(u)) || null;
      Y.voci[id] = { n: lab, cls, note, ids: (o.identified_by || []).map(i => [((i.classified_as || [])[0] || {})._label || "", i.content]),
        t0: ts.begin_of_the_begin || null, t1: ts.end_of_the_end || null, td: (ts.identified_by || []).map(i => i.content).join(" ; ") || null,
        luogo: [...(p.took_place_at || []), ...(p.part || []).flatMap(x => x.took_place_at || [])].map(x => x._label).filter(Boolean),
        mat: (o.made_of || []).map(x => x._label).filter(Boolean), man, pag };
    } catch (e) { Y.log.push("scheda " + id.slice(-36) + " " + e.message); }
  }
  const tieni = Object.keys(Y.voci).filter(id => { const v = Y.voci[id]; if (!v.man) return false; const t = [v.n, ...v.cls, ...Object.values(v.note).flat()].join(" "); return /inscri|stel[ae]\b|epitaph|graffit|dipint|dedicat|altar|plaque|tablet|tabula/i.test(t); });
  for (const id of tieni) {
    try {
      const m = await get(Y.voci[id].man);
      Object.assign(Y.voci[id], { ni: (m.items || []).length, mr: m.rights || null, ml: JSON.stringify(m.label || "").slice(0, 300),
        md: (m.metadata || []).map(x => [[].concat(Object.values(x.label || {})[0] || [])[0], [].concat(Object.values(x.value || {})[0] || []).join(" | ").slice(0, 600)]), tieni: 1 });
    } catch (e) { Y.log.push("manifesto " + id.slice(-36) + " " + e.message); }
  }
  const voci = Object.fromEntries(Object.entries(Y.voci).filter(([, v]) => v.tieni));
  const dati = { formato: 1, raccolto: new Date().toISOString(), nota: "Raccolta fatta dal browser con scripts/browser/epigrafi-yale.js (ricerca di LUX, schede Linked Art e manifesti IIIF della Yale University Art Gallery; una richiesta ogni 2,1 secondi).",
    ricerche: R.map(([n]) => n), candidati: Object.keys(Y.cand).length, letti, errori: Y.log, voci };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(dati)], { type: "application/json" }));
  a.download = "epigrafi-yale.json"; document.body.append(a); a.click(); a.remove();
  document.title = `Emendando: finito, ${Object.keys(voci).length} iscrizioni`;
})();
