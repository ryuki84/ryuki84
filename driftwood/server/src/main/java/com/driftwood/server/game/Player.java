package com.driftwood.server.game;

import com.driftwood.server.net.Session;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public final class Player {
    public final int id;
    public final String name;
    final Session session;

    float x, z;
    /** 클라이언트가 보낸 이동 방향(정규화됨). 서버가 이 방향으로 매 틱 이동시킨다. */
    float dx, dz;
    boolean moved;
    int chunkIndex = -1;

    /** 이 플레이어 클라이언트가 현재 알고 있는(spawn 을 받은) 엔티티들. */
    final Set<Integer> knownPlayers = new HashSet<>();
    final Set<Integer> knownNodes = new HashSet<>();
    /** knownNodes 를 계산한 기준 청크. 청크가 바뀔 때만 노드 시야를 다시 계산한다. */
    int nodeViewChunk = -1;

    final Map<String, Integer> inventory = new LinkedHashMap<>();
    long lastGatherAt;

    Player(int id, String name, Session session, float x, float z) {
        this.id = id;
        this.name = name;
        this.session = session;
        this.x = x;
        this.z = z;
    }
}
