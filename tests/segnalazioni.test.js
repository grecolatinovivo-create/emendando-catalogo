// Ricontrollo dei codici segnalati dal visore (scripts/segnalazioni.mjs) con un server locale finto.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
process.env.CATALOGO_PAUSA_MS = "0";
const { ricontrolla, corpoIssue, pagineManifesto, eImmagine, CAUSE } = await import("../scripts/segnalazioni.mjs");

const JPEG = Buffer.from("ffd8ffe000104a46494600010100000100010000", "hex");
let base;
const srv = http.createServer((q, r) => {
  const cors = { "access-control-allow-origin": "*" };
  const man = img => JSON.stringify({ sequences: [{ canvases: [{ "@id": "c1", label: "1r", images: [{ resource: { "@id": base + img } }] }] }] });
  switch (q.url) {
    case "/buono.json": r.writeHead(200, { "content-type": "application/json", ...cors }); return r.end(man("/img.jpg"));
    case "/senzacors.json": r.writeHead(200, { "content-type": "application/json" }); return r.end(man("/img.jpg"));
    case "/vuoto.json": r.writeHead(200, { "content-type": "application/json", ...cors }); return r.end(JSON.stringify({ sequences: [{ canvases: [] }] }));
    case "/anubis.json": r.writeHead(200, { "content-type": "application/json", ...cors }); return r.end(man("/anubis.jpg"));
    case "/img.jpg": r.writeHead(200, { "content-type": "image/jpeg", ...cors }); return r.end(JPEG);
    case "/anubis.jpg": r.writeHead(200, { "content-type": "text/html" }); return r.end("<html><title>Making sure you're not a bot!</title>Anubis</html>");
    case "/html.jpg": r.writeHead(200, { "content-type": "text/html" }); return r.end("<html>viewer</html>");
    default: r.writeHead(404); return r.end("no");
  }
});
test.before(() => new Promise(ok => srv.listen(0, "127.0.0.1", () => { base = "http://127.0.0.1:" + srv.address().port; ok(); })));
test.after(() => srv.close());

test("classi e cause del ricontrollo", async () => {
  assert.equal((await ricontrolla({ manifest: base + "/buono.json", origine: "manifesto" })).classe, "momentaneo");
  let e = await ricontrolla({ manifest: base + "/manca.json", origine: "manifesto" });
  assert.equal(e.classe, "rotto"); assert.equal(e.causa, "manifesto-non-trovato");
  e = await ricontrolla({ manifest: base + "/senzacors.json", origine: "manifesto" });
  assert.equal(e.classe, "bloccato per i browser"); assert.equal(e.causa, "manifesto-senza-cors");
  assert.equal((await ricontrolla({ manifest: base + "/vuoto.json", origine: "manifesto" })).causa, "manifesto-senza-immagini");
  e = await ricontrolla({ manifest: base + "/anubis.json", origine: "manifesto" });
  assert.equal(e.causa, "immagine-antirobot"); assert.equal(e.classe, "bloccato per i browser");
  assert.equal((await ricontrolla({ manifest: base + "/buono.json", url: base + "/html.jpg", origine: "immagine" })).causa, "immagine-non-immagine");
  assert.equal((await ricontrolla({ manifest: base + "/buono.json", url: base + "/via.jpg", origine: "immagine" })).causa, "immagine-non-trovata");
});

test("strumenti: immagini vere, pagine, issue con i dati rileggibili", () => {
  assert.ok(eImmagine(JPEG)); assert.ok(!eImmagine(Buffer.from("<html>…</html>")));
  assert.deepEqual(pagineManifesto({ items: [{ items: [{ items: [{ body: { id: "x", service: [{ id: "https://s/iiif/a" }] } }] }] }] }), { n: 1, prima: "https://s/iiif/a/full/,400/0/default.jpg" });
  const d = { chiave: "B|manifesto-senza-cors", biblioteca: "Biblioteca | prova", causa: "manifesto-senza-cors", controllo: "2026-10-26T10:00:00Z",
    codici: { "m|1r": { voce: "x-1", segnatura: "Cod. 1", manifest: "https://m/1.json", pagina: "1r", conteggio: 2, ids: ["1"] } } };
  const corpo = corpoIssue(d);
  assert.match(corpo, /Ipotesi di soluzione/); assert.ok(corpo.includes(CAUSE["manifesto-senza-cors"][2]));
  const m = /<!-- segnalazioni-dati: ([A-Za-z0-9+/=]+) -->/.exec(corpo);
  assert.deepEqual(JSON.parse(Buffer.from(m[1], "base64").toString()), d);
});
