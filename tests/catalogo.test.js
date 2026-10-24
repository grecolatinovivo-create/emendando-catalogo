// Catalogo dei manoscritti: riconoscimento di autori e opere, estrattori delle fonti, voci del catalogo.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { caricaAutori, riconosci, normalizza } from "../scripts/riconosci.mjs";
import { estraiHeidelberg, estraiEcodices, estraiBsb } from "../scripts/fonti/oai.mjs";
import { metadatiDaInizio, segnaturaLeggibile, recordVaticana } from "../scripts/fonti/vaticana.mjs";
import { voce, TRUCULENTUS } from "../scripts/raccogli.mjs";
import { estraiGallica, segnaturaGallica } from "../scripts/fonti/gallica.mjs";
import { metadatiBodleian, dividiSegnatura } from "../scripts/fonti/bodleian.mjs";
import { titoliSezioni, conIndici } from "../scripts/fonti/heidelberg-indici.mjs";
import { compattaLaurenziana, recordLaurenziana, intervalloAnni, segnaturaLaurenziana } from "../scripts/fonti/laurenziana.mjs";

const A = caricaAutori();
const ric = (titolo, extra = {}) => riconosci([
  { campo: "autore", testo: extra.autore || "", forte: true },
  { campo: "titolo", testo: titolo, forte: true },
  { campo: "descrizione", testo: extra.descrizione || "", forte: false }], A);
const ids = r => r.map(x => x.id).sort();

test("autori.json: struttura e assenza di doppioni", () => {
  const d = JSON.parse(fs.readFileSync("data/autori.json", "utf8"));
  assert.ok(d.autori.length >= 40);
  const visti = new Set();
  for (const a of d.autori) {
    assert.ok(a.id && a.nome && a.latino && Array.isArray(a.nomi) && a.nomi.length, a.id);
    assert.ok(!visti.has(a.id), "id doppio " + a.id); visti.add(a.id);
    for (const o of a.opere) assert.ok(o.t && o.v.length, a.id + " " + o.t);
  }
  for (const nome of ["Plauto", "Terenzio", "Lucrezio", "Catullo", "Cicerone", "Cesare", "Sallustio", "Virgilio", "Orazio", "Tibullo", "Properzio", "Ovidio", "Livio", "Seneca", "Lucano",
    "Persio", "Giovenale", "Marziale", "Stazio", "Plinio il Vecchio", "Plinio il Giovane", "Tacito", "Svetonio", "Quintiliano", "Apuleio", "Ammiano Marcellino", "Claudiano", "Prisciano", "Donato", "Servio", "Macrobio", "Boezio"])
    assert.ok(d.autori.some(a => a.nome === nome), nome);
});

test("normalizzazione: accenti, punteggiatura, u/v, i/j", () => {
  assert.equal(normalizza("Énéide, P. Virgilii").t, "eneide p uirgilii");
  assert.equal(normalizza("Juvenalis; Iuvenalis").t, "iuuenalis iuuenalis");
  const n = normalizza("Comoediae (Plautus, Titus)"); assert.equal(n.t.slice(10, 17), "plautus"); assert.equal("Comoediae (Plautus, Titus)".slice(n.mappa[10], n.mappa[16] + 1), "Plautus");
});

