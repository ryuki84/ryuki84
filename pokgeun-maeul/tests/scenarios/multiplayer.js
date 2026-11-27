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
  const A = await client(b, '아리'), B = await client(b, '보리');
  const r = {};
  for (const c of [A, B]) await c.p.waitForFunction(() => window.__game.NET.on, null, { timeout: 120000 }).catch(() => {});   // 서버 연결이 끝날 때까지
  r.connected = await Promise.all([A, B].map(c => c.p.evaluate(() => ({ on: window.__game.NET.on, id: window.__game.NET.id, name: window.__game.NET.name, count: window.__game.NET.count }))));
  // 둘 다 오픈월드로 입장 (같은 마을 근처)
  for (const c of [A, B]) await c.p.evaluate(() => window.__game.enterWorld());
  await B.p.evaluate(() => { const g = window.__game; g.player.x += 64; g.player.dx = -1; g.player.dy = 0; });
  await sl(2500);
  r.seesEachOther = await Promise.all([A, B].map(c => c.p.evaluate(() => [...window.__game.NET.others.values()].map(o => ({ name: o.name, x: Math.round(o.x), y: Math.round(o.y) })))));
  // 채팅
  await A.p.keyboard.press('Enter'); await A.p.type('#chatin', '안녕하세요!'); await A.p.keyboard.press('Enter'); await sl(1200);
  r.chat = await B.p.evaluate(() => [...document.querySelectorAll('#chatlog div')].map(d => d.textContent));
  r.otherBubble = await B.p.evaluate(() => { const o = [...window.__game.NET.others.values()][0]; return o && { say: o.say, sayT: Math.round(o.sayT * 10) / 10 }; });
  // 공유 건설: A가 벽을 짓고 B가 본다 (마을 밖에서)
  await A.p.evaluate(async () => { const g = window.__game, S = g.S, P = g.player, W = g.WORLD, t = { x: W.spawn.x + 40, y: W.spawn.y - 60 }; Object.assign(S.mat, { wood: 20 }); P.x = (t.x + 25.5) * 32; P.y = (t.y + 25.5) * 32 - 8; window.__bx = Math.floor(P.x / 32) + 1; window.__by = Math.floor((P.y + 8) / 32); P.dx = 1; P.dy = 0; g.setBuild(0); g.attack(); });
  await sl(800);
  const loc = await A.p.evaluate(() => ({ bx: window.__bx, by: window.__by, here: window.__game.wc(window.__bx, window.__by) }));
  r.shared = { a: loc.here, b: await B.p.evaluate(l => window.__game.wc(l.bx, l.by), loc), serverEdits: await (await fetch('http://localhost:' + require('../lib/harness').SERVER_PORT + '/health')).json() };
  await A.p.screenshot({ path: D + 'mp_a.png' });
  await B.p.screenshot({ path: D + 'mp_b.png' });
  // 채집(0) 편집도 공유되는지: A가 나무를 베면 B 화면에서도 사라짐
  r.chop = await A.p.evaluate(async () => { const g = window.__game, W = g.WORLD, N = W.N; let tx = -1, ty = -1; for (let y = W.spawn.y - 80; y < W.spawn.y + 80 && tx < 0; y++) for (let x = W.spawn.x + 40; x < W.spawn.x + 120; x++) if (g.wc(x, y) === 1 && g.wc(x - 1, y) === 0 && !g.wsolid(x - 1, y)) { tx = x; ty = y; break; }
    const P = g.player; P.x = (tx - .5) * 32; P.y = (ty + .5) * 32 - 8; P.dx = 1; P.dy = 0; g.setBuild(null); for (let i = 0; i < 6; i++) { P.atkCd = 0; g.attack(); await new Promise(r => setTimeout(r, 120)); } window.__tree = { tx, ty }; return { tx, ty, a: g.wc(tx, ty) }; });
  await sl(800);
  r.chop.b = await B.p.evaluate(t => window.__game.wc(t.tx, t.ty), r.chop);
  require('../lib/harness').report((r), A.errs.slice(0, 4), B.errs.slice(0, 4));
  await b.close();
})();
