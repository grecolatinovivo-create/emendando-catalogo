// Raccolta dei manoscritti della State Library Victoria (Melbourne) dal browser.
// I manifesti IIIF (rosetta.slv.vic.gov.au/delivery/iiif/presentation/2.1/<IE…>/manifest) e le immagini si aprono dal browser
// con CORS aperto, ma rispondono 403 alle richieste che arrivano dai server; il catalogo (Primo, find.slv.vic.gov.au) vieta ai
// programmi di raccolta la ricerca (robots.txt). Per questo l'elenco si raccoglie da un normale browser, come per Gallica e Cambridge:
// lo script ripete, pagina per pagina, la ricerca che si è appena fatta nel catalogo, con le stesse richieste che fa la pagina.
//
// Come si usa (Chrome):
//   1. aprire https://find.slv.vic.gov.au/ e fare la ricerca dei manoscritti con immagini, per esempio cercare «manuscript»
//      (oppure «medieval manuscript», «book of hours», «Koran»…) e scegliere nei filtri a sinistra il tipo di risorsa
//      «Manuscripts» e la disponibilità «Online» (o «Digitised»); la ricerca deve restare nell'indirizzo della pagina;
//   2. aprire la console (F12, scheda «Console»), incollare tutto questo file e premere Invio (se Chrome lo chiede, scrivere prima «allow pasting»);
//   3. lasciare la scheda aperta: il titolo mostra l'avanzamento (50 schede ogni 2 secondi circa);
//   4. alla fine il browser scarica «slv.json»: va messo in data/slv.json del repository emendando-catalogo e salvato con un commit.
// Si possono fare più ricerche una dopo l'altra (per esempio «manuscript», poi «Koran», poi «book of hours»): lo script aggiunge le
// schede nuove a quelle già raccolte (avanzamento in IndexedDB) e scarica ogni volta il file completo.
// EmendandoSlv.salva() scarica subito quello che c'è; EmendandoSlv.azzera() cancella tutto.
// Entrano nel catalogo (scripts/fonti/slv.mjs) solo le schede con un oggetto digitale Rosetta (IE…), di ogni data,
// non lettere né carte d'archivio.
//
// Formato di data/slv.json: { formato: 1, raccolto, ricerche: [testo], voci: { <IE…>: scheda } }
// scheda: { s: segnatura, t: titolo, d: datazione, a: autori, l: lingue, f: tipo di risorsa, h: handle, r: id del record }
(async function () {
  "use strict";
  const PAUSA = 2000, DB = "emendando-slv", VID = "61SLV_INST:SLV", INST = "61SLV_INST", PAGINA = 50;
  if (!/(^|\.)find\.slv\.vic\.gov\.au$/.test(location.hostname)) { console.error("Apri prima https://find.slv.vic.gov.au/, fai la ricerca dei manoscritti e incolla lo script nella console di quella scheda."); return; }
  const qs = new URLSearchParams(location.search);
  if (!qs.get("query")) { console.error("Nell'indirizzo non c'è una ricerca: cerca prima i manoscritti nel catalogo (con i filtri), poi incolla di nuovo lo script."); return; }
  const apri = () => new Promise((ok, ko) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("dati"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const db = await apri();
  const leggi = k => new Promise((ok, ko) => { const r = db.transaction("dati").objectStore("dati").get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const scrivi = (k, v) => new Promise((ok, ko) => { const t = db.transaction("dati", "readwrite"); t.objectStore("dati").put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); });
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const uno = x => (Array.isArray(x) ? x[0] : x) || null;
  const pulito = s => String(s || "").replace(/\$\$[A-Z]/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const stato = (await leggi("stato")) || { formato: 1, ricerche: [], voci: {} };
  function salva() {
    stato.raccolto = new Date().toISOString();
    const b = new Blob([JSON.stringify(stato)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = "slv.json"; document.body.appendChild(a); a.click(); a.remove();
    console.log(`slv.json scaricato: ${Object.keys(stato.voci).length} oggetti digitali`);
  }
  window.EmendandoSlv = { salva, azzera: async () => { await scrivi("stato", null); console.log("avanzamento cancellato"); }, stato };

  // token «ospite» di Primo, lo stesso che chiede la pagina
  const urlJwt = `/primaws/rest/pub/institution/${INST}/guestJwt?isGuest=true&lang=en&targetUrl=${encodeURIComponent(location.href)}&viewId=${encodeURIComponent(VID)}`;
  let jwt = await (await fetch(urlJwt, { credentials: "same-origin" })).text();
  jwt = jwt.replace(/^"|"$/g, "");

  // parametri della ricerca della pagina: query (campo,operatore,testo), tab, search_scope, mfacet/facet (filtri)
  const p = new URLSearchParams({ blendFacetsSeparately: "false", disableCache: "false", getMore: "0", inst: INST, lang: "en", limit: String(PAGINA),
    newspapersActive: "false", newspapersSearch: "false", otbRanking: "false", pcAvailability: qs.get("pcAvailability") || "false", q: qs.get("query"),
    qExclude: "", qInclude: "", rapido: "false", refEntryActive: "false", rtaLinks: "true", scope: qs.get("search_scope") || "MyInstitution",
    skipDelivery: "N", sort: "rank", tab: qs.get("tab") || "LibraryCatalog", vid: VID });
  // filtri dell'indirizzo: «facet=rtype,include,manuscripts», «mfacet=tlevel,include,online_resources,1» -> «facet_rtype,exact,manuscripts»
  const filtri = [...qs.getAll("facet"), ...qs.getAll("mfacet")].map(f => f.split(",")).filter(x => x.length >= 3);
  const qInclude = filtri.filter(x => x[1] !== "exclude").map(x => `facet_${x[0]},exact,${x[2]}`).join("|,|");
  const qExclude = filtri.filter(x => x[1] === "exclude").map(x => `facet_${x[0]},exact,${x[2]}`).join("|,|");
  if (qExclude) p.set("qExclude", qExclude);
  if (qInclude) p.set("qInclude", qInclude);
  console.log("ricerca:", qs.get("query"), qInclude ? "filtri: " + qInclude : "(senza filtri)");

  // scheda Primo -> IE e scheda compatta (null se non c'è un oggetto digitale Rosetta)
  function compatta(doc) {
    const testo = JSON.stringify(doc);
    const ie = [...new Set(testo.match(/IE\d{3,}/g) || [])];
    const handle = (testo.match(/hdl\.handle\.net\/10381\/\d+|handle\.slv\.vic\.gov\.au\/10381\/\d+/) || [])[0] || null;
    const d = (doc.pnx && doc.pnx.display) || {}, s = (doc.pnx && doc.pnx.search) || {}, add = (doc.pnx && doc.pnx.addata) || {};
    const holding = (doc.delivery && doc.delivery.holding) || [];
    return { ie, v: { s: pulito(uno(holding.map(h => h.callNumber).filter(Boolean))) || pulito(uno(d.identifier)) || null, t: pulito(uno(d.title)),
      d: pulito(uno(d.creationdate)) || pulito(uno(add.date)) || null, a: (d.creator || []).concat(d.contributor || []).map(pulito).slice(0, 8),
      l: (d.language || []).map(pulito), f: pulito(uno(d.type)) || null, h: handle, r: pulito(uno(((doc.pnx || {}).control || {}).recordid)) || null,
      c: [d.description, d.contents, d.format, d.subject].flat().filter(Boolean).map(pulito).join(" ; ").slice(0, 1500) || null } };
  }

  const ricerca = qs.get("query") + (qInclude ? " | " + qInclude : "");
  if (!stato.ricerche.includes(ricerca)) stato.ricerche.push(ricerca);
  let offset = stato.offset && stato.ultima === ricerca ? stato.offset : 0, totale = null, senzaIe = 0;
  stato.ultima = ricerca;
  for (;;) {
    p.set("offset", String(offset));
    let r;
    for (let k = 0; k < 4; k++) {
      r = await fetch(`/primaws/rest/pub/pnxs?${p}`, { credentials: "same-origin", headers: { Authorization: "Bearer " + jwt, Accept: "application/json" } });
      if (r.ok) break;
      if (r.status === 401) { jwt = (await (await fetch(urlJwt, { credentials: "same-origin" })).text()).replace(/^"|"$/g, ""); }
      await attendi(5000 * 2 ** k);
    }
    if (!r.ok) { console.error("la ricerca non risponde:", r.status, "- riprova incollando di nuovo lo script"); break; }
    const j = await r.json(), docs = j.docs || [];
    totale = (j.info && j.info.total) || totale || 0;
    for (const doc of docs) { const x = compatta(doc); if (!x.ie.length) { senzaIe++; continue; } for (const ie of x.ie) stato.voci[ie] = x.v; }
    offset += docs.length; stato.offset = offset;
    await scrivi("stato", stato);
    document.title = `SLV ${Math.min(100, Math.round(offset / Math.max(1, totale) * 100))}% (${Object.keys(stato.voci).length})`;
    console.log(`${offset} schede su ${totale}; oggetti digitali: ${Object.keys(stato.voci).length}; schede senza IE in questa ricerca: ${senzaIe}`);
    // Primo non restituisce più di 2000 risultati per ricerca: oltre, dividere la ricerca (per esempio per secolo o per lingua)
    if (!docs.length || offset >= totale || offset >= 2000) { if (offset >= 2000 && totale > 2000) console.warn("Primo si ferma a 2000 risultati: dividi la ricerca con altri filtri e incolla di nuovo lo script."); break; }
    await attendi(PAUSA);
  }
  stato.offset = 0; await scrivi("stato", stato);
  salva();
})();
