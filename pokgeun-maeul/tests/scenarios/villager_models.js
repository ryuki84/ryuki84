// 마을 주민(섞어서): 콩이=퍼그 사람·음메=소 사람(Quaternius), 나비·토리=애니 사람(VRoid 샘플 B·C), 돌아다니는 시바·여우
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 240000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.MONM.ready && __game.MAN.ready, null, 180000);
  const r = {};
  await p.evaluate(() => { const g = __game, P = g.player; g.setClock(13); g.setYaw(0); g.villagers.forEach((v, i) => { v.x = P.x + (i - 1.5) * 48; v.y = P.y - 80; v.vx = v.vy = 0; v.t = 99; });
    g.critters.forEach((c, i) => { c.x = P.x + (i ? 70 : -70); c.y = P.y - 40; });
    (function hold() { g.villagers.forEach((v, i) => { v.vx = v.vy = 0; v.x = P.x + (i - 1.5) * 48; v.y = P.y - 80; }); requestAnimationFrame(hold); })(); });
  r.models = await until(() => __game.villagers.every(v => { const e = __game.ENT.get(v); return e && (v.vrm ? e.vrm : e.mon === __game.VILM[v.e]); }));
  await until(() => __game.villagers.every(v => { const e = __game.ENT.get(v); return e && (e.vrm ? e.base === 'Unarmed_Idle' : e.cur === 'Idle'); }), null, 60000);
  r.list = await p.evaluate(() => __game.villagers.map(v => { const e = __game.ENT.get(v); return { n: v.name, kind: e && (e.vrm ? 'vrm' : e.mon), st: e && (e.vrm ? e.base : e.cur) }; }));
  r.critters = await until(() => __game.critters.every(c => { const e = __game.ENT.get(c); return e && e.mon === c.k; }), null, 60000);
  await p.waitForTimeout(1500); await p.screenshot({ timeout: 180000, path: D + 'villagers.png' });
  // 말 걸기: 동물 사람은 손 흔들기(Victory), 애니 사람은 말하는 동작
  await p.evaluate(() => { const g = __game; window.__va = g.villagers.find(v => !v.vrm); window.__vh = g.villagers.find(v => v.vrm); __va.talk = 3; __vh.talk = 3; });
  r.wave = await until(() => { const e = __game.ENT.get(__va); return e && e.cur === 'Wave'; }, null, 60000);
  r.talk = await until(() => { const e = __game.ENT.get(__vh); return e && e.base === 'Idle_Talking_Loop'; }, null, 60000);
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
