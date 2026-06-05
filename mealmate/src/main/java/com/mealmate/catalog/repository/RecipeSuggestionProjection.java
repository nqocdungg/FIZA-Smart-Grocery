package com.mealmate.catalog.repository;

import java.math.BigDecimal;

public interface RecipeSuggestionProjection {

    Long getRecipeId();

    String getRecipeName();

    String getImageUrl();

    String getInstructions();

    String getPreferredMealTime();

    Long getFoodId();

    String getFoodName();

    BigDecimal getRequiredQuantity();

    String getRequiredUnit();
}
