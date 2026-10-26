// Raccolta dei manoscritti della Biblioteca Classense (Ravenna) dal browser.
// Il sito delle Collezioni Digitali Classensi (www.cdc.classense.ra.it, Omeka S) risponde 403 alle richieste che arrivano dai server
// e il robots.txt vieta l'API (/api/); le pagine pubbliche e i manifesti IIIF invece si aprono da un normale browser.
// Lo script legge la pagina dell'insieme «Manoscritti» (item set 25527) e il manifesto IIIF di ogni scheda, con una pausa
// di 1,6 secondi tra una richiesta e l'altra.
//
// Come si usa (Chrome):
//   1. aprire https://www.cdc.classense.ra.it/s/Classense/page/home;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio (se Chrome lo chiede, scrivere prima «allow pasting»);
//   3. alla fine il browser scarica «classense.json»: va messo in data/classense.json del repository emendando-catalogo e salvato con un commit.
// Se lo script gira in un browser comandato da un programma, EmendandoClassense.json() restituisce il file senza scaricarlo.
//
// Formato di data/classense.json: { formato: 1, raccolto, insieme, voci: { <id Omeka>: scheda } }
// scheda: { s: segnatura, t: titolo, d: datazione, l: lingue, a: autori, c: descrizione, n: immagini nel manifesto }
(async function () {
  "use strict";
  const INSIEME = 25527, PAUSA = 1600;
  if (!/(^|\.)cdc\.classense\.ra\.it$/.test(location.hostname)) { console.error("Apri prima https://www.cdc.classense.ra.it/s/Classense/page/home e incolla lo script nella console di quella scheda."); return; }
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const dec = s => { const t = document.createElement("textarea"); t.innerHTML = String(s || "").replace(/<[^>]+>/g, " "); return t.value.replace(/\s+/g, " ").trim(); };
  const stato = { formato: 1, raccolto: null, insieme: INSIEME, voci: {} };
  const json = () => JSON.stringify(stato);
  window.EmendandoClassense = { stato, json, fine: false };

  // elenco: pagina pubblica dell'insieme (fino a 100 schede per pagina)
  const ids = [];
  for (let p = 1; ; p++) {
    const h = await (await fetch(`/s/Classense/item?item_set_id=${INSIEME}&per_page=100&page=${p}`)).text();
    const d = new DOMParser().parseFromString(h, "text/html");
    const nuovi = [...new Set([...d.querySelectorAll("a")].map(a => a.href).filter(x => /\/s\/Classense\/item\/\d+$/.test(x)).map(x => x.split("/").pop()))].filter(x => !ids.includes(x));
    ids.push(...nuovi);
    if (nuovi.length < 100) break;
    await attendi(PAUSA);
  }
  console.log(`${ids.length} schede nell'insieme Manoscritti`);
  for (const id of ids) {
    await attendi(PAUSA);
    try {
      const m = await (await fetch(`/iiif/2/${id}/manifest`)).json();
      const meta = {};
      for (const x of m.metadata || []) meta[x.label] = [].concat(x.value).map(dec).join(" ; ");
      const v = { s: meta["Segnatura"] || null, t: meta["Titolo"] || dec(m.label) || null, d: meta["Data di pubblicazione/esecuzione"] || null,
        l: meta["Lingua"] ? meta["Lingua"].split(/\s*;\s*/) : [], a: meta["Autore"] ? meta["Autore"].split(/\s*;\s*/).slice(0, 6) : [],
        c: (meta["Descrizione"] || "").slice(0, 1000) || null, n: (((m.sequences || [])[0] || {}).canvases || []).length };
      for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
      stato.voci[id] = v;
    } catch (e) { console.warn("manifesto non leggibile:", id, e.message); }
    document.title = `Classense ${Object.keys(stato.voci).length}/${ids.length}`;
  }
  stato.raccolto = new Date().toISOString();
  window.EmendandoClassense.fine = true;
  if (navigator.webdriver) return;
  const b = new Blob([json()], { type: "application/json" }), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "classense.json"; document.body.appendChild(a); a.click(); a.remove();
  console.log(`classense.json scaricato: ${Object.keys(stato.voci).length} schede`);
})();
