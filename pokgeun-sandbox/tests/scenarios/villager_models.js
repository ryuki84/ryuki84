// 마을 주민: 직업 주민 6명(치비 캐릭터 셋, 부위 조합), 돌아다니는 동물(Kenney Cube Pets), 말 걸면 반기는 동작
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 240000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.MONM.ready && __game.KAY.ready, null, 180000);
  const r = {};
  await p.evaluate(() => { const g = __game, P = g.player; g.setClock(13); g.setYaw(0);
    g.critters.forEach((c, i) => { c.x = P.x + (i - 2) * 50; c.y = P.y - 30; });
    (function hold() { g.villagers.forEach((v, i) => { v.vx = v.vy = 0; v.t = 99; v.x = P.x + (i - 2.5) * 44; v.y = P.y - 80; }); requestAnimationFrame(hold); })(); });
  r.models = await until(() => __game.villagers.every(v => { const e = __game.ENT.get(v); return e && e.cbk; }));
  await until(() => __game.villagers.every(v => { const e = __game.ENT.get(v); return e && e.base === 'Unarmed_Idle'; }), null, 60000);
  r.list = await p.evaluate(() => __game.villagers.map(v => { const e = __game.ENT.get(v), parts = []; e && e.root.traverse(o => o.isMesh && parts.push(o.name)); return { n: v.name, job: v.job, cbk: !!(e && e.cbk), st: e && e.base, sig: parts.filter(n => /_(Head|Body|Hat|Helmet|Cape)$/.test(n)).sort().join('+') }; }));
  r.critters = await until(() => __game.critters.every(c => { const e = __game.ENT.get(c); return e && e.mon === c.k && /^p\//.test(c.k); }), null, 60000);
  await p.waitForTimeout(1500); await p.screenshot({ timeout: 180000, path: D + 'villagers.png' });
  await p.evaluate(() => { window.__va = __game.villagers[0]; __va.talk = 3; });
  r.talk = await until(() => { const e = __game.ENT.get(__va); return e && e.base === 'Cheer'; }, null, 60000);
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
