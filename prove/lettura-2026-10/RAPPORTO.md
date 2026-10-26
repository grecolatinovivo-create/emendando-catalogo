# Prova di lettura automatica dei codici latini «sospetti» (ottobre 2026)

Prova pilota gratuita: Kraken (riconoscimento della scrittura a mano, open source) ha letto poche pagine di ciascun codice; le letture sono state confrontate con testi latini noti e aperti, per capire se la lettura automatica può segnalare codici che forse contengono testi non identificati.

Esecuzione: https://github.com/grecolatinovivo-create/emendando-catalogo/actions/runs/40275860301

## In breve

- Codici scelti: 500; codici letti: **495**.
- Pagine lette: 3746 (vuote o quasi: 1090; non leggibili: 578; in volgare: 191; riconosciute: 272; incerte: 179; sospette: 1425; errori: 11).
- Codici **non leggibili** (nessuna pagina letta bene): **83** (di cui 32 per errori di rete o di manifesto).
- Codici in un'altra lingua (volgare) nelle pagine lette: 19.
- Codici **identificati** (le pagine lette corrispondono a testi noti): **61**; misti (alcune pagine note, altre no): 42.
- Codici **sospetti** (latino letto bene ma nessuna corrispondenza): **288**; incerti: 2.
- Tempo di calcolo: 28.3 ore di lettura (somma dei processi); 2.6 ore di job su GitHub Actions in tutto, il più lungo 103 minuti.

## Con che cosa sono stati identificati

- Vulgata: 47
- Perseus: Bede the Venerable, Historiam ecclesiasticam gentis Anglorum: 2
- Patrologia Latina, vol. 83, De diaconibus.: 1
- Patrologia Latina, vol. 83, EXPOSITIO IN CANTICUM CANTICORUM SALOMONIS.: 1
- Patrologia Latina, vol. 78, Ex Codice Tiliano.: 1
- Patrologia Latina, vol. 10, 457-458 SANCTI HILARII LIBER DE SYNODIS, SEU DE FIDE ORIENTALIUM.: 1
- CSEL: Orosius, Paulus, Historiae Adversum Paganos: 1
- Patrologia Latina, vol. 55, d Incipit velatio nuplialis.: 1
- Patrologia Latina, vol. 72, LIBELLUS DE MORIBUS.: 1
- CSEL: Eugippius, Vita Sancti Severini: 1
- CSEL: Eugippius, Excerpta ex Operibus Augustini: 1
- Patrologia Latina, vol. 76, LECTIO S. EVANG. SEC. JOAN. XV, 12-16.: 1
- Patrologia Latina, vol. 40, COGNITIO VITÆ, SEU DE COGNITIONE VERÆ VITÆ LIBER UNUS.: 1
- Patrologia Latina, vol. 37, De tecunda parte Psalmi.: 1
- Patrologia Latina, vol. 66, CAPUT IV.: 1
- Perseus: Juvenal, Saturae: 1
- Perseus: Ammianus Marcellinus, Res Gestae: 1
- Patrologia Latina, vol. 17, S. Sebastianus martyres animat.: 1
- Patrologia Latina, vol. 72, XXIII. INCIPIT CANON ACTIONIS.: 1
- Patrologia Latina, vol. 78, (894) Orationes ad visitandum infirmum.: 1
- Patrologia Latina, vol. 57, ARGUMENTUM. — Sancti martyres cruciatus cruentam­ que mortem pro Christo fortiter tolerant: 1
- CSEL: Hilary, Saint, Bishop of Poitiers, Tractatus super psalmos: 1
- Patrologia Latina, vol. 17, CAPUT XIII.: 1
- Perseus: De vita Hadriani: 1
- Patrologia Latina, vol. 76, IBID. - Æstimabit abyssum quasi senescentem.: 1

## Sospetti, ordinati per interesse

Interesse = qualità della lettura (confidenza e quota di parole latine) × quantità di testo × numero di pagine senza corrispondenza, con un vantaggio per palinsesti, maculature, testi dichiarati non identificati e codici fino al XII secolo, e uno svantaggio per i codici il cui titolo nel catalogo nomina già autore o opera. «Pagina» è il numero dell'immagine nel manifesto (canvas). Gli estratti sono la lettura automatica grezza, con le abbreviazioni non sciolte e gli errori della macchina.

### 1. Ms. Codex 701 (University of Pennsylvania Libraries, Kislak Center, Philadelphia)

- Titolo nel catalogo: [Astronomical fragments]; datazione: 1200
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 24 (8v): confidenza 0.95, parole latine 96%, corrispondenza con testi noti 0%
- Manifesto: https://digitalrepository.library.upenn.edu/iiif/2/items/c1367621-b3bc-4815-9cd3-94b19b73c4a6/manifest (pagina 24)
- Immagine: https://iiif-images.library.upenn.edu/iiif/2/be433e4d-77ca-423b-888b-162aff7a6018/full/2000,/0/default.jpg
- Estratto: «ħ uobłm poͣ. det̾iẽt ħ u̾b ge .fͣ.z. St̃ aliĩ qͥ / re pͥmã pͦnẽ dꝰ ãbiguã scł hãc. d̾s po. fa mn. / añ oĩa tpr̃a. si.23. sic ĩtłłigat᷑ potũ fa. ꝙ mꝰ»

### 2. BPL 891 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Fragment (Latin): Computus, and other text(s); datazione: Apennine Peninsula?, 10th century, mid
- Scelto perché: frammento. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 12 (12 - f005v-006r): confidenza 0.97, parole latine 84%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3296044/manifest (pagina 12)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvNTEvMkIvMTIvNjcvMjkvNTcvMkMvMTIvQzgvM0EvOEUvRkQvNjMvOTQvNEEvODYvMTg4N18xX2l0ZW1fMzI5NjA0NF8xMi5qcDIiLCJyZXBfaWQiOiIxMjUyNTIxNTE2MDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiNDE2NyIsImhlaWdodCI6IjMxMTEiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «lauis . ẽ. hic dies ñ hab& lunȩ. qđ ñ ẽfacile ab eotẽ pr̃ / qđ h̃ duo luminasa ĩ firmam̃to cȩli. statutas nullus / dies soł sineluna fuit. & sic ĩtellegit᷑. Htestimonium»