test("riconoscimento: veri positivi", () => {
  const casi = [
    ["Comoediae (Plautus, Titus Maccius, m. 184 a.C.). Gruppi, scelte", ["plauto"]],
    ["Comoediae", ["plauto"], { autore: "Plautus, Titus Maccius" }],
    ["Accessus ad Ovidii Metamorphoses ; Publius Ovidius Naso, Metamorphoses", ["ovidio"]],
    ["P. Vergilius Maro, Aeneis", ["virgilio"]],
    ["Aeneidos libri XII", ["virgilio"]],
    ["Vergilius cum commento Servii", ["servio", "virgilio"]],
    ["Lucanus, Pharsalia", ["lucano"]],
    ["Thebais", ["stazio"]],
    ["De consolatione philosophiae", ["boezio"]],
    ["Disticha Catonis", ["disticha-catonis"]],
    ["Cato maior de senectute; Laelius de amicitia", ["cicerone"]],
    ["Rhetorica ad Herennium", ["cicerone"]],
    ["Plinius Secundus, Gaius: Naturalis historia", ["plinio-vecchio"]],
    ["Plinius, Epistulae", ["plinio-giovane"]],
    ["Institutio oratoria", ["quintiliano"]],
    ["Terentius, Comoediae: Andria, Eunuchus", ["terenzio"]],
    ["Iuvenalis, Saturae ; Persius, Saturae", ["giovenale", "persio"]],
    ["Macrobius, Commentarii in Somnium Scipionis", ["macrobio"]],
    ["Sammelhandschrift", ["virgilio"], { descrizione: "This manuscript contains Virgil's Aeneid with interlinear glosses." }],
    ["Noctes Atticae", ["gellio"]],
    ["Iulius Caesar, De bello Gallico", ["cesare"]],
  ];
  for (const [t, attesi, extra] of casi) assert.deepEqual(ids(ric(t, extra)), attesi.sort(), t);
  const r = ric("Comoediae (Plautus, Titus Maccius, m. 184 a.C.). Gruppi, scelte")[0];
  assert.equal(r.autore, "Plauto"); assert.equal(r.latino, "Plautus"); assert.match(r.corrispondenza, /^titolo: «Comoediae \(Plautus/);
  assert.deepEqual(ric("Publius Vergilius Maro, Aeneis")[0].opere, ["Eneide"]);
});

test("riconoscimento: falsi positivi evitati", () => {
  const casi = [
    "Vita s. Virgilii episcopi Salisburgensis",          // santo omonimo
    "Virgil von Salzburg, Briefe",
    "Passio sancti Martialis",                            // san Marziale di Limoges
    "Martialis, Sermones",                                // nome debole senza opera
    "Claudianus Mamertus, De statu animae",               // omonimo escluso
    "Gesta Caesarum",                                     // Caesarum non è Caesar
    "Caesar Heisterbacensis, Dialogus miraculorum",      // Caesar da solo è debole
    "Ambrosius, De officiis ministrorum",                 // De officiis senza Cicerone
    "Commentum in Ciceronis Rhetoricam",                  // commento: il testo non è di Cicerone
    "Glosae super Boethium De consolatione philosophiae", // glosse su Boezio
    "Kommentar zu Vergil",
    "Cato, Disticha",                                     // Catone da solo è debole
    "Medizinische Sammelhandschrift",
    "Florus, Epistola",                                   // Floro debole senza la sua opera
    "Plinius",                                            // Plinio senza opera: quale dei due?
    "Martianus, Passio",
    "Livius Andronicus",
    "Metamorphoses",                                      // Ovidio o Apuleio? senza nome non si decide
  ];
  for (const t of casi) assert.deepEqual(ids(ric(t)), [], t);
  // nella sola descrizione il nome non basta: serve anche un'opera
  assert.deepEqual(ids(ric("Sammelhandschrift", { descrizione: "Sermons quoting Cicero and Seneca on friendship." })), []);
});

const rec = s => `<record>${s}</record>`;
test("estrattori OAI: Heidelberg, e-codices, BSB", () => {
  const h = estraiHeidelberg(rec(`<dc:creator>Plautus, Titus Maccius</dc:creator><dc:title>Heidelberg, Universitätsbibliothek Heidelberg, Cod. Pal. lat. 1613: Comoediae</dc:title>
    <dc:date>Ende 10. Jh.</dc:date><dc:rights>http://creativecommons.org/publicdomain/mark/1.0/deed.de</dc:rights><dc:identifier>https://digi.ub.uni-heidelberg.de/diglit/cpl1613</dc:identifier>
    <dc:hasFormat>https://digi.ub.uni-heidelberg.de/diglit/iiif/cpl1613/manifest.json</dc:hasFormat><dc:language>x-unknown</dc:language><dc:type>Manuscript</dc:type>`));
  assert.deepEqual({ ...h }, { fonte: "heidelberg", id: "hd-cpl1613", citta: "Heidelberg", biblioteca: "Universitätsbibliothek Heidelberg", segnatura: "Cod. Pal. lat. 1613",
    datazione: "Ende 10. Jh.", titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], manifest: "https://digi.ub.uni-heidelberg.de/diglit/iiif/cpl1613/manifest.json",
    pagina: "https://digi.ub.uni-heidelberg.de/diglit/cpl1613", licenza: "Public Domain Mark 1.0" });
  assert.equal(estraiHeidelberg(rec(`<dc:title>Heidelberger Papyrussammlung, P. Heid. Inv. G. 1</dc:title><dc:identifier>https://digi.ub.uni-heidelberg.de/diglit/p1</dc:identifier><dc:type>Manuscript</dc:type>`)), null);
  assert.equal(estraiHeidelberg(rec(`<dc:title>Heidelberg, UB, Cod. Pal. germ. 1: X</dc:title><dc:identifier>https://digi.ub.uni-heidelberg.de/diglit/cpg1</dc:identifier><dc:language>de</dc:language><dc:type>Manuscript</dc:type>`)), null);

  const e = estraiEcodices(rec(`<dc:title>St. Gallen, Stiftsbibliothek, Cod. Sang. 878 : Vademecum of Walahfrid Strabo</dc:title><dc:description>Contains Priscian.</dc:description>
    <dc:creator>Walahfrid Strabo</dc:creator><dc:date>between about 825 and 849 :: notBefore 825</dc:date><dc:type>Manuscript</dc:type><dc:identifier>doi:10.5076/e-codices-csg-0878</dc:identifier>
    <dc:identifier>https://www.e-codices.ch/en/list/one/csg/0878</dc:identifier><dc:identifier>St. Gallen, Stiftsbibliothek, Cod. Sang. 878</dc:identifier><dc:language>lat</dc:language>
    <dc:rights>Images: Public Domain</dc:rights><dc:relation>IIIF Manifest: https://e-codices.ch/metadata/iiif/csg-0878/manifest.json</dc:relation><dc:preview_page>https://e-codices.ch/loris/x.jp2/full/,150/0/default/jpg</dc:preview_page>`));
  assert.equal(e.id, "ec-csg-0878"); assert.equal(e.citta, "St. Gallen"); assert.equal(e.biblioteca, "Stiftsbibliothek"); assert.equal(e.segnatura, "Cod. Sang. 878");
  assert.equal(e.datazione, "between about 825 and 849"); assert.equal(e.manifest, "https://www.e-codices.unifr.ch/metadata/iiif/csg-0878/manifest.json"); assert.equal(e.licenza, "Public Domain Mark 1.0");

  const b = estraiBsb(rec(`<dc:title>Publii Vergilii Maronis Aeneis - BSB Clm 305 : [Fragment]</dc:title><dc:creator>Vergilius Maro, Publius</dc:creator><dc:date>[ca. 1200]</dc:date>
    <dc:language>lat</dc:language><dc:identifier>http://mdz-nbn-resolving.de/urn:nbn:de:bvb:12-bsb00012345-6</dc:identifier>
    <dc:description>Volltext // Exemplar mit der Signatur: München, Bayerische Staatsbibliothek -- Clm 305</dc:description>`));
  assert.equal(b.id, "bsb-bsb00012345"); assert.equal(b.segnatura, "Clm 305"); assert.equal(b.titolo, "Publii Vergilii Maronis Aeneis: [Fragment]");
  assert.equal(b.manifest, "https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00012345/manifest");
  assert.equal(estraiBsb(rec(`<dc:title>Wappenbuch - BSB Cod.icon. 308</dc:title><dc:identifier>urn:nbn:de:bvb:12-bsb00000001-1</dc:identifier><dc:description>Exemplar mit der Signatur: München, Bayerische Staatsbibliothek -- Cod.icon. 308</dc:description>`)), null);
});

