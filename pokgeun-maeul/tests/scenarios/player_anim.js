// 플레이어 애니메이션 전환: 대기 → 달리기 → 멈춤 → 무기 공격 → 무기 든 대기 → 피격
// 시간 대기 대신 "상태가 바뀔 때까지" 기다려서 느린 렌더링 환경에서도 판정이 흔들리지 않게 해요.
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open(); await p.keyboard.press('Space');
  await p.waitForFunction(() => __game.MAN.ready && __game.curPE && __game.curPE.kay, null, { timeout: 90000 });
  const st = () => p.evaluate(() => { const e = __game.curPE; return { man: !!e.man, base: e.base, one: e.one && e.one.getClip().name }; });
  const until = (fn, arg) => p.waitForFunction(fn, arg, { timeout: 30000 }).then(() => true).catch(() => false);
  const r = {};
  await until(() => __game.curPE.base === 'Unarmed_Idle'); r.idle = await st();
  await p.keyboard.down('ArrowRight'); r.runOk = await until(() => __game.curPE.base === 'Running_A'); r.run = await st();
  await p.keyboard.up('ArrowRight'); r.stopOk = await until(() => __game.curPE.base === 'Unarmed_Idle'); r.stop = await st();
  await p.evaluate(() => { __game.enterDungeon(1); __game.dun.mons.length = 0; });
  await until(() => __game.curPE && __game.curPE.armed);
  await p.evaluate(() => { __game.player.atkCd = 0; __game.attack(); }); r.atkOk = await until(() => !!(__game.curPE.one && /Sword_Attack|Attack/.test(__game.curPE.one.getClip().name))); r.atk = await st();
  r.afterOk = await until(() => !__game.curPE.one && __game.curPE.base === 'Idle'); r.after = await st();
  await p.evaluate(() => { __game.player.inv = 0; __game.damageP(1); }); r.hitOk = await until(() => !!(__game.curPE.one && /Hit/.test(__game.curPE.one.getClip().name))); r.hit = await st();
  r.fps = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
  open.report(r, errs); await b.close();
})();