### 3. Cod. Haen. 9 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Juristische Sammelhandschrift (Codex Utinensis); datazione: 10. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 9 (2r): confidenza 0.98, parole latine 88%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000013826/manifest.json (pagina 9)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0138/0000013826/00000009.jpx/full/2000,/0/default.jpg
- Estratto: «Nam di aconis se uel perse / naste ris siue aecclesiis / qui cor rupit eam. puni a»

### 4. Clm 23479 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Fragmenta medicinalia; datazione: 11. Jahrhundert
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 14 ((0014)): confidenza 0.98, parole latine 85%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00160074/manifest (pagina 14)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00160074_00014/full/full/0/default.jpg
- Estratto: «Ferreus hiue oolor est nature mira potestas / am semel accensus conceptos detinet ignes / Extinguiq neqͥt. collucens ꝑpete flamma»

### 5. Clm 29310(2 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Liber ordinarius (Fragment); datazione: Anfang 12. Jh.
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 9 leggibili)
- Pagina 8 ((0008)): confidenza 0.97, parole latine 80%, corrispondenza con testi noti 2%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00108565/manifest (pagina 8)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00108565_00008/full/!2000,3200/0/default.jpg
- Estratto: «BABT.⁊ Sabine u. Sin e do / minica. pore .m. recip. uł si / e.ii. oR. Lt ct. Sapientia u.»

### 6. Msc.Hist.3 (Staatsbibliothek Bamberg, Bamberg)

- Titolo nel catalogo: Historische Sammelhandschrift ; Historiarum variarum collectio; datazione: 996–1023
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 8 (1v (0008)): confidenza 0.97, parole latine 88%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00140766/manifest (pagina 8)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140766_00008/full/!2000,3200/0/default.jpg
- Estratto: «iunxit. Sueuos. & cõttos. dissipauit. / sigambros transmutauit ingalliam. / panienios stipendiaros fecit. hoc ẽ»

### 7. Codex 38(366) (Stiftsbibliothek, Einsiedeln)

- Titolo nel catalogo: [Anonymus], Expositio octo priorum Epistolarum S. Pauli; datazione: 10th century (second half, about 960-965)
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 8 leggibili)
- Pagina 7 (2r): confidenza 0.98, parole latine 93%, corrispondenza con testi noti 1%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/sbe-0038/manifest.json (pagina 7)
- Immagine: https://media.e-codices.ch/iip/sbe/sbe-0038/sbe-0038_002r.jp2/full/2000,/0/default.jpg
- Estratto: «neq ab homine. neq ꝓpriȩ carnis instinctui. cen / pseudo ꝓph&ȩ. sed adõ mittitur. Unde ẽ. Ecce / ego ad gentes longe positas mittã te. Illud sa»

### 8. Ms. lat. qu. 106 (Staatsbibliothek zu Berlin, Berlin)

- Titolo nel catalogo: Mathematisch-musikalische Sammelhandschrift; datazione: 1100
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 9 (2r [9]): confidenza 0.97, parole latine 94%, corrispondenza con testi noti 2%
- Manifesto: https://content.staatsbibliothek-berlin.de/dc/PPN848729668/manifest (pagina 9)
- Immagine: https://content.staatsbibliothek-berlin.de/dc/848729668-0009/full/full/0/default.jpg
- Estratto: «potest. Nam ipsa ęccła ante / clamant. ꝓ scĩficatione ipsiꝰ domꝰ ħ est / qd̃ d̾ns ante passionẽ ꝓsuis discipłis»

### 9. Plut. 10 dex.5 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Tractatus super Cantica Canticorum, Catena in Ioannem etc; datazione: 1001-1100
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 193 (Carta: 91r): confidenza 0.97, parole latine 83%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:173789/manifest.json (pagina 193)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:173659/full/2000,/0/default.jpg
- Estratto: «s duo. Misera ⁊ mia. Dñs it̾m se inclinans scribet it̾ra / Pot̃ intelligi fecisse ħ dñs iurta mor̾e ꝯsuetudiuii / aliud agens uultu alio intendens. lib̾am eiꝰ exeinde»

### 10. Ms. 139 (Couvent des Cordeliers/Franziskanerkloster, Fribourg/Freiburg)

- Titolo nel catalogo: Collection of anonymous sermons; datazione: before 1432
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 95 (47r): confidenza 0.96, parole latine 90%, corrispondenza con testi noti 0%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/fcc-0139/manifest.json (pagina 95)
- Immagine: https://media.e-codices.ch/iip/fcc/fcc-0139/fcc-0139_047r.jp2/full/2000,/0/default.jpg
- Estratto: «ĩ. re̾.G. ꝯfusic̃e nõ sũt ꝯfusi. aerubesc̾e̾ aħ est ꝙ ꝓmittit᷑ aĩe iã nobilitate ꝑ lu / nesierũt. cꝰ roepoĩt. Io. dilexerũt ĩ m̃gͤ. tob̾. ułt luce spe splõdida fulgebis»

### 11. Clm 29890(M1 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Passio S. Margarethae (Fragment); datazione: Anfang 11. Jahrhundert
- Scelto perché: frammento. Esito: sospetto (6 pagine sospette su 8 leggibili)
- Pagina 6 ((0006)): confidenza 0.98, parole latine 80%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00160607/manifest (pagina 6)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00160607_00006/full/full/0/default.jpg
- Estratto: «superatus sũ ate & quid facia ignoro / armamea c̾fusas. uel sifortis me uin / cer& ñ curassem. Iece atenera supe»

### 12. Plut. 20.13 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Laus B. Mariae virginis incerti auctoris . Seu potius Anonymi sermones in varia Psalmorum loca, seu versus; datazione: 1101-1200
- Scelto perché: titolo assente o testo non identificato; miscellanea. Esito: sospetto (4 pagine sospette su 8 leggibili)
- Pagina 33 (Carta: 14r): confidenza 0.97, parole latine 91%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:301576/manifest.json (pagina 33)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:301534/full/2000,/0/default.jpg
- Estratto: «cept̾ ⁊ natꝰ. Iste gradiens est adcelos sine angłoꝵ auxilio. / sed imultitudine fortitudinis sue. Id singła angłoꝵ / uerba dñs respondit. Nos int̾rogatis ꝗs ego sum.»

### 13. MS. Canon. Misc. 476 (Bodleian Library, Oxford)

