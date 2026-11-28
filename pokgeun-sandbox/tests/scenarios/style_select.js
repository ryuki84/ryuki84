// 설정 → 🎨 그래픽 스타일: 원신풍·귀여운 2D·듀랑고풍을 고르면 다시 열어도 유지되는지
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const ready = () => p.waitForFunction(() => window.__game && document.getElementById('gfxinfo')?.textContent, null, { timeout: 180000 });
  const pick = async k => { await p.evaluate(() => { document.getElementById('cfgbtn').click(); }); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('[data-cfg="stylebox"]').click()); await p.waitForTimeout(200);
    await Promise.all([p.waitForEvent('load', { timeout: 180000 }), p.evaluate(k => document.querySelector(`[data-cfg="st:${k}"]`).click(), k)]); await ready(); };
  const st = () => p.evaluate(() => ({ style: __game.RSTYLE, view2d: __game.VIEW2D, info: document.getElementById('gfxinfo').textContent }));
  await ready(); const r = { start: await st() };
  await pick('cel'); r.cel = await st();
  await p.reload(); await ready(); r.celAfterReload = await st();
  await pick('2d'); r.d2 = await st();
  await pick('real'); r.real = await st();
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
