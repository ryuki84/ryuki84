package com.driftwood.server.game;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 시드 기반 절차적 월드 생성. 같은 시드면 항상 같은 섬이 나온다.
 * 두 개의 저주파 노이즈(숲 밀도, 암석 밀도)로 지역 특색을 만든다.
 */
final class WorldGenerator {
    private static final float CELL = 4f;           // 4x4 유닛마다 자원 하나를 놓을지 결정
    private static final float SPAWN_CLEAR_RADIUS = 6f;

    private final long seed;

    WorldGenerator(long seed) { this.seed = seed; }

    interface IdSource { int next(); }

    List<ResourceNode> generate(float worldSize, IdSource ids) {
        Random rnd = new Random(seed);
        List<ResourceNode> nodes = new ArrayList<>();
        float center = worldSize / 2f;
        int cells = (int) (worldSize / CELL);

        for (int cz = 0; cz < cells; cz++) {
            for (int cx = 0; cx < cells; cx++) {
                float x = (cx + 0.15f + rnd.nextFloat() * 0.7f) * CELL;
                float z = (cz + 0.15f + rnd.nextFloat() * 0.7f) * CELL;
                if (Math.hypot(x - center, z - center) < SPAWN_CLEAR_RADIUS) continue;

                float forest = valueNoise(x / 48f, z / 48f, 1);
                float stone = valueNoise(x / 36f, z / 36f, 2);
                float roll = rnd.nextFloat();

                ResourceType type = null;
                if (roll < forest * forest * 0.55f) type = ResourceType.TREE;
                else if (roll < forest * forest * 0.55f + stone * stone * stone * 0.25f) type = ResourceType.ROCK;
                else if (roll < forest * forest * 0.55f + stone * stone * stone * 0.25f + 0.03f) type = ResourceType.BUSH;

                if (type != null) nodes.add(new ResourceNode(ids.next(), type, x, z));
            }
        }
        return nodes;
    }

    /** 0..1 범위의 부드러운 2D value noise. */
    private float valueNoise(float x, float z, int channel) {
        int x0 = (int) Math.floor(x), z0 = (int) Math.floor(z);
        float fx = smooth(x - x0), fz = smooth(z - z0);
        float a = hash(x0, z0, channel), b = hash(x0 + 1, z0, channel);
        float c = hash(x0, z0 + 1, channel), d = hash(x0 + 1, z0 + 1, channel);
        return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
    }

    private float hash(int x, int z, int channel) {
        long h = seed * 0x9E3779B97F4A7C15L + x * 0xC2B2AE3D27D4EB4FL + z * 0x165667B19E3779F9L + channel * 0x27D4EB2F165667C5L;
        h ^= (h >>> 33);
        h *= 0xFF51AFD7ED558CCDL;
        h ^= (h >>> 33);
        return (h >>> 40) / (float) (1L << 24);
    }

    private static float smooth(float t) { return t * t * (3 - 2 * t); }

    private static float lerp(float a, float b, float t) { return a + (b - a) * t; }
}
