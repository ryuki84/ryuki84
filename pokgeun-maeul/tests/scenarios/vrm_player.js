// 애니풍 플레이어(VRoid 샘플 + three-vrm): 기본 캐릭터로 불러오기, 대기·달리기·공격 동작, 무기 들기, 외형 창에서 바꾸기·마네킹으로 되돌리기
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 180000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  const r = {};
  r.loaded = await until(() => __game.curPE && __game.curPE.vrm, null, 240000);
  r.key = await p.evaluate(() => __game.VRMS.cur && __game.VRMS.cur.k);
  await p.evaluate(() => { __game.setClock(13); __game.setYaw(0); });
  r.idle = await until(() => __game.curPE.base === 'Unarmed_Idle', null, 60000);
  await p.waitForTimeout(800); await p.screenshot({ timeout: 180000, path: D + 'vrm_village.png' });
  await p.keyboard.down('ArrowUp'); r.run = await until(() => __game.curPE.base === 'Running_A', null, 60000); await p.keyboard.up('ArrowUp');
  // 월드에서 무기 들고 공격
  await p.evaluate(() => __game.enterWorld()); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  r.armedVrm = await until(() => __game.curPE.vrm && __game.curPE.armed, null, 60000);
  r.weapon = await p.evaluate(() => __game.VRMS.cur.holdR.children.length);
  await p.evaluate(() => { __game.dun.mons.length = 0; __game.player.atkCd = 0; __game.attack(); });
  r.attack = await until(() => !!(__game.curPE.one && /Sword_Attack|Attack/.test(__game.curPE.one.getClip().name)), null, 60000);
  await p.waitForTimeout(300); await p.screenshot({ timeout: 180000, path: D + 'vrm_attack.png' });
  // 외형: 다른 애니 캐릭터 → 마네킹
  await p.evaluate(() => { __game.S.look = { ...(__game.S.look || {}), av: 2 }; });
  r.switched = await until(() => __game.curPE.vrm && __game.VRMS.cur.k === 'sample_C', null, 240000);
  await p.waitForTimeout(800); await p.screenshot({ timeout: 180000, path: D + 'vrm_boy.png' });
  await p.evaluate(() => { __game.S.look.av = 3; });
  r.mannequin = await until(() => __game.curPE && !__game.curPE.vrm && __game.curPE.man, null, 60000);
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
