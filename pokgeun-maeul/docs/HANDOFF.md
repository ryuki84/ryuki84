# 포근 마을 — 개발 핸드오프 (2026-11-28 기준)

이 문서 하나로 지금까지의 작업 전체와 이어서 개발하는 방법을 파악할 수 있게 정리했어요.
처음 받은 요청서는 `docs/PROJECT_HANDOFF.md`(원본, 수정하지 않음)이고, 이 문서는 그 뒤의 결과물이에요.

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 게임 | 동물의 숲(생활) × 디아블로(전투·장비) × 듀랑고(채집·건설·공룡) × XP 히어로(아레나) 브라우저 게임 |
| 실행 파일 | `pokgeun-maeul/index.html` 한 파일(약 4,100줄, ES 모듈). 설치 없이 열면 실행 |
| 멀티플레이 서버 | `pokgeun-maeul/server/server.js`(WebSocket, 90줄) — `npm start` |
| 저장소·브랜치 | `ryuki84/ryuki84`, 브랜치 `ccr-a192749b-nh5md0` (PR 없음) |
| 공개 사본(아티팩트) | https://claude.ai/artifact/53tz7aBPXaNxT3dw6JAHUv (최신 38판, 비공개 — 공유는 Share 메뉴) |
| 3D 엔진 | three.js r187(CDN, import map), 애니 캐릭터 three-vrm 3.5.5 |
| 테스트 | `npm test` — Playwright 시나리오 29개(소프트웨어 WebGL) |
| 기본 그래픽 | 듀랑고풍(실사). 설정에서 원신풍·파스텔 툰·부드러운 3D·귀여운 2D 선택 |

---

## 2. 실행 · 테스트 · 배포

```bash
cd pokgeun-maeul
npm install                    # three·playwright·gltf-transform·three-vrm 등, server/ 의존성도 설치
npm start                      # 멀티플레이 서버(선택). 게임만이면 index.html을 정적 서버로 열면 돼요
npm test                       # 전체 29개(약 35~40분, GPU 없는 환경 기준)
npm test -- vrm_player view_2d # 이름으로 골라 실행
npm run build:artifact         # 아티팩트 게시용 사본 → dist/artifact/
```

### 아티팩트(claude.ai) 게시 규칙 — 꼭 지켜야 해요
1. `npm run build:artifact` → `dist/artifact/` 생성
   - `index.html`: 문서 뼈대 태그를 빼고, `KEXT`·`NEXT`를 `"json"`으로 바꿔요(아티팩트는 .glb를 못 올려요)
   - `.glb`는 glTF JSON(버퍼·이미지 `data:`)으로, `.vrm`은 확장 번호를 지키려고 JSON+`data:`로 직접 변환
2. `dist/artifact/index.html`을 root=`dist/artifact`로 게시. **새 에셋 파일은 `files`에 추가**(기존 파일은 유지됨)
3. ⚠️ **아티팩트 뷰어는 보안 정책상 `data:` 읽기를 막아요(`blob:`은 허용).** `index.html`의 `GLTFLoader.prototype.load` 보정이 `data:`를 `blob:`으로 바꿔 읽어요. 이걸 지우면 아티팩트에서만 모든 3D 모델이 조용히 실패해요(2026-11-28 실제로 발생 → `artifact_copy` 테스트가 같은 정책으로 검사).

### 작업 규칙(사용자 지시 + 경험)
- 작은 단위로 바꾸고 → 관련 테스트 → 전체 회귀 → 커밋·푸시 → 아티팩트 재게시
- **전체 회귀가 도는 동안 `index.html`을 고치지 않기**(테스트가 중간 코드를 읽어 결과가 섞여요)
- 저프레임(2~7fps) 환경이라 테스트는 "몇 초 기다리기" 대신 "상태가 바뀔 때까지 기다리기"로 작성
- 새 에셋은 `assets/CREDITS.txt`·`docs/ASSET_INVENTORY.md`에 출처·라이선스 기록
- 시작 화면 `#help .news`(최근 업데이트)에 눈에 보이는 변화를 짧게(4개 안팎) 적기
- 보고 형식: 작업 요약 / 변경 사항 / 검증 / 남은 문제 / 다음 작업