- Titolo nel catalogo: Vita gloriossime virginis Mariae atque venerabilis matris filii dei vivi veri et unici (unidentified work).; datazione: 14th century, middle
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 165 (fol. 109r): confidenza 0.98, parole latine 84%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/217de342-7b9b-4cbb-942e-a719dff3fb1d.json (pagina 165)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/04a391ed-174e-4b6c-b716-58fd69fc39f4/full/2000,/0/default.jpg
- Estratto: «decorau̾at deitatẽ cõem phuam / tatem q ui dext̾ra dei patris fuit / digne collocatus aquo numꝙͣ̃»

### 14. Clm 28179 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Lectura super decreto (Fragment); datazione: 14. Jh.
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 167 ((0167)): confidenza 0.96, parole latine 90%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00107144/manifest (pagina 167)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00107144_00167/full/!2000,3200/0/default.jpg
- Estratto: «xp̃i. Si dicas ꝙ ñ ĩcllr ꝑ significacõm ñ ꝑ nntate̾ ut sit sẽ / sus. ẽ .i. significat᷑ ꝑ istũ panẽ. ñ q iͥ fit ẜ m̾ratẽ. ꝯͣ apꝰ ĩ / fert iͥ. itaq qui manducat ĩdigne reꝰ ẽ cors ⁊ sangnis»

### 15. Hs I 218 (Wissenschaftliche Stadtbibliothek Mainz, Mainz)

- Titolo nel catalogo: Sammelhandschrift; datazione: Mitte 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 283 (138r): confidenza 0.97, parole latine 88%, corrispondenza con testi noti 1%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/mzstb_hs_i_218/manifest.json (pagina 283)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_218%3Amzstb_hs_i_218_138r.jpg/full/full/0/default.jpg
- Estratto: «tor. qui bonas margaritas q̃siuit ⁊ q̃rit ẽ / ipẽ d̾i filius ihx̃ xͣ qui de celis uenĩt ad t̾ / ras ut bonas q̃ ret̾ margaritas .i. p̃desti»

### 16. Ms 1291 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Grammatisch-philosophische Sammelhandschrift; datazione: 14. Jh. ; 15. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 5 (2r): confidenza 0.96, parole latine 88%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000022499/manifest.json (pagina 5)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0224/0000022499/00000005.jpx/full/2000,/0/default.jpg
- Estratto: «id̾. Om̃is passõ ẽ illiꝰ sb̾i pͦ ĩcqͦ roꝑiꝰ / p ͦ cã ⁊ pͥnͫꝰ illiꝰ passõnis s cẽ ⁊ pͥnꝰ᷑ / hꝰ passonis q̃ ẽ ogxitas ĩ uẽiũt᷑ p ͦ ĩ»

### 17. Clm 10270 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Astronomische und komputistische Sammelhandschrift; datazione: Anfang 12. Jahrhundert
- Scelto perché: codice composito. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 7 (2r (0007)): confidenza 0.97, parole latine 86%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00051024/manifest (pagina 7)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00051024_00007/full/!2000,3200/0/default.jpg
- Estratto: «Engonasin habet in capitt / stelła .i. In sinistro brachio.i. / In utroq humero singulas»

### 18. Oversize LJS 24 (University of Pennsylvania Libraries, Kislak Center, Philadelphia)

- Titolo nel catalogo: [Medical miscellany]; datazione: 1225
- Scelto perché: miscellanea. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 306 (149v): confidenza 0.97, parole latine 86%, corrispondenza con testi noti 2%
- Manifesto: https://digitalrepository.library.upenn.edu/iiif/2/items/f0b75e70-583e-4681-bbff-7e2008bd7ffb/manifest (pagina 306)
- Immagine: https://iiif-images.library.upenn.edu/iiif/2/ba5d3cf3-c1b8-4906-8b30-c4fe016d9ec7/full/2000,/0/default.jpg
- Estratto: «S dispoẽs sunt accãcia. ⁊ fłm ẽ ꝙ seꝑabi / le accidens sit ełm sb̃e mansiue. Et eiꝰ qͥ / ctixit ꝙ ip̃ sunt simnma denarii qm̃ de»

### 19. Ms 747 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Sermones anonymi de dominicis · Auctoritates; datazione: 13./14. Jh.
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 8 leggibili)
- Pagina 110 (54v): confidenza 0.97, parole latine 91%, corrispondenza con testi noti 2%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000031859/manifest.json (pagina 110)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0318/0000031859/00000110.jpx/full/2000,/0/default.jpg
- Estratto: «ysa. de achaz qui noluit pet̾e signũ ne ydola sua uilificarent᷑ ⁊ dñs exal / iaret᷑. Id tirto dnm ad ppłm ostendit. qr eoꝵ lib̾atõm ĩpediuit. Uñ sub»

### 20. Hs I 457 (Wissenschaftliche Stadtbibliothek Mainz, Mainz)

- Titolo nel catalogo: Juristische Sammelhandschrift; datazione: 1342; 1353; 1364
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 162 (78r): confidenza 0.97, parole latine 82%, corrispondenza con testi noti 1%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/mzstb_hs_i_457/manifest.json (pagina 162)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_457%3Amzstb_hs_i_457_078r.jpg/full/!2000,3200/0/default.jpg
- Estratto: «uxorẽ altĩus non obedĩa. ar .xxxi. q .ii. lotharius uł / uxorem meam altĩ dimitte. quia deus eam dimicti ꝓ / hibet.xii..ui. si dominꝰ. qr ĩn matrimonio siũa lata ꝯ̃»

### 21. Clm 2580 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Anonymi commentarius in Boetii librum de trinitate; datazione: 12. Jh.
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (3 pagine sospette su 3 leggibili)
- Pagina 98 ((0098)): confidenza 0.97, parole latine 98%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00134428/manifest (pagina 98)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00134428_00098/full/full/0/default.jpg
- Estratto: «Eaceptis tam solis relationũ nominibꝰ. / que quẽ admođi p̃dicari de deo debeant. / paulo post demonstrabit᷑. Predicant᷑ gͦ»

