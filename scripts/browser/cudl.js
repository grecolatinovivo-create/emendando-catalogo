// Raccolta della Cambridge Digital Library (cudl.lib.cam.ac.uk) dal browser: SOLO DI RISERVA.
// Dal 26 ottobre 2026 la raccolta normale la fa il server (scripts/fonti/cudl.mjs, corsia uk): la pagina /collections non dà più
// l'elenco (sito rifatto) e risponde 403 ai server, ma le collezioni IIIF (/iiif/collection/all, /iiif/collection/<slug>) e i
// manifesti (/iiif/<id>) si aprono anche dal server. Questo script fa la stessa lettura da un normale browser, per il caso in cui
// anche le collezioni IIIF venissero chiuse ai server.
//
// Come si usa (Chrome):
//   1. aprire https://cudl.lib.cam.ac.uk/ in una scheda;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio (se Chrome lo chiede, scrivere prima «allow pasting»);
//   3. lasciare la scheda aperta: il titolo mostra l'avanzamento (un manifesto ogni 1,5 secondi);
//   4. alla fine il browser scarica «cudl.json»: va messo in data/cudl.json del repository emendando-catalogo e salvato con un commit
//      (stesso formato dello stato della raccolta dal server, «formato: 2»: la raccolta notturna lo riprende da lì).
// Se la scheda si chiude basta incollare di nuovo il file: riprende da dove si era fermato (avanzamento in IndexedDB).
// EmendandoCudl.salva() scarica subito quello che c'è; EmendandoCudl.azzera() ricomincia da capo.
(async function () {
  "use strict";
  // stesse collezioni di scripts/fonti/cudl.mjs (COLLEZIONI)
  const COLLEZIONI = ["medieval", "greekmanuscripts", "codexzacynthius", "christian", "hebrew", "islamic", "ethiopianmanuscripts", "minganalewis", "lewisgibson",
    "sanskrit", "ras", "aiit", "shahnama", "music", "treasures", "scriptorium", "medievalmedicalrecipes", "paperstocks", "linesofthought", "merlinfragment", "explosivewace",
    "thomasgray", "universitylibrary", "corpuschristicollege", "gonvilleandcaius", "peterhouse", "pembroke", "stjohns", "sidneysussex", "trinityhall", "clare", "christs",
    "queens", "stcatharines", "magdalenecollege", "downing", "girton", "newnham", "westminster", "kingsrarebooksandmanuscripts", "chinese", "japanese", "koreanworks"];
  const PAUSA = 1500, DB = "emendando-cudl-2";
  if (!/(^|\.)cudl\.lib\.cam\.ac\.uk$/.test(location.hostname)) { console.error("Apri prima https://cudl.lib.cam.ac.uk/ e incolla lo script nella console di quella scheda."); return; }
  const apri = () => new Promise((ok, ko) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("dati"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const db = await apri();
  const leggi = k => new Promise((ok, ko) => { const r = db.transaction("dati").objectStore("dati").get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const scrivi = (k, v) => new Promise((ok, ko) => { const t = db.transaction("dati", "readwrite"); t.objectStore("dati").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); });
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const json = async u => { for (let k = 0; k < 4; k++) { const r = await fetch(u); if (r.ok) return r.json(); if (r.status === 404) return null; await attendi(5000 * 2 ** k); } return null; };
  const pulito = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // metadati del manifesto -> scheda (stessi campi di schedaCudl in scripts/fonti/cudl-piattaforma.mjs)
  function scheda(man) {
    const m = {};
    for (const x of man.metadata || []) { const v = [].concat(x.value ?? []).map(pulito).filter(Boolean); if (v.length) (m[pulito(x.label)] = m[pulito(x.label)] || []).push(...v); }
    const u = (...k) => { for (const x of k) if (m[x] && m[x][0]) return m[x][0]; return null; };
    const at = pulito(man.attribution);
    return { s: u("Classmark", "Shelfmark"), t: u("Title"), u: u("Uniform Title", "Alternative Title(s)"), d: u("Date of Creation", "Date"), x: (m["Language(s)"] || []).slice(0, 3),
      f: u("Format"), p: u("Physical Location"), e: (u("Extent") || "").slice(0, 160) || null,
      au: [...(m["Author(s)"] || []), ...(m["Associated Name(s)"] || [])].join(" ; ").split(/\s*;\s*/).filter(Boolean).slice(0, 12),
      c: [u("Subject(s)"), u("Abstract")].filter(Boolean).join(" ; ").slice(0, 1200) || null, r: (/(CC BY-NC(?:-ND)? 4\.0)/i.exec(at) || [])[1] || null };
  }

  let st = (await leggi("stato")) || { ids: null, letti: 0, k: {}, coll: {} };
  async function salva() {
    const voci = {};
    for (const id of st.ids || []) { const v = await leggi("v:" + id); voci[id] = v ? { ...v, k: st.k[id] } : { q: 1, k: st.k[id] }; }
    const ora = new Date().toISOString(), finito = st.ids && st.letti >= st.ids.length;
    const dati = { formato: 2, aggiornato: ora, elenco: ora, completato: finito ? ora : null, totale: (st.ids || []).length, collezioni: st.coll, voci };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dati)], { type: "application/json" }));
    a.download = "cudl.json"; document.body.append(a); a.click(); a.remove();
    console.log(`cudl.json: ${Object.keys(voci).length} manifesti`);
  }
  async function azzera() { st = { ids: null, letti: 0, k: {}, coll: {} }; await scrivi("stato", st); console.log("Avanzamento cancellato: incolla di nuovo lo script."); }
  window.EmendandoCudl = { salva, azzera };

  // 1. elenco: manifesti delle collezioni IIIF
  if (!st.ids) {
    const ids = new Set();
    for (const c of COLLEZIONI) {
      document.title = `CUDL: collezione ${c}`;
      const j = await json(`/iiif/collection/${c}`);
      const ms = ((j && j.manifests) || []).map(m => String(m["@id"] || "").split("/iiif/")[1]).filter(Boolean);
      st.coll[c] = ms.length;
      for (const id of ms) { ids.add(id); (st.k[id] = st.k[id] || []).push(c); }
      await attendi(PAUSA);
    }
    st.ids = [...ids]; await scrivi("stato", st);
    console.log(`Elenco: ${st.ids.length} manifesti`);
  }
  // 2. metadati di ogni manifesto
  for (; st.letti < st.ids.length; st.letti++) {
    const id = st.ids[st.letti];
    if (!(await leggi("v:" + id))) {
      const man = await json(`/iiif/${id}`);
      await scrivi("v:" + id, man ? scheda(man) : 0);
      await attendi(PAUSA);
    }
    if (st.letti % 20 === 0) { await scrivi("stato", st); document.title = `CUDL: ${Math.round(100 * st.letti / st.ids.length)}% (${st.letti}/${st.ids.length})`; }
  }
  await scrivi("stato", st);
  document.title = "CUDL: finito";
  await salva();
})();