---

## 3. 코드 구조 (index.html 안의 주요 부분)

| 영역 | 핵심 이름 | 설명 |
|---|---|---|
| 렌더 스타일 | `RSTYLE`, `RENDER_VER`, `SAFE_FROM`, `pbrProbe` | real/cel/toon/pbr. 사용자 선택 `localStorage pokgeun-style`. 실사 기기 검사 실패 시 `pokgeun-safe`({style,v})로 툰 대체 — 버전이 바뀌면 다시 시도 |
| 2D 화면 | `VIEW2D`, `V2`, `load2D`, `draw2D`, `frame2D`, `v2on`, `v2sprite`, `v2proj` | `localStorage pokgeun-view=2d` 또는 `?view=2d`. 2D일 때 `draw()`가 3D를 건너뛰고 오버레이 캔버스(`ov`)에 그려요 |
| 화질·휴대폰 | `QLEVELS`, `QUAL`, `TOUCHDEV`, `touchCap`, `LITE`, `LOD_NEAR`, `GRASS_NEAR`, `GRASS_DENS` | 휴대폰: 해상도 ≤1.5, 보통 화질 블룸 끔, 그림자 1024·2프레임마다, 구역 5×5·안개 46칸 |
| 저장 | `SAVE_KEY`, `SAVE_VER=3`, `migrateSave`, `save`, `backupNow`, `exportSave`, `importSave` | 백업 3개 순환, 손상 시 백업 복구, ⚙️ 설정 → 💾 저장 관리 |
| 무한 월드 | `WN`, `CHK=16`, `genRegion`, `wb`(바이옴), `wc`(칸), `poisNear`, `buildChunk`, `drawWorldTerrain` | 좌표 기반 절차 생성, 마을·집은 끊김 없이 이어진 지역(`vreg`/`hreg`, `seamToWorld`/`seamToLocal`) |
| 자연물 | `NAT`, `NATV`, `natMat`, LOD `lod/*` | Quaternius 나무·바위·풀(실사 모드). 화면 밖 생략·먼 나무 간략 모델·풀은 근거리만 |
| 엔티티 | `ent`, `entM`, `dropEnt`, `sweep`, `ENT`, `animE` | 객체 ↔ 3D 모델 연결. `entM`은 모델 파일이 늦게 오면 코드 모델(`proc`)을 버리고 다시 만들어요 |
| 플레이어 | `mkPlayer`, `refreshLook`, `kayTick`, `kayPlay`, `MCLIP`, `MTRIM`, `pAnim/PEV` | 우선순위: 애니 캐릭터(VRM) → 마네킹(UAL) → KayKit → 코드 모델 |
| 애니 캐릭터 | `VRMK`, `VRMS`, `VRMV`, `buildVRM`, `slimVRM`, `vrmRetarget`, `loadVRM`, `mkVrmEnt`, `vilVRM`, `mkVilEnt` | 고른 캐릭터만 로드, 마네킹 동작 19종을 VRM 뼈대로 옮겨 사용, 같은 재질 조각 합치기 |
| 외형 | `lookOf`(av,ah,ao,h,hc,sk,…), `bodyLook`, `lookSig`, `VRMAV`, `AHC`/`AOC`, `tintVRM` | `av`: 0~2·4~6 애니 캐릭터(6종), 3 커스텀(마네킹, 예전 저장 호환). `ah`·`ao` 애니 머리·옷 물들이기. 서버 `cleanLook`에도 허용 |
| 몬스터 | `MONS`, `mkMon`, `mkMonT`, `MONM`, `MONK`, `MTGT`, `MONCLIP`, `mkMonG`, `monTick`, `MONFIX` | Quaternius Ultimate Monsters 7종 + 정예 5종, 6동작(대기·걷기·달리기·공격·피격·죽음) |
| 정예 | `ELITE`, `eliteify`, `eliteAI`, `ELITE_P` | 깊이 3+에서 약 7%, 돌진·독침·포자 장판·순간이동·광역 내려찍기 |
| 전투 | `attack`, `swingHit`, `HIT_AT`, `hitStop`, `hitMon`, `killMon`, `MON_WIND` | 휘두름 중 판정(0.14초), 히트스톱, 몬스터 공격 ❗ 예비 동작 0.4초 |
| 주민 | `VILLAGERS`, `villagers`, `critters`, `VILM`, `mkVilModel`, `townVil` | 콩이(퍼그)·나비(애니 B)·토리(애니 C)·음메(소), 돌아다니는 시바·여우 |
| NPC | `mkKingM`, `mkGuardM` | 국왕·경비병 = 마네킹 + 왕관·투구·검·방패 |
| 공룡 | `DINOM`, `mkDinoG`, `dinoTick` | Quaternius 공룡 4종 |
| 스폰 | `spawnNear`, `worldTick` | 마을 바로 바깥에 약한 몬스터(마을 40칸 안 70%) |
| 설정 UI | `renderCfg`, `#cfg` | 소리·화질·시점·조작·💾 저장 관리·🎨 그래픽 스타일 |
| 테스트용 | `window.__game` | 거의 모든 상태·함수를 노출(테스트가 사용) |

