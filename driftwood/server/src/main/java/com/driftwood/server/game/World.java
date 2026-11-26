package com.driftwood.server.game;

import com.driftwood.server.net.Session;
import com.driftwood.server.protocol.Messages.*;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * 권위 서버(authoritative server)의 월드 시뮬레이션.
 *
 * - 모든 게임 상태는 이 클래스가 소유하고, 게임 루프 스레드 하나에서만 변경된다.
 * - 네트워크 스레드는 enqueue() 로 이벤트를 넣기만 한다(락 불필요).
 * - 월드는 CHUNK_SIZE 단위 청크로 나뉘며, 각 플레이어는 주변 VIEW_RADIUS 청크 안의
 *   엔티티만 받는다(관심 영역, Area of Interest).
 */
public final class World {
    private static final Logger LOG = Logger.getLogger(World.class.getName());

    public static final float WORLD_SIZE = 256f;
    public static final int CHUNK_SIZE = 16;
    public static final int CHUNKS = (int) (WORLD_SIZE / CHUNK_SIZE);
    public static final int VIEW_RADIUS = 2;            // 5x5 청크 = 80x80 유닛이 보임
    public static final int TICK_RATE = 20;
    public static final float PLAYER_SPEED = 5f;
    public static final float GATHER_RANGE = 2.5f;
    static final long GATHER_COOLDOWN_MS = 400;
    static final long RESPAWN_MS = 30_000;
    static final int MAX_NAME_LENGTH = 16;
    static final int MAX_CHAT_LENGTH = 200;

    // ---- 네트워크 스레드 → 게임 루프 이벤트 ----
    public sealed interface Event permits Connected, Received, Disconnected {}
    public record Connected(Session session) implements Event {}
    public record Received(Session session, JsonNode msg) implements Event {}
    public record Disconnected(Session session) implements Event {}

    private static final class Chunk {
        final Set<Player> players = new HashSet<>();
        final List<ResourceNode> nodes = new ArrayList<>();
    }

    private final Queue<Event> inbox = new ConcurrentLinkedQueue<>();
    private final Set<Session> sessions = new HashSet<>();
    private final Map<Integer, Player> players = new HashMap<>();
    private final Map<Integer, ResourceNode> nodes = new HashMap<>();
    private final List<ResourceNode> depleted = new ArrayList<>();
    private final Chunk[] chunks = new Chunk[CHUNKS * CHUNKS];
    private final Random random;
    private int nextId = 1;

    public World(long seed) {
        this.random = new Random(seed ^ 0x5DEECE66DL);
        for (int i = 0; i < chunks.length; i++) chunks[i] = new Chunk();
        for (ResourceNode n : new WorldGenerator(seed).generate(WORLD_SIZE, () -> nextId++)) {
            nodes.put(n.id, n);
            chunks[chunkIndexOf(n.x, n.z)].nodes.add(n);
        }
        LOG.info(() -> "World generated: " + nodes.size() + " resource nodes (seed " + seed + ")");
    }

    public void enqueue(Event e) { inbox.add(e); }

    public int playerCount() { return players.size(); }

    public int nodeCount() { return nodes.size(); }

    /** 게임 루프에서 호출. 예외가 루프를 죽이지 않도록 잡는다. */
    public void tickSafely() {
        try {
            tick(System.currentTimeMillis());
        } catch (Throwable t) {
            LOG.log(Level.SEVERE, "tick failed", t);
        }
    }

    void tick(long now) {
        Event e;
        while ((e = inbox.poll()) != null) handle(e, now);

        float dt = 1f / TICK_RATE;
        for (Player p : players.values()) {
            if (p.dx == 0 && p.dz == 0) continue;
            p.x = clamp(p.x + p.dx * PLAYER_SPEED * dt, 0.5f, WORLD_SIZE - 0.5f);
            p.z = clamp(p.z + p.dz * PLAYER_SPEED * dt, 0.5f, WORLD_SIZE - 0.5f);
            p.moved = true;
            updateChunk(p);
        }

        respawnNodes(now);

        for (Player p : players.values()) updateVisibility(p);
        broadcastPositions();

        for (Player p : players.values()) p.moved = false;
        for (Session s : sessions) s.flush();
    }

    // ------------------------------------------------------------------ events

    private void handle(Event e, long now) {
        switch (e) {
            case Connected c -> sessions.add(c.session());
            case Disconnected d -> {
                sessions.remove(d.session());
                Player p = d.session().player();
                if (p != null) removePlayer(p);
            }
            case Received r -> handleMessage(r.session(), r.msg(), now);
        }
    }