test("Vaticana: metadati dall'inizio del manifesto e segnature leggibili", () => {
  const inizio = `{ "@context" : "x", "@id" : "https://digi.vatlib.it/iiif/MSS_Pal.lat.1615/manifest.json", "@type" : "sc:Manifest",
    "metadata" : [ { "label" : "Shelfmark", "value" : "Pal.lat.1615" }, { "label" : "Author", "value" : [ "Plautus, Titus Maccius" ] },
    { "label" : "Title", "value" : [ "Comoediae" ] }, { "label" : "Date", "value" : [ "10.-11. Jh." ] } ], "label" : "Pal.lat.1615", "sequences" : [ { "@type" : "sc:Seq`;
  assert.deepEqual(metadatiDaInizio(inizio), { a: ["Plautus, Titus Maccius"], t: ["Comoediae"], d: "10.-11. Jh.", l: "Pal.lat.1615" });
  assert.equal(segnaturaLeggibile("Vat.lat.3870"), "Vat. lat. 3870");
  const r = recordVaticana({ voci: { "Vat.lat.3870": { a: ["Plautus, Titus Maccius, m. 184 a.C."], t: ["Comoediae"], d: "sec. XI?" } } })[0];
  assert.equal(r.id, "bav-vat-lat-3870"); assert.equal(r.manifest, "https://digi.vatlib.it/iiif/MSS_Vat.lat.3870/manifest.json"); assert.equal(r.segnatura, "Vat. lat. 3870");
});

