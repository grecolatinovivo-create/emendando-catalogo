"""Lettura automatica (Kraken) di poche pagine per codice, per UN lotto (una biblioteca).

Uso: python leggi.py <codici.json> <lotto> <cartella uscita> <modello riconoscimento> [--max-minuti=320]

- Le richieste alla biblioteca sono in fila, mai in parallelo: almeno 1 secondo tra una e
  l'altra (di più se il server chiede Retry-After o Crawl-Delay), con un User-Agent che dice
  chi siamo.
- Le immagini si scaricano in una cartella temporanea, si leggono e si cancellano subito.
- Le letture (righe e confidenze) si scrivono in <uscita>/<id>.json; restano negli
  artefatti dell'esecuzione, non nel repository.
- Due processi di lettura lavorano insieme mentre il filo principale scarica la pagina dopo.
"""
import json
import os
import re
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request

UA = "EmendandoCatalogo-ProvaLettura/0.1 (+https://github.com/grecolatinovivo-create/emendando-catalogo; prova pilota HTR, poche pagine per codice)"
LARGHEZZA = 2000
PAGINE_MAX = int(os.environ.get("PAGINE_MAX", "10"))
PAUSA = 1.0
ALTEZZA_MAX = 3200
SECONDI_PAGINA = 240  # una pagina che si blocca (segmentazione impazzita) si abbandona

COPERTA = re.compile(r"einband|deckel|\bcover|binding|reliure|\bplat\b|\bplats\b|piatto|piatti|legatura|spine|rücken|ruecken|\bdos\b|schnitt|\bedge|farbkeil|colou?r ?(chart|checker|bar)|colorchecker|qp card|ruler|grey ?scale|gr[ae]ukeil|scala|ma(ss|ß)stab|\bboard|\bdorso|taglio|tranche|kapital|clasp|schließe|fermagli|target", re.I)
GUARDIA = re.compile(r"vorsatz|flyleaf|fly-leaf|fly leaf|guard|guardia|garde|spiegel|paste-?down|contre-?plat|schutzbl", re.I)
FOLIO = re.compile(r"(^|[^a-z])(\d+\s*[rv]\b|f(ol)?\.?\s*\d|c\.\s*\d|bl\.\s*\d|p\.\s*\d|seite|page)", re.I)

_ultima = [0.0]
_pausa = [PAUSA]


def richiesta(url, binario=False, tentativi=4):
    for t in range(tentativi):
        attesa = _ultima[0] + _pausa[0] - time.time()
        if attesa > 0:
            time.sleep(attesa)
        _ultima[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=90) as r:
                dati = r.read()
            return dati if binario else json.loads(dati.decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 503, 502, 504):
                ra = e.headers.get("Retry-After")
                try:
                    pausa = min(max(float(ra), 2), 300)
                except (TypeError, ValueError):
                    pausa = 10 * (t + 1)
                _pausa[0] = min(max(_pausa[0], 2.0) * 1.5, 10)  # rallenta da qui in poi
                print(f"  {e.code}: attendo {pausa:.0f}s, pausa ora {_pausa[0]:.1f}s", flush=True)
                time.sleep(pausa)
                continue
            raise
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            print("  rete:", e, flush=True)
            time.sleep(5 * (t + 1))
    raise RuntimeError("troppi tentativi: " + url)


def etichetta(x):
    if isinstance(x, str):
        return x
    if isinstance(x, dict):
        if "@value" in x:
            return str(x["@value"])
        for v in x.values():
            return etichetta(v)
    if isinstance(x, list) and x:
        return etichetta(x[0])
    return ""


