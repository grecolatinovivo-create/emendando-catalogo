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

test("Leida: filtro dei manoscritti librari (fuori schede BNM, lettere, archivi, carte dopo il 1800, parti doppie)", async () => {
  const { motivoLeiden, contestoLeiden, segnaturaVoce, dataCristiana, recordLeiden } = await import("../scripts/fonti/leiden.mjs");
  // voci vere dello stato di Leida
  const voci = {
    1520736: { s: "VLQ 5", t: "Chronica / Fredegar", a: "Fredegarius", d: "German regions, southern part ; Bodensee region, 8th/9th century" },
    1606764: { s: "BPG 109", t: "Fabulae Aesopeae (Greek) / Babrius, and other text(s)", a: "Babrius., Hesiod.", d: "Middle East ; Syria ; Palmyra, 3rd century, before 273" },
    3445669: { s: "LTK 187", t: "Fragment (Dutch): Der leken spiegel / Jan van Boendale", a: null, d: "Low Countries, 14th century, second half" },
    274332: { s: "BPL 917", t: "De Iure praedae Commentarius", a: "Groot, Hugo de", d: "[Netherlands], [1604-1605]" },
    2691167: { s: "Or. 433", t: "Fil-Quwa al-Tabi`iyya Or. 433", a: null, d: "572 H [1176/1177]" },
    3521434: { s: null, t: "aṣ-Ṣaḥāḥ al-‘Ajamīya - Or. 863", a: null, d: null },
    3311028: { s: null, t: "Raiḥānat al-Kuttāb wa-Nuǵʿat al-Muntāb - Or. 11: 1", a: null, d: null },
    2705133: { s: "Or. 14", t: "Collective volume with texts in Arabic and Persian (1-26) : Translation of the Conica by Apollonius of Pergae (Books 5-7) ; and other texts Or. 14", a: null, d: null },
    // fuori
    1905186: { s: "BNM 753", t: "Wenen, Universitätsbibliothek — Hss./Varia", a: null, d: null },
    3326750: { s: null, t: "Qismat al-Khaṭṭ allaḏī 'staʿmalahā Arśīmīdis fī'l-Maqāla at̲-T̲āniya fī 'l-Kura wa'l-Usṭuwāna - Or. 14: 26", a: null, d: null },
    376879: { s: "PAP 1 B", t: "Brieven van Christina (1626-1689) aan Samuel Bochart (1599-1667) PAP 1 B", a: "Christina", d: "Stockholm, 1650" },
    3273821: { s: "Ser. 63", t: "Hollandsch en Japansch woordenboek Ser. 63", a: null, d: "[S.l.] : [s.n.], [c. 1820]" },
    361341: { s: "BPL 1185", t: "Uitvoerig Rapport van S. Scotte en J. Campe, gecommitteerden wegens Zeeland nopens de Dordrechtse Synode", a: null, d: "[Date unknown]" },
    2032598: { s: "BPL 1886", t: "BPL 1886", a: null, d: "Rotterdam, 9 februari 1678" },
    1576996: { s: "Ser. 93", t: "Ezogashima gengo Ser. 93", a: "Mogami, Tokunai, Siebold, Philipp Franz von", d: "[ca. 1827-1829]" },
    2042852: { s: "Or. 3306", t: "[Collective volume with texts in Malay", a: null, d: "Barus : Van der Tuuk, 1269 H. [1853]" },
    1525512: { s: "D Or. 786", t: "D Or. 786", a: null, d: "1972-1974" },
  };
  const ctx = contestoLeiden(voci);
  for (const id of [1520736, 1606764, 3445669, 274332, 2691167, 3521434, 3311028, 2705133]) assert.equal(motivoLeiden(voci[id], ctx), null, id + " " + voci[id].t);
  for (const id of [1905186, 3326750, 376879, 3273821, 361341, 2032598, 1576996, 2042852, 1525512]) assert.ok(motivoLeiden(voci[id], ctx), id + " " + voci[id].t);
  assert.deepEqual(segnaturaVoce(voci[3521434]), { seg: "Or. 863", base: "Or. 863", parte: false });
  assert.equal(segnaturaVoce(voci[3326750]).base, "Or. 14");
  assert.equal(dataCristiana("1245 H. [1829]"), "[1829]");
  const r = recordLeiden({ voci });
  assert.equal(r.length, 8);
  assert.equal(r.find(x => x.id === "lei-3521434").segnatura, "Or. 863");
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

test("Yale: record OAI MODS, solo manoscritti fino al 1800, manifesti dall'identificativo", async () => {
  const { estraiYale, recordYale, primoAnno } = await import("../scripts/fonti/yale.mjs");
  const rec = (oid, { genere = "Manuscripts", seg = "Beinecke MS 712.3", data = "[Early 9th century]", editore = "", titolo = "[Lectionary]", nome = "Catholic Church", lingua = "Latin" } = {}) =>
    `<record><header><identifier>oai:collections.library.yale.edu:${oid}</identifier><datestamp>2023-02-20T18:03:48Z</datestamp></header><metadata><mods xmlns:mods="http://www.loc.gov/mods/v3">
  <mods:genre>${genere}</mods:genre><mods:note>On parchment.</mods:note><mods:classification>${seg}</mods:classification>
  <mods:note type="preferred citation">Beinecke Rare Book and Manuscript Library</mods:note><mods:typeOfResource>text</mods:typeOfResource>
  <mods:language><mods:languageTerm type="text">${lingua}</mods:languageTerm></mods:language><mods:name><mods:namePart>${nome}</mods:namePart></mods:name>
  <mods:titleInfo><mods:title>${titolo}</mods:title></mods:titleInfo><mods:originInfo>${editore ? `<mods:publisher>${editore}</mods:publisher>` : ""}<mods:dateCreated>${data}</mods:dateCreated></mods:originInfo>
  <mods:location><mods:url access="preview" xlink:href="https://collections.library.yale.edu/iiif/2/1002430/full/!200,200/0/default.jpg"/></mods:location></mods></metadata></record>`;
  const x = estraiYale(rec(10269751));
  assert.equal(x.oid, "10269751");
  assert.deepEqual(x.v, { s: "Beinecke MS 712.3", t: "[Lectionary]", a: ["Catholic Church"], l: ["Latin"], d: "[Early 9th century]", b: "Beinecke Rare Book and Manuscript Library", g: ["Manuscripts"], p: "1002430" });
  assert.equal(estraiYale(rec(1, { genere: "Engravings", seg: "1977 Folio 130", editore: "typis Godefridi Kempensis" })).v, null);   // libro a stampa
  assert.equal(estraiYale(rec(2, { genere: "Typescripts", seg: "YCAL MSS 43", data: "1868-1976" })).v, null);   // carte moderne
  assert.equal(estraiYale(rec(3, { genere: "Papyri", seg: "P.CtYBR inv. 69" })).v, null);   // papiri: in attesa di decisione
  assert.equal(estraiYale(rec(4).replace("<header>", '<header status="deleted">')).v, null);
  assert.equal(primoAnno("176-?]"), 1760); assert.equal(primoAnno("[Early 9th century]"), 801); assert.equal(primoAnno("anno M.cccccvij [15 Mar. 1507]"), 1507);
  const v = estraiYale(rec(5, { seg: "Beinecke MS 233", titolo: "Bucolica, Georgica, Aeneis", nome: "Virgil", data: "[ca. 1460]" })).v;
  const [r] = recordYale({ voci: { 5: v } });
  assert.equal(r.manifest, "https://collections.library.yale.edu/manifests/5");
  assert.equal(r.pagina, "https://collections.library.yale.edu/catalog/5");
  assert.equal(r.biblioteca, "Beinecke Rare Book and Manuscript Library");
  assert.deepEqual(voce(r, A).lingue, ["la"]);
  assert.deepEqual(voce(r, A).autori.map(a => a.id), ["virgilio"]);
});

test("Yale: filtro dei manoscritti librari (fuori archivi, lettere, fotografie e carte dopo il 1800)", async () => {
  const { motivoYale, ammessaYale, anniDa, primoAnno } = await import("../scripts/fonti/yale.mjs");
  assert.equal(primoAnno("[14--]"), 1400); assert.equal(primoAnno("s. XV"), 1401); assert.equal(primoAnno("[before 1395]"), 1395);
  assert.equal(primoAnno("2000 August"), 2000); assert.equal(primoAnno("c1980."), 1980); assert.equal(primoAnno("[mid-19th cent.]"), 1801);
  assert.deepEqual([Math.min(...anniDa("1450-1500")), Math.max(...anniDa("1450-1500"))], [1450, 1500]);
  // voci vere dello stato di Yale: tenute
  const tenute = [
    { s: "Beinecke MS 1207 1", t: "Commentaria super quarto libro Sententiarum Petri Lombardi", d: "[between 1300 and 1350]", g: ["Early works to 1800", "Manuscripts, Medieval Italy 13th century"] },
    { s: "Marston MS 67 1", t: "Grammatica minor", d: "[between 1175 and 1200]", g: ["Manuscripts, Medieval France 12th century"] },
    { s: "Takamiya MS 32 1", t: "Canterbury tales", d: "[ca. 1425-1450]", g: [] },
    { s: "Beinecke MS 482.125", t: "Hymnal (fragment).", d: "[14--].", g: ["Manuscripts, Medieval Germany 15th century"] },
    { s: "Arabic MSS 430 1", t: "al-Qurʼān. -- 1261 or 1262", d: null, g: ["Manuscripts, Arabic 13th century"] },
    { s: "Landberg MSS 2 1", t: "Kitāb minhāj al-sunnah al-Nabawīyah", d: null, g: ["Manuscripts", "Marginalia"] },
    { s: "Osborn b106 1", t: "[Commonplace book], [1599-1608].", d: null, g: ["Commonplace books", "Manuscripts"] },
    { s: "Zi +5140", t: "Psalter (fragment).", d: "[unidentified date]", g: ["Manuscripts, Medieval", "Medieval and Renaissance Manuscript Fragments in Beinecke Library"] },
    { s: "Manuscript 10 Vault", t: "Cirurgia magistri Rogerii. Chirurgia Salernitana \"Bamberg\".", d: "between 1150 and 1199.", g: ["Early works to 1800"] },
    { s: "Beinecke MS 909 1", t: "Latin letters", d: "[ca. 1450]", g: ["Manuscripts, Medieval Italy 15th century"] },
  ];
  for (const v of tenute) assert.equal(motivoYale(v), null, v.s + " " + v.t);
  // scartate
  const scartate = [
    { s: "WA MSS S-2957", t: "Roof Detail, Corn Crib and Barn on Farm Belonging to John Pihl", d: "2000 August", g: [] },
    { s: "YCAL MSS 152", t: "Recipe from Marianne Moore: Beaten egg and oil dressing", d: "n.d.", g: [] },
    { s: "GEN MSS 310", t: "4 ALS to William Johnston Temple", d: "1767-87", g: [] },
    { s: "OSB MSS FILE", t: "ALS to Edmund Burke. London.", d: "1796 Dec 2", g: [] },
    { s: "JWJ MSS 54", t: "Unknown photographer Half-length portrait, seated lady with lace collar", d: "circa1860", g: [] },
    { s: "LWL MSS 33", t: "Act 4, scene 2 / Stodhart [i.e., Stothard] delt.; A. Smith sculpt.", d: "1795 June 1", g: [] },
    { s: "MS 1776", t: "Libro 1", d: "1529-1907", g: [] },
    { s: "OSB MSS 176", t: "2. Diary", d: "1751", g: [] },
    { s: "Osborn c467", t: "Norton Nicholls to Jane Floyer Nicholls. Eton. Concerns Eton College", d: "1759 Nov 27", g: [] },
    { s: "Tibet MSS 62", t: "Tanka of Gautama Buddha", d: "circa 1700-circa 1800", g: [] },
    { s: "Beinecke MS 1042.4", t: "Léopold Delisle letters to Count Ernest Armand, 1879", d: null, g: [] },
    { s: "Folio S1 40", t: "Vollständige Faksimile-Ausgabe im Originalformat von Codex Vaticanus", d: "c1980.", g: ["Facsimiles (Reproductions)", "Manuscripts"] },
    { s: "Japanese Mss D25", t: "Sukekatsu-kyō ki, [19th cent.?] / Hino Sukekatsu cho.", d: null, g: ["Manuscripts"] },
    { s: "Ms Coll 6", t: "Manuscript in Chinese", d: "n.d.", g: [] },
  ];
  for (const v of scartate) assert.ok(!ammessaYale(v), v.s + " " + v.t);
});

test("Penn: ricerca di Colenda, segnature, filtri e manifesti del repository digitale", async () => {
  const { compattaPenn, dividiPenn, recordPenn, licenzaPenn } = await import("../scripts/fonti/penn.mjs");
  const doc = (id, o = {}) => ({ id, uuid_ssi: "3d747a38-9cdb-403d-a2db-abcd703fbf57", iiif_manifest_path_ss: "3d747a38-9cdb-403d-a2db-abcd703fbf57/iiif_manifest",
    title_ssim: ["[Glossed psalter]"], date_ssim: ["1100"], year_ssim: ["1100"], language_ssim: ["Latin"], item_type_ssim: ["Text"],
    physical_format_ssim: ["manuscripts (documents)", "codices (bound manuscripts)", "Manuscripts, Medieval"],
    physical_location_ssim: ["Kislak Center for Special Collections, Rare Books and Manuscripts, Manuscripts, Ms. Codex 1058"],
    rights_ssim: ["http://rightsstatements.org/vocab/NoC-US/1.0/"], description_tesim: ["The Book of Psalms with glosses."], note_tesim: ["Ms. codex.", "Origin: Laon, circa 1100."], ...o });
  const v = compattaPenn(doc("81431-p3bz6179x"));
  assert.equal(v.u, "3d747a38-9cdb-403d-a2db-abcd703fbf57"); assert.equal(v.s, "Kislak Center for Special Collections, Rare Books and Manuscripts, Manuscripts, Ms. Codex 1058");
  assert.equal(v.c, "The Book of Psalms with glosses. ; Origin: Laon, circa 1100.");
  assert.equal(compattaPenn(doc("x1", { year_ssim: ["1911"], physical_format_ssim: ["manuscripts (documents)"] })), null);   // carte moderne
  assert.equal(compattaPenn(doc("x2", { year_ssim: ["1772"], physical_format_ssim: ["manuscripts (documents)", "letters (correspondence)"] })), null);   // lettere
  assert.equal(compattaPenn(doc("x3", { item_type_ssim: ["Still Image"] })), null);
  assert.ok(compattaPenn(doc("x4", { year_ssim: ["1615/1797"] })));
  assert.deepEqual(dividiPenn("Kislak Center for Special Collections, Rare Books and Manuscripts, Manuscripts, Ms. Coll. 788 Folders 161-288, 527-529"),
    { biblioteca: "University of Pennsylvania Libraries, Kislak Center", segnatura: "Ms. Coll. 788 Folders 161-288, 527-529" });
  assert.deepEqual(dividiPenn("Library at the Katz Center, Rare Book Manuscripts, CAJS Rar Ms 87"), { biblioteca: "University of Pennsylvania, Library at the Katz Center (CAJS)", segnatura: "CAJS Rar Ms 87" });
  assert.equal(licenzaPenn("http://rightsstatements.org/vocab/NoC-US/1.0/"), "No Copyright - United States (rightsstatements.org)");
  const [r] = recordPenn({ voci: { "81431-p3bz6179x": v } });
  assert.equal(r.id, "upenn-p3bz6179x"); assert.equal(r.segnatura, "Ms. Codex 1058");
  assert.equal(r.manifest, "https://digitalrepository.library.upenn.edu/iiif/2/items/3d747a38-9cdb-403d-a2db-abcd703fbf57/manifest");
  assert.deepEqual(voce(r, A).lingue, ["la"]); assert.deepEqual(voce(r, A).secolo, [11, 11]);
});

test("Digital Scriptorium: elenco, SPARQL, biblioteca vera, doppioni di Penn e domini da verificare", async () => {
  const { rigaElenco, unisciDs, daPagina, recordDs, esistentiDa, manifestoDs, ammesso, DOMINI_CONFERMATI } = await import("../scripts/fonti/ds.mjs");
  const riga = rigaElenco({ id: "DS10399", attributes: { title: "Harvard University, MS Lat 441.2", title_facet: { attributes: { value: "Book of Esther" } }, date_meta: { attributes: { value: "circa 1240." } } } });
  assert.deepEqual(riga, { e: "Harvard University, MS Lat 441.2", t: "Book of Esther", d: "circa 1240.", p: null });
  const righe = {
    base: [{ ds: "DS10399", m: "https://nrs.lib.harvard.edu/URN-3:FHCL.HOUGH:34902812:MANIFEST:2", ist: "Harvard University", seg: "MS Lat 441.2", link: "https://id.lib.harvard.edu/alma/990145774860203941/catalog" },
      { ds: "DS1", m: "https://digitalrepository.library.upenn.edu/iiif/2/items/aaa/manifest", ist: "University of Pennsylvania", seg: "Ms. Codex 1" },
      { ds: "DS2", m: "https://preserve.lehigh.edu/node/1/book-manifest", ist: "Lehigh University", seg: "Codex 2" },
      { ds: "DS3", m: "https://iiif.archive.org/iiif/x/manifest.json", ist: "California State Library", seg: "Sutro Collection MS 07" },
      { ds: "DS3", m: "https://iiif.archive.org/iiif/x/manifest.json", ist: "California State Library", seg: "Sutro Library M000130" }],
    titoli: [{ ds: "DS10399", v: "Book of Esther", u: "Bible" }],
    nomi: [{ ds: "DS10399", v: "Hieronymus", ruolo: "Author" }, { ds: "DS10399", v: "Minkoff, George", ruolo: "Former owner" }],
    lingue: [{ ds: "DS10399", v: "In Latin", l: "Latin" }],
    date: [{ ds: "DS10399", v: "circa 1240.", a0: "+1201-01-01T00:00:00Z", a1: "+1300-01-01T00:00:00Z" }],
  };
  const v = unisciDs(righe, { DS10399: riga, DS3: { e: "California State Library, Sutro Library M000130" } });
  assert.equal(v.DS10399.s, "MS Lat 441.2"); assert.equal(v.DS10399.t, "Book of Esther ; Bible");
  assert.deepEqual(v.DS10399.a, ["Hieronymus"]); assert.deepEqual(v.DS10399.c, ["Minkoff, George (former owner)"]);
  assert.equal(v.DS3.s, "Sutro Library M000130");
  const scarti = {};
  const rs = recordDs({ voci: v }, { esistenti: esistentiDa([{ fonte: "penn", segnatura: "Ms. Codex 1", manifest: "https://altro" }]), scarti });
  assert.deepEqual(rs.map(r => r.id).sort(), ["ds-ds10399", "ds-ds3"]);
  assert.deepEqual(scarti, { doppioni: 1, dominio: 1 });
  const h = rs.find(r => r.id === "ds-ds10399");
  assert.equal(h.fonte, "ds"); assert.equal(h.biblioteca, "Harvard University, Houghton Library"); assert.equal(h.citta, "Cambridge (Massachusetts)");
  assert.deepEqual(h.lingue, ["la"]); assert.equal(h.pagina, "https://search.digital-scriptorium.org/catalog/DS10399");
  // domini da verificare: fuori finché non sono confermati (una riga in ds.mjs)
  assert.ok(ammesso("https://nrs.lib.harvard.edu/x")); assert.ok(!ammesso("https://nrs.lib.harvard.edu/x", []));
  assert.ok(DOMINI_CONFERMATI.includes("figgy.princeton.edu"));
  assert.ok(!ammesso("https://repository.wellesley.edu/node/1/manifest")); assert.ok(!ammesso("https://colenda.library.upenn.edu/phalt/iiif/2/x/manifest"));
  assert.equal(manifestoDs("http://www.archive.org/details/abc/manifest"), "https://iiif.archive.org/iiif/abc/manifest.json");
  const p = daPagina(`<script>"loadedManifest": "https://x.org/m"</script><dt class="blacklight-shelfmark_display col-md-3"><strong>Shelfmark:</strong></dt><dd class="col-md-9">MS Lat 441.2</dd>`);
  assert.equal(p.m, "https://x.org/m"); assert.equal(p.s, "MS Lat 441.2");
});

// ---------------------------------------------------------------- Walters Art Museum: manifesti IIIF scritti da noi
import { elencoDaPagina, datiDaRiga, datiDaTei, datiDaPaginaImmagini, misuraJpeg, stima, campioni, campionePrincipale, tipoPagina,
  manifestoWalters, recordWalters, scriviManifestiWalters, urlManifesto, CC0 } from "../scripts/fonti/walters.mjs";

// validazione minima di un manifesto IIIF Presentation 3 (struttura richiesta dalla specifica per Manifest, Canvas, Annotation)
function validaP3(m) {
  const errori = [];
  const lingue = (x, dove) => { if (!x || typeof x !== "object" || Array.isArray(x) || !Object.values(x).length || !Object.values(x).every(a => Array.isArray(a) && a.every(s => typeof s === "string"))) errori.push(dove + ": non è una mappa di lingue"); };
  const uri = (x, dove) => { if (typeof x !== "string" || !/^https?:\/\/[^\s#]+$/.test(x)) errori.push(dove + ": id non valido " + x); };
  const ctx = [].concat(m["@context"]); if (ctx[ctx.length - 1] !== "http://iiif.io/api/presentation/3/context.json") errori.push("@context");
  uri(m.id, "manifest"); if (m.type !== "Manifest") errori.push("type"); lingue(m.label, "label");
  if (m.rights && !/^https?:\/\/(creativecommons\.org|rightsstatements\.org)\//.test(m.rights)) errori.push("rights");
  if (m.requiredStatement) { lingue(m.requiredStatement.label, "requiredStatement.label"); lingue(m.requiredStatement.value, "requiredStatement.value"); }
  for (const md of m.metadata || []) { lingue(md.label, "metadata.label"); lingue(md.value, "metadata.value"); }
  if (!Array.isArray(m.items) || !m.items.length) errori.push("items vuoto");
  const ids = new Set();
  for (const [i, c] of (m.items || []).entries()) {
    uri(c.id, "canvas " + i); if (ids.has(c.id)) errori.push("canvas doppio " + c.id); ids.add(c.id);
    if (c.type !== "Canvas") errori.push("canvas type " + i);
    if (!Number.isInteger(c.width) || !Number.isInteger(c.height) || c.width <= 0 || c.height <= 0) errori.push("canvas dimensioni " + i);
    if (c.label) lingue(c.label, "canvas label " + i);
    const ap = c.items && c.items[0];
    if (!ap || ap.type !== "AnnotationPage") { errori.push("AnnotationPage " + i); continue; }
    uri(ap.id, "annotationpage " + i);
    for (const a of ap.items || []) {
      uri(a.id, "annotation " + i);
      if (a.type !== "Annotation" || a.motivation !== "painting" || a.target !== c.id) errori.push("annotation " + i);
      const b = a.body || {}; uri(b.id, "body " + i);
      if (b.type !== "Image" || !/^image\//.test(b.format || "") || b.width !== c.width || b.height !== c.height) errori.push("body " + i);
    }
    for (const t of c.thumbnail || []) { uri(t.id, "thumbnail " + i); if (t.type !== "Image") errori.push("thumbnail type " + i); }
  }
  return errori;
}

const TEI_W = `<?xml version="1.0" encoding="UTF-8"?><TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc><titleStmt>
<title type="common" xml:id="a1">Walters Ms. W.1, Gospel Book</title><title type="work" n="item 1">Gospel of St. Matthew</title><title type="work">Gospel of St. Mark</title>
<author xml:id="au"><name type="authority">Hieronymus, Saint, -419 or 420</name><name type="vernacular" xml:lang="lat">Hieronymus</name></author></titleStmt></fileDesc>
<sourceDesc><msDesc><msIdentifier><settlement>Baltimore</settlement><repository>The Walters Art Museum</repository><idno xml:id="i">W.1</idno></msIdentifier>
<msContents><textLang mainLang="lat" otherLangs="gre">Latin</textLang></msContents><history><origin><origDate>23 Dhū al-Qaʿdah 935 AH / 1529 CE</origDate><origPlace>Brittany</origPlace></origin></history></msDesc></sourceDesc></teiHeader>
<facsimile><surface n="Upper board outside" xml:id="s1"><graphic url="master/W1_000001_600.tif"/><graphic url="sap/W1_000001_sap.jpg"/><graphic url="thumb/W1_000001_thumb.jpg"/></surface>
<surface xml:id="s2" n="fol. 1r"><graphic url="sap/W1_000002_sap.jpg" xml:id="g" width="1300px" height="1800px"/></surface>
<surface n="fol. 1v"><graphic url="sap/W1_000003_sap.jpg"/></surface><surface n="fol. 2r"><graphic url="sap/W1_000004_sap.jpg"/></surface>
<surface n="Spine"><graphic url="sap/W1_000005_sap.jpg"/></surface></facsimile></TEI>`;

test("Walters: elenco, TEI, pagina delle immagini, intestazione JPEG", () => {
  const el = elencoDaPagina(`<ul><li> <span class="shelf_mark">W.105</span>, Butler Hours, Latin (1340 - 1355 CE, Probably Shropshire, England) <br /> <a href="./Data/WaltersManuscripts/html/W105/">Browse images</a> | Cataloging in process | <a href="http://art.thewalters.org/detail/25556">art</a> </li>
    <li> <span class="shelf_mark">W.1</span>, Gospel Book, Latin (900 - 925 CE, Brittany) <br /> <a href="./Data/WaltersManuscripts/html/W1/">Browse images</a> | <a href="./Data/WaltersManuscripts/ManuscriptDescriptions/W1_tei.xml">TEI</a> </li></ul>`);
  assert.deepEqual(Object.keys(el), ["W105", "W1"]);
  assert.equal(el.W105.s, "W.105"); assert.equal(el.W105.tei, 0); assert.equal(el.W1.tei, 1);
  assert.deepEqual(datiDaRiga(el.W105.r), { titolo: "Butler Hours", datazione: "1340 - 1355 CE", luogo: "Probably Shropshire, England", lingue: ["la"] });
  assert.deepEqual(datiDaRiga("Bible pictures, W. de Brailes, French, Old (842-ca.1400) (1240 - 1260 CE, Oxford, England)").lingue, ["fr"]);
  const d = datiDaTei(TEI_W);
  assert.equal(d.s, "W.1"); assert.equal(d.t, "Gospel Book"); assert.deepEqual(d.a, ["Hieronymus, Saint, -419 or 420"]);
  assert.deepEqual(d.w, ["Gospel of St. Matthew", "Gospel of St. Mark"]); assert.deepEqual(d.l, ["la", "grc"]); assert.equal(d.o, "Brittany");
  assert.equal(d.p.length, 5); assert.deepEqual(d.p[1], ["fol. 1r", "W1_000002", 1300, 1800, 1]); assert.deepEqual(d.p[0], ["Upper board outside", "W1_000001", 0, 0, 0]);
  // anni dell'egira: conta l'anno dell'era cristiana
  assert.deepEqual(secoli(d.d), [16, 16]);
  const pi = datiDaPaginaImmagini(`<a href="./../../../../Data/WaltersManuscripts/W622/data/W.622/sap/W622_000001_sap.jpg" title="Large JPEG image of W.622, Upper board outside"><img alt="x"/></a>
    <a href="./../../../../Data/WaltersManuscripts/W622/data/W.622/sap/W622_000001_sap.jpg">W622_000001_sap.jpg</a>
    <a href="./../../../../Data/WaltersManuscripts/W622/data/W.622/sap/W622_000003_sap.jpg" title="Large JPEG image of W.622, fol. 1a">`, "W.622");
  assert.equal(pi.dir, "Data/WaltersManuscripts/W622/data/W.622"); assert.deepEqual(pi.p.map(x => x[0]), ["Upper board outside", "fol. 1a"]);
  // intestazione JPEG: SOI, APP0, SOF0 con altezza 1800 e larghezza 1109
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, ...Buffer.from("JFIF\0"), 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 8, 0x07, 0x08, 0x04, 0x55, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  assert.deepEqual(misuraJpeg(Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof])), { w: 1109, h: 1800 });
  assert.equal(misuraJpeg(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])), null);
  assert.equal(misuraJpeg(Buffer.from("GIF89a")), null);
});

test("Walters: stime delle misure per tipo di pagina", () => {
  assert.equal(tipoPagina("fol. 12r"), "fol. #r"); assert.equal(tipoPagina("Front flyleaf ii, v"), "front flyleaf #, v");
  const p = [["Upper board outside", "a", 0, 0, 0], ["fol. 1r", "b", 1300, 1800, 1], ["fol. 1v", "c", 0, 0, 0], ["fol. 2r", "d", 0, 0, 0], ["fol. 3r", "e", 0, 0, 0], ["Spine", "f", 0, 0, 0], ["fol. 4r", "g", 0, 0, 2]];
  assert.equal(campionePrincipale(p), 4);   // gruppo più numeroso (fol. #r: 1, 3, 4, 6), quella di mezzo
  assert.deepEqual(campioni(p).map(i => p[i][0]), ["Upper board outside", "fol. 1v", "Spine"]);
  stima(p);
  assert.deepEqual(p[3], ["fol. 2r", "d", 1300, 1800, 0]);   // stesso tipo
  assert.deepEqual(p[2].slice(2), [1300, 1800, 0]);          // tipo senza misure: la misurata più vicina
  assert.deepEqual(p[6], ["fol. 4r", "g", 0, 0, 2]);          // immagine mancante: resta fuori
});

test("Walters: manifesti IIIF Presentation 3 e voci del catalogo", () => {
  const v = { ...datiDaTei(TEI_W), dir: "Data/WaltersManuscripts/W1/data/W.1" };
  stima(v.p);
  v.p[4] = ["Spine", "W1_000005", 400, 1800, 1];
  v.p.push(["fol. 3r", "W1_000006", 0, 0, 2]);
  const testo = manifestoWalters("W1", v, { tei: 1 });
  const m = JSON.parse(testo);
  assert.deepEqual(validaP3(m), []);
  assert.equal(m.id, "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/main/data/manifesti/walters/W1.json");
  assert.equal(m.id, urlManifesto("W1"));
  assert.equal(m.rights, CC0); assert.match(m.requiredStatement.value.it[0], /Walters Art Museum.*CC0/);
  assert.equal(m.items.length, 5);   // l'immagine mancante resta fuori
  assert.deepEqual(m.items.map(c => c.label.none[0]), ["Upper board outside", "fol. 1r", "fol. 1v", "fol. 2r", "Spine"]);
  const c = m.items[1], b = c.items[0].items[0].body;
  assert.equal(b.id, "https://www.thedigitalwalters.org/Data/WaltersManuscripts/W1/data/W.1/sap/W1_000002_sap.jpg");
  assert.equal(b.format, "image/jpeg"); assert.equal(c.width, 1300); assert.equal(c.height, 1800);
  assert.equal(c.thumbnail[0].id, "https://www.thedigitalwalters.org/Data/WaltersManuscripts/W1/data/W.1/thumb/W1_000002_thumb.jpg");
  assert.equal(Math.max(c.thumbnail[0].width, c.thumbnail[0].height), 190);
  assert.equal(m.items[4].width, 400);
  assert.equal(m.thumbnail[0].id, c.thumbnail[0].id);   // miniatura: il primo foglio numerato
  assert.ok(!m.items.some(x => x.items[0].items[0].body.service));   // immagini statiche, senza servizio IIIF Image
  // un foglio per riga e nessuna proprietà sconosciuta in testa
  assert.equal(testo.split("\n").length, m.items.length + 3);
  // la validazione rileva gli errori
  assert.ok(validaP3({ ...m, items: [{ ...m.items[0], width: 0 }] }).length > 0);
  assert.ok(validaP3({ ...m, type: "Collection" }).length > 0);
  // voce del catalogo
  const st = { elenco: { W1: { s: "W.1", tei: 1 } }, voci: { W1: v } };
  const [r] = recordWalters(st);
  assert.equal(r.id, "walters-w1"); assert.equal(r.fonte, "walters"); assert.equal(r.segnatura, "W.1"); assert.equal(r.manifest, urlManifesto("W1"));
  assert.equal(r.immagini, 5); assert.deepEqual(r.lingue, ["la", "grc"]);
  const x = voce(r, A);
  assert.equal(x.biblioteca, "The Walters Art Museum"); assert.deepEqual(x.secolo, [16, 16]);
  // scrittura su disco: solo se cambia; i manifesti dei codici usciti dall'elenco si cancellano; uno stato vuoto non cancella niente
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walters-"));
  fs.writeFileSync(path.join(dir, "W999.json"), "{}");
  assert.deepEqual(scriviManifestiWalters(st, dir), { manifesti: 1, cambiati: 2 });
  assert.deepEqual(scriviManifestiWalters(st, dir), { manifesti: 1, cambiati: 0 });
  assert.deepEqual(fs.readdirSync(dir), ["W1.json"]);
  assert.deepEqual(scriviManifestiWalters({ voci: {} }, dir), { manifesti: 0, cambiati: 0 });
  assert.deepEqual(fs.readdirSync(dir), ["W1.json"]);
  fs.rmSync(dir, { recursive: true });
});

test("Walters: manifesti pubblicati nel repo validi (Presentation 3)", () => {
  const dir = "data/manifesti/walters";
  let nomi = []; try { nomi = fs.readdirSync(dir).filter(n => n.endsWith(".json")); } catch (e) {}
  for (const n of nomi) {
    const m = JSON.parse(fs.readFileSync(path.join(dir, n), "utf8"));
    assert.deepEqual(validaP3(m), [], n);
    assert.equal(m.id, urlManifesto(n.replace(/\.json$/, "")), n);
  }
});

test("Library of Congress: microfilm del Sinai e di Gerusalemme, segnature, esclusioni e manifesti scritti da noi", async () => {
  const { dividiTitolo, compattaLoc, recordLoc, manifestoScritto, lingueLoc } = await import("../scripts/fonti/loc.mjs");
  assert.deepEqual(dividiTitolo("Greek Manuscripts 792. Parakletike."), { s: "Greek 792", t: "Parakletike", d: null });
  assert.deepEqual(dividiTitolo("Georgian 96. John Climacus. 11th cent. 209 f. Pg. 29 ft."), { s: "Georgian 96", t: "John Climacus", d: "11th cent." });
  assert.deepEqual(dividiTitolo("Arabic 135.Four Gospels. 1618 A.D. 173 f. Pa. 20 ft."), { s: "Arabic 135", t: "Four Gospels", d: "1618 A.D." });
  const item = (o = {}) => ({ id: "http://www.loc.gov/item/00271074384-ms/", title: "Greek Manuscripts 792. Parakletike.", date: "1000", dates: ["1000"], language: ["greek, ancient (to 1453)"],
    partof: ["manuscripts in st. catherine's monastery, mount sinai", "manuscripts in st. catherine's monastery, mount sinai: microfilm 5010: greek"],
    image_url: ["https://tile.loc.gov/image-services/iiif/service:amed:amedmonastery:00271074384-ms:0005/full/pct:100/0/default.jpg#h=3426&w=5029"],
    resources: [{ files: 3, image: "https://tile.loc.gov/image-services/iiif/service:amed:amedmonastery:00271074384-ms:0005/full/pct:6.25/0/default.jpg" }], item: { notes: ["Copied on vellum."] }, ...o });
  const v = compattaLoc(item(), "sinai");
  assert.equal(v.sv, "https://tile.loc.gov/image-services/iiif/service:amed:amedmonastery:00271074384-ms"); assert.equal(v.n, 3); assert.equal(v.w, 5029); assert.equal(v.f, "greek");
  assert.equal(compattaLoc(item({ title: "Arabic Firmans 3. Firman of Sultan Selim." }), "sinai"), null);
  assert.equal(compattaLoc(item({ date: "1912", dates: ["[1912 TO 1925]"] }), "sinai"), null);   // cataloghi moderni
  assert.equal(compattaLoc(item({ resources: [] }), "sinai"), null);
  // Gerusalemme: l'inglese dei dati è la lingua della scheda; i fondi greci hanno il nome della biblioteca
  assert.deepEqual(lingueLoc({ c: "gerusalemme", f: "hagios sabas", l: ["english"] }), ["grc"]);
  const arm = compattaLoc(item({ id: "http://www.loc.gov/item/00271070001-jo/", title: "Armenian 5. Gospels. 13th cent. 200 f.", language: ["armenian"],
    partof: ["manuscripts in the libraries of the greek and armenian patriarchates in jerusalem: microfilm 5018: armenian"] }), "gerusalemme");
  const [r, a] = recordLoc({ voci: { "00271074384-ms": v, "00271070001-jo": arm } });
  assert.equal(r.id, "loc-00271074384-ms"); assert.equal(r.segnatura, "Greek 792"); assert.deepEqual(r.lingue, ["grc"]);
  assert.match(r.biblioteca, /Santa Caterina del Sinai/); assert.match(a.biblioteca, /Patriarcato armeno/); assert.equal(a.datazione, "13th cent.");
  assert.equal(r.manifest, "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/loc/00271074384-ms.json");
  assert.deepEqual(voce(a, A).secolo, [13, 13]);
  const m = manifestoScritto("00271074384-ms", v);
  assert.equal(m["@id"], r.manifest); assert.equal(m.sequences[0].canvases.length, 3);
  const c = m.sequences[0].canvases[2];
  assert.equal(c.images[0].resource.service["@id"], "https://tile.loc.gov/image-services/iiif/service:amed:amedmonastery:00271074384-ms:0003");
  assert.equal(c["@id"], "https://www.loc.gov/resource/amedmonastery.00271074384-ms/?sp=3"); assert.equal(c.images[0].on, c["@id"]);
});

test("Biblioteca Nazionale di Grecia: OAI, lingue in greco, pagine compatte e copie dei manifesti senza servizio Image", async () => {
  const { estraiNlg, lingueNlg, pagineDaManifesto, compattaPagine, espandiPagine, recordNlg, manifestoScritto } = await import("../scripts/fonti/nlg.mjs");
  const rec = `<record><header><identifier>oai:nlg.gr:1692464</identifier><setSpec>manuscript</setSpec><datestamp>2018-12-03 11:18:10</datestamp></header><metadata><oai_dc:dc>
    <dc:type>manuscript</dc:type><dc:title xml:lang="el">ΕΒΕ 3449 (Codex Atheniensis 3449)</dc:title><dc:subject xml:lang="el">Σύμμεικτο</dc:subject><dc:date>1700 - 1799</dc:date>
    <dc:format xml:lang="el">Χαρτί</dc:format><dc:language xml:lang="el">Ελληνική, Αρχαία</dc:language></oai_dc:dc></metadata></record>`;
  const x = estraiNlg(rec);
  assert.equal(x.id, "1692464"); assert.equal(x.v.s, "ΕΒΕ 3449 (Codex Atheniensis 3449)"); assert.equal(x.v.d, "1700 - 1799");
  assert.deepEqual(lingueNlg(["Ελληνική, Αρχαία", "Λατινική"]), ["grc", "la"]);
  const can = n => ({ images: [{ resource: { "@id": `https://digitalcollections.nlg.gr/iiif/1692464/EBE3449-0000${n}.tif/full/full/0/default.jpg`, width: 2000 + n, height: 2600,
    service: { "@id": `https://digitalcollections.nlg.gr/iiif/1692464/EBE3449-0000${n}.tif` } } }] });
  const p = pagineDaManifesto({ sequences: [{ canvases: [can(1), can(2), can(3)] }], metadata: [{ label: [{ "@value": "Rights holder", "@language": "en" }], value: "Εθνική Βιβλιοθήκη της Ελλάδος" }] }, "1692464");
  assert.deepEqual(p.pagine[1], ["EBE3449-00002.tif", 2002, 2600]); assert.match(p.titolare, /Εθνική/);
  const cp = compattaPagine(p.pagine);
  assert.ok(cp.q); assert.equal(cp.n, undefined); assert.deepEqual(espandiPagine(cp), p.pagine);
  assert.deepEqual(espandiPagine(compattaPagine([["a_x.jpg", 1, 2], ["a_y.jpg", 3, 4]])), [["a_x.jpg", 1, 2], ["a_y.jpg", 3, 4]]);
  const v = { ...x.v, p: cp, t: p.titolare };
  const [r] = recordNlg({ voci: { 1692464: v, 99: { s: "senza pagine" } } });
  assert.equal(r.id, "nlg-1692464"); assert.equal(r.biblioteca, "Biblioteca Nazionale di Grecia"); assert.deepEqual(r.lingue, ["grc"]); assert.equal(r.immagini, 3);
  assert.equal(r.manifest, "https://raw.githubusercontent.com/grecolatinovivo-create/emendando-catalogo/manifesti/data/manifesti/nlg/1692464.json");
  const m = manifestoScritto("1692464", v), res = m.sequences[0].canvases[0].images[0].resource;
  assert.equal(res["@id"], "https://digitalcollections.nlg.gr/iiif/1692464/EBE3449-00001.tif/full/2000,/0/default.jpg"); assert.equal(res.service, undefined);
  assert.equal(m.sequences[0].canvases[0].width, 2001);
});

test("Cambridge: schede raccolte dal browser, segnature, filtri e manifesti di CUDL", async () => {
  const { dividiCudl, recordCudl } = await import("../scripts/fonti/cudl.mjs");
  assert.deepEqual(dividiCudl("Cambridge, University Library, MS Nn.2.41"), { biblioteca: "Cambridge University Library", segnatura: "MS Nn.2.41" });
  assert.deepEqual(dividiCudl("Cambridge, Trinity College, MS O.4.17"), { biblioteca: "Trinity College", segnatura: "MS O.4.17" });
  const rs = recordCudl({ voci: {
    "MS-NN-00002-00041": { s: "Cambridge, University Library, MS Nn.2.41", t: "Codex Bezae", u: "New Testament and Acts of the Apostles", d: "Late 4th or early 5th Century", a0: 390, a1: 410, l: ["grc", "la"], f: "Codex" },
    "MS-DAR-00001": { s: "Cambridge, University Library, MS DAR 1", t: "Letter to Hooker", a0: 1850, f: "Letter" } } });
  assert.equal(rs.length, 1);
  assert.equal(rs[0].manifest, "https://cudl.lib.cam.ac.uk/iiif/MS-NN-00002-00041"); assert.deepEqual(rs[0].lingue, ["grc", "la"]);
  assert.equal(rs[0].id, "cudl-ms-nn-00002-00041"); assert.deepEqual(voce(rs[0], A).secolo, [4, 5]);
  assert.deepEqual(recordCudl(null), []);
});

test("manifesti scritti dal catalogo: si scrivono solo se cambiano, quelli dei codici usciti si tolgono", async () => {
  const { scriviManifesti } = await import("../scripts/manifesti.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifesti-"));
  const f = (id, v) => ({ id, v });
  assert.deepEqual(scriviManifesti({ a: 1, b: 2 }, dir, f), { scritti: 2, tolti: 0, totale: 2 });
  assert.deepEqual(scriviManifesti({ a: 1, b: 3 }, dir, f), { scritti: 1, tolti: 0, totale: 2 });
  assert.deepEqual(scriviManifesti({ a: 1 }, dir, f), { scritti: 0, tolti: 1, totale: 1 });
  assert.deepEqual(fs.readdirSync(dir), ["a.json"]);
});
