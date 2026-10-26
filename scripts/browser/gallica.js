// Raccolta di Gallica dal browser: TUTTI i manoscritti (ogni fondo e lingua, anche delle biblioteche partner di Gallica).
// Gallica respinge le richieste che arrivano dai server, non quelle di un normale browser: per questo la raccolta si fa così.
//
// Come si usa (Chrome):
//   1. aprire https://gallica.bnf.fr/ in una scheda;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio;
//   3. lasciare la scheda aperta: il titolo della scheda mostra l'avanzamento (una pagina di 50 schede ogni 3 secondi circa);
//   4. alla fine la raccolta è divisa in parti sotto i 40 MB (GitHub rifiuta i file oltre 100 MB) e il browser scarica la prima,
//      «gallica-1.json»; Chrome blocca i download multipli, quindi le altre si scaricano una per volta dalla console:
//      EmendandoGallica.salva(2), EmendandoGallica.salva(3) ... (la console dice quante sono);
//   5. i file gallica-1.json ... gallica-N.json vanno messi in data/ del repository emendando-catalogo (al posto delle parti vecchie,
//      togliendo quelle in più se ora sono meno) e salvati con un commit.
// CARTE GEOGRAFICHE MANOSCRITTE (dal 26 ottobre 2026): le carte di Gallica non hanno «manuscrit» nel tipo e la raccolta dei manoscritti
// non le prende. Per raccoglierle, prima di incollare lo script scrivere nella console  window.EMENDANDO_GALLICA_CARTE = true  e premere Invio:
// la query diventa quella delle carte (tipo «carte» con «manuscrit» in qualunque campo), l'avanzamento sta in un archivio separato e i file
// sono gallica-carte-1.json, gallica-carte-2.json ... (da mettere in data/ accanto a gallica-<n>.json; EmendandoGallica.salva(n) come sopra).
// Il filtro (cartaGallica in scripts/fonti/gallica.mjs) tiene solo le carte disegnate a mano: tipo, formato («ms.»), tecnica.
//
// Se la scheda si chiude o il computer si spegne, basta riaprire Gallica e incollare di nuovo il file: la raccolta riprende da dove
// si era fermata (l'avanzamento resta nel browser, in IndexedDB). Per scaricare subito quello che c'è: EmendandoGallica.salva(1), salva(2) ...
// Per ricominciare da capo: EmendandoGallica.azzera(), poi incollare di nuovo il file.
//
// Formato di data/gallica-<n>.json (formato 2): { formato: 2, raccolto, query, totale, schede_lette, completa, parte, parti, record: [scheda, ...] }
// scheda: { k: ark, y: tipi, t: titolo, c: autori, d: data, s: fonti (fondo e segnatura), l: lingue, x: descrizione e soggetti, r: diritti («dp» = domaine public) },
// snellita come fa snellisci in scripts/fonti/gallica.mjs (via le note ripetute in ogni scheda e i campi vuoti).
// La conversione nelle voci del catalogo e il filtro dei manoscritti librari li fa scripts/fonti/gallica.mjs (recordGallica, motivoGallica).
(async function () {
  "use strict";
  const CARTE = window.EMENDANDO_GALLICA_CARTE === true;
  // manoscritti: la stessa di scripts/fonti/gallica.mjs; carte: tipo «carte» e «manuscrit» in qualunque campo (formato «ms.», note)
  const QUERY = CARTE ? 'dc.type all "carte" and gallica all "manuscrit"' : 'dc.type all "manuscrit"';
  const PAGINA = 50, PAUSA = 3000, DB = CARTE ? "emendando-gallica-carte" : "emendando-gallica", VERSIONE = 2, MAX_PARTE = 40e6;
  const NOME = CARTE ? "gallica-carte" : "gallica";   // byte per parte (sotto i 50 MB)
  if (!/(^|\.)gallica\.bnf\.fr$/.test(location.hostname)) { console.error("Apri prima https://gallica.bnf.fr/ e incolla lo script nella console di quella scheda."); return; }

  // ------------------------------------------------------------ archivio nel browser (IndexedDB): stato e pagine lette
  const apri = () => new Promise((ok, ko) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("dati"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const db = await apri();
  const leggi = k => new Promise((ok, ko) => { const r = db.transaction("dati").objectStore("dati").get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const scrivi = (k, v) => new Promise((ok, ko) => { const t = db.transaction("dati", "readwrite"); t.objectStore("dati").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); });
  const tutte = () => new Promise((ok, ko) => { const out = []; const r = db.transaction("dati").objectStore("dati").openCursor(); r.onsuccess = () => { const c = r.result; if (!c) return ok(out); if (String(c.key).startsWith("p")) out.push(...c.value); c.continue(); }; r.onerror = () => ko(r.error); });

  // ------------------------------------------------------------ lettura di una pagina SRU
  const testi = (el, nome) => [...el.getElementsByTagName(nome)].map(n => n.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
  // la stessa di snellisci in scripts/fonti/gallica.mjs
  function snellisci(o) {
    const x = String(o.x || "").split(" ; ").filter(p => !/^\s*(?:Num[ée]risation effectu[ée]e|Appartient [àa] l.ensemble documentaire)/i.test(p)).join(" ; ");
    const out = { ...o, x, r: /domaine public|public domain/i.test(o.r || "") ? "dp" : o.r };
    for (const [k, v] of Object.entries(out)) if (v == null || v === "" || (Array.isArray(v) && !v.length)) delete out[k];
    return out;
  }
  function scheda(rec) {
    const id = testi(rec, "dc:identifier").find(x => /gallica\.bnf\.fr\/ark:\/12148\//.test(x)); if (!id) return null;
    const k = /ark:\/12148\/([a-z0-9]+)/i.exec(id)[1];
    return snellisci({ k, y: testi(rec, "dc:type"), t: testi(rec, "dc:title").join(" ; ").slice(0, 600), c: testi(rec, "dc:creator"), d: testi(rec, "dc:date")[0] || null,
      s: testi(rec, "dc:source"), l: testi(rec, "dc:language"), f: testi(rec, "dc:format").join(" ; ").slice(0, 300), x: [...testi(rec, "dc:description"), ...testi(rec, "dc:subject")].join(" ; ").slice(0, 1500),
      r: testi(rec, "dc:rights").join(" ") });
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

  // parti sotto MAX_PARTE byte, sempre nello stesso ordine (chiavi delle pagine): salva(n) scarica la parte n, una per chiamata
  async function parti() {
    const record = [...new Map((await tutte()).map(o => [o.k, snellisci(o)])).values()];
    const out = [[]]; let peso = 0;
    for (const o of record) {
      const p = JSON.stringify(o).length + 1;
      if (peso + p > MAX_PARTE && out[out.length - 1].length) { out.push([]); peso = 0; }
      out[out.length - 1].push(o); peso += p;
    }
    return out;
  }
  async function salva(n = 1) {
    const st = await leggi("stato") || {};
    const ps = await parti();
    n = Math.round(+n);
    if (!(n >= 1 && n <= ps.length)) { console.error(`Le parti sono ${ps.length}: EmendandoGallica.salva(1) ... EmendandoGallica.salva(${ps.length}).`); return; }
    const dati = { formato: 2, nota: "Raccolta fatta dal browser con scripts/browser/gallica.js, divisa in parti. Si rifà ogni tanto per prendere i codici digitalizzati di recente.",
      raccolto: new Date().toISOString(), query: QUERY, totale: st.totale || null, schede_lette: Math.min((st.inizio || 1) - 1, st.totale || Infinity), completa: !!st.completa,
      parte: n, parti: ps.length, record: ps[n - 1] };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dati)], { type: "application/json" }));
    a.download = `${NOME}-${n}.json`; document.body.append(a); a.click(); a.remove();
    console.log(`Scaricato ${NOME}-${n}.json (parte ${n} di ${ps.length}, ${ps[n - 1].length} schede)${st.completa ? "" : " (raccolta NON completa: rilanciare lo script per continuare)"}.` +
      (n < ps.length ? ` Per la parte successiva: EmendandoGallica.salva(${n + 1})` : " Era l'ultima parte."));
  }
  async function azzera() { db.close(); await new Promise(ok => { const r = indexedDB.deleteDatabase(DB); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); console.log("Avanzamento cancellato: incolla di nuovo lo script per ricominciare."); }
  window.EmendandoGallica = { salva, azzera };

  // ------------------------------------------------------------ raccolta
  let st = await leggi("stato");
  if (!st || st.versione !== VERSIONE || st.query !== QUERY) st = { versione: VERSIONE, query: QUERY, inizio: 1, totale: null, completa: false };
  if (st.completa) { console.log("La raccolta è già completa: scarico la parte 1 (le altre con EmendandoGallica.salva(2), salva(3) ...). Per rifarla da capo: EmendandoGallica.azzera()."); await salva(1); return; }
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
  await salva(1);
})();