def canvas(manifest):
    """Elenco (indice, etichetta, servizio immagine, larghezza, versione)."""
    out = []
    if "sequences" in manifest:  # Presentation 2
        cvs = manifest["sequences"][0].get("canvases", []) if manifest["sequences"] else []
        for i, c in enumerate(cvs):
            try:
                res = c["images"][0]["resource"]
            except (KeyError, IndexError):
                continue
            s = res.get("service") or {}
            if isinstance(s, list):
                s = s[0] if s else {}
            sid = s.get("@id") or s.get("id")
            prof = json.dumps(s.get("profile", ""))
            ver = 3 if "image/3" in json.dumps(s.get("@context", "")) or s.get("type") == "ImageService3" else 2
            out.append((i, etichetta(c.get("label", "")), sid, res.get("width") or c.get("width"), ver, prof))
    else:  # Presentation 3
        for i, c in enumerate(manifest.get("items", [])):
            try:
                body = c["items"][0]["items"][0]["body"]
            except (KeyError, IndexError):
                continue
            if isinstance(body, list):
                body = body[0]
            s = body.get("service") or []
            if isinstance(s, dict):
                s = [s]
            s = s[0] if s else {}
            sid = s.get("@id") or s.get("id")
            ver = 3 if s.get("type") == "ImageService3" else 2
            out.append((i, etichetta(c.get("label", "")), sid, body.get("width") or c.get("width"), ver, json.dumps(s.get("profile", ""))))
    return out


def scegli(cvs):
    """Prime, centrali e ultime pagine scritte, più i fogli di guardia riconoscibili; senza coperte.

    Se le etichette hanno la cartulazione (1r, fol. 2...), le pagine prima della prima carta
    numerata e dopo l'ultima sono coperte o guardie: si prende la più interna per parte come
    guardia. Se le etichette non dicono nulla (BSB: «(0001)»), si saltano le prime due e le
    ultime due immagini, che di solito sono la legatura.
    """
    testo = [c for c in cvs if c[2] and not COPERTA.search(c[1] or "")]
    guard = [c for c in testo if GUARDIA.search(c[1] or "")]
    corpo = [c for c in testo if c not in guard]
    numerate = [i for i, c in enumerate(corpo) if FOLIO.search(c[1] or "")]
    if numerate and len(numerate) >= 2:
        prima, ultima = numerate[0], numerate[-1]
        if not guard:
            guard = ([corpo[prima - 1]] if prima > 0 else []) + ([corpo[ultima + 1]] if ultima + 1 < len(corpo) else [])
        corpo = corpo[prima: ultima + 1]
    elif len(corpo) > 12:
        corpo = corpo[2:-2]
    scelte = []
    if guard:
        scelte += [("guardia", guard[0])] + ([("guardia", guard[-1])] if len(guard) > 1 else [])
    n = len(corpo)
    if n <= PAGINE_MAX - len(scelte):
        pos = [("inizio" if i < n / 3 else "centro" if i < 2 * n / 3 else "fine", i) for i in range(n)]
    else:
        prime = [0, 1, 2]
        centro = [round(n * 0.4), round(n * 0.6)]
        ultime = [n - 3, n - 2, n - 1]
        pos = [("inizio", i) for i in prime] + [("centro", i) for i in centro] + [("fine", i) for i in ultime]
    visti = set()
    for tipo, i in pos:
        if i not in visti and len(scelte) < PAGINE_MAX:
            visti.add(i)
            scelte.append((tipo, corpo[i]))
    scelte.sort(key=lambda x: x[1][0])
    return scelte


def url_immagine(sid, larghezza, ver, dim=LARGHEZZA):
    sid = sid.rstrip("/")
    if larghezza and int(larghezza) <= dim:
        dim_s = "max" if ver == 3 else "full"
    else:
        dim_s = f"!{dim},{ALTEZZA_MAX}"  # al massimo 2000 di larghezza e 3200 di altezza (rotoli e strisce lunghe)
    return f"{sid}/full/{dim_s}/0/default.jpg"


# ---- processi di lettura -------------------------------------------------------------
_M = {}


class TroppoTempo(Exception):
    pass


def _allarme(_sig, _frame):
    raise TroppoTempo(f"pagina oltre {SECONDI_PAGINA} secondi")


def _init(modello):
    import resource
    import signal
    signal.signal(signal.SIGALRM, _allarme)
    try:  # un processo di lettura non può prendersi tutta la memoria del runner
        lim = int(float(os.environ.get("MEMORIA_GB", "5")) * 1024 ** 3)
        resource.setrlimit(resource.RLIMIT_AS, (lim, lim))
    except (ValueError, OSError):
        pass
    import torch
    torch.set_num_threads(2)
    import kraken
    from kraken.lib import models, vgsl
    _M["seg"] = vgsl.TorchVGSLModel.load_model(os.path.join(os.path.dirname(kraken.__file__), "blla.mlmodel"))
    _M["rec"] = models.load_any(modello)