### 22. BPL 1764 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Fragment (Latin): Sermones de diebus festis; datazione: France, 12th/13th century
- Scelto perché: frammento. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 10 (10 - f001v-002r): confidenza 0.97, parole latine 87%, corrispondenza con testi noti 1%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3758681/manifest (pagina 10)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvMTEvMkEvRDUvMkEvNkIvNzAvOEMvRjAvRUEvMjIvQjkvNzEvRkEvNTMvMjAvQjgvMTg4N18xX2l0ZW1fMzc1ODY4MV8xMC5qcDIiLCJyZXBfaWQiOiIxMjUyNTIxNjA5MDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY3MCIsImhlaWdodCI6IjI3MDMiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «ua aute demꝑalibus dextͣ cõꝑat᷑ etͥnis. / ꝑfectoꝵ tanta: Raritas uͭ ĩ fra / pͥmũ limitẽ qͥ est denariꝰ nͣ ore»

### 23. Ms 1373 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Philosophische Sammelhandschrift; datazione: 1378
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 4 (1v): confidenza 0.94, parole latine 80%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000004106/manifest.json (pagina 4)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0041/0000004106/00000004.jpx/full/2000,/0/default.jpg
- Estratto: «ẜ ñõ fit ꝑs sb̃i qũ põi᷑ apte rot ¶3 ͫ / ppõ aff̾ ua de p̃to qui mĩo sui ͫ acceqrto / nõ trute nͥ uñu suppͭᵘ. ⁊̃ accu go aeddi ͤ»

### 24. MS. Laud Misc. 506 (Bodleian Library, Oxford)

- Titolo nel catalogo: Theological composite manuscript; datazione: 13th century, late to 14th century, middle
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 208 (fol. 102v): confidenza 0.97, parole latine 87%, corrispondenza con testi noti 3%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/4a167112-db1a-46f1-a545-829e82a7830a.json (pagina 208)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/3913cf52-01ee-4485-befd-97c5181c4358/full/2000,/0/default.jpg
- Estratto: «qui contumeliis afficiũt corꝑa sua .Ro. / i. s ħ tałutũ multiplicat qui tͥbulõi / bus exponit .i. cor .r. seminat᷑ corpꝰ»

### 25. Ms 1212 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Medizinische Sammelhandschrift; datazione: 12. oder 13. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 187 (93r): confidenza 0.97, parole latine 77%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000012387/manifest.json (pagina 187)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0123/0000012387/00000187.jpx/full/2000,/0/default.jpg
- Estratto: «Albugo oui ponat᷑ ut insimilitudinẽ / mellis ĩiuscet᷑. Depilis leporis quanty / oporteat. hec medicina fluenti uene»

### 26. MS 235 (Fragments 14, 41, & 42) (St John's College, Oxford)

- Titolo nel catalogo: Text on sacraments and their administration (binding fragments); datazione: Between 1340 and 1360
- Scelto perché: maculatura o frammento di legatura; frammento. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 6 (Fragment 42 verso): confidenza 0.97, parole latine 82%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/c730f71e-4f6c-49d3-a553-1ea260766273.json (pagina 6)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/100d8442-2c49-4884-b598-b894f8f07150/full/2000,/0/default.jpg
- Estratto: «fiłr sou̾e int̾ẽe uł ad aliam penã ẜ sr̾ioris / arbitũ exũicati. q̃m indebite fatigauit. uisi / forsan ⁊ ip̃m ꝓbabłis ertor excuset hex ꝯĩa ĩ»

### 27. Clm 3420 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Sermones dominicales incerti auctore. Inc. Licet in omnia scientia etc. Fol. 82 Sermones quadragesimales. Inc. Conuertimini ad me toto cord…; datazione: 1450
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 5 ((0005)): confidenza 0.96, parole latine 79%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00163218/manifest (pagina 5)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00163218_00005/full/full/0/default.jpg
- Estratto: «multa ioẽtura hoc fect ideo ut / om̃s sideles suos. ab amore indĩ / xtcaheret qr hic in uita mimiuẽt̾»

### 28. Plut. 53.16 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Erythraeae Sibyllae vaticinium ad Danaos . Adde etiam Anonymi sermones theologici et alia; datazione: 1301-1310
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 217 (Carta: 102r): confidenza 0.96, parole latine 80%, corrispondenza con testi noti 2%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:831977/manifest.json (pagina 217)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:831668/full/2000,/0/default.jpg
- Estratto: «du ocłtanda uł diffeiẽda ꝓpt̃̾ scãdalũ / pusilloꝵ  ut dc̃tꝭ ẽi Eñ tñ ꝯsiliorꝭ / obẜuaᵈ ⁊ imploͦ oꝑu nrĩe ẜ de necessi»

### 29. Cod. Bodmer 77 (Fondation Martin Bodmer, Cologny)

- Titolo nel catalogo: Guido Aretinus, Micrologus; Prologus in Antiphonarium; De ignoto cantu; Regulae rhythmicae; datazione: 12th century
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 94 (44v): confidenza 0.98, parole latine 79%, corrispondenza con testi noti 0%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/fmb-cb-0077/manifest.json (pagina 94)
- Immagine: https://media.e-codices.ch/iip/fmb/fmb-cb-0077/fmb-cb-0077_044v.jp2/full/2000,/0/default.jpg
- Estratto: «e uidert qd ipsa pͥma hac ꝑhoc / & alie conti nue uoces duos abeat / tonos. Ut pote. Trima siea semit»

### 30. Ms 433 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologische Sammelhandschrift; datazione: 13. Jh., Anfang
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 9 leggibili)
- Pagina 9 (2r): confidenza 0.98, parole latine 91%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000005957/manifest.json (pagina 9)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0059/0000005957/00000009.jpx/full/2000,/0/default.jpg
- Estratto: «da. Qͥnta utiq ẽ ꝯtumeliosa ⁊ scan. / dalis plena qua mali utunt᷑. q̃ simi. / lĩt est reꝓbanda. Nã quoꝵ uita de»

### 31. Plut. 90 sup.118 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Comment. in Dantis Infernum, et Purgatorium; datazione: 1301-1400
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 292 (Carta: 141v): confidenza 0.96, parole latine 77%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:933518/manifest.json (pagina 292)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:933506/full/2000,/0/default.jpg
- Estratto: «ante mortẽ tuam de istis penis mache i. ꝯͣte rimbarohłs̃ .i. cipias exꝑienciam / lagiẽte comĩco mõ dic̃ dñs Guido int̾alkas geates q̃ offarũt deũ iii pd̃o uicio etĩa»

### 32. Cod. S I 167 (Zentralbibliothek, Solothurn)

