package com.mealmate.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeRecommendationResponse {

    private Long recipeId;

    private String recipeName;

    private String imageUrl;

    private Integer score;

    private Integer matchPercent;

    private List<IngredientAvailabilityDto> availableIngredients;

    private List<MissingIngredientDto> missingIngredients;

    private List<String> reasons;
}
