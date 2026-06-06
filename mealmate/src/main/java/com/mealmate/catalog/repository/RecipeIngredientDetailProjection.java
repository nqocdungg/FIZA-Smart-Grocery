package com.mealmate.catalog.repository;

public interface RecipeIngredientDetailProjection {

    Long getFoodId();

    String getFoodName();

    Double getQuantity();

    String getUnit();
}