    private void handleMessage(Session s, JsonNode msg, long now) {
        String type = msg.path("t").asText();
        Player p = s.player();
        if (p == null) {
            if (type.equals("login")) login(s, msg.path("name").asText(""));
            return;
        }
        switch (type) {
            case "input" -> setInput(p, (float) msg.path("dx").asDouble(), (float) msg.path("dz").asDouble());
            case "gather" -> gather(p, msg.path("id").asInt(-1), now);
            case "chat" -> chat(p, msg.path("text").asText(""));
            default -> { /* 알 수 없는 메시지 무시 */ }
        }
    }

    private void login(Session s, String requestedName) {
        int id = nextId++;
        String name = requestedName.strip();
        if (name.isEmpty()) name = "표류자" + id;
        if (name.length() > MAX_NAME_LENGTH) name = name.substring(0, MAX_NAME_LENGTH);

        float angle = random.nextFloat() * (float) (Math.PI * 2);
        float r = random.nextFloat() * 3f;
        float c = WORLD_SIZE / 2f;
        Player p = new Player(id, name, s, c + (float) Math.cos(angle) * r, c + (float) Math.sin(angle) * r);
        s.attach(p);
        players.put(id, p);
        updateChunk(p);

        s.send(new Welcome(id, name, round(p.x), round(p.z), WORLD_SIZE, CHUNK_SIZE, VIEW_RADIUS, PLAYER_SPEED, GATHER_RANGE));
        sendInventory(p);
        s.send(new Notice("섬에 도착했습니다. WASD로 이동, E로 채집하세요."));
        broadcast(new Notice(name + " 님이 섬에 들어왔습니다."), p);
        LOG.info(() -> "login: " + p.name + " (#" + p.id + "), online=" + players.size());
    }

    private void removePlayer(Player p) {
        players.remove(p.id);
        if (p.chunkIndex >= 0) chunks[p.chunkIndex].players.remove(p);
        Despawn despawn = new Despawn(p.id);
        for (Player other : players.values()) {
            if (other.knownPlayers.remove(p.id)) other.session.send(despawn);
        }
        broadcast(new Notice(p.name + " 님이 떠났습니다."), null);
        LOG.info(() -> "logout: " + p.name + " (#" + p.id + "), online=" + players.size());
    }

    private void setInput(Player p, float dx, float dz) {
        if (!Float.isFinite(dx) || !Float.isFinite(dz)) return;
        float len = (float) Math.hypot(dx, dz);
        if (len > 1f) { dx /= len; dz /= len; }   // 클라이언트가 속도를 부풀려도 최대 1
        p.dx = dx;
        p.dz = dz;
    }

    private void gather(Player p, int nodeId, long now) {
        ResourceNode n = nodes.get(nodeId);
        if (n == null || !p.knownNodes.contains(nodeId)) return;
        if (now - p.lastGatherAt < GATHER_COOLDOWN_MS) return;
        if (n.amount <= 0) {
            p.session.send(new Notice("이미 고갈된 자원입니다."));
            return;
        }
        if (Math.hypot(n.x - p.x, n.z - p.z) > GATHER_RANGE + 0.5f) { // 0.5 = 지연 보정 여유
            p.session.send(new Notice("너무 멀어요."));
            return;
        }
        p.lastGatherAt = now;
        n.amount--;
        if (n.amount == 0) {
            n.respawnAt = now + RESPAWN_MS;
            depleted.add(n);
        }
        p.inventory.merge(n.type.item, 1, Integer::sum);
        sendInventory(p);
        broadcastNode(n);
    }

    private void chat(Player p, String text) {
        text = text.strip();
        if (text.isEmpty()) return;
        if (text.length() > MAX_CHAT_LENGTH) text = text.substring(0, MAX_CHAT_LENGTH);
        broadcast(new Chat(p.name, text), null);
    }

    // ------------------------------------------------------------------ simulation

    private void respawnNodes(long now) {
        if (depleted.isEmpty()) return;
        Iterator<ResourceNode> it = depleted.iterator();
        while (it.hasNext()) {
            ResourceNode n = it.next();
            if (now >= n.respawnAt) {
                n.amount = n.type.maxAmount;
                it.remove();
                broadcastNode(n);
            }
        }
    }

