package com.mealmate.recommendation.repository;

import java.time.LocalDate;

public interface RecentRecipeProjection {

    Long getRecipeId();

    LocalDate getLatestMealDate();
}
