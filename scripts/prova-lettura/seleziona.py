"""Selezione dei 500 codici latini «sospetti» per la prova di lettura (senza scaricare immagini).

Uso: python seleziona.py <cartella data/catalogo> <uscita codici.json>

Criteri: lingua latina (dichiarata o dedotta), nessun autore né opera riconosciuti, datazione
tra VI e XV secolo (o assente), titolo generico o assente (miscellanea, frammenti, fogli di
guardia, compositi, maculature, palinsesti, anonimi), niente documenti d'archivio.
Fonti escluse: Vaticana (10 secondi tra le richieste, anche attraverso il proxy di Heidelberg),
loc e nlg (senza servizio Image), Yale (robots.txt vieta /manifests/), Ambrosiana (condizioni
d'uso restrittive), Gallica (limiti di richiesta molto stretti), DS (aggregatore di molti
server diversi). Un lotto = un server di immagini: i lotti girano in parallelo, ma dentro un
lotto le richieste sono in fila.
"""
import json
import random
import re
import sys

CAT = sys.argv[1].rstrip("/") + "/"
OUT = sys.argv[2]

# lotto (server di immagini) per fonte, e quanti codici prendere
LOTTI = {
    "bsb": ("digitale-sammlungen", 56), "bamberga": ("digitale-sammlungen", 9),
    "heidelberg": ("heidelberg", 55), "ecodices": ("ecodices", 62), "berlino": ("berlino", 50),
    "bodleian": ("bodleian", 75), "laurenziana": ("contentdm", 41), "auckland": ("contentdm", 1),
    "leiden": ("leiden", 55), "lipsia": ("lipsia", 83), "penn": ("penn", 35),
}
PAUSE = {"contentdm": 1.5}  # robots.txt: Crawl-Delay 1

MOTIVI = [
    ("palinsesto", 6, r"palimps|palinsest|rescript"),
    ("titolo assente o testo non identificato", 5, r"^\s*$|without title|sine titulo|ohne titel|untitled|unbekannt|unidentified|non identificat|nicht identifiziert|anonym|incert|ignot|unknown"),
    ("maculatura o frammento di legatura", 5, r"makulatur|maculatur|einbandfragment|einbandbezug|einband|ansetzfalz|spiegel|vorsatz|binding fragment|pastedown|in binding|from a binding|binding"),
    ("fogli di guardia", 4, r"flyleaf|fly-leaf|flyleaves|guardia|guard leaf|vorsatzbl|schutzbl"),
    ("frammento", 3, r"fragment|fragm\.|frammento|frammenti|bruchst|cuttings?\b|leaf from|leaves from|\bfolio from|\bfolder of the fragment"),
    ("codice composito", 2, r"composit|sammelh|sammelband|zusammengesetzt|convolut|konvolut"),
    ("miscellanea", 2, r"miscell|varia\b|\bvarious\b|mélanges|recueil|collectanea|opuscula|sammlung|mixed|excerpta"),
]
ESCLUDI = r"\bch\.|charter|deed|quitclaim|grant;|lease|will,|account;|urkunde|document|letter|brief|notar|\batto\b|indulgen|bulla|\brolls?\b|orgeltabulatur|musikhandschrift|notre-dame-polyphonie|schultensios|ad schultens"

idx = json.load(open(CAT + "indice.json"))
bibl = idx["biblioteche"]


def fnv(s):
    """FNV-1a a 32 bit sulle unità UTF-16 dell'id (come scripts/costruisci.mjs)."""
    b = s.encode("utf-16-le")
    h = 0x811C9DC5
    for i in range(0, len(b), 2):
        h ^= b[i] | (b[i + 1] << 8)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


cache = {}


def voce(id_, fonte):
    n = idx["fonti"][fonte]["pezzi_voci"]
    k = f"{fonte}-{fnv(id_) % n}"
    if k not in cache:
        cache[k] = {m["id"]: m for m in json.load(open(CAT + "voci/" + k + ".json"))["manoscritti"]}
    return cache[k].get(id_)


