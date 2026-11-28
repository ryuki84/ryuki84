// 휴대폰 화면(모바일 개편 v2): 공통 HUD, 아날로그 조이스틱(터치), 상황 행동 버튼, 지역 이름, 미니맵→지도, 가로 화면 패널 위치
const open = require('../lib/harness'); const D = open.OUT + '/';
(async () => {
  const { b, p, errs } = await open({ ...open.devices['iPhone 13'] });
  const until = (fn, arg, t = 120000) => p.waitForFunction(fn, arg, { timeout: t }).then(() => true).catch(() => false);
  await until(() => window.__game && __game.KAY.ready, null, 180000);
  const r = {};
  r.startBtn = await p.evaluate(() => { const s = document.getElementById('start').getBoundingClientRect(); return s.bottom <= innerHeight && s.top >= 0; });
  r.touchText = await p.evaluate(() => document.querySelector('#help .tonly').offsetHeight > 0 && document.querySelector('#help .konly').offsetHeight === 0);
  await p.tap('#start'); await until(() => __game.WORLD, null, 180000);
  await p.evaluate(() => __game.setClock(13));
  r.hud = await until(() => { const v = id => { const e = document.getElementById(id); return e && e.offsetWidth > 0; }; return __game.M2 && v('hst') && v('abtn') && !v('bells') && !v('rpg'); });
  // 조이스틱: 왼쪽 아래를 터치해서 오른쪽 위로 밀면 그 방향(대각선)으로 걸어요
  const vp = p.viewportSize(), cdp = await p.context().newCDPSession(p), sx = vp.width * .25, sy = vp.height * .72;
  const p0 = await p.evaluate(() => (window.__p0 = { x: __game.player.x, y: __game.player.y }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
  for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + i * 7, y: sy - i * 7 }] }); await p.waitForTimeout(40); }
  r.joyOn = await until(() => __game.JOY.on && __game.JOY.x > .3 && __game.JOY.y < -.3, null, 10000);
  r.moved = await until(() => { const P = __game.player; return Math.hypot(P.x - __p0.x, P.y - __p0.y) > 40; }, null, 30000);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  r.joyOff = await until(() => !__game.JOY.on, null, 10000);
  r.dir = await p.evaluate(p0 => { const P = __game.player; return [Math.round(P.x - p0.x), Math.round(P.y - p0.y)]; }, p0);
  r.villageArea = await until(() => __game.AREA.cur === '🏘️ 포근 마을', null, 20000);
  // 월드: 나무를 바라보면 행동 버튼이 '나무 베기'로 바뀌어요
  await p.evaluate(() => __game.enterWorld()); await until(() => __game.scene() === 'dun' && __game.dun.kind === 'world');
  r.tree = await p.evaluate(() => { const g = __game, P = g.player, tx = Math.floor(P.x / 32), ty = Math.floor((P.y + 8) / 32); g.dun.mons.length = 0; g.setCell(tx, ty - 1, 1, false); P.dx = 0; P.dy = -1; return true; });
  r.ctxTree = await until(() => /나무 베기/.test(document.getElementById('actx').textContent) && document.getElementById('abtn').textContent.includes('🪓'), null, 20000);
  r.worldArea = await until(() => __game.AREA.cur && __game.AREA.cur !== '🏘️ 포근 마을', null, 20000);
  r.subs = await p.evaluate(() => [...document.querySelectorAll('#subs button')].map(b => b.textContent));
  await p.screenshot({ path: D + 'mobile_world.png' });
  // 미니맵을 누르면 지도
  r.miniTap = await p.evaluate(() => { const m = document.getElementById('minitap'); if (!m || m.hidden) return false; m.click(); return true; });
  r.mapOpen = await until(() => !document.getElementById('gear').hidden && !!document.getElementById('wmap'), null, 10000);
  r.tabsNoKeys = await p.evaluate(() => [...document.querySelectorAll('#gear [data-tab]')].every(b => !/\([A-Z]\)/.test(b.textContent)));
  await p.screenshot({ path: D + 'mobile_map.png' });
  // 가로 화면: 패널이 오른쪽에 붙어요
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(800);
  r.landPanel = await p.evaluate(() => { const g = document.getElementById('gear').getBoundingClientRect(); return { left: Math.round(g.left), right: Math.round(g.right), w: innerWidth }; });
  await p.screenshot({ path: D + 'mobile_land_map.png' });
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
