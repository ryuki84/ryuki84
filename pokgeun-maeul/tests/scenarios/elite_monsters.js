// 정예 몬스터 5종: 모델, 능력치, 특수 패턴(돌진·독침·포자 장판·순간이동·광역 내려찍기), 확정 장비 드롭, 등장 확률
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 90000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.MONM.ready && __game.MAN.ready && __game.WORLD, null, 180000);
  await p.evaluate(() => { __game.setClock(13); __game.setWeather('clear'); __game.enterWorld(); });
  await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  const r = {};
  // 등장 확률: 깊이 1은 정예 없음, 깊이 5는 대략 몇 %
  r.rate = await p.evaluate(() => { const g = __game; let a = 0, z = 0; for (let i = 0; i < 3000; i++) { if (g.mkMonT(i % 6, 5, 0, 0).elite) a++; if (g.mkMonT(i % 6, 1, 0, 0).elite) z++; } return { d5: a / 3000, d1: z / 3000 }; });
  // 다섯 종을 한 줄로 세워 모델·이름 확인
  r.line = await p.evaluate(() => {
    const g = __game, P = g.player, ks = Object.keys(g.ELITE), base = { '🐀': 0, '🦇': 1, '🕷️': 2, '💀': 3, '🧟': 4 };
    P.hp = 99999; g.setYaw(0); g.dun.mons.length = 0; g.dun.tele.length = 0; g.dun.eproj.length = 0;
    return ks.map((k, i) => { const hp0 = g.mkMonT(base[g.ELITE[k].base], 2, 0, 0).mhp;   // 깊이 2는 정예가 나오지 않아요
      const m = g.eliteify(g.mkMonT(base[g.ELITE[k].base], 2, P.x + (i - 2) * 60, P.y - 120), true); Object.assign(m, { spd: 0, cd: 99, sk: 99 }); g.dun.mons.push(m); return { k, n: m.n, x3: m.mhp === hp0 * 3, elite: m.elite }; });
  });
  r.models = await until(() => __game.dun.mons.every(m => { const e = __game.ENT.get(m); return e && e.mon === __game.ELITE[m.elite].model; }));
  await p.waitForTimeout(1500); await p.screenshot({ timeout: 180000, path: D + 'elites_line.png' });
  // 패턴 하나씩: 그 정예만 남기고 거리를 맞춘 뒤 쿨다운을 0으로
  const solo = (k, dist) => p.evaluate(([k, dist]) => { const g = __game, P = g.player; window.__keep = window.__keep || {}; for (const o of g.dun.mons) window.__keep[o.elite] = o; const m = window.__keep[k];
    g.dun.mons.length = 0; g.dun.mons.push(m); g.dun.tele.length = 0; g.dun.eproj.length = 0; P.hp = 5000; P.inv = 0; m.x = P.x + dist; m.y = P.y; m.cw = 0; m.dashT = 0; m.sk = 0; m.cd = 99; m.spd = 0; window.__m = m; }, [k, dist]);
  await solo('spiky', 130);
  r.charge = { wind: await until(() => __m.cw > 0), dash: await until(() => __m.dashT > 0), hit: await until(() => __game.player.hp < 5000) };
  await solo('hornet', 160);
  r.shoot = { orb: await until(() => __game.dun.eproj.some(q => q.col)), hit: await until(() => __game.player.hp < 5000) };
  await solo('mushking', 160);
  r.spore = { tele: await until(() => __game.dun.tele.some(t => t.dmg > 0)), hit: await until(() => __game.player.hp < 5000) };
  await solo('skullghost', 180);
  r.blink = await until(() => Math.hypot(__m.x - __game.player.x, __m.y - __game.player.y) < 70);
  await solo('skullorc', 40);
  r.slam = { warn: await until(() => __game.dun.tele.some(t => t.warn)), noEarly: await p.evaluate(() => __game.player.hp === 5000), hit: await until(() => __game.player.hp < 5000) };
  await p.screenshot({ timeout: 180000, path: D + 'elites_slam.png' });
  // 처치하면 장비 확정
  r.loot = await p.evaluate(() => { const g = __game, m = __m, n0 = g.dun.loot.filter(l => l.t === 'gear').length; g.killMon(m); return g.dun.loot.filter(l => l.t === 'gear').length - n0; });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
