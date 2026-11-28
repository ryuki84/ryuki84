// 플레이어 공격 타격감: 휘두르는 동작이 닿는 순간에 피해, 히트스톱, 시작 화면의 최근 업데이트 안내
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 90000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  const r = {};
  r.news = await p.evaluate(() => { const n = document.querySelector('#help .news'); return !!n && n.offsetHeight > 0 && n.textContent.includes('최근 업데이트'); });
  await p.screenshot({ timeout: 180000, path: D + 'start_news.png' });
  await p.keyboard.press('Space');
  await until(() => __game.KAY.ready && __game.WORLD, null, 180000);
  await p.evaluate(() => __game.enterWorld());
  await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  r.swing = await p.evaluate(() => {
    const g = __game, P = g.player; P.hp = 99999; g.dun.mons.length = 0; P.dx = 0; P.dy = -1;
    const m = g.mkMonT(4, 2, P.x, P.y - 34); Object.assign(m, { spd: 0, cd: 99, hp: 99999, mhp: 99999, elite: undefined }); g.dun.mons.push(m); window.__m = m;
    window.__stop = 0; (function f() { window.__stop = Math.max(window.__stop, g.hitStop); requestAnimationFrame(f); })();
    P.atkCd = 0; g.attack(); return { immediate: m.hp === 99999, pend: !!P.pendHit };
  });
  r.landed = await until(() => __m.hp < 99999);
  r.stopSeen = await p.evaluate(() => window.__stop > 0);
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
