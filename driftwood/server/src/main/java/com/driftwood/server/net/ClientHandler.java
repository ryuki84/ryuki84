package com.driftwood.server.net;

import com.driftwood.server.game.World;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

/**
 * Netty I/O 스레드에서 실행된다. 게임 상태는 직접 건드리지 않고
 * 파싱한 메시지를 World 의 수신함(큐)에 넣기만 한다 → 게임 로직은 단일 스레드.
 */
public final class ClientHandler extends SimpleChannelInboundHandler<String> {
    private final World world;
    private final ObjectMapper json;
    private Session session;

    public ClientHandler(World world, ObjectMapper json) {
        this.world = world;
        this.json = json;
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        session = new Session(ctx.channel(), json);
        world.enqueue(new World.Connected(session));
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String line) {
        if (line.isBlank()) return;
        JsonNode node;
        try {
            node = json.readTree(line);
        } catch (Exception e) {
            return; // 잘못된 JSON 은 무시
        }
        if (node != null && node.hasNonNull("t")) {
            world.enqueue(new World.Received(session, node));
        }
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        if (session != null) world.enqueue(new World.Disconnected(session));
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}