도구: `tools/build-artifact.mjs`(게시 사본), `tools/make-nature-lod.mjs`(나무 LOD), `tools/slim-vrm.py`(VRM 텍스처 축소).

---

## 4. 지금까지 한 작업 (시간 순)

### 4-1. 초기 ~ 무한 월드 (분석 이전, 대화 초반)
2D 픽셀 동물의 숲 프로토타입 → 3D(three.js)로 전환 → 듀랑고풍 실사 렌더 고정 → 비율·3인칭 시점·그래픽 최대화 → UI/UX 개편, 모바일 최적화·드래그 앤 드롭 → 외형 꾸미기 → 한 맵 통합(마을·월드·집 끊김 없이) → 무한 맵(절차 생성 구역·길·미궁) → 아레나·왕국 스토리·대마왕·멀티플레이 등.

### 4-2. 분석 (PROJECT_HANDOFF 요청에 따라, 소스 미수정)
`docs/PROJECT_AUDIT.md`(진단), `IMPROVEMENT_ROADMAP.md`(TOP 10·작업 A/B/C), `ASSET_INVENTORY.md`, `TEST_BASELINE.md`(기준선 10/15).

### 4-3. 작업 A·B·C
- **A 테스트 이전**: 임시 폴더의 테스트를 `tests/`로, `npm test`, 상태 조건 대기 → 15/15
- **B 저장 안정화**: 버전·마이그레이션·백업 3개·손상 복구·실패 알림·내보내기/가져오기/복원
- **C 몬스터 모델·전투 피드백**: Ultimate Monsters 7종, 6동작, ❗ 예비 동작, 쓰러지는 동작

### 4-4. 이후 개선
| 작업 | 결과 |
|---|---|
| 정예 몬스터 5종 | 전용 모델·특수 패턴·장비 확정 드롭 |
| 타격감 | 휘두름 중 판정, 히트스톱, 시작 화면 업데이트 안내 |
| 마을 주민·NPC 3D | (1차) Quaternius 동물 → (최종) 섞어서 구성, 국왕·경비병 사람 모델 |
| 🔴 모바일에서 개선이 안 보이던 문제 ① | 실사 기기 검사 실패 기록이 **영원히** 남아 툰으로 고정 → 버전마다 재시도, 시작 화면에 모드·버전·다시 시도 버튼 |
| 🔴 아티팩트에서 변화가 전혀 없던 문제 ② | 뷰어가 `data:`를 막아 **모든 3D 모델이 아티팩트에서만 실패** → `blob:` 변환, 게시 빌드 도구·`artifact_copy` 테스트 |
| 2.5D(도트 캐릭터) 시험 | 사용자 "별로" → **폐기**(커밋 안 함), 3D 유지 |
| 캐릭터 후보 비교 | Quaternius 소형 로우폴리·Universal Base Characters → 사용자 "둘 다 별로" |
| 애니풍 플레이어 | VRoid 샘플 A·B·C + three-vrm(MToon). 동작 19종 재사용, 텍스처 축소(15→5MB) |
| 캐릭터 다양화·로딩 개선 | 애니 캐릭터 6종(+시부·시노·후미리야), 머리·옷 물들이기(`ah`·`ao`), 안 쓰는 모프 삭제로 1명당 약 3MB, 페이지 열 때 미리 받기, 시작 버튼이 준비 대기(최대 12초), 애니 주민은 준비 전엔 숨김 |
| 마을 앞 몬스터 | 스폰 금지 구역 축소, 근처에 약한 몬스터 |
| 휴대폰 끊김 최적화 | 화면 밖 생략·나무 LOD·풀 근거리·휴대폰 시야/해상도/블룸/그림자 → 마을 삼각형 281만→107만, 월드 297만→130~150만 |
| 주민 교체(섞어서) | 퍼그 콩이·소 음메(Quaternius 캐릭터 팩), 애니 나비·토리(VRoid B·C), 시바·여우 |
| 애니 캐릭터 드로우콜 | 조각 합치기로 캐릭터당 99~262 → 15~30 드로우, 마을 드로우콜 2073→1063 |
| 귀여운 2D 화면 | Ninja Adventure(CC0) 도트로 마을·월드·동굴·던전·마왕성·아레나·야생·집 안 모두 2D |
| 그래픽 스타일 선택 | 설정에서 듀랑고풍·원신풍·파스텔 툰·부드러운 3D·귀여운 2D, 선택 유지 |

