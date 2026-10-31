// Doppioni del catalogo (dal 31 ottobre 2026, lavoro sulla qualità deciso da Giampiero).
// Lo stesso codice può arrivare due volte:
//   - da due fonti diverse (la Bodleiana e Heidelberg, che ha digitalizzato alcuni codici Laud; la BSB e la corsia delle stampe; Digital Scriptorium e Harvard…);
//   - due volte da Gallica, che per molti codici ha due riproduzioni (di solito una a colori e una vecchia in bianco e nero da microfilm).
// Si tiene una voce sola: le altre riproduzioni restano nella voce tenuta, in «riproduzioni», e al posto delle voci tolte
// resta nel loro pezzo di voci un rimando { id, fonte, alias } (così i preferiti e i link vecchi portano al codice giusto).
// Non si uniscono papiri ed epigrafi (stessa segnatura per frammenti diversi) né, dentro una stessa fonte diversa da Gallica,
// le voci con la stessa segnatura (volumi diversi di un'opera, parti di una raccolta).

const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const ESCLUSI = new Set(["papiro", "epigrafe"]);
// fonti che raccolgono codici di altre biblioteche: a parità, si tiene la voce della biblioteca che li conserva
const AGGREGATORI = new Set(["heidelberg", "ds"]);
const STAMPE = new Set(["incunabolo", "stampa"]);

// punteggio per scegliere la voce da tenere
function punti(v) {
  let p = 0;
  if (!AGGREGATORI.has(v.fonte) || /heidelberg/i.test(v.biblioteca || "")) p += 8;
  if (STAMPE.has(v.tipo)) p += 4;   // la voce della corsia delle stampe ha il tipo giusto
  // Gallica: gli ark btv1b8… e btv1b9… sono quasi sempre le riproduzioni in bianco e nero da microfilm
  if (v.fonte === "gallica" && !/btv1b[89]/.test(v.id)) p += 2;
  if ((v.autori || []).length) p += 1;
  if (v.lingue && v.lingue.length && !v.lingua_dedotta) p += 1;
  return p;
}

export function unisciDoppioni(voci) {
  const gruppi = new Map();
  for (const v of voci.values()) {
    if (!v || ESCLUSI.has(v.tipo) || !norm(v.segnatura) || !norm(v.biblioteca)) continue;
    const k = norm(v.biblioteca) + "|" + norm(v.segnatura);
    (gruppi.get(k) || gruppi.set(k, []).get(k)).push(v);
  }
  const alias = [], conta = { gruppi: 0, tolte: 0, gallica: 0, fonti_diverse: 0 };
  for (const g of gruppi.values()) {
    if (g.length < 2) continue;
    const fonti = new Set(g.map(v => v.fonte));
    let uniti;
    if (fonti.size > 1) {
      // fonti diverse: entrano solo le voci di fonti diverse da quella della voce tenuta (dentro la stessa fonte potrebbero essere volumi)
      const tenuta = [...g].sort((a, b) => punti(b) - punti(a) || (a.id < b.id ? -1 : 1))[0];
      uniti = [tenuta, ...g.filter(v => v.fonte !== tenuta.fonte)];
      // della stessa fonte di un doppione tolto se ne toglie uno solo per fonte
      const visti = new Set([tenuta.fonte]); uniti = uniti.filter(v => v === tenuta || (!visti.has(v.fonte) && visti.add(v.fonte)));
      if (uniti.length > 1) conta.fonti_diverse++;
    } else if (g[0].fonte === "gallica") {
      // Gallica: stessa segnatura, stesso titolo e stessa datazione
      const k2 = v => norm(v.titolo) + "|" + norm(v.datazione);
      const sotto = new Map(); for (const v of g) (sotto.get(k2(v)) || sotto.set(k2(v), []).get(k2(v))).push(v);
      const grandi = [...sotto.values()].filter(x => x.length > 1);
      if (!grandi.length) continue;
      for (const gg of grandi) { applica(gg); conta.gallica++; }
      continue;
    } else continue;
    if (uniti.length > 1) applica(uniti);
  }
  function applica(g) {
    const [tenuta, ...altre] = [...g].sort((a, b) => punti(b) - punti(a) || (a.id < b.id ? -1 : 1));
    const rip = (tenuta.riproduzioni || []).filter(r => !altre.some(a => a.id === r.id));
    for (const a of altre) {
      rip.push({ id: a.id, fonte: a.fonte, manifest: a.manifest || null, pagina: a.pagina || null });
      if (!(tenuta.autori || []).length && (a.autori || []).length) tenuta.autori = a.autori;
      if ((tenuta.lingua_dedotta || !(tenuta.lingue || []).length) && (a.lingue || []).length && !a.lingua_dedotta) { tenuta.lingue = a.lingue; tenuta.lingua_dedotta = false; }
      if (!tenuta.titolo && a.titolo) tenuta.titolo = a.titolo;
      if (!tenuta.secolo && a.secolo) { tenuta.secolo = a.secolo; tenuta.datazione = tenuta.datazione || a.datazione; }
      if (a.miniato) tenuta.miniato = true;
      if (a.musica) tenuta.musica = true;
      voci.delete(a.id);
      alias.push({ id: a.id, fonte: a.fonte, alias: tenuta.id });
      conta.tolte++;
    }
    tenuta.riproduzioni = rip;
    conta.gruppi++;
  }
  return { alias, conta };
}
