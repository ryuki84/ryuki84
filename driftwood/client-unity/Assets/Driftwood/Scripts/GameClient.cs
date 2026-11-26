using System.Collections.Generic;
using UnityEngine;

namespace Driftwood
{
    /// <summary>
    /// 클라이언트의 중심 컴포넌트: 접속, 메시지 처리, 입력, 카메라, HUD(OnGUI).
    /// 씬 설정 없이 동작하도록 DriftwoodBootstrap 이 Play 시 자동으로 붙여 준다.
    /// </summary>
    public class GameClient : MonoBehaviour
    {
        [Header("Server")]
        public string host = "127.0.0.1";
        public int port = 7777;

        [Header("Camera")]
        public Vector3 cameraOffset = new Vector3(0f, 14f, -10f);

        enum Phase { Login, Connecting, Playing }

        Phase phase = Phase.Login;
        NetClient net;
        string playerName = "";
        string portText;
        string statusText = "";

        // 월드 상태
        readonly Dictionary<int, EntityView> entities = new Dictionary<int, EntityView>();
        int myId;
        EntityView me;
        float worldSize = 256f, speed = 5f, gatherRange = 2.5f;
        Vector3 serverPos;
        GameObject ground;

        // 입력/네트워크
        Vector2 lastSentInput;
        float pingTimer;

        // HUD
        readonly List<ItemStack> inventory = new List<ItemStack>();
        readonly List<string> log = new List<string>();
        string chatInput = "";
        bool chatFocused; // OnGUI 에서 갱신 (GUI 함수는 OnGUI 안에서만 호출 가능)
        Camera cam;

        void Awake()
        {
            Application.runInBackground = true; // 창 두 개로 테스트할 때 비활성 창도 계속 동작
            playerName = PlayerPrefs.GetString("driftwood.name", "");
            host = PlayerPrefs.GetString("driftwood.host", host);
            portText = port.ToString();
            SetupScene();
        }

        void OnDestroy() => net?.Dispose();

        void SetupScene()
        {
            cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera") { tag = "MainCamera" };
                cam = go.AddComponent<Camera>();
            }
            cam.transform.position = new Vector3(128f, 20f, 110f);
            cam.transform.rotation = Quaternion.Euler(50f, 0f, 0f);
            cam.backgroundColor = new Color(0.55f, 0.75f, 0.9f);
            cam.clearFlags = CameraClearFlags.SolidColor;

            if (Object.FindAnyObjectByType<Light>() == null)
            {
                var light = new GameObject("Sun").AddComponent<Light>();
                light.type = LightType.Directional;
                light.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
            }
        }

        // ------------------------------------------------------------------ loop

        void Update()
        {
            ProcessNetwork();
            if (phase != Phase.Playing || me == null) return;

            bool typing = chatFocused;
            Vector2 input = typing ? Vector2.zero : InputReader.Move();

            // 1) 입력이 바뀔 때만 서버에 전송 (서버가 마지막 입력으로 계속 이동시킴)
            if ((input - lastSentInput).sqrMagnitude > 0.0001f)
            {
                net.Send(new InputReq { dx = input.x, dz = input.y });
                lastSentInput = input;
            }

            // 2) 클라이언트 예측: 서버 응답을 기다리지 않고 바로 움직여 반응성 확보
            Vector3 dir = new Vector3(input.x, 0f, input.y);
            Vector3 p = me.transform.position + dir * speed * Time.deltaTime;
            p.x = Mathf.Clamp(p.x, 0.5f, worldSize - 0.5f);
            p.z = Mathf.Clamp(p.z, 0.5f, worldSize - 0.5f);

            // 3) 서버 위치와 보정: 멈춰 있으면 서버 위치로 수렴, 크게 어긋나면 당겨옴
            Vector3 error = serverPos - p;
            if (dir == Vector3.zero) p += error * (1f - Mathf.Exp(-10f * Time.deltaTime));
            else if (error.magnitude > 1.5f) p += error * 0.2f;
            me.transform.position = p;
            if (dir != Vector3.zero) me.Face(dir);

            if (!typing && InputReader.GatherPressed()) TryGather();

            pingTimer += Time.deltaTime;
            if (pingTimer > 10f) { pingTimer = 0f; net.Send(new PingReq()); } // 유휴 연결 끊김 방지
        }

        void LateUpdate()
        {
            if (me == null) return;
            Vector3 targetPos = me.transform.position + cameraOffset;
            cam.transform.position = Vector3.Lerp(cam.transform.position, targetPos, 1f - Mathf.Exp(-8f * Time.deltaTime));
            cam.transform.LookAt(me.transform.position + Vector3.up);
        }