---

## 5. 사용자 결정 · 취향 기록 (다시 묻지 않도록)
- **3D 유지**, 전체 화면은 기본 듀랑고풍. 원신풍을 원했던 적이 있어 **스타일 선택**으로 해결(2026-11-28)
- **캐릭터는 원신·애니풍 3D가 목표**. 2.5D 도트 캐릭터(3D 위 스프라이트)는 "별로", Quaternius 로우폴리 사람·Universal Base Characters는 "둘 다 별로"
- 단, **화면 전체 2D(귀여운 버전)는 선택지로 원함** → 구현 완료, 기본은 3D
- 주민은 **"섞어서"**(사람 2 + 두 발 동물 2 + 돌아다니는 동물)
- 별로인 쪽으로 지목된 것: 플레이어·마을 주민의 예전 모델(마네킹·블롭 동물)
- 작업 방식: **"전체 묻지 말고 계획대로 계속 진행"**, 사용량 한도 뒤 자동 이어하기(아래 예약 작업). 다만 화풍처럼 사용자 취향이 갈리는 결정은 비교 이미지로 확인받음
- 사용자는 **휴대폰 Claude 앱의 아티팩트**로 결과를 봄 → 아티팩트에서 실제로 보이는지가 기준. "로컬 테스트 통과"만으로 반영됐다고 말하지 않기

---

## 6. 에셋 · 라이선스 요약 (상세: `assets/CREDITS.txt`, `docs/ASSET_INVENTORY.md`)

| 경로 | 출처 | 라이선스 |
|---|---|---|
| `assets/human/`, `anims.glb`, `chars/`, `weapons/` | Quaternius UAL 마네킹, KayKit Adventurers | CC0 |
| `assets/nature/` (+`lod/`) | Quaternius Ultimate Stylized Nature (LOD는 meshoptimizer로 직접 생성) | CC0 |
| `assets/dinos/` | Quaternius Animated Dinosaurs | CC0 |
| `assets/monsters/` (12) | Quaternius Ultimate Monsters | CC0 |
| `assets/villagers/` | Quaternius Ultimate Monsters(동물 블롭, 지금은 대체용), Character Pack(퍼그·소), Animated Animals(시바·여우) | CC0 |
| `assets/ground/` | Poly Haven | CC0 |
| `assets/2d/` | Ninja Adventure Asset Pack (Pixel-boy & AAA) | CC0 |
| `assets/vrm/` (3) | **pixiv VRoid 샘플 AvatarSample_A·B·C** | **무료·상업 이용 가능, CC0 아님.** 파일 내 VRM 정보: Everyone/commercial Allow/license Other. pixiv 원문 조건 페이지는 이 환경에서 열지 못함 — 사용자 승인 하에 진행. CC0로 재표기 금지 등 조건 준수 |
| three.js / three-vrm / Noto Sans KR | mrdoob / pixiv / Google | MIT / MIT / OFL |

에셋 대부분은 GitHub 공개 미러(경유 저장소는 문서에 기록)에서 받았어요. quaternius.com·itch.io 직접 다운로드는 Google Drive·CDN 차단으로 불가했어요.