- Titolo nel catalogo: Miscellanea Computistica et Astronomica; datazione: late 14th century
- Scelto perché: miscellanea. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 7 (2r): confidenza 0.96, parole latine 81%, corrispondenza con testi noti 0%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/zbs-SI-0167/manifest.json (pagina 7)
- Immagine: https://media.e-codices.ch/iip/zbs/zbs-SI-0167/zbs-SI-0167_002r.jp2/full/2000,/0/default.jpg
- Estratto: «tũ ꝯputis plixiꝰ sceata nõ erubescens quĩa repete exquo ꝑ / seuecã uenabłem nũpͣ niuis dr ꝓ satis nõ de ⁊ 2ͫ eraciũ / Decies ĩ petita placełut Et igi motꝰ solis ⁊ l̃ne ⁊ ad sun»

### 33. Clm 29308(45 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Sequentiar und Tropar (Fragment); datazione: 14. Jh.
- Scelto perché: frammento. Esito: sospetto (6 pagine sospette su 9 leggibili)
- Pagina 8 ((0008)): confidenza 0.98, parole latine 90%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00108562/manifest (pagina 8)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00108562_00008/full/!2000,3200/0/default.jpg
- Estratto: «erat dragina decima perdita et est in / atus ante secula dei filius / Per quiin fit machina celi»

### 34. MS. Laud Lat. 37 (Bodleian Library, Oxford)

- Titolo nel catalogo: Sammelhandschrift; datazione: Ende 12. Jh. (Teil A); um 1400 (Teil B)
- Scelto perché: codice composito. Esito: sospetto (4 pagine sospette su 5 leggibili)
- Pagina 237 (fol. 112r): confidenza 0.97, parole latine 85%, corrispondenza con testi noti 0%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/bodleian_mslaudlat37/manifest.json (pagina 237)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/5fc83512-9624-4463-9916-2e02e971ca80/full/!2000,3200/0/default.jpg
- Estratto: «totꝰ eburnes . excitant. Iacinctꝰ / liis columne Mar nec totꝰ saphi enĩ aeruis est / rinꝰ. Saphyrꝰ sublimitatẽ celestiũ»

### 35. Hdschr. 140 (Staatsbibliothek zu Berlin, Berlin)

- Titolo nel catalogo: Manipulus Florum (Fragment); datazione: 1300
- Scelto perché: frammento. Esito: sospetto (6 pagine sospette su 8 leggibili)
- Pagina 23 (12r [23]): confidenza 0.97, parole latine 90%, corrispondenza con testi noti 3%
- Manifesto: https://content.staatsbibliothek-berlin.de/dc/PPN1671763386/manifest (pagina 23)
- Immagine: https://content.staatsbibliothek-berlin.de/dc/1671763386-0023/full/full/0/default.jpg
- Estratto: «fortasse uix sufficit ⁊ qͦt regẽdis / sb̾ditis p̾ẽ reddẽde apd̾ eñ rõuis / tp̃re. ut iͣ dicã tot salꝰ aĩas h. ggͣ.»

### 36. MS. Laud Misc. 37 (Bodleian Library, Oxford)

- Titolo nel catalogo: Theological composite manuscript; datazione: 13th century, first half
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 24 (fol. 9v): confidenza 0.97, parole latine 90%, corrispondenza con testi noti 2%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/8fa8b7f7-7103-4073-b1e7-039458400ed8.json (pagina 24)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/ed4a3de0-9001-424a-a2a2-ff407759f2a4/full/2000,/0/default.jpg
- Estratto: «dẽ. Oꝑat᷑. ñ ad ꝯm̃dacõe ꝙ hũc libm ꝯposuit ultimũ. Primũ.n. ꝯpo / suit librũ ꝓu̾bioꝵ ad instructõne pueroꝵ. Postea uͦ eccłiasten ad in»

### 37. B VII 29 (Universitätsbibliothek, Basel)

- Titolo nel catalogo: De exterioris et interioris hominis compositione (aliaque ascetica, monastica sim.); datazione: 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 204 (101v): confidenza 0.97, parole latine 89%, corrispondenza con testi noti 1%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/ubb_bvii29/manifest.json (pagina 204)
- Immagine: https://www.e-manuscripta.ch/bau/i3f/v20/3567395/full/!2000,3200/0/default.jpg
- Estratto: «ua qͥdã ⁊ ĩ effabłi gaudio letificarẽt. / Igit᷑ opto ⁊ ex toto corde desido. ut / orbes planetaꝵ at celũ sydeũ lĩpi»

### 38. Cod. Sang. 1397.16 (Stiftsbibliothek, St. Gallen)

- Titolo nel catalogo: 16th folder of the fragment collection Cod. Sang. 1397: Liturgical Fragments; datazione: 9th c. – 14th/15th c.
- Scelto perché: frammento. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 15 (11): confidenza 0.97, parole latine 89%, corrispondenza con testi noti 1%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/csg-1397.16/manifest.json (pagina 15)
- Immagine: https://media.e-codices.ch/iip/csg/csg-1397-16/csg-1397-16_0011.jp2/full/2000,/0/default.jpg
- Estratto: «& nihil reman serit sabbatum erit: XIII. ITEM ALIUD ARGU / NENII BE HAC EADEM RATIONE EST. / ⁊iuis scire quota sit feria inuna quaq die datarum ꝑ totũ annum»

### 39. Ms 1157 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Medizinische Sammelhandschrift; datazione: 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 4 (1v): confidenza 0.95, parole latine 80%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000035387/manifest.json (pagina 4)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0353/0000035387/00000004.jpx/full/2000,/0/default.jpg
- Estratto: «fr̃atis q̃ ÷ ĩ re eqͣli. postꝙͣ rͥ eqͣł tałias tanta ẽ ꝙͣ ta frĩas ip̃iꝰ / ⁊ ⁊̃ ꝑs media ex imaqͣq eaꝵ sic̃ dixiꝰ. Est gͦ ĩ aug ͭ ͦ p ꝙͣtitas / caloris. ꝑs pꝰ incegͣ. fr̃ĩtas w̾ ꝙͣtitas medie ͭ ͥ cllors qͥ  ĩ ip̃o»

