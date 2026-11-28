// 몬스터 3D 모델(Quaternius Ultimate Monsters) 로드, 6가지 동작(대기·걷기·달리기·공격·피격·죽음), 공격 예비 동작(❗) 확인
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.MONM.ready && __game.KAY.ready && __game.WORLD, null, 180000);
  await p.evaluate(() => { __game.setClock(13); __game.setWeather('clear'); __game.enterWorld(); });
  await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  const r = {};
  // 일곱 종을 플레이어 앞에 한 줄로 세워요(움직이지 않게 속도 0)
  r.models = await p.evaluate(() => {
    const g = __game, P = g.player, em = ['🐀', '🦇', '🕷️', '💀', '🧟', '👹', '🐲'];
    P.hp = 99999; P.mhp = 99999; g.setYaw(0); g.dun.mons.length = 0;
    em.forEach((e, i) => { const m = g.mkMonT(0, 1, P.x + (i - 3) * 50, P.y - 110); Object.assign(m, { e, spd: 0, cd: 99, boss: e === '🐲' }); g.dun.mons.push(m); });
    const M = g.MONM; return Object.keys(M.map).map(k => ({ k, clips: Object.fromEntries(Object.entries(M.map[k]).map(([s, c]) => [s, c && c.name])) }));
  });
  await until(() => __game.dun.mons.every(m => { const e = __game.ENT.get(m); return e && e.mon && e.cur; }), null, 120000);
  await until(() => __game.dun.mons.every(m => __game.ENT.get(m).cur === 'Idle'), null, 60000);
  r.ents = await p.evaluate(() => __game.dun.mons.map(m => { const e = __game.ENT.get(m); return { e: m.e, mon: e && e.mon, cur: e && e.cur }; }));
  await p.waitForTimeout(1500); await p.screenshot({ timeout: 180000, path: D + 'monsters_line.png' });
  // 걷기/달리기: 매 프레임 동작 이름을 기록해 두고(저프레임에서 놓치지 않게), 속도를 주어 쫓아오게 해요
  await p.evaluate(() => { const g = __game, m = g.dun.mons[4]; window.__seen = new Set(); (function f() { const e = g.ENT.get(m); if (e && e.cur) window.__seen.add(e.cur); requestAnimationFrame(f); })(); });
  await p.evaluate(() => { const m = __game.dun.mons[4], P = __game.player; m.spd = 40; m.x = P.x + 230; m.y = P.y; });
  r.walkOk = await until(() => window.__seen.has('Walk'), null, 60000);
  await p.evaluate(() => { const m = __game.dun.mons[4], P = __game.player; m.spd = 0; m.x = P.x - 230; m.y = P.y; });
  await p.waitForTimeout(500); await p.evaluate(() => { __game.dun.mons[4].spd = 130; });
  r.runOk = await until(() => window.__seen.has('Run'), null, 60000);
  await p.evaluate(() => { const m = __game.dun.mons[4]; m.spd = 0; m.x = __game.player.x + 50; m.y = __game.player.y - 110; });
  // 공격 예비 동작: 붙으면 바로 맞지 않고 ❗ 뒤에 맞아요
  r.wind = await p.evaluate(() => { const g = __game, P = g.player, m = g.dun.mons[0]; P.hp = 5000; P.inv = 0; m.x = P.x; m.y = P.y - 20; m.cd = 0; return { hp0: P.hp }; });
  r.windStarted = await until(() => __game.dun.mons[0].wind > 0, null, 60000);
  r.duringWind = await p.evaluate(() => { const g = __game, m = g.dun.mons[0], e = g.ENT.get(m); return { hp: g.player.hp, wind: m.wind, cur: e && e.cur }; });
  r.attackAnim = await until(() => { const e = __game.ENT.get(__game.dun.mons[0]); return e && e.cur === 'Attack'; }, null, 60000);
  r.hitLanded = await until(() => __game.player.hp < 5000, null, 60000);
  await p.evaluate(() => { const m = __game.dun.mons[0]; m.y = __game.player.y - 110; m.cd = 99; });
  // 피격 동작
  await p.evaluate(() => { __game.dun.mons[1].flash = .2; });
  r.hitAnim = await until(() => { const e = __game.ENT.get(__game.dun.mons[1]); return e && e.cur === 'Hit'; }, null, 60000);
  // 죽음 동작: 처치 후 쓰러지는 동작을 보여 주고 사라져요
  r.death = await p.evaluate(() => { const g = __game, m = g.dun.mons[5]; window.__deadM = m; g.killMon(m); return { inDead: (g.dun.dead || []).some(c => c.m === m), mons: g.dun.mons.length }; });
  r.deathAnim = await until(() => { const e = __game.ENT.get(window.__deadM); return e && e.cur === 'Death'; }, null, 60000);
  await p.screenshot({ timeout: 180000, path: D + 'monsters_death.png' });
  r.deathGone = await until(() => !(__game.dun.dead || []).length, null, 120000);
  report(r);
  function report(r) { require('../lib/harness').report(r, errs.slice(0, 4)); }
  await b.close();
})();
