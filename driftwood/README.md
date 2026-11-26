# Driftwood (가칭) — 샌드박스 MMORPG 프로토타입

표류한 사람들이 이름 없는 섬에서 채집하고, 만들고, 정착해 가는 **자유도 높은 오픈월드 MMORPG**를 목표로 하는 프로젝트입니다.
지금은 **1단계 프로토타입**입니다. 여러 명이 같은 섬에 접속해 서로를 보며 돌아다니고, 나무·돌·열매를 채집할 수 있습니다.

```
driftwood/
├── server/          Java 21 + Netty 권위 서버 (Gradle)
└── client-unity/    Unity 클라이언트 스크립트 (C#)
```

## 실행 방법

### 1. 서버
```bash
cd driftwood/server
./gradlew run            # Windows: gradlew.bat run
# 포트/시드 변경: ./gradlew run --args="7777 12345"
```
`Driftwood server listening on port 7777` 이 나오면 준비 완료입니다. 테스트는 `./gradlew test` 로 돌립니다.

### 2. Unity 클라이언트 (Unity 2022.3 LTS 이상, Unity 6 권장)
1. Unity Hub → **New project** → **3D (Built-in)** 또는 **Universal 3D** 템플릿으로 새 프로젝트를 만듭니다.
2. 이 저장소의 `client-unity/Assets/Driftwood` 폴더를 새 프로젝트의 `Assets/` 안에 복사합니다.
3. 아무 씬(기본 SampleScene)에서 **Play** 를 누릅니다. 씬 설정은 필요 없습니다.
   `GameClient` 가 자동으로 생성되어 카메라, 조명, 지형을 만듭니다.
4. 로그인 창에서 이름을 입력하고 **섬으로 출발** 을 누릅니다.

**조작:** `WASD`/방향키로 이동, `E` 로 가까운 자원 채집, `Enter` 로 채팅을 엽니다.

**혼자 멀티플레이 테스트하기:** `File → Build And Run` 으로 실행 파일을 하나 띄우고, 에디터에서도 Play 를 눌러 두 캐릭터로 접속합니다.
다른 PC에서 접속하려면 로그인 창의 서버 주소에 서버 PC의 IP를 넣으세요(방화벽에서 7777/TCP 허용).

> 새 Input System과 기존 Input Manager 모두 지원합니다(`InputReader.cs`).

## 아키텍처

```
 Unity 클라이언트                              Java 서버
┌──────────────────┐   TCP, 줄 단위 JSON   ┌──────────────────────────────────┐
│ InputReader      │ ── input / gather ──▶ │ Netty I/O 스레드 (ClientHandler)  │
│ GameClient       │                       │        │ enqueue (락 없음)         │
│  - 클라 예측 이동 │                       │        ▼                          │
│  - 서버 위치 보정 │ ◀─ spawn/state/... ── │ 게임 루프 스레드 (World, 20틱/초) │
│ EntityView(보간) │                       │  - 이동·채집 판정 (권위 서버)      │
└──────────────────┘                       │  - 청크 기반 시야(AOI) 관리        │
                                           │  - 시드 기반 절차적 월드 생성      │
                                           └──────────────────────────────────┘
```

- **권위 서버(authoritative server):** 클라이언트는 위치가 아니라 *입력 방향*만 보냅니다. 위치, 채집 거리, 쿨다운은 모두 서버가 판정하므로 스피드핵이나 원격 채집이 막힙니다.
- **단일 스레드 게임 로직:** 네트워크 스레드는 이벤트를 큐에 넣기만 하고, 게임 상태는 게임 루프 스레드 하나만 변경합니다. 그래서 락이 없고 버그가 적습니다.
- **청크 + 관심 영역(AOI):** 256×256 월드를 16×16 청크로 나눕니다. 각 플레이어는 주변 5×5 청크(80×80) 안의 엔티티만 받습니다. 월드가 커져도 클라이언트 트래픽은 일정합니다.
- **클라이언트 예측 + 보간:** 내 캐릭터는 즉시 움직이고 서버 위치로 부드럽게 보정합니다. 다른 플레이어는 서버 위치로 보간합니다.
- **절차적 생성:** 같은 시드면 같은 섬이 나옵니다. 숲 밀도와 암석 밀도 노이즈로 지역마다 특색이 생깁니다.

