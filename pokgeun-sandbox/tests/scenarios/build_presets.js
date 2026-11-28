// GDD P2-1: 완성형 건물(미리보기·돌리기·막힌 칸 거부·한 번에 짓기·재료 계산) + 밖에 가구 놓기·집기(바닥 위 포함) + 저장
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 640 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space'); await until(() => __game.WORLD, null, 180000);
  await p.evaluate(() => { __game.setClock(13); __game.enterWorld(); }); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  await p.evaluate(() => { const g = __game, W = g.WORLD, P = g.player, x = W.spawn.x + 40, y = W.spawn.y - 60; P.x = (x + .5) * 32; P.y = (y + .5) * 32 - 8; P.dx = 0; P.dy = -1; g.setYaw(0); for (let j = -9; j <= 4; j++) for (let i = -6; i <= 6; i++) g.setCell(x + i, y + j, 0, false); g.dun.mons.length = 0; Object.assign(g.S.mat, { plank: 60, stone: 30, wood: 30, fiber: 10 }); });
  const r = {};
  await p.evaluate(() => __game.togglePanel('build'));
  r.listed = await p.evaluate(() => document.querySelectorAll('[data-preset]').length);
  await p.click('[data-preset="0"]');
  r.sel = await p.evaluate(() => __game.buildSel && __game.buildSel.id);
  await p.waitForTimeout(800);
  r.preview = await p.evaluate(() => { const g = __game, cs = g.presetCells(g.buildSel); return { n: cs.length, walls: cs.filter(c => c.c === 12).length, floors: cs.filter(c => c.c === 13).length }; });
  r.rot = await p.evaluate(() => { const g = __game, a = JSON.stringify(g.presetCells(g.buildSel).map(c => [c.x, c.y])); g.bRot = 1; const b = JSON.stringify(g.presetCells(g.buildSel).map(c => [c.x, c.y])); g.bRot = 0; return a !== b; });
  // 막힌 칸이 있으면 안 지어져요
  r.blocked = await p.evaluate(() => { const g = __game, cs = g.presetCells(g.buildSel), q = cs[5]; g.setCell(q.x, q.y, 1, false); const pl = g.S.mat.plank; g.attack(); const ok = g.S.mat.plank === pl && g.wc(cs[0].x, cs[0].y) === 0; g.setCell(q.x, q.y, 0, false); return ok; });
  await p.screenshot({ path: D + 'preset_preview.png' });
  r.built = await p.evaluate(() => { const g = __game, cs = g.presetCells(g.buildSel), pl = g.S.mat.plank; g.player.atkCd = 0; g.attack(); return { placed: cs.every(c => g.wc(c.x, c.y) === c.c), used: pl - g.S.mat.plank, cost: g.PRESETS[0].cost.plank, cleared: !g.buildSel }; });
  await p.waitForTimeout(1500); await p.screenshot({ path: D + 'preset_built.png' });
  // 가구: 땅에 놓고 집기, 바닥 위에 놓고 집으면 바닥이 돌아와요
  r.furn = await p.evaluate(() => { const g = __game, P = g.player; P.dx = 0; P.dy = 1; const tx = Math.floor(P.x / 32), ty = Math.floor((P.y + 8 + 26) / 32); g.S.fin.chair = 2;
    g.setBuildSel({ kind: 'furn', id: 'chair', n: '의자', e: '🪑', cost: {} }); P.atkCd = 0; g.attack(); const placed = g.wc(tx, ty) === g.FURN_CODE('chair'), left = g.S.fin.chair;
    g.setBuildSel(null); g.worldRemove(); const back = g.wc(tx, ty) === 0 && g.S.fin.chair === 2;
    g.setCell(tx, ty, 13, false); g.setBuildSel({ kind: 'furn', id: 'chair', n: '의자', e: '🪑', cost: {} }); P.atkCd = 0; g.attack(); const onFloor = g.wc(tx, ty) === g.FURN_CODE('chair'); g.setBuildSel(null); g.worldRemove();
    return { placed, left, back, onFloor, floorBack: g.wc(tx, ty) === 13 }; });
  r.saved = await p.evaluate(() => { __game.save(); const o = JSON.parse(localStorage.getItem('pokgeun-sandbox')); return Object.values(o.wedits).filter(c => c === 12).length; });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
