#!/usr/bin/env node
// Schede dei papiri da papyri.info (dal 28 ottobre 2026): estratto compatto del repository papyri/idp.data (dati CC BY 3.0),
// usato dalla fonte «papiri» (scripts/fonti/papiri.mjs) per l'elenco di Michigan, Yale, Duke e Princeton (schede APIS con i
// link alle immagini) e per arricchire le schede di tutte le raccolte (edizione, data, provenienza, testo letterario o documentario,
// autore e opera dei letterari da DCLP).
// Nessuna richiesta ai siti: si legge una copia locale del repository, scaricata con git (solo le cartelle che servono):
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/papyri/idp.data.git /tmp/idp.data
//   git -C /tmp/idp.data sparse-checkout set APIS/berkeley APIS/yale APIS/michigan APIS/duke APIS/princeton HGV_meta_EpiDoc DCLP
//   node scripts/papiri-info.mjs --idp=/tmp/idp.data
// Scrive data/papiri-info.json (una voce per riga). Da rifare ogni tanto (papyri.info si aggiorna lentamente).
import fs from "node:fs";
import path from "node:path";

export const FILE = "data/papiri-info.json";
export const RACCOLTE_APIS = ["berkeley", "yale", "michigan", "duke", "princeton"];

const dec = s => String(s ?? "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const tutti = (x, re) => [...x.matchAll(re)].map(m => dec(m[1].replace(/<[^>]+>/g, " "))).filter(Boolean);
const uno = (x, re) => { const m = re.exec(x); return m ? dec(m[1].replace(/<[^>]+>/g, " ")) : null; };
const pulisci = v => { for (const k of Object.keys(v)) if (v[k] == null || v[k] === "" || (Array.isArray(v[k]) && !v[k].length)) delete v[k]; return v; };
const anno = s => (s == null || s === "" || isNaN(+s)) ? null : +s;
function* file(dir) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) yield* file(p); else if (n.name.endsWith(".xml")) yield p;
  }
}
// date: [notBefore, notAfter] (anni con segno: negativi = a.C.), più il testo
function data(x) {
  const m = /<origDate\b([^>]*)>([\s\S]*?)<\/origDate>|<origDate\b([^>]*)\/>/.exec(x);
  if (!m) return {};
  const at = m[1] || m[3] || "", t = dec((m[2] || "").replace(/<[^>]+>/g, " "));
  const nb = anno((/notBefore="([^"]*)"/.exec(at) || [])[1]) ?? anno((/when="([^"]*)"/.exec(at) || [])[1]);
  const na = anno((/notAfter="([^"]*)"/.exec(at) || [])[1]) ?? nb;
  return pulisci({ dt: t || null, dn: nb != null ? [nb, na] : null, dc: /cert="low"/.test(at) ? 1 : null });
}

