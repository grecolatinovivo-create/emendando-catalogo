"""Seconda versione dei risultati della prova di lettura: applica il secondo confronto (riconfronta.py) ai
codici sospetti e misti e riscrive risultati-codici.csv, sospetti.json, riepilogo.json e RAPPORTO.md.

Uso: python riclassifica.py <cartella prove/lettura-2026-10> <confronti.json> <taratura.json> <corpora.json>

confronti.json: uscita di «riconfronta.py cerca» sugli estratti dei sospetti (id = "<id codice>#<n>").
taratura.json: misure della taratura (passi simulati, passi rimescolati) scritte da tara.py.
Le letture complete della prima esecuzione non esistono più (artefatti cancellati): il secondo confronto lavora
sugli estratti brevi salvati in sospetti.json (fino a tre righe della pagina sospetta migliore di ogni codice).
"""
import csv
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from riconfronta import citazione, identificata  # noqa: E402

DIR, CONF, TARA, CORP = sys.argv[1:5]
conf = json.load(open(CONF))
tara = json.load(open(TARA))
corp = json.load(open(CORP))
righe = list(csv.DictReader(open(os.path.join(DIR, "risultati-codici.csv"))))
sosp = json.load(open(os.path.join(DIR, "sospetti.json")))
rie_old = json.load(open(os.path.join(DIR, "riepilogo.json")))
if "prima_versione" in rie_old:  # già riclassificato: riparto dai numeri della prima versione
    raise SystemExit("riepilogo.json è già della seconda versione")

# migliore corrispondenza per codice (sugli estratti di quel codice)
per_cod = {}
for k, r in conf.items():
    cid = k.split("#")[0]
    r["identificata"] = identificata(r["misure"])
    r["citazione"] = citazione(r["misure"])
    p = per_cod.get(cid)
    if p is None or (r["identificata"], r["misure"]["punteggio"]) > (p["identificata"], p["misure"]["punteggio"]):
        per_cod[cid] = r


def gruppo(fonte):
    if fonte.startswith("Vulgata"):
        return "Vulgata"
    if fonte.startswith("Divinum Officium"):
        return fonte.split(":")[0].replace("Divinum Officium, ", "") + " (Divinum Officium)"
    nomi = {"justinian": "Corpus iuris civilis (The Latin Library)", "gregdecretals": "Decretali di Gregorio IX, Liber Extra (The Latin Library)",
            "hyginus": "Igino, De astronomia (The Latin Library)", "annalesregnifrancorum": "Annales regni Francorum (The Latin Library)",
            "notitia": "Notitia dignitatum (The Latin Library)", "waltarius": "Waltharius (The Latin Library)"}
    for k, v in nomi.items():
        if fonte.startswith("The Latin Library: " + k):
            return v
    if fonte.startswith("The Latin Library"):
        return "The Latin Library: " + fonte.split(": ", 1)[1].split("/")[0].split(" (")[0]
    if fonte.startswith("Patrologia Latina"):
        return ", ".join(fonte.split(", ")[:2])
    return fonte.split(",")[0] if fonte.startswith(("Perseus", "CSEL")) else fonte


nuovi = {}
for r in righe:
    r["esito_prima"] = r["esito"]
    r["fonte_seconda"] = ""
    m = per_cod.get(r["id"])
    if r["esito"] in ("sospetto", "misto") and m and m["identificata"]:
        r["esito"] = "identificato"
        r["fonte_seconda"] = m["fonte"]
        if not r["fonte_principale"]:
            r["fonte_principale"] = m["fonte"]
        nuovi[r["id"]] = m

for x in sosp:
    m = per_cod.get(x["id"])
    if m:
        x["secondo_confronto"] = {"fonte": m["fonte"], **m["misure"], "identificata": m["identificata"],
                                  "citazione": m["citazione"]}
resto = [x for x in sosp if x["id"] not in nuovi]
trovati = [x for x in sosp if x["id"] in nuovi]
resto.sort(key=lambda x: -x["interesse"])
for x in resto:
    x["esito"] = next(r["esito"] for r in righe if r["id"] == x["id"])

