"""Secondo confronto della prova di lettura: tollerante verso le abbreviazioni e su corpora più ampi.

Il primo confronto (confronta.py) riduceva ogni parola alle prime due lettere e cercava sequenze esatte di sei
parole: con la trascrizione diplomatica di CATMuS (abbreviazioni non sciolte: dñs, ꝙ, ꝑ, ĩtłłigat᷑, oĩa...) basta
una parola con l'inizio abbreviato, o due parole fuse dallo scriba, per rompere la sequenza.

Qui invece:
1. ogni parola letta diventa una FORMA: le lettere che si vedono, con i segni speciali ridotti alle lettere sicure
   (ꝑ = p..r, ꝓ = pro, ꝰ = s, ꝯ = c, ꝙ = q, lettere soprascritte come lettere) e il segno «abbreviata» se c'erano
   titulus o segni; le sigle isolate più comuni (⁊, ẽ, ñ, ꝙ, ħ, gͦ, ł...) hanno un piccolo lessico;
2. una forma abbreviata corrisponde a una parola del corpus se ha la stessa iniziale e le sue lettere compaiono
   nella parola nello stesso ordine (dñs in dominus, oĩa in omnia, ĩtłłigat᷑ in intelligatur); una forma piena se è
   uguale o differisce di una lettera (errori di lettura);
3. i candidati si trovano con le INIZIALI di cinque parole di fila (l'inizio della parola è quasi sempre scritto per
   intero) e si verificano con un allineamento locale (Smith-Waterman) parola per parola, che ammette lacune, parole
   fuse e parole spezzate;
4. un'identificazione vale solo se l'allineamento copre almeno 8 parole lette con almeno 5 parole piene non
   funzionali in comune: due parole comuni non bastano. La soglia è tarata sul caso (le stesse parole rimescolate).

Uso:
  python riconfronta.py corpora <cartella corpora> <testi.npz>     # prepara i testi normalizzati
  python riconfronta.py cerca <testi.npz> <richieste.json> <uscita.json>  # confronta
richieste.json: [{"id": ..., "testo": "..."}]; uscita: per ogni id la migliore corrispondenza.
"""
import glob
import html
import json
import os
import random
import re
import sys
import time
import unicodedata

import numpy as np

# ---------------------------------------------------------------- normalizzazione comune

_DOPPIE = re.compile(r"([a-z])\1+")


def pulisci(s: str) -> str:
    """Lettere a-z con le equivalenze ortografiche medievali (u/v, i/j/y, ae/oe/e, h muta, ph/f, doppie)."""
    s = s.lower().replace("æ", "e").replace("œ", "e").replace("ę", "e").replace("ǽ", "e").replace("ſ", "s")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("j", "i").replace("v", "u").replace("y", "i").replace("k", "c").replace("w", "uu")
    s = s.replace("ph", "f").replace("ae", "e").replace("oe", "e").replace("h", "")
    s = re.sub(r"[^a-z]+", " ", s)
    return _DOPPIE.sub(r"\1", s)


def parole_corpus(testo: str):
    return pulisci(testo).split()


# ---------------------------------------------------------------- forme della lettura (CATMuS, MUFI)

# segni speciali -> lettere sicure; tutti rendono la parola «abbreviata»
SEGNI = {
    "ꝑ": "pr", "ꝓ": "pro", "ꝗ": "q", "ꝙ": "q", "ꝯ": "c", "ꝰ": "s", "ꝫ": "e", "ꝭ": "s", "ꝝ": "r", "ꝵ": "r",
    "ꝶ": "r", "ẜ": "s", "ł": "l", "ħ": "h", "đ": "d", "ƀ": "b", "ꝟ": "u", "ꝕ": "pr", "ꝥ": "t", "ꝧ": "t",
    "ꝉ": "l", "ꝃ": "c", "ꝁ": "c", "÷": "est", "ꝋ": "o", "ꝍ": "o", "ꝏ": "o", "ꜧ": "h", "ȝ": "", "ꝸ": "",
    "ꝩ": "u", "ꞃ": "r", "ꝺ": "d", "ꝼ": "f", "ꞅ": "s", "ꞇ": "t", "ȷ": "i", "ı": "i", "ꝛ": "r", "ſ": "s",
}
SEGNI_PIENI = set("ꝛſꝺꝼꞅꞇȷıꞃꝩ")  # forme di lettera, non abbreviazioni
# lettere soprascritte (U+0363-U+036F) e alcune del blocco esteso
SOPRA = {0x363: "a", 0x364: "e", 0x365: "i", 0x366: "o", 0x367: "u", 0x368: "c", 0x369: "d", 0x36A: "h", 0x36B: "m",
         0x36C: "r", 0x36D: "t", 0x36E: "u", 0x36F: "x", 0x1DD1: "r", 0x1DD3: "a", 0x1DDA: "g", 0x1DDC: "c",
         0x1DE4: "s", 0x1DE6: "z", 0x1DD8: "d", 0x1DE0: "n", 0x1DDE: "l", 0x1DDF: "m", 0x1DE3: "r", 0x1DE2: "r"}
