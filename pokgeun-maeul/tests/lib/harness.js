// 포근 마을 시나리오 테스트 공통 도구
// - 저장소 루트를 정적 서버로 띄우고, three.js CDN 요청을 node_modules/three 로 바꿔 줘요(오프라인 실행).
// - Google Fonts 요청은 막아요(테스트와 무관, 네트워크 의존 제거).
// - 결과는 report()로 "@@RESULT {json}" 한 줄을 출력하고, tests/run.js 가 판정해요.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.env.GAME_ROOT || path.resolve(__dirname, '..', '..');
const THREE_DIR = path.join(ROOT, 'node_modules', 'three');   // package.json exports 제한 때문에 경로로 지정
const OUT = path.resolve(__dirname, '..', 'out'); fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.glb': 'model/gltf-binary', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain' };
const BROWSER_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

let srv = null, port = 0;
function serve() {
  return new Promise(res => {
    if (srv) return res();
    srv = http.createServer((q, s) => {
      const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
      fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(b); });
    }).listen(0, () => { port = srv.address().port; srv.unref(); res(); });
  });
}
async function routes(p) {
  await p.route('**/npm/three@0.187.0/**', r => r.fulfill({ path: path.join(THREE_DIR, r.request().url().split('/npm/three@0.187.0/')[1].split('?')[0]), contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' } }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}
function watchErrors(p) {
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && !/fonts\.g|ERR_TUNNEL|ERR_FAILED|Failed to load resource|GPU stall|swiftshader|WebGL: INVALID_ENUM/i.test(m.text()) && errs.push(m.type() + ': ' + m.text().slice(0, 300)));
  return errs;
}
async function open(opts = {}) {
  await serve();
  const b = await chromium.launch({ args: BROWSER_ARGS });
  const { qs, ...ctx } = opts;
  const p = await b.newPage(Object.assign({ viewport: { width: 960, height: 640 }, deviceScaleFactor: 1 }, ctx));
  p.setDefaultTimeout(120000);   // 소프트웨어 렌더링은 느려서 기본 30초로는 부족해요
  const errs = watchErrors(p); await routes(p);
  await p.goto(`http://localhost:${port}/index.html` + (qs || process.env.QS || ''));
  await p.waitForFunction(() => window.__game, null, { timeout: 60000 }).catch(() => {});
  return { b, p, errs, port };
}
function report(r, ...errLists) {
  const errs = [].concat(...errLists.filter(Array.isArray));
  process.stdout.write('@@RESULT ' + JSON.stringify({ r, errs }) + '\n');
}
module.exports = open;
Object.assign(open, { open, report, routes, watchErrors, devices, chromium, OUT, ROOT, THREE_DIR, BROWSER_ARGS, SERVER_PORT: +process.env.TEST_SERVER_PORT || 3099 });