---

## 7. 테스트 현황
- 시나리오 29개(`tests/README.md` 표 참고). 주요 신규: `save_system`, `monster_models`, `elite_monsters`, `combat_feel`, `villager_models`, `npc_models`, `render_mode`, `artifact_copy`, `near_village`, `vrm_player`, `perf_budget`, `view_2d`, `view_2d_scenes`, `style_select`
- 마지막 전체 실행: **30/30 통과**(2026-11-28, 애니 캐릭터 6종·로딩 개선까지 반영)
- `perf_budget`(휴대폰 조건·실사): 마을 약 1,063콜/107만 삼각형, 월드 약 976콜/150만 — 예산 1,300콜·150만/200만
- `player_anim`·`villager_models`·`npc_models`·`monster_models`·`elite_monsters`는 `?chars=3d` 환경 이름(T.toon3d)으로 돌지만 지금은 의미 없는 매개변수(2.5D 폐기 흔적, 정리 대상)

---

## 8. 알려진 문제 · 주의점
- **실제 휴대폰 fps 미측정**: 이 환경엔 GPU가 없어 삼각형·드로우콜로만 비교했어요
- **애니 캐릭터 로딩**: 1명당 약 5MB(아티팩트 JSON은 6~7MB). 처음엔 마네킹이 잠깐 보였다가 바뀌어요. 마을에선 플레이어+나비+토리 3명분
- **원격 플레이어**는 여전히 마네킹(애니 캐릭터 인스턴스는 한 명당 하나라서)
- **다른 월드 마을의 주민**은 콩이·음메(동물)만 나와요(애니 주민은 시작 마을 전용)
- **아티팩트에서 '파일로 저장' 버튼은 동작 안 함**(뷰어가 다운로드 권한을 안 줌). 복사·가져오기는 됨
- 2D 화면: 가구·상자 등은 이모지라 기기 글꼴에 따라 모양이 달라요. 물가 경계 타일·공격 이펙트·날씨 표현은 아직 단순
- 애니 캐릭터 옷은 샘플 그대로(현대 옷)
- 이 개발 환경의 `/tmp`·스크래치패드는 재시작 시 사라질 수 있어요. 원본 에셋 미러는 `/tmp/claude-0/assets/`(다시 받으면 됨)

---

## 9. 다음 작업 (`docs/WORK_QUEUE.md`의 미완료 항목)
2. **2D 다듬기**: 물가·길 경계 타일(autotile), 공격·피격 이펙트(Ninja Adventure SlashFx), 날씨, 휴대폰 글자·캐릭터 크기
3. 보스 2종 추가(Ultimate Monsters의 Demon·Yeti 등) + 보스 전용 패턴
4. 도깨비 정예 변종
5. 26종 캐릭터 목표 점검(플레이어 3·일반 10·정예 5·보스 3·NPC 5) — 현재 플레이어 3(애니)+커스텀, 일반 7, 정예 5, 보스 2(대왕 용·대마왕, +티라노 왕), NPC 국왕·경비병·주민 4
6. 원신풍 방향 강화(선택): 애니 캐릭터 옷을 판타지풍으로(색칠·덮개), 원격 플레이어도 애니 캐릭터로
7. 정리: 테스트 환경 이름 `toon3d`(`chars=3d`) 제거, 쓰지 않는 블롭 주민 모델(`dog/cat/bunny/chicken`) 정리 여부 결정

---

## 10. 작업 환경 메모
- 예약 작업 **"포근 마을 작업 이어하기"**(`trig_01V8RS37XRPeLKSLRV1H13ek`): 매시 14분, 이 세션에 "WORK_QUEUE 첫 미완료 항목부터 계속" 메시지를 보내요. 그만하려면 꺼야 해요
- 네트워크 허용 호스트(환경 "ryuki84"): polyhaven, poly.pizza(403), kenney.nl(브라우저 UA 필요), opengameart, itch.io, freesound, pixabay(403), quaternius.com. 에셋은 주로 GitHub 미러로 받음
- 커밋 메시지 끝에는 공동 작성자·세션 표기 줄을 붙여 왔어요
