package com.mealmate.shopping.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface ShoppingImportCandidateProjection {

    Long getShoppingListItemId();

    Long getShoppingListId();

    LocalDate getPlannedDate();

    Long getFoodId();

    String getFoodName();

    String getCustomName();

    Long getCategoryId();

    String getCategoryName();

    String getCategoryIconKey();

    String getCategoryColorCode();

    BigDecimal getQuantity();

    String getUnit();

    String getNote();
}
