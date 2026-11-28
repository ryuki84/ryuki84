# 포근 마을 샌드박스 — 개발 핸드오프

## 한눈에 보기
| 항목 | 내용 |
|---|---|
| 게임 | 채집·제작·건설·생활 중심 샌드박스 생존·제작 RPG (`docs/GAME_DESIGN_DOCUMENT.md`) |
| 시작점 | 기존 게임 `../pokgeun-maeul`(커밋 `12cce9b`)을 복사. 기존 게임은 보존 |
| 저장소·브랜치 | `ryuki84/ryuki84`, 브랜치 `claude/chatgpt-share-link-k3f3we` |
| 코드 | `src/`에서 편집 → `npm run build` → `index.html`(생성 파일, 커밋함) |
| 저장 | `localStorage` 키 `pokgeun-sandbox`(+`.bak1~3`), 형식은 기존 v3 그대로 |
| 테스트 | `npm test` — 시나리오 28개(빌드 최신 확인 후 실행) |
| 작업 순서 | `docs/WORK_QUEUE.md` |
| 아티팩트 | https://claude.ai/artifact/Aoc5seu2i8uMxrq32mo6mz (2판: 치비 캐릭터 셋, 비공개). `npm run build:artifact` → `dist/artifact/`를 root로, 파일 161개 게시 |

## 기존 게임과 달라진 점
- **전투 중심 콘텐츠 끔**: `src/js/01-data.js`의 `FEAT = { arena, demon, story, elite }` 모두 `false`
  - 아레나: 마을 건물·메뉴·단축키 Y 없음 / 마왕성: 월드에 생성 안 함 / 왕명 스토리: 메뉴·단축키 L·안내 없음, 국왕은 일반 대사 / 정예: 등장 안 함
  - 코드는 남겨 뒀어요. 지역 보스·희귀 재료 도전 콘텐츠로 재활용할지, 지울지는 P0-8에서 결정
- 테스트: `arena`·`demon_lord`·`elite_monsters` 제거, `sandbox_features` 추가

## 캐릭터 셋 (2026-11-28 재설계)
- 사람: KayKit Adventurers 5종(같은 뼈대)의 부위를 섞어 만들어요 → `src/js/12-chibi.js` `mkChibi(spec, eq, armed)`
  - spec = `{ head, body, legs, hat, cape, cc, hc, prop, prop2 }` (`cbOf`로 범위 보정). 머리·몸·팔·다리는 뼈대에 다시 묶고(`SkinnedMesh.bind`), 모자·망토는 머리·가슴 뼈에 붙여요
  - 플레이어 외형은 `S.cb`, 멀티플레이는 `netLookOf()`로 보내고 서버 `cleanLook`이 head·body·legs·cape·cbk 키를 허용
  - 주민은 `VILLAGERS[].cb`, 촌장·경비는 `CB_NPC`
- 동물: `assets/pets/`(Kenney Cube Pets) — `MTGT`의 `p/…` 키, 클립 이름은 소문자(idle·walk·run)라 `MONCLIP`에 대소문자 무시 추가
- 몬스터·공룡은 Quaternius 그대로

## 휴대폰 화면 (2026-11-28 모바일 개편 v2)
- `body.m2` = 터치 기기 또는 폭 760px 이하. `src/js/29-hud.js`가 HUD를 만들고, `src/style.css` 맨 끝 "모바일 개편 v2" 블록이 배치를 정해요. 데스크톱 화면은 예전 그대로예요.
- 조이스틱: `#jzone`(왼쪽 아래 52%×62%)을 누르면 그 자리에 나타나고 `JOY {x,y,on}`(08-input.js)을 채워요. `update()`가 키 입력이 없으면 `JOY`로 아날로그 이동(세기 0.35~1 → 속도).
- 행동 버튼 `#abtn`(Space 누름/뗌) 아이콘·이름은 `ctxHint()`의 첫 이모지·문구. 월드에서는 `ctxWorld()`가 바라보는 칸을 보고 정해요(데스크톱 안내 문구에도 쓰여요).
- 보조 버튼은 `SUBS[장면]`(out·home·dun·wild·world·building, 더보기=more).
- 화면 전환: `enterDungeon`·`leaveDungeon`·`warpTo`를 감싸 `#fade`. 걸어서 넘는 경계(seamTo…)는 전환 없이 이어져요.
- 지역 이름: `areaName()` → 1초 머물면 `#banner`. 휴대폰에서는 예전 "○○ — 안전지대예요" 알림을 띄우지 않아요(배너와 겹침).

## 꼭 지킬 것 (기존 게임에서 이어짐)
- `src/js/00-boot.js`의 `GLTFLoader` `data:`→`blob:` 보정은 지우지 않기(아티팩트에서 모델 전부 실패)
- 전체 회귀 중 `src/`·`index.html` 수정 금지, 테스트는 "상태가 바뀔 때까지 기다리기"로 작성
- 새 에셋은 `assets/CREDITS.txt`·`docs/ASSET_INVENTORY.md`에 기록(VRoid 샘플은 CC0 아님)
- 사용자는 휴대폰 아티팩트로 확인 → 아티팩트에서 보이는지가 완료 기준

기존 게임의 상세 구현 기록·알려진 문제는 `../pokgeun-maeul/docs/HANDOFF.md`를 보세요.
