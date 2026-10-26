# Prova di lettura automatica dei codici latini «sospetti» (ottobre 2026)

Prova pilota gratuita: Kraken (riconoscimento della scrittura a mano, open source) ha letto poche pagine di ciascun codice; le letture sono state confrontate con testi latini noti e aperti, per capire se la lettura automatica può segnalare codici che forse contengono testi non identificati.

Esecuzione: https://github.com/grecolatinovivo-create/emendando-catalogo/actions/runs/40237809680

## In breve

- Codici scelti: 500; codici letti: **430**.
- Pagine lette: 3137 (vuote o quasi: 867; non leggibili: 503; in volgare: 179; riconosciute: 210; incerte: 134; sospette: 1161; errori: 83).
- Codici **non leggibili** (nessuna pagina letta bene): **91** (di cui 41 per errori di rete o di manifesto).
- Codici in un'altra lingua (volgare) nelle pagine lette: 20.
- Codici **identificati** (le pagine lette corrispondono a testi noti): **48**; misti (alcune pagine note, altre no): 32.
- Codici **sospetti** (latino letto bene ma nessuna corrispondenza): **238**; incerti: 1.
- Tempo di calcolo: 21.3 ore di lettura (somma dei processi); 17.1 ore di job su GitHub Actions in tutto, il più lungo 317 minuti.

## Con che cosa sono stati identificati

- Vulgata: 36
- Patrologia Latina, vol. 17, S. Sebastianus martyres animat.: 1
- Patrologia Latina, vol. 72, XXIII. INCIPIT CANON ACTIONIS.: 1
- Patrologia Latina, vol. 78, (894) Orationes ad visitandum infirmum.: 1
- Patrologia Latina, vol. 57, ARGUMENTUM. — Sancti martyres cruciatus cruentam­ que mortem pro Christo fortiter tolerant: 1
- CSEL: Hilary, Saint, Bishop of Poitiers, Tractatus super psalmos: 1
- Patrologia Latina, vol. 17, CAPUT XIII.: 1
- Perseus: De vita Hadriani: 1
- Patrologia Latina, vol. 76, IBID. - Æstimabit abyssum quasi senescentem.: 1
- Patrologia Latina, vol. 83, De diebus.: 1
- CSEL: Augustine, De Civitate Dei: 1
- Patrologia Latina, vol. 77, Quomodo admonendi qui jurgia serunt, et pacifici.: 1
- Patrologia Latina, vol. 67, De his qui cum sunt ex alia provincia, in aliis audent ordinationes efficere.: 1
- Patrologia Latina, vol. 67, De his qui in plebes, quas ad se putant pertinere, in­ conventis his a quibus tenentur, ir: 1
- Patrologia Latina, vol. 66, CAPUT LXXII: 1
- Patrologia Latina, vol. 16, HYMNUS XII.: 1
- Patrologia Latina, vol. 16, De temperantia et præcipuis ejus partibus, nimirum animi tranquillitate ac moderatione, ho: 1
- CSEL: Proba, active 4th century, Cento: 1
- Patrologia Latina, vol. 76, LECTIO S. EVANG. SEC. JOAN. XV, 12-16.: 1
- Patrologia Latina, vol. 40, COGNITIO VITÆ, SEU DE COGNITIONE VERÆ VITÆ LIBER UNUS.: 1
- Patrologia Latina, vol. 37, De tecunda parte Psalmi.: 1
- Patrologia Latina, vol. 66, CAPUT IV.: 1
- Patrologia Latina, vol. 68, Duobus euntibus in castellum apparuit Jesus.: 1
- Patrologia Latina, vol. 55, Consecratio presbyteri.: 1
- Patrologia Latina, vol. 57, ARGUMENTUM. — De muliebri usitato ad decipiendum sexu; de Adamo ab Eva, de Petro ab ostiar: 1

## Sospetti, ordinati per interesse

Interesse = qualità della lettura (confidenza e quota di parole latine) × quantità di testo × numero di pagine senza corrispondenza, con un piccolo vantaggio per palinsesti, maculature e testi dichiarati non identificati. «Pagina» è il numero dell'immagine nel manifesto (canvas). Gli estratti sono la lettura automatica grezza, con le abbreviazioni non sciolte e gli errori della macchina.

### 1. Ms. 139 (Couvent des Cordeliers/Franziskanerkloster, Fribourg/Freiburg)

- Titolo nel catalogo: Collection of anonymous sermons; datazione: before 1432
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 95 (47r): confidenza 0.96, parole latine 90%, corrispondenza con testi noti 0%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/fcc-0139/manifest.json (pagina 95)
- Immagine: https://media.e-codices.ch/iip/fcc/fcc-0139/fcc-0139_047r.jp2/full/2000,/0/default.jpg
- Estratto: «ĩ. re̾.G. ꝯfusic̃e nõ sũt ꝯfusi. aerubesc̾e̾ aħ est ꝙ ꝓmittit᷑ aĩe iã nobilitate ꝑ lu / nesierũt. cꝰ roepoĩt. Io. dilexerũt ĩ m̃gͤ. tob̾. ułt luce spe splõdida fulgebis»

### 2. Plut. 73.34 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Incerti auctoris De tuenda sanitate . Seu potius Bernardi Tornii Liber de tuenda sanitate; datazione: 1401-1500
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 185 (Carta: 90r): confidenza 0.98, parole latine 90%, corrispondenza con testi noti 1%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:1231442/manifest.json (pagina 185)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:1231436/full/2000,/0/default.jpg
- Estratto: «ledit: quia cito in coleram conuertit᷑. In zucharo est / uirtus aperiendi opilationes: & soluendi uentrem: et / potissime rubeum soluit & lenit naturã. Et zuchaꝵ»

### 3. Plut. 31 dex.3 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Primus Scoti super Sententias, Gothefridi et Anonymi Quaestiones; datazione: 1201-1300; 1301-1400
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 142 (Carta: 67v): confidenza 0.95, parole latine 90%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:612011/manifest.json (pagina 142)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:611808/full/2000,/0/default.jpg
- Estratto: «ab ipã cãtõe pͥ q̃ simi ͭ ꝯtingułẽ ¶ 2 ꝑs .ẜ. d nccͣi ͭ ͤ / s ꝙ p qr młte cae̾ nles p ͫ ẽ exꝑte eaꝵ ñ possũt / ñ care effcũs ⁊ iõ nccͣuas ẽ ẜ ꝙͥ ꝙ.ĩ. ẽ exꝑte eaꝵ»

