// 귀여운 2D 화면 2단계: 동굴 던전·집 안·아레나·야생도 2D로(3D 캔버스 숨김), 오류 없이 그려지는지
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 }, qs: '?style=toon&view=2d' });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space'); await until(() => __game.v2on && __game.v2on(), null, 180000);
  const r = {}, shot = async n => { await p.waitForTimeout(1200); await p.screenshot({ timeout: 180000, path: D + 'v2d_' + n + '.png' }); };
  const st = () => p.evaluate(() => ({ scene: __game.scene(), kind: __game.dun && __game.dun.kind, on: __game.v2on(), hidden: document.getElementById('c').style.visibility === 'hidden' }));
  await p.evaluate(() => { __game.player.hp = 99999; __game.enterDungeon(2); }); await until(() => __game.scene() === 'dun' && __game.dun.kind !== 'world');
  r.dungeon = await st(); await shot('dungeon');
  await p.evaluate(() => { const g = __game; g.S.room.push({ id: 'chair', x: 3, y: 4 }, { id: 'bed', x: 7, y: 3 }); g.enterHome(); }); await until(() => __game.scene() === 'home');
  r.home = await st(); await shot('home');
  await p.evaluate(() => __game.enterWorld()); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  await p.evaluate(() => __game.startArena()); await until(() => __game.scene() === 'dun' && __game.dun.arena, null, 60000);
  r.arena = await st(); await shot('arena');
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
