// Raccolta dei manoscritti digitalizzati di Harvard (Houghton Library, Harvard-Yenching Library, Islamic Heritage Project) dal browser.
// LibraryCloud (api.lib.harvard.edu/v2/items.json, l'API pubblica dei metadati della biblioteca, senza robots.txt) risponde 403
// alle richieste che arrivano dai server (prova del 26 ottobre 2026), ma non a un normale browser; i manifesti IIIF
// (nrs.lib.harvard.edu/URN-3:…:MANIFEST:2) si aprono dal browser con CORS aperto. Per questo l'elenco si raccoglie dal browser,
// come per la State Library Victoria: lo script chiede a LibraryCloud, pagina per pagina (250 schede, una richiesta ogni 1,6 secondi),
// i manoscritti con copia digitale pubblica (isManuscript=true, inDRS=true, accessFlag=P) di tre insiemi:
//   - repository=Houghton (circa 2000 schede);
//   - repository=Harvard-Yenching (circa 7000 schede: codici cinesi, giapponesi, coreani, manciù, ma anche atti e lettere);
//   - setSpec=ihp (Islamic Heritage Project, circa 250 schede, quasi tutte della Houghton).
// Il filtro dei manoscritti librari (fuori lettere, atti, fotografie, papiri, mappe…) e i doppioni con Digital Scriptorium stanno
// in scripts/fonti/harvard.mjs: qui si salvano le schede così come sono, compattate.
//
// Come si usa (Chrome): aprire https://api.lib.harvard.edu/v2/items.json?limit=1 in una scheda, aprire la console (F12),
// incollare tutto questo file e premere Invio; alla fine il browser scarica «harvard.json», da mettere in data/harvard.json
// del repository emendando-catalogo. EmendandoHarvard.salva() scarica subito quello che c'è.
//
// Formato di data/harvard.json: { formato: 1, raccolto, insiemi: {nome: numero di schede}, voci: { <id del record>: scheda } }
// scheda: { t: titolo, a: autori, d: datazione, l: lingue (ISO 639-2), s: segnatura, r: biblioteca, u: URN dell'oggetto digitale,
//   g: generi, ty: tipo di risorsa, c: note, x: estensione, set: insiemi CURIOSity, ihp: 1 se nell'Islamic Heritage Project }
(async function () {
  "use strict";
  const PAUSA = 1600, PAGINA = 250, BASE = "https://api.lib.harvard.edu/v2/items.json";
  const FILTRO = "isManuscript=true&inDRS=true&accessFlag=P";
  const INSIEMI = { houghton: `${FILTRO}&repository=Houghton`, yenching: `${FILTRO}&repository=Harvard-Yenching`, ihp: `${FILTRO}&setSpec=ihp` };
  const attendi = ms => new Promise(r => setTimeout(r, ms));
  const lista = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const testo = x => (x == null ? "" : typeof x === "string" ? x : typeof x !== "object" ? String(x) : x["#text"] != null ? String(x["#text"]) : Array.isArray(x) ? x.map(testo).join(" ") : "");
  const pulito = s => String(s || "").replace(/\s+/g, " ").trim();

  function nomi(m) {
    const out = [];
    for (const n of lista(m.name)) {
      if (!n) continue;
      const ruoli = lista(n.role).flatMap(r => lista(r && r.roleTerm)).map(testo).join(" ").toLowerCase();
      if (ruoli && !/creator|author|scribe|compiler|attributed|calligrapher|translator/.test(ruoli)) continue;
      const parti = lista(n.namePart).map(p => (p == null ? "" : typeof p === "string" ? p : p["@type"] === "date" ? "" : testo(p))).filter(Boolean);
      const s = pulito(parti.join(" ").replace(/,\s*$/, "")); if (s && !out.includes(s)) out.push(s);
    }
    return out.slice(0, 8);
  }
  function compatta(m) {
    const ext = lista(m.extension).filter(Boolean);
    const drs = ext.map(e => e.DRSMetadata).filter(Boolean);
    const lc = ext.map(e => e.librarycloud).filter(Boolean)[0] || {};
    const sets = ext.flatMap(e => lista(e.sets && e.sets.set)).filter(Boolean).map(s => s.setSpec).filter(Boolean);
    const id = testo(lista(m.recordInfo).filter(Boolean).flatMap(r => lista(r.recordIdentifier))[0]);
    const urn = (drs.map(d => d.fileDeliveryURL).find(u => /urn-3:/i.test(u || "")) || "").replace(/^https?:\/\/nrs\.harvard\.edu\//i, "");
    if (!id || !urn) return null;
    const ti = lista(m.titleInfo).filter(Boolean);
    const t0 = ti.filter(t => !t["@type"])[0] || ti[0] || {};
    const t = pulito([testo(t0.nonSort), testo(t0.title), t0.subTitle ? ": " + testo(t0.subTitle) : "", t0.partName ? ". " + testo(t0.partName) : ""].join(" "));
    const oi = lista(m.originInfo).filter(Boolean);
    const tutte = oi.flatMap(o => lista(o.dateCreated).concat(lista(o.dateIssued))).filter(x => x != null);
    const date = tutte.filter(d => !(typeof d === "object" && d["@encoding"] === "marc")).map(testo).map(pulito).filter(Boolean);
    const marc = tutte.filter(d => typeof d === "object" && d["@encoding"] === "marc").map(testo).filter(Boolean);
    const loc = lista(m.location).filter(Boolean);
    const scaffale = loc.map(l => testo(l.shelfLocator)).map(pulito).filter(Boolean);
    const repo = loc.map(l => testo(l.physicalLocation)).map(pulito).filter(Boolean);
    const lingue = lista(m.language).filter(Boolean).flatMap(l => lista(l.languageTerm)).filter(x => x && x["@type"] === "code").map(testo).filter(Boolean);
    const note = lista(m.note).map(testo).concat(lista(m.abstract).map(testo), lista(m.tableOfContents).map(testo)).map(pulito).filter(Boolean);
    const v = { t: t || null, a: nomi(m), d: date[0] || (marc.length ? marc.join("-") : null), l: [...new Set(lingue)], s: scaffale[0] || null,
      r: repo[0] || (lc.HarvardRepositories && testo(lista(lc.HarvardRepositories.HarvardRepository)[0])) || null, u: urn,
      g: [...new Set(lista(m.genre).map(testo).map(pulito).filter(Boolean))].join(" ; ").slice(0, 400) || null,
      ty: testo(lista(m.typeOfResource)[0]) || null, c: note.join(" ; ").slice(0, 1200) || null,
      x: pulito(lista(m.physicalDescription).filter(Boolean).map(p => lista(p.extent).map(testo).join(" ")).join(" ")) || null,
      set: [...new Set(sets)] };
    if (sets.includes("ihp")) v.ihp = 1;
    for (const k of Object.keys(v)) if (v[k] == null || (Array.isArray(v[k]) && !v[k].length)) delete v[k];
    return [id, v];
  }

  const stato = window.__HARV || { formato: 1, insiemi: {}, voci: {}, fatto: false, errori: [] };
  window.__HARV = stato;
  function salva() {
    stato.raccolto = new Date().toISOString();
    const b = new Blob([JSON.stringify({ formato: 1, raccolto: stato.raccolto, insiemi: stato.insiemi, voci: stato.voci })], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "harvard.json"; document.body.appendChild(a); a.click(); a.remove();
  }
  window.EmendandoHarvard = { salva, stato };
  for (const [nome, q] of Object.entries(INSIEMI)) {
    for (let start = 0; start < 10000; start += PAGINA) {
      let j = null;
      for (let k = 0; k < 4 && !j; k++) {
        await attendi(PAUSA * (k + 1));
        try { const r = await fetch(`${BASE}?${q}&limit=${PAGINA}&start=${start}`); if (r.ok) j = await r.json(); else stato.errori.push(`${nome} ${start}: HTTP ${r.status}`); }
        catch (e) { stato.errori.push(`${nome} ${start}: ${e}`); }
      }
      if (!j) break;
      const tot = +((j.pagination || {}).numFound || 0);
      stato.insiemi[nome] = tot;
      const items = j.items ? lista(j.items.mods) : [];
      for (const m of items) {
        try { const c = compatta(m); if (!c) continue; const [id, v] = c; stato.voci[id] = stato.voci[id] ? { ...stato.voci[id], ...v, set: [...new Set([...(stato.voci[id].set || []), ...(v.set || [])])] } : v; }
        catch (e) { stato.errori.push(String(e)); }
      }
      document.title = `${nome} ${Math.min(start + PAGINA, tot)}/${tot} (${Object.keys(stato.voci).length})`;
      if (!items.length || start + PAGINA >= tot) break;
    }
  }
  stato.fatto = true;
  console.log(`Harvard: ${Object.keys(stato.voci).length} schede`);
  if (!window.__HARV_NO_DOWNLOAD) salva();
})();