### 4. Plut. 90 sup.46 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Ant. Panormitae Epistolae, Francisci Petrarchae, Oliverii card. neapolitani, et anonymi quaedam; datazione: 1487-08-22
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 71 (Carta: 32r): confidenza 0.98, parole latine 98%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:1047429/manifest.json (pagina 71)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:1047324/full/2000,/0/default.jpg
- Estratto: «etiam in nos propagare uoluistis humanitate incredibili. / N obis aũt ut aliquando excellentia uestra illius manda / tum intelligat: moriens praecepit. Uti uos patris loco susci-¬»

### 5. Plut. 3.7 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Rabii Samuelis De adventu messiae . R. Samuelis De adventu messiae, Nicolai Lyrae Contra Iudaeos. In evangelium Matthaei anonymi. Francisci…; datazione: 1401-1500
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 9 (Carta: 1r): confidenza 0.97, parole latine 88%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:300028/manifest.json (pagina 9)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:299671/full/full/0/default.jpg
- Estratto: «G. Quid sit illud pectatũ ꝑꝑ qd̾ iudei sũt in cap̃titate ista / A. Qxͦ iustus ille uenditus ꝓ argẽto sit ihũs d̾s xp̃ianorũ / S Cͦ post occisionẽ xpp̃i fr̃a fuit disꝑsio xi iud̾orũ ut appr»

### 6. Plut. 68.19 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Appiani Alexandrini Historia Publio Candido interprete . Ac praeterea Anonymi Compendium historiae ab excessu Constantini usque ad Ioannem…; datazione: 1491-1500
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 260 (Carta: 126v): confidenza 0.98, parole latine 95%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:1341249/manifest.json (pagina 260)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:1340864/full/2000,/0/default.jpg
- Estratto: «biturum dicens in pergamum rediit: & ad Esculapii / templum profectus ensem sibi intulit. Cum uulnus / minus alte impressum ẽẽt iussit seruum qui una ade»

### 7. Plut. 9 dex.9 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Postillae super partem Psalterii et super I et II Esdrae; datazione: 1301-1310
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 62 (Carta: 25v): confidenza 0.97, parole latine 91%, corrispondenza con testi noti 2%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:274749/manifest.json (pagina 62)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:274668/full/2000,/0/default.jpg
- Estratto: «giat . suꝑ qͥntã. ut eã p̾caueat. Quinqͥꝑtita / quoq ÷ dies in ala. dies poc̾i. dies diaboli. di / es mundi. dies hõis. dies dñ̾i. dies pcc̃i ⁊ ꝑ»

### 8. Cod. Bodmer 77 (Fondation Martin Bodmer, Cologny)

- Titolo nel catalogo: Guido Aretinus, Micrologus; Prologus in Antiphonarium; De ignoto cantu; Regulae rhythmicae; datazione: 12th century
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 94 (44v): confidenza 0.98, parole latine 79%, corrispondenza con testi noti 0%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/fmb-cb-0077/manifest.json (pagina 94)
- Immagine: https://media.e-codices.ch/iip/fmb/fmb-cb-0077/fmb-cb-0077_044v.jp2/full/2000,/0/default.jpg
- Estratto: «e uidert qd ipsa pͥma hac ꝑhoc / & alie conti nue uoces duos abeat / tonos. Ut pote. Trima siea semit»

### 9. Ms. Codex 701 (University of Pennsylvania Libraries, Kislak Center, Philadelphia)

- Titolo nel catalogo: [Astronomical fragments]; datazione: 1200
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 24 (8v): confidenza 0.95, parole latine 96%, corrispondenza con testi noti 0%
- Manifesto: https://digitalrepository.library.upenn.edu/iiif/2/items/c1367621-b3bc-4815-9cd3-94b19b73c4a6/manifest (pagina 24)
- Immagine: https://iiif-images.library.upenn.edu/iiif/2/be433e4d-77ca-423b-888b-162aff7a6018/full/2000,/0/default.jpg
- Estratto: «ħ uobłm poͣ. det̾iẽt ħ u̾b ge .fͣ.z. St̃ aliĩ qͥ / re pͥmã pͦnẽ dꝰ ãbiguã scł hãc. d̾s po. fa mn. / añ oĩa tpr̃a. si.23. sic ĩtłłigat᷑ potũ fa. ꝙ mꝰ»

### 10. BPL 891 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Fragment (Latin): Computus, and other text(s); datazione: Apennine Peninsula?, 10th century, mid
- Scelto perché: frammento. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 12 (12 - f005v-006r): confidenza 0.97, parole latine 84%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3296044/manifest (pagina 12)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvNTEvMkIvMTIvNjcvMjkvNTcvMkMvMTIvQzgvM0EvOEUvRkQvNjMvOTQvNEEvODYvMTg4N18xX2l0ZW1fMzI5NjA0NF8xMi5qcDIiLCJyZXBfaWQiOiIxMjUyNTIxNTE2MDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiNDE2NyIsImhlaWdodCI6IjMxMTEiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «lauis . ẽ. hic dies ñ hab& lunȩ. qđ ñ ẽfacile ab eotẽ pr̃ / qđ h̃ duo luminasa ĩ firmam̃to cȩli. statutas nullus / dies soł sineluna fuit. & sic ĩtellegit᷑. Htestimonium»

### 11. Voss. Lat. Q. 99 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Medical miscellany: De simplicibus medicinis / Matthaeus Platearius, and other text(s); datazione: France (southern part?), 13th century, first half
- Scelto perché: miscellanea. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 7 (007 - opening4 (incl. f001r)): confidenza 0.97, parole latine 84%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:4150393/manifest (pagina 7)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRUMvMkYvQUMvRkEvOEIvRTMvQkUvMTQvMUMvNEEvNDgvNDQvOUYvNzcvQjcvMDgvMTg4N18xX2l0ZW1fNDE1MDM5M18wMDcuanAyIiwicmVwX2lkIjoiMTI1MjM2MjM4ODAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjU3NTAiLCJoZWlnaHQiOiI0NTM3Iiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9/full/2000,/0/default.jpg
- Estratto: «⁊ modicũ aromaticũ. quod aqͦdã / lignũ a loes sil uestresdicitut. / hoc autẽ plũbo sen stagno con»

### 12. MS. Canon. Misc. 476 (Bodleian Library, Oxford)

- Titolo nel catalogo: Vita gloriossime virginis Mariae atque venerabilis matris filii dei vivi veri et unici (unidentified work).; datazione: 14th century, middle
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 165 (fol. 109r): confidenza 0.98, parole latine 84%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/217de342-7b9b-4cbb-942e-a719dff3fb1d.json (pagina 165)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/04a391ed-174e-4b6c-b716-58fd69fc39f4/full/2000,/0/default.jpg
- Estratto: «decorau̾at deitatẽ cõem phuam / tatem q ui dext̾ra dei patris fuit / digne collocatus aquo numꝙͣ̃»

