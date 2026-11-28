#!/usr/bin/env node
// 포근 마을 시나리오 테스트 실행기
//   npm test               전체 실행
//   npm test -- arena maze 이름으로 골라 실행
//   npm run test:quick     서버·실사 시나리오를 빼고 빠르게
// 각 시나리오는 별도 node 프로세스로 실행되고 "@@RESULT {json}" 한 줄을 출력해요. 여기서 그 값을 판정해요.
const { spawn } = require('child_process'), path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const SERVER_PORT = 3099;
const T = { toon: { QS: '?style=toon' } };

// 판정: 실패 사유 목록을 돌려줘요(빈 배열 = 통과)
const need = (cond, msg) => cond ? [] : [msg];
const S = [
  { name: 'arena', env: T.toon, check: r => [...need(r.enter?.arena, '아레나 입장'), ...need(r.spawn?.mons > 0, '몬스터 생성'), ...need(r.gem?.choices === 3, '3택1 강화'), ...need(r.boss?.boss, '보스 웨이브'), ...need(r.end?.scene === 'out' && r.end?.rank >= 1, '종료·랭킹')] },
  { name: 'demon_lord', env: T.toon, check: r => [...need(r.top?.boss?.length === 1, '대마왕 등장'), ...need(r.ai?.p3?.phase === 3, '3페이즈'), ...need(r.kill?.demonKills >= 1, '처치'), ...need(r.final?.to === 7, '스토리 완료'), ...need(r.second?.hp > (r.top?.boss?.[0]?.hp || 0), '재림 강화')] },
  { name: 'world_cave_portal', env: T.toon, check: r => [...need(r.cave?.inDun?.scene === 'dun', '동굴 입장'), ...need(r.cave?.after?.kind === 'world', '월드 복귀'), ...need(r.portal?.scene === 'out', '포털로 마을'), ...need(r.save?.bytes > 0, '저장')] },
  { name: 'graphics_quality', env: T.toon, check: r => [...need(r.cycle?.length === 3, '화질 3단계 순환'), ...need(r.saved === 'high', '화질 저장'), ...need(!!r.mobileDefault, '모바일 기본값')] },
  { name: 'player_anim', env: T.toon, check: r => [...need(r.runOk, '달리기 전환'), ...need(r.stopOk, '멈춤 전환'), ...need(r.atkOk, '공격 동작'), ...need(r.afterOk, '공격 후 무기 대기'), ...need(r.hitOk, '피격 동작')] },
  { name: 'camera_move', env: T.toon, check: r => [...need(r.yaw0_up?.[1] < 0 && Math.abs(r.yaw0_up?.[0]) < 4, '카메라 0°: 위=북'), ...need(r.yaw90_up?.[0] < 0 && Math.abs(r.yaw90_up?.[1]) < 4, '카메라 90°: 위=서'), ...need(r.yaw90_right?.[1] < 0 && Math.abs(r.yaw90_right?.[0]) < 4, '카메라 90°: 오른쪽=북'), ...need(r.yaw0_right?.[0] > 0, '카메라 0°: 오른쪽=동')] },
  { name: 'seamless_regions', env: T.toon, check: r => [...need(r.leftVillage?.[1] === 'world', '마을→월드'), ...need(r.inHome?.[0] === 'home', '월드→집'), ...need(r.outHome?.[1] === 'world', '집→월드'), ...need(r.backVillage?.[0] === 'out', '월드→마을')] },
  { name: 'seamless_regions_real', file: 'seamless_regions', args: ['real'], env: {}, slow: true, check: r => [...need(r.leftVillage?.[1] === 'world', '마을→월드(실사)'), ...need(r.inHome?.[0] === 'home', '월드→집(실사)'), ...need(r.backVillage?.[0] === 'out', '월드→마을(실사)')] },
  { name: 'ui_dock', env: T.toon, check: r => [...need(r.gear, '메뉴로 장비창 열기'), ...need(r.closed, '✕로 닫기'), ...need(r.dash, '스킬 바 클릭')] },
  { name: 'drag_drop', env: T.toon, check: r => [...need(r.weaponNow === '테스트 도끼', '무기 칸에 끌어 착용'), ...need(r.ringWrongSlot === null, '맞지 않는 칸 거부'), ...need(r.ringNow === '테스트 반지', '반지 착용'), ...need(r.ringAfterUnequip?.[0] === null, '가방으로 끌어 해제'), ...need(r.sold?.[0] === 0 && r.sold?.[1] > 0, '판매대로 끌어 판매'), ...need(r.furn?.[0] === 1, '가구 끌어 배치')] },
  { name: 'maze', env: T.toon, check: r => [...need(r && r.mons > 0, '미궁 몬스터'), ...need(r && r.clear, '소탕 처리')] },
  { name: 'dino_models', env: T.toon, check: r => need(r === 5, '공룡 5마리 배치') },
  { name: 'pbr_probe', env: {}, slow: true, check: r => [...need(r.env === true, '실사 환경광 유지'), ...need(r.url === '', '툰으로 강제 전환 안 됨')] },
  { name: 'save_system', env: T.toon, check: r => [...need(r.migrate?.sv === 3 && r.migrate?.bells === 777 && r.migrate?.lv === 5 && r.migrate?.room === 1 && r.migrate?.apple === 2, '예전 저장 마이그레이션(내용 보존)'), ...need(r.migrate?.oldDisc === false, '예전 지도 문자열 정리'), ...need(r.corrupt?.bells === 555 && /bak1/.test(r.corrupt?.from) && r.corrupt?.kept, '손상 시 백업 복구·원본 보관'), ...need(r.quota?.ok === false && r.quota?.warned, '저장 실패 알림'), ...need(typeof r.badImport === 'string' && r.badImport.length > 0, '잘못된 파일 거부'), ...need(r.afterImport?.bells === 4321, '내보내기→가져오기 왕복'), ...need(r.afterImport?.baks >= 1, '가져오기 전 자동 백업'), ...need(r.ui, '저장 관리 화면')] },
  { name: 'monster_models', env: T.toon, check: r => { const six = ['Idle', 'Walk', 'Run', 'Attack', 'Hit', 'Death']; return [...need(r.models?.length >= 12 && r.models.every(m => six.every(k => m.clips[k])), '일반 7종+정예 5종 모델·6동작 클립'), ...need(r.ents?.length === 7 && r.ents.every(e => e.mon && e.cur === 'Idle'), '모델 표시·대기'), ...need(r.walkOk && r.runOk, '걷기·달리기'), ...need(r.windStarted && r.duringWind?.hp === 5000 && r.hitLanded, '공격 예비 동작 후 피해'), ...need(r.attackAnim, '공격 동작'), ...need(r.hitAnim, '피격 동작'), ...need(r.death?.inDead && r.deathAnim && r.deathGone, '죽음 동작 후 제거')]; } },
  { name: 'elite_monsters', env: T.toon, check: r => [...need(r.rate?.d1 === 0 && r.rate?.d5 > .03 && r.rate?.d5 < .12, '등장 확률(깊이 1 없음, 깊이 5 약 7%)'), ...need(r.line?.length === 5 && r.line.every(e => e.x3 && e.n.startsWith('★')), '정예 5종 능력치·이름'), ...need(r.models, '정예 전용 모델'), ...need(r.charge?.wind && r.charge?.dash && r.charge?.hit, '가시 슬라임 돌진'), ...need(r.shoot?.orb && r.shoot?.hit, '장수말벌 독침'), ...need(r.spore?.tele && r.spore?.hit, '버섯 대장 포자 장판'), ...need(r.blink, '해골 유령 순간이동'), ...need(r.slam?.warn && r.slam?.noEarly && r.slam?.hit, '해골 오크 예고 후 내려찍기'), ...need(r.loot >= 1, '장비 확정 드롭')] },
  { name: 'combat_feel', env: T.toon, check: r => [...need(r.news, '시작 화면 최근 업데이트'), ...need(r.swing?.immediate && r.swing?.pend, '버튼 즉시가 아니라 휘두름 중에 판정'), ...need(r.landed, '타격 적용'), ...need(r.stopSeen, '히트스톱')] },
  { name: 'multiplayer', server: true, slow: true, check: r => [...need(r.connected?.every(c => c.on), '두 명 접속'), ...need(r.seesEachOther?.every(l => l.length === 1), '서로 보임'), ...need(r.chat?.some(t => /안녕하세요/.test(t)), '채팅'), ...need(r.shared?.a === r.shared?.b, '건설 공유'), ...need(r.chop?.a === r.chop?.b, '채집 공유')] },
  { name: 'multiplayer_look', server: true, slow: true, check: r => { const a = r.bSeesA?.[0] || {}, z = r.sanitized?.[0] || {}; return [...need(a.ot === 2 && a.bd === 3 && a.hat === 4, '외형 동기화'), ...need(Object.values(z).every(v => Number.isInteger(v) && v >= 0 && v <= 9) && !('evil' in z), '비정상 값 정리')]; } },
];

