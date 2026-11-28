// GDD P3-1: 허기(밖에서 더 빨리 줄어요)·먹기·스태미나(채집·공격·구르기)·모닥불 요리·굶주림(최대 체력 25% 아래로 안 내려감)·저장
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 640 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space'); await until(() => __game.WORLD, null, 180000);
  const r = {};
  r.start = await p.evaluate(() => __game.S.surv.food);
  r.village = await p.evaluate(() => { const g = __game; g.S.surv.food = 80; g.survTick(.1); for (let i = 0; i < 300; i++) g.survTick(.1); return +(80 - g.S.surv.food).toFixed(2); });   // 30초
  await p.evaluate(() => { __game.setClock(13); __game.enterWorld(); }); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  await p.evaluate(() => { const g = __game, W = g.WORLD, P = g.player, x = W.spawn.x + 40, y = W.spawn.y - 60; P.x = (x + .5) * 32; P.y = (y + .5) * 32 - 8; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) g.setCell(x + i, y + j, 0, false); g.dun.mons.length = 0; });
  r.world = await p.evaluate(() => { const g = __game; g.S.surv.food = 80; for (let i = 0; i < 300; i++) g.survTick(.1); return +(80 - g.S.surv.food).toFixed(2); });
  // 먹기
  r.eat = await p.evaluate(() => { const g = __game; Object.assign(g.S.mat, { berry: 2, meat: 0, cmeat: 0, soup: 0, gfish: 0 }); g.S.inv.apple = 0; g.S.inv.orange = 0; g.S.inv.peach = 0; g.S.surv.food = 50; g.eatBest(); return { food: g.S.surv.food, berry: g.S.mat.berry }; });
  r.nothing = await p.evaluate(() => { const g = __game; g.S.mat.berry = 0; const f = g.S.surv.food; g.eatBest(); return g.S.surv.food === f; });
  // 스태미나
  r.sta = await p.evaluate(() => { const g = __game, P = g.player; P.sta = 100; P.atkCd = 0; g.attack(); const a = P.sta; P.sta = 3; P.atkCd = 0; g.attack(); const slow = P.atkCd; P.sta = 100; P.atkCd = 0; g.attack(); const norm = P.atkCd; P.sta = 10; P.eCd = 0; g.dash(); const noDash = P.eCd === 0; P.sta = 50; g.dash(); return { afterAtk: a, slow, norm, noDash, dashCost: P.sta }; });
  // 모닥불 옆 요리 → 구운 고기 먹기
  r.cook = await p.evaluate(() => { const g = __game, P = g.player, tx = Math.floor(P.x / 32), ty = Math.floor((P.y + 8) / 32); g.S.mat.meat = 2; const far = g.CRAFT2.find(c => c.id === 'c_meat'); g.craft2('c_meat'); const without = g.S.mat.cmeat || 0; g.setCell(tx + 2, ty, 14, false); g.craft2('c_meat'); const withFire = g.S.mat.cmeat; g.S.surv.food = 40; g.eatBest(); return { without, withFire, food: g.S.surv.food, left: g.S.mat.cmeat }; });
  // 굶주림: 체력이 줄지만 25% 아래로는 안 내려가요
  r.starve = await p.evaluate(() => { const g = __game, P = g.player, m = g.pstats ? g.pstats().maxhp : 100; g.S.surv.food = 0; P.hp = m; for (let i = 0; i < 2000; i++) g.survTick(.1); return { hp: P.hp, min: m * .25 }; });
  r.saved = await p.evaluate(() => { __game.S.surv.food = 42.5; __game.save(); return JSON.parse(localStorage.getItem('pokgeun-sandbox')).surv.food; });
  r.rpg = await p.evaluate(() => /배부름/.test(document.getElementById('rpg').textContent));
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
