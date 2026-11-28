// 마을 바로 바깥에 약한 몬스터: 낮에도 마을 근처에서 새 몬스터가 나오고, 마을·집 안에는 생기지 않아요
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.WORLD, null, 180000);
  await p.evaluate(() => { __game.setClock(13); __game.enterWorld(); });
  await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  const r = await p.evaluate(() => { const g = __game, W = g.WORLD, v = W.vreg, h = W.hreg, P = g.player; g.dun.mons.length = 0;
    for (let i = 0; i < 80; i++) g.spawnNearV();
    const ms = g.dun.mons, tile = m => [Math.floor(m.x / 32), Math.floor((m.y + 8) / 32)];
    const inV = ms.filter(m => { const [x, y] = tile(m); return x >= v.x && x < v.x + 30 && y >= v.y && y < v.y + 20; }).length;
    const inH = h ? ms.filter(m => { const [x, y] = tile(m); return x >= h.x && x < h.x + 12 && y >= h.y && y < h.y + 8; }).length : 0;
    const near = ms.filter(m => m.nearV);
    return { total: ms.length, near: near.length, weak: near.filter(m => ['🐀', '🦇', '🕷️'].includes(m.e) && m.tier === 0).length, inV, inH, pd: Math.round(Math.hypot(P.x / 32 - (v.x + 15), P.y / 32 - (v.y + 10))) }; });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
