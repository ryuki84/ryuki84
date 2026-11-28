// 아티팩트 게시 사본(dist/artifact)을 뷰어와 같은 보안 정책(data: 차단, blob: 허용)으로 띄워 3D 모델이 실제로 뜨는지 확인
// (2026-11-28: 뷰어가 data: 읽기를 막아 아티팩트에서만 모든 모델이 실패했는데, 로컬 테스트는 통과했던 문제의 재발 방지)
const h = require('../lib/harness'); const http = require('http'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ART = path.join(h.ROOT, 'dist', 'artifact');
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self' blob: https://cdn.jsdelivr.net; img-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com";
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
(async () => {
  execFileSync(process.execPath, [path.join(h.ROOT, 'tools', 'build-artifact.mjs')], { stdio: 'ignore' });   // 항상 최신 index.html로 다시 만들어요(모델은 바뀐 것만)
  const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ART, u === '/' ? 'index.html' : u); if (!f.startsWith(ART)) { s.writeHead(403); return s.end(); }
    fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Security-Policy': CSP }); s.end(d); }); }).listen(0);
  const b = await h.chromium.launch({ args: h.BROWSER_ARGS }); const p = await b.newPage({ viewport: { width: 960, height: 600 } }); p.setDefaultTimeout(120000);
  const errs = h.watchErrors(p); const csp = []; p.on('console', m => /Content Security Policy|Fetch API cannot load data/i.test(m.text()) && csp.push(m.text().slice(0, 160)));
  await h.routes(p);
  await p.goto(`http://localhost:${srv.address().port}/index.html?style=toon`);
  await p.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await p.click('#start').catch(() => {});
  await p.waitForFunction(() => { const g = window.__game; return g.MONM.ready && g.MAN.ready && g.KAY.ready && g.DINOM.ready; }, null, { timeout: 240000 }).catch(() => {});
  const r = await p.evaluate(() => { const g = window.__game; return { mon: !!g.MONM.ready, man: !!g.MAN.ready, kay: !!g.KAY.ready, dino: !!g.DINOM.ready }; });
  r.vrm = await p.waitForFunction(() => window.__game.curPE && window.__game.curPE.vrm, null, { timeout: 240000 }).then(() => true).catch(() => false);
  r.vil = await p.waitForFunction(() => window.__game.villagers.every(v => { const e = window.__game.ENT.get(v); return e && e.mon; }), null, { timeout: 60000 }).then(() => true).catch(() => false);
  r.csp = csp.slice(0, 3);
  h.report(r, errs.filter(e => !/Content Security Policy|fonts/.test(e)).slice(0, 4)); await b.close(); srv.close();
})();
