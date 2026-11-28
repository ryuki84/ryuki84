const open = require('../lib/harness');
const D = open.OUT + '/';
const sl = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const { b, p, errs } = await open();
  await p.keyboard.press('Space'); await sl(500);
  const r = {};
  // 1) 마을 아레나 건물 → 패널
  r.village = await p.evaluate(() => { const g = window.__game, P = g.player, A = { x: 21, y: 1, w: 3, h: 3 }; P.x = (A.x + 1.5) * 32; P.y = (A.y + A.h + .5) * 32 + 18 - 32; P.dx = 0; P.dy = -1; g.act(); return { open: !document.getElementById('gear').hidden, hasArena: document.getElementById('gear').textContent.includes('서바이벌 아레나'), start: !!document.querySelector('[data-astart]') }; });
  await p.screenshot({ timeout: 180000, path: D + 'a_panel.png' });
  await p.click('[data-astart]'); await sl(1200);
  r.enter = await p.evaluate(() => { const g = window.__game, d = g.dun; return { scene: g.scene(), arena: !!d.arena, wave: d.wave.n, toSpawn: d.wave.toSpawn, mons: d.mons.length, hud: document.getElementById('rpg').textContent.includes('웨이브 1') }; });
  // 2) 웨이브 스폰 (시간 가속) + 자동 공격
  r.spawn = await p.evaluate(() => { const g = window.__game, d = g.dun; d.wave.t = 0; for (let i = 0; i < 40; i++) g.arenaTick(1.2); return { mons: d.mons.length, left: d.wave.toSpawn, far: d.mons.every(m => Math.hypot(m.x - g.player.x, m.y - g.player.y) > 250), hunt: d.mons.every(m => m.hunt > 1000) }; });
  r.auto = await p.evaluate(async () => { const g = window.__game, d = g.dun, P = g.player; P.hp = 99999; d.mons.length = 0; const m = g.mkMonT(0, 1, P.x + 50, P.y); m.hunt = 9999; m.hp = m.mhp = 99999; d.mons.push(m); d.wave.toSpawn = 0; d.wave.clearT = -999; const h0 = m.hp; P.atkCd = 0; g.autoFight(); return { dmg: h0 - m.hp, faced: Math.round(P.dx) }; });
  // 3) 활/총: 투사체 생성
  r.ranged = await p.evaluate(() => { const g = window.__game, d = g.dun, P = g.player, S = g.S, out = {}; const m = d.mons[0]; m.x = P.x + 200; m.y = P.y; for (const st of ['bow', 'gun']) { S.arena.style = st; P.atkCd = 0; d.proj.length = 0; g.autoFight(); out[st] = { shots: d.proj.length, pierce: d.proj[0] && d.proj[0].pierce, cd: +P.atkCd.toFixed(2) }; } S.arena.style = 'sword'; return out; });
  // 4) 처치 → 구슬 → 레벨업 → 3택1
  r.gem = await p.evaluate(async () => { const g = window.__game, d = g.dun, P = g.player; d.mons.length = 0; const run = d.run; for (let i = 0; i < 5; i++) { const m = g.mkMonT(1, 1, P.x + 40 + i, P.y); m.hp = 1; d.mons.push(m); g.killMon ? g.killMon(m) : 0; } const gems = d.loot.filter(l => l.t === 'gem').length; const need = run.need; g.gemGain(need); return { gems, lv: run.lv, pending: run.pending, modal: !document.getElementById('gear').hidden, choices: run.choices.length, text: document.getElementById('gear').textContent.includes('레벨 업') }; });
  await p.screenshot({ timeout: 180000, path: D + 'a_perk.png' });
  r.perk = await p.evaluate(() => { const g = window.__game, d = g.dun, S = g.S, base = g.pstats(); const id = d.run.choices[0]; document.querySelector('[data-perk="' + id + '"]').click(); const after = g.pstats(); return { picked: id, perks: { ...d.run.perk }, closed: document.getElementById('gear').hidden, dmgUp: after.dmg >= base.dmg }; });
  // 5) 퍽 효과: 공격력/회전 칼날/번개
  r.fx = await p.evaluate(() => { const g = window.__game, d = g.dun, P = g.player; d.run.perk = { atk: 3, orbit: 2, bolt: 2, magnet: 1 }; const st = g.pstats(); d.mons.length = 0; const m = g.mkMonT(1, 1, P.x + 64, P.y); m.hp = m.mhp = 9999; d.mons.push(m); d.orbA = 0; d.wave.toSpawn = 0; d.wave.clearT = -999; const h0 = m.hp; g.arenaTick(.016); const orb = h0 - m.hp; d.run.boltT = 0; const h1 = m.hp; g.arenaTick(.016); return { dmg3: st.dmg, orbHit: orb > 0, boltHit: h1 - m.hp > 0, bolts: (d.bolts || []).length }; });
  // 6) 보스 웨이브
  r.boss = await p.evaluate(() => { const g = window.__game, d = g.dun; d.mons.length = 0; d.run.perk = {}; g.startWave(10); const b = d.mons.find(m => m.arenaBoss); const out = { boss: b && b.n, hp: b && b.hp }; g.startWave(30); const dm = d.mons.find(m => m.demon); out.demon30 = !!dm; d.mons.length = 0; return out; });
  await p.screenshot({ timeout: 180000, path: D + 'a_arena.png' });
  // 7) 종료(사망) → 결과 + 기록
  r.end = await p.evaluate(async () => { const g = window.__game, S = g.S, d = g.dun; d.wave.n = 6; d.run.kills = 40; const b0 = S.bells; g.player.hp = 0; await new Promise(r => setTimeout(r, 1200)); return { scene: g.scene(), best: S.arena.best, runs: S.arena.runs, bellsGain: S.bells - b0, panel: document.getElementById('gear').textContent.includes('쓰러졌어요'), rank: S.arena.rank.length, daily: g.dailyTouch().runs }; });
  await p.screenshot({ timeout: 180000, path: D + 'a_result.png' });
  require('../lib/harness').report((r), errs.slice(0, 6)); await b.close();
})();