cand = {}
for p in idx["pezzi"]:
    f = p["fonte"]
    if f not in LOTTI:
        continue
    for r in json.load(open(CAT + p["file"]))["righe"]:
        d = dict(zip(idx["campi"], r))
        lingue = (d["lingue"] or "").split(",")
        if "la" not in lingue or "grc" in lingue:
            continue  # solo latino (la Laurenziana dà titoli latini anche ai codici greci)
        if re.search(r"\b(anonumou|anonimou|tou|kai|logoi|peri)\b", (d["titolo"] or "").lower()) or re.search(r" \. [A-Z]\w*(ou|oi|ai|os|on|es)\b", d["titolo"] or ""):
            continue  # titolo latino seguito dalla traslitterazione greca (Bandini): codice greco
        if d["autori"] or d["opere"]:
            continue
        t = (d["titolo"] or "").lower()
        if re.search(ESCLUDI, t + " " + d["segnatura"].lower()):
            continue
        sd, sa = d["secolo_da"] or 0, d["secolo_a"] or 0
        if sa > 15 or (sd and sd < 6):
            continue
        motivi = [(n, w) for n, w, pat in MOTIVI if re.search(pat, t)]
        if not motivi:
            continue
        if not sd and not any(n.startswith(("frammento", "maculatura", "palinsesto")) for n, _ in motivi):
            continue  # senza data e senza indizio di frammento medievale: rischio di carte moderne
        punti = sum(w for _, w in motivi)
        if len(t) > 90:
            punti -= 2  # titoli lunghi: il contenuto è già descritto
        testa = (d["titolo"] or "").split(":")[0]
        if ":" in (d["titolo"] or "") and len(testa.split()) <= 5 and testa[:1].isupper() and not re.search(r"fragment|composite|sammel|miscell|part", testa, re.I):
            punti -= 3  # «Autore: opera»: il testo è già noto
        if re.search(r"vulgat|\bbibl|bibel|evangeli|gospel", t):
            punti -= 3
        if re.search(r"liturg|gradual|antiphon|breviar|missal|sacrament|psalter|horae|book of hours|stundenbuch", t):
            punti -= 1  # liturgici: di solito identificabili
        if sa == 0:
            punti -= 1
        d["fonte"] = f
        d["motivi"] = [n for n, _ in motivi]
        d["punti"] = punti
        cand.setdefault(f, []).append(d)

random.seed(20261025)
scelti = []
for f, (lotto, quanti) in LOTTI.items():
    lista = cand.get(f, [])
    v_ok = []
    for d in lista:
        v = voce(d["id"], f)
        if not v or not v.get("manifest"):
            continue
        if "bav_" in v["manifest"] or "vatlib" in v["manifest"]:
            continue  # Vaticana attraverso Heidelberg
        d["v"] = v
        v_ok.append(d)
    random.shuffle(v_ok)
    v_ok.sort(key=lambda d: -d["punti"])
    # varietà: non più di 6 codici dalla stessa collezione di frammenti (stessa radice di segnatura)
    radici = {}
    for d in v_ok:
        rad = re.sub(r"[\s(.,:]*\d+[a-z]?\)?$", "", d["segnatura"]).strip()
        rad = re.sub(r"\(fragment \d+\)", "", rad, flags=re.I).strip()
        if radici.get(rad, 0) >= 6 and rad not in ("Clm", "Ms", "MS", "BPL", "Hs I", "Cod. Sang."):
            continue
        radici[rad] = radici.get(rad, 0) + 1
        v = d["v"]
        scelti.append({
            "id": d["id"], "fonte": f, "lotto": lotto, "segnatura": d["segnatura"],
            "biblioteca": v.get("biblioteca", "") + (", " + v["citta"] if v.get("citta") else ""),
            "datazione": v.get("datazione") or (f"sec. {d['secolo_da']}-{d['secolo_a']}" if d["secolo_da"] else ""),
            "titolo": d["titolo"], "motivo": "; ".join(d["motivi"]), "punti": d["punti"],
            "lingua_dedotta": bool(d["lingua_dedotta"]), "manifest": v["manifest"], "pagina": v.get("pagina"),
            "licenza": v.get("licenza"),
        })
        if sum(1 for s in scelti if s["fonte"] == f) >= quanti:
            break

lotti = {}
for s in scelti:
    lotti.setdefault(s["lotto"], {"codici": 0, "pausa": PAUSE.get(s["lotto"], 1.0)})
    lotti[s["lotto"]]["codici"] += 1
json.dump({"descrizione": __doc__.strip(), "totale": len(scelti), "lotti": lotti, "codici": scelti},
          open(OUT, "w"), ensure_ascii=False, indent=1)
print(len(scelti), {k: v["codici"] for k, v in lotti.items()})
