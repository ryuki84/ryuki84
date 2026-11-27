const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => { const { b, p, errs } = await open({ viewport: { width: 960, height: 600 }, qs: '?style=' + (process.argv[2] || 'toon') + '&noao' }); await p.keyboard.press('Space'); await p.waitForFunction(() => __game.MAN.ready && __game.WORLD, null, { timeout: 90000 });
  await p.evaluate(() => { __game.setClock(13); __game.setWeather('clear'); __game.enterWorld(); }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const g = __game, W = g.WORLD, s = W.spawn; let mz = null; for (let d = 1; d < 12 && !mz; d++) { const ps = g.poisNear ? null : null; } 
    for (let ry = -8; ry <= 8 && !mz; ry++) for (let rx = -8; rx <= 8 && !mz; rx++) { g.wb(s.x + rx * 64 + 32, s.y + ry * 64 + 32); mz = W.pois.find(q => q.type === 'maze'); }
    if (!mz) return null; const P = g.player; P.x = (mz.x + .5) * 32; P.y = (mz.y + 18.5) * 32 - 8; P.dx = 0; P.dy = -1; g.setYaw(0); W.first = true; P.hp = 99999; return { id: mz.id, tier: mz.tier, x: mz.x - s.x, y: mz.y - s.y }; });
  await p.waitForTimeout(5000); await p.screenshot({ timeout: 180000, path: D + 'mz_1.png' });
  r.mons = await p.evaluate(id => __game.dun.mons.filter(m => m.poi === id).length, r && r.id);
  await p.evaluate(() => { const P = __game.player; P.y -= 6 * 32; }); await p.waitForTimeout(3000); await p.screenshot({ timeout: 180000, path: D + 'mz_2.png' });
  r.clear = await p.evaluate(id => { const g = __game; for (const m of [...g.dun.mons]) if (m.poi === id) g.killMon(m); return !!g.S.wcl[id]; }, r && r.id);
  require('../lib/harness').report((r), errs.slice(0, 4)); await b.close(); })();
