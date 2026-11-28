const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => { const { b, p, errs } = await open({ viewport: { width: 960, height: 600 }, qs: '?style=' + (process.argv[2] || 'toon') + '&noao' }); await p.keyboard.press('Space'); await p.waitForFunction(() => __game.KAY.ready && __game.DINOM.ready, null, { timeout: 90000 });
  await p.evaluate(() => { __game.setClock(14); __game.setWeather('clear'); __game.enterWorld(); }); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { const g = __game, d = g.dun, P = g.player; d.mons.length = 0; P.hp = 99999; const base = d.mons; const proto = { wild: true, hostile: false, hp: 999, mhp: 999, dmg: 0, spd: 0, cd: 0, flash: 0, kb: 0, kx: 0, ky: 0, tp: 0, tame: 9, wvx: 0, wvy: 0 };
    [[4, -70, -110], [3, 40, -130], [2, 130, -90], [0, -150, -60]].forEach(([idx, dx, dy]) => base.push({ ...proto, idx, n: 'x', e: '🦖', x: P.x + dx, y: P.y + dy }));
    base.push({ ...proto, idx: 4, boss: true, n: '티라노', x: P.x + 10, y: P.y - 260 }); g.setYaw(0); return base.length; });
  await p.waitForTimeout(3000); await p.screenshot({ timeout: 180000, path: D + 'dn_1.png' });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close(); })();
