// Catalogo dei manoscritti: riconoscimento di autori e opere, estrattori delle fonti, voci del catalogo.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { caricaAutori, riconosci, normalizza } from "../scripts/riconosci.mjs";
import { estraiHeidelberg, estraiEcodices, estraiBsb } from "../scripts/fonti/oai.mjs";
import { metadatiDaInizio, segnaturaLeggibile, recordVaticana, fondiDaHome, segnatureDaFondo, ordineFondi, daLeggere } from "../scripts/fonti/vaticana.mjs";
import { voce, TRUCULENTUS } from "../scripts/raccogli.mjs";
import { estraiGallica, segnaturaGallica } from "../scripts/fonti/gallica.mjs";
import { metadatiBodleian, dividiSegnatura } from "../scripts/fonti/bodleian.mjs";
import { titoliSezioni, conIndici } from "../scripts/fonti/heidelberg-indici.mjs";
import { compattaLaurenziana, recordLaurenziana, intervalloAnni, segnaturaLaurenziana } from "../scripts/fonti/laurenziana.mjs";
import { lingueDa, lingueDaTesto, deduciLingue, lingueDaTitolo, secoli } from "../scripts/lingue.mjs";
import { scriviCatalogo, catalogoPrecedente, fnv1a, pezzoDi, CAMPI } from "../scripts/costruisci.mjs";
import os from "node:os";
import path from "node:path";

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
    "Persio", "Giovenale", "Marziale", "Stazio", "Plinio il Vecchio", "Plinio il Giovane", "Tacito", "Svetonio", "Quintiliano", "Apuleio", "Ammiano Marcellino", "Claudiano", "Prisciano", "Donato", "Servio", "Macrobio", "Boezio",
    "Omero", "Esiodo", "Pindaro", "Saffo", "Eschilo", "Sofocle", "Euripide", "Aristofane", "Menandro", "Erodoto", "Tucidide", "Senofonte", "Platone", "Aristotele", "Teofrasto", "Lisia", "Isocrate", "Demostene",
    "Polibio", "Diodoro Siculo", "Dionigi di Alicarnasso", "Strabone", "Plutarco", "Luciano di Samosata", "Pausania", "Arriano", "Cassio Dione", "Apollonio Rodio", "Teocrito", "Callimaco", "Arato", "Nicandro",
    "Oppiano", "Quinto Smirneo", "Nonno di Panopoli", "Galeno", "Ippocrate", "Tolomeo", "Euclide", "Archimede", "Esichio", "Suda", "Fozio", "Epitteto", "Marco Aurelio", "Plotino", "Porfirio", "Proclo", "Giamblico",
    "Libanio", "Temistio", "Giuliano imperatore", "Caritone", "Longo Sofista", "Eliodoro", "Achille Tazio",
    "Agostino", "Girolamo", "Ambrogio", "Gregorio Magno", "Isidoro di Siviglia", "Beda", "Alcuino", "Basilio Magno", "Gregorio di Nazianzo", "Giovanni Crisostomo", "Bibbia"])
    assert.ok(d.autori.some(a => a.nome === nome), nome);
  const CAT = new Set(["classico-latino", "classico-greco", "cristiano", "medievale"]);
  for (const a of d.autori) { assert.ok(CAT.has(a.categoria), a.id + " categoria"); assert.ok(["la", "grc"].includes(a.lingua), a.id + " lingua"); }
  assert.equal(d.autori.find(a => a.id === "omero").categoria, "classico-greco");
  assert.equal(d.autori.find(a => a.id === "agostino").categoria, "cristiano");
  assert.equal(d.autori.find(a => a.id === "beda").categoria, "medievale");
});