## 프로토콜

UTF-8 TCP, 한 줄에 JSON 하나이며 `t` 필드로 타입을 구분합니다. 서버 `protocol/Messages.java` 와 클라이언트 `Protocol.cs` 의 필드 이름이 같아야 합니다.

| 방향 | t | 필드 | 설명 |
|---|---|---|---|
| C→S | `login` | `name` | 접속 후 첫 메시지 |
| C→S | `input` | `dx, dz` | 이동 방향(-1~1). 바뀔 때만 전송 |
| C→S | `gather` | `id` | 자원 노드 채집 요청 |
| C→S | `chat` | `text` | 채팅 |
| C→S | `ping` | | 10초마다 전송(2분 무응답 시 서버가 끊음) |
| S→C | `welcome` | `id, name, x, z, worldSize, chunkSize, viewRadius, speed, gatherRange` | 로그인 성공 |
| S→C | `spawn` | `id, kind, name?, x, z, amount` | 시야에 들어옴 (`player`/`tree`/`rock`/`bush`) |
| S→C | `despawn` | `id` | 시야에서 나감 |
| S→C | `state` | `e: [{id, x, z}]` | 틱마다 움직인 플레이어 위치 |
| S→C | `node` | `id, amount` | 자원 잔량 변경(0 = 고갈, 30초 후 리스폰) |
| S→C | `inv` | `items: [{item, count}]` | 인벤토리 |
| S→C | `chat` / `notice` | `name, text` / `text` | 채팅 / 시스템 메시지 |

JSON은 디버깅이 쉬워서 프로토타입에 적합합니다. 동시 접속자가 늘면 Protobuf 바이너리로 바꾸는 것을 권장합니다(메시지 구조는 그대로 유지).

## 로드맵

- [x] **1단계:** 접속, 이동 동기화, 청크 시야, 절차적 월드, 채집, 인벤토리, 채팅
- [ ] **2단계 (제작):** 레시피 데이터(JSON) → 돌도끼, 모닥불 등 제작. 도구에 따라 채집량 변화
- [ ] **3단계 (건축·영지):** 설치형 오브젝트(벽, 바닥, 상자), 토지 소유권, PostgreSQL 저장
- [ ] **4단계 (생존·사냥):** 배고픔/체온, 동물 AI(서버 측 상태머신), 전투
- [ ] **5단계 (사회·경제):** 플레이어 거래, 부족(길드), 공동 건축
- [ ] **6단계 (섬 순환):** 여러 섬 인스턴스, 섬 생성·소멸 주기, 섬 간 이동(서버 샤딩)
- [ ] 인프라: 계정 인증(Spring Boot API), Redis 세션, Protobuf 전환, 부하 테스트 봇

## 주요 파일

| 파일 | 역할 |
|---|---|
| `server/.../GameServer.java` | Netty 부트스트랩, 게임 루프 스케줄링 |
| `server/.../game/World.java` | 월드 시뮬레이션의 핵심(이동, 채집, 시야, 리스폰) |
| `server/.../game/WorldGenerator.java` | 시드 기반 자원 배치 |
| `server/.../ServerIntegrationTest.java` | 실제 TCP 클라이언트로 접속, 이동, 채집, 거리 검증 |
| `client-unity/.../GameClient.cs` | 접속, 메시지 처리, 예측 이동, 카메라, HUD |
| `client-unity/.../NetClient.cs` | 백그라운드 수신 스레드 + 메인 스레드 큐 |
| `client-unity/.../EntityFactory.cs` | 기본 도형으로 만든 임시 그래픽(나중에 프리팹으로 교체) |
