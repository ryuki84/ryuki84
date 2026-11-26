package com.driftwood.server.game;

public enum ResourceType {
    TREE("tree", "wood", 5),
    ROCK("rock", "stone", 4),
    BUSH("bush", "berry", 3);

    public final String kind;
    public final String item;
    public final int maxAmount;

    ResourceType(String kind, String item, int maxAmount) {
        this.kind = kind;
        this.item = item;
        this.maxAmount = maxAmount;
    }
}