### 13. Cod. Haen. 9 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Juristische Sammelhandschrift (Codex Utinensis); datazione: 10. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 9 (2r): confidenza 0.98, parole latine 88%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000013826/manifest.json (pagina 9)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0138/0000013826/00000009.jpx/full/2000,/0/default.jpg
- Estratto: «Nam di aconis se uel perse / naste ris siue aecclesiis / qui cor rupit eam. puni a»

### 14. Hs I 218 (Wissenschaftliche Stadtbibliothek Mainz, Mainz)

- Titolo nel catalogo: Sammelhandschrift; datazione: Mitte 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 283 (138r): confidenza 0.97, parole latine 88%, corrispondenza con testi noti 1%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/mzstb_hs_i_218/manifest.json (pagina 283)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_218%3Amzstb_hs_i_218_138r.jpg/full/full/0/default.jpg
- Estratto: «tor. qui bonas margaritas q̃siuit ⁊ q̃rit ẽ / ipẽ d̾i filius ihx̃ xͣ qui de celis uenĩt ad t̾ / ras ut bonas q̃ ret̾ margaritas .i. p̃desti»

### 15. Plut. 29.15 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Arithmetica incerti auctoris . Adde Ioannis de Sacrobosco et magistri Ioannis de Pechebam Tractatus de Sphaera, et alia pauca astronomica; datazione: 1301-1310
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 52 (Carta: 23v): confidenza 0.96, parole latine 82%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:671599/manifest.json (pagina 52)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:671522/full/2000,/0/default.jpg
- Estratto: «Polu ¶ articũ ꝗde dr̃ abartos ꝙẽ ma᷑ ursa. ẽ n. uxͣ ursa / ma . ¶ Boreł uoͣ dr̃ qr ẽ ĩ illa ꝑte a qua ueͭ Boreas. polus / huic oppo ͭ. dr̃ antarticus.q. ꝯtͣ artt̃ poĩtus. dr̃ ⁊̃ meĩdio qr ⁊̃ ex»

### 16. A IX 8 (Universitätsbibliothek, Basel)

- Titolo nel catalogo: Scripta varia de schismate; Bindus de Senis; datazione: 14th/15th century
- Scelto perché: miscellanea. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 552 (274v): confidenza 0.97, parole latine 78%, corrispondenza con testi noti 0%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/ubb-A-IX-0008/manifest.json (pagina 552)
- Immagine: https://media.e-codices.ch/iip/ubb/ubb-A-IX-0008/ubb-A-IX-0008_0274v.jp2/full/2000,/0/default.jpg
- Estratto: «s exĩuidẽtia Nõ exiustiꝰ eqͥtatꝭ s ex displicẽtia Ex / amititia unitat nõ exprouidẽciã /  Elus ĩdist̾ta ẽ qñ nõ excai̾tate s exinuidẽtia mõ dicͭ»

### 17. Ms 1291 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Grammatisch-philosophische Sammelhandschrift; datazione: 14. Jh. ; 15. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 5 (2r): confidenza 0.96, parole latine 88%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000022499/manifest.json (pagina 5)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0224/0000022499/00000005.jpx/full/2000,/0/default.jpg
- Estratto: «id̾. Om̃is passõ ẽ illiꝰ sb̾i pͦ ĩcqͦ roꝑiꝰ / p ͦ cã ⁊ pͥnͫꝰ illiꝰ passõnis s cẽ ⁊ pͥnꝰ᷑ / hꝰ passonis q̃ ẽ ogxitas ĩ uẽiũt᷑ p ͦ ĩ»

### 18. ABL 19 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, two parts (Latin): 1 (ff. 1-3) Dialogus miraculorum / Caesarius of Heisterbach. - 2 (ff. 4-172) Summa de penitentia /…; datazione: Part 1: German regions, southwestern part, 13th century ;
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 112 (112 - f104v-105r): confidenza 0.98, parole latine 86%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3751549/manifest (pagina 112)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRDgvQ0EvM0MvRkQvMzAvQzUvMjMvODEvNzMvRTYvQzUvMUYvODIvNkYvRjgvNUQvMTg4N18xX2l0ZW1fMzc1MTU0OV8xMTIuanAyIiwicmVwX2lkIjoiMTI1MjUyMTU5NTAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjM4MjMiLCJoZWlnaHQiOiIyNzQzIiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9/full/2000,/0/default.jpg
- Estratto: «ri consueunt. ¶Designat aut̃ pallium ĩ ppͣ / ꝑ lenissimam plenitudinem potestatis ¶Im / patarthis et archiepĩs. pleniorem ꝙͣ in ep̃is»

### 19. Plut. 52.15 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Iannoctii Manetti Oratio Nicolai V Pont. Rom . Ac praeterea Poggii, Francisci de Paduanis, Leonardi Arretini, et Anonymi quaedam; datazione: 1401-1500
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 31 (Carta: 13r): confidenza 0.98, parole latine 91%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:822534/manifest.json (pagina 31)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:822488/full/2000,/0/default.jpg
- Estratto: «ouis progeniem ementius dolore uulneris obcrussau / cium corctus est se esse hoĩe fateri. Ita his nõibus uti / decet. ut nullum fastum. nullam arrogantiam. nul»

### 20. Oversize LJS 24 (University of Pennsylvania Libraries, Kislak Center, Philadelphia)

- Titolo nel catalogo: [Medical miscellany]; datazione: 1225
- Scelto perché: miscellanea. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 306 (149v): confidenza 0.97, parole latine 86%, corrispondenza con testi noti 2%
- Manifesto: https://digitalrepository.library.upenn.edu/iiif/2/items/f0b75e70-583e-4681-bbff-7e2008bd7ffb/manifest (pagina 306)
- Immagine: https://iiif-images.library.upenn.edu/iiif/2/ba5d3cf3-c1b8-4906-8b30-c4fe016d9ec7/full/2000,/0/default.jpg
- Estratto: «S dispoẽs sunt accãcia. ⁊ fłm ẽ ꝙ seꝑabi / le accidens sit ełm sb̃e mansiue. Et eiꝰ qͥ / ctixit ꝙ ip̃ sunt simnma denarii qm̃ de»

