const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => { const { b, p, errs } = await open({ viewport: process.argv[2] === 'real' ? { width: 480, height: 320 } : { width: 960, height: 600 }, qs: '?style=' + (process.argv[2] || 'toon') + '&noao' }); await p.keyboard.press('Space'); await p.waitForFunction(() => __game.MAN.ready && __game.WORLD, null, { timeout: 300000 });
  await p.evaluate(() => { __game.setClock(14); __game.setWeather('clear'); });
  const st = () => p.evaluate(() => { const g = __game, P = g.player; return [g.scene(), g.dun && g.dun.kind, Math.round(P.x / 32 * 10) / 10, Math.round((P.y + 8) / 32 * 10) / 10]; });
  const walk = async (key, until) => { const s0 = await p.evaluate(() => __game.scene() + (__game.dun ? __game.dun.kind : '')); await p.keyboard.down(key); await p.waitForFunction(s0 => (__game.scene() + (__game.dun ? __game.dun.kind : '')) !== s0, s0, { timeout: 120000 }).catch(() => {}); await p.keyboard.up(key); await p.waitForTimeout(400); };
  const r = {};
  await p.evaluate(() => { const g = __game; g.setYaw(0); g.player.x = .6 * 32; g.player.y = 8.6 * 32 - 8; g.player.dx = -1; g.player.dy = 0; }); await p.waitForTimeout(600);
  if (process.argv[2] !== 'real') await p.screenshot({ timeout: 180000, path: D + 'seam_0.png' }); r.start = await st();
  await walk('ArrowLeft'); r.leftVillage = await st(); if (process.argv[2] !== 'real') await p.screenshot({ timeout: 180000, path: D + 'seam_1.png' });
  // go to home door
  await p.evaluate(() => { const g = __game, h = g.WORLD.hreg; g.setYaw(0); g.player.x = (h.x + 6) * 32; g.player.y = (h.y + 8 + .3) * 32 - 8; g.player.dx = 0; g.player.dy = -1; }); await p.waitForTimeout(800); if (process.argv[2] !== 'real') await p.screenshot({ timeout: 180000, path: D + 'seam_2.png' });
  await walk('ArrowUp'); r.inHome = await st(); await p.waitForTimeout(600); if (process.argv[2] !== 'real') await p.screenshot({ timeout: 180000, path: D + 'seam_3.png' });
  await walk('ArrowDown'); r.outHome = await st();
  await p.evaluate(() => { const g = __game, v = g.WORLD.vreg; g.setYaw(0); g.player.x = (v.x + 15) * 32; g.player.y = (v.y - .7) * 32 - 8; g.player.dx = 0; g.player.dy = 1; }); await p.waitForTimeout(500);
  await walk('ArrowDown', 1500); r.backVillage = await st(); if (process.argv[2] !== 'real') await p.screenshot({ timeout: 180000, path: D + 'seam_4.png' });
  require('../lib/harness').report((r), errs.slice(0, 5)); await b.close(); })();