SUP_ASCII = {"ᵃ": "a", "ᵉ": "e", "ⁱ": "i", "ᵒ": "o", "ᵘ": "u", "ᶜ": "c", "ᵈ": "d", "ᵐ": "m", "ʳ": "r", "ᵗ": "t",
             "ˢ": "s", "ⁿ": "n", "ᵍ": "g", "ˡ": "l"}

# sigle isolate frequenti -> parole possibili (già normalizzate con pulisci)
LESSICO = {
    "⁊": ["et"], "&": ["et"], "ẽ": ["est"], "÷": ["est"], "ē": ["est"], "ẽẽ": ["ese"], "eẽ": ["ese"], "ẽe": ["ese"],
    "ñ": ["non"], "n̄": ["non"], "ꝙ": ["quod"], "qđ": ["quod"], "qd̃": ["quod"], "qđ.": ["quod"], "ꝗ": ["que", "qui", "quia", "quam"],
    "ħ": ["oc", "ec"], "h̃": ["oc", "ec"], "ł": ["uel"], "uł": ["uel"], "gͦ": ["ergo"], "g̊": ["ergo"], "ĩ": ["in"], "ꝑ": ["per"],
    "ꝓ": ["pro"], "ꝯ": ["con", "cum", "contra"], "sꝫ": ["scilicet", "sed"], "tñ": ["tamen"], "tm̃": ["tamen"], "tn̄": ["tamen"],
    "cũ": ["cum"], "dr̃": ["dicitur"], "dr": ["dicitur"], "i": ["id"], "q̃": ["que", "quam"], "qͥ": ["qui"], "qᷓ": ["qua", "quasi"],
    "ꝗa": ["quia"], "qr": ["quia"], "qr̃": ["quare"], "nã": ["nam"], "mͥ": ["mii"], "tͥ": ["tibi"], "sͥ": ["sibi"],
    "nͥ": ["nisi"], "ũ": ["unde"], "uñ": ["unde"], "ꝯͣ": ["contra"], "ꝓͥ": ["proprie"], "eꝰ": ["eius"], "eiꝰ": ["eius"],
    "dñs": ["dominus"], "dñi": ["domini"], "dño": ["domino"], "dñm": ["dominum"], "dñe": ["domine"],
    "ds̃": ["deus"], "dš": ["deus"], "dı̃": ["dei"], "dĩ": ["dei"], "dõ": ["deo"], "dm̃": ["deum"],
    "ihs": ["iesus"], "ihu": ["iesu"], "ihm": ["iesum"], "xps": ["cristus"], "xpi": ["cristi"], "xpo": ["cristo"],
    "xpm": ["cristum"], "xpe": ["criste"], "xp̃s": ["cristus"], "xp̃i": ["cristi"], "xp̃o": ["cristo"], "xp̃m": ["cristum"],
    "sčs": ["sanctus"], "scs": ["sanctus"], "scı̃": ["sancti"], "scĩ": ["sancti"], "scõ": ["sancto"],
}
FUNZ = set(pulisci("""et in est non quod que qui quia sed ut enim autem uel sunt ab ex per quam sicut nec ergo eius ideo uero
tamen atque item ad cum de a e si se sibi suo sua suum hoc haec hec id ita iam nam esse erat ille illa illud is ea eo
nos uos me te tu ego quo qua quid quis an aut ac at tunc ubi unde inter post ante pro sub super contra ipse ipsa
ipsum etiam dicit dicitur scilicet secundum nisi sine oc ec""").split())

_PUNT = re.compile(r"^[\s.,:;·¶|/\\()\[\]'\"!?¬=⸗-]+|[\s.,:;·¶|/\\()\[\]'\"!?¬=⸗-]+$")