### 21. Ms 747 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Sermones anonymi de dominicis · Auctoritates; datazione: 13./14. Jh.
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 8 leggibili)
- Pagina 110 (54v): confidenza 0.97, parole latine 91%, corrispondenza con testi noti 2%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000031859/manifest.json (pagina 110)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0318/0000031859/00000110.jpx/full/2000,/0/default.jpg
- Estratto: «ysa. de achaz qui noluit pet̾e signũ ne ydola sua uilificarent᷑ ⁊ dñs exal / iaret᷑. Id tirto dnm ad ppłm ostendit. qr eoꝵ lib̾atõm ĩpediuit. Uñ sub»

### 22. Rep. II 154a (Leihgabe Leipziger Stadtbibliothek) (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Fragmentum de Syllogismis · De deriuationibus vocum; datazione: 13./14. Jh.
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 7 (2r): confidenza 0.95, parole latine 87%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000035265/manifest.json (pagina 7)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0352/0000035265/00000007.jpx/full/2000,/0/default.jpg
- Estratto: «tis. su ouã appẽtie ex ꝑte ꝯsigꝰcã fłitatis eꝑte / auͣ ur̃i cãt᷑ ħ falła eo ꝗ ĩ potẽtis sumꝰ / discue q̃ siłr dñr ⁊ nõ siłr sũ diu̾simode. Hic noͣ»

### 23. Plut. 53.11 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Francisci Novelli et Francisci Castilionensis Varia . Nec non Nicolai Tignosii et Lauri de Palatiolis; datazione: 1401-1500
- Scelto perché: miscellanea. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 142 (Carta: 68v): confidenza 0.98, parole latine 94%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:830629/manifest.json (pagina 142)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:830616/full/full/0/default.jpg
- Estratto: «In quatuor nempe partes reditus eccleslatx ĩsacͦ / sanctis decretoꝵ uoluminib diuidendos fore san / citũ est quarũ una p̾lati altera clericorũ cẽ deb»

### 24. BPL 899 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Fragment (Latin): Vocabulorum aequivoca / John Garland (?); datazione: Apennine Peninsula, 15th century
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 4 (04 - opening02 (incl. f001r)): confidenza 0.97, parole latine 88%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3465477/manifest (pagina 4)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvMjMvRUEvNjAvMEQvRTEvN0QvRjIvREYvRDYvRjUvRUUvNzQvRjQvREUvQkEvNTkvMTg4N18xX2l0ZW1fMzQ2NTQ3N18wNC5qcDIiLCJyZXBfaWQiOiIxMjUyNDgxNzYxMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzQyNiIsImhlaWdodCI6IjI1NjgiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «u̾ẽ dicas tibi sit dormitio somnus / p̃sul pͥncens dr̃ ante solu. / Qd̾ iux̃ solitu su sibi ꝗsq ratus»

### 25. BPL 2716 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, six parts (Latin): 1. (ff. 1-155) Abstractum Innocentii / Baldus de Ubaldis, and other text(s). - 2. (ff. 156-228) Su…; datazione: Part 1: German regions, 15th century, 1469 - Part 2: German regions, 15th century, third quarter - Part 3: German regions, 15th century, c. 1470 - Parts 4 and 5: German regions, 15th century, mid - Part 6: German regions, 15th century, c. 1440-1460
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 10 (010 - f002v-003r): confidenza 0.96, parole latine 83%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:1885928/manifest (pagina 10)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvNUYvQkEvNzQvMkIvNUEvNUIvQTcvMkMvMkIvNUMvQzAvQzIvN0YvQkYvQTMvM0UvMTg4N18xX2l0ZW1fMTg4NTkyOF8wMTAuanAyIiwicmVwX2lkIjoiMTI1MjUwNjQ1MjAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjU4NzciLCJoZWlnaHQiOiI0MTgyIiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9/full/2000,/0/default.jpg
- Estratto: «ABi plures habẽt ptãtem eligẽdi dbũtes pnt ꝑ colleges uocari / neo reqͥrit᷑ solempnitas ꝑemptorii uł triũ citacionũ unnca suffiͭ / et citatisuit exspectãdi ꝑ totã diẽ et seꝙ̃ti deb fieri electio deb fi-»

### 26. BPL 2429 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, four parts (Latin, Dutch): 1. (ff. 1-30) Chronographia / Johannes de Beke. - 2. (ff. 32-42) Contra Judaeos / Nicholas…; datazione: Part 1: Low Countries, northern part ; Holland, 14th century, third quarter - Parts 2-3: Low Countries, 14th century, mid - Part 4: Low Countries, 14th century
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 124 (124 - f119v-120r): confidenza 0.97, parole latine 82%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:883704/manifest (pagina 124)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvQzgvQjgvMDcvNUIvOEIvODMvMTAvQjkvQkYvQkQvMTIvNUUvMzQvRTMvNDcvNTQvMTg4N18xX2l0ZW1fODgzNzA0XzEyNC5qcDIiLCJyZXBfaWQiOiIxMjUyMzY2OTg0MDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiNTQ2NSIsImhlaWdodCI6IjM3NzMiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «Qre reforͣta ÷ pax inter flcastum et / cibꝰeis sil Techide Segi flcasto ⁊ pe / leo inceperunt cractare De regno suo ipsiꝰ acasti Rex autem dixit illis Ego iam sum»

### 27. Hs I 457 (Wissenschaftliche Stadtbibliothek Mainz, Mainz)

- Titolo nel catalogo: Juristische Sammelhandschrift; datazione: 1342; 1353; 1364
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 162 (78r): confidenza 0.97, parole latine 82%, corrispondenza con testi noti 1%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/mzstb_hs_i_457/manifest.json (pagina 162)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_457%3Amzstb_hs_i_457_078r.jpg/full/2000,/0/default.jpg
- Estratto: «uxorẽ altĩus non obedĩa. ar .xxxi. q .ii. lotharius uł / uxorem meam altĩ dimitte. quia deus eam dimicti ꝓ / hibet.xii..ui. si dominꝰ. qr ĩn matrimonio siũa lata ꝯ̃»

### 28. Voss. Lat. Q. 85 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, two parts (Latin): 1. (ff. 1-24) Commentary on Johannes de Sacrobosco's De sphaera / Hugo de Castello. - 2. (ff. 25-3…; datazione: France?, 14th century, second halfFrance, 14th century
- Scelto perché: codice composito. Esito: sospetto (9 pagine sospette su 9 leggibili)
- Pagina 11 (11 - f001v-002r): confidenza 0.93, parole latine 76%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:4152177/manifest (pagina 11)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvOEMvQkYvNUQvODIvMjQvMzQvQkYvNEQvNzQvNzEvQzEvMzQvRUYvRDYvRTUvNDMvMTg4N18xX2l0ZW1fNDE1MjE3N18xMS5qcDIiLCJyZXBfaWQiOiIxMjUyMzYyMzY0MDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiNjAzNSIsImhlaWdodCI6IjQwNTUiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «sc̃ ⁊ młta alia srͥbłia ĩecͫ adducit ¶Oxu̾etĩa / possi d̾ici ꝙħ ĩ matħ.ͥ nõ sit mot̾ nͣał etã ĩois / fac̃ li  liͣ moto rfiꝰ sitficiercorꝰ ⁊ĩ ẽĩcĩtłus»