test("voci del catalogo: solo codici con autori della lista, più i tre del Truculentus", () => {
  const v = voce({ fonte: "bsb", id: "bsb-x", segnatura: "Clm 1", titolo: "Breviarium", autori_fonte: [], manifest: "https://x/m" }, A);
  assert.equal(v, null);
  for (const t of TRUCULENTUS) { const x = voce(t, A); assert.ok(x, t.id); assert.equal(x.truculentus, t.sigla); assert.deepEqual(x.autori.map(a => a.id), ["plauto"]); }
  const c = JSON.parse(fs.readFileSync("data/manoscritti.json", "utf8"));
  for (const seg of ["Pal. lat. 1615", "Vat. lat. 3870", "Cod. Pal. lat. 1613"]) assert.ok(c.manoscritti.some(m => m.segnatura === seg && m.autori.some(a => a.id === "plauto")), seg);
  assert.ok(c.manoscritti.every(m => m.autori.length && m.manifest && m.id && m.segnatura));
  assert.equal(new Set(c.manoscritti.map(m => m.id)).size, c.manoscritti.length);
});

test("Gallica: segnature dei fondi latini e record SRU", () => {
  assert.equal(segnaturaGallica(["Bibliothèque nationale de France. Département des Manuscrits. Latin 7899"]), "Latin 7899");
  assert.equal(segnaturaGallica(["Bibliothèque nationale de France. Département des Manuscrits. Nouvelle acquisition latine 1132"]), "Nouvelle acquisition latine 1132");
  assert.equal(segnaturaGallica(["Bibliothèque nationale de France. Département des Manuscrits. Français 2"]), null);
  const g = estraiGallica(`<srw:record><dc:title>Terentii comoediae</dc:title><dc:creator>Térence (0190?-0159 av. J.-C.). Auteur du texte</dc:creator><dc:date>0801-0900</dc:date>
    <dc:type>manuscrit</dc:type><dc:language>lat</dc:language><dc:identifier>https://gallica.bnf.fr/ark:/12148/btv1b8422924h</dc:identifier>
    <dc:source>Bibliothèque nationale de France. Département des Manuscrits. Latin 7899</dc:source><dc:rights>domaine public</dc:rights></srw:record>`);
  assert.equal(g.id, "bnf-btv1b8422924h"); assert.equal(g.segnatura, "Latin 7899"); assert.equal(g.manifest, "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8422924h/manifest.json");
  assert.deepEqual(voce(g, A).autori.map(a => a.id), ["terenzio"]);
});

