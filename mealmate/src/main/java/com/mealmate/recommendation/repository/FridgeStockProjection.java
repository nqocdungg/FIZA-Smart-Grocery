package com.mealmate.recommendation.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface FridgeStockProjection {

    Long getFoodId();

    String getFoodName();

    BigDecimal getAvailableQuantity();

    String getUnit();

    LocalDate getNearestExpiryDate();
}
