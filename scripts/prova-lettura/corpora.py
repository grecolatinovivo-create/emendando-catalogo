"""Indice dei testi latini noti (corpora APERTI) per il confronto con la lettura automatica.

Corpora (licenze controllate il 25 ottobre 2026):
- PerseusDL canonical-latinLit: classici latini, CC BY-SA 4.0;
- OpenGreekAndLatin csel-dev: Corpus Scriptorum Ecclesiasticorum Latinorum, CC BY-SA 4.0;
- OpenGreekAndLatin patrologia_latina-dev: Patrologia Latina di Migne (volumi 3-85, fino
  all'VIII secolo circa), CC BY-SA 4.0;
- Vulgata (scrollmapper/bible_databases, testo di pubblico dominio, repository MIT).

Uso: python corpora.py <cartella corpora> <file indice .npz>
Scrive l'indice: codici dei 6-grammi di chiavi (ordinati, unici), per ciascuno il documento
della prima occorrenza, l'elenco dei documenti e il vocabolario (parole normalizzate).
"""
import glob
import html
import json
import os
import re
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comune import chiavi, ngrammi, normalizza  # noqa: E402

CART = sys.argv[1]
OUT = sys.argv[2]

_HDR = re.compile(r"<teiHeader.*?</teiHeader>", re.S)
_NOTE = re.compile(r"<(note|bibl|ref|del|sic|orig|reg|abbr|figure|milestone)\b[^>]*?/>|<(note|bibl|del|figure)\b.*?</\2>", re.S)
_SHY = re.compile(r"[­\-]\s*<lb\s*/>\s*")
_TAG = re.compile(r"<[^>]+>")
_TITLE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.S)
_HTITLE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.S)


def testo_xml(s):
    s = _HDR.sub(" ", s)
    s = _NOTE.sub(" ", s)
    s = _SHY.sub("", s)
    s = _TAG.sub(" ", s)
    return html.unescape(s)


def titolo_header(s):
    h = re.search(r"<teiHeader.*?</teiHeader>", s, re.S)
    if not h:
        return ""
    au = re.search(r"<author\b[^>]*>(.*?)</author>", h.group(0), re.S)
    ti = _HTITLE.search(h.group(0))
    pulisci = lambda x: re.sub(r"\s+", " ", _TAG.sub(" ", x)).strip()  # noqa: E731
    a = pulisci(au.group(1)) if au else ""
    t = pulisci(ti.group(1)) if ti else ""
    return (a + ", " + t).strip(", ")


docs = []      # etichette
pezzi = []     # (array codici, id documento)
vocab = {}
tot_parole = 0


def aggiungi(etichetta, testo):
    global tot_parole
    ws = normalizza(testo).split()
    if len(ws) < 20:
        return
    did = len(docs)
    docs.append(etichetta)
    tot_parole += len(ws)
    for w in ws:
        if len(w) >= 3:
            vocab[w] = vocab.get(w, 0) + 1
    g = np.unique(ngrammi(chiavi(ws)))
    pezzi.append((g, np.full(len(g), did, dtype=np.uint32)))


t0 = time.time()
# 1. Vulgata (per libro)
vul = os.path.join(CART, "Vulgate.txt")
if os.path.exists(vul):
    libro, buf = None, []
    for riga in open(vul, encoding="utf-8"):
        if riga.startswith("###"):
            if libro and buf:
                aggiungi("Vulgata, " + libro, " ".join(buf))
            libro, buf = riga.strip("# \n"), []
        else:
            buf.append(re.sub(r"^\[\d+:\d+\]\s*", "", riga))
    if libro and buf:
        aggiungi("Vulgata, " + libro, " ".join(buf))
print("vulgata", len(docs), round(time.time() - t0), "s", flush=True)

# 2. Perseus e CSEL (per opera)
for corpus, nome in (("canonical-latinLit", "Perseus"), ("csel-dev", "CSEL")):
    for f in sorted(glob.glob(os.path.join(CART, corpus, "data", "*", "*", "*lat*.xml"))):
        s = open(f, encoding="utf-8", errors="replace").read()
        aggiungi(f"{nome}: {titolo_header(s) or os.path.basename(f)}", testo_xml(s))
    print(nome, len(docs), round(time.time() - t0), "s", flush=True)

# 3. Patrologia Latina (volumi interi, divisi per titolo d'opera)
for f in sorted(glob.glob(os.path.join(CART, "pl", "volumes", "PL[0-9]*", "PL*.xml"))):
    vol = re.sub(r"\D", "", os.path.basename(f).split(".")[0].split("_")[0])
    s = open(f, encoding="utf-8", errors="replace").read()
    s = _HDR.sub(" ", s)
    parti = _TITLE.split(s)  # testo, titolo, testo, titolo, ...
    corrente = f"Patrologia Latina, vol. {vol}"
    for i, p in enumerate(parti):
        if i % 2 == 1:
            t = re.sub(r"\s+", " ", _TAG.sub(" ", p)).strip()
            if t:
                corrente = f"Patrologia Latina, vol. {vol}, {t[:90]}"
            continue
        aggiungi(corrente, testo_xml(p))
print("PL", len(docs), round(time.time() - t0), "s", flush=True)

codici = np.concatenate([p[0] for p in pezzi])
did = np.concatenate([p[1] for p in pezzi])
ordine = np.argsort(codici, kind="stable")
codici, did = codici[ordine], did[ordine]
u, idx, cont = np.unique(codici, return_index=True, return_counts=True)
voc = np.array(sorted(w for w, c in vocab.items() if c >= 2))
np.savez_compressed(OUT, codici=u, doc=did[idx], diffusione=np.minimum(cont, 65535).astype(np.uint16), vocab=voc)
json.dump({"documenti": docs, "parole": tot_parole, "ngrammi": int(len(u))}, open(OUT.replace(".npz", ".json"), "w"), ensure_ascii=False)
print("fatto:", len(docs), "documenti,", tot_parole, "parole,", len(u), "6-grammi,", len(voc), "voci nel vocabolario,", round(time.time() - t0), "s")
