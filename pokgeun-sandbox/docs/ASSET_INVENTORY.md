# 에셋 목록과 라이선스 확인 현황 (ASSET_INVENTORY)

- 작성일: 2026-11-27
- 상태 표시: **확인됨**(원본 라이선스 문서·공식 페이지 확인), **일부 확인**(2차 배포처만 확인), **미확인**

## 1. 게임에 들어가 있는 에셋

| 경로 | 내용 | 원저작자 / 출처 | 라이선스 | 확인 상태 | 비고 |
|---|---|---|---|---|---|
| `assets/chars/*.glb` (5), `assets/anims.glb`, `assets/weapons/*.glb` (12) | 기사·바바리안·마법사·도적 캐릭터, 애니메이션 22종, 검·도끼·방패 등 | KayKit Adventurers 1.0 — Kay Lousberg / github.com/KayKit-Game-Assets | CC0 1.0 | 확인됨 (원본 저장소 LICENSE.txt) | 지금은 무기·방패만 실제로 써요. 캐릭터는 마네킹을 못 불러올 때의 대체용이에요. 저장소에 라이선스 원문이 없어요. |
| `assets/nature/*.glb` (27), `assets/nature/tex/*.webp` (13) | 나무·덤불·바위·풀·꽃 | Quaternius Ultimate Stylized Nature / github.com/walterpalladino/godot-quaternius-ultimate-stylized-nature | 원작 CC0. 변환 저장소는 MIT | 일부 확인 | 원작 CC0는 Quaternius 공식 페이지 기준이에요. FBX → glb 변환은 직접 했어요. |
| `assets/dinos/*.glb` (4) | 티라노·랩터·트리케라톱스·파라사우롤로푸스 | Quaternius Ultimate Animated Dinosaurs / poly.pizza 배포본, github.com/scarbone98/deep-time 경유 | CC0 1.0 | 일부 확인 | 경유 저장소의 문서에 CC0로 적혀 있어요. 원 배포처(poly.pizza)는 직접 확인하지 못했어요(봇 차단으로 403). |
| `assets/monsters/*.glb` (12) | 슬라임·말벌·버섯돌이·유령·오크·도깨비·대왕 용 + 정예 5종(가시 슬라임·장수말벌·버섯 대장·해골 유령·해골 오크). 대기·걷기·달리기·공격·피격·죽음 동작 | Quaternius Ultimate Monsters / github.com/mlflabs/brain (`assets/Ultimate Monsters`) 경유 | CC0 1.0 | 일부 확인 | quaternius.com 공식 페이지에 CC0로 표시돼 있어요. 경유 저장소의 License.txt 머리말은 다른 팩 이름으로 잘못 적혀 있어요. 작업 C에서 7종(1.7MB), 정예 작업에서 5종(1.2MB) 추가. |
| `assets/pets/animal-*.glb` (6), `assets/pets/Textures/colormap.png` | 마을 동물: 강아지·고양이·소·돼지·병아리·토끼 (대기·걷기·달리기·먹기 등) | Kenney Cube Pets 1.0 / kenney.nl 직접 | CC0 1.0 | 확인됨 (`assets/pets/License.txt`) |
| `assets/2d/**/*.png` (41) | 귀여운 2D 화면: 타일셋 5종(바닥·자연·건물·물·사막), 캐릭터 9·몬스터 20·동물 5, 그림자 | Ninja Adventure Asset Pack — Pixel-boy & AAA / github.com/wojciech-bilicki/Zelda 경유 | CC0 1.0 | 확인됨 (itch.io 공식 페이지 CC0) | 약 0.37MB. 설정에서 2D를 고를 때만 불러와요. |
| `assets/ground/*.webp` (24) | 지형 6종과 디테일 질감 6종(색·노멀) | Poly Haven (polyhaven.com) | CC0 1.0 | 확인됨 (Poly Haven API 직접 다운로드) | |
| 폰트 Noto Sans KR | UI 글꼴 | Google Fonts | SIL OFL 1.1 | 확인됨 (공개 라이선스) | CDN으로 불러와요. CREDITS에 기록했어요(작업 C). |
| three.js r187 + addons | 3D 엔진 | mrdoob/three.js (jsDelivr CDN) | MIT | 확인됨 | CREDITS에 기록했어요(작업 C). |
| 효과음·비·천둥 | 모두 코드로 합성(WebAudio) | 직접 제작 | — | 확인됨 | 외부 오디오 파일이 없어요. |

## 2. 확보했지만 아직 쓰지 않은 후보 (작업 환경 임시 폴더, 저장소 미반영)

| 후보 | 내용 | 출처 | 라이선스 | 확인 상태 |
|---|---|---|---|---|
| Quaternius Ultimate Monsters (나머지) | 약 50종 중 12종은 게임에 넣었어요(위 표). 나머지는 보스·NPC 후보예요.: Big·Blob·Flying. 대부분 Idle·Walk·Run·Attack(Punch/Bite/Headbutt/Weapon)·HitReact·Death 포함 | github.com/mlflabs/brain (`assets/Ultimate Monsters`) | CC0 1.0 | 일부 확인 — quaternius.com 공식 페이지에 CC0 링크가 있어요. 다만 경유 저장소의 License.txt 머리말이 다른 팩("Ultimate Platformer Pack")으로 잘못 적혀 있어요. |
| Quaternius Ultimate Animated Character (Knight_Male) | 옷 입은 사람 캐릭터 1종 | github.com/kxpedro/vp-game | CC0 1.0 | 일부 확인 (SOURCE.md) |
| KayKit Skeletons 1.0 | 해골 전사·마법사·도적·하수인 + 애니메이션 95종 | github.com/KayKit-Game-Assets | CC0 1.0 | 확인됨 |

## 3. 외부 사이트 접근 현황 (이 개발 환경 기준)

| 사이트 | 결과 |
|---|---|
| polyhaven.com (api·dl) | 접근 가능 |
| quaternius.com | 페이지는 열려요. 실제 다운로드는 Google 드라이브라 막혀 있어요 |
| opengameart.org, freesound.org | 접근 가능. Freesound 다운로드에는 API 키가 필요해요 |
| kenney.nl | 브라우저처럼 접속하면 페이지는 열려요. 직접 다운로드 링크는 아직 못 찾았어요 |
| poly.pizza, pixabay.com | 사이트가 자동 접속을 막아 403 |
| github.com (공개 저장소 clone) | 가능. 여러 CC0 에셋을 이 경로로 받았어요 |

## 4. 개선 제안

- 저장소 `assets/licenses/`에 각 팩의 원문 라이선스를 넣고, CREDITS에 폰트와 three.js를 추가해요.
- 2차 배포처를 경유한 에셋(공룡, 자연물, 몬스터 후보)은 가능하면 원본 배포처에서 다시 확인해요.
- 에셋을 추가할 때마다 이 표에 한 줄씩 기록해요.


> 2026-11-28 샌드박스: 사람 캐릭터는 KayKit Adventurers 부위 조합(src/js/12-chibi.js)으로 바꾸고 VRoid 샘플·마네킹·예전 주민 모델 파일은 지웠어요.
