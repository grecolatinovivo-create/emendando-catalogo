// Scrittura del catalogo, diviso per fonte perché regga decine o centinaia di migliaia di voci:
//
//   data/catalogo/indice.json            elenco dei pezzi, biblioteche, lingue, categorie e autori con i conteggi (leggero: si legge per primo)
//   data/catalogo/indice/<fonte>-<n>.json  indice leggero, una riga per codice (vedi CAMPI), al massimo RIGHE_INDICE righe per pezzo
//   data/catalogo/voci/<fonte>-<n>.json    voci complete; il pezzo di un codice si ricava dal suo id: n = fnv1a(id) % pezzi della fonte
//   data/manoscritti.json                  compatibilità con i lettori del formato 1: solo i codici con autori classici (latini o greci)
//
// Gli id dei codici non cambiano mai (i link condivisi, per esempio confronto-codici.html#c=hd-cpl894,bav-pal-lat-1615, devono funzionare).
// Un file si riscrive solo se il contenuto cambia; i pezzi che non servono più si cancellano.
import fs from "node:fs";
import path from "node:path";
import { NOMI_LINGUE } from "./lingue.mjs";

export const DIR = "data/catalogo";
export const COMPAT = "data/manoscritti.json";
export const LUOGHI = "data/luoghi.json";
export const VOCI_PER_PEZZO = 800, RIGHE_INDICE = 20000;
export const CAMPI = ["id", "segnatura", "biblioteca", "lingue", "secolo_da", "secolo_a", "autori", "titolo", "opere", "truculentus", "lingua_dedotta", "tipo", "miniato", "musica", "editio_princeps"];
// «tipo» (in fondo, per i lettori che leggono le righe per posizione): "carta" per le carte geografiche manoscritte, "carta_stampa" per le
// carte a stampa (dal 26 ottobre 2026), "" per i codici
// «miniato» e «musica» (dal 26 ottobre 2026, ancora più in fondo): 1 per i codici miniati o illustrati e per quelli musicali, "" per gli altri
// stampe antiche (dal 27 ottobre 2026): «tipo» "incunabolo" (stampati fino al 1500) o "stampa" (edizioni principi del Cinquecento);
// «editio_princeps» (in fondo) è l'id dell'edizione principe (data/edizioni-principi.json), "" per le altre voci
// papiri (dal 28 ottobre 2026): «tipo» "papiro" (fonte «papiri» e papiri già presenti da Heidelberg e dalla BSB)
// epigrafi (dal 28 ottobre 2026): «tipo» "epigrafe" (fonte «epigrafi»)
export const TIPI = { codice: "codici", carta: "carte manoscritte", carta_stampa: "carte a stampa", incunabolo: "incunaboli", stampa: "edizioni principi del Cinquecento", papiro: "papiri", epigrafe: "epigrafi" };
const TIPI_RIGA = new Set(["carta", "carta_stampa", "incunabolo", "stampa", "papiro", "epigrafe"]);
const tipoRiga = v => TIPI_RIGA.has(v.tipo) ? v.tipo : "";
const STAMPE_ANTICHE = new Set(["incunabolo", "stampa"]);
export const FILE_EP = "data/edizioni-principi.json";
export const CATEGORIE = { "classico-latino": "classici latini", "classico-greco": "classici greci", cristiano: "autori cristiani", medievale: "autori medievali" };

// FNV-1a a 32 bit sulle unità UTF-16 dell'id: la stessa funzione è in public/assets/catalogo-dati.js del sito
export function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export const pezzoDi = (id, pezzi) => fnv1a(id) % pezzi;
export const nomeBib = m => [m.biblioteca, m.citta && !(m.biblioteca || "").includes(m.citta) ? m.citta : null].filter(Boolean).join(", ") || "Biblioteca non indicata";
// luoghi di conservazione vuoti o segnaposto («-», «non indicato», «sconosciuto»): nell'indice si riuniscono in una voce sola,
// «Luogo di conservazione non indicato», con tipo «non_indicato», fuori dal conteggio delle biblioteche e dei musei (dal 28 ottobre 2026)
export const BIB_IGNOTA = "Luogo di conservazione non indicato";
export const segnaposto = n => /^[\s\-–—?.]*$|non indicat|sconosciut|Biblioteca non indicata/i.test(String(n || ""));
export const bibIndice = v => { const n = nomeBib(v); return segnaposto(n) ? BIB_IGNOTA : n; };
// tipo di un luogo dell'indice: «museo» quando tutte le sue voci sono epigrafi od oggetti di museo (fonte «musei»), altrimenti «biblioteca»
export const eMuseo = v => v.tipo === "epigrafe" || v.fonte === "musei";
const naturale = (a, b) => String(a).localeCompare(String(b), "it", { numeric: true, sensitivity: "base" });
const breve = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

