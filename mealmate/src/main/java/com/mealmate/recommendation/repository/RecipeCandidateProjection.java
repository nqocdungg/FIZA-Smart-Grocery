package com.mealmate.recommendation.repository;

public interface RecipeCandidateProjection {

    Long getRecipeId();

    String getRecipeName();

    String getImageUrl();

    String getPreferredMealTime();

    String getDifficulty();
}