### 40. Ms 1204 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Medizinische Sammelhandschrift; datazione: 14./15. Jh.
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 564 (278v): confidenza 0.97, parole latine 75%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000004423/manifest.json (pagina 564)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0044/0000004423/00000564.jpx/full/full/0/default.jpg
- Estratto: «moderi sũ cello nõ muniĩ / ñ ẽ det̾mẽtũ. Dũ luna fu / erit in geniss nuillũ medi»

### 41. Ms 792 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologische Sammelhandschrift, lat. und dt. ; Theologische Sammelhandschrift , lat.; datazione: 13. Jh. ; 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 286 (142v): confidenza 0.97, parole latine 84%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000005119/manifest.json (pagina 286)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0051/0000005119/00000286.jpx/full/2000,/0/default.jpg
- Estratto: «annis. Dĩt aũ glo. suꝑ eund̃ locũ. Mͥ. post bella. fam̃ t̾re motũ: ⁊cͥ bre / uiis subsequetur par. ut fideles probentur. antnͣsactis malis. sꝑent»

### 42. Plut. 10 dex.8 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Postilla super Ioannem et Expositio super Hieremiae Threnos; datazione: 1357
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 12 (Carta: 1v): confidenza 0.96, parole latine 82%, corrispondenza con testi noti 1%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:218914/manifest.json (pagina 12)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:218691/full/2000,/0/default.jpg
- Estratto: «os nõ ꝯminuetis exeo ꝙcͣ. Exꝗꝰ ⁊ ex / aliis ꝯsiłibꝰ p ꝙ uocẽ hꝰ tonitrui oͥ ẽẽ / fcã ĩlege ⁊ ꝓpħis ⁊ ĩ pr̃m dsid̾niis et»

### 43. Msc.Can.9 (Staatsbibliothek Bamberg, Bamberg)

- Titolo nel catalogo: Collectio Canonum (ex collectione XII partium excerpta) - Legis Baiuvariorum Fragmentum · Leodiensium epistola adversus Paschalem papam · T…; datazione: 10. Jh.
- Scelto perché: frammento; miscellanea. Esito: misto (6 pagine sospette su 8 leggibili)
- Pagina 5 (2r (0005)): confidenza 0.97, parole latine 90%, corrispondenza con testi noti 2%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00140702/manifest (pagina 5)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140702_00005/full/!2000,3200/0/default.jpg
- Estratto: «ipsos. s cõmissas plebes uisitant. / .xUII. Ut nullus in uicus ordinet᷑ ep̃s. Si eps parrochia suã uisitare xxxiiii. / xUIII.. De epo qui est ordinatꝰ ad eccłao nequerit. uiros probabiles»

### 44. Clm 19486 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Fragmenta poematis 'Ruodlieb', quae Schmellerus edidit in 'Lateinische Gedichte'; datazione: 10. - 11. Jh.
- Scelto perché: frammento. Esito: sospetto (4 pagine sospette su 5 leggibili)
- Pagina 4 ((0004)): confidenza 0.97, parole latine 76%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00105818/manifest (pagina 4)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00105818_00004/full/full/0/default.jpg
- Estratto: «Inponendo manũ stans que signat beneo / Quos det dilectis c̃sanguineis & amici / Ad congaudendõ mos ẽ uelut hune fore»

### 45. MS. Rawl. B. 486 (Bodleian Library, Oxford)

- Titolo nel catalogo: Roman martyrology (fragment), with added obits for the Augustinian abbey of Navan, Co. Meath.; datazione: ?
- Scelto perché: frammento. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 1 (fol. 016r): confidenza 0.96, parole latine 81%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/f96b14f9-ca06-487a-8f80-ebe491008f85.json (pagina 1)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/940a7c50-73ba-4a8e-ae02-402530eeb648/full/2000,/0/default.jpg
- Estratto: «hãuis serapionis ⁊ petri. Eodẽ die: natalis sc̃oꝵ georgii. / diaconi. aurelii. felicis. nathalie ⁊ liliose. quoꝵ pͥmus / mire abstinencie monachus ab ierosolimis cordubã»

### 46. Voss. Lat. F. 4 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, three parts (Latin); datazione: France, northern part, 9th century, last quarterBritish Isles ; England ; 8th century, first halfFrance ; Paris?, 13th century, second half
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 88 (088 - f037r): confidenza 0.95, parole latine 81%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:4237734/manifest (pagina 88)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRjIvMUQvQTMvOTIvMUYvMzcvNzgvOEEvRTEvQzcvNzIvODkvQzIvRTAvM0YvM0QvMTg4N18xX2l0ZW1fNDIzNzczNF8wODguanAyIiwicmVwX2lkIjoiMTI1MjQwMjc4ODAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjM2MTIiLCJoZWlnaHQiOiI1MjEwIiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9/full/2000,/0/default.jpg
- Estratto: «riam cũ bachide inito federe alexandro ei sacerdo / cium conferenti opem ferens. post etiã demetrio ⁊ / anthiocho adolescenti. a triphone in dolo ligatꝰ est»

### 47. Hs I 16 (Wissenschaftliche Stadtbibliothek Mainz, Mainz)

- Titolo nel catalogo: Sammelhandschrift; datazione: um 1400
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 5 (1v): confidenza 0.95, parole latine 71%, corrispondenza con testi noti 0%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/mzstb_hs_i_16/manifest.json (pagina 5)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_16%3Amzstb_hs_i_16_001v.jpg/full/!2000,3200/0/default.jpg
- Estratto: «licec ingouoiẽt ⁊ blasphemẽt d̾i suit / ad lande dei eiusꝙꝓ baitas ꝑ cor maliꝰ / oñ dac᷑ ¶Ca Iu  ͥ ꝙ nõ iõ hot gaude di»

### 48. Ms 277 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologische Sammelhandschrift; datazione: 15. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 9 leggibili)
- Pagina 5 (2r): confidenza 0.97, parole latine 78%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000006738/manifest.json (pagina 5)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0067/0000006738/00000005.jpx/full/2000,/0/default.jpg
- Estratto: «iõmi uitã et ulutẽ pem̾tꝰ iguorare cũ sibi sottꝰ / extiter̃ młto tꝑe if teste qnͣ obtam ĩ effabilis uiri sc̃i / tatem si uoluissem tace nõ potuissem. ꝯfiteant᷑ et im̾a»