        void TryGather()
        {
            EntityView best = null;
            float bestDist = gatherRange + 0.3f;
            foreach (var e in entities.Values)
            {
                if (!e.IsResource || e.Amount <= 0) continue;
                float d = Vector2.Distance(new Vector2(e.transform.position.x, e.transform.position.z),
                                           new Vector2(me.transform.position.x, me.transform.position.z));
                if (d < bestDist) { bestDist = d; best = e; }
            }
            if (best == null) { AddLog("<color=#ccc>근처에 채집할 자원이 없습니다.</color>"); return; }
            net.Send(new GatherReq { id = best.Id });
        }

        // ------------------------------------------------------------------ network

        void Connect()
        {
            if (!int.TryParse(portText, out port)) { statusText = "포트가 올바르지 않습니다."; return; }
            PlayerPrefs.SetString("driftwood.name", playerName);
            PlayerPrefs.SetString("driftwood.host", host);
            net?.Dispose();
            net = new NetClient();
            net.Connect(host, port);
            phase = Phase.Connecting;
            statusText = $"{host}:{port} 접속 중...";
        }

        void ProcessNetwork()
        {
            if (net == null) return;
            int budget = 1000; // 한 프레임에 너무 오래 걸리지 않도록
            while (budget-- > 0 && net.TryDequeue(out string line))
            {
                if (line == NetClient.EvConnected) { net.Send(new LoginReq { name = playerName }); continue; }
                if (line == NetClient.EvDisconnected) { OnDisconnected(); continue; }
                if (line.StartsWith(NetClient.EvErrorPrefix)) { statusText = "접속 실패: " + line.Substring(NetClient.EvErrorPrefix.Length); continue; }
                Handle(line);
            }
        }

        void Handle(string json)
        {
            string t = JsonUtility.FromJson<Header>(json).t;
            switch (t)
            {
                case "welcome": OnWelcome(JsonUtility.FromJson<WelcomeMsg>(json)); break;
                case "spawn": OnSpawn(JsonUtility.FromJson<SpawnMsg>(json)); break;
                case "despawn": OnDespawn(JsonUtility.FromJson<DespawnMsg>(json).id); break;
                case "state": OnState(JsonUtility.FromJson<StateMsg>(json)); break;
                case "node":
                    var n = JsonUtility.FromJson<NodeMsg>(json);
                    if (entities.TryGetValue(n.id, out var node)) node.SetAmount(n.amount);
                    break;
                case "inv":
                    inventory.Clear();
                    inventory.AddRange(JsonUtility.FromJson<InventoryMsg>(json).items ?? new ItemStack[0]);
                    break;
                case "chat":
                    var c = JsonUtility.FromJson<ChatMsg>(json);
                    AddLog($"<b>{Escape(c.name)}</b>: {Escape(c.text)}");
                    break;
                case "notice":
                    AddLog($"<color=#ffd966>{Escape(JsonUtility.FromJson<NoticeMsg>(json).text)}</color>");
                    break;
            }
        }

        void OnWelcome(WelcomeMsg w)
        {
            myId = w.id;
            worldSize = w.worldSize;
            speed = w.speed;
            gatherRange = w.gatherRange;
            playerName = w.name;
            serverPos = new Vector3(w.x, 0f, w.z);

            if (ground == null) ground = EntityFactory.CreateGround(worldSize);
            me = EntityFactory.Create("player", myId, w.name, isLocal: true);
            me.Interpolate = false; // 로컬 플레이어는 예측으로 직접 움직임
            me.SetTarget(w.x, w.z, snap: true);
            entities[myId] = me;
            cam.transform.position = me.transform.position + cameraOffset;

            phase = Phase.Playing;
            statusText = "";
        }

        void OnSpawn(SpawnMsg s)
        {
            if (s.id == myId) return;
            if (entities.TryGetValue(s.id, out var existing)) Destroy(existing.gameObject);
            var view = EntityFactory.Create(s.kind, s.id, s.name);
            view.SetTarget(s.x, s.z, snap: true);
            view.SetAmount(s.amount);
            entities[s.id] = view;
        }

        void OnDespawn(int id)
        {
            if (id == myId) return;
            if (entities.TryGetValue(id, out var view))
            {
                Destroy(view.gameObject);
                entities.Remove(id);
            }
        }

        void OnState(StateMsg s)
        {
            if (s.e == null) return;
            foreach (var p in s.e)
            {
                if (p.id == myId) serverPos = new Vector3(p.x, 0f, p.z);
                else if (entities.TryGetValue(p.id, out var view)) view.SetTarget(p.x, p.z);
            }
        }

