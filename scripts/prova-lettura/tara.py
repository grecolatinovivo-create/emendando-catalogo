"""Taratura del secondo confronto: passi simulati (dai corpora, abbreviati e sporcati come CATMuS) e passi rimescolati.

Uso: python tara.py <passi simulati.json> <confronti.json> <indice vecchio .npz> <uscita taratura.json>
passi simulati: [{"id", "testo", "vero"}]; confronti: uscita di «riconfronta.py cerca» su simulati, simulati
rimescolati («nul-sim-...»), estratti reali («<id>#n») ed estratti rimescolati («nul-<id>#n»).
Il metodo della prima versione (comune.py, 6-grammi delle prime due lettere) si misura sugli stessi passi simulati.
"""
import json
import os
import random
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comune import chiavi, ngrammi, parole  # noqa: E402
from riconfronta import SOGLIA, identificata  # noqa: E402

SIM, CONF, INDICE, OUT = sys.argv[1:5]
sim = json.load(open(SIM))
conf = json.load(open(CONF))
COD = np.load(INDICE)["codici"]


def copertura(ws):
    ch = chiavi(ws)
    g = ngrammi(ch)
    if len(g) == 0:
        return 0.0, 0
    pos = np.searchsorted(COD, g)
    pos[pos >= len(COD)] = len(COD) - 1
    ok = COD[pos] == g
    cop = np.zeros(len(ch), dtype=bool)
    for i in np.nonzero(ok)[0]:
        cop[i: i + 6] = True
    return cop.mean(), int(ok.sum())


def vecchio(testo):
    ws = parole(testo)
    q, n = copertura(ws)
    rnd = random.Random(len(ws))
    base = []
    for _ in range(5):
        w2 = ws[:]
        rnd.shuffle(w2)
        base.append(copertura(w2)[0])
    return max(0.0, q - float(np.mean(base))) >= 0.08 and n >= 4


def ok(k):
    r = conf.get(k)
    return bool(r and identificata(r["misure"]))


trov = [s for s in sim if ok(s["id"])]
giusti = [s for s in trov if conf[s["id"]]["fonte"] == s["vero"]]
nul_sim = [k for k in conf if k.startswith("nul-sim-")]
nul_est = [k for k in conf if k.startswith("nul-") and not k.startswith("nul-sim-")]
n_nul_est = sum(1 for k in conf if k.startswith("nul-") and not k.startswith("nul-sim-"))
tot_nul_sim = sum(1 for s in sim)
out = {
    "soglia": SOGLIA,
    "sim_totale": len(sim), "sim_trovati": len(trov), "sim_giusti": len(giusti),
    "vecchio_trovati": sum(1 for s in sim if vecchio(s["testo"])),
    "nul_sim_totale": tot_nul_sim, "nul_sim_positivi": sum(1 for k in nul_sim if ok(k)),
    "nul_est_totale": int(sys.argv[5]) if len(sys.argv) > 5 else n_nul_est,
    "nul_est_positivi": sum(1 for k in nul_est if ok(k)),
    "nul_punteggio_max": max([conf[k]["misure"]["punteggio"] for k in nul_sim + nul_est] or [0]),
}
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
print(out)