// luogo (città) di una voce, per la mappa del catalogo: vedi la nota di data/luoghi.json
export function leggiLuoghi(file = LUOGHI) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; } }
export function luogoDi(v, L) {
  if (!L) return null;
  const cerca = (tab, k) => (k && Object.prototype.hasOwnProperty.call(tab || {}, k) && L.luoghi[tab[k]]) ? tab[k] : null;
  const coda = String(v.biblioteca || "").split(",").pop().trim();
  const senzaParentesi = x => String(x || "").replace(/\s*\([^()]*\)\s*$/, "").trim();
  return cerca(L.biblioteche, nomeBib(v)) || cerca(L.biblioteche, v.biblioteca) || cerca(L.citta, v.citta) || cerca(L.citta, coda)
    || cerca(L.citta, senzaParentesi(v.citta)) || cerca(L.citta, senzaParentesi(coda))
    || (!v.citta || !String(v.citta).trim() ? cerca(L.fonti, v.fonte) : null);
}

// voce del catalogo -> riga dell'indice
export function riga(v, bib) {
  return [v.id, v.segnatura, bib, (v.lingue || []).join(","), v.secolo ? v.secolo[0] : 0, v.secolo ? v.secolo[1] : 0,
    v.autori.map(a => a.id).join(","), breve(v.titolo, 140), breve([...new Set(v.autori.flatMap(a => a.opere))].join(", "), 120), v.truculentus || "", v.lingua_dedotta ? 1 : 0, tipoRiga(v), v.miniato ? 1 : "", v.musica ? 1 : "", (v.editio_princeps && v.editio_princeps.id) || ""];
}

// json con una voce (o riga) per riga: diff leggibili nei commit
const righe = (testa, chiave, arr) => JSON.stringify(testa).slice(0, -1) + (Object.keys(testa).length ? "," : "") + JSON.stringify(chiave) + ":[\n" + arr.map(x => JSON.stringify(x)).join(",\n") + "\n]}\n";

function scriviSeCambia(file, testo, stat) {
  let prima = null; try { prima = fs.readFileSync(file, "utf8"); } catch (e) {}
  stat.kb += Buffer.byteLength(testo) / 1024; stat.file++;
  stat.scritti.add(path.resolve(file));
  if (prima === testo) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", testo); fs.renameSync(file + ".tmp", file);
  stat.cambiati++;
  return true;
}

/* manoscritti: voci del catalogo (già ordinate); opz: { fonti: [ordine], nomi: {fonte: nome}, esito: {fonte: esito}, autori: AUTORI }
   restituisce { conteggio, conAutori, lingue (per fonte), cambiato, kb, file } */
