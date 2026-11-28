const open = require('../lib/harness');
const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open();
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  const r = {};
  // 마을: 열매 줍기 회귀 테스트 (실제 키 입력으로 걷기)
  r.village = await p.evaluate(async () => {
    const g = window.__game, sl = ms => new Promise(r => setTimeout(r, ms)); const t = g.trees.find(t => t.age >= 60 && t.fruit > 0) || g.trees[0];
    g.player.x = (t.x + .5) * 32; g.player.y = (t.y + 1.5) * 32; g.player.dx = 0; g.player.dy = -1; g.act(); await sl(300);
    const n0 = Object.values(g.S.inv).reduce((a, b) => a + b, 0); const it = window.__ground = null; return { fruit: n0 };
  });
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(700); await p.keyboard.up('ArrowDown'); await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(700); await p.keyboard.up('ArrowLeft');
  r.villageAlive = await p.evaluate(() => ({ scene: window.__game.scene(), t: document.getElementById('clock').textContent }));
  // 월드 → 동굴 → 복귀
  await p.evaluate(() => window.__game.enterWorld());
  await p.waitForFunction(() => { const g = window.__game; return g.scene() === 'dun' && g.dun.kind === 'world' && g.dun.vil && g.WORLD && g.WORLD.pois.some(p => p.type === 'cave'); }, null, { timeout: 120000 }).catch(() => {}); await p.waitForTimeout(300);
  r.cave = await p.evaluate(async () => {
    const g = window.__game, W = g.WORLD, sl = ms => new Promise(r => setTimeout(r, ms)); const c = W.pois.find(p => p.type === 'cave');
    g.player.x = (c.x + 1) * 32; g.player.y = (c.y + 1.5) * 32 + 18; g.player.dx = 0; g.player.dy = -1; g.dun.mons.length = 0; await sl(200); if (g.dun.kind === 'world') g.worldAct(); await sl(300);   // 저프레임에서는 입구에 서는 순간 이미 들어가 있을 수 있어요
    const inDun = { scene: g.scene(), kind: g.dun.kind, hasRet: !!g.dun.ret, depth: g.dun.depth };
    g.player.hp = 0; await sl(800); // 동굴에서 사망 → 월드 리스폰
    return { inDun, after: { scene: g.scene(), kind: g.dun && g.dun.kind, at: [Math.round(g.player.x / 32), Math.round(g.player.y / 32)] }, spawn: W.spawn };
  });
  // 포털: 마을로 복귀
  r.portal = await p.evaluate(async () => {
    const g = window.__game, W = g.WORLD, sl = ms => new Promise(r => setTimeout(r, ms)); const po = W.pois.find(p => p.type === 'portal');
    g.player.x = (po.x + .5) * 32; g.player.y = (po.y + .5) * 32 + 18; g.player.dx = 0; g.player.dy = -1; g.dun.mons.length = 0; g.worldAct(); await sl(400);
    return { scene: g.scene() };
  });
  // 저장/불러오기: 편집 내용이 유지되는지
  r.save = await p.evaluate(() => { const raw = localStorage.getItem('pokgeun-maeul'); const o = JSON.parse(raw); return { edits: Object.keys(o.wedits || {}).length, wp: Object.keys(o.wp || {}).length, disc: (o.disc || '').length, bytes: raw.length }; });
  await p.screenshot({ timeout: 180000, path: D + 'w_after.png' });
  require('../lib/harness').report((r), errs.slice(0, 6)); await b.close();
})();
