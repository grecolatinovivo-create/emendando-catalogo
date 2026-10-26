# Gazetteer: GeoNames cities500 lookup by (name, country[, admin1])
import sys, json
G = {}
def load(path):
    for line in open(path, encoding='utf8'):
        f = line.rstrip('\n').split('\t')
        gid, name, ascii_, alt, lat, lon, cc, a1, pop = f[0], f[1], f[2], f[3], float(f[4]), float(f[5]), f[8], f[10], int(f[14] or 0)
        rec = (gid, name, lat, lon, cc, a1, pop, f[7])
        for n in {name, ascii_, *alt.split(',')}:
            if n: G.setdefault((n.lower(), cc), []).append(rec)
def find(name, cc, a1=None, gid=None):
    c = G.get((name.lower(), cc), [])
    if a1: c = [r for r in c if r[5] == a1]
    if gid: c = [r for r in c if r[0] == str(gid)]
    if not c: return None
    # prefer populated place, by population
    c.sort(key=lambda r: (-r[6]))
    return c[0]