def _leggi(percorso):
    import signal
    from PIL import Image
    from kraken import blla, rpred
    t0 = time.time()
    signal.alarm(SECONDI_PAGINA)
    try:
        im = Image.open(percorso)
        im.load()
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        if im.width > LARGHEZZA or im.height > ALTEZZA_MAX:  # protezione della memoria
            im.thumbnail((LARGHEZZA, ALTEZZA_MAX))
        seg = blla.segment(im, model=_M["seg"])
        righe = []
        if seg.lines:
            for r in rpred.rpred(_M["rec"], im, seg):
                c = [float(x) for x in r.confidences]
                if r.prediction.strip():
                    righe.append({"t": r.prediction, "c": round(sum(c) / len(c), 4) if c else 0.0, "n": len(c)})
        return {"righe": righe, "secondi": round(time.time() - t0, 1), "dim": list(im.size)}
    except (Exception, TroppoTempo, MemoryError) as e:  # una pagina rotta non ferma il lotto
        return {"errore": f"{type(e).__name__}: {e}"[:300], "righe": [], "secondi": round(time.time() - t0, 1)}
    finally:
        signal.alarm(0)
        try:
            os.remove(percorso)  # l'immagine si usa e si cancella
        except OSError:
            pass


def _ciclo(conn, modello):
    """Processo di lettura: carica i modelli una volta e legge le pagine che riceve."""
    _init(modello)
    conn.send("pronto")
    while True:
        percorso = conn.recv()
        if percorso is None:
            return
        conn.send(_leggi(percorso))


class Lettori:
    """Processi di lettura con un limite di tempo DURO per pagina: se una pagina si blocca (per esempio
    la segmentazione dentro codice C che non sente i segnali) il processo si uccide e se ne avvia un altro.
    Interfaccia come ProcessPoolExecutor: submit() restituisce un Future."""

    def __init__(self, n, modello):
        import multiprocessing as mp
        import queue
        from concurrent.futures import Future
        self._Future = Future
        self._ctx = mp.get_context("spawn")
        self._modello = modello
        self._coda = queue.Queue()
        self._fili = [threading.Thread(target=self._gestore, daemon=True) for _ in range(n)]
        for f in self._fili:
            f.start()

    def _avvia(self):
        a, b = self._ctx.Pipe()
        pr = self._ctx.Process(target=_ciclo, args=(b, self._modello), daemon=True)
        pr.start()
        a.recv()  # "pronto"
        return pr, a

    def _gestore(self):
        pr, conn = self._avvia()
        while True:
            item = self._coda.get()
            if item is None:
                try:
                    conn.send(None)
                    pr.join(10)
                except OSError:
                    pass
                return
            percorso, fut = item
            t0 = time.time()
            try:
                conn.send(percorso)
                if conn.poll(SECONDI_PAGINA + 30):
                    fut.set_result(conn.recv())
                    continue
                esito = {"errore": f"pagina abbandonata dopo {SECONDI_PAGINA + 30} secondi", "righe": [], "secondi": round(time.time() - t0, 1)}
            except (EOFError, OSError) as e:  # processo morto (memoria)
                esito = {"errore": f"processo di lettura morto: {type(e).__name__}", "righe": [], "secondi": round(time.time() - t0, 1)}
            pr.kill()
            pr.join(10)
            try:
                os.remove(percorso)
            except OSError:
                pass
            print("  lettore riavviato:", esito["errore"], flush=True)
            fut.set_result(esito)
            pr, conn = self._avvia()

    def submit(self, _fn, percorso):
        fut = self._Future()
        self._coda.put((percorso, fut))
        return fut

    def shutdown(self):
        for _ in self._fili:
            self._coda.put(None)
        for f in self._fili:
            f.join(60)


