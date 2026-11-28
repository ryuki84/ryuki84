// 치비 플레이어(KayKit 부위 조합): 기본 적용, 대기·달리기, 월드에서 무기 들고 공격, 외형 창에서 부위 바꾸기·기본 캐릭터·무작위
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 180000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  const parts = () => p.evaluate(() => { const n = []; __game.curPE.root.traverse(o => o.isMesh && n.push(o.name)); return n; });
  await p.keyboard.press('Space');
  const r = {};
  r.loaded = await until(() => __game.curPE && __game.curPE.cbk, null, 240000);
  r.parts0 = await parts();
  await p.evaluate(() => { __game.setClock(13); __game.setYaw(0); });
  r.idle = await until(() => __game.curPE.base === 'Unarmed_Idle', null, 60000);
  await p.keyboard.down('ArrowUp'); r.run = await until(() => __game.curPE.base === 'Running_A', null, 60000); await p.keyboard.up('ArrowUp');
  await p.evaluate(() => __game.enterWorld()); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  r.armed = await until(() => __game.curPE.cbk && __game.curPE.armed, null, 60000);
  r.weapon = await p.evaluate(() => { let n = 0; __game.curPE.root.traverse(o => { if (o.name === 'handslotr') n = o.children.length; }); return n; });
  await p.evaluate(() => { __game.dun.mons.length = 0; __game.player.atkCd = 0; __game.attack(); });
  r.attack = await until(() => !!(__game.curPE.one && /Attack/.test(__game.curPE.one.getClip().name)), null, 60000);
  await p.waitForTimeout(300); await p.screenshot({ timeout: 180000, path: D + 'chibi_attack.png' });
  // 외형 창: 얼굴 '마법사' + 모자 '마법 모자' + 망토 색 → 부위가 바뀌어요
  await p.evaluate(() => __game.togglePanel('look'));
  for (const k of ['head:2', 'hat:2', 'cape:1', 'cc:5']) { await p.click(`[data-cb="${k}"]`); await p.waitForTimeout(150); }
  r.custom = await until(() => { const n = []; __game.curPE.root.traverse(o => o.isMesh && n.push(o.name)); return n.includes('Mage_Head') && n.includes('Mage_Hat') && n.includes('Knight_Cape'); }, null, 60000);
  r.cb = await p.evaluate(() => ({ ...__game.S.cb }));
  await p.click('[data-cbpre="2"]'); r.preset = await until(() => { const n = []; __game.curPE.root.traverse(o => o.isMesh && n.push(o.name)); return n.includes('Rogue_Head_Hooded'); }, null, 60000);
  await p.click('[data-cbrand]'); await p.waitForTimeout(500); r.rand = await p.evaluate(() => Object.keys(__game.S.cb).length >= 7);
  await p.screenshot({ timeout: 180000, path: D + 'chibi_look.png' });
  r.saved = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('pokgeun-sandbox') || '{}'); return !!o.cb; });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
