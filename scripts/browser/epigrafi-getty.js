// Raccolta dal browser delle ISCRIZIONI del J. Paul Getty Museum (dal 28 ottobre 2026): la SPARQL di data.getty.edu ora risponde
// «Wrong Authorization Token» e il certificato di data.getty.edu non si verifica dal nostro ambiente di lavoro; la ricerca del sito
// del museo e le schede Linked Art si leggono invece da un normale Chrome. Il risultato è data/epigrafi-getty.json, che la fonte
// «epibrowser» (scripts/fonti/epigrafi-browser.mjs) si limita a leggere.
//
// Come si usa (Chrome):
//   1. aprire https://www.getty.edu/art/collection/ in una scheda;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio;
//   3. lasciare la scheda aperta: il titolo mostra l'avanzamento (una richiesta ogni 2,1 secondi; robots.txt del Getty senza Crawl-delay);
//   4. alla fine il browser scarica «epigrafi-getty.json», da mettere in data/ del repository emendando-catalogo e salvare con un commit.
//
// Passi: ricerche del sito (www.getty.edu/art/collection/api/search, 48 risultati per pagina) per tipo d'oggetto («Inscription»,
// «Stele», «Altar», «Plaque») e per parole («greek inscription», «latin inscription», «funerary inscription», «stele», «epitaph»…);
// fuori subito gli oggetti senza manifesto o non Open Content (CC0) e quelli con un nome da vaso, moneta, gemma, gioiello, foto, stampa;
// poi la scheda Linked Art di ogni candidato (data.getty.edu/museum/collection/object/<uuid>); restano gli oggetti classificati
// «Inscriptions» (AAT 300028702) o con un nome da iscrizione; infine il manifesto IIIF di ognuno (numero delle immagini e «rights»).
// Formato: { formato: 1, raccolto, nota, ricerche, candidati, letti, voci: { <uuid>: { n nome, cu culture, a inventario, d data,
//   s percorso della pagina, m manifesto, cc0, cl classificazioni, note (testi brevi per tipo), t0 t1 estremi, luogo, dove, mat,
//   ni immagini, mr rights del manifesto, tieni } } }
(async function () {
  "use strict";
  if (!/(^|\.)getty\.edu$/.test(location.hostname)) { console.error("Apri prima https://www.getty.edu/art/collection/ e incolla lo script nella console di quella scheda."); return; }
  const PAUSA = 2100;
  const G = window.EmendandoGetty = { cand: {}, voci: {}, log: [], richieste: 0 };
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const get = async u => { await attendi(PAUSA); G.richieste++; document.title = `Emendando: ${G.richieste} richieste`; const r = await fetch(u, { credentials: "omit" }); if (!r.ok) throw new Error(r.status + " " + u); return r.json(); };
  const RICERCHE = [["", "Inscription"], ["", "Stele"], ["", "Altar"], ["", "Plaque"], ["greek inscription", ""], ["latin inscription", ""], ["funerary inscription", ""],
    ["grave stele", ""], ["stele", ""], ["stela", ""], ["epitaph", ""], ["decree", ""], ["dedication", ""], ["curse tablet", ""], ["epigram", ""],
    ["inscribed slab", ""], ["inscribed base", ""], ["inscribed block", ""]];
  for (const [q, c] of RICERCHE) {
    for (let from = 0; from < 1500; from += 48) {
      const j = await get("/art/collection/api/search?from=" + from + "&size=48&q=" + encodeURIComponent(q) + (c ? "&classification_and_object_type=" + encodeURIComponent(c) : ""));
      for (const d of j.data || []) {
        const id = d.id.replace("object/", "");
        if (!G.cand[id]) G.cand[id] = { n: d.primary_name, cu: d.culture, a: d.accession_number || d.object_number, d: d.date_created, s: d.slug_with_path,
          m: d.manifest && d.manifest.url, cc0: !!(d.manifest && /publicdomain\/zero/.test(JSON.stringify(d.manifest.attribution || ""))), r: [] };
        G.cand[id].r.push(q || c);
      }
      if (from + 48 >= j.total) break;
    }
  }
  const NO = /\b(coin|tetradrachm|drachm|stater|denarius|aureus|solidus|obol|kylix|cup|amphora|lekythos|krater|hydria|oinochoe|pyxis|skyphos|aryballos|alabastron|lamp|ring|gem|intaglio|cameo|scarab|seal|bowl|jug|vase|vessel|mirror|fibula|bracelet|earring|necklace|photograph|print|drawing|manuscript|leaf|book|portrait of|head of|statuette|figurine)\b/i;
  const ids = Object.keys(G.cand).filter(k => { const v = G.cand[k]; return v.m && v.cc0 && !NO.test(v.n || ""); });
  let letti = 0;
  for (const id of ids) {
    try {
      const o = await get("https://data.getty.edu/museum/collection/object/" + id);
      const note = {};
      for (const x of o.referred_to_by || []) {
        const k = ((x.classified_as || [])[0] || {})._label || "?"; if (/Citation|Rights|Visitor|Access/i.test(k)) continue;
        (note[k] = note[k] || []).push(String(x.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500));
      }
      const p = o.produced_by || {}, ts = p.timespan || {};
      G.voci[id] = { ...G.cand[id], cl: (o.classified_as || []).map(c => c.id.replace("http://vocab.getty.edu/aat/", "aat:") + "|" + (c._label || "")), note,
        t0: ts.begin_of_the_begin || null, t1: ts.end_of_the_end || null, luogo: (p.took_place_at || []).map(x => x._label).filter(Boolean),
        dove: [o.current_location, o.current_keeper].flat().filter(Boolean).map(x => x._label).filter(Boolean), mat: (o.made_of || []).map(x => x._label).filter(Boolean) };
    } catch (e) { G.log.push("scheda " + id + " " + e.message); }
    letti++;
  }
  const tieni = Object.keys(G.voci).filter(id => { const v = G.voci[id]; return v.cl.some(c => c.startsWith("aat:300028702")) || /inscri|stel[ae]\b|epitaph|decree|curse|epigram|dedicat/i.test(v.n || ""); });
  for (const id of tieni) {
    try { const m = await get(G.voci[id].m); const its = m.items || (m.sequences && m.sequences[0].canvases) || []; Object.assign(G.voci[id], { ni: its.length, mr: m.rights || m.license || null, tieni: 1 }); }
    catch (e) { G.log.push("manifesto " + id + " " + e.message); }
  }
  const voci = Object.fromEntries(Object.entries(G.voci).filter(([, v]) => v.tieni).map(([k, v]) => { const w = { ...v }; delete w.r; delete w.tieni; w.tieni = 1; return [k, w]; }));
  const dati = { formato: 1, raccolto: new Date().toISOString(), nota: "Raccolta fatta dal browser con scripts/browser/epigrafi-getty.js (ricerca del sito del Getty, schede Linked Art e manifesti IIIF; una richiesta ogni 2,1 secondi).",
    ricerche: RICERCHE.map(([q, c]) => q || "tipo: " + c), candidati: Object.keys(G.cand).length, letti, errori: G.log, voci };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(dati)], { type: "application/json" }));
  a.download = "epigrafi-getty.json"; document.body.append(a); a.click(); a.remove();
  document.title = `Emendando: finito, ${Object.keys(voci).length} iscrizioni`;
})();
