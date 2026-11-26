using System;

// 서버(Java)의 protocol/Messages.java 와 필드 이름을 1:1로 맞춘다.
// JsonUtility 는 public 필드만 직렬화하므로 프로퍼티가 아닌 필드를 쓴다.
namespace Driftwood
{
    [Serializable] public class Header { public string t; }

    // ---------- 서버 → 클라이언트 ----------
    [Serializable] public class WelcomeMsg
    {
        public int id; public string name; public float x, z;
        public float worldSize; public int chunkSize, viewRadius; public float speed, gatherRange;
    }
    [Serializable] public class SpawnMsg { public int id; public string kind; public string name; public float x, z; public int amount; }
    [Serializable] public class DespawnMsg { public int id; }
    [Serializable] public class PosEntry { public int id; public float x, z; }
    [Serializable] public class StateMsg { public PosEntry[] e; }
    [Serializable] public class NodeMsg { public int id; public int amount; }
    [Serializable] public class ItemStack { public string item; public int count; }
    [Serializable] public class InventoryMsg { public ItemStack[] items; }
    [Serializable] public class ChatMsg { public string name, text; }
    [Serializable] public class NoticeMsg { public string text; }

    // ---------- 클라이언트 → 서버 ----------
    [Serializable] public class LoginReq { public string t = "login"; public string name; }
    [Serializable] public class InputReq { public string t = "input"; public float dx, dz; }
    [Serializable] public class GatherReq { public string t = "gather"; public int id; }
    [Serializable] public class ChatReq { public string t = "chat"; public string text; }
    [Serializable] public class PingReq { public string t = "ping"; }
}