test("Bodleian: metadati dall'inizio del manifesto", () => {
  const m = metadatiBodleian(`{"@id":"x","label":"Bodleian Library MS. Auct. F. 1. 15","description":"Boethius, glossed; Persius, with commentary","metadata":[
    {"label":"Title","value":"Boethius, glossed; Persius, with commentary"},{"label":"Shelfmark","value":"Bodleian Library MS. Auct. F. 1. 15"},
    {"label":"Author","value":"Boethius, –524"},{"label":"Author","value":"Persius"},{"label":"Language","value":"Latin"},{"label":"Date Statement","value":"10th century, end"},
    {"label":"Contents","value":"Composite manuscript. Part 1: Boethius, De consolatione philosophiae. Part 2: Persius, Satires."}],
    "attribution":"<span>Terms of use: <a href=\\"https://creativecommons.org/licenses/by-nc/4.0/\\">CC BY-NC 4.0</a></span>","sequences":[{"@type":"sc:Seq`);
  assert.equal(m.s, "Bodleian Library MS. Auct. F. 1. 15"); assert.deepEqual(m.a, ["Boethius, –524", "Persius"]); assert.equal(m.d, "10th century, end"); assert.equal(m.r, "CC BY-NC 4.0");
  assert.deepEqual(dividiSegnatura("Bodleian Library MS. Auct. F. 1. 15"), { biblioteca: "Bodleian Library", segnatura: "MS. Auct. F. 1. 15" });
  assert.deepEqual(dividiSegnatura("Balliol College MS 238A"), { biblioteca: "Balliol College", segnatura: "MS 238A" });
});

test("miscellanee: indice dei contenuti dalle structures del manifesto", () => {
  const man = { structures: [{ label: "Einband" }, { label: "Inhaltsverzeichnis" }, { label: "Vergil: Aeneis" }, { label: "Hymni" }, { label: "Rücken" }, { label: "Maßstab/Farbkeil" }] };
  assert.deepEqual(titoliSezioni(man), ["Vergil: Aeneis", "Hymni"]);
  const v3 = { structures: [{ type: "Range", label: { de: ["Inhalt"] }, items: [{ type: "Range", label: { none: ["Statius, Thebais"] } }, { type: "Canvas", label: "1r" }] }] };
  assert.deepEqual(titoliSezioni(v3), ["Inhalt", "Statius, Thebais"]);
  const r = { fonte: "heidelberg", id: "hd-cpl1", segnatura: "Cod. Pal. lat. 1", titolo: "Sammelhandschrift", autori_fonte: [], manifest: "https://x/cpl1" };
  assert.equal(voce(r, A), null);
  const [ri] = conIndici([r], { voci: { cpl1: ["Vergil: Aeneis", "Hymni"] } });
  const v = voce(ri, A);
  assert.deepEqual(v.autori.map(a => a.id), ["virgilio"]); assert.match(v.autori[0].corrispondenza, /^indice: /);
  // nell'indice servono nome e opera; omonimi e spuri non contano
  assert.equal(voce(conIndici([r], { voci: { cpl1: ["Donatus ep. et Hilarianus mon.", "Iuvenalis episcopus, Epistolae"] } })[0], A), null);
  assert.deepEqual(ids(ric("Ps.-Ausonius, Septem sapientum sententiae ; Pseudo-Boethius, De disciplina scolarium")), []);
  // un commento non è l'autore
  assert.equal(voce(conIndici([r], { voci: { cpl1: ["Glosae super Boethium", "Sermones"] } })[0], A), null);
});

