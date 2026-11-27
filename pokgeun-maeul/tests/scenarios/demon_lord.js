const open = require('../lib/harness');
const D = open.OUT + '/';
const sl = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const { b, p, errs } = await open();
  await p.keyboard.press('Space'); await sl(300);
  const r = {};
  await p.evaluate(() => { const g = window.__game; g.enterWorld(); g.S.story.stage = 6; g.S.lv = 12; });
  await sl(1200);
  // 마왕성 입장 (인터랙션 경로로)
  await p.waitForFunction(() => window.__game.WORLD && window.__game.WORLD.demon, null, { timeout: 120000 }).catch(() => {});
  r.enter = await p.evaluate(async () => { const g = window.__game, d = g.WORLD.demon; g.player.x = (d.x + 4.5) * 32; g.player.y = (d.y + 3) * 32 + 18; g.player.dx = 0; g.player.dy = -1; g.dun.mons.length = 0; g.player.hp = 99999; g.worldAct(); await new Promise(r => setTimeout(r, 400)); return { scene: g.scene(), demon: !!g.dun.demon, depth: g.dun.depth, ret: !!g.dun.ret, mons: g.dun.mons.length, hasDemon: g.dun.mons.some(m => m.demon) }; });
  // 층 이동 6→7→8
  for (let f = 0; f < 2; f++) {
    const d0 = await p.evaluate(() => { const g = window.__game, s = g.dun.stairs; g.player.x = (s.x + .5) * 32; g.player.y = (s.y + .5) * 32 - 8; g.player.hp = 99999; return g.dun.depth; });
    // 저프레임에서도 층 이동이 끝날 때까지 기다려요
    await p.waitForFunction(d => window.__game.dun.depth > d, d0, { timeout: 120000 }).catch(() => {});
    await sl(500);
  }
  await p.waitForFunction(() => window.__game.dun.mons.some(m => m.demon), null, { timeout: 60000 }).catch(() => {});
  r.top = await p.evaluate(() => { const g = window.__game; return { depth: g.dun.depth, demonFlag: !!g.dun.demon, ret: !!g.dun.ret, stairs: g.dun.stairs, boss: g.dun.mons.filter(m => m.demon).map(m => ({ n: m.n, hp: m.hp, dmg: m.dmg })), total: g.dun.mons.length, hud: document.getElementById('rpg').textContent.includes('마왕성 3층') }; });
  // 대마왕 AI: 1단계 → 2단계 → 3단계
  r.ai = await p.evaluate(async () => {
    const g = window.__game, m = g.dun.mons.find(m => m.demon), P = g.player, out = {}; g.dun.mons = [m]; P.hp = 99999; m.x = P.x + 160; m.y = P.y; m.cd = 99;
    g.demonAI(m, 3.1); out.p1 = { phase: m.phase, tele: g.dun.tele.length, orb: g.dun.eproj.length };
    m.hp = m.mhp * .5; g.demonAI(m, 6.5); out.p2 = { phase: m.phase, tele: g.dun.tele.length, orb: g.dun.eproj.length, minions: g.dun.mons.length - 1 };
    m.hp = m.mhp * .2; g.demonAI(m, 4.6); out.p3 = { phase: m.phase, tele: g.dun.tele.length, orb: g.dun.eproj.length, minions: g.dun.mons.length - 1 };
    return out;
  });
  // 예고 범위 위에 서 있으면 피해, 탄막 피격 확인 (실제 프레임으로 진행)
  r.damage = await p.evaluate(async () => {
    const g = window.__game, P = g.player; g.dun.mons.filter(m => !m.demon).forEach(m => { m.x = P.x + 3000; }); P.hp = 5000; P.inv = 0; const h0 = P.hp;
    g.dun.tele.length = 0; g.dun.tele.push({ x: P.x, y: P.y + 8, r: 100, t: .05, t0: .05, dmg: 100 });
    await new Promise(r => setTimeout(r, 900)); return { lost: h0 - Math.round(P.hp), teleLeft: g.dun.tele.length };
  });
  await p.evaluate(() => { const g = window.__game, P = g.player, m = g.dun.mons.find(m => m.demon); P.hp = 99999; g.dun.mons = [m]; m.hp = m.mhp * .5; m.phase = 2; m.x = P.x + 150; m.y = P.y - 60; g.dun.tele.push({ x: P.x - 60, y: P.y + 8, r: 100, t: 6, t0: 6, dmg: 50 }); g.dun.tele.push({ x: P.x + 80, y: P.y + 90, r: 100, t: 6, t0: 6, dmg: 50 }); m.orb = 0; m.cast = 99; window.__orb = 1; });
  await sl(2500); await p.screenshot({ timeout: 180000, path: D + 'k_boss.png' });
  // 처치 → 엔딩
  r.kill = await p.evaluate(async () => { const g = window.__game, m = g.dun.mons.find(m => m.demon), S = g.S; g.dun.tele.length = 0; g.dun.eproj.length = 0; m.hp = 1; g.killMon(m); await new Promise(r => setTimeout(r, 3200));
    return { demonKills: S.story.demon, ready: g.storyReady(), panel: !document.getElementById('gear').hidden && document.getElementById('gear').textContent.includes('대마왕을 물리쳤다'), loot: g.dun.loot.filter(l => l.t === 'gear').length }; });
  await p.screenshot({ timeout: 180000, path: D + 'k_ending.png' });
  // 귀환 → 왕에게 최종 보고
  await p.click('[data-end="home"]'); await sl(800);
  r.home = await p.evaluate(() => { const g = window.__game; return { scene: g.scene(), kind: g.dun && g.dun.kind }; });
  r.final = await p.evaluate(() => { const g = window.__game, S = g.S, k = g.dun.vil.find(v => v.model === 'king'); g.player.x = k.x; g.player.y = k.y + 50; const st = S.story.stage; g.reportStory(); return { from: st, to: S.story.stage, title: S.title, fame: S.fame, bells: S.bells }; });
  // 재도전: 두 번째 대마왕은 더 강함
  r.second = await p.evaluate(() => { const g = window.__game; const m = g.mkDemon(0, 0); return { name: m.n, hp: m.hp }; });
  require('../lib/harness').report((r), errs.slice(0, 6)); await b.close();
})();
