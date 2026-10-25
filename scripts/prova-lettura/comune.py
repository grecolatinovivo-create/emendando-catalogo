"""Normalizzazione comune per il confronto tra la lettura automatica (Kraken, trascrizione
grafematica con abbreviazioni non sciolte, come esce da CATMuS) e i testi noti (edizioni a
stampa, con abbreviazioni sciolte).

Il confronto non usa le parole intere, ma una CHIAVE per parola: le prime due lettere dopo la
normalizzazione (u/v, i/j, y>i, k>c, h tolta, ae/oe>e). Le abbreviazioni medievali
tagliano quasi sempre l'interno o la fine della parola (nõis = nominis, fcat = significat è
l'eccezione), quindi l'inizio della parola resta affidabile. Sei chiavi di fila (6-gramma)
formano un codice a 60 bit esatto, senza funzioni di hash: due righe uguali hanno lo stesso
codice, due testi diversi quasi mai.
"""
import re
import unicodedata

import numpy as np

N = 6  # parole per n-gramma

# Segni di abbreviazione più comuni nella trascrizione CATMuS (MUFI), con lo scioglimento
# più probabile. Servono soprattutto per l'inizio della parola (la chiave).
SIGLE = {
    "⁊": " et ", "&": " et ", "ꝑ": "per", "ꝓ": "pro", "ꝙ": "quod", "ꝗ": "que", "ꝯ": "con",
    "ꝰ": "us", "ꝭ": "is", "ꝝ": "rum", "ꝛ": "r", "ſ": "s", "ł": "uel", "ꝟ": "uer", "÷": "est",
    "ꝫ": "et", "ꝶ": "rum", "ẜ": "s", "ꝩ": "u", "ꝁ": "c", "ꝃ": "c", "ꝉ": "l", "ꝋ": "o",
    "ꝍ": "o", "ꝏ": "oo", "ꝕ": "pre", "ꝥ": "t", "ꝧ": "t", "ꝵ": "rum", "ȷ": "i", "ı": "i",
    "æ": "e", "œ": "e", "ę": "e", "ǽ": "e",
}
_SIGLE_RE = re.compile("|".join(re.escape(k) for k in SIGLE))
_NONLETT = re.compile(r"[^a-z ]+")


def normalizza(testo: str) -> str:
    """Testo -> minuscole a-z e spazi, con le equivalenze ortografiche medievali."""
    t = testo.lower()
    t = _SIGLE_RE.sub(lambda m: SIGLE[m.group(0)], t)
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.replace("j", "i").replace("v", "u").replace("y", "i").replace("k", "c").replace("w", "uu")
    t = t.replace("ae", "e").replace("oe", "e").replace("h", "")
    t = _NONLETT.sub(" ", t)
    return t


def parole(testo: str):
    return [p for p in normalizza(testo).split() if p]


def chiave(parola: str) -> int:
    """Prime due lettere della parola -> intero 0..1023 (10 bit)."""
    a = ord(parola[0]) - 96
    b = ord(parola[1]) - 96 if len(parola) > 1 else 0
    return a * 27 + b


def chiavi(lista):
    return np.fromiter((chiave(p) for p in lista), dtype=np.uint64, count=len(lista))


def ngrammi(ch: np.ndarray, n: int = N) -> np.ndarray:
    """Array di chiavi -> codici a 60 bit degli n-grammi consecutivi."""
    if len(ch) < n:
        return np.zeros(0, dtype=np.uint64)
    out = np.zeros(len(ch) - n + 1, dtype=np.uint64)
    for i in range(n):
        out |= ch[i: len(ch) - n + 1 + i] << np.uint64(10 * i)
    return out


# Parole con segni di abbreviazione (prima della normalizzazione): non contano per la
# misura del «latino leggibile» (non si possono cercare nel vocabolario).
_ABBR = re.compile(r"[̀-ͯ᷀-᷿-" + "".join(re.escape(k) for k in SIGLE if k not in "&æœ") + r"]")


def parole_piene(testo: str):
    """Parole della lettura senza segni di abbreviazione, normalizzate (per il vocabolario)."""
    out = []
    for w in testo.split():
        if _ABBR.search(unicodedata.normalize("NFD", w)):
            continue
        for p in normalizza(w).split():
            if len(p) >= 3:
                out.append(p)
    return out