### 49. Ms 1257 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Philosophisch-rhetorische Sammelhandschrift; datazione: 15. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 510 (253v): confidenza 0.97, parole latine 78%, corrispondenza con testi noti 2%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000050282/manifest.json (pagina 510)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0502/0000050282/00000510.jpx/full/2000,/0/default.jpg
- Estratto: «tũsiuissio ui ⁊ hic quoq esse ꝯuiaͦ qued / ꝯyenens ⁊ qualia ⁊ quq̃ dice audire q or dr̃t / aut̃ in talibus diceͣ aut talia oudire Constat uo̾»

### 50. Clm 2605 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Commentarius Anonymi (an Anselmi, cuius commentum sequitur?) in Cantica Canticorum; datazione: 13. Jh.
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (4 pagine sospette su 5 leggibili)
- Pagina 287 ((0287)): confidenza 0.98, parole latine 92%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00107550/manifest (pagina 287)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00107550_00287/full/full/0/default.jpg
- Estratto: «ql̃ mendaces nos facit illꝰ ꝓmissionis quam / facimus deo inbaptismate: ub abrenuntia / mus satane ⁊ oꝑib eiꝰ ñ intrabit ilła euitate»

### 51. Clm 4727 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Tractatus de superstitionibus. Fol. 79 Anonymi Breviloquium animi cuiuslibet religiosi reformativum. Inc. Prima regula est. Fol. 132v Liber…; datazione: 1459
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 226 ((0226)): confidenza 0.96, parole latine 82%, corrispondenza con testi noti 2%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00163956/manifest (pagina 226)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00163956_00226/full/full/0/default.jpg
- Estratto: «ꝑmod ꝯpassiũe denũ coationis/ / Debitis semꝑ obẜuatis orcũstan / ciis Ande ⁊riẜu Nõ opt in ꝙr»

### 52. Ed.vet.perg.13, Spiegel vorn/hinten (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologischer Text über die Taufe (Fragm.); datazione: 15. Jh.
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 2 ([2r]): confidenza 0.96, parole latine 76%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000028913/manifest.json (pagina 2)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0289/0000028913/00000002.jpx/full/full/0/default.jpg
- Estratto: «qd legalia statĩ pꝯͣ passio y/ ꝙ^ ad illos/ ad quol / grã notu testi ͭ ͥ maĩ feste diułgata eat/ fuerut mor / tifeã s apłos qͣdã pia dispẽsaᵈ ͤ huis usos fuisse»

### 53. Voss. Lat. Q. 55 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, two parts (Latin): 1. (ff. 1-28) Vita Ludgeri / Altfridus of Münster, and other text(s). - 2. (ff. 30-59) Cartularium…; datazione: German regions ; Werden Abbey?, 11th century, last quarter (after 1085)German regions ; Werden Abbey, 9th century, c. 900
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 33 (33 - f024v-025r): confidenza 0.98, parole latine 89%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:4155559/manifest (pagina 33)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRTQvODMvN0IvOTIvNzcvNjYvNkYvNDMvQTUvNjYvMjAvNDYvNTAvMjgvMzcvRDEvMTg4N18xX2l0ZW1fNDE1NTU1OV8zMy5qcDIiLCJyZXBfaWQiOiIxMjUyNDk1MTIwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiNTYxNyIsImhlaWdodCI6IjQwNTgiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «cognouit: & paulisper quasi prohorȩ inspectione sub / stitit. Deinde tabernaculũ ingressus. Crursus exit / Sed cundem itrruni clericus. quem diximus pedetemtmi.»

### 54. A VII 17 (Universitätsbibliothek, Basel)

- Titolo nel catalogo: Composite volume with theological texts and Palladius; datazione: 12th-14th century
- Scelto perché: codice composito. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 7 (2r): confidenza 0.98, parole latine 90%, corrispondenza con testi noti 1%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/ubb-A-VII-0017/manifest.json (pagina 7)
- Immagine: https://media.e-codices.ch/iip/ubb/ubb-A-VII-0017/ubb-A-VII-0017_0002r.jp2/full/2000,/0/default.jpg
- Estratto: «ui sexta hora diei sexta feria ebdõmade. Adã ob / dormiit ut de costa illiꝰ fieret eua. ap̾c mn orte / sopitꝰ ÷ ut de sangume eiꝰ redimet᷑ eccła. Adam»

### 55. Hs I 343 (Wissenschaftliche Stadtbibliothek Mainz, Mainz)

- Titolo nel catalogo: Theologsiche Sammelhandschrift; datazione: 13. und 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 270 (132v): confidenza 0.96, parole latine 68%, corrispondenza con testi noti 3%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/mzstb_hs_i_343/manifest.json (pagina 270)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_343%3Amzstb_hs_i_343_132v.jpg/full/full/0/default.jpg
- Estratto: «głarit̾ ergo ꝑtẽ iuarthe / ꝑegic. Singlr̃ optimã ma / licita. n iã ñ ef ur mi»

### 56. Plut. 73.19 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Liber de alimentis incerti auctoris . Adde Librum remediorum, speculum medicinae, ac de medicinis laxativis incerti auctoris; datazione: 1201-1300
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 9 (Carta: 1r): confidenza 0.97, parole latine 75%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:1228041/manifest.json (pagina 9)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:1227955/full/full/0/default.jpg
- Estratto: «Soloris exterius cerei. ĩteriꝰ uͦ albi. suꝑficie lene. ⁊ lucidum. Alterũ / rarum ⁊ leue. fr̃agi facile ĩteriora eiꝰ albissima. ⁊ suꝑficies ñ leuis Euiꝰ qd̃»

### 57. Clm 29890(L2 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Passio S. Laurentii, Agopiti et Jacobi (Fragment); datazione: 12. Jh.
- Scelto perché: frammento. Esito: sospetto (4 pagine sospette su 4 leggibili)
- Pagina 4 ((0004)): confidenza 0.96, parole latine 72%, corrispondenza con testi noti 0%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00026304/manifest (pagina 4)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00026304_00004/full/!2000,3200/0/default.jpg
- Estratto: «deputatũ leni penitentia subdere . S: hełu ĩlacte matͥs ñ / coqͥmꝰ. si nos in flagitus ꝑditos. asꝑis ⁊ duris penis afficimꝰ. / In ititũ nãꝙ carnis satane tradi iubem̃. ut spũ ĩdie dñi suluent.»

### 58. MS. Digby 77 (Bodleian Library, Oxford)