test("riconoscimento: autori greci (anche in alfabeto greco), cristiani e medievali", () => {
  const casi = [
    ["Ὁμήρου Ἰλιάς", ["omero"]], ["Homerus, Ilias", ["omero"]], ["Ilias Latina", ["ilias-latina"]], ["Iliade d'Omero", ["omero"]],
    ["Σοφοκλέους τραγῳδίαι", ["sofocle"]], ["Euripidis Hecuba, Orestes, Phoenissae", ["euripide"]], ["Aristophanis Plutus, Nubes, Ranae", ["aristofane"]],
    ["Thucydides, Historiae", ["tucidide"]], ["Platonis Timaeus (Calcidio interprete)", ["platone"]], ["Aristoteles, Ethica Nicomachea", ["aristotele"]],
    ["Ethica Nicomachea", ["aristotele"]], ["Plutarchi Vitae parallelae", ["plutarco"]], ["Λουκιανοῦ διάλογοι", ["luciano"]], ["Tragodopodagra", ["luciano"]],
    ["Galenus, Tegni", ["galeno"]], ["Claudius Ptolemaeus, Almagestum", ["tolomeo"]], ["Ptolemaeus, Geographia", ["tolomeo"]], ["Suidae lexicon", ["suda"]],
    ["Aurelius Augustinus, De civitate Dei", ["agostino"]], ["S. Augustini Confessiones", ["agostino"]], ["Sancti Hieronymi epistolae", ["girolamo"]],
    ["Ambrosius, De officiis ministrorum", ["ambrogio"]], ["Gregorius Magnus, Homiliae in Evangelia", ["gregorio-magno"]], ["Gregorius, Moralia in Iob", ["gregorio-magno"]],
    ["Isidorus, Etymologiae", ["isidoro"]], ["Beda, Historia ecclesiastica gentis Anglorum", ["beda"]], ["Biblia sacra", ["bibbia"]], ["Evangeliarium", ["bibbia"]],
    ["Τετραευάγγελον", ["bibbia"]], ["Psalterium", ["bibbia"]], ["Ἰωάννου τοῦ Χρυσοστόμου ὁμιλίαι", ["giovanni-crisostomo"]], ["Basilius Magnus, Hexaemeron", ["basilio"]],
    ["Pseudo-Dionysius Areopagita, De caelesti hierarchia", ["dionigi-areopagita"]], ["Prudentius, Psychomachia", ["prudenzio"]],
  ];
  for (const [t, attesi] of casi) assert.deepEqual(ids(ric(t)), attesi.sort(), t);
  const falsi = [
    "Walahfrid Strabo, Hortulus", "Dio Chrysostomus, Orationes", "Breviarium canonicorum regularium sancti Augustini", "Historia Apollonii regis Tyri",
    "Callimachus Experiens, Epistolae", "Sedulius Scottus, Collectaneum", "Glossa super Psalterium", "Glossa in Evangelia", "Plato Tiburtinus, translatio",
    "Ambrosius Traversarius, Epistolae", "Gregorius Nazianzenus, Orationes",
  ];
  const r = Object.fromEntries(falsi.map(t => [t, ids(ric(t))]));
  for (const t of falsi.slice(0, 10)) assert.deepEqual(r[t], [], t);
  assert.deepEqual(r["Gregorius Nazianzenus, Orationes"], ["gregorio-nazianzeno"]);
  assert.equal(ric("Ὁμήρου Ἰλιάς")[0].categoria, "classico-greco");
});

