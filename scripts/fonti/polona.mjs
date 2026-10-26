// Polona (polona.pl), la biblioteca digitale della Biblioteca Narodowa di Varsavia, con le copie digitali di altre biblioteche
// polacche (Biblioteka Jagiellońska, Biblioteka Książąt Czartoryskich, Biblioteka Uniwersytecka w Warszawie, KUL e altre).
// Elenco: l'API JSON di ricerca che usa il sito (POST /api/search-service/search/simple, categoria «Rękopisy», cioè manoscritti,
// senza i documenti protetti dal diritto d'autore), 100 schede per richiesta. La ricerca restituisce al massimo 10.000 risultati:
// si legge biblioteca per biblioteca (filtro instanceName) e, per quelle con più di 10.000 manoscritti, due volte, in ordine di titolo
// crescente e decrescente. Il sito non ha robots.txt (risponde la pagina dell'applicazione); pausa di 1,5 secondi.
// Manifesti IIIF Presentation 3 della biblioteca: /api/search-service/search/iiif/<objectId>/manifest.json, con il servizio Image 3
// di polona.pl (Cantaloupe); manifesti, info.json e immagini con CORS aperto (prova del 26 ottobre 2026). I manifesti non si leggono
// dal server: li apre il browser di chi usa il catalogo.
// Entrano i manoscritti in pubblico dominio o con licenza aperta, di ogni data; fuori lettere e corrispondenza, diplomi su pergamena
// e documenti (segnature «Perg.», «Dypl.», regesti come «[Zygmunt III potwierdza…]»), atti, fotografie, cartoline, carte geografiche, stampati e le carte d'archivio del Novecento (Biuro Sekretariatu KC PZPR).
// Lo stato è in data/polona.json; una raccolta completa si riusa per 6 giorni.
import fs from "node:fs";
import { scarica, log } from "../rete.mjs";

export const FILE_STATO = "data/polona.json";
export const SITO = "https://polona.pl";
export const API = `${SITO}/api/search-service/search/simple`;
export const manifestoPolona = id => `${SITO}/api/search-service/search/iiif/${id}/manifest.json`;
const PAGINA = 100, LIMITE = 10000, GIORNI = 6;
const FILTRO = { copyright: ["false"], category: ["Rękopisy"] };

