# 포근 마을 샌드박스 (pokgeun-sandbox)

귀여운 판타지 세계에서 **자원을 모으고, 제작하고, 건설하며** 자신만의 터전을 넓혀 가는 생활형 샌드박스 생존·제작 RPG.
설계 기준: [`docs/GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md) (GDD v2.0)

기존 게임 [`../pokgeun-maeul`](../pokgeun-maeul)(전투·RPG 중심)의 코드와 에셋을 복사해 시작한 **별도 게임**이에요.
기존 게임은 그대로 두고, 이 폴더에서만 새 방향으로 개발해요. 저장 키도 따로 써서(`pokgeun-sandbox`) 기존 게임 저장과 섞이지 않아요.

## 실행 · 테스트

```bash
cd pokgeun-sandbox
npm install
npm run build          # src/ → index.html 합치기 (편집 후 꼭 실행)
npm test               # 빌드 최신 여부 확인 후 Playwright 시나리오 실행
npm test -- save_system
npm run build:artifact # 아티팩트 게시용 사본 → dist/artifact/
```

## 코드 구조

게임 코드는 하나의 ES 모듈(최상위 `await` 사용)이라 실행 중에 여러 파일로 나눌 수 없어요.
그래서 **편집은 `src/`에서** 하고, `npm run build`가 파일 이름 번호 순서대로 이어 붙여 `index.html`을 만들어요.
`index.html`은 생성 파일이지만 정적 서버로 바로 열 수 있도록 커밋해 둬요(직접 고치지 마세요).

| 경로 | 내용 |
|---|---|
| `src/shell.html` | HTML 뼈대·UI 요소 (`@@CSS@@`, `@@JS@@` 자리에 합쳐짐) |
| `src/style.css` | 화면 스타일 |
| `src/js/00-boot.js` | three.js 불러오기, 아티팩트용 `data:`→`blob:` 보정(⚠️ 지우지 않기), 렌더 스타일 |
| `src/js/01~09` | 데이터, 유틸·마을 맵, 저장, UI·상점, 행동, 장비·제작, 던전·야생, 입력, 업데이트 |
| `src/js/10~18` | 3D 렌더 기반, 지형, 캐릭터(VRM 등), 카메라, 생물 모델, 소품, 날씨, 장면별 3D, 2D 화면 |
| `src/js/19~22` | 오픈월드 생성, 청크, 월드 게임플레이·멀티, 퀘스트·패널 |
| `src/js/23~28` | 왕국·대마왕, 아레나, 효과음, 메인 루프, 메뉴 독, 드래그 앤 드롭·테스트용 `window.__game` |

새 시스템(아이템·건축·생존 등)은 GDD 17.3의 경계에 맞춰 새 번호 파일로 추가해요.
