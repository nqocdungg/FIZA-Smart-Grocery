package com.mealmate.fridge.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public interface FridgeItemProjection {

    Long getId();

    Long getFamilyId();

    Long getFoodId();

    String getStandardFoodName();

    String getDisplayName();

    BigDecimal getQuantity();

    String getStorageLocation();

    String getSpecificLocation();

    LocalDate getAddedDate();

    LocalDate getExpiryDate();

    String getStatus();

    String getImageUrl();

    String getNote();

    String getRemovedReason();

    String getRemovedReasonNote();

    LocalDateTime getRemovedAt();

    Long getRemovedBy();

    LocalDateTime getCreatedAt();

    LocalDateTime getUpdatedAt();
}