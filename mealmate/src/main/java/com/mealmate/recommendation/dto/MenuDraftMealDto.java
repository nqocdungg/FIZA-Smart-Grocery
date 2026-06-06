package com.mealmate.recommendation.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MenuDraftMealDto {
    private String mealType;
    private RecipeRecommendationResponse recommendation;
}
