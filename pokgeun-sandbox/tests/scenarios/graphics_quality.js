const open = require('../lib/harness');
const D = open.OUT + '/';
const sl = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const { b, p, errs } = await open();
  await p.keyboard.press('Space'); await sl(800);
  await p.evaluate(() => { const g = window.__game, P = g.player; g.setClock(12); P.x = 20.5 * 32; P.y = 8.6 * 32; });
  const out = [];
  for (const name of ['mid', 'low', 'high']) {
    await p.evaluate(() => document.getElementById('gfx').click()); await sl(2600);
    out.push(await p.evaluate(() => document.getElementById('gfx').textContent));
    if (name !== 'high') await p.screenshot({ timeout: 180000, path: D + 'gq_' + name + '.png' });
  }
  const saved = await p.evaluate(() => localStorage.getItem('pokgeun-gfx'));
  await b.close();   // 모바일 확인 전에 첫 브라우저를 닫아 CPU를 비워요
  // 폰: 자동으로 보통 품질
  const m = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await m.p.evaluate(() => document.getElementById('start').click()); await m.p.waitForFunction(() => /🎨/.test(document.getElementById('gfx').textContent), null, { timeout: 120000 }).catch(() => {});
  const mq = await m.p.evaluate(() => document.getElementById('gfx').textContent);
  await m.p.screenshot({ timeout: 180000, path: D + 'gq_mobile.png', clip: { x: 0, y: 0, width: 390, height: 300 } });
  require('../lib/harness').report(({ cycle: out, saved, mobileDefault: mq }), errs.slice(0, 5), m.errs.slice(0, 5));
  await m.b.close();
})();