// ------------------------------------------------------------------------------------------------ APIS
export function schedaApis(x) {
  const id = uno(x, /<idno type="apisid">([^<]*)</);
  if (!id) return null;
  const img = tutti(x, /<graphic url="([^"]*)"/g);
  const lingue = [...new Set([...x.matchAll(/<textLang\b[^>]*?(?:mainLang="([^"]*)")?[^>]*>([^<]*)</g)].flatMap(m => [m[1], m[2]]).filter(Boolean).map(dec))];
  return pulisci({ id, inv: uno(x, /<idno type="invNo">([^<]*)</), t: uno(x, /<titleStmt>\s*<title>([\s\S]*?)<\/title>/), s: uno(x, /<summary>([\s\S]*?)<\/summary>/),
    tm: uno(x, /<idno type="TM">([^<]*)</), hgv: uno(x, /<idno type="HGV">([^<]*)</), ddb: uno(x, /<idno type="ddb-hybrid">([^<]*)</),
    ...data(x), luogo: uno(x, /<origPlace>([\s\S]*?)<\/origPlace>/) || uno(x, /<provenance>\s*<p>([\s\S]*?)<\/p>/),
    sup: uno(x, /<support>([\s\S]*?)<\/support>/), g: lingue.filter(l => !/^en$|^English$/.test(l)).slice(0, 6),
    k: tutti(x, /<term[^>]*>([\s\S]*?)<\/term>/g).slice(0, 8),
    // Michigan: l'entryid sta anche nel link «Original record» (alcune schede hanno solo la miniatura senza entryid)
    ...immaginiApis(img.some(u => /umich\.edu/.test(u)) ? [...img, ...tutti(x, /(entryid=X-\d+)/g)] : img) });
}
// link alle immagini -> identificativi utili per raccolta (i link di Berkeley puntano alle immagini di papyri.info, tolte: non servono)
//   mi: entryid di Michigan (manifesto quod.lib.umich.edu/cgi/i/image/api/manifest/apis:<n>); h: handle di Yale (10079/digcoll/<n>);
//   du: nomi dei file di Duke a 150 dpi («309v» per images/150dpi/309v-at150.gif); pr: identificativi ark di Princeton (dpul.princeton.edu/papyri/catalog/<id>)
export function immaginiApis(img) {
  const u = (re) => [...new Set(img.map(x => (re.exec(x) || [])[1]).filter(Boolean))];
  return pulisci({ mi: u(/entryid=X-(\d+)/i), h: u(/10079\/digcoll\/(\d+)/), du: u(/\/150dpi\/(.+?)-at150\.gif/i), pr: u(/dpul\.princeton\.edu\/papyri\/catalog\/([a-z0-9]+)/i).concat(u(/arks\.princeton\.edu\/ark:\/88435\/([a-z0-9]+)/i)) });
}

// ------------------------------------------------------------------------------------------------ HGV e DCLP
const EDIZIONE_HGV = x => {
  const b = /<bibl type="publication" subtype="principal">([\s\S]*?)<\/bibl>/.exec(x); if (!b) return null;
  const s = uno(b[1], /<title level="s" type="abbreviated">([^<]*)</);
  const vol = uno(b[1], /<biblScope type="volume">([^<]*)</), num = uno(b[1], /<biblScope type="numbers">([^<]*)</);
  return [s, vol, num].filter(Boolean).join(" ") || null;
};
export function schedaHgv(x) {
  const tm = uno(x, /<idno type="TM">([^<]*)</); if (!tm) return null;
  const links = tutti(x, /<graphic url="([^"]*)"/g);
  return { tm, v: pulisci({ e: EDIZIONE_HGV(x), t: uno(x, /<titleStmt>\s*<title>([\s\S]*?)<\/title>/), ...data(x), luogo: uno(x, /<origPlace>([\s\S]*?)<\/origPlace>/),
    mat: uno(x, /<material>([^<]*)</) }), links };
}
export function schedaDclp(x) {
  const tm = uno(x, /<idno type="TM">([^<]*)</); if (!tm) return null;
  const antiche = [...x.matchAll(/<bibl type="publication" subtype="ancient">([\s\S]*?)<\/bibl>/g)].map(m => m[1]);
  const autori = [...new Set(antiche.map(b => uno(b, /<author\b[^>]*>([\s\S]*?)<\/author>/)).filter(Boolean))];
  const opere = [...new Set(antiche.map(b => uno(b, /<title\b[^>]*>([\s\S]*?)<\/title>/)).filter(Boolean))];
  const links = [...tutti(x, /<graphic url="([^"]*)"/g), ...tutti(x, /<ptr target="([^"]*)"/g)];
  const termini = tutti(x, /<term\b[^>]*>([\s\S]*?)<\/term>/g);
  return { tm, v: pulisci({ lit: 1, e: uno(x, /<titleStmt>\s*<title>([\s\S]*?)<\/title>/), ldab: uno(x, /<idno type="LDAB">([^<]*)</), ...data(x),
    luogo: uno(x, /<origPlace>([\s\S]*?)<\/origPlace>/), mat: uno(x, /<material>([^<]*)</), a: autori.slice(0, 4), o: opere.slice(0, 4),
    gen: (termini.find(t => /^(prose|poetry|drama)/i.test(t)) ? termini.slice(0, 4).join(", ") : null) }), links };
}

// ------------------------------------------------------------------------------------------------ chiavi dalle altre raccolte
// link delle schede HGV/DCLP -> chiave della raccolta: apis («duke.apis.123»), Vienna («RZ00005797»), Colonia («stueck/tm2482» o «koeln»)
export function chiaviDa(links) {
  const out = [];
  for (const u of links) {
    let m;
    if ((m = /\b([a-z]+\.apis\.[A-Za-z0-9]+)/.exec(u))) out.push(m[1]);
    if ((m = /onb\.ac\.at\/rec\/(RZ\d+)/i.exec(u))) out.push(m[1].toUpperCase());
    if ((m = /papyri\.uni-koeln\.de\/stueck\/([A-Za-z0-9_]+)/.exec(u))) out.push("koeln:" + m[1]);
    else if (/uni-koeln\.de\/phil-fak\/ifa/.test(u)) out.push("koeln");
  }
  return [...new Set(out)];
}

export function costruisci(idp) {
  const apis = {}, tm = {}, perChiave = {};
  for (const r of RACCOLTE_APIS) {
    const dir = path.join(idp, "APIS", r, "xml"); if (!fs.existsSync(dir)) continue;
    for (const f of file(dir)) {
      const s = schedaApis(fs.readFileSync(f, "utf8")); if (!s) continue;
      // senza immagini utili si tengono solo le schede di Berkeley (servono per arricchire l'elenco OAI della biblioteca)
      if (r !== "berkeley" && !s.mi && !s.h && !s.du && !s.pr) continue;
      apis[s.id] = s; delete s.id;
    }
  }
  const leggi = (sotto, fn) => { const dir = path.join(idp, sotto); if (!fs.existsSync(dir)) return; for (const f of file(dir)) { const s = fn(fs.readFileSync(f, "utf8")); if (!s) continue;
    const ch = chiaviDa(s.links);
    tm[s.tm] = { ...(tm[s.tm] || {}), ...s.v };
    for (const k of ch) { if (k === "koeln") (perChiave.koeln = perChiave.koeln || []).push(s.tm); else (perChiave[k] = perChiave[k] || []).push(s.tm); } } };
  leggi("HGV_meta_EpiDoc", schedaHgv);
  leggi("DCLP", schedaDclp);   // dopo HGV: per i letterari valgono edizione, autore e opera di DCLP
  // schede APIS col numero TM ma senza link dalle schede HGV: si tiene il TM della scheda APIS
  for (const [k, s] of Object.entries(apis)) if (s.tm && !perChiave[k]) perChiave[k] = [s.tm];
  // solo i TM che servono (collegati a una raccolta)
  const usati = new Set([...Object.values(perChiave).flat(), ...Object.values(apis).map(s => s.tm).filter(Boolean)]);
  for (const k of Object.keys(tm)) if (!usati.has(k)) delete tm[k];
  return { apis, tm, chiavi: Object.fromEntries(Object.entries(perChiave).map(([k, v]) => [k, [...new Set(v)]])) };
}

export function scrivi(d, file = FILE) {
  const blocco = o => Object.entries(o).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v)).join(",\n");
  const testa = { nota: "Estratto da papyri.info (repository papyri/idp.data, dati CC BY 3.0): schede APIS di Berkeley, Yale, Michigan, Duke e Princeton, schede HGV e DCLP collegate alle raccolte del catalogo. Scritto da scripts/papiri-info.mjs.", creato: new Date().toISOString() };
  fs.writeFileSync(file + ".tmp", JSON.stringify(testa).slice(0, -1) + ',"apis":{\n' + blocco(d.apis) + '\n},"tm":{\n' + blocco(d.tm) + '\n},"chiavi":{\n' + blocco(d.chiavi) + "\n}}\n");
  fs.renameSync(file + ".tmp", file);
}
let cache = null;
export function leggiInfo(file = FILE) {
  if (cache && cache.file === file) return cache.d;
  let d; try { d = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { d = { apis: {}, tm: {}, chiavi: {} }; }
  cache = { file, d }; return d;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
  if (!arg.idp) { console.error("uso: node scripts/papiri-info.mjs --idp=<copia locale di papyri/idp.data>"); process.exit(1); }
  const d = costruisci(arg.idp);
  scrivi(d);
  console.error(`schede APIS: ${Object.keys(d.apis).length}; schede HGV/DCLP collegate: ${Object.keys(d.tm).length}; chiavi: ${Object.keys(d.chiavi).length}`);
}
