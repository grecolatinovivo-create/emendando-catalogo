// Segnalazioni dal visore di Emendando: codici che non si aprono.
//
// Il visore (sito privato, assets/foto.js e assets/sinossi.js) manda una segnalazione anonima quando l'elenco delle immagini o
// l'immagine di un codice non arrivano dopo tutte le riserve. Questo script, lanciato ogni 15 minuti dal workflow
// .github/workflows/segnalazioni.yml:
//   1. legge dal sito le segnalazioni aperte (GET /api/accesso/io?segnalazioni, «Authorization: Bearer» con LAVORAZIONE_TOKEN);
//   2. ricontrolla ogni codice dal server: manifesto (risposta, JSON, pagine, CORS) e immagine (risposta, tipo, CORS, filtro anti-robot);
//   3. classifica: «rotto», «bloccato per i browser», «momentaneo» (si apre di nuovo), con la causa tecnica;
//   4. apre o aggiorna UNA issue per biblioteca e per causa, con l'etichetta «da-risolvere» e tutto quello che serve per agire;
//   5. ricontrolla i codici delle issue aperte (al massimo una volta all'ora): se si aprono tutti, chiude la issue da sola;
//   6. segna le segnalazioni come «verificate» (o «risolte» quando la issue si chiude) e aggiorna lo stato in docs/SEGNALAZIONI.md.
// Nulla si toglie dal catalogo: i codici segnalati si risolvono (procedura in docs/SEGNALAZIONI.md).
//
// Uso:
//   node scripts/segnalazioni.mjs                       giro completo (variabili: SEGNALAZIONI_TOKEN, GITHUB_TOKEN, GITHUB_REPOSITORY, SITO_URL)
//   node scripts/segnalazioni.mjs --prova               senza scrivere nulla (né issue, né stato sul sito, né file): stampa cosa farebbe
//   node scripts/segnalazioni.mjs --file=x.json         segnalazioni da un file (stessa forma della risposta del sito), per le prove
//   node scripts/segnalazioni.mjs --controlla=<manifesto> [--immagine=<url>]   ricontrollo a mano di un codice, stampa il risultato
//   opzioni: --tempo=<secondi> tempo massimo del giro (600); --ricontrollo=<minuti> intervallo fra i ricontrolli delle issue (60)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turno, UA } from "./rete.mjs";

const arg = k => { const a = process.argv.find(x => x.startsWith("--" + k + "=")); return a ? a.slice(k.length + 3) : null; };
const flag = k => process.argv.includes("--" + k);
const SITO = String(process.env.SITO_URL || "https://www.emendando.com").replace(/\/+$/, "");
const TOKEN = String(process.env.SEGNALAZIONI_TOKEN || "").trim();
const GH = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
const REPO = process.env.GITHUB_REPOSITORY || "grecolatinovivo-create/emendando-catalogo";
const PROVA = flag("prova");
const TEMPO_MAX = (+arg("tempo") || 600) * 1000;
const RICONTROLLO_MIN = +arg("ricontrollo") || 60;
export const ETICHETTA = "da-risolvere";
const ORIGINE = "https://www.emendando.com";
const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOC = path.join(RADICE, "docs/SEGNALAZIONI.md");
const MAX_CODICI_ISSUE = 150;
const inizio = Date.now();
const tempoFinito = () => Date.now() - inizio > TEMPO_MAX;
const log = (...a) => console.error(new Date().toISOString().slice(11, 19), ...a);

