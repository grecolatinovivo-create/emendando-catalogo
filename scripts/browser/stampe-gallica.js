// Raccolta dal browser delle STAMPE ANTICHE di Gallica (BnF e biblioteche partner): incunaboli e copie delle edizioni principi del Cinquecento.
// Gallica respinge le richieste dei server (Cloudflare), non quelle di un normale browser: per questo la raccolta si fa così.
// Il risultato è data/stampe-gallica.json, che la fonte «stampe» (scripts/fonti/stampe.mjs, vociGallica) si limita a leggere.
//
// Come si usa (Chrome):
//   1. aprire https://gallica.bnf.fr/ in una scheda;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio;
//   3. lasciare la scheda aperta: il titolo mostra l'avanzamento (una pagina di 50 schede ogni 5,5 secondi: il robots.txt di Gallica chiede
//      «Crawl-delay: 5»; in tutto circa 150 pagine per gli incunaboli e 39 ricerche mirate per le edizioni principi del Cinquecento);
//   4. alla fine il browser scarica «stampe-gallica.json», da mettere in data/ del repository emendando-catalogo e salvare con un commit.
// Se la scheda si chiude, basta riaprire Gallica e incollare di nuovo il file: si riprende da dove ci si era fermati (archivio IndexedDB
// «emendando-stampe-gallica», lo stesso usato dalla prima raccolta del 28 ottobre 2026). Per scaricare subito: EmendandoStampe.salva();
// per ricominciare: EmendandoStampe.azzera().
//
// Interrogazioni (SRU di Gallica, Dublin Core):
//   incunaboli          dc.type all "monographie" and gallicapublication_date<"1501"   (poi solo i tipi «monographie imprimée»),
//                       letta in due fette (prima e dopo il 1490) perché l'SRU non va oltre la scheda 5.000
//   edizioni principi   per ciascuna edizione del Cinquecento di data/edizioni-principi.json: autore (forma francese o latina) o parola
//                       del titolo, tipo «monographie», anni dell'edizione; il riconoscimento vero lo fa edizioneDi in scripts/fonti/stampe.mjs.
// Formato di data/stampe-gallica.json: { formato: 1, raccolto, query, totale, completa, ricerche_ep, record: [scheda, ...] }
// scheda: { k ark, y tipi, t titolo, c autori, d data, p editori («Tipografo (Luogo)»), s fonti, g lingue, f formato, r diritti («dp»), e id dell'edizione principe cercata }
(async function () {
  "use strict";
  if (!/(^|\.)gallica\.bnf\.fr$/.test(location.hostname)) { console.error("Apri prima https://gallica.bnf.fr/ e incolla lo script nella console di quella scheda."); return; }
  const Q = 'dc.type all "monographie" and gallicapublication_date<"1501"', PAGINA = 50, PAUSA = 5500, DB = "emendando-stampe-gallica";
  const EPL = [["tacito-annales-1-6","Tacite","Tacitus",1515,1515],["velleio","Velleius Paterculus","Velleius",1520,1521],["fedro","Phèdre","Phaedrus",1596,1596],["sofocle","Sophocle","Sophocles",1502,1502],["tucidide","Thucydide","Thucydides",1502,1502],["erodoto","Hérodote","Herodotus",1502,1502],["euripide","Euripide","Euripides",1503,1503],["demostene","Démosthène","Demosthenes",1504,1504],["quinto-smirneo","Quintus de Smyrne","Quintus",1504,1505],["plutarco-moralia","Plutarque","Plutarchus",1509,1509],["platone","Platon","Plato",1513,1513],["pindaro","Pindare","Pindarus",1513,1513],["oratori-greci","Eschine","Aeschines",1513,1513],["ateneo","Athénée","Athenaeus",1514,1514],["esichio","Hésychius","Hesychius",1514,1514],["pausania","Pausanias","Pausanias",1516,1516],["strabone","Strabon","Strabo",1516,1516],["senofonte","Xénophon","Xenophon",1516,1516],["plutarco-vite","Plutarque","Plutarchus",1517,1517],["elio-aristide","Aelius Aristide","Aristides",1517,1517],["eschilo","Eschyle","Aeschylus",1518,1518],["galeno","Galien","Galenus",1525,1525],["ippocrate","Hippocrate","Hippocrates",1526,1526],["polibio","Polybe","Polybius",1530,1530],["tolomeo-geografia","Ptolémée","Ptolemaeus",1533,1533],["euclide","Euclide","Euclides",1533,1533],["diogene-laerzio","Diogène Laërce","Diogenes Laertius",1533,1533],["eliodoro","Héliodore","Heliodorus",1534,1534],["arriano","Arrien","Arrianus",1535,1535],["diodoro-siculo","Diodore de Sicile","Diodorus",1539,1539],["archimede","Archimède","Archimedes",1544,1544],["flavio-giuseppe","Flavius Josèphe","Josephus",1544,1544],["dionigi-alicarnasso","Denys d'Halicarnasse","Dionysius Halicarnassensis",1546,1547],["cassio-dione","Dion Cassius","Dio Cassius",1548,1548],["appiano","Appien","Appianus",1551,1551],["anacreonte","Anacréon","Anacreon",1554,1554],["marco-aurelio","Marc Aurèle","Marcus Aurelius",1558,1559],["plotino","Plotin","Plotinus",1580,1580],["longo","Longus","Longus",1598,1598]];
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const apri = () => new Promise((ok, ko) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("dati"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const db = await apri();
  const leggi = () => new Promise((ok, ko) => { const r = db.transaction("dati").objectStore("dati").get("stato"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const scrivi = v => new Promise((ok, ko) => { const t = db.transaction("dati", "readwrite"); t.objectStore("dati").put(v, "stato"); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); });
  const T = (el, n) => [...el.getElementsByTagName(n)].map(e => e.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
  const scheda = d => { const id = T(d, "dc:identifier").find(x => /ark:\/12148\//.test(x)); if (!id) return null; const k = /ark:\/12148\/([a-z0-9]+)/i.exec(id)[1];
    return { k, y: T(d, "dc:type"), t: T(d, "dc:title").join(" ; ").slice(0, 600), c: T(d, "dc:creator"), d: T(d, "dc:date")[0] || null, p: T(d, "dc:publisher"), s: T(d, "dc:source"), g: T(d, "dc:language"),
      f: T(d, "dc:format").join(" ; ").slice(0, 200), r: /domaine public|public domain/i.test(T(d, "dc:rights").join(" ")) ? "dp" : T(d, "dc:rights").join(" ").slice(0, 200) }; };
  async function sru(q, inizio) {
    for (let k = 0; k < 6; k++) {
      const r = await fetch(`/SRU?operation=searchRetrieve&version=1.2&startRecord=${inizio}&maximumRecords=${PAGINA}&query=${encodeURIComponent(q)}`);
      const t = await r.text();
      if (r.status === 403 || /cloudflare|captcha|challenge/i.test(r.status === 200 ? "" : t)) throw new Error("Gallica rifiuta (HTTP " + r.status + "): fermarsi e riprovare un altro giorno");
      const xml = new DOMParser().parseFromString(t, "application/xml");
      if (r.status === 200 && xml.getElementsByTagName("srw:searchRetrieveResponse").length)
        return { totale: +(xml.getElementsByTagName("srw:numberOfRecords")[0] || {}).textContent || 0, schede: [...xml.getElementsByTagName("oai_dc:dc")].map(scheda).filter(Boolean) };
      console.warn(`HTTP ${r.status}: nuovo tentativo tra ${30 * 2 ** k} secondi`); await attendi(30000 * 2 ** k);
    }
    throw new Error("Gallica non risponde: rilanciare lo script più tardi (riprende da qui)");
  }
  async function salva() {
    const st = await leggi() || {};
    const visti = new Set(), record = [];
    for (const o of [...(st.recs || []), ...(st.ep || [])]) if (o && o.k && !visti.has(o.k)) { visti.add(o.k); record.push(o); }
    const dati = { formato: 1, nota: "Raccolta fatta dal browser con scripts/browser/stampe-gallica.js (SRU di Gallica, una pagina ogni 5,5 secondi). Si rifà ogni tanto per prendere le stampe digitalizzate di recente.",
      raccolto: st.quando || new Date().toISOString(), query: Q, totale: st.tot || null, completa: !!(st.done && (st.epFatte || []).length === EPL.length), ricerche_ep: st.epFatte || [], record };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dati)], { type: "application/json" }));
    a.download = "stampe-gallica.json"; document.body.append(a); a.click(); a.remove();
    console.log(`Scaricato stampe-gallica.json (${record.length} schede)${dati.completa ? "" : " (raccolta NON completa: rilanciare lo script per continuare)"}.`);
  }
  async function azzera() { db.close(); await new Promise(ok => { const r = indexedDB.deleteDatabase(DB); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); console.log("Avanzamento cancellato."); }
  window.EmendandoStampe = { salva, azzera };

  let st = await leggi();
  if (!st || st.q !== Q) st = { q: Q, recs: [], tot: 7051, done: false, ep: [], epFatte: [] };
  const titolo = document.title;
  // l'SRU di Gallica non va oltre la scheda 5.000 di un'interrogazione: gli incunaboli (7.051 il 28 ottobre 2026) si leggono in due fette
  // per data, che insieme danno l'elenco intero; si tiene una scheda per ark
  const FETTE = ['dc.type all "monographie" and gallicapublication_date>="1490" and gallicapublication_date<"1501"', 'dc.type all "monographie" and gallicapublication_date<"1490"'];
  if (!st.fetta) st.fetta = { i: 0, next: 1 };
  const visti = new Set(st.recs.map(o => o.k));
  while (!st.done) {
    const p = await sru(FETTE[st.fetta.i], st.fetta.next);
    for (const o of p.schede) if (!visti.has(o.k)) { visti.add(o.k); st.recs.push(o); }
    st.fetta.next += PAGINA;
    if (!p.schede.length || st.fetta.next > p.totale) st.fetta = { i: st.fetta.i + 1, next: 1 };
    st.done = st.fetta.i >= FETTE.length; st.quando = new Date().toISOString();
    await scrivi(st);
    document.title = `stampe Gallica: ${st.recs.length} schede (fetta ${Math.min(st.fetta.i + 1, FETTE.length)} di ${FETTE.length})`;
    if (!st.done) await attendi(PAUSA);
  }
  for (const [id, fr, la, a, b] of EPL) {
    if (st.epFatte.includes(id)) continue;
    await attendi(PAUSA);
    const p = await sru(`(dc.creator all "${fr}" or dc.creator all "${la}" or dc.title all "${la}") and dc.type all "monographie" and gallicapublication_date>="${a}" and gallicapublication_date<="${b}"`, 1);
    st.ep.push(...p.schede.map(o => ({ ...o, e: id }))); st.epFatte.push(id); st.quando = new Date().toISOString();
    await scrivi(st);
    document.title = `edizioni principi ${st.epFatte.length}/${EPL.length}`;
  }
  document.title = titolo;
  console.log("Raccolta completa.");
  await salva();
})();
