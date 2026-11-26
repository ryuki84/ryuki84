package com.driftwood.server.net;

import com.driftwood.server.game.Player;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.Channel;

/** 하나의 TCP 연결. player 필드는 게임 루프 스레드에서만 읽고 쓴다. */
public final class Session {
    private final Channel channel;
    private final ObjectMapper json;
    private Player player;

    public Session(Channel channel, ObjectMapper json) {
        this.channel = channel;
        this.json = json;
    }

    public Player player() { return player; }

    public void attach(Player player) { this.player = player; }

    /** 버퍼에 쓰기만 하고, 실제 전송은 틱 끝의 flush()에서 한 번에 한다. */
    public void send(Object message) {
        if (!channel.isActive()) return;
        try {
            channel.write(json.writeValueAsString(message) + "\n");
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    public void flush() {
        if (channel.isActive()) channel.flush();
    }

    public void close() { channel.close(); }
}