        void OnDisconnected()
        {
            foreach (var e in entities.Values) if (e != null) Destroy(e.gameObject);
            entities.Clear();
            me = null;
            inventory.Clear();
            lastSentInput = Vector2.zero;
            if (phase == Phase.Playing) statusText = "서버와 연결이 끊어졌습니다.";
            chatFocused = false;
            phase = Phase.Login;
        }

        void AddLog(string line)
        {
            log.Add(line);
            if (log.Count > 8) log.RemoveAt(0);
        }

        static string Escape(string s) => (s ?? "").Replace("<", "‹").Replace(">", "›"); // rich text 주입 방지

        // ------------------------------------------------------------------ HUD

        void OnGUI()
        {
            GUI.skin.label.richText = true;
            if (phase != Phase.Playing) { DrawLogin(); return; }

            // Enter: 채팅창 포커스 ↔ 전송 (TextField 가 이벤트를 먹기 전에 먼저 처리)
            chatFocused = GUI.GetNameOfFocusedControl() == "chat";
            var ev = Event.current;
            if (ev.type == EventType.KeyDown && (ev.keyCode == KeyCode.Return || ev.keyCode == KeyCode.KeypadEnter))
            {
                if (chatFocused)
                {
                    if (chatInput.Trim().Length > 0) net.Send(new ChatReq { text = chatInput });
                    chatInput = "";
                    GUI.FocusControl(null);
                }
                else GUI.FocusControl("chat");
                ev.Use();
            }

            DrawNameLabels();

            // 인벤토리
            GUILayout.BeginArea(new Rect(10, 10, 220, 200), GUI.skin.box);
            GUILayout.Label($"<b>{Escape(playerName)}</b>  ({me.transform.position.x:0}, {me.transform.position.z:0})");
            GUILayout.Label("<b>가방</b>");
            if (inventory.Count == 0) GUILayout.Label("<color=#aaa>(비어 있음)</color>");
            foreach (var it in inventory) GUILayout.Label($"{ItemName(it.item)} × {it.count}");
            GUILayout.EndArea();

            GUI.Label(new Rect(Screen.width - 260, 10, 250, 60), "WASD: 이동   E: 채집\nEnter: 채팅");

            // 로그 + 채팅
            float h = 200;
            GUILayout.BeginArea(new Rect(10, Screen.height - h - 10, 420, h), GUI.skin.box);
            GUILayout.FlexibleSpace();
            foreach (var l in log) GUILayout.Label(l);
            GUI.SetNextControlName("chat");
            chatInput = GUILayout.TextField(chatInput, 200);
            GUILayout.EndArea();

        }

        void DrawLogin()
        {
            var r = new Rect(Screen.width / 2f - 160, Screen.height / 2f - 110, 320, 220);
            GUILayout.BeginArea(r, GUI.skin.box);
            GUILayout.Label("<size=20><b>Driftwood</b></size>  <color=#aaa>prototype</color>");
            GUILayout.Label("서버 주소");
            host = GUILayout.TextField(host);
            GUILayout.Label("포트");
            portText = GUILayout.TextField(portText);
            GUILayout.Label("이름");
            playerName = GUILayout.TextField(playerName, 16);
            GUI.enabled = phase == Phase.Login;
            if (GUILayout.Button(phase == Phase.Connecting ? "접속 중..." : "섬으로 출발")) Connect();
            GUI.enabled = true;
            if (!string.IsNullOrEmpty(statusText)) GUILayout.Label(statusText);
            GUILayout.EndArea();
        }

        void DrawNameLabels()
        {
            foreach (var e in entities.Values)
            {
                if (!e.IsPlayer) continue;
                Vector3 sp = cam.WorldToScreenPoint(e.transform.position + Vector3.up * 2.4f);
                if (sp.z < 0) continue;
                var rect = new Rect(sp.x - 60, Screen.height - sp.y - 10, 120, 20);
                var style = new GUIStyle(GUI.skin.label) { alignment = TextAnchor.MiddleCenter };
                GUI.Label(rect, Escape(e.DisplayName), style);
            }
        }

        static string ItemName(string id)
        {
            switch (id)
            {
                case "wood": return "나무";
                case "stone": return "돌";
                case "berry": return "열매";
                default: return id;
            }
        }
    }

    static class DriftwoodBootstrap
    {
        // 씬에 GameClient 가 없으면 Play 시 자동 생성 → 빈 씬에서도 바로 실행 가능
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Init()
        {
            if (Object.FindAnyObjectByType<GameClient>() != null) return;
            new GameObject("Driftwood").AddComponent<GameClient>();
        }
    }
}
