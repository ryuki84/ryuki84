// 마을 주민 4명(강아지·고양이·토끼·닭) 3D 모델, 걷기·대기, 말 걸면 손 흔들기
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.MONM.ready && __game.MAN.ready, null, 180000);
  const r = {};
  r.scene = await p.evaluate(() => __game.scene());
  // 주민을 플레이어 앞에 모아 세워요
  await p.evaluate(() => { const g = __game, P = g.player; g.setClock(13); g.setYaw(0); g.villagers.forEach((v, i) => { v.x = P.x + (i - 1.5) * 44; v.y = P.y - 80; v.vx = v.vy = 0; v.t = 99; }); });
  r.models = await until(() => __game.villagers.every(v => { const e = __game.ENT.get(v); return e && e.mon === __game.VILM[v.e]; }));
  r.list = await p.evaluate(() => __game.villagers.map(v => { const e = __game.ENT.get(v); return { n: v.name, e: v.e, mon: e && e.mon, cur: e && e.cur }; }));
  await p.waitForTimeout(1500); await p.screenshot({ timeout: 180000, path: D + 'villagers.png' });
  // 말 걸기 → 손 흔들기
  await p.evaluate(() => { const v = __game.villagers[0]; window.__v = v; v.talk = 3; });
  r.wave = await until(() => { const e = __game.ENT.get(__v); return e && (e.cur === 'Wave'); }, null, 60000);
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