def forma(raw: str):
    """Parola letta -> (lettere, abbreviata, parole possibili dal lessico o None). None se non è una parola."""
    t = _PUNT.sub("", raw.lower())
    if not t or re.search(r"\d", t):
        return None
    tn = unicodedata.normalize("NFC", t)
    if tn in LESSICO:
        cand = LESSICO[tn]
        return (cand[0], True, frozenset(cand))
    abbr = False
    out = []
    for ch in unicodedata.normalize("NFD", tn):
        o = ord(ch)
        if ch in SEGNI:
            out.append(SEGNI[ch])
            abbr = abbr or ch not in SEGNI_PIENI
        elif o in SOPRA:
            out.append(SOPRA[o])
            abbr = True
        elif ch in SUP_ASCII:
            out.append(SUP_ASCII[ch])
            abbr = True
        elif unicodedata.combining(ch):
            abbr = True
        elif ch == "&":
            out.append("et")
        elif "a" <= ch <= "z" or ch in "æœę":
            out.append(ch)
        elif ch in ".":
            abbr = True  # punto di abbreviazione dentro la parola
    s = "".join(out)
    if s.startswith("xp"):
        s = "cr" + s[2:]
    elif s.startswith("ih") and abbr:
        s = "ie" + s[2:]
    s = pulisci(s).replace(" ", "")
    if not s:
        return None
    return (s, abbr, None)


def forme_testo(testo: str):
    """Testo letto (righe unite) -> lista di forme. Gestisce i trattini a fine riga."""
    testo = re.sub(r"[-=¬⸗]\s*\n\s*", "", testo)
    out = []
    for w in testo.split():
        f = forma(w)
        if f:
            out.append(f)
    return out


# ---------------------------------------------------------------- confronto parola per parola

def _sottoseq(a, b):
    it = iter(b)
    return all(c in it for c in a)


def _lev1(a, b, k):
    """Distanza di edit <= k (k piccolo)."""
    if abs(len(a) - len(b)) > k:
        return False
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        best = cur[0]
        for j, cb in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
            best = min(best, cur[j])
        if best > k:
            return False
        prev = cur
    return prev[-1] <= k


_CACHE = {}


def somiglia(f, w):
    """Forma letta f contro parola del corpus w -> 0..1 (0 = no)."""
    key = (f, w)
    r = _CACHE.get(key)
    if r is not None:
        return r
    s, abbr, cand = f
    if cand is not None:
        r = 1.0 if w in cand else 0.0
    elif s == w:
        r = 1.0
    elif not abbr:
        if len(s) >= 5 and _lev1(s, w, 1):
            r = 0.8
        elif len(s) >= 8 and _lev1(s, w, 2):
            r = 0.7
        elif len(s) >= 3 and s[0] == w[0] and len(s) * 2 >= len(w) and _sottoseq(s, w):
            r = 0.5  # abbreviazione senza segno letto
        else:
            r = 0.0
    else:
        if s[0] == w[0] and len(w) <= 3 * len(s) + 3 and _sottoseq(s, w):
            r = 0.85 if len(s) >= 3 else 0.45
        elif len(s) >= 5 and s[0] == w[0] and _sottoseq(s[:-1], w):
            r = 0.5  # ultima lettera sbagliata o segno finale sciolto altrimenti
        else:
            r = 0.0
    if len(_CACHE) > 3_000_000:
        _CACHE.clear()
    _CACHE[key] = r
    return r


def peso(w):
    return 0.35 if w in FUNZ or len(w) <= 2 else 1.0 + min(len(w), 10) / 10.0


MISMATCH, GAP = -1.0, -0.9