    private void updateChunk(Player p) {
        int idx = chunkIndexOf(p.x, p.z);
        if (idx == p.chunkIndex) return;
        if (p.chunkIndex >= 0) chunks[p.chunkIndex].players.remove(p);
        chunks[idx].players.add(p);
        p.chunkIndex = idx;
    }

    /** 플레이어 주변 청크 기준으로 spawn/despawn 을 보낸다. */
    private void updateVisibility(Player p) {
        int cx = p.chunkIndex % CHUNKS, cz = p.chunkIndex / CHUNKS;

        // 다른 플레이어: 매 틱 계산 (움직이니까)
        Set<Integer> visiblePlayers = new HashSet<>();
        forEachChunkAround(cx, cz, chunk -> {
            for (Player o : chunk.players) {
                if (o == p) continue;
                visiblePlayers.add(o.id);
                if (p.knownPlayers.add(o.id)) {
                    p.session.send(new Spawn(o.id, "player", o.name, round(o.x), round(o.z), 0));
                }
            }
        });
        for (Iterator<Integer> it = p.knownPlayers.iterator(); it.hasNext(); ) {
            int id = it.next();
            if (!visiblePlayers.contains(id)) {
                it.remove();
                p.session.send(new Despawn(id));
            }
        }

        // 자원 노드: 고정 위치라서 플레이어의 청크가 바뀔 때만 계산
        if (p.nodeViewChunk == p.chunkIndex) return;
        p.nodeViewChunk = p.chunkIndex;
        Set<Integer> visibleNodes = new HashSet<>();
        forEachChunkAround(cx, cz, chunk -> {
            for (ResourceNode n : chunk.nodes) {
                visibleNodes.add(n.id);
                if (p.knownNodes.add(n.id)) {
                    p.session.send(new Spawn(n.id, n.type.kind, null, round(n.x), round(n.z), n.amount));
                }
            }
        });
        for (Iterator<Integer> it = p.knownNodes.iterator(); it.hasNext(); ) {
            int id = it.next();
            if (!visibleNodes.contains(id)) {
                it.remove();
                p.session.send(new Despawn(id));
            }
        }
    }

    private void broadcastPositions() {
        for (Player p : players.values()) {
            List<Pos> moved = new ArrayList<>();
            if (p.moved) moved.add(new Pos(p.id, round(p.x), round(p.z))); // 본인 위치(클라 예측 보정용)
            for (int id : p.knownPlayers) {
                Player o = players.get(id);
                if (o != null && o.moved) moved.add(new Pos(o.id, round(o.x), round(o.z)));
            }
            if (!moved.isEmpty()) p.session.send(new State(moved));
        }
    }

    private void broadcastNode(ResourceNode n) {
        NodeUpdate msg = new NodeUpdate(n.id, n.amount);
        int cx = (int) (n.x / CHUNK_SIZE), cz = (int) (n.z / CHUNK_SIZE);
        forEachChunkAround(cx, cz, chunk -> {
            for (Player p : chunk.players) {
                if (p.knownNodes.contains(n.id)) p.session.send(msg);
            }
        });
    }

    private void sendInventory(Player p) {
        List<ItemStack> items = new ArrayList<>();
        p.inventory.forEach((item, count) -> items.add(new ItemStack(item, count)));
        p.session.send(new Inventory(items));
    }

    private void broadcast(Object msg, Player except) {
        for (Player p : players.values()) if (p != except) p.session.send(msg);
    }

    // ------------------------------------------------------------------ helpers

    private void forEachChunkAround(int cx, int cz, java.util.function.Consumer<Chunk> action) {
        for (int z = Math.max(0, cz - VIEW_RADIUS); z <= Math.min(CHUNKS - 1, cz + VIEW_RADIUS); z++) {
            for (int x = Math.max(0, cx - VIEW_RADIUS); x <= Math.min(CHUNKS - 1, cx + VIEW_RADIUS); x++) {
                action.accept(chunks[z * CHUNKS + x]);
            }
        }
    }

    static int chunkIndexOf(float x, float z) {
        int cx = Math.min(CHUNKS - 1, Math.max(0, (int) (x / CHUNK_SIZE)));
        int cz = Math.min(CHUNKS - 1, Math.max(0, (int) (z / CHUNK_SIZE)));
        return cz * CHUNKS + cx;
    }

    private static float clamp(float v, float min, float max) { return Math.max(min, Math.min(max, v)); }

    private static float round(float v) { return Math.round(v * 100f) / 100f; }
}
