// Piattaforma «CUDL» (il software della Cambridge Digital Library, usato anche da Manchester Digital Collections):
// manifesti IIIF Presentation 2 con i metadati in testa («metadata», poi «@type», «attribution», «structures», «sequences»).
// Di ogni manifesto si legge solo l'inizio (fino a «structures» o «sequences»), come per la Bodleian.
import { cartaManoscritta } from "../carte.mjs";
import fs from "node:fs";
import { scarica } from "../rete.mjs";

const pulito = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, " ").trim();

// porzione JSON bilanciata che comincia a `i` ( [ … ] oppure { … } ), rispettando le stringhe
export function bilanciato(t, i) {
  const apre = t[i], chiude = apre === "[" ? "]" : "}";
  let p = 0, str = false, esc = false;
  for (let k = i; k < t.length; k++) {
    const c = t[k];
    if (str) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') str = false; continue; }
    if (c === '"') str = true;
    else if (c === apre) p++;
    else if (c === chiude && --p === 0) return t.slice(i, k + 1);
  }
  return null;
}

// inizio del manifesto -> { m: {etichetta: [valori]}, attribuzione } (null se i metadati non si leggono)
export function metadatiTesta(t) {
  const i = t.indexOf('"metadata"');
  if (i < 0) return null;
  const a = t.indexOf("[", i), pezzo = a > 0 ? bilanciato(t, a) : null;
  if (!pezzo) return null;
  let arr; try { arr = JSON.parse(pezzo); } catch (e) { return null; }
  const m = {};
  for (const x of arr) {
    const k = pulito(Array.isArray(x.label) ? (x.label[0] || {})["@value"] : x.label);
    const v = [].concat(x.value ?? []).map(y => pulito(typeof y === "string" ? y : y && y["@value"])).filter(Boolean);
    if (k && v.length) (m[k] = m[k] || []).push(...v);
  }
  const at = /"attribution"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(t);
  let attribuzione = null; if (at) { try { attribuzione = pulito(JSON.parse(at[1])); } catch (e) {} }
  return { m, attribuzione };
}

// legge l'inizio del manifesto (al massimo 512 KB): { stato, dati } con dati = metadatiTesta() o null
export async function leggiTesta(url) {
  const r = await scarica(url, { range: 524288, basta: t => /"(structures|sequences)"\s*:/.test(t), tentativi: 3, timeout: 120000 });
  if (r.stato !== 200 && r.stato !== 206) return { stato: r.stato, dati: null };
  return { stato: r.stato, dati: metadatiTesta(r.testo) };
}

const uno = (m, ...k) => { for (const x of k) if (m[x] && m[x][0]) return m[x][0]; return null; };

// metadati -> scheda compatta (stessi campi per Cambridge e Manchester)
export function schedaCudl({ m, attribuzione }) {
  return { s: uno(m, "Classmark", "Shelfmark"), t: uno(m, "Title"), u: uno(m, "Uniform Title", "Alternative Title(s)"), d: uno(m, "Date of Creation", "Date"),
    x: (m["Language(s)"] || []).slice(0, 3), f: uno(m, "Format"), p: uno(m, "Physical Location"), e: (uno(m, "Extent") || "").slice(0, 160) || null,
    au: [...(m["Author(s)"] || []), ...(m["Associated Name(s)"] || [])].join(" ; ").split(/\s*;\s*/).filter(Boolean).slice(0, 12),
    c: [uno(m, "Subject(s)"), uno(m, "Abstract")].filter(Boolean).join(" ; ").slice(0, 1200) || null,
    r: /CC BY-NC(?:-ND)? 4\.0|Creative Commons Attribution-NonCommercial[^.]*/i.test(attribuzione || "") ? (/(CC BY-NC(?:-ND)? 4\.0)/i.exec(attribuzione) || [null, "CC BY-NC 4.0"])[1] : null };
}

// carte non librarie: lettere, documenti, fogli singoli, amuleti, fotografie, mappe, stampati
const NON_LIBRARI = /\b(letters?|lettre|correspondence|papers|photographs?|maps?|plans?|deeds?|charters?|indentures?|receipts?|certificates?|grants? of land|bonds?|leases?|wills?|petitions?|notices?|broadsides?|posters?|amulets?|printed|typescripts?|telegrams?|invoices?|accounts? of|warrants?|diary|diaries|sketch(es)?|drawings?|engravings?|woodblock|prints?|postcards?|scrapbooks?|ephemera)\b/i;
const FORME_NON_LIBRARIE = /\b(letter|document|charter|deed|sheet|amulet|photograph|map|print|printed|drawing|painting|object|seal|coin|broadside|scroll painting|rubbing)\b/i;
const FORME_LIBRARIE = /\b(codex|codices|manuscript|volume|book|roll|scroll|fragment|leaf|leaves|folio|pothi|palm[- ]leaf|bundle|quire|booklet|album)\b/i;

// carte geografiche manoscritte (dal 26 ottobre 2026, categoria a parte): rientrano se titolo o forma dicono carta, tecnica o forma
// dicono disegnata a mano e niente dice stampa (scripts/carte.mjs)
export const cartaCudl = v => !!v && cartaManoscritta({ titolo: v.t, generi: v.f, tecnica: v.e, descrizione: v.c });

// motivo per cui la scheda resta fuori (null = entra): solo manoscritti librari, di ogni data
export function motivoCudl(v) {
  if (!v) return "senza metadati";
  if (cartaCudl(v)) return null;
  // la forma dice «Sheet» anche per i frammenti di codici: vale l'estensione («Fragment (leaf) 1», «Codex 55»)
  const libraria = FORME_LIBRARIE.test(v.f || "") || /^\s*(Codex|Fragment|Roll|Scroll|Volume)/i.test(v.e || "");
  if (v.f && FORME_NON_LIBRARIE.test(v.f) && !libraria) return "forma non libraria";
  if (NON_LIBRARI.test(v.t || "") && !/\b(letter-?book|book of|copy-?book|letters of [A-Z][a-z]+ (?:to|ad))\b/i.test(v.t || "") && !(v.f && /codex/i.test(v.f))) return "carte non librarie";
  if (/^1 (sheet|leaf)\b|^letter\b/i.test(v.e || "") && !(v.f && /codex|fragment/i.test(v.f))) return "foglio singolo";
  return null;
}

export function leggiJson(file, vuoto) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return vuoto; } }
export function salvaJson(file, st, campi) {
  const righe = Object.entries(st.voci || {}).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v));
  const testa = JSON.stringify(Object.fromEntries(campi.map(c => [c, st[c] ?? null])));
  fs.writeFileSync(file + ".tmp", testa.slice(0, -1) + ',"voci":{\n' + righe.join(",\n") + "\n}}\n");
  fs.renameSync(file + ".tmp", file);
}