function runOne(t, timeoutMs) {
  return new Promise(res => {
    const t0 = Date.now(), file = path.join(__dirname, 'scenarios', (t.file || t.name) + '.js');
    const ch = spawn(process.execPath, [file, ...(t.args || [])], { cwd: ROOT, env: { ...process.env, ...(t.env || {}), TEST_SERVER_PORT: String(SERVER_PORT) } });
    let out = '', err = ''; ch.stdout.on('data', d => out += d); ch.stderr.on('data', d => err += d);
    const kill = setTimeout(() => ch.kill('SIGKILL'), timeoutMs);
    ch.on('close', code => {
      clearTimeout(kill); const sec = Math.round((Date.now() - t0) / 1000), line = out.split('\n').find(l => l.startsWith('@@RESULT '));
      if (!line) return res({ name: t.name, pass: false, sec, why: [code === null ? `시간 초과(${timeoutMs / 1000}s)` : '결과 없음: ' + ((err.match(/(\w*Error)[^\n]*\n[\s\S]*?at [^\n]*scenarios[\/\\][^\n]*/) || [])[0] || err.trim().slice(-300)).replace(/\s+/g, ' ').slice(0, 300)] });
      let data; try { data = JSON.parse(line.slice(9)); } catch (e) { return res({ name: t.name, pass: false, sec, why: ['결과 해석 실패'] }); }
      let why = []; try { why = t.check(data.r); } catch (e) { why = ['판정 오류: ' + e.message]; }
      if (data.errs?.length) why.push('페이지 오류: ' + data.errs.slice(0, 2).join(' | '));
      res({ name: t.name, pass: !why.length, sec, why, r: data.r });
    });
  });
}
async function withServer(fn) {
  const dataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pokgeun-test-'));
  const sv = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], { env: { ...process.env, PORT: String(SERVER_PORT), DATA_DIR: dataDir }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  try { return await fn(); } finally { sv.kill(); }
}
(async () => {
  const args = process.argv.slice(2), quick = args.includes('--quick'), only = args.filter(a => !a.startsWith('--'));
  let list = S.filter(t => only.length ? only.includes(t.name) : !(quick && t.slow));
  if (!list.length) { console.log('실행할 시나리오가 없어요. 이름:', S.map(t => t.name).join(', ')); process.exit(2); }
  console.log(`포근 마을 시나리오 테스트 — ${list.length}개 (소프트웨어 WebGL 기준, 실제 기기 성능과 다를 수 있어요)\n`);
  const results = [];
  for (const t of list) {
    process.stdout.write(`▶ ${t.name} ... `);
    const r = t.server ? await withServer(() => runOne(t, 600000)) : await runOne(t, t.slow ? 600000 : 420000);
    results.push(r); console.log(`${r.pass ? '✅ 통과' : '❌ 실패'} (${r.sec}s)${r.pass ? '' : '\n   - ' + r.why.join('\n   - ')}`);
  }
  const ok = results.filter(r => r.pass).length;
  console.log(`\n결과: ${ok}/${results.length} 통과`);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 1));
  process.exit(ok === results.length ? 0 : 1);
})();
