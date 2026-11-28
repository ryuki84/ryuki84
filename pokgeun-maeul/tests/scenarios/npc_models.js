// 국왕·근위병·경비병: 사람 3D 모델(마네킹)에 왕관·투구·검·방패
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.MAN.ready && __game.KAY.ready && __game.WORLD, null, 180000);
  await p.evaluate(() => { __game.setClock(13); __game.setWeather('clear'); __game.enterWorld(); });
  await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world' && __game.dun.vil.some(v => v.model === 'king'));
  await p.evaluate(() => { const g = __game, k = g.dun.vil.find(v => v.model === 'king'), P = g.player; P.x = k.x; P.y = k.y + 5 * 32; P.dx = 0; P.dy = -1; g.setYaw(0); g.dun.mons.length = 0; });
  const r = {};
  r.models = await until(() => { const g = __game; const near = g.dun.vil.filter(v => v.model && Math.hypot(v.x - g.player.x, v.y - g.player.y) < 12 * 32); return near.length >= 3 && near.every(v => { const e = g.ENT.get(v); return e && e.man && e.npc === v.model; }); });
  r.list = await p.evaluate(() => { const g = __game; return g.dun.vil.filter(v => v.model && Math.hypot(v.x - g.player.x, v.y - g.player.y) < 12 * 32).map(v => { const e = g.ENT.get(v); return { n: v.name, model: v.model, man: !!(e && e.man), npc: e && e.npc }; }); });
  await p.waitForTimeout(1500); await p.screenshot({ timeout: 180000, path: D + 'npc_king.png' });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
