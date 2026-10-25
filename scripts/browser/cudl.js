// Raccolta della Cambridge Digital Library (cudl.lib.cam.ac.uk) dal browser.
// I manifesti IIIF di Cambridge (cudl.lib.cam.ac.uk/iiif/<id>) e le immagini (images.lib.cam.ac.uk) si aprono anche dal server,
// con CORS aperto; le pagine dell'elenco (collezioni, ricerca, sitemap, persino robots.txt) invece rispondono 403 alle richieste
// che arrivano dai server (prova del 25 ottobre 2026). Per questo l'elenco si raccoglie da un normale browser, come per Gallica.
//
// Come si usa (Chrome):
//   1. aprire https://cudl.lib.cam.ac.uk/collections in una scheda;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio (se Chrome lo chiede, scrivere prima «allow pasting»);
//   3. lasciare la scheda aperta: il titolo mostra l'avanzamento. Prima si leggono le pagine delle collezioni (gli id dei codici),
//      poi la scheda JSON di ogni codice (/view/<id>.json, la stessa che usa il visore), una ogni 1,5 secondi;
//   4. alla fine il browser scarica «cudl.json»: va messo in data/cudl.json del repository emendando-catalogo e salvato con un commit.
// Se la scheda si chiude basta riaprire CUDL e incollare di nuovo il file: riprende da dove si era fermato (avanzamento in IndexedDB).
// EmendandoCudl.salva() scarica subito quello che c'è; EmendandoCudl.azzera() ricomincia da capo.
// Collezioni: tutte quelle elencate nella pagina /collections, tranne quelle in ESCLUSE (archivi e carte moderne: Darwin, Newton,
// Longitude e simili; la Genizah, circa 200.000 frammenti, si può aggiungere togliendola da ESCLUSE). I codici dopo il 1800, le lettere
// e le carte non librarie restano fuori anche nel catalogo (scripts/fonti/cudl.mjs).
//
// Formato di data/cudl.json: { formato: 1, raccolto, collezioni: [slug], voci: { <id>: scheda } }
// scheda: { s: segnatura, t: titolo, u: titolo uniforme, d: datazione, a0, a1: anni, l: codici di lingua, x: lingue, f: forma,
//           c: collezioni, p: biblioteca, au: autori }
(async function () {
  "use strict";
  const ESCLUSE = /^(genizah|darwin|newton|longitude|sassoon|board-of-longitude|scientific|photographs|maps|royal-commonwealth-society|rcs|tennyson|siegfried|sassoon|wwi|ww1|cambridge-university|archives|letters|papers)/i;
  const PAUSA = 1500, DB = "emendando-cudl";
  if (!/(^|\.)cudl\.lib\.cam\.ac\.uk$/.test(location.hostname)) { console.error("Apri prima https://cudl.lib.cam.ac.uk/collections e incolla lo script nella console di quella scheda."); return; }
  const apri = () => new Promise((ok, ko) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("dati"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const db = await apri();
  const leggi = k => new Promise((ok, ko) => { const r = db.transaction("dati").objectStore("dati").get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const scrivi = (k, v) => new Promise((ok, ko) => { const t = db.transaction("dati", "readwrite"); t.objectStore("dati").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); });
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const testo = async u => { for (let k = 0; k < 4; k++) { const r = await fetch(u, { credentials: "same-origin" }); if (r.ok) return r.text(); if (r.status === 404) return null; await attendi(5000 * 2 ** k); } return null; };
  const pulito = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const df = x => (x && x.displayForm ? pulito(x.displayForm) : null);
  const valori = x => (x && Array.isArray(x.value) ? x.value.map(df).filter(Boolean) : []);

  function scheda(j) {
    const m = (j.descriptiveMetadata || [])[0] || {};
    const cr = (m.creations && m.creations.value && m.creations.value[0]) || {};
    const anno = s => { const n = parseInt(String(s || "").slice(0, 4), 10); return Number.isFinite(n) ? n : null; };
    return { s: df(m.shelfLocator), t: df(m.title), u: df(m.uniformTitle), d: df(cr.dateDisplay), a0: anno(cr.dateStart), a1: anno(cr.dateEnd),
      l: m.languageCodes || [], x: m.languages || [], f: df(m.form), c: (j.collection || []).map(c => c["url-slug"]).filter(Boolean),
      p: df(m.physicalLocation), au: [...valori(m.authors), ...valori(m.names)].slice(0, 12) };
  }

  let st = (await leggi("stato")) || { collezioni: null, fatte: [], ids: [], letti: 0 };
  async function salva() {
    const voci = {};
    for (const id of st.ids) { const v = await leggi("v:" + id); if (v) voci[id] = v; }
    const dati = { formato: 1, raccolto: new Date().toISOString(), collezioni: st.collezioni, voci };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dati)], { type: "application/json" }));
    a.download = "cudl.json"; document.body.append(a); a.click(); a.remove();
    console.log(`cudl.json: ${Object.keys(voci).length} codici`);
  }
  async function azzera() { st = { collezioni: null, fatte: [], ids: [], letti: 0 }; await scrivi("stato", st); console.log("Avanzamento cancellato: incolla di nuovo lo script."); }
  window.EmendandoCudl = { salva, azzera };

  // 1. collezioni
  if (!st.collezioni) {
    const h = await testo("/collections");
    st.collezioni = [...new Set([...(h || "").matchAll(/href="\/collections\/([a-z0-9_-]+)(?:\/1)?"/gi)].map(m => m[1]))].filter(c => !ESCLUSE.test(c));
    await scrivi("stato", st);
    console.log("Collezioni:", st.collezioni.join(", "));
  }
  // 2. id dei codici, pagina per pagina di ogni collezione (si ferma quando una pagina non porta id nuovi)
  const ids = new Set(st.ids);
  for (const c of st.collezioni) {
    if (st.fatte.includes(c)) continue;
    for (let p = 1; p < 2000; p++) {
      document.title = `CUDL: ${c}, pagina ${p} (${ids.size} codici)`;
      const h = await testo(`/collections/${c}/${p}`);
      const nuovi = [...(h || "").matchAll(/\/view\/([A-Z0-9][A-Z0-9-]+[A-Z0-9])/g)].map(m => m[1]).filter(id => !ids.has(id));
      if (!nuovi.length) break;
      for (const id of nuovi) ids.add(id);
      await attendi(PAUSA);
    }
    st.fatte.push(c); st.ids = [...ids]; await scrivi("stato", st);
    console.log(`${c}: ${ids.size} codici finora`);
  }
  // 3. scheda JSON di ogni codice
  for (; st.letti < st.ids.length; st.letti++) {
    const id = st.ids[st.letti];
    if (!(await leggi("v:" + id))) {
      const t = await testo(`/view/${id}.json`);
      if (t) { try { await scrivi("v:" + id, scheda(JSON.parse(t))); } catch (e) { console.warn(id, e); } }
      await attendi(PAUSA);
    }
    if (st.letti % 20 === 0) { await scrivi("stato", st); document.title = `CUDL: ${Math.round(100 * st.letti / st.ids.length)}% (${st.letti}/${st.ids.length})`; }
  }
  await scrivi("stato", st);
  document.title = "CUDL: finito";
  await salva();
})();
