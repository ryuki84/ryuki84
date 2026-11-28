// 샌드박스 전환: 전투 중심 콘텐츠(아레나·마왕성·왕국 스토리·정예)가 꺼져 있고, 기본 전투·채집은 그대로인지 확인해요
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await p.keyboard.press('Space');
  await until(() => __game.WORLD, null, 180000);
  const r = {};
  r.feat = await p.evaluate(() => ({ ...__game.FEAT }));
  r.dock = await p.evaluate(() => [...document.querySelectorAll('#dock [data-dock]')].map(e => e.dataset.dock));
  // 단축키 L(왕국)·Y(아레나)를 눌러도 창이 열리지 않아요
  await p.keyboard.press('KeyL'); await p.keyboard.press('KeyY');
  r.panelOpened = await p.evaluate(() => !document.getElementById('gear').hidden);
  await p.evaluate(() => { __game.setClock(13); __game.enterWorld(); });
  await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  r.world = await p.evaluate(() => { const W = __game.WORLD; return { demon: W.fixed.some(q => q.type === 'demon') || !!W.demon, towns: W.towns.length }; });
  // 깊은 곳 몬스터도 정예가 되지 않아요(기본 몬스터는 그대로 생성)
  r.elite = await p.evaluate(() => { let n = 0, made = 0; for (let i = 0; i < 1500; i++) { const m = __game.mkMonT(i % 6, 8, 0, 0); if (m) made++; if (m && m.elite) n++; } return { n, made }; });
  r.storyLine = await p.evaluate(() => (document.body.innerText.match(/왕에게 보고|📖/g) || []).length);
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
