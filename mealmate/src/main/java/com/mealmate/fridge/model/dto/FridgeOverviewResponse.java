package com.mealmate.fridge.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FridgeOverviewResponse {

    private long totalStored;

    private long expiredCount;

    private long expiringSoonCount;

    private long almostOutCount;

    private String status;
}
