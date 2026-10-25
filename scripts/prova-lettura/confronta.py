"""Confronto delle letture con i testi noti e scrittura dei risultati della prova.

Uso: python confronta.py <codici.json> <cartella letture> <indice.npz> <cartella risultati>

Per ogni pagina:
- confidenza media di Kraken (pesata sui caratteri);
- quota latina: parte delle parole intere (senza segni di abbreviazione, almeno 3 lettere)
  che esistono nel vocabolario dei corpora: dice se la lettura è latino sensato;
- quota riconosciuta: parte delle parole lette coperte da almeno un 6-gramma di chiavi che
  esiste nei corpora; da questa si toglie la quota che si ottiene con le stesse parole
  rimescolate (il «caso»), così resta solo la corrispondenza dovuta al testo;
- fonte: il documento dei corpora con più 6-grammi in comune.
Nessuna trascrizione completa esce di qui: per i sospetti solo poche righe.
"""
import csv
import glob
import json
import os
import random
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comune import chiavi, ngrammi, parole, parole_piene  # noqa: E402

CODICI, LETTURE, INDICE, OUT = sys.argv[1:5]

CONF_MIN = 0.80      # sotto: pagina «non leggibile»
LATINO_MIN = 0.55    # quota di parole intere che sono latino noto (le pagine medievali lette bene: 0,65-0,90)
CAR_MIN = 120        # sotto: pagina vuota o quasi
PAROLE_MIN = 20
ID_MIN = 0.08        # quota riconosciuta netta da cui la pagina è «identificata» (il caso dà 0-0,02)
SOSP_MAX = 0.03      # quota netta sotto cui la pagina leggibile è «sospetta»

ix = np.load(INDICE)
COD, DOC, DIFF = ix["codici"], ix["doc"], ix["diffusione"]
VOC = set(ix["vocab"].tolist())
DOCS = json.load(open(INDICE.replace(".npz", ".json")))["documenti"]


def presenti(g):
    if len(g) == 0:
        return np.zeros(0, dtype=bool), np.zeros(0, dtype=np.int64)
    pos = np.searchsorted(COD, g)
    pos[pos >= len(COD)] = len(COD) - 1
    return COD[pos] == g, pos


def copertura(ch, n=6):
    g = ngrammi(ch, n)
    ok, pos = presenti(g)
    cop = np.zeros(len(ch), dtype=bool)
    for i in np.nonzero(ok)[0]:
        cop[i: i + n] = True
    return cop.mean() if len(ch) else 0.0, ok, pos


def testo_pagina(righe):
    out = ""
    for r in righe:
        t = r["t"].strip()
        if out.endswith(("-", "=", "¬", "⸗")):
            out = out[:-1] + t
        else:
            out += (" " if out else "") + t
    return out


def analizza(pag):
    righe = pag.get("righe", [])
    ncar = sum(len(r["t"]) for r in righe)
    conf = (sum(r["c"] * len(r["t"]) for r in righe) / ncar) if ncar else 0.0
    testo = testo_pagina(righe)
    ws = parole(testo)
    piene = parole_piene(testo)
    latino = (sum(1 for w in piene if w in VOC) / len(piene)) if piene else 0.0
    r = {"righe": len(righe), "caratteri": ncar, "confidenza": round(conf, 3), "parole": len(ws),
         "quota_latina": round(latino, 3)}
    if pag.get("errore") and not righe:
        r["stato"] = "errore"
        r["errore"] = pag["errore"]
        return r, testo
    ch = chiavi(ws)
    q, ok, pos = copertura(ch)
    rnd = random.Random(len(ws))
    base = []
    for _ in range(5):
        w2 = ws[:]
        rnd.shuffle(w2)
        base.append(copertura(chiavi(w2))[0])
    b = float(np.mean(base)) if base else 0.0
    netta = max(0.0, q - b)
    r.update({"quota_riconosciuta": round(float(q), 3), "quota_caso": round(b, 3), "quota_netta": round(float(netta), 3),
              "ngrammi_trovati": int(ok.sum())})
    if ok.sum():
        # documento con più 6-grammi in comune (escludo le formule diffusissime)
        sel = pos[ok]
        sel = sel[DIFF[sel] <= 200] if (DIFF[sel] <= 200).any() else sel
        docs, cont = np.unique(DOC[sel], return_counts=True)
        j = int(np.argmax(cont))
        r["fonte"] = DOCS[int(docs[j])]
        r["fonte_ngrammi"] = int(cont[j])
    if ncar < CAR_MIN or len(ws) < PAROLE_MIN:
        r["stato"] = "vuota"
    elif conf < CONF_MIN or latino < LATINO_MIN:
        r["stato"] = "non leggibile"
    elif netta >= ID_MIN and ok.sum() >= 4:
        r["stato"] = "identificata"
    elif netta < SOSP_MAX:
        r["stato"] = "sospetta"
    else:
        r["stato"] = "incerta"
    return r, testo


