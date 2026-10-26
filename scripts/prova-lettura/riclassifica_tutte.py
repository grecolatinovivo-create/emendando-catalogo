"""Terza versione dei risultati della prova di lettura: il secondo confronto (riconfronta.py) su TUTTE le pagine lette.

La seconda versione (riclassifica.py) aveva solo gli estratti brevi dei sospetti; qui le letture complete ci sono
(artefatti letture-* conservati 90 giorni) e ogni pagina si confronta per intero.

Ogni pagina si divide in FINESTRE di 25 parole lette, la stessa lunghezza dei passi della taratura: le soglie di
riconfronta.identificata (in particolare il 40% delle parole lette allineate) valgono così come sono state tarate.
Una pagina è identificata quando lo è almeno un quarto delle sue finestre; una o poche finestre identificate su
una pagina lunga sono una citazione dentro un altro testo e la pagina resta com'era.

Uso:
  python riclassifica_tutte.py finestre <letture> <pagine.csv> <parti> <uscita>
      -> <uscita>/finestre-<k>.json ([{"id", "testo"}], per «riconfronta.py cerca») e <uscita>/mappa.json
  python riclassifica_tutte.py rapporto <codici.json> <letture> <risultati> <finestre> <confronti> <prove> \
      <corpora-info.json> <url esecuzione> <id esecuzione letture>
      <risultati>: uscita di confronta.py + rapporto.py su queste letture (metodo della prima versione);
      <confronti>: uscite di «riconfronta.py cerca» (confronti-*.json, anche in sottocartelle);
      <prove>: prove/lettura-2026-10, da cui si leggono le versioni precedenti e dove si scrivono i risultati.
Nel repository vanno solo misure, fonti ed estratti brevi (al massimo tre righe per codice sospetto).
"""
import csv
import glob
import json
import math
import os
import re
import sys
import zlib
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from riconfronta import citazione, forma, identificata  # noqa: E402

FINESTRA = 25      # parole lette per finestra (come i passi della taratura)
FINESTRA_MIN = 12  # un resto più corto si unisce alla finestra prima
PAROLE_MIN = 8     # sotto, nessuna identificazione è possibile (servono 8 parole allineate)
QUOTA_PAGINA = 0.25
STATI_DA_CONFRONTARE = {"identificata", "sospetta", "incerta", "non leggibile"}


def testo_pagina(righe):
    out = ""
    for r in righe:
        t = r["t"].strip()
        if out.endswith(("-", "=", "¬", "⸗")):
            out = out[:-1] + t
        else:
            out += (" " if out else "") + t
    return out