def main():
    codici_f, lotto, uscita, modello = sys.argv[1:5]
    max_min = 320
    for a in sys.argv[5:]:
        if a.startswith("--max-minuti="):
            max_min = float(a.split("=")[1])
    scadenza = time.time() + max_min * 60
    tutti = json.load(open(codici_f))
    codici = [c for c in tutti["codici"] if c["lotto"] == lotto]
    if os.environ.get("PROVA_SOLO"):
        codici = codici[: int(os.environ["PROVA_SOLO"])]
    _pausa[0] = max(PAUSA, float(tutti.get("lotti", {}).get(lotto, {}).get("pausa", PAUSA)))
    os.makedirs(uscita, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="img-")
    print(f"lotto {lotto}: {len(codici)} codici, pausa {_pausa[0]}s, modello {os.path.basename(modello)}", flush=True)
    pool = Lettori(int(os.environ.get("PROCESSI", "2")), modello)
    limite = threading.Semaphore(4)  # al massimo 4 immagini in attesa sul disco
    futuri = []
    t_lotto = time.time()
    for k, c in enumerate(codici):
        dest = os.path.join(uscita, c["id"] + ".json")
        if os.path.exists(dest):
            continue
        if time.time() > scadenza:
            print("tempo finito: mi fermo qui", flush=True)
            break
        rec = {"id": c["id"], "manifest": c["manifest"], "lotto": lotto, "pagine": []}
        try:
            m = richiesta(c["manifest"])
            cvs = canvas(m)
            rec["canvas_totali"] = len(cvs)
            scelte = scegli(cvs)
        except Exception as e:
            rec["errore"] = f"manifesto: {type(e).__name__}: {e}"[:300]
            json.dump(rec, open(dest, "w"), ensure_ascii=False)
            print(f"[{k+1}/{len(codici)}] {c['id']}: {rec['errore']}", flush=True)
            continue
        if not scelte:
            rec["errore"] = "nessuna immagine con servizio IIIF Image"
        pend = []
        for tipo, (i, lab, sid, larg, ver, prof) in scelte:
            url = url_immagine(sid, larg, ver)
            pag = {"canvas": i + 1, "etichetta": lab, "tipo": tipo, "immagine": url}
            percorso = os.path.join(tmp, f"{c['id']}-{i}.jpg")
            limite.acquire()
            try:
                try:
                    dati = richiesta(url, binario=True)
                except urllib.error.HTTPError as e:
                    if e.code in (400, 403, 404, 501):  # dimensione non accettata: provo la piena
                        url = f"{sid.rstrip('/')}/full/{'max' if ver == 3 else 'full'}/0/default.jpg"
                        pag["immagine"] = url
                        dati = richiesta(url, binario=True)
                    else:
                        raise
                with open(percorso, "wb") as fh:
                    fh.write(dati)
                fut = pool.submit(_leggi, percorso)
                fut.add_done_callback(lambda _f: limite.release())
                pend.append((pag, fut))
                futuri = _scrivi_finiti(futuri, len(codici), t_lotto)
            except Exception as e:
                limite.release()
                pag["errore"] = f"immagine: {type(e).__name__}: {e}"[:300]
                pend.append((pag, None))
        futuri.append((rec, pend, dest, k))
        futuri = _scrivi_finiti(futuri, len(codici), t_lotto)
    for item in futuri:
        _scrivi(item, len(codici), t_lotto)
    pool.shutdown()
    try:
        os.rmdir(tmp)
    except OSError:
        pass
    print(f"lotto {lotto} finito in {round((time.time() - t_lotto) / 60, 1)} minuti", flush=True)


def _scrivi_finiti(futuri, tot, t0):
    ancora = []
    for item in futuri:
        if all(f is None or f.done() for _, f in item[1]):
            _scrivi(item, tot, t0)
        else:
            ancora.append(item)
    return ancora


def _scrivi(item, tot, t0):
    rec, pend, dest, k = item
    for pag, fut in pend:
        if fut is not None:
            pag.update(fut.result())
        rec["pagine"].append(pag)
    json.dump(rec, open(dest, "w"), ensure_ascii=False)
    nr = sum(len(p.get("righe", [])) for p in rec["pagine"])
    print(f"[{k+1}/{tot}] {rec['id']}: {len(rec['pagine'])} pagine, {nr} righe ({round((time.time() - t0) / 60, 1)} min)", flush=True)


if __name__ == "__main__":
    main()
