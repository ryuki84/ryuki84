package com.driftwood.server.protocol;

import java.util.List;

/**
 * 서버 → 클라이언트 메시지. 한 줄에 JSON 하나(개행 구분)로 전송되며,
 * 모든 메시지는 타입 구분용 필드 "t"를 가진다.
 * Unity 쪽 Protocol.cs 의 필드 이름과 1:1로 맞춰야 한다.
 */
public final class Messages {
    private Messages() {}

    public record Welcome(String t, int id, String name, float x, float z,
                          float worldSize, int chunkSize, int viewRadius, float speed, float gatherRange) {
        public Welcome(int id, String name, float x, float z, float worldSize, int chunkSize,
                       int viewRadius, float speed, float gatherRange) {
            this("welcome", id, name, x, z, worldSize, chunkSize, viewRadius, speed, gatherRange);
        }
    }

    /** 엔티티가 시야에 들어옴. kind = player | tree | rock | bush */
    public record Spawn(String t, int id, String kind, String name, float x, float z, int amount) {
        public Spawn(int id, String kind, String name, float x, float z, int amount) {
            this("spawn", id, kind, name, x, z, amount);
        }
    }

    public record Despawn(String t, int id) {
        public Despawn(int id) { this("despawn", id); }
    }

    public record Pos(int id, float x, float z) {}

    /** 틱마다 시야 안에서 움직인 플레이어들의 위치. */
    public record State(String t, List<Pos> e) {
        public State(List<Pos> e) { this("state", e); }
    }

    /** 자원 노드의 남은 양 변경(0이면 고갈). */
    public record NodeUpdate(String t, int id, int amount) {
        public NodeUpdate(int id, int amount) { this("node", id, amount); }
    }

    public record ItemStack(String item, int count) {}

    public record Inventory(String t, List<ItemStack> items) {
        public Inventory(List<ItemStack> items) { this("inv", items); }
    }

    public record Chat(String t, String name, String text) {
        public Chat(String name, String text) { this("chat", name, text); }
    }

    public record Notice(String t, String text) {
        public Notice(String text) { this("notice", text); }
    }
}