### 29. Voss. Lat. Q. 55 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, two parts (Latin): 1. (ff. 1-28) Vita Ludgeri / Altfridus of Münster, and other text(s). - 2. (ff. 30-59) Cartularium…; datazione: German regions ; Werden Abbey?, 11th century, last quarter (after 1085)German regions ; Werden Abbey, 9th century, c. 900
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 33 (33 - f024v-025r): confidenza 0.98, parole latine 89%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:4155559/manifest (pagina 33)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRTQvODMvN0IvOTIvNzcvNjYvNkYvNDMvQTUvNjYvMjAvNDYvNTAvMjgvMzcvRDEvMTg4N18xX2l0ZW1fNDE1NTU1OV8zMy5qcDIiLCJyZXBfaWQiOiIxMjUyNDk1MTIwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiNTYxNyIsImhlaWdodCI6IjQwNTgiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «cognouit: & paulisper quasi prohorȩ inspectione sub / stitit. Deinde tabernaculũ ingressus. Crursus exit / Sed cundem itrruni clericus. quem diximus pedetemtmi.»

### 30. BPL 895 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Fragment (Latin): Contra Judeaos / Nicholas of Lyra; datazione: Apennine Peninsula, 15th century
- Scelto perché: frammento. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 13 (13 - f005v-006r): confidenza 0.97, parole latine 89%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3295959/manifest (pagina 13)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvNUYvNEMvNTYvMTAvODMvMjYvOUMvNkEvQjcvMUEvNTUvNUQvNTkvNjIvN0MvNDYvMTg4N18xX2l0ZW1fMzI5NTk1OV8xMy5qcDIiLCJyZXBfaWQiOiIxMjUyNTIxNTIwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzU2MCIsImhlaWdodCI6IjI1NjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «lus trip᷑. difficile rũpit᷑. glose hebraice sensus udet᷑ esse mi / steriu dei trmi ⁊ uni qđ nõ de facili discutit᷑. s hanc glo / sam antiquã iudei moderni ꝑuertũt retorquẽtes hanc tri»

### 31. Ms 982 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Bernardus Papiensis: Summa decretalium (Codex rescriptus); datazione: 1201
- Scelto perché: palinsesto. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 57 (27r): confidenza 0.95, parole latine 86%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000011243/manifest.json (pagina 57)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0112/0000011243/00000057.jpx/full/2000,/0/default.jpg
- Estratto: «dicã donare pͥ.u.I.e.c.iii. / bn n̾co dare pͥ.u̾.c.x.q .ii. / cq ecc̾st̾. Si młr ĩaliis casib»

### 32. ABL 1 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, two parts (Latin): 1. (ff. I-VIII) Quaestiones de juris subtilitatibus / Placentinus (?), and other text(s). - 2. (ff…; datazione: Part 1: Apennine Peninsula ; Rome?, 12th century, last quarter - Part 2: Apennine Peninsula ; Rome?, 12th century, last quarter or 13th century, first half (before 1243)
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 335 (335 - f149v): confidenza 0.94, parole latine 80%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:361373/manifest (pagina 335)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvNzAvREUvRDMvNjUvNjIvMjUvMTIvMDMvNEUvRDgvNDQvRjIvNzgvMjEvRTAvQjcvMTg4N18xX2l0ZW1fMzYxMzczXzMzNS5qcDIiLCJyZXBfaWQiOiIxMjUyNTM0NjQzMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzE5MiIsImhlaWdodCI6IjQ2NjMiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «rante bõꝵ possessione acceptã deces serit. an / matͥ noceat uidendũ. quasi bõꝵ possessore. / ⁊ puto ñ nocere. señ suus tatͥ agnastit᷑. net n»

### 33. Ms 277 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologische Sammelhandschrift; datazione: 15. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 9 leggibili)
- Pagina 5 (2r): confidenza 0.97, parole latine 78%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000006738/manifest.json (pagina 5)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0067/0000006738/00000005.jpx/full/2000,/0/default.jpg
- Estratto: «iõmi uitã et ulutẽ pem̾tꝰ iguorare cũ sibi sottꝰ / extiter̃ młto tꝑe if teste qnͣ obtam ĩ effabilis uiri sc̃i / tatem si uoluissem tace nõ potuissem. ꝯfiteant᷑ et im̾a»

### 34. BPL 1764 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Fragment (Latin): Sermones de diebus festis; datazione: France, 12th/13th century
- Scelto perché: frammento. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 10 (10 - f001v-002r): confidenza 0.97, parole latine 87%, corrispondenza con testi noti 1%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3758681/manifest (pagina 10)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvMTEvMkEvRDUvMkEvNkIvNzAvOEMvRjAvRUEvMjIvQjkvNzEvRkEvNTMvMjAvQjgvMTg4N18xX2l0ZW1fMzc1ODY4MV8xMC5qcDIiLCJyZXBfaWQiOiIxMjUyNTIxNjA5MDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY3MCIsImhlaWdodCI6IjI3MDMiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D/full/2000,/0/default.jpg
- Estratto: «ua aute demꝑalibus dextͣ cõꝑat᷑ etͥnis. / ꝑfectoꝵ tanta: Raritas uͭ ĩ fra / pͥmũ limitẽ qͥ est denariꝰ nͣ ore»

### 35. Ms 1257 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Philosophisch-rhetorische Sammelhandschrift; datazione: 15. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 510 (253v): confidenza 0.97, parole latine 78%, corrispondenza con testi noti 2%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000050282/manifest.json (pagina 510)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0502/0000050282/00000510.jpx/full/2000,/0/default.jpg
- Estratto: «tũsiuissio ui ⁊ hic quoq esse ꝯuiaͦ qued / ꝯyenens ⁊ qualia ⁊ quq̃ dice audire q or dr̃t / aut̃ in talibus diceͣ aut talia oudire Constat uo̾»

### 36. Ms 1373 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Philosophische Sammelhandschrift; datazione: 1378
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 4 (1v): confidenza 0.94, parole latine 80%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000004106/manifest.json (pagina 4)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0041/0000004106/00000004.jpx/full/2000,/0/default.jpg
- Estratto: «ẜ ñõ fit ꝑs sb̃i qũ põi᷑ apte rot ¶3 ͫ / ppõ aff̾ ua de p̃to qui mĩo sui ͫ acceqrto / nõ trute nͥ uñu suppͭᵘ. ⁊̃ accu go aeddi ͤ»