// ---------------------------------------------------------------- ricontrollo dal server
async function richiesta(url, leggi = 65536) {
  let host; try { const u = new URL(url); if (u.protocol !== "https:" && u.protocol !== "http:") throw 0; host = u.hostname; } catch { return { errore: "indirizzo non valido" }; }
  await turno(host);   // pausa per biblioteca (almeno 1,5 s; di più dove il robots.txt lo chiede: scripts/rete.mjs)
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "*/*", origin: ORIGINE }, redirect: "follow", signal: ctl.signal });
    const parti = []; let n = 0;
    if (r.body) {
      const rd = r.body.getReader();
      while (n < leggi) { const { done, value } = await rd.read(); if (done) break; parti.push(Buffer.from(value)); n += value.length; }
      try { await rd.cancel(); } catch { /* già chiuso */ }
    }
    return { stato: r.status, tipo: r.headers.get("content-type") || "", acao: r.headers.get("access-control-allow-origin"), finale: r.url, buf: Buffer.concat(parti) };
  } catch (e) {
    return { errore: e.name === "AbortError" ? "timeout" : String((e.cause && (e.cause.code || e.cause.message)) || e.message).slice(0, 80) };
  } finally { clearTimeout(t); }
}
const ANTIROBOT = /anubis|making sure you(?:'|&#39;)re not a bot|cf-chl|challenge-platform|just a moment\.\.\.|captcha|are you a robot|access denied|bot protection/i;
export function eImmagine(b) {
  if (!b || b.length < 12) return false;
  const h = b.subarray(0, 12).toString("hex");
  return h.startsWith("ffd8ff") || h.startsWith("89504e47") || h.startsWith("47494638") || (h.startsWith("52494646") && b.subarray(8, 12).toString() === "WEBP")
    || h.startsWith("0000000c6a502020") || h.startsWith("ff4fff51") || h.startsWith("49492a00") || h.startsWith("4d4d002a");
}
const acaoOk = a => a === "*" || a === ORIGINE;
const idDi = o => String((o && (o.id || o["@id"])) || "");
// pagine del manifesto (Presentation 2 e 3) e indirizzo di un'immagine piccola della prima pagina
export function pagineManifesto(j) {
  const out = [];
  const servizio = x => { const s = Array.isArray(x) ? x[0] : x; return s ? idDi(s).replace(/\/$/, "") : ""; };
  if (Array.isArray(j.items)) {
    for (const c of j.items) for (const pag of c.items || []) for (const a of pag.items || []) {
      let b = Array.isArray(a.body) ? a.body[0] : a.body; if (b && (b.type === "Choice")) b = (b.items || [])[0];
      if (!b) continue; const s = servizio(b.service);
      out.push(s ? s + "/full/,400/0/default.jpg" : idDi(b)); break;
    }
  } else {
    for (const c of (j.sequences && j.sequences[0] && j.sequences[0].canvases) || []) {
      const res = c.images && c.images[0] && c.images[0].resource; if (!res) continue;
      const s = servizio(res.service); out.push(s ? s + "/full/,400/0/default.jpg" : idDi(res));
    }
  }
  return { n: out.filter(Boolean).length, prima: out.find(Boolean) || null };
}
const sintesi = (r, url) => r.errore ? { url, errore: r.errore } : { url, stato: r.stato, tipo: r.tipo.split(";")[0], cors: r.acao || "assente", ...(r.finale && r.finale !== url ? { finale: r.finale } : {}) };

// Cause: chiave stabile (per raggruppare le issue), classe, descrizione e ipotesi di soluzione per chi risolve.
export const CAUSE = {
  "manifesto-non-trovato": ["rotto", "Il manifesto non esiste più (HTTP 404 o 410).",
    "Indirizzo cambiato o oggetto ritirato: cercare il codice nel sito della biblioteca (campo «pagina» della voce) e, se ha un nuovo manifesto, correggere il modello d'indirizzo nella fonte (scripts/fonti/<fonte>.mjs) o nel manifesto scritto dal catalogo (scripts/manifesti.mjs); se è stato ritirato, segnarlo nella fonte."],
  "manifesto-errore-server": ["rotto", "Il server della biblioteca risponde con un errore (HTTP 5xx o altro codice) al manifesto.",
    "Spesso è un guasto della biblioteca: ricontrollare dopo qualche ora. Se dura più giorni, verificare se l'indirizzo dei manifesti è cambiato."],
  "manifesto-irraggiungibile": ["rotto", "Il manifesto non risponde (tempo scaduto o errore di rete).",
    "Server della biblioteca lento o spento: ricontrollare più tardi; se dura più giorni, verificare il dominio (DNS, certificato, nuovo indirizzo)."],
  "manifesto-non-json": ["rotto", "Al posto del manifesto arriva qualcosa che non è JSON (di solito una pagina HTML).",
    "Indirizzo che ora porta a una pagina del sito: trovare il nuovo indirizzo del manifesto e aggiornare la fonte o il manifesto scritto dal catalogo."],
  "manifesto-senza-immagini": ["rotto", "Il manifesto arriva ma non contiene pagine con immagini.",
    "Manifesto della fonte vuoto o in una forma che il visore non legge: guardare il JSON; se è una forma nuova, insegnarla a leggiManifesto in assets/foto.js (sito) oppure riscrivere il manifesto dal catalogo (scripts/manifesti.mjs)."],
  "manifesto-antirobot": ["bloccato per i browser", "Al posto del manifesto arriva la pagina di un filtro anti-robot.",
    "Filtro anti-robot davanti ai manifesti: servire il manifesto dal catalogo (ramo «manifesti», come per LoC, NLG e Malatestiana) oppure aggiungere al visore una riserva del server anche per i manifesti."],
  "manifesto-senza-cors": ["bloccato per i browser", "Il manifesto arriva al server ma senza l'intestazione Access-Control-Allow-Origin: i browser non lo possono leggere.",
    "Manca CORS nella fonte: servire una copia del manifesto dal catalogo (ramo «manifesti», scripts/manifesti.mjs) e puntare lì la voce, oppure aggiungere al visore una riserva del server per i manifesti; in parallelo si può scrivere alla biblioteca."],
  "immagine-non-trovata": ["rotto", "L'immagine non esiste più (HTTP 404 o 410), mentre il manifesto risponde.",
    "Indirizzo delle immagini cambiato: confrontare il servizio IIIF nel manifesto con l'indirizzo richiesto; se il manifesto punta a un vecchio server, la fonte va riscritta o il visore deve leggere il nuovo servizio."],
  "immagine-vietata": ["bloccato per i browser", "Il server della biblioteca nega l'immagine (HTTP 401 o 403).",
    "Accesso negato: spesso è un filtro anti-robot che risponde 403 con una pagina HTML (come Anubis a TUdigit), altrimenti un controllo di referer o cookie. Verificare che la riserva del server del sito (GET /api/commenta?immagine=…) riceva l'immagine; se sì, far passare questo host dal server fin dal primo foglio (viaServer in assets/foto.js, VIA_SERVER in assets/sinossi.js); se è negata anche al server, annotarlo nella fonte."],
  "immagine-errore-server": ["rotto", "Il server delle immagini risponde con un errore (HTTP 5xx o altro codice).",
    "Spesso è un guasto momentaneo del server IIIF della biblioteca: ricontrollare più tardi; se dura, verificare l'indirizzo del servizio nel manifesto."],
  "immagine-irraggiungibile": ["rotto", "Il server delle immagini non risponde (tempo scaduto o errore di rete).",
    "Server lento o spento: ricontrollare più tardi; se dura più giorni, verificare dominio e certificato del servizio IIIF."],
  "immagine-antirobot": ["bloccato per i browser", "Al posto dell'immagine arriva la pagina HTML di un filtro anti-robot (Anubis o simili).",
    "Immagine dietro filtro anti-robot: usare subito la riserva del server per questo host (in assets/foto.js e assets/sinossi.js, insieme «viaServer»/VIA_SERVER: si può mettere l'host fra quelli che passano dal server fin dal primo foglio)."],
  "immagine-non-immagine": ["rotto", "Al posto dell'immagine arriva un file che non è un'immagine.",
    "Indirizzo dell'immagine sbagliato o cambiato (spesso una pagina HTML del visore della biblioteca): controllare il servizio IIIF nel manifesto e il modo in cui il visore compone l'indirizzo (urlPagina in assets/foto.js)."],
};

// ricontrollo di un codice: { classe, causa, dettaglio, manifesto, immagine, quando }
export async function ricontrolla({ manifest, url, origine }) {
  const out = { quando: new Date().toISOString() };
  const esito = (causa, dettaglio) => Object.assign(out, { classe: CAUSE[causa][0], causa, dettaglio });
  let img = url || null;
  if (manifest) {
    const m = await richiesta(manifest, 40 * 1024 * 1024);
    out.manifesto = sintesi(m, manifest);
    if (m.errore) return esito("manifesto-irraggiungibile", m.errore);
    if (m.stato === 404 || m.stato === 410) return esito("manifesto-non-trovato", "HTTP " + m.stato);
    if (m.stato >= 400) return esito("manifesto-errore-server", "HTTP " + m.stato);
    const testo = m.buf.toString("utf8");
    let j = null; try { j = JSON.parse(testo); } catch { j = null; }
    if (!j) return ANTIROBOT.test(testo) ? esito("manifesto-antirobot", "pagina anti-robot (" + out.manifesto.tipo + ")") : esito("manifesto-non-json", out.manifesto.tipo || "tipo assente");
    const p = pagineManifesto(j); out.manifesto.pagine = p.n;
    if (!p.n) return esito("manifesto-senza-immagini", "0 pagine con immagini");
    if (!acaoOk(m.acao)) return esito("manifesto-senza-cors", "Access-Control-Allow-Origin " + (m.acao || "assente"));
    // segnalazione del manifesto: si prova anche la prima immagine
    if (!img || origine === "manifesto") img = p.prima;
  }
  if (img) {
    const r = await richiesta(img);
    out.immagine = sintesi(r, img);
    if (r.errore) return esito("immagine-irraggiungibile", r.errore);
    if (r.stato === 404 || r.stato === 410) return esito("immagine-non-trovata", "HTTP " + r.stato);
    if (r.stato === 401 || r.stato === 403) return ANTIROBOT.test(r.buf.toString("utf8")) ? esito("immagine-antirobot", "HTTP " + r.stato + " con pagina anti-robot") : esito("immagine-vietata", "HTTP " + r.stato);
    if (r.stato >= 400) return esito("immagine-errore-server", "HTTP " + r.stato);
    if (!eImmagine(r.buf)) return ANTIROBOT.test(r.buf.toString("utf8")) ? esito("immagine-antirobot", "pagina anti-robot (" + out.immagine.tipo + ")") : esito("immagine-non-immagine", out.immagine.tipo || "tipo assente");
    if (!acaoOk(r.acao)) out.nota = "immagine senza CORS: nel browser si vede, ma senza pixel leggibili";
  }
  return Object.assign(out, { classe: "momentaneo", causa: null, dettaglio: "si apre di nuovo" });
}

// ---------------------------------------------------------------- catalogo: biblioteca e fonte di una voce
let indice = null;
const fnv1a = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
function fonteDi(id) {
  if (!id) return null;
  if (!indice) { try { indice = JSON.parse(fs.readFileSync(path.join(RADICE, "data/catalogo/indice.json"), "utf8")); } catch { indice = { fonti: {} }; } }
  for (const [f, x] of Object.entries(indice.fonti || {})) if ((x.prefissi || []).some(p => id.startsWith(p))) return { fonte: f, pezzi: x.pezzi_voci || 1 };
  return null;
}
const pezzi = new Map();
async function voceCatalogo(id) {
  const f = fonteDi(id); if (!f) return null;
  const nome = `${f.fonte}-${fnv1a(id) % f.pezzi}.json`;
  if (!pezzi.has(nome)) pezzi.set(nome, (async () => {
    try { return JSON.parse(fs.readFileSync(path.join(RADICE, "data/catalogo/voci", nome), "utf8")); } catch { /* non nel checkout */ }
    try { const r = await fetch(`https://raw.githubusercontent.com/${REPO}/main/data/catalogo/voci/${nome}`); return r.ok ? await r.json() : null; } catch { return null; }
  })());
  const d = await pezzi.get(nome);
  return ((d && d.manoscritti) || []).find(m => m.id === id) || null;
}
const hostDi = u => { try { return new URL(u).hostname; } catch { return ""; } };

// ---------------------------------------------------------------- sito e GitHub
async function sito(metodo, corpo) {
  const r = await fetch(SITO + "/api/accesso/io?segnalazioni", { method: metodo, headers: { authorization: "Bearer " + TOKEN, "content-type": "application/json", "user-agent": UA },
    body: corpo ? JSON.stringify(corpo) : undefined, signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`sito: HTTP ${r.status} ${j.errore || ""}`);
  return j;
}
async function gh(metodo, percorso, corpo) {
  const r = await fetch("https://api.github.com" + percorso, { method: metodo, headers: { authorization: "Bearer " + GH, accept: "application/vnd.github+json", "user-agent": "emendando-segnalazioni", "content-type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined });
  if (r.status === 422 && percorso.endsWith("/labels")) return null;   // etichetta già esistente
  if (!r.ok) throw new Error(`GitHub ${metodo} ${percorso}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json();
}
const MARCA = /<!-- segnalazioni-dati: ([A-Za-z0-9+/=]+) -->/;
const leggiDati = corpo => { const m = MARCA.exec(corpo || ""); if (!m) return null; try { return JSON.parse(Buffer.from(m[1], "base64").toString("utf8")); } catch { return null; } };
async function issueAperte() {
  if (!GH) return [];
  const out = [];
  for (let p = 1; p < 20; p++) {
    const l = await gh("GET", `/repos/${REPO}/issues?labels=${ETICHETTA}&state=open&per_page=100&page=${p}`);
    for (const i of l) { const d = leggiDati(i.body); if (d && !i.pull_request) out.push({ numero: i.number, url: i.html_url, dati: d }); }
    if (l.length < 100) break;
  }
  return out;
}
const breve = s => String(s ?? "").replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
const cella = u => u ? `[${breve(u.length > 60 ? u.slice(0, 57) + "…" : u)}](${u})` : "";
const rc = r => !r ? "" : r.errore ? r.errore : [r.stato, r.tipo, "CORS " + r.cors, r.pagine != null ? r.pagine + " pagine" : ""].filter(Boolean).join(", ");
export function corpoIssue(d) {
  const [classe, descr, ipotesi] = CAUSE[d.causa] || ["?", d.causa, ""];
  const codici = Object.values(d.codici).sort((a, b) => String(b.ultima).localeCompare(String(a.ultima)));
  const righe = codici.slice(0, 60).map(c => `| ${breve(c.voce)} | ${breve(c.segnatura)} | ${breve(c.pagina)} | ${cella(c.manifest)} | ${cella(c.url)} | ${breve(rc(c.esito && c.esito.manifesto))} | ${breve(rc(c.esito && c.esito.immagine))} | ${c.conteggio} | ${String(c.prima || "").slice(0, 10)} → ${String(c.ultima || "").slice(0, 10)} | ${breve(c.browser)} |`);
  const fonti = [...new Set(codici.map(c => c.fonte).filter(Boolean))];
  const es = codici[0] || {};
  return [
    `**Biblioteca:** ${d.biblioteca}  `,
    `**Classe:** ${classe}  `,
    `**Causa:** ${descr} (\`${d.causa}\`)  `,
    `**Ipotesi di soluzione:** ${ipotesi}  `,
    fonti.length ? `**Fonte nel catalogo:** ${fonti.map(f => `\`scripts/fonti/${f}.mjs\`, \`data/${f}.json\``).join("; ")}  ` : "",
    `**Codici coinvolti:** ${codici.length}  `,
    `**Ultimo ricontrollo:** ${String(d.controllo || "").replace("T", " ").slice(0, 16)} UTC (si ripete ogni ${RICONTROLLO_MIN} minuti; se tutti i codici si aprono la issue si chiude da sola)`,
    "",
    "| Voce | Segnatura | Pagina | Manifesto | Immagine | Ricontrollo manifesto | Ricontrollo immagine | Segnalazioni | Prima → ultima | Browser |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...righe,
    codici.length > 60 ? `\n… e altri ${codici.length - 60} codici (elenco completo nei dati in fondo a questa issue).` : "",
    "",
    "**Ricontrollo a mano** (dalla cartella del catalogo):",
    "```",
    `node scripts/segnalazioni.mjs --controlla=${es.manifest || "<manifesto>"}${es.url ? " --immagine=" + es.url : ""}`,
    "```",
    "Procedura completa per chi risolve: [docs/SEGNALAZIONI.md](../blob/main/docs/SEGNALAZIONI.md). Quando la correzione è pubblicata, chiudere la issue con un commento che dice cosa si è cambiato (commit).",
    "",
    `<!-- segnalazioni-dati: ${Buffer.from(JSON.stringify(d)).toString("base64")} -->`,
  ].filter(x => x !== "").join("\n");
}
const titoloIssue = d => `Codici che non si aprono: ${d.biblioteca} · ${(CAUSE[d.causa] || [])[1] ? d.causa.replace(/-/g, " ") : d.causa}`;

// ---------------------------------------------------------------- stato in docs/SEGNALAZIONI.md
function aggiornaDoc(aperte) {
  let doc; try { doc = fs.readFileSync(DOC, "utf8"); } catch { return false; }
  const per = new Map();
  for (const i of aperte) { const b = i.dati.biblioteca; if (!per.has(b)) per.set(b, []); per.get(b).push(i); }
  const tot = aperte.reduce((s, i) => s + Object.keys(i.dati.codici).length, 0);
  const righe = [...per.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([b, l]) => {
    const n = l.reduce((s, i) => s + Object.keys(i.dati.codici).length, 0);
    return `| ${breve(b)} | ${n} | ${l.map(i => `[#${i.numero}](${i.url}) ${CAUSE[i.dati.causa] ? CAUSE[i.dati.causa][0] + ": " + i.dati.causa : i.dati.causa}`).join("<br>")} |`;
  });
  const corpo = aperte.length ? [`Issue aperte: ${aperte.length}; codici da sistemare: ${tot}.`, "", "| Biblioteca | Codici | Issue (classe: causa) |", "|---|---|---|", ...righe].join("\n")
    : "Nessuna issue aperta: tutti i codici segnalati si aprono o sono già stati sistemati.";
  const a = doc.indexOf("<!-- stato -->"), z = doc.indexOf("<!-- /stato -->");
  if (a < 0 || z < a) return false;
  const vecchio = doc.slice(a, z).replace(/^Aggiornato: .*$/m, "");
  const nuovo = `<!-- stato -->\nAggiornato: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC\n\n${corpo}\n`;
  if (vecchio.replace(/\s+/g, " ").trim() === nuovo.replace(/^Aggiornato: .*$/m, "").replace(/\s+/g, " ").trim()) return false;
  if (!PROVA) fs.writeFileSync(DOC, doc.slice(0, a) + nuovo + doc.slice(z));
  return true;
}

// ---------------------------------------------------------------- giro
async function giro() {
  if (!TOKEN && !arg("file")) console.log("::warning::Manca il secret LAVORAZIONE_TOKEN nel repository del catalogo: le segnalazioni del sito non si possono leggere (vedi docs/SEGNALAZIONI.md).");
  const segn = arg("file") ? JSON.parse(fs.readFileSync(arg("file"), "utf8")).segnalazioni || [] : TOKEN ? (await sito("GET")).segnalazioni || [] : [];
  const aperte = await issueAperte();
  const daRicontrollare = aperte.filter(i => Date.now() - Date.parse(i.dati.controllo || 0) > RICONTROLLO_MIN * 60000);
  log(`segnalazioni aperte: ${segn.length}; issue aperte: ${aperte.length} (da ricontrollare: ${daRicontrollare.length})`);
  if (!segn.length && !daRicontrollare.length) { log("niente da fare"); return; }
  if (GH && !PROVA) await gh("POST", `/repos/${REPO}/labels`, { name: ETICHETTA, color: "d93f0b", description: "Codici che non si aprono nel visore: da sistemare (docs/SEGNALAZIONI.md)" });

  const perChiave = new Map(aperte.map(i => [i.dati.chiave, i]));
  const toccate = new Set(), chiuse = [], segnate = [];   // segnate: [ids, stato, esito]
  const chiaveCodice = c => (c.manifest || c.voce || "") + "|" + (c.pagina || "");

  // 1. segnalazioni nuove: un ricontrollo per codice, pagina e indirizzo
  const gruppi = new Map();
  for (const s of segn) { const k = chiaveCodice(s) + "|" + (s.url || "") + "|" + s.origine; if (!gruppi.has(k)) gruppi.set(k, []); gruppi.get(k).push(s); }
  for (const g of gruppi.values()) {
    if (tempoFinito()) { log("tempo massimo raggiunto: le altre segnalazioni restano per il giro dopo"); break; }
    const s = g[0], ids = g.map(x => x.id);
    const v = s.voce ? await voceCatalogo(s.voce) : null;
    const biblioteca = s.biblioteca || (v && [v.biblioteca, v.citta].filter(Boolean).join(", ")) || hostDi(s.manifest || s.url) || "sconosciuta";
    const e = await ricontrolla({ manifest: s.manifest || (v && v.manifest), url: s.url, origine: s.origine });
    log(`${s.voce || s.manifest} ${s.pagina || ""}: ${e.classe}${e.causa ? " (" + e.causa + ", " + e.dettaglio + ")" : ""}`);
    const k = chiaveCodice(s);
    if (e.classe === "momentaneo") {
      // si apre: se è in una issue aperta, ne esce
      for (const i of perChiave.values()) if (i.dati.codici[k]) { segnate.push([i.dati.codici[k].ids || [], "risolta", "si apre di nuovo"]); delete i.dati.codici[k]; toccate.add(i.dati.chiave); }
      segnate.push([ids, "verificata", "momentaneo: " + e.dettaglio + (e.nota ? "; " + e.nota : "")]);
      continue;
    }
    const ck = biblioteca + "|" + e.causa;
    let i = perChiave.get(ck);
    if (!i) { i = { numero: null, dati: { chiave: ck, biblioteca, causa: e.causa, codici: {}, controllo: e.quando } }; perChiave.set(ck, i); }
    // lo stesso codice in un'altra issue (causa cambiata): si sposta qui
    for (const j of perChiave.values()) if (j !== i && j.dati.codici[k]) { delete j.dati.codici[k]; toccate.add(j.dati.chiave); }
    const c = i.dati.codici[k] || { voce: s.voce, segnatura: s.segnatura || (v && v.segnatura), manifest: s.manifest || (v && v.manifest), pagina: s.pagina, fonte: v ? v.fonte : (fonteDi(s.voce) || {}).fonte, conteggio: 0, prima: s.prima, ids: [] };
    Object.assign(c, { url: s.url || c.url, browser: g.map(x => x.browser).filter(Boolean).join(", ").slice(0, 80) || c.browser, ultima: g.map(x => x.ultima).sort().pop() || c.ultima,
      conteggio: Math.max(c.conteggio, g.reduce((t, x) => t + (x.conteggio || 1), 0)), ids: [...new Set([...(c.ids || []), ...ids])].slice(-50), esito: { manifesto: e.manifesto, immagine: e.immagine, dettaglio: e.dettaglio } });
    i.dati.codici[k] = c; i.dati.controllo = e.quando; toccate.add(ck);
    segnate.push([ids, "verificata", `${e.classe}: ${e.causa} (${e.dettaglio})`]);
  }

  // 2. ricontrollo delle issue aperte: i codici che si aprono escono; se non ne resta nessuno, la issue si chiude
  for (const i of daRicontrollare) {
    if (tempoFinito()) break;
    for (const [k, c] of Object.entries(i.dati.codici)) {
      if (tempoFinito()) break;
      const e = await ricontrolla({ manifest: c.manifest, url: c.url, origine: c.url ? "immagine" : "manifesto" });
      if (e.classe === "momentaneo") { segnate.push([c.ids || [], "risolta", "si apre di nuovo"]); delete i.dati.codici[k]; log(`${c.voce || c.manifest}: si apre di nuovo`); }
      else c.esito = { manifesto: e.manifesto, immagine: e.immagine, dettaglio: e.dettaglio, causa_ora: e.causa !== i.dati.causa ? e.causa : undefined };
    }
    i.dati.controllo = new Date().toISOString(); toccate.add(i.dati.chiave);
  }

  // 3. issue: crea, aggiorna o chiude
  for (const ck of toccate) {
    const i = perChiave.get(ck), d = i.dati;
    const lista = Object.entries(d.codici).sort((a, b) => String(b[1].ultima).localeCompare(String(a[1].ultima)));
    if (lista.length > MAX_CODICI_ISSUE) d.codici = Object.fromEntries(lista.slice(0, MAX_CODICI_ISSUE));
    const vuota = !Object.keys(d.codici).length;
    if (PROVA || !GH) { log(`[prova] issue ${i.numero ? "#" + i.numero : "nuova"} «${titoloIssue(d)}»: ${vuota ? "si chiude" : Object.keys(d.codici).length + " codici"}`); if (vuota) chiuse.push(i); continue; }
    if (vuota) {
      if (i.numero) {
        await gh("POST", `/repos/${REPO}/issues/${i.numero}/comments`, { body: `Ricontrollo del ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC: nessun codice resta in questa issue (si aprono di nuovo, oppure sono passati alla issue di un'altra causa). La issue si chiude da sola; se tornano segnalazioni, se ne apre una nuova.` });
        await gh("PATCH", `/repos/${REPO}/issues/${i.numero}`, { state: "closed", state_reason: "completed", body: corpoIssue(d) });
      }
      chiuse.push(i); continue;
    }
    if (i.numero) await gh("PATCH", `/repos/${REPO}/issues/${i.numero}`, { title: titoloIssue(d), body: corpoIssue(d) });
    else { const n = await gh("POST", `/repos/${REPO}/issues`, { title: titoloIssue(d), body: corpoIssue(d), labels: [ETICHETTA] }); i.numero = n.number; i.url = n.html_url; }
    log(`issue #${i.numero}: ${Object.keys(d.codici).length} codici`);
  }

  // 4. stato delle segnalazioni sul sito (raggruppate per stato ed esito)
  if (TOKEN && !PROVA && !arg("file")) {
    const per = new Map();
    for (const [ids, stato, esito] of segnate) { if (!ids.length) continue; const k = stato + "\u0000" + esito; if (!per.has(k)) per.set(k, []); per.get(k).push(...ids); }
    for (const [k, ids] of per) { const [stato, esito] = k.split("\u0000"); try { await sito("POST", { azione: "segna", ids: [...new Set(ids)], stato, esito }); } catch (e) { log("segna:", e.message); } }
  }

  // 5. stato in docs/SEGNALAZIONI.md (il workflow lo salva solo se cambia)
  const restano = [...perChiave.values()].filter(i => i.numero && !chiuse.includes(i) && Object.keys(i.dati.codici).length);
  if (aggiornaDoc(restano)) log("docs/SEGNALAZIONI.md aggiornato");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (arg("controlla") || arg("immagine")) {
    const e = await ricontrolla({ manifest: arg("controlla"), url: arg("immagine"), origine: arg("immagine") ? "immagine" : "manifesto" });
    console.log(JSON.stringify({ ...e, spiegazione: e.causa ? CAUSE[e.causa].slice(1) : undefined }, null, 2));
  } else {
    await giro().catch(e => { console.error(e); process.exit(1); });
  }
}
