package com.mealmate.recommendation.repository;

import java.time.LocalDate;

public interface MenuPlanItemProjection {
    LocalDate getMealDate();

    String getMealType();

    Long getMealItemId();

    Long getRecipeId();

    String getRecipeName();

    String getImageUrl();

    String getStatus();
}
