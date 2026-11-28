// GDD P1: 맨손 채집 → 돌도끼·돌곡괭이 제작 → 도구로 빨리 채집(철광석은 곡괭이 필요) → 작업대 설치 → 판자·가구 → 고치기·숙련도·저장
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 640 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space'); await until(() => __game.WORLD, null, 180000);
  await p.evaluate(() => { __game.setClock(13); __game.enterWorld(); }); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  // 바라보는 칸에 자원을 놓고 몇 번 두드려야 캐지는지 세요
  const hits = code => p.evaluate(async code => { const g = __game, P = g.player; g.dun.mons.length = 0; const tx = Math.floor(P.x / 32), ty = Math.floor((P.y + 8) / 32) - 1; P.dx = 0; P.dy = -1; g.setCell(tx, ty, code, false); delete g.dun.nhp[ty * 1048576 + tx];
    const before = { ...g.S.mat }; let n = 0; while (g.wc(tx, ty) === code && n < 8) { g.worldGather(); n++; } return { n, gone: g.wc(tx, ty) !== code, got: Object.fromEntries(Object.keys(g.S.mat).map(k => [k, (g.S.mat[k] || 0) - (before[k] || 0)]).filter(([, v]) => v)) }; }, code);
  await p.evaluate(() => { const g = __game, W = g.WORLD, P = g.player; let x = W.spawn.x + 40, y = W.spawn.y - 60; P.x = (x + .5) * 32; P.y = (y + .5) * 32 - 8; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) g.setCell(x + i, y + j, 0, false); });
  const r = {};
  r.handTree = await hits(1); r.handOre = await hits(4);
  r.panel = await p.evaluate(() => { __game.togglePanel('craft'); return !!document.querySelector('[data-craft2="stone_axe"]'); });
  await p.evaluate(() => Object.assign(__game.S.mat, { wood: 40, stone: 20, fiber: 10, ore: 10, hide: 4, berry: 4 }));
  await p.evaluate(() => { __game.togglePanel('craft'); __game.togglePanel('craft'); });
  for (const id of ['stone_axe', 'stone_pick']) await p.click(`[data-craft2="${id}"]`);
  r.tools = await p.evaluate(() => JSON.parse(JSON.stringify(__game.S.tools)));
  r.benchNeeded = await p.evaluate(() => document.querySelector('[data-craft2="plank"]').textContent);
  await p.evaluate(() => __game.closeShop && __game.closeShop());
  await p.keyboard.press('Escape');
  r.axeTree = await hits(1); r.pickOre = await hits(4);
  r.dur = await p.evaluate(() => __game.S.tools.axe.d);
  // 작업대 짓기(건설 목록 첫 칸) → 판자·의자
  r.bench = await p.evaluate(() => { const g = __game, P = g.player, tx = Math.floor(P.x / 32) + 1, ty = Math.floor((P.y + 8) / 32); g.setCell(tx, ty, 0, false); P.dx = 1; P.dy = 0; g.setBuild(0); g.attack(); g.setBuild(null); return g.wc(tx, ty); });
  await p.evaluate(() => __game.togglePanel('craft'));
  r.benchOn = await until(() => document.querySelector('.benchst.on') !== null, null, 10000);
  const fin0 = await p.evaluate(() => __game.S.fin.chair || 0);
  await p.click('[data-craft2="plank10"]'); await p.click('[data-craft2="f_chair"]');
  r.made = await p.evaluate(fin0 => ({ plank: __game.S.mat.plank, chair: (__game.S.fin.chair || 0) - fin0 }), fin0);
  await p.evaluate(() => { __game.S.tools.axe.d = 3; __game.togglePanel('craft'); __game.togglePanel('craft'); }); await p.click('[data-craft2="repair"]');
  r.repaired = await p.evaluate(() => __game.S.tools.axe.d);
  r.prof = await p.evaluate(() => ({ ...__game.S.prof }));
  await p.screenshot({ path: D + 'crafting.png' });
  r.saved = await p.evaluate(() => { __game.save(); const o = JSON.parse(localStorage.getItem('pokgeun-sandbox')); return { sv: o.sv, axe: o.tools.axe.t, plank: o.mat.plank }; });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
