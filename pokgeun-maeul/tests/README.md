# 포근 마을 시나리오 테스트

실제 브라우저(Chromium, Playwright)로 게임을 띄워서 핵심 기능이 동작하는지 확인하는 회귀 테스트예요.

## 실행

```bash
cd pokgeun-maeul
npm install          # three(0.187.0)·playwright(1.63.0) 설치, server/ 의존성도 함께 설치
npx playwright install chromium   # 처음 한 번 (이미 브라우저가 있으면 생략)
npm test             # 전체 (약 15~20분, 소프트웨어 렌더링 기준)
npm run test:quick   # 서버·실사 렌더링 시나리오 제외
npm test -- arena maze   # 이름으로 골라 실행
```

- 통과·실패 표는 콘솔에 출력되고, 자세한 결과는 `tests/out/results.json`에 저장돼요. 스크린샷도 `tests/out/`에 저장되고, 이 폴더는 git에서 제외돼 있어요.
- 전부 통과하면 종료 코드 0, 하나라도 실패하면 1이에요.

## 구조

| 경로 | 역할 |
|---|---|
| `tests/run.js` | 실행기: 시나리오 목록, 판정 조건, 서버 자동 실행, 결과 표 |
| `tests/lib/harness.js` | 공통 도구: 정적 서버, three.js 로컬 공급(CDN 대신 `node_modules/three`), 폰트 요청 차단, 결과 출력 |
| `tests/scenarios/*.js` | 시나리오 19개(아래 표) |

| 시나리오 | 확인 내용 |
|---|---|
| arena | 아레나 입장·웨이브·강화·보스·종료·랭킹 |
| demon_lord | 마왕성 층, 대마왕 3페이즈, 처치, 스토리 완료, 재림 |
| world_cave_portal | 동굴 던전 입장·복귀, 포털, 저장 |
| graphics_quality | 화질 단계 순환·저장, 모바일 기본값 |
| player_anim | 대기·달리기·공격·피격 애니메이션 전환 |
| camera_move | 3인칭 카메라 기준 이동 방향 |
| seamless_regions(_real) | 마을↔월드↔집 걸어서 이동 (툰 / 실사) |
| ui_dock | 메뉴 독, 닫기 버튼, 스킬 바 클릭 |
| drag_drop | 장비 착용·거부·해제, 상점 판매, 가구 배치 |
| maze | 고대 미궁 생성·소탕 |
| dino_models | 공룡 모델 배치 |
| pbr_probe | 실사 셰이더 기기 검사 |
| save_system | 저장 마이그레이션·백업 복구·저장 실패 알림·내보내기/가져오기 |
| combat_feel | 공격 타격 시점·히트스톱, 시작 화면 업데이트 안내 |
| elite_monsters | 정예 5종 등장 확률·능력치·모델·특수 패턴·장비 드롭 |
| monster_models | 몬스터 7종 모델, 대기·걷기·달리기·공격·피격·죽음 동작, 공격 예비 동작(❗) |
| multiplayer, multiplayer_look | 서버 접속·채팅·공유 편집·외형 동기화·비정상 값 정리 |

## 주의

- GPU 없이 소프트웨어 WebGL(SwiftShader)로 돌아서 **프레임이 매우 낮아요(2~7fps).** 그래서 시나리오는 "몇 초 기다리기" 대신 "상태가 바뀔 때까지 기다리기"로 작성해요.
- 이 테스트를 통과해도 **실제 기기의 성능이나 그래픽 품질을 보장하지 않아요.**
- 대부분 시나리오는 속도를 위해 `?style=toon`(툰 렌더링)으로 돌려요. 실사 렌더링은 `seamless_regions_real`, `pbr_probe`가 맡아요.
