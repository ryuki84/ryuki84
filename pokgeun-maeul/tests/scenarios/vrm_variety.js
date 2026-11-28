// 애니 캐릭터 6종·물들이기·늦게 바뀌는 문제: 시작하기를 누르면 처음부터 애니 캐릭터(마네킹이 먼저 보이지 않음), 새 3종 불러오기, 머리 색 물들이기
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 240000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  const r = {};
  r.preloaded = await p.evaluate(() => Object.keys(window.__game.VRMPRE || {}).length >= 1 || !!window.__game.VRMS.cur || !!window.__game.VRMS.loading);
  // 시작하기 버튼(휴대폰과 같은 경로): 준비될 때까지 기다렸다 시작
  await p.click('#start'); r.btnWait = await p.evaluate(() => document.getElementById('start').textContent);
  await until(() => window.__game && document.getElementById('help').hidden, null, 60000);
  r.firstFrameVrm = await p.evaluate(async () => { await new Promise(res => requestAnimationFrame(res)); return !!(__game.curPE && __game.curPE.vrm); });
  // 사람 주민: 예전 블롭 모델이 한 번도 안 보였는지(준비 전엔 빈 그룹)
  r.vilNoBlob = await p.evaluate(() => __game.villagers.filter(v => v.vrm).every(v => { const e = __game.ENT.get(v); return !e || e.vrm || !e.mon; }));
  for (const [av, k] of [[4, 'shibu'], [5, 'shino'], [6, 'fumiriya']]) { await p.evaluate(av => { __game.S.look = { ...(__game.S.look || {}), av }; }, av); r[k] = await until(k => __game.curPE && __game.curPE.vrm && __game.VRMS.cur.k === k, k); }
  await p.evaluate(() => { const g = __game, P = g.player; g.setClock(13); g.setYaw(0); }); await p.waitForTimeout(1200); await p.screenshot({ timeout: 180000, path: D + 'vrm_fumiriya.png' });
  // 물들이기: 머리 빨강
  await p.evaluate(() => { __game.S.look = { ...__game.S.look, ah: 4, ao: 1 }; });
  r.tint = await until(() => { let ch = false; __game.VRMS.cur.vrm.scene.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) if (/HAIR/i.test(m.name || '') && m.userData.c0 && !m.color.equals(m.userData.c0)) ch = true; }); return ch; }, null, 60000);
  await p.waitForTimeout(800); await p.screenshot({ timeout: 180000, path: D + 'vrm_tint.png' });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