def estratto(pag, max_righe=3, max_car=220):
    buone = [r["t"].strip() for r in pag.get("righe", []) if r["c"] >= 0.9 and len(r["t"].strip()) >= 25]
    out, n = [], 0
    for t in buone[len(buone) // 3:]:
        if len(out) >= max_righe or n + len(t) > max_car:
            break
        out.append(t)
        n += len(t)
    return out


def letture(cart):
    """id codice -> record di lettura (se un codice compare due volte, vale quello con più pagine)."""
    out = {}
    for f in sorted(glob.glob(os.path.join(cart, "**", "*.json"), recursive=True)):
        try:
            rec = json.load(open(f))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if not isinstance(rec, dict) or "pagine" not in rec or "id" not in rec:
            continue
        if rec["id"] not in out or len(rec["pagine"]) > len(out[rec["id"]]["pagine"]):
            out[rec["id"]] = rec
    return out


def finestre_pagina(testo):
    parole = [w for w in testo.split() if forma(w)]
    if len(parole) < PAROLE_MIN:
        return []
    pezzi = [parole[i: i + FINESTRA] for i in range(0, len(parole), FINESTRA)]
    if len(pezzi) > 1 and len(pezzi[-1]) < FINESTRA_MIN:
        ultimo = pezzi.pop()  # prima si toglie l'ultimo pezzo, poi lo si aggiunge al precedente
        pezzi[-1] += ultimo
    return [" ".join(p) for p in pezzi]


def cmd_finestre(let, pagine_csv, parti, uscita):
    parti = int(parti)
    os.makedirs(uscita, exist_ok=True)
    stato = {(r["id"], str(r["pagina"])): r["stato"] for r in csv.DictReader(open(pagine_csv))}
    lotti = [[] for _ in range(parti)]
    mappa = {}
    for cid, rec in letture(let).items():
        k = zlib.crc32(cid.encode()) % parti
        for p in rec["pagine"]:
            chiave = f"{cid}#{p.get('canvas')}"
            if stato.get((cid, str(p.get("canvas")))) not in STATI_DA_CONFRONTARE:
                continue
            fin = finestre_pagina(testo_pagina(p.get("righe", [])))
            mappa[chiave] = len(fin)
            for j, t in enumerate(fin):
                lotti[k].append({"id": f"{chiave}#{j}", "testo": t})
    for k, l in enumerate(lotti):
        json.dump(l, open(os.path.join(uscita, f"finestre-{k}.json"), "w"), ensure_ascii=False)
    json.dump(mappa, open(os.path.join(uscita, "mappa.json"), "w"), ensure_ascii=False)
    print(f"{len(mappa)} pagine, {sum(len(l) for l in lotti)} finestre in {parti} parti: {[len(l) for l in lotti]}")


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


def precedenti(rie_old):
    """Le versioni precedenti, in breve, da riepilogo.json del repository."""
    if rie_old.get("versione") == 3:  # terza versione già scritta: si rifà, le precedenti restano quelle
        return rie_old["versioni_precedenti"]
    v1 = rie_old.get("prima_versione", {})
    return [
        {"versione": 1, "esecuzione": "40275860301", "metodo": "6-grammi delle prime due lettere, pagine intere",
         "corpora": "Vulgata, Perseus, CSEL, Patrologia Latina voll. 3-85", "codici_letti": rie_old.get("codici_letti"),
         "esiti": v1.get("esiti", {}), "pagine": rie_old.get("pagine", {}), "pagine_totali": rie_old.get("pagine_totali")},
        {"versione": 2, "metodo": "confronto tollerante verso le abbreviazioni, solo sugli estratti dei sospetti (circa 24 parole)",
         "corpora": "come la prima, più The Latin Library (CLTK) e Divinum Officium", "codici_letti": rie_old.get("codici_letti"),
         "esiti": rie_old.get("esiti", {}), "fonti_nuove": rie_old.get("fonti_seconda_versione", {})},
    ]


def cmd_rapporto(codici_f, let, ris, fin, conf_dir, prove, corp_f, url_run, run_letture):
    cod = {c["id"]: c for c in json.load(open(codici_f))["codici"]}
    rec_let = letture(let)
    mappa = json.load(open(os.path.join(fin, "mappa.json")))
    conf = {}
    for f in sorted(glob.glob(os.path.join(conf_dir, "**", "confronti-*.json"), recursive=True)):
        conf.update(json.load(open(f)))
    corp = json.load(open(corp_f)) if os.path.exists(corp_f) else {}
    rie_old = json.load(open(os.path.join(prove, "riepilogo.json")))
    vers_prec = precedenti(rie_old)
    tara = rie_old.get("taratura", {})
    rie_v1 = json.load(open(os.path.join(ris, "riepilogo.json")))
    sosp_v1 = {x["id"]: x for x in json.load(open(os.path.join(ris, "sospetti.json")))}
    righe_v1 = list(csv.DictReader(open(os.path.join(ris, "risultati-codici.csv"))))
    pagine = list(csv.DictReader(open(os.path.join(ris, "pagine.csv"))))

    # finestre per pagina
    per_pag = {}
    for k, r in conf.items():
        chiave, _ = k.rsplit("#", 1)
        r["identificata"] = identificata(r["misure"])
        r["citazione"] = citazione(r["misure"])
        per_pag.setdefault(chiave, []).append(r)

    # stato delle pagine (terza versione)
    per_cod = {}
    for p in pagine:
        chiave = f"{p['id']}#{p['pagina']}"
        fs = per_pag.get(chiave, [])
        nfin = mappa.get(chiave, 0)
        ids = [r for r in fs if r["identificata"]]
        cits = [r for r in fs if r["citazione"] or r["identificata"]]
        migliore = max(fs, key=lambda r: r["misure"]["punteggio"]) if fs else None
        p["stato_prima"] = p["stato"]
        p["finestre"] = nfin
        p["finestre_identificate"] = len(ids)
        p["punteggio_max"] = migliore["misure"]["punteggio"] if migliore else ""
        p["fonte_terza"] = ""
        p["citazione"] = ""
        if ids and len(ids) >= max(1, math.ceil(QUOTA_PAGINA * nfin)):
            conta = {}
            for r in ids:
                conta[r["fonte"]] = conta.get(r["fonte"], 0) + 1
            p["stato"] = "identificata"
            p["fonte_terza"] = max(conta, key=conta.get)
        elif p["stato"] == "identificata":
            p["fonte_terza"] = p["fonte"]
        elif cits:
            p["citazione"] = max(cits, key=lambda r: r["misure"]["punteggio"])["fonte"]
        per_cod.setdefault(p["id"], []).append((p, migliore))

    # esito per codice, con le stesse regole di confronta.py
    righe = []
    sospetti = []
    for r in righe_v1:
        r = dict(r)
        r["esito_metodo_vecchio"] = r["esito"]
        pp = per_cod.get(r["id"], [])
        stati = [p["stato"] for p, _ in pp]
        n_id, n_sosp = stati.count("identificata"), stati.count("sospetta")
        n_legg = n_id + n_sosp + stati.count("incerta")
        if r["esito"] == "errore" or not pp:
            esito = r["esito"]
        elif n_legg == 0 and stati.count("altra lingua"):
            esito = "altra lingua"
        elif n_legg == 0:
            esito = "non leggibile"
        elif n_id and n_id >= n_sosp:
            esito = "identificato"
        elif n_id:
            esito = "misto"
        elif n_sosp:
            esito = "sospetto"
        else:
            esito = "incerto"
        fonti = {}
        for p, _ in pp:
            if p["stato"] == "identificata" and p["fonte_terza"]:
                fonti[p["fonte_terza"]] = fonti.get(p["fonte_terza"], 0) + 1
        r.update({"esito": esito, "pagine_leggibili": n_legg, "pagine_identificate": n_id, "pagine_sospette": n_sosp,
                  "fonte_principale": max(fonti, key=fonti.get) if fonti else ""})
        righe.append(r)
        if esito not in ("sospetto", "misto"):
            continue
        # pagina sospetta migliore (come confronta.py) e miglior affinità del codice
        rec = rec_let.get(r["id"], {"pagine": []})
        pag_rec = {str(p.get("canvas")): p for p in rec["pagine"]}
        cand = []
        for p, _ in pp:
            if p["stato"] != "sospetta":
                continue
            pr = pag_rec.get(str(p["pagina"]), {})
            nparole = len(testo_pagina(pr.get("righe", [])).split())
            sc = float(p["confidenza_media"] or 0) * float(p["quota_latina"] or 0) * min(1.0, nparole / 120)
            cand.append((sc, p, pr))
        if not cand:
            continue
        cand.sort(key=lambda x: -x[0])
        sc, p, pr = cand[0]
        x1 = sosp_v1.get(r["id"], {})
        fattore = (x1["interesse"] / x1["interesse_base"]) if x1.get("interesse_base") else 1.0
        c = cod.get(r["id"], {})
        base = sc * (1 + 0.5 * (n_sosp - 1)) * (0.6 if esito == "misto" else 1.0)
        if any(k in c.get("motivo", "") for k in ("palinsesto", "maculatura", "non identificato")):
            base *= 1.2
        affini = [m for q, m in pp if m and q["stato"] != "identificata"]
        best = max(affini, key=lambda m: m["misure"]["punteggio"]) if affini else None
        x = {**r, "interesse_base": round(base, 3), "interesse": round(base * fattore, 3), "pagina": p["pagina"],
             "etichetta": p["etichetta"], "immagine": p["immagine"], "confidenza": float(p["confidenza_media"] or 0),
             "quota_latina": float(p["quota_latina"] or 0), "estratto": estratto(pr), "pagina_web": c.get("pagina")}
        if best:
            x["miglior_affinita"] = {"fonte": best["fonte"], **best["misure"], "identificata": False,
                                     "citazione": bool(best["citazione"] or best["identificata"])}
        sospetti.append(x)
    sospetti.sort(key=lambda x: -x["interesse"])

    # scrittura (niente trascrizioni complete: solo misure ed estratti brevi)
    campi_p = ["id", "segnatura", "biblioteca", "pagina", "etichetta", "tipo", "stato", "stato_prima", "righe",
               "confidenza_media", "quota_latina", "quota_netta", "fonte", "finestre", "finestre_identificate",
               "punteggio_max", "fonte_terza", "citazione", "manifest", "immagine"]
    with open(os.path.join(prove, "pagine.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=campi_p, extrasaction="ignore")
        w.writeheader()
        w.writerows(p for pp in per_cod.values() for p, _ in pp)
    campi_c = [k for k in righe_v1[0].keys() if k != "esito"] if righe_v1 else []
    campi_c.insert(campi_c.index("motivo_scelta") + 1 if "motivo_scelta" in campi_c else 0, "esito")
    campi_c.insert(campi_c.index("esito") + 1, "esito_metodo_vecchio")
    with open(os.path.join(prove, "risultati-codici.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=campi_c, extrasaction="ignore")
        w.writeheader()
        w.writerows(righe)
    json.dump(sospetti, open(os.path.join(prove, "sospetti.json"), "w"), ensure_ascii=False, indent=1)

    conta, pst = {}, {}
    for r in righe:
        conta[r["esito"]] = conta.get(r["esito"], 0) + 1
    for pp in per_cod.values():
        for p, _ in pp:
            pst[p["stato"]] = pst.get(p["stato"], 0) + 1
    fonti_gr = {}
    for r in righe:
        if r["esito"] in ("identificato", "misto") and r["fonte_principale"]:
            g = gruppo(r["fonte_principale"])
            fonti_gr[g] = fonti_gr.get(g, 0) + 1
    nuovi = [r for r in righe if r["esito"] == "identificato" and r["esito_metodo_vecchio"] != "identificato"]
    n_fin = sum(mappa.values())
    n_fin_id = sum(1 for r in conf.values() if r["identificata"])
    oggi = datetime.now(timezone.utc)
    scadenza = (oggi + timedelta(days=90)).strftime("%d/%m/%Y")
    rie = {"versione": 3, "codici_letti": len(righe), "esiti": conta, "pagine": pst,
           "pagine_totali": sum(pst.values()), "secondi_lettura": rie_v1.get("secondi_lettura"),
           "esiti_metodo_vecchio": rie_v1.get("esiti", {}), "pagine_metodo_vecchio": rie_v1.get("pagine", {}),
           "fonti_identificate_gruppi": fonti_gr, "finestre": n_fin, "finestre_identificate": n_fin_id,
           "esecuzione": url_run, "esecuzione_letture": run_letture, "letture_conservate_fino_al": scadenza,
           "corpora": corp.get("per_corpus", rie_old.get("corpora_seconda_versione", {})), "taratura": tara,
           "versioni_precedenti": vers_prec}
    json.dump(rie, open(os.path.join(prove, "riepilogo.json"), "w"), ensure_ascii=False, indent=1)

    # ---------------------------------------------------------------- RAPPORTO.md
    v1, v2 = vers_prec[0], vers_prec[1]
    vv = rie_v1.get("esiti", {})

    def q(d, k):
        return d.get(k, 0)

    L = ["# Prova di lettura automatica dei codici latini «sospetti» (ottobre 2026), terza versione\n"]
    L.append(f"Kraken (modello CATMuS Medieval) ha riletto circa 10 pagine di ciascuno dei {len(righe)} codici latini "
             "della prova (gli stessi delle versioni precedenti, `codici.json`) e questa volta le letture complete sono "
             f"state conservate. Il confronto tollerante verso le abbreviazioni della seconda versione è stato applicato a "
             f"**tutte le pagine lette**, non più ai soli estratti: {len(mappa)} pagine, divise in {n_fin} finestre di "
             f"{FINESTRA} parole.\n")
    L.append("## In breve\n")
    L.append("| | prima versione | seconda versione | terza: metodo vecchio sulle nuove letture | **terza versione** |")
    L.append("|---|---:|---:|---:|---:|")
    for k, nome in (("identificato", "identificati"), ("misto", "misti (alcune pagine note, altre no)"),
                    ("sospetto", "sospetti"), ("incerto", "incerti"), ("non leggibile", "non leggibili"),
                    ("altra lingua", "in volgare"), ("errore", "errori di rete o di manifesto")):
        L.append(f"| {nome} | {q(v1['esiti'], k)} | {q(v2['esiti'], k)} | {q(vv, k)} | **{q(conta, k)}** |")
    L.append(f"| codici letti | {v1.get('codici_letti')} | {v2.get('codici_letti')} | {rie_v1.get('codici_letti')} | "
             f"**{len(righe)}** |")
    L.append("")
    L.append("La colonna «metodo vecchio sulle nuove letture» separa i due effetti: quanto cambia perché la lettura "
             "automatica è stata rifatta, e quanto perché il confronto è migliore.\n")
    L.append(f"- Identificati dal confronto nuovo e non dal metodo vecchio sulle stesse letture: **{len(nuovi)}**.")
    cit = [x for x in sospetti if (x.get("miglior_affinita") or {}).get("citazione")]
    L.append(f"- Codici che restano sospetti o misti con una corrispondenza parziale forte (di solito una citazione "
             f"biblica o patristica dentro un commento o una predica): **{len(cit)}**.")
    L.append(f"- Finestre identificate: {n_fin_id} su {n_fin}. Pagine: " + ", ".join(f"{k} {v}" for k, v in sorted(pst.items(), key=lambda x: -x[1]))
             + f" (in tutto {sum(pst.values())}).")
    L.append("")
    L.append("## Con che cosa sono stati identificati (identificati e misti)\n")
    for k, v in sorted(fonti_gr.items(), key=lambda x: -x[1]):
        L.append(f"- {k}: {v}")
    L.append("")
    if nuovi:
        L.append("Identificati solo dal confronto nuovo (segnatura, fonte, pagine identificate su leggibili; esito col metodo vecchio):\n")
        for r in sorted(nuovi, key=lambda r: r["segnatura"]):
            L.append(f"- {r['segnatura']} ({r['biblioteca']}): {r['fonte_principale']}; {r['pagine_identificate']}/"
                     f"{r['pagine_leggibili']} pagine; prima: {r['esito_metodo_vecchio']}")
        L.append("")
    L.append("## Sospetti residui, ordinati per interesse\n")
    L.append("Interesse come nelle versioni precedenti: qualità della lettura × quantità di testo × pagine senza "
             "corrispondenza, con un vantaggio per palinsesti, maculature, testi dichiarati non identificati e codici fino "
             "al XII secolo, e uno svantaggio per i codici il cui titolo nel catalogo nomina già autore o opera. Gli "
             "estratti sono la lettura automatica grezza (abbreviazioni non sciolte, errori della macchina), al massimo tre "
             "righe. «Miglior affinità» è la corrispondenza più forte trovata su tutte le pagine non identificate del "
             "codice: un indizio, non un'identificazione.\n")
    for i, s in enumerate(sospetti[:60], 1):
        L.append(f"### {i}. {s['segnatura']} ({s['biblioteca']})\n")
        L.append(f"- Titolo nel catalogo: {s['titolo'] or '(nessuno)'}; datazione: {s['datazione'] or '?'}")
        L.append(f"- Scelto perché: {s['motivo_scelta']}. Esito: {s['esito']} ({s['pagine_sospette']} pagine sospette su "
                 f"{s['pagine_leggibili']} leggibili)")
        L.append(f"- Pagina {s['pagina']}{' (' + s['etichetta'] + ')' if s['etichetta'] else ''}: confidenza "
                 f"{s['confidenza']:.2f}, parole latine {s['quota_latina']:.0%}")
        a = s.get("miglior_affinita")
        if a and a.get("citazione"):
            L.append(f"- **Corrispondenza parziale forte** (citazione o testo affine, da verificare): {a['fonte']} "
                     f"({a['lette_coperte']} parole allineate, {a['piene']} piene)")
        elif a and a.get("piene", 0) >= 2:
            L.append(f"- Miglior affinità (debole, sotto soglia): {a['fonte']} ({a['lette_coperte']} parole allineate, {a['piene']} piene)")
        L.append(f"- Manifesto: {s['manifest']} (pagina {s['pagina']})")
        if s.get("immagine"):
            L.append(f"- Immagine: {s['immagine']}")
        if s.get("estratto"):
            L.append("- Estratto: «" + " / ".join(s["estratto"]) + "»")
        L.append("")
    if len(sospetti) > 60:
        L.append(f"Gli altri {len(sospetti) - 60} sospetti e misti sono in `sospetti.json`.\n")
    pc = rie["corpora"]
    L.append("## Come è stato fatto il confronto\n")
    L.append("Il metodo è quello della seconda versione (`scripts/prova-lettura/riconfronta.py`): ogni parola letta diventa "
             "una forma con le lettere sicure (ꝑ = p…r, ꝓ = pro, ꝰ = s, ꝯ = c, lettere soprascritte come lettere, un piccolo "
             "lessico per le sigle isolate: ⁊ et, ẽ est, ñ non, ꝙ quod...); una parola abbreviata corrisponde a una parola "
             "del testo noto se ha la stessa iniziale e le sue lettere vi compaiono nello stesso ordine; i candidati si "
             "cercano con le iniziali di cinque parole di fila e si verificano con un allineamento locale parola per parola.\n")
    L.append(f"- **Su tutte le pagine**: ogni pagina leggibile (anche quelle che il metodo vecchio chiamava «non leggibili» "
             f"per le troppe abbreviazioni) è divisa in finestre di {FINESTRA} parole, la lunghezza dei passi della taratura.")
    L.append(f"- Una finestra è identificata con le soglie della seconda versione: almeno 8 parole lette allineate, 5 parole "
             f"piene distinte in comune, metà della regione coperta, punteggio di almeno {tara.get('soglia', 12.0)} (il "
             f"massimo ottenuto dal caso è {tara.get('nul_punteggio_max', '?')}) e almeno il 40% delle parole della finestra allineate.")
    L.append(f"- Una pagina è identificata se lo è almeno un quarto delle sue finestre; altrimenti le finestre identificate "
             "sono una citazione dentro un altro testo e la pagina resta com'era. Una pagina già identificata dal metodo "
             "vecchio resta identificata. L'esito del codice segue le regole di sempre (identificato se le pagine note sono "
             "almeno quante le sospette, misto se sono meno).")
    if tara:
        L.append(f"- Taratura (seconda versione, passi di 25 parole abbreviati e sporcati come una lettura CATMuS): "
                 f"ritrovati {tara.get('sim_trovati')} su {tara.get('sim_totale')}; falsi positivi sui passi rimescolati "
                 f"{tara.get('nul_sim_positivi')} su {tara.get('nul_sim_totale')} e sugli estratti reali rimescolati "
                 f"{tara.get('nul_est_positivi')} su {tara.get('nul_est_totale')}.")
    L.append("- Corpora: " + ", ".join(f"{k} {v / 1e6:.1f} M parole" for k, v in pc.items())
             + " (licenze come nella seconda versione: Vulgata pubblico dominio; Perseus, CSEL e Patrologia Latina "
             "di OpenGreekAndLatin CC BY-SA 4.0; The Latin Library nella copia CLTK, Public Domain Mark; Divinum Officium, MIT).")
    L.append("")
    L.append("## Limiti\n")
    L.append("- Mancano ancora la scolastica, la medicina, l'astronomia e il computo, quasi tutto il diritto canonico, le "
             "prediche e i commenti biblici dopo il IX secolo: molti sospetti residui sono di questo tipo.")
    L.append("- La lettura automatica è buona sulle minuscole librarie ordinate, debole su corsive, glosse fitte, notazione "
             "musicale, pagine rovinate e palinsesti; la confidenza di Kraken è alta anche su letture sbagliate.")
    L.append("- La lettura è stata rifatta: le pagine scelte e i risultati della macchina possono differire un poco da quelli "
             "della prima esecuzione (si vede nella colonna «metodo vecchio sulle nuove letture»).")
    L.append("")
    L.append("## Letture complete\n")
    L.append(f"Le letture complete non sono nel repository: restano negli artefatti `letture-*` dell'esecuzione "
             f"{run_letture} fino al {scadenza} circa (90 giorni). Per rifare solo il confronto senza rileggere le immagini: "
             f"workflow «Prova di lettura (Kraken)» con `da_run` = {run_letture}.")
    L.append("")
    L.append("## File\n")
    L.append("- `codici.json`: i 500 codici scelti, con il motivo della scelta.")
    L.append("- `risultati-codici.csv`: esito per codice (terza versione; `esito_metodo_vecchio` è il metodo della prima "
             "versione sulle stesse letture).")
    L.append("- `pagine.csv`: misure per pagina (stato con il metodo vecchio in `stato_prima`, finestre, finestre "
             "identificate, fonte, citazioni).")
    L.append("- `sospetti.json`: i sospetti e misti residui, con l'estratto breve e la miglior affinità trovata.")
    L.append("- `riepilogo.json`: i numeri di questo rapporto, con quelli delle versioni precedenti e la taratura.")
    L.append("")
    L.append(f"Esecuzione: {url_run}. Nessuna trascrizione completa è pubblicata.\n")
    L.append("## Versioni precedenti\n")
    e1, e2 = v1["esiti"], v2["esiti"]
    L.append(f"La **prima versione** (esecuzione {v1.get('esecuzione')}) confrontava le pagine intere con il metodo dei "
             f"6-grammi delle prime due lettere sui corpora Vulgata, Perseus, CSEL e Patrologia Latina voll. 3-85: "
             f"{v1.get('codici_letti')} codici letti; identificati {q(e1, 'identificato')}, misti {q(e1, 'misto')}, sospetti "
             f"{q(e1, 'sospetto')}, incerti {q(e1, 'incerto')}, non leggibili {q(e1, 'non leggibile')}, in volgare "
             f"{q(e1, 'altra lingua')}, errori {q(e1, 'errore')}; identificati quasi tutti sulla Vulgata. Le sue letture "
             f"complete furono cancellate a fine esecuzione. La **seconda versione** applicò il confronto tollerante verso "
             f"le abbreviazioni, con in più The Latin Library e Divinum Officium, ai soli estratti dei sospetti (circa 24 "
             f"parole per codice): identificati {q(e2, 'identificato')}, misti {q(e2, 'misto')}, sospetti {q(e2, 'sospetto')}"
             + (" (nuove identificazioni soprattutto nel Corpus iuris civilis e nelle Decretali)" if v2.get("fonti_nuove") else "")
             + ". Questa terza versione rilegge le immagini degli stessi codici e applica quel confronto a tutte le pagine.")
    open(os.path.join(prove, "RAPPORTO.md"), "w").write("\n".join(L) + "\n")
    print(json.dumps({"esiti": conta, "metodo_vecchio": vv, "nuovi": len(nuovi), "finestre": n_fin,
                      "finestre_identificate": n_fin_id}, ensure_ascii=False))


if __name__ == "__main__":
    if sys.argv[1] == "finestre":
        cmd_finestre(*sys.argv[2:6])
    elif sys.argv[1] == "rapporto":
        cmd_rapporto(*sys.argv[2:11])
    else:
        raise SystemExit(__doc__)
