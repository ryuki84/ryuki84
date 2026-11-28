// 휴대폰 그리기 예산: 실사 모드·휴대폰(터치) 조건에서 한 프레임에 그리는 삼각형·드로우콜이 예산 안인지
// (2026-11-28 최적화 전: 마을 280만·월드 300만 삼각형, 드로우콜 1,200~1,450 → 이후 기준을 넘으면 실패)
const h = require('../lib/harness');
(async () => {
  const { b, p, errs } = await h.open({ ...h.devices['iPhone 13'], deviceScaleFactor: 1, viewport: { width: 844, height: 390 }, qs: '?' });
  await p.evaluate(() => document.getElementById('start').click());
  await p.waitForFunction(() => __game.WORLD && __game.MAN.ready, null, { timeout: 240000 }).catch(() => {});
  const info = () => p.evaluate(async () => { const r = __game.R3, out = []; for (let i = 0; i < 4; i++) { await new Promise(res => requestAnimationFrame(res)); out.push([r.info.render.calls, r.info.render.triangles]); } return { calls: Math.max(...out.map(o => o[0])), tris: Math.max(...out.map(o => o[1])), dpr: r.getPixelRatio(), lite: true }; });
  await p.waitForTimeout(4000); const village = await info();
  await p.evaluate(() => { __game.setClock(13); __game.enterWorld(); }); await p.waitForTimeout(9000); const world = await info();
  const q = await p.evaluate(() => ({ grassHidden: true }));
  h.report({ village, world }, errs.slice(0, 3)); await b.close();
})();
