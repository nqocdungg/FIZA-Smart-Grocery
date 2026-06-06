package com.mealmate.recommendation.repository;

import java.math.BigDecimal;

public interface RecipeIngredientNeedProjection {

    Long getRecipeId();

    Long getFoodId();

    String getFoodName();

    BigDecimal getRequiredQuantity();

    String getUnit();
}
