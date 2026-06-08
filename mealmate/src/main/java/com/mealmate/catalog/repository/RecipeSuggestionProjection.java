package com.mealmate.catalog.repository;

import java.math.BigDecimal;

public interface RecipeSuggestionProjection {

    Long getRecipeId();

    String getRecipeName();

    String getImageUrl();

    String getInstructions();

    String getDescription();

    String getReferenceLink();

    String getAuthor();

    Integer getCookingTimeMinutes();

    Integer getServings();

    Integer getCalories();

    String getDifficulty();

    String getPreferredMealTime();

    Long getFoodId();

    String getFoodName();

    BigDecimal getRequiredQuantity();

    String getRequiredUnit();
}
