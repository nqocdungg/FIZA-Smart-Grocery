package com.mealmate.fridge.model;

public final class RemoveReason {

    private RemoveReason() {
    }

    public static final String USED_UP = "USED_UP";
    public static final String EXPIRED_DISCARDED = "EXPIRED_DISCARDED";
    public static final String SPOILED = "SPOILED";
    public static final String WRONG_INFO = "WRONG_INFO";
    public static final String OTHER = "OTHER";
}