### 37. MS. Laud Misc. 506 (Bodleian Library, Oxford)

- Titolo nel catalogo: Theological composite manuscript; datazione: 13th century, late to 14th century, middle
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 208 (fol. 102v): confidenza 0.97, parole latine 87%, corrispondenza con testi noti 3%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/4a167112-db1a-46f1-a545-829e82a7830a.json (pagina 208)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/3913cf52-01ee-4485-befd-97c5181c4358/full/2000,/0/default.jpg
- Estratto: «qui contumeliis afficiũt corꝑa sua .Ro. / i. s ħ tałutũ multiplicat qui tͥbulõi / bus exponit .i. cor .r. seminat᷑ corpꝰ»

### 38. Ms 1212 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Medizinische Sammelhandschrift; datazione: 12. oder 13. Jh.
- Scelto perché: codice composito. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 187 (93r): confidenza 0.97, parole latine 77%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000012387/manifest.json (pagina 187)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0123/0000012387/00000187.jpx/full/2000,/0/default.jpg
- Estratto: «Albugo oui ponat᷑ ut insimilitudinẽ / mellis ĩiuscet᷑. Depilis leporis quanty / oporteat. hec medicina fluenti uene»

### 39. MS 235 (Fragments 14, 41, & 42) (St John's College, Oxford)

- Titolo nel catalogo: Text on sacraments and their administration (binding fragments); datazione: Between 1340 and 1360
- Scelto perché: maculatura o frammento di legatura; frammento. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 6 (Fragment 42 verso): confidenza 0.97, parole latine 82%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/c730f71e-4f6c-49d3-a553-1ea260766273.json (pagina 6)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/100d8442-2c49-4884-b598-b894f8f07150/full/2000,/0/default.jpg
- Estratto: «fiłr sou̾e int̾ẽe uł ad aliam penã ẜ sr̾ioris / arbitũ exũicati. q̃m indebite fatigauit. uisi / forsan ⁊ ip̃m ꝓbabłis ertor excuset hex ꝯĩa ĩ»

### 40. Ed.vet.perg.13, Spiegel vorn/hinten (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologischer Text über die Taufe (Fragm.); datazione: 15. Jh.
- Scelto perché: frammento. Esito: sospetto (8 pagine sospette su 8 leggibili)
- Pagina 2 ([2r]): confidenza 0.96, parole latine 76%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000028913/manifest.json (pagina 2)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0289/0000028913/00000002.jpx/full/full/0/default.jpg
- Estratto: «qd legalia statĩ pꝯͣ passio y/ ꝙ^ ad illos/ ad quol / grã notu testi ͭ ͥ maĩ feste diułgata eat/ fuerut mor / tifeã s apłos qͣdã pia dispẽsaᵈ ͤ huis usos fuisse»

### 41. Plut. 83.11 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Marsilii Ficini Theologia platonica . Seu potius Argumentum in Theologiam platonica et alia opuscula; datazione: 1401-1500
- Scelto perché: miscellanea. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 186 (Carta: 88v): confidenza 0.98, parole latine 95%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:925385/manifest.json (pagina 186)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:925371/full/2000,/0/default.jpg
- Estratto: «se est ab omnibus uideatur. addunt eiꝰ / modi spum extingui nusquam: sed side / Lumen est umbra est umbra dei. Deus»

### 42. Codex 38(366) (Stiftsbibliothek, Einsiedeln)

- Titolo nel catalogo: [Anonymus], Expositio octo priorum Epistolarum S. Pauli; datazione: 10th century (second half, about 960-965)
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 8 leggibili)
- Pagina 7 (2r): confidenza 0.98, parole latine 93%, corrispondenza con testi noti 1%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/sbe-0038/manifest.json (pagina 7)
- Immagine: https://media.e-codices.ch/iip/sbe/sbe-0038/sbe-0038_002r.jp2/full/2000,/0/default.jpg
- Estratto: «neq ab homine. neq ꝓpriȩ carnis instinctui. cen / pseudo ꝓph&ȩ. sed adõ mittitur. Unde ẽ. Ecce / ego ad gentes longe positas mittã te. Illud sa»

### 43. Plut. 53.16 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Erythraeae Sibyllae vaticinium ad Danaos . Adde etiam Anonymi sermones theologici et alia; datazione: 1301-1310
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 217 (Carta: 102r): confidenza 0.96, parole latine 80%, corrispondenza con testi noti 2%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:831977/manifest.json (pagina 217)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:831668/full/2000,/0/default.jpg
- Estratto: «du ocłtanda uł diffeiẽda ꝓpt̃̾ scãdalũ / pusilloꝵ  ut dc̃tꝭ ẽi Eñ tñ ꝯsiliorꝭ / obẜuaᵈ ⁊ imploͦ oꝑu nrĩe ẜ de necessi»

### 44. BPL 31 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Composite manuscript, six parts (Latin): 1. (ff. 1-59) De casibus virorum illustrium / Giovanni Boccaccio, and other text(s). - 2. (ff. 60-…; datazione: Parts 1 and 3: German regions ; Erfurt, 15th century, 1456 - Parts 2, 5 and 6: German regions ; Erfurt, 15th century, mid - Part 4: German regions ; Erfurt, 15th century, 1457
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 9 (009 - f001v-002r): confidenza 0.97, parole latine 81%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:3129148/manifest (pagina 9)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRTkvMEUvRjAvOUQvM0MvNEEvNzIvNjMvQTEvNDYvMzEvOEQvOTAvMzkvN0EvQUMvMTg4N18xX2l0ZW1fMzEyOTE0OF8wMDkuanAyIiwicmVwX2lkIjoiMTI1MjU2ODQ3NDAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjU0OTMiLCJoZWlnaHQiOiI0MzY2Iiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9/full/2000,/0/default.jpg
- Estratto: «uideat᷑ que oportune ꝑ libros disguẽ / da sit. s ut morẽ uiatorũ seqͣnr q̃ / eciã si plate patẽcia plana iterfati»

### 45. Ms 433 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologische Sammelhandschrift; datazione: 13. Jh., Anfang
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 9 leggibili)
- Pagina 9 (2r): confidenza 0.98, parole latine 91%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000005957/manifest.json (pagina 9)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0059/0000005957/00000009.jpx/full/2000,/0/default.jpg
- Estratto: «da. Qͥnta utiq ẽ ꝯtumeliosa ⁊ scan. / dalis plena qua mali utunt᷑. q̃ simi. / lĩt est reꝓbanda. Nã quoꝵ uita de»