def allinea(q, c):
    """Smith-Waterman: forme lette q contro parole del corpus c.
    Restituisce (punteggio, i0, i1, j0, j1, coppie) della migliore regione locale."""
    n, m = len(q), len(c)
    H = np.zeros((n + 1, m + 1))
    T = np.zeros((n + 1, m + 1), dtype=np.int8)  # 1 diag, 2 su, 3 sinistra, 4 fusione (1 letta = 2 corpus), 5 divisione
    best, bi, bj = 0.0, 0, 0
    for i in range(1, n + 1):
        fi = q[i - 1]
        for j in range(1, m + 1):
            w = c[j - 1]
            s = somiglia(fi, w)
            d = H[i - 1, j - 1] + (s * peso(w) * 2.0 if s > 0 else MISMATCH)
            v, t = d, 1
            u = H[i - 1, j] + GAP
            if u > v:
                v, t = u, 2
            le = H[i, j - 1] + GAP
            if le > v:
                v, t = le, 3
            if j >= 2 and not fi[1] and fi[2] is None and len(fi[0]) >= 5:
                cc = c[j - 2] + w
                if fi[0] == cc or (len(cc) >= 6 and _lev1(fi[0], cc, 1)):
                    f2 = H[i - 1, j - 2] + (peso(c[j - 2]) + peso(w)) * 1.6
                    if f2 > v:
                        v, t = f2, 4
            if i >= 2 and not fi[1] and not q[i - 2][1] and q[i - 2][2] is None and len(w) >= 5:
                qq = q[i - 2][0] + fi[0]
                if qq == w or (len(w) >= 6 and _lev1(qq, w, 1)):
                    f2 = H[i - 2, j - 1] + peso(w) * 2.0
                    if f2 > v:
                        v, t = f2, 5
            if v <= 0:
                v, t = 0.0, 0
            H[i, j] = v
            T[i, j] = t
            if v > best:
                best, bi, bj = v, i, j
    # ritorno
    i, j = bi, bj
    coppie = []
    while i > 0 and j > 0 and T[i, j] != 0 and H[i, j] > 0:
        t = T[i, j]
        if t == 1:
            coppie.append((i - 1, j - 1, somiglia(q[i - 1], c[j - 1])))
            i, j = i - 1, j - 1
        elif t == 2:
            i -= 1
        elif t == 3:
            j -= 1
        elif t == 4:
            coppie.append((i - 1, j - 1, 1.0))
            coppie.append((i - 1, j - 2, 1.0))
            i, j = i - 1, j - 2
        else:
            coppie.append((i - 1, j - 1, 1.0))
            coppie.append((i - 2, j - 1, 1.0))
            i, j = i - 2, j - 1
    coppie.reverse()
    return best, i, bi, j, bj, coppie


def misura(q, c, al):
    """Misure di un allineamento: parole lette coperte, parole piene in comune, lunghezza."""
    best, i0, i1, j0, j1, coppie = al
    buone = [(a, b, s) for a, b, s in coppie if s > 0]
    piene = {c[b] for a, b, s in buone if s >= 0.7 and c[b] not in FUNZ and len(c[b]) >= 4}
    lette = {a for a, b, s in buone}
    return {"punteggio": round(float(best), 2), "lette_coperte": len(lette), "estensione": i1 - i0,
            "piene": len(piene), "copertura": round(len(lette) / max(1, i1 - i0), 2),
            "quota_estratto": round(len(lette) / max(1, len(q)), 2)}


def identificata(m):
    """Criterio: almeno 8 parole lette nell'allineamento, 5 parole piene distinte in comune, metà della regione
    coperta, punteggio sopra il caso (tarato sui passi rimescolati: massimo 8,5) e almeno il 40% delle parole lette
    allineate (sotto, è una citazione dentro un altro testo: commento, predica, glossa)."""
    return (m["estensione"] >= 8 and m["piene"] >= 5 and m["copertura"] >= 0.5 and m["punteggio"] >= SOGLIA
            and m.get("quota_estratto", 1.0) >= 0.4)


def citazione(m):
    """Corrispondenza forte ma su una parte minore della lettura: probabile citazione."""
    return (m["estensione"] >= 6 and m["piene"] >= 4 and m["copertura"] >= 0.5 and m["punteggio"] >= SOGLIA * 0.75
            and not identificata(m))


SOGLIA = 12.0

# ---------------------------------------------------------------- ricerca con le iniziali

K = 5  # parole per seme
BITS = 5


def iniziale(f):
    s, abbr, cand = f
    if cand is not None:
        ini = {w[0] for w in cand}
        return ord(next(iter(ini))) - 96 if len(ini) == 1 else 0
    return ord(s[0]) - 96


def semi(ini):
    """Array di iniziali (0 = jolly) -> codici dei K-grammi e maschera dei validi."""
    ini = np.asarray(ini, dtype=np.int64)
    if len(ini) < K:
        return np.zeros(0, dtype=np.int64), np.zeros(0, dtype=bool)
    cod = np.zeros(len(ini) - K + 1, dtype=np.int64)
    ok = np.ones(len(ini) - K + 1, dtype=bool)
    for t in range(K):
        x = ini[t: len(ini) - K + 1 + t]
        cod |= x << (BITS * t)
        ok &= x > 0
    return cod, ok


