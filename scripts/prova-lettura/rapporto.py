"""RAPPORTO.md della prova di lettura, in italiano semplice.

Uso: python rapporto.py <codici.json> <cartella risultati> <tempi.json> <url esecuzione>
"""
import csv
import json
import os
import sys
from datetime import datetime

CODICI, RIS, TEMPI, RUN = sys.argv[1:5]

cod = json.load(open(CODICI))
rie = json.load(open(os.path.join(RIS, "riepilogo.json")))
sosp = json.load(open(os.path.join(RIS, "sospetti.json")))

# Ordine per interesse. Base (da confronta.py): qualità della lettura × quantità di testo × pagine senza
# corrispondenza. Correzioni: i codici fino al XII secolo valgono di più (lì i corpora, Patrologia fino
# all'VIII secolo e classici, coprono meglio quello che ci si aspetta di trovare, quindi un «nessun riscontro»
# pesa di più); valgono meno quelli il cui titolo nel catalogo indica già autore o opera (il testo è noto,
# solo assente dai corpora aperti).
import re  # noqa: E402

secoli = {c["id"]: c.get("secolo") or [0, 0] for c in cod["codici"]}
NOTO = re.compile(r"seu potius|sive |scilicet|interprete|/ [A-Z]|\b[A-Z][a-z]+ (de|von|of) [A-Z]|[A-Z][a-z]+:\s|[A-Z][a-z]+i [A-Z][a-z]+(i|ae)\b|\b(Aristot|Petrarc|Scot|Guido|Isidor|Bernard|Hugo|Hugon|Innocent|Manetti|Panormit|Appian|Sacrobosc|Platearius|Garland|Matthaeus)")
for x in sosp:
    f = 1.0
    sd, sa = secoli.get(x["id"], [0, 0])
    if sa and sa <= 12:
        f *= 1.5
    elif sd and sd >= 15:
        f *= 0.8
    if NOTO.search(x.get("titolo") or ""):
        f *= 0.5
    x.setdefault("interesse_base", x["interesse"])  # quello di confronta.py, per non moltiplicare due volte
    x["interesse"] = round(x["interesse_base"] * f, 3)
sosp.sort(key=lambda x: -x["interesse"])
json.dump(sosp, open(os.path.join(RIS, "sospetti.json"), "w"), ensure_ascii=False, indent=1)
righe = list(csv.DictReader(open(os.path.join(RIS, "risultati-codici.csv"))))

minuti_job = {}
try:
    for j in json.load(open(TEMPI)).get("jobs", []):
        if j.get("started_at") and j.get("completed_at"):
            a = datetime.fromisoformat(j["started_at"].replace("Z", "+00:00"))
            b = datetime.fromisoformat(j["completed_at"].replace("Z", "+00:00"))
            minuti_job[j["name"]] = round((b - a).total_seconds() / 60, 1)
except (OSError, ValueError, json.JSONDecodeError):
    pass

es = rie["esiti"]
pg = rie["pagine"]
n = rie["codici_letti"]


def q(k):
    return es.get(k, 0)


L = []
L.append("# Prova di lettura automatica dei codici latini «sospetti» (ottobre 2026)\n")
L.append("Prova pilota gratuita: Kraken (riconoscimento della scrittura a mano, open source) ha letto poche pagine di ciascun "
         "codice; le letture sono state confrontate con testi latini noti e aperti, per capire se la lettura automatica può "
         "segnalare codici che forse contengono testi non identificati.\n")
L.append(f"Esecuzione: {RUN}\n")
L.append("## In breve\n")
L.append(f"- Codici scelti: {cod['totale']}; codici letti: **{n}**.")
L.append(f"- Pagine lette: {rie['pagine_totali']} (vuote o quasi: {pg.get('vuota', 0)}; non leggibili: {pg.get('non leggibile', 0)}; "
         f"in volgare: {pg.get('altra lingua', 0)}; riconosciute: {pg.get('identificata', 0)}; incerte: {pg.get('incerta', 0)}; sospette: {pg.get('sospetta', 0)}; errori: {pg.get('errore', 0)}).")