- Titolo nel catalogo: Composite manuscript of scientific, theological and philosophical texts; datazione: 13th century, second half - 15th century
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 248 (fol. 118v): confidenza 0.95, parole latine 77%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/23b86c4f-0d76-4e5e-8449-38a24da5b3a7.json (pagina 248)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/fb8ee75b-a80a-4997-9760-b1a307144319/full/2000,/0/default.jpg
- Estratto: «amorẽ. qr uͥ amor iͥ ocls. bñ ocl̃os suos in capite x statue̾at ꝓph̃a oe / qui dicebat. ocl̃i ñ sõꝑ ad dñm. intellectꝰ ĩ i c ĩ x ͦ stare ut ĩspao»

### 59. Clm 2712 (Bayerische Staatsbibliothek, München)

- Titolo nel catalogo: Anonymi commentarius in libros Regum. Incipit: 'Rectoribus populi has virtutes esse necessarias. misericordiam, iusticiam, sapientiam et hu…; datazione: 14. Jh.
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 278 ((0278)): confidenza 0.98, parole latine 86%, corrispondenza con testi noti 1%
- Manifesto: https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb00134624/manifest (pagina 278)
- Immagine: https://api.digitale-sammlungen.de/iiif/image/v2/bsb00134624_00278/full/full/0/default.jpg
- Estratto: «uerit incertamĩe. s fient nouissima / peioia priorib. quicum enim se / erui adyabli potestate desiderat»

### 60. Voss. Lat. F. 75 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, two parts (Latin, French); datazione: British Isles ; England, 15th century, midBritish Isles ; England, 14th century, last quarter
- Scelto perché: codice composito. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 91 (091 - f041r): confidenza 0.98, parole latine 86%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:4226444/manifest (pagina 91)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvN0EvRkQvNkMvMUEvRTgvQUIvNDMvNDMvNUMvNjUvNUIvRDcvNDMvMUQvOTIvMDUvMTg4N18xX2l0ZW1fNDIyNjQ0NF8wOTEuanAyIiwicmVwX2lkIjoiMTI1MjQwMjczOTAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjM0NDYiLCJoZWlnaHQiOiI0ODk4Iiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9/full/2000,/0/default.jpg
- Estratto: «are illus uͥ est insula zipangu Cuibꝰ melioris esse / occeanũ est et dicit᷑ mare Cyn hoc est mare mangi quia / piũcia mangi est in litoribꝰ eius ¶ Iu hoc mare ubi est zipan»

Gli altri 270 sospetti sono in `sospetti.json`.

## Come è stata fatta

- **Scelta** (`codici.json`, con il motivo per ciascuno): 500 codici in latino senza autori né opere riconosciuti, tra VI e XV secolo, con titolo generico (frammenti, maculature, palinsesti, compositi, miscellanee, anonimi). Biblioteche: BSB e Bamberga, Heidelberg, e-codices, Berlino, Bodleian, Laurenziana, Leida, Lipsia, Penn, Auckland. Escluse la Vaticana (anche attraverso Heidelberg), Yale (robots.txt vieta i manifesti), loc e nlg (senza servizio Image), Ambrosiana (condizioni d'uso), Gallica (limiti stretti) e DS (aggregatore).
- **Pagine**: fino a 10 per codice (prime, centrali e ultime pagine scritte, fogli di guardia se riconoscibili; coperte, tagli e scale di colore saltati), a 2000 px di larghezza dall'IIIF Image API; una richiesta alla volta per biblioteca, almeno 1 secondo di pausa (1,5 per CONTENTdm, che chiede Crawl-Delay 1), di più se il server lo chiede. Le immagini non sono state salvate.
- **Lettura**: Kraken 5.3 con la segmentazione di base (blla) e il modello CATMuS Medieval 1.6.0 (Zenodo 10.5281/zenodo.21488839, licenza CC BY 4.0), trascrizione grafematica con abbreviazioni non sciolte.
- **Confronto**: corpora aperti PerseusDL canonical-latinLit (CC BY-SA 4.0), CSEL di OpenGreekAndLatin (CC BY-SA 4.0), Patrologia Latina di OpenGreekAndLatin (voll. 3-85, CC BY-SA 4.0) e Vulgata (pubblico dominio). Si confrontano sequenze di sei parole ridotte alle prime due lettere, dopo aver uniformato u/v, i/j, ae/e, h: le abbreviazioni medievali tagliano l'interno e la fine delle parole, quasi mai l'inizio. Alla quota trovata si toglie quella che si ottiene con le stesse parole mescolate a caso (di solito 0-2%).
- **Soglie**: pagina vuota sotto 120 caratteri; in volgare se le parole funzionali volgari (und, der, the, and...) superano le latine (et, in, est, quod...); non leggibile se la confidenza media è sotto 0,80, se meno del 55% delle parole intere sono latino noto o se mancano le parole funzionali latine; identificata dall'8% di corrispondenza netta in su; sospetta sotto il 3%.

## Limiti (da leggere prima di fidarsi dei sospetti)

- I corpora aperti coprono classici, Bibbia, CSEL e la Patrologia Latina fino all'VIII secolo circa: mancano la liturgia (messali, breviari, antifonari), il diritto canonico e civile, la scolastica, la medicina, l'astronomia e quasi tutto il latino dopo il IX secolo. Molti «sospetti» sono quindi testi noti ma assenti dai corpora.
- La lettura automatica è buona sulle minuscole librarie ordinate, debole su corsive, glosse fitte, notazione musicale, pagine rovinate e palinsesti (il testo di sotto non si legge con le immagini normali).
- Note moderne (cartellini, descrizioni a mano dei bibliotecari) possono passare per latino leggibile.
- La confidenza di Kraken con CATMuS è alta anche su letture sbagliate: per questo conta anche la quota di parole latine.

## File

- `codici.json`: i 500 codici scelti, con il motivo della scelta.
- `risultati-codici.csv`: esito per codice.
- `pagine.csv`: per codice e pagina, confidenza media, quota di latino, quota riconosciuta (lorda, del caso, netta) e fonte trovata.
- `sospetti.json`: i sospetti con l'estratto breve.
- `riepilogo.json`: i numeri di questo rapporto.

Nessuna trascrizione completa è pubblicata: le letture intere sono rimaste negli artefatti temporanei dell'esecuzione, cancellati alla fine.