export function scriviCatalogo(manoscritti, { fonti, nomi = {}, esito = {}, autori = [], alias = [], dir = DIR, compat: fileCompat = COMPAT, luoghi = leggiLuoghi(), fileEp = FILE_EP } = {}) {
  const DIR = dir, COMPAT = fileCompat;
  const stat = { kb: 0, file: 0, cambiati: 0, scritti: new Set() };
  const perFonte = {};
  for (const v of manoscritti) (perFonte[v.fonte] = perFonte[v.fonte] || []).push(v);
  const ordine = [...new Set([...(fonti || []), ...Object.keys(perFonte)])].filter(f => perFonte[f]);
  const biblioteche = [], bibIdx = new Map();
  const idxBib = v => { const n = bibIndice(v); if (!bibIdx.has(n)) { bibIdx.set(n, biblioteche.length); biblioteche.push(n); } return bibIdx.get(n); };
  // biblioteche in ordine alfabetico (indici stabili tra una raccolta e l'altra se non cambiano i nomi)
  for (const n of [...new Set(manoscritti.map(bibIndice))].sort(naturale)) { bibIdx.set(n, biblioteche.length); biblioteche.push(n); }
  // luogo di ogni biblioteca (id in «luoghi», null se non risolto)
  const bibLuogo = biblioteche.map(() => null);
  if (luoghi) for (const v of manoscritti) { const n = bibIndice(v); if (n === BIB_IGNOTA) continue; const i = bibIdx.get(n); if (bibLuogo[i] === null) bibLuogo[i] = luogoDi(v, luoghi); }
  // codici di ogni biblioteca (parallelo a «biblioteche»): li legge la mappa della home, sempre aggiornati a ogni costruzione
  const bibN = biblioteche.map(() => 0);
  for (const v of manoscritti) bibN[bibIdx.get(bibIndice(v))]++;
  // biblioteca o museo (dal 28 ottobre 2026), parallelo a «biblioteche»: «non_indicato» per la voce che riunisce i segnaposto
  const bibMuseo = biblioteche.map(() => true);
  for (const v of manoscritti) if (!eMuseo(v)) bibMuseo[bibIdx.get(bibIndice(v))] = false;
  const bibTipo = biblioteche.map((n, i) => n === BIB_IGNOTA ? "non_indicato" : bibMuseo[i] ? "museo" : "biblioteca");
  const usati = [...new Set(bibLuogo.filter(Boolean))].sort();
  const luoghiIndice = luoghi ? Object.fromEntries(usati.map(id => { const l = luoghi.luoghi[id]; return [id, { nome: l.nome, ...(l.en ? { en: l.en } : {}), paese: l.paese, lat: l.lat, lon: l.lon }]; })) : null;
  const conteggio = {}, conAutori = {}, lingueFonte = {}, pezzi = [], infoFonti = {};
  const lingue = {}, categorie = {}, contaAutori = {}, tipi = {};
  for (const f of ordine) {
    const vs = perFonte[f];
    conteggio[f] = vs.length; conAutori[f] = vs.filter(v => v.autori.length).length;
    const lf = {}; for (const v of vs) { for (const l of v.lingue.length ? v.lingue : ["?"]) lf[l] = (lf[l] || 0) + 1; }
    lingueFonte[f] = lf;
    // indice leggero
    const file = [];
    for (let i = 0, k = 0; i < vs.length; i += RIGHE_INDICE, k++) {
      const nome = `indice/${f}-${k}.json`;
      scriviSeCambia(path.join(DIR, nome), righe({}, "righe", vs.slice(i, i + RIGHE_INDICE).map(v => riga(v, idxBib(v)))), stat);
      file.push(nome); pezzi.push({ file: nome, fonte: f, righe: Math.min(RIGHE_INDICE, vs.length - i) });
    }
    // voci complete, divise per hash dell'id
    const nPezzi = Math.max(1, Math.ceil(vs.length / VOCI_PER_PEZZO));
    const gruppi = Array.from({ length: nPezzi }, () => []);
    for (const v of vs) gruppi[pezzoDi(v.id, nPezzi)].push(v);
    // rimandi dei doppioni tolti (scripts/doppioni.mjs): restano nel pezzo dove li cercherebbe il sito, ma non nell'indice né nei conteggi
    for (const a of alias) if (a.fonte === f) gruppi[pezzoDi(a.id, nPezzi)].push(a);
    gruppi.forEach((g, k) => scriviSeCambia(path.join(DIR, `voci/${f}-${k}.json`), righe({ fonte: f, pezzo: k, pezzi: nPezzi }, "manoscritti", g), stat));
    const prefissi = [...new Set(vs.map(v => v.id.replace(/-.*$/, "-")))];
    infoFonti[f] = { nome: nomi[f] || f, codici: vs.length, carte: vs.filter(v => v.tipo === "carta").length, carte_stampa: vs.filter(v => v.tipo === "carta_stampa").length, miniati: vs.filter(v => v.miniato).length, musica: vs.filter(v => v.musica).length,
      papiri: vs.filter(v => v.tipo === "papiro").length, epigrafi: vs.filter(v => v.tipo === "epigrafe").length, incunaboli: vs.filter(v => v.tipo === "incunabolo").length, stampe: vs.filter(v => v.tipo === "stampa").length, edizioni_principi: vs.filter(v => v.editio_princeps).length, con_autori: conAutori[f], lingue: lf, esito: esito[f] || null, prefissi, pezzi_voci: nPezzi, indice: file };
    for (const v of vs) {
      for (const l of v.lingue.length ? v.lingue : ["?"]) lingue[l] = (lingue[l] || 0) + 1;
      const ti = tipoRiga(v) || "codice"; tipi[ti] = (tipi[ti] || 0) + 1;
      for (const c of new Set(v.autori.map(a => a.categoria))) categorie[c] = (categorie[c] || 0) + 1;
      for (const a of v.autori) contaAutori[a.id] = (contaAutori[a.id] || 0) + 1;
    }
  }
  // edizioni principi: l'elenco curato con il numero delle copie digitali trovate (anche 0)
  const copieEp = {}; for (const v of manoscritti) if (v.editio_princeps) copieEp[v.editio_princeps.id] = (copieEp[v.editio_princeps.id] || 0) + 1;
  let elencoEp = []; try { elencoEp = JSON.parse(fs.readFileSync(fileEp, "utf8")).edizioni || []; } catch (e) {}
  const edizioniPrincipi = Object.fromEntries(elencoEp.map(e => [e.id, { autore: e.autore, opera: e.opera, lingua: e.lingua, luogo: e.luogo, tipografo: e.tipografo, anno: e.anno, copie: copieEp[e.id] || 0 }]));
  // «forme» (dal 31 ottobre 2026): altri nomi dell'autore (Plautus, Plauti, Plaute…), per la ricerca del sito
  let formeRaw = {}; try { for (const a of JSON.parse(fs.readFileSync("data/autori.json", "utf8")).autori || []) formeRaw[a.id] = [...new Set(a.nomi || [])].filter(x => x !== a.nome && x !== a.latino).slice(0, 12); } catch (e) {}
  const nomiAutori = Object.fromEntries(autori.filter(a => contaAutori[a.id]).map(a => [a.id, { nome: a.nome, latino: a.latino, categoria: a.categoria, codici: contaAutori[a.id], ...(formeRaw[a.id] && formeRaw[a.id].length ? { forme: formeRaw[a.id] } : {}) }]));
  const indice = {
    versione: 2, aggiornato: null, totale: manoscritti.length, con_autori: manoscritti.filter(v => v.autori.length).length,
    miniati: manoscritti.filter(v => v.miniato).length, musica: manoscritti.filter(v => v.musica).length,
    // totali separati per tipo (dal 27 ottobre 2026): «totale» comprende tutto, manoscritti, papiri (dal 28 ottobre 2026) e stampe antiche
    // epigrafi (dal 28 ottobre 2026): totale separato «epigrafi», fuori da «manoscritti»
    manoscritti: manoscritti.filter(v => !STAMPE_ANTICHE.has(v.tipo) && v.tipo !== "papiro" && v.tipo !== "epigrafe").length, papiri: manoscritti.filter(v => v.tipo === "papiro").length,
    epigrafi: manoscritti.filter(v => v.tipo === "epigrafe").length,
    stampe_antiche: manoscritti.filter(v => STAMPE_ANTICHE.has(v.tipo)).length,
    incunaboli: manoscritti.filter(v => v.tipo === "incunabolo").length, edizioni_principi: manoscritti.filter(v => v.editio_princeps).length,
    nota: "Catalogo aperto dei manoscritti digitalizzati (IIIF) delle biblioteche agganciate, di ogni lingua ed epoca. Le righe dell'indice seguono «campi»; " +
      "«biblioteca» è la posizione in «biblioteche»; «lingue» sono codici (vedi «lingue»), dichiarati dalla fonte oppure dedotti da fondo, segnatura o titolo quando «lingua_dedotta» è 1; il pezzo delle voci complete di un codice è fnv1a(id) % pezzi_voci della sua fonte " +
      "(data/catalogo/voci/<fonte>-<pezzo>.json); la fonte di un id si riconosce dal prefisso; «tipo» è «carta» per le carte geografiche manoscritte, «carta_stampa» per le carte a stampa (categorie a parte, conteggi in «tipi» e, per fonte, in «carte» e «carte_stampa») e vuoto per i codici; «miniato» è 1 per i codici con miniature, iniziali decorate, disegni o illustrazioni e «musica» è 1 per i codici musicali (notazione, libri di canto, polifonia, intavolature, partiture, teoria), riconosciuti dai metadati delle fonti (conteggi in «miniati» e «musica» e, per fonte, negli stessi campi); «tipo» è «incunabolo» per gli stampati fino al 1500 e «stampa» per le edizioni principi del Cinquecento (stampe antiche, dal 27 ottobre 2026: contano in «totale» e in «biblioteche_n»; «manoscritti» e «stampe_antiche» sono i totali separati); «tipo» è «papiro» per i papiri (dal 28 ottobre 2026: fonte «papiri», con i dati papirologici nella voce completa in «papiro», e i papiri di Heidelberg e della BSB; contano in «totale» e in «biblioteche_n», totale separato in «papiri» e, per fonte, nello stesso campo); «tipo» è «epigrafe» per le iscrizioni (dal 28 ottobre 2026: fonte «epigrafi», con i dati epigrafici nella voce completa in «epigrafe», compresa «licenza_metadati»; contano in «totale» e in «biblioteche_n», totale separato in «epigrafi» e, per fonte, nello stesso campo); «editio_princeps» è l'id dell'edizione principe dei classici greci e latini (elenco curato in «edizioni_principi_elenco», con le copie digitali trovate; conteggio delle voci in «edizioni_principi»); «biblioteche_tipo» (dal 28 ottobre 2026), parallelo a «biblioteche», dice se il luogo è una «biblioteca» o un «museo» (musei e luoghi di conservazione di epigrafi e oggetti) oppure «non_indicato» (voce unica che riunisce i luoghi vuoti o segnaposto), e «totali» conta biblioteche e musei veri («totali.biblioteche», «totali.musei») e le voci senza luogo («totali.senza_luogo»); «biblioteche_luogo» dà per ogni biblioteca l'id del suo luogo in «luoghi» (città con paese ISO, lat e lon, da data/luoghi.json) o null.",
    campi: CAMPI, hash: "fnv1a-32",
    lingue: Object.fromEntries(Object.entries(lingue).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, { nome: k === "?" ? "lingua non indicata" : NOMI_LINGUE[k] || k, codici: n }])),
    categorie: Object.fromEntries(Object.entries(CATEGORIE).map(([k, nome]) => [k, { nome, codici: categorie[k] || 0 }])),
    tipi: Object.fromEntries(Object.entries(TIPI).map(([k, nome]) => [k, { nome, codici: tipi[k] || 0 }])),
    autori: nomiAutori, edizioni_principi_elenco: edizioniPrincipi, biblioteche, fonti: infoFonti, pezzi,
  };
  // biblioteche e musei separati (dal 28 ottobre 2026): «biblioteche_tipo» parallelo a «biblioteche» («biblioteca», «museo» o «non_indicato»);
  // «totali» conta i luoghi veri, senza la voce dei segnaposto («senza_luogo» sono le voci senza luogo di conservazione)
  indice.biblioteche_tipo = bibTipo;
  indice.totali = { biblioteche: bibTipo.filter(t => t === "biblioteca").length, musei: bibTipo.filter(t => t === "museo").length,
    senza_luogo: bibTipo.includes("non_indicato") ? bibN[bibTipo.indexOf("non_indicato")] : 0 };
  // luoghi delle biblioteche (mappa): «biblioteche_luogo» è parallelo a «biblioteche», con l'id del luogo o null
  if (luoghiIndice) { indice.luoghi = luoghiIndice; indice.biblioteche_luogo = bibLuogo; }
  indice.biblioteche_n = bibN;   // numero dei codici di ogni biblioteca, parallelo a «biblioteche»
  // l'indice si riscrive (con la data) solo se cambia qualcosa
  const fileIndice = path.join(DIR, "indice.json");
  let vecchio = null; try { vecchio = JSON.parse(fs.readFileSync(fileIndice, "utf8")); } catch (e) {}
  const senzaData = d => JSON.stringify({ ...d, aggiornato: null, fonti: Object.fromEntries(Object.entries(d.fonti || {}).map(([k, v]) => [k, { ...v, esito: null }])) });
  const cambiato = stat.cambiati > 0 || !vecchio || senzaData(vecchio) !== senzaData(indice);
  indice.aggiornato = cambiato ? new Date().toISOString() : vecchio.aggiornato;
  if (!cambiato) indice.fonti = Object.fromEntries(Object.entries(indice.fonti).map(([k, v]) => [k, { ...v, esito: (vecchio.fonti[k] || {}).esito ?? v.esito }]));
  scriviSeCambia(fileIndice, JSON.stringify(indice, null, 1) + "\n", stat);
  // compatibilità (formato 1): solo i codici con autori classici, latini o greci, e quelli del Truculentus
  // (le stampe antiche, i papiri e le epigrafi no: il formato 1 resta dei soli manoscritti)
  const classici = manoscritti.filter(v => !STAMPE_ANTICHE.has(v.tipo) && v.tipo !== "papiro" && v.tipo !== "epigrafe").filter(v => v.truculentus || v.autori.some(a => a.categoria === "classico-latino" || a.categoria === "classico-greco"));
  const compat = { aggiornato: indice.aggiornato, nota: "Formato 1, per compatibilità: solo i codici con autori classici. Il catalogo completo è in data/catalogo/ (indice.json).",
    fonti: Object.fromEntries(ordine.map(f => [f, { nome: nomi[f] || f, codici: classici.filter(v => v.fonte === f).length, esito: esito[f] || null }])), totale: classici.length, manoscritti: classici };
  let vc = null; try { vc = JSON.parse(fs.readFileSync(COMPAT, "utf8")); } catch (e) {}
  if (!vc || senzaData(vc) !== senzaData(compat)) { compat.aggiornato = indice.aggiornato; scriviSeCambia(COMPAT, JSON.stringify(compat, null, 1) + "\n", stat); }
  // pezzi che non servono più
  for (const sotto of ["indice", "voci"]) {
    let nomiFile = []; try { nomiFile = fs.readdirSync(path.join(DIR, sotto)); } catch (e) {}
    for (const n of nomiFile) { const f = path.resolve(DIR, sotto, n); if (n.endsWith(".json") && !stat.scritti.has(f)) { fs.unlinkSync(f); stat.cambiati++; } }
  }
  return { conteggio, conAutori, lingue: lingueFonte, cambiato: stat.cambiati > 0, kb: Math.round(stat.kb), file: stat.file };
}

// voci del catalogo precedente (per le fonti che in questa esecuzione non rispondono): formato 2 se c'è, altrimenti data/manoscritti.json (formato 1)
export function catalogoPrecedente(DIR_ = DIR, COMPAT_ = COMPAT) {
  const DIR = DIR_, COMPAT = COMPAT_;
  const out = [];
  let ind = null; try { ind = JSON.parse(fs.readFileSync(path.join(DIR, "indice.json"), "utf8")); } catch (e) {}
  if (ind && ind.fonti) {
    for (const [f, info] of Object.entries(ind.fonti)) for (let k = 0; k < (info.pezzi_voci || 0); k++) {
      try { out.push(...JSON.parse(fs.readFileSync(path.join(DIR, `voci/${f}-${k}.json`), "utf8")).manoscritti.filter(v => v && !v.alias)); } catch (e) {}
    }
    return out;
  }
  let c = null; try { c = JSON.parse(fs.readFileSync(COMPAT, "utf8")); } catch (e) {}
  return ((c && c.manoscritti) || []).map(v => ({ ...v, lingue: v.lingue || [], secolo: v.secolo || null, autori: (v.autori || []).map(a => ({ categoria: "classico-latino", ...a })) }));
}