test("lingue e secoli", () => {
  assert.deepEqual(lingueDa(["lat"]), ["la"]); assert.deepEqual(lingueDa(["Greek, Ancient (to 1453)", "Latin"]), ["grc", "la"]);
  assert.deepEqual(lingueDa(["x-unknown"]), []); assert.deepEqual(lingueDa(["Middle English"]), ["en"]); assert.deepEqual(lingueDa(["ger"]), ["de"]);
  assert.deepEqual(lingueDaTesto("Vat. gr. 1", ""), ["grc"]); assert.deepEqual(lingueDaTesto("Clm 305", ""), ["la"]); assert.deepEqual(lingueDaTesto("Cod. Pal. germ. 848", ""), ["de"]);
  assert.deepEqual(lingueDaTesto("Grec 2934", ""), ["grc"]); assert.deepEqual(lingueDaTesto("BPL 100", "Composite manuscript, four parts (Latin)"), ["la"]); assert.deepEqual(lingueDaTesto("Plut. 32.9", "Sophocles"), []);
  // lingua dedotta: fondo e segnatura, poi alfabeto e parole del titolo; incerta resta vuota
  for (const [seg, t, attese] of [["Cgm 51", "", ["de"]], ["Cod.graec. 12", "", ["grc"]], ["Cod.hebr. 3", "", ["he"]], ["Cod.jap. 2", "", ["ja"]], ["Cod.sin. 4", "", ["zh"]],
    ["Vat. ar. 12", "", ["ar"]], ["Vat. copt. 1", "", ["cop"]], ["Chinois 9", "", ["zh"]], ["VGQ 7", "", ["grc"]], ["Plut. 40.1", "Dante, La divina commedia con il commento di Iacopo della Lana", ["it"]],
    ["Or. 3", "Ὁμήρου Ἰλιάς", ["grc"]], ["Or. 297", "كتاب المختصر", ["ar"]], ["Plut. 39.1", "P. Virgilii Maronis Bucolicorum pars, Georgicorum libri IV et Aeneidos libri XII", ["la"]],
    ["X", "De rerum natura / Lucretius, and other text(s)", []], ["Cod. Guelf. 1 Aug.", "Breviarium", []]]) assert.deepEqual(deduciLingue(seg, t), attese, seg + " " + t);
  // titolo latino di catalogo per un autore greco (schede del Bandini): incerta
  assert.deepEqual(deduciLingue("Plut. 32.9", "Sophoclis tragoediae et alia", [{ categoria: "classico-greco" }]), []);
  assert.deepEqual(lingueDaTitolo("Gebete und Andachten von der Passion des Herrn"), ["de"]);
  for (const [d, a] of [["10.-11. Jh.", [10, 11]], ["sec. XI?", [11, 11]], ["1463", [15, 15]], ["between about 825 and 849", [9, 9]], ["0801-0900", [9, 9]], ["XIe siècle", [11, 11]],
    ["s. XII-XIII", [12, 13]], ["9th-10th century", [9, 10]], ["1401-1500", [15, 15]], ["[ca. 1200]", [12, 12]]]) assert.deepEqual(secoli(d), a, d);
  assert.equal(secoli(""), null); assert.equal(secoli("  Italien"), null);
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
  assert.deepEqual({ ...h, lingue: undefined }, { lingue: undefined, fonte: "heidelberg", id: "hd-cpl1613", citta: "Heidelberg", biblioteca: "Universitätsbibliothek Heidelberg", segnatura: "Cod. Pal. lat. 1613",
    datazione: "Ende 10. Jh.", titolo: "Comoediae", autori_fonte: ["Plautus, Titus Maccius"], manifest: "https://digi.ub.uni-heidelberg.de/diglit/iiif/cpl1613/manifest.json",
    pagina: "https://digi.ub.uni-heidelberg.de/diglit/cpl1613", licenza: "Public Domain Mark 1.0" });
  assert.equal(estraiHeidelberg(rec(`<dc:title>Sammlung Prinzhorn, Inv. 1</dc:title><dc:identifier>https://digi.ub.uni-heidelberg.de/diglit/p1</dc:identifier><dc:type>Manuscript</dc:type>`)), null);
  // tutti i manoscritti, di ogni lingua (anche i papiri)
  assert.deepEqual(estraiHeidelberg(rec(`<dc:title>Heidelberg, UB, Cod. Pal. germ. 1: X</dc:title><dc:identifier>https://digi.ub.uni-heidelberg.de/diglit/cpg1</dc:identifier><dc:language>de</dc:language><dc:type>Manuscript</dc:type>`)).lingue, ["de"]);
  assert.equal(estraiHeidelberg(rec(`<dc:title>Heidelberger Papyrussammlung, P. Heid. Inv. G. 1</dc:title><dc:identifier>https://digi.ub.uni-heidelberg.de/diglit/p1</dc:identifier><dc:language>grc</dc:language><dc:type>Manuscript</dc:type>`)).lingue[0], "grc");
  assert.deepEqual(h.lingue, []);

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
  assert.deepEqual(b.lingue, ["la"]);
  // anche i fondi non latini (Cod.icon., Cgm, Cod.graec. ...)
  assert.equal(estraiBsb(rec(`<dc:title>Wappenbuch - BSB Cod.icon. 308</dc:title><dc:identifier>urn:nbn:de:bvb:12-bsb00000001-1</dc:identifier><dc:description>Exemplar mit der Signatur: München, Bayerische Staatsbibliothek -- Cod.icon. 308</dc:description>`)).segnatura, "Cod.icon. 308");
});