L.append(f"- Codici **non leggibili** (nessuna pagina letta bene): **{q('non leggibile') + q('errore')}**"
         f" (di cui {q('errore')} per errori di rete o di manifesto).")
L.append(f"- Codici in un'altra lingua (volgare) nelle pagine lette: {q('altra lingua')}.")
L.append(f"- Codici **identificati** (le pagine lette corrispondono a testi noti): **{q('identificato')}**; "
         f"misti (alcune pagine note, altre no): {q('misto')}.")
L.append(f"- Codici **sospetti** (latino letto bene ma nessuna corrispondenza): **{q('sospetto')}**; incerti: {q('incerto')}.")
ore = rie.get("secondi_lettura", 0) / 3600
tot_job = sum(minuti_job.values())
L.append(f"- Tempo di calcolo: {ore:.1f} ore di lettura (somma dei processi)"
         + (f"; {tot_job / 60:.1f} ore di job su GitHub Actions in tutto, il più lungo {max(minuti_job.values()):.0f} minuti." if minuti_job else "."))
L.append("")
if rie.get("fonti_identificate"):
    L.append("## Con che cosa sono stati identificati\n")
    for k, v in sorted(rie["fonti_identificate"].items(), key=lambda x: -x[1])[:25]:
        L.append(f"- {k}: {v}")
    L.append("")

L.append("## Sospetti, ordinati per interesse\n")
L.append("Interesse = qualità della lettura (confidenza e quota di parole latine) × quantità di testo × numero di pagine "
         "senza corrispondenza, con un vantaggio per palinsesti, maculature, testi dichiarati non identificati e codici fino al "
         "XII secolo, e uno svantaggio per i codici il cui titolo nel catalogo nomina già autore o opera. "
         "«Pagina» è il numero dell'immagine nel manifesto (canvas). Gli estratti sono la lettura automatica grezza, "
         "con le abbreviazioni non sciolte e gli errori della macchina.\n")
for i, s in enumerate(sosp[:60], 1):
    L.append(f"### {i}. {s['segnatura']} ({s['biblioteca']})\n")
    L.append(f"- Titolo nel catalogo: {s['titolo'] or '(nessuno)'}; datazione: {s['datazione'] or '?'}")
    L.append(f"- Scelto perché: {s['motivo_scelta']}. Esito: {s['esito']} ({s['pagine_sospette']} pagine sospette su {s['pagine_leggibili']} leggibili)")
    L.append(f"- Pagina {s['pagina']}{' (' + s['etichetta'] + ')' if s['etichetta'] else ''}: confidenza {s['confidenza']:.2f}, "
             f"parole latine {s['quota_latina']:.0%}, corrispondenza con testi noti {float(s['quota_netta'] or 0):.0%}")
    L.append(f"- Manifesto: {s['manifest']} (pagina {s['pagina']})")
    if s.get("immagine"):
        L.append(f"- Immagine: {s['immagine']}")
    if s.get("estratto"):
        L.append("- Estratto: «" + " / ".join(s["estratto"]) + "»")
    L.append("")
if len(sosp) > 60:
    L.append(f"Gli altri {len(sosp) - 60} sospetti sono in `sospetti.json`.\n")

L.append("## Come è stata fatta\n")
L.append("- **Scelta** (`codici.json`, con il motivo per ciascuno): 500 codici in latino senza autori né opere riconosciuti, "
         "tra VI e XV secolo, con titolo generico (frammenti, maculature, palinsesti, compositi, miscellanee, anonimi). "
         "Biblioteche: BSB e Bamberga, Heidelberg, e-codices, Berlino, Bodleian, Laurenziana, Leida, Lipsia, Penn, Auckland. "
         "Escluse la Vaticana (anche attraverso Heidelberg), Yale (robots.txt vieta i manifesti), loc e nlg (senza servizio Image), "
         "Ambrosiana (condizioni d'uso), Gallica (limiti stretti) e DS (aggregatore).")
