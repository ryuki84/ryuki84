// 귀여운 2D 화면(?view=2d): 마을·오픈월드를 2D 도트로 그리고 3D 캔버스는 숨겨요. 이동·전투·라벨이 그대로 되는지
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 }, qs: '?style=toon&view=2d' });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  const r = {};
  r.on = await until(() => __game.v2on && __game.v2on(), null, 180000);
  r.cvHidden = await p.evaluate(() => document.getElementById('c').style.visibility === 'hidden');
  await p.evaluate(() => { const g = __game, P = g.player; g.setClock(13); g.villagers.forEach((v, i) => { v.x = P.x + (i - 1.5) * 40; v.y = P.y - 64; }); });
  await p.waitForTimeout(1500); await p.screenshot({ timeout: 180000, path: D + 'v2d_village.png' });
  // 걷기
  const x0 = await p.evaluate(() => __game.player.x); await p.keyboard.down('ArrowRight'); await until(() => true); await p.waitForTimeout(1200); await p.keyboard.up('ArrowRight');
  r.moved = await p.evaluate(x0 => __game.player.x - x0, x0);
  // 월드: 몬스터 몇 마리 세우고 공격
  await p.evaluate(() => __game.enterWorld()); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  r.worldOn = await p.evaluate(() => __game.v2on());
  await p.evaluate(() => { const g = __game, P = g.player; P.hp = 99999; g.dun.mons.length = 0; ['🐀', '🦇', '🕷️', '💀', '🧟', '👹'].forEach((e, i) => { const m = g.mkMonT(0, 2, P.x + (i - 2.5) * 40, P.y - 70); Object.assign(m, { e, spd: 0, cd: 99, elite: undefined }); g.dun.mons.push(m); }); const m = g.mkMonT(0, 2, P.x, P.y - 26); Object.assign(m, { spd: 0, cd: 99, hp: 999, mhp: 999 }); g.dun.mons.push(m); window.__m = m; P.dx = 0; P.dy = -1; P.atkCd = 0; g.attack(); });
  r.hit = await until(() => __m.hp < 999, null, 60000);
  await p.waitForTimeout(400); await p.screenshot({ timeout: 180000, path: D + 'v2d_world.png' });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
