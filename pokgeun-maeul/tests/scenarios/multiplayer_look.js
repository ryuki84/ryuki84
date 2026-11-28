const { chromium } = require('playwright');
const D = require('../lib/harness').OUT + '/';
const URL = 'http://localhost:' + require('../lib/harness').SERVER_PORT + '/?online&style=toon';
const sl = ms => new Promise(r => setTimeout(r, ms));
async function client(b, nick, vp = { width: 960, height: 640 }) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 }); p.setDefaultTimeout(120000); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/Failed to load/.test(m.text()) && errs.push(m.text().slice(0, 200)));
  await p.route('**/npm/three@0.187.0/**', r => r.fulfill({ path: require('../lib/harness').THREE_DIR + '/' + r.request().url().split('/npm/three@0.187.0/')[1], contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' } })); await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto(URL); await p.waitForFunction(() => window.__game, null, { timeout: 180000 }); await p.fill('#nick', nick); await p.click('#start'); await sl(1500);
  return { p, errs };
}
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const A = await client(b, '아리'), B = await client(b, '보리'); const r = {};
  for (const c of [A, B]) await c.p.evaluate(() => window.__game.enterWorld());
  await B.p.evaluate(() => { const g = window.__game; g.player.x += 64; });
  await sl(1500); await A.p.waitForFunction(() => __game.KAY.ready); await B.p.waitForFunction(() => __game.KAY.ready);
  await A.p.evaluate(() => __game.togglePanel('look')); await sl(400);
  for (const k of ['av:3', 'ot:2', 'bd:3', 'hat:4']) { await A.p.evaluate(k => document.querySelector(`[data-look="${k}"]`).click(), k); await sl(100); }
  await sl(1800);
  r.bSeesA = await B.p.evaluate(() => [...window.__game.NET.others.values()].map(o => o.look)); await A.p.keyboard.press('Escape'); await sl(300); await B.p.screenshot({ path: D + 'mp_kay_b.png' }); r.wx = await B.p.evaluate(() => { const W = __game.WX; return { type: W.type, eff: W.eff, flash: W.flash, storm: W.storm, others: [...__game.NET.others.values()].length }; });
  r.badInput = await A.p.evaluate(() => { window.__game.NET.send({ t: 'look', look: { h: 99, ot: -4, bd: 'x', br: 3, evil: 1 } }); return 1; });
  await sl(1500);
  r.sanitized = await B.p.evaluate(() => [...window.__game.NET.others.values()].map(o => o.look));
  await B.p.screenshot({ path: D + 'mp_look_b.png' });
  require('../lib/harness').report((r), A.errs.slice(0, 4), B.errs.slice(0, 4)); await b.close();
})();