def estratto(pag, max_righe=3, max_car=220):
    buone = [r["t"].strip() for r in pag.get("righe", []) if r["c"] >= 0.9 and len(r["t"].strip()) >= 25]
    out, n = [], 0
    for t in buone[len(buone) // 3:]:  # dal primo terzo della pagina, non l'intestazione
        if len(out) >= max_righe or n + len(t) > max_car:
            break
        out.append(t)
        n += len(t)
    return out


def main():
    cod = json.load(open(CODICI))
    info = {c["id"]: c for c in cod["codici"]}
    os.makedirs(OUT, exist_ok=True)
    pagine_rows, codici_rows, sospetti = [], [], []
    letti = 0
    secondi = 0.0
    for f in sorted(glob.glob(os.path.join(LETTURE, "**", "*.json"), recursive=True)):
        try:
            rec = json.load(open(f))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        if "pagine" not in rec or rec.get("id") not in info:
            continue
        c = info[rec["id"]]
        letti += 1
        stati = []
        fonti = {}
        migliori = []
        for p in rec["pagine"]:
            secondi += p.get("secondi", 0) or 0
            a, testo = analizza(p)
            stati.append(a["stato"])
            if a["stato"] == "identificata" and a.get("fonte"):
                fonti[a["fonte"]] = fonti.get(a["fonte"], 0) + 1
            pagine_rows.append({
                "id": c["id"], "segnatura": c["segnatura"], "biblioteca": c["biblioteca"], "pagina": p.get("canvas"),
                "etichetta": p.get("etichetta", ""), "tipo": p.get("tipo", ""), "stato": a["stato"],
                "righe": a["righe"], "confidenza_media": a["confidenza"], "quota_latina": a["quota_latina"],
                "quota_riconosciuta": a.get("quota_riconosciuta", ""), "quota_caso": a.get("quota_caso", ""),
                "quota_netta": a.get("quota_netta", ""), "fonte": a.get("fonte", "") if a.get("quota_netta", 0) >= 0.05 else "",
                "manifest": c["manifest"], "immagine": p.get("immagine", ""),
            })
            if a["stato"] == "sospetta":
                migliori.append((a["confidenza"] * a["quota_latina"] * min(1.0, a["parole"] / 120), p, a))
        n_id = stati.count("identificata")
        n_sosp = stati.count("sospetta")
        n_legg = n_id + n_sosp + stati.count("incerta")
        if rec.get("errore") and not rec["pagine"]:
            esito = "errore"
        elif n_legg == 0:
            esito = "non leggibile"
        elif n_id and n_id >= n_sosp:
            esito = "identificato"
        elif n_id:
            esito = "misto"  # alcune pagine note, altre no: codice composito o testo sconosciuto accanto a uno noto
        elif n_sosp:
            esito = "sospetto"
        else:
            esito = "incerto"
        fonte = max(fonti, key=fonti.get) if fonti else ""
        row = {"id": c["id"], "segnatura": c["segnatura"], "biblioteca": c["biblioteca"], "datazione": c.get("datazione", ""),
               "titolo": c["titolo"], "motivo_scelta": c["motivo"], "esito": esito, "pagine_lette": len(rec["pagine"]),
               "pagine_leggibili": n_legg, "pagine_identificate": n_id, "pagine_sospette": n_sosp,
               "fonte_principale": fonte, "manifest": c["manifest"], "errore": rec.get("errore", "")}
        codici_rows.append(row)
        if esito in ("sospetto", "misto") and migliori:
            migliori.sort(key=lambda x: -x[0])
            sc, p, a = migliori[0]
            interesse = sc * (1 + 0.5 * (n_sosp - 1)) * (0.6 if esito == "misto" else 1.0)
            if "palinsesto" in c["motivo"] or "maculatura" in c["motivo"] or "non identificato" in c["motivo"]:
                interesse *= 1.2
            sospetti.append({**row, "interesse": round(interesse, 3), "pagina": p.get("canvas"), "etichetta": p.get("etichetta", ""),
                             "immagine": p.get("immagine", ""), "confidenza": a["confidenza"], "quota_latina": a["quota_latina"],
                             "quota_netta": a.get("quota_netta"), "estratto": estratto(p), "pagina_web": c.get("pagina")})
    sospetti.sort(key=lambda s: -s["interesse"])

    with open(os.path.join(OUT, "pagine.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(pagine_rows[0].keys()) if pagine_rows else ["id"])
        w.writeheader()
        w.writerows(pagine_rows)
    with open(os.path.join(OUT, "risultati-codici.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(codici_rows[0].keys()) if codici_rows else ["id"])
        w.writeheader()
        w.writerows(codici_rows)
    json.dump(sospetti, open(os.path.join(OUT, "sospetti.json"), "w"), ensure_ascii=False, indent=1)

    conta = {}
    for r in codici_rows:
        conta[r["esito"]] = conta.get(r["esito"], 0) + 1
    pst = {}
    for r in pagine_rows:
        pst[r["stato"]] = pst.get(r["stato"], 0) + 1
    fonti_id = {}
    for r in codici_rows:
        if r["esito"] in ("identificato", "misto") and r["fonte_principale"]:
            k = r["fonte_principale"].split(",")[0] if r["fonte_principale"].startswith("Vulgata") else r["fonte_principale"]
            fonti_id[k] = fonti_id.get(k, 0) + 1
    json.dump({"codici_letti": letti, "esiti": conta, "pagine": pst, "pagine_totali": len(pagine_rows),
               "secondi_lettura": round(secondi), "fonti_identificate": fonti_id},
              open(os.path.join(OUT, "riepilogo.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps({"codici_letti": letti, "esiti": conta, "pagine": pst}, ensure_ascii=False))


if __name__ == "__main__":
    main()