test("Vaticana: metadati dall'inizio del manifesto e segnature leggibili", () => {
  const inizio = `{ "@context" : "x", "@id" : "https://digi.vatlib.it/iiif/MSS_Pal.lat.1615/manifest.json", "@type" : "sc:Manifest",
    "metadata" : [ { "label" : "Shelfmark", "value" : "Pal.lat.1615" }, { "label" : "Author", "value" : [ "Plautus, Titus Maccius" ] },
    { "label" : "Title", "value" : [ "Comoediae" ] }, { "label" : "Date", "value" : [ "10.-11. Jh." ] } ], "label" : "Pal.lat.1615", "sequences" : [ { "@type" : "sc:Seq`;
  assert.deepEqual(metadatiDaInizio(inizio), { a: ["Plautus, Titus Maccius"], t: ["Comoediae"], d: "10.-11. Jh.", l: "Pal.lat.1615", g: [] });
  assert.equal(segnaturaLeggibile("Vat.lat.3870"), "Vat. lat. 3870");
  const r = recordVaticana({ voci: { "Vat.lat.3870": { a: ["Plautus, Titus Maccius, m. 184 a.C."], t: ["Comoediae"], d: "sec. XI?" } } })[0];
  assert.equal(r.id, "bav-vat-lat-3870"); assert.equal(r.manifest, "https://digi.vatlib.it/iiif/MSS_Vat.lat.3870/manifest.json"); assert.equal(r.segnatura, "Vat. lat. 3870");
  assert.deepEqual(voce(r, A).lingue, ["la"]); assert.equal(voce(r, A).lingua_dedotta, true);
  // anche i codici senza autore né titolo, e i fondi greci
  const [g] = recordVaticana({ voci: { "Vat.gr.1": { a: [], t: [], d: null } } });
  assert.equal(g.id, "bav-vat-gr-1"); assert.equal(g.segnatura, "Vat. gr. 1"); assert.deepEqual(voce(g, A).lingue, ["grc"]);
});

test("Vaticana: elenco dei digitalizzati (fondi, segnature, ordine, codici da leggere)", () => {
  const html = `<div class="item-thumbnail-list-header"><span><strong>2</strong>ITEMS</span><h2><a href="/mss/Autogr.Paolo.VI"
       data-item-url="/mss/ajax/category/Autogr.Paolo.VI">x</a></h2></div><div class="item-thumbnail-list-header"><span><strong>10388</strong>ITEMS</span><h2><a href="/mss/Vat.lat"
       data-item-url="/mss/ajax/category/Vat.lat">Vat.lat.</a></h2></div><div class="item-thumbnail-list-header"><span><strong>1</strong>ITEM</span><h2><a href="/mss/Carte.d&#39;Abbadie"
       data-item-url="/mss/ajax/category/Carte.d&#39;Abbadie">x</a></h2></div>`;
  assert.deepEqual(fondiDaHome(html), { "Autogr.Paolo.VI": 2, "Vat.lat": 10388, "Carte.d'Abbadie": 1 });
  assert.deepEqual(segnatureDaFondo(`{"fond":[{"path":"digit/MSS_Vat.lat.1/cover/cover.jpg","shelfmark":"Vat.lat.1","limited":false},{"shelfmark":"Vat.lat.414.pt.1","limited":true}]}`),
    ["Vat.lat.1", "Vat.lat.414.pt.1"]);
  assert.deepEqual(ordineFondi(["Chig", "Vat.gr", "Borgh", "Vat.lat", "Pal.lat"]), ["Pal.lat", "Vat.lat", "Chig", "Vat.gr", "Borgh"]);
  assert.equal(segnaturaLeggibile("Vat.lat.414.pt.1"), "Vat. lat. 414 pt. 1");
  const ora = Date.now();
  const st = { voci: { "Vat.lat.1": {} }, mancanti: { "Vat.lat.3": ora, "Vat.lat.4": ora - 40 * 864e5 },
    elenco: { fondi: { "Vat.gr": { n: 3, s: ["1", "2"] }, "Vat.lat": { n: 5, s: ["1", "2", "3", "4", "414.pt.1"] }, Borgh: { n: 7 } } } };
  const d = daLeggere(st, ora);
  // letti e mancanti recenti si saltano; quelli mancanti da più di 30 giorni si riprovano; fondi senza elenco contano col numero della pagina
  assert.deepEqual(d.segnature, ["Vat.lat.2", "Vat.lat.4", "Vat.lat.414.pt.1", "Vat.gr.1", "Vat.gr.2"]);
  assert.equal(d.totale, 5 + 7);
});

