package com.driftwood.server.game;

public final class ResourceNode {
    public final int id;
    public final ResourceType type;
    public final float x, z;
    int amount;
    long respawnAt;

    ResourceNode(int id, ResourceType type, float x, float z) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.z = z;
        this.amount = type.maxAmount;
    }

    public int amount() { return amount; }
}