with open(os.path.join(DIR, "risultati-codici.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(righe[0].keys()))
    w.writeheader()
    w.writerows(righe)
json.dump(resto, open(os.path.join(DIR, "sospetti.json"), "w"), ensure_ascii=False, indent=1)

conta = {}
for r in righe:
    conta[r["esito"]] = conta.get(r["esito"], 0) + 1
fonti_nuove = {}
for cid, m in nuovi.items():
    g = gruppo(m["fonte"])
    fonti_nuove[g] = fonti_nuove.get(g, 0) + 1
rie = {**rie_old, "esiti": conta, "fonti_seconda_versione": fonti_nuove,
       "prima_versione": {"esiti": rie_old["esiti"], "fonti_identificate": rie_old.get("fonti_identificate", {})},
       "corpora_seconda_versione": corp.get("per_corpus", {}), "taratura": tara}
json.dump(rie, open(os.path.join(DIR, "riepilogo.json"), "w"), ensure_ascii=False, indent=1)


def q(d, k):
    return d.get(k, 0)


old = rie_old["esiti"]
L = []
L.append("# Prova di lettura automatica dei codici latini «sospetti» (ottobre 2026), seconda versione\n")
L.append("Kraken (modello CATMuS Medieval) ha letto circa 10 pagine di ciascuno di 500 codici latini scelti come «sospetti» "
         "nel catalogo; le letture sono state confrontate con testi latini noti e aperti. Questa seconda versione rifà il "
         "confronto con un metodo che tollera le abbreviazioni e con corpora più ampi, **senza rileggere le immagini**.\n")
L.append("## In breve\n")
L.append("| | prima versione | seconda versione |")
L.append("|---|---:|---:|")
for k, nome in (("identificato", "identificati"), ("misto", "misti (alcune pagine note, altre no)"),
                ("sospetto", "sospetti"), ("incerto", "incerti"), ("non leggibile", "non leggibili"),
                ("altra lingua", "in volgare"), ("errore", "errori di rete o di manifesto")):
    L.append(f"| {nome} | {q(old, k)} | {q(conta, k)} |")
L.append(f"| codici letti | {rie_old['codici_letti']} | {rie_old['codici_letti']} |")
L.append("")
n_s = sum(1 for x in nuovi if next(r for r in righe if r["id"] == x)["esito_prima"] == "sospetto")
n_m = len(nuovi) - n_s
L.append(f"- Nuove identificazioni: **{len(nuovi)}** ({n_s} prima sospetti, {n_m} prima misti).")
cit = [x for x in resto if (x.get("secondo_confronto") or {}).get("citazione")]
L.append(f"- Altri **{len(cit)}** codici restano sospetti ma hanno una corrispondenza parziale forte (di solito una "
         "citazione biblica o patristica dentro un commento o una predica): " + ", ".join(x["segnatura"] for x in cit) + ".")
L.append("- **Attenzione: il secondo confronto ha visto solo gli estratti brevi** (fino a tre righe della pagina sospetta "
         "migliore di ogni codice, in media 24 parole), perché le letture complete della prima esecuzione erano negli "
         "artefatti temporanei, cancellati alla fine come previsto. Un codice resta «sospetto» anche quando l'estratto non "
         "basta a riconoscerlo: per rifare il confronto su tutte le pagine bisogna rileggere le immagini (vedi in fondo).")
L.append("- I 61 identificati della prima versione restano identificati: non sono stati rimessi in discussione (di loro "
         "non resta testo). La sensibilità del nuovo metodo è misurata con una taratura (sotto).")
L.append("")
L.append("## Con che cosa sono stati identificati i nuovi\n")
for k, v in sorted(fonti_nuove.items(), key=lambda x: -x[1]):
    L.append(f"- {k}: {v}")
L.append("")
L.append("Dettaglio (segnatura, fonte trovata, parole lette allineate / parole piene in comune):\n")
for x in sorted(trovati, key=lambda x: x["segnatura"]):
    m = nuovi[x["id"]]
    L.append(f"- {x['segnatura']} ({x['biblioteca']}): {m['fonte']}; {m['misure']['lette_coperte']}/{m['misure']['estensione']} "
             f"parole allineate, {m['misure']['piene']} parole piene; prima: {x['esito']}")
L.append("")
L.append("Gli identificati della prima versione (pagine intere, metodo precedente): " + ", ".join(
    f"{k} {v}" for k, v in sorted(rie_old.get("fonti_identificate_gruppi", {}).items())) if rie_old.get("fonti_identificate_gruppi") else
    "Gli identificati della prima versione erano quasi tutti sulla Vulgata (47 su 61), gli altri su Patrologia Latina, CSEL e Perseus.")
L.append("")
L.append("## Sospetti residui, ordinati per interesse\n")
L.append("Interesse come nella prima versione: qualità della lettura × quantità di testo × pagine senza corrispondenza, "
         "con un vantaggio per palinsesti, maculature, testi dichiarati non identificati e codici fino al XII secolo, e uno "
         "svantaggio per i codici il cui titolo nel catalogo nomina già autore o opera. Gli estratti sono la lettura "
         "automatica grezza (abbreviazioni non sciolte, errori della macchina). «Miglior affinità» è la corrispondenza più "
         "forte trovata, sotto la soglia: utile come indizio, non come identificazione.\n")
for i, s in enumerate(resto[:60], 1):
    L.append(f"### {i}. {s['segnatura']} ({s['biblioteca']})\n")
    L.append(f"- Titolo nel catalogo: {s['titolo'] or '(nessuno)'}; datazione: {s['datazione'] or '?'}")
    L.append(f"- Scelto perché: {s['motivo_scelta']}. Esito: {s['esito']} ({s['pagine_sospette']} pagine sospette su {s['pagine_leggibili']} leggibili)")
    L.append(f"- Pagina {s['pagina']}{' (' + s['etichetta'] + ')' if s['etichetta'] else ''}: confidenza {s['confidenza']:.2f}, "
             f"parole latine {s['quota_latina']:.0%}")
    sc = s.get("secondo_confronto")
    if sc and sc.get("citazione"):
        L.append(f"- **Corrispondenza parziale forte** (citazione o testo affine, da verificare): {sc['fonte']} "
                 f"({sc['lette_coperte']} parole allineate, {sc['piene']} piene, {sc['quota_estratto']:.0%} dell'estratto)")
    elif sc and sc.get("piene", 0) >= 2:
        L.append(f"- Miglior affinità (debole, sotto soglia): {sc['fonte']} ({sc['lette_coperte']} parole allineate, {sc['piene']} piene)")
    L.append(f"- Manifesto: {s['manifest']} (pagina {s['pagina']})")
    if s.get("immagine"):
        L.append(f"- Immagine: {s['immagine']}")
    if s.get("estratto"):
        L.append("- Estratto: «" + " / ".join(s["estratto"]) + "»")
    L.append("")
if len(resto) > 60:
    L.append(f"Gli altri {len(resto) - 60} sospetti e misti sono in `sospetti.json`.\n")

pc = corp.get("per_corpus", {})
L.append("## Come è stato rifatto il confronto\n")
L.append("**Il problema.** CATMuS trascrive in forma diplomatica: dñs, ꝙ, ꝑ, ꝰ, ħ, ẽ, ĩtłłigat᷑, oĩa restano come sono. Il "
         "primo confronto riduceva ogni parola alle prime due lettere e cercava sei parole di fila uguali: bastava una "
         "parola con l'inizio abbreviato (oĩa, ĩtellegit᷑) o due parole fuse dallo scriba (sineluna) per rompere la "
         "sequenza; e i corpora erano solo Perseus, Vulgata, CSEL e Patrologia Latina fino al vol. 85.\n")
L.append("**Il nuovo confronto** (`scripts/prova-lettura/riconfronta.py`):")
L.append("- ogni parola letta diventa una forma con le lettere sicure: ꝑ = p…r, ꝓ = pro, ꝰ = s, ꝯ = c, ꝙ/ꝗ = q, lettere "
         "soprascritte come lettere; un piccolo lessico scioglie le sigle isolate (⁊ et, ẽ est, ñ non, ꝙ quod, ħ hoc/haec, "
         "ł uel, gͦ ergo, dñs, xp̃s, ihs...);")
L.append("- una parola abbreviata corrisponde a una parola del testo noto se ha la stessa iniziale e le sue lettere vi "
         "compaiono nello stesso ordine (dñs in dominus, oĩa in omnia); una parola piena se è uguale o differisce di una "
         "lettera; su entrambi i lati u/v, i/j/y, ae/oe/e, h muta, ph/f e lettere doppie sono uniformati;")
L.append("- i candidati si cercano con le iniziali di cinque parole di fila (almeno due sequenze sulla stessa diagonale), "
         "poi si verificano con un allineamento locale parola per parola (Smith-Waterman) che ammette lacune, parole fuse "
         "e parole spezzate;")
L.append("- **contro i falsi positivi**: un'identificazione richiede un allineamento di almeno 8 parole lette, con almeno 5 "
         "parole piene distinte (non funzionali, di almeno 4 lettere) in comune, metà della regione coperta, un punteggio "
         f"di almeno {tara.get('soglia')} (il massimo ottenuto dal caso è {tara.get('nul_punteggio_max')}) e almeno il 40% "
         "delle parole dell'estratto allineate; sotto il 40% è una citazione dentro un altro testo e il codice resta sospetto. "
         "Due parole comuni non bastano.")
L.append("")
L.append("**Taratura** (passi di 25 parole presi a caso dai corpora, abbreviati e sporcati come una lettura CATMuS: "
         "titulus, ꝑ ꝓ ꝯ ꝰ ᷑, sigle, contrazioni interne, 3-4% di lettere sbagliate o perse, parole fuse):")
L.append(f"- passi ritrovati con il nuovo metodo: **{tara['sim_trovati']} su {tara['sim_totale']}** "
         f"({tara['sim_trovati'] / max(1, tara['sim_totale']):.0%}): {tara['sim_giusti']} nel documento da cui erano presi, gli altri "
         "in un'altra copia dello stesso testo (Perseus e Latin Library, le due Vulgate, i salmi e le letture bibliche del breviario);")
L.append(f"- gli stessi passi con il metodo della prima versione (6-grammi delle prime due lettere, soglia 8% netta): "
         f"{tara['vecchio_trovati']} su {tara['sim_totale']};")
L.append(f"- falsi positivi sugli stessi passi rimescolati (parole in ordine casuale): {tara['nul_sim_positivi']} su "
         f"{tara['nul_sim_totale']}; sugli estratti reali rimescolati: {tara['nul_est_positivi']} su {tara['nul_est_totale']}.")
L.append("")
L.append("**Corpora** (licenze controllate il 26 ottobre 2026), in tutto " + f"{corp.get('parole', 0) / 1e6:.1f} milioni di parole:")
L.append(f"- già nella prima versione: Vulgata (pubblico dominio; {pc.get('Vulgata', 0) / 1e6:.1f} M parole), PerseusDL "
         f"canonical-latinLit (CC BY-SA 4.0; {pc.get('Perseus', 0) / 1e6:.1f} M), CSEL di OpenGreekAndLatin (CC BY-SA 4.0; "
         f"{pc.get('CSEL', 0) / 1e6:.1f} M), Patrologia Latina di OpenGreekAndLatin (voll. 3-85, CC BY-SA 4.0; "
         f"{pc.get('Patrologia Latina', 0) / 1e6:.1f} M);")
L.append(f"- **nuovi**: The Latin Library nella copia CLTK (`cltk/lat_text_latin_library`, Public Domain Mark; "
         f"{pc.get('The Latin Library', 0) / 1e6:.1f} M parole), con la Vulgata intera, il Corpus iuris civilis (Institutiones, "
         "Digesta, Codex), le Decretali di Gregorio IX (Liber Extra), un estratto del Decretum Gratiani, Beda, Agostino "
         "(Confessioni, De civitate Dei, sermoni), Girolamo, Isidoro, Gregorio di Tours, inni, cronache e molto latino "
         f"medievale; **Divinum Officium** (`DivinumOfficium/divinum-officium`, licenza MIT; {pc.get('Divinum Officium', 0) / 1e6:.1f} M), "
         "cioè breviario romano (con il salterio gallicano, il proprio e il comune dei santi, il martirologio) e messale "
         "romano tridentino in latino.")
L.append("- **Non aggiunti**: Corpus Corporum (licenza CC BY-NC-SA, non commerciale, e nessun download in blocco "
         "raggiungibile); Patrologia Latina oltre il vol. 85 (nessuna copia aperta in blocco trovata: OpenGreekAndLatin "
         "arriva al vol. 85); MGH (dMGH offre PDF consultabili, non un download di testo in blocco); Vetus Latina, Corpus "
         "Orationum, Decretum Gratiani completo e pontificale (nessun testo aperto scaricabile trovato); Beda, De temporum "
         "ratione e De temporibus (non presenti nei corpora aperti raggiunti).")
L.append("")
L.append("## Limiti\n")
L.append("- Il secondo confronto ha visto solo gli estratti (circa 24 parole per codice). Un estratto non riconosciuto non "
         "prova che il testo sia ignoto; un estratto riconosciuto dice solo che quella pagina è nota.")
L.append("- Mancano ancora la scolastica, la medicina, l'astronomia e il computo, quasi tutto il diritto canonico, le "
         "prediche e i commenti biblici dopo il IX secolo: molti sospetti residui sono di questo tipo (lo dicono anche i "
         "titoli del catalogo: sermoni anonimi, commenti, raccolte mediche e giuridiche).")
L.append("- La lettura automatica è buona sulle minuscole librarie ordinate, debole su corsive, glosse fitte, notazione "
         "musicale, pagine rovinate e palinsesti; la confidenza di Kraken è alta anche su letture sbagliate.")
L.append("")
L.append("## Per rifare il confronto su tutte le pagine\n")
L.append("Bisogna rileggere le immagini (circa 28 ore di calcolo, distribuite sui job di GitHub Actions) e, perché un "
         "confronto successivo sia possibile, conservare le letture complete invece di cancellarle a fine esecuzione. Poi "
         "`riconfronta.py corpora` prepara i testi e `riconfronta.py cerca` confronta le letture.")
L.append("")
L.append("## File\n")
L.append("- `codici.json`: i 500 codici scelti, con il motivo della scelta.")
L.append("- `risultati-codici.csv`: esito per codice (colonne `esito_prima` e `fonte_seconda` per il confronto tra le versioni).")
L.append("- `pagine.csv`: misure per pagina della prima versione (il secondo confronto non ha le pagine intere).")
L.append("- `sospetti.json`: i sospetti e misti residui, con l'estratto breve e la miglior affinità trovata.")
L.append("- `riepilogo.json`: i numeri di questo rapporto, con quelli della prima versione e la taratura.")
L.append("")
L.append("Nessuna trascrizione completa è pubblicata.\n")
L.append("## Prima versione\n")
L.append(f"Prima versione (esecuzione 40275860301, metodo dei 6-grammi delle prime due lettere, corpora Perseus, Vulgata, "
         f"CSEL e Patrologia Latina voll. 3-85): {rie_old['codici_letti']} codici letti; identificati {q(old, 'identificato')}, "
         f"misti {q(old, 'misto')}, sospetti {q(old, 'sospetto')}, incerti {q(old, 'incerto')}, non leggibili "
         f"{q(old, 'non leggibile')}, in volgare {q(old, 'altra lingua')}, errori {q(old, 'errore')}. Pagine: "
         + ", ".join(f"{k} {v}" for k, v in rie_old["pagine"].items()) + f" (in tutto {rie_old['pagine_totali']}). "
         "Identificati quasi tutti sulla Vulgata (47 su 61).")
open(os.path.join(DIR, "RAPPORTO.md"), "w").write("\n".join(L) + "\n")
print(json.dumps({"prima": old, "dopo": conta, "nuovi": len(nuovi), "fonti": fonti_nuove}, ensure_ascii=False))
