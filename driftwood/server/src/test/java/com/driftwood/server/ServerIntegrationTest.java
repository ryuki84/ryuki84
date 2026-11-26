package com.driftwood.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.function.Predicate;

import static org.junit.jupiter.api.Assertions.*;

/** 실제 TCP 로 접속해서 Unity 클라이언트와 같은 방식으로 서버를 검증한다. */
class ServerIntegrationTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private GameServer server;

    @BeforeEach
    void start() throws Exception {
        server = new GameServer(0, 42L);
        server.start();
    }

    @AfterEach
    void stop() {
        server.stop();
    }

    @Test
    void twoPlayersSeeEachOtherAndMovementIsBroadcast() throws Exception {
        try (TestClient a = new TestClient(server.port()); TestClient b = new TestClient(server.port())) {
            JsonNode welcomeA = a.login("alice");
            JsonNode welcomeB = b.login("bob");
            int idA = welcomeA.get("id").asInt();
            int idB = welcomeB.get("id").asInt();

            a.await(m -> type(m, "spawn") && m.get("id").asInt() == idB && m.get("name").asText().equals("bob"));
            b.await(m -> type(m, "spawn") && m.get("id").asInt() == idA);

            a.send(Map.of("t", "input", "dx", 1, "dz", 0));
            JsonNode state = b.await(m -> type(m, "state") && containsId(m, idA));
            assertTrue(state.get("e").size() >= 1);

            // 연결 종료 → 상대에게 despawn
            a.close();
            b.await(m -> type(m, "despawn") && m.get("id").asInt() == idA);
        }
    }

    @Test
    void playerCanWalkToResourceAndGatherIt() throws Exception {
        try (TestClient c = new TestClient(server.port())) {
            JsonNode welcome = c.login("gatherer");
            int me = welcome.get("id").asInt();
            float x = (float) welcome.get("x").asDouble(), z = (float) welcome.get("z").asDouble();

            // 시야 안의 자원 노드 중 가장 가까운 것 찾기
            c.await(m -> type(m, "spawn") && !m.get("kind").asText().equals("player"));
            Thread.sleep(200);
            JsonNode target = null;
            double best = Double.MAX_VALUE;
            for (JsonNode m : c.seen) {
                if (!type(m, "spawn") || m.get("kind").asText().equals("player")) continue;
                double d = Math.hypot(m.get("x").asDouble() - x, m.get("z").asDouble() - z);
                if (d < best) { best = d; target = m; }
            }
            assertNotNull(target, "spawn 주변에 자원이 있어야 함");
            float tx = (float) target.get("x").asDouble(), tz = (float) target.get("z").asDouble();

            // 목표까지 걸어가기 (서버가 보내는 내 위치를 따라가며 방향 보정)
            long deadline = System.currentTimeMillis() + 10_000;
            while (Math.hypot(tx - x, tz - z) > 1.5) {
                assertTrue(System.currentTimeMillis() < deadline, "도착 시간 초과");
                double len = Math.hypot(tx - x, tz - z);
                c.send(Map.of("t", "input", "dx", (tx - x) / len, "dz", (tz - z) / len));
                JsonNode s = c.await(m -> type(m, "state") && containsId(m, me));
                for (JsonNode e : s.get("e")) {
                    if (e.get("id").asInt() == me) { x = (float) e.get("x").asDouble(); z = (float) e.get("z").asDouble(); }
                }
            }
            c.send(Map.of("t", "input", "dx", 0, "dz", 0));

            int nodeId = target.get("id").asInt();
            int before = target.get("amount").asInt();
            c.send(Map.of("t", "gather", "id", nodeId));

            JsonNode inv = c.await(m -> type(m, "inv") && m.get("items").size() == 1);
            assertEquals(1, inv.get("items").get(0).get("count").asInt());
            JsonNode node = c.await(m -> type(m, "node") && m.get("id").asInt() == nodeId);
            assertEquals(before - 1, node.get("amount").asInt());
        }
    }

    @Test
    void gatheringFromTooFarIsRejected() throws Exception {
        try (TestClient c = new TestClient(server.port())) {
            JsonNode w = c.login("faraway");
            double x = w.get("x").asDouble(), z = w.get("z").asDouble();
            JsonNode far = c.await(m -> type(m, "spawn") && !m.get("kind").asText().equals("player")
                    && Math.hypot(m.get("x").asDouble() - x, m.get("z").asDouble() - z) > 10);
            c.send(Map.of("t", "gather", "id", far.get("id").asInt()));
            c.await(m -> type(m, "notice") && m.get("text").asText().contains("멀어요"));
        }
    }

    // ------------------------------------------------------------------ helpers

    private static boolean type(JsonNode m, String t) { return m.path("t").asText().equals(t); }

    private static boolean containsId(JsonNode state, int id) {
        for (JsonNode e : state.get("e")) if (e.get("id").asInt() == id) return true;
        return false;
    }

    static final class TestClient implements Closeable {
        final Socket socket;
        final Writer out;
        final BlockingQueue<JsonNode> inbox = new LinkedBlockingQueue<>();
        final java.util.List<JsonNode> seen = java.util.Collections.synchronizedList(new java.util.ArrayList<>());

        TestClient(int port) throws IOException {
            socket = new Socket("127.0.0.1", port);
            out = new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8);
            Thread reader = new Thread(() -> {
                try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = in.readLine()) != null) {
                        JsonNode n = JSON.readTree(line);
                        seen.add(n);
                        inbox.add(n);
                    }
                } catch (IOException ignored) {
                }
            });
            reader.setDaemon(true);
            reader.start();
        }

        JsonNode login(String name) throws Exception {
            send(new HashMap<>(Map.of("t", "login", "name", name)));
            return await(m -> type(m, "welcome"));
        }

        void send(Object msg) throws IOException {
            out.write(JSON.writeValueAsString(msg) + "\n");
            out.flush();
        }

        JsonNode await(Predicate<JsonNode> p) throws InterruptedException {
            long deadline = System.currentTimeMillis() + 5000;
            while (true) {
                long left = deadline - System.currentTimeMillis();
                JsonNode m = left > 0 ? inbox.poll(left, TimeUnit.MILLISECONDS) : null;
                if (m == null) fail("메시지를 기다리다 시간 초과");
                if (p.test(m)) return m;
            }
        }

        @Override
        public void close() throws IOException { socket.close(); }
    }
}
