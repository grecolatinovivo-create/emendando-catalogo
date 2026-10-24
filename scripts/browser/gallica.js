// Raccolta di Gallica dal browser: TUTTI i manoscritti (ogni fondo e lingua, anche delle biblioteche partner di Gallica).
// Gallica respinge le richieste che arrivano dai server, non quelle di un normale browser: per questo la raccolta si fa così.
//
// Come si usa (Chrome):
//   1. aprire https://gallica.bnf.fr/ in una scheda;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio;
//   3. lasciare la scheda aperta: il titolo della scheda mostra l'avanzamento (una pagina di 50 schede ogni 3 secondi circa);
//   4. alla fine il browser scarica «gallica.json»: va messo in data/gallica.json del repository emendando-catalogo e salvato con un commit.
// Se la scheda si chiude o il computer si spegne, basta riaprire Gallica e incollare di nuovo il file: la raccolta riprende da dove
// si era fermata (l'avanzamento resta nel browser, in IndexedDB). Per scaricare subito quello che c'è: EmendandoGallica.salva().
// Per ricominciare da capo: EmendandoGallica.azzera(), poi incollare di nuovo il file.
//
// Formato di data/gallica.json (formato 2): { formato: 2, raccolto, query, totale, schede_lette, record: [scheda, ...] }
// scheda: { k: ark, y: tipi, t: titolo, c: autori, d: data, s: fonti (fondo e segnatura), l: lingue, x: descrizione e soggetti, r: diritti }.
// La conversione nelle voci del catalogo la fa scripts/fonti/gallica.mjs (recordGallica), con la stessa logica per tutte le raccolte.
(async function () {
  "use strict";
  const QUERY = 'dc.type all "manuscrit"';   // la stessa di scripts/fonti/gallica.mjs
  const PAGINA = 50, PAUSA = 3000, DB = "emendando-gallica", VERSIONE = 2;
  if (!/(^|\.)gallica\.bnf\.fr$/.test(location.hostname)) { console.error("Apri prima https://gallica.bnf.fr/ e incolla lo script nella console di quella scheda."); return; }

  // ------------------------------------------------------------ archivio nel browser (IndexedDB): stato e pagine lette
  const apri = () => new Promise((ok, ko) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("dati"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const db = await apri();
  const leggi = k => new Promise((ok, ko) => { const r = db.transaction("dati").objectStore("dati").get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const scrivi = (k, v) => new Promise((ok, ko) => { const t = db.transaction("dati", "readwrite"); t.objectStore("dati").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); });
  const tutte = () => new Promise((ok, ko) => { const out = []; const r = db.transaction("dati").objectStore("dati").openCursor(); r.onsuccess = () => { const c = r.result; if (!c) return ok(out); if (String(c.key).startsWith("p")) out.push(...c.value); c.continue(); }; r.onerror = () => ko(r.error); });

  // ------------------------------------------------------------ lettura di una pagina SRU
  const testi = (el, nome) => [...el.getElementsByTagName(nome)].map(n => n.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
  function scheda(rec) {
    const id = testi(rec, "dc:identifier").find(x => /gallica\.bnf\.fr\/ark:\/12148\//.test(x)); if (!id) return null;
    const k = /ark:\/12148\/([a-z0-9]+)/i.exec(id)[1];
    return { k, y: testi(rec, "dc:type"), t: testi(rec, "dc:title").join(" ; ").slice(0, 600), c: testi(rec, "dc:creator"), d: testi(rec, "dc:date")[0] || null,
      s: testi(rec, "dc:source"), l: testi(rec, "dc:language"), x: [...testi(rec, "dc:description"), ...testi(rec, "dc:subject")].join(" ; ").slice(0, 1500),
      r: testi(rec, "dc:rights").join(" ") };
  }
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  async function pagina(inizio) {
    const url = `/SRU?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(QUERY)}&startRecord=${inizio}&maximumRecords=${PAGINA}`;
    for (let k = 0; k < 6; k++) {
      try {
        const r = await fetch(url, { headers: { accept: "application/xml,text/xml" } });
        if (r.status === 429 || r.status >= 500) throw new Error("HTTP " + r.status);
        const xml = new DOMParser().parseFromString(await r.text(), "application/xml");
        const diag = xml.getElementsByTagName("diag:message")[0] || xml.getElementsByTagName("message")[0];
        const tot = +(xml.getElementsByTagName("srw:numberOfRecords")[0] || {}).textContent || 0;
        if (!xml.getElementsByTagName("srw:searchRetrieveResponse").length) throw new Error("risposta non SRU");
        if (diag && !tot) throw new Error("Gallica: " + diag.textContent);
        return { totale: tot, schede: [...xml.getElementsByTagName("srw:record")].map(scheda).filter(Boolean) };
      } catch (e) { console.warn(`pagina dal record ${inizio}: ${e.message}; nuovo tentativo tra ${5 * 2 ** k} secondi`); await attendi(5000 * 2 ** k); }
    }
    throw new Error(`la pagina dal record ${inizio} non arriva: rilanciare lo script più tardi (riprende da qui)`);
  }

  async function salva() {
    const st = await leggi("stato") || {};
    const record = [...new Map((await tutte()).map(o => [o.k, o])).values()];
    const dati = { formato: 2, nota: "Raccolta fatta dal browser con scripts/browser/gallica.js (Gallica respinge le richieste dai server). Si rifà ogni tanto per prendere i codici digitalizzati di recente.",
      raccolto: new Date().toISOString(), query: QUERY, totale: st.totale || null, schede_lette: Math.min((st.inizio || 1) - 1, st.totale || Infinity), completa: !!st.completa, record };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dati)], { type: "application/json" }));
    a.download = "gallica.json"; document.body.append(a); a.click(); a.remove();
    console.log(`Scaricato gallica.json: ${record.length} schede${st.completa ? " (raccolta completa)" : " (raccolta NON completa: rilanciare lo script per continuare)"}.`);
  }
  async function azzera() { db.close(); await new Promise(ok => { const r = indexedDB.deleteDatabase(DB); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); console.log("Avanzamento cancellato: incolla di nuovo lo script per ricominciare."); }
  window.EmendandoGallica = { salva, azzera };

  // ------------------------------------------------------------ raccolta
  let st = await leggi("stato");
  if (!st || st.versione !== VERSIONE || st.query !== QUERY) st = { versione: VERSIONE, query: QUERY, inizio: 1, totale: null, completa: false };
  if (st.completa) { console.log("La raccolta è già completa: scarico il file. Per rifarla da capo: EmendandoGallica.azzera()."); await salva(); return; }
  console.log(st.inizio > 1 ? `Riprendo dal record ${st.inizio} su ${st.totale}.` : "Comincio la raccolta di tutti i manoscritti di Gallica.");
  const titolo = document.title, t0 = Date.now(), inizio0 = st.inizio;
  for (;;) {
    const p = await pagina(st.inizio);
    if (p.totale) st.totale = p.totale;
    await scrivi("p" + String(st.inizio).padStart(8, "0"), p.schede);
    st.inizio += PAGINA;
    const fatto = !p.schede.length || st.inizio > st.totale;
    st.completa = fatto;
    await scrivi("stato", st);
    const letti = Math.min(st.inizio - 1, st.totale), resto = (st.totale - letti) / Math.max(1, letti - inizio0 + 1) * (Date.now() - t0);
    document.title = `${Math.round(letti / st.totale * 100)}% Gallica (${letti} su ${st.totale})`;
    if ((st.inizio - 1) % 1000 === 0 || fatto) console.log(`${letti} schede su ${st.totale}; tempo che resta: circa ${Math.round(resto / 60000)} minuti`);
    if (fatto) break;
    await attendi(PAUSA);
  }
  document.title = titolo;
  console.log("Raccolta completa.");
  await salva();
})();