def cerca(testi, richieste, minimo_semi=2, finestra=12, log=True):
    """richieste: {id: [forme]} -> {id: migliore (documento, misure, allineamento breve)}."""
    tab = {}
    for rid, q in richieste.items():
        cod, ok = semi([iniziale(f) for f in q])
        for p in np.nonzero(ok)[0]:
            tab.setdefault(int(cod[p]), []).append((rid, int(p)))
    chiavi = np.array(sorted(tab), dtype=np.int64)
    migliori = {}
    t0 = time.time()
    nver = 0
    for d, (etichetta, parole, ini) in enumerate(testi):
        cod, ok = semi(ini)
        if len(cod) == 0:
            continue
        pos = np.nonzero(ok & np.isin(cod, chiavi))[0]
        if len(pos) == 0:
            continue
        # raggruppo per richiesta e diagonale
        cand = {}
        for p in pos:
            for rid, qp in tab[int(cod[p])]:
                cand.setdefault((rid, (int(p) - qp) // 8), set()).add(qp)
        for (rid, dg), qps in cand.items():
            if len(qps) < minimo_semi:
                continue
            q = richieste[rid]
            a = max(0, dg * 8 - finestra)
            b = min(len(parole), dg * 8 + 8 + len(q) + finestra)
            c = parole[a:b]
            al = allinea(q, c)
            nver += 1
            m = misura(q, c, al)
            prec = migliori.get(rid)
            if prec is None or m["punteggio"] > prec["misure"]["punteggio"]:
                _, i0, i1, j0, j1, _ = al
                migliori[rid] = {"fonte": etichetta, "misure": m, "corpus": " ".join(c[j0:j1])[:160]}
        if log and d % 2000 == 0:
            print(f"  {d}/{len(testi)} testi, {nver} verifiche, {round(time.time() - t0)} s", flush=True)
    return migliori


# ---------------------------------------------------------------- lettura dei corpora

_HDR = re.compile(r"<teiHeader.*?</teiHeader>", re.S)
_NOTE = re.compile(r"<(note|bibl|ref|del|sic|orig|reg|abbr|figure|milestone)\b[^>]*?/>|<(note|bibl|del|figure)\b.*?</\2>", re.S)
_SHY = re.compile(r"[­\-]\s*<lb\s*/>\s*")
_TAG = re.compile(r"<[^>]+>")
_TITLE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.S)


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
    ti = _TITLE.search(h.group(0))
    p = lambda x: re.sub(r"\s+", " ", _TAG.sub(" ", x)).strip()  # noqa: E731
    return ((p(au.group(1)) if au else "") + ", " + (p(ti.group(1)) if ti else "")).strip(", ")


def leggi_corpora(cart):
    """Generatore di (etichetta, testo). Documenti lunghi spezzati in pezzi da ~20.000 parole."""
    vul = os.path.join(cart, "Vulgate.txt")
    if os.path.exists(vul):
        libro, buf = None, []
        for riga in open(vul, encoding="utf-8"):
            if riga.startswith("###"):
                if libro and buf:
                    yield "Vulgata, " + libro, " ".join(buf)
                libro, buf = riga.strip("# \n"), []
            else:
                buf.append(re.sub(r"^\[\d+:\d+\]\s*", "", riga))
        if libro and buf:
            yield "Vulgata, " + libro, " ".join(buf)
    for corpus, nome in (("perseus", "Perseus"), ("csel", "CSEL")):
        for f in sorted(glob.glob(os.path.join(cart, corpus, "data", "*", "*", "*lat*.xml"))):
            s = open(f, encoding="utf-8", errors="replace").read()
            yield f"{nome}: {titolo_header(s) or os.path.basename(f)}", testo_xml(s)
    for f in sorted(glob.glob(os.path.join(cart, "pl", "volumes", "PL[0-9]*", "PL*.xml"))):
        vol = re.sub(r"\D", "", os.path.basename(f).split(".")[0].split("_")[0])
        s = _HDR.sub(" ", open(f, encoding="utf-8", errors="replace").read())
        parti = _TITLE.split(s)
        corrente = f"Patrologia Latina, vol. {vol}"
        for i, p in enumerate(parti):
            if i % 2 == 1:
                t = re.sub(r"\s+", " ", _TAG.sub(" ", p)).strip()
                if t:
                    corrente = f"Patrologia Latina, vol. {vol}, {t[:90]}"
                continue
            yield corrente, testo_xml(p)
    # The Latin Library (CLTK, Public Domain Mark)
    ll = os.path.join(cart, "ll")
    for f in sorted(glob.glob(os.path.join(ll, "**", "*.txt"), recursive=True)):
        rel = os.path.relpath(f, ll)
        if rel.startswith(("README", "LICENSE")) or rel in ("index.txt", "indices.txt"):
            continue
        s = open(f, encoding="utf-8", errors="replace").read()
        prima = next((r.strip() for r in s.splitlines() if r.strip()), "")[:70]
        yield f"The Latin Library: {rel[:-4]} ({prima})", s
    # Divinum Officium (MIT): breviario e messale romano, salterio gallicano
    do = os.path.join(cart, "divinum-officium", "web", "www")
    for parte, nome in (("horas", "Breviarium Romanum"), ("missa", "Missale Romanum")):
        for f in sorted(glob.glob(os.path.join(do, parte, "Latin", "**", "*.txt"), recursive=True)):
            rel = os.path.relpath(f, os.path.join(do, parte, "Latin"))
            righe = []
            titolo = ""
            sez = ""
            for r in open(f, encoding="utf-8", errors="replace"):
                r = r.strip()
                if r.startswith("["):
                    sez = r
                    continue
                if not r or r[0] in "@$&#!_(" or r.startswith(("v.", "r.")) and False:
                    continue
                if sez.startswith("[Officium") and not titolo:
                    titolo = r[:60]
                if sez.startswith(("[Rank", "[Rule", "[Officium", "[Comment")):
                    continue
                r = re.sub(r"^(V\.|R\.|v\.|r\.|Ant\.|℣\.|℟\.|\*)\s*", "", r)
                righe.append(re.sub(r"[*‡†;]", " ", r))
            if righe:
                yield f"Divinum Officium, {nome}: {rel[:-4]}{' (' + titolo + ')' if titolo else ''}", "\n".join(righe)


def prepara(cart, out):
    """Testi normalizzati in forma compatta: vocabolario + id delle parole per pezzo (~20.000 parole)."""
    voc = {}
    ids, inizi, etichette = [], [0], []
    t0 = time.time()
    tot = 0
    conta = {}
    for etichetta, testo in leggi_corpora(cart):
        ws = parole_corpus(testo)
        if len(ws) < 20:
            continue
        corpus = etichetta.split(":")[0].split(",")[0]
        conta[corpus] = conta.get(corpus, 0) + len(ws)
        a = np.fromiter((voc.setdefault(w, len(voc)) for w in ws), dtype=np.int32, count=len(ws))
        for k in range(0, len(a), 20000):
            pezzo = a[max(0, k - 50): k + 20000]
            ids.append(pezzo)
            inizi.append(inizi[-1] + len(pezzo))
            etichette.append(etichetta)
        tot += len(ws)
    vocab = np.array(sorted(voc, key=voc.get), dtype=object)
    np.savez(out, ids=np.concatenate(ids), inizi=np.array(inizi, dtype=np.int64),
             vocab=np.array(vocab.tolist(), dtype=str))
    json.dump({"etichette": etichette, "parole": tot, "pezzi": len(etichette), "per_corpus": conta},
              open(out.replace(".npz", ".json"), "w"), ensure_ascii=False)
    print(f"{len(etichette)} pezzi, {tot} parole, {len(vocab)} forme, {round(time.time() - t0)} s", conta, flush=True)


class Testi:
    """Accesso ai pezzi dei corpora preparati: (etichetta, parole come lista, iniziali)."""

    def __init__(self, path):
        z = np.load(path)
        self.ids, self.inizi = z["ids"], z["inizi"]
        self.vocab = z["vocab"].tolist()
        self.ini_voc = np.array([ord(w[0]) - 96 for w in self.vocab], dtype=np.int8)
        self.et = json.load(open(path.replace(".npz", ".json")))["etichette"]

    def __len__(self):
        return len(self.et)

    def __iter__(self):
        for d in range(len(self.et)):
            a = self.ids[self.inizi[d]: self.inizi[d + 1]]
            yield self.et[d], _Parole(a, self.vocab), self.ini_voc[a]


class _Parole:
    def __init__(self, a, vocab):
        self.a, self.v = a, vocab

    def __len__(self):
        return len(self.a)

    def __getitem__(self, sl):
        return [self.v[i] for i in self.a[sl]]


if __name__ == "__main__":
    if sys.argv[1] == "corpora":
        prepara(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "cerca":
        testi = Testi(sys.argv[2])
        req = json.load(open(sys.argv[3]))
        richieste = {r["id"]: forme_testo(r["testo"]) for r in req}
        res = cerca(testi, richieste)
        for rid, r in res.items():
            r["identificata"] = identificata(r["misure"])
            r["citazione"] = citazione(r["misure"])
        json.dump(res, open(sys.argv[4], "w"), ensure_ascii=False, indent=1)