### 46. Plut. 90 sup.118 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Comment. in Dantis Infernum, et Purgatorium; datazione: 1301-1400
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 292 (Carta: 141v): confidenza 0.96, parole latine 77%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:933518/manifest.json (pagina 292)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:933506/full/2000,/0/default.jpg
- Estratto: «ante mortẽ tuam de istis penis mache i. ꝯͣte rimbarohłs̃ .i. cipias exꝑienciam / lagiẽte comĩco mõ dic̃ dñs Guido int̾alkas geates q̃ offarũt deũ iii pd̃o uicio etĩa»

### 47. Cod. S I 167 (Zentralbibliothek, Solothurn)

- Titolo nel catalogo: Miscellanea Computistica et Astronomica; datazione: late 14th century
- Scelto perché: miscellanea. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 7 (2r): confidenza 0.96, parole latine 81%, corrispondenza con testi noti 0%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/zbs-SI-0167/manifest.json (pagina 7)
- Immagine: https://media.e-codices.ch/iip/zbs/zbs-SI-0167/zbs-SI-0167_002r.jp2/full/2000,/0/default.jpg
- Estratto: «tũ ꝯputis plixiꝰ sceata nõ erubescens quĩa repete exquo ꝑ / seuecã uenabłem nũpͣ niuis dr ꝓ satis nõ de ⁊ 2ͫ eraciũ / Decies ĩ petita placełut Et igi motꝰ solis ⁊ l̃ne ⁊ ad sun»

### 48. Hs I 32 (Wissenschaftliche Stadtbibliothek Mainz, Mainz)

- Titolo nel catalogo: Sammelhandschrift; datazione: Anfang 15. Jh.
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 8 leggibili)
- Pagina 215 (107r): confidenza 0.97, parole latine 79%, corrispondenza con testi noti 2%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/mzstb_hs_i_32/manifest.json (pagina 215)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_32%3Amzstb_hs_i_32_107r.jpg/full/2000,/0/default.jpg
- Estratto: «dũ ⁊c s de filio liq̃t. Io. Saiorẽ car / tatẽ nemo ht̃ ut aiam sua ponat qd̃ / ꝑ amitis suis .¶ De spũ sc̃o certũ est.»

### 49. MS. Laud Misc. 37 (Bodleian Library, Oxford)

- Titolo nel catalogo: Theological composite manuscript; datazione: 13th century, first half
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 24 (fol. 9v): confidenza 0.97, parole latine 90%, corrispondenza con testi noti 2%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/8fa8b7f7-7103-4073-b1e7-039458400ed8.json (pagina 24)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/ed4a3de0-9001-424a-a2a2-ff407759f2a4/full/2000,/0/default.jpg
- Estratto: «dẽ. Oꝑat᷑. ñ ad ꝯm̃dacõe ꝙ hũc libm ꝯposuit ultimũ. Primũ.n. ꝯpo / suit librũ ꝓu̾bioꝵ ad instructõne pueroꝵ. Postea uͦ eccłiasten ad in»

### 50. Cod. Sang. 1397.16 (Stiftsbibliothek, St. Gallen)

- Titolo nel catalogo: 16th folder of the fragment collection Cod. Sang. 1397: Liturgical Fragments; datazione: 9th c. – 14th/15th c.
- Scelto perché: frammento. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 15 (11): confidenza 0.97, parole latine 89%, corrispondenza con testi noti 1%
- Manifesto: https://www.e-codices.unifr.ch/metadata/iiif/csg-1397.16/manifest.json (pagina 15)
- Immagine: https://media.e-codices.ch/iip/csg/csg-1397-16/csg-1397-16_0011.jp2/full/2000,/0/default.jpg
- Estratto: «& nihil reman serit sabbatum erit: XIII. ITEM ALIUD ARGU / NENII BE HAC EADEM RATIONE EST. / ⁊iuis scire quota sit feria inuna quaq die datarum ꝑ totũ annum»

### 51. Ms 1157 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Medizinische Sammelhandschrift; datazione: 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 4 (1v): confidenza 0.95, parole latine 80%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000035387/manifest.json (pagina 4)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0353/0000035387/00000004.jpx/full/2000,/0/default.jpg
- Estratto: «fr̃atis q̃ ÷ ĩ re eqͣli. postꝙͣ rͥ eqͣł tałias tanta ẽ ꝙͣ ta frĩas ip̃iꝰ / ⁊ ⁊̃ ꝑs media ex imaqͣq eaꝵ sic̃ dixiꝰ. Est gͦ ĩ aug ͭ ͦ p ꝙͣtitas / caloris. ꝑs pꝰ incegͣ. fr̃ĩtas w̾ ꝙͣtitas medie ͭ ͥ cllors qͥ  ĩ ip̃o»

### 52. Hdschr. 140 (Staatsbibliothek zu Berlin, Berlin)

- Titolo nel catalogo: Manipulus Florum (Fragment); datazione: 1300
- Scelto perché: frammento. Esito: sospetto (6 pagine sospette su 8 leggibili)
- Pagina 1 (1r [1]): confidenza 0.97, parole latine 87%, corrispondenza con testi noti 2%
- Manifesto: https://content.staatsbibliothek-berlin.de/dc/PPN1671763386/manifest (pagina 1)
- Immagine: https://content.staatsbibliothek-berlin.de/dc/1671763386-0001/full/full/0/default.jpg
- Estratto: «uolũptas. magͣ familia. mala / ꝯcupĩa ꝑꝰ uolupͭ ͤ  u̾ iccꝰ u̾ risꝰ / u̾ iactãcia. u̾ arrogancia. heu de»

### 53. Plut. 10 dex.5 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Tractatus super Cantica Canticorum, Catena in Ioannem etc; datazione: 1001-1100
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 193 (Carta: 91r): confidenza 0.97, parole latine 83%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:173789/manifest.json (pagina 193)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:173659/full/2000,/0/default.jpg
- Estratto: «s duo. Misera ⁊ mia. Dñs it̾m se inclinans scribet it̾ra / Pot̃ intelligi fecisse ħ dñs iurta mor̾e ꝯsuetudiuii / aliud agens uultu alio intendens. lib̾am eiꝰ exeinde»

### 54. Ms 1204 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Medizinische Sammelhandschrift; datazione: 14./15. Jh.
- Scelto perché: codice composito. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 564 (278v): confidenza 0.97, parole latine 75%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000004423/manifest.json (pagina 564)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0044/0000004423/00000564.jpx/full/full/0/default.jpg
- Estratto: «moderi sũ cello nõ muniĩ / ñ ẽ det̾mẽtũ. Dũ luna fu / erit in geniss nuillũ medi»