L.append("- **Pagine**: fino a 10 per codice (prime, centrali e ultime pagine scritte, fogli di guardia se riconoscibili; "
         "coperte, tagli e scale di colore saltati), a 2000 px di larghezza dall'IIIF Image API; una richiesta alla volta per "
         "biblioteca, almeno 1 secondo di pausa (1,5 per CONTENTdm, che chiede Crawl-Delay 1), di più se il server lo chiede. "
         "Le immagini non sono state salvate.")
L.append("- **Lettura**: Kraken 5.3 con la segmentazione di base (blla) e il modello CATMuS Medieval 1.6.0 "
         "(Zenodo 10.5281/zenodo.21488839, licenza CC BY 4.0), trascrizione grafematica con abbreviazioni non sciolte.")
L.append("- **Confronto**: corpora aperti PerseusDL canonical-latinLit (CC BY-SA 4.0), CSEL di OpenGreekAndLatin (CC BY-SA 4.0), "
         "Patrologia Latina di OpenGreekAndLatin (voll. 3-85, CC BY-SA 4.0) e Vulgata (pubblico dominio). Si confrontano "
         "sequenze di sei parole ridotte alle prime due lettere, dopo aver uniformato u/v, i/j, ae/e, h: le abbreviazioni "
         "medievali tagliano l'interno e la fine delle parole, quasi mai l'inizio. Alla quota trovata si toglie quella che "
         "si ottiene con le stesse parole mescolate a caso (di solito 0-2%).")
L.append("- **Soglie**: pagina vuota sotto 120 caratteri; in volgare se le parole funzionali volgari (und, der, the, and...) "
         "superano le latine (et, in, est, quod...); non leggibile se la confidenza media è sotto 0,80, se meno del 55% "
         "delle parole intere sono latino noto o se mancano le parole funzionali latine; identificata dall'8% di corrispondenza netta in su; sospetta sotto il 3%.")
L.append("")
L.append("## Limiti (da leggere prima di fidarsi dei sospetti)\n")
L.append("- I corpora aperti coprono classici, Bibbia, CSEL e la Patrologia Latina fino all'VIII secolo circa: mancano la "
         "liturgia (messali, breviari, antifonari), il diritto canonico e civile, la scolastica, la medicina, l'astronomia e "
         "quasi tutto il latino dopo il IX secolo. Molti «sospetti» sono quindi testi noti ma assenti dai corpora.")
L.append("- La lettura automatica è buona sulle minuscole librarie ordinate, debole su corsive, glosse fitte, notazione "
         "musicale, pagine rovinate e palinsesti (il testo di sotto non si legge con le immagini normali).")
L.append("- Note moderne (cartellini, descrizioni a mano dei bibliotecari) possono passare per latino leggibile.")
L.append("- La confidenza di Kraken con CATMuS è alta anche su letture sbagliate: per questo conta anche la quota di parole latine.")
L.append("")
L.append("## File\n")
L.append("- `codici.json`: i 500 codici scelti, con il motivo della scelta.")
L.append("- `risultati-codici.csv`: esito per codice.")
L.append("- `pagine.csv`: per codice e pagina, confidenza media, quota di latino, quota riconosciuta (lorda, del caso, netta) e fonte trovata.")
L.append("- `sospetti.json`: i sospetti con l'estratto breve.")
L.append("- `riepilogo.json`: i numeri di questo rapporto.")
L.append("")
L.append("Nessuna trascrizione completa è pubblicata: le letture intere sono rimaste negli artefatti temporanei dell'esecuzione, cancellati alla fine.")
open(os.path.join(RIS, "RAPPORTO.md"), "w").write("\n".join(L) + "\n")
print("RAPPORTO.md scritto")
