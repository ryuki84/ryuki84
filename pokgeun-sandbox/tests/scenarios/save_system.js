// 저장 안정화: 예전 형식 불러오기(마이그레이션), 손상 시 백업 복구, 저장 실패 알림, 내보내기→가져오기 왕복
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open(); const r = {};
  const freeze = () => p.evaluate(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'pokgeun-sandbox' || k.startsWith('pokgeun-sandbox.')) return; return o.call(this, k, v); }; });   // 주입한 값을 닫히는 페이지의 자동 저장이 덮지 않게
  const reload = async () => { await p.reload(); await p.waitForFunction(() => window.__game && __game.saveApi, null, { timeout: 120000 }); };
  // 1) 버전 정보가 없던 예전 저장 (v1) — 내용이 보존되고 최신 버전으로 올라가야 해요
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('pokgeun-sandbox', JSON.stringify({ bells: 777, lv: 5, xp: 3, inv: { apple: 2 }, fin: { chair: 1 }, room: [{ id: 'chair', x: 3, y: 4 }], disc: '0'.repeat(6400), trees: [] })); });
  await freeze(); await reload();
  r.migrate = await p.evaluate(() => { const S = __game.S; return { sv: S.sv, bells: S.bells, lv: S.lv, room: S.room.length, apple: S.inv.apple, oldDisc: (S.disc || '').length > 2000, tools: !!(S.tools && S.tools.axe && S.tools.pick && S.prof), from: __game.saveApi.SAVE.from }; });
  // 2) 본 저장이 깨졌을 때 — 백업으로 불러오고 깨진 원본은 따로 보관
  await p.evaluate(() => { localStorage.setItem('pokgeun-sandbox.bak1', JSON.stringify({ bells: 555, lv: 4, inv: {}, sv: 3 })); localStorage.setItem('pokgeun-sandbox', '{"bells": 1, broken'); });
  await freeze(); await reload();
  r.corrupt = await p.evaluate(() => ({ bells: __game.S.bells, from: __game.saveApi.SAVE.from, kept: !!localStorage.getItem('pokgeun-sandbox.corrupt') }));
  // 3) 저장 실패 — false 반환 + 화면 알림
  await p.keyboard.press('Space'); await p.waitForTimeout(500);
  r.quota = await p.evaluate(() => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'pokgeun-sandbox') { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); }; const ok = __game.saveApi.save(); Storage.prototype.setItem = orig; const m = document.getElementById('msg'); return { ok, warned: !m.hidden && /저장에 실패/.test(m.textContent) }; });
  // 4) 내보내기 → 값 바꾸기 → 가져오기 → 원래대로
  r.roundtrip = await p.evaluate(() => { __game.S.bells = 4321; return __game.saveApi.exportSave().length; });
  const txt = await p.evaluate(() => __game.saveApi.exportSave());
  await p.evaluate(() => { __game.S.bells = 1; __game.saveApi.save(); });
  r.badImport = await p.evaluate(() => __game.saveApi.importSave('{"hello": 1}'));
  await Promise.all([p.waitForNavigation({ timeout: 120000 }), p.evaluate(t => __game.saveApi.importSave(t), txt)]);   // 가져오기는 게임이 스스로 다시 불러와요
  await p.waitForFunction(() => window.__game && __game.saveApi, null, { timeout: 120000 });
  r.afterImport = await p.evaluate(() => ({ bells: __game.S.bells, baks: __game.saveApi.listBackups().length }));
  // 5) 저장 관리 화면
  await p.evaluate(() => { document.getElementById('cfgbtn').click(); }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#cfg [data-cfg="savebox"]').click()); await p.waitForTimeout(400);
  r.ui = await p.evaluate(() => { const k = document.getElementById('keys'); return !k.hidden && /저장 관리/.test(k.textContent) && !!k.querySelector('[data-sv="copy"]'); });
  await p.screenshot({ timeout: 180000, path: open.OUT + '/save_box.png' });
  open.report(r, errs); await b.close();
})();