### 55. Plut. 43.5 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Glossae in Dantis Purgatorium et Paradisum; datazione: 1301-1400
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 168 (Carta: 79v): confidenza 0.97, parole latine 82%, corrispondenza con testi noti 0%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:748043/manifest.json (pagina 168)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:747932/full/2000,/0/default.jpg
- Estratto: «ꝓ pãte ip̃oꝵ. L. armigeros equesties ꝗ ãmati ĩ platea nuẜunt / dicẽdo illis deibuõdaliuõte si placerer eis ire simul cũ eis. qui / resspõderũt ꝙ irent ip̃i ad eoꝵ ite qr ip̃i irẽt ꝑ se seõsum qũ»

### 56. BPL 3194 (Universiteitsbibliotheek Leiden, Leiden)

- Titolo nel catalogo: Fragment (Latin): Codex Justinianus / Justinian; datazione: Apennine Peninsula ; Bologna, 12th century, second half
- Scelto perché: frammento. Esito: sospetto (7 pagine sospette su 7 leggibili)
- Pagina 9 (09 - f001v): confidenza 0.93, parole latine 77%, corrispondenza con testi noti 0%
- Manifesto: https://iiif-endpoint.universiteitleiden.nl/iiif_manifest/item:760170/manifest (pagina 9)
- Immagine: https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvNEQvREUvQUYvNEUvREMvMUEvMjAvNDIvMjQvRTcvQ0QvM0IvOTAvNDAvRjEvMDUvMTg4N18xX2l0ZW1fNzYwMTcwXzA5LmpwMiIsInJlcF9pZCI6IjEyNTI0MDI4MTIwMDAyNzExIiwiaW5zdGFuY2UiOiJldSIsImluc3RpdHV0aW9uIjoiMzFVS0JfTEVVIiwid2lkdGgiOiIzMDM3IiwiaGVpZ2h0IjoiNDcwNyIsIndtS2V5IjpudWxsLCJ3bVdpZHRoIjpudWxsLCJ3bUhlaWdodCI6bnVsbCwid21Qb3NpdGlvbiI6bnVsbCwid21SZXBlYXQiOmZhbHNlLCJuYTkxIjpudWxsfQ%3D%3D/full/2000,/0/default.jpg
- Estratto: «xorem declaxisti. nec matrimonium cũ / N ea habuisse te. necͥ filium exhuiꝰ moĩ con / umnctione ꝓtreasse uidi potes. sane si hoc»

### 57. Ms 792 (Universitätsbibliothek Leipzig, Leipzig)

- Titolo nel catalogo: Theologische Sammelhandschrift, lat. und dt. ; Theologische Sammelhandschrift , lat.; datazione: 13. Jh. ; 14. Jh.
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 7 leggibili)
- Pagina 286 (142v): confidenza 0.97, parole latine 84%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.ub.uni-leipzig.de/0000005119/manifest.json (pagina 286)
- Immagine: https://iiif.ub.uni-leipzig.de/iiif/j2k/0000/0051/0000005119/00000286.jpx/full/2000,/0/default.jpg
- Estratto: «annis. Dĩt aũ glo. suꝑ eund̃ locũ. Mͥ. post bella. fam̃ t̾re motũ: ⁊cͥ bre / uiis subsequetur par. ut fideles probentur. antnͣsactis malis. sꝑent»

### 58. MS 235 (Fragment 106) (St John's College, Oxford)

- Titolo nel catalogo: Unidentified commentary on Peter Lombard, Liber sententiarum (binding fragment); datazione: Between 1450 and 1475
- Scelto perché: titolo assente o testo non identificato; maculatura o frammento di legatura; frammento. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 3 ([2]r): confidenza 0.95, parole latine 83%, corrispondenza con testi noti 0%
- Manifesto: https://iiif.bodleian.ox.ac.uk/iiif/manifest/3a1ac13c-87fb-42c8-9881-384ac7911f9f.json (pagina 3)
- Immagine: https://iiif.bodleian.ox.ac.uk/iiif/image/3df71cee-4d23-490b-b736-78da11816414/full/2000,/0/default.jpg
- Estratto: «m̃broꝵ d̾ ꝙ deꝯ ꝯͣ pͥmã iꝯti opari / nõ pt̃ uͦ pt eã s p̾t̾ 2 ͣ pt̃ lic / nõ uiut᷑ qr nõ pt̃ dãuar iꝯtũ ut»

### 59. Plut. 10 dex.8 (Biblioteca Medicea Laurenziana, Firenze)

- Titolo nel catalogo: Anonymi Postilla super Ioannem et Expositio super Hieremiae Threnos; datazione: 1357
- Scelto perché: titolo assente o testo non identificato. Esito: sospetto (5 pagine sospette su 5 leggibili)
- Pagina 12 (Carta: 1v): confidenza 0.96, parole latine 82%, corrispondenza con testi noti 1%
- Manifesto: https://tecabml.contentdm.oclc.org/iiif/plutei:218914/manifest.json (pagina 12)
- Immagine: https://cdm21059.contentdm.oclc.org/iiif/2/plutei:218691/full/2000,/0/default.jpg
- Estratto: «os nõ ꝯminuetis exeo ꝙcͣ. Exꝗꝰ ⁊ ex / aliis ꝯsiłibꝰ p ꝙ uocẽ hꝰ tonitrui oͥ ẽẽ / fcã ĩlege ⁊ ꝓpħis ⁊ ĩ pr̃m dsid̾niis et»

### 60. Cod. Pal. lat. 778 (Universitätsbibliothek Heidelberg, Heidelberg)

- Titolo nel catalogo: Sammelhandschrift mit Texten zu Verfassungsfragen und Reichsrechten; datazione: 1464
- Scelto perché: codice composito. Esito: sospetto (6 pagine sospette su 6 leggibili)
- Pagina 147 (72r): confidenza 0.98, parole latine 81%, corrispondenza con testi noti 0%
- Manifesto: https://digi.ub.uni-heidelberg.de/diglit/iiif/cpl778/manifest.json (pagina 147)
- Immagine: https://digi.ub.uni-heidelberg.de/iiif/2/cpl778%3A072r.jpg/full/full/0/default.jpg
- Estratto: «patorem ab ecclia romana ꝑuenit ad pein- / cipes electores et sic p̃dicta duo .ta. ĩ tõtra / rium allegata intelligo. Nec enĩ auctori»

Gli altri 210 sospetti sono in `sospetti.json`.

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
