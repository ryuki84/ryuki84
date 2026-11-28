# 포근 마을 샌드박스 — 개발 핸드오프

## 한눈에 보기
| 항목 | 내용 |
|---|---|
| 게임 | 채집·제작·건설·생활 중심 샌드박스 생존·제작 RPG (`docs/GAME_DESIGN_DOCUMENT.md`) |
| 시작점 | 기존 게임 `../pokgeun-maeul`(커밋 `12cce9b`)을 복사. 기존 게임은 보존 |
| 저장소·브랜치 | `ryuki84/ryuki84`, 브랜치 `claude/chatgpt-share-link-k3f3we` |
| 코드 | `src/`에서 편집 → `npm run build` → `index.html`(생성 파일, 커밋함) |
| 저장 | `localStorage` 키 `pokgeun-sandbox`(+`.bak1~3`), 형식은 기존 v3 그대로 |
| 테스트 | `npm test` — 시나리오 27개(빌드 최신 확인 후 실행) |
| 작업 순서 | `docs/WORK_QUEUE.md` |
| 아티팩트 | https://claude.ai/artifact/Aoc5seu2i8uMxrq32mo6mz (1판, 비공개). `npm run build:artifact` → `dist/artifact/`를 root로, 파일 161개 게시 |

## 기존 게임과 달라진 점
- **전투 중심 콘텐츠 끔**: `src/js/01-data.js`의 `FEAT = { arena, demon, story, elite }` 모두 `false`
  - 아레나: 마을 건물·메뉴·단축키 Y 없음 / 마왕성: 월드에 생성 안 함 / 왕명 스토리: 메뉴·단축키 L·안내 없음, 국왕은 일반 대사 / 정예: 등장 안 함
  - 코드는 남겨 뒀어요. 지역 보스·희귀 재료 도전 콘텐츠로 재활용할지, 지울지는 P0-8에서 결정
- 테스트: `arena`·`demon_lord`·`elite_monsters` 제거, `sandbox_features` 추가

## 꼭 지킬 것 (기존 게임에서 이어짐)
- `src/js/00-boot.js`의 `GLTFLoader` `data:`→`blob:` 보정은 지우지 않기(아티팩트에서 모델 전부 실패)
- 전체 회귀 중 `src/`·`index.html` 수정 금지, 테스트는 "상태가 바뀔 때까지 기다리기"로 작성
- 새 에셋은 `assets/CREDITS.txt`·`docs/ASSET_INVENTORY.md`에 기록(VRoid 샘플은 CC0 아님)
- 사용자는 휴대폰 아티팩트로 확인 → 아티팩트에서 보이는지가 완료 기준

기존 게임의 상세 구현 기록·알려진 문제는 `../pokgeun-maeul/docs/HANDOFF.md`를 보세요.
