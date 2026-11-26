package com.driftwood.server;

import com.driftwood.server.game.World;
import com.driftwood.server.net.ClientHandler;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.LineBasedFrameDecoder;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import io.netty.handler.timeout.ReadTimeoutHandler;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

/**
 * 게임 서버 진입점.
 * 프로토콜: TCP, UTF-8, 한 줄에 JSON 메시지 하나.
 */
public final class GameServer {
    private static final Logger LOG = Logger.getLogger(GameServer.class.getName());

    private final int requestedPort;
    private final World world;
    private final ObjectMapper json = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
    private EventLoopGroup boss;
    private EventLoopGroup workers;
    private ScheduledExecutorService loop;
    private Channel serverChannel;

    public GameServer(int port, long seed) {
        this.requestedPort = port;
        this.world = new World(seed);
    }

    public void start() throws InterruptedException {
        boss = new NioEventLoopGroup(1);
        workers = new NioEventLoopGroup();
        serverChannel = new ServerBootstrap()
                .group(boss, workers)
                .channel(NioServerSocketChannel.class)
                .childOption(ChannelOption.TCP_NODELAY, true)
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel ch) {
                        ch.pipeline()
                                .addLast(new ReadTimeoutHandler(120))     // 2분간 아무것도 안 오면 끊기
                                .addLast(new LineBasedFrameDecoder(8 * 1024))
                                .addLast(new StringDecoder(StandardCharsets.UTF_8))
                                .addLast(new StringEncoder(StandardCharsets.UTF_8))
                                .addLast(new ClientHandler(world, json));
                    }
                })
                .bind(requestedPort).sync().channel();

        loop = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "game-loop");
            t.setDaemon(true);
            return t;
        });
        long period = 1000L / World.TICK_RATE;
        loop.scheduleAtFixedRate(world::tickSafely, 0, period, TimeUnit.MILLISECONDS);
        LOG.info("Driftwood server listening on port " + port() + " (" + World.TICK_RATE + " ticks/s)");
    }

    public int port() {
        return ((InetSocketAddress) serverChannel.localAddress()).getPort();
    }

    public World world() { return world; }

    public void stop() {
        if (loop != null) loop.shutdownNow();
        if (serverChannel != null) serverChannel.close().syncUninterruptibly();
        if (workers != null) workers.shutdownGracefully();
        if (boss != null) boss.shutdownGracefully();
    }

    public static void main(String[] args) throws InterruptedException {
        int port = Integer.parseInt(envOr("DRIFTWOOD_PORT", args.length > 0 ? args[0] : "7777"));
        long seed = Long.parseLong(envOr("DRIFTWOOD_SEED", args.length > 1 ? args[1] : "20261126"));
        GameServer server = new GameServer(port, seed);
        server.start();
        Runtime.getRuntime().addShutdownHook(new Thread(server::stop));
        server.serverChannel.closeFuture().sync();
    }

    private static String envOr(String key, String fallback) {
        String v = System.getenv(key);
        return v == null || v.isBlank() ? fallback : v;
    }
}