export function leggiStato() {
  try { return JSON.parse(fs.readFileSync(FILE_STATO, "utf8")); } catch (e) { return { voci: {} }; }
}
function salvaStato(st) {
  const righe = Object.entries(st.voci).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify({ aggiornato: st.aggiornato || null, completato: st.completato || null, cursore: st.cursore || null, totale: st.totale || 0, biblioteche: st.biblioteche || null, nuove: undefined });
  fs.writeFileSync(FILE_STATO + ".tmp", testa.slice(0, -1) + ',"nuove":' + JSON.stringify(st.nuove || null) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(FILE_STATO + ".tmp", FILE_STATO);
}

async function cerca(filtro, pagina, ordine = "RELEVANCE") {
  const corpo = JSON.stringify({ keywordFilters: { ...FILTRO, ...filtro }, temporalFilters: null });
  const r = await scarica(`${API}?query=*&page=${pagina}&pageSize=${PAGINA}&sort=${ordine}`, { json: corpo, timeout: 120000, accept: "application/json" });
  if (r.stato !== 200) throw new Error(`HTTP ${r.stato}`);
  return JSON.parse(r.testo);
}

const valori = (o, k) => ((o || {})[k] || {}).values || [];
// scheda della ricerca -> voce compatta
export function compattaPolona(h) {
  const b = h.basicFields || {}, e = h.expandedFields || {}, a = h.attributes || {};
  const v = { s: valori(e, "callNumber").join(" ; ") || null, t: valori(b, "title")[0] || null, a: valori(b, "creatorForSearch"), d: valori(b, "dateDescriptive")[0] || null,
    l: valori(e, "language"), g: valori(e, "metatype"), k: [...new Set([...valori(e, "keywords"), ...valori(e, "subject")])].slice(0, 12),
    i: (a.instanceName || {}).stringValue || valori(e, "sourceMeta")[0] || null, x: (a.licenseName || {}).stringValue || null,
    f: valori(e, "physicalDescription")[0] || null, c: valori(e, "contributorForSearch").slice(0, 6) };
  for (const k of ["a", "l", "g", "k", "c"]) if (!v[k].length) delete v[k];
  for (const k of Object.keys(v)) if (v[k] == null) delete v[k];
  return v;
}

/* raccolta a riprese: cursore { biblioteca (indice in st.biblioteche), ordine, pagina }; stato salvato dopo ogni pagina */
export async function scansionaPolona({ minuti = 30, soloCache = false } = {}) {
  const st = leggiStato();
  if (soloCache) return st;
  const ora = Date.now(), fine = ora + minuti * 60e3;
  if (st.completato && !st.cursore && ora - Date.parse(st.completato) < GIORNI * 864e5) { log("polona", `riuso la raccolta del ${st.completato.slice(0, 10)}: ${Object.keys(st.voci).length} schede`); return st; }
  if (!st.cursore) {
    // nuova raccolta: biblioteche dai filtri della ricerca (con il numero dei manoscritti di ciascuna)
    const d = await cerca({}, 0);
    st.totale = d.totalElements;
    st.biblioteche = (((d.aggregations || {}).instanceName || {}).values || []).map(x => [x.value, x.count]);
    st.cursore = { b: 0, o: "TITLE_AZ", p: 0 }; st.nuove = {};
  } else log("polona", `riprendo da ${st.biblioteche[st.cursore.b] && st.biblioteche[st.cursore.b][0]}, pagina ${st.cursore.p}`);
  st.nuove = st.nuove || {};
  while (st.cursore.b < st.biblioteche.length) {
    const [nome, quanti] = st.biblioteche[st.cursore.b];
    if (Date.now() > fine) { salvaStato(st); throw new Error(`raccolta incompleta (${nome}, pagina ${st.cursore.p}): riprenderà alla prossima esecuzione`); }
    const d = await cerca({ instanceName: [nome] }, st.cursore.p, st.cursore.o);
    for (const h of d.hits || []) if (h.objectId) st.nuove[h.objectId] = compattaPolona(h);
    st.cursore.p++; st.aggiornato = new Date().toISOString();
    const letti = st.cursore.p * PAGINA, fineOrdine = !(d.hits || []).length || letti >= Math.min(d.totalElements, LIMITE)
      || (st.cursore.o === "TITLE_ZA" && letti >= d.totalElements - LIMITE + PAGINA);
    if (fineOrdine) {
      // oltre 10.000 risultati: si rilegge la coda in ordine inverso (le schede già lette si sovrappongono)
      if (st.cursore.o === "TITLE_AZ" && quanti > LIMITE) st.cursore = { b: st.cursore.b, o: "TITLE_ZA", p: 0 };
      else st.cursore = { b: st.cursore.b + 1, o: "TITLE_AZ", p: 0 };
    }
    salvaStato(st);
  }
  st.voci = st.nuove; st.nuove = null; st.cursore = null;
  st.completato = st.aggiornato = new Date().toISOString();
  salvaStato(st);
  log("polona", `fine: ${Object.keys(st.voci).length} manoscritti su ${st.totale}`);
  return st;
}

// lingue della scheda (in polacco) -> codici del catalogo
const LINGUE = { polski: "pl", pol: "pl", łaciński: "la", francuski: "fr", niemiecki: "de", rosyjski: "ru", angielski: "en", włoski: "it", grecki: "grc",
  ukraiński: "uk", czeski: "cs", arabski: "ar", ormiański: "hy", hebrajski: "he", "cerkiewnosłowiański": "cu", "starocerkiewnosłowiański": "cu", słowiańskie: "cu",
  białoruski: "be", litewski: "lt", węgierski: "hu", hiszpański: "es", turecki: "tr", perski: "fa", niderlandzki: "nl", szwedzki: "sv", duński: "da",
  gruziński: "ka", jidysz: "yi", tatarski: "tt", portugalski: "pt", chiński: "zh", japoński: "ja", sanskryt: "sa", syryjski: "syr", koptyjski: "cop", etiopski: "gez",
  "staro-cerkiewno-słowiański": "cu", słowacki: "sk", rumuński: "ro", serbski: "sr", chorwacki: "hr", bułgarski: "bg", łotewski: "lv", estoński: "et", fiński: "fi" };
export const lingueP = l => [...new Set((l || []).map(x => LINGUE[String(x).toLowerCase().trim()]).filter(Boolean))];

// manoscritti librari: fuori lettere, documenti, fotografie, carte geografiche, stampati e carte d'archivio
const NON_LIBRARI = /^(listy?|korespondencja|dokumenty?|akta|fotografi[ae]|pocztówk[ia]|mapy?|plany?|druki?|druk ulotny|telegramy?|zaproszeni[ae]|dyplomy?|świadectw[oa]|wycinki prasowe|rachunki|kwity|pieczęcie|ekslibrisy?|rysunki?|grafika|plakaty?)$/i;
export function motivoPolona(v) {
  if (!v || !v.t) return "senza titolo";
  if (v.x && !/^Domena Publiczna$|licencja otwarta/i.test(v.x)) return "licenza non aperta";
  if ((v.a || []).some(a => /Biuro Sekretariatu KC PZPR/.test(a))) return "carte d'archivio";
  const generi = [...(v.g || [])].map(x => String(x).trim());
  if (generi.length && generi.every(g => NON_LIBRARI.test(g))) return "lettere, documenti o altro materiale non librario";
  if (generi.some(g => /^(listy?|korespondencja)$/i.test(g)) && !generi.some(g => /^rękopis/i.test(g))) return "lettere, documenti o altro materiale non librario";
  if (/^\s*(\[?list\b|\[?listy\b|\[?korespondencja\b|\[?telegram\b|\[?pocztówka\b)/i.test(v.t)) return "lettere, documenti o altro materiale non librario";
  // diplomi e documenti: fondi di pergamene e diplomi (segnature «Perg.», «Dypl.», «D/»), atti, regesti di documenti
  if (/\bPerg\.|\bDypl\.|^D\/\d|\bDok\.|\bDokumenty\b/i.test(v.s || "")) return "diplomi e documenti";
  if (generi.some(g => /^akta\b|^dokumenty?\b|^dyplomy?\b|^przywilej/i.test(g))) return "diplomi e documenti";
  if (/^\s*[\[„"]?(dokument|dokumenty|akta|kopie i wypisy z akt|przywilej|dyplom|świadectw[oa]|metryk[ai])\b/i.test(v.t)) return "diplomi e documenti";
  if (/^\s*\[[^\]]*\b(potwierdza|nadaje|zatwierdza|powiadamia|zaświadcza|sprzedaje|zapisuje|poświadcza|ustanawia|zezwala|darowuje|przekazuje)\b/i.test(v.t)) return "diplomi e documenti";
  return null;
}
export const ammessaPolona = v => !motivoPolona(v);

export function recordPolona(st = leggiStato()) {
  return Object.entries(st.voci || {}).filter(([, v]) => ammessaPolona(v)).map(([id, v]) => ({
    fonte: "polona", id: "pol-" + id, citta: CITTA[v.i] || null, biblioteca: v.i || "Polona", segnatura: v.s || id, datazione: v.d && v.d !== "undefined" ? v.d : null, titolo: v.t,
    autori_fonte: v.a || [], collaboratori: v.c || [], descrizione: [...(v.g || []), ...(v.k || []), v.f].filter(Boolean).join(" ; ").slice(0, 1500) || null,
    lingue: lingueP(v.l), manifest: manifestoPolona(id), pagina: `${SITO}/preview/${id}`, licenza: v.x || "Polona" }));
}

// città delle biblioteche di Polona (le altre restano senza città)
export const CITTA = {
  "Biblioteka Narodowa": "Varsavia", "Biblioteka Jagiellońska": "Cracovia", "Biblioteka Książąt Czartoryskich - oddział Muzeum Narodowego w Krakowie": "Cracovia",
  "Biblioteka Bobolanum": "Varsavia", "Wojewódzka Biblioteka Publiczna w Lublinie": "Lublino", "Biblioteka Uniwersytecka w Warszawie": "Varsavia",
  "Biblioteka Uniwersytecka Katolickiego Uniwersytetu Lubelskiego": "Lublino", "Fundacja Okularnicy": "Varsavia",
  "Uniwersytet Mikołaja Kopernika - Biblioteka Uniwersytecka": "Toruń", "Uniwersytet Kardynała Stefana Wyszyńskiego w Warszawie": "Varsavia",
  "Biblioteka Diecezjalna w Sandomierzu": "Sandomierz", "Książnica Zamojska (KC19)": "Zamość", "Biblioteka Główna Akademii Górniczo-Hutniczej im. Stanisława Staszica w Krakowie": "Cracovia",
  "MBP Kalisz": "Kalisz", "Archiwum i Biblioteka Krakowskiej Kapituły Katedralnej": "Cracovia", "Fundacja M.I.A.S.T.O. Białystok": "Białystok",
  "Bibioteka Wyższego Seminarium Duchownego w Płocku": "Płock", "Miejska Biblioteka Publiczna w Sanoku": "Sanok", "Niemiecki Instytut Historyczny w Warszawie": "Varsavia",
  "Narodowy Instytut Fryderyka Chopina": "Varsavia", "Narodowy Instytut Kultury i Dziedzictwa Wsi": "Varsavia",
};
