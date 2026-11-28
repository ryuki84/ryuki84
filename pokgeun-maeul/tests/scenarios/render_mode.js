// 그래픽 모드: 예전에 '툰으로 대체' 기록이 남은 기기도 새 버전에서 실사를 다시 시도, 시작 화면 그래픽 정보·다시 시도 버튼
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open({ viewport: { width: 960, height: 600 } });
  const info = () => p.evaluate(() => ({ text: document.getElementById('gfxinfo')?.textContent || '', btn: !!document.getElementById('tryReal'), safe: localStorage.getItem('pokgeun-safe') }));
  const reload = async () => { await p.reload(); await p.waitForFunction(() => window.__game && document.getElementById('gfxinfo')?.textContent, null, { timeout: 120000 }); };
  const r = {};
  // 1) 예전 형식("toon") 기록 → 지우고 실사로
  await p.evaluate(() => localStorage.setItem('pokgeun-safe', 'toon')); await reload();
  r.oldFlag = await info();
  // 2) 이번 버전에서 실패한 기록 → 툰 유지 + 다시 시도 버튼
  const ver = await p.evaluate(() => (document.getElementById('gfxinfo').textContent.match(/버전 (\S+)/) || [])[1]);
  await p.evaluate(v => localStorage.setItem('pokgeun-safe', JSON.stringify({ style: 'toon', v })), ver); await reload();
  r.curFlag = await info();
  // 3) 다시 시도 버튼 → 실사
  await Promise.all([p.waitForNavigation({ timeout: 120000 }), p.click('#tryReal')]);
  await p.waitForFunction(() => window.__game && document.getElementById('gfxinfo')?.textContent, null, { timeout: 120000 });
  r.retried = await info();
  require('../lib/harness').report(r, errs.slice(0, 4)); await b.close();
})();