test("Laurenziana: record di dmQuery, segnature, datazioni e voci", () => {
  const rec = { collection: "/plutei", pointer: 669574, filetype: "cpd", parentobject: -1, title: "Virgilius . Scilicet P. Virgilii Maronis Bucolicorum pars, Georgicorum libri IV et Aeneidos libri XII",
    creato: "Virgilius;Virgilius", contri: "", descri: "", date: "401; 402; 403; 500", datazi: "", subjec: "Plut.39.1", rights: "CC BY-NC-SA",
    source: "I. Bucolica; P. Virgilius Maro; {IT:FI0100_Plutei_39.01_0001}|II. Georgica; s.a.; {IT:FI0100_Plutei_39.01_0002}", conten: "" };
  assert.equal(compattaLaurenziana({ ...rec, parentobject: 669570 }), null);
  const c = compattaLaurenziana(rec);
  assert.equal(c.d, "401-500"); assert.equal(c.c, "I. Bucolica; P. Virgilius Maro | II. Georgica");
  const [r] = recordLaurenziana({ voci: { "plutei:669574": c } });
  assert.equal(r.id, "bml-plutei-669574"); assert.equal(r.segnatura, "Plut. 39.1"); assert.equal(r.licenza, "CC BY-NC-SA");
  assert.equal(r.manifest, "https://tecabml.contentdm.oclc.org/iiif/plutei:669574/manifest.json");
  assert.equal(r.pagina, "https://tecabml.contentdm.oclc.org/digital/collection/plutei/id/669574");
  assert.deepEqual(voce(r, A).autori.map(a => a.id), ["virgilio"]);
  assert.equal(intervalloAnni("1401; 1402; 1500"), "1401-1500");
  assert.equal(segnaturaLaurenziana("Plut.12 sin.3"), "Plut. 12 sin.3"); assert.equal(segnaturaLaurenziana("Acquisti e Doni 233"), "Acquisti e Doni 233");
});

test("Laurenziana: omonimi e opere moderne non contano", () => {
  for (const t of ["Plutarchi Vitae quaedam, et Leonardi Arretini Cicero Novus", "Donati Acciaioli Vita Alcibiadis ex Plutarcho", "Baccii Baldini Oratio de clementia",
    "Polyaeni Stratagemata Petro Angelio interpr", "Guidonis Columnae De excidio Troiae liber", "Ang. Pol., Marc. Virgilii, Herm. Barbari etc. Opuscula"])
    assert.deepEqual(ids(ric(t)), [], t);
  assert.deepEqual(ids(ric("Synesius De somniis, Ficino interprete, et Prisciani Lydii varia")), []);
});

test("Leida: pagina dei risultati della collezione, segnature e voci", async () => {
  const { leggiPagina, recordLeiden, segnaturaLeiden } = await import("../scripts/fonti/leiden.mjs");
  const riga = (id, tit, seg, aut, pub) => `<tr class="islandora-solr-search-result clear-block odd bookcmodel"><td><a href="/view/item/${id}?solr_nav" title="${tit}"></a></td>
    <td class="solr-fields islandora-inline-metadata"><dt>Titel</dt><dd class="solr-value fgs-label-s"><a href="/view/item/${id}">${tit}</a></dd>
    <dt>Shelfmark</dt><dd class="solr-value mods-relateditem-otherformat-identifier-ms">${seg}</dd>
    <dt>Creator/other</dt><dd class="solr-value mods-name-personal-namepart-ms">${aut}</dd>
    <dt>Published</dt><dd class="solr-value mods-relateditem-otherformat-origininfo-publisher-ms">${pub}</dd></td></tr>`;
  const html = `<div>(1 - 20 of 1,151)</div><table>${riga(4244100, "De rerum natura / Lucretius, VLQ 94", "VLQ 94", "Lucretius Carus, Titus., Vossius, Isaac", "France, 9th century")}
    ${riga(4244200, "Composite manuscript, four parts (Latin), BPL 100", "BPL 100", "Alcuin, Amalarius, Wulfinus Boethius", "France, 9th century")}</table>`;
  const p = leggiPagina(html);
  assert.equal(p.totale, 1151);
  assert.deepEqual(p.voci["4244100"], { s: "VLQ 94", t: "De rerum natura / Lucretius", a: "Lucretius Carus, Titus., Vossius, Isaac", d: "France, 9th century" });
  assert.equal(segnaturaLeiden("VLF 30"), "Voss. Lat. F. 30"); assert.equal(segnaturaLeiden("BPL 16 B"), "BPL 16 B");
  const [r1, r2] = recordLeiden({ voci: p.voci });
  assert.equal(r1.manifest, "https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:4244100/manifest");
  assert.equal(r1.segnatura, "Voss. Lat. Q. 94");
  assert.deepEqual(voce(r1, A).autori.map(a => a.id), ["lucrezio"]);
  assert.equal(voce(r2, A), null);   // «Wulfinus Boethius» non è Boezio
});
