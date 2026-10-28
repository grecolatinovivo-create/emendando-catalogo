# Scrive data/luoghi.json (luoghi delle biblioteche per la mappa del catalogo del sito) dalla tabella curata (tabella.py) e da GeoNames (CC BY 4.0).
# Uso: scaricare https://download.geonames.org/export/dump/cities500.zip, CH.zip e US.zip in una cartella <geo> e scompattarli, poi
#   python3 -I scripts/luoghi/genera.py scripts/luoghi <geo> data/luoghi.json
# Per una biblioteca nuova senza città riconosciuta: aggiungere la città in tabella.L (con gli alias) o il nome in tabella.BIB.
import sys, json, importlib
sys.path.insert(0, sys.argv[1])
import gaz, tabella
geo = sys.argv[2]
gaz.load(geo + '/cities500.txt')
# dump per paese: solo località abitate (classe P)
for cc in ['CH', 'US']:
    for line in open(f'{geo}/{cc}.txt', encoding='utf8'):
        f = line.split('\t')
        if f[6] != 'P': continue
        rec = (f[0], f[1], float(f[4]), float(f[5]), f[8], f[10], int(f[14] or 0), f[7])
        for n in {f[1], f[2], *f[3].split(',')}:
            if n: gaz.G.setdefault((n.lower(), f[8]), []).append(rec)
out = {}; bad = []
for k, (it, en, gn, cc, a1, alias) in tabella.L.items():
    r = gaz.find(gn, cc, gid=a1[1:]) if a1 and a1.startswith("#") else gaz.find(gn, cc, a1)
    if not r: bad.append(k); continue
    d = {"nome": it}
    if en and en != it: d["en"] = en
    d.update(paese=cc, lat=round(r[2], 4), lon=round(r[3], 4), geonames=int(r[0]))
    out[k] = d
    print(k, r[1], r[4], r[5], r[2], r[3], r[6], r[7], file=sys.stderr)
print("NON TROVATI", bad, file=sys.stderr)
citta = {}
for k, v in tabella.L.items():
    for a in v[5]: citta[a] = k
# Giappone: per le biblioteche del Kokusho, che hanno (o avranno) la città nel nome. Città e comuni di GeoNames con almeno 10.000 abitanti o capoluoghi;
# alias: nome, nome ASCII e varianti con le vocali lunghe (Kyōto). Un alias condiviso da più luoghi vale solo se il più popoloso ha almeno il triplo degli abitanti.
import unicodedata
def senza(x): return ''.join(c for c in unicodedata.normalize('NFD', x) if unicodedata.category(c) != 'Mn')
jp = []
for line in open(geo + '/cities500.txt', encoding='utf8'):
    f = line.rstrip('\n').split('\t')
    if f[8] != 'JP': continue
    pop = int(f[14] or 0)
    if pop < 10000 and not f[7].startswith('PPLA'): continue
    tolto = lambda x: x[:-4] if x.endswith('-shi') else x
    jp.append((f[0], tolto(f[1]), tolto(f[2]), ','.join(tolto(a) for a in f[3].split(',')), float(f[4]), float(f[5]), pop))
cand = {}
for gid, name, ascii_, alt, lat, lon, pop in jp:
    al = {name, ascii_} | {a for a in alt.split(',') if a and senza(a) == ascii_ and a != ascii_}
    for a in al:
        for x in {a, a + '-shi'} if False else {a}:
            cand.setdefault(x, []).append((pop, gid, name, lat, lon))
usati_jp = {}
for a, lst in cand.items():
    if a in citta: continue
    lst.sort(reverse=True)
    if len(lst) > 1 and lst[0][0] < 3 * lst[1][0]: continue
    pop, gid, name, lat, lon = lst[0]
    k = 'tokyo' if name == 'Tokyo' else 'jp-' + senza(name).lower().replace(' ', '-').replace("'", '')
    if k == 'tokyo': citta[a] = k; continue
    if k in out and out[k]['geonames'] != int(gid): k += '-' + gid
    out[k] = {"nome": name, "paese": "JP", "lat": round(lat, 4), "lon": round(lon, 4), "geonames": int(gid)}
    citta[a] = k
# contee del Regno Unito (dal 28 ottobre 2026): luogo delle voci del Portable Antiquities Scheme (fonte «romani»), la cui «città» è la
# contea di ritrovamento; tabella in contee-gb.json (scritta da GeoNames ADM2). I nomi già usati da una città non si toccano.
for k, c in json.load(open(sys.argv[1] + '/contee-gb.json', encoding='utf8'))['contee'].items():
    out.setdefault(k, {x: c[x] for x in ('nome', 'paese', 'lat', 'lon', 'geonames') if x in c})
    for a in c['alias']: citta.setdefault(a, k)
res = {
 "nota": "Luoghi delle biblioteche per la mappa del catalogo. Coordinate da GeoNames (geonames.org, CC BY 4.0), id in «geonames». "
         "Il luogo di una voce si cerca in quest'ordine: nome della biblioteca in «biblioteche», città della voce in «citta», ultima parte del nome della biblioteca dopo la virgola in «citta», fonte in «fonti». "
         "In Giappone (biblioteche del Kokusho) le città di GeoNames con almeno 10.000 abitanti e i capoluoghi; un nome condiviso da più città vale solo se la più popolosa ha almeno il triplo degli abitanti. Senza corrispondenza la biblioteca resta senza luogo.",
 "luoghi": dict(sorted(out.items())), "citta": dict(sorted(citta.items())), "biblioteche": dict(sorted(tabella.BIB.items())), "fonti": tabella.FONTI,
}
json.dump(res, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
