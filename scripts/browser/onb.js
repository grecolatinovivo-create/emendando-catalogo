// Raccolta dei codici della Österreichische Nationalbibliothek (Vienna) dal browser, di riserva.
// Di norma la raccolta la fa il server (scripts/fonti/onb.mjs, corsia giornaliera): il 26 ottobre 2026 onb.digital e api.onb.ac.at
// rispondono anche ai server. Se tornassero a chiudere le richieste dei server (come fanno iiif.onb.ac.at e digital.onb.ac.at),
// questo script rifà la stessa raccolta da un normale browser e produce lo stesso data/onb.json.
// Il catalogo (Primo, search.onb.ac.at) vieta i robot in tutto il sito (robots.txt «Disallow: /»): per questo si usa ÖNB Digital.
//
// Che cosa fa: ripete la ricerca di ÖNB Digital che fa la pagina (POST /Frontend/search_api_search, tipo «MANUSCRIPT», parola
// «Handschrift», senza «Partitur» e «Stimmen»), poi legge il manifesto IIIF di ogni candidato (api.onb.ac.at, CORS aperto) e tiene
// segnatura, titolo, datazione, lingue, descrizione fisica: entrano nel catalogo (scripts/fonti/onb.mjs) solo i «Cod.» e i
// «Fragm.» descritti come «Handschrift…». Una richiesta ogni 1,6 secondi: circa 3 ore per 6.400 candidati.
//
// Come si usa (Chrome):
//   1. aprire https://onb.digital/search (senza accettare cookie non necessari: non servono);
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio (se Chrome lo chiede, scrivere prima «allow pasting»);
//   3. lasciare la scheda aperta: il titolo mostra l'avanzamento; l'avanzamento resta in IndexedDB e lo script, incollato di nuovo, riprende;
//   4. alla fine il browser scarica «onb.json»: va messo in data/onb.json del repository emendando-catalogo e salvato con un commit.
// EmendandoOnb.salva() scarica subito quello che c'è; EmendandoOnb.json() lo restituisce senza scaricarlo; EmendandoOnb.azzera() cancella tutto.
//
// Formato di data/onb.json (lo stesso di scripts/fonti/onb.mjs): { aggiornato, elenco, completato, totale, ricerca, voci: { <id>: scheda } }
// scheda: { e: { t, a, d } dalla ricerca; poi s: segnatura, t: titolo, d: datazione, l: lingue, u: descrizione fisica, a: persone, c: note, n: immagini
//           oppure x: motivo dell'esclusione }
(async function () {
  "use strict";
  const PAUSA = 1600, RIGHE = 300, DB = "emendando-onb", QUERY = "Handschrift NOT Partitur NOT Stimmen";
  if (location.hostname !== "onb.digital") { console.error("Apri prima https://onb.digital/search e incolla lo script nella console di quella scheda."); return; }
  const apri = () => new Promise((ok, ko) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("dati"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const db = await apri();
  const leggi = k => new Promise((ok, ko) => { const r = db.transaction("dati").objectStore("dati").get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const scrivi = (k, v) => new Promise((ok, ko) => { const t = db.transaction("dati", "readwrite"); t.objectStore("dati").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); });
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const dec = s => { const t = document.createElement("textarea"); t.innerHTML = String(s || "").replace(/<[^>]+>/g, " "); return t.value.replace(/\s+/g, " ").trim(); };

  const st = (await leggi("stato")) || { aggiornato: null, elenco: null, completato: null, totale: 0, ricerca: QUERY, voci: {} };
  const json = () => JSON.stringify(st);
  function salva() {
    const b = new Blob([json()], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = "onb.json"; document.body.appendChild(a); a.click(); a.remove();
  }
  window.EmendandoOnb = { stato: st, json, salva, azzera: async () => { await scrivi("stato", null); console.log("avanzamento cancellato"); } };

  // 1. elenco dei candidati
  if (!st.elenco) {
    let totale = null;
    for (let da = 0; totale == null || da < totale; da += RIGHE) {
      const api = `https://digital.onb.ac.at/rep/discovery/public/search?query=${encodeURIComponent(QUERY)}&filter.mediatype=(%22MANUSCRIPT%22)&fulltext=false&sort=+&rows=${RIGHE}&facetlimit=1&from=${da}`;
      const corpo = new URLSearchParams({ api_query: api, item_id: "", keywords: "", from: "", rows: String(RIGHE), auto_complete: "false",
        filters_array: JSON.stringify({ keywords: "", fulltext: "false", years: { von: "", bis: "" }, sort: "+" }) });
      const t = await (await fetch("/Frontend/search_api_search", { method: "POST", body: corpo })).text();
      const d = JSON.parse(t.slice(t.indexOf('{"api_url"')));
      totale = +String(d.results_count || "0").replace(/\D/g, "");
      const parti = String(d.results_container || "").split('<div id="result_').slice(1);
      for (const p of parti) {
        const id = p.split('"')[0];
        const campi = [...p.matchAll(/<div class="result_text_[a-z_ ]+">([\s\S]*?)<\/div>/g)].map(m => dec(m[1]));
        if (!st.voci[id]) st.voci[id] = { e: { t: campi[1] || null, a: campi[2] || null, d: campi[4] || null } };
      }
      document.title = `ÖNB elenco ${Object.keys(st.voci).length}/${totale}`;
      if (!parti.length) break;
      await attendi(PAUSA);
    }
    st.totale = totale; st.elenco = st.aggiornato = new Date().toISOString();
    await scrivi("stato", st);
    console.log(`elenco: ${Object.keys(st.voci).length} candidati`);
  }

  // 2. manifesti
  const val = v => { if (!v) return []; return (v.de || v.none || v.en || Object.values(v)[0] || []).map(dec).filter(Boolean); };
  const da = Object.keys(st.voci).filter(id => !st.voci[id].s && !st.voci[id].x);
  let n = 0;
  for (const id of da) {
    await attendi(PAUSA);
    n++;
    try {
      const r = await fetch(`https://api.onb.ac.at/iiif/presentation/v3/manifest/${id}`);
      if (!r.ok) { if (r.status === 404) st.voci[id] = { e: st.voci[id].e, x: "HTTP 404" }; continue; }
      const m = await r.json(), meta = {};
      for (const x of m.metadata || []) { const k = ((x.label && (x.label.de || x.label.en || Object.values(x.label)[0])) || [])[0]; if (k) meta[k] = x.value; }
      const s = (val(meta["Signatur"])[0] || "").replace(/\s+(HAN|MUS|PAP|KAR)\s+[A-Z]+$/, "").trim(), u = val(meta["Umfang"]).join(" ; "), k = (m.items || []).length;
      const e = st.voci[id].e;
      if (!/^(Cod\.|Fragm\.)\s/.test(s)) st.voci[id] = { x: "segnatura " + (s.split(/[\s.]/)[0] || "assente"), s: s || undefined, e };
      else if (!/^Handschrift/i.test(u)) st.voci[id] = { x: "non è un codice (" + (u.slice(0, 40) || "senza descrizione fisica") + ")", s, e };
      else if (!k) st.voci[id] = { x: "manifesto senza pagine", s, e };
      else {
        const lingue = meta["Sprachen"] ? (meta["Sprachen"].en || meta["Sprachen"].de || []).map(dec) : [];
        st.voci[id] = { s, t: val(meta["Titel"]).join(" ; ") || null, d: val(meta["Jahr/Datierung"])[0] || null, l: lingue, u: u.slice(0, 300),
          a: val(meta["Person"]).map(p => p.replace(/\s*--\s*\(GND:.*$/, "").replace(/\s*\[[^\]]*\]\s*$/, "")).slice(0, 10), c: val(meta["Weitere Informationen"]).join(" ; ").slice(0, 1500) || null, n: k, e };
      }
    } catch (err) { console.warn("manifesto non leggibile:", id, err.message); }
    if (n % 25 === 0) { st.aggiornato = new Date().toISOString(); await scrivi("stato", st); }
    document.title = `ÖNB ${n}/${da.length}`;
  }
  st.aggiornato = new Date().toISOString();
  if (!Object.values(st.voci).some(v => !v.s && !v.x)) st.completato = st.aggiornato;
  await scrivi("stato", st);
  window.EmendandoOnb.fine = true;
  if (!navigator.webdriver) salva();
  console.log(`fatto: ${Object.values(st.voci).filter(v => v.s && !v.x).length} codici su ${Object.keys(st.voci).length} candidati`);
})();