test("voci del catalogo: tutti i codici, autori riconosciuti come informazione in più, i tre del Truculentus", () => {
  const v = voce({ fonte: "bsb", id: "bsb-x", segnatura: "Clm 1", titolo: "Breviarium", datazione: "12. Jh.", autori_fonte: [], manifest: "https://x/m" }, A);
  assert.deepEqual(v.autori, []); assert.deepEqual(v.lingue, ["la"]); assert.deepEqual(v.secolo, [12, 12]);
  assert.equal(voce({ fonte: "bsb", id: "bsb-y", segnatura: "Clm 2" }, A), null);   // senza manifesto non serve
  for (const t of TRUCULENTUS) { const x = voce(t, A); assert.ok(x, t.id); assert.equal(x.truculentus, t.sigla); assert.deepEqual(x.autori.map(a => a.id), ["plauto"]); }
});

test("catalogo diviso per fonte: indice leggero, voci per hash dell'id, compatibilità", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "catalogo-"));
  const vs = [];
  for (let i = 0; i < 1700; i++) vs.push(voce({ fonte: "heidelberg", id: "hd-cpl" + i, segnatura: "Cod. Pal. lat. " + i, citta: "Heidelberg", biblioteca: "Universitätsbibliothek Heidelberg",
    titolo: i % 2 ? "Vergilius, Aeneis" : "Breviarium", datazione: "10. Jh.", manifest: "https://x/" + i, lingue: ["la"] }, A));
  vs.push(voce({ fonte: "vaticana", id: "bav-vat-gr-1", segnatura: "Vat. gr. 1", biblioteca: "Biblioteca Apostolica Vaticana", citta: "Città del Vaticano", titolo: "Ὁμήρου Ἰλιάς", manifest: "https://y/1", lingue: ["grc"] }, A));
  const ris = scriviCatalogo(vs, { fonti: ["heidelberg", "vaticana"], dir, compat: path.join(dir, "manoscritti.json"), autori: A });
  assert.deepEqual(ris.conteggio, { heidelberg: 1700, vaticana: 1 }); assert.deepEqual(ris.conAutori, { heidelberg: 850, vaticana: 1 });
  const ind = JSON.parse(fs.readFileSync(path.join(dir, "indice.json"), "utf8"));
  assert.equal(ind.totale, 1701); assert.equal(ind.fonti.heidelberg.pezzi_voci, 3); assert.deepEqual(ind.campi, CAMPI); assert.deepEqual(ind.fonti.heidelberg.prefissi, ["hd-"]);
  assert.equal(ind.lingue.la.codici, 1700); assert.equal(ind.lingue.grc.nome, "greco"); assert.equal(ind.categorie["classico-greco"].codici, 1); assert.equal(ind.autori.omero.codici, 1);
  // ogni voce si trova nel pezzo che dice l'hash del suo id
  for (const id of ["hd-cpl7", "hd-cpl1699", "bav-vat-gr-1"]) {
    const f = id.startsWith("hd-") ? "heidelberg" : "vaticana", k = pezzoDi(id, ind.fonti[f].pezzi_voci);
    const p = JSON.parse(fs.readFileSync(path.join(dir, `voci/${f}-${k}.json`), "utf8"));
    assert.ok(p.manoscritti.some(m => m.id === id), id);
  }
  const righe = JSON.parse(fs.readFileSync(path.join(dir, "indice/vaticana-0.json"), "utf8")).righe;
  assert.deepEqual(righe[0].slice(0, 7), ["bav-vat-gr-1", "Vat. gr. 1", ind.biblioteche.indexOf("Biblioteca Apostolica Vaticana, Città del Vaticano"), "grc", 0, 0, "omero"]);
  assert.equal(fnv1a("hd-cpl894"), fnv1a("hd-cpl894")); assert.equal(typeof fnv1a("x"), "number");
  // compatibilità: solo i codici con autori classici
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "manoscritti.json"), "utf8")).manoscritti.length, 851);
  // ricostruzione dalle voci precedenti, poi una seconda scrittura identica non cambia nulla
  assert.equal(catalogoPrecedente(dir, path.join(dir, "manoscritti.json")).length, 1701);
  assert.equal(scriviCatalogo(vs, { fonti: ["heidelberg", "vaticana"], dir, compat: path.join(dir, "manoscritti.json"), autori: A }).cambiato, false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("catalogo pubblicato: i codici dei link condivisi si trovano dall'id", () => {
  const ind = JSON.parse(fs.readFileSync("data/catalogo/indice.json", "utf8"));
  assert.ok(ind.totale > 3000);
  const fonteDi = id => Object.entries(ind.fonti).find(([, f]) => f.prefissi.some(p => id.startsWith(p)))[0];
  for (const [id, seg] of [["bav-pal-lat-1615", "Pal. lat. 1615"], ["hd-cpl1613", "Cod. Pal. lat. 1613"], ["bav-vat-lat-3870", "Vat. lat. 3870"], ["hd-cpl894", "Cod. Pal. lat. 894"]]) {
    const f = fonteDi(id), k = pezzoDi(id, ind.fonti[f].pezzi_voci);
    const m = JSON.parse(fs.readFileSync(`data/catalogo/voci/${f}-${k}.json`, "utf8")).manoscritti.find(x => x.id === id);
    assert.ok(m, id); assert.equal(m.segnatura, seg);
  }
  const c = JSON.parse(fs.readFileSync("data/manoscritti.json", "utf8"));
  for (const seg of ["Pal. lat. 1615", "Vat. lat. 3870", "Cod. Pal. lat. 1613"]) assert.ok(c.manoscritti.some(m => m.segnatura === seg && m.autori.some(a => a.id === "plauto")), seg);
  assert.ok(c.manoscritti.every(m => m.autori.length && m.manifest && m.id && m.segnatura));
  assert.equal(new Set(c.manoscritti.map(m => m.id)).size, c.manoscritti.length);
});

test("Gallica: segnature di tutti i fondi e record SRU", async () => {
  assert.equal(segnaturaGallica(["Bibliothèque nationale de France. Département des Manuscrits. Latin 7899"]), "Latin 7899");
  assert.equal(segnaturaGallica(["Bibliothèque nationale de France. Département des Manuscrits. Nouvelle acquisition latine 1132"]), "Nouvelle acquisition latine 1132");
  assert.equal(segnaturaGallica(["Bibliothèque nationale de France. Département des Manuscrits. Français 2"]), "Français 2");
  assert.equal(segnaturaGallica(["Bibliothèque nationale de France. Département des Manuscrits. Grec 2934"]), "Grec 2934");
  const g = estraiGallica(`<srw:record><dc:title>Terentii comoediae</dc:title><dc:creator>Térence (0190?-0159 av. J.-C.). Auteur du texte</dc:creator><dc:date>0801-0900</dc:date>
    <dc:type>manuscrit</dc:type><dc:language>lat</dc:language><dc:identifier>https://gallica.bnf.fr/ark:/12148/btv1b8422924h</dc:identifier>
    <dc:source>Bibliothèque nationale de France. Département des Manuscrits. Latin 7899</dc:source><dc:rights>domaine public</dc:rights></srw:record>`);
  assert.equal(g.id, "bnf-btv1b8422924h"); assert.equal(g.segnatura, "Latin 7899"); assert.equal(g.manifest, "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8422924h/manifest.json");
  assert.deepEqual(voce(g, A).autori.map(a => a.id), ["terenzio"]); assert.deepEqual(g.lingue, ["la"]);
  // scheda compatta della raccolta dal browser (formato 2)
  const { recordGallica, luogoGallica } = await import("../scripts/fonti/gallica.mjs");
  const b = recordGallica({ k: "btv1b10500001g", y: ["manuscrit"], t: "Homeri Ilias", c: [], d: "1201-1300", s: ["Bibliothèque nationale de France. Département des Manuscrits. Grec 2766"], l: ["grc"], x: "", r: "domaine public" });
  assert.equal(b.id, "bnf-btv1b10500001g"); assert.equal(b.segnatura, "Grec 2766"); assert.deepEqual(b.lingue, ["grc"]); assert.deepEqual(voce(b, A).autori.map(a => a.id), ["omero"]);
  assert.deepEqual(luogoGallica(["Bibliothèque municipale de Tours, Ms. 924"]), { biblioteca: "Bibliothèque municipale de Tours", citta: "Tours", segnatura: "Ms. 924" });
  assert.equal(recordGallica({ k: "x", y: ["monographie imprimée"], s: ["Latin 1"] }), null);
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
  assert.deepEqual(voce(r, A).autori, []);
  const [ri] = conIndici([r], { voci: { cpl1: ["Vergil: Aeneis", "Hymni"] } });
  const v = voce(ri, A);
  assert.deepEqual(v.autori.map(a => a.id), ["virgilio"]); assert.match(v.autori[0].corrispondenza, /^indice: /);
  // nell'indice servono nome e opera; omonimi e spuri non contano
  assert.deepEqual(voce(conIndici([r], { voci: { cpl1: ["Donatus ep. et Hilarianus mon.", "Iuvenalis episcopus, Epistolae"] } })[0], A).autori, []);
  assert.deepEqual(ids(ric("Ps.-Ausonius, Septem sapientum sententiae ; Pseudo-Boethius, De disciplina scolarium")), []);
  // un commento non è l'autore
  assert.deepEqual(voce(conIndici([r], { voci: { cpl1: ["Glosae super Boethium", "Sermones"] } })[0], A).autori, []);
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
  // Plutarco ora è riconosciuto (autori greci); la Vita di Alcibiade dell'Acciaiuoli «ex Plutarcho» no
  assert.deepEqual(ids(ric("Plutarchi Vitae quaedam, et Leonardi Arretini Cicero Novus")), ["plutarco"]);
  for (const t of ["Donati Acciaioli Vita Alcibiadis ex Plutarcho", "Baccii Baldini Oratio de clementia",
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
  assert.deepEqual(voce(r2, A).autori.map(a => a.id), ["alcuino"]);   // «Wulfinus Boethius» non è Boezio; Alcuino sì
  assert.deepEqual(voce(r2, A).lingue, ["la"]);   // «(Latin)» nel titolo
});

test("Berlino: record OAI con la segnatura in coda al titolo", async () => {
  const { estraiBerlino } = await import("../scripts/fonti/oai.mjs");
  const rec = `<record><header><identifier>oai:digital.staatsbibliothek-berlin.de:PPN1002517877</identifier></header><metadata><oai_dc:dc>
    <dc:title>Carmina; Ms. Diez. B Sant. 37</dc:title><dc:creator>C. Valerius Catullus</dc:creator><dc:type>manuscript</dc:type><dc:type>text</dc:type>
    <dc:identifier>PPN1002517877</dc:identifier><dc:language>lat</dc:language><dc:date>1463</dc:date><dc:rights>Public Domain Mark 1.0</dc:rights></oai_dc:dc></metadata></record>`;
  const r = estraiBerlino(rec);
  assert.equal(r.segnatura, "Ms. Diez. B Sant. 37"); assert.equal(r.titolo, "Carmina");
  assert.equal(r.manifest, "https://content.staatsbibliothek-berlin.de/dc/PPN1002517877/manifest");
  assert.equal(r.licenza, "Public Domain Mark 1.0");
  assert.deepEqual(voce(r, A).autori.map(a => a.id), ["catullo"]);
  assert.deepEqual(estraiBerlino(rec.replace("<dc:language>lat</dc:language>", "<dc:language>ger</dc:language>")).lingue, ["de"]);
  assert.equal(estraiBerlino(rec.replace(/<dc:type>manuscript<\/dc:type>/, "<dc:type>monograph</dc:type>")), null);
});

test("Wolfenbüttel: oggetti del Handschriftenportal e manifesti della HAB", async () => {
  const { compattaHsp, manifestoDa, recordHsp } = await import("../scripts/fonti/hsp.mjs");
  assert.equal(manifestoDa({ "external-url-display": "https://diglib.hab.de/mss/70-gud-lat/start.htm" }), "https://iiif.hab.de/object/mss_70-gud-lat/manifest.json");
  assert.equal(manifestoDa({ "external-url-display": "https://diglib.hab.de/drucke/71-4-theol/start.htm" }), null);
  const ogg = (id, seg, tit, url) => ({ hspObject: { id, "idno-display": seg, "title-display": tit, "orig-date-lang-display": ["9. Jh."], "settlement-display": "Wolfenbüttel",
    "repository-display": "Herzog August Bibliothek Wolfenbüttel" }, hspDescriptions: [{ "title-display": tit }], hspDigitizeds: [{ "external-url-display": url }] });
  const v = compattaHsp(ogg("HSP-1", "Cod. Guelf. 70 Gud. lat.", "Vergilius, Opera. Vitae Gudianae", "https://diglib.hab.de/mss/70-gud-lat/start.htm"));
  assert.deepEqual(v, { s: "Cod. Guelf. 70 Gud. lat.", t: "Vergilius, Opera. Vitae Gudianae", d: "9. Jh.", l: "Wolfenbüttel", c: "Herzog August Bibliothek Wolfenbüttel",
    m: "https://iiif.hab.de/object/mss_70-gud-lat/manifest.json", p: "https://diglib.hab.de/mss/70-gud-lat/start.htm" });
  const w = compattaHsp(ogg("HSP-2", "Cod. Guelf. 404.9 Novi (4)", "Heinrich von Veldeke: Eneide (Fragm.)", "https://diglib.hab.de/mss/404-9-novi-4/start.htm"));
  const [r1, r2] = recordHsp("wolfenbuettel", { voci: { "HSP-1": v, "HSP-2": w } });
  assert.deepEqual(voce(r1, A).autori.map(a => a.id), ["virgilio"]);
  assert.deepEqual(voce(r2, A).autori, []);   // l'Eneide di Veldeke non è Virgilio
});

test("Handschriftenportal: una fonte per biblioteca, prefissi distinti, un manifesto una volta sola", async () => {
  const { FONTI_HSP, prefissoHsp, recordHsp } = await import("../scripts/fonti/hsp.mjs");
  const pref = Object.keys(FONTI_HSP).map(prefissoHsp);
  assert.equal(new Set(pref).size, pref.length);
  assert.equal(prefissoHsp("wolfenbuettel"), "wol");   // gli id già pubblicati di Wolfenbüttel non cambiano
  for (const h of Object.values(FONTI_HSP)) assert.ok(h.biblioteca && h.citta && h.nome);
  const m = "https://digital.blb-karlsruhe.de/i3f/v20/1465690/manifest";
  const v = { s: "Cod. Donaueschingen A III 48", t: null, d: "15. Jh.", l: "Karlsruhe", c: "Badische Landesbibliothek", m, p: null };
  const rs = recordHsp("karlsruhe", { voci: { "HSP-b": v, "HSP-a": { ...v, s: "Cod. Donaueschingen A III 48 (Fragm.)" }, "HSP-c": { ...v, m: m.replace("1465690", "1") } } });
  assert.deepEqual(rs.map(r => r.id), ["blb-a", "blb-c"]);
  assert.equal(rs[0].fonte, "karlsruhe"); assert.equal(rs[0].manifest, m);
  assert.equal(recordHsp("colonia", { voci: { "HSP-x": { ...v, c: "Dombibliothek" } } })[0].id, "ceec-x");
  // lingua dichiarata dal portale (campo g dello stato), altrimenti dedotta
  const [l1] = recordHsp("lipsia", { voci: { "HSP-y": { ...v, g: ["grc"] } } });
  assert.deepEqual(voce(l1, A).lingue, ["grc"]); assert.equal(voce(l1, A).lingua_dedotta, false);
  const { LINGUE_HSP, metadatiManifesto } = await import("../scripts/fonti/hsp.mjs");
  // Colonia: metadati in fondo al manifesto
  const man = JSON.stringify({ label: "x", sequences: [{ canvases: [] }], metadata: [{ label: "Titel", value: "Eusebius Caesariensis:  Historia ecclesiastica (Köln, Erzbischöfliche Diözesan- und Dombibliothek, Cod. 1030)" },
    { label: "Verfasser", value: "Eusebius Caesariensis translat. Rufino Tyrannio [Aquileiensi]" }, { label: "Entstehung", value: "15. Jh." }] });
  const md = metadatiManifesto(man);
  assert.deepEqual(md, { t: "Eusebius Caesariensis: Historia ecclesiastica", a: ["Eusebius Caesariensis translat. Rufino Tyrannio [Aquileiensi]"], d: "15. Jh." });
  const [k1] = recordHsp("colonia", { voci: { "HSP-k": { s: "Cod. 1030", t: null, d: null, l: "Köln", c: "Dombibliothek", m, p: null, x: 1, tm: md.t, a: md.a, dm: md.d } } });
  assert.equal(k1.titolo, md.t); assert.equal(k1.datazione, "15. Jh."); assert.deepEqual(k1.autori_fonte, md.a);
  assert.ok(Object.values(LINGUE_HSP).includes("la") && Object.values(LINGUE_HSP).includes("grc"));
});
